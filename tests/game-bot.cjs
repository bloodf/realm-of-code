// Plays every minigame to the end through the real game UI with perfect answers, and checks
// the results show 3 stars. Then plays one minigame stop on the path and checks that it
// fills the satchel (lightbulbs, torch, potion).
// Usage: node tests/game-bot.cjs <baseUrl> [game...]
const { launch, seed, goto, state, click, clickLabel, until, rect } = require('./lib.cjs');

const ALL = ['link', 'memory', 'torchrun', 'bughunt', 'archery', 'archive', 'loop', 'gemforge', 'typist'];

// a swap that makes a line of three (same rule as the game)
function findMove(b) {
  const N = b.length;
  const lines = (c) => { for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const v = c[y][x]; if (v < 0) continue; if (x + 2 < N && c[y][x + 1] === v && c[y][x + 2] === v) return true; if (y + 2 < N && c[y + 1][x] === v && c[y + 2][x] === v) return true; } return false; };
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) for (const [dx, dy] of [[1, 0], [0, 1]]) {
    const nx = x + dx, ny = y + dy;
    if (nx >= N || ny >= N) continue;
    const c = b.map((r) => r.slice());
    [c[y][x], c[ny][nx]] = [c[ny][nx], c[y][x]];
    if (lines(c)) return [x, y, nx, ny];
  }
  return null;
}

async function play(page, game) {
  const M = () => state(page, 'Minigame');
  const reg = (k) => page.evaluate((key) => window.__ui.registry(key), k);
  if (!(await click(page, 'game.play'))) throw new Error('no Play button');
  await until(page, async () => (await M()).phase === 'play', 4000);
  for (let step = 0; step < (['gemforge', 'typist'].includes(game) ? 3000 : 600); step++) {
    const s = await M();
    if (process.env.DEBUG && step % 25 === 0) console.log('  step', step, s.phase, JSON.stringify({ score: s.gs.score, typed: s.gs.typed, quiz: !!s.gs.quiz, busy: s.gs.busy, qn: s.gs.qn, tl: s.gs.timeLeft, on: s.gs.timerOn }));
    if (s.phase === 'done') return true;
    const gs = s.gs;
    // a "Next" button after each round
    if (await rect(page, 'game.next')) {
      if (['archive', 'loop', 'bughunt'].includes(game) && gs.checked === false) throw new Error(game + ': the right answer was marked wrong');
      await click(page, 'game.next'); await page.waitForTimeout(150); continue;
    }
    switch (game) {
      case 'link': {
        const cur = gs.rounds[gs.round] || [];
        if (!gs.order) { await page.waitForTimeout(150); break; }
        const id = gs.order.l.find((i) => gs.links[i] === undefined);
        if (id === undefined) { await page.waitForTimeout(200); break; }
        await clickLabel(page, 'rune.l.', cur[id].a);
        await clickLabel(page, 'rune.r.', cur[id].b);
        await page.waitForTimeout(150);
        break;
      }
      case 'memory': {
        if (gs.open && gs.open.length === 1 && gs.cards) {
          // one card is open: click its partner
          const pid = gs.cards[gs.open[0]].pid;
          const other = gs.cards.findIndex((c, i) => c.pid === pid && i !== gs.open[0]);
          await click(page, 'mem.' + other); await page.waitForTimeout(700);
          break;
        }
        const next = gs.cards && gs.cards.find((c) => !gs.found.includes(c.pid));
        if (!next || gs.open.length) { await page.waitForTimeout(250); break; }
        const pid = next.pid;
        const idx = gs.cards.map((c, i) => (c.pid === pid ? i : -1)).filter((i) => i >= 0);
        await click(page, 'mem.' + idx[0]); await page.waitForTimeout(80);
        await click(page, 'mem.' + idx[1]); await page.waitForTimeout(700);
        break;
      }
      case 'torchrun': {
        const ri = await reg('torchrun:right');
        if (gs.picked !== null && gs.picked !== undefined) { await page.waitForTimeout(200); break; }
        if (ri === undefined || !(await rect(page, 'gopt.' + ri))) { await page.waitForTimeout(150); break; }
        await click(page, 'gopt.' + ri); await page.waitForTimeout(900);
        break;
      }
      case 'bughunt': {
        const line = await reg('bughunt:line');
        if (await rect(page, 'bug.' + line)) { await click(page, 'bug.' + line); await page.waitForTimeout(250); }
        else await page.waitForTimeout(150);
        break;
      }
      case 'archery': {
        if (await rect(page, 'archery.next')) { await click(page, 'archery.next'); await page.waitForTimeout(200); break; }
        const ans = await page.getAttribute('[data-ui="archery.input"]', 'data-answer').catch(() => null);
        if (!ans) { await page.waitForTimeout(150); break; }
        await page.fill('[data-ui="archery.input"]', ans);
        await click(page, 'archery.shoot'); await page.waitForTimeout(350);
        break;
      }
      case 'archive': {
        const want = await reg('archive:want');
        for (const id of want) if (!gs.sel.includes(id)) { await click(page, 'row.' + id); await page.waitForTimeout(80); }
        await page.waitForTimeout(100);
        await click(page, 'archive.cast'); await page.waitForTimeout(250);
        break;
      }
      case 'gemforge': {
        const ri = await reg('gemforge:right');
        if (ri !== undefined && ri !== null && (await rect(page, 'gq.' + ri))) { await click(page, 'gq.' + ri); await page.waitForTimeout(300); break; }
        const bd = await reg('gemforge:board');
        if (!bd || bd.busy) { await page.waitForTimeout(120); break; }
        const mv = findMove(bd.board);
        if (!mv) { await page.waitForTimeout(200); break; }
        const at = (x, y) => [bd.bx + x * bd.cell + bd.cell / 2, bd.by + y * bd.cell + bd.cell / 2];
        await page.mouse.click(...at(mv[0], mv[1])); await page.waitForTimeout(60);
        await page.mouse.click(...at(mv[2], mv[3])); await page.waitForTimeout(450);
        break;
      }
      case 'typist': {
        const words = await page.evaluate(() => { const f = window.__ui.registry('typist:words'); return f ? f() : []; });
        if (!words.length) { await page.waitForTimeout(100); break; }
        await page.fill('[data-ui="typist.input"]', words[0], { timeout: 1500 }).catch(() => {}); // the run may end meanwhile
        await page.waitForTimeout(120);
        break;
      }
      case 'loop': {
        const ri = await reg('loop:right');
        if (ri === undefined || !(await rect(page, 'gopt.' + ri))) { await page.waitForTimeout(150); break; }
        await click(page, 'gopt.' + ri); await page.waitForTimeout(700);
        break;
      }
    }
  }
  return false;
}

