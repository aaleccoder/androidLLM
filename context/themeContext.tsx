import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';

// Define a simple theme structure
const lightTheme = {
  background: '#f0f0f0',
  text: '#333',
  inputBackground: '#fff',
  inputBorder: '#ccc',
};

const darkTheme = {
  background: '#fff',
  text: '#f0f0f0',
  inputBackground: '#444',
  inputBorder: '#555',
};

// Define the theme type
export type Theme = typeof lightTheme;

interface ThemeContextType {
  theme: Theme;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

// Create the theme context with default values
const ThemeContext = createContext<ThemeContextType>({
  theme: lightTheme, // Default to light theme
  isDarkMode: false,
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const colorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(colorScheme === 'dark');
  const [theme, setTheme] = useState<Theme>(isDarkMode ? darkTheme : lightTheme);

  useEffect(() => {
    setIsDarkMode(colorScheme === 'dark');
    setTheme(colorScheme === 'dark' ? darkTheme : lightTheme);
  }, [colorScheme]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    setTheme(!isDarkMode ? darkTheme : lightTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook to consume the theme context
export const useTheme = () => {
  return useContext(ThemeContext);
};

export const createTheme = (isDarkMode: boolean) => {
  return isDarkMode ? darkTheme : lightTheme;
};

export { ThemeContext };
