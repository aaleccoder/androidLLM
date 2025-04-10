/**
 * Delete Confirmation Component
 * 
 * Provides a confirmation UI for destructive actions like data deletion
 * with clearly marked actions and warning text
 */
import { View, StyleSheet } from 'react-native';
import { Button, Text, Icon } from 'react-native-paper';
import { useTheme } from '../context/themeContext';

/**
 * Props for the DeleteConfirmation component
 */
interface DeleteConfirmationProps {
    onDelete: () => void;
    onCancel: () => void;
}

/**
 * Renders a delete confirmation dialog with warning text and action buttons
 * 
 * @param {DeleteConfirmationProps} props - Component properties
 * @returns {JSX.Element} Delete confirmation component
 */
export function DeleteConfirmation({ onDelete, onCancel }: DeleteConfirmationProps) {
    const { theme } = useTheme();

    return (
        <View style={styles.container}>
            <View style={styles.warningContainer}>
                <Icon
                    source="alert-circle"
                    size={24}
                    color={theme.colors.error}
                />
                <Text style={[styles.warningText, { color: theme.colors.error }]}>
                    This will delete all your data permanently!
                </Text>
            </View>
            
            <Button 
                mode="contained"
                onPress={onDelete}
                style={styles.deleteButton}
                buttonColor={theme.colors.error}
                icon="delete"
            >
                Yes, Delete Everything
            </Button>
            
            <Button 
                mode="outlined"
                onPress={onCancel}
                style={styles.cancelButton}
            >
                Cancel
            </Button>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        gap: 8,
        marginTop: 8,
    },
    warningContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        justifyContent: 'center',
    },
    warningText: {
        marginLeft: 8,
        textAlign: 'center',
        fontWeight: '500',
    },
    deleteButton: {
        marginBottom: 8,
    },
    cancelButton: {
        marginBottom: 4,
    }
});
