// Opens lessons (or single exercises: "<node>/<index>") with everything unlocked and screenshots them.
// Usage: node tests/open-lesson.cjs <baseUrl> <nodeId> [<nodeId>...]   ("+run" after an id presses Run first)
const { launch, seed, goto, state, click, until } = require('./lib.cjs');
const path = require('path');
(async () => {
  const [base, ...ids] = process.argv.slice(2);
  const { browser, page, errors } = await launch({ width: +(process.env.W || 1440), height: +(process.env.H || 900) });
  await seed(page, base, { __allDone: true, settings: { sageNotes: true } });
  const L = () => state(page, 'Lesson');
  for (const raw of ids) {
    const [id, action] = raw.split('+');
    await goto(page, base, 'world');
    await goto(page, base, id.includes('/') ? 'dev/ex/' + id : 'lesson/' + id);
    await until(page, async () => (await L())?.key, 15000);
    for (let i = 0; i < 6; i++) {
      const s = await L();
      const ex = await page.evaluate((k) => window.__realmDebug.exercise(k), s.key);
      if (ex.t !== 'teach') break;
      await click(page, 'lesson.continue');
      await until(page, async () => (await L()).key !== s.key, 4000);
    }
    if (action === 'run') { await click(page, 'lesson.check'); await page.waitForTimeout(3000); }
    await page.waitForTimeout(600);
    const file = path.join(__dirname, 'shots', `lesson-${id.replace(/\//g, '_')}${action ? '-' + action : ''}.png`);
    await page.screenshot({ path: file });
    console.log(file);
  }
  console.log(errors.length ? errors : 'no page errors');
  await browser.close();
})();
