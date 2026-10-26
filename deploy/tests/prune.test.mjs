import test from 'node:test';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import path from 'node:path';
import {read, run, sandbox, script, stub} from './helpers.mjs';

const PRUNE = script('vdalo-docker-prune.sh');
const hoursAgo = h => new Date(Date.now() - h * 3600e3).toISOString();

// Образи на «сервері»: ref, id, вік у годинах. main-ok/staging-ok – last-ok; running – образ контейнера.
const IMAGES = [
  ['vdalo/site:main', 'sha256:aa', 400],
  ['vdalo/site:main-ok', 'sha256:aa', 400],
  ['vdalo/site:staging', 'sha256:bb', 10],
  ['vdalo/site:staging-ok', 'sha256:bb', 10],
  ['vdalo/site:staging-fail1', 'sha256:c1', 50],
  ['vdalo/site:staging-fail2', 'sha256:c2', 30],
  ['vdalo/site:main-old', 'sha256:e1', 480],
  ['vdalo/site:staging-building', 'sha256:f1', 0.5],
  ['vdalo/site:staging-running', 'sha256:g1', 200],
  ['vdalo/site:staging-agenone', 'sha256:h1', null]
];

function setup({images = IMAGES, lastOk = true} = {}) {
  const sb = sandbox();
  const tsv = path.join(sb.root, 'images.tsv');
  writeFileSync(tsv, images.map(([ref, id, h]) => [ref, id, h === null ? 'garbage' : hoursAgo(h), '412MB'].join('\t')).join('\n') + '\n');
  stub(sb, 'docker', `
echo "docker $*" >>"$STUB_DOCKER_LOG"
case "$1 $2" in
  "image ls")
    if [[ "$*" == *dangling=true* ]]; then echo abc; echo def; exit 0; fi
    awk -F'\\t' '{print $1" "$2" "$4}' "$STUB_IMAGES_TSV";;
  "image inspect")
    field="$4"; ref="$5"
    awk -F'\\t' -v ref="$ref" -v f="$field" '$1==ref { found=1; if (f ~ /Id/) print $2; else print $3 } END { exit found ? 0 : 1 }' "$STUB_IMAGES_TSV";;
  "image rm") echo "Untagged: $3";;
  "image prune") echo "Total reclaimed space: 1GB";;
  "buildx prune") echo "Total: 2GB";;
  "system df") echo "TYPE TOTAL ACTIVE SIZE RECLAIMABLE";;
  "ps -aq") echo c1; echo c2;;
  "inspect -f") echo "/vdalo-site-staging sha256:g1"; echo "/vdalo-site sha256:aa";;
esac
exit 0`);
  if (lastOk) {
    writeFileSync(path.join(sb.state, 'last-ok-main'), 'ok\n');
    writeFileSync(path.join(sb.state, 'last-ok-staging'), 'ok\n');
  }
  sb.env = {STUB_IMAGES_TSV: tsv};
  return sb;
}

const removed = sb => [...read(sb.dockerLog).matchAll(/^docker image rm (\S+)$/gm)].map(m => m[1]).sort();
const PROTECTED = ['vdalo/site:main', 'vdalo/site:main-ok', 'vdalo/site:staging', 'vdalo/site:staging-ok', 'vdalo/site:staging-building', 'vdalo/site:staging-running', 'vdalo/site:staging-agenone'];

test('dry-run shows the plan and deletes nothing', () => {
  const sb = setup();
  const r = run(sb, PRUNE, ['--days', '1', '--dry-run'], sb.env);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /REMOVE {2}vdalo\/site:staging-fail1 /);
  assert.match(r.stdout, /REMOVE {2}vdalo\/site:staging-fail2 /);
  assert.match(r.stdout, /REMOVE {2}vdalo\/site:main-old /);
  assert.match(r.stdout, /will remove 3 tagged image\(s\)/);
  assert.match(r.stdout, /dry-run: nothing was deleted/);
  assert.doesNotMatch(read(sb.dockerLog), /image rm|prune/);
});

