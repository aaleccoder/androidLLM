import React, { useState, useRef, useEffect } from 'react';
import { ScrollView, Animated, Pressable, TouchableWithoutFeedback, View, ViewStyle, Text, TouchableOpacity, Modal } from 'react-native';
import { useTheme } from '../context/themeContext';
import { ChatThread, useData } from '../context/dataContext';
import { useAuth } from '../hooks/useAuth';
import * as Haptics from 'expo-haptics';

// Import Lucide icons
import { Plus, X, Trash } from "lucide-react-native";

interface ChatSidebarProps {
  isVisible: boolean;
  onClose: () => void;
  onNewChat: () => void;
  currentThreadId?: string;
  onSelectThread: (threadId: string) => void;
  enableEditing: boolean;
  className?: string;
  style?: ViewStyle | ViewStyle[];
}

export const ChatSidebar = ({
  isVisible,
  onClose,
  onNewChat,
  currentThreadId,
  onSelectThread,
  enableEditing,
  className,
  style
}: ChatSidebarProps) => {
  const { isDarkMode } = useTheme();
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
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

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
        <View className="absolute inset-0 bg-black/50 z-10" />
      </TouchableWithoutFeedback>

      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            width: 300,
            zIndex: 20,
            shadowColor: '#000',
            shadowOffset: { width: 2, height: 0 },
            shadowOpacity: 0.2,
            shadowRadius: 3,
            transform: [{ translateX }],
          },
          style
        ]}
        className={className}
      >
        <View className={`flex-1 ${isDarkMode ? 'bg-zinc-900' : 'bg-white'}`}>
          <View className="space-y-2 p-2">
            <TouchableOpacity
              onPress={handleNewChat}
              disabled={!canCreateNewChat}
              className={`flex-row items-center space-x-2 p-3 rounded-lg ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-100'} ${!canCreateNewChat ? 'opacity-50' : ''}`}
            >
              <Plus size={16} color={isDarkMode ? "#FFFFFF" : "#000000"} />
              <Text className={`${isDarkMode ? 'text-white' : 'text-black'}`}>New Chat</Text>
            </TouchableOpacity>

            {chatThreads.length === 0 ? (
              <View className="flex-1 justify-center items-center p-2">
                <Text className={`text-center ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  No chat history yet. Start a new conversation!
                </Text>
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
                          className={`p-3 rounded-lg ${isSelected ? isDarkMode ? 'bg-zinc-800' : 'bg-zinc-100' : ''} 
                            ${isSelected ? 'border-l-2 border-blue-500' : ''}`}
                        >
                          <View className="flex-row items-center justify-between">
                            <View className="flex-1">
                              <Text 
                                className={`${isSelected ? 'text-blue-500' : isDarkMode ? 'text-white' : 'text-black'}`}
                                numberOfLines={1}
                              >
                                {thread.title}
                              </Text>
                              <Text className={isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}>
                                {formatDate(thread.updatedAt)}
                              </Text>
                            </View>
                            {enableEditing && (
                              <TouchableOpacity
                                onPress={() => confirmDeleteThread(thread.id)}
                                className="p-2 rounded-lg"
                              >
                                <Trash size={14} color={isDarkMode ? "#FFFFFF" : "#000000"} />
                              </TouchableOpacity>
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
        transparent={true}
        animationType="slide"
        onRequestClose={handleCancelDelete}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className={`rounded-t-2xl p-4 ${isDarkMode ? 'bg-zinc-800' : 'bg-white'}`}>
            <View className="space-y-4">
              <Text className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-black'}`}>Delete Chat</Text>
              <Text className={isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}>
                Are you sure you want to delete this conversation? This action cannot be undone.
              </Text>
              <View className="flex-row justify-between space-x-3">
                <TouchableOpacity
                  onPress={handleCancelDelete}
                  className={`flex-1 p-3 rounded-lg ${isDarkMode ? 'bg-zinc-700' : 'bg-zinc-100'}`}
                >
                  <Text className={`text-center ${isDarkMode ? 'text-white' : 'text-black'}`}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleDeleteThread}
                  className="flex-1 p-3 rounded-lg bg-red-500"
                >
                  <Text className="text-center text-white">Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};