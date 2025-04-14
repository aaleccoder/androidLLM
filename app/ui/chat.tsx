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
import { BackHandler, AppState, View, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../../context/themeContext';
import { ProtectedRoute, useAuth } from "../../hooks/useAuth";
import { useNavigation } from "expo-router";
import { ChatMessage } from '../../components/ChatMessage';
import ChatInput from '../../components/ChatInput';
import { geminiService, GeminiModel } from '../../services/geminiService';
import { openRouterService } from '../../services/openRouterService';
import { useData, Message as DataMessage, ChatThread, Message } from '../../context/dataContext';
import * as Haptics from 'expo-haptics';
import { ChatSidebar } from '../../components/ChatSidebar';
import { Welcome } from '../../components/Welcome';

// Create a global event emitter for cross-component communication
import { EventEmitter } from 'events';
export const globalEventEmitter = new EventEmitter();

// ModelOption type for ChatInput
interface ModelOption {
  id: string;
  displayName: string;
  provider: 'gemini' | 'openrouter';
}

// Extend Message type for UI streaming state
interface ChatMessageType extends Message {
  isStreaming?: boolean;
}

const GEMINI_MODELS: ModelOption[] = [
  { id: 'gemini-2.0-flash', displayName: 'Gemini 2.0 Flash', provider: 'gemini' },
  { id: 'gemini-1.5-pro', displayName: 'Gemini 1.5 Pro', provider: 'gemini' },
  { id: 'gemini-2.5-pro', displayName: 'Gemini 2.5 Pro', provider: 'gemini' },
];

export default function Chat() {
  const { isDarkMode, theme } = useTheme();
  const { data, createChatThread, updateChatThread, setActiveThread, saveData } = useData();
  const { getCurrentPassword } = useAuth();

  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [apiKeySet, setApiKeySet] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [currentThreadId, setCurrentThreadId] = useState<string | undefined>(data?.activeThreadId);
  const [editingEnabled, setEditingEnabled] = useState(false);
  const [openRouterModels, setOpenRouterModels] = useState<string[]>([]);
  const [currentModel, setCurrentModel] = useState<ModelOption>(GEMINI_MODELS[1]); // Default Gemini 1.5 Pro
  const [showWelcome, setShowWelcome] = useState(true);

  const scrollViewRef = useRef<ScrollView>(null);
  const navigation = useNavigation();

  const handleModelChange = async (model: ModelOption) => {
    if (model.provider === 'gemini') {
      await geminiService.changeModel(model.id as any);
    } else {
      openRouterService.setCustomModel(model.id);
    }
    setCurrentModel(model);
    handleNewChat();
  };

  useEffect(() => {
    // Load OpenRouter models from app data
    if (data?.openRouterModels) {
      setOpenRouterModels(data.openRouterModels);
    }
  }, [data]);

  const addOpenRouterModel = (modelName: string) => {
    setOpenRouterModels(prev => {
      if (prev.includes(modelName)) return prev;
      const updated = [...prev, modelName];
      // Persist to app data
      if (data) {
        const password = getCurrentPassword();
        if (password) {
          saveData({ ...data, openRouterModels: updated }, password);
        }
      }
      return updated;
    });
    setCurrentModel({ id: modelName, displayName: modelName, provider: 'openrouter' });
  };

  useEffect(() => {
    if (data?.apiKeys?.gemini) {
      geminiService.setApiKey(data.apiKeys.gemini);
    }
    if (data?.apiKeys?.openRouter) {
      openRouterService.setApiKey(data.apiKeys.openRouter);
    }
  }, [data]);

  useEffect(() => {
    if (data?.activeThreadId && data.chatThreads) {
      const activeThread = data.chatThreads.find(thread => thread.id === data.activeThreadId);
      if (activeThread && activeThread.messages.length > 0) {
        setMessages(activeThread.messages.map(msg => ({
          isUser: msg.isUser,
          text: msg.text,
          timestamp: msg.timestamp
        })));
        setShowWelcome(false);
        setCurrentThreadId(activeThread.id);
      } else if (!activeThread) {
        // Reset the state when the active thread is deleted
        setMessages([]);
        setCurrentThreadId(undefined);
        setShowWelcome(true);
        geminiService.resetChat();
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
      const updatedData = {
        ...data,
        chatThreads: [
          ...(data?.chatThreads || []),
          {
            id: Date.now().toString(),
            title: 'New Chat',
            messages: [],
            createdAt: Date.now(),
            updatedAt: Date.now()
          }
        ],
        apiKeys: {
          gemini: data?.apiKeys?.gemini || '',
          openRouter: data?.apiKeys?.openRouter || ''
        },
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

    setShowWelcome(false);

    setMessages(prev => [...prev, { isUser: true, text: message, timestamp: Date.now() }]);
    setMessages(prev => [...prev, { isUser: false, text: '', timestamp: Date.now(), isStreaming: true }]);
    
    setIsLoading(true);
    setIsGenerating(true);
    
    try {
      if (currentModel.provider === 'gemini') {
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
      } else {
        await openRouterService.sendMessage(message, (partialResponse) => {
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage && !lastMessage.isUser) {
              lastMessage.text = partialResponse;
            }
            return newMessages;
          });
        });
      }

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
      <View className={`flex-1 ${isDarkMode ? 'bg-zinc-900' : 'bg-white'} border-b ${isDarkMode ? 'border-zinc-800' : 'border-zinc-200'}`}>
        <StatusBar style={isDarkMode ? "light" : "dark"}/>
        <View className="flex-1">
          {showWelcome ? (
            <Welcome />
          ) : (
            <ScrollView
              ref={scrollViewRef}
              className="flex-1"
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
          )}
          
          <ChatInput 
            onSend={handleSend}
            isGenerating={isGenerating}
            onStopGeneration={handleStopGeneration}
            currentModel={currentModel}
            onModelChange={handleModelChange}
            openRouterModels={openRouterModels}
            addOpenRouterModel={addOpenRouterModel}
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
