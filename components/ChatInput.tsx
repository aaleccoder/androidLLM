import React, { useState, useCallback } from 'react';
import { Keyboard, TextInput, View, StyleSheet, ViewStyle, TextStyle, Modal, Text, TouchableOpacity, Pressable } from 'react-native';
import { useTheme } from '../context/themeContext';
import * as Haptics from 'expo-haptics';
import { openRouterService } from '../services/openRouterService';
import Fuse from 'fuse.js';
import { Send, X, Zap, Image, Search } from "lucide-react-native";

// Model option type now includes provider
type ModelOption = {
  id: string;
  displayName: string;
  provider: 'gemini' | 'openrouter';
};

const GEMINI_MODELS: ModelOption[] = [
  { id: 'gemini-2.0-flash', displayName: 'Gemini 2.0 Flash', provider: 'gemini' },
  { id: 'gemini-1.5-pro', displayName: 'Gemini 1.5 Pro', provider: 'gemini' },
  { id: 'gemini-2.5-pro', displayName: 'Gemini 2.5 Pro', provider: 'gemini' },
];

interface ChatInputProps {
  onSend: (message: string, model: ModelOption) => void;
  isGenerating?: boolean;
  onStopGeneration?: () => void;
  currentModel: ModelOption;
  onModelChange: (model: ModelOption) => void;
  openRouterModels: string[];
  addOpenRouterModel: (modelName: string) => void;
  className?: string;
  style?: ViewStyle | ViewStyle[];
}

