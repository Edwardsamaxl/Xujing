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
        'ink-light': '#6B6860',
        'ink-faint': '#A09B90',
        cinnabar: '#C13A3A',
        'cinnabar-light': '#F5E3E3',
        bamboo: '#5A7D5A',
        'bamboo-light': '#E8F0E8',
        gold: '#B8923A',
        'scroll-line': '#D4CFC3',
      },
      fontFamily: {
        display: ['LXGW WenKai', 'PingFang SC', 'Noto Sans SC', 'sans-serif'],
        body: ['PingFang SC', 'Noto Sans SC', 'sans-serif'],
      },
      transitionDuration: {
        400: '400ms',
      },
    },
  },
  plugins: [],
}
