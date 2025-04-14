import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'expo-router';
import { Sun, Moon } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';

interface HeaderLoginProps {
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean) => void;
}

export const IndexHeaderRight = ({ isDarkMode, setIsDarkMode }: HeaderLoginProps) => {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  return (
    <TouchableOpacity
      className={`p-2 rounded-full ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-100'}`}
      onPress={() => setIsDarkMode(!isDarkMode)}
    >
      {isDarkMode ? (
        <Sun size={20} color="#fff" />
      ) : (
        <Moon size={20} color="#000" />
      )}
    </TouchableOpacity>
  );
};
