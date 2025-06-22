/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",               // 루트 index.html (Vite용)
    "./src/**/*.{js,ts,jsx,tsx}"  // 모든 컴포넌트, 페이지
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
