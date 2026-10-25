(()=>{
 const form=document.getElementById('sms-trial-form');
 if(!form)return;
 const steps=[...form.querySelectorAll('[data-step]')];
 const progress=[...document.querySelectorAll('[data-progress]')];
 const status=document.getElementById('form-status');
 const emailField=form.elements.email;
 const consentField=form.elements.consent;
 const query=new URLSearchParams(location.search);
 const storageKey='vdalo-trial-lead-v1';
 let current=1;
 let leadId='';
 let quizContext=null;
 try{
  if(query.get('utm_campaign')==='hotel_quiz')quizContext=JSON.parse(sessionStorage.getItem('vdalo-quiz-context')||'null');
 }catch{}

 const track=(event,detail={})=>{
  window.dataLayer=window.dataLayer||[];
  const attribution=Object.fromEntries(['utm_source','utm_medium','utm_campaign','utm_content','utm_term','message_variant'].flatMap(key=>query.has(key)?[[key,query.get(key).slice(0,150)]]:[]));
  window.dataLayer.push({event,brand:'VDALO',offer_id:'sms-trial',landing_route:'/go/trial',preview:false,...attribution,...detail});
 };
 track('page_view');

 const propertyTypes={hotel:'hotel',guesthouse:'guesthouse',apartments:'apartments',resort:'glamping',hostel:'hostel',other:'other'};
 const roomBuckets={'1-5':'1-12','6-12':'1-12','13-40':'13-40','41+':'41+'};
 const quizFunnels={channels:'overbook',checkin:'staff',night_calls:'nights',power:'blackout',direct:'commission'};
 const quizFunnel=quizContext&&quizFunnels[quizContext.main_pain];
 const validQuizContext=quizFunnel&&['solution','calculator'].includes(quizContext.intent)&&quizContext.recommendation_route?quizContext:null;
 if(validQuizContext){
  const propertyType=propertyTypes[validQuizContext.property_type];
  if(propertyType)form.elements.property_type.value=propertyType;
  const roomBucket=roomBuckets[validQuizContext.room_range];
  if(roomBucket){const room=form.querySelector(`input[name="room_count"][value="${roomBucket}"]`);if(room)room.checked=true;}
 }
 const context=()=>({
  funnel:validQuizContext?quizFunnel:'staff',
  source:validQuizContext?'website':'sms',
  ...(validQuizContext?{quiz_answers:validQuizContext,quiz_landing_route:validQuizContext.recommendation_route}:{}),
  code:query.get('c')||query.get('code')||'',
  video:'sms-trial',
  watched:0,
  entry_page:location.pathname,
  ...Object.fromEntries(['utm_source','utm_medium','utm_campaign','utm_content','utm_term'].map(key=>[key,window.vdaloAttribution?.get?.().last_touch?.[key]||query.get(key)||''])),
  attribution:window.vdaloAttribution?.get?.()||{first_touch:{},last_touch:{}}
 });
 function restoreLead(){
  try{
   const saved=JSON.parse(sessionStorage.getItem(storageKey)||'null');
   if(!saved||typeof saved.email!=='string'||!saved.leadId)return false;
   leadId=saved.leadId;
   emailField.value=saved.email;
   consentField.checked=true;
   updateEmailSummary();
   showStep(2,false);
   status.textContent='Ваш email уже збережено. Додайте дані об’єкта, щоб ми могли розглянути запит на тест.';
   return true;
  }catch{return false;}
 }
 function updateEmailSummary(){
  const target=form.querySelector('[data-email-summary]');
  if(target)target.textContent=emailField.value.trim();
 }
 function showStep(number,focus=true){
  current=number;
  steps.forEach(step=>step.hidden=Number(step.dataset.step)!==number);
  progress.forEach((item,index)=>{
   const active=index+1===number;
   item.classList.toggle('is-current',active);
   item.classList.toggle('is-done',index+1<number);
   if(active)item.setAttribute('aria-current','step');else item.removeAttribute('aria-current');
  });
  document.getElementById('progress-fill').style.width=number===1?'0%':'100%';
  status.textContent='';
  updateEmailSummary();
  if(focus)(steps[number-1].querySelector('input:not([type=radio]):not([type=checkbox])')||steps[number-1].querySelector('input[type=radio]'))?.focus({preventScroll:true});
  window.scrollTo({top:0,behavior:'smooth'});
 }
 function errorFor(name){return form.querySelector(`[data-error="${name}"]`);}
 function invalid(field,message){
  const targets=field.type==='radio'?[...form.querySelectorAll(`input[type=radio][name="${field.name}"]`)]:[field];
  targets.forEach(target=>target.setAttribute('aria-invalid','true'));
  const error=errorFor(field.name);if(error)error.textContent=message;
 }
 function clearError(field){
  const targets=field.type==='radio'?[...form.querySelectorAll(`input[type=radio][name="${field.name}"]`)]:[field];
  targets.forEach(target=>target.removeAttribute('aria-invalid'));
  const error=errorFor(field.name);if(error)error.textContent='';
 }
 function setBusy(button,busy,label){
  button.disabled=busy;
  button.textContent=busy?'Надсилаємо…':label;
  form.toggleAttribute('aria-busy',busy);
 }
 async function sendLead(data){
  const response=await fetch('/api/funnels/top5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
  const result=await response.json();
  if(!response.ok||result.ok!==true){const error=new Error(result.message||'Не вдалося підтвердити отримання заявки. Спробуйте ще раз.');error.fields=result.errors;throw error;}
  return result;
 }
 function validateEmail(){
  const email=emailField.value.trim();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){invalid(emailField,'Вкажіть коректний email для доступу.');return false;}
  clearError(emailField);
  if(!consentField.checked){invalid(consentField,'Потрібна згода, щоб зберегти email і відповісти щодо тестового доступу.');return false;}
  clearError(consentField);
  return true;
 }
 async function captureEmail(){
  if(!validateEmail()){track('form_error',{step:1,reason:'validation'});return;}
  const button=form.querySelector('[data-next]');
  setBusy(button,true,'Продовжити');
  const data={...context(),submission_id:leadId||crypto.randomUUID(),submission_stage:'email_capture',email:emailField.value.trim(),consent:true,website:''};
  leadId=data.submission_id;
  try{
   const result=await sendLead(data);
   leadId=result.leadId;
   try{sessionStorage.setItem(storageKey,JSON.stringify({leadId,email:emailField.value.trim()}));}catch{}
   track('form_success',{lead_id:leadId,stage:'email_captured'});
   track('form_email_captured',{lead_id:leadId});
   track('form_step_complete',{step:1});
   updateEmailSummary();
   showStep(2);
   status.textContent='Email збережено. Заповніть дані об’єкта, щоб ми могли підготувати тест.';
  }catch(error){
   status.textContent=error.message==='Failed to fetch'?'Немає зв’язку із сервером. Перевірте інтернет і спробуйте ще раз.':error.message;
   track('form_error',{step:1,reason:'delivery'});
  }finally{setBusy(button,false,'Продовжити');}
 }
 function validateDetails(){
  const required=['name','phone','property','city','property_type'];
  let first=null;
  for(const name of required){
   const field=form.elements[name],value=field.value.trim();
   if(!value){invalid(field,'Заповніть це поле.');first||=field;continue;}
   if(name==='name'&&value.length<2){invalid(field,'Вкажіть ім’я та прізвище.');first||=field;}
   if(name==='phone'){
    const digits=value.replace(/\D/g,'').length;
    if(!/^[+()\d\s.-]+$/.test(value)||digits<9||digits>15){invalid(field,'Вкажіть коректний телефон.');first||=field;}
   }
   if(name==='property'&&value.length<2){invalid(field,'Вкажіть назву об’єкта.');first||=field;}
   if(name==='city'&&value.length<2){invalid(field,'Вкажіть місто або громаду.');first||=field;}
   if(name==='property_type'&&!new Set(['hotel','guesthouse','apartments','glamping','hostel','other']).has(value)){invalid(field,'Оберіть тип об’єкта.');first||=field;}
  }
  for(const name of ['hotel_count','room_count']){
   const selected=form.querySelector(`input[name="${name}"]:checked`);
   if(!selected){const field=form.querySelector(`input[name="${name}"]`);invalid(field,name==='hotel_count'?'Оберіть кількість об’єктів.':'Оберіть кількість номерів або юнітів.');first||=field;}
   else clearError(selected);
  }
  if(first){first.focus();track('form_error',{step:2,reason:'validation'});return false;}
  return true;
 }
 form.querySelectorAll('input,select').forEach(field=>{
  field.addEventListener('input',()=>clearError(field));
  field.addEventListener('change',()=>clearError(field));
 });
 form.querySelector('[data-next]').addEventListener('click',captureEmail);
 form.querySelectorAll('[data-back]').forEach(button=>button.addEventListener('click',()=>{
  track('form_step_back',{step:2});
  showStep(1);
 }));
 form.addEventListener('submit',async event=>{
  event.preventDefault();
  if(current===1){await captureEmail();return;}
  if(current!==2||!validateDetails())return;
  if(!leadId){status.textContent='Поверніться до першого кроку, щоб зберегти email для доступу.';return;}
  const button=form.querySelector('button[type="submit"]');
  setBusy(button,true,'Надіслати дані об’єкта');
  const data=Object.fromEntries(new FormData(form));
  data.submission_id=leadId;
  data.submission_stage='details_complete';
  data.hotel=data.property;
  data.location=data.city;
  data.rooms=data.room_count;
  data.consent=true;
  data.website='';
  Object.assign(data,context());
  try{
   const result=await sendLead(data);
   track('form_details_complete',{lead_id:result.leadId});
   steps.forEach(step=>step.hidden=true);
   progress.forEach(item=>item.hidden=true);
   status.textContent='Дякуємо! Email і дані об’єкта отримані. Перевіримо заявку та найближчим часом надішлемо інформацію для доступу до 14-денного тесту VDALO.';
   status.focus();
   try{sessionStorage.removeItem(storageKey);if(validQuizContext)sessionStorage.removeItem('vdalo-quiz-context');}catch{}
  }catch(error){
   status.textContent=error.message==='Failed to fetch'?'Немає зв’язку із сервером. Перевірте інтернет і спробуйте ще раз.':error.message;
   track('form_error',{step:2,reason:'delivery'});
  }finally{setBusy(button,false,'Надіслати дані об’єкта');}
 });

 if(!restoreLead())showStep(1,false);
})();
