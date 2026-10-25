import test from 'node:test';
import assert from 'node:assert/strict';

process.env.VERCEL='1';
const {default:server}=await import('../server.mjs');

async function request(url,method='GET'){
 const req={url,method,headers:{},on(){},once(){},resume(){}};
 let status=0,headers={},body='';
 const res={writeHead(code,value={}){status=code;headers=value;},end(value){if(value)body=String(value);}};
 await new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>reject(new Error(`No response for ${url}`)),3000);
  res.end=value=>{if(value)body=Buffer.isBuffer(value)?value.toString('utf8'):String(value);clearTimeout(timer);resolve();};
  server.emit('request',req,res);
 });
 return {status,headers,body};
}

test('SMS short links preserve the exact code and redirect without cache',async()=>{
 for(const path of ['/r/Ab09','/q/r/XyZ01234','/r/0123456789abcdef']){
  const response=await request(`${path}?utm_source=ignored&utm_campaign=ignored`);
  const code=path.split('/').at(-1);
  assert.equal(response.status,302);
  assert.equal(response.headers.Location,`https://app.vdalo.tech/r/${code}`);
  assert.equal(response.headers['Cache-Control'],'no-store');
  assert.equal(response.body,'');
 }
});

test('invalid short-link codes return 404 and do not catch the quiz route',async()=>{
 for(const path of ['/r/abc','/r/abcdefghijklmnopq','/r/ab-c','/r/a%2Fb','/r/a/b','/q/r/abc','/q/r/ab-c','/q/r/12345678901234567']){
  assert.equal((await request(path)).status,404,path);
 }
 assert.equal((await request('/q?utm_source=mail&utm_medium=sms')).status,200);
});
