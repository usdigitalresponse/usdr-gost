import path from 'path';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue2';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 8080,
    proxy: {
      '/api': process.env.GOST_API_URL || 'http://localhost:3000',
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
