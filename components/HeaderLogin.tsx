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
        circular
        backgroundColor={isDarkMode ? "#3D3D3D" : "#E9E9E9"}
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
