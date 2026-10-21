import test from 'node:test';
import assert from 'node:assert/strict';
import {renderPage} from '../versions/v1/render.mjs';
import {renderPmsChecklist} from '../versions/v1/tools.mjs';
import {renderTouristTaxCity} from '../versions/v1/tourist-tax.mjs';
import {renderSmsTrial} from '../microlandings/sms-trial.mjs';

test('forms with visitor-entered data never fall back to GET query strings',()=>{
 const html=[
  renderPage({origin:'https://www.vdalo.tech',full:true}),
  renderPmsChecklist(),
  renderTouristTaxCity('kyyiv'),
  renderSmsTrial()
 ].join('\n');
 const forms=[...html.matchAll(/<form\b[^>]*>/g)].map(([markup])=>markup);
 assert.ok(forms.length>0);
 assert.ok(forms.every(form=>/\bmethod="post"/i.test(form)),forms.join('\n'));
 assert.match(html,/<form data-kind="contact" method="post" action="\/api\/leads\/audit"/);
 assert.match(html,/<form data-kind="audit" method="post" action="\/api\/leads\/audit"/);
 assert.match(html,/<form data-kind="trial" method="post" action="\/api\/leads\/trial"/);
 assert.match(html,/<form data-report-form method="post" action="\/api\/tools\/pms-report"/);
 assert.match(html,/<form class="tt-calc" id="tourist-tax-calculator" method="post" action="\/api\/tourist-tax\/calculate"/);
 assert.match(html,/<form id="sms-trial-form" method="post" action="\/api\/funnels\/top5"/);
});
