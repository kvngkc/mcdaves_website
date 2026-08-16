// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f4faf4',
          100: '#e8f5e8',
          500: '#5a9e5a',
          600: '#4a854a',
          700: '#3d6b3d',
          800: '#2d4a2d',
          900: '#1a2e1a',
        },
        accent: {
          gold: '#c9a227',
          warm: '#d97706',
          rose: '#e11d48',
          sky: '#0284c7',
        },
        whatsapp: '#25D366',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        hero: ['clamp(2rem, 5vw + 1rem, 3.5rem)', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '600' }],
        h1: ['clamp(1.75rem, 4vw + 1rem, 3rem)', { lineHeight: '1.15', letterSpacing: '-0.02em', fontWeight: '600' }],
        h2: ['clamp(1.5rem, 3vw + 0.875rem, 2.25rem)', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '600' }],
        h3: ['clamp(1.25rem, 2vw + 0.75rem, 1.75rem)', { lineHeight: '1.25', letterSpacing: '-0.01em', fontWeight: '600' }],
        h4: ['clamp(1.1rem, 1vw + 0.75rem, 1.375rem)', { lineHeight: '1.3', fontWeight: '500' }],
        body: ['clamp(1rem, 0.5vw + 0.875rem, 1.125rem)', { lineHeight: '1.6', fontWeight: '400' }],
        'body-sm': ['1rem', { lineHeight: '1.5', fontWeight: '400' }],
        caption: ['0.875rem', { lineHeight: '1.4', letterSpacing: '0.01em', fontWeight: '400' }],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
      },
      boxShadow: {
        'card-hover': '0 4px 12px rgba(0,0,0,0.08)',
      },
      zIndex: {
        dropdown: '10',
        sticky: '20',
        'modal-backdrop': '30',
        modal: '40',
        toast: '50',
        floating: '60',
      },
    },
  },
  plugins: [],
};

export default config;
