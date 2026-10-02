/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        aviation: {
          900: '#070C18',
          850: '#0B1329',
          800: '#111C38',
          700: '#1A294D',
          600: '#263B69',
          500: '#35518F',
          sky: '#00A8E8',
          cyan: '#00B4D8',
          accent: '#38BDF8',
          gold: '#F59E0B',
          alert: '#EF4444',
          success: '#10B981'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace']
      }
    },
  },
  plugins: [],
}
