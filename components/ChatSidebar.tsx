import React, { useState, useRef, useEffect } from 'react';
import { ScrollView, Animated, Pressable, TouchableWithoutFeedback, View, ViewStyle, Text, TouchableOpacity, Modal, Platform } from 'react-native';
import { useTheme } from '../context/themeContext';
import { ChatThread, useData } from '../context/dataContext';
import { useAuth } from '../hooks/useAuth';
import * as Haptics from 'expo-haptics';

// Import Lucide icons
import { Plus, X, Trash, Clock } from "lucide-react-native";

interface ChatSidebarProps {
  isVisible: boolean;
  onClose: () => void;
  onNewChat: () => Promise<string> | void;
  currentThreadId?: string;
  onSelectThread: (threadId: string) => void;
  onDeleteThread: (threadId: string) => Promise<boolean>;
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
  onDeleteThread,
  enableEditing,
  className,
  style
}: ChatSidebarProps) => {
  const { isDarkMode } = useTheme();
  const { data } = useData();
  const [deleteConfirmThreadId, setDeleteConfirmThreadId] = useState<string | null>(null);
  const [isSidebarVisible, setIsSidebarVisible] = useState(isVisible);
  const [isProcessing, setIsProcessing] = useState(false);

  // Animation references
  const translateX = useRef(new Animated.Value(-300)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Handle sidebar visibility animations
  useEffect(() => {
    if (isVisible) {
      setIsSidebarVisible(true);
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 0,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: -320,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        })
      ]).start(() => setIsSidebarVisible(false));
    }
  }, [isVisible]);

  if (!isSidebarVisible) return null;

  /**
   * Handles creation of a new chat thread
   */
  const handleNewChat = async () => {
    if (isProcessing) return;
    try {
      setIsProcessing(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      if (typeof onNewChat === 'function') {
        const result = onNewChat();
        if (result && typeof (result as Promise<string>).then === 'function') {
          const newThreadId = await (result as Promise<string>);
          if (newThreadId) {
            // Wait for the new thread to appear in chatThreads before selecting
            const maxWait = 2000; // 2 seconds max
            const interval = 100;
            let waited = 0;
            let found = false;
            while (waited < maxWait) {
              const exists = data?.chatThreads?.some(t => t.id === newThreadId);
              if (exists) {
                found = true;
                break;
              }
              await new Promise(res => setTimeout(res, interval));
              waited += interval;
            }
            if (found) {
              onSelectThread(newThreadId);
            } else {
              // Fallback: try anyway
              onSelectThread(newThreadId);
            }
          }
        }
      }
      onClose();
    } catch (error) {
      console.error('Error creating new chat:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Handles thread selection with haptic feedback
   */
  const handleSelectThread = (threadId: string) => {
    if (threadId === currentThreadId) {
      onClose();
      return;
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelectThread(threadId);
    onClose();
  };

  /**
   * Initiates thread deletion confirmation
   */
  const confirmDeleteThread = (threadId: string) => {
    setDeleteConfirmThreadId(threadId);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  };

  /**
   * Executes thread deletion after confirmation
   */
  const handleDeleteThread = async () => {
    if (!deleteConfirmThreadId || isProcessing) return;
    
    try {
      setIsProcessing(true);
      const success = await onDeleteThread(deleteConfirmThreadId);
      
      if (success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      
      setDeleteConfirmThreadId(null);
      
      if (deleteConfirmThreadId === currentThreadId) {
        onClose();
      }
    } catch (error) {
      console.error('Error deleting thread:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Formats a timestamp into a relative date string
   */
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

  // Sort threads by updated timestamp - most recent first
  const chatThreads = data?.chatThreads
    ? [...data.chatThreads].sort((a, b) => b.updatedAt - a.updatedAt)
    : [];
  
  // Determine if we can create a new chat based on current state
  const currentChat = data?.chatThreads?.find(thread => thread.id === currentThreadId);
  const canCreateNewChat = !isProcessing && (!currentChat || currentChat.messages.length > 0);

  return (
    <>
      {/* Backdrop overlay */}
      <TouchableWithoutFeedback 
        onPress={onClose} 
        accessible 
        accessibilityLabel="Close sidebar overlay"
        accessibilityRole="button"
      >
        <Animated.View 
          style={{ opacity: fadeAnim }} 
          className="absolute inset-0 bg-black/50 z-10" 
        />
      </TouchableWithoutFeedback>

      {/* Sidebar panel */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: Platform.OS === 'android' ? 24 : 0,
            left: 0,
            bottom: 0,
            width: 300,
            zIndex: 20,
            shadowColor: '#000',
            shadowOffset: { width: 2, height: 0 },
            shadowOpacity: 0.18,
            shadowRadius: 12,
            borderTopRightRadius: 20,
            borderBottomRightRadius: 20,
            backgroundColor: isDarkMode ? '#18181b' : '#fff',
            elevation: 12,
            transform: [{ translateX }],
            opacity: fadeAnim,
          },
          style
        ]}
        className={className}
        accessible 
        accessibilityLabel="Sidebar navigation"
        accessibilityValue={{ text: 'dialog' }}
      >
        <View className={`flex-1 ${isDarkMode ? 'bg-zinc-900' : 'bg-white'} rounded-tr-2xl rounded-br-2xl`}> 
          <View className="flex-1 p-2">
            {/* New Chat Button */}
            <TouchableOpacity
              onPress={handleNewChat}
              disabled={!canCreateNewChat}
              className={`flex-row items-center space-x-2 p-3 rounded-lg mb-4
                ${isDarkMode ? 'bg-blue-700' : 'bg-blue-100'} 
                ${!canCreateNewChat ? 'opacity-50' : ''}`}
              accessibilityRole="button"
              accessibilityLabel="Start a new chat"
              accessibilityState={{ disabled: !canCreateNewChat }}
            >
              <Plus size={18} color={isDarkMode ? "#FFFFFF" : "#3A59D1"} />
              <Text className={`font-semibold ${isDarkMode ? 'text-white' : 'text-blue-700'}`}>
                New Chat
              </Text>
            </TouchableOpacity>

            <View className="h-[1px] bg-zinc-200 dark:bg-zinc-700 mb-2" />
            
            {/* Chat History Label */}
            <View className="flex-row items-center mb-2 px-1">
              <Clock size={12} className="mr-1" color={isDarkMode ? "#9ca3af" : "#6b7280"} />
              <Text className={`text-xs uppercase tracking-wider font-semibold ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                Chat History
              </Text>
            </View>

            {/* Chat Thread List */}
            {chatThreads.length === 0 ? (
              <View className="flex-1 justify-center items-center p-6">
                <Text className={`text-center ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  No chat history yet.{'\n'}Start a new conversation!
                </Text>
              </View>
            ) : (
              <ScrollView 
                className="flex-1"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 16 }}
              >
                <View className="space-y-1">
                  {chatThreads.map(thread => {
                    const isSelected = thread.id === currentThreadId;
                    return (
                      <Pressable
                        key={thread.id}
                        onPress={() => handleSelectThread(thread.id)}
                        accessibilityRole="button"
                        accessibilityLabel={`Open chat: ${thread.title}`}
                        accessibilityState={{ selected: isSelected }}
                        style={({ pressed }) => [{
                          backgroundColor: isSelected
                            ? (isDarkMode ? '#3A59D1' : '#e0e7ff')
                            : pressed
                              ? (isDarkMode ? '#27272a' : '#f1f5f9')
                              : 'transparent',
                          borderLeftWidth: isSelected ? 4 : 0,
                          borderLeftColor: isSelected ? (isDarkMode ? '#B5FCCD' : '#3A59D1') : 'transparent',
                          borderRadius: 12,
                          padding: 12,
                          marginBottom: 2,
                        }]}
                      >
                        <View className="flex-row items-center justify-between">
                          <View className="flex-1 mr-2">
                            <Text 
                              className={`font-medium ${isSelected 
                                ? (isDarkMode ? 'text-white' : 'text-zinc-900')
                                : isDarkMode ? 'text-zinc-100' : 'text-zinc-800'
                              }`}
                              numberOfLines={1}
                              ellipsizeMode="tail"
                            >
                              {thread.title}
                            </Text>
                            <Text 
                              className={`text-xs ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}
                            >
                              {formatDate(thread.updatedAt)} • {thread.messages.length} msg
                            </Text>
                          </View>
                          {enableEditing && (
                            <TouchableOpacity
                              onPress={() => confirmDeleteThread(thread.id)}
                              className={`p-2 rounded-lg ${isSelected 
                                ? (isDarkMode ? 'bg-blue-800' : 'bg-blue-200') 
                                : (isDarkMode ? 'bg-zinc-800' : 'bg-zinc-100')
                              }`}
                              accessibilityRole="button"
                              accessibilityLabel={`Delete chat: ${thread.title}`}
                            >
                              <Trash size={14} color={isDarkMode ? "#FFFFFF" : "#000000"} />
                            </TouchableOpacity>
                          )}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>
            )}

            <View className="h-[1px] bg-zinc-200 dark:bg-zinc-700 my-2" />
            
            {/* Close button */}
            <TouchableOpacity
              onPress={onClose}
              className={`flex-row items-center justify-center space-x-2 p-3 rounded-lg ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-100'}`}
              accessibilityRole="button"
              accessibilityLabel="Close sidebar"
            >
              <X size={18} color={isDarkMode ? "#FFFFFF" : "#3A59D1"} />
              <Text className={`font-semibold ${isDarkMode ? 'text-white' : 'text-blue-700'}`}>
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={!!deleteConfirmThreadId}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setDeleteConfirmThreadId(null)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className={`rounded-t-2xl p-4 ${isDarkMode ? 'bg-zinc-800' : 'bg-white'}`}>
            <View className="space-y-4">
              <Text className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                Delete Chat
              </Text>
              <Text className={isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}>
                Are you sure you want to delete this conversation? This action cannot be undone.
              </Text>
              <View className="flex-row justify-between space-x-3">
                <TouchableOpacity
                  onPress={() => setDeleteConfirmThreadId(null)}
                  className={`flex-1 p-3 rounded-lg ${isDarkMode ? 'bg-zinc-700' : 'bg-zinc-100'}`}
                  disabled={isProcessing}
                >
                  <Text className={`text-center ${isDarkMode ? 'text-white' : 'text-black'}`}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleDeleteThread}
                  className={`flex-1 p-3 rounded-lg bg-red-500 ${isProcessing ? 'opacity-70' : ''}`}
                  disabled={isProcessing}
                >
                  <Text className="text-center text-white">
                    {isProcessing ? 'Deleting...' : 'Delete'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};