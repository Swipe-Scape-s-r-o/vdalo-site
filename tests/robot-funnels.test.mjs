import assert from 'node:assert/strict';
import {access,readFile} from 'node:fs/promises';
import path from 'node:path';
import {Readable} from 'node:stream';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {renderRobotFunnel,robotFunnelAssetRoot,robotFunnelCodes} from '../microlandings/robot-funnels.mjs';
import {handleTop5Lead} from '../microlandings/top5-leads.mjs';

const expectedCodes=['q1','q1b','q2','q3','q4','q4b','q5','q6','q7','q7b','q8','q9','q10'];
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));

test('all robot funnels render with lean property and contact fields, no city or setup discount',async()=>{
 assert.deepEqual([...robotFunnelCodes].sort(),[...expectedCodes].sort());
 for(const code of expectedCodes){
  const html=await renderRobotFunnel(code,new URLSearchParams());
  const form=html.slice(html.indexOf('<dialog'),html.indexOf('</dialog>')+9);
  assert.match(html,/<meta name="robots" content="noindex,nofollow">/,code);
  assert.match(form,/name="hotel"/,code);
  assert.match(form,/name="name"/,code);
  assert.match(form,/name="email"/,code);
  assert.match(form,/name="phone"/,code);
  assert.doesNotMatch(form,/name="location"|Місто|Тип об’єкта|Кількість номерів/,code);
  assert.doesNotMatch(html,/безкоштовне налаштування|налаштування безкоштовно/i,code);
  if(['q6','q9'].includes(code))assert.match(html,/За бажанням оберіть відповіді/);
 }
});

test('video assets referenced by the manifest exist and support accessible, reduced-motion playback',async()=>{
 const manifest=JSON.parse(await readFile(path.join(robotFunnelAssetRoot,'videos.json'),'utf8'));
 for(const item of manifest){
  for(const file of Object.values(item.files))await access(path.join(robotFunnelAssetRoot,file));
 }
 const q1=await renderRobotFunnel('q1',new URLSearchParams());
 assert.match(q1,/<video[^>]*controls[^>]*>/);
 assert.doesNotMatch(q1,/<video[^>]*autoplay/);
 assert.doesNotMatch(q1,/<video[^>]*loop/);
 const client=await readFile(path.join(root,'microlandings','public','robot-funnels.js'),'utf8');
 assert.match(client,/prefers-reduced-motion: reduce/);
 assert.match(client,/video_complete/);
 assert.match(client,/if\(!success\.hidden\)\{step1\.hidden=true;step2\.hidden=true;return;\}/);
});

test('robot funnel analytics includes page context and excludes visitor-entered answers',async()=>{
 const client=await readFile(path.join(root,'microlandings','public','robot-funnels.js'),'utf8');
 assert.match(client,/page_path:location\.pathname,page_title:document\.title/);
 assert.match(client,/send\('form_step1_done'\)/);
 assert.match(client,/send\('questions_done',\{answer_count:2\}\)/);
 assert.match(client,/send\('calc_result',\{calculator_type:'tourist_tax'\}\)/);
 assert.doesNotMatch(client,/send\('form_step1_done',\{property_name:/);
 assert.doesNotMatch(client,/send\('questions_done',\{answers:/);
 assert.doesNotMatch(client,/send\('calc_result',\{calculator:/);
});

test('robot funnel accepts only object name and contact, then sends a captured lead with Callo attribution',async()=>{
 const request=Readable.from([JSON.stringify({
  name:'Тест',email:'qa@example.com',phone:'+380501234567',hotel:'Тестова садиба',contact_method:'phone',consent:true,
  funnel:'overbook',source:'sms',code:'q1',page_format:'video',submission_stage:'details_complete',
  submission_id:'b1bf0352-0379-4f04-9fc4-f96d6b918736',t:'callo-token',
 })]);
 request.method='POST';request.headers={'content-type':'application/json',host:'localhost'};request.socket={remoteAddress:'robot-funnel-test'};
 let status,response,payload;
 const res={writeHead(code){status=code;},end(body){response=JSON.parse(body);}};
 await handleTop5Lead(request,res,{
  env:{VDALO_TRIAL_WEBHOOK_URL:'https://receiver.example.invalid/leads'},
  sendRequest:async(_url,options)=>{payload=JSON.parse(options.body);return {ok:true,body:{async cancel(){}}};},
 });
 assert.equal(status,200);
 assert.equal(response.ok,true);
 assert.equal(payload.event_type,'lead_captured');
 assert.equal(payload.source_system,'vdalo-robot-funnels');
 assert.equal(payload.contact.hotel_name,'Тестова садиба');
 assert.equal(payload.attribution.contact_tag,'callo-token');
 assert.equal('location' in payload.contact,false);
 assert.equal('property_type' in payload.contact,false);
 assert.equal('room_range' in payload.contact,false);
});
