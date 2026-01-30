/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Theme-aware colors using CSS variables
        'np-bg-primary': 'var(--bg-primary)',
        'np-bg-secondary': 'var(--bg-secondary)',
        'np-bg-tertiary': 'var(--bg-tertiary)',
        'np-bg-hover': 'var(--bg-hover)',
        'np-text-primary': 'var(--text-primary)',
        'np-text-secondary': 'var(--text-secondary)',
        'np-border': 'var(--border-color)',
        'np-selection': 'var(--selection-bg)',
        'np-scrollbar': 'var(--scrollbar-thumb)',
        // Accent colors
        'np-blue': 'var(--accent-blue)',
        'np-light-blue': 'var(--accent-light-blue)',
        'np-green': 'var(--accent-green)',
        'np-orange': 'var(--accent-orange)',
        'np-purple': 'var(--accent-purple)',
        'np-yellow': 'var(--accent-yellow)',
        'np-cyan': 'var(--accent-cyan)',
        // Status colors
        'np-success': 'var(--success)',
        'np-warning': 'var(--warning)',
        'np-error': 'var(--error)',
        'np-info': 'var(--info)',
      },
      fontFamily: {
        'mono': 'var(--font-family)',
      },
      fontSize: {
        'xs': '11px',
        'sm': '12px',
        'base': '13px',
        'lg': '14px',
        'xl': '16px',
      },
      animation: {
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translate(-50%, 100%)', opacity: '0' },
          '100%': { transform: 'translate(-50%, 0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
