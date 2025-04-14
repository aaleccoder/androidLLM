import { Menu, Settings, Sun, Moon, LogOut } from 'lucide-react-native'
import { useTheme } from '../context/themeContext'
import { globalEventEmitter } from '../app/ui/chat'
import { useAuth } from '../hooks/useAuth'
import { SafeAreaView, Platform, StatusBar, View } from 'react-native'
import { Text, IconButton } from 'react-native-paper'

const HeaderButton = {
  minWidth: 44,
  height: 44,
  pressStyle: {
    opacity: 0.8,
    scale: 0.97,
  },
  animation: 'bouncy',
}

const HeaderIcon = {
  alignItems: 'center',
  justifyContent: 'center',
  height: 44,
}

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
      style={{
        backgroundColor: theme.colors.background,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.surface
      }}
    >
      <SafeAreaView>
        <View
          style={{
            flexDirection: 'row',
            paddingHorizontal: 8,
            height: 56,
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            {showMenuButton && (
              <IconButton
                icon="menu"
                size={24}
                onPress={() => globalEventEmitter.emit('toggleSidebar')}
                style={{ backgroundColor: theme.colors.surface }}
                iconColor={theme.colors.text}
              />
            )}
            <Text
              style={{
                color: theme.colors.text,
                fontSize: 20,
                fontWeight: '600',
                letterSpacing: -0.5,
              }}
            >
              ChatLLM
            </Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <IconButton
              icon={isDarkMode ? "white-balance-sunny" : "brightness-3"}
              size={24}
              onPress={() => setIsDarkMode(!isDarkMode)}
              style={{ backgroundColor: theme.colors.surface }}
              iconColor={theme.colors.text}
            />

            {setShowSettings && (
              <IconButton
                icon="cog"
                size={24}
                onPress={() => setShowSettings(true)}
                style={{ backgroundColor: theme.colors.surface }}
                iconColor={theme.colors.text}
              />
            )}

            {showMenuButton && (
              <IconButton
                icon="logout"
                size={24}
                onPress={logout}
                style={{ backgroundColor: theme.colors.surface }}
                iconColor={theme.colors.text}
              />
            )}
          </View>
        </View>
      </SafeAreaView>
    </View>
  )
}