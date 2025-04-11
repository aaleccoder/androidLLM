/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
    presets: [require("nativewind/preset")],
    theme: {
      extend: {
        colors: {
          primary: {
            DEFAULT: "#10a37f",
            light: "#34CAA7",
            dark: "#0B8161",
          },
          secondary: {
            DEFAULT: "#343541",
            light: "#4A4B5A", 
            dark: "#23242E",
          },
          neutral: {
            50: "#F8F9FA",  // Softer white
            100: "#F1F3F5",
            200: "#E9ECEF",
            300: "#DEE2E6",
            400: "#CED4DA",
            500: "#ADB5BD",
            600: "#868E96",
            700: "#495057",
            800: "#343A40",
            900: "#212529",
            950: "#121416",
          },
          user: {
            bubble: "#343541",
            text: "#FFFFFF",
          },
          assistant: {
            bubble: "#F8F9FA",     // Light but not pure white
            bubbleDark: "#444654", // Dark theme bubble
            text: "#212529",       // Darker text for better contrast
            textDark: "#E9ECEF",   // Light text for dark theme
          },
          success: "#40C057",      // Softer green
          warning: "#FCC419",      // Softer yellow
          error: "#FA5252",        // Softer red
          accent: {
            DEFAULT: "#228BE6",    // Softer blue
            light: "#4DABF7",
            dark: "#1971C2",
          },
        },
        fontFamily: {
          sans: ["Inter_400Regular", "Helvetica", "Arial", "sans-serif"],
        },
        borderRadius: {
          'message': '1.5rem',
          'xl': '1rem',
          '2xl': '1.5rem',
          '3xl': '1.75rem',
          '4xl': '2rem',
        }
      },
    },
    plugins: [],
}