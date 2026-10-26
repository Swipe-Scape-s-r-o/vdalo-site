import {chmodSync, mkdirSync, mkdtempSync, readFileSync, existsSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

// Тести shell-скриптів з deploy/. Вони не входять у tests/*.test.mjs, бо ті виконуються
// всередині Docker-образу (alpine без bash, deploy/ видалено); їх запускає окремий джоб CI.
export const deployDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const fixture = name => path.join(deployDir, 'tests', 'fixtures', name);
export const script = name => path.join(deployDir, name);

// Фальшивий токен збираємо в коді: літерал такої форми зачепив би secret scanning GitHub.
export const FAKE_TOKEN = `${'7' + '1234567'}:${'AAF' + 'x'.repeat(32)}`;

export function sandbox() {
  const root = mkdtempSync(path.join(tmpdir(), 'vdalo-deploy-test-'));
  const sb = {
    root,
    bin: path.join(root, 'bin'),
    state: path.join(root, 'state'),
    opt: path.join(root, 'opt'),
    envFile: path.join(root, 'alerts.env'),
    alertsLog: path.join(root, 'alerts.log'),
    updateLog: path.join(root, 'update.log'),
    curlLog: path.join(root, 'curl.log'),
    dockerLog: path.join(root, 'docker.log')
  };
  for (const dir of [sb.bin, sb.state, path.join(sb.opt, 'repo', '.git'), path.join(sb.opt, 'releases'), path.join(sb.opt, 'deploy')]) {
    mkdirSync(dir, {recursive: true});
  }
  return sb;
}

export function stub(sb, name, body, dir = sb.bin) {
  const file = path.join(dir, name);
  writeFileSync(file, `#!/usr/bin/env bash\n${body}\n`);
  chmodSync(file, 0o755);
  return file;
}

// curl, що записує кожен виклик (аргументи розділені NUL) і відповідає як Telegram.
// STUB_FAIL_CHATS=111,222 – для цих chat_id відповідає помилкою 403.
export function stubCurl(sb) {
  stub(sb, 'curl', `
printf 'CALL\\0' >>"$STUB_CURL_LOG"
printf '%s\\0' "$@" >>"$STUB_CURL_LOG"
printf 'END\\0' >>"$STUB_CURL_LOG"
chat=""
for a in "$@"; do [[ "$a" == chat_id=* ]] && chat="\${a#chat_id=}"; done
case ",\${STUB_FAIL_CHATS:-}," in
  *",$chat,"*) echo '{"ok":false,"error_code":403,"description":"Forbidden: bot can'"'"'t initiate conversation with a user"}';;
  *) echo '{"ok":true,"result":{"message_id":1}}';;
esac
`);
}

export function curlCalls(sb) {
  if (!existsSync(sb.curlLog)) return [];
  const parts = readFileSync(sb.curlLog, 'utf8').split('\0');
  const calls = [];
  let cur = null;
  for (const part of parts) {
    if (part === 'CALL') cur = [];
    else if (part === 'END') { calls.push(cur); cur = null; }
    else if (cur) cur.push(part);
  }
  return calls.map(args => ({
    url: args.find(a => a.startsWith('https://api.telegram.org/')),
    chat: (args.find(a => a.startsWith('chat_id=')) || '').slice('chat_id='.length),
    text: (args.find(a => a.startsWith('text=')) || '').slice('text='.length)
  }));
}

export function writeEnv(sb, {token = FAKE_TOKEN, chat = '111'} = {}) {
  writeFileSync(sb.envFile, `TG_BOT_TOKEN=${token}\nTG_CHAT_ID=${chat}\n`, {mode: 0o600});
}

// Мінімальне оточення: нічого зі змінних VDALO_*/TG_* користувача не просочується в тест.
export function run(sb, file, args = [], env = {}, input) {
  return spawnSync('bash', [file, ...args], {
    encoding: 'utf8',
    input,
    env: {
      PATH: `${sb.bin}:${process.env.PATH}`,
      HOME: sb.root,
      TMPDIR: sb.root,
      VDALO_ALERTS_ENV: sb.envFile,
      VDALO_ALERTS_LOG: sb.alertsLog,
      VDALO_STATE_DIR: sb.state,
      STUB_CURL_LOG: sb.curlLog,
      STUB_DOCKER_LOG: sb.dockerLog,
      ...env
    }
  });
}

export const read = file => (existsSync(file) ? readFileSync(file, 'utf8') : '');
