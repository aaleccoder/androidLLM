import { View } from "react-native";
import { IconButton } from "react-native-paper";
import { MD3Theme } from "react-native-paper/lib/typescript/types";

interface IndexHeaderRight {
    isDarkMode: boolean;
    setIsDarkMode: (value: boolean) => void;
    theme: MD3Theme;
}

export const IndexHeaderRight = ({ isDarkMode, setIsDarkMode, theme }: IndexHeaderRight) => (
    <View className="flex-row items-center mr-2">
        <IconButton
            icon={isDarkMode ? "white-balance-sunny" : "moon-waxing-crescent"}
            onPress={() => setIsDarkMode(!isDarkMode)}
            iconColor={theme.colors.primary}
            size={24}
        />
    </View>
);
