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
import { View, ScrollView, BackHandler, StyleSheet, Text, Animated } from "react-native";
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../../context/themeContext';
import { ProtectedRoute, useAuth } from "../../hooks/useAuth";
import { useNavigation } from "expo-router";
import { ChatMessage } from '../../components/ChatMessage';
import { ChatInput } from '../../components/ChatInput';
import { ActivityIndicator, Surface, IconButton, Button } from "react-native-paper";
import { geminiService } from '../../services/geminiService';
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
}

/**
 * Chat screen component
 * Requires authentication to access
*/
export default function Chat() {
  const { isDarkMode, theme } = useTheme();
  const { data, createChatThread, updateChatThread, setActiveThread } = useData();
  const { getCurrentPassword } = useAuth();

  const [messages, setMessages] = useState<Message[]>([
    { 
      isUser: false, 
      text: "# Hello! How can I help you today?\n\nI can assist with various tasks related to Android development. Feel free to ask me anything!",
      timestamp: Date.now()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [predictedQuery, setPredictedQuery] = useState<string>('');
  const [showPrediction, setShowPrediction] = useState(false);
  const [apiKeySet, setApiKeySet] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [currentThreadId, setCurrentThreadId] = useState<string | undefined>(data?.activeThreadId);
  const [editingEnabled, setEditingEnabled] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);
  const navigation = useNavigation();

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
   * Save messages to the active thread whenever they change
   */
  useEffect(() => {
    if (currentThreadId && messages.length > 0) {
      const messagesWithTimestamps = messages.map(msg => ({
        isUser: msg.isUser,
        text: msg.text,
        timestamp: msg.timestamp || Date.now()
      }));
      
      // Only save if we have a valid password and thread ID
      try {
        const password = getCurrentPassword();
        if (password) {
          updateChatThread(currentThreadId, messagesWithTimestamps, password);
        }
      } catch (error) {
        console.error('Error saving messages:', error);
      }
    }
  }, [messages, currentThreadId]);

  /**
   * Predict next query after messages change
   */
  useEffect(() => {
    if (apiKeySet && messages.length >= 3 && !isLoading) {
      predictNextQuery();
    }
  }, [messages, isLoading, apiKeySet]);

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
      
      // Create new thread in data store
      const newThreadId = await createChatThread(password);
      setCurrentThreadId(newThreadId);
      
      // Reset messages
      setMessages([
        { 
          isUser: false, 
          text: "# Hello! How can I help you today?\n\nI can assist with various tasks related to Android development. Feel free to ask me anything!",
          timestamp: Date.now()
        }
      ]);
      
      setPredictedQuery('');
      setShowPrediction(false);
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
      
      // Reset Gemini chat context and load historical messages
      geminiService.resetChat();
      // Optionally: If you want to maintain context in Gemini, you could iterate 
      // through the thread messages and add them to Gemini's context
      
      setPredictedQuery('');
      setShowPrediction(false);
    } catch (error) {
      console.error('Error selecting thread:', error);
    }
  };

  /**
   * Predict what the user might ask next
   */
  const predictNextQuery = async () => {
    try {
      const prediction = await geminiService.predictNextQuery();
      if (prediction && prediction.trim()) {
        setPredictedQuery(prediction);
        setShowPrediction(true);
      } else {
        setShowPrediction(false);
      }
    } catch (error) {
      console.error('Error predicting next query:', error);
      setShowPrediction(false);
    }
  };

  /**
   * Use the predicted query
   */
  const usePredictedQuery = () => {
    if (predictedQuery) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      handleSend(predictedQuery);
      setShowPrediction(false);
      setPredictedQuery('');
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
    
    // Set loading state
    setIsLoading(true);
    setShowPrediction(false);
    
    try {
      // Get response from Gemini API
      const response = await geminiService.sendMessage(message);
      
      // Add bot response
      setMessages(prev => [...prev, { isUser: false, text: response, timestamp: Date.now() }]);
    } catch (error) {
      console.error('Error getting response:', error);
      setMessages(prev => [...prev, { 
        isUser: false, 
        text: "I'm sorry, I encountered an error processing your request. Please try again.",
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Toggle the sidebar visibility
   */
  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <ProtectedRoute>
      <View style={[
        styles.container, 
        { backgroundColor: isDarkMode ? '#0F0F0F' : '#FFFFFF' }
      ]}>
        <StatusBar style={isDarkMode ? "light" : "dark"}/>
        
        <View style={styles.header}>
          <IconButton
            icon="menu"
            size={24}
            iconColor={theme.colors.primary}
            onPress={toggleSidebar}
            style={styles.menuButton}
          />
          <IconButton
            icon="refresh"
            size={24}
            iconColor={theme.colors.primary}
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
            <Text style={[styles.apiKeyWarningText, { color: theme.colors.onSurface }]}>
              Gemini API key is not set. Please set your API key in the settings.
            </Text>
            <Button 
              mode="contained"
              onPress={openSettings}
              style={styles.settingsButton}
              buttonColor={theme.colors.primary}
            >
              Open Settings
            </Button>
          </Surface>
        )}
        
        <ScrollView 
          ref={scrollViewRef}
          style={[
            styles.messageList,
            showSidebar && styles.messageListWithSidebar
          ]}
          contentContainerStyle={styles.messageListContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message, index) => (
            <ChatMessage 
              key={index}
              message={message.text}
              isUser={message.isUser}
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
                  color={theme.colors.primary} 
                />
              </View>
            </Surface>
          )}
          
          {showPrediction && predictedQuery && !isLoading && (
            <Surface 
              style={[
                styles.predictionContainer,
                { backgroundColor: isDarkMode ? 'rgba(103, 80, 164, 0.15)' : 'rgba(103, 80, 164, 0.08)' }
              ]} 
              elevation={0}
            >
              <View style={styles.predictionContent}>
                <Text 
                  style={[
                    styles.predictionText,
                    { color: isDarkMode ? theme.colors.onSurfaceVariant : theme.colors.onSurface }
                  ]}
                >
                  {predictedQuery}
                </Text>
                <IconButton
                  icon="arrow-up-circle"
                  size={20}
                  iconColor={theme.colors.primary}
                  onPress={usePredictedQuery}
                  style={styles.usePredictionButton}
                />
              </View>
            </Surface>
          )}
        </ScrollView>
        
        <ChatInput onSend={handleSend} />
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
  predictionContainer: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 16,
    padding: 12,
    maxWidth: 800,
    alignSelf: 'center',
    width: '95%',
  },
  predictionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  predictionText: {
    flex: 1,
    fontSize: 14,
    fontStyle: 'italic',
  },
  usePredictionButton: {
    margin: 0,
  }
});
