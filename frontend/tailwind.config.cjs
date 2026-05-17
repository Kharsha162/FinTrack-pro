module.exports = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#e0f2ff",
          100: "#b3dbff",
          200: "#80c2ff",
          300: "#4da9ff",
          400: "#1a90ff",
          500: "#0077e6",
          600: "#005cb4",
          700: "#004182",
          800: "#002651",
          900: "#000b22"
        },
        accent: {
          500: "#10b981"
        }
      }
    }
  },
  plugins: []
};

