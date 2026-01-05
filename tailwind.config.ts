import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      animation: {
        'float-coin': 'float-coin 4s infinite linear',
      },
      keyframes: {
        'float-coin': {
          '0%': {
            transform: 'translateY(0) translateX(0) rotate(0deg) scale(0.95)',
            opacity: '0',
            filter: 'drop-shadow(0 0 10px rgba(250,204,21,0.4))',
          },
          '20%': {
            opacity: '1',
          },
          '50%': {
            transform: 'translateY(-40px) translateX(6px) rotate(6deg) scale(1)',
            filter: 'drop-shadow(0 0 22px rgba(250,204,21,0.9))',
          },
          '80%': {
            transform: 'translateY(-70px) translateX(-6px) rotate(-6deg) scale(1.05)',
          },
          '100%': {
            transform: 'translateY(-95px) translateX(0) rotate(0deg) scale(1.08)',
            opacity: '0',
            filter: 'drop-shadow(0 0 30px rgba(250,204,21,1))',
          },
        },
      },
    },
  },
  plugins: [],
}

export default config
