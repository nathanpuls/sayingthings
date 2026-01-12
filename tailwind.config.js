/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-primary)', 'sans-serif'],
      },
      colors: {
        // Extending default colors if needed, but primary is defined in CSS vars or can be mapped here.
        // User asked for specific primary. Mapping it to a tailwind class 'primary' is often useful.
        primary: 'var(--theme-primary)',
      },
    },
  },
  plugins: [],
}
