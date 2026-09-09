import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef2ff",
          100: "#e0e7ff",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
        },
        ink: "#0f172a",
        muted: "#64748b",
        line: "#e2e8f0",
        ok: "#059669",
      },
      borderRadius: {
        xl: "14px",
      },
      boxShadow: {
        soft: "0 1px 3px rgba(15,23,42,0.08), 0 8px 24px rgba(15,23,42,0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
