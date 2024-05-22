import path from 'path';
import { defineConfig } from 'vite';
import { createVuePlugin as vue } from 'vite-plugin-vue2';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    coverage: {
      provider: 'istanbul',
      include: ['src/**'],
      reporter: [
        ['text', { file: process.env.CI ? 'coverage.txt' : null }], // Direct to file in CI; direct to stdout otherwise
        'html',
        'clover',
        'json',
      ],
    },
  },
});
