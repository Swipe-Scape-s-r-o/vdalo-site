// Local browser acceptance only. Never used by deployment or production start.
import {parseSiteIntake} from '../tests/fixtures/deployed-crm-intake-20261018.mjs';
if(process.env.NODE_ENV==='production')throw new Error('Local QA preview only');
process.env.HOST='127.0.0.1';process.env.PORT='3000';process.env.VDALO_SITE_URL='http://127.0.0.1:3000';
delete process.env.VERCEL;
const endpoint='https://receiver.example.invalid/api/public/vdalo/leads';
for(const key of ['VDALO_TRIAL_WEBHOOK_URL','VDALO_AUDIT_WEBHOOK_URL','VDALO_LEAD_WEBHOOK_URL','VDALO_FUNNEL_WEBHOOK_URL'])process.env[key]=endpoint;
process.env.VDALO_WEBHOOK_BEARER_TOKEN='local-preview';process.env.VDALO_FUNNEL_WEBHOOK_TOKEN='local-preview';
process.env.VDALO_FUNNEL_LEGAL_NAME='Local QA preview';process.env.VDALO_FUNNEL_PRIVACY_EMAIL='qa@example.invalid';process.env.VDALO_FUNNEL_RETENTION='Local QA session only';
const realFetch=globalThis.fetch,received=new Set();
globalThis.fetch=async(url,options)=>{
 if(String(url)!==endpoint) return realFetch(url,options);
 if(options?.headers?.Authorization!=='Bearer local-preview')return new Response(JSON.stringify({ok:false}),{status:401});
 const body=JSON.parse(options.body),intake=parseSiteIntake(body,options.headers['Idempotency-Key']);
 const duplicate=received.has(intake.externalId);received.add(intake.externalId);
 console.log(JSON.stringify({LOCAL_MOCK_ONLY:true,form:intake.form,page:intake.page,duplicate,hasContact:Boolean(intake.email||intake.phone)}));
 return new Response(JSON.stringify({ok:true,lead_id:'local-qa-receipt',duplicate}),{status:200});
};
console.log('LOCAL MOCK ONLY: no CRM records or Telegram notifications are sent.');
await import('../server.mjs');
