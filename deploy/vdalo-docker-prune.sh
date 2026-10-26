#!/usr/bin/env bash
# ponytail: чистка Docker: образи vdalo/site і кеш збірки старші за N днів.
#
# Чому окремий скрипт: `docker image prune` без -a чіпає лише образи БЕЗ тегів, а наші образи
# мають теги vdalo/site:<гілка>-<sha>, тож самі по собі вони не чистяться ніколи.
#
# Завжди лишаються (навіть якщо старші за N днів):
#   - рухомі теги vdalo/site:main і vdalo/site:staging (поточні версії);
#   - образи last-ok кожної гілки (/var/lib/vdalo/last-ok-<branch>) – ціль відкату;
#   - образ будь-якого контейнера, навіть зупиненого;
#   - усе, що молодше за VDALO_PRUNE_MIN_AGE_HOURS (2 год): так чистка не зачепить збірку, що йде зараз.
# Образи інших репозиторіїв (node, alpine...) не чіпаємо; висячі образи й кеш збірки чистимо за віком.
#
# Використання:
#   vdalo-docker-prune [--days N] [--dry-run | --ask]
#     --days N   вік у днях (за замовчуванням $VDALO_PRUNE_DAYS або 3; 0 = усе, що не під захистом)
#     --dry-run  лише показати план, нічого не видаляти
#     --ask      показати план і видаляти тільки після відповіді "y" (потрібен термінал)
#   Без прапорців (нічний таймер) – показує план у журналі й одразу чистить.
#
# Для автотестів: VDALO_STATE_DIR; VDALO_TEST_ASK_STDIN=1 дозволяє відповідь на --ask зі stdin без термінала.
set -euo pipefail
export LC_ALL=C.UTF-8

STATE="${VDALO_STATE_DIR:-/var/lib/vdalo}"
DAYS="${VDALO_PRUNE_DAYS:-3}"
MIN_AGE_HOURS="${VDALO_PRUNE_MIN_AGE_HOURS:-2}"
MODE=apply

usage() {
  echo "usage: vdalo-docker-prune [--days N] [--dry-run | --ask]"
  echo "  --days N   age in days (default \$VDALO_PRUNE_DAYS or 3; 0 = everything not protected)"
  echo "  --dry-run  show the plan only, delete nothing"
  echo "  --ask      show the plan, delete only after you answer y (needs a terminal)"
}

