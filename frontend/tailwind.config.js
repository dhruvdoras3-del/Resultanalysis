/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: '#030712', // zinc-950
          card: 'rgba(17, 24, 39, 0.7)', // glassmorphic gray-900/70
          border: 'rgba(56, 189, 248, 0.2)', // translucent cyan-400
          text: '#f3f4f6', // gray-100
          muted: '#9ca3af', // gray-400
          primary: '#38bdf8', // cyan-400
          secondary: '#a855f7', // purple-500
          accent: '#ec4899', // pink-500
          success: '#10b981', // emerald-500
          warning: '#f59e0b', // amber-500
          danger: '#ef4444', // red-500
        }
      },
      boxShadow: {
        'glow-cyan': '0 0 15px rgba(56, 189, 248, 0.3)',
        'glow-purple': '0 0 15px rgba(168, 85, 247, 0.3)',
        'glow-emerald': '0 0 15px rgba(16, 185, 129, 0.3)',
        'glow-rose': '0 0 15px rgba(239, 68, 68, 0.3)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      backgroundImage: {
        'cyber-grid': "radial-gradient(circle, rgba(56, 189, 248, 0.05) 1px, transparent 1px)",
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s infinite alternate',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%': { boxShadow: '0 0 5px rgba(56, 189, 248, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(56, 189, 248, 0.6)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        }
      }
    },
  },
  plugins: [],
}
