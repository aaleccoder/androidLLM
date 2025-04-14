import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { useData } from '../context/dataContext';
import { useAuth } from '../hooks/useAuth';
import { Eye, EyeOff, X, Save } from 'lucide-react-native';
import { useTheme } from '../context/themeContext';
import { geminiService } from '../services/geminiService';
import * as Haptics from 'expo-haptics';

type UiState = {
  showGeminiKey: boolean;
  showGroqKey: boolean;
  showPassword: boolean;
  showPasswordInput: boolean;
  isSaving: boolean;
  saveError: string | null;
}

type FormState = {
  geminiKey: string;
  openRouterKey: string;
  customPrompt: string;
  password: string;
}

interface SettingsProps {
  isVisible: boolean;
  onClose: () => void;
}

export function Settings({ isVisible, onClose }: SettingsProps) {
  const { isDarkMode } = useTheme();
  const { data, saveData } = useData();
  const { isAuthenticated } = useAuth();

  const [formState, setFormState] = useState<FormState>({
    geminiKey: data?.apiKeys?.gemini || '',
    openRouterKey: data?.apiKeys?.openRouter || '',
    customPrompt: data?.settings?.customPrompt || '',
    password: '',
  });

  const [uiState, setUiState] = useState<UiState>({
    showGeminiKey: false,
    showGroqKey: false,
    showPassword: false,
    showPasswordInput: false,
    isSaving: false,
    saveError: null,
  });

  const handleInputChange = useCallback((field: keyof FormState, value: string) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  }, []);

  const toggleVisibility = useCallback((field: keyof Pick<UiState, 'showGeminiKey' | 'showGroqKey' | 'showPassword'>) => {
    setUiState(prev => ({ ...prev, [field]: !prev[field] }));
  }, []);

  const handleSaveSettings = useCallback(async () => {
    if (!isAuthenticated || uiState.isSaving) return;

    setUiState(prev => ({ ...prev, isSaving: true, saveError: null }));

    const newData = {
      ...data,
      apiKeys: {
        gemini: formState.geminiKey.trim(),
        openRouter: formState.openRouterKey.trim()
      },
      settings: {
        ...data?.settings,
        customPrompt: formState.customPrompt.trim() || undefined
      },
      chatThreads: data?.chatThreads || []
    };

    try {
      if (!formState.password) {
        setUiState(prev => ({ 
          ...prev, 
          showPasswordInput: true, 
          isSaving: false 
        }));
        return;
      }
      
      await saveData(newData, formState.password);
      geminiService.setCustomPrompt(formState.customPrompt.trim() || undefined);
      setUiState(prev => ({ 
        ...prev, 
        showPasswordInput: false, 
        isSaving: false 
      }));
      setFormState(prev => ({ ...prev, password: '' }));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onClose();
    } catch (error) {
      console.error('Error saving settings:', error);
      setUiState(prev => ({ 
        ...prev,
        saveError: error instanceof Error ? error.message : 'Failed to save settings.',
        showPasswordInput: true,
        isSaving: false
      }));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [isAuthenticated, data, formState, onClose]);

  if (!isVisible) return null;

  return (
    <Modal
      visible={true}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View className={`rounded-t-2xl ${isDarkMode ? 'bg-zinc-800' : 'bg-white'}`}>
          <View className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-700 flex-row justify-between items-center">
            <Text className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
              Settings
            </Text>
            <TouchableOpacity
              onPress={onClose}
              className={`p-2 rounded-full ${isDarkMode ? 'bg-zinc-700' : 'bg-zinc-100'}`}
            >
              <X size={20} color={isDarkMode ? "#fff" : "#000"} />
            </TouchableOpacity>
          </View>

          <ScrollView className="px-4 py-4">
            {isAuthenticated && (
              <>
                <View className="mb-6">
                  <Text className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                    API Keys
                  </Text>
                  <View className="space-y-4">
                    <View>
                      <Text className={`text-base mb-1 ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>
                        Gemini API Key
                      </Text>
                      <View className={`flex-row items-center rounded-lg overflow-hidden ${isDarkMode ? 'bg-zinc-700' : 'bg-zinc-100'}`}>
                        <TextInput
                          value={formState.geminiKey}
                          onChangeText={(value) => handleInputChange('geminiKey', value)}
                          placeholder="Enter Gemini API Key"
                          placeholderTextColor={isDarkMode ? '#666' : '#999'}
                          secureTextEntry={!uiState.showGeminiKey}
                          className={`flex-1 px-4 py-3 text-base ${isDarkMode ? 'text-white' : 'text-black'}`}
                        />
                        <TouchableOpacity
                          onPress={() => toggleVisibility('showGeminiKey')}
                          className="px-4"
                        >
                          {uiState.showGeminiKey ? (
                            <EyeOff size={20} color={isDarkMode ? "#fff" : "#000"} />
                          ) : (
                            <Eye size={20} color={isDarkMode ? "#fff" : "#000"} />
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View>
                      <Text className={`text-base mb-1 ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>
                        OpenRouter API Key
                      </Text>
                      <View className={`flex-row items-center rounded-lg overflow-hidden ${isDarkMode ? 'bg-zinc-700' : 'bg-zinc-100'}`}>
                        <TextInput
                          value={formState.openRouterKey}
                          onChangeText={(value) => handleInputChange('openRouterKey', value)}
                          placeholder="Enter OpenRouter API Key"
                          placeholderTextColor={isDarkMode ? '#666' : '#999'}
                          secureTextEntry={!uiState.showGroqKey}
                          className={`flex-1 px-4 py-3 text-base ${isDarkMode ? 'text-white' : 'text-black'}`}
                        />
                        <TouchableOpacity
                          onPress={() => toggleVisibility('showGroqKey')}
                          className="px-4"
                        >
                          {uiState.showGroqKey ? (
                            <EyeOff size={20} color={isDarkMode ? "#fff" : "#000"} />
                          ) : (
                            <Eye size={20} color={isDarkMode ? "#fff" : "#000"} />
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>

                <View className="mb-6">
                  <Text className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                    Assistant Settings
                  </Text>
                  <View>
                    <Text className={`text-base mb-1 ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>
                      Custom System Prompt
                    </Text>
                    <View className={`rounded-lg overflow-hidden ${isDarkMode ? 'bg-zinc-700' : 'bg-zinc-100'}`}>
                      <TextInput
                        value={formState.customPrompt}
                        onChangeText={(value) => handleInputChange('customPrompt', value)}
                        placeholder="Optional: Define assistant's behavior"
                        placeholderTextColor={isDarkMode ? '#666' : '#999'}
                        multiline
                        numberOfLines={4}
                        className={`px-4 py-3 text-base ${isDarkMode ? 'text-white' : 'text-black'}`}
                        style={{ textAlignVertical: 'top' }}
                      />
                    </View>
                    <Text className={`text-sm mt-1 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                      This prompt guides the assistant's responses. Leave empty for default behavior.
                    </Text>
                  </View>
                </View>

                {uiState.showPasswordInput && (
                  <View className="mb-6">
                    <Text className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                      Confirm Changes
                    </Text>
                    <View className={`flex-row items-center rounded-lg overflow-hidden ${isDarkMode ? 'bg-zinc-700' : 'bg-zinc-100'}`}>
                      <TextInput
                        value={formState.password}
                        onChangeText={(value) => handleInputChange('password', value)}
                        placeholder="Enter your password"
                        placeholderTextColor={isDarkMode ? '#666' : '#999'}
                        secureTextEntry={!uiState.showPassword}
                        className={`flex-1 px-4 py-3 text-base ${isDarkMode ? 'text-white' : 'text-black'}`}
                      />
                      <TouchableOpacity
                        onPress={() => toggleVisibility('showPassword')}
                        className="px-4"
                      >
                        {uiState.showPassword ? (
                          <EyeOff size={20} color={isDarkMode ? "#fff" : "#000"} />
                        ) : (
                          <Eye size={20} color={isDarkMode ? "#fff" : "#000"} />
                        )}
                      </TouchableOpacity>
                    </View>
                    {uiState.saveError && (
                      <Text className="text-red-500 mt-2">{uiState.saveError}</Text>
                    )}
                  </View>
                )}

                <TouchableOpacity
                  onPress={handleSaveSettings}
                  disabled={uiState.isSaving}
                  className={`flex-row items-center justify-center py-3 px-4 rounded-lg ${isDarkMode ? 'bg-blue-600' : 'bg-blue-500'} ${uiState.isSaving ? 'opacity-50' : ''}`}
                >
                  <Save size={20} color="#fff" />
                  <Text className="text-white font-semibold ml-2">
                    {uiState.isSaving ? 'Saving...' : 'Save Changes'}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            <View className="mt-6">
              <Text className={`text-lg font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                About ChatLLM
              </Text>
              <Text className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                Version 1.0.0
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}