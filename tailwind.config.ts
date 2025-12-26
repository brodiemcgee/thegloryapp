import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        hole: {
          bg: '#0a0a0a',
          surface: '#141414',
          border: '#262626',
          muted: '#737373',
          accent: '#ef4444',
          'accent-hover': '#dc2626',
        }
      },
      transitionDuration: {
        DEFAULT: '200ms',
      }
    },
  },
  plugins: [],
}
export default config
