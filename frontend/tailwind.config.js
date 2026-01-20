/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bis-maroon': '#7c1c24',
        'bis-gold': '#fdbf2d',
      }
    },
  },
  plugins: [],
}

