import path from 'path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue2'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  proxy: {
    '/api': process.env.GOST_API_URL || 'http://localhost:3000',
  },
})
