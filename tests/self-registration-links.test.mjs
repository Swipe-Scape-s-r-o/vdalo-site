import test from 'node:test';
import assert from 'node:assert/strict';
import {renderSeoPage} from '../versions/v1/seo-pages.mjs';
import {renderPage} from '../versions/v1/render.mjs';
import {renderHomepage} from '../versions/v1/homepage.mjs';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import '../versions/v1/public/pricing-core.js';
import {signupHref,loginHref} from '../versions/v1/signup-links.mjs';

test('self-registration links include source UTM tags and login uses the product route',()=>{
  const url=new URL(signupHref('home_hero'));
  assert.equal(url.origin,'https://app.vdalo.tech');
  assert.equal(url.pathname,'/signup');
  assert.equal(url.searchParams.get('utm_source'),'site');
  assert.equal(url.searchParams.get('utm_medium'),'cta');
  assert.equal(url.searchParams.get('utm_campaign'),'self_registration');
  assert.equal(url.searchParams.get('utm_content'),'home_hero');
  assert.equal(loginHref,'https://app.vdalo.tech/app/login');
});

test('site header exposes registration and login on desktop and mobile navigation',()=>{
  const html=renderPage({full:true});
  assert.match(html,/href="https:\/\/app\.vdalo\.tech\/signup\?[^\"]*utm_content=header_desktop/);
  assert.match(html,/href="https:\/\/app\.vdalo\.tech\/app\/login"/);
  assert.match(html,/utm_content=header_mobile/);
  const css=readFileSync(fileURLToPath(new URL('../versions/v1/public/design-system-2.css',import.meta.url)),'utf8');
  assert.ok(css.includes('.ds2 .header-actions>.header-login{display:none}'));
  assert.ok(css.includes('.ds2 .mobile-audit{display:flex!important'));
});

test('homepage hero begins direct self-registration and keeps demo as a separate CTA',()=>{
  const html=renderHomepage({featureVisual:()=>'',night:''});
  const hero=html.match(/<section class="home-hero"[\s\S]*?<\/section>/)?.[0]||'';
  assert.match(hero,/href="https:\/\/app\.vdalo\.tech\/signup\?[^\"]*utm_content=home_hero/);
  assert.match(hero,/Спробувати безкоштовно/);
  assert.match(hero,/href="#demo">Показати демо/);
  assert.doesNotMatch(hero,/data-open="audit"/);
});

test('sign-up page explains direct registration and keeps demo contact separate',()=>{
  const html=renderSeoPage('/sign-up');
  assert.match(html,/<title>Самореєстрація в системі керування готелем VDALO<\/title>/);
  assert.match(html,/Створіть обліковий запис онлайн/);
  assert.match(html,/14 днів тестування без банківської картки/);
  assert.match(html,/href="https:\/\/app\.vdalo\.tech\/app\/login"/);
  assert.match(html,/href="\/contact"/);
  assert.doesNotMatch(html,/не створює обліковий запис автоматично|надішле посилання на реєстрацію PMS/i);
});

test('pricing trial CTA starts self-registration and does not open a lead form',()=>{
  const html=renderSeoPage('/pricing');
  assert.match(html,/href="https:\/\/app\.vdalo\.tech\/signup\?[^\"]*utm_content=pricing_trial/);
  assert.match(html,/Спробувати безкоштовно/);
  assert.doesNotMatch(html,/<button[^>]*data-open="trial"/);
});
