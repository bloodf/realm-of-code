// Visits every screen in Portuguese and Spanish and lists the text drawn in English
// (strings with no translation). Usage: node tests/i18n-bot.cjs [pt|es|both] [baseUrl] [--lessons]
//   --lessons also opens every exercise of the first lessons of each course.
const { launch, seed, goto, until, click } = require('./lib.cjs');

const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const langs = !args[0] || args[0] === 'both' ? ['pt', 'es'] : [args[0]];
const base = args[1] || 'http://127.0.0.1:5181/';
const withLessons = process.argv.includes('--lessons');

const ROUTES = ['world', 'learn', 'paths', 'practice', 'quests', 'skills', 'trophies', 'profile', 'settings', 'help', 'pets', 'battle', 'inbox', 'farm',
  'home', 'farm/f1', 'farm/f12', 'farm/f25', 'battle/meadow/slime', 'arcade/bughunt', 'arcade/gemforge', 'arcade/typist', 'arcade/link', 'welcome-back', 'review', 'practice/html'];

(async () => {
  let worst = 0;
  let pageErrors = 0;
  for (const lang of langs) {
    const { browser, page, errors } = await launch({ width: 1300, height: 860 });
    await seed(page, base, { settings: { lang, tips: false }, xp: 900, gold: 900, __allDone: true, pets: undefined });
    // the title and hero creation screens too
    await goto(page, base, '');
    await page.waitForTimeout(600);
    for (const r of ROUTES) {
      await goto(page, base, r);
      await page.waitForTimeout(r.startsWith('arcade') || r.startsWith('battle/') ? 1400 : 700);
      // press the first obvious button on intro screens (start a game, a battle)
      if (r.startsWith('arcade')) { await click(page, 'game.play', { timeout: 0 }); await page.waitForTimeout(900); }
      if (r.startsWith('battle/')) { await click(page, 'battle.start', { timeout: 0 }); await page.waitForTimeout(600); await click(page, 'act.strike', { timeout: 0 }); await page.waitForTimeout(800); }
      // open Lumi's help on each screen, every tab
      if (['world', 'learn', 'home', 'pets', 'battle'].includes(r)) {
        for (const tab of ['about', 'stuck', 'faq']) {
          if (!(await click(page, 'hud.help', { timeout: 0 }))) await click(page, 'home.help', { timeout: 0 });
          await page.waitForTimeout(300);
          await click(page, 'help.tab.' + tab, { timeout: 0 });
          await page.waitForTimeout(300);
          await click(page, 'help.close', { timeout: 0 });
        }
      }
    }
    if (withLessons) {
      const ids = await page.evaluate(() => window.__realmDebug.nodeIds());
      const firsts = ids.filter((id) => /-1-1$|-01$/.test(id));
      for (const id of firsts) {
        const n = await page.evaluate((i) => window.__realmDebug.exerciseCount?.(i) ?? 6, id);
        for (let i = 0; i < n; i++) { await goto(page, base, `dev/ex/${id}/${i}`); await page.waitForTimeout(350); }
      }
    }
    const missing = await page.evaluate(() => window.__i18n.missing());
    const shown = missing.filter((s) => /[A-Za-z]{3}/.test(s));
    console.log(`\n== ${lang}: ${shown.length} strings drawn without a translation`);
    for (const s of shown.slice(0, 400)) console.log('  ' + JSON.stringify(s).slice(0, 160));
    if (errors.length) console.log('Page errors:', errors.slice(0, 5));
    pageErrors += errors.length;
    worst = Math.max(worst, shown.length);
    await browser.close();
  }
  // untranslated strings are a report (names, code and numbers are expected there); page errors fail
  console.log(pageErrors ? `\n${pageErrors} page errors` : '\nNo page errors');
  process.exit(pageErrors ? 1 : 0);
})();
