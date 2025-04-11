/**
 * Password Input Component
 * 
 * A themed secure text input for password entry with:
 * - Masked text entry
 * - Proper styling based on current theme
 * - Show/hide password option
 */
import React, { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react-native';
import { useTheme } from '../context/themeContext';
import {
  Input,
  InputField,
  InputSlot,
} from '@gluestack-ui/themed';

/**
 * Props for the PasswordInput component
 */
interface PasswordInputProps {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
}

/**
 * Renders a themed password input field
 * 
 * @param {PasswordInputProps} props - Component properties
 * @returns {JSX.Element} Password input component
 */
export function PasswordInput({ label, value, onChangeText }: PasswordInputProps) {
    const [showPassword, setShowPassword] = useState(false);
    const { isDarkMode, theme } = useTheme();
    
    return (
        <Input
            className="w-full mb-4 rounded-xl"
            variant="outline"
            size="lg"
        >
            <InputSlot pl="$3">
                <Lock size={18} color={theme.colors.accent} />
            </InputSlot>
            <InputField
                placeholder={label}
                value={value}
                onChangeText={onChangeText}
                secureTextEntry={!showPassword}
                className={isDarkMode ? 'text-neutral-100' : 'text-neutral-900'}
                placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
            />
            <InputSlot pr="$3" onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? 
                    <EyeOff size={18} color={isDarkMode ? "#9CA3AF" : "#6B7280"} /> : 
                    <Eye size={18} color={isDarkMode ? "#9CA3AF" : "#6B7280"} />
                }
            </InputSlot>
        </Input>
    );
}
