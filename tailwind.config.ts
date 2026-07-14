import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Core dark palette — single source of truth
        bg: "#0A0B0D",
        sidebar: "#0C0D10",
        surface: "#141619",
        surface2: "#1B1E23",
        border: "#242830",
        text: {
          DEFAULT: "#EBEBEB",
          muted: "#8A9099",
        },
        // Brand + semantic (status) colors
        primary: {
          DEFAULT: "#63D8FF",
          hover: "#4FC3EC",
          on: "#04252E",
        },
        accent: "#3DE7DF", // success / active
        danger: "#FF6B6B", // failed
        warn: "#FAC775", // queued / warning
      },
      fontFamily: {
        display: ["var(--font-display)", "Space Grotesk", "sans-serif"],
        sans: ["var(--font-body)", "Google Sans", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "12px",
      },
    },
  },
  plugins: [],
};

export default config;
