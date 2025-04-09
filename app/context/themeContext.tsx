import { createContext, useContext } from 'react';
import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

type ThemeContextType = {
  isDarkMode: boolean;
  setIsDarkMode: (isDark: boolean) => void;
  theme: typeof MD3DarkTheme;
};

const createTheme = (isDark: boolean) => ({
  ...(isDark ? MD3DarkTheme : MD3LightTheme),
  fonts: {
    ...(isDark ? MD3DarkTheme : MD3LightTheme).fonts,
    regular: { fontFamily: 'Poppins-Regular' },
    medium: { fontFamily: 'Poppins-Medium' },
    bold: { fontFamily: 'Poppins-Bold' },
  },
});

export const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: true,
  setIsDarkMode: () => {},
  theme: createTheme(true),
});

export const useTheme = () => useContext(ThemeContext);
export { createTheme };
