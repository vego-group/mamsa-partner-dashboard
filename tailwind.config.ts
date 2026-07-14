import type { Config } from "tailwindcss";

/**
 * Mamsa brand tokens — mirror the public site (Phase 1).
 * Primary: dark green. Secondary: cream. Danger: red (destructive only).
 */
const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/app/**/*.{ts,tsx}",
    "./src/features/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand
        brand: {
          DEFAULT: "#1F4A3C", // dark green (primary)
          dark: "#163A2F",
          light: "#2E6A54",
          soft: "#E7EFE9", // soft green surface
        },
        cream: {
          DEFAULT: "#F4F1E9",
          dark: "#EDE8DB",
        },
        // Lifecycle / status — ONE fixed system used dashboard-wide
        status: {
          draft: "#8A8F98", // grey
          pending: "#C9862B", // orange
          approved: "#1F7A4D", // green
          rejected: "#C0392B", // red
        },
        // Neutrals
        ink: {
          DEFAULT: "#16211C",
          muted: "#5B6B62",
          faint: "#8A968E",
        },
        line: "#E2E6E1",
      },
      fontFamily: {
        // English display/body + Arabic. Utility face for data.
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "serif"],
        arabic: ["var(--font-arabic)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "16px",
        field: "12px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(22,33,28,0.04), 0 8px 24px rgba(22,33,28,0.06)",
        modal: "0 24px 64px rgba(22,33,28,0.18)",
      },
    },
  },
  plugins: [],
};

export default config;
