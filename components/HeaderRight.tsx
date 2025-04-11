import { useAuth } from "@/hooks/useAuth";
import { globalEventEmitter } from "@/app/ui/chat";
import { HStack, Button } from "@gluestack-ui/themed";
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
    <HStack space="sm">
      <Button
        size="sm"
        variant="solid"
        bgColor={isDarkMode ? "$neutral800" : "$neutral200"}
        borderRadius="$full"
        onPress={() => setIsDarkMode(!isDarkMode)}
      >
        {isDarkMode ? (
          <Sun size={20} color={theme.colors.onSurface} />
        ) : (
          <Moon size={20} color={theme.colors.onSurface} />
        )}
      </Button>
      <Button
        size="sm"
        variant="solid"
        bgColor={isDarkMode ? "$neutral800" : "$neutral200"}
        borderRadius="$full"
        onPress={() => setShowSettings(true)}
      >
        <Settings size={20} color={theme.colors.onSurface} />
      </Button>
      <Button
        size="sm"
        variant="solid"
        bgColor={isDarkMode ? "$neutral800" : "$neutral200"}
        borderRadius="$full"
        onPress={logout}
      >
        <LogOut size={20} color={theme.colors.onSurface} />
      </Button>
    </HStack>
  );
};
