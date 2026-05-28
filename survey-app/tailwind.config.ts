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
        duo: {
          green: "#58cc02",
          "green-light": "#d7ffb8",
          blue: "#1cb0f6",
          yellow: "#ffc700",
          purple: "#a570ff",
          pink: "#cc348d",
          gray: "#e5e5e5",
          graphite: "#777777",
          charcoal: "#4b4b4b",
          black: "#3c3c3c",
          silver: "#afafaf",
        },
        // DESIGN.md flat token aliases
        "cloud-gray": "#e5e5e5",
        "almost-black": "#3c3c3c",
        graphite: "#777777",
        charcoal: "#4b4b4b",
        silver: "#afafaf",
        "sky-blue": "#1cb0f6",
        "sunshine-yellow": "#ffc700",
        "grape-soda": "#a570ff",
        "bubblegum-pink": "#cc348d",
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        sidebar: {
          DEFAULT: "var(--sidebar)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },
        brand: {
          50: '#fef7f4',
          100: '#fdeee8',
          200: '#fad9cc',
          300: '#f5bda5',
          400: '#ee9670',
          500: '#e67348',
          600: '#d45a30',
          700: '#b04626',
          800: '#8f3a23',
          900: '#753321',
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        outfit: ["var(--font-outfit)", "ui-sans-serif", "system-ui", "sans-serif"],
        fredoka: ["var(--font-fredoka)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-subtle': 'pulse-subtle 4s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-subtle': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(0.98)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
