// Checks every Code Farm level: the reference solution must meet every goal with no
// mistakes and within par (3 stars), and an empty program must not pass.
// Usage: node scripts/verify-farm.ts
import { LEVELS, starsFor } from '../src/farm/levels.ts';
import { runFarmSync } from '../src/farm/sim.ts';
import { blockCount, codeLines, toJs } from '../src/farm/program.ts';

let ok = 0;
const bad: string[] = [];
for (const lv of LEVELS) {
  const code = typeof lv.solution === 'string' ? lv.solution : toJs(lv.solution);
  const size = typeof lv.solution === 'string' ? codeLines(lv.solution) : blockCount(lv.solution);
  const { result, error } = runFarmSync(lv.farm, code);
  const failed = lv.goals.filter((g) => !g.check(result, lv, code)).map((g) => g.text);
  const stars = starsFor(lv, failed.length === 0, result.mistakes, size);
  const empty = runFarmSync(lv.farm, lv.starter ?? '');
  const emptyPasses = lv.goals.every((g) => g.check(empty.result, lv, lv.starter ?? ''));
  const problems = [
    error && `solution threw: ${error}`,
    failed.length && `goals not met: ${failed.join('; ')}`,
    result.mistakes && `${result.mistakes} mistakes: ${result.events.filter((e) => e.t === 'oops' || e.t === 'bump' || e.t === 'rot').map((e) => ('text' in e ? e.text : e.t)).slice(0, 3).join(' | ')}`,
    size > lv.par && `solution size ${size} > par ${lv.par}`,
    emptyPasses && 'the starter/empty program already passes',
    lv.mode !== 'code' && typeof lv.solution === 'string' && 'block level needs a block solution',
  ].filter(Boolean);
  if (problems.length || stars !== 3) bad.push(`${lv.id} ${lv.title}: ${problems.join(' · ')} (stars ${stars})`);
  else ok++;
  console.log(`${problems.length ? 'BAD' : 'OK '} ${lv.id.padEnd(4)} ${lv.mode.padEnd(6)} size ${String(size).padStart(2)}/${lv.par} actions ${result.actions} ${lv.title}`);
}
console.log(bad.length ? '\n' + bad.join('\n') : '');
console.log(`${ok}/${LEVELS.length} farm levels verified (solution earns 3 stars, empty program fails).`);
if (bad.length) process.exit(1);
