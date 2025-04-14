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
import { SafeAreaView, TextInput, StyleSheet, ScrollView, StyleProp, TextStyle, ViewStyle } from "react-native";
import { Eye, EyeOff, Save } from 'lucide-react-native';
import { 
  TamaguiProvider,
  Sheet,
  YStack,
  XStack,
  Text,
  Button,
  Switch,
  View,
  styled
} from 'tamagui';
import { config } from "../utils/config/tamagui.config";
import { TitleBar } from '../components/TitleBar';
import type { GetProps } from '@tamagui/core';

// Styled components for consistent theme usage
const Container = styled(YStack, {
  f: 1,
  space: "$5",
  name: "Container",
  p: "$4",
})

const Card = styled(YStack, {
  space: "$4",
  br: "$6",
  p: "$5",
  name: "Card",
  animation: 'bouncy',
  pressStyle: {
    scale: 0.98,
  },
  variants: {
    type: {
      settings: {
        bg: '$backgroundStrong',
        borderWidth: 1,
        borderColor: '$borderColor',
        shadowColor: '$shadowColor',
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 5,
      }
    }
  }
})

const StyledTitle = styled(Text, {
  fontSize: "$6",
  fontWeight: "bold",
  color: '$color',
})

type TitleProps = GetProps<typeof StyledTitle> & {
  type?: 'section' | 'card'
}

function Title({ type, ...props }: TitleProps) {
  return (
    <StyledTitle
      {...props}
      fontSize={type === 'section' ? '$8' : type === 'card' ? '$5' : '$6'}
      color={type === 'section' ? '$blue10' : '$color'}
      mb={type === 'section' ? '$2' : type === 'card' ? '$1' : 0}
    />
  )
}

const Subtitle = styled(Text, {
  fontSize: "$3",
  color: '$gray11',
  name: "Subtitle",
  lineHeight: 20
})

const Divider = styled(XStack, {
  height: 1,
  bg: '$borderColor',
  my: '$5',
  opacity: 0.3,
})

const InputWrapper = styled(View, {
  f: 1,
  br: "$4",
  p: "$2",
  borderWidth: 2,
  borderColor: '$gray7',
  bg: '$gray3',
  focusStyle: {
    borderColor: '$blue8',
    bg: '$gray2',
    shadowColor: '$blue8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  pressStyle: {
    borderColor: '$blue8',
    bg: '$gray2',
  },
  animation: 'quick',
})

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

const MemoizedInputWrapper = memo(InputWrapper);

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

