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
// Producer manifest verification: the MP4 is NOT available to this repository.
// These checks pin the 32-second local-only integration contract; they do not test decoding.
const playerSource=fs.readFileSync(path.join(root,'drafts/inside-cell-player.html'),'utf8');
assert.match(playerSource,/proofHash='60f4e4a4427a0695807d84add4cc9d61c23a8306d9c616c6c15d756e35cb4d76'/);
assert.match(playerSource,/Math\.abs\(v\.duration-32\)>\.25/);
assert.match(playerSource,/atSeconds:15/);
assert.match(playerSource,/atSeconds:23\.5/);
assert.match(playerSource,/\$\('returnCheckpoint'\)\.onclick=\(\)=>adapter\?\.returnToFeedback\(\)/);
assert.match(playerSource,/const key='pp-inside-cell-paged-v2-'\+lessonHash\.slice\(0,16\)/);
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
    assert.match(await page.locator('#proofSequence').innerText(),/32-second proof/);
    assert.match(await page.locator('#proofSequence').innerText(),/23–32 s/);
    assert.equal(await page.locator('#video').getAttribute('aria-describedby'),'proofSequence');
    assert.equal(await page.locator('#returnCheckpoint').count(),1,'replay return control exists');
    assert.equal(await page.locator('#returnCheckpoint').isVisible(),false,'return control is hidden before replay');
    assert.match(await page.locator('#mediaStatus').innerText(),/Video not attached/);
    assert.equal(await page.locator('#next').isDisabled(),true,'Teach must require a prediction');
    await page.locator('[data-prediction="released"]').click();
    assert.match(await page.locator('#predictionFeedback').innerText(),/Prediction saved/);
    assert.equal(await page.locator('#next').isEnabled(),true);
    await page.reload();
    assert.equal(await page.locator('[data-prediction="released"]').getAttribute('aria-pressed'),'true');
    assert.match(await page.locator('#predictionFeedback').innerText(),/Prediction saved/);
    assert.equal(await page.locator('#next').isEnabled(),true);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,
      engine+' '+width+': horizontal overflow');
    await page.locator('#next').click();
    assert.match(await page.locator('#progress').innerText(),/Do/);
    assert.match(await page.locator('#predictionRecall').innerText(),/Cargo leaves immediately/);
    // v1.7 regression: original prediction is immutable once investigation starts.
    assert.equal(await page.locator('[data-prediction="enclosed"]').isDisabled(),true,
      'Do must lock the original prediction');
    await page.locator('#back').click();
    assert.match(await page.locator('#progress').innerText(),/Teach/);
    assert.equal(await page.locator('[data-prediction="enclosed"]').isDisabled(),true,
      'Back to Teach must not unlock original prediction');
    assert.equal(await page.locator('[data-prediction="released"]').getAttribute('aria-pressed'),'true');
    await page.reload();
    assert.equal(await page.locator('[data-prediction="enclosed"]').isDisabled(),true,
      'Reload must preserve the original-prediction lock');
    assert.equal(await page.locator('[data-prediction="released"]').getAttribute('aria-pressed'),'true');
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
    assert.match(await page.locator('#predictionCompare').innerText(),/Revising a prediction/);
    assert.equal(await page.locator('#next').isDisabled(),true,
      'Feedback must require evidence-based explanation');
    await page.locator('[data-evidence="approach"]').click();
    assert.match(await page.locator('#evidenceFeedback').innerText(),/Look again/);
    assert.equal(await page.locator('#next').isDisabled(),true,
      'Unsupported explanation must not unlock Next');
    await page.reload();
    assert.match(await page.locator('#progress').innerText(),/Feedback/);
    assert.equal(await page.locator('[data-evidence="approach"]').getAttribute('aria-pressed'),'true');
    assert.match(await page.locator('#evidenceFeedback').innerText(),/Look again/);
    await page.locator('[data-evidence="blocked"]').focus();
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('[data-evidence="blocked"]').getAttribute('aria-pressed'),'true');
    assert.match(await page.locator('#evidenceFeedback').innerText(),/Supported/);
    assert.equal(await page.locator('#next').isDisabled(),true,'Own explanation required before Next');
    await page.locator('[data-revision="released"]').click();
    assert.equal(await page.locator('#next').isDisabled(),true,'Unsupported revised prediction must not complete');
    await page.locator('[data-revision="enclosed"]').click();
    assert.equal(await page.locator('[data-revision="enclosed"]').getAttribute('aria-pressed'),'true');
    // Regression: a correct choice and revision must not turn meaningless writing into completion evidence.
    await page.locator('#explanation').fill('x');
    assert.equal(await page.locator('#next').isDisabled(),true,
      'One-character explanation must never unlock completion');
    assert.match(await page.locator('#explanationStatus').innerText(),/complete explanation/i);
    await page.locator('#explanation').fill('cargo cargo cargo cargo pore pore pore blocked blocked blocked');
    assert.equal(await page.locator('#next').isDisabled(),true,
      'Repeated science keywords without reasoning must not unlock completion');
    await page.reload();
    assert.equal(await page.locator('#next').isDisabled(),true,
      'Invalid explanation must remain blocked after reload');
    await page.locator('#explanation').fill('The blocked vesicle approached but cargo stayed inside. A pore was needed for release.');
    assert.match(await page.locator('#explanationStatus').innerText(),/saved in this browser tab/);
    assert.equal(await page.locator('#next').isEnabled(),true);
    await page.reload();
    assert.equal(await page.locator('[data-revision="enclosed"]').getAttribute('aria-pressed'),'true','Revised prediction persists after reload');
    assert.equal(await page.locator('#explanation').inputValue(),'The blocked vesicle approached but cargo stayed inside. A pore was needed for release.');
    assert.match(await page.locator('#evidenceFeedback').innerText(),/Supported/);
    assert.equal(await page.locator('#next').isEnabled(),true);
    await page.locator('#next').click();
    assert.match(await page.locator('#progress').innerText(),/Next/);
    assert.match(await page.locator('#reflectionSummary').innerText(),/A pore was needed for release/);
    assert.equal(await page.locator('#next').isVisible(),false);
    await page.reload();
    assert.match(await page.locator('#progress').innerText(),/Next/);
    await page.locator('#restart').click();
    assert.match(await page.locator('#progress').innerText(),/Teach/);
    assert.equal(await page.locator('#next').isDisabled(),true,'Restart clears prediction');
    assert.equal(await page.locator('#explanation').inputValue(),'','Restart clears explanation');
    await page.locator('[data-prediction="enclosed"]').focus();
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('[data-prediction="enclosed"]').getAttribute('aria-pressed'),'true');
    assert.equal(await page.locator('#next').isEnabled(),true);
    // A single successful trial cannot bypass the required comparison.
    await page.locator('#next').click();
    await page.locator('#dock').click();
    await page.locator('#fuse').click();
    await page.locator('#release').click();
    assert.equal(await page.locator('#next').isDisabled(),true);
    assert.match(await page.locator('#trialEvidence').innerText(),/Start a new trial/);
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
 console.log('PASS: '+count+' Chromium/WebKit 320px/iPad draft-player scenarios; persistent Teach prediction, evidence-based prediction revision, blocked/permitted fusion comparison, locked progression, reload persistence, wrong-media rejection, evidence explanation, own written reasoning with refresh/restart, keyboard/reload persistence.');
 console.log('NOT TESTED: actual 32-second original MP4 decode/checkpoint playback (asset not transferred), physical iOS, VoiceOver, captions, independent four-pass QA.');
}finally{await new Promise(resolve=>server.close(resolve))}
