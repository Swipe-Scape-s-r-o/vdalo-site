const cfg = key => key.split('.').reduce((value, part) => value?.[part], window.VDALO_CONFIG || {}) ?? null;
window.VDALO_CFG = cfg;
const configured = value => value !== null && value !== undefined && String(value).trim() !== '' && !String(value).trim().startsWith('TODO');
document.querySelectorAll('[data-config-text]').forEach(node => { const value=cfg(node.dataset.configText);if(configured(value))node.textContent=String(value); });
document.querySelectorAll('[data-config-href]').forEach(node => { const key=node.dataset.configHref;const value=cfg(key);let href=value;if(configured(value)&&key==='phone'&&!String(value).startsWith('tel:'))href=`tel:${value}`;if(configured(value)&&key==='email'&&!String(value).startsWith('mailto:'))href=`mailto:${value}`;let valid=false;try{const url=new URL(href,location.href);valid=['https:','mailto:','tel:'].includes(url.protocol);}catch{}node.hidden=!configured(value)||!valid;if(!node.hidden)node.href=String(href); });
document.querySelectorAll('[data-config-src]').forEach(node=>{const value=cfg(node.dataset.configSrc);let valid=false;try{const url=new URL(value,location.href);valid=url.protocol==='https:'||url.pathname.startsWith('/v1/assets/');}catch{}node.hidden=!configured(value)||!valid;if(!node.hidden){node.src=String(value);const fallback=node.parentElement?.querySelector('[data-author-fallback]');if(fallback)fallback.hidden=true;}});
document.querySelectorAll('[data-requires-config]').forEach(node => { node.hidden=!configured(cfg(node.dataset.requiresConfig)); });
document.querySelectorAll('[data-config-integrations]').forEach(list => {
 const types={api:'API',ical:'iCal',soon:'Незабаром'};
 list.replaceChildren(...(cfg('integrations')||[]).filter(item=>item?.name&&item?.logo).map(item=>{const li=document.createElement('li');li.className='logo-tile';const img=document.createElement('img');img.src=item.logo;img.alt=item.name;img.width=150;img.height=40;img.loading='lazy';img.decoding='async';li.append(img);if(types[item.type]){const note=document.createElement('small');note.textContent=types[item.type];li.append(note);}return li;}));
});
document.querySelectorAll('[data-legal-details]').forEach(node => {
 const values=['legalName','legalCode','legalAddress'].map(key=>cfg(key)).filter(configured);
 node.hidden=values.length===0;
 node.replaceChildren(...values.map((value,index)=>{const span=document.createElement('span');span.textContent=String(value);if(index)span.prepend(document.createTextNode(' · '));return span;}));
});
document.querySelectorAll('[data-config-faq-extra]').forEach(list=>{
 const entries=cfg('faqExtra');
 if(!Array.isArray(entries))return;
 list.replaceChildren(...entries.filter(item=>(item?.question||item?.q)&&(item?.answer||item?.a)).map((item,index)=>{const details=document.createElement('details');const summary=document.createElement('summary');summary.textContent=String(item.question||item.q);const plus=document.createElement('span');plus.setAttribute('aria-hidden','true');plus.textContent='+';summary.append(plus);const answer=document.createElement('p');answer.textContent=String(item.answer||item.a);details.dataset.faq=`extra-${index}`;details.append(summary,answer);return details;}));
});
const floatingContacts=document.querySelector('[data-floating-contact]');
if(floatingContacts){
 const links=[['phone','Подзвонити','tel:'],['email','Email','mailto:'],['telegramUrl','Telegram',''],['viberUrl','Viber','']].flatMap(([key,label,prefix])=>{const value=cfg(key);if(!configured(value))return [];let href=String(value);if(prefix&&!href.startsWith(prefix))href=prefix+href;try{if(!['https:','tel:','mailto:'].includes(new URL(href,location.href).protocol))return [];}catch{return [];}const anchor=document.createElement('a');anchor.href=href;anchor.textContent=label;return [anchor];});
 if(links.length){const button=document.createElement('button');button.type='button';button.textContent='Написати нам';button.setAttribute('aria-expanded','false');const menu=document.createElement('div');menu.className='floating-contact-menu';menu.hidden=true;menu.append(...links);button.addEventListener('click',()=>{const expanded=button.getAttribute('aria-expanded')!=='true';button.setAttribute('aria-expanded',String(expanded));menu.hidden=!expanded;});floatingContacts.hidden=false;floatingContacts.append(button,menu);}
}
const siteNavigation=document.querySelector('#navigation');
const menuToggle=document.querySelector('.menu-toggle');
const desktopPointerMenu=window.matchMedia('(min-width: 901px) and (hover: hover) and (pointer: fine)');
const navDisclosures=[...(siteNavigation?.querySelectorAll('details.nav-disclosure')||[])];
const closeDisclosureBranch=detail=>{
 detail.open=false;
 detail.querySelectorAll('details.nav-disclosure[open]').forEach(child=>child.open=false);
};
const openDisclosure=detail=>{
 const megaColumns=detail.closest('.nav-mega-columns');
 const siblings=megaColumns
  ? megaColumns.querySelectorAll('.nav-mega-list > .nav-item > details.nav-disclosure[open]')
  : detail.closest('ul')?.querySelectorAll(':scope > .nav-item > details.nav-disclosure[open]')||[];
 siblings.forEach(sibling=>{if(sibling!==detail)closeDisclosureBranch(sibling);});
 detail.open=true;
};
navDisclosures.forEach(detail=>{
 let closeTimer;
 const summary=detail.querySelector(':scope > summary');
 detail.addEventListener('pointerenter',event=>{
  if(!desktopPointerMenu.matches||event.pointerType==='touch')return;
  clearTimeout(closeTimer);
  openDisclosure(detail);
 });
 detail.addEventListener('pointerleave',event=>{
  if(!desktopPointerMenu.matches||event.pointerType==='touch')return;
  // Keep expanded mega-menu groups in place while the pointer crosses the
  // whitespace between categories. The next category closes its sibling
  // when it is actually reached; leaving the whole panel closes the menu.
  if(detail.closest('.nav-mega-columns'))return;
  clearTimeout(closeTimer);
  closeTimer=setTimeout(()=>{
   if(!detail.matches(':hover')&&!detail.contains(document.activeElement))closeDisclosureBranch(detail);
  },350);
 });
 detail.addEventListener('focusin',()=>{
  clearTimeout(closeTimer);
  if(!desktopPointerMenu.matches)return;
  if(detail.dataset.suppressFocusOpen==='true'){delete detail.dataset.suppressFocusOpen;return;}
  openDisclosure(detail);
 });
 detail.addEventListener('focusout',event=>{
  if(detail.contains(event.relatedTarget))return;
  clearTimeout(closeTimer);
  closeTimer=setTimeout(()=>{
   if(!detail.contains(document.activeElement)&&!detail.matches(':hover'))closeDisclosureBranch(detail);
  },0);
 });
 summary?.addEventListener('click',event=>{
  if(desktopPointerMenu.matches&&event.detail>0){event.preventDefault();openDisclosure(detail);}
 });
});
const closeNavigation=()=>{
 siteNavigation?.classList.remove('open');
 siteNavigation?.querySelectorAll('details[open]').forEach(item=>item.open=false);
 menuToggle?.setAttribute('aria-expanded','false');
 menuToggle?.setAttribute('aria-label','Відкрити меню');
};
menuToggle?.addEventListener('click', event => {
 const control = event.currentTarget;
 const expanded = control.getAttribute('aria-expanded') !== 'true';
 control.setAttribute('aria-expanded', String(expanded));
 control.setAttribute('aria-label', expanded ? 'Закрити меню' : 'Відкрити меню');
 siteNavigation?.classList.toggle('open', expanded);
});
siteNavigation?.querySelectorAll('a').forEach(link => link.addEventListener('click', closeNavigation));
document.addEventListener('keydown', event=>{
 if(event.key!=='Escape'||!siteNavigation)return;
 const openDetails=[...siteNavigation.querySelectorAll('details[open]')];
 if(openDetails.length){
  event.preventDefault();
  const last=openDetails.at(-1);
  last.open=false;
  const summary=last.querySelector(':scope > summary');
  if(summary){last.dataset.suppressFocusOpen='true';summary.focus();delete last.dataset.suppressFocusOpen;}
 }else if(siteNavigation.classList.contains('open')){
  event.preventDefault();
  closeNavigation();
  menuToggle?.focus();
 }
});
document.addEventListener('click',event=>{
 if(siteNavigation?.querySelector('details[open]')&&!event.target.closest('#navigation'))siteNavigation.querySelectorAll('details[open]').forEach(item=>item.open=false);
});
addEventListener('scroll', () => document.querySelector('.header')?.classList.toggle('scrolled', scrollY > 120), { passive:true });

