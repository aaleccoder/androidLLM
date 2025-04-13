import { XStack, Button, Text, styled, View } from 'tamagui'
import { Menu, Settings, Sun, Moon, LogOut } from 'lucide-react-native'
import { useTheme } from '../context/themeContext'
import { globalEventEmitter } from '../app/ui/chat'
import { useAuth } from '../hooks/useAuth'
import { SafeAreaView, Platform, StatusBar } from 'react-native'

const HeaderButton = styled(Button, {
  minWidth: 44,
  height: 44,
  backgroundColor: '$backgroundSecondary',
  pressStyle: {
    opacity: 0.8,
    scale: 0.97,
  },
  animation: 'bouncy',
})

const HeaderIcon = styled(XStack, {
  alignItems: 'center',
  justifyContent: 'center',
  height: 44,
})

interface TitleBarProps {
  showMenuButton?: boolean
  isDarkMode: boolean
  setIsDarkMode: (value: boolean) => void
  setShowSettings?: (value: boolean) => void
}

export function TitleBar({ 
  showMenuButton = false, 
  isDarkMode, 
  setIsDarkMode, 
  setShowSettings 
}: TitleBarProps) {
  const { theme } = useTheme()
  const { logout } = useAuth()

  return (
    <View
      backgroundColor="$background"
      borderBottomWidth={1}
      borderBottomColor="$borderColor"
    >
      <SafeAreaView>
        <XStack
          paddingHorizontal="$2"
          height={56}
          alignItems="center"
          justifyContent="space-between"
          marginTop={Platform.OS === 'android' ? StatusBar.currentHeight : 0}
        >
          <XStack alignItems="center" space="$3">
            {showMenuButton && (
              <HeaderButton
                onPress={() => globalEventEmitter.emit('toggleSidebar')}
              >
                <HeaderIcon>
                  <Menu size={24} color={theme.colors.text} />
                </HeaderIcon>
              </HeaderButton>
            )}
            <Text
              color="$color"
              fontSize={20}
              fontWeight="600"
              letterSpacing={-0.5}
            >
              ChatLLM
            </Text>
          </XStack>

          <XStack space="$2" alignItems="center">
            <HeaderButton
              onPress={() => setIsDarkMode(!isDarkMode)}
            >
              <HeaderIcon>
                {isDarkMode ? (
                  <Sun size={24} color={theme.colors.text} />
                ) : (
                  <Moon size={24} color={theme.colors.text} />
                )}
              </HeaderIcon>
            </HeaderButton>

            {setShowSettings && (
              <HeaderButton
                onPress={() => setShowSettings(true)}
              >
                <HeaderIcon>
                  <Settings size={24} color={theme.colors.text} />
                </HeaderIcon>
              </HeaderButton>
            )}

            {showMenuButton && (
              <HeaderButton
                onPress={logout}
              >
                <HeaderIcon>
                  <LogOut size={24} color={theme.colors.text} />
                </HeaderIcon>
              </HeaderButton>
            )}
          </XStack>
        </XStack>
      </SafeAreaView>
    </View>
  )
}