# deploy/

Інфраструктурна тека для сайту VDALO на сервері Hetzner CX33 (178.104.154.106).

## Що тут

Скрипти бутстрапу (`00..04`), Dockerfile сайту, compose-стек з Caddy, автооновлення й моніторинг. Усе підлаштоване під `node server.mjs` з `.env` поряд (сервер читає його сам, коли нема `VERCEL`).

## Порядок разового бутстрапу (виконує deploy або root)

```bash
cd /opt/vdalo/deploy
sudo bash 00-bootstrap.sh
sudo bash 01-firewall.sh
sudo bash 02-docker-caddy.sh
sudo bash 03-limits.sh
sudo bash 04-monitoring.sh
```

Кожен скрипт ідемпотентний — безпечно перезапускати.

## Що потрібно від власника (значень у чаті/git немає)

Два файли секретів живуть на сервері, 600 deploy:deploy. Редагує їх deploy напряму (sudo не треба). `sudoedit` НЕ підходить для `/opt/vdalo/*.env`, бо тека `/opt/vdalo` писабельна для deploy — `sudoedit` відмовить із «cannot open a file in a path writable by the user».

- `/etc/vdalo/alerts.env` – `TG_BOT_TOKEN`, `TG_CHAT_ID` для тривог у Telegram. Створюється й заповнюється командою `sudo /usr/local/sbin/vdalo-alerts setup` (прихований ввід токена, chat_id з Telegram getUpdates). Нічого секретного на екран. Можна поставити будь-якого бота, якого власник використовує для своїх сповіщень; окремий від інших систем – за бажанням. `TG_CHAT_ID` – один id або список через кому (`111,222`, без пробілів; пробіли допустимі лише в лапках); додавати одержувачів краще командою `add-recipient` (див. «Тривоги Telegram»).
- `/opt/vdalo/site.env` і `/opt/vdalo/site-staging.env` — змінні сайту за `deploy/env.example`. На бутстрапі створюються з шаблону, ЯКЩО ще не існують (щоб ніколи не затерти наявні значення):

  ```bash
  for f in site.env site-staging.env; do
    [[ -f /opt/vdalo/$f ]] && continue
    sudo install -m 600 -o deploy -g deploy /opt/vdalo/deploy/env.example /opt/vdalo/$f
  done
  sudo sed -i 's#^VDALO_SITE_URL=.*#VDALO_SITE_URL=https://staging.vdalo.tech#' /opt/vdalo/site-staging.env
  ```

  Далі власник заходить як deploy і правит напряму (sudo для цих файлів НЕ підходить):

  ```bash
  ssh deploy@178.104.154.106
  nano /opt/vdalo/site.env              # вписати WFP_SECRET_KEY, webhook URL і решту
  nano /opt/vdalo/site-staging.env      # staging — без WFP_SECRET_KEY
  sudo docker compose -f /opt/vdalo/deploy/compose.yml up -d --no-deps --wait site site-staging
  ```

  compose без `SITE_TAG`/`STAGING_TAG` бере рухомі теги `vdalo/site:main` і `vdalo/site:staging`, які автооновлювач ставить ЛИШЕ після зеленого smoke, тож тут гарантовано піднімуться вже перевірені образи.

Пароль staging basic-auth задає окремо:

```bash
sudo /usr/local/sbin/vdalo-staging-auth    # прихований ввід; caddy hash-password → /etc/caddy/staging-auth.conf → reload
```

## Автооновлення

- `vdalo-site-update.service` + `.timer` щохвилини робить `git fetch` і за зміною `main`/`staging` будує в `builds.slice`, прогонить тести, піднімає новий контейнер, робить smoke.
- Відкат: `/opt/vdalo/deploy/rollback.sh <sha>`.
- Невдала збірка прибирає за собою свій образ `vdalo/site:<гілка>-<sha>` (крім last-ok).

## Тривоги Telegram

Один бот, кілька одержувачів: `TG_CHAT_ID` у `/etc/vdalo/alerts.env` – список id через кому. Збій доставки одному одержувачу не блокує інших і пишеться в `/var/log/vdalo/alerts.log` (без токена). Кожен одержувач має один раз відкрити бота й натиснути Start, інакше Telegram відповість «Forbidden: bot can't initiate conversation with a user».

