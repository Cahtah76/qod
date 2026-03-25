/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        charcoal: {
          900: '#1a1a1f',
          800: '#22222a',
          700: '#2c2c36',
          600: '#3a3a46',
        },
        brand: {
          DEFAULT: '#0066cc',
          light: '#1a7fe0',
          dark: '#0052a3',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
