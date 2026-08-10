/**
 * Design tokens — Hanoi Residences Mobile
 * Hoteliq visual system (#4C4DDC) layered on product data/logic.
 */

import '@/global.css';

import { Platform } from 'react-native';

/** Hoteliq palette from Figma style guide */
export const Hoteliq = {
  primary: '#4C4DDC',
  primarySoft: '#E4E4FA',
  primaryMuted: '#C8C8F4',
  ink: '#101010',
  muted: '#878787',
  mutedLight: '#A0A0A0',
  line: '#E1E1E1',
  canvas: '#FFFFFF',
  chip: '#F5F5F5',
  heart: '#FF4D67',
  star: '#FFC107',
  shadow: '#070707',
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

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

/** Hoteliq tab bar clearance */
export const BottomTabInset = Platform.select({ ios: 96, android: 104 }) ?? 96;
export const MaxContentWidth = 800;

export const HoteliqShadow = Platform.select({
  ios: {
    shadowColor: Hoteliq.shadow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
  },
  android: { elevation: 3 },
  default: {},
});
