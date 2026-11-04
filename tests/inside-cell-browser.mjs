// Real Chromium acceptance for the unapproved Inside the Cell draft.
// Run: npm install --no-save playwright && npx playwright install chromium
// Then serve repository root on localhost:8765 and run node tests/inside-cell-browser.mjs
import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const browser = await chromium.launch({headless:true});
let passed=0;
try {
  for (const viewport of [{width:320,height:640},{width:768,height:1024}]) {
    const context=await browser.newContext({viewport,deviceScaleFactor:2,hasTouch:true});
    const page=await context.newPage();
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto('http://127.0.0.1:8765/drafts/inside-cell-player.html');
    await page.locator('[data-prediction="enclosed"]').click();
    assert.equal(await page.locator('#next').isDisabled(),true,'Video gate must require explicit draft bypass');
    await page.reload();
    assert.equal(await page.locator('#next').isDisabled(),true,'Reload must not silently authorize a video bypass');
    await page.locator('#skipUnavailableVideo').click();
    await page.locator('#back').click();
    await page.reload();
    assert.equal(await page.locator('#next').isDisabled(),false,'Explicit draft bypass persists after reload');
    assert.equal(await page.locator('#next').isDisabled(),false,'Explicit draft bypass unlocks Next');
    await page.locator('#next').click();
    assert.equal(await page.locator('[data-page="1"]').isVisible(),true,'Do screen appears');
    const footer=await page.locator('footer').boundingBox();
    const next=await page.locator('#next').boundingBox();
    assert(footer && next && next.y>=0 && next.y+next.height<=viewport.height,
      'Next stays inside viewport at '+viewport.width);
    assert.equal(await page.locator('#fuse').isDisabled(),true,'Pore cannot open before blocked trial');
    await page.locator('#fusionToggle').click();
    await page.locator('#dock').click();
    await page.locator('#blockedTest').click();
    assert.match(await page.locator('#blockedCargoResult').innerText(),/enclosed/i);
    assert.equal(await page.locator('#fuse').isDisabled(),true,'Blocked condition cannot open pore');
    await page.locator('#permittedTrial').click();
    await page.locator('#dock').click();
    await page.locator('#fuse').click();
    await page.locator('#release').click();
    assert.match(await page.locator('#permittedCargoResult').innerText(),/released/i);
    assert.equal(await page.locator('#next').isDisabled(),false,'Both trials unlock feedback');
    await page.locator('#next').click();
    assert.equal(await page.locator('[data-page="2"]').isVisible(),true);
    assert.match(await page.locator('#predictionCompare').innerText(),/cargo stays/i);
    // A new investigation must not inherit a revised prediction or evidence answer.
    await page.locator('[data-revision="enclosed"]').click();
    await page.locator('[data-evidence="blocked"]').click();
    await page.locator('#retry').click();
    assert.equal(await page.locator('[data-page="1"]').isVisible(),true,'Retry returns to Do');
    await page.locator('#fusionToggle').click();
    await page.locator('#dock').click();
    await page.locator('#blockedTest').click();
    await page.locator('#permittedTrial').click();
    await page.locator('#dock').click();
    await page.locator('#fuse').click();
    await page.locator('#release').click();
    await page.locator('#next').click();
    assert.equal(await page.locator('[data-revision="enclosed"]').getAttribute('aria-pressed'),'false','Retry clears prior revised prediction');
    assert.equal(await page.locator('[data-evidence="blocked"]').getAttribute('aria-pressed'),'false','Retry clears previous evidence choice');
    assert.equal(await page.locator('#next').isDisabled(),true,'Retry requires new feedback evidence');
    // Complete the entire four-page journey, not merely the experiment setup.
    await page.locator('[data-revision="enclosed"]').click();
    await page.locator('[data-evidence="blocked"]').click();
    await page.locator('#explanation').fill('When fusion was blocked, protein cargo stayed enclosed inside the vesicle even after approach. When fusion was permitted, the pore opened and protein cargo exited outside the cell.');
    assert.equal(await page.locator('#next').isDisabled(),false,'Causal two-condition explanation unlocks completion');
    await page.locator('#next').click();
    assert.equal(await page.locator('[data-page="3"]').isVisible(),true,'Completion screen is reachable');
    assert.match(await page.locator('#reflectionSummary').innerText(),/protein cargo exited/i,'Completion preserves written evidence');
    await page.reload();
    assert.equal(await page.locator('[data-page="3"]').isVisible(),true,'Completion persists after reload');
    // The actual phone Home Screen must link into the draft player without claiming enrollment.
    await page.goto('http://127.0.0.1:8765/');
    assert.equal(await page.locator('#draft-home-start').getAttribute('href'),'drafts/inside-cell-player.html','Home Screen opens the real draft player');
    assert.match(await page.locator('#draft-home-start').innerText(),/Review completed draft/,'Home Screen reflects saved draft completion');
    assert.match(await page.locator('#draft-home-progress').innerText(),/not an LMS completion/i,'Draft status never claims an LMS completion');
    await page.locator('#draft-home-start').click();
    assert.equal(await page.locator('[data-page="3"]').isVisible(),true,'Home Screen returns to saved completed draft');
    assert.match(await page.locator('#recapPrediction').innerText(),/Original prediction: Cargo stays inside/i,'Completion preserves original prediction');
    // A corrupted or stale completed record with weak evidence must return to Feedback.
    await page.evaluate(() => {
      const key=Object.keys(sessionStorage).find(k=>k.startsWith('pp-inside-cell-paged-v2-'));
      assertKey(key);
      const saved=JSON.parse(sessionStorage.getItem(key));
      saved.explanation='cargo';
      sessionStorage.setItem(key,JSON.stringify(saved));
      function assertKey(value){if(!value)throw new Error('Missing draft progress key')}
    });
    await page.reload();
    assert.equal(await page.locator('[data-page="2"]').isVisible(),true,'Invalid saved explanation must not restore completion');
    await page.locator('#explanation').fill('When fusion was blocked, protein cargo stayed enclosed inside the vesicle even after approach. When fusion was permitted, the pore opened and protein cargo exited outside the cell.');
    await page.locator('#next').click();
    assert.equal(await page.locator('[data-page="3"]').isVisible(),true,'Corrected evidence restores completion');
    await page.locator('#back').click();
    await page.locator('#back').click();
    // Restarting trials must never let students rewrite the original prediction.
    await page.locator('#back').click();
    await page.locator('#reset').click();
    await page.locator('#back').click();
    assert.equal(await page.locator('[data-prediction="enclosed"]').getAttribute('aria-pressed'),'true','Original prediction survives trial restart');
    assert.equal(await page.locator('[data-prediction="released"]').isDisabled(),true,'Original prediction cannot be rewritten after restart');
    await page.reload();
    assert.equal(await page.locator('[data-prediction="released"]').isDisabled(),true,'Original prediction remains immutable after reload');
    assert.deepEqual(errors,[],'No uncaught browser errors');
    passed++;
    await context.close();
  }
  console.log('PASS: '+passed+' Chromium viewport journeys (320px phone, 768px tablet)');
} finally {await browser.close();}
