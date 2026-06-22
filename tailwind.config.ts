import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // RideLog dark palette
        bg: {
          base: "#08080F",
          surface: "#111118",
          card: "#1C1C28",
          elevated: "#252535",
        },
        border: {
          DEFAULT: "#2D2D42",
          subtle: "#1E1E2E",
          strong: "#44445A",
        },
        primary: {
          DEFAULT: "#FF6B2B",
          dim: "#FF6B2B33",
          hover: "#FF8452",
          foreground: "#FFFFFF",
        },
        accent: {
          DEFAULT: "#00C9FF",
          dim: "#00C9FF22",
        },
        success: {
          DEFAULT: "#1EE8A0",
          dim: "#1EE8A022",
        },
        danger: {
          DEFAULT: "#FF3B5C",
          dim: "#FF3B5C22",
        },
        warning: {
          DEFAULT: "#FFB800",
          dim: "#FFB80022",
        },
        muted: {
          DEFAULT: "#6B6B8A",
          foreground: "#9999BB",
        },
        foreground: {
          DEFAULT: "#FFFFFF",
          secondary: "#CCCCDD",
          tertiary: "#8888AA",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
        display: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "glow-orange": "radial-gradient(ellipse at center, #FF6B2B44 0%, transparent 70%)",
        "glow-cyan": "radial-gradient(ellipse at center, #00C9FF22 0%, transparent 70%)",
      },
      boxShadow: {
        "glow-sm": "0 0 12px #FF6B2B44",
        "glow-md": "0 0 24px #FF6B2B55",
        "glow-lg": "0 0 48px #FF6B2B44",
        "card": "0 2px 16px rgba(0,0,0,0.4)",
        "card-hover": "0 4px 32px rgba(0,0,0,0.6)",
        "inner-glow": "inset 0 1px 0 rgba(255,255,255,0.05)",
      },
      borderRadius: {
        "4xl": "2rem",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "spin-slow": "spin 3s linear infinite",
        "bounce-subtle": "bounce-subtle 2s ease-in-out infinite",
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "glow-pulse": "glowPulse 2s ease-in-out infinite",
      },
      keyframes: {
        "bounce-subtle": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        glowPulse: {
          "0%, 100%": { boxShadow: "0 0 12px #FF6B2B44" },
          "50%": { boxShadow: "0 0 32px #FF6B2B88" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
