/**
 * Password Input Component
 * 
 * A themed secure text input for password entry with:
 * - Masked text entry
 * - Proper styling based on current theme
 * - Show/hide password option
 */
import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/themeContext';
import { Eye, EyeOff } from 'lucide-react-native';

/**
 * Props for the PasswordInput component
 */
interface PasswordInputProps {
  password: string;
  setPassword: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

/**
 * Renders a themed password input field
 * 
 * @param {PasswordInputProps} props - Component properties
 * @returns {JSX.Element} Password input component
 */
export const PasswordInput = ({ 
  password, 
  setPassword, 
  placeholder = "Password", 
  autoFocus = false
}: PasswordInputProps) => {
  const { isDarkMode } = useTheme();
  const [showPassword, setShowPassword] = useState(false);

  // Create dynamic styles based on theme
  const dynamicStyles = {
    container: {
      backgroundColor: isDarkMode ? '#333' : '#f5f5f5',
      borderColor: isDarkMode ? '#444' : '#e0e0e0',
    },
    input: {
      color: isDarkMode ? '#fff' : '#000',
    },
    placeholder: {
      color: isDarkMode ? '#888' : '#aaa',
    }
  };

  return (
    <View style={[styles.containerWrapper]}>
      <View style={[styles.container, dynamicStyles.container]}>
        <TextInput
          style={[styles.input, dynamicStyles.input]}
          value={password}
          onChangeText={setPassword}
          placeholder={placeholder}
          placeholderTextColor={isDarkMode ? '#888' : '#aaa'}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoComplete="off"
          autoCorrect={false}
          autoFocus={autoFocus === true}
        />
        <TouchableOpacity 
          style={styles.iconButton}
          onPress={() => setShowPassword(!showPassword)}
        >
          {showPassword ? (
            <EyeOff size={20} color="#3A59D1" />
          ) : (
            <Eye size={20} color="#3A59D1" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  containerWrapper: {
    width: '100%',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    padding: 8,
  },
  input: {
    flex: 1,
    height: 40,
    paddingHorizontal: 8,
  },
  iconButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
