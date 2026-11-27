// Testing challenges with a small built-in test runner (same API shape as Vitest/Jest).
import type { ConsoleLesson } from '../types';
import { uses } from '../helpers';

interface T { name: string; pass: boolean }
const tests = (v: unknown) => (Array.isArray(v) ? (v as T[]) : []);

const RUNNER = `This realm has a tiny test runner with the same API as **Vitest** and **Jest**:

\`\`\`
test("adds two numbers", () => {
  expect(add(2, 3)).toBe(5);
});
\`\`\`

Matchers: \`toBe\`, \`toEqual\` (arrays/objects), \`toBeTruthy\`, \`toContain\`, \`toHaveLength\`, \`toThrow\`, and \`.not\`.`;

export const testingLessons: ConsoleLesson[] = [
  {
    id: 'test-01', kingdom: 'js', kind: 'console', lang: 'js', libs: ['test'], region: 'Unit Tests', xp: 80,
    title: 'Your First Tests',
    concepts: ['test', 'expect', 'toBe'],
    story: 'The royal treasurer trusts no one. Before using the new helper functions, she wants proof that they work.',
    learn: RUNNER,
    task: 'Write **at least 4 tests**: at least two for `add` and two for `isEven`. All tests must pass.',
    sage: 'Good tests check normal cases **and** edge cases (zero, negative numbers, empty lists). Each test should check one behaviour and have a name that reads like a sentence, so a failing test tells you exactly what broke.',
    hints: ['`test("adds positive numbers", () => { expect(add(2, 3)).toBe(5); });`', '`test("4 is even", () => { expect(isEven(4)).toBe(true); });` and one for an odd number.'],
    starter: 'function add(a, b) {\n  return a + b;\n}\n\nfunction isEven(n) {\n  return n % 2 === 0;\n}\n\n// Write your tests below\n',
    solution: 'function add(a, b) {\n  return a + b;\n}\n\nfunction isEven(n) {\n  return n % 2 === 0;\n}\n\ntest("adds positive numbers", () => {\n  expect(add(2, 3)).toBe(5);\n});\n\ntest("adds negative numbers", () => {\n  expect(add(-2, -3)).toBe(-5);\n});\n\ntest("4 is even", () => {\n  expect(isEven(4)).toBe(true);\n});\n\ntest("7 is not even", () => {\n  expect(isEven(7)).toBe(false);\n});\n',
    probe: 'return { tests: __tests };',
    checks: [
      { label: 'At least 4 tests', test: (c) => tests(c.values.tests).length >= 4 },
      { label: 'All tests pass', test: (c) => tests(c.values.tests).length > 0 && tests(c.values.tests).every((t) => t.pass) },
      { label: 'Tests call add and isEven', test: (c) => (c.code.match(/expect\(\s*add\(/g) ?? []).length >= 2 && (c.code.match(/expect\(\s*isEven\(/g) ?? []).length >= 2 },
    ],
  },
  {
    id: 'test-02', kingdom: 'js', kind: 'console', lang: 'js', libs: ['test'], region: 'Unit Tests', xp: 85,
    title: 'Make the Tests Pass',
    concepts: ['reading tests', 'string methods'],
    story: 'The scribes need web addresses for every quest: "Slay the Dragon" must become "slay-the-dragon". The tests are written. Now write the code.',
    learn: `${RUNNER}

Reading tests is a great way to understand what code should do. Useful string methods here: \`trim()\`, \`toLowerCase()\`, \`split(" ")\`, \`join("-")\`, \`replaceAll(" ", "-")\`.`,
    task: 'Make `slugify(title)` pass **all the tests**: lowercase, no spaces at the ends, and words joined by single dashes. Do not change the tests.',
    sage: 'This is how many teams work: tests describe the expected behaviour first, then you write code until they pass. It is called **Test-Driven Development (TDD)**: red (failing test) → green (passing) → refactor (clean up).',
    hints: ['Start with `title.trim().toLowerCase()`.', 'Then split on spaces, drop empty parts, and join with dashes: `.split(" ").filter((w) => w).join("-")`'],
    starter: 'function slugify(title) {\n  return title;\n}\n\n// ---- Tests: do not change ----\ntest("lowercases words", () => {\n  expect(slugify("Dragon")).toBe("dragon");\n});\ntest("joins words with dashes", () => {\n  expect(slugify("Slay the Dragon")).toBe("slay-the-dragon");\n});\ntest("trims spaces at the ends", () => {\n  expect(slugify("  Find the Goat  ")).toBe("find-the-goat");\n});\ntest("collapses double spaces", () => {\n  expect(slugify("Save  the   Princess")).toBe("save-the-princess");\n});\n',
    solution: 'function slugify(title) {\n  return title\n    .trim()\n    .toLowerCase()\n    .split(" ")\n    .filter((w) => w)\n    .join("-");\n}\n\n// ---- Tests: do not change ----\ntest("lowercases words", () => {\n  expect(slugify("Dragon")).toBe("dragon");\n});\ntest("joins words with dashes", () => {\n  expect(slugify("Slay the Dragon")).toBe("slay-the-dragon");\n});\ntest("trims spaces at the ends", () => {\n  expect(slugify("  Find the Goat  ")).toBe("find-the-goat");\n});\ntest("collapses double spaces", () => {\n  expect(slugify("Save  the   Princess")).toBe("save-the-princess");\n});\n',
    probe: 'return { tests: __tests, extra: slugify("  A  B c ") };',
    checks: [
      { label: 'The 4 tests are still there', test: (c) => tests(c.values.tests).length >= 4 && ['lowercases words', 'joins words with dashes', 'trims spaces at the ends', 'collapses double spaces'].every((n) => tests(c.values.tests).some((t) => t.name === n)) },
      { label: 'All tests pass', test: (c) => tests(c.values.tests).length >= 4 && tests(c.values.tests).every((t) => t.pass) },
      { label: 'Works on new input too ("  A  B c " → "a-b-c")', test: (c) => c.values.extra === 'a-b-c' },
    ],
  },
  {
    id: 'test-03', kingdom: 'js', kind: 'console', lang: 'js', libs: ['test'], region: 'Unit Tests', xp: 90,
    title: 'The Bug Trap',
    concepts: ['regression tests', 'debugging with tests'],
    story: 'Merchants complain: the discount spell gives wrong prices. First trap the bug in a test, then fix it, so it can never come back.',
    learn: `${RUNNER}

A **regression test** reproduces a bug. It fails while the bug exists, passes after the fix, and stays in the code forever to catch the bug if it ever returns.`,
    task: '`applyDiscount(price, percent)` should return the price after a percentage discount (100 with 20% off = 80). Write at least 2 tests for it, find the bug, and fix the function so all tests pass.',
    sage: 'When you fix a bug in a real job, write the test first and watch it fail. That proves the test actually catches the bug. Then fix the code and watch it pass.',
    hints: ['Try `expect(applyDiscount(100, 20)).toBe(80);` What does it return now?', 'The formula should be `price - (price * percent) / 100`.'],
    starter: 'function applyDiscount(price, percent) {\n  return price - percent;\n}\n\n// Write your tests here\n',
    solution: 'function applyDiscount(price, percent) {\n  return price - (price * percent) / 100;\n}\n\ntest("20% off 100 is 80", () => {\n  expect(applyDiscount(100, 20)).toBe(80);\n});\n\ntest("10% off 50 is 45", () => {\n  expect(applyDiscount(50, 10)).toBe(45);\n});\n\ntest("0% off changes nothing", () => {\n  expect(applyDiscount(80, 0)).toBe(80);\n});\n',
    probe: 'return { tests: __tests, a: applyDiscount(100, 20), b: applyDiscount(50, 10), c: applyDiscount(80, 0), d: applyDiscount(200, 50) };',
    checks: [
      { label: 'At least 2 tests for applyDiscount', test: (c) => tests(c.values.tests).length >= 2 && (c.code.match(/applyDiscount\(/g) ?? []).length >= 3 },
      { label: 'All tests pass', test: (c) => tests(c.values.tests).length >= 2 && tests(c.values.tests).every((t) => t.pass) },
      { label: 'The bug is fixed (100, 20% → 80; 50, 10% → 45; 200, 50% → 100)', test: (c) => c.values.a === 80 && c.values.b === 45 && c.values.c === 80 && c.values.d === 100 },
      { label: 'Uses expect', test: (c) => uses(c.code, /expect\(/) },
    ],
  },
];
