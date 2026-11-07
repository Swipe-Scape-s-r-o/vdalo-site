import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateChannelEconomics,calculateRoomCost,evaluateRoomAcceptance,calculateHotelKpis,calculatePmsTco,calculateHousekeepingWorkload,calculateCancellationImpact} from '../versions/v1/tool-calculations.mjs';
import {renderDirectBookingCostCalculator,renderHotelRoomCostCalculator,renderToolsIndex,renderHousekeepingChecklist,renderHotelProfitabilityCalculator,renderPmsChecklist} from '../versions/v1/tools.mjs';
import {publicResources,renderResourceLibrary} from '../versions/v1/resource-library.mjs';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {runInNewContext} from 'node:vm';
import {calculateAdminTime,renderAdminTimeCalculator,renderWebsiteChecklist,websiteChecklistItems,renderGuestMessageBuilder,renderHousekeepingWorkloadCalculator,renderCancellationCalculator,renderReviewReplyTemplates} from '../versions/v1/advanced-tools.mjs';

test('PMS checklist requires an explanation when a user makes a not-applicable criterion critical',async()=>{
 const answers={};
 for(const [group,count] of [5,4,4,3,3,3,3].entries())for(let item=0;item<count;item++)answers[`0|${group}-${item}`]='confirmed';
 answers['0|0-2']='na';
 const state={names:['Тестова система','',''],hotel:'',property:'',rooms:'',weights:{'0-2':3},answers,notes:{},naReason:{},started:false,group:6,done:false};
 const error={textContent:''},handlers={};
 const app={querySelector:selector=>selector==='[data-group-error]'?error:null,querySelectorAll:()=>[],addEventListener:(event,handler)=>{handlers[event]=handler}};
 const document={querySelector:selector=>selector==='[data-pms-checklist]'?app:null,querySelectorAll:()=>[]};
 const localStorage={getItem:()=>JSON.stringify(state),setItem:()=>{}};
 runInNewContext(await readFile(new URL('../versions/v1/public/tools.js',import.meta.url),'utf8'),{document,localStorage,window:{},Intl});
 handlers.click({target:{closest:selector=>selector==='[data-finish]'}});
 assert.match(error.textContent,/Додайте коротке пояснення.*Housekeeping і статуси номерів/u);

 const restored={...state,started:true,done:true};
 const nodes=new Map();
 const appRestored={querySelector(selector){if(!nodes.has(selector))nodes.set(selector,{style:{},value:'',textContent:'',innerHTML:'',hidden:false});return nodes.get(selector)},querySelectorAll:()=>[],addEventListener:()=>{}};
 const docRestored={querySelector:selector=>selector==='[data-pms-checklist]'?appRestored:null,querySelectorAll:()=>[]};
 let saved;
 const savedStorage={getItem:()=>JSON.stringify(restored),setItem:(_key,value)=>{saved=JSON.parse(value)}};
 runInNewContext(await readFile(new URL('../versions/v1/public/tools.js',import.meta.url),'utf8'),{document:docRestored,localStorage:savedStorage,window:{},Intl});
 assert.equal(saved.done,false);
 assert.equal(saved.group,0);
 assert.match(nodes.get('[data-group-error]').textContent,/Додайте коротке пояснення.*Housekeeping і статуси номерів/u);
});

test('review drafts update in both languages and invalidate old exports after input changes',async()=>{
 const controls={kind:{value:'followup'},language:{value:'uk'},property:{value:'Готель'},contact:{value:''},facts:{value:''},output:{value:''},status:{textContent:''}};
 const button=()=>({disabled:true,addEventListener(_event,handler){this.click=handler}});
 controls.build=button();controls.copy=button();controls.download=button();
 const handlers={};
 const root={querySelector(selector){return controls[selector.match(/^\[data-review-([^\]]+)\]$/)?.[1]]},addEventListener(event,handler){handlers[event]=handler}};
 const document={querySelector:selector=>selector==='[data-review-template]'?root:null,querySelectorAll:()=>[]};
 runInNewContext(await readFile(new URL('../versions/v1/public/tools.js',import.meta.url),'utf8'),{document,Intl});
 controls.build.click();
 assert.match(controls.output.value,/Хочемо уточнити деталі/u);
 assert.doesNotMatch(controls.output.value,/Ми перевіряємо|Повернемося до вас/u);
 assert.equal(controls.copy.disabled,false);
 handlers.input({target:controls.output});
 assert.equal(controls.copy.disabled,false);
 controls.language.value='en';handlers.change({target:controls.language});
 assert.equal(controls.copy.disabled,true);
 assert.equal(controls.download.disabled,true);
 assert.match(controls.status.textContent,/Підготуйте шаблон знову/u);
 controls.build.click();
 assert.match(controls.output.value,/We would like to understand the details/u);
 assert.doesNotMatch(controls.output.value,/We are checking|We will follow up/u);
 assert.equal(controls.download.disabled,false);
});

