import test from 'node:test';
import assert from 'node:assert/strict';
import {renderRouteForReview} from '../scripts/review-render.mjs';
import {checkPracticeSection,checkResearchEvidence} from '../scripts/verify-seo-editorial.mjs';

test('editorial QA requires the revised visible example and contents link, not only a legacy alias',async()=>{
  const route='/blog/channel-manager-ical-gotelyu';
  const id='навчальний-журнал-затримки-обміну';
  const {html}=await renderRouteForReview(route);
  const check=page=>checkPracticeSection(page,route,id,/вигадані події одного тесту/u,/DEMO-01/u);
  assert.deepEqual(check(html),[]);
  assert.ok(check(html.replace(`href="#${id}"`,'href="#practice"')).some(error=>error.includes('missing contents link')));
  assert.ok(check(html.replace(`id="${id}"`,`id="removed-example"`)).some(error=>error.includes('missing visible practice section')));
  assert.ok(check(html.replace('вигадані події одного тесту','події одного тесту')).some(error=>error.includes('missing explanation')));
});

test('case evidence QA rejects unsupported percentages and a missing primary-data disclosure',async()=>{
  const {html}=await renderRouteForReview('/cases/booking-widget-study-2118');
  assert.deepEqual(checkResearchEvidence(html),[]);
  assert.ok(checkResearchEvidence(html.replace('не містить повної первинної таблиці','містить первинну таблицю')).some(error=>error.includes('missing disclosure')));
  assert.ok(checkResearchEvidence(html.replace('Без знаменника підсумок не можна перевірити.','Результат точно встановлено.')).some(error=>error.includes('verification caveat')));
});
