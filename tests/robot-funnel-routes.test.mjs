import test from 'node:test';
import {runInNewContext} from 'node:vm';
import assert from 'node:assert/strict';

process.env.VERCEL='1';
const {default:server}=await import('../server.mjs');

async function request(url){
 const req={url,method:'GET',headers:{},on(){},once(){},resume(){}};
 let status=0,headers={},body='';
 const res={writeHead(code,value={}){status=code;headers=value;},end(value){if(value)body=String(value);}};
 await new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>reject(new Error(`No response for ${url}`)),3000);
  res.end=value=>{if(value)body=Buffer.isBuffer(value)?value.toString('utf8'):String(value);clearTimeout(timer);resolve();};
  server.emit('request',req,res);
 });
 return {status,headers,body};
}

test('all short SMS funnel slugs resolve and legacy links redirect to compact slugs',async()=>{
 const expected={q1:'q1',q2:'q2',q3:'q3',q4:'q4',q5:'q5',q6:'q6',q7:'q7',q8:'q8',q9:'q9',qa:'q1b',qb:'q4b',qc:'q7b',qd:'q10'};
 for(const [slug,code] of Object.entries(expected)){
  const response=await request(`/${slug}?utm_source=test`);
  assert.equal(response.status,200,`/${slug} should render`);
  assert.match(response.body,new RegExp(`<body data-code="${code}">`));
  assert.match(response.body,/utm_source/);
 }
 for(const [legacy,short] of Object.entries({q1b:'qa',q4b:'qb',q7b:'qc',q10:'qd'})){
  for(const suffix of ['', '/']){
   const response=await request(`/${legacy}${suffix}?utm_source=test`);
   assert.equal(response.status,308);
   assert.equal(response.headers.Location,`/${short}?utm_source=test`);
  }
 }
});

test('call tracking token is kept for CRM attribution but removed before GTM loads',async()=>{
 const response=await request('/q1?t=private-call-tag&utm_source=sms&utm_campaign=autumn');
 assert.equal(response.status,200);
 assert.match(response.body,/window\.__vdaloCalloTag/);
 assert.match(response.body,/history\.replaceState/);
 assert.ok(response.body.indexOf('history.replaceState')<response.body.indexOf('googletagmanager.com/gtm.js'));
 const prelude=[...response.body.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(match=>match[1]).find(script=>script.includes('window.__vdaloCalloTag'));
 assert.ok(prelude,'Callo privacy prelude should be present');
 let cleanedUrl='';const window={location:{href:'https://staging.vdalo.tech/q1?t=private-call-tag&utm_source=sms&utm_campaign=autumn#form'}};
 runInNewContext(prelude,{window,URL,history:{state:null,replaceState:(_state,_title,url)=>{cleanedUrl=url;}}});
 assert.equal(window.__vdaloCalloTag,'private-call-tag');
 assert.equal(cleanedUrl,'/q1?utm_source=sms&utm_campaign=autumn#form');
});
