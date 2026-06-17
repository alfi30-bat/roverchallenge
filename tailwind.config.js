/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./*.html", "./*.js"],
  theme: {
    extend: {
      colors: {
        'mars': {
          50: '#fef3e2',
          100: '#fde0b5',
          200: '#f9c06d',
          300: '#f5a030',
          400: '#e8820f',
          500: '#c4650a',
          600: '#9a4d08',
          700: '#6f3606',
          800: '#4a2304',
          900: '#2d1402',
        },
        'space': {
          50: '#e8edf5',
          100: '#c4cde6',
          200: '#8e9dcc',
          300: '#5b6fb3',
          400: '#354d9e',
          500: '#1a2f7a',
          600: '#142462',
          700: '#0e1a4a',
          800: '#090f30',
          900: '#04071a',
          950: '#020410',
        },
        'neon': {
          cyan: '#00f5ff',
          blue: '#4d7cff',
          purple: '#a855f7',
          orange: '#ff6b35',
        }
      },
      fontFamily: {
        'display': ['Orbitron', 'sans-serif'],
        'body': ['Inter', 'sans-serif'],
        'mono': ['JetBrains Mono', 'monospace'],
      }
    }
  },
  plugins: [],
}
