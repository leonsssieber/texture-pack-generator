import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: { 950: "#0a0a0c", 900: "#101014", 850: "#16161c", 800: "#1c1c24", 700: "#262630", 600: "#33333f" },
        line: "#2a2a34",
        accent: { DEFAULT: "#6ee7b7", soft: "#34d399", dim: "#0f766e" },
      },
      fontFamily: { sans: ["ui-sans-serif", "system-ui", "Inter", "sans-serif"], mono: ["ui-monospace", "monospace"] },
    },
  },
  plugins: [],
};
export default config;
