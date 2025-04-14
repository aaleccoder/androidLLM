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
  const { data, createChatThread, updateChatThread, setActiveThread, saveData, deleteChatThread } = useData();
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
    // First update the current model state
    setCurrentModel(model);

    // Then update the appropriate service and reset chat
    if (model.provider === 'gemini') {
      await geminiService.changeModel(model.id as any);
    } else {
      // Reset chat history first since OpenRouter service needs this
      openRouterService.resetChat();
      openRouterService.setCustomModel(model.id);
    }
    
    // Create a new chat with the updated model
    await handleNewChat();
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

  // Enhanced method for batch saving messages with debouncing
  const saveMessagesThrottled = useRef(
    (() => {
      let timeoutId: NodeJS.Timeout | null = null;
      let lastSaved = 0;
      const THROTTLE_TIME = 2000; // 2 seconds throttle
      
      return (msgs: ChatMessageType[], immediate = false): Promise<void> => {
        if (!currentThreadId) return Promise.resolve();
        
        const now = Date.now();
        // Clear any pending timeout
        if (timeoutId) clearTimeout(timeoutId);
        
        // If immediate or throttle time passed, save now
        if (immediate || now - lastSaved > THROTTLE_TIME) {
          lastSaved = now;
          return saveMessagesExecute(msgs);
        } else {
          // Otherwise schedule for later
          return new Promise((resolve, reject) => {
            timeoutId = setTimeout(() => {
              saveMessagesExecute(msgs)
                .then(resolve)
                .catch(reject);
              lastSaved = Date.now();
              timeoutId = null;
            }, THROTTLE_TIME);
          });
        }
      };
    })()
  ).current;
  
  // Core function to save messages to the JSON file
  const saveMessagesExecute = async (msgs: ChatMessageType[]): Promise<void> => {
    if (!currentThreadId || msgs.length === 0) return;
    
    // Check if thread still exists
    if (!data?.chatThreads?.find(t => t.id === currentThreadId)) {
      console.log('Thread no longer exists, skipping save');
      return;
    }
    
    const messagesWithTimestamps = msgs.map(msg => ({
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

  // Enhanced app state change handler with optimized saves
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: string) => {
      try {
        if (appStateRef.current.match(/active/) && nextAppState.match(/inactive|background/)) {
          console.log('App going to background, saving messages...');
          // Force immediate save when app goes to background
          if (messagesRef.current.length > 0) {
            saveMessagesThrottled(messagesRef.current, true);
          }
        }
        appStateRef.current = nextAppState as AppState['currentState'];
      } catch (error) {
        console.error('Error handling app state change:', error);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
      // Final save on cleanup if needed
      if (messagesRef.current.length > 0) {
        saveMessagesThrottled(messagesRef.current, true).catch(error => 
          console.error('Error saving messages on cleanup:', error)
        );
      }
    };
  }, []);

  /**
   * Creates a new chat thread with optimized data handling
   */
  const handleNewChat = async (): Promise<string> => {
    try {
      // Save current messages if any before creating new chat
      if (currentThreadId && messagesRef.current.length > 0) {
        await saveMessagesExecute(messagesRef.current);
      }
      
      const password = getCurrentPassword();
      if (!password) {
        throw new Error('Cannot create thread: No password available');
      }

      // Reset chat state
      geminiService.resetChat();
      openRouterService.resetChat();
      setMessages([]);
      setShowWelcome(true);

      // Create unique thread ID
      const newThreadId = `thread_${Date.now()}`;
      
      // Create new thread object
      const newThread: ChatThread = {
        id: newThreadId,
        title: 'New Chat',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      // Create updated data object, optimizing for immutability
      const updatedData = {
        ...data,
        chatThreads: [
          ...(data?.chatThreads || []),
          newThread
        ],
        apiKeys: data?.apiKeys || { gemini: '', openRouter: '' },
        activeThreadId: newThreadId,
        openRouterModels: data?.openRouterModels || []
      };

      // Save the updated data
      await saveData(updatedData, password);
      
      // Update local state immediately
      setCurrentThreadId(newThreadId);
      
      // Provide tactile feedback for good UX
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return newThreadId;
    } catch (error) {
      console.error('Error creating new chat:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      throw error;
    }
  };

  /**
   * Switches to a different chat thread with optimized state transitions
   */
  const handleSelectThread = async (threadId: string) => {
    if (threadId === currentThreadId) return;
    
    try {
      // Save current thread's messages first if needed
      if (currentThreadId && messagesRef.current.length > 0) {
        await saveMessagesExecute(messagesRef.current);
      }
      
      // Find the thread to switch to
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
      
      // Update active thread in storage
      await setActiveThread(threadId, password);
      
      // Reset chat contexts in services to avoid interference between chats
      geminiService.resetChat();
      openRouterService.resetChat();
      
      // Update local state
      setCurrentThreadId(threadId);
      setShowWelcome(false);
      
      // Load messages from selected thread
      setMessages(thread.messages.map(msg => ({
        isUser: msg.isUser,
        text: msg.text,
        timestamp: msg.timestamp
      })));
      
      // Provide tactile feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('Error selecting thread:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  /**
   * Deletes a chat thread with proper cleanup
   */
  const handleDeleteThread = async (threadId: string): Promise<boolean> => {
    try {
      const password = getCurrentPassword();
      if (!password) {
        console.error('Cannot delete thread: No password available');
        return false;
      }

      // Check if we're deleting the active thread
      const isActiveThread = threadId === currentThreadId;
      
      // Perform the deletion
      await deleteChatThread(threadId, password);
      
      // If we deleted the active thread, reset the UI state
      if (isActiveThread) {
        setMessages([]);
        setShowWelcome(true);
        
        // After deletion, find if there's a new active thread to show
        if (data?.chatThreads && data.chatThreads.length > 0 && data.activeThreadId) {
          const newActiveThread = data.chatThreads.find(t => t.id === data.activeThreadId);
          if (newActiveThread) {
            setMessages(newActiveThread.messages.map(msg => ({
              isUser: msg.isUser,
              text: msg.text,
              timestamp: msg.timestamp
            })));
            setShowWelcome(newActiveThread.messages.length === 0);
            setCurrentThreadId(newActiveThread.id);
          }
        }
      }
      
      // Provide success feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return true;
    } catch (error) {
      console.error('Error deleting thread:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return false;
    }
  };

  // Handler for saving messages - use the optimized throttled version
  const saveMessages = () => {
    if (messagesRef.current.length > 0) {
      saveMessagesThrottled(messagesRef.current);
    }
  };

  // More efficient immediate save for critical updates
  const saveMessagesImmediate = (msgs: ChatMessageType[]) => {
    if (msgs.length > 0) {
      saveMessagesThrottled(msgs, true);
    }
  };

  // Handler for sidebar to create a new chat and focus it
  const handleSidebarNewChat = async (): Promise<string> => {
    try {
      // Create new chat and get thread ID
      const newThreadId = await handleNewChat();
      return newThreadId;
    } catch (err) {
      console.error('Error creating new chat from sidebar:', err);
      throw err;
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

  const handleSend = async (message: string, model: ModelOption) => {
    console.log('[Chat] handleSend called with:', { message, model });
    if (model.provider === 'openrouter' && !openRouterModels.includes(model.id)) {
      setMessages(prev => [
        ...prev,
        { isUser: true, text: message, timestamp: Date.now() },
        {
          isUser: false,
          text: `The model "${model.id}" is not available in your OpenRouter models. Please select or add a valid model in the model selector.

See https://openrouter.ai/models for available models.`,
          timestamp: Date.now(),
          isStreaming: false
        }
      ]);
      setIsLoading(false);
      setIsGenerating(false);
      return;
    }

    // Create new chat if needed
    if (!currentThreadId) {
      await handleNewChat();
    }

    // Update states
    setShowWelcome(false);
    setMessages(prev => {
      const updated = [...prev, { isUser: true, text: message, timestamp: Date.now() }];
      saveMessagesImmediate(updated); // Save after user message
      return updated;
    });
    setMessages(prev => {
      const updated = [...prev, { isUser: false, text: '', timestamp: Date.now(), isStreaming: true }];
      saveMessagesImmediate(updated); // Save after assistant placeholder
      return updated;
    });
    setIsLoading(true);
    setIsGenerating(true);

    try {
      let response = '';
      // Handle response based on provider
      if (model.provider === 'gemini') {
        await geminiService.sendMessage(message, (partialResponse) => {
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage && !lastMessage.isUser) {
              lastMessage.text = partialResponse;
              response = partialResponse; // Keep track of final response
              saveMessagesImmediate(newMessages); // Save after each partial response
            }
            return newMessages;
          });
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage && !lastMessage.isUser) {
              lastMessage.isStreaming = true; // Ensure the bubble is displayed
            }
            return newMessages;
          });
        });
      } else {
        const result = await openRouterService.sendMessage(message, (partialResponse) => {
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage && !lastMessage.isUser) {
              lastMessage.text = partialResponse;
              response = partialResponse; // Keep track of final response
              saveMessagesImmediate(newMessages); // Save after each partial response
            }
            return newMessages;
          });
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage && !lastMessage.isUser) {
              lastMessage.isStreaming = true; // Ensure the bubble is displayed
            }
            return newMessages;
          });
        });

        // Handle error responses
        if (typeof result === 'string' &&
          (result.includes('API key not set') || result.startsWith("I'm sorry") || result.toLowerCase().includes('error'))) {
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage && !lastMessage.isUser) {
              lastMessage.text = result;
              lastMessage.isStreaming = false;
            }
            return newMessages;
          });
          setIsLoading(false);
          setIsGenerating(false);
          return;
        }
      }

      // Update message states
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage && !lastMessage.isUser) {
          lastMessage.isStreaming = false;
          saveMessagesImmediate(newMessages); // Save after assistant finishes
        }
        return newMessages;
      });

      // Save messages and update thread title
      const password = getCurrentPassword();
      if (password && currentThreadId) {
        const updatedMessages = messages.map(msg => ({
          isUser: msg.isUser,
          text: msg.text,
          timestamp: msg.timestamp || Date.now()
        }));
        
        // Add the latest message pair
        updatedMessages.push(
          { isUser: true, text: message, timestamp: Date.now() },
          { isUser: false, text: response, timestamp: Date.now() }
        );

        await updateChatThread(currentThreadId, updatedMessages, password);
      }
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
              onNewChat={handleSidebarNewChat}
              currentThreadId={currentThreadId}
              onSelectThread={handleSelectThread}
              onDeleteThread={handleDeleteThread}
              enableEditing={true}
            />
          )}
        </View>
      </View>
    </ProtectedRoute>
  );
}
