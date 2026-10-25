(()=>{
const app=document.querySelector('[data-pms-checklist]');if(app){
const groups=[
{name:'Щоденні операції',items:[['Облік номерів і доступності',3,'Живий тест останнього номера'],['Зміни, скасування, переселення',3,'Змінити бронювання з оплатою'],['Housekeeping і статуси номерів',2,'Пройти цикл прибирання'],['Зручність роботи персоналу',2,'Дати завдання новому користувачу'],['Управлінські звіти',2,'Звірити звіт із записами']]},
{name:'Канали продажу та бронювання',items:[['Потрібні канали продажу',3,'Матриця підтверджених підключень'],['Обробка збоїв синхронізації',3,'Демонстрація помилки та відновлення'],['Пряме бронювання на сайті',2,'Тестове бронювання'],['Платежі й повернення',3,'Підтверджена тестова операція']]},
{name:'Дані, міграція та інтеграції',items:[['Імпорт бронювань і номерного фонду',3,'Пробне перенесення даних'],['Дублікати та очищення даних',2,'Приклад конфліктних записів'],['Експорт даних',3,'Експорт у погодженому форматі'],['Потрібні інтеграції',2,'Документація та результати тестів']]},
{name:'Українська специфіка',items:[['ПРРО і фіскальні процеси',3,'Перевірка потрібного сценарію'],['Туристичний збір',2,'Приклади нарахувань і пільг'],['Документи й локальні сервіси',2,'Демонстрація конкретного процесу']]},
{name:'Безпека й контроль',items:[['Права доступу',3,'Тест різних ролей'],['Історія змін',3,'Показати журнал операцій'],['Дані та відновлення',3,'Документація, відповідальні, тест відновлення']]},
{name:'Впровадження й підтримка',items:[['Живе демо',3,'Виконання погоджених сценаріїв'],['Впровадження та навчання',3,'Письмовий план запуску'],['Підтримка та інциденти',3,'Підтверджені умови сервісу']]},
{name:'Вартість і бізнес-результат',items:[['Повна вартість володіння',3,'Детальна комерційна пропозиція'],['Договір та вихід із системи',3,'Перевірка умов договору'],['Відповідність бізнес-завданням',2,'Узгоджені показники та потреби']]}
].map((g,gi)=>({...g,items:g.items.map((x,ii)=>({id:`${gi}-${ii}`,title:x[0],weight:x[1],how:x[2]}))}));
 const key='vdalo-pms-checklist-v1',labels={confirmed:'Підтверджено',partial:'Частково',failed:'Не пройдено',unknown:'Не перевірено',na:'Не застосовується'};
let state=load()||{names:['','',''],hotel:'',property:'',rooms:'',weights:{},answers:{},notes:{},naReason:{},started:false,group:0,done:false};
const $=s=>app.querySelector(s),$$=s=>[...app.querySelectorAll(s)],safe=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function load(){try{return JSON.parse(localStorage.getItem(key))}catch{return null}}function save(){try{localStorage.setItem(key,JSON.stringify(state))}catch{}}
function send(name,detail={}){if(typeof window.plausible==='function')window.plausible(name,{props:detail});else if(typeof window.gtag==='function')window.gtag('event',name,detail)}
function active(){return state.names.map((n,i)=>n.trim()?i:-1).filter(i=>i>=0)}
function ids(){return groups.flatMap(g=>g.items.map(c=>c.id))}
function progress(){return active().map(i=>`${safe(state.names[i])}: ${ids().filter(id=>state.answers[`${i}|${id}`]).length} із 25`).join(' · ')}
function draw(){const g=groups[state.group];$('[data-group-label]').textContent=`Розділ ${state.group+1} із ${groups.length} · ${g.name}`;$('[data-progress]').textContent=`${progress()} · загалом ${ids().filter(id=>active().every(i=>state.answers[`${i}|${id}`])).length} із 25 критеріїв заповнено для всіх PMS`;$('[data-progress-bar]').style.width=`${((state.group+1)/groups.length)*100}%`;$('[data-prev]').disabled=state.group===0;const last=state.group===groups.length-1;$('[data-next]').hidden=last;$('[data-finish]').hidden=!last;const panel=$('[data-group-content]');panel.innerHTML=`<h3>${safe(g.name)}</h3>${g.items.map(c=>`<article class="criterion-card"><div class="criterion-heading"><div><p class="criterion-number">КРИТЕРІЙ ${ids().indexOf(c.id)+1}</p><h4>${safe(c.title)}</h4><p class="criterion-how"><strong>Як перевірити:</strong> ${safe(c.how)}</p></div><label class="weight-field">Вага <select data-weight="${c.id}">${[1,2,3].map(w=>`<option value="${w}" ${(state.weights[c.id]??c.weight)==w?'selected':''}>${w}</option>`).join('')}</select></label></div>${active().map(i=>`<fieldset class="rating-set"><legend>${safe(state.names[i])}<span class="required-mark"> · обов’язкова оцінка</span></legend><div class="rating-options">${Object.entries(labels).map(([v,label])=>`<label class="rating-option"><input type="radio" name="rate-${i}-${c.id}" value="${v}" data-rating="${i}|${c.id}" ${state.answers[`${i}|${c.id}`]===v?'checked':''}><span>${label}</span></label>`).join('')}</div><label class="note-field">Нотатка або доказ (необов’язково)<textarea maxlength="500" data-note="${i}|${c.id}" placeholder="Що показав постачальник? Не додавайте конфіденційних даних.">${safe(state.notes[`${i}|${c.id}`])}</textarea></label>${(state.weights[c.id]??c.weight)===3&&state.answers[`${i}|${c.id}`]==='na'?`<label class="note-field">Чому критерій не застосовується? <textarea maxlength="300" data-na-reason="${i}|${c.id}" required>${safe(state.naReason[`${i}|${c.id}`])}</textarea></label>`:''}</fieldset>`).join('')}</article>`).join('')}`;}
function start(){const names=$$('[data-pms-name]').map(x=>x.value.trim());if(!names[0]){$('[data-setup-error]').textContent='Вкажіть назву першої PMS, щоб почати.';return}if(new Set(names.filter(Boolean).map(n=>n.toLocaleLowerCase())).size!==names.filter(Boolean).length){$('[data-setup-error]').textContent='Введіть різні назви систем.';return}state.names=names;state.hotel=$('[data-hotel]').value.trim();state.property=$('[data-property]').value.trim();state.rooms=$('[data-rooms]').value;state.started=true;state.done=false;state.group=0;save();$('.checklist-intro').hidden=true;$('[data-work]').hidden=false;draw();send('pms_checklist_start');}
function score(i){let eligible=0,verified=0,points=0,applied=0,failed=[],criticalFails=[],unknown=[],todo=[];for(const g of groups)for(const c of g.items){const w=Number(state.weights[c.id]??c.weight),s=state.answers[`${i}|${c.id}`];if(!s){todo.push(c);continue}if(s==='na')continue;eligible+=w;applied++;if(s==='unknown'){unknown.push(c);continue}verified+=w;if(s==='failed'){failed.push(c);if(w===3)criticalFails.push(c)}points+=w*(s==='confirmed'?2:s==='partial'?1:0)}return {score:verified?Math.round(points/(2*verified)*100):null,coverage:eligible?Math.round(verified/eligible*100):null,verifiedCount:ids().filter(id=>['confirmed','partial','failed'].includes(state.answers[`${i}|${id}`])).length,applied,failed,criticalFails,unknown,todo,provisional:unknown.length>0||criticalFails.length>0}}
function finish(){const missing=[];for(const i of active())for(const g of groups)for(const c of g.items){const k=`${i}|${c.id}`;if(!state.answers[k])missing.push({i,c});if(c.weight===3&&(state.weights[c.id]??c.weight)===3&&state.answers[k]==='na'&&!state.naReason[k]?.trim())missing.push({i,c,reason:true})}if(missing.length){$('[data-group-error]').textContent=missing[0].reason?`Додайте коротке пояснення для «Не застосовується»: ${missing[0].c.title} (${state.names[missing[0].i]}).`:`Оцініть усі критерії. Залишилося заповнити ${new Set(missing.map(x=>`${x.i}|${x.c.id}`)).size}. Перший незаповнений: ${state.names[missing[0].i]} · ${missing[0].c.title}.`;return}state.done=true;save();renderResults();send('pms_checklist_complete');}
function renderResults(){const box=$('[data-results]');box.hidden=false;$('[data-report-wrap]').hidden=app.dataset.emailReady!=='true';$('[data-work]').hidden=true;box.innerHTML=`<div class="result-heading"><p class="tool-kicker">ВАШ РЕЗУЛЬТАТ</p><h2>Порівняння систем</h2><p>${state.hotel?`Об’єкт: ${safe(state.hotel)}. `:''}${state.property?safe(state.property)+'. ':''}${state.rooms?`${safe(state.rooms)} номерів. `:''}Це ваша оцінка за обраними критеріями.</p><div class="result-cards">${active().map(i=>{const s=score(i);return `<article class="result-card"><h3>${safe(state.names[i])}</h3><div class="result-metrics"><p><strong>${s.score===null?'Недостатньо даних':`${s.score}%`}</strong><span>оцінка перевірених пунктів</span></p><p><strong>${s.coverage===null?'Не застосовується':`${s.coverage}%`}</strong><span>зважене покриття перевіркою</span></p></div><p>Оцінено ${s.verifiedCount} із ${s.applied} застосовних критеріїв.</p>${s.provisional?'<p class="result-flag">Попередній результат, є неперевірені пункти або критичні провали.</p>':'<p class="result-flag result-flag-ok">Статуси заповнено. Бал відображає лише вашу оцінку за цією методикою.</p>'}<p><strong>Критичні провали:</strong> ${s.criticalFails.length?s.criticalFails.map(c=>safe(c.title)).join(', '):'не зафіксовані'}</p><p><strong>Не пройдено:</strong> ${s.failed.length?s.failed.map(c=>safe(c.title)).join(', '):'немає'}</p><p><strong>Не перевірено:</strong> ${s.unknown.length?s.unknown.map(c=>safe(c.title)).join(', '):'немає'}</p><p><strong>Наступні кроки:</strong> ${[...s.failed,...s.unknown].length?[...s.failed,...s.unknown].map(c=>safe(c.how)).join('; '):'Збережіть комерційну пропозицію та перевірте умови договору перед рішенням.'}</p></article>`}).join('')}</div>${active().length>1?`<div class="comparison-table-wrap"><table><thead><tr><th>Критерій</th>${active().map(i=>`<th>${safe(state.names[i])}</th>`).join('')}</tr></thead><tbody>${groups.flatMap(g=>g.items).map(c=>`<tr><th>${safe(c.title)}</th>${active().map(i=>`<td>${labels[state.answers[`${i}|${c.id}`]]||'-'} · вага ${state.weights[c.id]??c.weight}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`:''}<h3>Повна матриця оцінок</h3>${active().map(i=>`<section class="result-pms"><h4>${safe(state.names[i])}</h4>${groups.map(g=>`<h5>${safe(g.name)}</h5><div class="comparison-table-wrap"><table><thead><tr><th>Критерій</th><th>Вага</th><th>Оцінка</th><th>Нотатка</th></tr></thead><tbody>${g.items.map(c=>`<tr><td>${safe(c.title)}</td><td>${state.weights[c.id]??c.weight}</td><td>${labels[state.answers[`${i}|${c.id}`]]}</td><td>${safe(state.notes[`${i}|${c.id}`]||state.naReason[`${i}|${c.id}`]||'')}</td></tr>`).join('')}</tbody></table></div>`).join('')}</section>`).join('')}<p class="tool-note">Оцінка створена вами на основі інформації, яку вдалося перевірити. Вона не є незалежним аудитом і не гарантує якості системи. Не визначаємо постачальника-переможця автоматично.</p><div class="tool-actions"><button class="tool-primary" type="button" data-print>Друкувати або зберегти як PDF</button><button class="tool-secondary" type="button" data-edit>Повернутися до оцінювання</button><button class="tool-secondary" type="button" data-reset>Очистити дані</button><a class="tool-secondary" href="/contact">Обговорити процеси мого готелю ↗</a></div>${app.dataset.emailReady==='true'?'':`<p class="email-notice">Надсилання повного звіту на email стане доступним після підключення поштового сервісу. Зараз повний звіт доступний тут і його можна зберегти як PDF.</p>`}</div>`;box.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});}
app.addEventListener('submit',async e=>{const form=e.target.closest('[data-report-form]');if(!form)return;e.preventDefault();if(!form.reportValidity())return;const button=form.querySelector('[type=submit]'),status=form.querySelector('[data-report-status]');button.disabled=true;button.textContent='Надсилаємо…';status.textContent='Звіт передається поштовому сервісу.';const pms=active().map(i=>{const results=[];for(const g of groups)for(const c of g.items){const k=i+'|'+c.id;results.push({id:c.id,status:state.answers[k],weight:Number(state.weights[c.id]??c.weight),note:state.notes[k]||'',naReason:state.naReason[k]||''})}return{name:state.names[i],results}});const payload={email:form.elements.email.value.trim(),website:form.elements.website.value,consent:form.elements.consent.checked,hotel:state.hotel,property:state.property,rooms:state.rooms,pms};send('pms_report_email_request');try{const response=await fetch('/api/tools/pms-report',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});const data=await response.json();if(!response.ok||!data.ok)throw new Error(data.message||'Не вдалося надіслати звіт.');status.textContent=data.message;send('pms_report_email_accepted')}catch(error){status.textContent=error.message||'Не вдалося надіслати звіт. Спробуйте пізніше.';send('pms_report_email_error')}finally{button.disabled=false;button.textContent='Надіслати звіт'}});
app.addEventListener('input',e=>{if(e.target.matches('[data-pms-name]'))state.names[Number(e.target.dataset.pmsName)]=e.target.value;if(e.target.matches('[data-hotel]'))state.hotel=e.target.value;if(e.target.matches('[data-property]'))state.property=e.target.value;if(e.target.matches('[data-rooms]'))state.rooms=e.target.value;if(e.target.matches('[data-note]'))state.notes[e.target.dataset.note]=e.target.value;if(e.target.matches('[data-na-reason]'))state.naReason[e.target.dataset.naReason]=e.target.value;save()});
app.addEventListener('change',e=>{if(e.target.matches('[data-rating]')){state.answers[e.target.dataset.rating]=e.target.value;const c=groups.flatMap(g=>g.items).find(x=>x.id===e.target.dataset.rating.split('|')[1]);if(e.target.value==='na'&&(state.weights[c.id]??c.weight)===3)state.naReason[e.target.dataset.rating]='';save();draw()}if(e.target.matches('[data-weight]')){state.weights[e.target.dataset.weight]=Number(e.target.value);save();draw()}});
app.addEventListener('click',e=>{if(e.target.closest('[data-tool-start]')){e.preventDefault();document.querySelector('#checklist-start').scrollIntoView({behavior:'smooth'})}if(e.target.closest('[data-begin]'))start();if(e.target.closest('[data-prev]')){state.group=Math.max(0,state.group-1);save();draw()}if(e.target.closest('[data-next]')){send('pms_checklist_group_complete');state.group=Math.min(groups.length-1,state.group+1);save();draw()}if(e.target.closest('[data-finish]'))finish();if(e.target.closest('[data-print]'))window.print();if(e.target.closest('[data-edit]')){$('[data-results]').hidden=true;$('[data-work]').hidden=false;draw();$('[data-work]').scrollIntoView({behavior:'smooth'})}if(e.target.closest('[data-reset]')){if(confirm('Очистити збережені оцінки та примітки в цьому браузері?')){localStorage.removeItem(key);location.reload()}}});
if(state.started){$$('[data-pms-name]').forEach((el,i)=>el.value=state.names[i]||'');$('[data-hotel]').value=state.hotel||'';$('[data-property]').value=state.property||'';$('[data-rooms]').value=state.rooms||'';$('.checklist-intro').hidden=true;if(state.done)renderResults();else{$('[data-work]').hidden=false;draw()}}
}
})();

