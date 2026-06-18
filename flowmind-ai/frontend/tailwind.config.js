/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: { deep: '#050816', panel: '#0F172A', card: '#131C35', elevated: '#1A2644' },
        border: { DEFAULT: 'rgba(59,130,246,0.15)', bright: 'rgba(59,130,246,0.35)' },
        accent: { blue: '#3B82F6', cyan: '#06B6D4', green: '#10B981', amber: '#F59E0B', red: '#EF4444', orange: '#F97316', purple: '#8B5CF6' },
        text: { primary: '#F1F5F9', secondary: '#94A3B8', muted: '#475569' },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
