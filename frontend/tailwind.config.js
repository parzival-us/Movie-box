/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        ink: "#07090d",
        panel: "#10151f",
        ember: "#f7b955",
        mint: "#40d9a4",
        coral: "#ff6f61",
      },
      boxShadow: {
        glow: "0 24px 80px rgba(64, 217, 164, 0.12)",
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
