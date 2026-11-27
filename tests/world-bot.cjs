// Checks the village: walking with the keyboard, the "Enter" prompt at a door, opening a
// building window with Enter, closing it with Escape, walking to a building by clicking it,
// the travel bar, and the first-visit welcome tour.
// Usage: node tests/world-bot.cjs <baseUrl>
const { launch, seed, goto, state, click, rect, until, list } = require('./lib.cjs');

(async () => {
  const [base] = process.argv.slice(2);
  const { browser, page, errors } = await launch({ width: 1300, height: 860 });
  const results = [];
  const check = (name, ok) => { results.push(!!ok); console.log(`${ok ? 'OK ' : 'BAD'} ${name}`); };
  const scene = () => page.evaluate(() => window.__ui.scene());
  const active = () => page.evaluate(() => window.__ui.active());

  await seed(page, base, { pathId: 'frontend-react' });
  await page.evaluate(() => sessionStorage.setItem('roc-world-pos', JSON.stringify({ x: 23, y: 14 })));
  await page.reload();
  await page.waitForFunction(() => window.__ui);
  await goto(page, base, 'world');
  await page.waitForFunction(() => window.__worldDebug && window.__worldDebug.pos(), null, { timeout: 20000 });
  check('hero starts on the plaza', JSON.stringify(await page.evaluate(() => window.__worldDebug.pos())) === '{"x":23,"y":14}');

  // walk to the Academy door with the arrow keys: up, up, up, left, up
  await page.waitForTimeout(600);
  for (const k of ['ArrowUp', 'ArrowUp', 'ArrowUp', 'ArrowLeft', 'ArrowUp']) {
    await page.keyboard.down(k); await page.waitForTimeout(120); await page.keyboard.up(k); await page.waitForTimeout(260);
  }
  const pos = await page.evaluate(() => window.__worldDebug.pos());
  check(`arrow keys move the hero to the Academy door (${pos.x},${pos.y})`, pos.x === 22 && pos.y === 10);
  await until(page, () => rect(page, 'hud.enter'), 3000);
  const prompt = (await list(page)).find((e) => e.id === 'hud.enter');
  check('the enter prompt appears at the door', prompt && /academy/i.test(prompt.label));
  await page.keyboard.press('Enter');
  await page.waitForTimeout(900);
  check('Enter opens the Academy window', page.url().endsWith('#/learn') && (await active()).includes('W:learn'));
  await page.keyboard.press('Escape');
  await page.waitForTimeout(700);
  check('Escape closes the window', page.url().endsWith('#/world') && !(await active()).includes('W:learn'));

  // click a building: the hero walks there and goes in
  await click(page, 'place.farm');
  await page.waitForFunction(() => location.hash === '#/farm', null, { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(500);
  check('clicking the barn walks there and opens Greenhollow Farm', page.url().endsWith('#/farm') && (await active()).includes('W:farm'));

  // travel bar
  await click(page, 'hot.practice');
  await page.waitForTimeout(700);
  check('the travel bar opens the Tavern', page.url().endsWith('#/practice') && (await active()).includes('W:practice'));
  await click(page, 'window.close');
  await page.waitForTimeout(600);
  check('the close button goes back to the village', (await scene()) === 'World');

  // help: Lumi's panel, then the welcome tour from it
  await click(page, 'hud.help');
  await page.waitForTimeout(500);
  check("Lumi's help button opens the help panel", (await active()).includes('HelpPanel'));
  await click(page, 'help.tab.faq');
  await page.waitForTimeout(300);
  check('the help panel has questions for this screen', !!(await rect(page, 'faq.start')));
  await click(page, 'help.tab.about');
  await page.waitForTimeout(300);
  await click(page, 'help.tour');
  await page.waitForTimeout(600);
  const t1 = await state(page, 'Tour');
  check(`"Show me step by step" starts the village tour (${t1 && t1.step}/${t1 && t1.of})`, t1 && t1.screen === 'World' && t1.step === 1);
  let steps = 1;
  for (let i = 0; i < 20 && (await active()).includes('Tour'); i++) { await click(page, 'tour.next'); await page.waitForTimeout(250); steps++; }
  check(`the tour can be followed to the end (${steps - 1} steps) and closes`, !(await active()).includes('Tour') && (await active()).includes('World'));

  // a brand-new player gets the welcome tour by itself
  await seed(page, base, { pathId: 'frontend-react', settings: { tips: true }, tours: {} });
  await goto(page, base, 'world');
  const auto = await until(page, async () => (await state(page, 'Tour')) && (await active()).includes('Tour'), 6000);
  check('a new player gets the welcome tour automatically', auto);
  await click(page, 'tour.skip');
  await page.waitForTimeout(400);
  const toured = await page.evaluate(() => !!window.__store.getState().tours.World);
  check('skipping the tour remembers it', toured && !(await active()).includes('Tour'));

  const ok = results.filter(Boolean).length;
  console.log(`\n${ok}/${results.length} village checks passed.`);
  console.log(errors.length ? 'Page errors: ' + errors.slice(0, 5).join(' | ') : 'No page errors');
  await browser.close();
  process.exit(ok === results.length ? 0 : 1);
})();
