import type { Config } from "tailwindcss";

const config: Config = {
  content: ["src/**/*.{ts,tsx}"],
  theme: {
    screens: {
      xs: "375px",
      sm: "640px",
      md: "768px",
      "tab-port": "834px",
      lg: "1024px",
      "tab-land": "1194px",
      xl: "1280px",
    },
  },
};

export default config;
