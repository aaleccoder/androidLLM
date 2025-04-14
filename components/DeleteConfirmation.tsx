import React from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/themeContext';

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
  const { isDarkMode } = useTheme();

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isOpen}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center bg-black/50">
        <View className={`w-[80%] rounded-2xl p-5 ${isDarkMode ? 'bg-zinc-800' : 'bg-white'}`}>
          <Text className={`text-xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-black'}`}>
            {title}
          </Text>
          <Text className={`text-base mb-5 ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>
            {message}
          </Text>
          <View className="flex-row justify-end space-x-3">
            <TouchableOpacity
              onPress={onClose}
              className={`px-4 py-2 rounded-lg ${isDarkMode ? 'bg-zinc-700' : 'bg-zinc-100'}`}
            >
              <Text className={isDarkMode ? 'text-white' : 'text-black'}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onDelete}
              className="px-4 py-2 rounded-lg bg-red-500"
            >
              <Text className="text-white">Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
