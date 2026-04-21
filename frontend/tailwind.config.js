/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // A muted dark palette that works for the practice dashboard.
        bg: {
          DEFAULT: '#0f1115',
          elevated: '#161a22',
          panel: '#1d222c',
        },
        accent: {
          DEFAULT: '#f59e0b', // warm amber
          muted: '#b8860b',
        },
        text: {
          DEFAULT: '#e5e7eb',
          muted: '#9ca3af',
        },
      },
    },
  },
  plugins: [],
};
