import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    environment: 'node',
    coverage: {
      // Only core/ has a coverage target. A global number just rewards testing the easy parts.
      include: ['src/core/**'],
      thresholds: { branches: 95, functions: 95, lines: 95, statements: 95 },
    },
  },
});
