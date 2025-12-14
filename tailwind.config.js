/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // Enable class-based dark mode
  content: ['./src/**/*.{html,js,ts,jsx,tsx}'], // Adjust based on your project structure
  theme: {
    extend: {
      animation: {
        spin: "spin 1.2s ease-in-out infinite",
        marquee: "marquee 30s linear infinite",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" }, // only 50% because you're duplicating the items
        },
      },
      colors: {
        primary: {
          DEFAULT: '#FFA602', // Base color
          50: '#FFF8E6', // Very light
          100: '#FFECB3',
          200: '#FFDF80',
          300: '#FFD24D',
          400: '#FFC51A',
          500: '#FFA602', // Matches your base color
          600: '#CC8502',
          700: '#996402',
          800: '#664301',
          900: '#332201', // Very dark
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};