/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Hanken Grotesk", "Inter", "system-ui", "sans-serif"],
      },
      keyframes: {
        messageIn: {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "message-in": "messageIn 0.2s ease-out",
      },
    },
  },
  plugins: [],
};