test('main, staging, last-ok, running, too-young and unknown-age images are never removed', () => {
  const sb = setup();
  const r = run(sb, PRUNE, ['--days', '0'], sb.env);
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(removed(sb), ['vdalo/site:main-old', 'vdalo/site:staging-fail1', 'vdalo/site:staging-fail2']);
  for (const ref of PROTECTED) assert.match(r.stdout, new RegExp(`KEEP {4}${ref.replace(/[/.]/g, '\\$&')} `), ref);
  assert.match(r.stdout, /vdalo\/site:staging-running {2}used by container vdalo-site-staging/);
  assert.match(r.stdout, /vdalo\/site:staging-building {2}younger than 2h/);
  assert.match(r.stdout, /vdalo\/site:staging-agenone {2}age unknown/);
  assert.match(r.stdout, /vdalo\/site:main-ok {2}last-ok main/);
});

test('the age limit decides: with 3 days only the images older than 72h go', () => {
  const sb = setup();
  run(sb, PRUNE, ['--days', '3'], sb.env);
  assert.deepEqual(removed(sb), ['vdalo/site:main-old']);
});

test('nightly mode (no flags) cleans images, dangling images and build cache with the same age filter', () => {
  const sb = setup();
  const r = run(sb, PRUNE, [], {...sb.env, VDALO_PRUNE_DAYS: '1'});
  assert.equal(r.status, 0, r.stderr);
  const docker = read(sb.dockerLog);
  assert.deepEqual(removed(sb), ['vdalo/site:main-old', 'vdalo/site:staging-fail1', 'vdalo/site:staging-fail2']);
  assert.match(docker, /^docker image prune --force --filter until=24h$/m);
  assert.match(docker, /^docker buildx prune --force --filter until=24h$/m);
  assert.match(r.stdout, /disk after:/);
});

test('--ask without a terminal refuses and deletes nothing', () => {
  const sb = setup();
  const r = run(sb, PRUNE, ['--days', '0', '--ask'], sb.env);
  assert.equal(r.status, 3);
  assert.match(r.stderr, /needs a terminal/);
  assert.match(r.stdout, /REMOVE {2}vdalo\/site:staging-fail1/, 'the plan is still shown first');
  assert.doesNotMatch(read(sb.dockerLog), /image rm|prune/);
});

test('--ask shows the plan first and deletes only after y', () => {
  let sb = setup();
  let r = run(sb, PRUNE, ['--days', '0', '--ask'], {...sb.env, VDALO_TEST_ASK_STDIN: '1'}, 'n\n');
  assert.equal(r.status, 0);
  assert.match(r.stdout, /cancelled, nothing was deleted/);
  assert.doesNotMatch(read(sb.dockerLog), /image rm|prune/);

  sb = setup();
  r = run(sb, PRUNE, ['--days', '0', '--ask'], {...sb.env, VDALO_TEST_ASK_STDIN: '1'}, 'y\n');
  assert.equal(r.status, 0, r.stderr);
  assert.ok(r.stdout.indexOf('REMOVE') < r.stdout.indexOf('removed vdalo/site:'), 'plan precedes deletion');
  assert.deepEqual(removed(sb), ['vdalo/site:main-old', 'vdalo/site:staging-fail1', 'vdalo/site:staging-fail2']);
});

test('without any last-ok state no tagged image is touched, only dangling images and cache', () => {
  const sb = setup({lastOk: false});
  const r = run(sb, PRUNE, ['--days', '0'], sb.env);
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(removed(sb), []);
  assert.match(r.stdout, /no last-ok state/);
  assert.match(read(sb.dockerLog), /buildx prune/);
});

test('a protected tag also protects other tags of the same image', () => {
  const sb = setup({images: [['vdalo/site:main', 'sha256:aa', 400], ['vdalo/site:main-alias', 'sha256:aa', 400], ['vdalo/site:main-ok', 'sha256:aa', 400]]});
  const r = run(sb, PRUNE, ['--days', '0'], sb.env);
  assert.deepEqual(removed(sb), []);
  assert.match(r.stdout, /vdalo\/site:main-alias {2}same image as /);
});

test('invalid arguments are rejected before anything runs', () => {
  const sb = setup();
  for (const args of [['--days', 'x'], ['--days'], ['--days', '-1'], ['--bogus']]) {
    const r = run(sb, PRUNE, args, sb.env);
    assert.equal(r.status, 2, args.join(' '));
  }
  assert.equal(read(sb.dockerLog), '');
});
