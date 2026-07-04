import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  // Tone-driven components build class names dynamically (e.g. `bg-${tone}-500/12`),
  // which the JIT scanner can't see as literal strings. Safelist the palette
  // × utility combinations these components use so the colours survive the build.
  safelist: [
    {
      pattern: /(bg|text|border|ring|fill|stroke)-(brand|accent|gold|crimson|violet|teal|amber|rose|sky|emerald|indigo|forest)-(400|500|600)/,
      variants: ["hover", "dark", "group-hover"],
    },
    {
      pattern: /(bg|text|border)-(brand|accent|gold|crimson|violet|teal|amber|rose|sky|emerald)-(300|500|600)\/(5|10|12|15|20|25|30|40)/,
      variants: ["hover", "dark"],
    },
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "rgb(var(--surface) / <alpha-value>)",
          raised: "rgb(var(--surface-raised) / <alpha-value>)",
          overlay: "rgb(var(--surface-overlay) / <alpha-value>)",
        },
        ink: {
          DEFAULT: "rgb(var(--ink) / <alpha-value>)",
          muted: "rgb(var(--ink-muted) / <alpha-value>)",
          faint: "rgb(var(--ink-faint) / <alpha-value>)",
        },
        edge: {
          DEFAULT: "rgb(var(--edge) / <alpha-value>)",
          strong: "rgb(var(--edge-strong) / <alpha-value>)",
        },
        // UNZANASA brand: teal-green (primary), matching the association palette.
        brand: {
          50: "#eefdf6",
          100: "#d6f7e8",
          200: "#aeecd3",
          300: "#78dbb8",
          400: "#3fc198",
          500: "#0d9488",
          600: "#0f766e",
          700: "#166149",
          800: "#0b4030",
          900: "#052e20",
          950: "#031d15",
        },
        accent: {
          400: "#2dd4bf",
          500: "#14b8a6",
          600: "#0d9488",
        },
        // UNZANASA signature colours from the source site.
        forest: { DEFAULT: "#052e20", mid: "#0b4030", light: "#166149" },
        gold: { DEFAULT: "#f5a623", 400: "#fbbf24", 500: "#f5a623", 600: "#d98e0b" },
        crimson: { DEFAULT: "#dc2626", 600: "#dc2626", 700: "#991b1b" },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      boxShadow: {
        soft: "0 2px 8px -2px rgb(15 23 42 / 0.08), 0 4px 16px -4px rgb(15 23 42 / 0.06)",
        lift: "0 4px 12px -2px rgb(15 23 42 / 0.10), 0 12px 32px -8px rgb(15 23 42 / 0.12)",
        glow: "0 0 0 1px rgb(13 148 136 / 0.25), 0 4px 24px -4px rgb(13 148 136 / 0.35)",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          from: { backgroundPosition: "200% 0" },
          to: { backgroundPosition: "-200% 0" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.55" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) both",
        shimmer: "shimmer 2.5s linear infinite",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
