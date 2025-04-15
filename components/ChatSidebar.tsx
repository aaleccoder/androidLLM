import React, { useState, useRef, useEffect } from 'react';
import { ScrollView, Animated, Pressable, TouchableWithoutFeedback, View, ViewStyle, Text, TouchableOpacity, Modal, FlatList, TextInput, Keyboard } from 'react-native';
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
  const { data, deleteChatThread, saveData, deleteChatThreadInMemory, updateChatThreadInMemory, updateChatThread } = useData();
  const { getCurrentPassword } = useAuth();
  const [deleteConfirmThreadId, setDeleteConfirmThreadId] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [renamingThreadId, setRenamingThreadId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState<string>('');

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

      // In-memory delete for instant UI
      deleteChatThreadInMemory(deleteConfirmThreadId);
      setDeleteConfirmThreadId(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Persist after UI update
      await deleteChatThread(deleteConfirmThreadId, password);

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

  const getLastMessagePreview = (thread: ChatThread): string => {
    if (!thread.messages || thread.messages.length === 0) return '';
    const last = thread.messages[thread.messages.length - 1];
    return last.text.length > 40 ? last.text.slice(0, 40) + '…' : last.text;
  };

  const startRenaming = (thread: ChatThread) => {
    setRenamingThreadId(thread.id);
    setRenameValue(thread.title);
  };

  const cancelRenaming = () => {
    setRenamingThreadId(null);
    setRenameValue('');
  };

  const confirmRename = async (thread: ChatThread) => {
    if (!renameValue.trim() || renameValue === thread.title) {
      cancelRenaming();
      return;
    }
    try {
      const password = getCurrentPassword();
      if (!password) return;

      // In-memory update for instant UI
      updateChatThreadInMemory(thread.id, thread.messages);

      // Persist after UI update
      await updateChatThread(thread.id, thread.messages, password);
      cancelRenaming();
    } catch (e) {
      cancelRenaming();
    }
  };

  const chatThreads = data?.chatThreads
    ? [...data.chatThreads].sort((a, b) => b.updatedAt - a.updatedAt)
    : [];

  const currentChat: ChatThread | undefined = data?.chatThreads?.find(thread => thread.id === currentThreadId);
  // Only disable if the current chat exists and is empty
  const canCreateNewChat: boolean = !(currentChat && currentChat.messages.length === 0);

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
            width: 320,
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
          <View className="space-y-2 p-4">
            <TouchableOpacity
              onPress={handleNewChat}
              disabled={!canCreateNewChat}
              className={`flex-row items-center space-x-2 p-3 rounded-xl ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-100'} ${!canCreateNewChat ? 'opacity-50' : ''}`}
            >
              <Plus size={18} color={isDarkMode ? "#FFFFFF" : "#000000"} />
              <Text className={`font-semibold text-base ${isDarkMode ? 'text-white' : 'text-black'}`}>New Chat</Text>
            </TouchableOpacity>
          </View>
          <View className="flex-1 px-2 pb-4">
            {chatThreads.length === 0 ? (
              <View className="flex-1 justify-center items-center p-2">
                <Text className={`text-center ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>No chat history yet. Start a new conversation!</Text>
              </View>
            ) : (
              <FlatList
                data={chatThreads}
                keyExtractor={item => item.id}
                renderItem={({ item: thread }) => {
                  const isSelected = thread.id === currentThreadId;
                  const isRenaming = renamingThreadId === thread.id;
                  return (
                    <Pressable
                      onPress={() => handleSelectThread(thread.id)}
                      disabled={isRenaming}
                    >
                      <View
                        className={`flex-row items-center p-2 mb-1 rounded-lg transition-all duration-150 ${isSelected ? (isDarkMode ? 'bg-blue-900/40 border-l-4 border-blue-500' : 'bg-blue-100 border-l-4 border-blue-500') : (isDarkMode ? 'bg-zinc-800' : 'bg-zinc-100')}`}
                        style={{ minHeight: 48 }}
                      >
                        <View className="flex-1">
                          {isRenaming ? (
                            <TextInput
                              value={renameValue}
                              onChangeText={setRenameValue}
                              onBlur={() => confirmRename(thread)}
                              onSubmitEditing={() => confirmRename(thread)}
                              className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}
                              autoFocus
                              maxLength={40}
                              style={{ padding: 0, margin: 0 }}
                            />
                          ) : (
                            <TouchableOpacity onLongPress={() => startRenaming(thread)}>
                              <Text className={`text-sm font-medium ${isSelected ? 'text-blue-500' : isDarkMode ? 'text-white' : 'text-black'}`} numberOfLines={1}>
                                {thread.title}
                              </Text>
                            </TouchableOpacity>
                          )}
                          <Text className={`text-xs mt-0.5 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`} numberOfLines={1}>
                            {getLastMessagePreview(thread) || 'No messages yet'}
                          </Text>
                        </View>
                        <View className="items-end ml-2">
                          <Text className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>{formatDate(thread.updatedAt)}</Text>
                          {enableEditing && !isRenaming && (
                            <TouchableOpacity onPress={() => confirmDeleteThread(thread.id)} className="p-1 rounded-lg mt-1">
                              <Trash size={14} color={isDarkMode ? "#FFFFFF" : "#000000"} />
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    </Pressable>
                  );
                }}
                contentContainerStyle={{ paddingBottom: 24 }}
                style={{ flex: 1 }}
              />
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