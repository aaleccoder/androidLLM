import { createConfig } from "@gluestack-ui/themed";
import { config as defaultConfig } from "@gluestack-ui/config";

// Ensure proper configuration with better compatibility
export const config = createConfig({
  ...defaultConfig,
  tokens: {
    ...defaultConfig.tokens,
    colors: {
      ...defaultConfig.tokens.colors,
      primary: '#10a37f',
      secondary: '#343541',
      neutral: {
        50: '#FAFAFA',
        100: '#F4F4F5',
        200: '#E4E4E7',
        300: '#D4D4D8',
        400: '#A1A1AA',
        500: '#71717A',
        600: '#52525B',
        700: '#3F3F46',
        800: '#27272A',
        900: '#18181B',
        950: '#09090B',
      },
    },
    radii: {
      ...defaultConfig.tokens.radii,
      xs: 6,
      sm: 8,
      md: 12,
      lg: 16,
      xl: 20,
      "2xl": 24,
      "3xl": 28,
      full: 9999,
    },
  },
  components: {
    ...defaultConfig.components,
    // Only modify components that we're actually using to minimize conflicts
    Button: {
      ...defaultConfig.components.Button,
      theme: {
        ...defaultConfig.components.Button.theme,
        borderRadius: "$xl",
        height: "$12",
      },
    },
    Input: {
      ...defaultConfig.components.Input,
      theme: {
        ...defaultConfig.components.Input.theme,
        borderRadius: "$xl",
      },
    },
  },
});

type Config = typeof config;
export type { Config };