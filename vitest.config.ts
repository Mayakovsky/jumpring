import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@jumpring/core': fileURLToPath(new URL('./packages/core/src/index.ts', import.meta.url)),
      '@jumpring/evm': fileURLToPath(new URL('./packages/evm/src/index.ts', import.meta.url)),
    },
  },
  test: {
    include: ['packages/*/test/**/*.test.ts'],
  },
});
