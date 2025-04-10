import React, { createContext, useContext, useState, useEffect } from 'react';
import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import { useColorScheme } from 'react-native';

// Gemini-inspired colors
const geminiColors = {
  light: {
    primary: '#1a73e8', // Google blue
    background: '#FFFFFF',
    surface: '#FFFFFF',
    botBubble: '#F0F0F0',
  },
  dark: {
    primary: '#8ab4f8', // Google blue for dark mode
    background: '#0F0F0F',
    surface: '#1F1F1F',
    botBubble: '#303030',
  }
};

// Create theme based on the isDarkMode flag
export const createTheme = (isDarkMode: boolean) => {
  const baseTheme = isDarkMode ? MD3DarkTheme : MD3LightTheme;
  const colors = isDarkMode ? geminiColors.dark : geminiColors.light;
  
  return {
    ...baseTheme,
    dark: isDarkMode,
    roundness: 20,
    colors: {
      ...baseTheme.colors,
      primary: colors.primary,
      background: colors.background,
      surface: colors.surface,
      botBubble: colors.botBubble,
    }
  };
};

const ThemeContext = createContext({
  theme: createTheme(false),
  isDarkMode: false,
  toggleTheme: () => {}, // Default no-op function
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

// Export ThemeContext so it can be imported elsewhere
export { ThemeContext };
