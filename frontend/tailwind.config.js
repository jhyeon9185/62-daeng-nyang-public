/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        /* 토스 브랜드 블루 계열 (toss.css 변수와 동일) */
        primary: {
          50: '#e8f3ff',
          100: '#cce4ff',
          200: '#99c9ff',
          300: '#66adff',
          400: '#3392ff',
          500: '#3182f6',
          600: '#1b64da',
          700: '#1e3a5f',
          800: '#152a47',
          900: '#0f1f33',
        },
      },
      fontFamily: {
        sans: ['Pretendard', 'Noto Sans KR', 'sans-serif'],
        display: ['Pretendard', 'Noto Sans KR', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
}
