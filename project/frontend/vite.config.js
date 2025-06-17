// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,           // 외부 접근 허용
    port: 5173,           // 기본 포트
    watch: {
      usePolling: true    // 도커 환경에서는 polling 감지 필요
    },
    allowedHosts: ['eunbie.site']  // ← 도메인 허용 추가!
  }
});
