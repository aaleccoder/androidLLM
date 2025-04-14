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
  Modal,
  Portal,
  Text,
  Button,
  Card
} from 'react-native-paper';

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
    <Portal>
      <Modal
        visible={isOpen}
        onDismiss={onClose}
        contentContainerStyle={{
          backgroundColor: isDarkMode ? '#222' : '#fff',
          padding: 20,
          borderRadius: 10,
        }}
      >
        <Card>
          <Card.Content>
            <Text 
              style={{
                fontSize: 20,
                fontWeight: 'bold',
                color: isDarkMode ? '#fff' : '#000',
              }}
            >
              {title}
            </Text>
            
            <Text
              style={{
                fontSize: 16,
                color: isDarkMode ? '#ccc' : '#333',
                marginVertical: 10,
              }}
            >
              {message}
            </Text>
            
            <Card.Actions style={{ justifyContent: 'space-between' }}>
              <Button
                mode="outlined"
                onPress={onClose}
                style={{
                  flex: 1,
                  marginRight: 10,
                  borderColor: isDarkMode ? '#333' : '#eee',
                }}
                labelStyle={{
                  color: isDarkMode ? '#fff' : '#000',
                }}
              >
                Cancel
              </Button>
              
              <Button
                mode="contained"
                onPress={onDelete}
                style={{
                  flex: 1,
                  backgroundColor: '#e63946',
                }}
                labelStyle={{
                  color: '#fff',
                }}
                icon={() => <Trash size={18} color="#fff" />}
              >
                Delete
              </Button>
            </Card.Actions>
          </Card.Content>
        </Card>
      </Modal>
    </Portal>
  );
};
