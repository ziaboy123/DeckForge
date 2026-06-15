import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          gold: "#f0c040",
          "gold-dark": "#c9a028",
          "gold-light": "#f5d060",
          blue: "#3b82f6",
          "blue-dark": "#2563eb",
        },
        bg: {
          base: "#080b12",
          surface: "#0f1420",
          card: "#151c2e",
          elevated: "#1e2740",
          hover: "#243050",
        },
        border: {
          DEFAULT: "#2a3554",
          subtle: "#1e2a45",
          strong: "#3d4f7a",
        },
        card: {
          normal: "#fde68a",
          effect: "#fb923c",
          ritual: "#93c5fd",
          fusion: "#a78bfa",
          synchro: "#e2e8f0",
          xyz: "#374151",
          pendulum: "#34d399",
          link: "#60a5fa",
          spell: "#34d399",
          trap: "#f472b6",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-brand":
          "linear-gradient(135deg, #f0c040 0%, #c9a028 100%)",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "slide-in-right": "slideInRight 0.3s ease-out",
        shimmer: "shimmer 2s infinite",
        float: "float 3s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(16px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
      boxShadow: {
        card: "0 4px 24px rgba(0,0,0,0.4)",
        "card-hover": "0 8px 40px rgba(0,0,0,0.6)",
        gold: "0 0 20px rgba(240,192,64,0.3)",
        "gold-strong": "0 0 40px rgba(240,192,64,0.5)",
        blue: "0 0 20px rgba(59,130,246,0.3)",
      },
    },
  },
  plugins: [],
};

export default config;
