import React, { createContext, useContext, useState, useEffect } from 'react';
import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import { useColorScheme } from 'react-native';
import { themeColors } from '../utils/theme';
import { createTamagui } from 'tamagui';
import { config } from '../utils/config/tamagui.config';

// Initialize Tamagui with our config
const tamaguiConfig = createTamagui(config);

// Create theme based on the isDarkMode flag
export const createTheme = (isDarkMode: boolean) => {
  const baseTheme = isDarkMode ? MD3DarkTheme : MD3LightTheme;
  const colors = isDarkMode ? themeColors.dark : themeColors.light;
  
  return {
    ...baseTheme,
    dark: isDarkMode,
    roundness: 20,
    colors: {
      ...baseTheme.colors,
      ...colors,
    }
  };
};

interface ThemeContextType {
  theme: ReturnType<typeof createTheme>;
  isDarkMode: boolean;
  toggleTheme: () => void;
  tamaguiConfig: typeof tamaguiConfig;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: createTheme(false),
  isDarkMode: false,
  toggleTheme: () => {},
  tamaguiConfig,
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const colorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(colorScheme === 'dark');
  
  useEffect(() => {
    setIsDarkMode(colorScheme === 'dark');
  }, [colorScheme]);
  
  const theme = createTheme(isDarkMode);
  
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };
  
  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme, tamaguiConfig }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

export { ThemeContext };
