/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        // Dark theme colors matching the old UI
        dark: {
          main: '#1a1a1f',
          card: '#242429',
          hover: '#2e2e35',
          border: '#3a3a42',
        },
        text: {
          primary: '#f5f5f5',
          secondary: '#a0a0a8',
          muted: '#6b6b75',
        },
        accent: {
          blue: '#4a9eff',
          pink: '#ff7eb3',
          purple: '#a78bfa',
        },
        quadrant: {
          do: '#2d4a3e',
          schedule: '#3d4a2d',
          delegate: '#4a3d2d',
          eliminate: '#4a2d3d',
        },
        // Keep primary for button states
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#4a9eff',
          600: '#4a9eff',
          700: '#3b8bef',
          800: '#2a6dcf',
          900: '#1e4a8f',
        }
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['DM Serif Display', 'serif'],
      },
    },
  },
  plugins: [],
}
