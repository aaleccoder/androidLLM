import React, { createContext, useContext, useState, useEffect } from 'react';
import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import { useColorScheme } from 'react-native';
import { themeColors } from '../utils/theme';

// Define theme based on the isDarkMode flag
export const createTheme = (isDarkMode: boolean) => {
  const colors = isDarkMode ? themeColors.dark : themeColors.light;
  
  return {
    ...(isDarkMode ? MD3DarkTheme : MD3LightTheme),
    colors: {
      ...(isDarkMode ? MD3DarkTheme : MD3LightTheme).colors,
      ...colors,
    }
  };
};

interface ThemeContextType {
  theme: ReturnType<typeof createTheme>;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: createTheme(false),
  isDarkMode: false,
  toggleTheme: () => {},
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
    <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

export { ThemeContext };
