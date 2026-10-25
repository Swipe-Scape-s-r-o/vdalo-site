const finite = (value) => typeof value === 'number' && Number.isFinite(value);

function range(values, rules) {
  for (const [key, rule] of Object.entries(rules)) {
    const value = values[key];
    if (!finite(value) || value < rule.min || value > rule.max || (rule.integer && !Number.isInteger(value))) {
      return `${key} має бути числом у межах ${rule.min}–${rule.max}${rule.integer ? ' (ціле)' : ''}.`;
    }
  }
  return '';
}

export function calculateChannelEconomics(input) {
  const error = range(input, {
    baseRevenue: { min: Number.EPSILON, max: 1_000_000_000 },
    otaFeePct: { min: 0, max: 100 },
    directDiscountPct: { min: 0, max: 99.99 },
    directPspPct: { min: 0, max: 100 },
    directAcquisitionCost: { min: 0, max: 1_000_000_000 },
    variableStayCost: { min: 0, max: 1_000_000_000 },
    otaOtherCosts: { min: 0, max: 1_000_000_000 },
    directOtherCosts: { min: 0, max: 1_000_000_000 },
  });
  if (error) return { ok: false, error };
  const otaRevenue = input.baseRevenue;
  const directRevenue = otaRevenue * (1 - input.directDiscountPct / 100);
  const otaFee = otaRevenue * input.otaFeePct / 100;
  const directPspFee = directRevenue * input.directPspPct / 100;
  const otaContribution = otaRevenue - otaFee - input.variableStayCost - input.otaOtherCosts;
  const directContribution = directRevenue - directPspFee - input.directAcquisitionCost - input.variableStayCost - input.directOtherCosts;
  const maxAcquisitionCost = directRevenue - directPspFee - input.variableStayCost - input.directOtherCosts - otaContribution;
  return { ok: true, otaRevenue, directRevenue, otaFee, directPspFee, otaContribution, directContribution, difference: directContribution - otaContribution, maxAcquisitionCost };
}

export function calculateRoomCost(input) {
  const error = range(input, {
    availableRoomNights: { min: 1, max: 1_000_000_000, integer: true },
    soldRoomNights: { min: 0, max: 1_000_000_000, integer: true },
    fixedCosts: { min: 0, max: 1_000_000_000_000 },
    variablePerSoldNight: { min: 0, max: 1_000_000_000 },
    adr: { min: Number.EPSILON, max: 1_000_000_000 },
    distributionPct: { min: 0, max: 99.99 },
  });
  if (error) return { ok: false, error };
  if (input.soldRoomNights > input.availableRoomNights) return { ok: false, error: 'Продані номероночі не можуть перевищувати доступний фонд.' };
  const { availableRoomNights: A, soldRoomNights: S, fixedCosts: F, variablePerSoldNight: V, adr: P, distributionPct: q } = input;
  const revenue = P * S;
  const distributionCosts = revenue * q / 100;
  const contributionPerNight = P * (1 - q / 100) - V;
  const includedCostsResult = S * contributionPerNight - F;
  const breakEvenRoomNights = contributionPerNight > 0 ? F / contributionPerNight : null;
  const breakEvenOccupancyPct = breakEvenRoomNights === null ? null : 100 * breakEvenRoomNights / A;
  return {
    ok: true, revenue, variableCosts: V * S, distributionCosts, contributionPerNight,
    resultAfterIncludedCosts: includedCostsResult,
    costPerSoldNightBeforeDistribution: S > 0 ? F / S + V : null,
    costPerSoldNightAfterDistribution: S > 0 ? F / S + V + P * q / 100 : null,
    breakEvenRoomNights,
    minimumWholeRoomNights: breakEvenRoomNights === null ? null : Math.ceil(breakEvenRoomNights),
    breakEvenOccupancyPct,
    occupancyFeasible: breakEvenOccupancyPct !== null && breakEvenOccupancyPct <= 100,
  };
}