// Provider-neutral events. Contact data and free text never enter this layer.
window.dataLayer = window.dataLayer || [];
const track = (event, properties={}) => {
 const payload={event,brand:'VDALO',...properties};
 window.dataLayer.push(payload);
 if(typeof window.vdaloAnalytics==='function') { try { window.vdaloAnalytics(payload); } catch {} }
};
track('page_view',{path:location.pathname});
let opener=null;
function openForm(kind,source,interest='',mode='start') {
 const dialog=document.querySelector(`#${kind}-dialog`);
 if(!dialog) return;
 opener=document.activeElement;
 const form=dialog.querySelector('form');
 form.hidden=false;form.reset();form.removeAttribute('aria-busy');form.dataset.autoInterest='';dialog.querySelector('.form-success').hidden=true;dialog.querySelector('.selected-interest').hidden=true;dialog.querySelector('.form-status').textContent='';
 for(const error of form.querySelectorAll('.field-error'))error.textContent='';
 for(const field of form.querySelectorAll('[aria-invalid]'))field.removeAttribute('aria-invalid');
 const formMode=kind==='trial'&&mode==='implementation'?'implementation':'start';
 dialog.dataset.mode=formMode;form.dataset.mode=formMode;form.elements.mode.value=formMode;
 if(kind==='trial') {
  const implementation=formMode==='implementation';
  dialog.querySelector(`#${kind}-title`).textContent=implementation?'Обговорімо впровадження у вашому готелі.':'Почнімо з вашого готелю.';
  dialog.querySelector('[data-dialog-intro]').textContent=implementation?'Розкажіть, якими інструментами користуєтесь і що потрібно налаштувати.':'Уточнимо задачі об’єкта й погодимо формат наступного кроку.';
  const pms=form.querySelector('.trial-pms-field');
  if(implementation)form.querySelector('.form-grid').append(pms);else form.querySelector('.form-optional').insertBefore(pms,form.querySelector('.form-optional').firstChild);
  const button=form.querySelector('[type=submit]');button.dataset.label=implementation?'Надіслати запит на обговорення':'Надіслати запит';button.textContent=button.dataset.label;
  const estimate=window.VDALO_CURRENT_ESTIMATE;
  const estimateBlock=dialog.querySelector('[data-estimate-summary]');
  if(estimate&&source.includes('pricing')) {const text=`${estimate.plan}, ${estimate.rooms} номерів, ${Math.round(estimate.estimateMonthly).toLocaleString('uk-UA')} грн на місяць${estimate.modules.length?`, модулі: ${estimate.modules.join(', ')}`:''}`;estimateBlock.hidden=false;dialog.querySelector('[data-estimate-summary-text]').textContent=text;form.elements.estimate.value=JSON.stringify(estimate);if(!interest)interest=`Розрахунок: ${text}`;form.elements.units.value=String(estimate.rooms);}
  else {estimateBlock.hidden=true;form.elements.estimate.value='';}
 }
 if(interest && (!form.elements.pain.value || form.elements.pain.value===form.dataset.autoInterest)) {
  const value=`Хочу перевірити сценарій: ${interest}`;
  form.elements.pain.value=value;
  form.dataset.autoInterest=value;
  const context=dialog.querySelector('.selected-interest');
  if(context) {context.hidden=false;context.textContent=`Обраний сценарій: ${interest}`;}
 }
 dialog.showModal();
 document.body.classList.add('dialog-open');
 track(`${kind}_form_open`,{location:source});
 if(source==='hero'||source==='final') track(`${source}_${kind}_click`);
 requestAnimationFrame(()=>dialog.querySelector('input:not([type=checkbox])').focus());
}
function openContactDialog(control) {
 const dialog=document.querySelector('#contact-dialog');
 if(!dialog)return;
 opener=control;
 const form=dialog.querySelector('form');
 form.hidden=false;form.reset();form.removeAttribute('aria-busy');
 dialog.querySelector('.form-success').hidden=true;
 dialog.querySelector('.form-status').textContent='';
 for(const error of form.querySelectorAll('.field-error'))error.textContent='';
 for(const field of form.querySelectorAll('[aria-invalid]'))field.removeAttribute('aria-invalid');
 closeNavigation();
 dialog.showModal();
 document.body.classList.add('dialog-open');
 track('contact_form_open',{location:control.closest('.header')?'header':'navigation'});
 requestAnimationFrame(()=>dialog.querySelector('#contact-name').focus());
}
function closeForm(dialog) { dialog.close(); }
document.querySelectorAll('[data-open]').forEach(control=>control.addEventListener('click',()=>openForm(control.dataset.open,control.dataset.location,control.dataset.interest,control.dataset.mode)));
document.querySelectorAll('[data-contact-dialog-trigger]').forEach(control=>control.addEventListener('click',event=>{if(!document.querySelector('#contact-dialog'))return;event.preventDefault();openContactDialog(control);}));
document.querySelectorAll('a[href="#pricing-addons"]').forEach(link=>link.addEventListener('click',()=>{const disclosure=document.querySelector('#pricing-addons details');if(disclosure)disclosure.open=true;}));
document.querySelectorAll('.addons-calc-link').forEach(link=>link.addEventListener('click',()=>{const modulePicker=document.querySelector('.calculator-modules');if(modulePicker)modulePicker.open=true;}));
document.querySelectorAll('.lead-dialog').forEach(dialog=>{
 dialog.querySelectorAll('[data-close]').forEach(control=>control.addEventListener('click',()=>closeForm(dialog)));
 dialog.addEventListener('click',event=>{
  const rect=dialog.getBoundingClientRect();
  if(event.target===dialog && (event.clientX<rect.left || event.clientX>rect.right || event.clientY<rect.top || event.clientY>rect.bottom)) closeForm(dialog);
 });
 dialog.addEventListener('close',()=>{document.body.classList.remove('dialog-open');opener?.focus();});
});

