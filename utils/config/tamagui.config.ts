import { createTamagui, createTokens } from 'tamagui';
import { shorthands } from '@tamagui/shorthands';
import { themes, tokens as tamaguiTokens } from '@tamagui/themes';
import { createAnimations } from '@tamagui/animations-react-native';

// Define color palette
const colors = {
  primary: '#3A59D1',
  secondary: '#3D90D7',
  other: '#7AC6D2',
  accent: '#B5FCCD',
  error: '#EF4444',
  white: '#FFFFFF',
  black: '#000000',
} as const;

// Create custom tokens
const tokens = createTokens({
  ...tamaguiTokens,
  color: {
    ...tamaguiTokens.color,
    ...colors,
  },
});

// Define animations with proper typing
const animations = createAnimations({
  bouncy: {
    type: 'spring',
    damping: 10,
    mass: 0.9,
    stiffness: 100,
  },
  lazy: {
    type: 'spring',
    damping: 20,
    stiffness: 60,
  },
  quick: {
    type: 'spring',
    damping: 20,
    mass: 1.2,
    stiffness: 250,
  },
});

// Theme configuration with proper typing
const customTheme = {
  light: {
    backgroundLight: colors.white,
    background: '#F5F5F5',
    textLight: '#111827',
    text: '#374151',
    textSubtle: '#6B7280',
    textMuted: '#9CA3AF',
    primary: colors.primary,
    secondary: colors.secondary,
    accent: colors.accent,
    other: colors.other,
    cardLight: colors.white,
    card: '#F9FAFB',
    borderLight: '#E5E7EB',
    border: '#D1D5DB',
    shadowLight: 'rgba(0, 0, 0, 0.05)',
    shadow: 'rgba(0, 0, 0, 0.1)',
    buttonText: colors.white,
    error: colors.error,
  },
  dark: {
    backgroundDark: '#111827',
    background: '#1F2937',
    textDark: '#F9FAFB',
    text: '#E5E7EB',
    textSubtle: '#9CA3AF',
    textMuted: '#6B7280',
    primary: colors.primary,
    secondary: colors.secondary,
    accent: colors.accent,
    other: colors.other,
    cardDark: '#1F2937',
    card: '#374151',
    borderDark: '#4B5563',
    border: '#6B7280',
    shadowDark: 'rgba(0, 0, 0, 0.3)',
    shadow: 'rgba(0, 0, 0, 0.2)',
    buttonText: colors.white,
    error: colors.error,
  },
} as const;

// Create and export Tamagui config
export const config = createTamagui({
  defaultTheme: 'light',
  shouldAddPrefersColorThemes: true,
  themeClassNameOnRoot: true,
  animations,
  shorthands,
  tokens,
  themes: {
    ...themes,
    light: {
      ...themes.light,
      ...customTheme.light,
    },
    dark: {
      ...themes.dark,
      ...customTheme.dark,
    },
  },
});

// Type declarations
export type AppConfig = typeof config;

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}