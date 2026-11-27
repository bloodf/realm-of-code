// Checks that the path adapts to the player:
//  1. two misses in a row bring back the lesson's teach card (refresher)
//  2. a lesson finished under 75% adds a review stop, which blocks the next lesson
//  3. finishing the review opens the path again
//  4. a strong player gets a shortcut stop and express lessons
//  5. a struggling player gets a warm-up with old mistakes
//  6. Lumi offers help after two wrong answers on the same question
// Usage: node tests/adaptive-bot.cjs <baseUrl>
const { launch, seed, goto, state, click, until, answerCurrent } = require('./lib.cjs');

(async () => {
  const [base] = process.argv.slice(2);
  const { browser, page, errors } = await launch({ width: 1300, height: 900 });
  const results = [];
  const check = (name, ok, extra = '') => { results.push([name, !!ok]); console.log(`${ok ? 'OK ' : 'BAD'} ${name}${extra ? ' ' + extra : ''}`); };
  const L = () => state(page, 'Lesson');
  const A = () => state(page, 'W:learn');
  const store = () => page.evaluate(() => JSON.parse(JSON.stringify(window.__store.getState())));
  const profile = { name: 'Bot', avatar: 'knight', tunic: 'royal', createdAt: 1 };

  // Plays the current session; the first `wrongFirst` choice questions are answered wrong on purpose.
  async function playSession(wrongFirst = 0) {
    let wrong = wrongFirst, sawRefresher = false, coach = false;
    for (let step = 0; step < 90; step++) {
      const s = await L();
      if (!s) { await page.waitForTimeout(150); continue; }
      if (s.result) return { done: true, sawRefresher, coach, result: s };
      if (s.tag === 'refresher') sawRefresher = true;
      const ex = s.key ? await page.evaluate((k) => window.__realmDebug.exercise(k), s.key) : null;
      const miss = wrong > 0 && ex && ex.t === 'choice' && s.status === 'answer';
      const t = await answerCurrent(page, !miss);
      if (miss && t === 'choice') wrong--;
      const c = await page.evaluate(() => window.__coach.state());
      if (c) { coach = true; await click(page, 'coach.no'); }
    }
    return { done: false, sawRefresher, coach };
  }

  // 1 + 2: a hard first lesson
  await seed(page, base, { profile, pathId: 'frontend-react', settings: { hearts: false } });
  await goto(page, base, 'lesson/web-1-1');
  await until(page, async () => (await L())?.key, 10000);
  const r1 = await playSession(3);
  check('hard lesson finishes', r1.done);
  check('two misses in a row bring back the teach card', r1.sawRefresher);
  check('results say a review stop was added', r1.result && r1.result.review);
  let st = await store();
  check('review stop saved with the missed questions', !!st.reviews['web-1-1'] && st.reviews['web-1-1'].keys.length > 0 && !st.reviews['web-1-1'].done);

  await goto(page, base, 'learn');
  await until(page, A, 5000);
  let a = await A();
  check('path shows the review stop as the current stop', a.current === 'review:web-1-1' && a.stops.some((x) => x.kind === 'review' && x.state === 'current'));
  check('pace card warns about the review', /review stop is waiting/i.test(a.pace));

  await goto(page, base, 'lesson/web-1-2');
  await page.waitForTimeout(700);
  let l = await L();
  check('next lesson is blocked until the review is done', l && /review stop first/.test(l.blocked || ''));

  // 3: do the review (the "Start the review" button on the blocked screen)
  await click(page, 'blocked.action');
  await until(page, async () => (await L())?.mode === 'review' && (await L()).key, 8000);
  const r2 = await playSession(0);
  check('review session finishes', r2.done && r2.result.mode === 'review' && r2.result.passed);
  st = await store();
  check('review marked done', !!st.reviews['web-1-1'].done);
  await goto(page, base, 'learn');
  await page.waitForTimeout(600);
  a = await A();
  check('after the review, the next lesson is current', a.current === 'web-1-2' && !a.stops.some((x) => x.kind === 'review' && x.state === 'current'));
  check('minigame stop is on the path', a.stops.some((x) => x.kind === 'game'));

  // 4: a strong player
  st = await store();
  await seed(page, base, { ...st, toasts: [], history: [{ id: 'x', acc: 100, at: 1 }, { id: 'y', acc: 100, at: 1 }, { id: 'z', acc: 95, at: 1 }] });
  await goto(page, base, 'learn');
  await until(page, A, 5000);
  a = await A();
  check('strong player gets a shortcut stop', a.stops.filter((x) => x.kind === 'fast').length === 1);
  check('pace card says "You are flying!"', /You are flying!/.test(a.pace));
  await goto(page, base, 'lesson/web-1-2');
  await until(page, async () => (await L())?.key, 8000);
  l = await L();
  check('strong player gets an express lesson', /Express lesson/.test(l.note || ''));

  // 5: a struggling player
  st = await store();
  await seed(page, base, { ...st, toasts: [], history: [{ id: 'x', acc: 50, at: 1 }, { id: 'y', acc: 60, at: 1 }, { id: 'z', acc: 55, at: 1 }], mistakes: { 'web-1-1#1': 1, 'web-1-1#2': 1 } });
  await goto(page, base, 'lesson/web-1-2');
  await until(page, async () => (await L())?.key, 8000);
  l = await L();
  check('struggling player gets a warm-up', l.tag === 'warmup');

  // 6: the same question missed twice (wrong, torch, wrong again): Lumi offers help
  await seed(page, base, { profile, pathId: 'frontend-react', settings: { hearts: true } });
  await goto(page, base, 'lesson/web-1-1');
  await until(page, async () => (await L())?.key, 10000);
  for (let i = 0; i < 20; i++) {
    const s = await L();
    const ex = await page.evaluate((k) => window.__realmDebug.exercise(k), s.key);
    if (ex.t === 'choice' && s.status === 'answer') break;
    await answerCurrent(page, true);
  }
  const q = (await L()).key;
  const wrongOnce = async () => {
    const ex = await page.evaluate((k) => window.__realmDebug.exercise(k), q);
    await require('./lib.cjs').clickLabel(page, 'opt.', ex.options.find((_, i) => i !== ex.answer));
    await until(page, async () => (await L()).ready, 2000);
    await click(page, 'lesson.check');
    await until(page, async () => (await L()).status === 'wrong', 4000);
  };
  await wrongOnce();
  const torch = await click(page, 'lesson.torch');
  await until(page, async () => (await L()).status === 'answer', 4000);
  await wrongOnce();
  const coach = await until(page, async () => { const c = await page.evaluate(() => window.__coach.state()); return c && c.kind === 'stuck' ? c : null; }, 3000);
  check('a torch gives a second try at the same question', torch && (await L()).key === q);
  check('Lumi offers help after the same question is missed twice', !!coach);
  if (coach) {
    await click(page, 'coach.yes');
    await page.waitForTimeout(500);
    const hp = await state(page, 'HelpPanel');
    check('"Help me" opens the help panel on the "I\'m stuck" tab', hp && hp.tab === 'stuck' && hp.screen === 'Lesson');
  }

  const ok = results.filter((r) => r[1]).length;
  console.log(`\n${ok}/${results.length} adaptive checks passed.`);
  console.log(errors.length ? 'Page errors: ' + errors.slice(0, 5).join(' | ') : 'No page errors');
  await browser.close();
  process.exit(ok === results.length ? 0 : 1);
})();
