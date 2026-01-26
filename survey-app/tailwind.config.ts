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
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Professional warm palette inspired by DataFast
        brand: {
          50: '#fef7f4',
          100: '#fdeee8',
          200: '#fad9cc',
          300: '#f5bda5',
          400: '#ee9670',
          500: '#e67348',  // Primary brand color - warm coral
          600: '#d45a30',
          700: '#b04626',
          800: '#8f3a23',
          900: '#753321',
        },
        neutral: {
          50: '#fafaf9',
          100: '#f5f5f4',
          200: '#e7e5e4',
          300: '#d6d3d1',
          400: '#a8a29e',
          500: '#78716c',
          600: '#57534e',
          700: '#44403c',
          800: '#292524',
          900: '#1c1917',
        },
      },
    },
  },
  plugins: [],
};
export default config;
