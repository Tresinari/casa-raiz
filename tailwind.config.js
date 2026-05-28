/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        cream:    '#F5F0E8',
        linen:    '#D4C9B0',
        bark:     '#5C4A2A',
        forest:   '#2D4A2A',
        'forest-mid': '#4A7A44',
        gold:     '#B8922A',
        'gold-light': '#D4AE5A',
        'text-dark':  '#2A2218',
        'text-mid':   '#5C4E38',
        'text-light': '#8A7A60',
        'off-white':  '#FDFAF5',
      },
      fontFamily: {
        serif: ['var(--font-cormorant)', 'Georgia', 'serif'],
        sans:  ['var(--font-jost)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
