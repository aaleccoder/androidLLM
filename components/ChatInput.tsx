import React, { useState, useCallback } from 'react';
import { Keyboard, TextInput, View, StyleSheet, ViewStyle, TextStyle, Modal, Text, TouchableOpacity, Pressable } from 'react-native';
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
  showModelMenu: boolean;
  setShowModelMenu: (show: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredModels: ModelOption[];
  connectionStatus: 'connected' | 'error' | 'unknown';
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

  const hasInput = input.trim().length > 0;

  const getModelDisplayName = (model: ModelOption) => {
    return `${model.displayName} (${model.provider === 'gemini' ? 'Gemini' : 'OpenRouter'})`;
  };

  return (
    <View
      className={`p-4 border-t bg-zinc-900 border-zinc-800`}
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
        <View className="flex-row items-center space-x-3">
          <View className={`flex-1 flex-row items-center rounded-lg px-3 bg-zinc-800`}>
            <TextInput
              className={`flex-1 py-2 text-base text-white`}
              placeholder={`Message ${currentModel.provider === 'gemini' ? 'Gemini' : 'OpenRouter'}...`}
              placeholderTextColor='#a3a3a3'
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
                className={`p-2 rounded-lg bg-zinc-700`}
              >
                <Send size={20} color="#FFFFFF" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)}
                className={`p-2 rounded-lg bg-zinc-700`}
              >
                <Image size={20} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

export default ChatInput;
