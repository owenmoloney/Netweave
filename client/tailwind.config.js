/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#070B14',
        surface: '#0F172A',
        'surface-elevated': '#1E293B',
        accent: '#7C6DEB',
        'accent-secondary': '#38BDF8',
        'text-primary': '#F1F5F9',
        'text-muted': '#64748B',
        danger: '#EF4444',
        success: '#22C55E',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
