/** @type {import('tailwindcss').Config} */
/**
 * Design System — Hanoi Residences + Hoteliq (NativeWind)
 * Primary accent from Figma: #4C4DDC
 */
module.exports = {
  content: [
    './src/app/**/*.{js,jsx,ts,tsx}',
    './src/components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      fontFamily: {
        body: ['Inter_400Regular', 'System'],
        airbnb: ['Inter_400Regular', 'System'],
        headline: ['Inter_600SemiBold', 'System'],
        sans: ['Inter_400Regular', 'System'],
        'inter-medium': ['Inter_500Medium', 'System'],
        'inter-semibold': ['Inter_600SemiBold', 'System'],
        'inter-bold': ['Inter_700Bold', 'System'],
        serif: ['PlayfairDisplay', 'Georgia', 'serif'],
      },
      colors: {
        background: '#FFFFFF',
        foreground: '#101010',

        primary: {
          DEFAULT: '#4C4DDC',
          foreground: '#FFFFFF',
          soft: '#E4E4FA',
          muted: '#C8C8F4',
        },

        card: {
          DEFAULT: '#FFFFFF',
          foreground: '#101010',
        },

        border: '#E1E1E1',
        input: '#F5F5F5',

        muted: {
          DEFAULT: '#F5F5F5',
          foreground: '#878787',
        },

        secondary: {
          DEFAULT: '#F5F5F5',
          foreground: '#101010',
        },

        brand: {
          DEFAULT: '#4C4DDC',
          dark: '#3B3CB5',
          soft: '#E4E4FA',
          border: '#E1E1E1',
          ink: '#101010',
          muted: '#878787',
          shadow: '#070707',
          commission: '#5CB85C',
        },

        hoteliq: {
          primary: '#4C4DDC',
          soft: '#E4E4FA',
          muted: '#C8C8F4',
          ink: '#101010',
          gray: '#878787',
          line: '#E1E1E1',
          chip: '#F5F5F5',
          heart: '#FF4D67',
          star: '#FFC107',
        },

        action: {
          DEFAULT: '#4C4DDC',
          soft: '#E4E4FA',
        },

        price: '#4C4DDC',
      },
      borderRadius: {
        lg: '16px',
        md: '12px',
        sm: '10px',
        xl: '20px',
        '2xl': '24px',
        '3xl': '32px',
      },
      boxShadow: {
        soft: '0 0 35px 4px rgba(7, 7, 7, 0.03)',
        card: '0 0 24px 2px rgba(7, 7, 7, 0.04)',
      },
    },
  },
  plugins: [],
};
