import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {Readable} from 'node:stream';
import {randomUUID} from 'node:crypto';
import {renderTouristTaxFunnel} from '../microlandings/tourist-tax-funnel.mjs';
import {handleTop5Lead} from '../microlandings/top5-leads.mjs';
import {parseSiteIntake} from './fixtures/deployed-crm-intake-20261018.mjs';

const phone='+380501234567';
const env={VDALO_LEAD_WEBHOOK_URL:'https://receiver.example.invalid/leads',VDALO_WEBHOOK_BEARER_TOKEN:'test-token'};
const base={phone,contact_method:'telegram',consent:true,funnel:'tourist_tax',source:'website',code:'tax-docs',entry_page:'/tourist-tax/kyyiv/',submission_id:randomUUID()};
let counter=0;
async function call(body,{receiverOk=true,configured=true}={}){
 const req=Readable.from([JSON.stringify(body)]);req.method='POST';req.headers={'content-type':'application/json',origin:'https://www.vdalo.tech',host:'www.vdalo.tech'};req.socket={remoteAddress:`tax-phone-qa-${++counter}`};
 let status,result,wire,intake,calls=0;
 await handleTop5Lead(req,{writeHead(value){status=value;},end(value){result=JSON.parse(value);}},{env:configured?env:{},sendRequest:async(url,options)=>{calls++;assert.equal(url,env.VDALO_LEAD_WEBHOOK_URL);wire=JSON.parse(options.body);intake=parseSiteIntake(wire,options.headers['Idempotency-Key']);return new Response(JSON.stringify({ok:receiverOk}),{status:200});}});
 return {status,result,wire,intake,calls};
}

test('rendered tax form preserves working phone regexes instead of losing template escapes',()=>{
 const html=renderTouristTaxFunnel(),script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
 new vm.Script(script);
 const stripLiteral=script.match(/phoneDigits=data\.phone\.replace\((\/[^,]+),''\)/)[1];
 const phoneLiteral=script.match(/if\(!((?:\/)[\s\S]+?)\.test\(data\.phone\)/)[1];
 const strip=vm.runInNewContext(stripLiteral),valid=vm.runInNewContext(phoneLiteral);
 for(const input of [phone,'+380 50 123 45 67','(050) 123-45-67']){assert.equal(valid.test(input),true);assert.ok(input.replace(strip,'').length>=9);}
 assert.equal(valid.test('not-a-phone'),false);
 assert.ok(script.includes('if(!response.ok||result.ok!==true)'));
 assert.ok(script.includes('data.submission_id=submissionId'));
 assert.match(html,/<form[^>]*id="ttf-form"[^>]*data-clarity-mask="true"/);
});

for(const code of ['tax-docs','tax-report'])test(`${code}: actual phone-only form reaches the existing CRM without invented email/name`,async()=>{
 const out=await call({...base,code,hotel:'QA об’єкт',location:'Київ',utm_source:'qa_forms'});
 assert.equal(out.status,200);assert.equal(out.result.ok,true);assert.equal(out.calls,1);
 assert.equal(out.wire.kind,'tourist_tax_inquiry');assert.equal('trial_days' in out.wire,false);
 assert.equal(out.intake.phone,phone);assert.equal(out.intake.email,null);assert.equal(out.intake.name,null);
 assert.equal(out.intake.hotelName,'QA об’єкт');assert.equal(out.intake.city,'Київ');
 assert.equal(out.intake.details.preferred_method,'telegram');assert.equal(out.intake.utm.utm_source,'qa_forms');
});

test('tax consultation accepts only phone + consent when optional fields are empty and preserves retry ID',async()=>{
 const first=await call(base),retry=await call(base);
 assert.equal(first.status,200);assert.equal(first.intake.hotelName,null);assert.equal(first.intake.city,null);
 assert.equal(first.wire.lead_id,retry.wire.lead_id);
});

test('phone-only exception cannot bypass consent, phone, provided email or other landing requirements',async()=>{
 for(const changed of [{consent:false},{phone:'bad'},{email:'bad'},{code:'unknown'},{source:'sms'},{code:'q3',page_format:'video'}]){
  const out=await call({...base,...changed});assert.equal(out.status,422);assert.equal(out.calls,0);
 }
});

test('phone-only tax form fails explicitly for missing channel or unacknowledged delivery',async()=>{
 const missing=await call(base,{configured:false});assert.equal(missing.status,503);assert.equal(missing.calls,0);
 const rejected=await call(base,{receiverOk:false});assert.equal(rejected.status,502);assert.equal(rejected.result.ok,false);
});