const SettingsInput = memo(({ 
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
  
  return (
    <TextInput
      style={[style, { 
        color: textColor,
        fontSize: 16,
        height: multiline ? undefined : 48
      }]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={isDarkMode ? '#666' : '#999'}
      secureTextEntry={secureTextEntry}
      multiline={multiline}
      numberOfLines={numberOfLines}
      autoCapitalize="none"
      accessibilityLabel={accessibilityLabel}
    />
  );
});

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
    <Sheet 
      modal
      open={true}
      onOpenChange={setShowSettings}
      snapPoints={[90]}
      dismissOnSnapToBottom
      animation="quick"
    >
      <Sheet.Overlay 
        animation="quick"
        enterStyle={{ opacity: 0 }}
        exitStyle={{ opacity: 0 }}
        opacity={0.7}
      />
      <Sheet.Frame
        f={1}
        space="$5"
        br="$4"
        animation="quick"
        enterStyle={{ opacity: 0, scale: 0.95 }}
        exitStyle={{ opacity: 0, scale: 0.95 }}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <Container>
            <XStack jc="space-between" ai="center" p="$4" borderBottomWidth={1} borderColor="$borderColor">
              <Title type="section">Settings</Title>
              <Button
                size="$4"
                circular
                chromeless
                icon={<Text fontSize={24}>×</Text>}
                onPress={() => setShowSettings(false)}
              />
            </XStack>

            <Card type="settings">
              <XStack jc="space-between" ai="center">
                <YStack f={1} pr="$4">
                  <Title type="card">Dark Mode</Title>
                  <Subtitle>Toggle between light and dark theme</Subtitle>
                </YStack>
                <Switch
                  size="$4"
                  checked={isDarkMode}
                  onCheckedChange={setIsDarkMode}
                />
              </XStack>
            </Card>

            {isAuthenticated && (
              <>
                <Title type="section">API Keys</Title>
                <Card type="settings">
                  <YStack space="$4">
                    <YStack space="$3">
                      <Title type="card">Gemini API Key</Title>
                      <XStack space="$2" ai="center">
                        <MemoizedInputWrapper>
                          <SettingsInput
                            value={formState.geminiKey}
                            onChangeText={(value) => handleInputChange('geminiKey', value)}
                            placeholder="Enter Gemini API Key"
                            secureTextEntry={!uiState.showGeminiKey}
                            isDarkMode={isDarkMode}
                            style={styles.input}
                            accessibilityLabel="Gemini API Key input"
                          />
                        </MemoizedInputWrapper>
                        <Button
                          size="$4"
                          circular
                          chromeless
                          icon={uiState.showGeminiKey ? <EyeOff size={22} /> : <Eye size={22} />}
                          onPress={() => toggleVisibility('showGeminiKey')}
                        />
                      </XStack>
                    </YStack>

                    <YStack space="$3">
                      <Title type="card">Groq API Key</Title>
                      <XStack space="$2" ai="center">
                        <MemoizedInputWrapper>
                          <SettingsInput
                            value={formState.groqKey}
                            onChangeText={(value) => handleInputChange('groqKey', value)}
                            placeholder="Enter Groq API Key"
                            secureTextEntry={!uiState.showGroqKey}
                            isDarkMode={isDarkMode}
                            style={styles.input}
                            accessibilityLabel="Groq API Key input"
                          />
                        </MemoizedInputWrapper>
                        <Button
                          size="$4"
                          circular
                          chromeless
                          icon={uiState.showGroqKey ? <EyeOff size={22} /> : <Eye size={22} />}
                          onPress={() => toggleVisibility('showGroqKey')}
                        />
                      </XStack>
                    </YStack>
                  </YStack>
                </Card>

                <Divider />

                <Title type="section">Assistant Settings</Title>
                <Card type="settings">
                  <YStack space="$3">
                    <Title type="card">Custom System Prompt</Title>
                    <MemoizedInputWrapper>
                      <SettingsInput
                        value={formState.customPrompt}
                        onChangeText={(value) => handleInputChange('customPrompt', value)}
                        placeholder="Optional: Define assistant's behavior"
                        multiline={true}
                        numberOfLines={4}
                        isDarkMode={isDarkMode}
                        style={styles.multilineInput}
                        accessibilityLabel="Custom system prompt input"
                      />
                    </MemoizedInputWrapper>
                    <Subtitle>
                      This prompt guides the assistant's responses. Leave empty for default behavior.
                    </Subtitle>
                  </YStack>
                </Card>

                <Divider />

                {uiState.showPasswordInput && (
                  <Card type="settings">
                    <YStack space="$3">
                      <Title type="card">Enter password to save changes</Title>
                      <XStack space="$2" ai="center">
                        <MemoizedInputWrapper>
                          <SettingsInput
                            value={formState.password}
                            onChangeText={(value) => handleInputChange('password', value)}
                            placeholder="Password"
                            secureTextEntry={!uiState.showPassword}
                            isDarkMode={isDarkMode}
                            style={styles.input}
                            accessibilityLabel="Password input for saving settings"
                          />
                        </MemoizedInputWrapper>
                        <Button
                          size="$4"
                          circular
                          chromeless
                          icon={uiState.showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                          onPress={() => toggleVisibility('showPassword')}
                        />
                      </XStack>
                      {uiState.saveError && (
                        <Text col="$red10" fontSize="$3">{uiState.saveError}</Text>
                      )}
                    </YStack>
                  </Card>
                )}

                <Button
                  size="$5"
                  themeInverse
                  icon={<Save size={20} />}
                  onPress={handleSaveSettings}
                  disabled={uiState.isSaving}
                  o={uiState.isSaving ? 0.5 : 1}
                  mx="$4"
                  mb="$4"
                  br="$4"
                >
                  {uiState.isSaving ? 'Saving...' : 'Save Settings'}
                </Button>
              </>
            )}

            <Divider />

            <Card type="settings">
              <YStack space="$2">
                <Title type="card">About ChatLLM</Title>
                <Subtitle>Version 1.0.0</Subtitle>
              </YStack>
            </Card>
          </Container>
        </ScrollView>
      </Sheet.Frame>
    </Sheet>
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
    <TamaguiProvider config={config} defaultTheme={isDarkMode ? 'dark' : 'light'}>
      <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme: () => setIsDarkMode(!isDarkMode), tamaguiConfig: config }}>
        <DataProvider>
          <AuthProvider>
            <View f={1}>
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
    </TamaguiProvider>
  );
}
