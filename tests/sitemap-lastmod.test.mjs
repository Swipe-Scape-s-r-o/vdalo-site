import test from 'node:test';
import assert from 'node:assert/strict';
import {serializeSitemapXml} from '../versions/v1/sitemap.mjs';

test('sitemap emits lastmod only for valid, supplied page update dates',()=>{
  const xml=serializeSitemapXml(
    ['/blog/pms','/cases/migration','/tourist-tax/lutsk/','/pricing'],
    new Map([
      ['/blog/pms','2026-10-15'],
      ['/cases/migration','2026-10-15'],
      ['/tourist-tax/lutsk/','2026-10-18'],
      ['/pricing','2026-02-30'],
    ]),
  );
  assert.match(xml,/<loc>https:\/\/www\.vdalo\.tech\/blog\/pms<\/loc><lastmod>2026-10-15<\/lastmod>/);
  assert.match(xml,/<loc>https:\/\/www\.vdalo\.tech\/cases\/migration<\/loc><lastmod>2026-10-15<\/lastmod>/);
  assert.match(xml,/<loc>https:\/\/www\.vdalo\.tech\/tourist-tax\/lutsk\/<\/loc><lastmod>2026-10-18<\/lastmod>/);
  assert.match(xml,/<loc>https:\/\/www\.vdalo\.tech\/pricing<\/loc><\/url>/);
});
