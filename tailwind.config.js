/** @type {import('tailwindcss').Config} */
module.exports = {
    // NOTE: Update this to include the paths to all of your component files.
    content: ["./app/**/*.{js,jsx,ts,tsx}"],
    presets: [require("nativewind/preset")],
    theme: {
      extend: {
        colors: {
          primary: "#1E3A8A", // Example color
          secondary: "#FBBF24", // Example color
        },
      },
    },
    plugins: [],
  }