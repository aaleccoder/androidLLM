import React, { useState } from "react";
import { View, ScrollView } from "react-native";
import { Text, TextInput, Button, Card } from "react-native-paper";
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from './context/themeContext';

export default function Chat() {
  const [loaded] = useFonts({
    'Poppins-Regular': require('../assets/fonts/Poppins-Regular.ttf'),
    'Poppins-Medium': require('../assets/fonts/Poppins-Medium.ttf'),
    'Poppins-Bold': require('../assets/fonts/Poppins-Bold.ttf'),
  });
  const { isDarkMode, theme } = useTheme();
  const [messages, setMessages] = useState<{ sender: string; text: string }[]>([]);
  const [input, setInput] = useState("");

  const sendMessage = () => {
    if (input.trim()) {
      setMessages([...messages, { sender: "User", text: input }]);
      setInput("");
      // Simulate chatbot response
      setTimeout(() => {
        setMessages((prev) => [...prev, { sender: "Bot", text: "Hello! How can I help you?" }]);
      }, 1000);
    }
  };

  if (!loaded) return null;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      <View style={{ flex: 1, padding: 16 }}>
        <ScrollView style={{ flex: 1, marginBottom: 16 }}>
          {messages.map((message, index) => (
            <Card
              key={index}
              style={{
                marginBottom: 8,
                alignSelf: message.sender === "User" ? "flex-end" : "flex-start",
                backgroundColor: message.sender === "User" 
                  ? theme.colors.primaryContainer 
                  : theme.colors.surfaceVariant,
              }}
            >
              <Card.Content>
                <Text style={{ color: theme.colors.onSurface }}>{message.text}</Text>
              </Card.Content>
            </Card>
          ))}
        </ScrollView>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TextInput
            mode="outlined"
            style={{ flex: 1, marginRight: 8 }}
            placeholder="Type a message..."
            value={input}
            onChangeText={setInput}
            theme={theme}
          />
          <Button mode="contained" onPress={sendMessage}>
            Send
          </Button>
        </View>
      </View>
    </View>
  );
}