function validate(kind,data) {
 const errors={};
 if(data.name.length<2) errors.name='Вкажіть ваше ім’я.';
 if(kind==='trial') {
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email='Вкажіть коректний email для надсилання доступу.';
  const digits=data.phone.replace(/\D/g,'').length;
  if(!/^[+()\d\s.-]+$/.test(data.phone)||digits<9||digits>15) errors.phone='Вкажіть коректний телефон.';
  if(data.property.length<2) errors.property='Вкажіть назву готелю або об’єкта.';
  if(data.city.length<2) errors.city='Вкажіть місто або громаду.';
  if(!data.property_type) errors.property_type='Оберіть тип об’єкта.';
  if(!/^[1-9]\d{0,4}$/.test(data.units)) errors.units='Вкажіть кількість номерів або юнітів.';
 } else if(kind==='contact') {
  const digits=data.contact.replace(/\D/g,'').length;
  if(!/^[+()\d\s.-]+$/.test(data.contact)||digits<9||digits>15) errors.contact='Вкажіть коректний номер телефону.';
 } else {
  const digits=data.contact.replace(/\D/g,'').length;
  if(!(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contact) || (/^[+()\d\s.-]+$/.test(data.contact) && digits>=9 && digits<=15))) errors.contact='Вкажіть коректний телефон або email.';
  if(data.units && !/^[1-9]\d{0,4}$/.test(data.units)) errors.units='Вкажіть кількість номерів або юнітів від 1 до 99999.';
 }
 if(!data.consent) errors.consent='Потрібна згода на обробку даних, щоб ми відповіли на запит.';
 return errors;
}
function showErrors(form,errors) {
 for(const name of ['name','property','contact','email','phone','city','property_type','units','consent']) {
  const field=form.elements[name],errorId=field?.getAttribute('aria-describedby')?.split(/\s+/).find(id=>id.endsWith('-error')),error=errorId?document.getElementById(errorId):null;
  if(field)field.setAttribute('aria-invalid',String(Boolean(errors[name])));
  if(error)error.textContent=errors[name]||'';
 }
 const first=Object.keys(errors).find(name=>form.elements[name]);
 if(first) {
  const optional=form.elements[first].closest('details');
  if(optional) optional.open=true;
  form.elements[first].focus();
 }
}
async function submitLead(kind,data) {
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),15000);
 try {
  const route=kind==='contact'?'audit':kind;
  const response=await fetch(`/api/leads/${route}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...data,form_kind:kind}),signal:controller.signal});
  const result=await response.json();
  if(!response.ok || result.ok!==true) { const error=new Error(result.message||'Не вдалося надіслати запит. Спробуйте ще раз.');error.fields=result.errors;throw error; }
  return result;
 } finally {clearTimeout(timer);}
}
const submitTrialLead=data=>submitLead('trial',data);
const submitAuditLead=(data,kind='audit')=>submitLead(kind,data);
document.querySelectorAll('form[data-kind]').forEach(form=>{
 let started=false,submissionId='';
 const eventContext=form.dataset.formVariant?{form_variant:form.dataset.formVariant}:{};
 form.addEventListener('vdalo:lead-open',()=>track(`${form.dataset.kind}_form_open`,{...eventContext,location:form.dataset.location||'dialog'}));
 form.addEventListener('input',()=>{if(!started){started=true;track(`${form.dataset.kind}_form_start`,eventContext);}}, {passive:true});
 form.addEventListener('submit',async event=>{
  event.preventDefault();
  const kind=form.dataset.kind;
  const submit=form.querySelector('[type=submit]');
  if(submit.disabled) return;
  const raw=Object.fromEntries(new FormData(form));
  submissionId= submissionId||crypto.randomUUID();
  const data={...raw,submission_id:submissionId,name:(raw.name||'').trim(),property:(raw.property||'').trim(),contact:(raw.contact||'').trim(),email:(raw.email||'').trim(),phone:(raw.phone||'').trim(),city:(raw.city||'').trim(),property_type:(raw.property_type||'').trim(),units:raw.units||'',mode:kind==='trial'?(raw.mode==='implementation'?'implementation':'start'):'',estimate:raw.estimate||'',consent:raw.consent==='on',utm:{}};
  if(kind==='trial')try{const quiz=JSON.parse(sessionStorage.getItem('vdalo-quiz-context')||'null');if(quiz&&typeof quiz==='object')data.quiz_answers=quiz;}catch{}
  const attribution=window.vdaloAttribution?.get?.()||{first_touch:{},last_touch:Object.fromEntries(new URLSearchParams(location.search))};
  data.utm=attribution.last_touch||{};
  data.attribution=attribution;
  const errors=validate(kind,data);
  if(form.dataset.requireProperty==='true'&&data.property.length<2)errors.property='Вкажіть назву готелю або об’єкта.';
  showErrors(form,errors);
  const status=form.querySelector('.form-status');
  status.textContent='';
  if(Object.keys(errors).length) {track(`${kind}_form_submit_error`,{...eventContext,reason:'validation'});return;}
  submit.disabled=true;submit.textContent='Надсилаємо…';form.setAttribute('aria-busy','true');
  try {
   const result=await(kind==='trial'?submitTrialLead(data):submitAuditLead(data,kind));
   track(`${kind}_form_submit_success`,{...eventContext,lead_id:result.leadId});
   if(kind==='trial')try{sessionStorage.removeItem('vdalo-quiz-context');}catch{}
   form.hidden=true;
   const success=form.parentElement.querySelector('.form-success');
   success.hidden=false;
   form.dispatchEvent(new Event('vdalo:lead-success',{bubbles:true}));
   success.focus();
  } catch(error) {
   if(error.fields) showErrors(form,error.fields);
   status.textContent=error.name==='AbortError'?'Відповідь затримується. Не вдалося підтвердити отримання заявки. Спробуйте пізніше.':error.message==='Failed to fetch'?'Немає зв’язку із сервером. Перевірте інтернет і спробуйте ще раз.':error.message;
   track(`${kind}_form_submit_error`,{...eventContext,reason:error.fields?'validation':'delivery'});
  } finally {submit.disabled=false;submit.textContent=submit.dataset.label;form.removeAttribute('aria-busy');}
 });
 if(form.hasAttribute('data-partner-request'))form.dataset.leadReady='true';
});

const tabs=[...document.querySelectorAll('[data-step]')];
function activateStep(index,focus=false) {
 tabs.forEach((tab,i)=>{tab.setAttribute('aria-selected',String(i===index));tab.tabIndex=i===index?0:-1;document.querySelector(`#journey-panel-${i}`).hidden=i!==index;});
 if(focus) tabs[index].focus();
}
tabs.forEach((tab,index)=>{
 tab.addEventListener('click',()=>activateStep(index));
 tab.addEventListener('keydown',event=>{
  let next=index;
  if(event.key==='ArrowRight') next=(index+1)%tabs.length;
  else if(event.key==='ArrowLeft') next=(index+tabs.length-1)%tabs.length;
  else if(event.key==='Home') next=0;
  else if(event.key==='End') next=tabs.length-1;
  else return;
  event.preventDefault();activateStep(next,true);
 });
});
document.querySelectorAll('[data-faq]').forEach(item=>item.addEventListener('toggle',()=>{if(item.open) track('faq_open',{question_id:item.dataset.faq});}));
if('IntersectionObserver' in window) {
 const hero=document.querySelector('.hero-v2');
 const sticky=document.querySelector('.mobile-cta');
 if(hero&&sticky) new IntersectionObserver(entries=>sticky.classList.toggle('visible',!entries[0].isIntersecting),{threshold:0}).observe(hero);
 const features=document.querySelector('#features');
 if(features) {const observer=new IntersectionObserver(entries=>{if(entries[0].isIntersecting){track('feature_section_view');observer.disconnect();}},{threshold:.05});observer.observe(features);}
 const pricing=document.querySelector('#pricing');
 if(pricing) {const observer=new IntersectionObserver(entries=>{if(entries[0].isIntersecting){track('pricing_section_view');observer.disconnect();}},{threshold:.05});observer.observe(pricing);}
 const addons=document.querySelector('#pricing-addons');
 if(addons) {const observer=new IntersectionObserver(entries=>{if(entries[0].isIntersecting){track('pricing_addons_view');observer.disconnect();}},{threshold:.05});observer.observe(addons);}
}

// Product and role exploration only changes the explanatory page state.
function setupTabSet(selector,panelPrefix,property,orientation='horizontal') {
 const controls=[...document.querySelectorAll(selector)];
 const select=(index,focus=false)=>{
  controls.forEach((control,i)=>{
   const selected=i===index;
   control.setAttribute('aria-selected',String(selected));
   control.tabIndex=selected?0:-1;
   document.getElementById(panelPrefix+control.dataset[property]).hidden=!selected;
  });
  if(focus) {controls[index].focus();controls[index].scrollIntoView({block:'nearest',inline:'nearest'});}
  track(property==='product'?'product_module_view':'role_view',{item:controls[index].dataset[property]});
 };
 controls.forEach((control,index)=>{
  control.addEventListener('click',()=>select(index));
  control.addEventListener('keydown',event=>{
   let next=index;
   if(event.key==='ArrowRight'||(orientation==='vertical'&&event.key==='ArrowDown')) next=(index+1)%controls.length;
   else if(event.key==='ArrowLeft'||(orientation==='vertical'&&event.key==='ArrowUp')) next=(index+controls.length-1)%controls.length;
   else if(event.key==='Home') next=0;
   else if(event.key==='End') next=controls.length-1;
   else return;
   event.preventDefault();select(next,true);
  });
 });
}
setupTabSet('[data-product]','product-panel-','product','vertical');
setupTabSet('[data-role]','role-panel-','role');

const calendarNode=document.getElementById('calendar-data');
if(calendarNode) {
 const calendar=JSON.parse(calendarNode.textContent);
 const grid=document.getElementById('reservation-grid');
 const details=document.getElementById('reservation-detail');
 let week=0;
 let channel='all';
 let selectedId=null;
 const monthNames=['січня','лютого','березня','квітня','травня','червня','липня','серпня','вересня','жовтня','листопада','грудня'];
 const startDate=new Date();startDate.setHours(0,0,0,0);
 const baseline=new Date(2026,9,6);
 const dateLabel=date=>`${date.getDate()} ${monthNames[date.getMonth()]}`;
 const dateRange=(from,to)=>from.getMonth()===to.getMonth()&&from.getFullYear()===to.getFullYear()?`${from.getDate()} до ${to.getDate()} ${monthNames[to.getMonth()]} ${to.getFullYear()}`:`${from.getDate()} ${monthNames[from.getMonth()]} до ${to.getDate()} ${monthNames[to.getMonth()]} ${to.getFullYear()}`;
 const shiftedReservation=(item,weekIndex)=>{
  const parse=value=>{const [day,month]=value.split(' ');return new Date(2026,monthNames.indexOf(month),Number(day));};
  const days=Math.round((startDate-baseline)/86400000)+weekIndex*7;
  const arrival=parse(item.arrival),departure=parse(item.departure);arrival.setDate(arrival.getDate()+days);departure.setDate(departure.getDate()+days);
  return {arrival:dateLabel(arrival),departure:dateLabel(departure)};
 };
 const clearDetails=()=>{
  selectedId=null;
  details.replaceChildren();
  const symbol=document.createElement('span');symbol.className='detail-symbol';symbol.setAttribute('aria-hidden','true');symbol.textContent='+';
  const copy=document.createElement('div');const title=document.createElement('strong');title.textContent='Оберіть бронювання у календарі.';
  const note=document.createElement('p');note.textContent='Побачте зв’язок дат, номера, каналу та статусу.';copy.append(title,note);details.append(symbol,copy);
 };
 const selectReservation=item=>{
  selectedId=item.id;
  grid.querySelectorAll('[data-reservation]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.reservation===item.id)));
  details.replaceChildren();
  const room=document.createElement('span');room.className='detail-symbol';room.textContent=calendar.rooms[item.room][0];room.style.fontSize='11px';
  const copy=document.createElement('div');const title=document.createElement('strong');title.textContent=`${item.label} / ${item.status}`;
  const note=document.createElement('p');note.textContent=item.note;copy.append(title,note);
  const record=document.createElement('div');record.className='detail-record';
  const dates=shiftedReservation(item,week);
  for(const [label,value] of [['Заїзд',dates.arrival],['Виїзд',dates.departure]]) {const field=document.createElement('div');field.textContent=label;const strong=document.createElement('strong');strong.textContent=value;field.append(strong);record.append(field);}
  details.append(room,copy,record);
  track('calendar_reservation_view',{sample_id:item.id});
 };
 const applyFilter=()=>{
  grid.querySelectorAll('[data-reservation]').forEach(button=>{
   const hidden=channel!=='all'&&button.dataset.channel!==channel;
   button.classList.toggle('is-filtered',hidden);
   button.setAttribute('aria-hidden',String(hidden));
   button.tabIndex=hidden?-1:0;
  });
  const selected=calendar.weeks[week].find(item=>item.id===selectedId);
  if(selected&&channel!=='all'&&selected.channel!==channel) clearDetails();
 };
 function bindReservations() {
  grid.querySelectorAll('[data-reservation]').forEach(button=>button.addEventListener('click',()=>{
   const item=calendar.weeks[week].find(entry=>entry.id===button.dataset.reservation);
   if(item) selectReservation(item);
  }));
 }
 const showWeek=()=>{
  grid.querySelectorAll('[data-reservation]').forEach(button=>button.remove());
  const reservations=document.createDocumentFragment();
  calendar.weeks[week].forEach(item=>{
   const button=document.createElement('button');button.type='button';button.className=`reservation ${item.channel}`;
   button.style.gridColumn=`${item.start+2} / span ${item.nights}`;button.style.gridRow=String(item.room+2);
   button.dataset.reservation=item.id;button.dataset.channel=item.channel;button.setAttribute('aria-pressed','false');
   const dates=shiftedReservation(item,week);
   button.setAttribute('aria-label',`${item.label}, номер ${calendar.rooms[item.room][0]}, ${dates.arrival} до ${dates.departure}`);
    const name=document.createElement('span');name.textContent=item.label;const state=document.createElement('small');state.textContent=item.status;button.append(name,state);reservations.append(button);
  });
  grid.append(reservations);
  const weekStart=new Date(startDate);weekStart.setDate(weekStart.getDate()+week*7);
  document.querySelectorAll('[data-day]').forEach(day=>{const date=new Date(weekStart);date.setDate(date.getDate()+Number(day.dataset.day));day.textContent=String(date.getDate());const weekday=day.parentElement.querySelector('[data-day-weekday]');weekday.textContent=new Intl.DateTimeFormat('uk-UA',{weekday:'short'}).format(date).replace('.','');});
  const weekEnd=new Date(weekStart);weekEnd.setDate(weekEnd.getDate()+6);
  document.getElementById('calendar-period').textContent=dateRange(weekStart,weekEnd);
  document.querySelector('[data-week=previous]').disabled=week===0;
  document.querySelector('[data-week=next]').disabled=week===calendar.weeks.length-1;
  clearDetails();bindReservations();applyFilter();
 };
 document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{
  channel=button.dataset.filter;
  document.querySelectorAll('[data-filter]').forEach(control=>control.setAttribute('aria-pressed',String(control===button)));
  applyFilter();track('calendar_filter',{channel});
 }));
 document.querySelectorAll('[data-week]').forEach(button=>button.addEventListener('click',()=>{
  week=Math.max(0,Math.min(calendar.weeks.length-1,week+(button.dataset.week==='next'?1:-1)));
  showWeek();track('calendar_week_change',{week});
 }));
 showWeek();
}

