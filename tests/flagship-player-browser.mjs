#!/usr/bin/env node
// Development-only student player smoke. Browser emulation is NOT physical iPad or content QA.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium,webkit} from 'playwright';
const root=path.resolve(fileURLToPath(new URL('../',import.meta.url)));
const types={'.html':'text/html; charset=utf-8','.mjs':'text/javascript; charset=utf-8'};
const server=http.createServer((req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const absolute=path.resolve(root,'.'+pathname);
  if(!absolute.startsWith(root+path.sep)){res.writeHead(403).end();return}
  res.writeHead(200,{'Content-Type':types[path.extname(absolute)]||'application/octet-stream','Cache-Control':'no-store'});
  res.end(fs.readFileSync(absolute));
 }catch{res.writeHead(404).end('Not found')}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const address='http://127.0.0.1:'+server.address().port+'/drafts/inside-cell-player.html';
let count=0;
try{
 for(const [engine,launcher] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await launcher.launch(engine==='chromium'?{headless:true,args:['--no-sandbox']}:{headless:true});
  try{
   for(const [width,height] of [[320,640],[820,1180]]){
    const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});
    const page=await context.newPage();
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto(address);
    await page.locator('#next').waitFor();
    assert.match(await page.locator('#progress').innerText(),/Teach/);
    assert.equal(await page.locator('[data-page="0"]').isVisible(),true);
    assert.equal(await page.locator('#video').isVisible(),false);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,
      engine+' '+width+': horizontal overflow');
    await page.locator('#next').click();
    assert.match(await page.locator('#progress').innerText(),/Do/);
    assert.equal(await page.locator('#next').isDisabled(),true);
    // Compare the blocked condition with permitted fusion before progressing.
    await page.locator('#fusionToggle').click();
    assert.equal(await page.locator('#fusionToggle').getAttribute('aria-pressed'),'true');
    await page.locator('#dock').click();
    assert.match(await page.locator('#modelStatus').innerText(),/approaches/);
    assert.equal(await page.locator('#fuse').isDisabled(),true);
    assert.equal(await page.locator('#release').isDisabled(),true);
    await page.locator('#blockedTest').click();
    assert.match(await page.locator('#trialEvidence').innerText(),/Blocked condition observed/);
    await page.reload();
    assert.match(await page.locator('#progress').innerText(),/Do/);
    assert.equal(await page.locator('#fusionToggle').getAttribute('aria-pressed'),'true');
    assert.match(await page.locator('#trialEvidence').innerText(),/Blocked condition observed/);
    await page.locator('#fusionToggle').click();
    assert.equal(await page.locator('#fusionToggle').getAttribute('aria-pressed'),'false');
    await page.locator('#fuse').click();
    assert.match(await page.locator('#modelStatus').innerText(),/pore is open/);
    assert.equal(await page.locator('#fusionToggle').isDisabled(),true);
    await page.locator('#release').click();
    assert.match(await page.locator('#trialEvidence').innerText(),/Both conditions observed/);
    assert.match(await page.locator('#modelStatus').innerText(),/passed through/);
    assert.equal(await page.locator('#next').isEnabled(),true);
    await page.reload();
    assert.match(await page.locator('#progress').innerText(),/Do/);
    assert.match(await page.locator('#modelStatus').innerText(),/passed through/);
    await page.locator('#next').click();
    assert.match(await page.locator('#progress').innerText(),/Feedback/);
    await page.locator('#next').click();
    assert.match(await page.locator('#progress').innerText(),/Next/);
    assert.equal(await page.locator('#next').isVisible(),false);
    await page.reload();
    assert.match(await page.locator('#progress').innerText(),/Next/);
    await page.locator('#restart').click();
    assert.match(await page.locator('#progress').innerText(),/Teach/);
    // A single successful trial cannot bypass the required comparison.
    await page.locator('#next').click();
    await page.locator('#dock').click();
    await page.locator('#fuse').click();
    await page.locator('#release').click();
    assert.equal(await page.locator('#next').isDisabled(),true);
    await page.locator('#reset').click();
    await page.locator('#fusionToggle').click();
    await page.locator('#dock').click();
    await page.locator('#blockedTest').click();
    await page.locator('#fusionToggle').click();
    await page.locator('#fuse').click();
    await page.locator('#release').click();
    assert.equal(await page.locator('#next').isEnabled(),true);
    await page.locator('#back').click();
    assert.match(await page.locator('#progress').innerText(),/Teach/);
    await page.locator('#proof').setInputFiles({name:'not-the-producer-proof.mp4',
      mimeType:'video/mp4',buffer:Buffer.alloc(1024,7)});
    await page.getByText(/Media unavailable: File hash does not match/).waitFor();
    assert.equal(await page.locator('#video').isVisible(),false);
    assert.deepEqual(errors,[],engine+' '+width+' page errors');
    count++;
    await context.close();
   }
  }finally{await browser.close()}
 }
 console.log('PASS: '+count+' Chromium/WebKit 320px/iPad draft-player scenarios; blocked/permitted fusion comparison, locked progression, reload persistence, wrong-media rejection.');
 console.log('NOT TESTED: actual original MP4 decode, physical iOS, VoiceOver, captions, independent four-pass QA.');
}finally{await new Promise(resolve=>server.close(resolve))}
