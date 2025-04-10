import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text } from 'react-native';
import { Surface, IconButton, Modal, Portal, Button, Divider } from 'react-native-paper';
import { useTheme } from '../context/themeContext';
import { ChatThread, useData } from '../context/dataContext';
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
  const [deleteConfirmThreadId, setDeleteConfirmThreadId] = useState<string | null>(null);
  const [password, setPassword] = useState(''); // Normally you'd get this from a secure context
  
  // Get chat threads sorted by most recent update
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
      // In a real implementation, you would get the password securely
      // For now, we'll use a temporary solution
      const tempPassword = 'temporaryPassword'; // This should come from auth context
      await deleteChatThread(deleteConfirmThreadId, tempPassword);
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
        style={[
          styles.threadItem,
          isSelected && {
            backgroundColor: isDarkMode ? 'rgba(42, 100, 234, 0.2)' : 'rgba(59, 130, 246, 0.1)'
          },
          { borderLeftColor: isSelected ? theme.colors.primary : 'transparent' }
        ]}
        elevation={0}
      >
        <TouchableOpacity
          style={styles.threadContent}
          onPress={() => handleSelectThread(thread.id)}
        >
          <View style={styles.threadInfo}>
            <Text
              style={[
                styles.threadTitle,
                { color: theme.colors.onSurface },
                isSelected && { fontWeight: '500', color: theme.colors.primary }
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {thread.title}
            </Text>
            <Text style={[styles.threadDate, { color: theme.colors.onSurfaceVariant }]}>
              {formatDate(thread.updatedAt)}
            </Text>
          </View>
          {enableEditing && (
            <IconButton
              icon="delete-outline"
              size={18}
              iconColor={theme.colors.error}
              style={styles.deleteButton}
              onPress={() => confirmDeleteThread(thread.id)}
            />
          )}
        </TouchableOpacity>
      </Surface>
    );
  };

  const sidebarBgColor = isDarkMode ? '#1A1A1A' : '#FFFFFF';

  return (
    <>
      {isVisible && (
        <Surface
          style={[
            styles.sidebar,
            { backgroundColor: sidebarBgColor }
          ]}
          elevation={4}
        >
          <View style={styles.sidebarHeader}>
            <Text style={[styles.sidebarTitle, { color: theme.colors.onSurface }]}>
              Chat History
            </Text>
            <View style={styles.headerActions}>
              <IconButton
                icon="plus"
                size={24}
                iconColor={theme.colors.primary}
                onPress={handleNewChat}
                style={styles.headerButton}
              />
              <IconButton
                icon="close"
                size={24}
                iconColor={theme.colors.onSurface}
                onPress={onClose}
                style={styles.headerButton}
              />
            </View>
          </View>
          
          <Divider style={{ backgroundColor: isDarkMode ? '#333' : '#E5E5E5' }} />

          <Button
            mode="outlined"
            icon="plus"
            style={[
              styles.newChatButton,
              { borderColor: theme.colors.primary }
            ]}
            textColor={theme.colors.primary}
            onPress={handleNewChat}
          >
            New Chat
          </Button>

          <ScrollView style={styles.threadList}>
            {chatThreads.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
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
            styles.modal,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
            }
          ]}
        >
          <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
            Delete Chat
          </Text>
          <Text style={{ color: theme.colors.onSurfaceVariant, marginBottom: 24 }}>
            Are you sure you want to delete this conversation? This action cannot be undone.
          </Text>
          <View style={styles.modalActions}>
            <Button 
              mode="outlined"
              onPress={() => setDeleteConfirmThreadId(null)}
              style={styles.cancelButton}
            >
              Cancel
            </Button>
            <Button 
              mode="contained"
              onPress={handleDeleteThread}
              buttonColor={theme.colors.error}
              style={styles.deleteButton}
            >
              Delete
            </Button>
          </View>
        </Modal>
      </Portal>
    </>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 300,
    zIndex: 1000,
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sidebarTitle: {
    fontSize: 18,
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    margin: 0,
  },
  newChatButton: {
    margin: 16,
    borderRadius: 12,
  },
  threadList: {
    flex: 1,
  },
  emptyState: {
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  threadItem: {
    marginHorizontal: 8,
    marginVertical: 4,
    borderRadius: 8,
    borderLeftWidth: 3,
    overflow: 'hidden',
  },
  threadContent: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  threadInfo: {
    flex: 1,
    marginRight: 8,
  },
  threadTitle: {
    fontSize: 14,
    marginBottom: 4,
  },
  threadDate: {
    fontSize: 12,
  },
  deleteButton: {
    margin: 0,
  },
  modal: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 12,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    marginRight: 12,
  },
});