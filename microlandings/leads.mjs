import {randomUUID} from 'node:crypto';
import {getOffer} from './content.mjs';
import {deliveryConfig,deliveryReady,processes,experiments,settings} from './config.mjs';
import {sendAcknowledgedLead} from './legacy-delivery.mjs';
const text=(value,max=150)=>typeof value==='string'?value.trim().slice(0,max):'';
const roles=['owner','manager','operations','reception','other'];
const propertyTypes=['hotel','guesthouse','apartments','resort','hostel','other'];
const flags=['interview_interest','sales_interest','report_interest','pilot_interest','feedback_interest'];
const contactValid=value=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)||(/^[+()\d\s.-]+$/.test(value)&&value.replace(/\D/g,'').length>=9&&value.replace(/\D/g,'').length<=15);
const quizEnums={property_format:['guesthouse','hotel','apartments','glamping','hostel','multiple','other'],property_type:['hotel','guesthouse','apartments','resort','hostel','other'],room_range:['1-5','6-12','13-40','41+'],pms_status:['none','spreadsheets','manual_gaps','exely','satisfied','switching'],main_pain:['channels','checkin','night_calls','power','direct'],frequency:['daily','weekly','monthly','rare'],intent:['solution','calculator'],recommendation_route:['/47','/50','/53','/54','/55','/k1','/k2','/k3','/k4','/k5']};
function cleanQuizAnswers(value){
 if(!value||typeof value!=='object'||Array.isArray(value))return null;
 const clean={};for(const [key,allowed] of Object.entries(quizEnums))if(typeof value[key]==='string'&&allowed.includes(value[key]))clean[key]=value[key];
 if(typeof value.sms_code==='string'&&/^\d{1,2}$/.test(value.sms_code))clean.sms_code=value.sms_code;
 return Object.keys(clean).length?clean:null;
}
export function validateRequest(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))return {errors:{form:'Перевірте формат запиту.'}};
 const offer=getOffer(raw.offer_id);
 if(!offer)return {errors:{form:'Сторінку запиту не знайдено.'}};
 const data={name:text(raw.name,100),property:text(raw.property),contact:text(raw.contact,180),city:text(raw.city,100),rooms:text(raw.rooms,5),current_pms:text(raw.current_pms),note:text(raw.note,1000),role:text(raw.role,30),selected_process:text(raw.selected_process,30),property_type:text(raw.property_type,30),pms_usage:text(raw.pms_usage,30),pms_satisfaction:text(raw.pms_satisfaction,30),consent:raw.consent===true};
 flags.forEach(key=>data[key]=raw[key]===true);
 if(!experiments.researchReportCommitted)data.report_interest=false;
 const errors={},survey=offer.extra==='survey';
 if(!survey&&data.name.length<2)errors.name='Вкажіть ваше ім’я.';
 if(!survey&&data.property.length<2)errors.property='Вкажіть назву об’єкта.';
 const needsContact=!survey||data.interview_interest||data.sales_interest||data.report_interest;
 if((needsContact||data.contact)&&!contactValid(data.contact))errors.contact='Вкажіть коректний телефон або email.';
 if((offer.extra==='rooms'||data.rooms)&&!/^[1-9]\d{0,4}$/.test(data.rooms))errors.rooms='Вкажіть кількість номерів від 1 до 99999.';
 if(offer.extra==='pms'&&data.current_pms.length<2)errors.current_pms='Вкажіть поточну PMS.';
 if((offer.extra==='role'||data.role)&&!roles.includes(data.role))errors.role='Оберіть вашу роль.';
 if((offer.extra==='process'||survey||data.selected_process)&&!processes.some(([id])=>id===data.selected_process))errors.selected_process='Оберіть процес.';
 if((survey||data.property_type)&&!propertyTypes.includes(data.property_type))errors.property_type='Оберіть тип об’єкта.';
 if(survey&&!['pms','spreadsheets','mixed','none'].includes(data.pms_usage))errors.pms_usage='Оберіть поточний підхід.';
 if(data.pms_satisfaction&&!['satisfied','mixed','dissatisfied','unsure'].includes(data.pms_satisfaction))errors.pms_satisfaction='Оберіть оцінку.';
 if(!data.consent)errors.consent='Потрібна ваша згода на використання даних для цього запиту.';
 if(raw.website)errors.form='Не вдалося перевірити форму. Оновіть сторінку.';
 return {offer,data,errors};
}
function acquisition(raw){
 const result={};
 for(const key of ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','message_variant']){
  const value=text(raw?.[key],150);if(value)result[key]=value;
 }
 return result;
}
export function makePayload(offer,data,raw){
 const id=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(raw.submission_id)?raw.submission_id:randomUUID();
 const attribution=raw.attribution&&typeof raw.attribution==='object'?raw.attribution:{};
 let route=offer.crmNext;
 if(offer.extra==='survey'){
  route=data.interview_interest?'research_interview_qualification':data.sales_interest?(data.pms_usage==='pms'&&data.pms_satisfaction==='dissatisfied'?'pms_check_qualification':'audit_or_trial_qualification'):data.report_interest?'report_delivery_only':'research_only_no_outreach';
 }
 return {lead_id:id,property_id:null,offer_id:offer.id,offer_status:offer.status,landing_route:offer.route,stage:'NEW',proposed_next_step:route,submitted_at:new Date().toISOString(),contact:{name:data.name,property_name:data.property,phone_or_email:data.contact},qualification:{property_type:data.property_type,city:data.city,room_count:data.rooms?Number(data.rooms):null,decision_role:data.role,current_PMS:data.current_pms,main_problem:data.note,selected_process:data.selected_process,pms_usage:data.pms_usage,pms_satisfaction:data.pms_satisfaction,pilot_interest:data.pilot_interest,feedback_interest:data.feedback_interest,quiz_answers:cleanQuizAnswers(attribution.quiz_answers)},attribution:{first_touch:acquisition(attribution.first_touch),last_touch:acquisition(attribution.last_touch),entry_offer:getOffer(attribution.entry_offer)?.id||offer.id,converted_offer:offer.id,first_touch_at:text(attribution.first_touch_at,40),latest_touch_at:new Date().toISOString()},permissions:{respond_to_request:offer.extra!=='survey'&&data.consent,research_interview:data.interview_interest,product_information:data.sales_interest,report_delivery:data.report_interest},source:'vdalo-microlandings'};
}
const counters=new Map();
function rateExceeded(req){
 const key=req.socket?.remoteAddress||'unknown';
 const now=Date.now();
 for(const [ip,bucket] of counters)if(bucket.until<now)counters.delete(ip);
 if(counters.size>=10000&&!counters.has(key))return true;
 const bucket=counters.get(key)||{count:0,until:now+60000};bucket.count++;counters.set(key,bucket);return bucket.count>60;
}
const send=(res,status,value)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(value));};
export async function handleFunnelLead(req,res,{sendRequest=fetch}={}){
 if(req.method!=='POST')return send(res,405,{ok:false,message:'Метод недоступний.'});
 if(!req.headers['content-type']?.startsWith('application/json'))return send(res,415,{ok:false,message:'Непідтримуваний формат.'});
 const origin=req.headers.origin;
 if(origin&&!new Set([settings.canonicalOrigin,`https://${req.headers.host}`,`http://${req.headers.host}`]).has(origin))return send(res,403,{ok:false,message:'Надсилання з іншого сайту недоступне.'});
 if(rateExceeded(req))return send(res,429,{ok:false,message:'Забагато спроб. Спробуйте пізніше.'});
 let bytes=0,chunks=[];
 try{
  for await(const chunk of req){const buffer=Buffer.from(chunk);bytes+=buffer.length;if(bytes>16384)return send(res,413,{ok:false,message:'Запит завеликий.'});chunks.push(buffer);}
  const raw=JSON.parse(Buffer.concat(chunks).toString('utf8'));
  const {offer,data,errors}=validateRequest(raw);
  if(Object.keys(errors).length)return send(res,422,{ok:false,errors,message:'Перевірте поля форми.'});
  if(!deliveryReady(offer.id))return send(res,503,{ok:false,message:'Онлайн-запис ще не відкритий. Запит не надіслано.'});
  const config=deliveryConfig(offer.id),payload=makePayload(offer,data,raw);
  const accepted=await sendAcknowledgedLead(config,payload,{sendRequest});
  if(!accepted)return send(res,502,{ok:false,message:'Не вдалося підтвердити отримання запиту. Спробуйте пізніше.'});
  return send(res,200,{ok:true,leadId:payload.lead_id});
 }catch(error){return send(res,error instanceof SyntaxError?400:502,{ok:false,message:error instanceof SyntaxError?'Не вдалося прочитати запит.':'Не вдалося підтвердити отримання запиту. Спробуйте пізніше.'});}
}

