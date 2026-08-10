/**
 * Design tokens — Hanoi Residences Mobile
 * Airbnb-style visual system (Figma "Airbnb Mobile App (Community)")
 * layered on product data/logic.
 *
 * Palette: Primary #FF385C / #D42F4D; Neutral #0A0A0A → #FFFFFF.
 * Giữ tên export `Hoteliq` để không phá vỡ imports hiện có — giá trị đã
 * được remap sang palette Airbnb.
 */

import '@/global.css';

import { Platform } from 'react-native';

/** Palette Airbnb-style từ Figma (nguồn chân lý cho màu ngoài className) */
export const Hoteliq = {
  primary: '#FF385C',
  primaryDark: '#D42F4D',
  primarySoft: '#FFF0F3',
  primaryMuted: '#FFD9E0',
  ink: '#0A0A0A',
  inkSecondary: '#5D5F61',
  muted: '#717375',
  mutedLight: '#A6A8AA',
  line: '#D8DCE0',
  canvas: '#FFFFFF',
  chip: '#F7F7F7',
  heart: '#FF385C',
  star: '#0A0A0A',
  shadow: '#000000',
} as const;

/** Legacy brand kept for non-overhauled screens */
export const Brand = {
  gold: '#CDA533',
  goldDark: '#B88E22',
  goldSoft: '#FBF8F1',
  ink: Hoteliq.ink,
  muted: Hoteliq.muted,
  canvas: Hoteliq.canvas,
  surface: '#FFFFFF',
  line: Hoteliq.line,
  shadow: Hoteliq.shadow,
  primary: Hoteliq.primary,
  primarySoft: Hoteliq.primarySoft,
} as const;

export const Colors = {
  light: {
    text: Hoteliq.ink,
    background: Hoteliq.canvas,
    backgroundElement: Hoteliq.chip,
    backgroundSelected: Hoteliq.primarySoft,
    textSecondary: Hoteliq.muted,
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'Inter_400Regular',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'Inter_400Regular',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'Inter, system-ui, sans-serif',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

/**
 * Typography scale từ Figma (Airbnb Cereal → Inter).
 * Weight map: Book → 400 (Inter_400Regular), Medium → 500 (Inter_500Medium).
 */
export const Typography = {
  heading2: { fontSize: 26, lineHeight: 34, fontFamily: 'Inter_500Medium' },
  heading4: { fontSize: 22, lineHeight: 28, fontFamily: 'Inter_500Medium' },
  bodyXlMedium: { fontSize: 18, lineHeight: 24, fontFamily: 'Inter_500Medium' },
  bodyLg: { fontSize: 16, lineHeight: 22, fontFamily: 'Inter_400Regular' },
  bodyLgMedium: { fontSize: 16, lineHeight: 22, fontFamily: 'Inter_500Medium' },
  body: { fontSize: 14, lineHeight: 18, fontFamily: 'Inter_400Regular' },
  bodyMedium: { fontSize: 14, lineHeight: 18, fontFamily: 'Inter_500Medium' },
  caption: { fontSize: 12, lineHeight: 16, fontFamily: 'Inter_400Regular' },
  captionMedium: { fontSize: 12, lineHeight: 16, fontFamily: 'Inter_500Medium' },
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

/** Border radius scale từ Figma */
export const Radius = {
  sm: 6,
  md: 10,
  lg: 12,
  xl: 20,
  '2xl': 24,
  pill: 43,
  full: 9999,
} as const;

/** Tab bar clearance */
export const BottomTabInset = Platform.select({ ios: 96, android: 104 }) ?? 96;
export const MaxContentWidth = 800;

/** Shadow Airbnb-style: 0 0 8px rgba(0,0,0,0.12) — dùng kèm border hairline */
export const HoteliqShadow = Platform.select({
  ios: {
    shadowColor: Hoteliq.shadow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  android: { elevation: 3 },
  default: {},
});
