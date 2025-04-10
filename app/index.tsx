/**
 * Main Entry/Login Screen
 * 
 * This component handles:
 * - New user registration with password creation
 * - Existing user authentication
 * - Account deletion functionality
 * - Themed UI presentation
 */
import React, { useState } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { useNavigation } from 'expo-router';
import { Text, Button, Surface, TextInput, IconButton } from 'react-native-paper';
import { useTheme } from '../context/themeContext';
import { DeleteConfirmation } from '../components/DeleteConfirmation';
import { useAuth } from '../hooks/useAuth';

/**
 * Entry point component - handles login and registration
 */
export default function Page() {
    const { isDarkMode, theme } = useTheme();
    const navigation = useNavigation();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    
    const { isNewUser, error, setError, validateAndSavePassword, deleteAllData } = useAuth();

    /**
     * Handles password submission - either creating new account or logging in
     */
    const handleSubmit = async () => {
        try {
            const success = await validateAndSavePassword(password, isNewUser ? confirmPassword : undefined);
            if (success) {
                navigation.navigate('ui/chat' as never);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        }
    };

    /**
     * Handles data deletion and resets the application
     */
    const handleDelete = async () => {
        try {
            await deleteAllData();
            setShowDeleteConfirm(false);
            setError('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete file');
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <Surface style={[styles.card, { backgroundColor: theme.colors.elevation.level1 }]} elevation={2}>
                <View style={styles.logoContainer}>
                    <Surface style={styles.logoBackground} elevation={4}>
                        <IconButton
                            icon="robot"
                            size={60}
                            iconColor={theme.colors.primary}
                            style={styles.logoIcon}
                        />
                    </Surface>
                    <Text variant="headlineLarge" style={[styles.appName, { color: theme.colors.primary }]}>
                        ChatLLM
                    </Text>
                </View>
                
                <Text variant="titleLarge" style={[styles.title, { color: theme.colors.onSurface }]}>
                    {isNewUser ? 'Create Password' : 'Welcome Back'}
                </Text>
                
                <TextInput
                    mode="outlined"
                    label="Password"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    style={styles.input}
                    outlineStyle={styles.inputOutline}
                    activeOutlineColor={theme.colors.primary}
                    right={
                        <TextInput.Icon
                            icon={showPassword ? "eye-off" : "eye"}
                            onPress={() => setShowPassword(!showPassword)}
                        />
                    }
                />

                {isNewUser && (
                    <TextInput
                        mode="outlined"
                        label="Confirm Password"
                        secureTextEntry={!showConfirmPassword}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        style={styles.input}
                        outlineStyle={styles.inputOutline}
                        activeOutlineColor={theme.colors.primary}
                        right={
                            <TextInput.Icon
                                icon={showConfirmPassword ? "eye-off" : "eye"}
                                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                            />
                        }
                    />
                )}

                {error ? (
                    <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
                ) : null}

                <Button 
                    mode="contained"
                    onPress={handleSubmit}
                    style={styles.submitButton}
                    buttonColor={theme.colors.primary}
                    contentStyle={styles.buttonContent}
                >
                    {isNewUser ? 'Create Password' : 'Login'}
                </Button>

                {!isNewUser && !showDeleteConfirm && (
                    <Button 
                        mode="outlined"
                        onPress={() => setShowDeleteConfirm(true)}
                        style={styles.resetButton}
                        textColor={theme.colors.error}
                        rippleColor="rgba(255, 0, 0, 0.08)"
                    >
                        Reset Everything
                    </Button>
                )}

                {showDeleteConfirm && (
                    <DeleteConfirmation
                        onDelete={handleDelete}
                        onCancel={() => setShowDeleteConfirm(false)}
                    />
                )}
            </Surface>
        </View>
    );    
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    card: {
        width: '100%',
        maxWidth: 400,
        padding: 32,
        borderRadius: 28, 
        alignItems: 'center',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    logoBackground: {
        borderRadius: 80,
        marginBottom: 16,
    },
    logoIcon: {
        backgroundColor: 'transparent',
    },
    appName: {
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    title: {
        textAlign: 'center',
        marginBottom: 24,
    },
    input: {
        marginBottom: 16,
        width: '100%',
    },
    inputOutline: {
        borderRadius: 12,
    },
    errorText: {
        marginBottom: 16,
        textAlign: 'center',
    },
    submitButton: {
        marginBottom: 16,
        width: '100%',
        borderRadius: 12,
    },
    buttonContent: {
        paddingVertical: 6,
    },
    resetButton: {
        marginBottom: 8,
        width: '100%',
        borderRadius: 12,
    }
});
