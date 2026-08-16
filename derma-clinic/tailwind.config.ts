import type { Config } from "tailwindcss";

/**
 * Serene Dermatology — Design System (Tailwind config)
 *
 * Mood: White & Sage Green, clean premium, Korean premium dermatology clinic.
 * Typography: Playfair Display (serif headings) + Inter (sans body) — classic
 * elegant premium pairing, high-contrast hierarchy.
 *
 * All semantic colors are exposed as CSS variables (see globals.css) so the
 * palette can be re-skinned (e.g. dark mode, or warm-ivory variant) without
 * touching component code. Components reference only `sage`, `surface`, etc.
 * — never raw hex values.
 */
const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primitive → Semantic mapping. Variables defined in globals.css.
        sage: {
          50: "rgb(var(--sage-50) / <alpha-value>)",
          100: "rgb(var(--sage-100) / <alpha-value>)",
          200: "rgb(var(--sage-200) / <alpha-value>)",
          300: "rgb(var(--sage-300) / <alpha-value>)",
          400: "rgb(var(--sage-400) / <alpha-value>)",
          500: "rgb(var(--sage-500) / <alpha-value>)",
          600: "rgb(var(--sage-600) / <alpha-value>)",
          700: "rgb(var(--sage-700) / <alpha-value>)",
          800: "rgb(var(--sage-800) / <alpha-value>)",
          900: "rgb(var(--sage-900) / <alpha-value>)",
        },
        ink: {
          DEFAULT: "rgb(var(--ink) / <alpha-value>)",
          soft: "rgb(var(--ink-soft) / <alpha-value>)",
          muted: "rgb(var(--ink-muted) / <alpha-value>)",
        },
        cream: {
          DEFAULT: "rgb(var(--cream) / <alpha-value>)",
          tint: "rgb(var(--cream-tint) / <alpha-value>)",
        },
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Playfair Display", "Georgia", "serif"],
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
      },
      fontSize: {
        // Type scale (1.25 ratio, base 16px). Heading sizes are optical, not
        // purely mathematical — slightly tightened for editorial elegance.
        "display": ["clamp(2.75rem, 6vw, 4.5rem)", { lineHeight: "1.05", letterSpacing: "-0.02em" }],
        "h1": ["clamp(2.25rem, 4.5vw, 3rem)", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        "h2": ["clamp(1.75rem, 3vw, 2.25rem)", { lineHeight: "1.15", letterSpacing: "-0.015em" }],
        "h3": ["clamp(1.375rem, 2vw, 1.625rem)", { lineHeight: "1.25", letterSpacing: "-0.01em" }],
        "body-lg": ["1.125rem", { lineHeight: "1.7" }],
        "body": ["1rem", { lineHeight: "1.7" }],
        "small": ["0.875rem", { lineHeight: "1.6" }],
        "caption": ["0.75rem", { lineHeight: "1.5", letterSpacing: "0.04em" }],
      },
      spacing: {
        // 4pt rhythm extended for editorial vertical breathing room.
        "18": "4.5rem",
        "22": "5.5rem",
        "30": "7.5rem",
      },
      borderRadius: {
        "xs": "4px",
        "sm": "8px",
        "md": "12px",
        "lg": "16px",
        "xl": "24px",
        "2xl": "32px",
      },
      boxShadow: {
        // Soft, warm elevation — never harsh black. Layered for depth.
        "soft": "0 1px 2px rgba(31, 36, 33, 0.04), 0 8px 24px rgba(31, 36, 33, 0.06)",
        "card": "0 1px 3px rgba(31, 36, 33, 0.05), 0 12px 32px rgba(31, 36, 33, 0.07)",
        "lift": "0 4px 8px rgba(31, 36, 33, 0.06), 0 24px 48px rgba(31, 36, 33, 0.10)",
        "ring": "0 0 0 4px rgba(91, 127, 110, 0.18)",
      },
      maxWidth: {
        "content": "72rem",
        "prose-narrow": "40rem",
      },
      transitionTimingFunction: {
        "out-soft": "cubic-bezier(0.22, 1, 0.36, 1)",
        "in-out-soft": "cubic-bezier(0.65, 0, 0.35, 1)",
      },
      keyframes: {
        "fade-up": {
          "from": { opacity: "0", transform: "translateY(16px)" },
          "to": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "from": { opacity: "0" },
          "to": { opacity: "1" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) both",
        "fade-in": "fade-in 0.6s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
