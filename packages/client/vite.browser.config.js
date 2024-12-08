import vue from '@vitejs/plugin-vue';
import { defineConfig, loadEnv } from 'vite';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      vue({
        template: {
          compilerOptions: {
            compatConfig: {
              MODE: 2,
            },
          },
        },
      }),
    ],
    resolve: {
      alias: {
        vue: '@vue/compat',
        '@': path.resolve(__dirname, './src'),
      },
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['vitest.setup.ts'],
      alias: {
        vue: 'vue',
      },
      browser: {
        provider: 'playwright',
        enabled: true,
        name: 'chromium',
        headless: true,
      },
      include: ['**/*.browser.spec.{js,jsx}'],
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
    define: {
      'process.env': env,
    },
  };
});
