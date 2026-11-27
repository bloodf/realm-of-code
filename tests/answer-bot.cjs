// Plays lessons through the real game UI, answering every exercise correctly with the mouse
// and keyboard. Proves each exercise type accepts its right answer and that lessons complete
// with 100% accuracy.
// Usage: node tests/answer-bot.cjs <baseUrl> <nodeId> [<nodeId>...]   ("all-quiz" = every quiz lesson; RANGE=0-50 for a slice)
const { launch, seed, goto, state, click, clickLabel, until } = require('./lib.cjs');

(async () => {
  const [base, ...ids] = process.argv.slice(2);
  const { browser, page, errors } = await launch({ width: 1300, height: 900 });
  await seed(page, base, { __allDone: true, settings: { sageNotes: true } });
  let list = ids;
  if (ids[0] === 'all-quiz') {
    list = await page.evaluate(() => window.__realmDebug.nodeIds().filter((id) => !id.startsWith('c-') && !['tools-bughunt'].includes(id)));
    const [from, to] = (process.env.RANGE || '0-9999').split('-').map(Number);
    list = list.slice(from, to);
  }
  const L = () => state(page, 'Lesson');
  let ok = 0;
  const bad = [];
  for (const id of list) {
    await goto(page, base, 'world');
    await goto(page, base, 'lesson/' + id);
    const loaded = await until(page, async () => { const s = await L(); return s && s.key ? s : null; }, 10000);
    if (!loaded) { await page.screenshot({ path: __dirname + '/shots/bot-noload-' + id + '.png' }); bad.push(`${id}: lesson did not load. ${errors.slice(-2).join(' | ')}`); console.log('BAD', id); continue; }
    let finished = false, result = null;
    for (let step = 0; step < 80; step++) {
      const s = await L();
      if (s.result) { finished = true; result = s; break; }
      const key = s.key;
      if (s.status !== 'answer') {
        if (s.status === 'wrong') bad.push(`${id}: the right answer was marked wrong at ${key}`);
        await click(page, 'lesson.continue');
        await until(page, async () => { const n = await L(); return n.key !== key || n.result || n.status === 'answer'; }, 4000, 30);
        continue;
      }
      const ex = await page.evaluate((k) => window.__realmDebug.exercise(k), key);
      if (!ex) { await page.waitForTimeout(100); continue; }
      const changed = () => until(page, async () => { const n = await L(); return n.key !== key || n.status !== 'answer' || n.result; }, 20000, 40);
      switch (ex.t) {
        case 'teach':
          await click(page, 'lesson.continue');
          await changed();
          continue;
        case 'choice':
          if (!(await clickLabel(page, 'opt.', ex.options[ex.answer]))) bad.push(`${id}: option not found at ${key}`);
          break;
        case 'fill':
        case 'order': {
          const used = [];
          for (const a of ex.t === 'fill' ? ex.answers : ex.lines) {
            const hit = await clickLabel(page, 'tile.', a, used);
            if (!hit) bad.push(`${id}: tile "${a}" not found at ${key}`); else used.push(hit);
            await page.waitForTimeout(60);
          }
          break;
        }
        case 'type':
          await page.fill('[data-ui="type.input"]', ex.answers[0]);
          break;
        case 'bug':
          await click(page, 'bugline.' + ex.line);
          break;
        case 'match': {
          const link = s.link;
          for (const [l, r] of ex.pairs) {
            if (!(await clickLabel(page, link ? 'link.l.' : 'match.l.', l))) bad.push(`${id}: "${l}" not found at ${key}`);
            if (!(await clickLabel(page, link ? 'link.r.' : 'match.r.', r))) bad.push(`${id}: "${r}" not found at ${key}`);
            await page.waitForTimeout(link ? 60 : 160);
          }
          if (!link) { await changed(); continue; }
          break;
        }
        case 'sql': {
          await page.click('.code-editor .cm-content');
          await page.keyboard.press('Control+a');
          await page.keyboard.insertText(ex.solution);
          await click(page, 'lesson.check');
          if (!(await changed())) bad.push(`${id}: SQL not accepted at ${key}`);
          continue;
        }
        case 'terminal': {
          for (const c of ex.solution) { await page.fill('[data-ui="term.input"]', c); await page.press('[data-ui="term.input"]', 'Enter'); await page.waitForTimeout(60); }
          if (!(await changed())) bad.push(`${id}: terminal goal not reached at ${key}`);
          continue;
        }
        default:
          bad.push(`${id}: cannot auto-answer ${ex.t}`);
          break;
      }
      let ready = await until(page, async () => (await L()).ready, 2000, 30);
      if (!ready && ['choice', 'bug', 'type'].includes(ex.t)) {
        // the screen may have been rebuilding when we clicked: try once more
        if (ex.t === 'choice') await clickLabel(page, 'opt.', ex.options[ex.answer]);
        if (ex.t === 'bug') await click(page, 'bugline.' + ex.line);
        if (ex.t === 'type') await page.fill('[data-ui="type.input"]', ex.answers[0]);
        ready = await until(page, async () => (await L()).ready, 2000, 30);
      }
      if (!ready && process.env.DEBUG) {
        const ops = (await require('./lib.cjs').all(page)).filter((e) => e.id.startsWith('opt.'));
        console.log(ops, await page.evaluate(() => window.__game.scene.getScenes(true).map((s) => s.sys.settings.key + ' over:' + ((s.input._over && s.input._over[0]) || []).map((o) => o.type + '@' + Math.round(o.x) + ',' + Math.round(o.y)).join('|'))));
        console.log(await page.evaluate(() => window.__game.scene.getScenes(false).map((s) => s.sys.settings.key + ':' + s.sys.settings.status).join(' ')));
      }
      if (!ready) { await page.screenshot({ path: __dirname + '/shots/bot-fail-' + id + '.png' }); bad.push(`${id}: could not answer ${key} (${ex.t})`); break; }
      await click(page, 'lesson.check');
      await changed();
    }
    const perfect = finished && result.passed && result.accuracy === 100;
    if (perfect) ok++;
    else if (!bad.some((b) => b.startsWith(id))) { await page.screenshot({ path: __dirname + '/shots/bot-end-' + id + '.png' }); bad.push(`${id}: did not finish with 100% (finished=${finished}, accuracy=${result && result.accuracy})`); }
    console.log(`${perfect ? 'OK ' : 'BAD'} ${id}`);
  }
  console.log(bad.length ? bad.join('\n') : '');
  console.log(`${ok}/${list.length} lessons completed with 100% accuracy by the answer bot.`);
  console.log(errors.length ? 'Page errors: ' + errors.slice(0, 5).join(' | ') : 'No page errors');
  await browser.close();
  process.exit(ok === list.length ? 0 : 1);
})();
