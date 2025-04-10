/**
 * Password Input Component
 * 
 * A themed secure text input for password entry with:
 * - Masked text entry
 * - Proper styling based on current theme
 * - Show/hide password option
 */
import { TextInput } from 'react-native-paper';
import { useTheme } from '../context/themeContext';

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
    const { theme } = useTheme();
    
    return (
        <TextInput
            mode="outlined"
            label={label}
            placeholder={`Enter ${label.toLowerCase()}`}
            secureTextEntry
            className="mb-4"
            theme={theme}
            value={value}
            onChangeText={onChangeText}
            right={<TextInput.Icon icon="eye" />}
        />
    );
}
