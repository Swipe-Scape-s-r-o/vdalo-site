import test from 'node:test';
import assert from 'node:assert/strict';
import {renderPage} from '../versions/v1/render.mjs';

test('homepage product illustrations label AI and PRRO as in development',()=>{
  const html=renderPage({origin:'https://www.vdalo.tech',full:true});
  assert.match(html,/AI-помічник - у розробці/);
  assert.match(html,/ПРРО - у розробці/);
  assert.doesNotMatch(html,/Чатбот на основі ШІ/);
  assert.doesNotMatch(html,/Оплата<\/span><strong>Електронний чек/);
});
