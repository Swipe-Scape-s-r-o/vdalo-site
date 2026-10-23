import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {renderCalculator} from '../microlandings/top5.mjs';

test('all five calculator lead forms keep balanced wrappers and all controls inside the dialog',async()=>{
 for(let i=1;i<=5;i++){
  const html=await renderCalculator(new URLSearchParams(),`/k${i}`);
  const form=html.match(/<form\b[^>]*id="go-form"[\s\S]*?<\/form>/)?.[0];
  assert.ok(form);
  for(const tag of ['div','label','button'])assert.equal((form.match(new RegExp(`<${tag}\\b`,'g'))||[]).length,(form.match(new RegExp(`</${tag}>`,'g'))||[]).length,`/k${i}: balanced ${tag} elements`);
  assert.match(form,/<div class="go-field" role="group" aria-label="Кількість номерів або юнітів">/);
  for(const id of ['go-name','go-email','go-phone','go-pms','go-consent'])assert.ok(form.includes(`id="${id}"`));
  assert.match(form,/data-clarity-mask="true"/);
 }
});

test('delayed autofocus in both old form templates preserves focus when the visitor already started typing',async()=>{
 for(const name of ['video-template.html','calculator-template.html']){
  const html=await readFile(new URL(`../microlandings/top5/${name}`,import.meta.url),'utf8');
  assert.ok(html.includes('if (!sheet.contains(document.activeElement))'));
  assert.match(html,/<form id="go-form" data-clarity-mask="true" novalidate>/);
 }
});
