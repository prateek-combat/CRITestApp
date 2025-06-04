import type { Config } from 'tailwindcss';
import forms from '@tailwindcss/forms';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/layout/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Military theme colors
        'military-green': '#4A5D23', // Dark olive green
        'accent-orange': '#F5821F', // Bright orange
        'primary-white': '#FFFFFF',
        'off-white': '#F8F9FA', // Light gray for backgrounds
        'text-dark': '#212529', // Dark gray for primary text
        'text-light': '#6C757D', // Lighter gray for secondary text

        // Brand colors (aliases for primary colors for backward compatibility)
        brand: {
          50: '#f0f4e8',
          100: '#d9e4c4',
          200: '#c1d39e',
          300: '#a8c278',
          400: '#8fb152',
          500: '#4A5D23', // military-green
          600: '#3e4e1d',
          700: '#323f17',
          800: '#263011',
          900: '#1a210b',
        },

        // TailAdmin compatible colors - mapped to military theme
        primary: {
          50: '#f0f4e8',
          100: '#d9e4c4',
          200: '#c1d39e',
          300: '#a8c278',
          400: '#8fb152',
          500: '#4A5D23', // military-green
          600: '#3e4e1d',
          700: '#323f17',
          800: '#263011',
          900: '#1a210b',
        },
        secondary: {
          50: '#fef7ec',
          100: '#fce4c4',
          200: '#fad19c',
          300: '#f8be74',
          400: '#f6ab4c',
          500: '#F5821F', // accent-orange
          600: '#e4751c',
          700: '#d36819',
          800: '#c25b16',
          900: '#b14e13',
        },
        // Gray scale for UI elements
        gray: {
          50: '#F8F9FA',
          100: '#F1F3F4',
          200: '#E8EAED',
          300: '#DADCE0',
          400: '#BDC1C6',
          500: '#9AA0A6',
          600: '#80868B',
          700: '#5F6368',
          800: '#3C4043',
          900: '#202124',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [forms],
};

export default config;
