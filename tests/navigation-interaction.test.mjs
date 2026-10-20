import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {renderPage} from '../versions/v1/render.mjs';

const css=readFileSync(fileURLToPath(new URL('../versions/v1/public/design-system-2.css',import.meta.url)),'utf8');
const js=readFileSync(fileURLToPath(new URL('../versions/v1/public/app.js',import.meta.url)),'utf8');

test('navigation groups use native disclosure and omit the decorative chevrons',()=>{
  const html=renderPage({origin:'https://www.vdalo.tech'});
  assert.match(html,/<details class="nav-disclosure" data-nav-level="1"/);
  assert.doesNotMatch(html,/class="nav-chevron"/);
  assert.match(css,/\.nav-disclosure>summary::marker\{content:""\}/);
  assert.match(html,/<button class="menu-toggle"[^>]*aria-expanded="false"[^>]*aria-controls="navigation"/);
});

test('desktop pointer hover and keyboard focus reveal nested navigation',()=>{
  assert.match(css,/@media\(min-width:901px\) and \(hover:hover\) and \(pointer:fine\)/);
  assert.match(css,/\.nav-disclosure:hover>\.nav-submenu/);
  assert.match(css,/\.nav-disclosure:focus-within>\.nav-submenu/);
  assert.match(css,/\.nav-submenu \.nav-disclosure:hover>\.nav-submenu/);
  assert.match(css,/\.nav-disclosure:hover>\.nav-submenu[^}]*top:calc\(100% \+ 8px\)/);
});

test('mobile disclosure remains keyboard-operable and Escape closes navigation',()=>{
  assert.match(css,/@media\(max-width:900px\)[\s\S]*?\.nav-disclosure\[open\]>\.nav-submenu/);
  assert.match(js,/event\.key!=='Escape'/);
  assert.match(js,/last\.open=false/);
  assert.match(js,/closeNavigation\(\)/);
});