while (( $# )); do
  case "$1" in
    --days)    [[ $# -ge 2 ]] || { echo "--days needs a value" >&2; exit 2; }; DAYS="$2"; shift 2 ;;
    --dry-run) MODE=dry; shift ;;
    --ask)     MODE=ask; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "unknown argument: $1" >&2; usage >&2; exit 2 ;;
  esac
done
[[ "$DAYS" =~ ^[0-9]+$ ]] || { echo "--days must be a non-negative integer" >&2; exit 2; }
[[ "$MIN_AGE_HOURS" =~ ^[0-9]+$ ]] || { echo "VDALO_PRUNE_MIN_AGE_HOURS must be an integer" >&2; exit 2; }

HOURS=$(( DAYS * 24 ))
(( HOURS >= MIN_AGE_HOURS )) || HOURS=$MIN_AGE_HOURS
CUTOFF=$(( $(date +%s) - HOURS * 3600 ))

disk_pct() { df -P / | awk 'NR==2{print $5}'; }

# ---------- що лишається ----------
declare -A KEEP_REF=()   # тег -> чому лишаємо
declare -A KEEP_ID=()    # id образу -> чому лишаємо
keep_ref() { KEEP_REF["$1"]="$2"; }

keep_ref vdalo/site:main    "moving tag (current main)"
keep_ref vdalo/site:staging "moving tag (current staging)"
have_last_ok=0
for b in main staging; do
  f="$STATE/last-ok-$b"
  if [[ -s "$f" ]]; then
    keep_ref "vdalo/site:$b-$(<"$f")" "last-ok $b (rollback target)"
    have_last_ok=1
  fi
done

# Образи контейнерів (також зупинених): їх не прибираємо, що б не казав вік.
while read -r name img; do
  [[ -n "${img:-}" ]] && KEEP_ID["$img"]="used by container ${name#/}"
done < <(docker inspect -f '{{.Name}} {{.Image}}' $(docker ps -aq) 2>/dev/null || true)

# ---------- що є ----------
REMOVE_REFS=()
declare -a PLAN_LINES=()
images_enabled=1
if (( ! have_last_ok )); then
  images_enabled=0
fi

# Той самий образ під іншим тегом, ніж захищений, теж захищений (id).
for r in "${!KEEP_REF[@]}"; do
  rid=$(docker image inspect -f '{{.Id}}' "$r" 2>/dev/null || true)
  [[ -n "$rid" ]] && KEEP_ID["$rid"]="same image as ${r#vdalo/site:}"
done

while read -r ref id size; do
  [[ -n "${ref:-}" && "$ref" != *"<none>"* ]] || continue
  created=$(docker image inspect -f '{{.Created}}' "$ref" 2>/dev/null || true)
  created_ts=$(date -u -d "$created" +%s 2>/dev/null || echo 0)
  created_h=$(date -u -d "@$created_ts" '+%F %H:%M' 2>/dev/null || echo "?")
  if [[ -n "${KEEP_REF[$ref]:-}" ]]; then
    PLAN_LINES+=("KEEP    $ref  ${KEEP_REF[$ref]}, $size")
  elif [[ -n "${KEEP_ID[$id]:-}" ]]; then
    PLAN_LINES+=("KEEP    $ref  ${KEEP_ID[$id]}, $size")
  elif (( ! images_enabled )); then
    PLAN_LINES+=("KEEP    $ref  no last-ok state in $STATE, images are not touched, $size")
  elif (( created_ts == 0 )); then
    # Вік невідомий: безпечніше залишити, ніж видалити за хибним «найстаріший».
    PLAN_LINES+=("KEEP    $ref  age unknown, $size")
  elif (( created_ts > CUTOFF )); then
    PLAN_LINES+=("KEEP    $ref  younger than ${HOURS}h (created $created_h UTC), $size")
  else
    PLAN_LINES+=("REMOVE  $ref  created $created_h UTC, $size")
    REMOVE_REFS+=("$ref")
  fi
done < <(docker image ls --no-trunc --format '{{.Repository}}:{{.Tag}} {{.ID}} {{.Size}}' vdalo/site 2>/dev/null || true)

dangling=$(docker image ls -f dangling=true -q 2>/dev/null | wc -l | tr -d ' ')

# ---------- план ----------
echo "== vdalo docker prune: older than ${HOURS}h (--days $DAYS, floor ${MIN_AGE_HOURS}h), mode: $MODE =="
echo "disk before: $(disk_pct) used"
if (( ${#PLAN_LINES[@]} )); then
  printf '%s\n' "${PLAN_LINES[@]}"
else
  echo "no vdalo/site images found"
fi
echo "dangling images (no tag) older than ${HOURS}h: will run 'docker image prune --filter until=${HOURS}h' ($dangling dangling now)"
echo "build cache: will run 'docker buildx prune --filter until=${HOURS}h' (unused cache only)"
echo "will remove ${#REMOVE_REFS[@]} tagged image(s)"
echo "-- docker system df (before) --"
docker system df 2>/dev/null || true

case "$MODE" in
  dry)
    echo "dry-run: nothing was deleted"
    exit 0
    ;;
  ask)
    if [[ ! -t 0 && -z "${VDALO_TEST_ASK_STDIN:-}" ]]; then
      echo "--ask needs a terminal (run it in an interactive ssh session); nothing was deleted" >&2
      exit 3
    fi
    read -r -p "Delete the above? [y/N] " answer
    if [[ ! "$answer" =~ ^[yY]([eE][sS])?$ ]]; then
      echo "cancelled, nothing was deleted"
      exit 0
    fi
    ;;
esac

# ---------- чистка ----------
for ref in "${REMOVE_REFS[@]}"; do
  # Без -f: docker не видалить образ, яким користується контейнер.
  if out=$(docker image rm "$ref" 2>&1); then
    echo "removed $ref"
  else
    echo "kept $ref: $out"
  fi
done
docker image prune --force --filter "until=${HOURS}h"
docker buildx prune --force --filter "until=${HOURS}h"

echo "-- docker system df (after) --"
docker system df 2>/dev/null || true
echo "disk after: $(disk_pct) used"
