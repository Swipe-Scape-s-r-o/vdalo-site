import test from 'node:test';
import assert from 'node:assert/strict';
import {renderPage} from '../versions/v1/render.mjs';

test('homepage product illustrations label AI and PRRO as in development',()=>{
  const html=renderPage({origin:'https://www.vdalo.tech',full:true});
  assert.match(html,/AI-помічник для гостей - у розробці/);
  assert.match(html,/ПРРО та інтеграція з Дією перебувають у розробці/);
  assert.doesNotMatch(html,/Чатбот на основі ШІ/);
  assert.doesNotMatch(html,/Оплата<\/span><strong>Електронний чек/);
});
