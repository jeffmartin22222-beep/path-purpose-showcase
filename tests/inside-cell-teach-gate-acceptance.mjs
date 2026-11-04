#!/usr/bin/env node
// RED acceptance regression for existing issue #7 v1.3 Teach gate.
// Isolated QA branch; NOT part of release CI until integration fixes the gate.
// Run: node tests/inside-cell-teach-gate-acceptance.mjs
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createServer} from 'node:http';
import {resolve} from 'node:path';
import {chromium, webkit} from 'playwright';

const html=readFileSync(resolve('drafts/inside-cell-player.html'));
const server=createServer((_req,res)=>{
  res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});
  res.end(html);
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const url='http://127.0.0.1:'+server.address().port+'/';
let failures=0;
try {
  for (const [name,engine] of [['Chromium',chromium],['WebKit',webkit]]) {
    const browser=await engine.launch({headless:true,...(name==='Chromium'?{args:['--no-sandbox']}:{})});
    try {
      const context=await browser.newContext({viewport:{width:390,height:844}});
      const page=await context.newPage();
      await page.goto(url);
      await page.locator('[data-prediction="enclosed"]').click();
      assert.equal(await page.locator('#mediaStatus').innerText(),'Video not attached. Media acceptance blocked.');
      // The currently available local text description is explicitly unapproved;
      // no original narrated/captioned media, approved equivalent route, or
      // completed checkpoint exists. A prediction alone must NOT unlock Do.
      const enabled=await page.locator('#next').isEnabled();
      if(enabled){
        failures++;
        console.error('FAIL '+name+': Teach Next enabled with prediction alone, no approved instruction/checkpoint.');
      }else{
        console.log('PASS '+name+': Teach Next remains gated before approved instruction and checkpoint.');
      }
      // An explicitly offered skip path must not bypass the same instructional gate.
      await page.locator('#skipUnavailableVideo').click();
      const skipEnabled=await page.locator('#next').isEnabled();
      if(skipEnabled){
        failures++;
        console.error('FAIL '+name+': skipping unavailable media unlocks Teach Next without approved equivalent instruction/checkpoint.');
      }else{
        console.log('PASS '+name+': skipping unavailable media does not unlock Teach Next.');
      }
      // Do not mistake a disabled button for enforced routing: attempt navigation.
      await page.locator('#next').evaluate(button=>button.click());
      const visiblePage=await page.locator('section.step:not([hidden])').getAttribute('data-page');
      if(visiblePage!=='0'){
        failures++;
        console.error('FAIL '+name+': programmatic Next click escaped Teach to page '+visiblePage+'.');
      }else{
        console.log('PASS '+name+': Teach remains active after attempted Next.');
      }
      await context.close();
    }finally{await browser.close()}
  }
}finally{await new Promise(ok=>server.close(ok))}
assert.equal(failures,0,'Teach evidence gate regression: '+failures+' browser engines failed');
