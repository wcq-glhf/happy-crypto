/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        binance: {
          gold: '#F0B90B',
          dark: '#0B0E11',
          gray: '#1E2329',
          lightgray: '#2B3139'
        }
      }
    }
  },
  plugins: []
}
