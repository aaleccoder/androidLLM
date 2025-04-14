import { Menu, Settings, Sun, Moon, LogOut } from 'lucide-react-native'
import { useTheme } from '../context/themeContext'
import { globalEventEmitter } from '../app/ui/chat'
import { useAuth } from '../hooks/useAuth'
import { SafeAreaView, Platform, StatusBar, View, Text, TouchableOpacity } from 'react-native'

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
    <View className={`${isDarkMode ? 'bg-zinc-900' : 'bg-white'} border-b ${isDarkMode ? 'border-zinc-800' : 'border-zinc-200'} p-3`}>
      <SafeAreaView>
        <View className="flex-row px-2 h-14 items-center justify-between" style={{
          marginTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
        }}>
          <View className="flex-row items-center gap-3">
            {showMenuButton && (
              <TouchableOpacity
                className={`p-2 rounded-lg ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-100'}`}
                onPress={() => globalEventEmitter.emit('toggleSidebar')}
              >
                <Menu size={24} color={isDarkMode ? "#fff" : "#000"} />
              </TouchableOpacity>
            )}
            <Text className={`text-xl font-semibold tracking-tight ${isDarkMode ? 'text-white' : 'text-black'}`}>
              ChatLLM
            </Text>
          </View>

          <View className="flex-row gap-2 items-center">
            <TouchableOpacity
              className={`p-2 rounded-lg ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-100'}`}
              onPress={() => setIsDarkMode(!isDarkMode)}
            >
              {isDarkMode ? (
                <Sun size={24} color="#fff" />
              ) : (
                <Moon size={24} color="#000" />
              )}
            </TouchableOpacity>

            {setShowSettings && (
              <TouchableOpacity
                className={`p-2 rounded-lg ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-100'}`}
                onPress={() => setShowSettings(true)}
              >
                <Settings size={24} color={isDarkMode ? "#fff" : "#000"} />
              </TouchableOpacity>
            )}

            {showMenuButton && (
              <TouchableOpacity
                className={`p-2 rounded-lg ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-100'}`}
                onPress={logout}
              >
                <LogOut size={24} color={isDarkMode ? "#fff" : "#000"} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </SafeAreaView>
    </View>
  )
}