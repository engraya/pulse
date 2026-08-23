import type { Config } from "tailwindcss";

// Pulse maps Tailwind's semantic colors onto Fathom UI's CSS-variable tokens,
// so the dashboard and the design system share one theming contract.
const config: Config = {
  darkMode: ["class", '[data-theme="dark"]'],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--fathom-bg)",
        surface: "var(--fathom-surface)",
        border: "var(--fathom-border)",
        "border-strong": "var(--fathom-border-strong)",
        fg: "var(--fathom-fg)",
        muted: "var(--fathom-fg-muted)",
        primary: "var(--fathom-primary)",
        success: "var(--fathom-success)",
        warning: "var(--fathom-warning)",
        danger: "var(--fathom-danger)",
        info: "var(--fathom-info)",
      },
      borderRadius: {
        fathom: "var(--fathom-radius)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
