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

// Import Lucide icons
import { Eye, EyeOff, Save } from 'lucide-react-native';

// Import GlueStack UI components
import {
  GluestackUIProvider,
  Box,
  Text,
  Divider,
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Switch,
  Input,
  InputField,
  InputIcon,
  InputSlot,
  VStack,
  HStack,
  Button,
  ButtonText,
  ButtonIcon,
  Heading,
  ScrollView as GScrollView,
  FormControl,
  FormControlLabel,
  FormControlLabelText,
  FormControlHelper,
  FormControlHelperText,
} from "@gluestack-ui/themed";
import { config } from "../utils/config/gluestack-ui.config";

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

  const handleSaveSettings = async () => {
    if (!isAuthenticated) return;
    
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
        return;
      }
      await saveData(newData, password);
      // Update the Gemini service with the new prompt
      geminiService.setCustomPrompt(customPrompt.trim() || undefined);
      setShowPasswordInput(false);
      setPassword('');
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  useEffect(() => {
    return () => {
      if (geminiKey !== data?.apiKeys?.gemini || 
          groqKey !== data?.apiKeys?.groq ||
          customPrompt !== data?.settings?.customPrompt) {
        handleSaveSettings();
      }
    };
  }, [geminiKey, groqKey, customPrompt]);

  return (
    <Modal isOpen={true} onClose={() => setShowSettings(false)}>
      <ModalBackdrop />
      <ModalContent className={`m-4 rounded-3xl ${isDarkMode ? 'bg-neutral-900' : 'bg-neutral-100'}`}>
        <ModalHeader>
          <Heading className={isDarkMode ? 'text-neutral-100' : 'text-neutral-900'}>Settings</Heading>
        </ModalHeader>
        <ModalBody>
          <GScrollView contentContainerClassName="gap-4" showsVerticalScrollIndicator={false}>
            <Box className={`rounded-2xl ${isDarkMode ? 'bg-neutral-800' : 'bg-neutral-200'} p-4`}>
              <HStack className="justify-between items-center">
                <VStack className="flex-1">
                  <Text className={`text-lg font-medium ${isDarkMode ? 'text-neutral-50' : 'text-neutral-900'}`}>Dark Mode</Text>
                  <Text className={isDarkMode ? 'text-neutral-400' : 'text-neutral-600'}>Toggle between light and dark theme</Text>
                </VStack>
                <Switch
                  value={isDarkMode}
                  onValueChange={setIsDarkMode}
                  trackColor={{ false: isDarkMode ? "$neutral700" : "$neutral300", true: "$primary900" }}
                  thumbColor={isDarkMode ? "$primary500" : "$neutral100"}
                />
              </HStack>
            </Box>

            {isAuthenticated && (
              <>
                <Heading size="sm" className="text-primary-500 mt-2">API Keys</Heading>
                <Box className={`rounded-2xl ${isDarkMode ? 'bg-neutral-800' : 'bg-neutral-200'} p-4`}>
                  <FormControl className="mb-4">
                    <FormControlLabel>
                      <FormControlLabelText className={isDarkMode ? 'text-neutral-100' : 'text-neutral-900'}>
                        Gemini API Key
                      </FormControlLabelText>
                    </FormControlLabel>
                    <Input className="rounded-xl">
                      <InputField
                        value={geminiKey}
                        onChangeText={setGeminiKey}
                        secureTextEntry={!showGeminiKey}
                        className={isDarkMode ? 'text-neutral-100' : 'text-neutral-900'}
                      />
                      <InputSlot onPress={() => setShowGeminiKey(!showGeminiKey)}>
                        {showGeminiKey ? 
                          <EyeOff size={20} color={isDarkMode ? "#818cf8" : "#6366f1"} /> : 
                          <Eye size={20} color={isDarkMode ? "#818cf8" : "#6366f1"} />
                        }
                      </InputSlot>
                    </Input>
                  </FormControl>

                  <FormControl>
                    <FormControlLabel>
                      <FormControlLabelText className={isDarkMode ? 'text-neutral-100' : 'text-neutral-900'}>
                        Groq API Key
                      </FormControlLabelText>
                    </FormControlLabel>
                    <Input className="rounded-xl">
                      <InputField
                        value={groqKey}
                        onChangeText={setGroqKey}
                        secureTextEntry={!showGroqKey}
                        className={isDarkMode ? 'text-neutral-100' : 'text-neutral-900'}
                      />
                      <InputSlot onPress={() => setShowGroqKey(!showGroqKey)}>
                        {showGroqKey ? 
                          <EyeOff size={20} color={isDarkMode ? "#818cf8" : "#6366f1"} /> : 
                          <Eye size={20} color={isDarkMode ? "#818cf8" : "#6366f1"} />
                        }
                      </InputSlot>
                    </Input>
                  </FormControl>
                </Box>

                <Heading size="sm" className="text-primary-500 mt-2">Assistant Settings</Heading>
                <Box className={`rounded-2xl ${isDarkMode ? 'bg-neutral-800' : 'bg-neutral-200'} p-4`}>
                  <FormControl>
                    <FormControlLabel>
                      <FormControlLabelText className={isDarkMode ? 'text-neutral-100' : 'text-neutral-900'}>
                        Custom System Prompt
                      </FormControlLabelText>
                    </FormControlLabel>
                    <Input className="rounded-xl">
                      <InputField
                        value={customPrompt}
                        onChangeText={setCustomPrompt}
                        placeholder="Optional: Enter a system prompt to define the assistant's behavior"
                        placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
                        multiline
                        numberOfLines={4}
                        className={isDarkMode ? 'text-neutral-100' : 'text-neutral-900'}
                      />
                    </Input>
                    <FormControlHelper>
                      <FormControlHelperText className={isDarkMode ? 'text-neutral-400' : 'text-neutral-600'}>
                        The assistant will use this prompt to understand its role and how to respond. Leave empty for no system prompt.
                      </FormControlHelperText>
                    </FormControlHelper>
                  </FormControl>
                </Box>

                {showPasswordInput && (
                  <Box className={`rounded-2xl ${isDarkMode ? 'bg-neutral-800' : 'bg-neutral-200'} p-4 mt-4`}>
                    <FormControl>
                      <FormControlLabel>
                        <FormControlLabelText className={isDarkMode ? 'text-neutral-100' : 'text-neutral-900'}>
                          Enter password to save changes
                        </FormControlLabelText>
                      </FormControlLabel>
                      <Input className="rounded-xl">
                        <InputField
                          value={password}
                          onChangeText={setPassword}
                          secureTextEntry={!showPassword}
                          className={isDarkMode ? 'text-neutral-100' : 'text-neutral-900'}
                        />
                        <InputSlot onPress={() => setShowPassword(!showPassword)}>
                          {showPassword ? 
                            <EyeOff size={20} color={isDarkMode ? "#9CA3AF" : "#6B7280"} /> : 
                            <Eye size={20} color={isDarkMode ? "#9CA3AF" : "#6B7280"} />
                          }
                        </InputSlot>
                      </Input>
                    </FormControl>
                  </Box>
                )}

                <Button
                  className="mt-4"
                  onPress={handleSaveSettings}
                >
                  <Save size={18} color="white" style={{ marginRight: 8 }} />
                  <ButtonText>Save Settings</ButtonText>
                </Button>
              </>
            )}
            
            <Box className={`rounded-2xl ${isDarkMode ? 'bg-neutral-800' : 'bg-neutral-200'} p-4 mt-4`}>
              <HStack className="justify-between items-center">
                <VStack className="flex-1">
                  <Text className={`text-lg font-medium ${isDarkMode ? 'text-neutral-50' : 'text-neutral-900'}`}>About ChatLLM</Text>
                  <Text className={isDarkMode ? 'text-neutral-400' : 'text-neutral-600'}>Version 1.0.0</Text>
                </VStack>
              </HStack>
            </Box>
          </GScrollView>
        </ModalBody>
        <ModalFooter>
          <Button
            size="sm" 
            variant="outline"
            onPress={() => setShowSettings(false)}
          >
            <ButtonText>Close</ButtonText>
          </Button>
        </ModalFooter>
      </ModalContent>
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
    <GluestackUIProvider config={config} colorMode={isDarkMode ? "dark" : "light"}>
      <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme: () => setIsDarkMode(!isDarkMode) }}>
        <DataProvider>
          <AuthProvider>
            <Box className={`flex-1 ${isDarkMode ? 'bg-neutral-900' : 'bg-neutral-50'}`}>
              <Stack
                screenOptions={{
                  headerStyle: {
                    backgroundColor: isDarkMode ? theme.colors.surface : theme.colors.background,
                  },
                  headerTintColor: isDarkMode ? theme.colors.text : theme.colors.primary,
                  headerTitleStyle: { fontFamily: 'Inter_400Regular' },
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
              {showSettings && (
                <SettingsContent
                  isDarkMode={isDarkMode}
                  setIsDarkMode={setIsDarkMode}
                  setShowSettings={setShowSettings}
                />
              )}
            </Box>
          </AuthProvider>
        </DataProvider>
      </ThemeContext.Provider>
    </GluestackUIProvider>
  );
}
