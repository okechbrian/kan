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
        navy: {
          DEFAULT: "#070D35",
          light: "#11194D",
          muted: "#1B245C",
        },
        teal: {
          DEFAULT: "#42DFD1",
          dark: "#29C4B6",
          soft: "#E6FAF8",
        },
        guava: {
          DEFAULT: "#FF806B",
          dark: "#E66752",
          soft: "#FFF0ED",
        },
        softwhite: "#FAFAFF",
        // Legacy aliases mapped cleanly to Kan Brand Guidelines v1.0
        ink: "#070D35",
        cream: "#FAFAFF",
        kan: {
          DEFAULT: "#070D35",
          dark: "#11194D",
          soft: "#E6FAF8",
        },
        sun: "#FF806B",
      },
      fontFamily: {
        sans: ["var(--font-noto-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
