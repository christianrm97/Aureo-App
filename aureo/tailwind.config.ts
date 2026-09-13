import type { Config } from 'tailwindcss'

const config: Config = {
  // Sin components/ aqui, Tailwind no genera las clases que solo se usan alli:
  // el bottom sheet se quedaba sin overflow-y-auto y el pop-up sin z-index ni
  // centrado, asi que salia el fondo translucido y el mensaje detras.
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './lib/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'aureo-bg':          '#F4F1F7',
        'aureo-surface':     '#FFFFFF',
        'aureo-surface-2':   '#FAF8FC',
        'aureo-border':      '#ECE7F1',
        'aureo-purple':      '#6C2BD9',
        'aureo-purple-dark': '#4A1D9E',
        'aureo-purple-soft': '#EFE7FB',
        'aureo-purple-mid':  '#8B5CF6',
        'aureo-text':        '#14101B',
        'aureo-text-dim':    '#6B647A',
        'aureo-text-mute':   '#9A93A8',
        'aureo-green':       '#22C55E',
        'aureo-red':         '#EF4444',
        'aureo-blue':        '#3B82F6',
        'aureo-amber':       '#F59E0B',
        'aureo-pink':        '#EC4899',
        'aureo-teal':        '#14B8A6',
      },
      borderRadius: {
        'aureo':    '24px',
        'aureo-lg': '28px',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
