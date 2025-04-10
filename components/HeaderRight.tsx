import { useAuth } from "@/hooks/useAuth";
import { View, StyleSheet } from "react-native";
import { IconButton } from "react-native-paper";
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
        <View style={styles.container}>
            <IconButton
                icon={isDarkMode ? "white-balance-sunny" : "moon-waxing-crescent"}
                onPress={() => setIsDarkMode(!isDarkMode)}
                iconColor={theme.colors.primary}
                size={24}
                style={styles.iconButton}
            />
            <IconButton
                icon="cog-outline"
                onPress={() => setShowSettings(true)}
                iconColor={theme.colors.onSurface}
                size={24}
                style={styles.iconButton}
            />
            <IconButton
                icon="logout"
                onPress={logout}
                iconColor={theme.colors.onSurface}
                size={24}
                style={styles.iconButton}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconButton: {
        margin: 0,
    }
});
