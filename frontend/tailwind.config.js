// frontend/tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-green': '#00291B',         // Your dark green
        'brand-yellow': '#E0C651',        // Your golden yellow accent
        'brand-cream': '#FFF3D6',         // Your light cream for backgrounds/cards
        'brand-text-on-dark': '#F0F0F0',  // A light gray/off-white for text on dark green
        'brand-text-on-light': '#303030', // A dark gray for text on cream/white
      },
      fontFamily: {
        // You can add custom fonts here if you have them
        // For now, we'll use Tailwind's default sans-serif which is quite clean
        sans: ['ui-sans-serif', 'system-ui', /* ...other sans-serif fallbacks */],
      },
    },
  },
  plugins: [],
}