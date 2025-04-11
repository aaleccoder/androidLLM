/**
 * Delete Confirmation Component
 * 
 * Provides a confirmation UI for destructive actions like data deletion
 * with clearly marked actions and warning text
 */
import React from 'react';
import { AlertTriangle, Trash } from 'lucide-react-native';
import { useTheme } from '../context/themeContext';
import {
  VStack,
  HStack,
  Button,
  ButtonText,
  Text,
  Box
} from '@gluestack-ui/themed';

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
  const { isDarkMode } = useTheme();

  return (
    <VStack className="gap-2 mt-2">
      <HStack className="items-center justify-center mb-3">
        <AlertTriangle size={24} color="#ef4444" />
        <Text className={`ml-2 text-center font-medium ${isDarkMode ? 'text-error-500' : 'text-error-600'}`}>
          This will delete all your data permanently!
        </Text>
      </HStack>
      
      <Button 
        action="negative"
        className="mb-2"
        onPress={onDelete}
      >
        <Trash size={16} color="white" style={{ marginRight: 8 }} />
        <ButtonText>Yes, Delete Everything</ButtonText>
      </Button>
      
      <Button 
        variant="outline"
        className="mb-1"
        onPress={onCancel}
      >
        <ButtonText>Cancel</ButtonText>
      </Button>
    </VStack>
  );
}
