// // vite.config.js
// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'

// export default defineConfig({
//   base: "/", // ✅ 추가!
//   plugins: [react()],
//   server: {
//     host: true,
//     port: 5173,
//     cors: true,
//     watch: {
//       usePolling: true
//     },
//     allowedHosts: ['eunbie.site']
//   }
// });
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: "/",
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    cors: true,
    watch: {
      usePolling: true
    },
    allowedHosts: 'all'  // 모든 호스트 허용
  }
})