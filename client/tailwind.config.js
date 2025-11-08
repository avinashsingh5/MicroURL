/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Logo-inspired color palette
        primary: {
          50: '#f3e8ff',
          100: '#e9d5ff',
          200: '#d8b4fe',
          300: '#c084fc',
          400: '#a855f7',
          500: '#9333ea', // Main purple
          600: '#7e22ce',
          700: '#6b21a8',
          800: '#581c87',
          900: '#4c1d95',
        },
        accent: {
          purple: '#9333ea',
          orange: '#f97316',
          blue: '#3b82f6',
          pink: '#ec4899',
          red: '#ef4444',
        },
        dark: {
          bg: '#0a0a0a',
          surface: '#1a1a1a',
          card: '#242424',
          border: '#333333',
          text: '#e5e5e5',
          'text-muted': '#a3a3a3',
        }
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #9333ea 0%, #3b82f6 50%, #f97316 100%)',
        'gradient-primary-dark': 'linear-gradient(135deg, #581c87 0%, #1e40af 50%, #c2410c 100%)',
        'gradient-card': 'linear-gradient(135deg, rgba(147, 51, 234, 0.1) 0%, rgba(59, 130, 246, 0.1) 50%, rgba(249, 115, 22, 0.1) 100%)',
        'gradient-card-dark': 'linear-gradient(135deg, rgba(147, 51, 234, 0.2) 0%, rgba(59, 130, 246, 0.2) 50%, rgba(249, 115, 22, 0.2) 100%)',
      },
      boxShadow: {
        'glow-purple': '0 0 20px rgba(147, 51, 234, 0.3)',
        'glow-orange': '0 0 20px rgba(249, 115, 22, 0.3)',
        'glow-blue': '0 0 20px rgba(59, 130, 246, 0.3)',
        'glow-pink': '0 0 20px rgba(236, 72, 153, 0.3)',
      }
    },
  },
  plugins: [],
}

