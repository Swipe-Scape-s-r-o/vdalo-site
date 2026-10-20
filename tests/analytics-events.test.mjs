import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const read=path=>readFileSync(fileURLToPath(new URL(path,import.meta.url)),'utf8');
const app=read('../versions/v1/public/app.js');
const pricing=read('../versions/v1/public/pricing.js');
const quiz=read('../microlandings/public/quiz.js');
const funnel=read('../microlandings/public/funnel.js');
const trial=read('../microlandings/public/sms-trial.js');
const server=read('../server.mjs');

test('GTM container is installed and product forms emit acknowledged success events',()=>{
  assert.match(server,/googletagmanager\.com\/gtm\.js\?id=/);
  assert.match(app,/track\(`\$\{kind\}_form_submit_success`,\{lead_id:result\.leadId\}\)/);
  assert.match(app,/track\(`\$\{kind\}_form_submit_error`/);
});

test('quiz, 14-day trial and funnel emit their main conversion events',()=>{
  for(const event of ['quiz_start','quiz_answer','quiz_complete','quiz_recommendation_click','quiz_access_click'])assert.ok(quiz.includes(`track('${event}'`),event);
  for(const event of ['primary_cta_click','form_success','form_error'])assert.ok(funnel.includes(`track('${event}'`),event);
  assert.ok(trial.includes("track('form_success',{lead_id:leadId,stage:'email_captured'})"));
  assert.ok(trial.includes("track('form_details_complete',{lead_id:result.leadId})"));
  assert.ok(trial.includes("track('form_error',{step:2,reason:'delivery'})"));
});

test('pricing calculator and checkout start emit non-contact analytics after valid input',()=>{
  for(const event of ['pricing_calculator_update','pricing_checkout_open','begin_checkout'])assert.ok(pricing.includes(`'${event}'`),event);
  assert.ok(pricing.indexOf('if(!checkoutForm.reportValidity())')<pricing.indexOf("track('begin_checkout'"));
  assert.doesNotMatch(pricing,/track\([^\n]*(email|phone|customerName|property|contact)/i);
});
