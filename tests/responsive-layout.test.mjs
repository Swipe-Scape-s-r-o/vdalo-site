import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const css=readFileSync(fileURLToPath(new URL('../versions/v1/public/refinement.css',import.meta.url)),'utf8');

test('tablet homepage conversion actions align with copy instead of centering under it',()=>{
  assert.match(css,/\.ds2 \.hero-v3 \.hero-v2-actions\{align-items:flex-start;justify-content:flex-start\}/);
  assert.match(css,/@media\(min-width:768px\) and \(max-width:1199px\)\{[\s\S]*?\.ds2 \.hero-v3 \.hero-v2-actions\{align-items:flex-start;justify-content:flex-start\}/);
});

test('mobile hero CTA labels can wrap and stay within the viewport',()=>{
  assert.match(css,/@media\(max-width:767px\)\{[\s\S]*?\.ds2 \.hero-v3 \.hero-v2-actions>\.button:first-child\{width:100%;max-width:100%;white-space:normal\}/);
  assert.match(css,/\.ds2 \.hero-v3 \.hero-v2-actions>\.button:first-child>span\{white-space:normal;overflow-wrap:anywhere\}/);
  assert.match(css,/\.ds2 \.button\{box-sizing:border-box;max-inline-size:100%;min-inline-size:0\}/);
});

test('small phone overrides allow long CTA labels to wrap',()=>{
  assert.match(css,/@media\(max-width:380px\)\{[\s\S]*?\.ds2 \.hero-v3 \.hero-v2-actions>\.button:first-child\{[^}]*white-space:normal/);
});

test('mobile integrations and roles grids can shrink below their content minimum',()=>{
  assert.match(css,/@media\(max-width:767px\)\{[\s\S]*?\.ds2 \.integrations-layout,\.ds2 \.roles-layout\{grid-template-columns:minmax\(0,1fr\);gap:28px\}/);
});

test('role tabs fit a 320px viewport without forcing page overflow',()=>{
  assert.match(css,/@media\(max-width:380px\)\{[\s\S]*?\.ds2 \.role-tabs button\{min-width:0;gap:4px;padding-inline:4px;font-size:11px\}/);
});
