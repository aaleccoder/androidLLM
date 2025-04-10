import React, { useState } from 'react';
import { View, TouchableOpacity, Text, ScrollView, StyleSheet } from 'react-native';
import { Surface, IconButton, Modal, Portal, Button, Divider } from 'react-native-paper';
import { useTheme } from '../context/themeContext';
import { ChatThread, useData } from '../context/dataContext';
import { useAuth } from '../hooks/useAuth';
import * as Haptics from 'expo-haptics';

interface ChatSidebarProps {
  isVisible: boolean;
  onClose: () => void;
  onNewChat: () => void;
  currentThreadId?: string;
  onSelectThread: (threadId: string) => void;
  enableEditing: boolean;
}

export const ChatSidebar = ({
  isVisible,
  onClose,
  onNewChat,
  currentThreadId,
  onSelectThread,
  enableEditing
}: ChatSidebarProps) => {
  const { theme, isDarkMode } = useTheme();
  const { data, deleteChatThread } = useData();
  const { getCurrentPassword } = useAuth();
  const [deleteConfirmThreadId, setDeleteConfirmThreadId] = useState<string | null>(null);
  
  const chatThreads = data?.chatThreads 
    ? [...data.chatThreads].sort((a, b) => b.updatedAt - a.updatedAt) 
    : [];

  const handleSelectThread = (threadId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelectThread(threadId);
    onClose();
  };

  const handleNewChat = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onNewChat();
    onClose();
  };

  const confirmDeleteThread = (threadId: string) => {
    setDeleteConfirmThreadId(threadId);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  };

  const handleDeleteThread = async () => {
    if (!deleteConfirmThreadId) return;
    
    try {
      const password = getCurrentPassword();
      if (!password) {
        console.error('Cannot delete thread: No password available');
        return;
      }
      
      await deleteChatThread(deleteConfirmThreadId, password);
      setDeleteConfirmThreadId(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error deleting thread:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const renderThreadItem = (thread: ChatThread) => {
    const isSelected = thread.id === currentThreadId;
    return (
      <Surface
        key={thread.id}
        className={`mx-2 my-1 rounded-lg overflow-hidden border-l-3 ${
          isSelected 
            ? isDarkMode 
              ? 'bg-primary/20 border-l-primary' 
              : 'bg-primary/10 border-l-primary'
            : 'border-l-transparent'
        }`}
        elevation={0}
      >
        <TouchableOpacity
          className="flex-row px-4 py-4 items-center justify-between"
          onPress={() => handleSelectThread(thread.id)}
        >
          <View className="flex-1 mr-2">
            <Text
              className={`text-sm mb-1 ${
                isSelected 
                  ? 'font-medium text-primary' 
                  : isDarkMode 
                    ? 'text-neutral-100' 
                    : 'text-neutral-900'
              }`}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {thread.title}
            </Text>
            <Text className={`text-xs ${isDarkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>
              {formatDate(thread.updatedAt)}
            </Text>
          </View>
          {enableEditing && (
            <IconButton
              icon="delete-outline"
              size={18}
              iconColor={theme.colors.error}
              className="m-0"
              onPress={() => confirmDeleteThread(thread.id)}
            />
          )}
        </TouchableOpacity>
      </Surface>
    );
  };

  return (
    <>
      {isVisible && (
        <Surface
          className={`absolute left-0 top-0 bottom-0 w-[300px] z-10 ${isDarkMode ? 'bg-neutral-900' : 'bg-white'}`}
          elevation={4}
        >
          <View className="flex-row justify-between items-center px-4 py-3">
            <Text className={`text-lg font-medium ${isDarkMode ? 'text-neutral-100' : 'text-neutral-900'}`}>
              Chat History
            </Text>
            <View className="flex-row items-center">
              <IconButton
                icon="plus"
                size={24}
                iconColor={theme.colors.primary}
                onPress={handleNewChat}
                className="m-0"
              />
              <IconButton
                icon="close"
                size={24}
                iconColor={isDarkMode ? theme.colors.onSurface : theme.colors.onSurface}
                onPress={onClose}
                className="m-0"
              />
            </View>
          </View>
          
          <Divider className={isDarkMode ? 'bg-neutral-800' : 'bg-neutral-200'} />

          <Button
            mode="outlined"
            icon="plus"
            className="mx-4 my-4 rounded-xl border-primary"
            textColor={theme.colors.primary}
            onPress={handleNewChat}
          >
            New Chat
          </Button>

          <ScrollView className="flex-1">
            {chatThreads.length === 0 ? (
              <View className="p-6">
                <Text className={`text-center ${isDarkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>
                  No chat history yet. Start a new conversation!
                </Text>
              </View>
            ) : (
              chatThreads.map(renderThreadItem)
            )}
          </ScrollView>
        </Surface>
      )}
      
      <Portal>
        <Modal
          visible={!!deleteConfirmThreadId}
          onDismiss={() => setDeleteConfirmThreadId(null)}
          contentContainerStyle={[
            styles.modalContainer,
            isDarkMode ? styles.modalContainerDark : styles.modalContainerLight,
          ]}
        >
          <Text className={`text-lg font-medium mb-3 ${isDarkMode ? 'text-neutral-100' : 'text-neutral-900'}`}>
            Delete Chat
          </Text>
          <Text className={`mb-6 ${isDarkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>
            Are you sure you want to delete this conversation? This action cannot be undone.
          </Text>
          <View className="flex-row justify-end">
            <Button 
              mode="outlined"
              onPress={() => setDeleteConfirmThreadId(null)}
              className="mr-3"
            >
              Cancel
            </Button>
            <Button 
              mode="contained"
              onPress={handleDeleteThread}
              buttonColor={theme.colors.error}
            >
              Delete
            </Button>
          </View>
        </Modal>
      </Portal>
    </>
  );
};

// Define styles for the modal container
const styles = StyleSheet.create({
  modalContainer: {
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 10,
    borderWidth: 1,
  },
  modalContainerLight: {
    backgroundColor: 'white',
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalContainerDark: {
    backgroundColor: '#1c1c1c',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
});