(async () => {
  const [base, ...only] = process.argv.slice(2);
  const games = only.length ? only : ALL;
  const { browser, page, errors } = await launch({ width: 1300, height: 900 });
  await seed(page, base, { __allDone: true, settings: { hearts: true } });
  const bad = [];
  let ok = 0;
  for (const g of games) {
    await goto(page, base, 'world');
    await goto(page, base, 'arcade/' + g);
    await until(page, async () => (await state(page, 'Minigame'))?.phase === 'intro', 6000);
    try {
      const finished = await play(page, g);
      await page.waitForTimeout(400);
      const stars = (await state(page, 'Minigame')).stars;
      if (process.env.SHOTS) await page.screenshot({ path: __dirname + '/shots/game-' + g + '-results.png' });
      if (finished && stars === 3) { ok++; console.log('OK ', g); }
      else { bad.push(`${g}: finished=${finished} stars=${stars}`); console.log('BAD', g); await page.screenshot({ path: __dirname + '/shots/game-' + g + '.png' }); }
    } catch (e) { bad.push(`${g}: ${e.message}`); console.log('BAD', g); await page.screenshot({ path: __dirname + '/shots/game-' + g + '.png' }); }
  }

  // A minigame stop on the path: the first 3-star win gives 2 lightbulbs, 1 torch and 1 potion.
  await seed(page, base, { __allDone: true, pathId: 'frontend-react', games: {} });
  const before = await page.evaluate(() => window.__store.getState().items);
  await goto(page, base, 'game/' + encodeURIComponent('game:web-u1'));
  const intro = await until(page, async () => { const s = await state(page, 'Minigame'); return s && s.phase === 'intro' ? s : null; }, 6000);
  const g = intro && intro.game;
  if (!g) bad.push(`path stop game:web-u1 did not open a game`);
  else {
    const finished = await play(page, g);
    await page.waitForTimeout(500);
    const after = await page.evaluate(() => window.__store.getState().items);
    const gained = { bulb: after.bulb - before.bulb, torch: after.torch - before.torch, potion: after.potion - before.potion };
    if (process.env.SHOTS) { await page.waitForTimeout(1500); await page.screenshot({ path: __dirname + '/shots/game-stop-results.png' }); }
    if (!finished || gained.bulb !== 2 || gained.torch !== 1 || gained.potion !== 1) bad.push(`path stop: finished=${finished} gained ${JSON.stringify(gained)}`);
    else { ok++; console.log(`OK  path stop (${g}) gave ${JSON.stringify(gained)}`); }
  }

  console.log(bad.length ? bad.join('\n') : '');
  console.log(`${ok}/${games.length + 1} games won with 3 stars by the game bot.`);
  console.log(errors.length ? 'Page errors: ' + errors.slice(0, 5).join(' | ') : 'No page errors');
  await browser.close();
  process.exit(ok === games.length + 1 ? 0 : 1);
})();
