// Unit tests (Vitest): game logic, content integrity, translations, runners.
// The end-to-end tests (Playwright bots) are in tests/*.cjs; see `npm run test:e2e`.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
    setupFiles: ['tests/unit/setup.ts'],
    testTimeout: 20000,
  },
});
