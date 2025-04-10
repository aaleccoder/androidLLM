import { Stack } from "expo-router";
import { useState, useMemo, useEffect } from "react";
import { Portal, Modal, Provider as PaperProvider, Text, Divider, List, Switch, TextInput, Surface, Button } from "react-native-paper";
import { View, StyleSheet, ScrollView } from "react-native";
import { ThemeContext, createTheme } from '../context/themeContext';
import { DataProvider, useData } from '../context/dataContext';
import { useAuth, AuthProvider } from '../hooks/useAuth';
import { useTheme } from '../context/themeContext';
import "./globals.css";
import { useFonts } from "expo-font";
import { Inter_400Regular } from "@expo-google-fonts/inter";
import * as SplashScreen from "expo-splash-screen";
import { HeaderRight } from "../components/HeaderRight";
import { IndexHeaderRight } from "@/components/HeaderLogin";
import { globalEventEmitter } from "./ui/chat";

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
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showGroqKey, setShowGroqKey] = useState(false);
  const [password, setPassword] = useState('');
  const [showPasswordInput, setShowPasswordInput] = useState(false);

  const handleSaveKeys = async () => {
    if (!isAuthenticated) return;
    
    const newData = {
      ...data,
      apiKeys: {
        gemini: geminiKey.trim(),
        groq: groqKey.trim()
      }
    };
    
    try {
      if (!password) {
        setShowPasswordInput(true);
        return;
      }
      await saveData(newData, password);
      setShowPasswordInput(false);
      setPassword('');
    } catch (error) {
      console.error('Error saving API keys:', error);
    }
  };

  useEffect(() => {
    return () => {
      if (geminiKey !== data?.apiKeys?.gemini || groqKey !== data?.apiKeys?.groq) {
        handleSaveKeys();
      }
    };
  }, [geminiKey, groqKey]);

  return (
    <Modal
      visible={true}
      onDismiss={() => setShowSettings(false)}
      contentContainerStyle={[
        styles.modal,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
        }
      ]}
    >
      <Text 
        variant="titleLarge" 
        style={[styles.modalTitle, { color: theme.colors.onSurface }]}
      >
        Settings
      </Text>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <List.Section>
          <Surface style={[styles.section, { backgroundColor: theme.colors.elevation.level1 }]} elevation={1}>
            <List.Item
              title="Dark Mode"
              titleStyle={{ color: theme.colors.onSurface }}
              description="Toggle between light and dark theme"
              descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
              left={props => <List.Icon {...props} icon={isDarkMode ? "moon-waxing-crescent" : "white-balance-sunny"} color={theme.colors.primary} />}
              right={props => <Switch value={isDarkMode} onValueChange={setIsDarkMode} color={theme.colors.primary} />}
            />
          </Surface>

          {isAuthenticated && (
            <>
              <List.Subheader style={[styles.subheader, { color: theme.colors.primary }]}>
                API Keys
              </List.Subheader>
              <Surface style={[styles.section, { backgroundColor: theme.colors.elevation.level1 }]} elevation={1}>
                <View style={styles.inputContainer}>
                  <TextInput
                    mode="outlined"
                    label="Gemini API Key"
                    value={geminiKey}
                    onChangeText={setGeminiKey}
                    secureTextEntry={!showGeminiKey}
                    right={
                      <TextInput.Icon
                        icon={showGeminiKey ? "eye-off" : "eye"}
                        onPress={() => setShowGeminiKey(!showGeminiKey)}
                      />
                    }
                    style={styles.input}
                    outlineStyle={styles.inputOutline}
                    theme={theme}
                  />
                  <TextInput
                    mode="outlined"
                    label="Groq API Key"
                    value={groqKey}
                    onChangeText={setGroqKey}
                    secureTextEntry={!showGroqKey}
                    right={
                      <TextInput.Icon
                        icon={showGroqKey ? "eye-off" : "eye"}
                        onPress={() => setShowGroqKey(!showGroqKey)}
                      />
                    }
                    style={styles.input}
                    outlineStyle={styles.inputOutline}
                    theme={theme}
                  />
                  {showPasswordInput && (
                    <TextInput
                      mode="outlined"
                      label="Enter password to save changes"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                      right={<TextInput.Icon icon="check" onPress={handleSaveKeys} />}
                      style={styles.input}
                      outlineStyle={styles.inputOutline}
                      theme={theme}
                    />
                  )}
                  <Button 
                    mode="contained" 
                    onPress={handleSaveKeys}
                    style={styles.saveButton}
                    icon="content-save"
                  >
                    Save API Keys
                  </Button>
                </View>
              </Surface>
            </>
          )}
          
          <Surface style={[styles.section, { backgroundColor: theme.colors.elevation.level1 }]} elevation={1}>
            <List.Item
              title="About ChatLLM"
              titleStyle={{ color: theme.colors.onSurface }}
              description="Version 1.0.0"
              descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
              left={props => <List.Icon {...props} icon="information-outline" color={theme.colors.primary} />}
            />
          </Surface>
        </List.Section>
      </ScrollView>
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
    const handleOpenSettings = () => {
      setShowSettings(true);
    };
    
    globalEventEmitter.addListener('openSettings', handleOpenSettings);
    
    return () => {
      globalEventEmitter.removeListener('openSettings', handleOpenSettings);
    };
  }, []);

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme: () => setIsDarkMode(!isDarkMode) }}>
      <DataProvider>
        <PaperProvider theme={theme}>
          <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <Stack
              screenOptions={{
                headerStyle: { backgroundColor: theme.colors.surface },
                headerTintColor: theme.colors.onSurface,
                headerTitleStyle: { fontFamily: 'Inter_400Regular' },
                headerShadowVisible: true,
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
                  headerShown: true,
                  headerBackVisible: false,
                  headerRight: () => (
                    <HeaderRight
                      isDarkMode={isDarkMode}
                      setIsDarkMode={setIsDarkMode}
                      setShowSettings={setShowSettings}
                      theme={theme}
                    />
                  ),
                  headerLeft: () => null,
                  gestureEnabled: false,
                  animation: "none",
                  headerBackButtonMenuEnabled: false,
                }}
              />
            </Stack>
            <Portal>
              {showSettings && (
                <SettingsContent
                  isDarkMode={isDarkMode}
                  setIsDarkMode={setIsDarkMode}
                  setShowSettings={setShowSettings}
                />
              )}
            </Portal>
          </View>
        </PaperProvider>
      </DataProvider>
    </ThemeContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modal: {
    margin: 20,
    borderRadius: 12,
    padding: 20,
    backgroundColor: 'white',
    maxHeight: '80%',
  },
  modalTitle: {
    marginBottom: 16,
  },
  scrollView: {
    flexGrow: 0,
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  inputOutline: {
    borderRadius: 8,
  },
  divider: {
    marginBottom: 16,
  },
  section: {
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  subheader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  saveButton: {
    marginTop: 16,
  },
});
