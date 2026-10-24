import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source=readFileSync(new URL('../versions/v1/public/homepage.js',import.meta.url),'utf8');
const markup=readFileSync(new URL('../versions/v1/homepage.mjs',import.meta.url),'utf8');
function setup({values=new Map(),blockedStorage=false}={}){
 let now=0,nextId=0,editing=false,blocked=false;
 const jobs=new Map(),listeners={};
 class Node{
  constructor(){this.events={};this.open=false;this.opens=0;}
  addEventListener(type,handler){(this.events[type]??=[]).push(handler);}
  fire(type,event={}){for(const handler of this.events[type]||[])handler(event);}
 }
 const close=new Node(),later=new Node(),start=new Node(),offer=new Node();
 offer.querySelectorAll=()=>[close,later];offer.querySelector=()=>start;
 offer.showModal=()=>{offer.open=true;offer.opens++;};offer.close=()=>{offer.open=false;};
 offer.getBoundingClientRect=()=>({left:10,right:400,top:100,bottom:600});
 const page={querySelector:selector=>selector==='#home-trial-offer'?offer:null};
 const document={hidden:false,activeElement:{matches:()=>editing},querySelector:selector=>selector==='.homepage-2026'?page:blocked?{}:null,
  addEventListener:(type,handler)=>{(listeners[type]??=[]).push(handler);}};
 const dispatch=(type,event={})=>{for(const fn of listeners[type]||[])fn(event);};
 const context={document,matchMedia:()=>({matches:true}),performance:{now:()=>now},sessionStorage:{getItem:key=>{if(blockedStorage)throw Error('blocked');return values.get(key);},setItem:(key,value)=>{if(blockedStorage)throw Error('blocked');values.set(key,value);}},
  setTimeout:(fn,delay)=>{const id=++nextId;jobs.set(id,{fn,at:now+delay});return id;},clearTimeout:id=>jobs.delete(id)};
 runInNewContext(source,context);
 const advance=ms=>{const target=now+ms;while(true){const job=[...jobs].sort((a,b)=>a[1].at-b[1].at)[0];if(!job||job[1].at>target)break;now=job[1].at;jobs.delete(job[0]);job[1].fn();}now=target;};
 return {offer,close,later,start,values,advance,setBlocked:value=>{blocked=value;},setEditing:value=>{editing=value;},setHidden:value=>{document.hidden=value;dispatch('visibilitychange');},requestContact:()=>dispatch('click',{target:{closest:()=>({})}})};
}

test('offer waits for 50 seconds and does not repeat after dismissal',()=>{
 const app=setup();app.advance(49999);assert.equal(app.offer.open,false);app.advance(1);assert.equal(app.offer.open,true);
 app.later.fire('click');app.advance(120000);assert.equal(app.offer.open,false);assert.equal(app.offer.opens,1);
});
test('hidden-tab time does not count towards the invitation',()=>{
 const app=setup();app.advance(20000);app.setHidden(true);app.advance(120000);assert.equal(app.offer.open,false);
 app.setHidden(false);app.advance(29999);assert.equal(app.offer.open,false);app.advance(1);assert.equal(app.offer.open,true);
});
test('privacy, menu or another dialog defers the offer until the blocker closes',()=>{
 const app=setup();app.setBlocked(true);app.advance(55000);assert.equal(app.offer.open,false);
 app.setBlocked(false);app.advance(1000);assert.equal(app.offer.open,true);
});
test('editing a field defers the offer',()=>{
 const app=setup();app.setEditing(true);app.advance(55000);assert.equal(app.offer.open,false);
 app.setEditing(false);app.advance(1000);assert.equal(app.offer.open,true);
});
test('manual contact suppresses the offer for the session',()=>{
 const app=setup();app.advance(20000);app.requestContact();app.advance(120000);assert.equal(app.offer.opens,0);
 const returning=setup({values:app.values});returning.advance(120000);assert.equal(returning.offer.opens,0);
});
test('close, Escape and backdrop each dismiss the offer',()=>{
 for(const method of ['close','escape','backdrop']){const app=setup();app.advance(50000);
  if(method==='close')app.close.fire('click');
  if(method==='escape')app.offer.fire('cancel',{preventDefault(){}});
  if(method==='backdrop')app.offer.fire('click',{target:app.offer,clientX:0,clientY:0});
  assert.equal(app.offer.open,false,method);app.advance(60000);assert.equal(app.offer.opens,1,method);
 }
});
test('invitation closes before the existing short request handler runs',()=>{
 const app=setup();app.advance(50000);app.start.fire('click');assert.equal(app.offer.open,false);
 assert.match(markup,/data-home-offer-start data-open="audit"/);assert.match(markup,/data-location="home-timed-trial"/);
 assert.doesNotMatch(markup,/home-mobile-action/);
});
test('unavailable session storage still permits one dismissible invitation per load',()=>{
 const app=setup({blockedStorage:true});app.advance(50000);assert.equal(app.offer.open,true);app.close.fire('click');app.advance(100000);assert.equal(app.offer.opens,1);
});
