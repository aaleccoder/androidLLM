import React, { useState, useRef, useEffect } from 'react';
import { ScrollView, Animated, Pressable, TouchableWithoutFeedback } from 'react-native';
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
  H3,
  styled
} from 'tamagui';

const SidebarContainer = styled(Animated.View, {
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
});

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

      <SidebarContainer 
        style={{ 
          transform: [{ translateX }],
        }} 
      >
        <View
          backgroundColor={isDarkMode ? '$backgroundDark' : '$backgroundLight'}
          f={1}
        >
          <YStack space="$2" padding="$2">
            <Button
              onPress={handleNewChat}
              backgroundColor={isDarkMode ? '$backgroundSecondary' : '$backgroundSecondary'}
              borderRadius="$4"
              size="$3"
              disabled={!canCreateNewChat}
              opacity={canCreateNewChat ? 1 : 0.5}
              pressStyle={{ scale: 0.97 }}
            >
              <XStack space="$2" alignItems="center">
                <Plus size={16} color={isDarkMode ? "#FFFFFF" : "#000000"} />
                <Text color={isDarkMode ? '$textLight' : '$textDark'} fontSize="$3">New Chat</Text>
              </XStack>
            </Button>

            {chatThreads.length === 0 ? (
              <YStack f={1} jc="center" ai="center" padding="$2">
                <Text
                  textAlign="center"
                  color={isDarkMode ? '$textMuted' : '$textMuted'}
                  fontSize="$2"
                >
                  No chat history yet. Start a new conversation!
                </Text>
              </YStack>
            ) : (
              <ScrollView>
                <YStack space="$1">
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
                          borderRadius="$2"
                          borderLeftWidth={2}
                          borderLeftColor={isSelected ? '$primary' : 'transparent'}
                          paddingVertical="$2"
                          paddingHorizontal="$3"
                          pressStyle={{ scale: 0.98 }}
                        >
                          <XStack space="$2" alignItems="center" justifyContent="space-between">
                            <YStack flex={1} space="$0">
                              <Text
                                color={isSelected
                                  ? '$primary'
                                  : isDarkMode ? '$textLight' : '$textDark'
                                }
                                numberOfLines={1}
                                fontSize="$3"
                                fontWeight={isSelected ? "500" : "400"}
                              >
                                {thread.title}
                              </Text>
                              <Text
                                fontSize="$1"
                                color={isDarkMode ? '$textMuted' : '$textMuted'}
                              >
                                {formatDate(thread.updatedAt)}
                              </Text>
                            </YStack>
                            {enableEditing && (
                              <Button
                                size="$2"
                                padding="$1"
                                backgroundColor={isDarkMode ? '$backgroundDark' : '$backgroundLight'}
                                onPress={() => confirmDeleteThread(thread.id)}
                                pressStyle={{ scale: 0.95 }}
                              >
                                <Trash size={14} color={isDarkMode ? "#FFFFFF" : "#000000"} />
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
          </YStack>
        </View>
      </SidebarContainer>

      <Sheet
        modal
        open={!!deleteConfirmThreadId}
        onOpenChange={handleCancelDelete}
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
                onPress={handleCancelDelete}
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