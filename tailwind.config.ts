import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: "#FCFAF6",
          100: "#F7F3EB",
          200: "#EFE8DA",
          300: "#E2D7C1",
          400: "#CEBFA3",
          500: "#B8A585",
        },
        terracotta: {
          50: "#FFF5F0",
          100: "#FFE8DE",
          200: "#FFD0BE",
          300: "#FFAA8F",
          400: "#F97752",
          500: "#E05326",
          600: "#C43E15",
          700: "#9E2E0D",
          800: "#7C240B",
          900: "#551806",
        },
        charcoal: {
          50: "#F6F5F5",
          100: "#E8E7E5",
          200: "#CFCDCA",
          300: "#AFAAA4",
          400: "#7E7770",
          500: "#544E48",
          600: "#3E3833",
          700: "#2B2622",
          800: "#1E1A17",
          900: "#13100E",
        },
        honey: {
          50: "#FDF9EC",
          100: "#FAF1D0",
          200: "#F5E19F",
          300: "#EECF6C",
          400: "#E5BA3E",
          500: "#D3A11C",
          600: "#AA7C12",
          700: "#7F5A0D",
        },
      },
      fontFamily: {
        serif: ["Playfair Display", "Georgia", "Cambria", "Times New Roman", "serif"],
        sans: ["Plus Jakarta Sans", "Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        magazine: "0 10px 30px -5px rgba(27, 24, 21, 0.08), 0 4px 10px -2px rgba(27, 24, 21, 0.04)",
        magazineHover: "0 20px 40px -10px rgba(224, 83, 38, 0.15), 0 8px 16px -4px rgba(27, 24, 21, 0.06)",
        card: "0 2px 8px rgba(27, 24, 21, 0.04), 0 1px 2px rgba(27, 24, 21, 0.03)",
      },
    },
  },
  plugins: [],
};
export default config;

