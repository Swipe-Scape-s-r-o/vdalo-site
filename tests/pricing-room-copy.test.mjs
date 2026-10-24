import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source=readFileSync(new URL('../versions/v1/public/pricing.js',import.meta.url),'utf8');
const label=runInNewContext('('+source.match(/const roomLabel = ([^\n]+);/)[1]+')');
test('room-count wording follows Ukrainian singular, few and plural forms',()=>{
 for(const [count,expected] of [[1,'номер'],[2,'номери'],[4,'номери'],[5,'номерів'],[11,'номерів'],[12,'номерів'],[14,'номерів'],[20,'номерів'],[21,'номер'],[22,'номери'],[25,'номерів'],[101,'номер'],[111,'номерів'],[112,'номерів']])assert.equal(label(count),expected,String(count));
});
