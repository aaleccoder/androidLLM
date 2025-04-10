/** @type {import('tailwindcss').Config} */
module.exports = {
    // NOTE: Update this to include the paths to all of your component files.
    content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
    presets: [require("nativewind/preset")],
    theme: {
      extend: {
        colors: {
          primary: {
            DEFAULT: "#2563eb", // Blue color for primary elements
            light: "#3b82f6",
            dark: "#1d4ed8",
          },
          secondary: {
            DEFAULT: "#8b5cf6", // Purple for secondary elements
            light: "#a78bfa", 
            dark: "#7c3aed",
          },
          neutral: {
            50: "#f9fafb",
            100: "#f3f4f6",
            200: "#e5e7eb",
            300: "#d1d5db",
            400: "#9ca3af",
            500: "#6b7280",
            600: "#4b5563",
            700: "#374151",
            800: "#1f2937",
            900: "#111827",
            950: "#030712",
          },
          user: {
            bubble: "#2563eb", // User message bubble color
            text: "#ffffff",   // User message text color
          },
          assistant: {
            bubble: "#f3f4f6", // Light mode assistant bubble
            bubbleDark: "#1f2937", // Dark mode assistant bubble
            text: "#030712",   // Light mode assistant text
            textDark: "#f9fafb", // Dark mode assistant text
          },
          success: "#10b981",
          warning: "#f59e0b",
          error: "#ef4444",
        },
        fontFamily: {
          sans: ["Inter_400Regular", "Helvetica", "Arial", "sans-serif"],
        },
        borderRadius: {
          'message': '1.25rem',
        }
      },
    },
    plugins: [],
  }