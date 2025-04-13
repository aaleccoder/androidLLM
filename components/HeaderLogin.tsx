import { XStack, Button } from 'tamagui';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'expo-router';
import { Sun, Moon } from 'lucide-react-native';
import { MD3Theme } from "react-native-paper/lib/typescript/types";

interface HeaderLoginProps {
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean) => void;
  theme: MD3Theme;
}

export const IndexHeaderRight = ({ isDarkMode, setIsDarkMode, theme }: HeaderLoginProps) => {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  return (
    <XStack space="$2" alignItems="center">
      <Button
        size="$3"
        padding="$2"
        borderRadius="$4"
        backgroundColor={isDarkMode ? "$backgroundDark" : "$backgroundLight"}
        pressStyle={{ opacity: 0.7 }}
        onPress={() => setIsDarkMode(!isDarkMode)}
      >
        {isDarkMode ? (
          <Sun size={20} color={theme.colors.onSurface} />
        ) : (
          <Moon size={20} color={theme.colors.onSurface} />
        )}
      </Button>
    </XStack>
  );
};
