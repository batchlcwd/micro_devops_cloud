import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, './src'),
      },
    },
    server: {
      // The API gateway has no CORS config, so the dev server forwards /gw/* to it
      // (e.g. /gw/products/api/products → http://localhost:8080/products/api/products).
      proxy: {
        '/gw': {
          target: env.GATEWAY_URL || 'http://localhost:8080',
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/gw/, ''),
        },
      },
    },
  }
})
