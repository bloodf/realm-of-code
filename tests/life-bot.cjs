// Plays the v0.7 systems through the real UI: developer mode, pets (hatch, feed, play), the
// homestead (keyboard walking, buy, plant, water, grow, harvest, an animal), a battle (Strike and
// Spell), being away for 3 days (welcome back, invaders, decay, raven mail), chasing an invader,
// and the comeback lesson that cleans the village.
// Usage: node tests/life-bot.cjs <baseUrl>
const { launch, seed, goto, state, click, until, rect, waitUi, answerCurrent } = require('./lib.cjs');

(async () => {
  const base = process.argv[2] || 'http://127.0.0.1:5181/';
  const { browser, page, errors } = await launch({ width: 1300, height: 900 });
  const bad = [];
  const check = (ok, msg) => { console.log((ok ? 'OK  ' : 'BAD ') + msg); if (!ok) bad.push(msg); };
  const S = () => page.evaluate(() => { const s = window.__store.getState(); return { pets: s.pets, home: s.home, battle: s.battle, stats: s.stats, away: s.away, decay: s.decay, inbox: s.inbox, gold: s.gold, xp: s.xp, ach: Object.keys(s.achievements), done: Object.keys(s.done) }; });
  const active = (k) => page.evaluate((key) => window.__game.scene.isActive(key), k);
  const dev = async (tab, id) => {
    for (let i = 0; i < 3 && !(await active('Debug')); i++) {
      if (i < 2) await page.keyboard.press('Backquote'); else await click(page, 'dev.open');
      await until(page, () => active('Debug'), 2000);
    }
    await click(page, 'dev.tab.' + tab); await page.waitForTimeout(200);
    return click(page, 'dev.' + id);
  };

  // click something that opens a panel (retry if the click landed while another panel was closing)
  const open = async (id, expect) => {
    for (let i = 0; i < 3; i++) {
      await click(page, id, { timeout: 2000 });
      const t0 = Date.now();
      while (Date.now() - t0 < 5000) {
        const ids = await page.evaluate(() => window.__ui.all().filter((e) => e.rect).map((e) => e.id));
        if (ids.some((x) => (expect.endsWith('.') ? x.startsWith(expect) && x !== 'feed.home' : x === expect))) { await page.waitForTimeout(450); return true; }
        await page.waitForTimeout(100);
      }
    }
    return false;
  };

  await seed(page, base, { gold: 3000, dev: { on: true, timeOffset: 0 }, pathId: 'trainee' });

  // ---- developer mode
  await goto(page, base, 'world');
  await page.waitForTimeout(500);
  check(!!(await rect(page, 'dev.open')), 'developer mode shows the DEV button');
  await page.mouse.click(650, 450); await page.waitForTimeout(300);
  let opened = false;
  for (let i = 0; i < 3 && !opened; i++) { await page.keyboard.press('Backquote'); opened = !!(await until(page, () => active('Debug'), 2000)); }
  check(opened, 'the ` key opens the developer panel');
  const xp0 = (await S()).xp;
  await click(page, 'dev.xp100'); await page.waitForTimeout(200);
  check((await S()).xp >= xp0 + 100, 'developer mode gives XP (+100)');
  await click(page, 'dev.close'); await page.waitForTimeout(200);

  // ---- pets: the starter egg is warm after 100 XP
  await goto(page, base, 'pets');
  await page.waitForTimeout(600);
  check((await S()).pets.eggs.length >= 1, 'Lumi gave a starter egg');
  check(await click(page, 'egg.hatch.0'), 'the egg is ready to hatch');
  await page.waitForTimeout(1800);
  await click(page, 'hatch.ok');
  await page.waitForTimeout(300);
  const afterHatch = await S();
  check(afterHatch.pets.list.length === 1, `an egg hatched (${afterHatch.pets.list.map((p) => p.species + (p.shiny ? '*' : '')).join(',')})`);

  // ---- homestead: walk with the keyboard, buy seeds, plant, water, grow, harvest
  await goto(page, base, 'home');
  await page.waitForTimeout(900);
  const p0 = await page.evaluate(() => window.__homeDebug.pos());
  await page.keyboard.down('KeyS'); await page.waitForTimeout(450); await page.keyboard.up('KeyS');
  await page.waitForTimeout(300);
  const p1 = await page.evaluate(() => window.__homeDebug.pos());
  check(p1.y !== p0.y || p1.x !== p0.x, `WASD walks on the homestead (${p0.x},${p0.y} → ${p1.x},${p1.y})`);
  await open('home.shop', 'buy.seed-wheat');
  await click(page, 'buy.seed-wheat'); await page.waitForTimeout(700);
  await click(page, 'buy.seed-carrot'); await page.waitForTimeout(700);
  await open('shop.tab.animals', 'buyanimal.chicken');
  await click(page, 'buyanimal.chicken'); await page.waitForTimeout(700);
  await click(page, 'shop.close'); await page.waitForTimeout(700);
  let st = await S();
  check(st.home.animals.some((a) => a.kind === 'chicken'), 'bought a chicken');
  await open('plot.0', 'plant.wheat'); await click(page, 'plant.wheat'); await page.waitForTimeout(700);
  await open('plot.1', 'plant.carrot'); await click(page, 'plant.carrot'); await page.waitForTimeout(700);
  await open('plot.0', 'plot.water'); await click(page, 'plot.water'); await page.waitForTimeout(700);
  st = await S();
  if (!(st.home.plots[0] && st.home.plots[0].crop === 'wheat')) { console.log(JSON.stringify(st.home.plots.slice(0, 3))); await page.screenshot({ path: __dirname + '/shots/life-plant.png' }); }
  check(st.home.plots[0] && st.home.plots[0].crop === 'wheat' && st.home.plots[0].water > 0, 'planted and watered wheat');
  await dev('home', 'grow'); await page.keyboard.press('Backquote'); await page.waitForTimeout(700);
  if (await active('Debug')) await click(page, 'dev.close');
  await goto(page, base, 'world'); await goto(page, base, 'home'); await page.waitForTimeout(900);
  for (const i of [0, 1]) { await open('plot.' + i, 'plot.harvest'); await click(page, 'plot.harvest'); await page.waitForTimeout(700); }
  st = await S();
  check(st.stats.harvests >= 2 && (st.home.inv.wheat || 0) >= 1, `harvested (${st.stats.harvests} harvests, wheat ${st.home.inv.wheat}, carrot ${st.home.inv.carrot})`);
  const hen = st.home.animals.find((a) => a.kind === 'chicken');
  for (let i = 0; i < 3; i++) {
    if (await open('animal.' + hen.uid, 'animal.feed')) { await click(page, 'animal.feed'); await page.waitForTimeout(700); }
    st = await S();
    if (st.home.animals.find((a) => a.uid === hen.uid).full > hen.full) break;
  }
  check(st.home.animals.find((a) => a.uid === hen.uid).full > hen.full, 'fed the chicken');
  await page.keyboard.press('Escape');

  // ---- pet care
  await goto(page, base, 'pets'); await page.waitForTimeout(600);
  let food;
  for (let i = 0; i < 4 && !(await S()).stats.petsFed; i++) {
    await click(page, 'pet.feed.0'); await page.waitForTimeout(1500);
    food = (await page.evaluate(() => window.__ui.all().filter((e) => e.rect).map((e) => e.id))).find((id) => id.startsWith('feed.') && id !== 'feed.home');
    if (food) { await click(page, food); await page.waitForTimeout(800); }
  }
  await click(page, 'pet.play.0'); await page.waitForTimeout(300);
  st = await S();
  check(st.stats.petsFed >= 1 && st.stats.petPlays >= 1, `fed (${food}) and played with the pet`);

  // ---- a battle: strike with answers, cast a spell by typing
  const fight = async (route) => {
    await goto(page, base, route);
    await page.waitForTimeout(1000);
    await click(page, 'battle.start'); await page.waitForTimeout(400);
    let spells = 0;
    for (let i = 0; i < 120; i++) {
      const b = await state(page, 'Battle');
      if (!b) { await page.waitForTimeout(200); continue; }
      if (b.phase === 'won' || b.phase === 'lost') return { ...b, spells };
      if (b.phase === 'choose') {
        if (spells < 1) { await click(page, 'act.spell'); spells++; } else await click(page, 'act.strike');
        await page.waitForTimeout(300); continue;
      }
      if (b.phase === 'question' && b.right !== null) { await click(page, 'bopt.' + b.right); await page.waitForTimeout(500); continue; }
      if (b.phase === 'typing' && b.word) { await page.fill('[data-ui="spell.input"]', b.word); await page.keyboard.press('Enter'); await page.waitForTimeout(500); continue; }
      await page.waitForTimeout(250);
    }
    return { phase: 'timeout' };
  };
  const won0 = (await S()).stats.battlesWon;
  const r1 = await fight('battle/meadow/slime');
  check(r1.phase === 'won' && r1.spells >= 1, `won a battle with strikes and a spell (${r1.phase})`);
  await click(page, 'battle.continue');
  check((await S()).stats.battlesWon === won0 + 1, 'the win is counted');

  // ---- away for 3 days (developer time travel)
  await goto(page, base, 'world'); await page.waitForTimeout(400);
  await dev('time', 'skip.3days');
  await page.waitForTimeout(800);
  st = await S();
  check(st.away && st.away.days >= 3, `the absence check saw ${st.away && st.away.days} days away`);
  check(await until(page, () => active('W:welcome'), 4000), 'the welcome-back letter opens');
  check(st.battle.invaders.length > 0 && st.decay > 0, `the village changed: ${st.battle.invaders.length} invaders, decay ${st.decay}`);
  check(st.inbox.some((m) => m.kind === 'away'), 'Lumi sent a raven letter');
  const inv = st.battle.invaders[0];
  const r2 = await fight('battle/invader/' + inv.uid);
  check(r2.phase === 'won', 'chased an invader away');
  await click(page, 'battle.continue');
  check(!(await S()).battle.invaders.some((x) => x.uid === inv.uid), 'the invader is gone');

  // ---- the comeback lesson cleans the village
  const next = await page.evaluate(() => window.__realmDebug.nodeIds().find((id) => id === 'web-1-1'));
  await goto(page, base, 'lesson/' + next);
  await until(page, async () => (await state(page, 'Lesson'))?.key, 8000);
  for (let i = 0; i < 40; i++) { const s = await state(page, 'Lesson'); if (!s || s.result) break; await answerCurrent(page, true); }
  await page.waitForTimeout(600);
  st = await S();
  check(st.decay === 0 && st.stats.comebacks >= 1, `a lesson cleaned the village (decay ${st.decay}, comebacks ${st.stats.comebacks})`);
  check(st.ach.length >= 3, `achievements unlocked along the way: ${st.ach.join(', ')}`);

  await goto(page, base, 'inbox'); await page.waitForTimeout(500);
  check(await active('W:inbox'), 'the raven inbox opens');

  console.log(bad.length ? '\n' + bad.length + ' problems' : '\nAll life checks passed.');
  console.log(errors.length ? 'Page errors: ' + errors.slice(0, 5).join(' | ') : 'No page errors');
  await browser.close();
  process.exit(bad.length ? 1 : 0);
})();
