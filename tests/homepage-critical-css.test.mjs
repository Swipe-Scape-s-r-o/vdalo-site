import test from 'node:test';
import assert from 'node:assert/strict';
import { assetUrl, homeCssBundle, homeCriticalCss, siteCssBundle } from '../versions/v1/assets.mjs';
import { renderPage } from '../versions/v1/render.mjs';

test('homepage inlines critical header and hero CSS, then loads complete CSS with fallback', () => {
  const homepage = renderPage({ full: true });
  assert.ok(homeCriticalCss.includes(':root{'));
  assert.ok(homeCriticalCss.includes('.hero-v3'));
  assert.ok(homeCriticalCss.includes('@media(max-width:767px)'));
  assert.ok(homepage.includes(`<style>${homeCriticalCss}</style>`));
  assert.ok(homepage.includes(`rel="preload" as="style" href="/home.css?v=${homeCssBundle.version}"`));
  assert.ok(homepage.includes(`<noscript><link rel="stylesheet" href="/home.css?v=${homeCssBundle.version}"></noscript>`));
  assert.ok(homepage.includes('<video class="hero-video"'));
  assert.ok(homepage.includes('preload="none"'));
  assert.ok(homepage.includes(`href="${assetUrl('inter-tight-cyrillic.woff2')}"`));
  assert.ok(homepage.includes(`href="${assetUrl('inter-cyrillic.woff2')}"`));
  assert.ok(!homepage.includes('fonts.googleapis.com'));
  assert.ok(homeCssBundle.css.includes('@font-face{font-family:Inter;'));
  assert.ok(homeCssBundle.css.includes('font-display:swap'));
});

test('non-home routes keep the regular blocking site stylesheet', () => {
  const page = renderPage();
  assert.ok(page.includes(`<link rel="stylesheet" href="/site.css?v=${siteCssBundle.version}" fetchpriority="high">`));
  assert.ok(!page.includes('<style>'));
  assert.ok(!page.includes('href="/home.css'));
});
