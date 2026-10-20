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