test('channel economics matches the prepared 6,000 UAH example and keeps negative outcomes',()=>{
 const base={baseRevenue:6000,otaFeePct:15,directDiscountPct:5,directPspPct:2,directAcquisitionCost:200,variableStayCost:0,otaOtherCosts:0,directOtherCosts:0};
 const result=calculateChannelEconomics(base);
 assert.equal(result.ok,true);
 assert.equal(result.otaContribution,5100);
 assert.equal(result.directContribution,5386);
 assert.equal(result.difference,286);
 assert.equal(result.maxAcquisitionCost,486);
 assert.equal(calculateChannelEconomics({...base,directAcquisitionCost:600}).difference,-114);
});

test('channel economics rejects a 100% direct discount and invalid negative amounts',()=>{
 const base={baseRevenue:6000,otaFeePct:15,directDiscountPct:100,directPspPct:2,directAcquisitionCost:0,variableStayCost:0,otaOtherCosts:0,directOtherCosts:0};
 assert.equal(calculateChannelEconomics(base).ok,false);
 assert.equal(calculateChannelEconomics({...base,directDiscountPct:5,otaOtherCosts:-1}).ok,false);
});

test('room cost matches prepared revenue, contribution, result and break-even example',()=>{
 const result=calculateRoomCost({availableRoomNights:600,soldRoomNights:300,fixedCosts:300000,variablePerSoldNight:350,adr:1800,distributionPct:10});
 assert.equal(result.ok,true);
 assert.equal(result.revenue,540000);
 assert.equal(result.contributionPerNight,1270);
 assert.equal(result.resultAfterIncludedCosts,81000);
 assert.equal(result.breakEvenRoomNights,300000/1270);
 assert.equal(result.minimumWholeRoomNights,237);
 assert.equal(result.breakEvenOccupancyPct,100*(300000/1270)/600);
});

test('room cost handles zero nights, impossible break-even, excessive sales and capacity limits',()=>{
 const base={availableRoomNights:600,soldRoomNights:0,fixedCosts:300000,variablePerSoldNight:350,adr:1800,distributionPct:10};
 const noSales=calculateRoomCost(base);
 assert.equal(noSales.ok,true);
 assert.equal(noSales.costPerSoldNightBeforeDistribution,null);
 assert.equal(noSales.resultAfterIncludedCosts,-300000);
 assert.equal(calculateRoomCost({...base,variablePerSoldNight:1800,distributionPct:10}).breakEvenRoomNights,null);
 assert.equal(calculateRoomCost({...base,soldRoomNights:601}).ok,false);
 const impossible=calculateRoomCost({...base,fixedCosts:1000000});
 assert.equal(impossible.occupancyFeasible,false);
});

