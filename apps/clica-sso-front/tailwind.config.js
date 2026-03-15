/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'inter': ['Inter', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        'google-blue': '#1a73e8',
        'google-blue-hover': '#1557b2',
        'google-green': '#34a853',
        'google-red': '#ea4335',
        'google-yellow': '#fbbc04',
        'google-orange': '#ff6b35',
        'google-purple': '#9c27b0',
        'google-gray-50': '#fafbfc',
        'google-gray-100': '#f8f9fa',
        'google-gray-200': '#f1f3f4',
        'google-gray-300': '#dadce0',
        'google-gray-400': '#c1c7cd',
        'google-gray-500': '#9aa0a6',
        'google-gray-600': '#5f6368',
        'google-gray-700': '#3c4043',
        'google-gray-900': '#202124',
      },
      maxWidth: {
        'dashboard': '1500px',
      },
      animation: {
        'fadeIn': 'fadeIn 0.3s ease-in-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        }
      },
    },
  },
  plugins: [],
}
