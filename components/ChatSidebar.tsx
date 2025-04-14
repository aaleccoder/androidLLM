import React, { useState, useRef, useEffect } from 'react';
import { ScrollView, Animated, Pressable, TouchableWithoutFeedback, View } from 'react-native';
import { useTheme } from '../context/themeContext';
import { ChatThread, useData } from '../context/dataContext';
import { useAuth } from '../hooks/useAuth';
import * as Haptics from 'expo-haptics';
import { Text as PaperText, Button as PaperButton, Modal } from 'react-native-paper';

// Import Lucide icons
import { Plus, X, Trash } from "lucide-react-native";

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
  const { isDarkMode, theme } = useTheme();
  const { data, deleteChatThread } = useData();
  const { getCurrentPassword } = useAuth();
  const [deleteConfirmThreadId, setDeleteConfirmThreadId] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const translateX = useRef(new Animated.Value(-300)).current;

  useEffect(() => {
    if (isVisible) {
      Animated.timing(translateX, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(translateX, {
        toValue: -300,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible]);

  if (!isVisible) return null;

  const handlePressOverlay = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

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

      // Provide success feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // If this was the active thread or it was the last thread, close the sidebar
      if (deleteConfirmThreadId === currentThreadId || (data?.chatThreads || []).length <= 1) {
        onClose();
      }
    } catch (error) {
      console.error('Error deleting thread:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmThreadId(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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

  const chatThreads = data?.chatThreads
    ? [...data.chatThreads].sort((a, b) => b.updatedAt - a.updatedAt)
    : [];

  const currentChat = data?.chatThreads?.find(thread => thread.id === currentThreadId);
  const canCreateNewChat = !currentChat || currentChat.messages.length > 0;

  return (
    <>
      <TouchableWithoutFeedback onPress={handlePressOverlay}>
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 9,
          }}
        />
      </TouchableWithoutFeedback>

      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: 300,
          zIndex: 10,
          shadowColor: '#000',
          shadowOffset: { width: 2, height: 0 },
          shadowOpacity: 0.2,
          shadowRadius: 3,
          transform: [{ translateX }],
        }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: isDarkMode ? '#171717' : '#fafafa',
          }}
        >
          <View className="space-y-2 p-2">
            <PaperButton
              onPress={handleNewChat}
              disabled={!canCreateNewChat}
              style={{ opacity: canCreateNewChat ? 1 : 0.5, borderRadius: 8 }}
            >
              <View className="flex-row items-center space-x-2">
                <Plus size={16} color={isDarkMode ? "#FFFFFF" : "#000000"} />
                <PaperText style={{ color: isDarkMode ? '#ffffff' : '#171717' }}>New Chat</PaperText>
              </View>
            </PaperButton>

            {chatThreads.length === 0 ? (
              <View className="flex-1 justify-center items-center p-2">
                <PaperText
                  className="text-center"
                  style={{ color: isDarkMode ? '#a3a3a3' : '#737373' }}
                >
                  No chat history yet. Start a new conversation!
                </PaperText>
              </View>
            ) : (
              <ScrollView>
                <View className="space-y-1">
                  {chatThreads.map(thread => {
                    const isSelected = thread.id === currentThreadId;
                    return (
                      <Pressable
                        key={thread.id}
                        onPress={() => handleSelectThread(thread.id)}
                      >
                        <View
                          style={{
                            backgroundColor: isSelected
                              ? isDarkMode ? '#262626' : '#f5f5f5'
                              : 'transparent',
                            borderRadius: 8,
                            borderLeftWidth: 2,
                            borderLeftColor: isSelected ? '#3A59D1' : 'transparent',
                            paddingVertical: 8,
                            paddingHorizontal: 12,
                          }}
                        >
                          <View className="flex-row items-center justify-between">
                            <View className="flex-1 space-y-0">
                              <PaperText
                                style={{
                                  color: isSelected
                                    ? '#3A59D1'
                                    : isDarkMode ? '#ffffff' : '#171717'
                                }}
                                numberOfLines={1}
                              >
                                {thread.title}
                              </PaperText>
                              <PaperText
                                style={{ color: isDarkMode ? '#a3a3a3' : '#737373' }}
                              >
                                {formatDate(thread.updatedAt)}
                              </PaperText>
                            </View>
                            {enableEditing && (
                              <PaperButton
                                onPress={() => confirmDeleteThread(thread.id)}
                                style={{ borderRadius: 8, margin: 0 }}
                              >
                                <Trash size={14} color={isDarkMode ? "#FFFFFF" : "#000000"} />
                              </PaperButton>
                            )}
                          </View>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Animated.View>

      <Modal
        visible={!!deleteConfirmThreadId}
        onDismiss={handleCancelDelete}
      >
        <View className="flex-1 justify-end bg-zinc-800/50">
          <View className="bg-zinc-50 dark:bg-zinc-800 rounded-t-2xl p-4">
            <View className="space-y-4">
              <PaperText className="text-xl font-semibold">Delete Chat</PaperText>
              <PaperText style={{ color: isDarkMode ? '#ffffff' : '#171717' }}>
                Are you sure you want to delete this conversation? This action cannot be undone.
              </PaperText>
              <View className="flex-row justify-between space-x-3">
                <PaperButton
                  onPress={handleCancelDelete}
                  style={{ borderRadius: 8, flex: 1 }}
                >
                  Cancel
                </PaperButton>
                <PaperButton
                  onPress={handleDeleteThread}
                  style={{ borderRadius: 8, flex: 1, backgroundColor: '#e63946' }}
                  labelStyle={{ color: '#fff' }}
                >
                  Delete
                </PaperButton>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};