import { Stack } from "expo-router";
import { useState, useMemo, useEffect, useCallback, memo } from "react";
import { ThemeContext, createTheme } from '../context/themeContext';
import { DataProvider, useData } from '../context/dataContext';
import { useAuth, AuthProvider } from '../hooks/useAuth';
import { useTheme } from '../context/themeContext';
import { geminiService } from '../services/geminiService';
import "./globals.css";
import { useFonts } from "expo-font";
import { Inter_400Regular } from "@expo-google-fonts/inter";
import * as SplashScreen from "expo-splash-screen";
import { globalEventEmitter } from "./ui/chat";
import { SafeAreaView, TextInput, StyleSheet, ScrollView, StyleProp, TextStyle, View, Modal } from "react-native";
import { Eye, EyeOff, Save } from 'lucide-react-native';
import { Text as PaperText, Button as PaperButton, Switch as PaperSwitch } from 'react-native-paper';
import { TitleBar } from '../components/TitleBar';

// Create styles for TextInput
const styles = StyleSheet.create({
  input: {
    flex: 1,
    height: 40,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  multilineInput: {
    height: 100,
    paddingHorizontal: 8,
    paddingTop: 8,
    textAlignVertical: 'top',
    borderRadius: 4,
  }
});

interface SettingsInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  isDarkMode: boolean;
  style?: StyleProp<TextStyle>;
  accessibilityLabel: string;
}

const SettingsInput = ({ 
  value, 
  onChangeText, 
  placeholder, 
  secureTextEntry, 
  multiline,
  numberOfLines,
  isDarkMode,
  style,
  accessibilityLabel 
}: SettingsInputProps) => {
  const textColor = isDarkMode ? '#fff' : '#000';
  const placeholderColor = isDarkMode ? '#666' : '#999';
  
  return (
    <TextInput
      style={[style, { 
        color: textColor,
        fontSize: 16,
        height: multiline ? undefined : 48, 
        textAlignVertical: multiline ? 'top' : 'center', 
      }]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={placeholderColor}
      secureTextEntry={secureTextEntry}
      multiline={multiline}
      numberOfLines={numberOfLines}
      autoCapitalize="none"
      accessibilityLabel={accessibilityLabel}
    />
  );
};

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
  groqKey: string;
  customPrompt: string;
  password: string;
}

