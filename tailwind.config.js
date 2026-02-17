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
          bg: '#0f172a',
          panel: '#1e293b',
          border: '#334155',
          text: '#f8fafc',
          muted: '#94a3b8'
        },
        phase: {
          architecture: '#06b6d4',
          design: '#ec4899'
        },
        status: {
          active: '#22c55e',
          working: '#3b82f6',
          error: '#ef4444',
          idle: '#64748b',
          complete: '#22c55e'
        },
        slate: {
          750: '#27354f'
        }
      },
      animation: {
        'pulse-cyan': 'pulse-cyan 2s ease-in-out infinite',
        'failed-glow': 'failed-glow 3s ease-in-out infinite'
      },
      keyframes: {
        'pulse-cyan': {
          '0%, 100%': {
            boxShadow: '0 0 0 0 rgba(6, 182, 212, 0.4), inset 0 0 0 0 rgba(6, 182, 212, 0)'
          },
          '50%': {
            boxShadow: '0 0 0 6px rgba(6, 182, 212, 0), inset 0 0 8px rgba(6, 182, 212, 0.1)'
          }
        },
        'failed-glow': {
          '0%, 100%': {
            boxShadow: '0 0 6px rgba(239, 68, 68, 0.2), inset 0 0 4px rgba(239, 68, 68, 0.1)'
          },
          '50%': {
            boxShadow: '0 0 12px rgba(239, 68, 68, 0.3), inset 0 0 6px rgba(239, 68, 68, 0.15)'
          }
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
