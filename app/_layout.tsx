import { Stack } from "expo-router";
import { useState, useMemo, useEffect } from "react";
import { ThemeContext, createTheme } from '../context/themeContext';
import { DataProvider, useData } from '../context/dataContext';
import { useAuth, AuthProvider } from '../hooks/useAuth';
import { useTheme } from '../context/themeContext';
import { geminiService } from '../services/geminiService';
import "./globals.css";
import { useFonts } from "expo-font";
import { Inter_400Regular } from "@expo-google-fonts/inter";
import * as SplashScreen from "expo-splash-screen";
import { HeaderRight } from "../components/HeaderRight";
import { IndexHeaderRight } from "@/components/HeaderLogin";
import { globalEventEmitter } from "./ui/chat";
import { SafeAreaView, TextInput, StyleSheet } from "react-native";
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

// Styled components for consistent theme usage
const Container = styled(YStack, {
  f: 1,
  space: "$4",
  name: "Container"
})

const Card = styled(YStack, {
  space: "$4",
  br: "$4",
  p: "$4",
  name: "Card",
  variants: {
    type: {
      settings: {
        bg: '$backgroundSecondary',
      }
    }
  }
})

const Title = styled(Text, {
  fontSize: "$6",
  fontWeight: "bold",
  name: "Title"
})

