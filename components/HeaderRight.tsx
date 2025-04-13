import { useAuth } from "@/hooks/useAuth";
import { globalEventEmitter } from "@/app/ui/chat";
import { XStack, Button } from "tamagui";
import { Sun, Moon, Settings, LogOut } from "lucide-react-native";
import { MD3Theme } from "react-native-paper/lib/typescript/types";

interface HeaderRightProps {
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean) => void;
  setShowSettings: (value: boolean) => void;
  theme: MD3Theme;
}

export const HeaderRight = ({ isDarkMode, setIsDarkMode, setShowSettings, theme }: HeaderRightProps) => {
  const { logout } = useAuth();
  
  return (
    <XStack space="$2">
      <Button
        onPress={() => setIsDarkMode(!isDarkMode)}
        backgroundColor={isDarkMode ? "$backgroundDark" : "$backgroundLight"}
        size="$3"
        circular
      >
        {isDarkMode ? (
          <Sun size={20} color={theme.colors.onSurface} />
        ) : (
          <Moon size={20} color={theme.colors.onSurface} />
        )}
      </Button>
      <Button
        onPress={() => setShowSettings(true)}
        backgroundColor={isDarkMode ? "$backgroundDark" : "$backgroundLight"}
        size="$3"
        circular
      >
        <Settings size={20} color={theme.colors.onSurface} />
      </Button>
      <Button
        onPress={logout}
        backgroundColor={isDarkMode ? "$backgroundDark" : "$backgroundLight"}
        size="$3"
        circular
      >
        <LogOut size={20} color={theme.colors.onSurface} />
      </Button>
    </XStack>
  );
};
