import type { Config } from "tailwindcss";
import baseConfig from "@permitpro/config/tailwind.base";

const config: Config = {
  presets: [baseConfig],
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui-web/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: "#E8EDF5",
          100: "#C5D0E5",
          200: "#9BAFD0",
          300: "#718EBB",
          400: "#5175AB",
          500: "#315C9B",
          600: "#2C5493",
          700: "#254A89",
          800: "#1E407F",
          900: "#0F2044",
          950: "#091530",
        },
        amber: {
          50: "#FFFBEB",
          100: "#FEF3C7",
          200: "#FDE68A",
          300: "#FCD34D",
          400: "#FBBF24",
          500: "#F59E0B",
          600: "#D97706",
          700: "#B45309",
          800: "#92400E",
          900: "#78350F",
          950: "#451A03",
        },
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        sans: ["DM Sans", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
  ],
};

export default config;
