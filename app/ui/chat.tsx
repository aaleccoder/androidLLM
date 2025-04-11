/**
 * Chat Screen Component
 * 
 * Main chat interface for user-bot interactions featuring:
 * - Message history display
 * - Text input for sending messages
 * - Protected route requiring authentication
 * - Theme integration
 * - Gemini API integration for LLM responses
 * - Context prediction and chain of thought reasoning
 * - Chat history with thread management
 */
import React, { useState, useEffect, useRef } from "react";
import { View, ScrollView, BackHandler, StyleSheet, Text, Animated, AppState } from "react-native";
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../../context/themeContext';
import { ProtectedRoute, useAuth } from "../../hooks/useAuth";
import { useNavigation } from "expo-router";
import { ChatMessage } from '../../components/ChatMessage';
import { ChatInput } from '../../components/ChatInput';
import { ActivityIndicator, Surface, IconButton, Button } from "react-native-paper";
import { geminiService, GeminiModel } from '../../services/geminiService';
import { useData, Message as DataMessage, ChatThread } from '../../context/dataContext';
import * as Haptics from 'expo-haptics';
import { ChatSidebar } from '../../components/ChatSidebar';

// Create a global event emitter for cross-component communication
import { EventEmitter } from 'events';
export const globalEventEmitter = new EventEmitter();

interface Message {
  isUser: boolean;
  text: string;
  timestamp?: number;
  isStreaming?: boolean;
}

