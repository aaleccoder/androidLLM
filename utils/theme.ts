import { tokens } from '@tamagui/themes'
import { createTokens } from 'tamagui'

// Define color palette based on your tamagui.config.ts
const customColors = {
  primary: '#3A59D1',
  secondary: '#3D90D7',
  other: '#7AC6D2',
  accent: '#B5FCCD',
  error: '#EF4444',
} as const;

export const themeColors = {
  light: {
    primary: customColors.primary,
    background: '#F5F5F5',
    surface: '#F9FAFB',
    userBubble: customColors.primary,
    assistantBubble: '#F9FAFB',
    text: '#374151',
    accent: customColors.accent,
    onSurface: '#111827',
    card: '#FFFFFF',
    border: '#E5E7EB',
    shadow: 'rgba(0, 0, 0, 0.1)',
    buttonText: '#FFFFFF',
    error: customColors.error,
  },
  dark: {
    primary: customColors.primary,
    background: '#1F2937',
    surface: '#374151',
    userBubble: '#374151',
    assistantBubble: '#4B5563',
    text: '#E5E7EB',
    accent: customColors.accent,
    onSurface: '#F9FAFB',
    card: '#1F2937',
    border: '#4B5563',
    shadow: 'rgba(0, 0, 0, 0.3)',
    buttonText: '#FFFFFF',
    error: customColors.error,
  }
} as const;