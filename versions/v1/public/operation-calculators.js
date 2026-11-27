const money = new Intl.NumberFormat('uk-UA',{style:'currency',currency:'UAH'});
const number = new Intl.NumberFormat('uk-UA',{maximumFractionDigits:2});
const cents = value => Math.round(value*100);
const roundedPercent = value => Math.floor(value*100+1e-9)/100;
const allNonnegative = (input,keys) => keys.every(key => Number.isFinite(input[key]) && input[key]>=0);
const integers = (input,keys) => keys.every(key => Number.isInteger(input[key]));
const invalid = {error:'Перевірте вихідні дані та допустимі значення.'};

export function calculateLinen(input) {
 const keys=['bedsA','setsA','bedsB','setsB','changePct','turnaround','reservePct'];
 if(!allNonnegative(input,keys)||!integers(input,keys.slice(0,4))||
    !input.bedsA||!input.setsA||(input.bedsB&&!input.setsB)||input.changePct>100) return invalid;
 function type(beds,sets) {
  const rooms=beds*sets;
  const laundry=Math.ceil(rooms*cents(input.changePct)*cents(input.turnaround)/1e6);
  const reserve=Math.ceil((rooms+laundry)*cents(input.reservePct)/10000);
  return {rooms,laundry,reserve,total:rooms+laundry+reserve};
 }
 const first=type(input.bedsA,input.setsA),second=type(input.bedsB,input.setsB);
 return {first,second,total:first.total+second.total};
}

export function calculateLongStay(input) {
 const keys=['nights','shortSold','shortRate','longRate','shortCommission','longCommission',
  'nightCost','cleaningCost','shortClean','longClean','discount'];
 if(!allNonnegative(input,keys)||!integers(input,['nights','shortSold','shortClean','longClean'])||
    !input.nights||input.shortSold>input.nights||!input.longRate||
    [input.discount,input.shortCommission,input.longCommission].some(rate=>rate>100))return invalid;
 const shortGross=input.shortSold*cents(input.shortRate);
 const longGross=input.nights*cents(input.longRate);
 const shortCost=input.shortSold*cents(input.nightCost)+input.shortClean*cents(input.cleaningCost);
 const longCost=input.nights*cents(input.nightCost)+input.longClean*cents(input.cleaningCost);
 const shortContribution=shortGross*(1-cents(input.shortCommission)/10000)-shortCost;
 const longProceeds=longGross*(1-cents(input.longCommission)/10000);
 const longContribution=longProceeds*(1-cents(input.discount)/10000)-longCost;
 const target=shortContribution+longCost;
 const maxDiscount=target>longProceeds+1e-8?null:
  longProceeds===0?100:roundedPercent(Math.max(0,Math.min(100,100*(1-target/longProceeds))));
 return {shortContribution:shortContribution/100,longContribution:longContribution/100,
  difference:(longContribution-shortContribution)/100,maxDiscount};
}

export function calculateGroupQuote(input) {
 const keys=['roomsA','roomsB','nights','rateA','rateB','discount','meals','mealPrice','extras','roomCost','mealCost','extraCost'];
 if(!allNonnegative(input,keys)||!integers(input,['roomsA','roomsB','nights','meals'])||
    !input.roomsA||!input.nights||input.discount>100) return invalid;
 const roomNights=(input.roomsA+input.roomsB)*input.nights;
 const roomGross=(input.roomsA*cents(input.rateA)+input.roomsB*cents(input.rateB))*input.nights;
 const discount=Math.round(roomGross*cents(input.discount)/10000);
 const meals=input.meals*cents(input.mealPrice);
 const extras=cents(input.extras);
 const total=roomGross-discount+meals+extras;
 const cost=roomNights*cents(input.roomCost)+input.meals*cents(input.mealCost)+cents(input.extraCost);
 return {roomNights,roomGross:roomGross/100,discount:discount/100,meals:meals/100,extras:extras/100,
  total:total/100,cost:cost/100,contribution:(total-cost)/100};
}

const day = 86_400_000;
const dateInRange = (date,start,end) => Number.isFinite(date) && Number.isInteger(date/day) && start<=date && date<=end;