/**
 * Chat screen component
 * Requires authentication to access
*/
export default function Chat() {
  const { isDarkMode, theme } = useTheme();
  const { data, createChatThread, updateChatThread, setActiveThread, saveData } = useData();
  const { getCurrentPassword } = useAuth();

  const [messages, setMessages] = useState<Message[]>([
    { 
      isUser: false, 
      text: "",
      timestamp: Date.now()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [apiKeySet, setApiKeySet] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [currentThreadId, setCurrentThreadId] = useState<string | undefined>(data?.activeThreadId);
  const [editingEnabled, setEditingEnabled] = useState(false);
  const [currentModel, setCurrentModel] = useState<GeminiModel>(geminiService.getCurrentModel());

  const scrollViewRef = useRef<ScrollView>(null);
  const navigation = useNavigation();

  const handleModelChange = async (model: GeminiModel) => {
    // First save the current chat history
    saveMessages();

    // Then change the model and reset the chat
    await geminiService.changeModel(model);
    setCurrentModel(model);
    handleNewChat();
  };

  /**
   * Set the API key from the data context when component mounts
   * or when data changes
   */
  useEffect(() => {
    if (data?.apiKeys?.gemini) {
      geminiService.setApiKey(data.apiKeys.gemini);
      setApiKeySet(geminiService.isInitialized());
    } else {
      setApiKeySet(false);
    }

    // Initialize chat with the active thread if available
    if (data?.activeThreadId && data.chatThreads) {
      const activeThread = data.chatThreads.find(thread => thread.id === data.activeThreadId);
      if (activeThread && activeThread.messages.length > 0) {
        // Convert from stored message format to local format
        setMessages(activeThread.messages.map(msg => ({
          isUser: msg.isUser,
          text: msg.text,
          timestamp: msg.timestamp
        })));
        setCurrentThreadId(activeThread.id);
      } else if (!activeThread) {
        // If no active thread found, create a new one
        handleNewChat();
      }
    }
  }, [data]);

  /**
   * Block hardware back button on Android
   * and prevent programmatic navigation
   */
  useEffect(() => {
    // Block Android hardware back button
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // If sidebar is open, close it
      if (showSidebar) {
        setShowSidebar(false);
        return true;
      }
      // Return true to prevent default behavior (going back)
      return true;
    });

    // Block navigation events
    const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
      // Prevent default action (navigation back)
      e.preventDefault();
    });
    
    // Listen for sidebar toggle events from the header
    const toggleSidebarHandler = () => {
      setShowSidebar(prevState => !prevState);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };
    globalEventEmitter.addListener('toggleSidebar', toggleSidebarHandler);

    // Cleanup event listeners
    return () => {
      backHandler.remove();
      unsubscribe();
      globalEventEmitter.removeListener('toggleSidebar', toggleSidebarHandler);
    };
  }, [navigation, showSidebar]);

  /**
   * Scroll to bottom when messages change
   */
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages, isLoading]);

  /**
   * Save messages when the app goes to background or is closed
   */
  const appStateRef = useRef(AppState.currentState);
  const messagesRef = useRef(messages);
  
  // Keep messagesRef updated with the latest messages
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Set up AppState change listener to save data when app loses focus
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      // When the app transitions to background or inactive state
      if (appStateRef.current.match(/active/) && nextAppState.match(/inactive|background/)) {
        console.log('App going to background, saving messages...');
        saveMessages();
      }
      appStateRef.current = nextAppState as AppState['currentState'];
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Clean up the subscription on unmount
    return () => {
      subscription.remove();
      // Final save when component unmounts (app closed)
      saveMessages();
    };
    // We deliberately don't include saveMessages or messagesRef in the dependency array
    // as that would cause constant refreshes
  }, []);  // Empty dependency array to run only once on mount

  // Function to save messages to storage
  const saveMessages = () => {
    if (!currentThreadId || messagesRef.current.length === 0) return;
    
    // Format messages for storage
    const messagesWithTimestamps = messagesRef.current.map(msg => ({
      isUser: msg.isUser,
      text: msg.text,
      timestamp: msg.timestamp || Date.now()
    }));
    
    // Save to storage
    try {
      const password = getCurrentPassword();
      if (password) {
        console.log('Saving chat thread to storage...');
        updateChatThread(currentThreadId, messagesWithTimestamps, password);
      }
    } catch (error) {
      console.error('Error saving messages:', error);
    }
  };

  /**
   * Create a new chat thread
   */
  const handleNewChat = async () => {
    try {
      const password = getCurrentPassword();
      if (!password) {
        console.error('Cannot create thread: No password available');
        return;
      }
      
      // Reset Gemini chat context
      geminiService.resetChat();
      
      // Create welcome message
      const initialMessage = { 
        isUser: false, 
        text: "# Hello! How can I help you today?\n\nI'm ready to assist you with any questions or tasks you have.",
        timestamp: Date.now()
      };
      
      // We'll update the state before API call to make UI more responsive
      setMessages([initialMessage]);
      
      // Create new thread in data store with the initial message
      // This prevents double-saving the welcome message
      const updatedData = {
        ...data,
        chatThreads: [
          ...(data?.chatThreads || []),
          {
            id: Date.now().toString(),
            title: 'New Chat',
            messages: [initialMessage],
            createdAt: Date.now(),
            updatedAt: Date.now()
          }
        ],
        apiKeys: data?.apiKeys || { gemini: '', groq: '' },
      };
      
      const newThreadId = updatedData.chatThreads[updatedData.chatThreads.length - 1].id;
      updatedData.activeThreadId = newThreadId;
      
      // Update local state first for a responsive UI
      setCurrentThreadId(newThreadId);
      
      // Then update the data store
      await saveData(updatedData, password);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error creating new chat:', error);
    }
  };

  /**
   * Switch to a different chat thread
   */
  const handleSelectThread = async (threadId: string) => {
    if (threadId === currentThreadId) return;
    
    try {
      // Save current messages before switching
      saveMessages();
      
      // Find the thread in data
      const thread = data?.chatThreads?.find(t => t.id === threadId);
      if (!thread) {
        console.error('Thread not found:', threadId);
        return;
      }
      
      // Set as active thread
      const password = getCurrentPassword();
      if (!password) {
        console.error('Cannot select thread: No password available');
        return;
      }
      
      await setActiveThread(threadId, password);
      setCurrentThreadId(threadId);
      
      // Load messages from thread
      setMessages(thread.messages.map(msg => ({
        isUser: msg.isUser,
        text: msg.text,
        timestamp: msg.timestamp
      })));
      
      // Reset Gemini chat context
      geminiService.resetChat();
    } catch (error) {
      console.error('Error selecting thread:', error);
    }
  };

  /**
   * Reset chat and start a new conversation
   */
  const resetChat = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    handleNewChat();
  };

  /**
   * Open the settings dialog to set the API key
   */
  const openSettings = () => {
    // Emit an event that the _layout component can listen for
    globalEventEmitter.emit('openSettings');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  /**
   * Handles sending a new message
   */
  const handleSend = async (message: string) => {
    // Create a new thread if none exists
    if (!currentThreadId) {
      await handleNewChat();
    }

    // Check if API key is set
    if (!apiKeySet) {
      setMessages(prev => [
        ...prev, 
        { isUser: true, text: message, timestamp: Date.now() },
        { 
          isUser: false, 
          text: "# API Key Required\n\nPlease set your Gemini API key in the settings to use this feature.",
          timestamp: Date.now()
        }
      ]);
      return;
    }
    
    // Add user message
    setMessages(prev => [...prev, { isUser: true, text: message, timestamp: Date.now() }]);
    
    // Add initial bot message with streaming state
    setMessages(prev => [...prev, { isUser: false, text: '', timestamp: Date.now(), isStreaming: true }]);
    
    // Set loading and generating states
    setIsLoading(true);
    setIsGenerating(true);
    
    try {
      // Get streaming response from Gemini API
      await geminiService.sendMessage(message, (partialResponse) => {
        // Update the streaming message with the partial response
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage && !lastMessage.isUser) {
            lastMessage.text = partialResponse;
          }
          return newMessages;
        });
      });

      // Mark streaming as complete
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage && !lastMessage.isUser) {
          lastMessage.isStreaming = false;
        }
        return newMessages;
      });
    } catch (error) {
      console.error('Error getting response:', error);
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage && !lastMessage.isUser) {
          lastMessage.text = "I'm sorry, I encountered an error processing your request. Please try again.";
          lastMessage.isStreaming = false;
        }
        return newMessages;
      });
    } finally {
      setIsLoading(false);
      setIsGenerating(false);
    }
  };

  /**
   * Toggle the sidebar visibility
   */
  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleStopGeneration = () => {
    geminiService.cancelGeneration();
    setIsGenerating(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <ProtectedRoute>
      <View style={{ flex: 1, backgroundColor: isDarkMode ? '#343541' : '#FAFAFA', margin: 0 }}>
        <StatusBar style={isDarkMode ? "light" : "dark"}/>
        <View style={{ flex: 1, marginTop: 8 }}>
          <View style={styles.header}>
            <IconButton
              icon="menu"
              size={24}
              iconColor={isDarkMode ? theme.colors.accent : theme.colors.primary}
              onPress={toggleSidebar}
              style={styles.menuButton}
            />
            <IconButton
              icon="refresh"
              size={24}
              iconColor={isDarkMode ? theme.colors.accent : theme.colors.primary}
              onPress={resetChat}
              style={styles.resetButton}
            />
          </View>
          
          <ChatSidebar
            isVisible={showSidebar}
            onClose={() => setShowSidebar(false)}
            onNewChat={handleNewChat}
            currentThreadId={currentThreadId}
            onSelectThread={handleSelectThread}
            enableEditing={editingEnabled}
          />
          
          {!apiKeySet && (
            <Surface 
              style={[
                styles.apiKeyWarningContainer,
                { backgroundColor: isDarkMode ? 'rgba(255, 152, 0, 0.15)' : 'rgba(255, 152, 0, 0.08)' }
              ]} 
              elevation={0}
            >
              <Text style={[styles.apiKeyWarningText, { color: isDarkMode ? '#F3F4F6' : '#1F2937' }]}>
                Gemini API key is not set. Please set your API key in the settings.
              </Text>
              <Button 
                mode="contained"
                onPress={openSettings}
                style={styles.settingsButton}
                buttonColor={theme.colors.accent}
                textColor={isDarkMode ? '#FFFFFF' : '#FFFFFF'}
              >
                Open Settings
              </Button>
            </Surface>
          )}
          
          <ScrollView 
            ref={scrollViewRef}
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 16 }}
            showsVerticalScrollIndicator={false}
          >
            {messages.map((message, index) => (
              <ChatMessage 
                key={index}
                message={message.text}
                isUser={message.isUser}
                isStreaming={message.isStreaming}
              />
            ))}
            
            {isLoading && (
              <Surface 
                style={[
                  styles.loadingContainer,
                  { backgroundColor: isDarkMode ? '#1E1E1E' : '#F7F7F8' }
                ]} 
                elevation={0}
              >
                <View style={styles.loadingContent}>
                  <ActivityIndicator 
                    size="small" 
                    color={isDarkMode ? theme.colors.accent : theme.colors.primary}
                  />
                </View>
              </Surface>
            )}
          </ScrollView>
          
          <ChatInput 
            onSend={handleSend}
            isGenerating={isGenerating}
            onStopGeneration={handleStopGeneration}
            currentModel={currentModel}
            onModelChange={handleModelChange}
          />
        </View>
      </View>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingTop: 4,
  },
  menuButton: {
    margin: 0,
  },
  resetButton: {
    margin: 0,
  },
  apiKeyWarningContainer: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  apiKeyWarningText: {
    marginBottom: 12,
    textAlign: 'center',
  },
  settingsButton: {
    marginTop: 8,
  },
  messageList: {
    flex: 1,
  },
  messageListWithSidebar: {
    marginLeft: 300, // Match sidebar width
  },
  messageListContent: {
    paddingBottom: 16,
  },
  loadingContainer: {
    width: '100%',
    paddingVertical: 20,
    marginVertical: 2,
  },
  loadingContent: {
    paddingHorizontal: 16,
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
  },
});
