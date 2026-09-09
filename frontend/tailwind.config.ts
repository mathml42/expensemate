import type { Config } from "tailwindcss";

const easeEmphasized = "cubic-bezier(0.16, 1, 0.3, 1)";

// "Midnight + Emerald + Coral" fintech palette.
// Numeric ramps are shared between light usage (bare classes, low numbers)
// and dark usage (`dark:` classes, high numbers) the same way the codebase
// already consumes Tailwind's default slate/blue/green/red/amber scales —
// only the underlying hex values change. 400/500 are pinned to the spec's
// exact dark secondary/muted text values, 700-950 to the spec's exact dark
// surface/border/background values, and 50/100/200 to the spec's exact
// light background/surface/border values.
const slate = {
  50: "#F6F8F7",
  100: "#F1F5F3",
  200: "#D8E1DC",
  300: "#C4D0C9",
  400: "#94A3B8",
  500: "#64748B",
  600: "#4B5B63",
  700: "#263442",
  800: "#1B2632",
  900: "#151D26",
  950: "#0B0F14",
};

// Brand emerald — also doubles as "success/positive" per spec (both share
// the same two hexes: light #159957, dark #35D07F).
const primary = {
  50: "#EAFBF2",
  100: "#CFF5E1",
  200: "#9FE8C3",
  300: "#66D89F",
  400: "#35D07F",
  500: "#22BB6B",
  600: "#159957",
  700: "#0F7A45",
  800: "#0C6238",
  900: "#0A4E2E",
  950: "#052A18",
};

// Secondary accent — teal (light #0F9F8F, dark #5EEAD4).
const accent2 = {
  50: "#EAFBF8",
  100: "#CDF3EC",
  200: "#98E5D8",
  300: "#5EEAD4",
  400: "#3CCBB8",
  500: "#1FB2A0",
  600: "#0F9F8F",
  700: "#0C7F73",
  800: "#0A655C",
  900: "#08514A",
  950: "#042E2A",
};

// Negative / coral-red (light #E05252, dark #FF6B6B).
const danger = {
  50: "#FDEEEE",
  100: "#FBD8D8",
  200: "#F7B6B6",
  300: "#FA8F8F",
  400: "#FF6B6B",
  500: "#EC5F5F",
  600: "#E05252",
  700: "#B84040",
  800: "#8F3231",
  900: "#6B2625",
  950: "#401615",
};

// Warning / amber (light #C58A00, dark #FBBF24).
const warning = {
  50: "#FFF8E6",
  100: "#FEEBB8",
  200: "#FDDA7E",
  300: "#FCC94A",
  400: "#FBBF24",
  500: "#E5AB0E",
  600: "#C58A00",
  700: "#996C00",
  800: "#735100",
  900: "#523A00",
  950: "#2E2000",
};

// Info / blue-teal (light #3478C9, dark #60A5FA).
const info = {
  50: "#EBF3FC",
  100: "#CFE3F7",
  200: "#9FC7EF",
  300: "#7FB6EA",
  400: "#60A5FA",
  500: "#4A8FE0",
  600: "#3478C9",
  700: "#285D9C",
  800: "#1F4A7A",
  900: "#183A5F",
  950: "#0E2338",
};

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        slate,
        primary,
        accent2,
        success: primary,
        danger,
        warning,
        info,
      },
      borderRadius: {
        sm: "0.375rem",
        md: "0.5rem",
        lg: "0.625rem",
        xl: "0.75rem",
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(11 15 20 / 0.04), 0 1px 3px 0 rgb(11 15 20 / 0.06)",
        elevated: "0 4px 12px -2px rgb(11 15 20 / 0.10), 0 2px 4px -2px rgb(11 15 20 / 0.05)",
        modal: "0 20px 40px -8px rgb(11 15 20 / 0.24), 0 8px 16px -8px rgb(11 15 20 / 0.12)",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      transitionTimingFunction: {
        emphasized: easeEmphasized,
      },
      keyframes: {
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.96)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "scale-out": {
          from: { opacity: "1", transform: "scale(1)" },
          to: { opacity: "0", transform: "scale(0.96)" },
        },
        "toast-in": {
          from: { opacity: "0", transform: "translateY(6px) scale(0.98)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "toast-out": {
          from: { opacity: "1", transform: "translateX(0)" },
          to: { opacity: "0", transform: "translateX(8px)" },
        },
        shimmer: {
          from: { backgroundPosition: "200% 0" },
          to: { backgroundPosition: "-200% 0" },
        },
      },
      animation: {
        "fade-in": `fade-in 200ms ${easeEmphasized} both`,
        "fade-in-up": `fade-in-up 250ms ${easeEmphasized} both`,
        "scale-in": `scale-in 150ms ${easeEmphasized} both`,
        "scale-out": `scale-out 150ms ${easeEmphasized} both`,
        "toast-in": `toast-in 200ms ${easeEmphasized} both`,
        "toast-out": "toast-out 150ms ease-in both",
        shimmer: "shimmer 1.8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
