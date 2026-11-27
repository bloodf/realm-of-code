// Runs the in-app content verifier in headless Chromium.
// Usage: npm run build && npm run preview (other terminal), then
//        node tests/verify-lessons.cjs [course|all] [baseUrl]
const { chromium } = require('playwright');

(async () => {
  const filter = process.argv[2] && process.argv[2] !== 'all' ? '/' + process.argv[2] : '';
  const base = process.argv[3] || 'http://127.0.0.1:5181/';
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(base + '#/dev/verify' + filter);
  await page.waitForFunction(() => window.__verify && window.__verify.done, null, { timeout: 1800000, polling: 1000 });
  const { rows, counts } = await page.evaluate(() => window.__verify);
  const bad = rows.filter((r) => !r.ok);
  for (const r of bad) console.log('BAD', r.id, '\n   ' + r.note.split('\n').join('\n   '));
  console.log(`\n${rows.length - bad.length}/${rows.length} lessons OK · ${counts.exercises} exercises (${counts.code} coding challenges, ${counts.sql} SQL, ${counts.terminal} terminal, ${counts.output} output questions run)`);
  if (errors.length) console.log('Page errors:', errors.slice(0, 5));
  await browser.close();
  process.exit(bad.length ? 1 : 0);
})();
