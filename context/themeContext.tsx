import React, { createContext, useContext, useState, useEffect } from 'react';
import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import { useColorScheme } from 'react-native';

// Gemini-inspired colors
const chatGPTColors = {
  light: {
    primary: '#10a37f',
    background: '#F8F9FA',
    surface: '#F1F3F5',
    userBubble: '#10a37f',     // Use primary color for user bubbles in light mode
    assistantBubble: '#FFFFFF',
    text: '#1F2937',          // Darker text for better contrast
    accent: '#10a37f',        // Match primary color
    onSurface: '#1F2937',     // Text color on surfaces
  },
  dark: {
    primary: '#0B8161',
    background: '#121416',
    surface: '#212529',
    userBubble: '#343541',
    assistantBubble: '#444654',
    text: '#E9ECEF',
    accent: '#10a37f',
    onSurface: '#E9ECEF',     // Light text for dark surfaces
  }
};

// Create theme based on the isDarkMode flag
export const createTheme = (isDarkMode: boolean) => {
  const baseTheme = isDarkMode ? MD3DarkTheme : MD3LightTheme;
  const colors = isDarkMode ? chatGPTColors.dark : chatGPTColors.light;
  
  return {
    ...baseTheme,
    dark: isDarkMode,
    roundness: 20,
    colors: {
      ...baseTheme.colors,
      primary: colors.primary,
      background: colors.background,
      surface: colors.surface,
      userBubble: colors.userBubble,
      assistantBubble: colors.assistantBubble,
      text: colors.text,
      accent: colors.accent,
      onSurface: colors.onSurface,
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
