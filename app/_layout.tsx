import { Stack } from "expo-router";
import { useState, useMemo, useEffect } from "react";
import { DataProvider } from '../context/dataContext';
import { AuthProvider, useAuth } from '../hooks/useAuth';
import { View } from 'react-native';
import { SafeAreaView } from "react-native";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { TitleBar } from '../components/TitleBar';
import { Settings } from '../components/Settings';
import "./globals.css";
import { globalEventEmitter } from "@/utils/event";
import { migrateToSqlite } from "@/utils/migrateToSqlite";
import * as FileSystem from 'expo-file-system';

function AppContent() {
  const [showSettings, setShowSettings] = useState(false);
  const auth = useAuth();

  useEffect(() => {
    const checkAndMigrate = async () => {
      try {
        const password = auth.getCurrentPassword();
        // Check if migration is needed (if data.json exists and no SQLite file)
        const jsonPath = `${FileSystem.documentDirectory}data.json`;
        const sqlitePath = `${FileSystem.documentDirectory}SQLite/androidllm.db`;
        
        const jsonExists = (await FileSystem.getInfoAsync(jsonPath)).exists;
        const sqliteExists = (await FileSystem.getInfoAsync(sqlitePath)).exists;

        if (jsonExists && !sqliteExists && password) {
          console.log('Starting migration to SQLite...');
          await migrateToSqlite(password);
          console.log('Migration completed');
        }
      } catch (error) {
        console.error('Migration failed:', error);
      }
    };

    if (auth.isAuthenticated) {
      checkAndMigrate();
    }
  }, [auth.isAuthenticated]);

  useEffect(() => {
    const handleOpenSettings = () => setShowSettings(true);
    const subscription = globalEventEmitter.addListener('openSettings', handleOpenSettings);
    return () => {
      subscription.removeListener('openSettings', handleOpenSettings);
    };
  }, []);

  return (
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
  );
}

const RootLayout = () => {

  return (
    <DataProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </DataProvider>
  );
};

export default RootLayout;
