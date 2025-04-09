import { Stack } from "expo-router";
import { useState, useMemo } from "react";
import { Portal, Modal, Provider as PaperProvider, IconButton } from "react-native-paper";
import { View, Text } from "react-native";
import { ThemeContext, createTheme } from './context/themeContext';
import "./globals.css";

export default function RootLayout() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  
  const theme = useMemo(() => createTheme(isDarkMode), [isDarkMode]);

  const HeaderRight = () => (
    <View style={{ flexDirection: 'row' }}>
      <IconButton
        icon={isDarkMode ? "white-balance-sunny" : "moon-waxing-crescent"}
        onPress={() => setIsDarkMode(!isDarkMode)}
        iconColor={theme.colors.onSurface}
      />
      <IconButton
        icon="cog"
        onPress={() => setShowSettings(true)}
        iconColor={theme.colors.onSurface}
      />
    </View>
  );

  return (
    <ThemeContext.Provider value={{ isDarkMode, setIsDarkMode, theme }}>
      <PaperProvider theme={theme}>
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: theme.colors.surface,
            },
            headerTintColor: theme.colors.onSurface,
          }}
        >
          <Stack.Screen
            name="index"
            options={{
              title: "Chat",
              headerRight: HeaderRight,
            }}
          />
        </Stack>
        <Portal>
          <Modal
            visible={showSettings}
            onDismiss={() => setShowSettings(false)}
            contentContainerStyle={{
              backgroundColor: theme.colors.surface,
              padding: 20,
              margin: 20,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: theme.colors.onSurface }}>Settings</Text>
          </Modal>
        </Portal>
      </PaperProvider>
    </ThemeContext.Provider>
  );
}
