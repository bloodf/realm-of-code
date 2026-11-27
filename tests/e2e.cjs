// Runs every end-to-end test (the Playwright bots in tests/) against a production build,
// one after the other, and prints a summary. Exits with 1 if any suite fails.
//
//   npm run test:e2e                      build, start a preview server on port 5199, run everything
//   node tests/e2e.cjs                    same, without building (uses the existing dist/)
//   node tests/e2e.cjs --url http://127.0.0.1:5181/    use a server that is already running
//   node tests/e2e.cjs --quick            a shorter run (about 10 minutes): samples of quizzes, challenges,
//                                         farm levels and minigames (all lessons are still verified)
//   node tests/e2e.cjs --only world,life  run some suites;  --skip lessons,quizzes  skip some
//
// Each suite's full output goes to tests/e2e-logs/<suite>.log.
// Needs Playwright's Chromium: npx playwright install chromium
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const ROOT = path.resolve(__dirname, '..');
const argv = process.argv.slice(2);
const opt = (name) => { const i = argv.indexOf('--' + name); return i >= 0 ? argv[i + 1] : undefined; };
const quick = argv.includes('--quick');
const only = opt('only')?.split(',');
const skip = opt('skip')?.split(',') ?? [];
const PORT = 5199;

// one challenge per language / framework, solved through the real UI (fail twice, show the solution, pass)
const CHALLENGES = ['c-html-01', 'c-css-01', 'c-js-01', 'c-ts-01', 'c-tw-01', 'c-react-01', 'c-vue-01', 'c-svelte-01',
  'c-api-01', 'c-node-01', 'c-py-01', 'c-php-01', 'c-algo-01', 'c-test-01', 'c-qa-01'];

const MIN = 60_000;
const SUITES = (url) => [
  { id: 'lessons', what: 'Every lesson solved by its reference answers (in-app verifier)', args: ['tests/verify-lessons.cjs', 'all', url], timeout: 40 * MIN },
  { id: 'quizzes', what: 'Quiz lessons answered through the UI', args: ['tests/answer-bot.cjs', url, 'all-quiz'], env: quick ? { RANGE: '0-12' } : {}, timeout: 60 * MIN },
  { id: 'challenges', what: 'Coding challenges through the UI (15 languages/frameworks)', args: ['tests/challenge-bot.cjs', url, ...(quick ? CHALLENGES.slice(0, 4) : CHALLENGES)], timeout: 20 * MIN },
  { id: 'world', what: 'Village: walking (WASD/arrows), buildings, NPCs, menus', args: ['tests/world-bot.cjs', url], timeout: 10 * MIN },
  { id: 'adaptive', what: 'Adaptive path: review stops, pacing, unit tests', args: ['tests/adaptive-bot.cjs', url], timeout: 10 * MIN },
  { id: 'farm', what: 'Code Farm levels through the UI (blocks and code)', args: ['tests/farm-bot.cjs', url, ...(quick ? ['f1', 'f10', 'f20', 'f30'] : [])], timeout: 20 * MIN },
  { id: 'games', what: 'Minigames won with 3 stars + a path stop', args: ['tests/game-bot.cjs', url, ...(quick ? ['link', 'memory', 'loop'] : [])], timeout: 30 * MIN },
  { id: 'life', what: 'Pets, homestead, battles, absence, inbox, developer mode', args: ['tests/life-bot.cjs', url], timeout: 10 * MIN },
  { id: 'i18n', what: 'Portuguese and Spanish screens (no page errors)', args: ['tests/i18n-bot.cjs', 'both', url], timeout: 15 * MIN },
  { id: 'screens', what: 'Screenshot tour, desktop', args: ['tests/screenshots.cjs', url], timeout: 10 * MIN },
  { id: 'phone', what: 'Screenshot tour, phone size', args: ['tests/screenshots.cjs', url], env: { W: '390', H: '844' }, timeout: 10 * MIN },
];

const get = (url) => new Promise((resolve) => {
  http.get(url, (res) => { res.resume(); resolve(res.statusCode); }).on('error', () => resolve(0));
});

async function startPreview() {
  if (!fs.existsSync(path.join(ROOT, 'dist', 'index.html'))) {
    console.error('No build found: run "npm run build" first (or "npm run test:e2e", which builds).');
    process.exit(2);
  }
  const url = `http://127.0.0.1:${PORT}/`;
  if (await get(url)) { console.error(`Port ${PORT} is busy. Stop what runs there or pass --url.`); process.exit(2); }
  const vite = path.join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js');
  const server = spawn(process.execPath, [vite, 'preview', '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
  for (let i = 0; i < 60 && (await get(url)) !== 200; i++) await new Promise((r) => setTimeout(r, 500));
  if ((await get(url)) !== 200) { server.kill(); console.error('The preview server did not start.'); process.exit(2); }
  return { url, server };
}

function run(suite, logDir) {
  return new Promise((resolve) => {
    const started = Date.now();
    const log = fs.createWriteStream(path.join(logDir, suite.id + '.log'));
    const child = spawn(process.execPath, suite.args, { cwd: ROOT, env: { ...process.env, ...(suite.env ?? {}) } });
    let tail = '';
    const onData = (d) => { log.write(d); tail = (tail + d.toString()).slice(-4000); };
    child.stdout.on('data', onData);
    child.stderr.on('data', onData);
    const timer = setTimeout(() => { tail += `\nTIMEOUT after ${Math.round(suite.timeout / MIN)} min`; child.kill('SIGKILL'); }, suite.timeout);
    child.on('close', (code) => {
      clearTimeout(timer);
      log.end();
      // the last meaningful line is the suite's own summary
      const lines = tail.split('\n').map((l) => l.trim()).filter((l) => l && !/^at /.test(l));
      lines.reverse();
      const summary = lines.find((l) => /TIMEOUT/.test(l)) ?? lines.find((l) => /^\d+\/\d+ /.test(l)) ?? lines.find((l) => /passed|Error/.test(l)) ?? lines.find((l) => /page errors/i.test(l)) ?? lines[0] ?? '';
      resolve({ ok: code === 0, code, secs: Math.round((Date.now() - started) / 1000), summary });
    });
  });
}

(async () => {
  let url = opt('url');
  let server = null;
  if (!url) ({ url, server } = await startPreview());
  if (!url.endsWith('/')) url += '/';
  const logDir = path.join(__dirname, 'e2e-logs');
  fs.mkdirSync(logDir, { recursive: true });
  const suites = SUITES(url).filter((s) => (!only || only.includes(s.id)) && !skip.includes(s.id));
  console.log(`End-to-end tests on ${url}${quick ? ' (quick)' : ''}: ${suites.map((s) => s.id).join(', ')}\n`);
  const results = [];
  for (const s of suites) {
    process.stdout.write(`${s.id.padEnd(11)} ${s.what}... `);
    const r = await run(s, logDir);
    results.push({ ...s, ...r });
    console.log(`${r.ok ? 'PASS' : 'FAIL'} (${r.secs}s)  ${r.summary.slice(0, 110)}`);
  }
  if (server) server.kill();
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} end-to-end suites passed.` + (failed.length ? ` Failed: ${failed.map((f) => f.id).join(', ')} (see tests/e2e-logs/).` : ''));
  process.exit(failed.length ? 1 : 0);
})();
