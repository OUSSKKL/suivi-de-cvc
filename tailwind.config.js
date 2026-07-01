/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        ink: {
          900: "#0c0e10", // fond principal
          850: "#101316",
          800: "#15191c", // surfaces / cartes
          750: "#1a1f23", // surfaces survolées
          700: "#272d32", // bordures
          600: "#3a4147", // bordures fortes
        },
        accent: {
          DEFAULT: "#2b7fff",
          soft: "#5a9eff",
          deep: "#1565e0",
        },
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(43, 127, 255,0.25), 0 8px 24px -8px rgba(43, 127, 255,0.35)",
        card: "0 1px 2px rgba(0,0,0,0.4), 0 8px 24px -16px rgba(0,0,0,0.8)",
        lift: "0 4px 12px -2px rgba(0,0,0,0.5), 0 12px 32px -12px rgba(0,0,0,0.7)",
      },
      backgroundImage: {
        "accent-gradient": "linear-gradient(135deg, #5a9eff 0%, #2b7fff 45%, #1565e0 100%)",
        "surface-gradient": "linear-gradient(160deg, #181d21 0%, #14181b 100%)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translate(-50%, 12px)" },
          "100%": { opacity: "1", transform: "translate(-50%, 0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.35s ease-out both",
        "slide-up": "slide-up 0.25s ease-out both",
        "scale-in": "scale-in 0.2s ease-out both",
      },
    },
  },
  plugins: [],
};
