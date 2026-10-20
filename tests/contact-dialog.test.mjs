import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {renderPage} from '../versions/v1/render.mjs';
import {validateLead} from '../versions/v1/server.mjs';

const app=readFileSync(fileURLToPath(new URL('../versions/v1/public/app.js',import.meta.url)),'utf8');
const css=readFileSync(fileURLToPath(new URL('../versions/v1/public/refinement.css',import.meta.url)),'utf8');

test('contact CTA opens a short, accessible dialog from both desktop and mobile navigation',()=>{
 const html=renderPage({origin:'https://www.vdalo.tech'});
 assert.equal((html.match(/data-contact-dialog-trigger/g)||[]).length,2);
 assert.match(html,/<dialog id="contact-dialog" class="lead-dialog contact-dialog" aria-labelledby="contact-title">/);
 assert.match(html,/<label for="contact-name">Ваше ім’я \*<\/label>/);
 assert.match(html,/<label for="contact-phone">Номер телефону \*<\/label>/);
 assert.match(html,/<input id="contact-phone" name="contact" type="tel" autocomplete="tel" inputmode="tel"/);
 assert.match(html,/href="\/privacy" target="_blank" rel="noopener">Політика конфіденційності/);
 assert.match(html,/role="status" aria-live="polite"/);
 assert.match(css,/\.ds2 \.contact-dialog\{width:min\(500px,calc\(100% - 32px\)\)\}/);
});

test('contact modal sends a valid phone lead through the existing audit lead receiver',()=>{
 const html=renderPage({origin:'https://www.vdalo.tech'});
 assert.match(html,/<form data-kind="contact" novalidate>/);
 assert.match(app,/data-contact-dialog-trigger[\s\S]*?openContactDialog\(control\)/);
 assert.match(app,/const route=kind==='contact'\?'audit':kind/);
 const {data,errors}=validateLead('audit',{name:'Олена Готель',contact:'+380 67 123 45 67',consent:true});
 assert.deepEqual(errors,{});
 assert.equal(data.contact,'+380 67 123 45 67');
 assert.equal(data.kind,'audit');
});

test('contact modal receiver rejects an invalid number or missing consent',()=>{
 const {errors}=validateLead('audit',{name:'Олена',contact:'123',consent:false});
 assert.ok(errors.contact);
 assert.ok(errors.consent);
});

test('contact modal restores focus and keeps truthful server-confirmed success behavior',()=>{
 assert.match(app,/dialog\.addEventListener\('close',\(\)=>\{document\.body\.classList\.remove\('dialog-open'\);opener\?\.focus\(\);\}\)/);
 assert.match(app,/result\.ok!==true/);
 assert.match(app,/const route=kind==='contact'\?'audit':kind/);
});
