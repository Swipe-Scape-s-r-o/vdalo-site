import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Readable} from 'node:stream';
import {handleTop5Lead} from '../microlandings/top5-leads.mjs';
import {renderQuizPage} from '../microlandings/quiz.mjs';
import {renderSmsTrial} from '../microlandings/sms-trial.mjs';

const quizScript = await readFile(new URL('../microlandings/public/quiz.js', import.meta.url), 'utf8');
const trialScript = await readFile(new URL('../microlandings/public/sms-trial.js', import.meta.url), 'utf8');

test('quiz and trial form invalidate cached scripts when their behavior changes', () => {
  assert.match(renderQuizPage(), /quiz-assets\/quiz\.js\?v=11/);
  const trialHtml = renderSmsTrial();
  assert.match(trialHtml, /sms-trial-assets\/sms-trial\.js\?v=4/);
  assert.match(trialHtml, /Розкажіть про ваш об’єкт/);
  assert.doesNotMatch(trialHtml, /масштаб готелю/);
});

test('quiz trial CTA targets /go/trial and keeps campaign attribution', () => {
  assert.match(quizScript, /href="\/go\/trial\?\$\{accessQs\.toString\(\)\}"/);
  assert.match(quizScript, /quiz_access_click',\{target_route:'\/go\/trial'\}/);
  assert.match(quizScript, /utmKeys=\['utm_source','utm_medium','utm_campaign','utm_content','utm_term'\]/);
  assert.match(quizScript, /for\(const key of utmKeys\)\{const value=search\.get\(key\);if\(value\)attribution\[key\]=value\.slice\(0,150\);\}/);
});

test('trial form carries stored quiz context and maps it to the correct lead funnel', () => {
  assert.match(trialScript, /sessionStorage\.getItem\('vdalo-quiz-context'\)/);
  assert.match(trialScript, /Object\.assign\(data,context\(\)\)/);
  assert.match(trialScript, /quiz_answers:validQuizContext,quiz_landing_route:validQuizContext\.recommendation_route/);
  assert.match(trialScript, /channels:'overbook',checkin:'staff',night_calls:'nights',power:'blackout',direct:'commission'/);
  assert.match(trialScript, /propertyTypes=\{hotel:'hotel',guesthouse:'guesthouse',apartments:'apartments',resort:'glamping',hostel:'hostel',other:'other'\}/);
});

test('trial lead validates and retains quiz qualification for the matching destination', async () => {
  const quizAnswers = {
    property_format: 'hotel', property_type: 'hotel', room_range: '6-12',
    pms_status: 'exely', main_pain: 'checkin', frequency: 'daily',
    intent: 'solution', recommendation_route: '/53'
  };
  const requestBody = {
    name: 'QA Contact', email: 'qa@example.com', phone: '+380501234567',
    hotel: 'QA Hotel', location: 'Lviv', property_type: 'hotel', rooms: '1-12',
    hotel_count: '1', consent: true, funnel: 'staff', source: 'website',
    utm_campaign: 'hotel_quiz', utm_source: 'quiz', utm_medium: 'website',
    quiz_answers: quizAnswers, quiz_landing_route: '/53'
  };
  const req = Readable.from([JSON.stringify(requestBody)]);
  req.method = 'POST';
  req.headers = {'content-type': 'application/json', origin: 'https://www.vdalo.tech', host: 'www.vdalo.tech'};
  req.socket = {remoteAddress: '192.0.2.251'};
  let status = 0, responseBody, forwarded;
  const res = {writeHead(code) { status = code; }, end(body) { responseBody = JSON.parse(body); }};
  await handleTop5Lead(req, res, {
    env: {VDALO_TRIAL_WEBHOOK_URL: 'https://receiver.example.invalid/trial'},
    sendRequest: async (url, options) => {
      assert.equal(url, 'https://receiver.example.invalid/trial');
      forwarded = JSON.parse(options.body);
      return new Response(JSON.stringify({ok:true}),{status:200});
    }
  });
  assert.equal(status, 200);
  assert.equal(responseBody.ok, true);
  assert.equal(forwarded.kind, 'trial_request');
  assert.equal(forwarded.trial_days, 14);
  assert.deepEqual(Object.fromEntries(Object.entries(forwarded.qualification.quiz_answers).filter(([key])=>key!=='form_fields')), {
    property_format: 'hotel', property_type: 'hotel', room_range: '6-12',
    pms_status: 'exely', main_pain: 'checkin', frequency: 'daily', intent: 'solution'
  });
  assert.equal(forwarded.attribution.utm.utm_campaign, 'hotel_quiz');
});

test('quiz recommendation form preserves incoming UTMs and quiz context for a PMS return campaign', async () => {
  const quizAnswers = {
    property_format: 'hotel', property_type: 'hotel', room_range: '6-12',
    pms_status: 'exely', main_pain: 'checkin', frequency: 'daily',
    intent: 'solution', recommendation_route: '/53'
  };
  const requestBody = {
    name: 'QA Contact', email: 'qa@example.com', phone: '+380501234567',
    hotel: 'QA Hotel', location: 'Lviv', property_type: 'hotel', rooms: '1-12',
    hotel_count: '1', consent: true, funnel: 'staff', source: 'website',
    utm_source: 'pms', utm_medium: 'return', utm_campaign: 'spring-26',
    utm_content: 'sms-link-a', utm_term: 'return-code',
    quiz_answers: quizAnswers, quiz_landing_route: '/53'
  };
  const req = Readable.from([JSON.stringify(requestBody)]);
  req.method = 'POST';
  req.headers = {'content-type': 'application/json', origin: 'https://www.vdalo.tech', host: 'www.vdalo.tech'};
  req.socket = {remoteAddress: '192.0.2.252'};
  let status = 0, forwarded;
  const res = {writeHead(code) { status = code; }, end() {}};
  await handleTop5Lead(req, res, {
    env: {VDALO_TRIAL_WEBHOOK_URL: 'https://receiver.example.invalid/trial'},
    sendRequest: async (_url, options) => {
      forwarded = JSON.parse(options.body);
      return new Response(JSON.stringify({ok:true}), {status:200});
    }
  });
  assert.equal(status, 200);
  assert.deepEqual(forwarded.attribution.utm, {
    utm_source: 'pms', utm_medium: 'return', utm_campaign: 'spring-26',
    utm_content: 'sms-link-a', utm_term: 'return-code'
  });
  assert.equal(forwarded.qualification.quiz_answers.main_pain, 'checkin');
});