function seasonFieldError(input) {
 const {start,end,closedFrom,closedTo,unavailableFrom,unavailableTo,unavailableHouses} = input;
 if(!dateInRange(start,-8.64e15,8.64e15))return ['start','Вкажіть дату першої ночі.'];
 if(!dateInRange(end,start,start+365*day))return ['end','Вкажіть останню ніч у межах 366 днів від початку.'];

 const ranges = [
  ['closedFrom','closedTo',closedFrom,closedTo,closedFrom!=null||closedTo!=null],
  ['unavailableFrom','unavailableTo',unavailableFrom,unavailableTo,unavailableHouses>0]
 ];
 for(const [fromKey,toKey,from,to,enabled] of ranges){
  if(!enabled)continue;
  if(!dateInRange(from,start,end))return [fromKey,'Вкажіть першу ніч у межах сезону.'];
  if(!dateInRange(to,from,end))return [toKey,'Вкажіть останню ніч цього періоду.'];
 }
 if(unavailableHouses>input.houses)return ['unavailableHouses','Недоступних будинків не може бути більше, ніж є в об’єкті.'];
 if(input.steadyPct<input.lowPct)return ['steadyPct','Завантаження у базовому сценарії має бути не меншим, ніж в обережному.'];
 if(input.highPct<input.steadyPct)return ['highPct','Завантаження в оптимістичному сценарії має бути не меншим, ніж у базовому.'];
 return null;
}

export function calculateGlampingSeason(input) {
 const keys=['houses','unavailableHouses','weekdayRate','weekendRate','lowPct','steadyPct','highPct'];
 if(!allNonnegative(input,keys)||!integers(input,keys.slice(0,2))||!input.houses||
    keys.slice(-3).some(key=>input[key]>100)||seasonFieldError(input))return invalid;

 const {start,end,houses,closedFrom,closedTo,unavailableHouses,unavailableFrom,unavailableTo} = input;
 let weekdayHouseNights=0;
 let weekendHouseNights=0;
 let closedNights=0;
 for(let date=start;date<=end;date+=day){
  const wholeSiteClosed=closedFrom!=null&&date>=closedFrom&&date<=closedTo;
  const partlyClosed=unavailableHouses>0&&date>=unavailableFrom&&date<=unavailableTo;
  const available=wholeSiteClosed?0:houses-(partlyClosed?unavailableHouses:0);
  if(available===0)closedNights++;
  const weekday=new Date(date).getUTCDay();
  if(weekday===0||weekday===6)weekendHouseNights+=available;
  else weekdayHouseNights+=available;
 }
 const actualNights=(end-start)/day+1;
 const houseNights=weekdayHouseNights+weekendHouseNights;
 const fullRevenue=weekdayHouseNights*cents(input.weekdayRate)+weekendHouseNights*cents(input.weekendRate);
 const scenario=percent=>({houseNights:houseNights*percent/100,revenue:Math.round(fullRevenue*cents(percent)/10000)/100});
 return {actualNights,closedNights,houseNights,weekdayHouseNights,weekendHouseNights,
  low:scenario(input.lowPct),steady:scenario(input.steadyPct),high:scenario(input.highPct)};
}

