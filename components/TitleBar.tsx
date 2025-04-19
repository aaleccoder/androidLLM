import { Menu, Settings, Sun, Moon, DoorOpen, Ellipsis, ChevronDown, Blinds } from 'lucide-react-native'
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth'
import { SafeAreaView, Platform, StatusBar, View, Text, TouchableOpacity, Modal, Pressable } from 'react-native'
import { globalEventEmitter } from '@/utils/event';

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
  const [menuVisible, setMenuVisible] = useState<boolean>(false);

  return (
    <View className={`bg-background border-b border-background p-3`}>
      <SafeAreaView>
        <View className="relative h-14 px-2 items-center justify-center" style={{
          marginTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
        }}>
          {/* Left section: menu button and model indicator */}
          <View className="absolute left-0 flex-row items-center gap-3 h-full">
            {showMenuButton && (
              <TouchableOpacity
                className="p-2 rounded-lg bg-background"
                onPress={() => globalEventEmitter.emit('toggleSidebar')}
              >
                <Blinds size={24} color="#61BA82" />
              </TouchableOpacity>
            )}
            {currentModel && (
              <TouchableOpacity
                className="flex-row items-center ml-2 px-3 py-1 rounded-lg border border-primary bg-background"
                onPress={onModelSwitch}
                accessibilityLabel="Switch model or provider"
                style={{ minWidth: 120, justifyContent: 'center' }}
              >
                <View className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: connectionStatus === 'connected' ? '#61BA82' : connectionStatus === 'error' ? '#ef4444' : '#fbbf24' }} />
                <Text className="flex-1 text-xs font-medium text-text text-center font-sans">
                  {currentModel.displayName}
                </Text>
                <ChevronDown size={18} color="#EBE9FC" className="ml-2" />
              </TouchableOpacity>
            )}
          </View>

          {/* Center section: title */}
          <View className="absolute inset-0 items-center justify-center flex-row pointer-events-none">
            <Text className="text-xl text-text text-center font-sans" style={{width: 200}} numberOfLines={1} ellipsizeMode="tail">ChatLLM</Text>
          </View>

          {/* Right section: three-dots menu */}
          <View className="absolute right-0 flex-row items-center gap-2 h-full">
            <TouchableOpacity
              className="p-2 rounded-lg bg-background"
              onPress={() => setMenuVisible(true)}
              accessibilityLabel="Open more options"
            >
              <Ellipsis size={24} color="#61BA82" />
            </TouchableOpacity>
            <Modal
              visible={menuVisible}
              transparent
              animationType="fade"
              onRequestClose={() => setMenuVisible(false)}
            >
              <Pressable
                className="flex-1 bg-black/30 justify-center items-center"
                onPress={() => setMenuVisible(false)}
              >
                <View className="w-full h-full justify-center items-center">
                  <Pressable
                    className="bg-background border-2 border-primary rounded-2xl min-w-[220px] px-7 py-6 shadow-lg"
                    onPress={(e) => e.stopPropagation()}
                  >
                    {setShowSettings && (
                      <TouchableOpacity
                        className="flex-row items-center py-3 px-2"
                        onPress={() => { setMenuVisible(false); setShowSettings(true); }}
                        accessibilityLabel="Open settings"
                      >
                        <Settings size={22} color="#61BA82" style={{ marginRight: 14 }} />
                        <Text className="text-text text-lg font-medium text-center font-sans">Settings</Text>
                      </TouchableOpacity>
                    )}
                    {showMenuButton && (
                      <TouchableOpacity
                        className="flex-row items-center py-3 px-2"
                        onPress={() => { setMenuVisible(false); logout(); }}
                        accessibilityLabel="Log out"
                      >
                        <DoorOpen size={22} color="#61BA82" style={{ marginRight: 14 }} />
                        <Text className="text-text text-lg font-medium text-center font-sans">Log Out</Text>
                      </TouchableOpacity>
                    )}
                  </Pressable>
                </View>
              </Pressable>
            </Modal>
          </View>
        </View>
      </SafeAreaView>
    </View>
  )
}