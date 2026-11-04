import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Readable} from 'node:stream';
import {randomUUID} from 'node:crypto';
import {renderFreeLanding} from '../microlandings/free.mjs';
import {getOffer,offers} from '../microlandings/content.mjs';
import {validateRequest,makePayload,handleFunnelLead} from '../microlandings/leads.mjs';
import {parseSiteIntake} from './fixtures/deployed-crm-intake-20261018.mjs';

test('free campaign renders five distinct variants at one canonical route without video',()=>{
 const heads=[];
 for(const variant of ['a','b','c','d','e']){
  const html=renderFreeLanding(new URLSearchParams(`v=${variant}`));
  assert.match(html,/<link rel="canonical" href="https:\/\/www\.vdalo\.tech\/free">/);
  assert.match(html,/<meta name="robots" content="noindex,nofollow">/);
  assert.match(html,/<h1>[^<]+<\/h1>/);
  assert.match(html,/id="free-lead-form"/);
  assert.doesNotMatch(html,/<video\b|\.mp4|youtube|vimeo/i);
  assert.doesNotMatch(html,/\u2014/);
  heads.push(html.match(/<h1>([^<]+)<\/h1>/)?.[1]);
 }
 assert.equal(new Set(heads).size,5);
});

test('free route defaults to variant A and falls back to A for unknown values',()=>{
 const fallback=renderFreeLanding(new URLSearchParams('v=unknown'));
 const defaultPage=renderFreeLanding(new URLSearchParams());
 assert.match(defaultPage,/<body class="free-page" data-variant="a">/);
 assert.match(fallback,/<body class="free-page" data-variant="a">/);
 assert.match(defaultPage,/Календар бронювань для садиби безкоштовно \| Вдало/);
});

test('each variant presents the seven Free tools and the wider paid offering',()=>{
 const expectedModules = [
  'Шахматка бронювань', 'Картки гостей', 'Віджет бронювання на сайт',
  'Сезони й базові тарифи', 'Прибирання та підготовка номера',
  'Базові звіти й аналітика', 'Туристичний збір'
 ];
 for(const variant of ['a','b','c','d','e']){
  const html=renderFreeLanding(new URLSearchParams(`v=${variant}`));
  assert.equal((html.match(/class="free-module"/g)||[]).length,7);
  for(const title of expectedModules)assert.ok(html.includes(title),`${variant}: ${title}`);
  assert.match(html,/до 10 номерів включно/);
  assert.match(html,/Для об’єктів від 11 номерів діють платні тарифи/);
  assert.match(html,/кемпінгів і глемпінгів/);
  assert.match(html,/додаткові модулі/i);
  assert.doesNotMatch(html,/Channex|\u2014/);
 }
});

test('free form clearly shows when the lead receiver is not configured',()=>{
 for(const variant of ['a','b','c','d','e']){
  const unavailable=renderFreeLanding(new URLSearchParams(`v=${variant}`),{ready:false});
  assert.match(unavailable,/Приймання заявок зараз не налаштоване/);
  assert.match(unavailable,/href="\/contact"/);
  assert.match(unavailable,/<fieldset class="free-form-fields" disabled>/);
  assert.match(unavailable,/<button type="submit" class="free-cta" disabled>/);
  const ready=renderFreeLanding(new URLSearchParams(`v=${variant}`),{ready:true});
  assert.doesNotMatch(ready,/Приймання заявок зараз не налаштоване/);
  assert.match(ready,/<fieldset class="free-form-fields">/);
  assert.match(ready,/<button type="submit" class="free-cta">/);
 }
});

test('free page has a distinct generic lead contract and does not leak into funnel directory',()=>{
 const offer=getOffer('free');
 assert.equal(offer.route,'/free');
 assert.equal(offers.some(item=>item.id==='free'),false);
 const result=validateRequest({offer_id:'free',name:'Тест',property:'Садиба',contact:'+380991234567',city:'',rooms:'4',property_type:'guesthouse',consent:true,attribution:{last_touch:{utm_campaign:'callo_free',message_variant:'b'}}});
 assert.deepEqual(result.errors,{});
 const payload=makePayload(result.offer,result.data,{attribution:{last_touch:{utm_campaign:'callo_free',message_variant:'b'}}});
 assert.equal(payload.offer_id,'free');
 assert.equal(payload.landing_route,'/free');
 assert.equal(payload.attribution.last_touch.message_variant,'b');
});

