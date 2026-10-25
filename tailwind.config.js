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
        brand: {
          50: '#F0F7FF',
          100: '#E8F3FF',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#38BDF8',
          500: '#0EA5E9',
          600: '#0878D1', // Primary Blue
          700: '#0667B2', // Primary Hover
          800: '#075985',
          900: '#0C4A6E',
          950: '#082F49',
        },
        primary: {
          DEFAULT: '#0878D1',
          hover: '#0667B2',
          light: '#E8F3FF',
        },
        corporate: {
          blue: '#0878D1',
          hover: '#0667B2',
          light: '#E8F3FF',
          secondary: '#2563EB',
          cyan: '#0891B2',
        },
        surface: {
          main: '#F5F7FB',
          secondary: '#EEF3F9',
          card: '#FFFFFF',
          interactive: '#F0F7FF',
          border: '#E2E8F0',
          activeBorder: '#BFDBFE',
        },
        themeText: {
          dark: '#172033',
          secondary: '#64748B',
          muted: '#94A3B8',
        },
        navy: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Noto Sans Arabic"',
          '"PingFang SC"',
          '"Microsoft YaHei"',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
}
