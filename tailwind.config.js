/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // Nunito Sans is loaded from Google Fonts in index.html. The tail of
      // this list is Tailwind's own default sans stack, including the emoji
      // families — those must stay, or emoji used in the UI (✅ ⚠️ 📧 ✓)
      // lose their dedicated font on Windows.
      fontFamily: {
        sans: [
          '"Nunito Sans"',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
          '"Apple Color Emoji"',
          '"Segoe UI Emoji"',
          '"Segoe UI Symbol"',
          '"Noto Color Emoji"',
        ],
      },
      // Single source of truth for brand colors. Tailwind generates the
      // bg-/text-/border- utilities from these — don't redefine them in CSS.
      colors: {
        navy: '#2C3E50',
        // Note: `yellow` is a single brand color, not a scale. Defining it
        // this way intentionally replaces Tailwind's default yellow palette,
        // so yellow-50/100/400/... do not exist. Use `yellow` on its own.
        yellow: '#F1C40F',
        'accent-primary': '#20B2AA', // Confident Teal
        'accent-light': '#E0F7F5',
        'accent-dark': '#1a9d96', // hover states
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
