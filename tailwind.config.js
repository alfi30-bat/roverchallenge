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
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#f8fafc',
          950: '#ffffff',
        },
        'gray': {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#334155', // slate-700 for text contrast in white mode
          400: '#475569', // slate-600
          500: '#64748b', // slate-500
          600: '#334155',
          700: '#1e293b',
          800: '#0f172a',
          900: '#020617',
        },
        'neon': {
          cyan: '#2563eb',
          blue: '#1d4ed8',
          purple: '#6d28d9',
          orange: '#ea580c',
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
