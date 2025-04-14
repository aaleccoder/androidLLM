import { View } from 'react-native'
import { Text } from 'react-native-paper'
import { Bot } from 'lucide-react-native'
import { useTheme } from '../context/themeContext'

export function Welcome() {
  const { theme } = useTheme()

  return (
    <View style={{
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      <View style={{
        backgroundColor: theme.colors.surface,
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
      }}>
        <Bot size={40} color={theme.colors.primary} />
      </View>
      <Text
        style={{
          color: theme.colors.text,
          fontSize: 28,
          fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: 8,
        }}
      >
        Welcome to ChatLLM
      </Text>
      <Text
        style={{
          color: theme.colors.onSurfaceVariant,
          fontSize: 16,
          textAlign: 'center',
          maxWidth: 300,
        }}
      >
        Start a conversation with Gemini and explore the power of AI
      </Text>
    </View>
  )
}