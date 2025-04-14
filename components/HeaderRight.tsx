import { useAuth } from "@/hooks/useAuth";
import { View } from "react-native";
import { IconButton } from "react-native-paper"; // Import IconButton from react-native-paper

interface HeaderRightProps {
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean) => void;
  setShowSettings: (value: boolean) => void;
  // theme prop is likely not needed if using Tamagui theme tokens
}

export const HeaderRight = ({ isDarkMode, setIsDarkMode, setShowSettings }: HeaderRightProps) => {
  const { logout } = useAuth();

  return (
    <View style={{ flexDirection: "row", gap: 8 }}>
      <IconButton
        icon={isDarkMode ? "white-balance-sunny" : "brightness-3"}
        size={20}
        onPress={() => setIsDarkMode(!isDarkMode)}
        style={{ backgroundColor: isDarkMode ? "#222" : "#fff" }}
        iconColor={isDarkMode ? "#fff" : "#222"}
      />
      <IconButton
        icon="cog"
        size={20}
        onPress={() => setShowSettings(true)}
        style={{ backgroundColor: isDarkMode ? "#222" : "#fff" }}
        iconColor={isDarkMode ? "#fff" : "#222"}
      />
      <IconButton
        icon="logout"
        size={20}
        onPress={logout}
        style={{ backgroundColor: isDarkMode ? "#222" : "#fff" }}
        iconColor={isDarkMode ? "#fff" : "#222"}
      />
    </View>
  );
};
