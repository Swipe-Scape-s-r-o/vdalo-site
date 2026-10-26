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
# Test hooks (не ставляться у звичайних запусках, тільки для ручної перевірки):
#   VDALO_TEST_FORCE_SHA=<sha>          — замість `git rev-parse origin/<branch>` взяти цей SHA
#   VDALO_TEST_FORCE_SMOKE_EXIT=<rc>    — перевизначити exit code vdalo-smoke.sh
#   VDALO_TEST_FORCE_COMPOSE_TAG=<tag>  — у compose up підсунути цей тег замість <image_tag>-<new>
set -euo pipefail

REPO=/opt/vdalo/repo
STATE=/var/lib/vdalo
LOG=/var/log/vdalo/update.log
ALERT=/usr/local/sbin/vdalo-alerts
install -d "$STATE" "$(dirname "$LOG")"

exec >>"$LOG" 2>&1
echo "---- $(date -u +%FT%TZ) check ----"

# Attach the newest deployment output to build/test failure alerts. Keep the
# message below Telegram's size limit while retaining up to the last 30 lines.
last_deploy_log_lines() {
  local -a lines=()
  mapfile -t lines < <(tail -n 30 "$LOG" 2>/dev/null || true)

  local details="" candidate line
  local i
  for ((i=${#lines[@]} - 1; i >= 0; i--)); do
    line="${lines[$i]}"
    if ((${#line} > 220)); then
      line="${line:0:219}…"
    fi
    if [[ -n "$details" ]]; then
      candidate="$line"$'\n'"$details"
    else
      candidate="$line"
    fi
    ((${#candidate} <= 3000)) || break
    details="$candidate"
  done
  printf '%s' "$details"
}

alert_deploy_failure_with_log() {
  local summary="$1"
  local details
  details=$(last_deploy_log_lines)
  "$ALERT" deploy-failed "$summary"$'\n''Last 30 deployment log lines:'$'\n'"$details"
}

[[ -d "$REPO/.git" ]] || { echo "repo missing at $REPO"; exit 0; }

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

rollback_to_last_ok() {
  local branch="$1" image_tag="$2" service="$3" last_ok="$4" container_name="$5" reason="$6"
  local tag_name
  [[ "$branch" == "main" ]] && tag_name=SITE_TAG || tag_name=STAGING_TAG
  if [[ -z "$last_ok" ]]; then
    "$ALERT" deploy-failed "$branch failed ($reason) and no last-ok to roll back to"
    return 1
  fi
  local rb_image="vdalo/site:${image_tag}-${last_ok}"
  if ! docker image inspect "$rb_image" >/dev/null 2>&1; then
    "$ALERT" deploy-failed "$branch failed ($reason); rollback image $rb_image missing from host"
    return 1
  fi
  local rb_start; rb_start=$(date +%s)
  if ! (cd /opt/vdalo && env "${tag_name}=${image_tag}-${last_ok}" docker compose -f deploy/compose.yml up -d --no-deps --wait "$service"); then
    "$ALERT" deploy-failed "$branch failed ($reason); rollback compose up to $rb_image also failed"
    return 1
  fi
  local rb_sec=$(( $(date +%s) - rb_start ))
  local health; health=$(container_health "$container_name")
  if [[ "$health" == "healthy" ]]; then
    "$ALERT" deploy-failed "$branch failed ($reason); rolled back to ${image_tag}-${last_ok} in ${rb_sec}s, healthy"
    # Keep moving tag pointing at the known-good image too.
    docker tag "$rb_image" "vdalo/site:${image_tag}" 2>/dev/null || true
    return 0
  fi
  "$ALERT" deploy-failed "$branch failed ($reason); rollback to ${image_tag}-${last_ok} finished in ${rb_sec}s but health=$health"
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

  local wt=/opt/vdalo/releases/"$branch"-"$new"
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

  # Build + tests inside builds.slice. Only SHA-tag now; moving tag goes after smoke.
  # Tests run INSIDE the freshly built image so we don't need Node on the host.
  if ! systemd-run --quiet --wait --pipe --slice=builds.slice --unit="vdalo-build-$branch-$$" \
        --working-directory="$wt" \
        /bin/sh -c "
          set -e
          docker build -f deploy/Dockerfile -t vdalo/site:$image_tag-$new .
          docker run --rm --network=none vdalo/site:$image_tag-$new sh -c 'node --test tests/*.test.mjs'
          docker run --rm --network=none vdalo/site:$image_tag-$new node scripts/validate-schema.mjs
        "; then
    echo "[$branch] build/test failed for $new"
    alert_deploy_failure_with_log "build/test failed on $branch@$new"
    echo "$new" >"$last_seen_file"
    "${GIT_AS_DEPLOY[@]}" worktree remove --force "$wt" 2>/dev/null || rm -rf "$wt"
    return 1
  fi

  # Compose up (SHA-pinned; test hook can override the tag to force failure).
  local compose_tag="${image_tag}-${new}"
  [[ -n "${VDALO_TEST_FORCE_COMPOSE_TAG:-}" ]] && compose_tag="$VDALO_TEST_FORCE_COMPOSE_TAG"
  if ! (cd /opt/vdalo && env "${tag_name}=${compose_tag}" docker compose -f deploy/compose.yml up -d --no-deps --wait "$service"); then
    echo "[$branch] compose up failed (tag=$compose_tag)"
    rollback_to_last_ok "$branch" "$image_tag" "$service" "$last_ok" "$container_name" "compose-up on $new"
    echo "$new" >"$last_seen_file"
    "${GIT_AS_DEPLOY[@]}" worktree remove --force "$wt" 2>/dev/null || rm -rf "$wt"
    return 1
  fi

  # Smoke.
  sleep 1
  local port=8080
  [[ "$service" == site-staging ]] && port=8081
  local smoke_rc=0
  /opt/vdalo/deploy/vdalo-smoke.sh "http://127.0.0.1:$port" || smoke_rc=$?
  [[ -n "${VDALO_TEST_FORCE_SMOKE_EXIT:-}" ]] && smoke_rc="$VDALO_TEST_FORCE_SMOKE_EXIT"
  if [[ "$smoke_rc" -ne 0 ]]; then
    echo "[$branch] smoke failed (rc=$smoke_rc)"
    rollback_to_last_ok "$branch" "$image_tag" "$service" "$last_ok" "$container_name" "smoke on $new"
    echo "$new" >"$last_seen_file"
    "${GIT_AS_DEPLOY[@]}" worktree remove --force "$wt" 2>/dev/null || rm -rf "$wt"
    return 1
  fi

  # Green: promote moving tag, update state.
  docker tag "vdalo/site:${image_tag}-${new}" "vdalo/site:${image_tag}"
  echo "$new" >"$last_ok_file"
  echo "$new" >"$last_seen_file"
  "$ALERT" deploy-ok "$branch@$new live"
  (cd /opt/vdalo/releases && ls -1dt "$branch"-* 2>/dev/null | tail -n +4 | xargs -r rm -rf)
}

run_update main    main    site        || true
run_update staging staging site-staging || true

echo "done"
