import { useAuth } from "@/hooks/useAuth";
import { View } from "react-native";
import { IconButton } from "react-native-paper";
import { MD3Theme } from "react-native-paper/lib/typescript/types";
import { globalEventEmitter } from "@/app/ui/chat";

interface HeaderRightProps {
    isDarkMode: boolean;
    setIsDarkMode: (value: boolean) => void;
    setShowSettings: (value: boolean) => void;
    theme: MD3Theme;
}

export const HeaderRight = ({ isDarkMode, setIsDarkMode, setShowSettings, theme }: HeaderRightProps) => {
    const { logout } = useAuth();
    
    const toggleSidebar = () => {
        globalEventEmitter.emit('toggleSidebar');
    };
    
    return (
        <View className="flex-row items-center">
            <IconButton
                icon="menu"
                onPress={toggleSidebar}
                iconColor={theme.colors.primary}
                size={24}
                className="m-0"
            />
            <IconButton
                icon={isDarkMode ? "white-balance-sunny" : "moon-waxing-crescent"}
                onPress={() => setIsDarkMode(!isDarkMode)}
                iconColor={theme.colors.primary}
                size={24}
                className="m-0"
            />
            <IconButton
                icon="cog-outline"
                onPress={() => setShowSettings(true)}
                iconColor={theme.colors.onSurface}
                size={24}
                className="m-0"
            />
            <IconButton
                icon="logout"
                onPress={logout}
                iconColor={theme.colors.onSurface}
                size={24}
                className="m-0"
            />
        </View>
    );
};
