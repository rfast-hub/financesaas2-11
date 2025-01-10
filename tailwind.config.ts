import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "#141413",
        foreground: "#FAFAF8",
        primary: {
          DEFAULT: "#8989DE",
          foreground: "#FAFAF8",
          hover: "#9B9BE5",
        },
        secondary: {
          DEFAULT: "#3A3935",
          foreground: "#FAFAF8",
          hover: "#4A4945",
        },
        success: {
          DEFAULT: "#7EBF8E",
          foreground: "#FAFAF8",
          hover: "#8ECF9E",
        },
        warning: {
          DEFAULT: "#D2886F",
          foreground: "#FAFAF8",
          hover: "#E2987F",
        },
        muted: {
          DEFAULT: "#605F5B",
          foreground: "#E6E4DD",
          hover: "#706F6B",
        },
        accent: {
          DEFAULT: "#8989DE",
          foreground: "#FAFAF8",
          hover: "#9B9BE5",
        },
      },
      borderRadius: {
        lg: "1rem",
        md: "0.75rem",
        sm: "0.5rem",
      },
      animation: {
        "fade-in": "fade-in 0.5s ease-out",
        "slide-up": "slide-up 0.5s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        "slide-in-right": "slide-in-right 0.3s ease-out",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-up": {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "scale-in": {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;