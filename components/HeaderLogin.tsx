import { HStack, Button } from "@gluestack-ui/themed";
import { Sun, Moon } from "lucide-react-native";
import { MD3Theme } from "react-native-paper/lib/typescript/types";

interface IndexHeaderRight {
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean) => void;
  theme: MD3Theme;
}

export const IndexHeaderRight = ({ isDarkMode, setIsDarkMode, theme }: IndexHeaderRight) => (
  <HStack space="sm" mr="$2">
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
  </HStack>
);