const Subtitle = styled(Text, {
  fontSize: "$4",
  color: '$textSecondary',
  name: "Subtitle"
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
  const { theme } = useTheme();
  const [geminiKey, setGeminiKey] = useState(data?.apiKeys?.gemini || '');
  const [groqKey, setGroqKey] = useState(data?.apiKeys?.groq || '');
  const [customPrompt, setCustomPrompt] = useState(data?.settings?.customPrompt || '');
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showGroqKey, setShowGroqKey] = useState(false);
  const [password, setPassword] = useState('');
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Dynamic text colors based on theme
  const textColor = isDarkMode ? '#fff' : '#000';
  const placeholderColor = isDarkMode ? '#888' : '#aaa';
  const inputBgColor = isDarkMode ? '#262626' : '#f5f5f5';

  const handleSaveSettings = async () => {
    if (!isAuthenticated || isSaving) return;

    setIsSaving(true);
    setSaveError(null);

    const newData = {
      ...data,
      apiKeys: {
        gemini: geminiKey.trim(),
        groq: groqKey.trim()
      },
      settings: {
        ...data?.settings,
        customPrompt: customPrompt.trim() || undefined
      },
      chatThreads: data?.chatThreads || []
    };

    try {
      if (!password) {
        setShowPasswordInput(true);
        setIsSaving(false);
        return;
      }
      await saveData(newData, password);
      geminiService.setCustomPrompt(customPrompt.trim() || undefined);
      setShowPasswordInput(false);
      setPassword('');
      setShowSettings(false);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to save settings.');
      setShowPasswordInput(true);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Sheet 
      modal
      open={true}
      onOpenChange={setShowSettings}
      snapPoints={[85]}
      dismissOnSnapToBottom
    >
      <Sheet.Overlay 
        animation="lazy"
        enterStyle={{ o: 0 }}
        exitStyle={{ o: 0 }}
        o={0.5}
      />
      <Sheet.Frame
        f={1}
        p="$4"
        space="$4"
        br="$4"
      >
        <Container>
          <XStack jc="space-between" ai="center">
            <Title>Settings</Title>
            <Button
              size="$3"
              circular
              chromeless
              icon={<Text>×</Text>}
              onPress={() => setShowSettings(false)}
            />
          </XStack>

          <Card type="settings">
            <XStack jc="space-between" ai="center">
              <YStack>
                <Title>Dark Mode</Title>
                <Subtitle>Toggle between light and dark theme</Subtitle>
              </YStack>
              <Switch
                checked={isDarkMode}
                onCheckedChange={setIsDarkMode}
              />
            </XStack>
          </Card>

          {isAuthenticated && (
            <>
              <Title theme="blue">API Keys</Title>
              <Card type="settings">
                <YStack space="$3">
                  <Title>Gemini API Key</Title>
                  <XStack space="$2" ai="center">
                    <View
                      f={1}
                      backgroundColor={inputBgColor}
                      borderRadius="$4"
                      padding="$2"
                    >
                      <TextInput
                        style={[styles.input, { color: textColor }]}
                        value={geminiKey}
                        onChangeText={setGeminiKey}
                        placeholder="Enter Gemini Key"
                        placeholderTextColor={placeholderColor}
                        secureTextEntry={!showGeminiKey}
                        autoCapitalize="none"
                      />
                    </View>
                    <Button
                      size="$3"
                      circular
                      chromeless
                      icon={showGeminiKey ? <EyeOff size={20} /> : <Eye size={20} />}
                      onPress={() => setShowGeminiKey(!showGeminiKey)}
                    />
                  </XStack>
                </YStack>

                <YStack space="$3">
                  <Title>Groq API Key</Title>
                  <XStack space="$2" ai="center">
                    <View
                      f={1}
                      backgroundColor={inputBgColor}
                      borderRadius="$4"
                      padding="$2"
                    >
                      <TextInput
                        style={[styles.input, { color: textColor }]}
                        value={groqKey}
                        onChangeText={setGroqKey}
                        placeholder="Enter Groq Key"
                        placeholderTextColor={placeholderColor}
                        secureTextEntry={!showGroqKey}
                        autoCapitalize="none"
                      />
                    </View>
                    <Button
                      size="$3"
                      circular
                      chromeless
                      icon={showGroqKey ? <EyeOff size={20} /> : <Eye size={20} />}
                      onPress={() => setShowGroqKey(!showGroqKey)}
                    />
                  </XStack>
                </YStack>
              </Card>

              <Title theme="blue">Assistant Settings</Title>
              <Card type="settings">
                <YStack space="$3">
                  <Title>Custom System Prompt</Title>
                  <View
                    backgroundColor={inputBgColor}
                    borderRadius="$4"
                    padding="$2"
                  >
                    <TextInput
                      style={[styles.multilineInput, { color: textColor }]}
                      value={customPrompt}
                      onChangeText={setCustomPrompt}
                      placeholder="Optional: Define assistant's behavior"
                      placeholderTextColor={placeholderColor}
                      multiline={true}
                      numberOfLines={4}
                    />
                  </View>
                  <Subtitle>
                    This prompt guides the assistant's responses. Leave empty for default behavior.
                  </Subtitle>
                </YStack>
              </Card>

              {showPasswordInput && (
                <Card type="settings">
                  <YStack space="$3">
                    <Title>Enter password to save changes</Title>
                    <XStack space="$2" ai="center">
                      <View
                        f={1}
                        backgroundColor={inputBgColor}
                        borderRadius="$4"
                        padding="$2"
                      >
                        <TextInput
                          style={[styles.input, { color: textColor }]}
                          value={password}
                          onChangeText={setPassword}
                          placeholder="Password"
                          placeholderTextColor={placeholderColor}
                          secureTextEntry={!showPassword}
                        />
                      </View>
                      <Button
                        size="$3"
                        circular
                        chromeless
                        icon={showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        onPress={() => setShowPassword(!showPassword)}
                      />
                    </XStack>
                    {saveError && (
                      <Text col="$red10">{saveError}</Text>
                    )}
                  </YStack>
                </Card>
              )}

              <Button
                size="$4"
                themeInverse
                icon={<Save size={18} />}
                onPress={handleSaveSettings}
                disabled={isSaving}
                o={isSaving ? 0.5 : 1}
              >
                {isSaving ? 'Saving...' : 'Save Settings'}
              </Button>
            </>
          )}

          <Card type="settings">
            <YStack space="$2">
              <Title>About ChatLLM</Title>
              <Subtitle>Version 1.0.0</Subtitle>
            </YStack>
          </Card>
        </Container>
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
      <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme: () => setIsDarkMode(!isDarkMode) }}>
        <DataProvider>
          <AuthProvider>
            <View f={1}>
              <SafeAreaView style={{ flex: 1 }}>
                <Stack
                  screenOptions={{
                    headerStyle: {
                      backgroundColor: theme.colors.background
                    },
                    headerTintColor: theme.colors.text,
                    headerTitleStyle: { 
                      fontFamily: 'Inter_400Regular' 
                    },
                    headerShadowVisible: false,
                  }}
                >
                  <Stack.Screen
                    name="index"
                    options={{
                      title: "ChatLLM",
                      headerRight: () => (
                        <IndexHeaderRight
                          isDarkMode={isDarkMode}
                          setIsDarkMode={setIsDarkMode}
                          theme={theme}
                        />
                      ),
                      headerShown: true,
                      headerBackVisible: false,
                      headerLeft: () => null,
                      gestureEnabled: false,
                      animation: "none",
                      headerBackButtonMenuEnabled: false,
                    }}
                  />
                  <Stack.Screen
                    name="ui/chat"
                    options={{
                      title: "ChatLLM",
                      headerRight: () => (
                        <HeaderRight
                          isDarkMode={isDarkMode}
                          setIsDarkMode={setIsDarkMode}
                          setShowSettings={setShowSettings}
                          theme={theme}
                        />
                      ),
                      headerShown: true,
                      headerBackVisible: false,
                      headerLeft: () => null,
                      gestureEnabled: false,
                      animation: "none",
                      headerBackButtonMenuEnabled: false,
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
