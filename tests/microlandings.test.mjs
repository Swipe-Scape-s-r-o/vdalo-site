import test from 'node:test';
import assert from 'node:assert/strict';
import {Readable} from 'node:stream';
import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {offers} from '../microlandings/content.mjs';
import {renderMicrolanding,renderDirectory,effective} from '../microlandings/render.mjs';
import {experiments} from '../microlandings/config.mjs';
import {validateRequest,makePayload,handleFunnelLead} from '../microlandings/leads.mjs';

const valid=id=>({offer_id:id,name:'Тестовий учасник',property:'Тестовий готель',contact:'qa@example.invalid',rooms:'12',current_pms:'Тестова PMS',role:'owner',selected_process:'guest-requests',property_type:'hotel',pms_usage:'pms',pms_satisfaction:'mixed',consent:true});
async function withEnvironment(configured,work){
 const keys=[...new Set([...Object.keys(process.env).filter(key=>key.startsWith('VDALO_FUNNEL_')),'VDALO_FUNNEL_WEBHOOK_URL','VDALO_FUNNEL_LEGAL_NAME','VDALO_FUNNEL_PRIVACY_EMAIL','VDALO_FUNNEL_RETENTION'])];
 const saved=keys.map(key=>process.env[key]);keys.forEach(key=>delete process.env[key]);
 if(configured)Object.assign(process.env,{VDALO_FUNNEL_WEBHOOK_URL:'https://receiver.example.invalid/leads',VDALO_FUNNEL_LEGAL_NAME:'Тестовий оператор',VDALO_FUNNEL_PRIVACY_EMAIL:'privacy@example.invalid',VDALO_FUNNEL_RETENTION:'Тестовий строк'});
 try{return await work();}finally{keys.forEach((key,i)=>{if(saved[i]===undefined)delete process.env[key];else process.env[key]=saved[i];});}
}
async function request(body,sendRequest,headers={}){
 const req=Readable.from([JSON.stringify(body)]);req.method='POST';req.headers={'content-type':'application/json',origin:'https://www.vdalo.tech',host:'www.vdalo.tech',...headers};req.socket={remoteAddress:'192.0.2.45'};
 let status,output;const res={writeHead(code){status=code;},end(value){output=JSON.parse(value);}};
 await handleFunnelLead(req,res,{sendRequest});return {status,output};
}
for(const offer of offers){
 test(`${offer.id}: unique image and valid form markup`,async()=>withEnvironment(false,async()=>{
  const html=renderMicrolanding(offer);
  assert.ok(html.includes(`/v3/assets/ml-${offer.id}-v2.webp`));
  assert.ok(existsSync(fileURLToPath(new URL(`../versions/v3/public/assets/${offer.image}`,import.meta.url))));
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]);assert.equal(ids.length,new Set(ids).size);
  assert.ok(html.includes('Перевірити форму'));assert.ok(html.includes('data-ready="false"'));
  assert.equal((html.match(/<h1\b/g)||[]).length,1);assert.ok(!html.includes('\u2014'));
 assert.equal(Object.keys(validateRequest(valid(offer.id)).errors).length,0);
  assert.ok(html.indexOf('ml-results')<html.indexOf('ml-how'));
  assert.equal((html.match(/data-primary/g)||[]).length,3);
  assert.ok(html.includes('copy_version'));
 }));
 test(`${offer.id}: unavailable delivery never reports success`,async()=>withEnvironment(false,async()=>{
  const result=await request(valid(offer.id),()=>{throw new Error('Must not send');});assert.equal(result.status,503);assert.equal(result.output.ok,false);
 }));
 test(`${offer.id}: success only after receiver acknowledgement`,async()=>withEnvironment(true,async()=>{
  let captured;
  const result=await request(valid(offer.id),async(url,options)=>{assert.equal(url,'https://receiver.example.invalid/leads');captured=JSON.parse(options.body);return new Response(JSON.stringify({ok:true}),{status:200});});
  assert.equal(result.status,200);assert.equal(result.output.ok,true);assert.equal(captured.offer_id,offer.id);assert.equal(captured.landing_route,offer.route);assert.equal(captured.stage,'NEW');assert.equal(captured.qualification.room_count,12);assert.equal(result.output.leadId,captured.lead_id);
 }));
 test(`${offer.id}: receiver failure never reports success`,async()=>withEnvironment(true,async()=>{
  const result=await request(valid(offer.id),async()=>({ok:false,body:{async cancel(){}}}));assert.equal(result.status,502);assert.equal(result.output.ok,false);
 }));
}
test('required fields and invalid contact are rejected for every offer',()=>{
 offers.forEach(offer=>{
  const empty=validateRequest({offer_id:offer.id});assert.ok(Object.keys(empty.errors).length>0);
  const invalid=validateRequest({...valid(offer.id),contact:'not a contact'});assert.ok(invalid.errors.contact);
 });
});
test('commercial values do not activate unapproved experiments',()=>{
 const saved={...experiments};
 try{
  Object.assign(experiments,{trialDays:14,researchIncentiveDays:30,researchIncentiveMonths:1,switchFreeMonthEnabled:true});
  for(const id of ['trial','research','switch'])assert.equal(effective(offers.find(o=>o.id===id)).bonus,undefined);
  experiments.researchIncentiveApproved=true;
  assert.ok(effective(offers.find(o=>o.id==='research')).headline.includes('Отримайте місяць'));
  experiments.trialApproved=true;assert.ok(effective(offers.find(o=>o.id==='trial')).bonus.includes('14'));
  experiments.switchCommercialApproved=true;assert.ok(effective(offers.find(o=>o.id==='switch')).bonus.includes('Перший місяць'));
 }finally{Object.assign(experiments,saved);}
});
test('public chooser includes every planned funnel exactly once',()=>{
 const html=renderDirectory();
 assert.equal((html.match(/class="directory-card"/g)||[]).length,offers.length);
 for(const offer of offers)assert.equal(html.split(`href="${offer.route}"`).length-1,1);
});
test('survey can be anonymous and does not grant general outreach permission',()=>{
 const raw={...valid('hotel-research'),name:'',property:'',contact:'',rooms:''};
 const {offer,data,errors}=validateRequest(raw);assert.deepEqual(errors,{});
 const payload=makePayload(offer,data,raw);assert.equal(payload.proposed_next_step,'research_only_no_outreach');assert.equal(payload.permissions.respond_to_request,false);assert.equal(payload.permissions.product_information,false);
 assert.ok(validateRequest({...raw,interview_interest:true}).errors.contact);
});
test('invalid rooms, PMS, role, consent and process are rejected',()=>{
 assert.ok(validateRequest({...valid('trial'),rooms:'0'}).errors.rooms);
 assert.ok(validateRequest({...valid('switch'),current_pms:'x'}).errors.current_pms);
 assert.ok(validateRequest({...valid('research'),role:'unknown'}).errors.role);
 assert.ok(validateRequest({...valid('one-process'),selected_process:'unknown'}).errors.selected_process);
 assert.ok(validateRequest({...valid('audit'),consent:false}).errors.consent);
});
test('foreign origin and oversized payload are rejected without receiver call',async()=>{
 const never=()=>{throw new Error('Must not send');};
 assert.equal((await request(valid('audit'),never,{origin:'https://other.example.invalid'})).status,403);
 assert.equal((await request({...valid('audit'),note:'x'.repeat(17000)},never)).status,413);
});
