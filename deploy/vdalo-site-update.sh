#!/usr/bin/env bash
# ponytail: щохвилини перевіряє main/staging; за новим SHA — build у builds.slice,
# прогонить тести, валідацію схеми, оновлює контейнер, smoke. За помилки — відкат на
# last-ok і тривога. Рухомий тег vdalo/site:main (і :staging) ставиться лише ПІСЛЯ
# зеленого smoke, щоб ручний `docker compose up` без змінних не підняв неперевірений образ.
#
# Стан у /var/lib/vdalo:
#   last-seen-<branch>  — SHA, який уже бачили (включно з тихими скіпами)
#   last-ok-<branch>    — SHA, образ якого реально пройшов smoke (ціль відкату)
#
# Тривога DEPLOY-FAIL називає червоний крок (docker build / tests / validate-schema /
# compose up / smoke), для тестів – назву з файл:рядок і помилку, плюс хвіст виводу (~30 рядків).
# Той самий текст пишеться в update.log. Форматування, фільтр секретів і ліміт Telegram –
# у vdalo-alerts (підкоманда failure-report), щоб логіка була в одному місці.
# DEPLOY-OK короткий: <гілка>@<sha7> PR #N live.
# Невдала збірка прибирає за собою свій образ vdalo/site:<гілка>-<sha> (крім last-ok).
#
# Test hooks (не ставляться у звичайних запусках, тільки для ручної перевірки):
#   VDALO_TEST_FORCE_SHA=<sha>          — замість `git rev-parse origin/<branch>` взяти цей SHA
#   VDALO_TEST_FORCE_SMOKE_EXIT=<rc>    — перевизначити exit code vdalo-smoke.sh
#   VDALO_TEST_FORCE_COMPOSE_TAG=<tag>  — у compose up підсунути цей тег замість <image_tag>-<new>
# Для автотестів (deploy/tests) шляхи перевизначаються:
#   VDALO_OPT_DIR (/opt/vdalo), VDALO_STATE_DIR (/var/lib/vdalo),
#   VDALO_LOG (/var/log/vdalo/update.log), VDALO_ALERT_BIN (/usr/local/sbin/vdalo-alerts)
set -euo pipefail

OPT="${VDALO_OPT_DIR:-/opt/vdalo}"
REPO="$OPT/repo"
RELEASES="$OPT/releases"
DEPLOY_DIR="$OPT/deploy"
STATE="${VDALO_STATE_DIR:-/var/lib/vdalo}"
LOG="${VDALO_LOG:-/var/log/vdalo/update.log}"
ALERT="${VDALO_ALERT_BIN:-/usr/local/sbin/vdalo-alerts}"
install -d "$STATE" "$(dirname "$LOG")"

exec >>"$LOG" 2>&1
echo "---- $(date -u +%FT%TZ) check ----"

[[ -d "$REPO/.git" ]] || { echo "repo missing at $REPO"; exit 0; }

# Тимчасові логи кроків цього запуску (вивід збірки, compose, smoke). Старі, від обірваних запусків, чистимо.
find "$STATE" -maxdepth 1 -type d -name 'run.*' -mtime +0 -exec rm -rf {} + 2>/dev/null || true
RUN_TMP=$(mktemp -d "$STATE/run.XXXXXX")
trap 'rm -rf "$RUN_TMP"' EXIT

# Git ops run as deploy (repo and worktrees are deploy-owned). Build/docker
# commands stay as root for systemd-run / builds.slice.
GIT_AS_DEPLOY=(sudo -u deploy -H git -C "$REPO")

# One-time migration from v1 state file.
for b in main staging; do
  if [[ -f "$STATE/last-$b" && ! -f "$STATE/last-seen-$b" ]]; then
    cp "$STATE/last-$b" "$STATE/last-seen-$b"
  fi
done

container_health() {
  docker inspect "$1" --format '{{.State.Health.Status}}' 2>/dev/null || echo "not-found"
}

short_sha() { printf '%.7s' "$1"; }