export function evaluateRoomAcceptance(items) {
  const blockers = [];
  const incomplete = [];
  for (const item of items) {
    const status = ['pass','fail','not_checked','not_applicable'].includes(item.status) ? item.status : 'not_checked';
    const hasNaReason = typeof item.naReason === 'string' && item.naReason.trim().length > 0;
    if (item.critical && (status === 'fail' || status === 'not_checked' || (status === 'not_applicable' && !hasNaReason))) blockers.push(item.id);
    else if (status === 'not_checked' || (status === 'not_applicable' && item.critical && !hasNaReason)) incomplete.push(item.id);
    else if (!item.critical && status === 'fail') incomplete.push(item.id);
  }
  return { blockers, incomplete, readyForHumanConfirmation: blockers.length === 0 && incomplete.length === 0 };
}

export function calculateHotelKpis(input){
 const nonNegative=(value)=>finite(value)&&value>=0;
 const positive=(value)=>finite(value)&&value>0;
 const result={tRevpar:null,goppar:null,tRevPab:null,alos:null,index:null};
 if(positive(input.availableRoomNights)&&nonNegative(input.totalRevenue))result.tRevpar=input.totalRevenue/input.availableRoomNights;
 if(positive(input.availableRoomNights)&&finite(input.gop))result.goppar=input.gop/input.availableRoomNights;
 if(positive(input.availableBedNights)&&nonNegative(input.totalRevenue))result.tRevPab=input.totalRevenue/input.availableBedNights;
 if(nonNegative(input.cohortRoomNights)&&positive(input.cohortBookings))result.alos=input.cohortRoomNights/input.cohortBookings;
 if(nonNegative(input.ownComparable)&&positive(input.peerComparable))result.index=100*input.ownComparable/input.peerComparable;
 return result;
}

export function calculatePmsTco(proposal,months){
 if(!Number.isInteger(months)||months<1||months>60)return {ok:false,error:'Період має бути цілим числом від 1 до 60 місяців.'};
 const keys=['baseMonthly','modulesMonthly','setup','migration','hardware','usageTotal','renewalsTotal','internalHours','hourCost'];
 if(keys.some(key=>!finite(proposal[key])||proposal[key]<0))return {ok:false,error:'Усі статті потрібно вказати окремо. Нуль вводьте лише для підтвердженої відсутності витрат.'};
 const cash=proposal.setup+proposal.migration+proposal.hardware+months*(proposal.baseMonthly+proposal.modulesMonthly)+proposal.usageTotal+proposal.renewalsTotal;
 const internalResource=proposal.internalHours*proposal.hourCost;
 return {ok:true,cash,internalResource,extended:cash+internalResource};
}

export function calculateHousekeepingWorkload(tasks,{shiftMinutes,breakMinutes,otherWorkMinutes,workers}){
 const valid=(x)=>Number.isInteger(x)&&x>=0;
 if(!Array.isArray(tasks)||tasks.some(item=>!valid(item.count)||!valid(item.minutes))||![shiftMinutes,breakMinutes,otherWorkMinutes,workers].every(valid)||workers>10000)return {ok:false,error:'Вкажіть цілі невід’ємні значення.'};
 const availablePerPerson=shiftMinutes-breakMinutes-otherWorkMinutes;
 if(availablePerPerson<=0)return {ok:false,error:'Доступний час однієї людини має бути більшим за нуль.'};
 const required=tasks.reduce((sum,item)=>sum+item.count*item.minutes,0),teamCapacity=availablePerPerson*workers;
 return {ok:true,required,availablePerPerson,teamCapacity,gap:teamCapacity-required,utilizationPct:teamCapacity?100*required/teamCapacity:null,minimumWorkers:required?Math.ceil(required/availablePerPerson):0};
}

export function calculateCancellationImpact(input){
 const keys=['plannedRevenue','plannedVariableCosts','retainedNet','resaleRevenue','resaleVariableCosts','handlingCosts'];
 if(keys.some(key=>!finite(input[key])||input[key]<0))return {ok:false,error:'Усі суми мають бути невід’ємними числами в одній валюті.'};
 const plannedContribution=input.plannedRevenue-input.plannedVariableCosts;
 const afterEventContribution=input.retainedNet+input.resaleRevenue-input.resaleVariableCosts-input.handlingCosts;
 return {ok:true,plannedContribution,afterEventContribution,missedContribution:plannedContribution-afterEventContribution};
}
