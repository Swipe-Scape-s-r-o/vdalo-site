import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {renderFreeLanding} from '../microlandings/free.mjs';
import {getOffer,offers} from '../microlandings/content.mjs';
import {validateRequest,makePayload} from '../microlandings/leads.mjs';

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
