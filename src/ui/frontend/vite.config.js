import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

import config from '../../lib/config'

// https://vitejs.dev/config/
export default defineConfig({
  root: fileURLToPath(new URL('./', import.meta.url)),
  plugins: [vue({
    include: [/\.vue$/]
  })],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    cors: true,
    host: "0.0.0.0",
    proxy: {
      '/api': {
        target: `http://localhost:${config.server.port}`,
        secure: false
      },
      '/permissions': {
        target: `http://localhost:${config.server.port}`,
        secure: false
      }
    }
  }
})
