// Section: Testing.
import type { Course } from '../types';
import { teach, mc, mcc, tf, fill, match, order, lesson, unit, challenge } from '../dsl';

export const testing: Course = {
  id: 'testing', title: 'Testing', realm: "The Proving Grounds", color: '#b8862f', emblem: 'test',
  desc: 'Prove your code works: unit tests, matchers, TDD, testing UIs, end-to-end tests and CI.',
  units: [
    unit('testing-u1', 'Unit Tests', 'Write tests with test() and expect().', `
**Key ideas**
- Tests are code that checks code. They catch bugs early and let you change code without fear.
- Kinds: **unit** (one function), **integration** (pieces together), **end-to-end** (the whole app in a browser).
- \`test("name", () => { expect(actual).toBe(expected); })\` (Vitest/Jest).
- \`toBe\` for primitives, \`toEqual\` for arrays/objects, \`toThrow\` for errors, \`.not\` to negate.
- Arrange → Act → Assert. Test normal cases and edge cases.`, [
      lesson('testing-1-1', 'Why test?', [
        teach('Proof, not hope', 'A **test** is a small program that checks that your code does what it should:\n\n```\ntest("adds two numbers", () => {\n  expect(add(2, 3)).toBe(5);\n});\n```\nRun the tests after every change. If something breaks, you know immediately, before users do.'),
        mc('What is the main benefit of automated tests?', ['You can change code confidently because mistakes are caught quickly', 'The app runs faster', 'You never need to debug again', 'They replace code review'], 0),
        match('Match the kind of test', [['Unit test', 'One function or component'], ['Integration test', 'Several parts working together'], ['End-to-end test', 'The whole app in a real browser'], ['Manual test', 'A human clicking around']]),
        tf('Most projects have many unit tests and fewer end-to-end tests (the "testing pyramid").', true),
        mc('Which tools are popular for JavaScript unit tests?', ['Vitest and Jest', 'Photoshop and Figma', 'Git and npm', 'Nginx and Apache'], 0),
      ]),
      lesson('testing-1-2', 'test and expect', [
        teach('Matchers', '```\nexpect(2 + 2).toBe(4);                    // exact (primitives)\nexpect([1, 2]).toEqual([1, 2]);           // same contents\nexpect("dragon").toContain("rag");\nexpect(list).toHaveLength(3);\nexpect(() => withdraw(5, 99)).toThrow();  // expects an error\nexpect(isEven(3)).not.toBe(true);\n```'),
        mc('Which matcher compares two arrays by their contents?', ['toEqual', 'toBe', 'toContain', 'toThrow'], 0),
        mcc('Does this test pass?', 'expect([1, 2]).toBe([1, 2]);', ['No: toBe checks identity, and these are two different arrays', 'Yes', 'Only in Jest', 'It throws a syntax error'], 0, undefined, 'js'),
        fill('Check that the function throws', 'expect(() => divide(1, 0)).___();', ['toThrow'], ['toBe', 'throws', 'toError'], undefined, 'js'),
        order('Arrange, act, assert', ['const cart = new Cart();', 'cart.add({ price: 5 });', 'expect(cart.total()).toBe(5);'], undefined, 'js'),
        tf('A good test name reads like a sentence describing the behaviour.', true),
      ]),
      challenge('test-01', 'Challenge: Your First Tests'),
      challenge('test-02', 'Challenge: Make the Tests Pass'),
      challenge('test-03', 'Challenge: The Bug Trap'),
    ]),
    unit('testing-u2', 'Testing in Practice', 'TDD, mocks, UI tests, end-to-end and CI.', `
**Key ideas**
- **TDD**: red (write a failing test) → green (make it pass) → refactor.
- **Mocks/fakes** replace slow or unpredictable things (network, time) in tests.
- UI tests with **Testing Library**: find elements like a user would (\`getByRole("button", { name: "Save" })\`).
- End-to-end with **Playwright** or Cypress: a real browser clicks through the app.
- **CI** (e.g. GitHub Actions) runs tests automatically on every push and pull request.`, [
      lesson('testing-2-1', 'TDD and mocks', [
        teach('Red, green, refactor', '**Test-Driven Development**:\n1. **Red**: write a test for the next small behaviour; it fails\n2. **Green**: write just enough code to pass\n3. **Refactor**: clean up, tests stay green\n\n**Mocks** stand in for things you do not want in a unit test (real network calls, the current time, payments).'),
        order('Order the TDD cycle', ['Write a failing test', 'Write code until it passes', 'Refactor while the tests stay green'], undefined, 'text'),
        mc('Why mock a payment API in unit tests?', ['Tests stay fast, free and predictable', 'To make the real payments faster', 'Mocks are required by Vitest', 'To hide bugs'], 0),
        tf('Tests that sometimes pass and sometimes fail ("flaky") are harmless.', false, 'Flaky tests erode trust: people start ignoring failures. Fix or remove them.'),
      ]),
      lesson('testing-2-2', 'Testing user interfaces', [
        teach('Test like a user', 'Testing Library encourages finding elements the way users do:\n\n```\nrender(<Counter />);\nawait user.click(screen.getByRole("button", { name: "Add" }));\nexpect(screen.getByText("Count: 1")).toBeInTheDocument();\n```\nEnd-to-end tools (**Playwright**, Cypress) drive a real browser through whole flows like "sign up and buy".'),
        mc('Which query best matches how users find a button?', ['getByRole("button", { name: "Save" })', 'querySelector(".btn-3")', 'getByTestId("x1")', 'document.body.children[4]'], 0, undefined, { codeOptions: true }),
        match('Match the tool', [['Testing Library', 'Component tests'], ['Playwright', 'End-to-end browser tests'], ['Vitest', 'Test runner'], ['GitHub Actions', 'Runs tests on every push']]),
        tf('Role-based queries also push you to build accessible UIs.', true),
      ]),
      lesson('testing-2-3', 'Continuous integration', [
        teach('Robots that check every change', '**Continuous Integration (CI)** runs your tests (and linting, type checks, builds) automatically on every push and pull request. A red ❌ on a PR means "do not merge yet".\n\nMany teams also use **CD** (continuous deployment): when `main` is green, the app deploys automatically.'),
        mc('What happens in CI when a pull request is opened?', ['Tests and checks run automatically', 'The code is merged immediately', 'The branch is deleted', 'Nothing'], 0),
        fill('A GitHub Actions step that runs the tests', 'steps:\n  - run: npm ci\n  - run: npm ___', ['test'], ['start', 'publish', 'delete'], undefined, 'bash'),
        tf('Code coverage of 100% guarantees there are no bugs.', false, 'Coverage shows which lines ran, not whether the checks were good. Aim for meaningful tests, not a number.'),
      ]),
    ]),
  ],
};
