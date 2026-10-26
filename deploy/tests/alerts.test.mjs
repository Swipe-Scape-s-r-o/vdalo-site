import test from 'node:test';
import assert from 'node:assert/strict';
import {chmodSync, readFileSync, statSync, writeFileSync} from 'node:fs';
import {FAKE_TOKEN, curlCalls, fixture, read, run, sandbox, script, stubCurl, writeEnv} from './helpers.mjs';

const ALERTS = script('vdalo-alerts.sh');

function setup(env) {
  const sb = sandbox();
  stubCurl(sb);
  writeEnv(sb, env);
  return sb;
}

test('one legacy chat id works as before: one send, same url and text format', () => {
  const sb = setup({chat: '111'});
  const r = run(sb, ALERTS, ['deploy-failed', 'build/test failed on staging@abc1234']);
  assert.equal(r.status, 0, r.stderr);
  const calls = curlCalls(sb);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].chat, '111');
  assert.equal(calls[0].url, `https://api.telegram.org/bot${FAKE_TOKEN}/sendMessage`);
  assert.equal(calls[0].text, '[VDALO/DEPLOY-FAIL] build/test failed on staging@abc1234');
  assert.match(read(sb.alertsLog), /DEPLOY-FAIL build\/test failed on staging@abc1234/);
});

test('two recipients: one send per recipient, same text', () => {
  const sb = setup({chat: '111,866959919'});
  const r = run(sb, ALERTS, ['deploy-ok', 'staging@abc1234 PR #105 live']);
  assert.equal(r.status, 0, r.stderr);
  const calls = curlCalls(sb);
  assert.deepEqual(calls.map(c => c.chat), ['111', '866959919']);
  assert.ok(calls.every(c => c.text === '[VDALO/DEPLOY-OK] staging@abc1234 PR #105 live'));
});

test('spaces around ids are ignored when the value is quoted, repeats are sent once', () => {
  const sb = setup();
  writeFileSync(sb.envFile, `TG_BOT_TOKEN=${FAKE_TOKEN}\nTG_CHAT_ID="111, 866959919 ,111"\n`);
  const r = run(sb, ALERTS, ['deploy-ok', 'x']);
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(curlCalls(sb).map(c => c.chat), ['111', '866959919']);
});

