/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // 關鍵：這行讓 Tailwind 掃描你的程式碼
  ],
  theme: {
    extend: {
      // 這裡可以自訂顏色，例如把橘色調得更亮一點
      colors: {
        orange: {
          500: '#f97316',
          600: '#ea580c',
        }
      }
    },
  },
  plugins: [],
}