const cases={
 season:{
  calculate:calculateGlampingSeason,
  fieldError:seasonFieldError,
  examples:{
   standard:{start:'2026-06-26',end:'2026-07-05',houses:3,weekdayRate:1500,weekendRate:2000,lowPct:40,steadyPct:60,highPct:80,
    closedFrom:'',closedTo:'',unavailableHouses:0,unavailableFrom:'',unavailableTo:''},
   closures:{start:'2026-06-26',end:'2026-07-05',houses:3,weekdayRate:1500,weekendRate:2000,lowPct:40,steadyPct:60,highPct:80,
    closedFrom:'2026-07-01',closedTo:'2026-07-02',unavailableHouses:1,unavailableFrom:'2026-07-03',unavailableTo:'2026-07-05'}
  },
  values:result=>{
   const {actualNights,closedNights,houseNights,weekdayHouseNights,weekendHouseNights,low,steady,high}=result;
   return {
    actualNights:number.format(actualNights),closedNights:number.format(closedNights),
    houseNights:number.format(houseNights),weekdayHouseNights:number.format(weekdayHouseNights),weekendHouseNights:number.format(weekendHouseNights),
    lowNights:number.format(low.houseNights),steadyNights:number.format(steady.houseNights),highNights:number.format(high.houseNights),
    lowRevenue:money.format(low.revenue),steadyRevenue:money.format(steady.revenue),highRevenue:money.format(high.revenue)
   };
  }
 },
 linen:{
  calculate:calculateLinen,
  examples:{
   own:{bedsA:12,setsA:1,bedsB:0,setsB:1,changePct:50,turnaround:1,reservePct:20},
   external:{bedsA:12,setsA:1,bedsB:6,setsB:2,changePct:50,turnaround:2,reservePct:20}
  },
  values:result=>{
   const kind=(key,item)=>Object.entries(item).map(([part,value])=>[key+part,number.format(value)]);
   return Object.fromEntries([...kind('first',result.first),...kind('second',result.second),['total',number.format(result.total)]]);
  }
 },
 long:{
  calculate:calculateLongStay,
  examples:{sample:{nights:14,shortSold:10,shortRate:1400,longRate:1200,shortCommission:15,longCommission:4,
   nightCost:190,cleaningCost:250,shortClean:5,longClean:1,discount:10}},
  values:result=>({shortContribution:money.format(result.shortContribution),longContribution:money.format(result.longContribution),
   difference:money.format(result.difference),
   maxDiscount:result.maxDiscount===null?'Довгий заїзд поступається навіть без знижки':number.format(result.maxDiscount)+'%'}),
  fieldError:values=>values.shortSold>values.nights?['shortSold','Короткі заїзди не можуть займати більше ночей, ніж обраний період.']:null
 },
 group:{
  calculate:calculateGroupQuote,
  examples:{sample:{roomsA:5,roomsB:0,nights:2,rateA:2000,rateB:0,discount:5,meals:20,mealPrice:250,extras:0,roomCost:600,mealCost:100,extraCost:0}},
  values:result=>({...Object.fromEntries(Object.entries(result).map(([key,value])=>[key,money.format(value)])),
   roomNights:number.format(result.roomNights)}),
  copy:(result,input)=>[
   'Пропозиція проживання для групи',
   'Номери першої категорії: '+input.roomsA+' × '+input.nights+' н. × '+money.format(input.rateA),
   ...(input.roomsB?['Номери другої категорії: '+input.roomsB+' × '+input.nights+' н. × '+money.format(input.rateB)]:[]),
   'Проживання до знижки: '+money.format(result.roomGross),
   'Знижка на проживання: '+money.format(result.discount),
   'Харчування: '+money.format(result.meals),
   'Інші послуги: '+money.format(result.extras),
   'Разом: '+money.format(result.total)
  ].join('\n')
 }
};

function mount(form,config) {
 const fields=Object.fromEntries([...form.querySelectorAll('[data-ops-field]')].map(field=>[field.dataset.opsField,field]));
 const results=form.querySelector('[data-ops-results]');
 const error=form.querySelector('[data-ops-error]');
 const text=form.querySelector('[data-ops-quote]');
 const copy=form.querySelector('[data-ops-copy]');
 const feedback=form.querySelector('[data-ops-feedback]');
 const showError=(field,message)=>{
  error.textContent=message;
  if(!field)return;
  field.setAttribute('aria-invalid','true');
  field.focus();
 };
 function invalidate() {
  for(const field of Object.values(fields))field.removeAttribute('aria-invalid');
  results.hidden=true;
  error.textContent='';
  if(text)text.value='';
  if(feedback)feedback.textContent='';
 }
 form.addEventListener('input',invalidate);
 for(const demo of form.querySelectorAll('[data-ops-example]')){
  demo.addEventListener('click',()=>{
   for(const [key,value] of Object.entries(config.examples[demo.dataset.opsExample]))fields[key].value=value;
   form.requestSubmit();
  });
 }
 form.addEventListener('submit',event=>{
  event.preventDefault();
  invalidate();
  const field=Object.values(fields).find(item=>!item.validity.valid);
  if(field){
   showError(field,'Заповніть виділене поле в межах, зазначених у формі.');
   field.reportValidity();
   return;
  }
  const values=Object.fromEntries(Object.entries(fields).map(([key,item])=>[key,!item.required&&item.value===''?null:item.valueAsNumber]));
  const conflict=config.fieldError?.(values);
  if(conflict){showError(fields[conflict[0]],conflict[1]);return;}
  const result=config.calculate(values);
  if(result.error){showError(null,result.error);return;}
  const output=config.values(result);
  for(const element of results.querySelectorAll('[data-ops-output]'))element.textContent=output[element.dataset.opsOutput];
  if(text)text.value=config.copy(result,values);
  results.hidden=false;
  results.querySelector('h2').focus();
 });
 if(copy)copy.addEventListener('click',async()=>{
  try{
   await navigator.clipboard.writeText(text.value);
   feedback.textContent='Пропозицію скопійовано.';
  }catch{
   text.focus();
   text.select();
   feedback.textContent='Текст виділено. Скопіюйте його через меню або клавіатуру.';
  }
 });
 for(const button of form.querySelectorAll('[data-ops-enhancement]'))button.hidden=false;
}
if(typeof document!=='undefined'){
 const form=document.querySelector('[data-operation-calculator]');
 if(form)mount(form,cases[form.dataset.operationCalculator]);
}
