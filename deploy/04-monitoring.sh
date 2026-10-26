#!/usr/bin/env bash
# ponytail: /etc/vdalo/alerts.env (empty, owner fills), /opt/vdalo/deploy/vdalo-alerts.sh, 3 timers:
#  - vdalo-health (site reachable)
#  - vdalo-disk (>=80% warn)
#  - vdalo-docker-prune (daily: old vdalo/site images + build cache; keeps main, staging, last-ok)
set -euo pipefail
[[ $EUID -eq 0 ]] || { echo "run as root"; exit 1; }

install -d -m 755 /etc/vdalo
if [[ ! -f /etc/vdalo/alerts.env ]]; then
  install -m 600 -o deploy -g deploy /dev/null /etc/vdalo/alerts.env
  cat >/etc/vdalo/alerts.env <<'EOF'
# Fill via: sudo /usr/local/sbin/vdalo-alerts setup
# (The command hides the bot token on input, pulls chat_id from Telegram getUpdates,
#  writes this file, and sends a test alert. Nothing secret prints to screen.)
# TG_CHAT_ID: one id, or several separated by commas (111,222).
# Add a recipient without touching the token: sudo /usr/local/sbin/vdalo-alerts add-recipient <id>
TG_BOT_TOKEN=
TG_CHAT_ID=
EOF
  chmod 600 /etc/vdalo/alerts.env
  chown deploy:deploy /etc/vdalo/alerts.env
fi

install -m 755 /opt/vdalo/deploy/vdalo-alerts.sh /usr/local/sbin/vdalo-alerts
# Root-скрипт чистки ставимо копією в /usr/local/sbin (як vdalo-alerts), а не запускаємо з /opt/vdalo/deploy.
install -m 755 /opt/vdalo/deploy/vdalo-docker-prune.sh /usr/local/sbin/vdalo-docker-prune

echo "== systemd units =="
cat >/etc/systemd/system/vdalo-health.service <<'EOF'
[Unit]
Description=VDALO site reachability check
[Service]
Type=oneshot
ExecStart=/usr/local/sbin/vdalo-alerts health
EOF
cat >/etc/systemd/system/vdalo-health.timer <<'EOF'
[Unit]
Description=Run VDALO health check every 2 minutes
[Timer]
OnBootSec=2min
OnUnitActiveSec=2min
AccuracySec=15s
[Install]
WantedBy=timers.target
EOF

cat >/etc/systemd/system/vdalo-disk.service <<'EOF'
[Unit]
Description=VDALO disk usage check
[Service]
Type=oneshot
ExecStart=/usr/local/sbin/vdalo-alerts disk
EOF
cat >/etc/systemd/system/vdalo-disk.timer <<'EOF'
[Unit]
Description=Run VDALO disk check hourly
[Timer]
OnBootSec=10min
OnUnitActiveSec=1h
AccuracySec=1min
[Install]
WantedBy=timers.target
EOF

cat >/etc/systemd/system/vdalo-docker-prune.service <<'EOF'
[Unit]
Description=VDALO docker prune (old vdalo/site images and build cache; keeps main, staging, last-ok)
[Service]
Type=oneshot
Slice=builds.slice
# Вік у днях; змінити: sudo systemctl edit vdalo-docker-prune.service
Environment=VDALO_PRUNE_DAYS=3
ExecStart=/usr/local/sbin/vdalo-docker-prune
EOF
cat >/etc/systemd/system/vdalo-docker-prune.timer <<'EOF'
[Unit]
Description=Daily docker prune at 03:00 UTC
[Timer]
OnCalendar=*-*-* 03:00:00
Persistent=true
[Install]
WantedBy=timers.target
EOF

systemctl daemon-reload
systemctl enable --now vdalo-health.timer vdalo-disk.timer vdalo-docker-prune.timer

echo "== DONE 04-monitoring =="
