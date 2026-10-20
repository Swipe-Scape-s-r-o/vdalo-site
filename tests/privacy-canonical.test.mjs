import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

test('privacy page keeps the production canonical on staging', () => {
  const script = [
    "import { privacyPage } from './versions/v1/server.mjs';",
    'const html = privacyPage();',
    "const canonical = html.match(/<link rel=\"canonical\" href=\"([^\"]+)\"/)?.[1];",
    "const ogUrl = html.match(/<meta property=\"og:url\" content=\"([^\"]+)\"/)?.[1];",
    "const schema = html.match(/<script type=\"application\\/ld\\+json\">([\\s\\S]*?)<\\/script>/)?.[1];",
    'console.log(JSON.stringify({ canonical, ogUrl, schema: JSON.parse(schema) }));',
  ].join('\n');
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', script], {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: { ...process.env, VDALO_SITE_URL: 'https://staging.vdalo.tech' },
  });

  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.canonical, 'https://www.vdalo.tech/privacy');
  assert.equal(output.ogUrl, 'https://www.vdalo.tech/privacy');
  assert.equal(output.schema.url, 'https://www.vdalo.tech/privacy');
});
