import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: [
    "./components/**/*.{vue,js,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./plugins/**/*.{js,ts}",
    "./nuxt.config.{js,ts}",
    "./app.vue",
    "./src/**/*.{vue,js,ts,jsx,tsx}", // Make sure your Vue components are included
  ],
  theme: {
    extend: {
      animation: {
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        shimmer: "shimmer 2s infinite linear",
      },
      keyframes: {
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
      },
      boxShadow: {
        glow: "0 0 8px rgba(16, 185, 129, 0.6)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
      },
      width: {
        "3": "0.75rem",
      },
      height: {
        "3": "0.75rem",
      },
    },
  },
  plugins: [],
} satisfies Config;