test('Free lead is accepted by the existing CRM parser and retains campaign details',async()=>{
 const names=['VDALO_FUNNEL_FREE_WEBHOOK_URL','VDALO_FUNNEL_WEBHOOK_URL','VDALO_FUNNEL_WEBHOOK_TOKEN','VDALO_FUNNEL_LEGAL_NAME','VDALO_FUNNEL_PRIVACY_EMAIL','VDALO_FUNNEL_RETENTION'];
 const original=Object.fromEntries(names.map(name=>[name,process.env[name]]));
 try {
  delete process.env.VDALO_FUNNEL_FREE_WEBHOOK_URL;
  Object.assign(process.env,{VDALO_FUNNEL_WEBHOOK_URL:'https://receiver.example.invalid/leads',VDALO_FUNNEL_WEBHOOK_TOKEN:'test-token',VDALO_FUNNEL_LEGAL_NAME:'Test',VDALO_FUNNEL_PRIVACY_EMAIL:'privacy@example.invalid',VDALO_FUNNEL_RETENTION:'test'});
  const utm={utm_source:'sms',utm_medium:'callo',utm_campaign:'qa-free',utm_content:'sample-code',utm_term:'hotel'};
  const body={offer_id:'free',submission_id:randomUUID(),name:'Тестова заявка',property:'Тестовий об’єкт',property_type:'guesthouse',rooms:'10',contact:'+380501234567',note:'Варіант D. Бажаний час розмови: завтра зранку.',consent:true,attribution:{first_touch:utm,last_touch:{...utm,message_variant:'d'},entry_offer:'free'}};
  const req=Readable.from([JSON.stringify(body)]);req.method='POST';req.headers={'content-type':'application/json',host:'staging.example.invalid',origin:'https://staging.example.invalid'};req.socket={remoteAddress:'free-compat-test'};
  let status,result,parsed,wire;
  await handleFunnelLead(req,{writeHead(value){status=value;},end(value){result=JSON.parse(value);}},{sendRequest:async(url,options)=>{
   assert.equal(url,'https://receiver.example.invalid/leads');
   wire=JSON.parse(options.body);
   parsed=parseSiteIntake(wire,options.headers['Idempotency-Key']);
   return new Response(JSON.stringify({ok:true}),{status:200});
  }});
  assert.equal(status,200);assert.equal(result.ok,true);
  assert.equal(parsed.form,'funnel:free');assert.equal(parsed.name,body.name);assert.equal(parsed.hotelName,body.property);
  assert.equal(parsed.phone,body.contact);assert.equal(parsed.units,10);assert.equal(parsed.lodgingKind,'guesthouse');
  assert.match(parsed.pain,/завтра зранку/);assert.equal(parsed.page,'/free');assert.equal(parsed.permissions.respond_to_request,true);
  assert.deepEqual(parsed.utm,utm);assert.deepEqual(parsed.details.first_touch,utm);
  assert.equal(wire.attribution.last_touch.message_variant,'d');
 } finally { for(const name of names){if(original[name]===undefined)delete process.env[name];else process.env[name]=original[name];} }
});

test('free lead form and analytics script contain no unverified instant-access or response-time promises',async()=>{
 const html=renderFreeLanding(new URLSearchParams('v=c'));
 const script=await readFile(new URL('../microlandings/public/free.js',import.meta.url),'utf8');
 assert.match(html,/action="\/api\/funnel\/leads"/);
 assert.match(script,/free_view/);
 assert.match(script,/free_cta_click/);
 assert.match(script,/free_lead_success/);
 assert.doesNotMatch(`${html}\n${script}`,/протягом 15 хвилин|доступ уже відкрито|14-денного тесту/);
 assert.doesNotMatch(`${html}\n${script}`,/\u2014/);
});
