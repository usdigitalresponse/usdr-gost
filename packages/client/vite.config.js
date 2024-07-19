import path from 'path';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    {
      // This plugin middleware does essentially the same thing our aws_cloudfront_function does
      // in production: for URLs that start with arpa_reporter, it rewrites the URL to serve to the
      // root of that SPA, so the ARPA SPA handles the URL rather than the root Grants SPA. This is
      // necessitated by the nested setup of `/...` serving the Grants site and `/arpa_reporter...`
      // serving the ARPA site, which is not a common or well supported setup.
      name: 'arpa_reporter_url_rewriter',
      configureServer(serve) {
        serve.middlewares.use((req, res, next) => {
          const isInitialPageLoad = req.headers.referer === undefined ||
            new URL(req.headers.referer).pathname === new URL(req.url, `http://${req.headers.host}`).pathname
          const isArpaUrl = req.url.startsWith('/arpa_reporter')
          if (isInitialPageLoad && isArpaUrl) {
            req.url = '/arpa_reporter/'
          }
          next()
        })
      }
    },
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
  server: {
    host: '0.0.0.0',
    port: 8080,
    proxy: {
      '/api': process.env.GOST_API_URL || 'http://localhost:3000',
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        arpa_reporter: path.resolve(__dirname, 'arpa_reporter/index.html'),
      },
    },
    sourcemap: true,
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
