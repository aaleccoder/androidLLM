import React from 'react';
import { TextInput, TextInputProps } from 'react-native';
import { useTheme } from '../context/themeContext';

interface PasswordInputProps {
  placeholder: string;
  password?: string;
  setPassword: (password: string) => void;
  autoFocus?: boolean;
}

export const PasswordInput: React.FC<PasswordInputProps> = ({ 
  placeholder, 
  password, 
  setPassword, 
  autoFocus 
}) => {
  const { isDarkMode } = useTheme();

  return (
    <TextInput
      placeholder={placeholder}
      secureTextEntry
      value={password}
      onChangeText={setPassword}
      autoFocus={autoFocus}
      className={`
        text-base px-4 py-3
        ${isDarkMode ? 'bg-zinc-800 text-white' : 'bg-zinc-100 text-black'}
      rounded-md border-white`}
      placeholderTextColor={isDarkMode ? '#666' : '#999'}
      selectionColor={isDarkMode ? '#fff' : '#000'}
    />
  );
};
