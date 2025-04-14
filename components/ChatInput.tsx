import React, { useState, useCallback } from 'react';
import { Keyboard, TextInput, View as RNView, StyleSheet, View } from 'react-native';
import { useTheme } from '../context/themeContext';
import * as Haptics from 'expo-haptics';
import { GeminiModel } from '../services/geminiService';
import { Text as PaperText, Button as PaperButton, Modal } from 'react-native-paper';

// Import specific icons from lucide-react-native
import { Send, X, Zap, Image } from "lucide-react-native";

interface ChatInputProps {
  onSend: (message: string) => void;
  isGenerating?: boolean;
  onStopGeneration?: () => void;
  currentModel: GeminiModel;
  onModelChange: (model: GeminiModel) => void;
}

const ChatInput = ({
  onSend,
  isGenerating = false,
  onStopGeneration,
  currentModel,
  onModelChange,
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

  // Dynamic styles based on theme
  const dynamicStyles = {
    container: {
      backgroundColor: isDarkMode ? '#171717' : '#fafafa',
      borderTopColor: isDarkMode ? '#404040' : '#e5e5e5',
    },
    inputContainer: {
      backgroundColor: isDarkMode ? '#262626' : '#f5f5f5',
    },
    input: {
      color: isDarkMode ? '#ffffff' : '#171717',
    },
    modelButton: {
      backgroundColor: isDarkMode ? '#262626' : '#f5f5f5',
    },
    modelButtonText: {
      color: isDarkMode ? '#ffffff' : '#171717',
    }
  };

  return (
    <RNView
      style={[
        styles.container,
        dynamicStyles.container
      ]}
    >
      <RNView className="space-y-2">
        <PaperButton
          onPress={() => setShowModelMenu(true)}
          style={[styles.modelButton, dynamicStyles.modelButton]}
        >
          <RNView className="flex-row items-center space-x-2">
            <Zap size={16} color={isDarkMode ? "#FFFFFF" : "#111827"} />
            <PaperText style={[dynamicStyles.modelButtonText, {fontSize: 16}]} >
              {getModelDisplayName(currentModel)}
            </PaperText>
          </RNView>
        </PaperButton>

        <RNView className="flex-row items-center space-x-3">
          <RNView
            style={[
              styles.inputContainer,
              dynamicStyles.inputContainer
            ]}
          >
            <TextInput
              style={[styles.input, dynamicStyles.input]}
              placeholder="Message Gemini..."
              placeholderTextColor={isDarkMode ? '#a3a3a3' : '#737373'}
              value={input}
              onChangeText={setInput}
              multiline={true}
              maxLength={2000}
            />
            {isGenerating ? (
              <PaperButton
                onPress={handleStop}
                style={styles.actionButton}
                buttonColor="#ef4444"
              >
                <X size={20} color="#FFFFFF" />
              </PaperButton>
            ) : hasInput ? (
              <PaperButton
                onPress={handleSend}
                style={styles.actionButton}
                buttonColor={isDarkMode ? '#262626' : '#f5f5f5'}
              >
                <Send size={20} color={isDarkMode ? "#FFFFFF" : "#111827"} />
              </PaperButton>
            ) : (
              <PaperButton
                onPress={() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)}
                style={styles.actionButton}
                buttonColor={isDarkMode ? '#262626' : '#f5f5f5'}
              >
                <Image size={20} color={isDarkMode ? "#FFFFFF" : "#111827"} />
              </PaperButton>
            )}
          </RNView>
        </RNView>
      </RNView>

      <Modal
        visible={showModelMenu}
        onDismiss={() => setShowModelMenu(false)}
      >
        <RNView className="flex-1 justify-end bg-zinc-800/50">
          <RNView className="bg-zinc-50 dark:bg-zinc-800 rounded-t-2xl p-4">
            <RNView className="space-y-4">
              <PaperButton
                onPress={() => handleModelChange('gemini-2.0-flash')}
                style={{ borderRadius: 8 }}
              >
                <RNView className="flex-row items-center space-x-2">
                  <Zap size={16} color={isDarkMode ? "#FFFFFF" : "#111827"} />
                  <PaperText style={{ color: isDarkMode ? '#ffffff' : '#171717' }}>Gemini 2.0 Flash</PaperText>
                </RNView>
              </PaperButton>
              <PaperButton
                onPress={() => handleModelChange('gemini-1.5-pro')}
                style={{ borderRadius: 8 }}
              >
                <RNView className="flex-row items-center space-x-2">
                  <Zap size={16} color={isDarkMode ? "#FFFFFF" : "#111827"} />
                  <PaperText style={{ color: isDarkMode ? '#ffffff' : '#171717' }}>Gemini 1.5 Pro</PaperText>
                </RNView>
              </PaperButton>
              <PaperButton
                onPress={() => handleModelChange('gemini-2.5-pro')}
                style={{ borderRadius: 8 }}
              >
                <RNView className="flex-row items-center space-x-2">
                  <Zap size={16} color={isDarkMode ? "#FFFFFF" : "#111827"} />
                  <PaperText style={{ color: isDarkMode ? '#ffffff' : '#171717' }}>Gemini 2.5 Pro</PaperText>
                </RNView>
              </PaperButton>
            </RNView>
          </RNView>
        </RNView>
      </Modal>
    </RNView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    padding: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    maxHeight: 100,
  },
  modelButton: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actionButton: {
    borderRadius: 8,
    margin: 4,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default ChatInput;
