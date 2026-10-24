import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {randomUUID} from 'node:crypto';
import {validateLead} from '../versions/v1/server.mjs';

// Exercise the real shared frontend validation/submit handlers without any
// network or CRM traffic. The popup controller is covered separately.
const app=readFileSync(new URL('../versions/v1/public/app.js',import.meta.url),'utf8');
const source=app.slice(app.indexOf('function validate(kind,data)'),app.indexOf('const tabs='));
function setup({values={},send}={}){
 const events={},attributes={},wire=[],tracked=[],emitted=[],errors={};
 const raw={name:'Тест VDALO',contact:'+380 50 123 45 67',pain:'Заявка на 14-денний тест VDALO з попапу',website:'',consent:'on',...values};
 const fields={};let focused='';
 for(const name of ['name','contact','consent']){
  const errorId=`home-offer-${name}-error`;
  errors[errorId]={textContent:''};
  fields[name]={setAttribute(key,value){this[key]=value;},getAttribute:()=>errorId,closest:()=>null,focus:()=>{focused=name;}};
 }
 const submit={disabled:false,textContent:'Залишити заявку на тест',dataset:{label:'Залишити заявку на тест'}};
 const status={textContent:''};
 const success={hidden:true,focus(){this.focused=true;}};
 const form={hidden:false,dataset:{kind:'contact',formVariant:'timed-trial',location:'site-timed-trial'},elements:fields,
  addEventListener(type,handler){events[type]=handler;},dispatchEvent(event){emitted.push(event.type);events[event.type]?.(event);},
  querySelector:selector=>selector==='[type=submit]'?submit:selector==='.form-status'?status:null,
  parentElement:{querySelector:()=>success},hasAttribute:()=>false,
  setAttribute:(name,value)=>{attributes[name]=value;},removeAttribute:name=>{delete attributes[name];}};
 class FakeFormData{*[Symbol.iterator](){for(const [key,value] of Object.entries(raw))if(value!==undefined)yield[key,value];}}
 runInNewContext(source,{document:{querySelectorAll:()=>[form],getElementById:id=>errors[id]},track:(event,properties)=>tracked.push({event,...properties}),
  window:{},sessionStorage:{},FormData:FakeFormData,Event,crypto:{randomUUID},location:{search:'?utm_source=qa&utm_campaign=trial_popup'},URLSearchParams,AbortController,setTimeout,clearTimeout,
  fetch:async(url,options)=>{const request={url,body:JSON.parse(options.body)};wire.push(request);return send?await send(request):{ok:true,json:async()=>({ok:true,leadId:'qa-mocked-lead'})};}});
 return {form,submit,status,success,wire,tracked,emitted,raw,attributes,errors,get focused(){return focused;},submitForm:()=>events.submit({preventDefault(){}}),open:()=>form.dispatchEvent(new Event('vdalo:lead-open'))};
}

test('inline popup rejects empty name, invalid phone, email in the phone field and missing consent without a request',async()=>{
 for(const values of [{name:''},{contact:'123'},{contact:'person@example.com'},{consent:undefined}]){
  const app=setup({values});await app.submitForm();
  assert.equal(app.wire.length,0);assert.equal(app.success.hidden,true);
  assert.ok(Object.values(app.errors).some(error=>error.textContent));assert.ok(app.focused);
 }
});

test('inline contact request reaches the existing audit contract with trial context and UTM',async()=>{
 const app=setup();app.open();await app.submitForm();
 assert.equal(app.wire.length,1);assert.equal(app.wire[0].url,'/api/leads/audit');
 const body=app.wire[0].body;
 assert.equal(body.form_kind,'contact');assert.equal(body.name,app.raw.name);assert.equal(body.contact,app.raw.contact);
 assert.equal(body.consent,true);assert.equal(body.pain,app.raw.pain);assert.equal(body.utm.utm_source,'qa');
 assert.deepEqual(validateLead('audit',body).errors,{});
 assert.equal(app.form.hidden,true);assert.equal(app.success.hidden,false);assert.equal(app.success.focused,true);
 assert.ok(app.emitted.includes('vdalo:lead-success'));
 assert.ok(app.tracked.some(event=>event.event==='contact_form_open'&&event.form_variant==='timed-trial'));
 assert.ok(app.tracked.some(event=>event.event==='contact_form_submit_success'&&event.form_variant==='timed-trial'));
 assert.doesNotMatch(JSON.stringify(app.tracked),/Тест VDALO|380|попапу/);
});

test('pending request blocks double submit and clears the loading state only when finished',async()=>{
 let resolve;
 const app=setup({send:()=>new Promise(done=>{resolve=done;})});
 const first=app.submitForm();assert.equal(app.submit.disabled,true);assert.equal(app.attributes['aria-busy'],'true');
 assert.equal(app.submit.textContent,'Надсилаємо…');assert.equal(app.success.hidden,true);
 await app.submitForm();assert.equal(app.wire.length,1);
 resolve({ok:true,json:async()=>({ok:true,leadId:'mock'})});await first;
 assert.equal(app.submit.disabled,false);assert.equal(app.attributes['aria-busy'],undefined);
 assert.equal(app.submit.textContent,'Залишити заявку на тест');
});

test('failed or unacknowledged delivery keeps fields and allows retry with the same submission ID',async()=>{
 for(const failure of ['http','unacknowledged','offline','timeout']){
  let calls=0;
  const app=setup({send:async()=>{
   if(++calls>1)return {ok:true,json:async()=>({ok:true,leadId:'mock'})};
   if(failure==='offline')throw Error('Failed to fetch');
   if(failure==='timeout'){const error=Error('timed out');error.name='AbortError';throw error;}
   return {ok:failure!=='http',json:async()=>({ok:false,message:'Не вдалося підтвердити отримання заявки.'})};
  }});
  await app.submitForm();assert.equal(app.success.hidden,true,failure);assert.equal(app.form.hidden,false,failure);
  assert.equal(app.raw.contact,'+380 50 123 45 67');assert.ok(app.status.textContent);assert.equal(app.submit.disabled,false);
  assert.ok(!app.emitted.includes('vdalo:lead-success'));
  await app.submitForm();assert.equal(app.success.hidden,false,failure);
  assert.equal(app.wire[0].body.submission_id,app.wire[1].body.submission_id,failure);
 }
});

test('server field rejection stays inline and focuses the rejected phone',async()=>{
 const app=setup({send:async()=>({ok:false,json:async()=>({ok:false,message:'Перевірте телефон.',errors:{contact:'Вкажіть коректний номер телефону.'}})})});
 await app.submitForm();assert.equal(app.success.hidden,true);assert.equal(app.focused,'contact');
 assert.equal(app.errors['home-offer-contact-error'].textContent,'Вкажіть коректний номер телефону.');
});
