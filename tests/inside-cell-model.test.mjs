import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const html=fs.readFileSync(fileURLToPath(new URL('../index.html',import.meta.url)),'utf8');
const start=html.indexOf('function validControlValue(');
const end=html.indexOf('function saveDraft(',start);
assert.ok(start>0&&end>start,'model must be present in actual prototype');
const cellModel=vm.runInNewContext(html.slice(start,end)+';cellModel');
test('actual prototype model is deterministic and responds to three independent controls',()=>{
  assert.equal(cellModel(100,100,100),80);
  assert.equal(cellModel(30,100,100),24);
  assert.equal(cellModel(30,50,50),6);
  assert.equal(cellModel(30,50,50),6);
  for(const axis of [0,1,2]){
    const args=[100,100,100];args[axis]=0;
    assert.equal(cellModel(...args),0,'Each constraint can independently limit aerobic index');
  }
});
test('conceptual model is bounded and monotone in every variable',()=>{
  for(let o=0;o<=100;o+=10)for(let g=0;g<=100;g+=10)for(let m=0;m<=100;m+=10){
    const result=cellModel(o,g,m);
    assert.ok(Number.isInteger(result)&&result>=0&&result<=80);
    if(o<100)assert.ok(cellModel(o+10,g,m)>=result);
    if(g<100)assert.ok(cellModel(o,g+10,m)>=result);
    if(m<100)assert.ok(cellModel(o,g,m+10)>=result);
  }
});
test('malformed or out-of-range input cannot be used to fake model evidence',()=>{
  for(const bad of [-10,101,55,NaN,Infinity,'100',null]){
    assert.throws(()=>cellModel(bad,100,100),/Invalid model input/);
  }
});
test('controls are labeled, prototype limitations explicit and draft storage tab-scoped',()=>{
  for(const id of ['oxygen','glucose','mitoCapacity']){
    assert.match(html,new RegExp('<label for="'+id+'">'));
    assert.match(html,new RegExp('<input id="'+id+'" type="range"'));
  }
  assert.match(html,/not measured data, actual ATP quantities/);
  assert.match(html,/sessionStorage\.setItem/);
  assert.match(html,/sessionStorage\.getItem/);
  assert.match(html,/not in an LMS/);
});
