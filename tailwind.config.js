/** @type {import('tailwindcss').Config} */

module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}", // 👈 For Next.js 13+ (App Router)
    "./pages/**/*.{js,ts,jsx,tsx}", // 👈 For Next.js (Pages Router)
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
