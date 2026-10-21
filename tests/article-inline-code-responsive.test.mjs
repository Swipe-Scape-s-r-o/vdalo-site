import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const css=readFileSync(fileURLToPath(new URL('../versions/v1/public/blog.css',import.meta.url)),'utf8');

test('long inline code in articles can wrap instead of widening the mobile page',()=>{
  assert.match(css,/\.article-body code\{[^}]*overflow-wrap:anywhere/);
});
