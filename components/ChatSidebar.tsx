import React, { useState, useRef, useEffect } from 'react';
import { ScrollView, Animated, Pressable } from 'react-native';
import { useTheme } from '../context/themeContext';
import { ChatThread, useData } from '../context/dataContext';
import { useAuth } from '../hooks/useAuth';
import * as Haptics from 'expo-haptics';

// Import Lucide icons
import { Plus, X, Trash } from "lucide-react-native";

// Import Tamagui components
import {
  View,
  YStack,
  XStack,
  Text,
  Button,
  Sheet,
  H3
} from 'tamagui';

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
  const slideAnim = useRef(new Animated.Value(-300)).current;
  const [slideAnimValue, setSlideAnimValue] = useState(-300);

  useEffect(() => {
    const listener = slideAnim.addListener(({ value }) => setSlideAnimValue(value));
    return () => slideAnim.removeListener(listener);
  }, [slideAnim]);

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isVisible ? 0 : -300,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isVisible, slideAnim]);
  
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

  if (!isVisible && slideAnimValue <= -300) return null;

  return (
    <>
      <Animated.View
        style={{
          transform: [{ translateX: slideAnim }],
          elevation: 4,
          shadowColor: '#000',
          shadowOffset: { width: 2, height: 0 },
          shadowOpacity: 0.2,
          shadowRadius: 3,
          margin: 0,
          padding: 0,
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: 300,
          zIndex: 10,
          backgroundColor: isDarkMode ? '#1a1a1a' : '#f5f5f5'
        }}
      >
        <View padding="$2" backgroundColor={isDarkMode ? '$backgroundDark' : '$backgroundLight'}>
          <Button
            onPress={handleNewChat}
            backgroundColor={isDarkMode ? '$backgroundSecondary' : '$backgroundSecondary'}
            borderRadius="$4"
            size="$4"
          >
            <XStack space="$2" alignItems="center">
              <Plus size={18} color={isDarkMode ? "#FFFFFF" : "#000000"} />
              <Text color={isDarkMode ? '$textLight' : '$textDark'}>New Chat</Text>
            </XStack>
          </Button>
        </View>

        {chatThreads.length === 0 ? (
          <View padding="$4">
            <Text
              textAlign="center"
              color={isDarkMode ? '$textMuted' : '$textMuted'}
            >
              No chat history yet. Start a new conversation!
            </Text>
          </View>
        ) : (
          <ScrollView>
            <YStack space="$2" padding="$2">
              {chatThreads.map(thread => {
                const isSelected = thread.id === currentThreadId;
                return (
                  <Pressable
                    key={thread.id}
                    onPress={() => handleSelectThread(thread.id)}
                  >
                    <View
                      backgroundColor={isSelected 
                        ? isDarkMode ? '$backgroundSecondary' : '$backgroundSecondary'
                        : 'transparent'
                      }
                      borderRadius="$4"
                      borderLeftWidth={4}
                      borderLeftColor={isSelected ? '$primary' : 'transparent'}
                      padding="$3"
                    >
                      <XStack space="$2" alignItems="center" justifyContent="space-between">
                        <YStack flex={1}>
                          <Text
                            color={isSelected 
                              ? '$primary'
                              : isDarkMode ? '$textLight' : '$textDark'
                            }
                            numberOfLines={1}
                            marginBottom="$1"
                          >
                            {thread.title}
                          </Text>
                          <Text
                            fontSize="$2"
                            color={isDarkMode ? '$textMuted' : '$textMuted'}
                          >
                            {formatDate(thread.updatedAt)}
                          </Text>
                        </YStack>
                        {enableEditing && (
                          <Button
                            size="$3"
                            circular
                            backgroundColor={isDarkMode ? '$backgroundDark' : '$backgroundLight'}
                            onPress={() => confirmDeleteThread(thread.id)}
                          >
                            <Trash size={16} color={isDarkMode ? "#FFFFFF" : "#000000"} />
                          </Button>
                        )}
                      </XStack>
                    </View>
                  </Pressable>
                );
              })}
            </YStack>
          </ScrollView>
        )}
      </Animated.View>
      
      <Sheet
        modal
        open={!!deleteConfirmThreadId}
        onOpenChange={() => setDeleteConfirmThreadId(null)}
        snapPoints={[40]}
        dismissOnSnapToBottom
      >
        <Sheet.Overlay />
        <Sheet.Frame padding="$4">
          <YStack space="$4">
            <H3>Delete Chat</H3>
            <Text color={isDarkMode ? '$textLight' : '$textDark'}>
              Are you sure you want to delete this conversation? This action cannot be undone.
            </Text>
            <XStack space="$3" justifyContent="space-between">
              <Button
                flex={1}
                backgroundColor={isDarkMode ? '$backgroundDark' : '$backgroundLight'}
                onPress={() => setDeleteConfirmThreadId(null)}
              >
                Cancel
              </Button>
              <Button
                flex={1}
                backgroundColor="$error"
                onPress={handleDeleteThread}
                icon={<Trash size={18} color="#fff" />}
              >
                Delete
              </Button>
            </XStack>
          </YStack>
        </Sheet.Frame>
      </Sheet>
    </>
  );
};