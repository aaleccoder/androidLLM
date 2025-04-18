import React, { useState, useRef, useEffect } from 'react';
import { ScrollView, Animated, Pressable, TouchableWithoutFeedback, View, ViewStyle, Text, TouchableOpacity, Modal, FlatList, TextInput, Keyboard, SafeAreaView, Dimensions } from 'react-native';
import { ChatThread, useData } from '../context/dataContext';
import { useAuth } from '../hooks/useAuth';
import * as Haptics from 'expo-haptics';

// Import Lucide icons
import { Plus, X, Trash, Search, SquarePen } from "lucide-react-native";

interface ChatSidebarProps {
  isVisible: boolean;
  onClose: () => void;
  onMount?: () => void; // NEW PROP
  onFullyClosed?: () => void; // NEW PROP
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
  onMount,
  onFullyClosed,
  onNewChat,
  currentThreadId,
  onSelectThread,
  enableEditing,
  className,
  style
}: ChatSidebarProps) => {
  const { data, deleteChatThread, saveData, deleteChatThreadInMemory, updateChatThreadInMemory, updateChatThread } = useData();
  const { getCurrentPassword } = useAuth();
  const [deleteConfirmThreadId, setDeleteConfirmThreadId] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [renamingThreadId, setRenamingThreadId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchFocused, setSearchFocused] = useState<boolean>(false);
  const [shouldRenderSidebar, setShouldRenderSidebar] = useState<boolean>(isVisible);

  const translateX = useRef(new Animated.Value(-300)).current;
  const sidebarWidth = useRef(new Animated.Value(320)).current;
  const searchInputRef = useRef<TextInput>(null);

  const deviceWidth = Dimensions.get('window').width;
  const COLLAPSED_WIDTH = 320;
  const EXPANDED_WIDTH = Math.min(400, deviceWidth - 32); // 32px margin

  useEffect(() => {
    if (isVisible) {
      setShouldRenderSidebar(true);
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
      }).start(({ finished }) => {
        if (finished) {
          setShouldRenderSidebar(false);
          if (onFullyClosed) onFullyClosed(); // Notify parent
        }
      });
    }
  }, [isVisible]);

  useEffect(() => {
    Animated.timing(sidebarWidth, {
      toValue: searchFocused ? EXPANDED_WIDTH : COLLAPSED_WIDTH,
      duration: 350,
      useNativeDriver: false,
    }).start();
  }, [searchFocused, EXPANDED_WIDTH]);

  useEffect(() => {
    if (shouldRenderSidebar && onMount) {
      onMount();
    }
  }, [shouldRenderSidebar, onMount]);

  if (!shouldRenderSidebar) return null;

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

  const filteredThreads = chatThreads.filter(thread => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      thread.title.toLowerCase().includes(q) ||
      (getLastMessagePreview(thread) || '').toLowerCase().includes(q)
    );
  });

  const currentChat: ChatThread | undefined = data?.chatThreads?.find(thread => thread.id === currentThreadId);
  // Only disable if the current chat exists and is empty
  const canCreateNewChat: boolean = !(currentChat && currentChat.messages.length === 0);

  return (
    <>
      <TouchableWithoutFeedback onPress={handlePressOverlay}>
        <View className="absolute inset-0 bg-black/50 z-10" />
      </TouchableWithoutFeedback>

      {/* Outer Animated.View for translateX (native driver) */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
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
        {/* SafeAreaView to keep sidebar within screen bounds */}
        <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
          {/* Inner Animated.View for width (JS driver) */}
          <Animated.View style={{ width: sidebarWidth, flex: 1, height: '100%' }}>
            <View className="flex-1 bg-primary">
              <View className="space-y-2 p-4">
                <View className="flex-row items-center mb-2">
                  {/* Search Bar */}
                  <View className="flex-1 flex-row items-center bg-accent rounded-3xl p-5">
                    {searchFocused ? (
                      <TouchableOpacity
                        onPress={() => {
                          searchInputRef.current?.blur();
                          setSearchFocused(false);
                        }}
                        accessibilityLabel="Back from search"
                        style={{ marginRight: 8 }}
                      >
                        <X size={22} color="#181818" />
                      </TouchableOpacity>
                    ) : (
                      <Search size={22} color="#181818" style={{ marginRight: 8 }} />
                    )}
                    <TextInput
                      ref={searchInputRef}
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      placeholder="Search chats..."
                      placeholderTextColor="#181818"
                      className="flex-1 text-text px-2 py-2"
                      style={{ fontSize: 16 }}
                      accessibilityLabel="Search chats"
                      autoCorrect={false}
                      autoCapitalize="none"
                      returnKeyType="search"
                      onFocus={() => setSearchFocused(true)}
                      onBlur={() => setSearchFocused(false)}
                    />
                  </View>
                  {/* New Chat Button outside search bar */}
                  <TouchableOpacity
                    onPress={handleNewChat}
                    disabled={!canCreateNewChat}
                    accessibilityLabel="New Chat"
                    className={`ml-2 p-2 rounded-lg ${!canCreateNewChat ? 'opacity-50' : ''}`}
                    style={{ marginLeft: 8 }}
                  >
                    <SquarePen size={32} color="#61BA82"/>
                  </TouchableOpacity>
                </View>
                {/* Chats label */}
                <Text className="text-lg font-semibold text-text mt-2 mb-2" accessibilityRole="header">Chats</Text>
              </View>
              <View className="flex-1 px-2 pb-4">
                {filteredThreads.length === 0 ? (
                  <View className="flex-1 justify-center items-center p-2">
                    <Text className="text-center text-text opacity-60">No chat history yet. Start a new conversation!</Text>
                  </View>
                ) : (
                  <FlatList
                    data={filteredThreads}
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
                            className={`flex-row items-center p-2 mb-1 rounded-lg transition-all duration-150 ${isSelected ? 'bg-accent/20 border-l-4 border-accent' : 'bg-background'}`}
                            style={{ minHeight: 48 }}
                          >
                            <View className="flex-1">
                              {isRenaming ? (
                                <TextInput
                                  value={renameValue}
                                  onChangeText={setRenameValue}
                                  onBlur={() => confirmRename(thread)}
                                  onSubmitEditing={() => confirmRename(thread)}
                                  className="text-sm font-medium text-text"
                                  autoFocus
                                  maxLength={40}
                                  style={{ padding: 0, margin: 0 }}
                                />
                              ) : (
                                <TouchableOpacity onLongPress={() => startRenaming(thread)}>
                                  <Text className={`text-sm font-medium ${isSelected ? 'text-accent' : 'text-text'}`} numberOfLines={1}>
                                    {thread.title}
                                  </Text>
                                </TouchableOpacity>
                              )}
                              <Text className="text-xs mt-0.5 text-text opacity-60" numberOfLines={1}>
                                {getLastMessagePreview(thread) || 'No messages yet'}
                              </Text>
                            </View>
                            <View className="items-end ml-2">
                              <Text className="text-xs text-text opacity-40">{formatDate(thread.updatedAt)}</Text>
                              {enableEditing && !isRenaming && (
                                <TouchableOpacity onPress={() => confirmDeleteThread(thread.id)} className="p-1 rounded-lg mt-1">
                                  <Trash size={14} color="#EBE9FC" />
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
        </SafeAreaView>
      </Animated.View>

      <Modal
        visible={!!deleteConfirmThreadId}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCancelDelete}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="rounded-t-2xl p-4 bg-zinc-800">
            <View className="space-y-4">
              <Text className="text-xl font-semibold text-white">Delete Chat</Text>
              <Text className="text-zinc-300">
                Are you sure you want to delete this conversation? This action cannot be undone.
              </Text>
              <View className="flex-row justify-between space-x-3">
                <TouchableOpacity
                  onPress={handleCancelDelete}
                  className="flex-1 p-3 rounded-lg bg-zinc-700"
                >
                  <Text className="text-center text-white">Cancel</Text>
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