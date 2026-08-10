/** @type {import('tailwindcss').Config} */
/**
 * Design System — Hanoi Residences (Airbnb-style, NativeWind)
 * Tokens trích xuất từ Figma "Airbnb Mobile App (Community)":
 * - Primary: #FF385C (Rausch) / #D42F4D (active, pressed)
 * - Neutral: #0A0A0A → #FFFFFF (text 2 cấp: ink #0A0A0A, muted #717375)
 * - Typeface: Inter (thay cho Airbnb Cereal App — font độc quyền của Airbnb)
 *   Map weight: Book → 400 (Inter_400Regular), Medium → 500 (Inter_500Medium)
 *
 * Spacing dùng scale mặc định của Tailwind (đúng với Figma):
 * 0.5=2px, 1=4px, 2=8px, 2.5=10px, 3=12px, 3.5=14px, 4=16px, 5=20px,
 * 6=24px (padding ngang màn hình chuẩn), 8=32px (gap giữa các card).
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
        headline: ['Inter_500Medium', 'System'],
        sans: ['Inter_400Regular', 'System'],
        'inter-medium': ['Inter_500Medium', 'System'],
        'inter-semibold': ['Inter_600SemiBold', 'System'],
        'inter-bold': ['Inter_700Bold', 'System'],
        serif: ['PlayfairDisplay', 'Georgia', 'serif'],
      },
      /** Typography scale từ Figma (size/line-height) */
      fontSize: {
        'heading-2': ['26px', { lineHeight: '34px' }],
        'heading-4': ['22px', { lineHeight: '28px' }],
        'body-xl': ['18px', { lineHeight: '24px' }],
        'body-lg': ['16px', { lineHeight: '22px' }],
        body: ['14px', { lineHeight: '18px' }],
        caption: ['12px', { lineHeight: '16px' }],
      },
      colors: {
        background: '#FFFFFF',
        foreground: '#0A0A0A',

        /** Neutral scale từ Figma (Neutral/10 → Neutral/100) */
        neutral: {
          10: '#FFFFFF',
          20: '#F7F7F7',
          40: '#D8DCE0',
          70: '#717375',
          80: '#5D5F61',
          100: '#0A0A0A',
        },

        primary: {
          DEFAULT: '#FF385C',
          dark: '#D42F4D',
          foreground: '#FFFFFF',
          soft: '#FFF0F3',
          muted: '#FFD9E0',
        },

        card: {
          DEFAULT: '#FFFFFF',
          foreground: '#0A0A0A',
        },

        border: '#D8DCE0',
        input: '#F7F7F7',

        muted: {
          DEFAULT: '#F7F7F7',
          foreground: '#717375',
        },

        secondary: {
          DEFAULT: '#F7F7F7',
          foreground: '#0A0A0A',
        },

        brand: {
          DEFAULT: '#FF385C',
          dark: '#D42F4D',
          soft: '#FFF0F3',
          border: '#D8DCE0',
          ink: '#0A0A0A',
          muted: '#717375',
          shadow: '#000000',
          commission: '#5CB85C',
        },

        /** Alias legacy — giữ tên class, remap giá trị sang palette Airbnb */
        hoteliq: {
          primary: '#FF385C',
          soft: '#FFF0F3',
          muted: '#FFD9E0',
          ink: '#0A0A0A',
          gray: '#717375',
          line: '#D8DCE0',
          chip: '#F7F7F7',
          heart: '#FF385C',
          star: '#0A0A0A',
        },

        action: {
          DEFAULT: '#FF385C',
          soft: '#FFF0F3',
        },

        /** Airbnb-style: giá hiển thị bằng text đen medium, không dùng màu accent */
        price: '#0A0A0A',
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '12px',
        xl: '20px',
        '2xl': '24px',
        '3xl': '32px',
        pill: '43px',
      },
      boxShadow: {
        soft: '0 0 8px rgba(0, 0, 0, 0.08)',
        card: '0 0 8px rgba(0, 0, 0, 0.12)',
        search: '0 0 8px rgba(0, 0, 0, 0.12)',
      },
    },
  },
  plugins: [],
};
