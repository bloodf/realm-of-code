// Walks through the game like a brand-new player (mouse and keyboard only) and saves
// screenshots to tests/shots/: title, hero creation, the welcome tour, the Academy,
// a whole first lesson, the help panel, every building, a minigame and a farm field.
// Usage: node tests/screenshots.cjs [baseUrl] (W=390 H=844 for a phone)
const path = require('path');
const fs = require('fs');
const { launch, goto, state, click, until, rect, answerCurrent } = require('./lib.cjs');

(async () => {
  const base = process.argv[2] || 'http://127.0.0.1:5181/';
  const W = +(process.env.W || 1440), H = +(process.env.H || 900);
  const phone = W < 700;
  const dir = path.join(__dirname, 'shots');
  fs.mkdirSync(dir, { recursive: true });
  for (const f of fs.readdirSync(dir)) if (f.startsWith(phone ? 'phone-' : 'pc-')) fs.unlinkSync(path.join(dir, f));
  const out = (n) => path.join(dir, (phone ? 'phone-' : 'pc-') + n + '.png');
  const { browser, page, errors } = await launch({ width: W, height: H, mobile: phone });
  const shot = async (n, wait = 350) => { await page.waitForTimeout(wait); await page.screenshot({ path: out(n) }); };
  const active = () => page.evaluate(() => window.__ui.active());

  await page.goto(base);
  await page.waitForFunction(() => window.__ui);
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.reload();
  await page.waitForFunction(() => window.__ui);
  await until(page, () => rect(page, 'title.start'), 15000);
  await shot('01-title');
  await click(page, 'title.fairy');
  await shot('01b-title-help');
  await click(page, 'help.close');
  await click(page, 'title.start');
  await until(page, () => rect(page, 'create.next'), 8000);
  await click(page, 'create.path.frontend-react');
  await shot('02-create-path');
  await click(page, 'create.next');
  await click(page, 'create.level.new');
  await click(page, 'create.next');
  await click(page, 'create.next');
  await click(page, 'create.style.detail');
  await click(page, 'create.next');
  await page.waitForTimeout(300);
  await page.fill('[data-ui="create.name"]', 'Ada');
  await click(page, 'create.class.mage');
  await shot('03-create-hero');
  await click(page, 'create.next');
  // the welcome tour starts by itself
  await until(page, async () => (await active()).includes('Tour'), 8000);
  for (let i = 1; i <= 12 && (await active()).includes('Tour'); i++) {
    await shot(`04-tour-${String(i).padStart(2, '0')}`, 250);
    await click(page, 'tour.next');
  }
  await shot('05-world');

  // the Academy: first visit, Lumi offers a tour
  await click(page, 'hot.learn');
  await page.waitForTimeout(1200);
  await shot('06-academy-offer');
  if (await rect(page, 'coach.no')) await click(page, 'coach.no');
  await click(page, 'node.current');
  await shot('07-stop-popover');
  await click(page, 'stop.go');
  await until(page, async () => (await state(page, 'Lesson'))?.key, 10000);
  await shot('08-lesson-teach', 600);
  // play the first lesson (the first question wrong on purpose, to see the feedback)
  let wrongDone = false;
  for (let step = 0; step < 60; step++) {
    const s = await state(page, 'Lesson');
    if (!s || s.result) break;
    if (await rect(page, 'coach.no')) { await shot(`09-coach-${step}`); await click(page, 'coach.no'); }
    const ex = s.key ? await page.evaluate((k) => window.__realmDebug.exercise(k), s.key) : null;
    if (step < 14) await shot(`09-step-${String(step).padStart(2, '0')}-${ex ? ex.t : 'x'}`, 200);
    const miss = !wrongDone && ex && ex.t === 'choice';
    if (miss) {
      await require('./lib.cjs').clickLabel(page, 'opt.', ex.options.find((_, i) => i !== ex.answer));
      await click(page, 'lesson.check');
      await page.waitForTimeout(500);
      await shot('09-wrong-feedback');
      await click(page, 'lesson.help');
      await shot('09-help-panel');
      await click(page, 'help.tab.stuck');
      await shot('09-help-stuck');
      await click(page, 'help.close');
      wrongDone = true;
      await click(page, 'lesson.continue');
      await page.waitForTimeout(300);
      continue;
    }
    await answerCurrent(page, true);
  }
  await shot('10-results', 800);
  await click(page, 'results.continue');
  await page.waitForTimeout(1200);
  await shot('11-academy-after');

  for (const p of ['skills', 'practice', 'quests', 'trophies', 'profile', 'paths', 'settings', 'farm', 'help', 'pets', 'battle', 'inbox']) {
    await goto(page, base, p);
    await page.waitForTimeout(900);
    if (await rect(page, 'coach.no')) await click(page, 'coach.no');
    await shot('12-' + p);
  }
  await goto(page, base, 'arcade/bughunt');
  await page.waitForTimeout(900);
  if (await rect(page, 'coach.no')) await click(page, 'coach.no');
  await shot('13-game-intro');
  await click(page, 'game.play');
  await shot('13-game-play', 800);
  await goto(page, base, 'farm/f1');
  await page.waitForTimeout(1500);
  await shot('14-farm-intro');
  await click(page, 'farm.start');
  await page.waitForTimeout(1000);
  await shot('14-farm-offer');
  if (await rect(page, 'coach.yes')) { await click(page, 'coach.yes'); await shot('14-farm-tour'); }

  // v0.7: homestead, a battle, the new minigames, developer mode, time travel, other languages
  const dismiss = async () => { if (await rect(page, 'coach.no')) await click(page, 'coach.no'); };
  await goto(page, base, 'home'); await page.waitForTimeout(1200); await dismiss(); await shot('15-homestead');
  await click(page, 'home.shop'); await shot('15-homestead-market', 700); await click(page, 'shop.close');
  await goto(page, base, 'battle/meadow/slime'); await page.waitForTimeout(1200); await dismiss(); await shot('16-battle-intro');
  await click(page, 'battle.start'); await page.waitForTimeout(500); await click(page, 'act.strike'); await shot('16-battle-strike', 900);
  for (const g of ['gemforge', 'typist']) {
    await goto(page, base, 'arcade/' + g); await page.waitForTimeout(900); await dismiss();
    await click(page, 'game.play'); await shot('17-' + g, 2500);
  }
  await page.evaluate(() => window.__store.setState((st) => ({ dev: { ...st.dev, on: true } })));
  await goto(page, base, 'world'); await page.waitForTimeout(600);
  await click(page, 'dev.open'); await shot('18-dev-panel', 600);
  await click(page, 'dev.tab.time'); await page.waitForTimeout(300);
  await click(page, 'dev.skip.3days'); await shot('19-welcome-back', 1200);
  await goto(page, base, 'world'); await page.waitForTimeout(1500); await shot('19-village-after-3-days');
  for (const lang of ['pt', 'es']) {
    await page.evaluate((l) => window.__store.getState().updateSettings({ lang: l }), lang);
    await page.reload(); await page.waitForFunction(() => window.__ui); await page.waitForTimeout(800);
    for (const r of ['learn', 'pets', 'trophies', 'lesson/web-1-2']) { await goto(page, base, r); await page.waitForTimeout(1200); await dismiss(); await shot(`20-${lang}-${r.replace(/\W/g, '-')}`); }
  }

  console.log(errors.length ? 'Errors:\n' + errors.join('\n') : 'No page errors');
  await browser.close();
  process.exit(errors.length ? 1 : 0);
})();
