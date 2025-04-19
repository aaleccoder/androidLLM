/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}", "./screens/**/*.{js,jsx,ts,tsx}"],
    presets: [require("nativewind/preset")],
    theme: {
      extend: {
        fontFamily: {
          sans: ['Poppins'],
          medium: ['Poppins-Medium'],
          bold: ['Poppins-Bold'],
        },
        colors: {
          'text': '#EBE9FC',
          'background': '#1E1E1E',
          'primary': '#181818',
          'secondary': '#1E1E1E',
          'accent': '#61BA82',
         },
      },
    },
    plugins: [],
}