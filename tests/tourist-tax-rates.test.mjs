import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

test('rates register filters by text, region, year, tourism category and verification status',async()=>{
  const listeners={};
  const form={addEventListener(type,callback){listeners[type]=callback;}};
  const rows=[
    {dataset:{search:'львів львівська область львівська міська тг ua46060250000025047',region:'Львівська',year:'2026',domestic:'true',inbound:'true',status:'verified'},hidden:false},
    {dataset:{search:'одеса одеська область одеська міська тг ua51100000000020600',region:'Одеська',year:'2026',domestic:'false',inbound:'false',status:'review'},hidden:false},
  ];
  const body={querySelectorAll(){return rows;}};
  const fields={
    'tt-rates-filters':form,
    'tt-rates-results':{textContent:''},
    'tt-rates-empty':{hidden:true},
    'tt-rates-query':{value:''},
    'tt-rates-region':{value:''},
    'tt-rates-year':{value:'2026'},
    'tt-rates-tourism':{value:''},
    'tt-rates-status':{value:''},
  };
  const document={getElementById(id){return fields[id]||null;},querySelector(selector){return selector==='.tt-rates-table tbody'?body:null;}};
  const source=await readFile(new URL('../versions/v1/public/tourist-tax-rates.js',import.meta.url),'utf8');
  vm.runInNewContext(source,{document,requestAnimationFrame(callback){callback();}});
  const update=()=>listeners.input({preventDefault(){}});

  fields['tt-rates-status'].value='review'; update();
  assert.deepEqual(rows.map(row=>row.hidden),[true,false]);
  assert.equal(fields['tt-rates-results'].textContent,'Показано 1 з 2 локацій.');

  fields['tt-rates-status'].value='';
  fields['tt-rates-region'].value='Львівська'; update();
  assert.deepEqual(rows.map(row=>row.hidden),[false,true]);

  fields['tt-rates-region'].value='';
  fields['tt-rates-tourism'].value='inbound'; update();
  assert.deepEqual(rows.map(row=>row.hidden),[false,true]);

  fields['tt-rates-tourism'].value='';
  fields['tt-rates-query'].value='ОДЕСА'; update();
  assert.deepEqual(rows.map(row=>row.hidden),[true,false]);

  fields['tt-rates-query'].value='';
  fields['tt-rates-year'].value='2027'; update();
  assert.deepEqual(rows.map(row=>row.hidden),[true,true]);
  assert.equal(fields['tt-rates-empty'].hidden,false);
});
