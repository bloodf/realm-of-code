// Plays every Code Farm level through the real UI: loads the level's solution into the
// blocks (Blockly) or the code editor, presses Run, waits for the animation, and expects
// 3 stars. Proves blocks -> JavaScript -> worker -> Phaser replay -> goals all work together.
// Usage: node tests/farm-bot.cjs <baseUrl> [levelId...]
const { launch, seed, goto, state, click, until, rect } = require('./lib.cjs');

(async () => {
  const [base, ...only] = process.argv.slice(2);
  const { browser, page, errors } = await launch({ width: 1300, height: 860 });
  await seed(page, base, { profile: { name: 'Bot', avatar: 'mage', tunic: 'forest', createdAt: 1 }, settings: { hearts: true } });
  const ids = only.length ? only : await page.evaluate(() => window.__realmDebug.farmLevels());
  if (only.length) {
    // playing chosen levels: unlock them by marking every level as done once (1 star)
    const all = await page.evaluate(() => window.__realmDebug.farmLevels());
    await seed(page, base, { profile: { name: 'Bot', avatar: 'mage', tunic: 'forest', createdAt: 1 }, farm: Object.fromEntries(all.map((id) => [id, { stars: 1, size: 99, at: 1 }])) });
  }
  const F = () => state(page, 'FarmLevel');
  const open = async (id) => {
    await goto(page, base, 'farm');
    await goto(page, base, 'farm/' + id);
    await until(page, async () => (await F()) && ((await rect(page, 'farm.start')) || (await rect(page, 'farm.run'))), 20000);
    if (await rect(page, 'farm.start')) { await click(page, 'farm.start'); await page.waitForTimeout(400); }
    // the level is open, its program area and its farm are ready
    await until(page, async () => { const s = await F(); return s && s.id === id && s.phase === 'edit' && s.ready; }, 15000);
  };
  const result = async () => {
    const done = await until(page, async () => { const s = await F(); return s && s.phase === 'done' ? s : null; }, 90000, 200);
    return done ? done.stars : 0;
  };
  let ok = 0;
  const bad = [];

  // 1. Real drag and drop on level 1: drag "move right", "move right", "plant" under "when Run", press Run.
  if (!only.length) {
    await open('f1');
    await page.waitForTimeout(600);
    const start = await page.locator('.blocklyBlockCanvas .blocklyDraggable:has-text("when")').first().boundingBox();
    const drag = async (text, dy) => {
      const bb = await page.locator('.blocklyFlyout .blocklyDraggable').filter({ hasText: text }).first().boundingBox();
      await page.mouse.move(bb.x + 12, bb.y + bb.height / 2);
      await page.mouse.down();
      await page.mouse.move(bb.x + 60, bb.y + bb.height / 2 + 10, { steps: 5 });
      await page.mouse.move(start.x + 14, start.y + start.height + 28 + dy, { steps: 12 });
      await page.waitForTimeout(150);
      await page.mouse.up();
      await page.waitForTimeout(400);
    };
    const hintBefore = await page.locator('.blockly-hint').count();
    await drag('right', 0);
    const hintAfter = await page.locator('.blockly-hint').count();
    await drag('right', 44);
    await drag('plant', 88);
    await page.evaluate(() => window.__farmDebug.setSpeed(8));
    await click(page, 'farm.run');
    const stars = await result();
    if (stars === 3) console.log('OK  drag and drop: 3 blocks dragged from the palette solve level 1');
    else { bad.push(`drag and drop on f1 gave ${stars} stars`); await page.screenshot({ path: __dirname + '/shots/farm-drag.png' }); }
    if (hintBefore === 1 && hintAfter === 0) console.log('OK  the "drag a block" tip shows on an empty program and goes away after the first block');
    else bad.push(`drag tip: before=${hintBefore} after=${hintAfter}`);
  }
  for (const id of ids) {
    await open(id);
    await page.waitForTimeout(300);
    await page.evaluate(() => { window.__farmDebug.setSpeed(8); window.__farmDebug.solve(); });
    await page.waitForTimeout(300);
    await click(page, 'farm.run');
    const stars = await result();
    if (stars === 3) { ok++; console.log('OK ', id); }
    else {
      bad.push(`${id}: stars=${stars}`);
      console.log('BAD', id);
      await page.screenshot({ path: __dirname + '/shots/farm-' + id + '.png' });
    }
  }
  console.log(bad.length ? bad.join('\n') : '');
  console.log(`${ok}/${ids.length} farm levels solved with 3 stars through the UI.`);
  console.log(errors.length ? 'Page errors: ' + errors.slice(0, 5).join(' | ') : 'No page errors');
  await browser.close();
  process.exit(ok === ids.length && !bad.length ? 0 : 1);
})();
