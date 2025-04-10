/**
 * Delete Confirmation Component
 * 
 * Provides a confirmation UI for destructive actions like data deletion
 * with clearly marked actions and warning text
 */
import React from 'react';
import { View } from 'react-native';
import { Button, Text, Icon } from 'react-native-paper';
import { useTheme } from '../context/themeContext';

/**
 * Props for the DeleteConfirmation component
 */
interface DeleteConfirmationProps {
    onDelete: () => void;
    onCancel: () => void;
}

/**
 * Renders a delete confirmation dialog with warning text and action buttons
 * 
 * @param {DeleteConfirmationProps} props - Component properties
 * @returns {JSX.Element} Delete confirmation component
 */
export function DeleteConfirmation({ onDelete, onCancel }: DeleteConfirmationProps) {
    const { theme } = useTheme();

    return (
        <View className="gap-2 mt-2">
            <View className="flex-row items-center justify-center mb-3">
                <Icon
                    source="alert-circle"
                    size={24}
                    color={theme.colors.error}
                />
                <Text 
                    className="ml-2 text-center font-medium"
                    style={{ color: theme.colors.error }}
                >
                    This will delete all your data permanently!
                </Text>
            </View>
            
            <Button 
                mode="contained"
                onPress={onDelete}
                className="mb-2"
                buttonColor={theme.colors.error}
                icon="delete"
            >
                Yes, Delete Everything
            </Button>
            
            <Button 
                mode="outlined"
                onPress={onCancel}
                className="mb-1"
            >
                Cancel
            </Button>
        </View>
    );
}
