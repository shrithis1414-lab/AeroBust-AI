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
        meteo: {
          dark: '#080d1a',
          card: '#0e1626',
          panel: '#131d31',
          border: '#1e2d48',
          subtle: '#18243a',
          accent: '#0ea5e9',
          danger: '#f43f5e',
          warning: '#f59e0b',
          success: '#10b981',
          purple: '#8b5cf6'
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        heading: ['Space Grotesk', 'Plus Jakarta Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Menlo', 'monospace'],
      }
    },
  },
  plugins: [],
}
