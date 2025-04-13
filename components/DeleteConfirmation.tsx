/**
 * Delete Confirmation Component
 * 
 * Provides a confirmation UI for destructive actions like data deletion
 * with clearly marked actions and warning text
 */
import React from 'react';
import { useTheme } from '../context/themeContext';
import { Trash } from 'lucide-react-native';
import { 
  Sheet,
  YStack,
  Text,
  XStack,
  Button
} from 'tamagui';

/**
 * Props for the DeleteConfirmation component
 */
interface DeleteConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
  title?: string;
  message?: string;
}

/**
 * Renders a delete confirmation dialog with warning text and action buttons
 * 
 * @param {DeleteConfirmationProps} props - Component properties
 * @returns {JSX.Element} Delete confirmation component
 */
export const DeleteConfirmation = ({
  isOpen,
  onClose,
  onDelete,
  title = "Delete Confirmation",
  message = "Are you sure you want to delete this item? This action cannot be undone."
}: DeleteConfirmationProps) => {
  const { isDarkMode } = useTheme();

  return (
    <Sheet
      modal
      open={isOpen}
      onOpenChange={onClose}
      snapPoints={[30]}
      position={0}
      dismissOnSnapToBottom
    >
      <Sheet.Overlay 
        backgroundColor={isDarkMode ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.3)'}
        animation="lazy"
      />
      <Sheet.Frame
        padding="$4"
        backgroundColor={isDarkMode ? '#222' : '#fff'}
        borderTopLeftRadius="$6"
        borderTopRightRadius="$6"
      >
        <YStack space="$4">
          <Text 
            fontSize="$6" 
            fontWeight="bold"
            color={isDarkMode ? '#fff' : '#000'}
          >
            {title}
          </Text>
          
          <Text
            fontSize="$4"
            color={isDarkMode ? '#ccc' : '#333'}
          >
            {message}
          </Text>
          
          <XStack space="$4" justifyContent="space-between">
            <Button
              flex={1}
              backgroundColor={isDarkMode ? '#333' : '#eee'}
              color={isDarkMode ? '#fff' : '#000'}
              onPress={onClose}
            >
              Cancel
            </Button>
            
            <Button
              flex={1}
              backgroundColor="#e63946"
              color="#fff"
              onPress={onDelete}
              icon={<Trash size={18} color="#fff" />}
            >
              Delete
            </Button>
          </XStack>
        </YStack>
      </Sheet.Frame>
    </Sheet>
  );
};
