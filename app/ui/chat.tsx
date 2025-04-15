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
import { BackHandler, AppState, View, ScrollView, Modal, Text, TouchableOpacity, ActivityIndicator, FlatList, TextInput } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../../context/themeContext';
import { ProtectedRoute, useAuth } from "../../hooks/useAuth";
import { useNavigation } from "expo-router";
import { ChatMessage } from '../../components/ChatMessage';
import ChatInput from '../../components/ChatInput';
import { geminiService, GeminiModel } from '../../services/geminiService';
import { OpenRouterModel, openRouterService } from '../../services/openRouterService';
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

  // OpenRouter models modal state
  const [availableModels, setAvailableModels] = useState<OpenRouterModel[]>([]);
  const [isModelsModalOpen, setIsModelsModalOpen] = useState(false);
  const [isModelsLoading, setIsModelsLoading] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [modelSearch, setModelSearch] = useState<string>('');

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

  const handleShowModels = async () => {
    setIsModelsModalOpen(true);
    setIsModelsLoading(true);
    setModelsError(null);
    try {
      const models = await openRouterService.fetchAvailableModels();
      setAvailableModels(models);
    } catch (err) {
      setModelsError('Failed to fetch models. Please check your connection or API key.');
    } finally {
      setIsModelsLoading(false);
    }
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

  const handleAddAndSwitchModel = (model: OpenRouterModel) => {
    addOpenRouterModel(model.id);
    setCurrentModel({ id: model.id, displayName: model.name, provider: 'openrouter' });
    setIsModelsModalOpen(false);
    setModelSearch('');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const filteredModels = availableModels.filter((model) => {
    const search = modelSearch.trim().toLowerCase();
    if (!search) return true;
    return (
      model.name.toLowerCase().includes(search) ||
      model.id.toLowerCase().includes(search) ||
      model.description.toLowerCase().includes(search)
    );
  });

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
    if (!currentThreadId) {
      await handleNewChat();
    }
    setShowWelcome(false);
    setMessages(prev => [...prev, { isUser: true, text: message, timestamp: Date.now() }]);
    setMessages(prev => [...prev, { isUser: false, text: '', timestamp: Date.now(), isStreaming: true }]);
    setIsLoading(true);
    setIsGenerating(true);
    try {
      if (model.provider === 'gemini') {
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
        const result = await openRouterService.sendMessage(message, (partialResponse) => {
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage && !lastMessage.isUser) {
              lastMessage.text = partialResponse;
            }
            return newMessages;
          });
        });
        console.log('[Chat] openRouterService.sendMessage result:', result);
        // If the result is an error string, show it in the chat
        if (
          typeof result === 'string' &&
          (result.includes('API key not set') || result.startsWith("I'm sorry") || result.toLowerCase().includes('error'))
        ) {
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
          {/* Button to check OpenRouter models */}
          <View className="px-4 pt-2 pb-1">
            <TouchableOpacity
              onPress={handleShowModels}
              className={`rounded-lg px-4 py-2 ${isDarkMode ? 'bg-blue-700' : 'bg-blue-500'}`}
              accessibilityLabel="Check available OpenRouter models"
            >
              <Text className="text-white text-center font-semibold">Check OpenRouter Models</Text>
            </TouchableOpacity>
          </View>
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

          {/* Models Modal */}
          <Modal
            visible={isModelsModalOpen}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setIsModelsModalOpen(false)}
          >
            <View className="flex-1 justify-end bg-black/50">
              <View className={`rounded-t-2xl p-4 max-h-[80%] ${isDarkMode ? 'bg-zinc-900' : 'bg-white'}`}>  
                <View className="flex-row items-center mb-2">
                  <Text className={`text-xl font-bold flex-1 ${isDarkMode ? 'text-white' : 'text-black'}`}>Available OpenRouter Models</Text>
                  <TouchableOpacity
                    onPress={() => { setIsModelsModalOpen(false); setModelSearch(''); }}
                    className="p-2 ml-2"
                    accessibilityLabel="Close models list"
                  >
                    <Text className="text-lg font-bold">×</Text>
                  </TouchableOpacity>
                </View>
                <TextInput
                  value={modelSearch}
                  onChangeText={setModelSearch}
                  placeholder="Search models by name, id, or description..."
                  placeholderTextColor={isDarkMode ? '#aaa' : '#666'}
                  className={`mb-3 px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-zinc-100 border-zinc-300 text-black'}`}
                  autoFocus
                  accessibilityLabel="Search models"
                  returnKeyType="search"
                />
                {isModelsLoading ? (
                  <ActivityIndicator size="large" color={isDarkMode ? '#fff' : '#000'} className="mt-8" />
                ) : modelsError ? (
                  <Text className="text-red-500 mt-4">{modelsError}</Text>
                ) : filteredModels.length === 0 ? (
                  <Text className={`text-center mt-8 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>No models found.</Text>
                ) : (
                  <FlatList
                    data={filteredModels}
                    keyExtractor={item => item.id}
                    style={{ marginTop: 8 }}
                    renderItem={({ item }) => (
                      <View className={`mb-4 p-3 rounded-lg ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-100'}`}> 
                        <Text className={`font-semibold text-base ${isDarkMode ? 'text-white' : 'text-black'}`}>{item.name}</Text>
                        <Text className={`text-xs mb-1 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>{item.id}</Text>
                        <Text className={`text-sm mb-1 ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>{item.description}</Text>
                        <Text className={`text-xs ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>Context: {item.context_length} tokens</Text>
                        <Text className={`text-xs ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>Prompt: ${item.pricing.prompt} | Completion: ${item.pricing.completion}</Text>
                        <TouchableOpacity
                          onPress={() => handleAddAndSwitchModel(item)}
                          className={`mt-2 px-3 py-1 rounded bg-blue-600 ${openRouterModels.includes(item.id) ? 'opacity-60' : ''}`}
                          disabled={openRouterModels.includes(item.id)}
                          accessibilityLabel={`Add and switch to model ${item.name}`}
                        >
                          <Text className="text-white text-center text-sm font-semibold">
                            {openRouterModels.includes(item.id) ? 'Added' : 'Add & Switch'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  />
                )}
              </View>
            </View>
          </Modal>
        </View>
      </View>
    </ProtectedRoute>
  );
}
