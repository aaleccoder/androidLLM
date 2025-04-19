import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Modal, SafeAreaView } from 'react-native';
import { useData } from '../context/dataContext';
import { useAuth } from '../hooks/useAuth';
import { X, Save, Eye, EyeOff, Pencil, Check, X as LucideX } from 'lucide-react-native';
import { geminiService } from '../services/geminiService';
import * as Haptics from 'expo-haptics';

// Utility to mask API key except last 4 chars
function maskKey(key: string): string {
  if (!key) return '';
  if (key.length <= 4) return key;
  return '•'.repeat(key.length - 4) + key.slice(-4);
}

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
  const { data, saveData } = useData();
  const { isAuthenticated, validateAndSavePassword } = useAuth();

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

  const [editKeyModal, setEditKeyModal] = useState<null | 'gemini' | 'openrouter'>(null);
  const [editKeyValue, setEditKeyValue] = useState<string>('');
  const [editKeyMasked, setEditKeyMasked] = useState<boolean>(true);

  // Always sync formState with context data when modal opens or data changes
  useEffect(() => {
    if (isVisible) {
      setFormState({
        geminiKey: data?.apiKeys?.gemini || '',
        openRouterKey: data?.apiKeys?.openRouter || '',
        customPrompt: data?.settings?.customPrompt || '',
        password: '',
      });
    }
  }, [isVisible, data]);

  const handleInputChange = useCallback((field: keyof FormState, value: string) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleShowApiKey = (keyType: 'gemini' | 'openrouter') => {
    if (
      (keyType === 'gemini' && !uiState.showGeminiKey) ||
      (keyType === 'openrouter' && !uiState.showGroqKey)
    ) {
      setUiState(prev => ({
        ...prev,
        showGeminiKey: keyType === 'gemini' ? true : prev.showGeminiKey,
        showGroqKey: keyType === 'openrouter' ? true : prev.showGroqKey,
      }));
    } else {
      setUiState(prev => ({
        ...prev,
        showGeminiKey: keyType === 'gemini' ? false : prev.showGeminiKey,
        showGroqKey: keyType === 'openrouter' ? false : prev.showGroqKey,
      }));
    }
  };

  const openEditKeyModal = (key: 'gemini' | 'openrouter') => {
    setEditKeyModal(key);
    setEditKeyValue(formState[key === 'gemini' ? 'geminiKey' : 'openRouterKey']);
    setEditKeyMasked(true);
  };

  const handleSaveEditKey = () => {
    if (editKeyModal === 'gemini') {
      setFormState(prev => ({ ...prev, geminiKey: editKeyValue }));
    } else if (editKeyModal === 'openrouter') {
      setFormState(prev => ({ ...prev, openRouterKey: editKeyValue }));
    }
    setEditKeyModal(null);
    setEditKeyValue('');
    setEditKeyMasked(true);
  };

  const handleCancelEditKey = () => {
    setEditKeyModal(null);
    setEditKeyValue('');
    setEditKeyMasked(true);
  };

  const handleSaveSettings = useCallback(async () => {
    if (!isAuthenticated || uiState.isSaving) return;

    setUiState(prev => ({ ...prev, isSaving: true, saveError: null }));

    const newData = {
      ...data,
      apiKeys: {
        gemini: formState.geminiKey.trim(),
        openRouter: formState.openRouterKey.trim(),
      },
      settings: {
        ...data?.settings,
        customPrompt: formState.customPrompt.trim() || undefined,
      },
      chatThreads: data?.chatThreads || [],
    };

    try {
      if (!formState.password) {
        setUiState(prev => ({
          ...prev,
          showPasswordInput: true,
          isSaving: false,
        }));
        return;
      }

      await saveData(newData, formState.password);
      geminiService.setCustomPrompt(formState.customPrompt.trim() || undefined);
      setUiState(prev => ({
        ...prev,
        showPasswordInput: false,
        isSaving: false,
      }));
      setFormState(prev => ({ ...prev, password: '' }));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // After save, force formState to sync with latest context data
      setFormState({
        geminiKey: newData.apiKeys.gemini,
        openRouterKey: newData.apiKeys.openRouter,
        customPrompt: newData.settings?.customPrompt || '',
        password: '',
      });
      onClose();
    } catch (error) {
      console.error('Error saving settings:', error);
      setUiState(prev => ({
        ...prev,
        saveError: error instanceof Error ? error.message : 'Failed to save settings.',
        showPasswordInput: true,
        isSaving: false,
      }));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [isAuthenticated, data, formState, onClose]);

  useEffect(() => {
    setFormState(prev => ({
      ...prev,
      geminiKey: data?.apiKeys?.gemini || '',
      openRouterKey: data?.apiKeys?.openRouter || '',
      customPrompt: data?.settings?.customPrompt || '',
    }));
  }, [data]);

  if (!isVisible) return null;

  return (
    <Modal
      visible={true}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
      className='font-sans'
    >
      <SafeAreaView style={{ flex: 1, justifyContent: 'center' }}>
        <View className="flex-1 justify-end bg-black/50 font-sans">
          <View className="rounded-t-2xl bg-background w-full max-h-[90%] pb-2" style={{ alignSelf: 'center' }}>
            <View className="px-4 py-3 border-b border-primary flex-row justify-between items-center">
              <Text className="text-xl font-bold text-text font-sans">Settings</Text>
              <TouchableOpacity
                onPress={onClose}
                className="p-2 rounded-full bg-accent"
                accessibilityLabel="Close settings"
              >
                <X size={24} color="#181818" />
              </TouchableOpacity>
            </View>

            <ScrollView className="px-4 py-4">
              {isAuthenticated && (
                <>
                  <View className="mb-6">
                    <Text className="text-lg font-semibold mb-2 text-text font-sans">API Keys</Text>
                    <View className="space-y-4">
                      <View>
                        <Text className="text-base mb-1 text-text/80 font-sans">Gemini API Key</Text>
                        <View className="flex-row items-center rounded-lg overflow-hidden bg-accent">
                          <TextInput
                            value={uiState.showGeminiKey ? formState.geminiKey : maskKey(formState.geminiKey)}
                            editable={false}
                            placeholder="Enter Gemini API Key"
                            placeholderTextColor="#181818"
                            secureTextEntry={false}
                            className="flex-1 px-4 py-3 text-base text-text font-sans"
                          />
                          <TouchableOpacity
                            onPress={() => handleShowApiKey('gemini')}
                            className="px-2"
                            accessibilityLabel="Show/hide Gemini API key"
                          >
                            {uiState.showGeminiKey ? (
                              <EyeOff size={24} color="#181818" />
                            ) : (
                              <Eye size={24} color="#181818" />
                            )}
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => openEditKeyModal('gemini')} className="px-2" accessibilityLabel="Edit Gemini API key">
                            <Pencil size={24} color="#181818" />
                          </TouchableOpacity>
                        </View>
                      </View>
                      <View>
                        <Text className="text-base mb-1 text-text/80 font-sans">OpenRouter API Key</Text>
                        <View className="flex-row items-center rounded-lg overflow-hidden bg-accent">
                          <TextInput
                            value={uiState.showGroqKey ? formState.openRouterKey : maskKey(formState.openRouterKey)}
                            editable={false}
                            placeholder="Enter OpenRouter API Key"
                            placeholderTextColor="#181818"
                            secureTextEntry={false}
                            className="flex-1 px-4 py-3 text-base text-text font-sans"
                          />
                          <TouchableOpacity
                            onPress={() => handleShowApiKey('openrouter')}
                            className="px-2"
                            accessibilityLabel="Show/hide OpenRouter API key"
                          >
                            {uiState.showGroqKey ? (
                              <EyeOff size={24} color="#181818" />
                            ) : (
                              <Eye size={24} color="#181818" />
                            )}
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => openEditKeyModal('openrouter')} className="px-2" accessibilityLabel="Edit OpenRouter API key">
                            <Pencil size={24} color="#181818" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </View>

                  <Modal
                    visible={!!editKeyModal}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={handleCancelEditKey}
                  >
                    <View className="flex-1 justify-center items-center bg-black/50">
                      <View className="w-[90%] rounded-2xl p-5 bg-background">
                        <Text className="text-lg font-bold mb-3 text-text font-sans">Edit {editKeyModal === 'gemini' ? 'Gemini' : 'OpenRouter'} API Key</Text>
                        <View className="flex-row items-center rounded-lg overflow-hidden mb-4 bg-accent">
                          <TextInput
                            value={editKeyMasked ? maskKey(editKeyValue) : editKeyValue}
                            onChangeText={setEditKeyValue}
                            placeholder={`Enter ${editKeyModal === 'gemini' ? 'Gemini' : 'OpenRouter'} API Key`}
                            placeholderTextColor="#181818"
                            secureTextEntry={false}
                            className="flex-1 px-4 py-3 text-base text-text font-sans"
                            editable={true}
                            autoFocus
                          />
                          <TouchableOpacity onPress={() => setEditKeyMasked(m => !m)} className="px-2" accessibilityLabel="Show/hide API key">
                            {editKeyMasked ? (
                              <Eye size={18} color="#181818" />
                            ) : (
                              <EyeOff size={18} color="#181818" />
                            )}
                          </TouchableOpacity>
                        </View>
                        <View className="flex-row justify-end mt-2">
                          <TouchableOpacity onPress={handleCancelEditKey} className="px-4 py-2 rounded-lg bg-accent mr-4">
                            <LucideX size={24} color="#fff" />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={handleSaveEditKey} className="px-4 py-2 rounded-lg bg-green-500">
                            <Check size={24} color="#fff" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </Modal>

                  <View className="mb-6">
                    <Text className="text-lg font-semibold mb-2 text-text font-sans">Assistant Settings</Text>
                    <View>
                      <Text className="text-base mb-1 text-text/80 font-sans">Custom System Prompt</Text>
                      <View className="rounded-lg overflow-hidden bg-accent">
                        <TextInput
                          value={formState.customPrompt}
                          onChangeText={(value) => handleInputChange('customPrompt', value)}
                          placeholder="Optional: Define assistant's behavior"
                          placeholderTextColor="#181818"
                          multiline
                          numberOfLines={4}
                          className="px-4 py-3 text-base text-text font-sans"
                          style={{ textAlignVertical: 'top' }}
                        />
                      </View>
                      <Text className="text-sm mt-1 text-text/60 font-sans">
                        This prompt guides the assistant's responses. Leave empty for default behavior.
                      </Text>
                    </View>
                  </View>

                  {uiState.showPasswordInput && (
                    <View className="mb-6">
                      <Text className="text-lg font-semibold mb-2 text-text font-sans">Confirm Changes</Text>
                      <View className="flex-row items-center rounded-lg overflow-hidden bg-accent">
                        <TextInput
                          value={formState.password}
                          onChangeText={(value) => handleInputChange('password', value)}
                          placeholder="Enter your password"
                          placeholderTextColor="#181818"
                          secureTextEntry={!uiState.showPassword}
                          className="flex-1 px-4 py-3 text-base text-text font-sans"
                        />
                        <TouchableOpacity
                          onPress={() => setUiState(prev => ({ ...prev, showPassword: !prev.showPassword }))}
                          className="px-4"
                          accessibilityLabel="Show/hide password"
                        >
                          <Text className="text-xs text-primary font-sans">
                            {uiState.showPassword ? 'Hide' : 'Show'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                      {uiState.saveError && (
                        <Text className="text-red-500 mt-2 font-sans">{uiState.saveError}</Text>
                      )}
                    </View>
                  )}

                  <TouchableOpacity
                    onPress={handleSaveSettings}
                    disabled={uiState.isSaving}
                    className={`flex-row items-center justify-center py-3 px-4 rounded-lg bg-accent ${uiState.isSaving ? 'opacity-50' : ''}`}
                    accessibilityLabel="Save settings"
                  >
                    <Save size={20} color="#181818" />
                    <Text className="text-primary font-semibold ml-2 font-sans">
                      {uiState.isSaving ? 'Saving...' : 'Save Changes'}
                    </Text>
                  </TouchableOpacity>
                </>
              )}

              <View className="mt-6">
                <Text className="text-lg font-semibold mb-1 text-text font-sans">About ChatLLM</Text>
                <Text className="text-sm text-text/60 font-sans">Version 1.0.0</Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}