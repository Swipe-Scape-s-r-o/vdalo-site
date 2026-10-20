import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const css=readFileSync(fileURLToPath(new URL('../qr-lab/src/style.css',import.meta.url)),'utf8');

test('QR Studio download controls use shrinkable columns and stack on phones',()=>{
  assert.match(css,/\.download-actions\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)\}/);
  assert.match(css,/@media\(max-width:680px\)[\s\S]*?\.download-actions\{grid-template-columns:minmax\(0,1fr\)\}/);
  assert.match(css,/\.download-button\{min-width:0\}/);
});

test('QR Studio mobile header allows context to shrink without pushing the site link offscreen',()=>{
  assert.match(css,/@media\(max-width:680px\)[\s\S]*?\.site-header\{padding-inline:12px;gap:8px\}/);
  assert.match(css,/\.header-context\{flex:1;min-width:0;justify-content:center;overflow:hidden;white-space:nowrap\}/);
  assert.match(css,/\.header-link\{flex:0 0 auto;width:auto;max-width:84px;overflow:hidden;white-space:nowrap\}/);
});
