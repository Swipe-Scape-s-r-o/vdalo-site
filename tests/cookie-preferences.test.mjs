import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source=readFileSync(new URL('../versions/v1/public/clarity-consent.js',import.meta.url),'utf8');
const server=readFileSync(new URL('../server.mjs',import.meta.url),'utf8');
const bootstrap=server.match(/const gtmHead=`<script>(.*?)<\/script>`;/)[1];
function setup({stored=null,blocked=false,cookies='_ga=test; _clck=test; functional=keep'}={}){
 const values=new Map(stored?[['vdalo-cookie-preferences',JSON.stringify(stored)]]:[]),writes=[],scripts=[],listeners={},nodes=[];
 class Element {
  constructor(tag){this.tag=tag;this.events={};this.children=new Map();this.checked=false;this.open=false;this.hidden=false;this.style={setProperty(){}};this.classList={toggle(){}};}
  setAttribute(){} getClientRects(){return [1];} getBoundingClientRect(){return {height:150};} focus(){}
  addEventListener(type,fn){this.events[type]=fn;} querySelector(selector){if(!this.children.has(selector))this.children.set(selector,new Element(selector));return this.children.get(selector);}
  append(...els){nodes.push(...els);} showModal(){this.open=true;} close(){this.open=false;}
 }
 const document={querySelector:()=>new Element('existing-settings'),head:{appendChild:el=>scripts.push(el.src)},body:new Element('body'),documentElement:new Element('html'),readyState:'loading',activeElement:new Element('active'),createElement:tag=>new Element(tag),addEventListener:(type,fn)=>listeners[type]=fn};
 Object.defineProperty(document,'cookie',{get:()=>cookies,set:value=>writes.push(value)});
 let reloads=0;
 const location={hostname:'staging.vdalo.tech',pathname:'/q9',protocol:'https:',reload:()=>reloads++};
 const localStorage={getItem:key=>{if(blocked)throw Error('blocked');return values.get(key)||null;},setItem:(key,value)=>{if(blocked)throw Error('blocked');values.set(key,value);},removeItem:key=>values.delete(key)};
 const window={addEventListener:(type,fn)=>listeners[type]=fn,dispatchEvent(){}};
 const context={window,document,location,localStorage,CustomEvent:class{},Date,ResizeObserver:undefined};
 runInNewContext(source,context);runInNewContext(bootstrap,context);listeners.DOMContentLoaded();
 const [banner,dialog,status]=nodes;
 const click=(root,selector)=>root.querySelector(selector).events.click();
 return {window,banner,dialog,status,scripts,writes,values,listeners,click,get reloads(){return reloads;}};
}
test('a first visit starts denied, loads no vendors and does not preselect optional purposes',()=>{
 const app=setup();assert.equal(app.scripts.length,0);assert.equal(app.banner.hidden,false);
 assert.equal(app.dialog.querySelector('#cookie-analytics').checked,false);
 assert.equal(app.dialog.querySelector('#cookie-replay').checked,false);
 assert.equal(app.window.dataLayer[0][1],'default');
 assert.equal(app.window.dataLayer[0][2].analytics_storage,'denied');
 assert.equal(app.window.dataLayer[0][2].ad_user_data,'denied');
});
test('analytics and recording are independently selectable and loaded once',()=>{
 for(const key of ['analytics','replay']){
  const app=setup();app.click(app.banner,'[data-cookie-settings]');app.dialog.querySelector(`#cookie-${key}`).checked=true;app.click(app.dialog,'[data-cookie-save]');
  assert.equal(app.scripts.length,1);assert.match(app.scripts[0],key==='analytics'?/googletagmanager/:/clarity/);
  const saved=JSON.parse(app.values.get('vdalo-cookie-preferences'));assert.equal(saved[key],true);assert.equal(saved[key==='analytics'?'replay':'analytics'],false);
  app.click(app.banner,'[data-cookie-accept]');app.click(app.banner,'[data-cookie-accept]');assert.equal(app.scripts.length,2);
 }
});
test('refusal loads no vendors, clears only measurement cookies and survives a return visit',()=>{
 const app=setup();app.click(app.banner,'[data-cookie-reject]');assert.equal(app.scripts.length,0);assert.equal(app.reloads,0);
 assert.ok(app.writes.some(v=>v.startsWith('_ga=')));assert.ok(app.writes.some(v=>v.startsWith('_clck=')));assert.ok(app.writes.every(v=>!v.startsWith('functional=')));
 const returning=setup({stored:JSON.parse(app.values.get('vdalo-cookie-preferences'))});assert.equal(returning.banner.hidden,true);assert.equal(returning.scripts.length,0);
});
test('withdrawal disables Google, signals Clarity and reloads after the explicit choice',()=>{
 const app=setup();app.click(app.banner,'[data-cookie-accept]');assert.equal(app.scripts.length,2);
 app.click(app.banner,'[data-cookie-settings]');app.dialog.querySelector('#cookie-replay').checked=false;app.dialog.querySelector('#cookie-analytics').checked=false;
 app.dialog.querySelector('#cookie-analytics').events.change();assert.equal(app.dialog.querySelector('[data-cookie-save]').textContent,'Зберегти та оновити');
 app.click(app.dialog,'[data-cookie-save]');assert.equal(app.reloads,1);assert.equal(app.window['ga-disable-G-ST38L6GRRM'],true);
 assert.ok(app.window.clarity.q.some(value=>value[0]==='consent'&&value[1]===false));
});
test('pre-consent measurements are discarded and ads consent stays denied',()=>{
 const app=setup();app.window.dataLayer.push({event:'form_open'},['event','lp_view']);app.click(app.banner,'[data-cookie-accept]');
 assert.ok(app.window.dataLayer.every(item=>item.event!=='form_open'&&item[0]!=='event'));
 const update=app.window.dataLayer.find(item=>item[1]==='update');assert.equal(update[2].analytics_storage,'granted');assert.equal(update[2].ad_storage,'denied');
});
test('valid saved grants load on return, expired or malformed grants do not',()=>{
 const fresh={version:2,analytics:true,replay:true,updatedAt:Date.now()};
 assert.equal(setup({stored:fresh}).scripts.length,2);
 for(const stored of [{...fresh,version:1},{...fresh,updatedAt:0},{...fresh,analytics:'yes'},{...fresh,updatedAt:Date.now()+86400000}])assert.equal(setup({stored}).scripts.length,0);
});
test('unavailable storage and dismissing settings do not silently grant consent',()=>{
 const app=setup({blocked:true});app.click(app.banner,'[data-cookie-settings]');app.dialog.querySelector('.cookie-close').events.click();assert.equal(app.scripts.length,0);assert.equal(app.banner.hidden,false);
 app.click(app.banner,'[data-cookie-reject]');assert.equal(app.scripts.length,0);assert.match(app.status.textContent,/не дозволив зберегти/);
});
test('consent bootstraps before GTM with no no-script tracking bypass',()=>{
 assert.ok(server.includes('opening+calloPrelude+consentAssets+gtmHead'));
 assert.match(server,/<script src="\/v1\/clarity-consent.js\?v=3"><\/script>/);
 assert.doesNotMatch(server,/googletagmanager.com\/ns.html/);
});
