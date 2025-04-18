import { Stack } from "expo-router";
import { useState, useMemo, useEffect } from "react";
import { DataProvider } from '../context/dataContext';
import { AuthProvider } from '../hooks/useAuth';
import { View } from 'react-native';
import { SafeAreaView } from "react-native";
import { useFonts } from "expo-font";
import { Inter_400Regular } from "@expo-google-fonts/inter";
import * as SplashScreen from "expo-splash-screen";
import { TitleBar } from '../components/TitleBar';
import { Settings } from '../components/Settings';
import "./globals.css";
import { globalEventEmitter } from "@/utils/event";

export default function RootLayout() {
  const [showSettings, setShowSettings] = useState(false);

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
              
              <Settings 
                isVisible={showSettings}
                onClose={() => setShowSettings(false)}
              />
            </SafeAreaView>
          </View>
        </AuthProvider>
      </DataProvider>
  );
}
