/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Open Sans', 'sans-serif'],
        syne: ['Syne', 'sans-serif'],
      },
      colors: {
        accent:  '#00E5A0',
        accent2: '#00C8FF',
        danger:  '#FF5C5C',
        warn:    '#FFB547',
      },
    },
  },
  plugins: [],
}