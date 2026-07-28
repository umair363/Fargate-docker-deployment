import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    watch: {
      usePolling: true,
      interval: 1000
    },
    proxy: {
      '/insert': 'http://backend.local:8000',
      '/records': 'http://backend.local:8000'
    }
  }
})