# Номер PR із теми коміта на кінчику гілки: "Merge pull request #105 ..." або "... (#105)".
# Порожньо, якщо номера нема (тоді його просто не показуємо).
pr_label() {
  local subject
  subject=$("${GIT_AS_DEPLOY[@]}" log -1 --format=%s "$1" 2>/dev/null || true)
  if [[ "$subject" =~ ^Merge\ pull\ request\ \#([0-9]+) || "$subject" =~ \(\#([0-9]+)\)$ ]]; then
    printf 'PR #%s' "${BASH_REMATCH[1]}"
  fi
}

# Крок, на якому впала збірка: останній маркер ##VDALO-STEP у виводі.
failed_step() {
  local step
  step=$(sed -n 's/^##VDALO-STEP //p' "$1" 2>/dev/null | tail -n 1 || true)
  printf '%s' "${step:-build did not start}"
}

# Текст про збій від vdalo-alerts (крок, назви тестів, хвіст виводу; секрети вже вичищені).
# Якщо встановлена стара vdalo-alerts без failure-report, вивід НЕ показуємо взагалі.
failure_text() {  # крок, файл з виводом, заголовок
  "$ALERT" failure-report "$@" 2>/dev/null \
    || printf '%s\nstep: %s\n(details withheld: install the matching /usr/local/sbin/vdalo-alerts)' "$3" "$1"
}

# Пише текст збою в update.log і шле тривогу DEPLOY-FAIL.
report_failure() {  # крок, файл з виводом, заголовок
  local report
  report=$(failure_text "$@")
  echo "$report"
  "$ALERT" deploy-failed "$report"
}

# Виконує команду; її вивід іде і в update.log, і у файл (з нього беремо хвіст для тривоги).
run_logged() {
  local out="$1" rc=0; shift
  "$@" >"$out" 2>&1 || rc=$?
  cat "$out"
  return "$rc"
}

compose_up() {  # <ім'я змінної тегу> <тег> <сервіс>
  (cd "$OPT" && env "$1=$2" docker compose -f deploy/compose.yml up -d --no-deps --wait "$3")
}

# Невдала збірка прибирає за собою свій образ. SHA-теги не «висять», тож нічна чистка їх не бачила б.
# last-ok не чіпаємо; docker без -f не видалить образ, яким користується контейнер.
cleanup_failed_image() {  # гілка, image_tag, sha, last_ok
  local branch="$1" image_tag="$2" sha="$3" last_ok="$4"
  local ref="vdalo/site:${image_tag}-${sha}" out
  if [[ "$sha" == "$last_ok" ]]; then
    echo "[$branch] keeping $ref (it is last-ok)"
    return 0
  fi
  docker image inspect "$ref" >/dev/null 2>&1 || return 0
  if out=$(docker image rm "$ref" 2>&1); then
    echo "[$branch] removed failed image $ref"
  else
    echo "[$branch] could not remove failed image $ref: $out"
  fi
  return 0
}

rollback_to_last_ok() {
  local branch="$1" image_tag="$2" service="$3" last_ok="$4" container_name="$5" reason="$6"
  local step="$7" step_log="$8"
  local tag_name
  [[ "$branch" == "main" ]] && tag_name=SITE_TAG || tag_name=STAGING_TAG
  if [[ -z "$last_ok" ]]; then
    report_failure "$step" "$step_log" "$branch failed ($reason) and no last-ok to roll back to"
    return 1
  fi
  local rb_image="vdalo/site:${image_tag}-${last_ok}"
  local rb_short="${image_tag}-$(short_sha "$last_ok")"
  if ! docker image inspect "$rb_image" >/dev/null 2>&1; then
    report_failure "$step" "$step_log" "$branch failed ($reason); rollback image vdalo/site:$rb_short missing from host"
    return 1
  fi
  local rb_start; rb_start=$(date +%s)
  if ! (cd "$OPT" && env "${tag_name}=${image_tag}-${last_ok}" docker compose -f deploy/compose.yml up -d --no-deps --wait "$service"); then
    report_failure "$step" "$step_log" "$branch failed ($reason); rollback compose up to $rb_short also failed"
    return 1
  fi
  local rb_sec=$(( $(date +%s) - rb_start ))
  local health; health=$(container_health "$container_name")
  if [[ "$health" == "healthy" ]]; then
    report_failure "$step" "$step_log" "$branch failed ($reason); rolled back to $rb_short in ${rb_sec}s, healthy"
    # Keep moving tag pointing at the known-good image too.
    docker tag "$rb_image" "vdalo/site:${image_tag}" 2>/dev/null || true
    return 0
  fi
  report_failure "$step" "$step_log" "$branch failed ($reason); rollback to $rb_short finished in ${rb_sec}s but health=$health"
  return 1
}

run_update() {
  local branch="$1" image_tag="$2" service="$3"
  local last_seen_file="$STATE/last-seen-$branch"
  local last_ok_file="$STATE/last-ok-$branch"
  local container_name="vdalo-$service"
  local tag_name
  [[ "$branch" == "main" ]] && tag_name=SITE_TAG || tag_name=STAGING_TAG

  local new
  if [[ -n "${VDALO_TEST_FORCE_SHA:-}" ]]; then
    new="$VDALO_TEST_FORCE_SHA"
    echo "[$branch] VDALO_TEST_FORCE_SHA=$new (test override)"
  else
    "${GIT_AS_DEPLOY[@]}" fetch --quiet origin "$branch" || { echo "fetch $branch failed"; return 0; }
    new=$("${GIT_AS_DEPLOY[@]}" rev-parse "origin/$branch")
  fi
  local last_seen=""; [[ -f "$last_seen_file" ]] && last_seen=$(cat "$last_seen_file")
  local last_ok=""; [[ -f "$last_ok_file" ]] && last_ok=$(cat "$last_ok_file")
  if [[ "$new" == "$last_seen" ]]; then return 0; fi
  echo "[$branch] $last_seen -> $new (last-ok: ${last_ok:-none})"

  local wt="$RELEASES/$branch-$new"
  "${GIT_AS_DEPLOY[@]}" worktree remove --force "$wt" 2>/dev/null || rm -rf "$wt"
  "${GIT_AS_DEPLOY[@]}" worktree add --detach "$wt" "$new"

  # Pre-flight: deploy/ absent in this SHA.
  if [[ ! -f "$wt/deploy/Dockerfile" ]]; then
    if [[ -n "$last_ok" ]]; then
      "$ALERT" deploy-failed "deploy/Dockerfile missing in $branch@$new (regression — still running ${image_tag}-${last_ok})"
    else
      echo "no deploy/Dockerfile in $branch@$new; infra PR not merged yet, silent skip"
    fi
    echo "$new" >"$last_seen_file"
    "${GIT_AS_DEPLOY[@]}" worktree remove --force "$wt" 2>/dev/null || rm -rf "$wt"
    return 0
  fi

  local short pr
  short=$(short_sha "$new")
  pr=$(pr_label "$new")

  # Build + tests inside builds.slice. Only SHA-tag now; moving tag goes after smoke.
  # Tests run INSIDE the freshly built image so we don't need Node on the host.
  # Вивід збірки йде у файл (а не в journald): з нього беруться крок, назви тестів і хвіст для
  # тривоги. Маркери ##VDALO-STEP показують, який крок упав. Тести ганяємо spec-репортером:
  # його формат («✖ …», «test at файл:рядок») не залежить від версії Node і TTY.
  local image="vdalo/site:$image_tag-$new"
  local build_log="$RUN_TMP/build-$branch.log"
  if ! systemd-run --quiet --wait --slice=builds.slice --unit="vdalo-build-$branch-$$" \
        --working-directory="$wt" \
        /bin/sh -c "
          exec >'$build_log' 2>&1
          set -e
          echo '##VDALO-STEP docker build'
          docker build -f deploy/Dockerfile -t $image .
          echo '##VDALO-STEP tests'
          docker run --rm --network=none $image sh -c 'node --test --test-reporter=spec tests/*.test.mjs'
          echo '##VDALO-STEP validate-schema'
          docker run --rm --network=none $image node scripts/validate-schema.mjs
        "; then
    local failed; failed=$(failed_step "$build_log")
    echo "[$branch] build/test failed for $new (step: $failed)"
    report_failure "$failed" "$build_log" "build/test failed on $branch@$short${pr:+ ($pr)}"
    cleanup_failed_image "$branch" "$image_tag" "$new" "$last_ok"
    echo "$new" >"$last_seen_file"
    "${GIT_AS_DEPLOY[@]}" worktree remove --force "$wt" 2>/dev/null || rm -rf "$wt"
    return 1
  fi

  # Compose up (SHA-pinned; test hook can override the tag to force failure).
  local compose_tag="${image_tag}-${new}"
  [[ -n "${VDALO_TEST_FORCE_COMPOSE_TAG:-}" ]] && compose_tag="$VDALO_TEST_FORCE_COMPOSE_TAG"
  local step_log="$RUN_TMP/step-$branch.log"
  if ! run_logged "$step_log" compose_up "$tag_name" "$compose_tag" "$service"; then
    echo "[$branch] compose up failed (tag=$compose_tag)"
    rollback_to_last_ok "$branch" "$image_tag" "$service" "$last_ok" "$container_name" \
      "compose up on $short${pr:+, $pr}" "compose up" "$step_log"
    cleanup_failed_image "$branch" "$image_tag" "$new" "$last_ok"
    echo "$new" >"$last_seen_file"
    "${GIT_AS_DEPLOY[@]}" worktree remove --force "$wt" 2>/dev/null || rm -rf "$wt"
    return 1
  fi

  # Smoke.
  sleep 1
  local port=8080
  [[ "$service" == site-staging ]] && port=8081
  local smoke_rc=0
  run_logged "$step_log" "$DEPLOY_DIR/vdalo-smoke.sh" "http://127.0.0.1:$port" || smoke_rc=$?
  [[ -n "${VDALO_TEST_FORCE_SMOKE_EXIT:-}" ]] && smoke_rc="$VDALO_TEST_FORCE_SMOKE_EXIT"
  if [[ "$smoke_rc" -ne 0 ]]; then
    echo "[$branch] smoke failed (rc=$smoke_rc)"
    rollback_to_last_ok "$branch" "$image_tag" "$service" "$last_ok" "$container_name" \
      "smoke on $short${pr:+, $pr}" "smoke" "$step_log"
    cleanup_failed_image "$branch" "$image_tag" "$new" "$last_ok"
    echo "$new" >"$last_seen_file"
    "${GIT_AS_DEPLOY[@]}" worktree remove --force "$wt" 2>/dev/null || rm -rf "$wt"
    return 1
  fi

  # Green: promote moving tag, update state.
  docker tag "vdalo/site:${image_tag}-${new}" "vdalo/site:${image_tag}"
  echo "$new" >"$last_ok_file"
  echo "$new" >"$last_seen_file"
  "$ALERT" deploy-ok "$branch@$short${pr:+ $pr} live"
  (cd "$RELEASES" && ls -1dt "$branch"-* 2>/dev/null | tail -n +4 | xargs -r rm -rf)
}

run_update main    main    site        || true
run_update staging staging site-staging || true

echo "done"