function SettingsContent({
  isDarkMode,
  setIsDarkMode,
  setShowSettings
}: {
  isDarkMode: boolean,
  setIsDarkMode: (value: boolean) => void,
  setShowSettings: (value: boolean) => void
}) {
  const { data, saveData } = useData();
  const { isAuthenticated } = useAuth();
  const [formState, setFormState] = useState<FormState>({
    geminiKey: data?.apiKeys?.gemini || '',
    groqKey: data?.apiKeys?.groq || '',
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
        groq: formState.groqKey.trim()
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
      setShowSettings(false);
    } catch (error) {
      console.error('Error saving settings:', error);
      setUiState(prev => ({ 
        ...prev,
        saveError: error instanceof Error ? error.message : 'Failed to save settings.',
        showPasswordInput: true,
        isSaving: false
      }));
    }
  }, [isAuthenticated, data, formState, setShowSettings]);

  return (
    <Modal
      visible={true}
      onDismiss={() => setShowSettings(false)}
      animationType="slide"
      transparent={true}
    >
      <View className="flex-1 justify-end bg-zinc-800/50">
        <View className="bg-zinc-50 dark:bg-zinc-800 rounded-t-2xl p-4">
          <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
            <View>
              <View className="flex-row justify-between items-center border-b border-zinc-500 pb-4">
                <PaperText className="text-2xl font-bold text-zinc-700 dark:text-zinc-100">Settings</PaperText>
                <PaperButton onPress={() => setShowSettings(false)}>
                  <></>
                </PaperButton>
              </View>

              <View className="flex-row justify-between items-center py-4">
                <View>
                  <PaperText className="text-base text-zinc-700 dark:text-zinc-100">Dark Mode</PaperText>
                  <PaperText className="text-sm text-zinc-500 dark:text-zinc-400">Toggle between light and dark theme</PaperText>
                </View>
                <PaperSwitch
                  value={isDarkMode}
                  onValueChange={setIsDarkMode}
                />
              </View>

              {isAuthenticated && (
                <>
                  <PaperText className="text-xl font-semibold text-zinc-700 dark:text-zinc-100 py-2">API Keys</PaperText>
                  <View>
                    <View className="mb-4">
                      <PaperText className="text-lg text-zinc-700 dark:text-zinc-100">Gemini API Key</PaperText>
                      <View className="flex-row items-center">
                        <SettingsInput
                          value={formState.geminiKey}
                          onChangeText={(value: string) => handleInputChange('geminiKey', value)}
                          placeholder="Enter Gemini API Key"
                          secureTextEntry={!uiState.showGeminiKey}
                          isDarkMode={isDarkMode}
                          style={styles.input}
                          accessibilityLabel="Gemini API Key input"
                        />
                        <PaperButton icon={uiState.showGeminiKey ? "eye-off" : "eye"} onPress={() => toggleVisibility('showGeminiKey')}>
                          <></>
                        </PaperButton>
                      </View>
                    </View>

                    <View className="mb-4">
                      <PaperText className="text-lg text-zinc-700 dark:text-zinc-100">Groq API Key</PaperText>
                      <View className="flex-row items-center">
                        <SettingsInput
                          value={formState.groqKey}
                          onChangeText={(value: string) => handleInputChange('groqKey', value)}
                          placeholder="Enter Groq API Key"
                          secureTextEntry={!uiState.showGroqKey}
                          isDarkMode={isDarkMode}
                          style={styles.input}
                          accessibilityLabel="Groq API Key input"
                        />
                        <PaperButton icon={uiState.showGroqKey ? "eye-off" : "eye"} onPress={() => toggleVisibility('showGroqKey')}>
                          <></>
                        </PaperButton>
                      </View>
                    </View>
                  </View>

                  <View className="py-2">
                    <PaperText className="text-xl font-semibold text-zinc-700 dark:text-zinc-100">Assistant Settings</PaperText>
                    <View>
                      <PaperText className="text-lg text-zinc-700 dark:text-zinc-100">Custom System Prompt</PaperText>
                      <SettingsInput
                        value={formState.customPrompt}
                        onChangeText={(value: string) => handleInputChange('customPrompt', value)}
                        placeholder="Optional: Define assistant's behavior"
                        multiline={true}
                        numberOfLines={4}
                        isDarkMode={isDarkMode}
                        style={styles.multilineInput}
                        accessibilityLabel="Custom system prompt input"
                      />
                      <PaperText className="text-sm text-zinc-500 dark:text-zinc-400">
                        This prompt guides the assistant's responses. Leave empty for default behavior.
                      </PaperText>
                    </View>
                  </View>

                  {uiState.showPasswordInput && (
                    <View className="py-2">
                      <PaperText className="text-lg text-zinc-700 dark:text-zinc-100">Enter password to save changes</PaperText>
                      <View className="flex-row items-center">
                        <SettingsInput
                          value={formState.password}
                          onChangeText={(value: string) => handleInputChange('password', value)}
                          placeholder="Password"
                          secureTextEntry={!uiState.showPassword}
                          isDarkMode={isDarkMode}
                          style={styles.input}
                          accessibilityLabel="Password input for saving settings"
                        />
                        <PaperButton icon={uiState.showPassword ? "eye-off" : "eye"} onPress={() => toggleVisibility('showPassword')}>
                          <></>
                        </PaperButton>
                      </View>
                      {uiState.saveError && (
                        <PaperText className="text-red-500">{uiState.saveError}</PaperText>
                      )}
                    </View>
                  )}

                  <PaperButton
                    onPress={handleSaveSettings}
                    disabled={uiState.isSaving}
                  >
                    {uiState.isSaving ? 'Saving...' : 'Save Settings'}
                  </PaperButton>
                </>
              )}

              <View className="py-2">
                <PaperText className="text-lg text-zinc-700 dark:text-zinc-100">About ChatLLM</PaperText>
                <PaperText className="text-sm text-zinc-500 dark:text-zinc-400">Version 1.0.0</PaperText>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export default function RootLayout() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  const theme = useMemo(() => createTheme(isDarkMode), [isDarkMode]);

  const [loaded, error] = useFonts({
    Inter_400Regular,
  });

  useEffect(() => {
    if (error) throw error;
    if (loaded) SplashScreen.hideAsync();
  }, [loaded, error]);

  useEffect(() => {
    const handleOpenSettings = () => setShowSettings(true);
    const subscription = globalEventEmitter.addListener('openSettings', handleOpenSettings);
    return () => {
      subscription.removeListener('openSettings', handleOpenSettings);
    };
  }, []);

  if (!loaded && !error) return null;

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme: () => setIsDarkMode(!isDarkMode) }}>
      <DataProvider>
        <AuthProvider>
          <View style={{ flex: 1 }}>
            <SafeAreaView style={{ flex: 1 }}>
              <Stack
                screenOptions={{
                  header: ({ route }: { route: { name: string } }) => {
                    const isChat = route.name === 'ui/chat';
                    return (
                      <TitleBar
                        showMenuButton={isChat}
                        isDarkMode={isDarkMode}
                        setIsDarkMode={setIsDarkMode}
                        setShowSettings={isChat ? setShowSettings : undefined}
                      />
                    );
                  },
                }}
              >
                <Stack.Screen
                  name="index"
                  options={{
                    headerShown: true,
                    headerBackVisible: false,
                    gestureEnabled: false,
                    animation: "none",
                  }}
                />
                <Stack.Screen
                  name="ui/chat"
                  options={{
                    headerShown: true,
                    headerBackVisible: false,
                    gestureEnabled: false,
                    animation: "none",
                  }}
                />
              </Stack>
              {showSettings && (
                <SettingsContent
                  isDarkMode={isDarkMode}
                  setIsDarkMode={setIsDarkMode}
                  setShowSettings={setShowSettings}
                />
              )}
            </SafeAreaView>
          </View>
        </AuthProvider>
      </DataProvider>
    </ThemeContext.Provider>
  );
}
