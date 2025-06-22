// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: "/", // ✅ 추가!
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    cors: true,
    watch: {
      usePolling: true
    },
    allowedHosts: ['eunbie.site']
  }
});
