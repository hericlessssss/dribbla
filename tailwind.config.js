/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        gray: {
          900: '#121212',
          800: '#1E1E1E',
          700: '#2D2D2D',
          600: '#3D3D3D',
          500: '#4D4D4D',
          400: '#6B6B6B',
          300: '#858585',
          200: '#9E9E9E',
          100: '#B8B8B8',
        },
        green: {
          900: '#064E3B',
          800: '#065F46',
          700: '#047857',
          600: '#059669',
          500: '#10B981',
          400: '#34D399',
          300: '#6EE7B7',
          200: '#A7F3D0',
          100: '#D1FAE5',
        },
      },
    },
  },
  plugins: [],
};