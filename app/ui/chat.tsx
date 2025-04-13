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
import { BackHandler, AppState, View, TouchableOpacity } from 'react-native';
import { ScrollView } from 'tamagui';
import { StatusBar } from 'expo-status-bar';
import { Menu, RefreshCw } from 'lucide-react-native'; // Updated import
import { useTheme } from '../../context/themeContext';
import { ProtectedRoute, useAuth } from "../../hooks/useAuth";
import { useNavigation } from "expo-router";
import { ChatMessage } from '../../components/ChatMessage';
import { ChatInput } from '../../components/ChatInput';
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
    saveMessages();
    await geminiService.changeModel(model);
    setCurrentModel(model);
    handleNewChat();
  };

  useEffect(() => {
    if (data?.apiKeys?.gemini) {
      geminiService.setApiKey(data.apiKeys.gemini);
      setApiKeySet(geminiService.isInitialized());
    } else {
      setApiKeySet(false);
    }

    if (data?.activeThreadId && data.chatThreads) {
      const activeThread = data.chatThreads.find(thread => thread.id === data.activeThreadId);
      if (activeThread && activeThread.messages.length > 0) {
        setMessages(activeThread.messages.map(msg => ({
          isUser: msg.isUser,
          text: msg.text,
          timestamp: msg.timestamp
        })));
        setCurrentThreadId(activeThread.id);
      } else if (!activeThread) {
        handleNewChat();
      }
    }
  }, [data]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (showSidebar) {
        setShowSidebar(false);
        return true;
      }
      return true;
    });

    const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
      e.preventDefault();
    });
    
    const toggleSidebarHandler = () => {
      setShowSidebar(prevState => !prevState);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };
    globalEventEmitter.addListener('toggleSidebar', toggleSidebarHandler);

    return () => {
      backHandler.remove();
      unsubscribe();
      globalEventEmitter.removeListener('toggleSidebar', toggleSidebarHandler);
    };
  }, [navigation, showSidebar]);

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages, isLoading]);

  const appStateRef = useRef(AppState.currentState);
  const messagesRef = useRef(messages);
  
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    const handleAppStateChange = async (nextAppState: string) => {
      try {
        if (appStateRef.current.match(/active/) && nextAppState.match(/inactive|background/)) {
          console.log('App going to background, saving messages...');
          await saveMessages();
        }
        appStateRef.current = nextAppState as AppState['currentState'];
      } catch (error) {
        console.error('Error handling app state change:', error);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
      saveMessages().catch(error => 
        console.error('Error saving messages on cleanup:', error)
      );
    };
  }, []);

  const saveMessages = async (): Promise<void> => {
    if (!currentThreadId || messagesRef.current.length === 0) return;
    
    const messagesWithTimestamps = messagesRef.current.map(msg => ({
      isUser: msg.isUser,
      text: msg.text,
      timestamp: msg.timestamp || Date.now()
    }));
    
    try {
      const password = getCurrentPassword();
      if (password) {
        console.log('Saving chat thread to storage...');
        await updateChatThread(currentThreadId, messagesWithTimestamps, password);
      }
    } catch (error) {
      console.error('Error saving messages:', error);
    }
  };

  const handleNewChat = async () => {
    try {
      const password = getCurrentPassword();
      if (!password) {
        console.error('Cannot create thread: No password available');
        return;
      }
      
      geminiService.resetChat();
      
      const initialMessage = { 
        isUser: false, 
        text: "# Hello! How can I help you today?\n\nI'm ready to assist you with any questions or tasks you have.",
        timestamp: Date.now()
      };
      
      setMessages([initialMessage]);
      
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
      
      setCurrentThreadId(newThreadId);
      
      await saveData(updatedData, password);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error creating new chat:', error);
    }
  };

  const handleSelectThread = async (threadId: string) => {
    if (threadId === currentThreadId) return;
    
    try {
      saveMessages();
      
      const thread = data?.chatThreads?.find(t => t.id === threadId);
      if (!thread) {
        console.error('Thread not found:', threadId);
        return;
      }
      
      const password = getCurrentPassword();
      if (!password) {
        console.error('Cannot select thread: No password available');
        return;
      }
      
      await setActiveThread(threadId, password);
      setCurrentThreadId(threadId);
      
      setMessages(thread.messages.map(msg => ({
        isUser: msg.isUser,
        text: msg.text,
        timestamp: msg.timestamp
      })));
      
      geminiService.resetChat();
    } catch (error) {
      console.error('Error selecting thread:', error);
    }
  };

  const resetChat = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    handleNewChat();
  };

  const openSettings = () => {
    globalEventEmitter.emit('openSettings');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSend = async (message: string) => {
    if (!currentThreadId) {
      await handleNewChat();
    }

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
    
    setMessages(prev => [...prev, { isUser: true, text: message, timestamp: Date.now() }]);
    
    setMessages(prev => [...prev, { isUser: false, text: '', timestamp: Date.now(), isStreaming: true }]);
    
    setIsLoading(true);
    setIsGenerating(true);
    
    try {
      await geminiService.sendMessage(message, (partialResponse) => {
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage && !lastMessage.isUser) {
            lastMessage.text = partialResponse;
          }
          return newMessages;
        });
      });

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
      <View style={{
        flex: 1, 
        backgroundColor: isDarkMode ? theme.colors.background : theme.colors.background
      }}>
        <StatusBar style={isDarkMode ? "light" : "dark"}/>
        <View style={{ flex: 1, marginTop: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 8, paddingTop: 4 }}>
            <TouchableOpacity 
              onPress={toggleSidebar}
              style={{ padding: 8 }}
            >
              <Menu 
                size={24}
                color={isDarkMode ? theme.colors.accent : theme.colors.primary}
              />
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={resetChat}
              style={{ padding: 8 }}
            >
              <RefreshCw 
                size={24}
                color={isDarkMode ? theme.colors.accent : theme.colors.primary}
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            ref={scrollViewRef}
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          >
            {messages.map((message, index) => (
              <ChatMessage 
                key={index}
                content={message.text}
                role={message.isUser ? 'user' : 'assistant'}
                isLast={index === messages.length - 1}
                isGenerating={message.isStreaming}
              />
            ))}
          </ScrollView>
          
          <ChatInput 
            onSend={handleSend}
            isGenerating={isGenerating}
            onStopGeneration={handleStopGeneration}
            currentModel={currentModel}
            onModelChange={handleModelChange}
          />
          
          {showSidebar && (
            <ChatSidebar
              isVisible={true}
              onClose={() => setShowSidebar(false)}
              onNewChat={handleNewChat}
              currentThreadId={currentThreadId}
              onSelectThread={handleSelectThread}
              enableEditing={true}
            />
          )}
        </View>
      </View>
    </ProtectedRoute>
  );
}
