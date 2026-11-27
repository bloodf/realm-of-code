// Shared helpers for the test bots. The game is drawn on a canvas by Phaser, so the bots
// find buttons through the game's UI registry (window.__ui: id, label, page rectangle)
// and click them with the real mouse, like a player would.
const { chromium } = require('playwright');

const SAVE_KEY = 'realm-of-code-save';

async function launch(opts = {}) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: opts.width || 1300, height: opts.height || 900 }, isMobile: !!opts.mobile, hasTouch: !!opts.mobile });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/favicon|Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });
  return { browser, page, errors };
}

/** Writes a save (merged over a default hero), then reloads so the game starts with it. */
async function seed(page, base, state = {}) {
  await page.goto(base);
  await page.waitForFunction(() => window.__realmDebug, null, { timeout: 30000 });
  await page.evaluate(([key, st]) => {
    const done = st.__allDone ? Object.fromEntries(window.__realmDebug.nodeIds().map((id) => [id, { times: 1, best: 100, at: 1 }])) : undefined;
    delete st.__allDone;
    const full = Object.assign({ profile: { name: 'Bot', avatar: 'ranger', tunic: 'forest', createdAt: 1 }, pathId: 'fullstack', done: done || {} }, st);
    full.settings = Object.assign({ sfx: false, music: false, hearts: false, speed: 4, fontSize: 14, tips: false }, st.settings || {});
    localStorage.setItem(key, JSON.stringify({ version: 2, state: full }));
    sessionStorage.clear();
  }, [SAVE_KEY, JSON.parse(JSON.stringify(state))]);
  await page.reload();
  await page.waitForFunction(() => window.__realmDebug && window.__ui, null, { timeout: 30000 });
}

async function goto(page, base, hash) {
  await page.evaluate((h) => { location.hash = '#/' + h; }, hash);
  await page.waitForTimeout(250);
}

const rect = (page, id) => page.evaluate((i) => window.__ui.rect(i), id);
const state = (page, key) => page.evaluate((k) => window.__ui.state(k), key);
const all = (page) => page.evaluate(() => window.__ui.all());
const list = (page) => page.evaluate(() => window.__ui.list());

/** Waits until a widget is on screen. */
async function waitUi(page, id, timeout = 8000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    if (await rect(page, id)) return true;
    await page.waitForTimeout(60);
  }
  return false;
}

/** Clicks a widget with the mouse (scrolling it into view first if needed). */
async function click(page, id, { timeout = 5000 } = {}) {
  let r = await rect(page, id);
  if (!r) { await page.evaluate((i) => window.__ui.reveal(i), id); await page.waitForTimeout(80); r = await rect(page, id); }
  if (!r && timeout) { await waitUi(page, id, timeout); r = await rect(page, id); }
  if (!r) return false;
  await page.mouse.click(r.x + r.w / 2, r.y + r.h / 2);
  await page.waitForTimeout(60);
  return true;
}

/** Clicks the first on-screen widget whose id starts with `prefix` and whose label is `label`. */
async function clickLabel(page, prefix, label, skip = []) {
  const items = (await all(page)).filter((e) => e.id.startsWith(prefix) && e.label === label && !skip.includes(e.id));
  for (const it of items) {
    if (!it.rect) { await page.evaluate((i) => window.__ui.reveal(i), it.id); await page.waitForTimeout(60); }
    const r = await rect(page, it.id);
    if (r) { await page.mouse.click(r.x + r.w / 2, r.y + r.h / 2); await page.waitForTimeout(60); return it.id; }
  }
  return null;
}

/** Polls fn until it returns something truthy. */
async function until(page, fn, timeout = 8000, step = 50) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    const v = await fn();
    if (v) return v;
    await page.waitForTimeout(step);
  }
  return null;
}

/**
 * Answers the lesson's current quick exercise (right, or wrong on purpose for choices) and
 * presses Check and Continue. Returns the exercise type, or null when nothing was answered.
 */
async function answerCurrent(page, right = true) {
  const L = () => state(page, 'Lesson');
  const s = await L();
  if (!s || !s.key || s.result) return null;
  const key = s.key;
  const changed = () => until(page, async () => { const n = await L(); return n.key !== key || n.status !== 'answer' || n.result; }, 20000, 40);
  if (s.status !== 'answer') { await click(page, 'lesson.continue'); await until(page, async () => { const n = await L(); return n.key !== key || n.result || n.status === 'answer'; }, 4000, 30); return 'continue'; }
  const ex = await page.evaluate((k) => window.__realmDebug.exercise(k), key);
  switch (ex.t) {
    case 'teach': await click(page, 'lesson.continue'); await changed(); return 'teach';
    case 'choice': {
      const label = right ? ex.options[ex.answer] : ex.options.find((_, i) => i !== ex.answer);
      await clickLabel(page, 'opt.', label);
      break;
    }
    case 'fill': case 'order': {
      const used = [];
      for (const a of ex.t === 'fill' ? ex.answers : ex.lines) { const hit = await clickLabel(page, 'tile.', a, used); if (hit) used.push(hit); await page.waitForTimeout(50); }
      break;
    }
    case 'type': await page.fill('[data-ui="type.input"]', ex.answers[0]); break;
    case 'bug': await click(page, 'bugline.' + ex.line); break;
    case 'match': {
      for (const [l, r] of ex.pairs) {
        await clickLabel(page, s.link ? 'link.l.' : 'match.l.', l);
        await clickLabel(page, s.link ? 'link.r.' : 'match.r.', r);
        await page.waitForTimeout(s.link ? 60 : 160);
      }
      if (!s.link) { await changed(); break; }
      await until(page, async () => (await L()).ready, 2000, 30);
      await click(page, 'lesson.check');
      await changed();
      break;
    }
    default: throw new Error('cannot answer ' + ex.t);
  }
  if (ex.t !== 'match') {
    await until(page, async () => (await L()).ready, 2000, 30);
    await click(page, 'lesson.check');
    await changed();
  }
  // continue after the feedback
  const n = await L();
  if (n && !n.result && n.key === key && n.status !== 'answer') { await click(page, 'lesson.continue'); await until(page, async () => { const m = await L(); return m.key !== key || m.result || m.status === 'answer'; }, 4000, 30); }
  return ex.t;
}

module.exports = { answerCurrent, launch, seed, goto, rect, state, all, list, waitUi, click, clickLabel, until, SAVE_KEY };
