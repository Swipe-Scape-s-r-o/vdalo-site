import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {Readable} from 'node:stream';

process.env.VERCEL='1';
const {default:siteServer}=await import('../server.mjs');

const source=await readFile(new URL('../versions/v1/public/attribution.js',import.meta.url),'utf8');
function visit(search,storage,clock){
 const localStorage={getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)};
 class FakeDate extends Date{static now(){return clock.value;}}
 const window={};
 vm.runInNewContext(source,{window,location:{search,protocol:'https:'},document:{cookie:''},localStorage,URLSearchParams,Date:FakeDate});
 return window.vdaloAttribution.get();
}
function get(url){
 return new Promise((resolve,reject)=>{
  const req=Readable.from([]);req.url=url;req.method='GET';req.headers={host:'staging.vdalo.tech'};req.socket={remoteAddress:'utm-test'};
  const res={writeHead(status,headers){this.status=status;this.headers=headers;},end(body){resolve({status:this.status,headers:this.headers,body:String(body??'')});}};
  siteServer.emit('request',req,res);setTimeout(()=>reject(new Error(`Request timed out: ${url}`)),3000).unref();
 });
}

test('first touch remains fixed while last touch updates across pages for 30 days',()=>{
 const storage=new Map(),clock={value:Date.UTC(2026,9,25)};
 const first=visit('?utm_source=sms&utm_medium=callo&utm_campaign=october&utm_content=K8',storage,clock);
 assert.deepEqual({...first.first_touch},{utm_source:'sms',utm_medium:'callo',utm_campaign:'october',utm_content:'K8'});
 clock.value+=60000;
 const second=visit('?utm_source=email&utm_medium=newsletter&utm_campaign=followup&utm_term=hotel',storage,clock);
 assert.equal(second.first_touch.utm_source,'sms');
 assert.equal(second.last_touch.utm_source,'email');
 assert.equal(second.last_touch.utm_term,'hotel');
 assert.ok(second.first_touch_at);assert.ok(second.latest_touch_at);
});

test('expired attribution starts a new 30-day window',()=>{
 const storage=new Map(),clock={value:Date.UTC(2026,9,25)};
 visit('?utm_source=sms&utm_medium=callo',storage,clock);
 clock.value+=31*24*60*60*1000;
 const next=visit('?utm_source=partner&utm_campaign=november',storage,clock);
 assert.equal(next.first_touch.utm_source,'partner');
 assert.equal(next.last_touch.utm_campaign,'november');
});

test('shared attribution is attached to quiz, robot, demo and tourist-tax pages and its asset is served',async()=>{
 for(const route of ['/q','/q1','/q9','/55','/k3','/go/trial','/tourist-tax/start']){
  const page=await get(route);
  assert.equal(page.status,200,route);
  assert.match(page.body,/\/v1\/attribution\.js\?v=/,route);
  if(['/55','/k3'].includes(route))assert.match(page.body,/data\.attribution\s*=\s*attribution/);
 }
 const asset=await get('/v1/attribution.js');
 assert.equal(asset.status,200);
 assert.match(asset.headers['Content-Type'],/javascript/);
 assert.match(asset.body,/vdaloAttribution/);
});
