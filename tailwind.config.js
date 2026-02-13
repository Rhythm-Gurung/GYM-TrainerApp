/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        'background': '#FBFBFB',
        'primary-btn': '#73C2FB',
        'tab-active': '#547792',
        'gray-light': '#AAAAAA',
        'status-new': '#22C55E',
        'status-updated': '#F97316',
        'status-cancelled': '#EF4444',



      },
    },
  },
  plugins: [],
};
