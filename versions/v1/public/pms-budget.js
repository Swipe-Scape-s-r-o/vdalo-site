const amountKeys = [
 'baseMonthly','perUnitMonthly','channelsMonthly','modulesMonthly','annualFees','setup','migration','training','otherSetup',
 'roleOneSetupHours','roleOneMonthlyHours','roleTwoSetupHours','roleTwoMonthlyHours'
];

function roundMinor(value) {
 return Math.round((value + Number.EPSILON) * 100);
}

export function calculatePmsBudget(input) {
 if (!Number.isInteger(input.units) || input.units < 1 || input.units > 5000) {
  return {error:'Вкажіть від 1 до 5 000 номерів або будинків.'};
 }
 if (!amountKeys.every(key => Number.isFinite(input[key]) && input[key] >= 0)) {
  return {error:'Перевірте суми та години. Значення мають бути невід’ємними.'};
 }

 let currencyMonthly = 0;
 let currencySetup = 0;
 if (input.currency !== 'UAH') {
  if (!['USD','EUR'].includes(input.currency) || !Number.isFinite(input.rate) || input.rate <= 0) {
   return {error:'Вкажіть додатний курс у гривнях за одиницю валюти.',field:'rate'};
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.rateDate || '') ||
      !Number.isFinite(Date.parse(input.rateDate)) ||
      new Date(input.rateDate).toISOString().slice(0,10) !== input.rateDate) {
   return {error:'Вкажіть дату курсу, який використовуєте.',field:'rateDate'};
  }
  const fxKeys = ['fxMonthly','fxUnitMonthly','fxSetup'];
  if (!fxKeys.every(key => Number.isFinite(input[key]) && input[key] >= 0)) {
   return {error:'Перевірте суми в іноземній валюті.'};
  }
  currencyMonthly = Math.round((roundMinor(input.fxMonthly) + input.units * roundMinor(input.fxUnitMonthly)) * input.rate);
  currencySetup = Math.round(roundMinor(input.fxSetup) * input.rate);
 }

 let teamSetup = 0;
 let teamAnnual = 0;
 for (const role of ['roleOne','roleTwo']) {
  const setup = input[role+'SetupHours'];
  const monthly = input[role+'MonthlyHours'];
  if (setup === 0 && monthly === 0) continue;
  const rate = input[role+'Rate'];
  if (!Number.isFinite(rate) || rate < 0) {
   return {error:'Вкажіть вартість години для ролі, час якої враховуєте.',field:role+'Rate'};
  }
  teamSetup += Math.round(roundMinor(setup) * roundMinor(rate) / 100);
  teamAnnual += Math.round(roundMinor(monthly) * roundMinor(rate) * 12 / 100);
 }

 const monthly = roundMinor(input.baseMonthly) + input.units * roundMinor(input.perUnitMonthly) +
  roundMinor(input.channelsMonthly) + roundMinor(input.modulesMonthly) + currencyMonthly;
 const launch = roundMinor(input.setup) + roundMinor(input.migration) + roundMinor(input.training) +
  roundMinor(input.otherSetup) + currencySetup;
 const nextYear = monthly * 12 + roundMinor(input.annualFees);
 const firstYear = nextYear + launch;
 const firstYearTeam = teamAnnual + teamSetup;
 const firstYearTotal = firstYear + firstYearTeam;
 const nextYearTotal = nextYear + teamAnnual;
 const totals = {monthly,launch,firstYear,nextYear,firstYearTeam,teamAnnual,firstYearTotal,nextYearTotal};
 if (!Object.values(totals).every(Number.isSafeInteger)) {
  return {error:'Сума завелика для розрахунку. Перевірте введені значення.'};
 }
 return Object.fromEntries(Object.entries(totals).map(([key,value]) => [key,value/100]));
}

function mountBudget(form) {
 const fields = Object.fromEntries([...form.querySelectorAll('[data-budget-field]')].map(field => [field.dataset.budgetField,field]));
 const results = form.querySelector('[data-budget-results]');
 const error = form.querySelector('[data-budget-error]');
 const fx = form.querySelector('[data-budget-conversion]');
 const optionalRates = ['roleOneRate','roleTwoRate'];
 const money = new Intl.NumberFormat('uk-UA',{style:'currency',currency:'UAH'});
 const outputs = results.querySelectorAll('[data-budget-result]');
 const calculate = form.querySelector('[data-budget-calculate]');
 const example = form.querySelector('[data-budget-example]');

 function onEdit() {
  const convert = fields.currency.value !== 'UAH';
  fx.hidden = !convert;
  fx.disabled = !convert;
  for (const label of fx.querySelectorAll('[data-budget-currency]')) label.textContent = fields.currency.value;
  results.hidden = true;
  error.textContent = '';
  for (const field of Object.values(fields)) field.removeAttribute('aria-invalid');
 }

 form.addEventListener('input',onEdit);
 form.addEventListener('change',onEdit);
 example.addEventListener('click',() => {
  const values = {
   units:12,baseMonthly:1200,perUnitMonthly:0,channelsMonthly:600,modulesMonthly:400,annualFees:0,
   setup:2500,migration:3000,training:1500,otherSetup:0,currency:'UAH',
   fxMonthly:'',fxUnitMonthly:'',fxSetup:'',rate:'',rateDate:'',
   roleOneSetupHours:6,roleOneMonthlyHours:1,roleOneRate:200,
   roleTwoSetupHours:2,roleTwoMonthlyHours:0,roleTwoRate:400
  };
  for (const [key,value] of Object.entries(values)) fields[key].value = value;
  form.querySelector('[data-budget-team]').open = true;
  onEdit();
  form.requestSubmit();
 });
 form.addEventListener('submit',event => {
  event.preventDefault();
  onEdit();
  const invalid = Object.values(fields).find(field => !field.matches(':disabled') && !field.validity.valid);
  if (invalid) {
   invalid.closest('details')?.setAttribute('open','');
   invalid.setAttribute('aria-invalid','true');
   error.textContent = 'Перевірте підсвічене поле й допустимі значення.';
   invalid.reportValidity();
   invalid.focus();
   return;
  }
  const values = Object.fromEntries(Object.entries(fields).map(([key,field]) => [
   key, field.type !== 'number' ? field.value :
    field.value === '' && !optionalRates.includes(key) ? 0 : field.valueAsNumber
  ]));
  const result = calculatePmsBudget(values);
  if (result.error) {
   error.textContent = result.error;
   const field = fields[result.field];
   if (field) {
    field.closest('details')?.setAttribute('open','');
    field.setAttribute('aria-invalid','true');
    field.focus();
   }
   return;
  }
  for (const output of outputs) output.textContent = money.format(result[output.dataset.budgetResult]);
  results.hidden = false;
  results.querySelector('h2').focus();
 });
 onEdit();
 calculate.hidden = false;
 example.hidden = false;
}

if (typeof document !== 'undefined') {
 const form = document.querySelector('[data-pms-budget]');
 if (form) mountBudget(form);
}
