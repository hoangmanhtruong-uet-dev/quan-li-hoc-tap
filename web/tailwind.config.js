/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx,mdx}',
    './node_modules/streamdown/dist/*.js',
  ],
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1440px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar))',
          foreground: 'hsl(var(--sidebar-foreground))',
          muted: 'hsl(var(--sidebar-muted))',
          border: 'hsl(var(--sidebar-border))',
        },
        // Neo-Brutal Aurora Palette Tokens
        aurora: {
          obsidian: '#0A0A12',
          lime: '#C6FF3D',
          pink: '#FF3DA5',
          violet: '#7C5CFF',
          cyan: '#3DE8FF',
          orange: '#FF8A3D',
        },
        // Calendar Event Neon Tokens
        event: {
          class: '#4D7CFF',
          study: '#8B6CFF',
          deadline: '#FF3D6E',
          club: '#FFB020',
          personal: '#3DFFB0',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        'neo': '24px',
        'neo-lg': '32px',
      },
      boxShadow: {
        'neo': '6px 6px 0px 0px var(--neo-shadow-color, #000000)',
        'neo-sm': '3px 3px 0px 0px var(--neo-shadow-color, #000000)',
        'neo-lg': '10px 10px 0px 0px var(--neo-shadow-color, #000000)',
        'neo-accent': '6px 6px 0px 0px var(--theme-accent, #C6FF3D)',
        'neo-lime': '6px 6px 0px 0px #C6FF3D',
        'neo-orange': '6px 6px 0px 0px #FF8A3D',
        'neo-pink': '6px 6px 0px 0px #FF3DA5',
        'neo-violet': '6px 6px 0px 0px #7C5CFF',
        'neo-cyan': '6px 6px 0px 0px #3DE8FF',
      },
      fontFamily: {
        display: ['Unbounded', '"Space Grotesk"', 'sans-serif'],
        heading: ['"Space Grotesk"', 'Unbounded', 'sans-serif'],
        sans: [
          '"Be Vietnam Pro"',
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        mono: [
          '"JetBrains Mono"',
          '"Fira Code"',
          'Consolas',
          'monospace',
        ],
      },
      spacing: {
        '18': '4.5rem',
        '72': '18rem',
        '84': '21rem',
        '96': '24rem',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'panic-shake': {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%, 60%': { transform: 'translateX(-3px) rotate(-0.5deg)' },
          '40%, 80%': { transform: 'translateX(3px) rotate(0.5deg)' },
        },
        'pulse-neon': {
          '0%, 100%': { opacity: '1', filter: 'drop-shadow(0 0 10px var(--theme-accent, #C6FF3D))' },
          '50%': { opacity: '0.65', filter: 'drop-shadow(0 0 2px var(--theme-accent, #C6FF3D))' },
        },
        'marquee-left': {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'marquee-right': {
          '0%': { transform: 'translateX(-50%)' },
          '100%': { transform: 'translateX(0%)' },
        },
        'float-badge': {
          '0%, 100%': { transform: 'translateY(0) rotate(-1.5deg)' },
          '50%': { transform: 'translateY(-4px) rotate(1deg)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-up': 'slide-up 0.2s ease-out',
        'panic-shake': 'panic-shake 0.35s ease-in-out infinite',
        'pulse-neon': 'pulse-neon 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'marquee-left': 'marquee-left 25s linear infinite',
        'marquee-right': 'marquee-right 25s linear infinite',
        'float-badge': 'float-badge 4s ease-in-out infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
