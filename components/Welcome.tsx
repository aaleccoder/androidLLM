import { YStack, Text, styled } from 'tamagui'
import { Bot } from 'lucide-react-native'
import { useTheme } from '../context/themeContext'

const WelcomeContainer = styled(YStack, {
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
  padding: '$6',
})

const IconContainer = styled(YStack, {
  backgroundColor: '$backgroundSecondary',
  width: 80,
  height: 80,
  borderRadius: 40,
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '$4',
})

export function Welcome() {
  const { isDarkMode, theme } = useTheme()

  return (
    <WelcomeContainer>
      <IconContainer>
        <Bot size={40} color={theme.colors.primary} />
      </IconContainer>
      <Text
        color="$color"
        fontSize="$8"
        fontWeight="bold"
        textAlign="center"
        marginBottom="$2"
      >
        Welcome to ChatLLM
      </Text>
      <Text
        color="$colorMuted"
        fontSize="$4"
        textAlign="center"
        maxWidth={300}
      >
        Start a conversation with Gemini and explore the power of AI
      </Text>
    </WelcomeContainer>
  )
}