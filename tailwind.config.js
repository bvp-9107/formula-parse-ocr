/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        yt: {
          bg: '#0f0f0f',
          surface: '#212121',
          border: '#3f3f3f',
          accent: '#065fd4',
          hover: '#272727'
        }
      }
    },
  },
  plugins: [],
}
