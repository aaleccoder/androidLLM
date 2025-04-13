const { themeColors } = require('./utils/theme');

/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./App.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}", "./screens/**/*.{js,jsx,ts,tsx}"],
    presets: [require("nativewind/preset")],
    theme: {
      extend: {
        fontFamily: {
          sans: ["Inter_400Regular", "Helvetica", "Arial", "sans-serif"],
        },
        borderRadius: {
          'message': '1.5rem',
          'xl': '1rem',
          '2xl': '1.5rem',
          '3xl': '1.75rem',
          '4xl': '2rem',
        },
        colors: {
          ...themeColors.light,
          dark: themeColors.dark,
        }
      },
    },
    plugins: [],
}