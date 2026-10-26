#!/usr/bin/env bash
# ponytail: Один скрипт на всі тривоги. Коли TG_* порожні — тихо логує у /var/log/vdalo/alerts.log.
#
# alerts.env: TG_BOT_TOKEN=<токен бота>, TG_CHAT_ID=<id> або список через кому: 111,222
# (одне значення працює як раніше). Збій доставки одному одержувачу не блокує інших.
# Кожне повідомлення проходить фільтр секретів і обрізається під ліміт Telegram (4096).
#
# Для автотестів (deploy/tests): VDALO_ALERTS_ENV, VDALO_STATE_DIR, VDALO_ALERTS_LOG.
set -euo pipefail
# Обрізання і підрахунок довжини мають рахувати символи, а не байти (Ukrainian, ✖).
export LC_ALL=C.UTF-8

ENV_FILE="${VDALO_ALERTS_ENV:-/etc/vdalo/alerts.env}"
STATE_DIR="${VDALO_STATE_DIR:-/var/lib/vdalo}"
LOG="${VDALO_ALERTS_LOG:-/var/log/vdalo/alerts.log}"
mkdir -p "$STATE_DIR" "$(dirname "$LOG")"

[[ -r "$ENV_FILE" ]] && . "$ENV_FILE" || true

# Telegram приймає до 4096 символів; 4000 лишає запас на префікс і службові символи.
TG_LIMIT=4000
# Скільки останніх рядків виводу додавати до звіту про збій.
REPORT_TAIL_LINES=30

# ---------- фільтр секретів і санітизація ----------

# Прибирає значення, схожі на секрети. Патерни навмисно широкі: краще зайве [REDACTED],
# ніж токен у Telegram чи в публічно читабельному update.log.
redact() {
  local s
  s=$(sed -E \
    -e 's/-----BEGIN [A-Z ]*PRIVATE KEY-----.*/[REDACTED private key]/' \
    -e 's/[0-9]{6,}:[A-Za-z0-9_-]{30,}/[REDACTED]/g' \
    -e 's/eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]*/[REDACTED]/g' \
    -e 's/\b(sk|rk|pk)-[A-Za-z0-9_-]{16,}/[REDACTED]/g' \
    -e 's/\bre_[A-Za-z0-9]{16,}/[REDACTED]/g' \
    -e 's/\b(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}/[REDACTED]/g' \
    -e 's/\bgithub_pat_[A-Za-z0-9_]{20,}/[REDACTED]/g' \
    -e 's/\bxox[abprs]-[A-Za-z0-9-]{10,}/[REDACTED]/g' \
    -e 's/\bAKIA[0-9A-Z]{16}\b/[REDACTED]/g' \
    -e 's#(://)[^/@[:space:]]+:[^/@[:space:]]+@#\1[REDACTED]@#g' \
    -e 's/(Bearer|Basic)[[:space:]]+[A-Za-z0-9._~+\/=-]{8,}/\1 [REDACTED]/gI' \
    -e 's/([A-Za-z0-9_.-]*(token|secret|passw(or)?d|passphrase|api[_-]?key|private[_-]?key|credential|authorization|webhook|signature)[A-Za-z0-9_.-]*)([[:space:]]*[=:][[:space:]]*)("[^"]*"|'"'"'[^'"'"']*'"'"'|[^[:space:],;&"'"'"']+)/\1\4[REDACTED]/gI')
  # Точне значення токена бота (на випадок нестандартного формату) прибираємо буквально.
  if [[ -n "${TG_BOT_TOKEN:-}" ]]; then
    s="${s//"$TG_BOT_TOKEN"/[REDACTED]}"
  fi
  printf '%s\n' "$s"
}

# Вхід: довільний вивід збірки/тестів. Вихід: чистий UTF-8 без ANSI і керівних символів, без секретів.
sanitize() {
  # iconv -c повертає 1, коли відкинув байти; для нас це норма (`|| true`).
  { if command -v iconv >/dev/null 2>&1; then iconv -c -f UTF-8 -t UTF-8 2>/dev/null || true; else cat; fi; } \
    | sed -E $'s#\x1b\\[[0-9;?]*[ -/]*[@-~]##g' \
    | tr -d '\000-\010\013\014\016-\037\177' \
    | redact
}