test('room cost browser calculator rejects sales above capacity and clears stale results',async()=>{
 const fields={availableRoomNights:'600',soldRoomNights:'300',fixedCosts:'300000',variablePerSoldNight:'350',adr:'1800',distributionPct:'10'};
 const inputs=Object.entries(fields).map(([key,value])=>({dataset:{scenarioInput:key},value,labels:[{textContent:key}],checkValidity:()=>true,setAttribute(name,value){this[name]=value},focus(){this.focused=true},addEventListener(_name,handler){this.onInput=handler}}));
 const outputs=Object.fromEntries(['revenue','costPerSoldNightBeforeDistribution','costPerSoldNightAfterDistribution','resultAfterIncludedCosts','breakEvenRoomNights','breakEvenOccupancyPct'].map(key=>[key,{textContent:''}]));
 const error={textContent:''},summary={textContent:''},button={addEventListener(_name,handler){this.click=handler}},exportButton={disabled:true,addEventListener(){}};
 const root={dataset:{scenario:'room-cost'},querySelectorAll(selector){return selector==='[data-scenario-input]'?inputs:selector==='[data-scenario-result]'?Object.values(outputs):[]},querySelector(selector){
  if(selector==='[data-scenario-error]')return error;
  if(selector==='[data-scenario-summary]')return summary;
  if(selector==='[data-scenario-calculate]')return button;
  if(selector==='[data-scenario-export]')return exportButton;
  return outputs[selector.match(/^\[data-scenario-result="([^"]+)"\]$/)?.[1]];
 }};
 const document={querySelector:()=>null,querySelectorAll:selector=>selector==='[data-scenario]'?[root]:[]};
 runInNewContext(await readFile(new URL('../versions/v1/public/tools.js',import.meta.url),'utf8'),{document,Intl});
 button.click();
 assert.match(summary.textContent,/237 номероночей/u);
 assert.equal(exportButton.disabled,false);
 const sold=inputs.find(input=>input.dataset.scenarioInput==='soldRoomNights');
 sold.value='700';sold.onInput();
 assert.equal(outputs.revenue.textContent,'Очікує розрахунку');
 assert.equal(exportButton.disabled,true);
 button.click();
 assert.match(error.textContent,/не можуть перевищувати доступний фонд/u);
 assert.equal(sold['aria-invalid'],'true');
 assert.equal(sold.focused,true);
 assert.equal(exportButton.disabled,true);
});

test('website checklist invalidates its exported report when an answer changes',async()=>{
 const controls={};
 for(const key of ['review','export','print','reset'])controls[key]={disabled:key==='export',addEventListener(_name,handler){this.click=handler}};
 for(const key of ['date','role','url'])controls[key]={value:'',checkValidity:()=>true};
 controls.error={textContent:''};controls.results={hidden:true};controls.summary={textContent:''};
 controls.actions={replaceChildren(){},append(){}};
 const values={status:{value:'unknown'},observation:{value:''},action:{value:''},owner:{value:''}};
 const card={dataset:{webItem:'W01',critical:'true'},querySelector(selector){return values[selector.match(/^\[data-web-(status|observation|action|owner)=/)[1]]}};
 const listeners={};
 const root={querySelectorAll:selector=>selector==='[data-web-item]'?[card]:[],querySelector(selector){return controls[selector.match(/^\[data-web-([^\]]+)\]$/)?.[1]]},addEventListener(name,handler){listeners[name]=handler}};
 const document={querySelector:selector=>selector==='[data-website-checklist]'?root:null,querySelectorAll:()=>[],createElement:()=>({textContent:'',append(){}})};
 runInNewContext(await readFile(new URL('../versions/v1/public/tools.js',import.meta.url),'utf8'),{document,Intl});
 controls.review.click();
 assert.equal(controls.export.disabled,false);
 assert.equal(controls.results.hidden,false);
 values.status.value='pass';listeners.change();
 assert.equal(controls.export.disabled,true);
 assert.equal(controls.results.hidden,true);
 assert.match(controls.error.textContent,/Підсумуйте перевірку знову/u);
 controls.review.click();
 assert.equal(controls.export.disabled,false);
 assert.match(controls.summary.textContent,/Заповненість перевірки: 100%/u);
});

test('housekeeping tools hide results after their inputs change',async()=>{
 const source=await readFile(new URL('../versions/v1/public/tools.js',import.meta.url),'utf8');
 const actions=Object.fromEntries(['check','print','export','reset'].map(key=>[key,{addEventListener(_event,handler){this.click=handler}}]));
 const cardFields={status:{value:'pass'},critical:{checked:true},'na-reason':{value:''},note:{value:''},wrap:{hidden:true},legend:{textContent:'H01'}};
 const card={dataset:{housekeepingItem:'H01'},querySelector(selector){if(selector==='legend')return cardFields.legend;if(selector.startsWith('[data-na-wrap'))return cardFields.wrap;return cardFields[selector.match(/^\[data-(?:room-)?(status|critical|na-reason|note)=/)[1]]}};
 const result={hidden:true,scrollIntoView(){}},fields={'result':result,'result-title':{},'result-copy':{},blockers:{replaceChildren(){},append(){}}};
 const events={};
 const root={querySelectorAll:selector=>selector==='[data-housekeeping-item]'?[card]:[],querySelector(selector){const key=selector.match(/^\[data-room-([^\]]+)\]$/)?.[1];return actions[key]||fields[key]},addEventListener(name,handler){events[name]=handler}};
 const document={querySelector:selector=>selector==='[data-housekeeping]'?root:null,querySelectorAll:()=>[],createElement:()=>({})};
 runInNewContext(source,{document,Intl,matchMedia:()=>({matches:true})});
 actions.check.click();
 assert.equal(result.hidden,false);
 events.input();
 assert.equal(result.hidden,true);

 const numbers={shift:'480',break:'45',other:'60',workers:'2'};
 const inputs=Object.fromEntries(Object.entries(numbers).map(([key,value])=>[key,{value,checkValidity:()=>true}]));
 const outputs=Object.fromEntries(['required','person','team','gap','minimum'].map(key=>[key,{textContent:''}]));
 const task={querySelector:selector=>selector==='[data-workload-name]'?{value:'Тест'}:selector==='[data-workload-count]'?{value:'10'}:{value:'10'}};
 const calc={addEventListener(_event,handler){this.click=handler}},exportButton={disabled:true,addEventListener(){}},workResult={hidden:true},error={textContent:''},summary={textContent:''},handlers={};
 const work={querySelectorAll:selector=>selector==='input[type=number]'?Object.values(inputs):selector==='.advanced-tool-row'?[task]:[],querySelector(selector){if(selector==='[data-workload-calculate]')return calc;if(selector==='[data-workload-export]')return exportButton;if(selector==='[data-workload-results]')return workResult;if(selector==='[data-workload-error]')return error;if(selector==='[data-workload-results] p')return summary;const out=selector.match(/^\[data-workload-out="([^"]+)"\]$/);if(out)return outputs[out[1]];return inputs[selector.match(/^\[data-workload-([^\]]+)\]$/)?.[1]]},addEventListener(name,handler){handlers[name]=handler}};
 const workDocument={querySelector:selector=>selector==='[data-workload]'?work:null,querySelectorAll:()=>[]};
 runInNewContext(source,{document:workDocument,Intl});
 calc.click();
 assert.equal(workResult.hidden,false);
 assert.equal(exportButton.disabled,false);
 handlers.input();
 assert.equal(workResult.hidden,true);
 assert.equal(exportButton.disabled,true);
 assert.match(error.textContent,/Порахуйте навантаження знову/u);
});

test('time and cancellation tools invalidate their results and exports after edits',async()=>{
 const source=await readFile(new URL('../versions/v1/public/tools.js',import.meta.url),'utf8');
 for(const kind of ['time','cancel']){
  const opts=kind==='time'?{hour:250,realization:0,'monthly-cost':0}:{plannedRevenue:4000,plannedVariableCosts:800,retainedNet:1000,resaleRevenue:2000,resaleVariableCosts:400,handlingCosts:100};
  const fields=Object.fromEntries(Object.entries(opts).map(([key,value])=>[key,{value:String(value),dataset:{cancelInput:key},checkValidity:()=>true}]));
  const buttons={calculate:{addEventListener(_event,handler){this.click=handler}},export:{disabled:true,addEventListener(){}}};
  const output=Object.fromEntries((kind==='time'?['before','after','released','resource','payments','net']:['planned','after','difference']).map(key=>[key,{textContent:''}]));
  const common={error:{textContent:''},results:{hidden:true},summary:{textContent:''}};
  const row={querySelector:selector=>({value:selector==='[data-time-name]'?'Тест':selector==='[data-time-count]'?'120':selector==='[data-time-before]'?'3':'1'})};
  const listeners={};
  const root={querySelectorAll:selector=>selector==='.advanced-tool-row'?[row]:Object.values(fields),querySelector(selector){const out=selector.match(/^\[data-(?:time|cancel)-out="([^"]+)"\]$/);if(out)return output[out[1]];const key=selector.match(/^\[data-(?:time|cancel)-([^\]]+)\]$/)?.[1];return buttons[key]||common[key]||fields[key]},addEventListener(name,handler){listeners[name]=handler}};
  const document={querySelector:selector=>selector===(kind==='time'?'[data-admin-time]':'[data-cancellation]')?root:null,querySelectorAll:()=>[]};
  runInNewContext(source,{document,Intl});
  buttons.calculate.click();
  assert.equal(common.results.hidden,false,kind);
  assert.equal(buttons.export.disabled,false,kind);
  listeners.input();
  assert.equal(common.results.hidden,true,kind);
  assert.equal(buttons.export.disabled,true,kind);
  assert.match(common.error.textContent,/Порахуйте сценарій знову/u,kind);
 }
});

test('room acceptance blocks critical failures and requires a reason for critical not-applicable items',()=>{
 const allPass=Array.from({length:20},(_,i)=>({id:`H${String(i+1).padStart(2,'0')}`,status:'pass',critical:i<5,naReason:''}));
 assert.equal(evaluateRoomAcceptance(allPass).readyForHumanConfirmation,true);
 assert.deepEqual(evaluateRoomAcceptance(allPass.map(item=>item.id==='H02'?{...item,status:'fail'}:item)).blockers,['H02']);
 assert.deepEqual(evaluateRoomAcceptance(allPass.map(item=>item.id==='H03'?{...item,status:'not_checked'}:item)).blockers,['H03']);
 assert.deepEqual(evaluateRoomAcceptance(allPass.map(item=>item.id==='H01'?{...item,status:'not_applicable'}:item)).blockers,['H01']);
 assert.equal(evaluateRoomAcceptance(allPass.map(item=>item.id==='H01'?{...item,status:'not_applicable',naReason:'Відсутнє за оснащенням'}:item)).readyForHumanConfirmation,true);
 assert.deepEqual(evaluateRoomAcceptance(allPass.map(item=>item.id==='H06'?{...item,status:'fail'}:item)).incomplete,['H06']);
});

test('new calculators have canonical metadata, visible controls, honest wording and catalog links',()=>{
 const channel=renderDirectBookingCostCalculator();
 const room=renderHotelRoomCostCalculator();
 const housekeeping=renderHousekeepingChecklist();
 const index=renderToolsIndex();
 for(const [html,path] of [[channel,'/tools/direct-booking-cost-calculator/'],[room,'/tools/hotel-room-cost-calculator/']]){
  assert.match(html,new RegExp(`<link rel="canonical" href="https://www\\.vdalo\\.tech${path.replaceAll('/','\\/')}">`));
  assert.match(html,/data-scenario-calculate/);
  assert.match(html,/data-scenario-export/);
  assert.match(html,/<meta name="robots" content="index,follow">/);
  assert.doesNotMatch(html,/[\u2014]/);
 }
 assert.ok(index.includes('/tools/direct-booking-cost-calculator/'));
 assert.ok(index.includes('/tools/hotel-room-cost-calculator/'));
 assert.ok(index.includes('/tools/housekeeping-checklist/'));
 assert.equal([...index.matchAll(/<article class="tool-card"/g)].length,[...index.matchAll(/class="tool-card-icon" aria-hidden="true"/g)].length,'every tool listing card should have a decorative, accessible icon');
 assert.match(housekeeping,/<h1>Перевірте номер перед передаванням рецепції<\/h1>/);
 assert.equal((housekeeping.match(/data-housekeeping-item="H\d\d"/g)||[]).length,20);
 assert.match(housekeeping,/Остаточне рішення щодо готовності приймає відповідальна людина після фізичної перевірки/);
 assert.doesNotMatch(housekeeping,/[\u2014]/);
 assert.ok(index.includes('/resources'));
});

test('public resource library exposes exactly 18 allowlisted files with the packaged bytes',async()=>{
 assert.equal(publicResources.length,18);
 const html=renderResourceLibrary();
 assert.match(html,/<link rel="canonical" href="https:\/\/www\.vdalo\.tech\/resources">/);
 assert.match(html,/<meta name="robots" content="index,follow">/);
 assert.match(html,/18|Шаблони для щоденної роботи готелю/);
 assert.doesNotMatch(html,/sourceSha256|publication_status|competitor_addon|migration_synthetic/);
 for(const resource of publicResources){
  const data=await readFile(new URL(`../versions/v1/public/downloads/hotel/${resource.file}`,import.meta.url));
  assert.equal(createHash('sha256').update(data).digest('hex'),resource.sha256,resource.file);
  assert.ok(html.includes(resource.path),resource.file);
 }
});

test('admin time calculator matches the prepared example and separates time value from payment reduction',()=>{
 const rows=[{name:'A',count:100,beforeMinutes:20,afterMinutes:10},{name:'B',count:50,beforeMinutes:17,afterMinutes:10}];
 const result=calculateAdminTime(rows,{hourValue:250,realizationPct:40,monthlyCost:1000});
 assert.equal(result.ok,true);
 assert.equal(result.hoursBefore,47.5);
 assert.equal(result.hoursAfter,25);
 assert.equal(result.hoursReleased,22.5);
 assert.equal(result.resourceValue,5625);
 assert.equal(result.potentialPaymentReduction,2250);
 assert.equal(result.monthlyDifference,1250);
 assert.equal(calculateAdminTime(rows,{hourValue:250,realizationPct:0,monthlyCost:1000}).monthlyDifference,-1000);
 assert.equal(calculateAdminTime([{count:10,beforeMinutes:5,afterMinutes:10}],{hourValue:250,realizationPct:40,monthlyCost:0}).hoursReleased,-0.8333333333333334);
 assert.equal(calculateAdminTime([{count:1.5,beforeMinutes:5,afterMinutes:2}],{hourValue:250,realizationPct:40,monthlyCost:0}).ok,false);
});

test('expanded hotel KPIs use separate denominators, support negative GOP and reject zero comparison bases',()=>{
 const result=calculateHotelKpis({availableRoomNights:600,totalRevenue:900000,gop:180000,availableBedNights:1200,cohortRoomNights:300,cohortBookings:100,ownComparable:100,peerComparable:80});
 assert.equal(result.tRevpar,1500);
 assert.equal(result.goppar,300);
 assert.equal(result.tRevPab,750);
 assert.equal(result.alos,3);
 assert.equal(result.index,125);
 const negative=calculateHotelKpis({availableRoomNights:600,gop:-60000,ownComparable:10,peerComparable:0});
 assert.equal(negative.goppar,-100);
 assert.equal(negative.index,null);
});

test('browser KPI calculator distinguishes empty inputs from actual zero values',async()=>{
 const inputs=Object.fromEntries(['rooms','revenue','gop','beds','cohort-nights','cohort-bookings','own','peer'].map(key=>[key,{value:'',checkValidity:()=>true}]));
 const outputs=Object.fromEntries(['tRevpar','goppar','tRevPab','alos','index'].map(key=>[key,{textContent:''}]));
 const controls={error:{},results:{},export:{addEventListener(){}},calculate:{addEventListener(_event,handler){this.click=handler}},'index-type':{value:'MPI',addEventListener(){}},'index-label':{}};
 const root={querySelector(selector){
  const input=selector.match(/^\[data-kpi-(rooms|revenue|gop|beds|cohort-nights|cohort-bookings|own|peer)\]$/);
  if(input)return inputs[input[1]];
  const output=selector.match(/^\[data-kpi-out="([^"]+)"\]$/);
  if(output)return outputs[output[1]];
  return controls[selector.match(/^\[data-kpi-([^\]]+)\]$/)?.[1]];
 },querySelectorAll(){return Object.values(inputs)}};
 const document={querySelector:selector=>selector==='[data-hotel-kpis]'?root:null,querySelectorAll:()=>[]};
 runInNewContext(await readFile(new URL('../versions/v1/public/tools.js',import.meta.url),'utf8'),{document,Intl});
 for(const key of ['rooms','beds','cohort-bookings','peer'])inputs[key].value='10';
 controls.calculate.click();
 for(const output of Object.values(outputs))assert.equal(output.textContent,'Недостатньо даних');
 for(const key of ['revenue','gop','cohort-nights','own'])inputs[key].value='0';
 controls.calculate.click();
 for(const output of Object.values(outputs))assert.notEqual(output.textContent,'Недостатньо даних');
});

test('PMS TCO adds monthly, one-time and usage costs while keeping internal time separate',()=>{
 const proposal={baseMonthly:1000,modulesMonthly:200,setup:3000,migration:2000,hardware:0,usageTotal:0,renewalsTotal:0,internalHours:10,hourCost:500};
 const result=calculatePmsTco(proposal,12);
 assert.deepEqual(result,{ok:true,cash:19400,internalResource:5000,extended:24400});
 assert.equal(calculatePmsTco({...proposal,migration:null},12).ok,false);
 assert.equal(calculatePmsTco(proposal,0).ok,false);
});

test('housekeeping workload matches sample capacity and preserves deficit, zero-worker and zero-task cases',()=>{
 const tasks=[{count:30,minutes:10},{count:25,minutes:10},{count:20,minutes:6},{count:20,minutes:4},{count:10,minutes:4}];
 const result=calculateHousekeepingWorkload(tasks,{shiftMinutes:480,breakMinutes:45,otherWorkMinutes:60,workers:2});
 assert.deepEqual(result,{ok:true,required:790,availablePerPerson:375,teamCapacity:750,gap:-40,utilizationPct:105.33333333333333,minimumWorkers:3});
 assert.equal(calculateHousekeepingWorkload(tasks,{shiftMinutes:480,breakMinutes:45,otherWorkMinutes:60,workers:3}).gap,335);
 assert.equal(calculateHousekeepingWorkload([{count:0,minutes:10}],{shiftMinutes:480,breakMinutes:0,otherWorkMinutes:0,workers:0}).minimumWorkers,0);
 assert.equal(calculateHousekeepingWorkload(tasks,{shiftMinutes:60,breakMinutes:30,otherWorkMinutes:30,workers:2}).ok,false);
});

test('cancellation calculator matches net retention example and permits negative missed contribution',()=>{
 assert.deepEqual(calculateCancellationImpact({plannedRevenue:4000,plannedVariableCosts:800,retainedNet:1000,resaleRevenue:2000,resaleVariableCosts:400,handlingCosts:100}),{ok:true,plannedContribution:3200,afterEventContribution:2500,missedContribution:700});
 assert.equal(calculateCancellationImpact({plannedRevenue:4000,plannedVariableCosts:800,retainedNet:4000,resaleRevenue:0,resaleVariableCosts:0,handlingCosts:0}).missedContribution,-800);
 assert.equal(calculateCancellationImpact({plannedRevenue:-1,plannedVariableCosts:0,retainedNet:0,resaleRevenue:0,resaleVariableCosts:0,handlingCosts:0}).ok,false);
});

test('manual website checklist is complete, local-only and has a usable real export',()=>{
 const html=renderWebsiteChecklist();
 assert.equal(websiteChecklistItems.length,24);
 assert.match(html,/<h1>Перевірте сайт готелю перед наступним бронюванням<\/h1>/);
 assert.equal((html.match(/data-web-item="W\d\d"/g)||[]).length,24);
 assert.match(html,/РУЧНА ПЕРЕВІРКА ШЛЯХУ ГОСТЯ/i);
 assert.match(html,/локального файлу експорту/i);
 assert.match(html,/data-web-export disabled/);
 assert.match(html,/data-web-reset/);
 assert.doesNotMatch(html,/[—]/);
});

test('guest message builder has nine scenarios, two languages and does not claim delivery',async()=>{
 const html=renderGuestMessageBuilder(),client=await readFile(new URL('../versions/v1/public/tools.js',import.meta.url),'utf8');
 assert.match(html,/<h1>Підготуйте інструкцію для гостя<\/h1>/);
 assert.match(html,/data-message-stage/);
 assert.match(html,/data-message-language/);
 assert.match(html,/value="group_offer"/);
 assert.match(html,/value="feedback"/);
 assert.match(html,/Чернетка формується у браузері/);
 assert.match(client,/data-message-build/);
 assert.match(client,/data-message-copy/);
 assert.doesNotMatch(html,/[—]/);
 const workload=renderHousekeepingWorkloadCalculator(),cancel=renderCancellationCalculator();
 assert.match(workload,/<h1>Порівняйте задачі прибирання з часом команди<\/h1>/);
 assert.match(workload,/data-workload-calculate/);
 assert.match(cancel,/<h1>Як скасування змінило внесок від бронювання<\/h1>/);
 assert.match(cancel,/data-cancel-export disabled/);
 assert.doesNotMatch(workload+cancel,/[—]/);
});

test('guest message drafts remain editable and invalidate stale copies after form changes',async()=>{
 const controls={stage:{value:'late'},language:{value:'uk'},property:{value:''},address:{value:''},time:{value:''},contact:{value:''},route:{value:'',focus(){this.focused=true}},services:{value:''},output:{value:''},status:{textContent:''},error:{textContent:''}};
 const button=()=>({disabled:true,addEventListener(_event,handler){this.click=handler}});
 controls.build=button();controls.copy=button();controls.download=button();
 const handlers={};
 const root={querySelector(selector){return controls[selector.match(/^\[data-message-([^\]]+)\]$/)?.[1]]},addEventListener(event,handler){handlers[event]=handler}};
 const document={querySelector:selector=>selector==='[data-guest-message]'?root:null,querySelectorAll:()=>[]};
 runInNewContext(await readFile(new URL('../versions/v1/public/tools.js',import.meta.url),'utf8'),{document,Intl});
 for(const lang of ['uk','en'])for(const stage of ['prearrival','late','checkout','welcome','fact','arrival_request','group_offer','thanks','feedback']){
  controls.language.value=lang;controls.stage.value=stage;controls.build.click();
  assert.ok(controls.output.value,`${lang}/${stage}`);
  assert.doesNotMatch(controls.output.value,/undefined|надішліть гостю|Перед публікацією перевірте|Share any access code|Please verify every detail/u,`${lang}/${stage}`);
  if(lang==='en')assert.match(controls.output.value,/\[(PROPERTY NAME|CHECK-IN OR CHECK-OUT TIME|RECEPTION CONTACT|REVIEW LINK)\]/u,`${lang}/${stage}`);
 }
 assert.equal(controls.copy.disabled,false);
 handlers.input({target:controls.output});
 assert.equal(controls.copy.disabled,false);
 controls.property.value='Приклад';handlers.input({target:controls.property});
 assert.equal(controls.copy.disabled,true);
 assert.equal(controls.download.disabled,true);
 assert.match(controls.status.textContent,/Підготуйте чернетку знову/u);
 controls.route.value='example.com';controls.build.click();
 assert.match(controls.error.textContent,/https:\/\//u);
 assert.equal(controls.route.focused,true);
 assert.equal(controls.download.disabled,true);
 controls.route.value='https://example.com';controls.build.click();
 assert.equal(controls.error.textContent,'');
 assert.equal(controls.copy.disabled,false);
});

test('review reply page offers a template-only local workflow and has no AI or auto-publish claim',async()=>{
 const html=renderReviewReplyTemplates(),client=await readFile(new URL('../versions/v1/public/tools.js',import.meta.url),'utf8');
 assert.match(html,/<h1>Підготуйте відповідь на відгук<\/h1>/);
 assert.match(html,/без AI та автоматичного надсилання/i);
 assert.match(html,/Текст формується у браузері та не надсилається на сервер/);
 assert.match(html,/data-review-build/);
 assert.match(client,/data-review-template/);
 assert.doesNotMatch(html,/[—]/);
});

test('new standalone tools have canonical indexable metadata and catalog links',()=>{
 const admin=renderAdminTimeCalculator(),checklist=renderWebsiteChecklist(),catalog=renderToolsIndex();
 assert.match(admin,/<link rel="canonical" href="https:\/\/www\.vdalo\.tech\/tools\/hotel-admin-time-calculator\/">/);
 assert.match(checklist,/<link rel="canonical" href="https:\/\/www\.vdalo\.tech\/tools\/hotel-website-checklist\/">/);
 assert.match(admin,/<meta name="robots" content="index,follow">/);
 assert.match(catalog,/href="\/tools\/hotel-admin-time-calculator\/"/);
 assert.match(catalog,/href="\/tools\/hotel-website-checklist\/"/);
 assert.match(catalog,/href="\/tools\/guest-message-builder\/"/);
 assert.match(catalog,/href="\/tools\/housekeeping-workload-calculator\/"/);
 assert.match(catalog,/href="\/tools\/hotel-cancellation-cost-calculator\/"/);
 assert.match(catalog,/href="\/tools\/hotel-review-response\/"/);
 for(const html of [admin,checklist,renderGuestMessageBuilder(),renderHousekeepingWorkloadCalculator(),renderCancellationCalculator(),renderReviewReplyTemplates()]){
  assert.match(html,/<link rel="stylesheet" href="\/tools\.css">/);
  assert.match(html,/<script src="\/tools\.js" defer><\/script>/);
 }
 assert.doesNotMatch(admin+checklist,/[—]/);
 assert.match(renderHotelProfitabilityCalculator(),/data-hotel-kpis/);
 assert.match(renderHotelProfitabilityCalculator(),/data-kpi-index-type/);
 const pms=renderPmsChecklist();
 assert.match(pms,/<h1>Чекліст вибору PMS: оцініть систему за 25 критеріями<\/h1>/);
 assert.match(pms,/TCO: повна вартість PMS/);
 assert.match(pms,/data-tco-months/);
 assert.equal((pms.match(/data-tco-proposal="[123]"/g)||[]).length,3);
});
