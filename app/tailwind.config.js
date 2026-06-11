/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        void: "#0A0A0F",
        "void-elevated": "#0F0F14",
        cream: "#F0EDE6",
        silver: "#8A8A93",
        dim: "#55555C",
        indigo: "#6B8AFF",
        coral: "#FF8A5C",
        success: "#4ADE80",
      },
      borderRadius: {
        xl: "calc(var(--radius) + 4px)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xs: "calc(var(--radius) - 6px)",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        glass: "0 4px 24px rgba(107, 138, 255, 0.08)",
        card: "0 2px 16px rgba(0, 0, 0, 0.2)",
        drag: "0 8px 32px rgba(0, 0, 0, 0.4)",
      },
      fontFamily: {
        display: ['"Clash Display"', '"Space Grotesk"', '"Inter"', 'sans-serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"Geist Mono"', '"JetBrains Mono"', 'monospace'],
      },
      fontSize: {
        'hero': 'clamp(2rem, 4vw, 3rem)',
        'section': 'clamp(1.25rem, 2vw, 1.5rem)',
        'data': 'clamp(1.5rem, 3vw, 2.25rem)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "caret-blink": {
          "0%,70%,100%": { opacity: "1" },
          "20%,50%": { opacity: "0" },
        },
        "orbFloat": {
          "0%": { transform: "translate(0, 0) scale(1)" },
          "25%": { transform: "translate(50px, -30px) scale(1.1)" },
          "50%": { transform: "translate(-30px, 40px) scale(0.95)" },
          "75%": { transform: "translate(40px, 20px) scale(1.05)" },
          "100%": { transform: "translate(0, 0) scale(1)" },
        },
        "cubeIntro": {
          "0%": { transform: "translateZ(-20px) rotateX(-15deg) rotateY(30deg)" },
          "30%": { transform: "translateZ(-20px) rotateX(200deg) rotateY(160deg)" },
          "60%": { transform: "translateZ(-20px) rotateX(340deg) rotateY(380deg)" },
          "100%": { transform: "translateZ(-20px) rotateX(360deg) rotateY(540deg)" },
        },
        "spin-loader": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "caret-blink": "caret-blink 1.25s ease-out infinite",
        "orbFloat": "orbFloat 20s ease-in-out infinite",
        "orbFloat-slow": "orbFloat 25s ease-in-out infinite",
        "orbFloat-medium": "orbFloat 22s ease-in-out infinite",
        "cubeIntro": "cubeIntro 2.5s cubic-bezier(0.23, 1, 0.32, 1) forwards",
        "spin-loader": "spin-loader 1s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
