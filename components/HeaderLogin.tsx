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
      className="p-2 rounded-full bg-background"
      onPress={() => setIsDarkMode(!isDarkMode)}
    >
      <Sun size={20} color="#EBE9FC" />
    </TouchableOpacity>
  );
};
