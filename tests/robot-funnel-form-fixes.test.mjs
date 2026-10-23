import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';

const client=await readFile(new URL('../microlandings/public/robot-funnels.js',import.meta.url),'utf8');
const styles=await readFile(new URL('../microlandings/public/robot-funnels.css',import.meta.url),'utf8');

test('email messages are Ukrainian and stale typo validity is cleared on submit',()=>{
 const emailError=runInNewContext(client.slice(client.indexOf(' function emailError('),client.indexOf(" form.querySelector('[name=email]').addEventListener('blur'"))+'emailError;');
 const input={value:'',validity:{typeMismatch:false},message:'',setCustomValidity(message){this.message=message;},get validationMessage(){throw Error('Browser-language messages must not be used');}};
 assert.equal(emailError(input),'Вкажіть email.');
 input.value='not-an-email';input.validity.typeMismatch=true;
 assert.match(emailError(input),/^Вкажіть коректний email/);
 input.validity.typeMismatch=false;input.value='name@localhost';
 assert.match(emailError(input),/^Вкажіть коректний email/);
 input.value='qa@gmail.con';assert.match(emailError(input),/qa@gmail\.com/);
 assert.ok(input.message);
 input.value='qa@example.invalid';assert.equal(emailError(input),'');assert.equal(input.message,'');
 assert.match(client,/const emailMessage=emailError\(form.elements.email\)/);
 assert.doesNotMatch(client,/\.validationMessage/);
});

test('open dialogs have explicit viewport positioning and a sticky close control for replay and mobile',()=>{
 assert.match(styles,/\.sheet\[open\]\{position:fixed;inset:0;z-index:1000\}/);
 assert.match(styles,/\.sheet-close-row\{position:sticky;top:-16px;z-index:2/);
 assert.match(styles,/@media\(max-width:699px\)\{\.sheet-close-row\{top:-12px/);
});
