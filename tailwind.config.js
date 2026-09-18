/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // These resolve to CSS variables defined in src/index.css, which
        // are flipped by the `.light` class on <html> — so every existing
        // `bg-ink` / `text-paper` / `border-ink-border` utility already in
        // the app automatically follows the theme toggle with no per-
        // component changes.
        ink: {
          DEFAULT: 'var(--color-ink)',
          light: 'var(--color-ink-light)',
          border: 'var(--color-ink-border)',
        },
        paper: {
          DEFAULT: 'var(--color-paper)',
          dim: 'var(--color-paper-dim)',
        },
        rose: {
          DEFAULT: '#E5637A',
          dim: '#C24F63',
        },
        plum: {
          DEFAULT: '#8A6FCF',
          dim: '#6F58A8',
        },
        gold: '#D4AF6A',
        muted: 'var(--color-muted)',
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        body: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