if('IntersectionObserver' in window&&!matchMedia('(prefers-reduced-motion: reduce)').matches) {
 const revealObserver=new IntersectionObserver(entries=>{
  entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('reveal-enter');revealObserver.unobserve(entry.target);}});
 },{threshold:.12});
 document.querySelectorAll('[data-reveal]').forEach(node=>revealObserver.observe(node));
}

// Progressive enhancement: reading position, section entry and responsive panel feedback.
(() => {
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const header=document.querySelector('.header');
 const progress=document.createElement('div');progress.className='reading-progress';progress.setAttribute('aria-hidden','true');header?.append(progress);
 const links=[...document.querySelectorAll('#navigation a[href^="#"]')];
 let queued=false;
 const update=()=>{
  queued=false;const maximum=document.documentElement.scrollHeight-innerHeight;
  progress.style.transform=`scaleX(${maximum>0?Math.max(0,Math.min(1,scrollY/maximum)):0})`;
  let active=null;
  links.forEach(link=>{const node=document.querySelector(link.getAttribute('href'));if(node&&node.getBoundingClientRect().top<180)active=link;});
  links.forEach(link=>{if(link===active)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});
 };
 addEventListener('scroll',()=>{if(!queued){queued=true;requestAnimationFrame(update);}},{passive:true});addEventListener('resize',update);update();
 if('IntersectionObserver' in window){
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-in-view');observer.unobserve(entry.target);}}),{threshold:.08});
  document.querySelectorAll('.calendar-shell,.integration-flow,.product-browser,.arrival-image,.migration-path,.start-routes').forEach(node=>{
   if(!reduced.matches)node.classList.add('motion-ready');observer.observe(node);
  });
 }
 document.addEventListener('click',event=>{
  const control=event.target.closest('[data-product],[data-step],[data-role]');
  if(!control||reduced.matches)return;
  const panel=document.getElementById(control.getAttribute('aria-controls'));
  if(panel&&typeof panel.animate==='function')panel.animate([{opacity:.65,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}],{duration:240,easing:'cubic-bezier(.22,1,.36,1)'});
 });
})();
// Keep the fixed mobile action from duplicating the final invitation.
if('IntersectionObserver' in window) {
 const endVisibility=new Map();
 const endObserver=new IntersectionObserver(entries=>{
  entries.forEach(entry=>endVisibility.set(entry.target,entry.isIntersecting));
  document.body.classList.toggle('end-in-view',[...endVisibility.values()].some(Boolean));
 },{threshold:0});
 document.querySelectorAll('.final-v2,.footer-v2').forEach(node=>endObserver.observe(node));
}
