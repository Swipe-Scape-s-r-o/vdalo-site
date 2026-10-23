import {createHash} from 'node:crypto';

// The deployed CRM accepts the original microlanding contract. New landing
// fields stay on the website; this adapter uses the existing authenticated door.
export function resolveLeadDestination(kind,env=process.env){
 const preferred=kind==='audit'?'VDALO_AUDIT_WEBHOOK_URL':kind==='tourist_tax'?'VDALO_LEAD_WEBHOOK_URL':'VDALO_TRIAL_WEBHOOK_URL';
 for(const key of [...new Set([preferred,'VDALO_LEAD_WEBHOOK_URL','VDALO_TRIAL_WEBHOOK_URL','VDALO_AUDIT_WEBHOOK_URL','VDALO_FUNNEL_WEBHOOK_URL'])]){
  const endpoint=env[key]?.trim();
  if(!endpoint)continue;
  const url=new URL(endpoint);
  if(url.protocol!=='https:'&&!(env.NODE_ENV!=='production'&&url.protocol==='http:'&&['localhost','127.0.0.1'].includes(url.hostname)))throw new Error('Invalid lead destination');
  return {endpoint,token:key==='VDALO_FUNNEL_WEBHOOK_URL'?env.VDALO_FUNNEL_WEBHOOK_TOKEN||'':env.VDALO_WEBHOOK_BEARER_TOKEN||''};
 }
 return null;
}

export function intakeEventId(parentId,event,payload){
 const stable={...payload};delete stable.submitted_at;
 const hex=createHash('sha256').update(JSON.stringify([parentId,event,stable])).digest('hex').slice(0,32).split('');
 hex[12]='4';hex[16]=((parseInt(hex[16],16)&3)|8).toString(16);
 const s=hex.join('');return `${s.slice(0,8)}-${s.slice(8,12)}-${s.slice(12,16)}-${s.slice(16,20)}-${s.slice(20)}`;
}

export function legacyTop5Payload(payload,event){
 const c=payload.contact,a=payload.attribution,answers=payload.answers||{};
 const snapshot={contact:c,answers,attribution:a,submission_stage:event,parent_submission_id:payload.lead_id};
 if(payload.source_system!=='vdalo-robot-funnels'){
  // Keep the original two-step email flow: the deployed top5 reader can merge
  // email + phone into the same CRM card. Distinct event IDs allow enrichment.
  return {...payload,lead_id:intakeEventId(payload.lead_id,event,payload),qualification:{...payload.qualification,quiz_answers:{...payload.qualification?.quiz_answers,form_fields:snapshot}}};
 }
 const labels={email:'Email',preferred_method:'Спосіб зв’язку',room_range:'Номерів',property_type:'Тип об’єкта',hotel_count:'Об’єктів',current_pms:'Поточна PMS'};
 const lines=[`Сторінка: ${a.entry_page||a.code||a.funnel||'сайт'}`,...Object.entries(labels).flatMap(([key,label])=>c[key]?[`${label}: ${c[key]}`]:[])];
 if(a.contact_tag)lines.push(`Мітка звернення: ${a.contact_tag}`);
 for(const [key,value] of Object.entries(answers))if(value!==null&&value!==undefined&&value!=='')lines.push(`${key}: ${typeof value==='object'?JSON.stringify(value):value}`);
 if(a.calculator)lines.push(`Розрахунок: ${a.calculator}`);
 // The original CRM displays main_problem in the lead timeline. The complete
 // structured snapshot below also retains all fields without truncation.
 const summary=lines.join('\n');
 const wire={...payload,source:'vdalo-microlandings',offer_id:payload.kind==='tourist_tax_inquiry'?'one-process':'trial',offer_status:'current',landing_route:a.entry_page||`/${a.code||'go/trial'}`,
  contact:{...c,property_name:c.hotel_name||'',phone_or_email:c.phone||c.email||''},
  qualification:{...payload.qualification,property_type:c.property_type||'',city:c.location||'',room_count:null,current_PMS:c.current_pms||'',main_problem:summary.slice(0,1000),
   quiz_answers:{...payload.qualification?.quiz_answers,form_fields:snapshot}},
  attribution:{...a,first_touch:a.utm||{},last_touch:a.utm||{}},
 };
 wire.lead_id=intakeEventId(payload.lead_id,event,payload);
 return wire;
}

export async function sendAcknowledgedLead(destination,payload,{sendRequest=fetch,timeoutMs=10000}={}){
 const id=payload.lead_id||payload.id;
 const response=await sendRequest(destination.endpoint,{method:'POST',headers:{'Content-Type':'application/json',...(id?{'Idempotency-Key':id}:{}),...(destination.token?{Authorization:`Bearer ${destination.token}`}:{})},body:JSON.stringify(payload),signal:AbortSignal.timeout(timeoutMs),redirect:'error'});
 if(!response.ok){await response.body?.cancel();return false;}
 const result=await response.json();
 return result?.ok===true;
}
