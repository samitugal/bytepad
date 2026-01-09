/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Notepad++ Dark Theme
        'np-bg-primary': '#1E1E1E',
        'np-bg-secondary': '#252526',
        'np-bg-tertiary': '#2D2D30',
        'np-bg-hover': '#094771',
        'np-text-primary': '#D4D4D4',
        'np-text-secondary': '#808080',
        'np-border': '#3C3C3C',
        'np-selection': '#264F78',
        'np-scrollbar': '#424242',
        // Accent colors (syntax highlighting inspired)
        'np-blue': '#569CD6',
        'np-light-blue': '#9CDCFE',
        'np-green': '#6A9955',
        'np-orange': '#CE9178',
        'np-purple': '#C586C0',
        'np-yellow': '#DCDCAA',
        'np-cyan': '#4EC9B0',
        // Status colors
        'np-success': '#4EC9B0',
        'np-warning': '#CE9178',
        'np-error': '#F14C4C',
        'np-info': '#3794FF',
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'Consolas', 'Monaco', 'monospace'],
      },
      fontSize: {
        'xs': '11px',
        'sm': '12px',
        'base': '13px',
        'lg': '14px',
        'xl': '16px',
      },
    },
  },
  plugins: [],
}
