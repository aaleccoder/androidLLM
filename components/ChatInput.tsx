import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Keyboard } from 'react-native';
import { TextInput, IconButton, Surface } from 'react-native-paper';
import { useTheme } from '../context/themeContext';
import * as Haptics from 'expo-haptics';

interface ChatInputProps {
  onSend: (message: string) => void;
}

export const ChatInput = ({ onSend }: ChatInputProps) => {
  const [input, setInput] = useState("");
  const { theme, isDarkMode } = useTheme();
  
  const handleSend = useCallback(() => {
    if (input.trim()) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onSend(input.trim());
      setInput("");
      Keyboard.dismiss();
    }
  }, [input, onSend]);

  const hasInput = input.trim().length > 0;

  return (
    <Surface 
      style={[
        styles.container, 
        { 
          backgroundColor: isDarkMode ? theme.colors.surface : '#FFFFFF',
          borderTopColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
        }
      ]} 
      elevation={4}
    >
      <View style={styles.inputContainer}>
        <Surface
          style={[
            styles.inputWrapper,
            { backgroundColor: isDarkMode ? theme.colors.botBubble : '#F0F0F0' }
          ]}
          elevation={0}
        >
          <TextInput
            mode="flat"
            style={[
              styles.textInput,
              { backgroundColor: 'transparent' }
            ]}
            placeholder="Message Gemini..."
            placeholderTextColor={theme.colors.onSurfaceVariant}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={hasInput ? handleSend : undefined}
            blurOnSubmit={false}
            multiline
            maxLength={2000}
            underlineColor="transparent"
            activeUnderlineColor="transparent"
          />
          
          {hasInput ? (
            <IconButton
              icon="send"
              size={24}
              iconColor={theme.colors.primary}
              style={styles.sendButton}
              onPress={handleSend}
            />
          ) : (
            <View style={styles.actionsContainer}>
              <IconButton
                icon="image"
                size={24}
                iconColor={theme.colors.onSurfaceVariant}
                style={styles.actionButton}
                onPress={() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)}
              />
            </View>
          )}
        </Surface>
      </View>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 8,
    borderTopWidth: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    minHeight: 48,
    paddingHorizontal: 4,
  },
  textInput: {
    flex: 1,
    maxHeight: 120,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
  },
  sendButton: {
    margin: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
  },
  actionButton: {
    margin: 2,
  }
});