# Обрізає текст до $TG_LIMIT символів і позначає це.
clip() {
  local s="$1" mark=$'\n[...truncated]'
  if (( ${#s} > TG_LIMIT )); then
    s="${s:0:$((TG_LIMIT - ${#mark}))}$mark"
  fi
  printf '%s' "$s"
}

# ---------- звіт про збій збірки/розгортання ----------

# Із виводу `node --test` (spec-репортер) дістає перші невдалі тести:
#   ✖ назва / tests/файл.test.mjs:рядок / AssertionError ... (+ diff до 6 рядків)
failed_tests_summary() {
  awk '
    function loc(s) {
      if (!match(s, /tests\/[^: )]+:[0-9]+/)) return ""
      return substr(s, RSTART, RLENGTH)
    }
    function cut(s) { return length(s) > 300 ? substr(s, 1, 299) "…" : s }
    function flush() {
      if (!cur) return
      printf "✖ %s\n", name
      w = (where != "") ? where : decl
      if (w != "") printf "  %s\n", w
      for (i = 1; i <= nmsg; i++) printf "  %s\n", msg[i]
      shown++
    }
    BEGIN { max = 3 }
    /^✖ failing tests:/ { insec = 1; next }
    !insec { next }
    /^test at / {
      flush(); total++
      cur = (total <= max); name = ""; where = ""; nmsg = 0; instack = 0
      d = $0; sub(/^test at /, "", d); decl = loc(d); if (decl == "") decl = cut(d)
      next
    }
    !cur { next }
    /^✖ / && name == "" { name = $0; sub(/^✖ /, "", name); sub(/ \([0-9.]+m?s\)$/, "", name); next }
    /^ +at / {
      instack = 1
      if (where == "") { l = loc($0); if (l != "") where = l }
      next
    }
    instack { next }
    /^[ \t]*$/ { next }
    { if (nmsg < 6) { line = $0; sub(/^  /, "", line); msg[++nmsg] = cut(line) } }
    END {
      flush()
      if (total > max) printf "(+%d more failing tests)\n", total - max
    }
  '
}

# Запасний варіант, коли секції "failing tests" нема (падіння до репортера, інший формат).
failed_lines_fallback() {
  grep -E '^(✖|not ok )|Error' | awk '!seen[$0]++' | head -n 8 | cut -c1-300
}

# failure-report <крок> <файл з виводом> <заголовок>
# Друкує повідомлення, що вміщається в ліміт Telegram: заголовок, крок, для тестів – назви
# з файл:рядок і помилкою, далі хвіст виводу. Нічого не відправляє.
failure_report() {
  local step="$1" file="$2" headline="$3"
  local budget=$((TG_LIMIT - 60))   # 60 символів: префікс [VDALO/DEPLOY-FAIL] і запас
  local seg="" clean summary="" tail_lines=() line top body

  if [[ -r "$file" ]]; then
    # Оброблюваний вивід обмежуємо останніми 400 КБ: цього досить, а секрети чистимо лише в ньому.
    clean=$(tail -c 400000 "$file" | sanitize)
  else
    clean=""
  fi

  if [[ "$step" == "tests" && -n "$clean" ]]; then
    seg=$(printf '%s\n' "$clean" | awk '/^##VDALO-STEP /{buf=""; next} {buf = buf $0 "\n"} END{printf "%s", buf}')
    summary=$(printf '%s\n' "$seg" | failed_tests_summary)
    [[ -n "$summary" ]] || summary=$(printf '%s\n' "$seg" | failed_lines_fallback || true)
  fi

  top="$headline"$'\n'"step: $step"
  if [[ -n "$summary" ]]; then
    top+=$'\n'"failed tests:"$'\n'"$summary"
  fi
  if (( ${#top} > 1800 )); then
    top="${top:0:1799}…"
  fi

  mapfile -t tail_lines < <(printf '%s\n' "$clean" | grep -v '^##VDALO-STEP ' | tail -n "$REPORT_TAIL_LINES" || true)
  # Порожній вивід дає один порожній рядок – не вважаємо його хвостом.
  if (( ${#tail_lines[@]} == 1 )) && [[ -z "${tail_lines[0]}" ]]; then
    tail_lines=()
  fi

  # Рядки хвоста обрізаємо за шириною, а потім відкидаємо найстаріші, доки все не влізе в бюджет.
  local i n=${#tail_lines[@]}
  for ((i = 0; i < n; i++)); do
    line="${tail_lines[$i]}"
    (( ${#line} > 240 )) && tail_lines[$i]="${line:0:239}…"
  done
  local start=0
  while :; do
    body=$(printf '%s\n' "${tail_lines[@]:$start}")
    (( n - start == 0 )) && body="(no output captured)"
    (( ${#top} + ${#body} + 32 <= budget )) && break
    if (( start < n )); then start=$((start + 1)); else body="${body:0:200}"; break; fi
  done
  printf '%s\nlast %d lines:\n%s' "$top" "$(( n - start > 0 ? n - start : 0 ))" "$body"
}

# ---------- доставка ----------

# Список chat id по одному на рядок: через кому, пробіли ігноруються, повтори прибираються.
recipients() {
  local -a parts=()
  local -A seen=()
  local id
  IFS=',' read -r -a parts <<<"${TG_CHAT_ID:-}" || true
  for id in "${parts[@]}"; do
    id="${id//[[:space:]]/}"
    [[ -n "$id" && -z "${seen[$id]:-}" ]] || continue
    seen[$id]=1
    printf '%s\n' "$id"
  done
}

SEND_ERR=""
# send_one <chat_id> <text>: 0, якщо Telegram відповів ok. Причина (без токена) – у SEND_ERR.
send_one() {
  local chat="$1" text="$2" resp rc=0
  SEND_ERR=""
  resp=$(curl -sS -m 10 "https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage" \
    --data-urlencode "chat_id=${chat}" \
    --data-urlencode "text=${text}" 2>/dev/null) || rc=$?
  if (( rc != 0 )); then
    SEND_ERR="curl exit $rc"
    return 1
  fi
  if [[ "$resp" =~ \"ok\"[[:space:]]*:[[:space:]]*true ]]; then
    return 0
  fi
  SEND_ERR=$(printf '%s' "$resp" | sed -n 's/.*"description":"\([^"]*\)".*/\1/p' | head -c 200 | redact)
  [[ -n "$SEND_ERR" ]] || SEND_ERR="unexpected Telegram response"
  return 1
}

NOTIFY_FAILED=0
# notify <kind> <msg>: лог + відправка кожному одержувачу. Не падає, щоб не ламати виклики з deploy.
# NOTIFY_VERBOSE=1 друкує результат по кожному одержувачу (для `test`).
notify() {
  local kind="$1" msg="$2"
  local stamp; stamp=$(date -u +%FT%TZ)
  msg=$(printf '%s' "$msg" | sanitize)
  local text; text=$(clip "[VDALO/${kind}] ${msg}")

  # У alerts.log – перший рядок і розмір решти: повний хвіст вже лежить у update.log.
  local first="${msg%%$'\n'*}" extra=""
  [[ "$msg" == *$'\n'* ]] && extra=" ($(printf '%s\n' "$msg" | wc -l | tr -d ' ') lines, details in update.log)"
  echo "[$stamp] $kind ${first}${extra}" >>"$LOG"

  NOTIFY_FAILED=0
  if [[ -n "${TG_BOT_TOKEN:-}" && -n "${TG_CHAT_ID:-}" ]]; then
    local id n=0 total
    total=$(recipients | wc -l | tr -d ' ')
    while IFS= read -r id; do
      n=$((n + 1))
      if send_one "$id" "$text"; then
        [[ -z "${NOTIFY_VERBOSE:-}" ]] || echo "recipient $n of $total (${id}): sent"
      else
        NOTIFY_FAILED=$((NOTIFY_FAILED + 1))
        echo "[$stamp] NOTIFY-ERR recipient=$id $SEND_ERR" >>"$LOG"
        [[ -z "${NOTIFY_VERBOSE:-}" ]] || echo "recipient $n of $total (${id}): FAILED: $SEND_ERR"
      fi
    done < <(recipients)
  fi
  return 0
}

# Deduplicate: do not re-fire within 30 min for the same key.
should_fire() {
  local key="$1"
  local f="$STATE_DIR/alert-$key"
  local now=$(date +%s) last=0
  [[ -f "$f" ]] && last=$(cat "$f" 2>/dev/null || echo 0)
  (( now - last >= 1800 )) || return 1
  echo "$now" >"$f"
}
clear_fire() { rm -f "$STATE_DIR/alert-$1"; }

check_url() {
  local label="$1" key="$2" url="$3"
  if ! curl -fsS -m 10 -o /dev/null "$url"; then
    should_fire "$key" && notify DOWN "$label unreachable at $url"
  else
    clear_fire "$key"
  fi
}

cmd="${1:-}"
case "$cmd" in
  health)
    check_url site    site    "${SITE_URL:-http://127.0.0.1:8080/}"
    check_url staging staging "${STAGING_URL:-http://127.0.0.1:8081/}"
    ;;
  external)
    # Перевірка з публічної точки (крізь Caddy + TLS + DNS). Активується після перемикання.
    url="${EXTERNAL_URL:-https://www.vdalo.tech/}"
    if ! curl -fsS -m 15 -o /dev/null "$url"; then
      should_fire external && notify DOWN "external reach failed at $url"
    else
      clear_fire external
    fi
    # Строк дії сертифіката (попередження за 14 днів).
    host=$(echo "$url" | awk -F/ '{print $3}')
    days=$(echo | openssl s_client -servername "$host" -connect "$host:443" 2>/dev/null \
             | openssl x509 -noout -enddate 2>/dev/null \
             | sed 's/notAfter=//' \
             | xargs -I{} date -d "{}" +%s 2>/dev/null \
             | awk -v now="$(date +%s)" '{print int(($1-now)/86400)}')
    if [[ -n "$days" ]] && (( days >= 0 && days < 14 )); then
      should_fire cert && notify CERT "$host certificate expires in ${days}d"
    elif [[ -n "$days" ]] && (( days >= 14 )); then
      clear_fire cert
    fi
    ;;
  disk)
    pct=$(df -P / | awk 'NR==2{sub("%","",$5); print $5}')
    if (( pct >= 80 )); then
      should_fire disk && notify DISK "root filesystem at ${pct}%"
    else
      clear_fire disk
    fi
    ;;
  deploy-failed)
    shift
    notify DEPLOY-FAIL "${*:-site deploy failed}"
    ;;
  deploy-ok)
    shift
    notify DEPLOY-OK "${*:-site deploy ok}"
    ;;
  failure-report)
    # Лише друкує повідомлення про збій (для update.log і для перегляду формату); нічого не шле.
    shift
    [[ $# -ge 3 ]] || { echo "usage: $0 failure-report <step> <output-file> <headline>" >&2; exit 2; }
    failure_report "$1" "$2" "$3"
    echo
    ;;
  test)
    # Тестове повідомлення всім одержувачам; код виходу != 0, якщо когось не досягнуто.
    if [[ -z "${TG_BOT_TOKEN:-}" || -z "${TG_CHAT_ID:-}" ]]; then
      NOTIFY_VERBOSE=1 notify TEST "alerts pipeline test"
      echo "TG_BOT_TOKEN or TG_CHAT_ID is empty in $ENV_FILE: nothing sent, only logged to $LOG" >&2
      exit 1
    fi
    NOTIFY_VERBOSE=1 notify TEST "alerts pipeline test from $(hostname)"
    total=$(recipients | wc -l | tr -d ' ')
    if (( NOTIFY_FAILED > 0 )); then
      echo "test alert: $NOTIFY_FAILED of $total recipients NOT reached (see above and $LOG)" >&2
      exit 1
    fi
    echo "test alert sent to all $total recipients"
    ;;
  add-recipient)
    # Додає Telegram id у TG_CHAT_ID, не показуючи й не змінюючи решту alerts.env (токен).
    id="${2:-}"
    [[ "$id" =~ ^-?[0-9]+$ ]] || { echo "usage: $0 add-recipient <numeric Telegram id>" >&2; exit 2; }
    [[ -f "$ENV_FILE" ]] || { echo "$ENV_FILE not found; run '$0 setup' first" >&2; exit 1; }
    [[ -w "$ENV_FILE" ]] || { echo "cannot write $ENV_FILE (run with sudo)" >&2; exit 1; }
    cur=$(sed -n 's/^TG_CHAT_ID=//p' "$ENV_FILE" | tail -n 1)
    cur="${cur%\"}"; cur="${cur#\"}"; cur="${cur%\'}"; cur="${cur#\'}"
    TG_CHAT_ID="$cur"
    # Спершу у змінну: `recipients | grep -q` з pipefail дає хибний збій через SIGPIPE.
    existing="$(recipients | paste -sd, -)"
    if grep -qx -- "$id" <<<"${existing//,/$'\n'}"; then
      echo "recipient already present; list: $existing"
      exit 0
    fi
    list="${existing:+$existing,}$id"
    tmp=$(mktemp "$ENV_FILE.XXXXXX")
    trap 'rm -f "$tmp"' EXIT
    awk -v ids="$list" '
      /^TG_CHAT_ID=/ { if (!done) print "TG_CHAT_ID=" ids; done = 1; next }
      { print }
      END { if (!done) print "TG_CHAT_ID=" ids }
    ' "$ENV_FILE" >"$tmp"
    # Власник і права лишаються як у оригіналу; заміна атомарна, токен не друкується.
    chown --reference="$ENV_FILE" "$tmp" 2>/dev/null || true
    chmod --reference="$ENV_FILE" "$tmp"
    mv "$tmp" "$ENV_FILE"
    trap - EXIT
    echo "recipient added; list: $list"
    echo "next: $0 test"
    ;;
  setup)
    [[ $EUID -eq 0 ]] || { echo "run with sudo" >&2; exit 1; }
    install -d -m 755 /etc/vdalo
    install -d -m 755 /var/log/vdalo
    cat <<'MSG'
Setup VDALO alerts to Telegram.

Before continuing:
  1. У @BotFather мати бота для сповіщень власника (окремий — лише за бажанням;
     токен поточного бота теж підходить) і скопіювати токен.
  2. Відкрити цього бота у своєму Telegram і написати йому будь-що («hi»).
  3. Вставити токен на наступному запиті (прихований ввід).
Додаткових одержувачів додає `vdalo-alerts add-recipient <id>` (кожен має спершу натиснути Start у боті).
MSG
    echo
    printf "Bot token (hidden): "
    stty -echo
    IFS= read -r token
    stty echo
    echo
    [[ "$token" =~ ^[0-9]+:[A-Za-z0-9_-]+$ ]] || { echo "Invalid token format" >&2; exit 1; }

    resp=$(curl -sS -m 15 "https://api.telegram.org/bot${token}/getUpdates") \
      || { echo "Failed to reach Telegram API" >&2; exit 1; }
    echo "$resp" | grep -q '"ok":true' \
      || { echo "Telegram API error (token wrong?)" >&2; exit 1; }

    chat_id=$(echo "$resp" | grep -oE '"chat":\{"id":-?[0-9]+' | tail -1 | grep -oE '\-?[0-9]+$')
    if [[ -z "$chat_id" ]]; then
      echo "No message to the bot found. Open the bot in Telegram, send any text, then rerun this setup." >&2
      exit 1
    fi

    umask 177
    cat >/etc/vdalo/alerts.env <<ENV
TG_BOT_TOKEN=$token
TG_CHAT_ID=$chat_id
ENV
    unset token
    chown deploy:deploy /etc/vdalo/alerts.env
    chmod 600 /etc/vdalo/alerts.env
    if "$0" test >/dev/null; then
      echo "setup OK; a test alert was sent to the configured chat"
    else
      echo "setup wrote /etc/vdalo/alerts.env, but the test alert was NOT delivered: run '$0 test'" >&2
    fi
    ;;
  *)
    echo "usage: $0 {health|external|disk|deploy-failed MSG|deploy-ok MSG|failure-report STEP FILE HEADLINE|test|add-recipient ID|setup}" >&2
    exit 2
    ;;
esac
