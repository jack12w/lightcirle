/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './**/*.html',
    './js/**/*.js',
    './admin/**/*.html',
    './admin/**/*.js',
    '!./node_modules/**',
    '!./uploads/**',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Colors are driven by CSS variables (set in css/style.css from SITE_CONFIG)
        // so the admin panel can swap brand colors at runtime without a rebuild.
        primary: {
          DEFAULT: 'rgb(var(--tc-primary) / <alpha-value>)',
          light: 'rgb(var(--tc-primary-light) / <alpha-value>)',
          dark: 'rgb(var(--tc-primary-dark) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--tc-accent) / <alpha-value>)',
          light: 'rgb(var(--tc-accent-light) / <alpha-value>)',
          dark: 'rgb(var(--tc-accent-dark) / <alpha-value>)',
        },
        whatsapp: 'rgb(var(--tc-whatsapp) / <alpha-value>)',
        cream: 'rgb(var(--tc-cream) / <alpha-value>)',
        darkbg: 'rgb(var(--tc-darkbg) / <alpha-value>)',
        darksurface: 'rgb(var(--tc-darksurface) / <alpha-value>)',
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Playfair Display"', 'serif'],
      },
    },
  },
  plugins: [],
};
