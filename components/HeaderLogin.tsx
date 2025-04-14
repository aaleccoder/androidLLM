import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'expo-router';
import { Sun, Moon } from 'lucide-react-native';
import { MD3Theme } from "react-native-paper/lib/typescript/types";
import { IconButton } from 'react-native-paper';

interface HeaderLoginProps {
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean) => void;
  theme: MD3Theme;
}

export const IndexHeaderRight = ({ isDarkMode, setIsDarkMode, theme }: HeaderLoginProps) => {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  return (
    <IconButton
      size={20}
      icon={isDarkMode ? "white-balance-sunny" : "moon-waning-crescent"}
      onPress={() => setIsDarkMode(!isDarkMode)}
      style={{
        backgroundColor: isDarkMode ? theme.colors.background : theme.colors.surface,
        borderRadius: 50,
      }}
      iconColor={theme.colors.onSurface}
    />
  );
};
