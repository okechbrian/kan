/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0b1f1a",
        kan: {
          DEFAULT: "#0e7c66",
          dark: "#095c4c",
          soft: "#e8f4ef",
        },
        cream: "#f8f7f2",
        sun: "#f4a261",
      },
    },
  },
  plugins: [],
};
