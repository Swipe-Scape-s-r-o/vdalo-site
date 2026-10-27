import test from 'node:test';
import assert from 'node:assert/strict';

process.env.VERCEL='1';
const {default:server}=await import('../server.mjs');

async function request(path,host='www.vdalo.tech'){
 const req={url:path,method:'GET',headers:{host},on(){},once(){},resume(){}};
 let status=0,headers={},body='';
 const res={writeHead(code,value={}){status=code;headers=value;},end(value){if(value)body=Buffer.isBuffer(value)?value.toString('utf8'):String(value);}};
 await new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>reject(new Error(`No response for ${host}${path}`)),3000);
  res.end=value=>{if(value)body=Buffer.isBuffer(value)?value.toString('utf8'):String(value);clearTimeout(timer);resolve();};
  server.emit('request',req,res);
 });
 return {status,headers,body};
}

test('staging HTML is noindex in both the page metadata and HTTP header',async()=>{
 const response=await request('/tourist-tax/start','staging.vdalo.tech');
 assert.equal(response.status,200);
 assert.equal(response.headers['X-Robots-Tag'],'noindex, nofollow');
 assert.equal([...response.body.matchAll(/<meta\b(?=[^>]*\bname=["']robots["'])[^>]*>/gi)].length,1);
 assert.match(response.body,/<meta name="robots" content="noindex,nofollow">/);
 assert.equal(response.headers['Cache-Control'],'no-store');
});

test('staging robots disallows crawling and sitemap exposes no production URLs',async()=>{
 const robots=await request('/robots.txt','staging.vdalo.tech');
 assert.match(robots.body,/Disallow: \/\n/);
 assert.doesNotMatch(robots.body,/Allow: \/|Sitemap:/);
 const sitemap=await request('/sitemap.xml','staging.vdalo.tech');
 assert.equal(sitemap.status,200);
 assert.doesNotMatch(sitemap.body,/<loc>/);
});

test('production remains indexable and keeps its production sitemap',async()=>{
 const page=await request('/tourist-tax/start','www.vdalo.tech');
 assert.equal(page.status,200);
 assert.doesNotMatch(page.body,/<meta name="robots" content="noindex,nofollow">/);
 assert.equal(page.headers['X-Robots-Tag'],undefined);
 const robots=await request('/robots.txt','www.vdalo.tech');
 assert.match(robots.body,/Allow: \/\nSitemap: https:\/\/www\.vdalo\.tech\/sitemap\.xml/);
});
