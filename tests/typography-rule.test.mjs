import test from 'node:test';
import assert from 'node:assert/strict';
import {readdirSync, readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoots = ['versions/v1', 'microlandings'];
const extensions = new Set(['.mjs', '.js', '.css', '.html']);

function collectSources(relativeDir) {
  const dir = path.join(root, relativeDir);
  return readdirSync(dir, {withFileTypes:true}).flatMap(entry => {
    const relativePath = path.join(relativeDir, entry.name);
    if (entry.isDirectory()) return collectSources(relativePath);
    return extensions.has(path.extname(entry.name)) ? [relativePath] : [];
  });
}

test('public website code does not use the long em dash character',()=>{
  const offenders = sourceRoots.flatMap(collectSources).filter(relativePath =>
    readFileSync(path.join(root, relativePath), 'utf8').includes('\u2014')
  );
  assert.deepEqual(offenders, [], `Replace the long dash with a hyphen, short dash, colon, or rewritten sentence: ${offenders.join(', ')}`);
});
