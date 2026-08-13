import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'aureo-bg':       '#0a0a0f',
        'aureo-surface':  '#111118',
        'aureo-surface2': '#1a1a24',
        'aureo-border':   'rgba(255,255,255,0.07)',
        'aureo-text':     '#f5f5f7',
        'aureo-muted':    '#8e8ea0',
        'aureo-green':    '#00c896',
        'aureo-red':      '#ff4d6a',
        'aureo-blue':     '#4a9eff',
        'aureo-yellow':   '#ffc542',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'aire': '16px',
        'aureo-sm': '10px',
      },
      animation: {
        'slide-up':    'slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-in':     'fade-in 0.3s ease forwards',
        'pulse-green': 'pulse-green 2s ease-in-out infinite',
      },
      keyframes: {
        'slide-up': {
          from: { transform: 'translateY(20px)', opacity: '0' },
          to:   { transform: 'translateY(0)',     opacity: '1' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        'pulse-green': {
          '0%, 100%': { opacity: '1' },
          '50%':       { opacity: '0.65' },
        },
      },
    },
  },
  plugins: [],
}
export default config
