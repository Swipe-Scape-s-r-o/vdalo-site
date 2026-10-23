import test from 'node:test';
import assert from 'node:assert/strict';
import {Readable} from 'node:stream';
import {randomUUID} from 'node:crypto';
import {handleTop5Lead} from '../microlandings/top5-leads.mjs';
import {renderRobotFunnel,robotFunnelRoutes} from '../microlandings/robot-funnels.mjs';
import {resolveLeadDestination,sendAcknowledgedLead} from '../microlandings/legacy-delivery.mjs';
import {parseSiteIntake,intakeEventText} from './fixtures/deployed-crm-intake-20261018.mjs';
process.env.VERCEL='1';
const {lead}=await import('../versions/v1/server.mjs');
const endpoint='https://receiver.example.invalid/api/public/vdalo/leads';
const legacyEnv={VDALO_FUNNEL_WEBHOOK_URL:endpoint,VDALO_FUNNEL_WEBHOOK_TOKEN:'legacy-test-token'};
const email='qa@example.com',phone='+380501234567';
const base={name:'QA Перевірка',email,phone,hotel:'QA Об’єкт',consent:true,contact_method:'telegram',source:'sms',submission_stage:'details_complete'};
let ip=0;
function req(body){const r=Readable.from([JSON.stringify(body)]);r.method='POST';r.headers={'content-type':'application/json',host:'localhost'};r.socket={remoteAddress:`compat-${++ip}`};return r;}
async function call(handler,body,env=legacyEnv){
 let status,result,wire,intake,headers;
 const res={writeHead(s){status=s;},end(s){result=JSON.parse(s);}};
 const sendRequest=async(url,options)=>{assert.equal(url,endpoint);headers=options.headers;wire=JSON.parse(options.body);intake=parseSiteIntake(wire,headers['Idempotency-Key']);return new Response(JSON.stringify({ok:true,lead_id:'crm-test'}),{status:200});};
 await handler(req(body),res,{env,sendRequest});return{status,result,wire,intake,headers};
}
for(const [slug,code] of robotFunnelRoutes){
 test(`/${slug}: all form fields reach the deployed CRM contract`,async()=>{
  const html=await renderRobotFunnel(code,new URLSearchParams());
  const config=JSON.parse(html.match(/<script[^>]*id="funnel-config"[^>]*>([\s\S]*?)<\/script>/)[1]);
  const answers={rooms:'13-40',preferred_time:'tomorrow_morning',contact_method:'telegram'};
  const out=await call(handleTop5Lead,{...base,code,funnel:config.funnel,page_format:config.format,submission_id:randomUUID(),entry_page:`/${slug}`,answers,t:'private-callo-test',utm_source:'qa',utm_campaign:'restoration'});
  assert.equal(out.status,200);assert.equal(out.result.ok,true);
  assert.equal(out.headers.Authorization,'Bearer legacy-test-token');
  assert.equal(out.headers['Idempotency-Key'],out.wire.lead_id);
  assert.equal(out.intake.name,base.name);assert.equal(out.intake.phone,phone);assert.equal(out.intake.hotelName,base.hotel);
  assert.equal(out.intake.page,`/${slug}`);assert.equal(out.intake.utm.utm_campaign,'restoration');
  assert.ok(intakeEventText(out.intake,false).includes(email),'secondary email must be visible in the CRM timeline');
  assert.ok(intakeEventText(out.intake,false).includes('telegram'));
  assert.deepEqual(out.intake.details.quiz_answers.form_fields.answers,answers);
  assert.equal(out.intake.details.quiz_answers.form_fields.contact.email,email);
  assert.equal(out.intake.details.quiz_answers.form_fields.attribution.contact_tag,'private-callo-test');
  assert.equal(out.intake.wantsTrial,config.funnel!=='tourist_tax');
 });
}
test('email capture and enrichment remain separate idempotent events on one email contact',async()=>{
 const id=randomUUID();
 const start={email,consent:true,source:'website',funnel:'staff',submission_id:id,submission_stage:'email_capture'};
 const first=await call(handleTop5Lead,start),retry=await call(handleTop5Lead,start);
 assert.equal(first.status,200);assert.equal(first.intake.email,email);assert.equal(first.wire.lead_id,retry.wire.lead_id);
 const full=await call(handleTop5Lead,{...base,source:'website',funnel:'staff',submission_id:id,location:'Київ',property_type:'hotel',rooms:'1-12',hotel_count:'1',pms:'QA PMS'});
 assert.equal(full.status,200);assert.notEqual(full.wire.lead_id,first.wire.lead_id);
 assert.equal(full.intake.email,first.intake.email);assert.equal(full.intake.phone,phone);
 assert.equal(full.intake.details.quiz_answers.form_fields.contact.name,base.name);
 assert.equal(full.intake.details.quiz_answers.form_fields.contact.current_pms,'QA PMS');
});
for(const kind of ['contact','audit','trial']){
 test(`main ${kind}: original reader receives contacts, details and stable retry ID`,async()=>{
  const body={name:base.name,property:base.hotel,contact:phone,email,phone,city:'Київ',property_type:'hotel',units:'12',pms:'QA PMS',pain:'Потрібне ручне підключення',estimate:'Тест 14 днів',consent:true,form_kind:kind,submission_id:randomUUID()};
  const handler=(req,res,options)=>lead(req,res,kind==='contact'?'audit':kind,options);
  const out=await call(handler,body),retry=await call(handler,body);
  assert.equal(out.status,200);assert.equal(out.result.ok,true);assert.equal(out.wire.id,retry.wire.id);
  assert.equal(out.intake.name,base.name);assert.equal(out.intake.phone,phone);
  assert.ok(intakeEventText(out.intake,false).includes(email));assert.ok(intakeEventText(out.intake,false).includes('Київ'));
 });
}
test('no success for HTTP 200 with an explicit rejection or non-JSON body',async()=>{
 const destination={endpoint,token:'test'},payload={lead_id:randomUUID()};
 assert.equal(await sendAcknowledgedLead(destination,payload,{sendRequest:async()=>new Response(JSON.stringify({ok:false}),{status:200})}),false);
 await assert.rejects(sendAcknowledgedLead(destination,payload,{sendRequest:async()=>new Response('<html>Login</html>',{status:200})}));
});
test('each fallback uses the token belonging to that destination and never exposes it to the client',()=>{
 assert.deepEqual(resolveLeadDestination('trial',legacyEnv),{endpoint,token:'legacy-test-token'});
 assert.equal(resolveLeadDestination('trial',{VDALO_TRIAL_WEBHOOK_URL:endpoint,VDALO_WEBHOOK_BEARER_TOKEN:'normal',...legacyEnv}).token,'normal');
 assert.equal(resolveLeadDestination('trial',{}),null);
 assert.throws(()=>resolveLeadDestination('trial',{VDALO_TRIAL_WEBHOOK_URL:'http://public.example.invalid',NODE_ENV:'production'}));
});
test('invalid form data and missing consent never call the receiver',async()=>{
 for(const changed of [{consent:false},{email:'bad'},{phone:'bad'},{name:''},{hotel:''}]){
  let status;await handleTop5Lead(req({...base,code:'q9',page_format:'questions',funnel:'staff',submission_id:randomUUID(),...changed}),{writeHead(s){status=s;},end(){}},{env:legacyEnv,sendRequest:async()=>{throw new Error('invalid data must not be sent');}});assert.equal(status,422);
 }
});
test('commission calculator values survive the form and the deployed CRM parser',async()=>{
 const calculator={bookings_per_month:100,average_booking_uah:2000,commission_percent:15,months_per_year:12,annual_commission_uah:360000,direct_booking_example_uah:72000};
 const out=await call(handleTop5Lead,{...base,code:'q7',page_format:'video',funnel:'commission',submission_id:randomUUID(),answers:{calculator}});
 assert.equal(out.status,200);assert.deepEqual(out.intake.details.quiz_answers.form_fields.answers.calculator,calculator);
});
