import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite dev server proxy for backend API
const proxyTarget = 'http://localhost:3001';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: proxyTarget,
        changeOrigin: true,
      },
    },
  },
})
