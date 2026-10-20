import assert from 'node:assert/strict';
import '../versions/v1/public/pricing-core.js';
import { renderPricing } from '../versions/v1/pricing.mjs';

const pricing = globalThis.VDALO_PRICING;
const plans = [[1,'start',390],[8,'start',390],[9,'mini',990],[12,'mini',990],[13,'hotel',1490],[20,'hotel',1490],[21,'hotel',1540],[40,'hotel',2490],[41,'hotel-plus',3035],[80,'hotel-plus',4790],[81,'complex',5930],[150,'complex',8000],[151,'enterprise',null]];
for (const [rooms,id,monthly] of plans) {
  const actual=pricing.hotelPlan(rooms);
  assert.equal(actual.id,id,`${rooms} rooms selects ${id}`);
  assert.equal(actual.monthly,monthly,`${rooms} rooms price`);
}
assert.deepEqual(pricing.applyPeriod(1490,'six'),{monthlyEquivalent:1341,total:8046});
assert.deepEqual(pricing.applyPeriod(1490,'year'),{monthlyEquivalent:1118,total:13410});
for (const [units,expected] of [[1,399],[3,399],[4,478],[5,557],[10,952]]) assert.equal(pricing.apartPrice(units),expected,`Apart ${units}`);
const evening=pricing.modulesPrice('hotel',20,['assistant','checkin','access']);
assert.equal(evening.sum,490);
assert.equal(1490+evening.sum,1980);
assert.equal(evening.notes.length,3);
const accounting=pricing.modulesPrice('hotel',20,['prro','finance']);
assert.equal(accounting.sum,390);
assert.ok(accounting.notes.some(note=>/у розробці/.test(note)));
assert.equal(390+pricing.modulesPrice('start',5,['channels']).sum,980);
assert.equal(990+pricing.modulesPrice('mini',10,['prro']).sum,990);
for (const [planId,rooms] of [['hotel',30],['hotel-plus',50],['complex',90]]) {
  const estimate=pricing.modulesPrice(planId,rooms,['rms']);
  assert.equal(estimate.sum,0,`${planId} RMS stays outside the quote while in beta`);
  assert.ok(estimate.notes.some(note=>/бета/.test(note)));
}
const html=renderPricing();
for(const [id,plan] of Object.entries(pricing.plans)) {
  const match=html.match(new RegExp(`data-plan-card="${id}"[^>]*data-base-price="([^"]*)"`));
  assert.ok(match,`pricing card exists for ${id}`);
  assert.equal(match[1],plan.monthly===null?'':String(plan.monthly),`${id} card base price matches PRICING`);
}
for(const module of Object.values(pricing.modules)) assert.ok(html.includes(`${module.price.toLocaleString('uk-UA')} грн / міс`),`${module.label} price is sourced from PRICING`);
console.log('Pricing checks passed: hotel tiers, billing periods, Apart, module bundles, and rendered base prices.');
