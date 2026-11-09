import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

process.env.VERCEL='1';
const {default:server}=await import('../server.mjs');
const verificationPath='/google143cc4b428e7dc07.html';
const expected=Buffer.from('google-site-verification: google143cc4b428e7dc07.html');

async function request(url,{method='GET',host='www.vdalo.tech'}={}){
 const req={url,method,headers:{host},on(){},once(){},resume(){}};
 let status=0,headers={},body=Buffer.alloc(0);
 const res={writeHead(code,value={}){status=code;headers=value;},end(){}};
 await new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>reject(new Error(`No response for ${method} ${host}${url}`)),3000);
  res.end=value=>{if(value!==undefined)body=Buffer.isBuffer(value)?value:Buffer.from(String(value));clearTimeout(timer);resolve();};
  server.emit('request',req,res);
 });
 return {status,headers,body};
}

test('Google verification file is returned at the exact public URL without changes',async()=>{
 const source=await readFile(new URL('../public/google143cc4b428e7dc07.html',import.meta.url));
 assert.deepEqual(source,expected,'the file must preserve the provided bytes');
 const response=await request(verificationPath);
 assert.equal(response.status,200);
 assert.equal(response.headers['Content-Type'],'text/html; charset=utf-8');
 assert.equal(response.headers.Location,undefined);
 assert.deepEqual(response.body,expected);
});

test('verification file supports HEAD and staging remains noindex',async()=>{
 const head=await request(verificationPath,{method:'HEAD'});
 assert.equal(head.status,200);
 assert.equal(head.body.length,0);
 const staging=await request(verificationPath,{host:'staging.vdalo.tech'});
 assert.equal(staging.status,200);
 assert.equal(staging.headers['X-Robots-Tag'],'noindex, nofollow');
 assert.deepEqual(staging.body,expected);
});

test('other verification filenames remain unavailable and POST is rejected',async()=>{
 assert.equal((await request('/google0000000000000000.html')).status,404);
 assert.equal((await request(verificationPath,{method:'POST'})).status,405);
});
