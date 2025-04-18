/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('../ui/tailwind.config.js')],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: '',
  theme: {
    fontFamily: {
      inter: ['Inter', 'sans-serif'],
    },
    fontSize: {
      xxs: '0.625rem', // 10px
      xs: '0.6875rem', // 11px
      sm: '0.75rem', // 12px
      base: '0.8125rem', // 13px
      lg: '0.875rem', // 14px
      xl: '1rem', // 16px
      // 2xl and above will be updated in an upcoming version
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
      '6xl': '4rem',
      // '2xl': '1.125rem', // 18px
      // '3xl': '1.375rem', // 22px
      // '4xl': '1.5rem', // 24px
      // '5xl': '1.875rem', // 30px
    },
    fontWeight: {
      hairline: '100',
      thin: '200',
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
      black: '900',
    },
    extend: {
      colors: {
        highlight: '#00ADB5',
        border: '#E2E8F0',
        input: '#E2E8F0',
        ring: '#8B5CF6',
        background: '#222831',
        foreground: '#EEEEEE',
        primary: {
          DEFAULT: '#EEEEEE',
          foreground: '#F8FAFC',
        },
        secondary: {
          DEFAULT: '#F3F4F6',
          foreground: '#EEEEEE',
        },
        destructive: {
          DEFAULT: '#EF4444',
          foreground: '#F8FAFC',
        },
        muted: {
          DEFAULT: '#0E0E0E',
          foreground: '#6B7280',
        },
        accent: {
          DEFAULT: '#8297AC',
          foreground: '#1F2937',
        },
        popover: {
          DEFAULT: '#222831',
          foreground: '#FFFFFF',
        },
        card: {
          DEFAULT: '#FFFFFF',
          foreground: '#1A1E2C',
        },
      },

      // Dark mode colors
      dark: {
        highlight: '#5ACCE6',
        border: '#2D3748',
        input: '#2D3748',
        ring: '#7C3AED',
        background: '#1A1E2C',
        foreground: '#F8FAFC',
        primary: {
          DEFAULT: '#7C3AED',
          foreground: '#F8FAFC',
        },
        secondary: {
          DEFAULT: '#2D3748',
          foreground: '#F8FAFC',
        },
        destructive: {
          DEFAULT: '#EF4444',
          foreground: '#F8FAFC',
        },
        muted: {
          DEFAULT: '#3B82F6',
          foreground: '#94A3B8',
        },
        accent: {
          DEFAULT: '#2D3748',
          foreground: '#F8FAFC',
        },
        popover: {
          DEFAULT: '#1A1E2C',
          foreground: '#F8FAFC',
        },
        card: {
          DEFAULT: '#1A1E2C',
          foreground: '#F8FAFC',
        },
      },

      bkg: {
        low: '#121212',
        med: '#1E1E1E',
        full: '#2D2D2D',
      },
      info: {
        primary: '#FFFFFF',
        secondary: '#A0D8EF',
      },
      actions: {
        primary: '#4299E1',
        highlight: '#63B3ED',
        hover: 'rgba(66, 153, 225, 0.25)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
