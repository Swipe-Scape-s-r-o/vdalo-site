import test from 'node:test';
import assert from 'node:assert/strict';
import {renderCalculator,renderVideoLanding} from '../microlandings/top5.mjs';

function assertSingleCampaignRobots(html,route){
 const directives=[...html.matchAll(/<meta\b[^>]*name=["']robots["'][^>]*content=["']([^"']+)["'][^>]*>/gi)].map(match=>match[1]);
 assert.deepEqual(directives,['noindex,nofollow'],`${route} should render one clear noindex directive`);
}

test('all hotel calculators contain exactly one noindex robots directive',async()=>{
 for(let id=1;id<=5;id++)assertSingleCampaignRobots(await renderCalculator(new URLSearchParams(),`/k${id}`),`/k${id}`);
});

test('video campaign route contains exactly one noindex robots directive',async()=>{
 assertSingleCampaignRobots(await renderVideoLanding(new URLSearchParams(),'/53'),'/53');
});

test('campaign CTA does not depend on the non-campaign MP4 variable',async()=>{
 const html=await renderVideoLanding(new URLSearchParams(),'/55');
 assert.match(html,/document\.getElementById\('go-video-name'\)\.value = '' \|\| vdv\.dataset\.scenario;/);
 assert.match(html,/<input type="hidden" name="watched" id="go-watched">/);
 assert.match(html,/document\.getElementById\('go-watched'\)\.value = watched;/);
 assert.doesNotMatch(html,/document\.getElementById\('go-video-name'\)\.value = mp4 \?/);
 assert.match(html,/vdalo-videos-more\.js\?v=8/);
});

test('non-campaign MP4 route retains its selected video name',async()=>{
 const html=await renderVideoLanding(new URLSearchParams(),'/10');
 assert.match(html,/document\.getElementById\('go-video-name'\)\.value = 'p-pricing' \|\| vdv\.dataset\.scenario;/);
});

test('more-videos script does not call the private foot helper from another script',async()=>{
 const {readFile}=await import('node:fs/promises');
 const source=await readFile(new URL('../microlandings/public/top5/vdalo-videos-more.js',import.meta.url),'utf8');
 assert.doesNotMatch(source,/(?<![\w$.])foot\s*\(/);
 assert.match(source,/Кількість дзвінків у сцені наведена для ілюстрації/);
});
