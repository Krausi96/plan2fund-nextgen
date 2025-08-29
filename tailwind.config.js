/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.25rem",
      screens: { "2xl": "1200px" },
    },
    extend: {
      colors: {
        brand: {
          50: "#f2f8ff",
          100: "#e6f0ff",
          200: "#cfe3ff",
          300: "#b7d4ff",
          400: "#7bc4ff",
          500: "#4da3ff",
          600: "#2b7fe6",
          700: "#1f5fb4",
          800: "#1b3a5e",
          900: "#0f2336",
        },
        accent: {
          pink: "#ff85b3",
          purple: "#9f7cff",
          teal: "#7bc4ff",
        },
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
      },
      boxShadow: {
        soft: "0 10px 30px -15px rgba(12, 30, 66, 0.25)",
        glow: "0 0 0 6px rgba(125, 172, 255, 0.15)",
      },
      backgroundImage: {
        "hero-gradient": "linear-gradient(135deg, #7bc4ff 0%, #9f7cff 100%)",
        "orb-blue": "radial-gradient(closest-side, rgba(123,196,255,0.55), rgba(123,196,255,0) 70%)",
        "orb-pink": "radial-gradient(closest-side, rgba(255,133,179,0.5), rgba(255,133,179,0) 70%)",
        "orb-purple": "radial-gradient(closest-side, rgba(159,124,255,0.5), rgba(159,124,255,0) 70%)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "200% 50%" },
        },
        blink: {
          "0%, 49%": { opacity: "1" },
          "50%, 100%": { opacity: "0" },
        },
      },
      animation: {
        float: "float 8s ease-in-out infinite",
        blink: "blink 1.1s steps(1) infinite",
        shimmer: "shimmer 2.5s linear infinite",
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: "75ch",
          },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
