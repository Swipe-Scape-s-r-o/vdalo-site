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

test('mega-menu nested groups stay open while the pointer crosses between categories',()=>{
  assert.match(js,/if\(detail\.closest\('\.nav-mega-columns'\)\)return;[\s\S]*?\},350\);/);
  assert.match(js,/const siblings=megaColumns[\s\S]*?siblings\.forEach\(sibling=>\{if\(sibling!==detail\)closeDisclosureBranch\(sibling\);\}\)/);
});

test('mega-menu sections stay in independent columns when one group expands',()=>{
  const html=renderPage({origin:'https://www.vdalo.tech'});
  assert.match(html,/class="nav-submenu nav-submenu-level-2 nav-mega-columns"/);
  assert.equal((html.match(/class="nav-mega-column"/g)||[]).length,2);
  assert.match(html,/nav-mega-list[^]*Робота з гостями[^]*nav-mega-list[^]*Бронювання та продажі/);
  assert.match(css,/\.nav-disclosure\[data-nav-panel="mega"\]>.nav-submenu\{[^}]*grid-template-columns:repeat\(2,minmax\(0,1fr\)\);align-items:start/);
  assert.match(css,/\.nav-mega-list\{display:flex!important;flex-direction:column/);
  assert.match(css,/\.header-inner\{height:80px;position:relative\}/);
  assert.match(css,/\.site-nav>\.nav-mega-trigger\{position:static\}/);
  assert.match(css,/\.nav-disclosure\[data-nav-panel="mega"\]>.nav-submenu\{left:auto;right:0/);
  assert.match(css,/\.nav-disclosure\[data-nav-panel="mega"\]>.nav-submenu\{[^}]*width:min\(700px,calc\(100vw - 48px\)\)[^}]*gap:4px 12px/);
  assert.match(js,/const megaColumns=detail\.closest\('\.nav-mega-columns'\)/);
  assert.match(js,/\.nav-mega-list > \.nav-item > details\.nav-disclosure\[open\]/);
});

test('mega-menu lists have no browser bullets, use compact rows, and stay within the viewport',()=>{
  assert.match(css,/\.nav-mega-list\{list-style:none;margin:0;padding:0;gap:2px\}/);
  assert.match(css,/@media\(min-width:901px\)\{\.ds2 \.nav-mega-columns\{[^}]*max-height:calc\(100vh - 112px\);overflow-y:auto/);
  assert.match(css,/\.ds2 \.nav-mega-columns a,\.ds2 \.nav-mega-columns \.nav-disclosure>summary\{min-height:36px;padding-block:6px\}/);
  assert.match(css,/\.ds2 \.nav-mega-columns \.nav-submenu \.nav-item a\{min-height:32px;padding-block:4px\}/);
});

test('homepage first and second sections have a tighter responsive gap',()=>{
  assert.match(css,/\.ds2 \.hero-v3\{padding-bottom:40px\}/);
  assert.match(css,/\.ds2 \.section\.pms-section\{padding-top:64px\}/);
  assert.match(css,/@media\(max-width:767px\)\{\.ds2 \.hero-v3\{padding-bottom:36px\}\.ds2 \.section\.pms-section\{padding-top:48px\}\}/);
});

test('mobile disclosure remains keyboard-operable and Escape closes navigation',()=>{
  assert.match(css,/@media\(max-width:900px\)[\s\S]*?\.nav-disclosure\[open\]>\.nav-submenu/);
  assert.match(css,/\.nav-mega-list\{gap:0\}/);
  assert.match(css,/\.nav-submenu \.nav-submenu \.nav-item a\{min-height:44px;font-size:12px\}/);
  assert.match(js,/event\.key!=='Escape'/);
  assert.match(js,/last\.open=false/);
  assert.match(js,/closeNavigation\(\)/);
});
