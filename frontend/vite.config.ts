import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  envDir: '..',
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': 'http://localhost:4000',
      '/auth': 'http://localhost:4000',
      '/health': 'http://localhost:4000',
      '/products': 'http://localhost:4000',
      '/qrcodes': 'http://localhost:4000',
      '/analytics': 'http://localhost:4000',
      '/qr-sticker-templates': 'http://localhost:4000',
      '/scan': 'http://localhost:4000',
      '/feedback': 'http://localhost:4000',
      '/complaint': 'http://localhost:4000',
      '/compliment': 'http://localhost:4000',
      '/uploads': 'http://localhost:4000',
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
