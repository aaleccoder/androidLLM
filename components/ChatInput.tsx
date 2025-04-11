import React, { useState, useCallback } from 'react';
import { Keyboard } from 'react-native';
import { useTheme } from '../context/themeContext';
import * as Haptics from 'expo-haptics';
import { GeminiModel } from '../services/geminiService';

// Import specific icons from lucide-react-native
import { Send, X, Zap, Image } from "lucide-react-native";

// Import GlueStack UI components
import {
  Box,
  HStack,
  VStack,
  Input,
  InputField,
  Icon,
  Menu,
  MenuItem,
  MenuItemLabel,
  Text,
  Pressable,
  Button
} from "@gluestack-ui/themed";

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
  const { isDarkMode, theme } = useTheme();
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
    if (!model) {
      return 'Gemini 1.5 Pro'; // Default fallback value
    }
    
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
    <Box 
      className={`p-4 border-t border-neutral-200 dark:border-neutral-800 ${
        isDarkMode ? 'bg-neutral-900' : 'bg-neutral-50'
      }`}
      style={{ 
        shadowColor: isDarkMode ? '#000' : '#000', 
        shadowOffset: { width: 0, height: -2 }, 
        shadowOpacity: isDarkMode ? 0.2 : 0.1, 
        shadowRadius: 3, 
        elevation: 3 
      }}
    >
      <VStack space="sm">
        <Menu
          trigger={({ ...triggerProps }) => (
            <Pressable 
              {...triggerProps} 
              className={`self-start mb-1 ${
                isDarkMode ? 'bg-neutral-800' : 'bg-neutral-200'
              } rounded-full px-3 py-1`}
            >
              <HStack space="xs" alignItems="center">
                <Zap size={16} color={isDarkMode ? "#FFFFFF" : "#111827"} />
                <Text className={isDarkMode ? 'text-sm text-neutral-200' : 'text-sm text-neutral-800'}>
                  {getModelDisplayName(currentModel)}
                </Text>
              </HStack>
            </Pressable>
          )}
        >
          <MenuItem key="flash" onPress={() => handleModelChange('gemini-2.0-flash')}>
            <Zap size={16} color={isDarkMode ? "#FFFFFF" : "#111827"} />
            <MenuItemLabel>Gemini 2.0 Flash</MenuItemLabel>
          </MenuItem>
          <MenuItem key="pro15" onPress={() => handleModelChange('gemini-1.5-pro')}>
            <Zap size={16} color={isDarkMode ? "#FFFFFF" : "#111827"} />
            <MenuItemLabel>Gemini 1.5 Pro</MenuItemLabel>
          </MenuItem>
          <MenuItem key="pro25" onPress={() => handleModelChange('gemini-2.5-pro')}>
            <Zap size={16} color={isDarkMode ? "#FFFFFF" : "#111827"} />
            <MenuItemLabel>Gemini 2.5 Pro</MenuItemLabel>
          </MenuItem>
        </Menu>
        
        <HStack space="md" alignItems="center">
          <Box 
            className={`flex-1 flex-row items-center rounded-2xl px-2 ${
              isDarkMode ? 'bg-neutral-800' : 'bg-neutral-100'
            }`}
            style={{ minHeight: 48 }}
          >
            <Input
              className="flex-1 max-h-[120px] px-2 py-2 bg-transparent border-0 rounded-2xl"
              size="md"
              isDisabled={isGenerating}
            >
              <InputField 
                className={isDarkMode ? 'text-neutral-100' : 'text-neutral-800'}
                placeholder="Message Gemini..."
                placeholderTextColor={isDarkMode ? "#6B7280" : "#ADB5BD"}
                value={input}
                onChangeText={setInput}
                multiline={true}
                maxLength={2000}
                blurOnSubmit={false}
              />
            </Input>
            {isGenerating ? (
              <Button
                className="m-1"
                size="md"
                variant="solid"
                bgColor="$error600"
                borderRadius="$full"
                onPress={handleStop}
              >
                <X size={20} color="#FFFFFF" />
              </Button>
            ) : hasInput ? (
              <Button
                className="m-1"
                size="md"
                variant="solid"
                bgColor="$primary500"
                borderRadius="$full"
                onPress={handleSend}
              >
                <Send size={20} color={isDarkMode ? "#FFFFFF" : "#F8FAFC"} />
              </Button>
            ) : (
              <Button
                className="m-1"
                size="md"
                variant="solid"
                bgColor={isDarkMode ? "$neutral800" : "$neutral200"}
                borderRadius="$full"
                onPress={() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)}
              >
                <Image size={20} color={theme.colors.onSurface} />
              </Button>
            )}
          </Box>
        </HStack>
      </VStack>
    </Box>
  );
};
