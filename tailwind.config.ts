import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "surface-canvas": "#F9FAFB",
        "surface-card": "#FFFFFF",
        "border-subtle": "#E5E7EB",
        "border-strong": "#CBD5E1",
        "text-primary": "#0B0E28",
        "text-muted": "#64748B",
        "primary": "#3525cd",
        "primary-container": "#4F46E5",
        "primary-hover": "#4338CA",
        "on-primary": "#FFFFFF",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        "display-lg": ["Inter"],
        "display-lg-mobile": ["Inter"],
        "headline-lg": ["Inter"],
        "headline-lg-mobile": ["Inter"],
        "headline-md": ["Inter"],
        "headline-sm": ["Inter"],
        "title-md": ["Inter"],
        "body-lg": ["Inter"],
        "body-md": ["Inter"],
        "body-sm": ["Inter"],
        "label-md": ["Inter"],
        "label-sm": ["Inter"],
      },
      fontSize: {
        "display-lg": ["48px", { lineHeight: "56px", letterSpacing: "-0.03em", fontWeight: "700" }],
        "display-lg-mobile": ["32px", { lineHeight: "40px", letterSpacing: "-0.025em", fontWeight: "700" }],
        "headline-lg": ["32px", { lineHeight: "40px", letterSpacing: "-0.02em", fontWeight: "600" }],
        "headline-lg-mobile": ["24px", { lineHeight: "32px", letterSpacing: "-0.015em", fontWeight: "600" }],
        "headline-md": ["24px", { lineHeight: "32px", letterSpacing: "-0.015em", fontWeight: "600" }],
        "headline-sm": ["18px", { lineHeight: "26px", letterSpacing: "-0.01em", fontWeight: "600" }],
        "title-md": ["16px", { lineHeight: "24px", letterSpacing: "-0.005em", fontWeight: "600" }],
        "body-lg": ["16px", { lineHeight: "26px", letterSpacing: "0em", fontWeight: "400" }],
        "body-md": ["14px", { lineHeight: "22px", letterSpacing: "0em", fontWeight: "400" }],
        "body-sm": ["12px", { lineHeight: "18px", letterSpacing: "0.005em", fontWeight: "400" }],
        "label-md": ["13px", { lineHeight: "18px", letterSpacing: "0.01em", fontWeight: "500" }],
        "label-sm": ["11px", { lineHeight: "16px", letterSpacing: "0.05em", fontWeight: "600" }],
      },
      spacing: {
        "2xs": "0.25rem",
        xs: "0.5rem",
        sm: "0.75rem",
        md: "1rem",
        lg: "1.5rem",
        xl: "2rem",
        "2xl": "3rem",
        "3xl": "4rem",
        "gutter-mobile": "1rem",
        "gutter-desktop": "1.5rem",
      },
      borderRadius: {
        DEFAULT: "0.125rem",
        sm: "0.125rem",
        lg: "0.5rem",
        xl: "0.75rem",
        full: "9999px",
      },
      maxWidth: {
        container: "1280px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(11, 14, 40, 0.05), 0 4px 12px rgba(11, 14, 40, 0.03)",
        modal: "0 8px 30px rgba(11, 14, 40, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