const ChatInput = ({
  onSend,
  isGenerating = false,
  onStopGeneration,
  currentModel,
  onModelChange,
  openRouterModels,
  addOpenRouterModel,
  className,
  style,
}: ChatInputProps) => {
  const [input, setInput] = useState("");
  const { isDarkMode } = useTheme();
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModel, setShowAddModel] = useState(false);
  const [newModelName, setNewModelName] = useState('');

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

  const filteredModels = searchQuery
    ? fuse.search(searchQuery).map(result => result.item)
    : ALL_MODELS;

  const handleSend = useCallback(() => {
    if (input.trim()) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onSend(input.trim(), currentModel);
      setInput("");
      Keyboard.dismiss();
    }
  }, [input, onSend, currentModel]);

  const handleStop = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onStopGeneration?.();
  }, [onStopGeneration]);

  const handleModelChange = (model: ModelOption) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onModelChange(model);
    setShowModelMenu(false);
    setSearchQuery('');
  };

  const handleAddOpenRouterModel = () => {
    if (newModelName.trim()) {
      addOpenRouterModel(newModelName.trim());
      setNewModelName('');
      setShowAddModel(false);
      setShowModelMenu(false);
    }
  };

  const hasInput = input.trim().length > 0;

  const getModelDisplayName = (model: ModelOption) => {
    return `${model.displayName} (${model.provider === 'gemini' ? 'Gemini' : 'OpenRouter'})`;
  };

  return (
    <View
      className={`p-4 border-t ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}
      style={[
        {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
          elevation: 3,
        },
        style
      ]}
    >
      <View className="space-y-2">
        <TouchableOpacity
          onPress={() => setShowModelMenu(true)}
          className={`flex-row items-center space-x-2 px-3 py-2 rounded-lg ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-100'} mb-4`}
        >
          <Zap size={16} color={isDarkMode ? "#FFFFFF" : "#111827"} />
          <Text className={`text-base ${isDarkMode ? 'text-white' : 'text-black'}`}>
            {getModelDisplayName(currentModel)}
          </Text>
        </TouchableOpacity>

        <View className="flex-row items-center space-x-3">
          <View className={`flex-1 flex-row items-center rounded-lg px-3 ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
            <TextInput
              className={`flex-1 py-2 text-base ${isDarkMode ? 'text-white' : 'text-black'}`}
              placeholder={`Message ${currentModel.provider === 'gemini' ? 'Gemini' : 'OpenRouter'}...`}
              placeholderTextColor={isDarkMode ? '#a3a3a3' : '#737373'}
              value={input}
              onChangeText={setInput}
              multiline={true}
              maxLength={2000}
            />
            {isGenerating ? (
              <TouchableOpacity
                onPress={handleStop}
                className="p-2 rounded-lg bg-red-500"
              >
                <X size={20} color="#FFFFFF" />
              </TouchableOpacity>
            ) : hasInput ? (
              <TouchableOpacity
                onPress={handleSend}
                className={`p-2 rounded-lg ${isDarkMode ? 'bg-zinc-700' : 'bg-zinc-200'}`}
              >
                <Send size={20} color={isDarkMode ? "#FFFFFF" : "#111827"} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)}
                className={`p-2 rounded-lg ${isDarkMode ? 'bg-zinc-700' : 'bg-zinc-200'}`}
              >
                <Image size={20} color={isDarkMode ? "#FFFFFF" : "#111827"} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      <Modal
        visible={showModelMenu}
        onRequestClose={() => setShowModelMenu(false)}
        transparent={true}
        animationType="slide"
      >
        <Pressable 
          className="flex-1 bg-black/50"
          onPress={() => setShowModelMenu(false)}
        >
          <View className="flex-1 justify-end">
            <View className={`rounded-t-2xl p-4 ${isDarkMode ? 'bg-zinc-800' : 'bg-white'}`}>
              <View className="space-y-4">
                <View className={`flex-row items-center space-x-2 p-3 rounded-lg ${isDarkMode ? 'bg-zinc-700' : 'bg-zinc-100'}`}>
                  <Search size={16} color={isDarkMode ? "#FFFFFF" : "#111827"} />
                  <TextInput
                    className={`flex-1 text-base ${isDarkMode ? 'text-white' : 'text-black'}`}
                    placeholder="Search models..."
                    placeholderTextColor={isDarkMode ? '#a3a3a3' : '#737373'}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                      <X size={16} color={isDarkMode ? "#FFFFFF" : "#111827"} />
                    </TouchableOpacity>
                  )}
                </View>

                {filteredModels.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    onPress={() => handleModelChange(option)}
                    className={`flex-row items-center space-x-2 p-3 rounded-lg ${isDarkMode ? 'bg-zinc-700' : 'bg-zinc-100'} my-2`}
                  >
                    <Zap size={16} color={isDarkMode ? "#FFFFFF" : "#111827"} />
                    <Text className={`text-base ${isDarkMode ? 'text-white' : 'text-black'}`}>
                      {getModelDisplayName(option)}
                    </Text>
                  </TouchableOpacity>
                ))}

                <TouchableOpacity
                  onPress={() => setShowAddModel(true)}
                  className={`flex-row items-center space-x-2 p-3 rounded-lg border ${isDarkMode ? 'border-blue-400 bg-zinc-800' : 'border-blue-500 bg-zinc-100'} my-2`}
                >
                  <Zap size={16} color={isDarkMode ? "#3A59D1" : "#3A59D1"} />
                  <Text className={`text-base ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`}>
                    + Add OpenRouter Model
                  </Text>
                </TouchableOpacity>

                {filteredModels.length === 0 && (
                  <View className="p-4">
                    <Text className={`text-center ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                      No models found
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </Pressable>
        <Modal
          visible={showAddModel}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowAddModel(false)}
        >
          <View className="flex-1 justify-center items-center bg-black/50">
            <View className={`w-[90%] rounded-2xl p-5 ${isDarkMode ? 'bg-zinc-800' : 'bg-white'}`}>
              <Text className={`text-lg font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-black'}`}>Add OpenRouter Model</Text>
              <TextInput
                value={newModelName}
                onChangeText={setNewModelName}
                placeholder="Enter model name (e.g. mistral-7b)"
                placeholderTextColor={isDarkMode ? '#666' : '#999'}
                className={`px-4 py-3 text-base rounded-lg ${isDarkMode ? 'bg-zinc-700 text-white' : 'bg-zinc-100 text-black'}`}
                autoFocus
              />
              <View className="flex-row justify-end space-x-3 mt-4">
                <TouchableOpacity
                  onPress={() => setShowAddModel(false)}
                  className={`px-4 py-2 rounded-lg ${isDarkMode ? 'bg-zinc-700' : 'bg-zinc-100'}`}
                >
                  <Text className={isDarkMode ? 'text-white' : 'text-black'}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleAddOpenRouterModel}
                  className="px-4 py-2 rounded-lg bg-blue-500"
                >
                  <Text className="text-white">Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </Modal>
    </View>
  );
};

export default ChatInput;
