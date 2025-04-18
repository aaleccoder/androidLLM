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
import Fuse from 'fuse.js';
import { TitleBar } from '../../components/TitleBar';
import ModelPickerModal from '../../components/ModelPickerModal';
import { globalEventEmitter } from "@/utils/event";
import { ChevronDown } from 'lucide-react-native';


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
  const { data, createChatThread, updateChatThread, setActiveThread, deleteChatThread, setActiveThreadInMemory, updateChatThreadInMemory, deleteChatThreadInMemory, saveData } = useData();
  const { getCurrentPassword } = useAuth();

  // --- Types for state ---
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [apiKeySet, setApiKeySet] = useState<boolean>(false);
  const [showSidebar, setShowSidebar] = useState<boolean>(false);
  const [sidebarAnimating, setSidebarAnimating] = useState<boolean>(false); // NEW
  const [sidebarMounted, setSidebarMounted] = useState<boolean>(false); // NEW
  const [currentThreadId, setCurrentThreadId] = useState<string | undefined>(data?.activeThreadId);
  const [editingEnabled, setEditingEnabled] = useState<boolean>(false);
  const [openRouterModels, setOpenRouterModels] = useState<string[]>([]);
  const [currentModel, setCurrentModel] = useState<ModelOption>(GEMINI_MODELS[1]); // Default Gemini 1.5 Pro
  const [showWelcome, setShowWelcome] = useState<boolean>(true);

  // OpenRouter models modal state
  const [availableModels, setAvailableModels] = useState<OpenRouterModel[]>([]);
  const [isModelsModalOpen, setIsModelsModalOpen] = useState(false);
  const [isModelsLoading, setIsModelsLoading] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [modelSearch, setModelSearch] = useState<string>('');

  // Model switcher modal state (moved up from ChatInput)
  const [showModelMenu, setShowModelMenu] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  // Combine Gemini and OpenRouter models
  const openRouterModelOptions: ModelOption[] = openRouterModels.map(m => ({
    id: m,
    displayName: m,
    provider: 'openrouter'
  }));
  const ALL_MODELS: ModelOption[] = [...GEMINI_MODELS, ...openRouterModelOptions];
  const fuse = new Fuse(ALL_MODELS, {
    keys: ['displayName'],
    threshold: 0.4,
    includeScore: true
  });
  const filteredModels: ModelOption[] = searchQuery
    ? fuse.search(searchQuery).map(result => result.item)
    : ALL_MODELS;
  // Model change handler (unified)
  const handleModelChangeUnified = (model: ModelOption) => {
    handleModelChange(model);
    setShowModelMenu(false);
    setSearchQuery('');
  };

  const scrollViewRef = useRef<ScrollView>(null);
  const navigation = useNavigation();

  // Helper: get next available thread id (after deletion)
  const getNextThreadId = (deletedId?: string): string | undefined => {
    if (!data?.chatThreads || data.chatThreads.length === 0) return undefined;
    const threads = data.chatThreads.filter(t => t.id !== deletedId);
    if (threads.length === 0) return undefined;
    // Prefer most recently updated
    return threads.sort((a, b) => b.updatedAt - a.updatedAt)[0].id;
  };

  // Listen for thread deletion in data context
  useEffect(() => {
    // If current thread is gone, switch to next or show welcome
    if (currentThreadId && (!data?.chatThreads?.find(t => t.id === currentThreadId))) {
      const nextId = getNextThreadId(currentThreadId);
      if (nextId) {
        handleSelectThread(nextId);
      } else {
        setMessages([]);
        setCurrentThreadId(undefined);
        setShowWelcome(true);
        geminiService.resetChat();
      }
    }
  }, [data?.chatThreads]);

  // On model change, always create and switch to a new chat
  const handleModelChange = async (model: ModelOption) => {
    if (model.provider === 'gemini') {
      await geminiService.changeModel(model.id as any);
    } else {
      openRouterService.setCustomModel(model.id);
    }
    setCurrentModel(model);
    await handleNewChat();
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

  const filteredModelsAvailable = availableModels.filter((model) => {
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

  // --- Robust effect for data changes ---
  useEffect(() => {
    if (!data?.activeThreadId || !data.chatThreads) {
      setMessages([]);
      setCurrentThreadId(undefined);
      setShowWelcome(true);
      geminiService.resetChat();
      return;
    }
    const activeThread: ChatThread | undefined = data.chatThreads.find(thread => thread.id === data.activeThreadId);
    if (activeThread) {
      setMessages(activeThread.messages.map((msg: Message) => ({
        isUser: msg.isUser,
        text: msg.text,
        timestamp: msg.timestamp
      })));
      setShowWelcome(activeThread.messages.length === 0);
      setCurrentThreadId(activeThread.id);
    } else {
      setMessages([]);
      setCurrentThreadId(undefined);
      setShowWelcome(true);
      geminiService.resetChat();
    }
  }, [data?.activeThreadId, data?.chatThreads]);

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
      // Use new createChatThread API with model
      const newThreadId = await createChatThread(password, currentModel);
      setCurrentThreadId(newThreadId);
      setMessages([]);
      setShowWelcome(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error creating new chat:', error);
    }
  };

  // --- Robust chat switching ---
  const handleSelectThread = async (threadId: string): Promise<void> => {
    if (threadId === currentThreadId) return;
    try {
      await saveMessages();
      const thread: ChatThread | undefined = data?.chatThreads?.find((t) => t.id === threadId);
      if (!thread) {
        console.error('Thread not found:', threadId);
        return;
      }
      // Update local state and context in-memory for instant feedback
      setCurrentThreadId(threadId);
      setMessages(thread.messages.map((msg: Message) => ({
        isUser: msg.isUser,
        text: msg.text,
        timestamp: msg.timestamp,
      })));
      setShowWelcome(thread.messages.length === 0);
      setCurrentModel({
        id: thread.model.id,
        displayName: thread.model.displayName,
        provider: thread.model.provider as "gemini" | "openrouter"
      }); // Set model from thread
      geminiService.resetChat();
      setActiveThreadInMemory(threadId);
      // Do NOT persist here; only persist on explicit actions
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
    // In-memory update for instant feedback
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
              lastMessage.text += partialResponse; // Append the new chunk
            }
            return newMessages;
          });
        });
        // Only treat as error if result is an object with an error property
        if (typeof result === 'object' && result !== null && 'error' in result) {
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage && !lastMessage.isUser) {
              lastMessage.text = result.error;
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
      // Persist the chat after message is sent
      if (currentThreadId) {
        updateChatThreadInMemory(currentThreadId, messagesRef.current);
        const password = getCurrentPassword();
        if (password) {
          await updateChatThread(currentThreadId, messagesRef.current, password);
        }
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

  const handleSidebarClose = () => {
    setShowSidebar(false);
    setSidebarAnimating(true);
  };

  // Compute connection status for ChatInput
  type ConnectionStatus = 'connected' | 'error' | 'unknown';
  const connectionStatus: ConnectionStatus = React.useMemo(() => {
    if (currentModel.provider === 'gemini') {
      return data?.apiKeys?.gemini ? 'connected' : 'error';
    } else if (currentModel.provider === 'openrouter') {
      return data?.apiKeys?.openRouter ? 'connected' : 'error';
    }
    return 'unknown';
  }, [currentModel, data]);

  useEffect(() => {
    navigation.setOptions({
      header: (props: any) => (
        <TitleBar
          {...props}
          showMenuButton={true}
          isDarkMode={true}
          setIsDarkMode={() => {}}
          setShowSettings={openSettings}
        />
      )
    });
  }, []);

  return (
    <ProtectedRoute>
      <View className="flex-1 bg-background border-b border-zinc-800">
        <StatusBar style="light"/>
        <View className="flex-1">
          {/* Button to check OpenRouter models */}
          {/* <View className="px-4 pt-2 pb-1">
            <TouchableOpacity
              onPress={handleShowModels}
              className="rounded-lg px-4 py-2 bg-blue-600"
              accessibilityLabel="Check available OpenRouter models"
            >
              <Text className="text-white text-center font-semibold">Check OpenRouter Models</Text>
            </TouchableOpacity>
          </View> */}

          {/* Model Picker Modal Button & Modal (now above messages, under TitleBar) */}
          <View className="px-4 pb-2">
            <TouchableOpacity
              onPress={() => setShowModelMenu(true)}
              className="flex-row items-center justify-center px-3 py-2 rounded-lg bg-background"
              accessibilityLabel="Open model picker"
              style={{ minHeight: 40 }}
            >
              <View className="flex-row items-center justify-center">
                <Text className="text-base text-white mr-1">
                  {`${currentModel.displayName} (${currentModel.provider === 'gemini' ? 'Gemini' : 'OpenRouter'})`}
                </Text>
                <ChevronDown size={20} color="#61BA82" />
              </View>
            </TouchableOpacity>
          </View>
          <ModelPickerModal
            visible={showModelMenu}
            onRequestClose={() => setShowModelMenu(false)}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filteredModels={filteredModels}
            onModelChange={handleModelChangeUnified}
            currentModel={currentModel}
            connectionStatus={connectionStatus}
            showAddModel={false}
            setShowAddModel={() => {}}
            newModelName={''}
            setNewModelName={() => {}}
            handleAddOpenRouterModel={() => {}}
          />

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
            onModelChange={handleModelChangeUnified}
            openRouterModels={openRouterModels}
            addOpenRouterModel={addOpenRouterModel}
            showModelMenu={showModelMenu}
            setShowModelMenu={setShowModelMenu}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filteredModels={filteredModels}
            connectionStatus={connectionStatus}
          />
          
          {(showSidebar || sidebarMounted) && (
            <ChatSidebar
              isVisible={showSidebar}
              onClose={handleSidebarClose}
              onMount={() => setSidebarMounted(true)} // NEW PROP
              onFullyClosed={() => setSidebarMounted(false)} // NEW PROP
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
              <View className="rounded-t-2xl p-4 max-h-[80%] bg-zinc-900">  
                <View className="flex-row items-center mb-2">
                  <Text className="text-xl font-bold flex-1 text-white">Available OpenRouter Models</Text>
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
                  placeholderTextColor="#a1a1aa" // zinc-400
                  className="mb-3 px-3 py-2 rounded-lg border bg-zinc-800 border-zinc-700 text-white placeholder-zinc-400"
                  autoFocus
                  accessibilityLabel="Search models"
                  returnKeyType="search"
                />
                {isModelsLoading ? (
                  <ActivityIndicator size="large" color="#22c55e" className="mt-8" />
                ) : modelsError ? (
                  <Text className="text-red-500 mt-4">{modelsError}</Text>
                ) : filteredModelsAvailable.length === 0 ? (
                  <Text className="text-center mt-8 text-zinc-400">No models found.</Text>
                ) : (
                  <FlatList
                    data={filteredModelsAvailable}
                    keyExtractor={item => item.id}
                    style={{ marginTop: 8 }}
                    renderItem={({ item }) => (
                      <View className="mb-4 p-3 rounded-lg bg-zinc-800"> 
                        <Text className="font-semibold text-base text-white">{item.name}</Text>
                        <Text className="text-xs mb-1 text-zinc-400">{item.id}</Text>
                        <Text className="text-sm mb-1 text-zinc-300">{item.description}</Text>
                        <Text className="text-xs text-zinc-400">Context: {item.context_length} tokens</Text>
                        <Text className="text-xs text-zinc-400">Prompt: ${item.pricing.prompt} | Completion: ${item.pricing.completion}</Text>
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
