// Solves coding challenges through the real UI: two failed runs, "Show solution", run again.
// Usage: node tests/challenge-bot.cjs <baseUrl> <nodeId>...
const { launch, seed, goto, state, click, until, rect } = require('./lib.cjs');
(async () => {
  const [base, ...ids] = process.argv.slice(2);
  const { browser, page, errors } = await launch({ width: 1440, height: 900 });
  await seed(page, base, { __allDone: true, profile: { name: 'Bot', avatar: 'mage', tunic: 'violet', createdAt: 1 } });
  const L = () => state(page, 'Lesson');
  let ok = 0;
  for (const id of ids) {
    await goto(page, base, 'world');
    await goto(page, base, 'lesson/' + id);
    await until(page, async () => (await L())?.key, 15000);
    // skip teach cards
    for (let i = 0; i < 8; i++) {
      const s = await L();
      const ex = await page.evaluate((k) => window.__realmDebug.exercise(k), s.key);
      if (ex.t !== 'teach') break;
      await click(page, 'lesson.continue');
      await until(page, async () => (await L()).key !== s.key, 4000);
    }
    for (let i = 0; i < 2; i++) {
      const before = (await L()).fails;
      await click(page, 'lesson.check');
      await until(page, async () => { const s = await L(); return !s.checking && (s.fails > before || s.status !== 'answer'); }, 40000, 100);
      await page.waitForTimeout(200);
    }
    const shown = await click(page, 'lesson.solution');
    await page.waitForTimeout(900);
    await click(page, 'lesson.check');
    const good = await until(page, async () => (await L()).status === 'right', 40000, 100);
    await page.screenshot({ path: __dirname + '/shots/challenge-' + id + '.png' });
    console.log(`${good ? 'OK ' : 'BAD'} ${id}${shown ? '' : ' (no "Show solution" button)'}`);
    if (good) ok++;
  }
  console.log(`${ok}/${ids.length} challenges solved through the UI. ${errors.length ? 'Page errors: ' + errors.slice(0, 3).join(' | ') : 'No page errors'}`);
  await browser.close();
  process.exit(ok === ids.length ? 0 : 1);
})();
