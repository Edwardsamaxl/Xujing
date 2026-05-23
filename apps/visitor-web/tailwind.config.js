/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: '#F7F4ED',
        'paper-deep': '#EFEBE1',
        ink: '#2B2926',
        'ink-dim': '#6B6860',
        'ink-faint': '#A09B90',
        cinnabar: '#A32626',
        'cinnabar-light': '#F5E3E3',
        'cinnabar-glow': 'rgba(163,38,38,0.12)',
        gold: '#B8923A',
        'gold-dim': 'rgba(184,146,58,0.10)',
        'gold-glow': 'rgba(184,146,58,0.15)',
        'scroll-line': '#D4CFC3',
        'scroll-line-dark': '#C9C4B8',
      },
      fontFamily: {
        display: ['LXGW WenKai', 'PingFang SC', 'Noto Sans SC', 'sans-serif'],
        body: ['PingFang SC', 'Noto Sans SC', 'sans-serif'],
        serif: ['Cormorant Garamond', 'LXGW WenKai', 'serif'],
      },
      transitionDuration: {
        400: '400ms',
        600: '600ms',
        800: '800ms',
      },
      animation: {
        'seal-stamp': 'sealStamp 500ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'scroll-unfold': 'scrollUnfold 800ms ease-out forwards',
        'ink-bleed': 'inkBleed 1200ms ease-out forwards',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s ease-in-out infinite',
      },
      keyframes: {
        sealStamp: {
          '0%': { transform: 'scale(1.8) rotate(-12deg)', opacity: '0' },
          '60%': { transform: 'scale(0.9) rotate(2deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(0deg)', opacity: '1' },
        },
        scrollUnfold: {
          '0%': { clipPath: 'inset(0 50% 0 50%)', opacity: '0' },
          '100%': { clipPath: 'inset(0 0% 0 0%)', opacity: '1' },
        },
        inkBleed: {
          '0%': { opacity: '0', filter: 'blur(8px)' },
          '100%': { opacity: '1', filter: 'blur(0px)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}
