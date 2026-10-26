import test from 'node:test';
import assert from 'node:assert/strict';
import {Readable} from 'node:stream';

process.env.VDALO_SITE_URL='https://www.vdalo.tech';
delete process.env.VERCEL;
const {lead}=await import('../versions/v1/server.mjs');
let requestId=0;

async function post(origin,host='staging.vdalo.tech'){
 const req=Readable.from([JSON.stringify({name:'QA',contact:'+380501234567',consent:true})]);
 req.method='POST';req.headers={'content-type':'application/json',origin,host};
 req.socket={remoteAddress:`origin-qa-${++requestId}`};
 let status;
 await lead(req,{writeHead(code){status=code;},end(){}},'audit',{env:{}});
 return status;
}

test('same-host HTTPS Origin is accepted behind Caddy without VERCEL',async()=>{
 assert.notEqual(await post('https://staging.vdalo.tech'),403);
});

test('same-host HTTP Origin remains accepted',async()=>{
 assert.notEqual(await post('http://staging.vdalo.tech'),403);
});

test('foreign Origin remains forbidden',async()=>{
 assert.equal(await post('https://evil.example'),403);
});
