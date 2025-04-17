import { Menu, Settings, Sun, Moon, LogOut } from 'lucide-react-native'
import { globalEventEmitter } from '../app/ui/chat'
import { useAuth } from '../hooks/useAuth'
import { SafeAreaView, Platform, StatusBar, View, Text, TouchableOpacity } from 'react-native'

interface TitleBarProps {
  showMenuButton?: boolean;
  setShowSettings?: (value: boolean) => void;
  // New props for model/provider indicator
  currentModel?: { id: string; displayName: string; provider: string };
  connectionStatus?: 'connected' | 'error' | 'unknown';
  onModelSwitch?: () => void;
}

export function TitleBar({ 
  showMenuButton = false, 
  setShowSettings,
  currentModel,
  connectionStatus = 'unknown',
  onModelSwitch
}: TitleBarProps) {
  const { logout } = useAuth()

  return (
    <View className={`bg-zinc-900 border-b border-zinc-800 p-3`}>
      <SafeAreaView>
        <View className="flex-row px-2 h-14 items-center justify-between" style={{
          marginTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
        }}>
          <View className="flex-row items-center gap-3">
            {showMenuButton && (
              <TouchableOpacity
                className={`p-2 rounded-lg bg-zinc-800`}
                onPress={() => globalEventEmitter.emit('toggleSidebar')}
              >
                <Menu size={24} color="#fff" />
              </TouchableOpacity>
            )}
            <Text className={`text-xl font-semibold tracking-tight text-white`}>
              ChatLLM
            </Text>
            {/* Provider/Model Indicator */}
            {currentModel && (
              <TouchableOpacity
                className="flex-row items-center ml-2 px-2 py-1 rounded-lg border border-blue-500 bg-blue-50"
                onPress={onModelSwitch}
                accessibilityLabel="Switch model or provider"
              >
                <View className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: connectionStatus === 'connected' ? '#22c55e' : connectionStatus === 'error' ? '#ef4444' : '#fbbf24' }} />
                <Text className="text-xs font-medium text-blue-700">{currentModel.displayName}</Text>
              </TouchableOpacity>
            )}
          </View>

          <View className="flex-row gap-2 items-center">
            {setShowSettings && (
              <TouchableOpacity
                className={`p-2 rounded-lg bg-zinc-800`}
                onPress={() => setShowSettings(true)}
              >
                <Settings size={24} color="#fff" />
              </TouchableOpacity>
            )}

            {showMenuButton && (
              <TouchableOpacity
                className={`p-2 rounded-lg bg-zinc-800`}
                onPress={logout}
              >
                <LogOut size={24} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </SafeAreaView>
    </View>
  )
}