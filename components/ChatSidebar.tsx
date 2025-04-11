import React, { useState, useRef, useEffect } from 'react';
import { ScrollView, Animated } from 'react-native';
import { useTheme } from '../context/themeContext';
import { ChatThread, useData } from '../context/dataContext';
import { useAuth } from '../hooks/useAuth';
import * as Haptics from 'expo-haptics';

// Import Lucide icons
import { Plus, X, Trash } from "lucide-react-native";

import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Divider,
  Button,
  ButtonText,
  ButtonIcon,
  Pressable,
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter
} from "@gluestack-ui/themed";

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
          margin: 0, // Ensure no margin
          padding: 0, // Ensure no padding
        }}
        className={`absolute top-0 left-0 bottom-0 w-[300px] z-10 ${
          isDarkMode ? 'bg-neutral-900' : 'bg-neutral-100'
        }`}
      >
        <VStack className="h-full">
          <HStack className="justify-between items-center px-4 py-3">
            <Heading size="sm" className={isDarkMode ? "text-neutral-100" : "text-neutral-800"}>
              Chat History
            </Heading>
            <HStack space="sm">
              <Button
                size="sm"
                variant="solid"
                bgColor={isDarkMode ? "$neutral800" : "$neutral200"}
                borderRadius="$full"
                onPress={handleNewChat}
              >
                <ButtonIcon as={Plus} size="sm" color={theme.colors.onSurface} />
              </Button>
              <Button
                size="sm"
                variant="solid"
                bgColor={isDarkMode ? "$neutral800" : "$neutral200"}
                borderRadius="$full"
                onPress={onClose}
              >
                <ButtonIcon as={X} size="sm" color={theme.colors.onSurface} />
              </Button>
            </HStack>
          </HStack>
          
          <Divider className={isDarkMode ? "bg-neutral-800" : "bg-neutral-200"} />

          <Button
            className="mx-4 my-4 rounded-xl"
            size="md"
            variant="solid"
            bgColor={isDarkMode ? "$neutral800" : "$neutral200"}
            onPress={handleNewChat}
          >
            <ButtonIcon as={Plus} size="sm" color={theme.colors.onSurface} />
            <ButtonText className={isDarkMode ? "text-neutral-100" : "text-neutral-800"}>New Chat</ButtonText>
          </Button>

          {chatThreads.length === 0 ? (
            <Box className="p-6">
              <Text className="text-center text-neutral-400 dark:text-neutral-400">
                No chat history yet. Start a new conversation!
              </Text>
            </Box>
          ) : (
            <ScrollView className="flex-1">
              {chatThreads.map(thread => {
                const isSelected = thread.id === currentThreadId;
                return (
                  <Pressable
                    key={thread.id}
                    onPress={() => handleSelectThread(thread.id)}
                    className={`mx-2 my-1 rounded-xl overflow-hidden border-l-4 ${
                      isSelected 
                        ? isDarkMode 
                          ? 'bg-neutral-800/50 border-l-accent-500'
                          : 'bg-neutral-200/50 border-l-accent-500'
                        : 'border-l-transparent'
                    }`}
                  >
                    <HStack className="px-4 py-4 items-center justify-between">
                      <VStack className="flex-1 mr-2">
                        <Text
                          className={`mb-1 ${
                            isSelected 
                              ? 'font-medium text-accent-400'
                              : isDarkMode
                                ? 'text-neutral-200'
                                : 'text-neutral-800'
                          }`}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {thread.title}
                        </Text>
                        <Text className={isDarkMode ? 'text-xs text-neutral-400' : 'text-xs text-neutral-600'}>
                          {formatDate(thread.updatedAt)}
                        </Text>
                      </VStack>
                      {enableEditing && (
                        <Button
                          size="sm"
                          variant="solid"
                          bgColor={isDarkMode ? "$neutral800" : "$neutral200"}
                          borderRadius="$full"
                          onPress={() => confirmDeleteThread(thread.id)}
                        >
                          <ButtonIcon as={Trash} size="sm" color={theme.colors.onSurface} />
                        </Button>
                      )}
                    </HStack>
                  </Pressable>
                );
              })}
              <Box className="h-4"></Box>
            </ScrollView>
          )}
        </VStack>
      </Animated.View>
      
      <Modal isOpen={!!deleteConfirmThreadId} onClose={() => setDeleteConfirmThreadId(null)}>
        <ModalBackdrop />
        <ModalContent className={`m-4 rounded-3xl ${isDarkMode ? 'bg-neutral-900' : 'bg-neutral-100'}`}>
          <ModalHeader>
            <Heading size="lg" className={isDarkMode ? 'text-neutral-100' : 'text-neutral-900'}>Delete Chat</Heading>
          </ModalHeader>
          <ModalBody>
            <Text className={isDarkMode ? 'mb-4 text-neutral-300' : 'mb-4 text-neutral-700'}>
              Are you sure you want to delete this conversation? This action cannot be undone.
            </Text>
          </ModalBody>
          <ModalFooter className="gap-3">
            <Button
              variant="outline" 
              size="md"
              className="flex-1"
              onPress={() => setDeleteConfirmThreadId(null)}
            >
              <ButtonText>Cancel</ButtonText>
            </Button>
            <Button
              variant="solid"
              bgColor="$error600"
              size="md"
              className="flex-1"
              onPress={handleDeleteThread}
            >
              <ButtonIcon as={Trash} size="sm" color="#FFFFFF" />
              <ButtonText>Delete</ButtonText>
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};