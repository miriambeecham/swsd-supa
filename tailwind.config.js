/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#2C3E50', // Your actual navy color
        yellow: '#F1C40F', // Your actual yellow
        'accent-primary': '#20B2AA', // Confident Teal (assuming you chose this)
        'accent-light': '#E0F7F5', // Teal light version
        'accent-dark': '#1a9d96', // Darker teal for hover states
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