(()=>{
const root=document.querySelector('[data-housekeeping]');if(!root)return;
const items=[...root.querySelectorAll('[data-housekeeping-item]')],result=root.querySelector('[data-room-result]');
const get=(selector)=>root.querySelector(selector);
function collect(){return items.map(card=>{const id=card.dataset.housekeepingItem,status=card.querySelector(`[data-room-status="${id}"]`).value,critical=card.querySelector(`[data-critical="${id}"]`).checked,naReason=card.querySelector(`[data-room-na-reason="${id}"]`).value.trim(),note=card.querySelector(`[data-room-note="${id}"]`).value.trim(),title=card.querySelector('legend').textContent.trim();return{id,title,status,critical,naReason,note}})}
function updateReasons(){for(const card of items){const id=card.dataset.housekeepingItem,select=card.querySelector(`[data-room-status="${id}"]`),wrap=card.querySelector(`[data-na-wrap="${id}"]`);wrap.hidden=select.value!=='not_applicable';}}
function check(){updateReasons();const rows=collect(),blockers=rows.filter(item=>item.critical&&(item.status==='fail'||item.status==='not_checked'||(item.status==='not_applicable'&&!item.naReason))),incomplete=rows.filter(item=>!item.critical&&(item.status==='fail'||item.status==='not_checked'));
 const title=get('[data-room-result-title]'),copy=get('[data-room-result-copy]'),list=get('[data-room-blockers]');list.replaceChildren();
 if(blockers.length){title.textContent='Є питання, що блокують підтвердження готовності';copy.textContent='Перевірте критичні пункти й усуньте або поясніть зауваження. Інструмент не позначає номер готовим.';for(const item of blockers){const li=document.createElement('li');li.textContent=`${item.id}: ${item.title}${item.status==='not_applicable'&&!item.naReason?' · додайте пояснення':item.status==='fail'?' · є зауваження':' · не перевірено'}`;list.append(li)}}
 else if(incomplete.length){title.textContent='Картка ще не завершена';copy.textContent=`Залишилося опрацювати ${incomplete.length} некритичних пунктів. Вони не підтверджують готовність, доки не перевірені.`;for(const item of incomplete){const li=document.createElement('li');li.textContent=`${item.id}: ${item.title} · ${item.status==='fail'?'є зауваження':'не перевірено'}`;list.append(li)}}
 else{title.textContent='Перевірку завершено';copy.textContent='Немає невирішених пунктів у заповненій картці. Готовність підтверджує відповідальна людина після фізичної перевірки.'}
 result.hidden=false;result.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'nearest'});
}
root.addEventListener('change',event=>{if(event.target.matches('[data-room-status]'))updateReasons()});
get('[data-room-check]').addEventListener('click',check);
get('[data-room-print]').addEventListener('click',()=>window.print());
get('[data-room-export]').addEventListener('click',()=>{const file={schema_version:1,tool:'VDALO room acceptance checklist',created_at:new Date().toISOString(),room_alias:get('[data-room-alias]').value.trim(),date:get('[data-room-date]').value,checker_role:get('[data-room-role]').value.trim(),items:collect()};const blob=new Blob([JSON.stringify(file,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='vdalo-room-acceptance.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)});
get('[data-room-reset]').addEventListener('click',()=>{if(!confirm('Очистити всі позначки та нотатки цієї картки?'))return;root.querySelectorAll('input[type=text],input[type=date],textarea').forEach(input=>input.value='');root.querySelectorAll('[data-room-status]').forEach(select=>select.value='not_checked');root.querySelectorAll('[data-critical]').forEach((input,index)=>input.checked=index<5);result.hidden=true;updateReasons()});
updateReasons();
})();

(()=>{
const root=document.querySelector('[data-admin-time]');if(!root)return;
const money=new Intl.NumberFormat('uk-UA',{style:'currency',currency:'UAH',maximumFractionDigits:2}),hours=new Intl.NumberFormat('uk-UA',{maximumFractionDigits:2});
const fields={hour:root.querySelector('[data-time-hour]'),realization:root.querySelector('[data-time-realization]'),cost:root.querySelector('[data-time-monthly-cost]')},error=root.querySelector('[data-time-error]'),exportButton=root.querySelector('[data-time-export]'),result=root.querySelector('[data-time-results]');let rows=[];
root.querySelector('[data-time-calculate]').addEventListener('click',()=>{
 const inputs=[...root.querySelectorAll('input[type=number]')],invalid=inputs.find(field=>!field.checkValidity()||field.value.trim()==='');
 if(invalid){error.textContent='Перевірте межі полів. Кількість операцій і хвилини мають бути цілими числами.';invalid.focus();exportButton.disabled=true;return}
 const processes=[...root.querySelectorAll('.advanced-tool-row')].map(row=>({name:row.querySelector('[data-time-name]').value.trim()||'Процес без назви',count:Number(row.querySelector('[data-time-count]').value),beforeMinutes:Number(row.querySelector('[data-time-before]').value),afterMinutes:Number(row.querySelector('[data-time-after]').value)}));
 if(processes.some(row=>!Number.isInteger(row.count)||!Number.isInteger(row.beforeMinutes)||!Number.isInteger(row.afterMinutes))){error.textContent='Кількість операцій і хвилини мають бути цілими числами.';exportButton.disabled=true;return}
 const before=processes.reduce((sum,row)=>sum+row.count*row.beforeMinutes/60,0),after=processes.reduce((sum,row)=>sum+row.count*row.afterMinutes/60,0),released=before-after,rate=Number(fields.hour.value),share=Number(fields.realization.value),monthly=Number(fields.cost.value),resource=released*rate,payments=Math.max(0,released)*rate*share/100,net=payments-monthly;
 const values={before:`${hours.format(before)} год`,after:`${hours.format(after)} год`,released:`${hours.format(released)} год`,resource:money.format(resource),payments:money.format(payments),net:money.format(net)};
 for(const [key,value] of Object.entries(values))root.querySelector(`[data-time-out="${key}"]`).textContent=value;
 root.querySelector('[data-time-summary]').textContent=released<0?'Після зміни в цьому сценарії процеси потребують більше часу. Це не є економією.':`За введеною вами часткою можливе скорочення виплат оцінено у ${money.format(payments)}. Це умовна модель, а не підтверджений ефект.`;
 rows=[['Показник','Значення'],...processes.map(row=>[row.name,`${row.count} операцій; ${row.beforeMinutes} хв до; ${row.afterMinutes} хв після`]),['Час до, год',before],['Час після, год',after],['Різниця, год',released],['Оцінка вартості різниці часу, грн',resource],['Модель можливого скорочення виплат, грн',payments],['Різниця після місячної вартості, грн',net]];
 error.textContent='';result.hidden=false;exportButton.disabled=false;
});
root.querySelector('[data-time-export]').addEventListener('click',()=>{if(!rows.length)return;const csv=rows.map(row=>row.map(value=>`"${String(value).replaceAll('"','""')}"`).join(';')).join('\r\n'),blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='vdalo-admin-time-scenario.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)});
})();

(()=>{
const root=document.querySelector('[data-website-checklist]');if(!root)return;
const items=[...root.querySelectorAll('[data-web-item]')],result=root.querySelector('[data-web-results]'),exportButton=root.querySelector('[data-web-export]');let report=null;
function collect(){return items.map(card=>({id:card.dataset.webItem,critical:card.dataset.critical==='true',status:card.querySelector(`[data-web-status="${card.dataset.webItem}"]`).value,observation:card.querySelector(`[data-web-observation="${card.dataset.webItem}"]`).value.trim(),nextAction:card.querySelector(`[data-web-action="${card.dataset.webItem}"]`).value.trim(),owner:card.querySelector(`[data-web-owner="${card.dataset.webItem}"]`).value.trim()}))}
root.querySelector('[data-web-review]').addEventListener('click',()=>{
 const rows=collect(),open=rows.filter(row=>row.status==='unknown'||row.status==='partial'||row.status==='fail'),criticalOpen=open.filter(row=>row.critical),coverage=Math.round(rows.filter(row=>row.status!=='unknown').length/rows.length*100),url=root.querySelector('[data-web-url]').value.trim();
 root.querySelector('[data-web-error]').textContent=url&&!root.querySelector('[data-web-url]').checkValidity()?'Перевірте формат адреси сайту.':'';if(root.querySelector('[data-web-error]').textContent){exportButton.disabled=true;return}
 report={date:root.querySelector('[data-web-date]').value,checkerRole:root.querySelector('[data-web-role]').value.trim(),siteUrl:url,coverage,criticalOpen:criticalOpen.length,openItems:open,items:rows};
 root.querySelector('[data-web-summary]').textContent=`Заповненість перевірки: ${coverage}%. Відкритих пунктів: ${open.length}, з них важливих: ${criticalOpen.length}. Це підсумок введених вручну спостережень, не оцінка якості чи конверсії.`;
 const list=root.querySelector('[data-web-actions]');list.replaceChildren();for(const row of open){const li=document.createElement('li'),label=document.createElement('strong'),details=document.createElement('span');label.textContent=`${row.id}${row.critical?' · важливо':''}: ${row.nextAction||'Визначте наступну дію під час ручної перевірки.'}`;details.textContent=`${row.status==='unknown'?'Не перевірено':row.status==='partial'?'Частково':'Проблема'}${row.owner?` · власник: ${row.owner}`:''}`;li.append(label,details);list.append(li)}
 result.hidden=false;exportButton.disabled=false;
});
root.querySelector('[data-web-export]').addEventListener('click',()=>{if(!report)return;const blob=new Blob([JSON.stringify({schema_version:1,tool:'VDALO manual hotel website checklist',created_at:new Date().toISOString(),...report},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='vdalo-hotel-website-checklist.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)});
root.querySelector('[data-web-print]').addEventListener('click',()=>window.print());
root.querySelector('[data-web-reset]').addEventListener('click',()=>{if(!confirm('Очистити всі поля ручної перевірки?'))return;root.querySelectorAll('input,textarea').forEach(field=>field.value='');root.querySelectorAll('[data-web-status]').forEach(select=>select.value='unknown');report=null;result.hidden=true;exportButton.disabled=true;root.querySelector('[data-web-error]').textContent=''});
})();

(()=>{
const fmt=new Intl.NumberFormat('uk-UA',{style:'currency',currency:'UAH',maximumFractionDigits:2});
const pct=new Intl.NumberFormat('uk-UA',{maximumFractionDigits:2});
const number=new Intl.NumberFormat('uk-UA',{maximumFractionDigits:2});
document.querySelectorAll('[data-scenario]').forEach(root=>{
 const inputs=[...root.querySelectorAll('[data-scenario-input]')],error=root.querySelector('[data-scenario-error]'),summary=root.querySelector('[data-scenario-summary]'),exportButton=root.querySelector('[data-scenario-export]');
 let rows=[];
 const show=(key,value)=>{const el=root.querySelector(`[data-scenario-result="${key}"]`);if(el)el.textContent=value};
 function calculate(){
  const invalid=inputs.find(input=>!input.checkValidity()||input.value.trim()==='');
  inputs.forEach(input=>input.setAttribute('aria-invalid',String(!input.checkValidity()||input.value.trim()==='')));
  if(invalid){error.textContent='Перевірте значення у виділеному полі та його межі.';exportButton.disabled=true;invalid.focus();return}
  error.textContent='';
  const v=Object.fromEntries(inputs.map(input=>[input.dataset.scenarioInput,Number(input.value)]));
  let result,labels;
  if(root.dataset.scenario==='channel-economics'){
   const otaRevenue=v.baseRevenue,directRevenue=otaRevenue*(1-v.directDiscountPct/100),otaFee=otaRevenue*v.otaFeePct/100,directPsp=directRevenue*v.directPspPct/100;
   const ota=otaRevenue-otaFee-v.variableStayCost-v.otaOtherCosts;
   const direct=directRevenue-directPsp-v.directAcquisitionCost-v.variableStayCost-v.directOtherCosts;
   result={otaContribution:ota,directContribution:direct,difference:direct-ota,maxAcquisitionCost:directRevenue-directPsp-v.variableStayCost-v.directOtherCosts-ota};
   labels={otaContribution:'Внесок через OTA',directContribution:'Внесок через прямий канал',difference:'Різниця: прямий мінус OTA',maxAcquisitionCost:'Граничні витрати на залучення для рівності'};
   summary.textContent=result.difference>=0?`За введеними умовами прямий канал має більший внесок на ${fmt.format(result.difference)}.`:`За введеними умовами прямий канал має менший внесок на ${fmt.format(Math.abs(result.difference))}.`;
  }else{
   const revenue=v.adr*v.soldRoomNights,distribution=revenue*v.distributionPct/100,margin=v.adr*(1-v.distributionPct/100)-v.variablePerSoldNight;
   const be=margin>0?v.fixedCosts/margin:null,occupancy=be===null?null:100*be/v.availableRoomNights;
   result={revenue,costPerSoldNightBeforeDistribution:v.soldRoomNights?v.fixedCosts/v.soldRoomNights+v.variablePerSoldNight:null,costPerSoldNightAfterDistribution:v.soldRoomNights?v.fixedCosts/v.soldRoomNights+v.variablePerSoldNight+v.adr*v.distributionPct/100:null,resultAfterIncludedCosts:v.soldRoomNights*margin-v.fixedCosts,breakEvenRoomNights:be,breakEvenOccupancyPct:occupancy};
   labels={revenue:'Виручка за номероночи',costPerSoldNightBeforeDistribution:'Витрати на ніч до витрат розподілу',costPerSoldNightAfterDistribution:'Витрати на ніч після витрат розподілу',resultAfterIncludedCosts:'Результат після врахованих витрат',breakEvenRoomNights:'Номероночи для беззбитковості',breakEvenOccupancyPct:'Завантаження для беззбитковості'};
   if(margin<=0)summary.textContent='За цих умов внесок кожної додаткової ночі не додатний, тому беззбитковість недосяжна.';
   else if(occupancy>100)summary.textContent=`Потрібно ${pct.format(occupancy)}% завантаження. За цих умов доступного фонду недостатньо.`;
   else summary.textContent=`Для покриття заданих витрат потрібно щонайменше ${Math.ceil(be)} номероночей, або близько ${pct.format(occupancy)}% доступного фонду.`;
  }
  rows=[...inputs.map(input=>[input.labels[0]?.textContent.trim()||input.dataset.scenarioInput,input.value]),...Object.entries(result).map(([key,value])=>[labels[key],value===null?'не визначено':value])];
  for(const [key,value] of Object.entries(result)){
   let output=value===null?'Не визначено':key==='difference'&&value<0?`−${fmt.format(Math.abs(value))}`:key==='breakEvenOccupancyPct'?`${pct.format(value)}%`:key==='breakEvenRoomNights'?`${number.format(value)} (цілих: ${Math.ceil(value)})`:fmt.format(value);
   show(key,output);
  }
  exportButton.disabled=false;
 }
 root.querySelector('[data-scenario-calculate]')?.addEventListener('click',calculate);
 inputs.forEach(input=>input.addEventListener('input',()=>{error.textContent='';exportButton.disabled=true;input.setAttribute('aria-invalid',String(!input.checkValidity()))}));
 exportButton?.addEventListener('click',()=>{
  if(!rows.length)return;
  const quote=value=>`"${String(value).replaceAll('"','""')}"`;
  const blob=new Blob(['\ufeff'+rows.map(row=>row.map(quote).join(';')).join('\r\n')],{type:'text/csv;charset=utf-8'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`vdalo-${root.dataset.scenario}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 });
});
})();

(()=>{
const root=document.querySelector('[data-hotel-kpis]');if(!root)return;
const num=(key)=>{const field=root.querySelector(`[data-kpi-${key}]`);return field?.value.trim()===''?null:Number(field?.value)},money=new Intl.NumberFormat('uk-UA',{style:'currency',currency:'UAH',maximumFractionDigits:2}),decimal=new Intl.NumberFormat('uk-UA',{maximumFractionDigits:2});let rows=[];
root.querySelector('[data-kpi-index-type]').addEventListener('change',event=>{root.querySelector('[data-kpi-index-label]').textContent=event.target.value});
root.querySelector('[data-kpi-calculate]').addEventListener('click',()=>{
 const fields=[...root.querySelectorAll('input[type=number]')],invalid=fields.find(field=>field.value.trim()!==''&&!field.checkValidity()),err=root.querySelector('[data-kpi-error]'),exportButton=root.querySelector('[data-kpi-export]');
 if(invalid){err.textContent='Перевірте межі введених значень.';invalid.focus();exportButton.disabled=true;return}
 const available=num('rooms'),revenue=num('revenue'),gop=num('gop'),beds=num('beds'),cohortNights=num('cohort-nights'),cohortBookings=num('cohort-bookings'),own=num('own'),peer=num('peer'),indexType=root.querySelector('[data-kpi-index-type]').value;
 const results={tRevpar:available>0&&revenue>=0?revenue/available:null,goppar:available>0&&gop!==null?gop/available:null,tRevPab:beds>0&&revenue>=0?revenue/beds:null,alos:cohortNights>=0&&cohortBookings>0?cohortNights/cohortBookings:null,index:own>=0&&peer>0?100*own/peer:null};
 for(const [key,value] of Object.entries(results)){root.querySelector(`[data-kpi-out="${key}"]`).textContent=value===null?'Недостатньо даних':key==='index'?`${decimal.format(value)} (${indexType})`:key==='alos'?`${decimal.format(value)} ночі`:money.format(value)}
 rows=[['Показник','Значення'],['TRevPAR',results.tRevpar??'Недостатньо даних'],['GOPPAR',results.goppar??'Недостатньо даних'],['TRevPAB',results.tRevPab??'Недостатньо даних'],['ALOS',results.alos??'Недостатньо даних'],[indexType,results.index??'Недостатньо даних']];
 root.querySelector('[data-kpi-results]').hidden=false;err.textContent='';exportButton.disabled=false;
});
root.querySelector('[data-kpi-export]').addEventListener('click',()=>{if(!rows.length)return;const csv=rows.map(row=>row.map(value=>`"${String(value).replaceAll('"','""')}"`).join(';')).join('\r\n'),blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='vdalo-hotel-kpis.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)});
})();

(()=>{
const root=document.querySelector('[data-pms-tco]');if(!root)return;
const money=new Intl.NumberFormat('uk-UA',{style:'currency',currency:'UAH',maximumFractionDigits:2}),exportButton=root.querySelector('[data-tco-export]'),output=root.querySelector('[data-tco-output]'),results=root.querySelector('[data-tco-results]'),error=root.querySelector('[data-tco-error]');let rows=[];
root.querySelector('[data-tco-calculate]').addEventListener('click',()=>{
 const monthsField=root.querySelector('[data-tco-months]'),months=Number(monthsField.value),proposals=[...root.querySelectorAll('[data-tco-proposal]')],parsed=[];error.textContent='';
 if(!monthsField.checkValidity()){error.textContent='Період має бути цілим числом від 1 до 60 місяців.';monthsField.focus();exportButton.disabled=true;return}
 for(const card of proposals){const nameField=card.querySelector('[data-tco-name]'),name=nameField.value.trim(),fields=[...card.querySelectorAll('[data-tco-value]')],entered=name||fields.some(field=>field.value.trim()!==''),invalid=fields.find(field=>field.value.trim()===''||!field.checkValidity());
  if(!entered)continue;
  if(!name||invalid){error.textContent=`Заповніть назву та всі статті витрат у пропозиції ${card.dataset.tcoProposal}. Невідоме не дорівнює нулю.`;if(!name)nameField.focus();else invalid.focus();exportButton.disabled=true;return}
  const data=Object.fromEntries(fields.map(field=>[field.dataset.tcoValue.split('|')[1],Number(field.value)]));
  const cash=data.setup+data.migration+data.hardware+months*(data.baseMonthly+data.modulesMonthly)+data.usageTotal+data.renewalsTotal,internal=data.internalHours*data.hourCost;
  parsed.push({name,cash,internal,extended:cash+internal});
 }
 if(parsed.length<2){error.textContent='Заповніть щонайменше дві повні пропозиції на однаковий період.';exportButton.disabled=true;return}
 output.replaceChildren();for(const item of parsed){const article=document.createElement('article'),heading=document.createElement('h4'),list=document.createElement('dl');heading.textContent=item.name;for(const [label,value] of [['Грошові витрати',money.format(item.cash)],['Внутрішній ресурс окремо',money.format(item.internal)],['Разом із внутрішнім ресурсом',money.format(item.extended)]]){const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=value;list.append(dt,dd)}article.append(heading,list);output.append(article)}
 rows=[['Пропозиція','Грошові витрати за період, грн','Внутрішній ресурс окремо, грн','Разом із ресурсом, грн'],...parsed.map(item=>[item.name,item.cash,item.internal,item.extended])];
 results.hidden=false;exportButton.disabled=false;
});
root.querySelector('[data-tco-export]').addEventListener('click',()=>{if(!rows.length)return;const csv=rows.map(row=>row.map(value=>`"${String(value).replaceAll('"','""')}"`).join(';')).join('\r\n'),blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='vdalo-pms-tco-comparison.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)});
})();

(()=>{
const root=document.querySelector('[data-guest-message]');if(!root)return;
const output=root.querySelector('[data-message-output]'),copyButton=root.querySelector('[data-message-copy]'),downloadButton=root.querySelector('[data-message-download]'),status=root.querySelector('[data-message-status]'),error=root.querySelector('[data-message-error]');
const get=key=>root.querySelector(`[data-message-${key}]`).value.trim();
root.querySelector('[data-message-build]').addEventListener('click',()=>{
 const stage=get('stage'),language=get('language'),property=get('property')||'[НАЗВА ОБ’ЄКТА]',address=get('address')||'[АДРЕСА АБО ТОЧКА ПРИБУТТЯ]',time=get('time')||'[ЧАС ЗА ПРАВИЛАМИ ОБ’ЄКТА]',contact=get('contact')||'[КОНТАКТ РЕЦЕПЦІЇ]',route=get('route')||'[ПОСИЛАННЯ НА МАРШРУТ АБО ІНСТРУКЦІЮ]',services=get('services');
 if(route!=='[ПОСИЛАННЯ НА МАРШРУТ АБО ІНСТРУКЦІЮ]'&&!/^https?:\/\//i.test(route)){error.textContent='Посилання має починатися з https:// або http://.';root.querySelector('[data-message-route]').focus();copyButton.disabled=true;downloadButton.disabled=true;return}
 const ua={prearrival:`Вітаємо у ${property}!\n\nВаш заїзд заплановано на [ДАТА]. Час заїзду: ${time}.\nАдреса або точка прибуття: ${address}.\nПеред приїздом перегляньте інструкцію: ${route}.\n${services?`Додаткова інформація: ${services}.\n`:''}Якщо потрібна допомога, зв’яжіться з рецепцією: ${contact}.\n\nБудь ласка, перевірте деталі бронювання та повідомте нам, якщо інформація змінилася.`,late:`Вітаємо у ${property}!\n\nДля пізнього прибуття скористайтеся інструкцією: ${route}.\nАдреса або точка прибуття: ${address}.\nУзгоджений час прибуття: ${time}.\n${services?`Підтверджені деталі: ${services}.\n`:''}Якщо виникне питання, зв’яжіться з рецепцією: ${contact}.\n\nКод або пароль доступу надішліть гостю лише окремим погодженим і безпечним каналом, якщо це передбачено процедурою об’єкта.`,checkout:`Дякуємо за перебування у ${property}!\n\nБудь ласка, звільніть номер до ${time}.\nЯкщо маєте питання щодо виїзду або оплати, зверніться до рецепції: ${contact}.\n${services?`Додаткова інформація: ${services}.\n`:''}Перед від’їздом перевірте, чи не залишили особисті речі.\n\nБудемо раді бачити вас знову.`};
 const en={prearrival:`Welcome to ${property}!\n\nYour arrival is planned for [DATE]. Check-in time: ${time}.\nAddress or arrival point: ${address}.\nPlease review the instructions before arrival: ${route}.\n${services?`Additional information: ${services}.\n`:''}For assistance, contact the reception team: ${contact}.\n\nPlease check your booking details and let us know if anything has changed.`,late:`Welcome to ${property}!\n\nFor a late arrival, please follow these instructions: ${route}.\nAddress or arrival point: ${address}.\nAgreed arrival time: ${time}.\n${services?`Confirmed details: ${services}.\n`:''}If you need help, contact the reception team: ${contact}.\n\nShare any access code or password only through the property's approved secure channel, if this is part of its procedure.`,checkout:`Thank you for staying at ${property}!\n\nPlease check out by ${time}.\nFor questions about departure or payment, contact the reception team: ${contact}.\n${services?`Additional information: ${services}.\n`:''}Before leaving, please check that you have all personal belongings.\n\nWe hope to welcome you again.`};
 const extraUa={welcome:`Вітаємо у ${property}!\n\nДякуємо, що обрали наш об’єкт. Тут ви можете переглянути інформацію про прибуття: ${route}.\nАдреса: ${address}.\nКонтакт рецепції: ${contact}.\n${services?`Підтверджені послуги: ${services}.\n`:''}До зустрічі!`,fact:`${property}\n\nАдреса: ${address}.\nКонтакт рецепції: ${contact}.\nЧас заїзду або виїзду: ${time}.\n${services?`Інформація про підтверджені послуги: ${services}.\n`:''}Маршрут або інструкція: ${route}.\n\nПеред публікацією перевірте кожен факт.`,arrival_request:`Вітаємо! Щоб підготуватися до вашого прибуття в ${property}, повідомте, будь ласка, орієнтовний час приїзду.\n\nЧас заїзду за правилами об’єкта: ${time}.\nЯкщо потрібна допомога, зв’яжіться з рецепцією: ${contact}.`,group_offer:`Дякуємо за інтерес до ${property}.\n\nЩоб підготувати пропозицію для групи, надішліть бажані дати, кількість гостей і потреби групи.\n\nУмови, наявність і ціни потрібно підтвердити окремо. Зв’язок: ${contact}.`,thanks:`Дякуємо за проживання у ${property}!\n\nСподіваємося, вам було зручно. Якщо маєте запитання щодо поїздки чи розрахунку, зв’яжіться з рецепцією: ${contact}.\n${services?`Додаткова інформація: ${services}.\n`:''}Бажаємо гарної дороги.`,feedback:`Дякуємо, що зупинилися у ${property}.\n\nЯкщо маєте час, поділіться чесним відгуком про перебування: [ПОСИЛАННЯ ДЛЯ ВІДГУКУ]. Будь-який зворотний зв’язок допомагає нам помічати, що варто покращити.\n\nЯкщо питання ще не вирішене, напишіть рецепції: ${contact}.`};
 const extraEn={welcome:`Welcome to ${property}!\n\nThank you for choosing our property. Arrival information is available here: ${route}.\nAddress: ${address}.\nReception contact: ${contact}.\n${services?`Confirmed services: ${services}.\n`:''}We look forward to welcoming you!`,fact:`${property}\n\nAddress: ${address}.\nReception contact: ${contact}.\nCheck-in or check-out time: ${time}.\n${services?`Confirmed services: ${services}.\n`:''}Route or instructions: ${route}.\n\nPlease verify every detail before publishing.`,arrival_request:`Hello! To help us prepare for your arrival at ${property}, please let us know your estimated arrival time.\n\nCheck-in time under the property's rules: ${time}.\nFor assistance, contact the reception team: ${contact}.`,group_offer:`Thank you for your interest in ${property}.\n\nTo prepare a group proposal, please share your preferred dates, number of guests, and group requirements.\n\nAvailability, terms, and prices must be confirmed separately. Contact: ${contact}.`,thanks:`Thank you for staying at ${property}!\n\nWe hope your stay was comfortable. For questions about your trip or payment, contact the reception team: ${contact}.\n${services?`Additional information: ${services}.\n`:''}Have a safe journey.`,feedback:`Thank you for staying at ${property}.\n\nIf you have a moment, please share an honest review of your stay: [REVIEW LINK]. Your feedback helps us understand what we can improve.\n\nIf anything is still unresolved, contact the reception team: ${contact}.`};
 output.value=(language==='en'?{...en,...extraEn}:{...ua,...extraUa})[stage];error.textContent='';status.textContent='Чернетка створена. Перевірте плейсхолдери та правила об’єкта перед надсиланням.';copyButton.disabled=false;downloadButton.disabled=false;
});
copyButton.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(output.value);status.textContent='Текст скопійовано. Перевірте його перед використанням.'}catch{output.focus();output.select();status.textContent='Автоматичне копіювання недоступне. Виділено текст, скопіюйте його вручну.'}});
downloadButton.addEventListener('click',()=>{const blob=new Blob([output.value],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='vdalo-guest-message-draft.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)});
})();

(()=>{
const root=document.querySelector('[data-workload]');if(!root)return;
const integerFields=[...root.querySelectorAll('input[type=number]')],money=new Intl.NumberFormat('uk-UA',{maximumFractionDigits:0}),error=root.querySelector('[data-workload-error]'),results=root.querySelector('[data-workload-results]'),exportButton=root.querySelector('[data-workload-export]');let rows=[];
root.querySelector('[data-workload-calculate]').addEventListener('click',()=>{
 const invalid=integerFields.find(field=>!field.checkValidity()||field.value.trim()==='');if(invalid){error.textContent='Перевірте всі цілі значення в зазначених межах.';invalid.focus();exportButton.disabled=true;return}
 const shift=Number(root.querySelector('[data-workload-shift]').value),breaks=Number(root.querySelector('[data-workload-break]').value),other=Number(root.querySelector('[data-workload-other]').value),workers=Number(root.querySelector('[data-workload-workers]').value),available=shift-breaks-other;
 if(available<=0){error.textContent='Доступний час однієї людини має бути більшим за нуль.';exportButton.disabled=true;return}
 const tasks=[...root.querySelectorAll('.advanced-tool-row')].map(card=>({name:card.querySelector('[data-workload-name]').value.trim()||'Задача',count:Number(card.querySelector('[data-workload-count]').value),minutes:Number(card.querySelector('[data-workload-minutes]').value)})),required=tasks.reduce((sum,task)=>sum+task.count*task.minutes,0),capacity=available*workers,gap=capacity-required,minimum=required?Math.ceil(required/available):0;
 const output={required:`${money.format(required)} хв`,person:`${money.format(available)} хв`,team:`${money.format(capacity)} хв`,gap:`${gap<0?'Дефіцит ':'Запас '}${money.format(Math.abs(gap))} хв`,minimum:String(minimum)};for(const [key,value] of Object.entries(output))root.querySelector(`[data-workload-out="${key}"]`).textContent=value;
 root.querySelector('[data-workload-results] p').textContent=workers===0&&required>0?'Працівників не задано, тому доступна місткість команди дорівнює нулю.':`Завантаження команди: ${capacity?`${new Intl.NumberFormat('uk-UA',{maximumFractionDigits:1}).format(100*required/capacity)}%`:'не визначено'}. Теоретичний мінімум не є графіком розподілу кімнат.`;
 rows=[['Задача','Кількість','Хвилин на задачу'],...tasks.map(task=>[task.name,task.count,task.minutes]),['Потрібно хвилин',required],['Доступно одній людині, хв',available],['Доступно команді, хв',capacity],['Різниця, хв',gap],['Мінімум працівників за місткістю',minimum]];error.textContent='';results.hidden=false;exportButton.disabled=false;
});
exportButton.addEventListener('click',()=>{if(!rows.length)return;const csv=rows.map(row=>row.map(value=>`"${String(value).replaceAll('"','""')}"`).join(';')).join('\r\n'),blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='vdalo-housekeeping-workload.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)});
})();

(()=>{
const root=document.querySelector('[data-cancellation]');if(!root)return;
const money=new Intl.NumberFormat('uk-UA',{style:'currency',currency:'UAH',maximumFractionDigits:2}),error=root.querySelector('[data-cancel-error]'),results=root.querySelector('[data-cancel-results]'),exportButton=root.querySelector('[data-cancel-export]');let rows=[];
root.querySelector('[data-cancel-calculate]').addEventListener('click',()=>{
 const inputs=[...root.querySelectorAll('[data-cancel-input]')],invalid=inputs.find(input=>!input.checkValidity()||input.value.trim()==='');if(invalid){error.textContent='Перевірте суми. Усі поля потрібні, нуль вводьте лише для підтвердженої відсутності витрат.';invalid.focus();exportButton.disabled=true;return}
 const v=Object.fromEntries(inputs.map(input=>[input.dataset.cancelInput,Number(input.value)])),planned=v.plannedRevenue-v.plannedVariableCosts,after=v.retainedNet+v.resaleRevenue-v.resaleVariableCosts-v.handlingCosts,difference=planned-after;
 root.querySelector('[data-cancel-out="planned"]').textContent=money.format(planned);root.querySelector('[data-cancel-out="after"]').textContent=money.format(after);root.querySelector('[data-cancel-out="difference"]').textContent=money.format(difference);root.querySelector('[data-cancel-summary]').textContent=difference>0?`Внесок після події менший за плановий на ${money.format(difference)} за вашими введеними даними.`:difference<0?`Внесок після події більший за плановий на ${money.format(Math.abs(difference))} за вашими введеними даними.`:'За введеними даними внесок однаковий.';
 rows=[['Показник','Сума, грн'],['Плановий внесок',planned],['Внесок після події',after],['Плановий мінус після події',difference]];error.textContent='';results.hidden=false;exportButton.disabled=false;
});
exportButton.addEventListener('click',()=>{if(!rows.length)return;const csv=rows.map(row=>row.map(value=>`"${String(value).replaceAll('"','""')}"`).join(';')).join('\r\n'),blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='vdalo-cancellation-impact.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)});
})();

(()=>{
const root=document.querySelector('[data-review-template]');if(!root)return;
const output=root.querySelector('[data-review-output]'),status=root.querySelector('[data-review-status]'),copy=root.querySelector('[data-review-copy]'),download=root.querySelector('[data-review-download]');
root.querySelector('[data-review-build]').addEventListener('click',()=>{
 const kind=root.querySelector('[data-review-kind]').value,english=root.querySelector('[data-review-language]').value==='en',property=root.querySelector('[data-review-property]').value.trim(),contact=root.querySelector('[data-review-contact]').value.trim(),facts=root.querySelector('[data-review-facts]').value.trim(),name=property|| (english?'our property':'наш об’єкт'),contactLine=contact?(english?` You can contact our team at ${contact}.`:` Ви можете зв’язатися з командою за контактом: ${contact}.`):'',factLine=facts?(english?` Confirmed information: ${facts}.`:` Підтверджена інформація: ${facts}.`):'';
 const templates=english?{issue:`Thank you for sharing your feedback about ${name}. We are sorry to hear that this part of your experience did not meet expectations.${factLine}${contactLine} We will review the details through the appropriate channel.`,thanks:`Thank you for taking the time to share your feedback about ${name}.${factLine}${contactLine} We appreciate you letting us know about your experience.`,followup:`Thank you for bringing this to our attention at ${name}. We are checking the details before giving you a complete answer.${factLine}${contactLine} We will follow up through the agreed contact channel.`}:{issue:`Дякуємо, що поділилися відгуком про ${name}. Нам шкода, що ця частина перебування не відповідала вашим очікуванням.${factLine}${contactLine} Ми перевіримо деталі у відповідальному каналі.`,thanks:`Дякуємо, що знайшли час залишити відгук про ${name}.${factLine}${contactLine} Цінуємо, що поділилися своїм досвідом.`,followup:`Дякуємо, що звернули нашу увагу на це питання в ${name}. Ми перевіряємо деталі, перш ніж надати повну відповідь.${factLine}${contactLine} Повернемося до вас погодженим каналом зв’язку.`};
 output.value=templates[kind];status.textContent='Шаблон створено локально. Перевірте факти й відредагуйте відповідь перед ручною публікацією.';copy.disabled=false;download.disabled=false;
});
copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(output.value);status.textContent='Текст скопійовано. Перевірте його перед публікацією.'}catch{output.focus();output.select();status.textContent='Автоматичне копіювання недоступне. Скопіюйте виділений текст вручну.'}});
download.addEventListener('click',()=>{const blob=new Blob([output.value],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='vdalo-review-reply-draft.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)});
})();

(()=>{
const root=document.querySelector('[data-profitability-calculator]');
if(!root)return;
const valueFields=[...root.querySelectorAll('[data-profit-value]')];
const ranges=[...root.querySelectorAll('[data-profit-range]')];
const status=root.querySelector('[data-profit-status]');
let calculatorUseTracked=false;
const currency=new Intl.NumberFormat('uk-UA',{style:'currency',currency:'UAH',maximumFractionDigits:0});
const decimal=new Intl.NumberFormat('uk-UA',{maximumFractionDigits:1});
const get=(key)=>Number(root.querySelector(`[data-profit-value="${key}"]`).value);
const set=(key,value)=>{const field=root.querySelector(`[data-profit-result="${key}"]`);if(field)field.textContent=value};
function recalculate(){
 const invalid=valueFields.find(field=>!field.checkValidity());
 valueFields.forEach(field=>field.setAttribute('aria-invalid',String(!field.checkValidity())));
 if(invalid){status.textContent='Перевірте значення: кожне поле має бути в зазначених межах.';return}
 status.textContent='';
 const rooms=get('rooms'),occupancy=get('occupancy')/100,adr=get('adr'),energyRate=get('energy'),otaShare=get('otaShare')/100,commissionRate=get('otaCommission')/100;
 const availableRoomNights=rooms*30;
 const soldRoomNights=availableRoomNights*occupancy;
 const revenue=soldRoomNights*adr;
 const commission=revenue*otaShare*commissionRate;
 const energy=soldRoomNights*energyRate;
 const remaining=revenue-commission-energy;
 const revpar=availableRoomNights?revenue/availableRoomNights:0;
 set('remaining',currency.format(remaining));
 set('revenue',currency.format(revenue));
 set('revpar',currency.format(revpar));
 set('soldNights',decimal.format(soldRoomNights));
 set('revenueRow',currency.format(revenue));
 set('commission',currency.format(commission));
 set('energyCost',currency.format(energy));
 set('remainingRow',currency.format(remaining));
 const scale=Math.max(revenue,commission,energy,Math.max(remaining,0),1);
 [['revenue',revenue],['commission',commission],['energy',energy],['remaining',Math.max(remaining,0)]].forEach(([key,amount])=>{
  const bar=root.querySelector(`[data-profit-bar="${key}"]`);
  bar.style.width=`${Math.min(100,Math.max(0,amount/scale*100))}%`;
 });
}
valueFields.forEach(field=>field.addEventListener('input',()=>{
 const range=root.querySelector(`[data-profit-range="${field.dataset.profitValue}"]`);
 if(field.checkValidity())range.value=field.value;
 recalculate();
 if(!calculatorUseTracked&&valueFields.every(input=>input.checkValidity())){window.dataLayer=window.dataLayer||[];window.dataLayer.push({event:'hotel_profitability_calculator_use'});calculatorUseTracked=true;}
}));
ranges.forEach(range=>range.addEventListener('input',()=>{
 const field=root.querySelector(`[data-profit-value="${range.dataset.profitRange}"]`);
 field.value=range.value;
 field.setAttribute('aria-invalid','false');
 recalculate();
 if(!calculatorUseTracked&&valueFields.every(input=>input.checkValidity())){window.dataLayer=window.dataLayer||[];window.dataLayer.push({event:'hotel_profitability_calculator_use'});calculatorUseTracked=true;}
}));
recalculate();
})();
