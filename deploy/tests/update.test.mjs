import test from 'node:test';
import assert from 'node:assert/strict';
import {readdirSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {FAKE_TOKEN, curlCalls, fixture, read, run, sandbox, script, stub, stubCurl, writeEnv} from './helpers.mjs';

const UPDATE = script('vdalo-site-update.sh');
const ALERTS = script('vdalo-alerts.sh');

const MAIN_SHA = '0f1e2d3c4b5a69788796a5b4c3d2e1f001122334';
const NEW_SHA = 'a1b2c3d4e5f60718293a4b5c6d7e8f9012345678';
const OK_SHA = 'bbbbbbb4e5f60718293a4b5c6d7e8f9012345678';
const PR_SUBJECT = 'Merge pull request #105 from Swipe-Scape-s-r-o/staging';

// Усе зовнішнє (sudo, git, systemd-run, docker, sleep, smoke) замінено стабами в PATH.
// systemd-run виконує справжній внутрішній `sh -c` зі скрипта, тож маркери кроків і розбір виводу тестуються як є.
function setup({lastOk = OK_SHA, chat = '111,222'} = {}) {
  const sb = sandbox();
  stubCurl(sb);
  writeEnv(sb, {chat});
  stub(sb, 'sudo', 'while [[ "$1" == -* ]]; do case "$1" in -u) shift 2;; *) shift;; esac; done; exec "$@"');
  stub(sb, 'sleep', 'exit 0');
  // На сервері vdalo-alerts – встановлена копія з правом виконання; у репозиторії файл без нього.
  sb.alertBin = stub(sb, 'vdalo-alerts', `exec bash "${ALERTS}" "$@"`);
  stub(sb, 'git', `
[[ "$1" == -C ]] && shift 2
case "$1" in
  fetch) exit 0;;
  rev-parse) case "$2" in origin/main) echo "${MAIN_SHA}";; origin/staging) echo "$STUB_STAGING_SHA";; esac;;
  log) echo "$STUB_SUBJECT";;
  worktree) case "$2" in
    add) mkdir -p "$4/deploy"; : >"$4/deploy/Dockerfile";;
    remove) rm -rf "$4";;
  esac;;
esac`);
  stub(sb, 'systemd-run', `
wd=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --working-directory=*) wd="\${1#*=}"; shift;;
    /bin/sh) shift; [[ -n "$wd" ]] && cd "$wd"; exec /bin/sh "$@";;
    *) shift;;
  esac
done
exit 97`);
  stub(sb, 'docker', `
echo "docker $*" >>"$STUB_DOCKER_LOG"
case "$1" in
  build) echo "#1 [internal] load build definition from Dockerfile"; echo "#8 RUN npm run build"; exit "\${STUB_BUILD_RC:-0}";;
  run)
    if [[ "$*" == *"node --test"* ]]; then
      [[ -n "\${STUB_TEST_OUTPUT:-}" ]] && cat "$STUB_TEST_OUTPUT"
      exit "\${STUB_TEST_RC:-0}"
    fi
    echo "schema check output"; exit "\${STUB_SCHEMA_RC:-0}";;
  image)
    case "$2" in
      inspect) [[ ",\${STUB_IMAGES:-}," == *",$3,"* ]]; exit $?;;
      rm) echo "Untagged: $3"; exit "\${STUB_RM_RC:-0}";;
    esac;;
  compose)
    echo "compose output for \${SITE_TAG:-}\${STAGING_TAG:-}"
    [[ -n "\${STUB_COMPOSE_FAIL_TAG:-}" && ( "\${STAGING_TAG:-}" == "$STUB_COMPOSE_FAIL_TAG" || "\${SITE_TAG:-}" == "$STUB_COMPOSE_FAIL_TAG" ) ]] && exit 1
    exit 0;;
  inspect) echo "\${STUB_HEALTH:-healthy}";;
esac
exit 0`);
  stub(sb, 'vdalo-smoke.sh', `
echo "ok    GET /  200 12000"
if [[ "\${STUB_SMOKE_RC:-0}" != 0 ]]; then echo "FAIL  GET /tourist-tax/  500 120 text/html"; fi
exit "\${STUB_SMOKE_RC:-0}"`, path.join(sb.opt, 'deploy'));
  // main вважається вже розгорнутим, тож усі перевірки йдуть про staging.
  writeFileSync(path.join(sb.state, 'last-seen-main'), MAIN_SHA);
  writeFileSync(path.join(sb.state, 'last-ok-main'), MAIN_SHA);
  writeFileSync(path.join(sb.state, 'last-seen-staging'), OK_SHA);
  if (lastOk) writeFileSync(path.join(sb.state, 'last-ok-staging'), lastOk);
  return sb;
}

function update(sb, env = {}) {
  return run(sb, UPDATE, [], {
    VDALO_OPT_DIR: sb.opt,
    VDALO_LOG: sb.updateLog,
    VDALO_ALERT_BIN: sb.alertBin,
    STUB_STAGING_SHA: NEW_SHA,
    STUB_SUBJECT: PR_SUBJECT,
    STUB_IMAGES: `vdalo/site:staging-${NEW_SHA},vdalo/site:staging-${OK_SHA}`,
    ...env
  });
}

const redTests = {STUB_TEST_RC: '1', STUB_TEST_OUTPUT: fixture('node-test-failure.out')};
const alertTexts = sb => curlCalls(sb).map(c => c.text);

test('red test: both recipients get the step, the test name with file:line, the error and a tail', () => {
  const sb = setup();
  const r = update(sb, redTests);
  assert.equal(r.status, 0, r.stderr);
  const calls = curlCalls(sb);
  assert.deepEqual(calls.map(c => c.chat), ['111', '222']);
  const text = calls[0].text;
  assert.ok(text.startsWith('[VDALO/DEPLOY-FAIL] build/test failed on staging@a1b2c3d (PR #105)\nstep: tests\nfailed tests:\n'), text);
  assert.match(text, /✖ public resource library exposes exactly 18 allowlisted files with the packaged bytes\n  tests\/tool-calculations\.test\.mjs:82\n  AssertionError \[ERR_ASSERTION\]: frontdesk_shift\.txt/);
  assert.match(text, /last 30 lines:\n/);
  assert.ok([...text].length <= 4096, `length ${[...text].length}`);
  assert.equal(calls[1].text, text);
  assert.doesNotMatch(text, /##VDALO-STEP/);
});

test('red test: the same details go to update.log, the image is removed, state moves on', () => {
  const sb = setup();
  update(sb, redTests);
  const log = read(sb.updateLog);
  assert.match(log, /\[staging\] build\/test failed for a1b2c3d4e5f60718293a4b5c6d7e8f9012345678 \(step: tests\)/);
  assert.match(log, /step: tests\nfailed tests:\n✖ public resource library/);
  assert.match(log, /AssertionError \[ERR_ASSERTION\]: frontdesk_shift\.txt/);
  assert.match(log, /last 30 lines:/);
  assert.match(log, new RegExp(`removed failed image vdalo/site:staging-${NEW_SHA}`));
  const docker = read(sb.dockerLog);
  assert.match(docker, new RegExp(`image rm vdalo/site:staging-${NEW_SHA}\\n`));
  assert.doesNotMatch(docker, /compose/, 'nothing is deployed after a red build');
  assert.doesNotMatch(docker, new RegExp(`image rm vdalo/site:staging-${OK_SHA}`), 'last-ok is never removed');
  assert.equal(read(path.join(sb.state, 'last-seen-staging')).trim(), NEW_SHA);
  assert.equal(read(path.join(sb.state, 'last-ok-staging')).trim(), OK_SHA);
  assert.ok(!read(sb.updateLog).includes(FAKE_TOKEN));
});

test('docker build failure names the docker build step', () => {
  const sb = setup();
  update(sb, {STUB_BUILD_RC: '1', STUB_IMAGES: ''});
  const [text] = alertTexts(sb);
  assert.match(text, /^\[VDALO\/DEPLOY-FAIL\] build\/test failed on staging@a1b2c3d \(PR #105\)\nstep: docker build\nlast \d+ lines:\n#1 \[internal\] load build definition from Dockerfile\n#8 RUN npm run build$/);
  assert.doesNotMatch(read(sb.dockerLog), /image rm/, 'no image was built, nothing to remove');
});

test('validate-schema failure names the validate-schema step', () => {
  const sb = setup();
  update(sb, {STUB_SCHEMA_RC: '1'});
  const [text] = alertTexts(sb);
  assert.match(text, /step: validate-schema\nlast \d+ lines:/);
  assert.match(text, /schema check output$/);
});

test('a failed image that is also last-ok is kept', () => {
  const sb = setup({lastOk: NEW_SHA});
  update(sb, {...redTests, STUB_IMAGES: `vdalo/site:staging-${NEW_SHA}`});
  assert.doesNotMatch(read(sb.dockerLog), /image rm/);
  assert.match(read(sb.updateLog), /keeping vdalo\/site:staging-a1b2c3d4e5f60718293a4b5c6d7e8f9012345678 \(it is last-ok\)/);
});

test('green deploy sends a short DEPLOY-OK with branch, short sha, PR number and live', () => {
  const sb = setup();
  const r = update(sb);
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(alertTexts(sb), ['[VDALO/DEPLOY-OK] staging@a1b2c3d PR #105 live', '[VDALO/DEPLOY-OK] staging@a1b2c3d PR #105 live']);
  const docker = read(sb.dockerLog);
  assert.match(docker, /node --test --test-reporter=spec tests\/\*\.test\.mjs/);
  assert.match(docker, new RegExp(`tag vdalo/site:staging-${NEW_SHA} vdalo/site:staging\\n`));
  assert.doesNotMatch(docker, /image rm/);
  assert.equal(read(path.join(sb.state, 'last-ok-staging')).trim(), NEW_SHA);
});

test('DEPLOY-OK takes the PR number from a squash-merge subject and omits it when there is none', () => {
  let sb = setup();
  update(sb, {STUB_SUBJECT: 'Fix tourist tax copy (#77)'});
  assert.equal(alertTexts(sb)[0], '[VDALO/DEPLOY-OK] staging@a1b2c3d PR #77 live');
  sb = setup();
  update(sb, {STUB_SUBJECT: 'docs: tweak'});
  assert.equal(alertTexts(sb)[0], '[VDALO/DEPLOY-OK] staging@a1b2c3d live');
});

test('smoke failure: names the step, shows the failing check, rolls back and removes the failed image', () => {
  const sb = setup();
  update(sb, {STUB_SMOKE_RC: '1'});
  const [text] = alertTexts(sb);
  assert.match(text, /^\[VDALO\/DEPLOY-FAIL\] staging failed \(smoke on a1b2c3d, PR #105\); rolled back to staging-bbbbbbb in \ds, healthy\nstep: smoke\n/);
  assert.match(text, /FAIL {2}GET \/tourist-tax\/ {2}500 120 text\/html/);
  const docker = read(sb.dockerLog);
  assert.match(docker, new RegExp(`image rm vdalo/site:staging-${NEW_SHA}\\n`));
  assert.doesNotMatch(docker, new RegExp(`image rm vdalo/site:staging-${OK_SHA}`));
  assert.equal(read(path.join(sb.state, 'last-ok-staging')).trim(), OK_SHA);
});

test('compose up failure: names the step and rolls back', () => {
  const sb = setup();
  update(sb, {STUB_COMPOSE_FAIL_TAG: `staging-${NEW_SHA}`});
  const [text] = alertTexts(sb);
  assert.match(text, /^\[VDALO\/DEPLOY-FAIL\] staging failed \(compose up on a1b2c3d, PR #105\); rolled back to staging-bbbbbbb in \ds, healthy\nstep: compose up\n/);
  assert.match(text, /compose output for staging-a1b2c3d4e5f60718293a4b5c6d7e8f9012345678/);
  assert.match(read(sb.dockerLog), new RegExp(`image rm vdalo/site:staging-${NEW_SHA}\\n`));
});

test('with an old vdalo-alerts that cannot format reports, raw output is withheld, not leaked', () => {
  const sb = setup();
  const calls = path.join(sb.root, 'alert-calls.log');
  const oldAlerts = stub(sb, 'old-alerts', `
if [[ "$1" == failure-report ]]; then echo "usage: ..." >&2; exit 2; fi
printf '%s\\n' "$*" >>"${calls}"`);
  update(sb, {...redTests, VDALO_ALERT_BIN: oldAlerts});
  const sent = read(calls);
  assert.match(sent, /^deploy-failed build\/test failed on staging@a1b2c3d \(PR #105\)\nstep: tests\n\(details withheld: install the matching \/usr\/local\/sbin\/vdalo-alerts\)/);
  assert.doesNotMatch(sent, /AssertionError/);
});

test('temporary run files are removed after every run', () => {
  const sb = setup();
  update(sb, redTests);
  assert.deepEqual(readdirSync(sb.state).filter(name => name.startsWith('run.')), []);
});
