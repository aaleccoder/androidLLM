import React from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';

interface DeleteConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
  title: string;
  message: string;
}

export const DeleteConfirmation: React.FC<DeleteConfirmationProps> = ({ 
  isOpen, 
  onClose, 
  onDelete, 
  title, 
  message 
}) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isOpen}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center bg-black/50">
        <View className="w-[80%] rounded-2xl p-5 bg-primary">
          <Text className="text-xl font-bold mb-3 text-text">
            {title}
          </Text>
          <Text className="text-base mb-5 text-text opacity-80">
            {message}
          </Text>
          <View className="flex-row justify-end space-x-3">
            <TouchableOpacity
              onPress={onClose}
              className="px-4 py-2 rounded-lg bg-background"
            >
              <Text className="text-text">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onDelete}
              className="px-4 py-2 rounded-lg bg-accent"
            >
              <Text className="text-text">Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
