import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#111827",
        steel: "#4b5563",
        line: "#d7dee8",
        cloud: "#f7fafc",
        brand: "#0f55d6",
        mint: "#0f9f83",
        amber: "#b7791f",
        danger: "#c2410c"
      },
      boxShadow: {
        panel: "0 10px 30px rgba(17, 24, 39, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
