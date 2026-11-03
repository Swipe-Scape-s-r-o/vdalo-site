(()=>{
 const configNode=document.getElementById('free-config'),form=document.getElementById('free-lead-form');
 if(!configNode||!form)return;
 const config=JSON.parse(configNode.textContent),query=new URLSearchParams(location.search),variant=config.variant;
 const safeValue=value=>String(value||'').slice(0,150);
 const keys=['utm_source','utm_medium','utm_campaign','utm_content','utm_term','message_variant'];
 const current=Object.fromEntries(keys.map(key=>[key,safeValue(query.get(key)||(key==='message_variant'?variant:''))]).filter(([,value])=>value));
 let attribution={first_touch:current,last_touch:current,entry_offer:config.offerId,first_touch_at:new Date().toISOString()};
 try{
  const saved=JSON.parse(localStorage.getItem('vdalo-free-attribution-v1')||'null');
  const validSaved=saved&&Date.now()-Number(saved.savedAt)<30*86400000;
  if(validSaved)attribution={...saved.value,last_touch:Object.keys(current).length?current:saved.value.last_touch};
  localStorage.setItem('vdalo-free-attribution-v1',JSON.stringify({savedAt:validSaved?saved.savedAt:Date.now(),value:attribution}));
 }catch{}
 const track=(event,extra={})=>{
  const payload={event,brand:'VDALO',offer_id:config.offerId,landing_route:'/free',variant,...current,...extra};
  window.dataLayer=window.dataLayer||[];window.dataLayer.push(payload);
  if(typeof window.gtag==='function')window.gtag('event',event,{send_to:'G-ST38L6GRRM',brand:'VDALO',funnel:'free',variant,...extra});
 };
 track('free_view');
 document.querySelectorAll('[data-free-cta]').forEach(link=>link.addEventListener('click',()=>track('free_cta_click',{location:link.dataset.freeCta})));
 document.querySelectorAll('[data-free-callback]').forEach(link=>link.addEventListener('click',()=>{
  track('free_callback');
  const choice=form.elements.callback_time;
  if(choice)choice.value='any';
 }));
 document.querySelectorAll('[data-faq]').forEach(item=>item.addEventListener('toggle',()=>{if(item.open)track('free_faq_open',{question_id:item.dataset.faq});}));
 const name=form.elements.name,phone=form.elements.contact,rooms=form.elements.rooms,property=form.elements.property,consent=form.elements.consent;
 const status=document.getElementById('free-status'),error=document.getElementById('free-error'),button=form.querySelector('button[type="submit"]'),bigNote=document.getElementById('free-big-note');
 let bigEventSent=false;
 rooms.addEventListener('input',()=>{
  const isBig=Number(rooms.value)>10;
  bigNote.hidden=!isBig;
  if(isBig&&!bigEventSent){track('free_big');bigEventSent=true;}
  if(!isBig)bigEventSent=false;
 });
 form.addEventListener('submit',async event=>{
  event.preventDefault();error.textContent='';
  const issues=[];
  if(name.value.trim().length<2)issues.push('Вкажіть ваше ім’я.');
  if(property.value.trim().length<2)issues.push('Вкажіть назву об’єкта.');
  if(!form.elements.property_type.value)issues.push('Оберіть тип об’єкта.');
  if(!/^\d{1,5}$/.test(rooms.value)||Number(rooms.value)<1)issues.push('Вкажіть кількість номерів або юнітів.');
  const phoneDigits=phone.value.replace(/\D/g,'').length;
  if(!/^[+()\d\s.-]+$/.test(phone.value)||phoneDigits<9||phoneDigits>15)issues.push('Вкажіть коректний номер телефону.');
  if(!consent.checked)issues.push('Потрібна згода, щоб команда могла відповісти на запит.');
  if(issues.length){error.textContent=issues[0];track('free_form_error',{reason:'validation'});form.querySelector(':invalid')?.focus();return;}
  const callbackLabel={any:'у зручний час',today:'сьогодні',evening:'сьогодні ввечері',tomorrow:'завтра зранку'}[form.elements.callback_time.value]||'у зручний час';
  const isBig=Number(rooms.value)>10;
  if(isBig&&!bigEventSent)track('free_big');
  const body={offer_id:config.offerId,name:name.value.trim(),property:property.value.trim(),contact:phone.value.trim(),property_type:form.elements.property_type.value,rooms:rooms.value,city:'',note:`Варіант ${variant.toUpperCase()}.${isBig?' Запит для об’єкта від 11 номерів.':''} Бажаний час розмови: ${callbackLabel}.`,consent:true,website:'',attribution};
  button.disabled=true;button.setAttribute('aria-busy','true');button.firstChild.textContent='Надсилаємо…';status.textContent='';track('free_step1');
  try{
   const response=await fetch(config.endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
   const result=await response.json();
   if(!response.ok||result.ok!==true)throw new Error(result.message||Object.values(result.errors||{})[0]||'Не вдалося надіслати заявку. Спробуйте ще раз.');
   track('free_registered');form.hidden=true;status.textContent=`Дякуємо, ${name.value.trim()}! Заявку отримано. Команда VDALO зв’яжеться, щоб обговорити підключення.`;status.focus();
  }catch(err){error.textContent=err.message==='Failed to fetch'?'Немає зв’язку із сервером. Перевірте інтернет і спробуйте ще раз.':err.message;track('free_form_error',{reason:'delivery'});}
  finally{button.disabled=false;button.removeAttribute('aria-busy');button.firstChild.textContent='Надіслати заявку ';}
 });
})();