test('a recipient that cannot be reached does not block the others and is logged without the token', () => {
  const sb = setup({chat: '111,222'});
  const r = run(sb, ALERTS, ['disk'], {STUB_FAIL_CHATS: '111'});
  assert.equal(r.status, 0);
  const r2 = run(sb, ALERTS, ['deploy-failed', 'x'], {STUB_FAIL_CHATS: '111'});
  assert.equal(r2.status, 0);
  assert.deepEqual(curlCalls(sb).filter(c => c.text.includes('DEPLOY-FAIL')).map(c => c.chat), ['111', '222']);
  const log = read(sb.alertsLog);
  assert.match(log, /NOTIFY-ERR recipient=111 Forbidden: bot can't initiate conversation with a user/);
  assert.doesNotMatch(log, new RegExp(FAKE_TOKEN));
});

test('without token or chat id nothing is sent, only logged', () => {
  const sb = setup({token: '', chat: ''});
  const r = run(sb, ALERTS, ['deploy-ok', 'staging@abc1234 live']);
  assert.equal(r.status, 0);
  assert.equal(curlCalls(sb).length, 0);
  assert.match(read(sb.alertsLog), /DEPLOY-OK staging@abc1234 live/);
});

test('long messages are clipped to the Telegram limit without breaking UTF-8', () => {
  const sb = setup({chat: '111'});
  const long = 'Збій збірки ✖ '.repeat(900);
  const r = run(sb, ALERTS, ['deploy-failed', long]);
  assert.equal(r.status, 0);
  const [call] = curlCalls(sb);
  assert.ok([...call.text].length <= 4096, `length ${[...call.text].length}`);
  assert.ok(call.text.endsWith('[...truncated]'));
  assert.ok(!call.text.includes('�'));
});

test('secrets in the output never reach Telegram or alerts.log', () => {
  const sb = setup({chat: '111'});
  const secrets = [
    FAKE_TOKEN,
    'Authorization: Bearer abcdef0123456789abcdef',
    'WFP_SECRET_KEY=hunter2hunter2hunter2',
    'webhook_url: https://hooks.example.com/services/T000/B000/XXXXXXXX',
    'https://deploy:pa55w0rd@example.com/repo.git',
    're_1234567890abcdefghij',
    'ghp_abcdefghijklmnopqrstuvwxyz0123456789',
    'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.abcdefghijk'
  ];
  const keep = 'commit 58055bdcc73787eb88c78d36f0b4939e9c5dc1c3ad17e25cc85a6833cf1a0cab stays visible';
  const r = run(sb, ALERTS, ['deploy-failed', `${secrets.join('\n')}\n${keep}`]);
  assert.equal(r.status, 0);
  const [call] = curlCalls(sb);
  for (const secret of [FAKE_TOKEN, 'abcdef0123456789abcdef', 'hunter2hunter2hunter2', 'XXXXXXXX', 'pa55w0rd', '1234567890abcdefghij', 'abcdefghijklmnopqrstuvwxyz0123456789', 'eyJzdWIiOiIxMjM0NTY3ODkwIn0']) {
    assert.ok(!call.text.includes(secret), `leaked ${secret}`);
    assert.ok(!read(sb.alertsLog).includes(secret), `leaked into log ${secret}`);
  }
  assert.ok(call.text.includes(keep), 'hashes and commits are not secrets');
});

test('test command sends to every recipient and reports each one', () => {
  const sb = setup({chat: '111,222'});
  const r = run(sb, ALERTS, ['test']);
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(curlCalls(sb).map(c => c.chat), ['111', '222']);
  assert.match(r.stdout, /recipient 1 of 2 \(111\): sent/);
  assert.match(r.stdout, /recipient 2 of 2 \(222\): sent/);
  assert.match(r.stdout, /test alert sent to all 2 recipients/);
  assert.doesNotMatch(r.stdout + r.stderr, new RegExp(FAKE_TOKEN));
});

test('test command exits non-zero and names the recipient that was not reached', () => {
  const sb = setup({chat: '111,222'});
  const r = run(sb, ALERTS, ['test'], {STUB_FAIL_CHATS: '222'});
  assert.equal(r.status, 1);
  assert.match(r.stdout, /recipient 1 of 2 \(111\): sent/);
  assert.match(r.stdout, /recipient 2 of 2 \(222\): FAILED: Forbidden: bot can't initiate conversation with a user/);
  assert.match(r.stderr, /1 of 2 recipients NOT reached/);
});

test('add-recipient appends an id, keeps the token line and file mode, and never prints the token', () => {
  const sb = setup({chat: '111'});
  chmodSync(sb.envFile, 0o600);
  writeFileSync(sb.envFile, `# comment\nTG_BOT_TOKEN=${FAKE_TOKEN}\nTG_CHAT_ID=111\nOTHER=keep\n`);
  const r = run(sb, ALERTS, ['add-recipient', '866959919']);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(readFileSync(sb.envFile, 'utf8'), `# comment\nTG_BOT_TOKEN=${FAKE_TOKEN}\nTG_CHAT_ID=111,866959919\nOTHER=keep\n`);
  assert.equal(statSync(sb.envFile).mode & 0o777, 0o600);
  assert.doesNotMatch(r.stdout + r.stderr, new RegExp(FAKE_TOKEN));
  assert.match(r.stdout, /list: 111,866959919/);
});

test('add-recipient is idempotent and handles empty or missing TG_CHAT_ID', () => {
  const sb = setup({chat: '111,866959919'});
  let r = run(sb, ALERTS, ['add-recipient', '866959919']);
  assert.equal(r.status, 0);
  assert.match(r.stdout, /already present/);
  assert.match(readFileSync(sb.envFile, 'utf8'), /^TG_CHAT_ID=111,866959919$/m);

  writeFileSync(sb.envFile, `TG_BOT_TOKEN=${FAKE_TOKEN}\nTG_CHAT_ID=\n`);
  r = run(sb, ALERTS, ['add-recipient', '5']);
  assert.match(readFileSync(sb.envFile, 'utf8'), /^TG_CHAT_ID=5$/m);

  writeFileSync(sb.envFile, `TG_BOT_TOKEN=${FAKE_TOKEN}\n`);
  r = run(sb, ALERTS, ['add-recipient', '7']);
  assert.match(readFileSync(sb.envFile, 'utf8'), /^TG_CHAT_ID=7$/m);
  assert.match(readFileSync(sb.envFile, 'utf8'), new RegExp(`^TG_BOT_TOKEN=${FAKE_TOKEN}$`, 'm'));
});

test('add-recipient rejects anything that is not a numeric id', () => {
  const sb = setup({chat: '111'});
  const before = readFileSync(sb.envFile, 'utf8');
  for (const bad of ['', 'abc', '12;rm -rf /', '1 2']) {
    const r = run(sb, ALERTS, bad === '' ? ['add-recipient'] : ['add-recipient', bad]);
    assert.equal(r.status, 2, bad);
  }
  assert.equal(readFileSync(sb.envFile, 'utf8'), before);
});

test('failure-report for a red test names the step, test, file:line and error', () => {
  const sb = setup({chat: '111'});
  const log = `${sb.root}/build.log`;
  const output = readFileSync(fixture('node-test-failure.out'), 'utf8');
  writeFileSync(log, `##VDALO-STEP docker build\n#1 [internal] load build definition\n##VDALO-STEP tests\n${output}`);
  const r = run(sb, ALERTS, ['failure-report', 'tests', log, 'build/test failed on staging@d279e05 (PR #105)']);
  assert.equal(r.status, 0, r.stderr);
  const text = r.stdout;
  assert.match(text, /^build\/test failed on staging@d279e05 \(PR #105\)\nstep: tests\nfailed tests:\n/);
  assert.match(text, /✖ public resource library exposes exactly 18 allowlisted files with the packaged bytes\n  tests\/tool-calculations\.test\.mjs:82\n  AssertionError \[ERR_ASSERTION\]: frontdesk_shift\.txt/);
  assert.match(text, /\n  \+ 'b3f7a0c1/, 'the actual/expected hashes help to tell CRLF from LF');
  assert.match(text, /last 30 lines:\n/);
  assert.doesNotMatch(text, /##VDALO-STEP/);
  const tail = text.split('last 30 lines:\n')[1].trimEnd().split('\n');
  assert.ok(tail.length <= 30, `tail has ${tail.length} lines`);
  assert.ok([...text].length <= 4000);
});

test('failure-report for other steps shows step and tail only', () => {
  const sb = setup({chat: '111'});
  const log = `${sb.root}/smoke.log`;
  writeFileSync(log, 'ok    GET /  200 12000\nFAIL  GET /tourist-tax/  500 120 text/html\n');
  const r = run(sb, ALERTS, ['failure-report', 'smoke', log, 'staging failed (smoke on d279e05)']);
  assert.equal(r.stdout, 'staging failed (smoke on d279e05)\nstep: smoke\nlast 2 lines:\nok    GET /  200 12000\nFAIL  GET /tourist-tax/  500 120 text/html\n');
  assert.doesNotMatch(r.stdout, /failed tests:/);
});

test('failure-report stays within the limit for huge, dirty output and strips secrets', () => {
  const sb = setup({chat: '111'});
  const log = `${sb.root}/huge.log`;
  const lines = [];
  for (let i = 0; i < 6000; i++) lines.push(`#${i} RUN step ${i} \x1b[31mcolored\x1b[0m ${'x'.repeat(i % 400)}`);
  lines.push(`TG_BOT_TOKEN=${FAKE_TOKEN}`, `npm ERR! token: ${FAKE_TOKEN}`, 'Помилка збірки: не вдалося ✖');
  writeFileSync(log, Buffer.concat([Buffer.from(`##VDALO-STEP docker build\n${lines.join('\n')}\n`), Buffer.from([0xff, 0xfe, 0x0a])]));
  const r = run(sb, ALERTS, ['failure-report', 'docker build', log, 'build/test failed on main@abc1234']);
  assert.equal(r.status, 0, r.stderr);
  assert.ok([...r.stdout].length <= 4000, `length ${[...r.stdout].length}`);
  assert.doesNotMatch(r.stdout, new RegExp(FAKE_TOKEN));
  assert.doesNotMatch(r.stdout, /\x1b/);
  assert.ok(!r.stdout.includes('�'));
  assert.match(r.stdout, /Помилка збірки: не вдалося ✖/);
});

test('failure-report with a missing or empty log still produces a message', () => {
  const sb = setup({chat: '111'});
  const r = run(sb, ALERTS, ['failure-report', 'build did not start', `${sb.root}/nope.log`, 'build/test failed on staging@abc1234']);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /step: build did not start\nlast 0 lines:\n\(no output captured\)/);
});
