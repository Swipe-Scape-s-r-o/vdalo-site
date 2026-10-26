import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateChannelEconomics,calculateRoomCost,evaluateRoomAcceptance,calculateHotelKpis,calculatePmsTco,calculateHousekeepingWorkload,calculateCancellationImpact} from '../versions/v1/tool-calculations.mjs';
import {renderDirectBookingCostCalculator,renderHotelRoomCostCalculator,renderToolsIndex,renderHousekeepingChecklist,renderHotelProfitabilityCalculator,renderPmsChecklist} from '../versions/v1/tools.mjs';
import {publicResources,renderResourceLibrary} from '../versions/v1/resource-library.mjs';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {calculateAdminTime,renderAdminTimeCalculator,renderWebsiteChecklist,websiteChecklistItems,renderGuestMessageBuilder,renderHousekeepingWorkloadCalculator,renderCancellationCalculator,renderReviewReplyTemplates} from '../versions/v1/advanced-tools.mjs';

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

test('guest message builder has three scenarios, two languages and does not claim delivery',async()=>{
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
