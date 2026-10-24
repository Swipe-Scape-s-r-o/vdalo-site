const pricingRoot = document.querySelector('#pricing');
const core = window.VDALO_PRICING;
if (pricingRoot && core) {
 const money = value => `${Math.round(value).toLocaleString('uk-UA')} грн`;
 let period = 'month';
 const roomInput = pricingRoot.querySelector('#hotel-room-count');
 const roomSlider = pricingRoot.querySelector('#hotel-room-slider');
 const roomSliderValue = pricingRoot.querySelector('[data-room-slider-value]');
 const moduleInputs = [...pricingRoot.querySelectorAll('[data-module]')];
 const periodMonths = {month:1,six:6,year:12};
 const track = (event,properties={}) => {
  window.dataLayer=window.dataLayer||[];
  window.dataLayer.push({event,brand:'VDALO',path:location.pathname,...properties});
 };
 const trackCalculator = (action,extra={}) => {
  const {plan,rooms,estimateMonthly}=estimateData();
  const modules=selectedModules();
  track('pricing_calculator_update',{action,plan_id:plan.id,rooms,period,module_ids:modules,module_count:modules.length,estimated_monthly:Math.round(estimateMonthly),...extra});
 };
 const applyPlanPeriod = monthly => core.applyPeriod(monthly,period);
 const roomLabel = count => count % 10 === 1 && count % 100 !== 11 ? 'номер' : count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 12 || count % 100 > 14) ? 'номери' : 'номерів';
 const selectedModules = () => moduleInputs.filter(input=>input.checked).map(input=>input.dataset.module);
 const estimateData = () => {
  const rooms = Math.max(1,Math.floor(Number(roomInput?.value)||1));
  const plan = core.hotelPlan(rooms);
  const modules = core.modulesPrice(plan.id,rooms,selectedModules());
  const periodPlan = core.applyPeriod(plan.monthly,period);
  const estimateMonthly = (periodPlan.monthlyEquivalent ?? 0) + modules.sum;
  return {plan,rooms,modules,periodPlan,estimateMonthly,isFrom:modules.isFrom||plan.monthly===null};
 };
 const checkoutForm=pricingRoot.querySelector('#checkout-form');
 const setupInput=checkoutForm?.querySelector('[name="setup"]');
 function activateTab(id,focus=false) {
  const tabs=[...pricingRoot.querySelectorAll('[data-pricing-view]')];
  tabs.forEach(tab=>{const active=tab.dataset.pricingView===id;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;});
  pricingRoot.querySelectorAll('.pricing-panel[role="tabpanel"]').forEach(panel=>panel.hidden=panel.id!==`pricing-panel-${id}`);
  if(focus) pricingRoot.querySelector(`[data-pricing-view="${id}"]`)?.focus();
 }
 const groupForRooms = rooms => rooms<=12?'small':rooms<=80?'medium':'large';
 const showEstimate = (trackingAction='') => {
  const data=estimateData();
  const {plan,rooms,modules,periodPlan,estimateMonthly,isFrom}=data;
  pricingRoot.querySelectorAll('[data-plan-card]').forEach(card=>{
   const active=card.dataset.planCard===plan.id;
   card.classList.toggle('is-current',active);
   card.querySelector('.price-card-current')?.remove();
   if(active){const badge=document.createElement('span');badge.className='price-card-current';badge.textContent='Ваш тариф';card.prepend(badge);}
   const cardPlan=core.plans[card.dataset.planCard];
   const shown=active&&plan.monthly!==null?periodPlan.monthlyEquivalent:cardPlan.monthly;
   const priceNode=card.querySelector('[data-plan-price]');
   if(priceNode)priceNode.textContent=shown===null?'Від 9 900 грн':money(shown);
   const periodNode=card.querySelector('[data-plan-period]');
   if(periodNode)periodNode.textContent=period==='month'?'на місяць':`на місяць у перерахунку за ${periodMonths[period]} міс.`;
  });
  pricingRoot.querySelectorAll('[data-billing-period]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.billingPeriod===period)));
  moduleInputs.forEach(input=>{const price=pricingRoot.querySelector(`[data-module-price="${input.dataset.module}"]`);if(!price)return;const module=core.modules[input.dataset.module];const detail=core.modulesPrice(plan.id,rooms,[input.dataset.module]);price.textContent=detail.notes[0]||`${module.price.toLocaleString('uk-UA')} грн / міс`;});
  const totalText=plan.monthly===null?'Індивідуальний розрахунок':`${isFrom?'Від ':''}${money(estimateMonthly)} на місяць`;
  pricingRoot.querySelector('[data-estimate-plan]').textContent=`Тариф ${plan.name} · ${rooms} ${roomLabel(rooms)}`;
  pricingRoot.querySelector('[data-estimate-price]').textContent=totalText;
  pricingRoot.querySelector('[data-estimate-period-total]').textContent=period==='month'||plan.monthly===null?'':`До сплати за ${periodMonths[period]} місяців: ${money(periodPlan.total+modules.sum*periodMonths[period])}`;
  const details=[...modules.notes];
  if(plan.monthly!==null && periodPlan.monthlyEquivalent!==plan.monthly) details.unshift(`Тариф: ${money(periodPlan.monthlyEquivalent)} на місяць`);
  pricingRoot.querySelector('[data-estimate-breakdown]').textContent=details.length?details.join(' · '):'Базовий тариф. Додаткові модулі не вибрані.';
  pricingRoot.querySelector('[data-sticky-plan]').textContent=`Ваш тариф: ${plan.name}`;
  pricingRoot.querySelector('[data-sticky-price]').textContent=totalText;
  const estimate={plan:plan.name,rooms,period,modules:selectedModules(),estimateMonthly,isFrom};
  window.VDALO_CURRENT_ESTIMATE=estimate;
  pricingRoot.querySelectorAll('[data-pricing-submit]').forEach(button=>button.dataset.interest=`Розрахунок: ${plan.name}, ${rooms} ${roomLabel(rooms)}, ${totalText}`);
  if(checkoutForm){
   checkoutForm.elements.plan.value=plan.id;checkoutForm.elements.rooms.value=String(rooms);checkoutForm.elements.period.value=period;
   checkoutForm.querySelector('.checkout-modules').replaceChildren(...selectedModules().map(id=>{const input=document.createElement('input');input.type='hidden';input.name='module';input.value=id;return input;}));
   const trialButton=checkoutForm.querySelector('[data-open="trial"]');
   if(trialButton){trialButton.dataset.interest=`Пробний доступ 14 днів: ${plan.name}, ${rooms} ${roomLabel(rooms)}, модулі: ${selectedModules().length?selectedModules().join(', '):'без додаткових модулів'}`;}
   const setupPrice=plan.setup||0,setupSelected=Boolean(setupInput?.checked),setupIncluded=setupSelected&&setupPrice>0;
   checkoutForm.querySelector('[data-checkout-setup-price]').textContent=setupPrice?`${money(setupPrice)} одноразово`:'Для цього тарифу послуга підключення без оплати';
   const note=checkoutForm.querySelector('[data-checkout-note]'),submit=checkoutForm.querySelector('.checkout-submit');
   if(isFrom){const quoteModules=selectedModules().filter(id=>core.modules[id]?.from||(id==='rms'&&rooms>80)).map(id=>core.modules[id]?.label||'розширені правила ціни');note.textContent=plan.monthly===null?`Для тарифу ${plan.name} потрібен індивідуальний розрахунок. Запросіть пробний доступ нижче, щоб погодити умови.`:`Уточніть вартість: ${quoteModules.join(', ')}. Запросіть пробний доступ нижче, щоб погодити склад і ціну.`;submit.disabled=true;}
   else{note.textContent=`Перше списання ${money(periodPlan.total+modules.sum*periodMonths[period]+(setupIncluded?setupPrice:0))}${setupIncluded?' включає разове підключення':''}. Далі регулярно ${money(periodPlan.total+modules.sum*periodMonths[period])} за обраним періодом.`;submit.disabled=false;}
  }
  if(trackingAction)trackCalculator(trackingAction,{setup_selected:Boolean(setupInput?.checked)});
 };
 pricingRoot.querySelectorAll('[data-pricing-view]').forEach((tab,index,all)=>{
  tab.addEventListener('click',()=>activateTab(tab.dataset.pricingView));
  tab.addEventListener('keydown',event=>{let next=index;if(event.key==='ArrowRight')next=(index+1)%all.length;else if(event.key==='ArrowLeft')next=(index+all.length-1)%all.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=all.length-1;else return;event.preventDefault();activateTab(all[next].dataset.pricingView,true);});
 });
 pricingRoot.querySelectorAll('[data-billing-period]').forEach(button=>button.addEventListener('click',()=>{period=button.dataset.billingPeriod;showEstimate('billing_period');}));
 const syncRoomDisplay = () => {
  const rooms=Math.max(1,Math.floor(Number(roomInput?.value)||1));
  if(roomSlider)roomSlider.value=String(Math.min(200,rooms));
  if(roomSliderValue)roomSliderValue.value=`${rooms} ${roomLabel(rooms)}`;
 };
 roomInput?.addEventListener('input',()=>{syncRoomDisplay();activateTab(groupForRooms(Math.max(1,Math.floor(Number(roomInput.value)||1))));showEstimate();});
 roomInput?.addEventListener('change',()=>trackCalculator('room_count'));
 roomSlider?.addEventListener('input',()=>{if(roomInput)roomInput.value=roomSlider.value;syncRoomDisplay();activateTab(groupForRooms(Number(roomSlider.value)));showEstimate();});
 roomSlider?.addEventListener('change',()=>trackCalculator('room_count'));
 const planRoomDefaults={start:5,mini:10,hotel:20,'hotel-plus':50,complex:90,enterprise:151};
 pricingRoot.querySelectorAll('[data-select-plan]').forEach(link=>link.addEventListener('click',event=>{event.preventDefault();roomInput.value=String(planRoomDefaults[link.dataset.selectPlan]||20);activateTab(groupForRooms(Number(roomInput.value)));showEstimate();roomInput.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'});roomInput.focus({preventScroll:true});}));
 moduleInputs.forEach(input=>input.addEventListener('change',()=>{pricingRoot.querySelectorAll('[data-module-preset]').forEach(button=>button.setAttribute('aria-pressed','false'));showEstimate('module_selection');}));
 const presets={start:[],camping:['channels','checkin','tasks'],small:['checkin'],hotel:['checkin','finance','tasks']};
 pricingRoot.querySelectorAll('[data-module-preset]').forEach(button=>button.addEventListener('click',()=>{
  const ids=presets[button.dataset.modulePreset]||[];
  const remove=button.getAttribute('aria-pressed')==='true';
  pricingRoot.querySelectorAll('[data-module-preset]').forEach(other=>other.setAttribute('aria-pressed',String(!remove&&other===button)));
  for(const input of moduleInputs)input.checked=!input.disabled&&!remove&&ids.includes(input.dataset.module);
  button.setAttribute('aria-pressed',String(!remove));showEstimate('module_preset');
 }));
 const apartUnits=pricingRoot.querySelector('#apart-unit-count');
 apartUnits?.addEventListener('input',event=>{pricingRoot.querySelector('[data-apart-price]').textContent=`${money(core.apartPrice(event.target.value))} на місяць`;});
 apartUnits?.addEventListener('change',event=>track('pricing_calculator_update',{action:'apart_units',plan_id:'apart',units:Math.max(1,Math.floor(Number(event.target.value)||1)),estimated_monthly:core.apartPrice(event.target.value)}));
 setupInput?.addEventListener('change',()=>showEstimate('setup_option'));
 checkoutForm?.addEventListener('submit',event=>{
  if(checkoutForm.querySelector('.checkout-submit').disabled){event.preventDefault();return;}
  if(!checkoutForm.reportValidity()){event.preventDefault();return;}
  const estimate=estimateData();
  track('begin_checkout',{plan_id:estimate.plan.id,rooms:estimate.rooms,period,module_ids:selectedModules(),setup_selected:Boolean(setupInput?.checked)});
 });
 pricingRoot.querySelectorAll('[data-pricing-submit]').forEach(link=>link.addEventListener('click',event=>{event.preventDefault();const estimate=estimateData();track('pricing_checkout_open',{location:link.dataset.location,plan_id:estimate.plan.id,rooms:estimate.rooms,period});checkoutForm?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'});}));
 if('IntersectionObserver' in window){const pricingObserver=new IntersectionObserver(entries=>{const visible=entries.some(entry=>entry.isIntersecting);pricingRoot.querySelector('[data-pricing-sticky]').classList.toggle('visible',visible);document.body.classList.toggle('pricing-visible',visible);},{threshold:.1});pricingObserver.observe(pricingRoot);}
 activateTab(groupForRooms(Math.max(1,Math.floor(Number(roomInput?.value)||1))));
 syncRoomDisplay();
 showEstimate();
}
