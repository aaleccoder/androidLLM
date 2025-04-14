import { View, Text } from 'react-native'
import { Bot } from 'lucide-react-native'
import { useTheme } from '../context/themeContext'

export function Welcome() {
  const { isDarkMode } = useTheme()

  return (
    <View className="flex-1 items-center justify-center p-6">
      <View className={`w-20 h-20 rounded-full items-center justify-center mb-4 ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
        <Bot size={40} color={isDarkMode ? "#fff" : "#000"} />
      </View>
      <Text className={`text-2xl font-bold text-center mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>
        Welcome to ChatLLM
      </Text>
      <Text className={`text-base text-center max-w-[300px] ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
        Start a conversation with Gemini and explore the power of AI
      </Text>
    </View>
  )
}