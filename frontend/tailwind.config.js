/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        ink: "#000000",
        panel: "#0a0a0a",
        ember: "#a0a0a0",
        mint: "#ffffff",
        coral: "#ff4444",
      },
      boxShadow: {
        glow: "0 24px 80px rgba(255, 255, 255, 0.06)",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        fade: "fadeIn 240ms ease-out",
      },
    },
  },
  plugins: [],
}
