import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {renderPage} from '../versions/v1/render.mjs';
import {validateLead} from '../versions/v1/server.mjs';

const app=readFileSync(fileURLToPath(new URL('../versions/v1/public/app.js',import.meta.url)),'utf8');
const css=readFileSync(fileURLToPath(new URL('../versions/v1/public/refinement.css',import.meta.url)),'utf8');

test('header removes contact and trial actions while retaining the accessible contact dialog contract',()=>{
 const html=renderPage({origin:'https://www.vdalo.tech'});
 const header=html.match(/<header class="header">[\s\S]*?<\/header>/)?.[0]||'';
 assert.ok(header);
 assert.doesNotMatch(header,/data-contact-dialog-trigger|utm_content=header_(?:desktop|mobile)|mobile-audit|Спробувати безкоштовно|Зв’язатися/);
 assert.match(header,/class="header-login" href="https:\/\/app\.vdalo\.tech\/app\/login"/);
 assert.match(header,/class="mobile-login" href="https:\/\/app\.vdalo\.tech\/app\/login"/);
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
 assert.match(html,/<form data-kind="contact" method="post" action="\/api\/leads\/audit" novalidate>/);
 assert.match(app,/data-contact-dialog-trigger[\s\S]*?openContactDialog\(control\)/);
 assert.match(app,/const route=kind==='contact'\?'audit':kind/);
 const {data,errors}=validateLead('audit',{name:'Олена Готель',contact:'+380 67 123 45 67',consent:true});
 assert.deepEqual(errors,{});
 assert.equal(data.contact,'+380 67 123 45 67');
 assert.equal(data.kind,'audit');
});

test('lead forms never fall back to putting contact data in the page URL',()=>{
 const html=renderPage({origin:'https://www.vdalo.tech',full:true});
 assert.match(html,/<form data-kind="contact" method="post" action="\/api\/leads\/audit" novalidate>/);
 assert.match(html,/<form data-kind="audit" method="post" action="\/api\/leads\/audit" data-mode="start" novalidate>/);
 assert.match(html,/<form data-kind="trial" method="post" action="\/api\/leads\/trial" data-mode="start" novalidate>/);
 assert.match(app,/form\.addEventListener\('submit',async event=>\{\s*event\.preventDefault\(\)/);
});

test('contact modal receiver rejects an invalid number or missing consent',()=>{
 const {errors}=validateLead('audit',{name:'Олена',contact:'123',consent:false});
 assert.ok(errors.contact);
 assert.ok(errors.consent);
});

test('callback form requires a phone number and keeps the contact intent for the existing receiver',()=>{
 const rejected=validateLead('audit',{form_kind:'contact',name:'Олена',contact:'olena@example.com',consent:true});
 assert.equal(rejected.errors.contact,'Вкажіть коректний номер телефону.');
 const accepted=validateLead('audit',{form_kind:'contact',name:'Олена',contact:'+380 67 123 45 67',consent:true});
 assert.deepEqual(accepted.errors,{});
 assert.equal(accepted.data.kind,'audit');
 assert.equal(accepted.data.form_kind,'contact');
});

test('contact modal restores focus and keeps truthful server-confirmed success behavior',()=>{
 assert.match(app,/dialog\.addEventListener\('close',\(\)=>\{document\.body\.classList\.remove\('dialog-open'\);opener\?\.focus\(\);\}\)/);
 assert.match(app,/result\.ok!==true/);
 assert.match(app,/const route=kind==='contact'\?'audit':kind/);
 assert.match(app,/else if\(kind==='contact'\)[\s\S]*?Вкажіть коректний номер телефону/);
 assert.match(app,/form_kind:kind/);
});
