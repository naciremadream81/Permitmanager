/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0F2044',
          50: '#E8ECF4',
          100: '#C5CFE4',
          200: '#8FA0C7',
          300: '#5A71AA',
          400: '#2D4D8C',
          500: '#0F2044',
          600: '#0B1A38',
          700: '#07132C',
          800: '#040D20',
          900: '#020814',
        },
        amber: {
          DEFAULT: '#F59E0B',
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        },
      },
    },
  },
  plugins: [],
};
