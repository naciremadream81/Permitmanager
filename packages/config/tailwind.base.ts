import type { Config } from "tailwindcss";

const baseConfig: Config = {
  content: [],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
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
        surface: {
          primary: "var(--surface-primary)",
          secondary: "var(--surface-secondary)",
          tertiary: "var(--surface-tertiary)",
        },
        content: {
          primary: "var(--content-primary)",
          secondary: "var(--content-secondary)",
          tertiary: "var(--content-tertiary)",
        },
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        sans: ["DM Sans", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      fontSize: {
        "display-lg": ["3.5rem", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        "display-md": ["2.5rem", { lineHeight: "1.2", letterSpacing: "-0.01em" }],
        "display-sm": ["2rem", { lineHeight: "1.2", letterSpacing: "-0.01em" }],
        "heading-lg": ["1.5rem", { lineHeight: "1.3", letterSpacing: "-0.005em" }],
        "heading-md": ["1.25rem", { lineHeight: "1.4" }],
        "heading-sm": ["1.125rem", { lineHeight: "1.4" }],
        "body-lg": ["1.125rem", { lineHeight: "1.6" }],
        "body-md": ["1rem", { lineHeight: "1.6" }],
        "body-sm": ["0.875rem", { lineHeight: "1.5" }],
        "caption": ["0.75rem", { lineHeight: "1.4" }],
      },
      borderRadius: {
        "brand-sm": "0.375rem",
        "brand-md": "0.5rem",
        "brand-lg": "0.75rem",
        "brand-xl": "1rem",
      },
      boxShadow: {
        "brand-sm": "0 1px 2px 0 rgb(15 32 68 / 0.05)",
        "brand-md": "0 4px 6px -1px rgb(15 32 68 / 0.07), 0 2px 4px -2px rgb(15 32 68 / 0.05)",
        "brand-lg": "0 10px 15px -3px rgb(15 32 68 / 0.08), 0 4px 6px -4px rgb(15 32 68 / 0.04)",
        "brand-xl": "0 20px 25px -5px rgb(15 32 68 / 0.1), 0 8px 10px -6px rgb(15 32 68 / 0.06)",
      },
      spacing: {
        "18": "4.5rem",
        "88": "22rem",
        "128": "32rem",
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "slide-down": "slideDown 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideDown: {
          "0%": { transform: "translateY(-10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default baseConfig;
