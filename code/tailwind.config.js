/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mission: {
          bg: '#0a0a0f',
          panel: '#13131f',
          border: '#1e1e2e',
          text: '#e0e0ff',
          muted: '#6b6b8a'
        },
        status: {
          active: '#00ff88',
          working: '#ffcc00',
          error: '#ff3366',
          idle: '#6b6b8a',
          complete: '#00ccff'
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
        sans: ['Inter', 'sans-serif']
      }
    },
  },
  plugins: [],
}
