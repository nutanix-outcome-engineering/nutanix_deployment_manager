import { fileURLToPath, URL } from 'node:url'
import { resolve } from 'node:path'
import { readFileSync } from 'node:fs'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

import config from '../../lib/config'

// https://vitejs.dev/config/
export default defineConfig(({command, mode}) => {
  let viteConfig = {
    root: fileURLToPath(new URL('./', import.meta.url)),
    plugins: [vue({
      include: [/\.vue$/]
    })],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    }
  }

  if (command === 'serve') {
    viteConfig.server = {
      cors: true,
      host: `${config.server.name}`,
      origin: `https://${config.server.name}:${config.server.port}`,
      https: {
        key: config.server.key && readFileSync(`${resolve(process.cwd(), config.server.key)}`),
        cert: config.server.cert && readFileSync(`${resolve(process.cwd(), config.server.cert)}`),
        minVersion: 'TLSv1.2'
      },
      proxy: {
        '/api': {
          target: `https://${config.server.name}:${config.server.port}`,
          secure: false,
          changeOrigin: true
        },
        '/permissions': {
          target: `https://${config.server.name}:${config.server.port}`,
          secure: false,
          changeOrigin: true
        }
      }
    }
  } else if (command === 'build' && mode === 'development') {
    viteConfig.build = {
      sourcemap: 'inline'
    }
  }

  return viteConfig
})
