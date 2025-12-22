/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        /* === Brand === */
        geneva: {
          red: 'rgb(var(--color-geneva-red) / <alpha-value>)',
          dark: 'rgb(var(--color-geneva-dark) / <alpha-value>)',
        },

        /* === Primary (Geneva Red) === */
        primary: {
          DEFAULT: 'rgb(var(--color-primary) / <alpha-value>)',
          hover: 'rgb(var(--color-primary-hover) / <alpha-value>)',
          light: 'rgb(var(--color-primary-light) / <alpha-value>)',
          foreground: 'rgb(var(--color-primary-foreground) / <alpha-value>)',
        },

        /* === Secondary === */
        secondary: {
          DEFAULT: 'rgb(var(--color-secondary) / <alpha-value>)',
          hover: 'rgb(var(--color-secondary-hover) / <alpha-value>)',
          foreground: 'rgb(var(--color-secondary-foreground) / <alpha-value>)',
        },

        /* === Muted === */
        muted: {
          DEFAULT: 'rgb(var(--color-muted) / <alpha-value>)',
          foreground: 'rgb(var(--color-muted-foreground) / <alpha-value>)',
        },

        /* === Accent === */
        accent: {
          DEFAULT: 'rgb(var(--color-accent) / <alpha-value>)',
          foreground: 'rgb(var(--color-accent-foreground) / <alpha-value>)',
        },

        /* === Background & Foreground === */
        background: 'rgb(var(--color-background) / <alpha-value>)',
        foreground: 'rgb(var(--color-foreground) / <alpha-value>)',

        /* === Card === */
        card: {
          DEFAULT: 'rgb(var(--color-card) / <alpha-value>)',
          foreground: 'rgb(var(--color-card-foreground) / <alpha-value>)',
        },

        /* === Popover === */
        popover: {
          DEFAULT: 'rgb(var(--color-popover) / <alpha-value>)',
          foreground: 'rgb(var(--color-popover-foreground) / <alpha-value>)',
        },

        /* === Border & Input === */
        border: 'rgb(var(--color-border) / <alpha-value>)',
        input: 'rgb(var(--color-input) / <alpha-value>)',
        ring: 'rgb(var(--color-ring) / <alpha-value>)',

        /* === Success (Green) === */
        success: {
          DEFAULT: 'rgb(var(--color-success) / <alpha-value>)',
          light: 'rgb(var(--color-success-light) / <alpha-value>)',
          foreground: 'rgb(var(--color-success-foreground) / <alpha-value>)',
          muted: 'rgb(var(--color-success-muted) / <alpha-value>)',
        },

        /* === Warning (Amber) === */
        warning: {
          DEFAULT: 'rgb(var(--color-warning) / <alpha-value>)',
          light: 'rgb(var(--color-warning-light) / <alpha-value>)',
          foreground: 'rgb(var(--color-warning-foreground) / <alpha-value>)',
          muted: 'rgb(var(--color-warning-muted) / <alpha-value>)',
        },

        /* === Destructive/Error (Red) === */
        destructive: {
          DEFAULT: 'rgb(var(--color-destructive) / <alpha-value>)',
          light: 'rgb(var(--color-destructive-light) / <alpha-value>)',
          foreground: 'rgb(var(--color-destructive-foreground) / <alpha-value>)',
          muted: 'rgb(var(--color-destructive-muted) / <alpha-value>)',
        },

        /* === Info (Blue) === */
        info: {
          DEFAULT: 'rgb(var(--color-info) / <alpha-value>)',
          light: 'rgb(var(--color-info-light) / <alpha-value>)',
          foreground: 'rgb(var(--color-info-foreground) / <alpha-value>)',
          muted: 'rgb(var(--color-info-muted) / <alpha-value>)',
        },

        /* === Purple (AI features) === */
        purple: {
          DEFAULT: 'rgb(var(--color-purple) / <alpha-value>)',
          light: 'rgb(var(--color-purple-light) / <alpha-value>)',
          foreground: 'rgb(var(--color-purple-foreground) / <alpha-value>)',
          muted: 'rgb(var(--color-purple-muted) / <alpha-value>)',
        },

        /* === Text === */
        text: {
          primary: 'rgb(var(--color-text-primary) / <alpha-value>)',
          secondary: 'rgb(var(--color-text-secondary) / <alpha-value>)',
          muted: 'rgb(var(--color-text-muted) / <alpha-value>)',
          light: 'rgb(var(--color-text-light) / <alpha-value>)',
        },
      },
    },
  },
  plugins: [],
}
