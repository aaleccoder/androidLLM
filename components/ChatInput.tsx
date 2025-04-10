import React, { useState, useCallback } from 'react';
import { View, Keyboard, Text } from 'react-native';
import { TextInput, IconButton, Surface, Menu } from 'react-native-paper';
import { useTheme } from '../context/themeContext';
import * as Haptics from 'expo-haptics';
import { GeminiModel } from '../services/geminiService';

interface ChatInputProps {
  onSend: (message: string) => void;
  isGenerating?: boolean;
  onStopGeneration?: () => void;
  currentModel: GeminiModel;
  onModelChange: (model: GeminiModel) => void;
}

export const ChatInput = ({ 
  onSend, 
  isGenerating = false, 
  onStopGeneration,
  currentModel,
  onModelChange
}: ChatInputProps) => {
  const [input, setInput] = useState("");
  const { theme, isDarkMode } = useTheme();
  const [showModelMenu, setShowModelMenu] = useState(false);
  
  const handleSend = useCallback(() => {
    if (input.trim()) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onSend(input.trim());
      setInput("");
      Keyboard.dismiss();
    }
  }, [input, onSend]);

  const handleStop = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onStopGeneration?.();
  }, [onStopGeneration]);

  const handleModelChange = (model: GeminiModel) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onModelChange(model);
    setShowModelMenu(false);
  };

  const hasInput = input.trim().length > 0;

  const getModelDisplayName = (model: GeminiModel) => {
    switch (model) {
      case 'gemini-2.0-flash':
        return 'Gemini 2.0 Flash';
      case 'gemini-1.5-pro':
        return 'Gemini 1.5 Pro';
      case 'gemini-2.5-pro':
        return 'Gemini 2.5 Pro';
      default:
        return model;
    }
  };

  return (
    <Surface 
      className={`p-2 border-t ${isDarkMode ? 'bg-neutral-900 border-white/5' : 'bg-white border-black/5'}`}
      elevation={4}
    >
      <View className="px-4 pb-2">
        <Menu
          visible={showModelMenu}
          onDismiss={() => setShowModelMenu(false)}
          anchor={
            <Surface
              className={`flex-row items-center rounded-full ${isDarkMode ? 'bg-neutral-800' : 'bg-neutral-100'}`}
              elevation={1}
            >
              <IconButton
                icon="lightning-bolt"
                size={16}
                iconColor={theme.colors.primary}
                className="m-0"
                onPress={() => setShowModelMenu(true)}
              />
              <Text 
                className={`text-sm -ml-1 pr-3 ${isDarkMode ? 'text-neutral-100' : 'text-neutral-900'}`}
                numberOfLines={1}
              >
                {getModelDisplayName(currentModel)}
              </Text>
            </Surface>
          }
        >
          <Menu.Item 
            onPress={() => handleModelChange('gemini-2.0-flash')}
            title="Gemini 2.0 Flash"
            leadingIcon="lightning-bolt"
          />
          <Menu.Item 
            onPress={() => handleModelChange('gemini-1.5-pro')}
            title="Gemini 1.5 Pro"
            leadingIcon="rocket"
          />
          <Menu.Item 
            onPress={() => handleModelChange('gemini-2.5-pro')}
            title="Gemini 2.5 Pro"
            leadingIcon="crown"
          />
        </Menu>
      </View>
      
      <View className="flex-row items-center">
        <Surface
          className={`flex-1 flex-row items-center rounded-3xl min-h-12 px-1 ${
            isDarkMode ? 'bg-neutral-800' : 'bg-neutral-100'
          }`}
          elevation={0}
        >
          <TextInput
            mode="flat"
            className="flex-1 max-h-[120px] px-3 py-2 bg-transparent"
            placeholder="Message Gemini..."
            placeholderTextColor={theme.colors.onSurfaceVariant}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={hasInput && !isGenerating ? handleSend : undefined}
            blurOnSubmit={false}
            multiline
            maxLength={2000}
            underlineColor="transparent"
            activeUnderlineColor="transparent"
            editable={!isGenerating}
          />
          
          {isGenerating ? (
            <IconButton
              icon="stop-circle"
              size={24}
              iconColor={theme.colors.error}
              className="m-1"
              onPress={handleStop}
            />
          ) : hasInput ? (
            <IconButton
              icon="send"
              size={24}
              iconColor={theme.colors.primary}
              className="m-1"
              onPress={handleSend}
            />
          ) : (
            <View className="flex-row">
              <IconButton
                icon="image"
                size={24}
                iconColor={theme.colors.onSurfaceVariant}
                className="m-0.5"
                onPress={() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)}
              />
            </View>
          )}
        </Surface>
      </View>
    </Surface>
  );
};
