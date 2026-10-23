import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import {renderRobotFunnel,robotFunnelRoutes} from '../microlandings/robot-funnels.mjs';

const config=html=>JSON.parse(html.match(/id="funnel-config">([\s\S]*?)<\/script>/)[1]);
test('all thirteen pages have complete lower sections, labelled regions and private accessible forms',async()=>{
 for(const [slug,code] of robotFunnelRoutes){
  const html=await renderRobotFunnel(code,new URLSearchParams());
  assert.equal((html.match(/<h1\b/g)||[]).length,1,slug);
  for(const section of ['hero-copy','benefit-grid','class="steps"','faq-section','closing-action','funnel-footer'])assert.ok(html.includes(section),`${slug}: ${section}`);
  assert.match(html,/name="website"[^>]*aria-hidden="true"/);
  assert.match(html,/id="lead-form"[^>]*data-clarity-mask="true"/);
  assert.doesNotMatch(html,/безкоштовне налаштування|налаштування безкоштовно/i);
  assert.equal((html.match(/data-open>/g)||[]).length,2);
 }
});
test('q3 collects automation inquiries without a calculator or calculation payload',async()=>{
 const html=await renderRobotFunnel('q3',new URLSearchParams()),cfg=config(html);
 assert.equal(cfg.funnel,'tourist_tax');
 assert.equal(cfg.format,'video');
 assert.equal(cfg.videos.length,0);
 assert.equal(cfg.taxPlaces.length,0);
 assert.match(html,/Після підключення вашого об’єкта до VDALO/);
 assert.match(html,/Автоматизуйте туристичний збір/);
 assert.match(html,/class="automation-flow"/);
 assert.doesNotMatch(html,/id="tax-|class="media calc"|Порахувати|Порахуйте збір/);
 assert.match(html,/name="hotel"/);
 assert.match(html,/name="email"/);
});
test('question pages have a readable illustrative calendar and bot pages distinguish guest AI',async()=>{
 for(const code of ['q6','q9']){
  const html=await renderRobotFunnel(code,new URLSearchParams());
  assert.match(html,/<table class="calendar-table">/);
  assert.match(html,/Дані вигадані/);
  assert.doesNotMatch(html,/class="calendar-demo"/);
 }
 for(const code of ['q4','q4b','q5'])assert.match(await renderRobotFunnel(code,new URLSearchParams()),/окремою можливістю у розробці/);
 assert.match(await renderRobotFunnel('q10',new URLSearchParams()),/Ключ або інший спосіб доступу ваш об’єкт організовує заздалегідь/);
});
test('commission client validates each field, accepts decimal money and emits a completed calculation only on demand',async()=>{
 const source=await readFile(new URL('../microlandings/public/robot-funnels.js',import.meta.url),'utf8');
 const client=source.slice(source.indexOf(' const commissionInputs='),source.indexOf('let submitting=false'));
 const values=['20','3000','15','12'],ids=['#commission-count','#commission-average','#commission-rate','#commission-months'];
 const fields=Object.fromEntries(ids.map((id,index)=>[id,{value:values[index],setAttribute(){},addEventListener(type,fn){this[type]=fn;},checkValidity(){const value=Number(this.value);return value>=0&&(index===0||index===3?Number.isInteger(value):true)&&(index!==2||value<=100)&&(index!==3||value>=1&&value<=12);}}]));
 const result={textContent:'',innerHTML:''},button={addEventListener(type,fn){this[type]=fn;}},answers={},events=[];
 runInNewContext(client,{$:id=>id==='#commission-result'?result:id==='#commission-calc'?button:fields[id],cfg:{code:'q7'},answers,fmt:value=>String(value),send:(...args)=>events.push(args)});
 assert.equal(answers.calculator.annual_commission_uah,108000);
 assert.equal(events.length,0);
 fields[ids[0]].change();assert.equal(events[0][0],'calc_result');
 for(const [index,value] of [[0,'10'],[1,'1000'],[2,'10'],[3,'6']])fields[ids[index]].value=value;
 fields[ids[0]].input();assert.equal(answers.calculator.annual_commission_uah,6000);
 fields[ids[0]].value='1.5';fields[ids[0]].input();
 assert.match(result.textContent,/цілим числом/);assert.equal(answers.calculator,undefined);
 const count=events.length;fields[ids[0]].change();assert.equal(events.length,count);
 fields[ids[0]].value='0';fields[ids[0]].input();assert.equal(answers.calculator.annual_commission_uah,0);
 fields[ids[2]].value='15.5';fields[ids[2]].input();assert.ok(answers.calculator);
});

test('GA4 bridge forwards named anonymous events without contact fields or free answers',async()=>{
 const source=await readFile(new URL('../microlandings/public/robot-funnels.js',import.meta.url),'utf8');
 const prefix=source.slice(source.indexOf(' const cfg='),source.indexOf(' const answers='));
 const dataLayer=[],window={dataLayer,dispatchEvent(){}},cfg={code:'q3',funnel:'tourist_tax',format:'video'};
 runInNewContext(prefix+"send('cta_click',{place:'hero',email:'qa@example.invalid',phone:'+380501234567',hotel:'Private object',answers:'Free text',t:'private-token'});",{window,document:{title:'VDALO',getElementById:()=>({textContent:JSON.stringify(cfg)})},location:{hostname:'staging.vdalo.tech',pathname:'/q3',search:''},URLSearchParams,CustomEvent:class{constructor(name,options){this.name=name;this.detail=options.detail;}}});
 const events=dataLayer.filter(value=>value[0]==='event');
 assert.equal(events.length,2);
 assert.equal(events[1][1],'cta_click');
 assert.equal(events[1][2].place,'hero');
 assert.equal(events[1][2].debug_mode,true);
 assert.equal(events[1][2].send_to,'G-ST38L6GRRM');
 for(const key of ['email','phone','hotel','answers','t'])assert.equal(key in events[1][2],false,key);
});