```bash
sudo /usr/local/sbin/vdalo-alerts add-recipient <telegram-id>   # додає id, токен не показує і не чіпає
sudo /usr/local/sbin/vdalo-alerts test                           # лише тестове повідомлення всім; показує результат по кожному
```

Що приходить про розгортання:

- `DEPLOY-OK`: коротко, `staging@d279e05 PR #105 live` (гілка, 7 символів SHA, номер PR із коміта злиття, live).
- `DEPLOY-FAIL`: назва червоного кроку (`docker build`, `tests`, `validate-schema`, `compose up`, `smoke`); для `tests` – назва тесту, `файл:рядок` перевірки й повідомлення помилки (`✖ …`, `AssertionError …`); далі останні ~30 рядків виводу. Той самий текст пишеться в `/var/log/vdalo/update.log`.
- Усі повідомлення проходять фільтр секретів (токени, `Bearer`, `*_KEY=`/`*_SECRET=`/`*_TOKEN=`/`password=`, `https://user:pass@`, вебхуки) і обрізаються до 4000 символів (ліміт Telegram 4096).
- Переглянути формат без відправлення: `vdalo-alerts failure-report <крок> <файл-з-виводом> "<заголовок>"`.

Вивід збірки йде у тимчасовий файл (а не лише в journald); крок визначається за маркерами `##VDALO-STEP` у виводі, тести на сервері ганяються з `--test-reporter=spec`, бо парсер спирається на його формат.

## Чистка Docker

Образи сайту мають теги `vdalo/site:<гілка>-<sha>`, тому `docker image prune` без `-a` їх ніколи не видаляв. Нічний таймер `vdalo-docker-prune` (03:00 UTC) запускає `/usr/local/sbin/vdalo-docker-prune`: видаляє образи `vdalo/site` і кеш збірки старші за N днів (за замовчуванням 3, змінна `VDALO_PRUNE_DAYS` в unit-і).

Завжди лишаються: рухомі теги `main` і `staging`, образи last-ok кожної гілки (ціль відкату), образи будь-якого контейнера, усе молодше за 2 години (щоб не зачепити збірку, що йде зараз). Образи інших репозиторіїв (`node`, `alpine`) не чіпаються.

```bash
sudo /usr/local/sbin/vdalo-docker-prune --days 0 --dry-run   # лише план
sudo /usr/local/sbin/vdalo-docker-prune --days 0 --ask       # план, потім питає y/N і лише тоді чистить (потрібен термінал)
```

## Оновлення файлів на сервері після змін у deploy/

Сервер сам підтягує лише код сайту (гілки `main`/`staging`). Скрипти з `deploy/` він бере з `/opt/vdalo/deploy` і `/usr/local/sbin`, тому їх треба оновити вручну (як `deploy`, `ssh deploy@178.104.154.106`). Якщо змінилося лише це – перезапускати нічого не треба: таймери підхоплять нові скрипти за хвилину.

```bash
# 1. Взяти файли з main у тимчасову теку (git вже налаштований на сервері, таймер робить fetch щохвилини)
T=$(mktemp -d)
sudo -u deploy -H git -C /opt/vdalo/repo fetch --quiet origin main
sudo -u deploy -H git -C /opt/vdalo/repo archive origin/main deploy | tar -x -C "$T"

# 2. Порядок важливий: спершу vdalo-alerts (він уміє failure-report), потім скрипт оновлення
sudo install -m 755 "$T/deploy/vdalo-alerts.sh"       /opt/vdalo/deploy/vdalo-alerts.sh
sudo install -m 755 "$T/deploy/vdalo-docker-prune.sh" /opt/vdalo/deploy/vdalo-docker-prune.sh
sudo install -m 755 "$T/deploy/04-monitoring.sh"      /opt/vdalo/deploy/04-monitoring.sh
sudo bash /opt/vdalo/deploy/04-monitoring.sh          # ставить /usr/local/sbin/vdalo-alerts і vdalo-docker-prune, переписує unit чистки; alerts.env не чіпає
sudo install -m 755 "$T/deploy/vdalo-site-update.sh"  /opt/vdalo/deploy/vdalo-site-update.sh
rm -rf "$T"
```

Відкат: ті самі кроки з попереднього коміту (`git archive <sha> deploy`). Якщо відкочуєш `vdalo-alerts`, спершу поверни в `TG_CHAT_ID` один id: стара версія не вміє список через кому.

## Перемикання DNS — план (НЕ виконується автоматично)

Див. `SWITCHOVER.md`.
