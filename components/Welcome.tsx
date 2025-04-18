import { View, Text } from 'react-native'
import { Bot } from 'lucide-react-native'

export function Welcome() {
  return (
    <View className="flex-1 items-center justify-center p-6 bg-background">
      <View className="w-20 h-20 rounded-full items-center justify-center mb-4 bg-primary">
        <Bot size={40} color="#61BA82" />
      </View>
      <Text className="text-2xl font-bold text-center mb-2 text-text">
        Welcome to ChatLLM
      </Text>
      <Text className="text-base text-center max-w-[300px] text-text opacity-70">
        Start a conversation with Gemini and explore the power of AI
      </Text>
    </View>
  )
}