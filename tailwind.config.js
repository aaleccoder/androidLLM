/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}", "./screens/**/*.{js,jsx,ts,tsx}"], // Adjusted content paths
    presets: [require("nativewind/preset")],
    theme: {
      extend: {
        colors: {
          'text': 'oklch(94.12% 0.026 290.74)',
          'background': 'oklch(40.54% 0.000 89.88)',
          'primary': 'oklch(23.50% 0.000 89.88)',
          'secondary': 'oklch(16.38% 0.000 89.88)',
          'accent': 'oklch(71.85% 0.119 154.43)',
         },
         
      },
    },
    plugins: [],
}