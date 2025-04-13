/**
 * Main Entry/Login Screen
 * 
 * This component handles:
 * - New user registration with password creation
 * - Existing user authentication
 * - Account deletion functionality
 * - Themed UI presentation with Tamagui components
 */
import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/themeContext';
import { useAuth } from '../hooks/useAuth';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { PasswordInput } from '../components/PasswordInput';
import { StatusBar } from 'expo-status-bar';

// Import Lucide icons
import { Lock, LogIn, User, UserPlus } from 'lucide-react-native';

// Import Tamagui components instead of Gluestack UI
import { 
  View, 
  YStack, 
  XStack, 
  Separator, 
  Text, 
  Button
} from 'tamagui';

export default function App() {
  const { isDarkMode } = useTheme();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { isNewUser, error, setError, validateAndSavePassword, deleteAllData } = useAuth();

  const handleSubmit = async () => {
    try {
      const success = await validateAndSavePassword(password, isNewUser ? confirmPassword : undefined);
      if (success) {
        router.push('/ui/chat');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    }
  };

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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <YStack
        flex={1}
        justifyContent="center"
        alignItems="center"
        padding="$6"
        backgroundColor={isDarkMode ? '$backgroundDark' : '$backgroundLight'}
      >
        <View
          width="100%"
          maxWidth={400}
          padding="$8"
          borderRadius="$4"
          backgroundColor={isDarkMode ? '$cardDark' : '$cardLight'}
          shadowColor={isDarkMode ? '$shadowDark' : '$shadowLight'}
          shadowOpacity={0.2}
          shadowRadius={10}
        >
          <YStack space="$4" alignItems="center">
            <View
              borderRadius={25}
              padding="$4"
              backgroundColor={isDarkMode ? '$iconBackgroundDark' : '$iconBackgroundLight'}
            >
              <User size={40} color="$primary" />
            </View>
            <Text fontSize="$8" fontWeight="bold" color="$primary">
              ChatLLM
            </Text>
            <Text fontSize="$6" textAlign="center" color={isDarkMode ? '$textDark' : '$textLight'}>
              {isNewUser ? 'Create Password' : 'Welcome Back'}
            </Text>
            <PasswordInput
              placeholder="Password"
              password={password}
              setPassword={setPassword}
              autoFocus={false} // explicitly set to false
            />
            {isNewUser && (
              <PasswordInput
                placeholder="Confirm Password"
                password={confirmPassword}
                setPassword={setConfirmPassword}
                autoFocus={false} // explicitly set to false
              />
            )}
            {error && (
              <Text color="$error" textAlign="center">
                {error}
              </Text>
            )}
            <Button
              onPress={handleSubmit}
              backgroundColor="$primary"
              borderRadius="$4"
              padding="$3"
              width="100%"
            >
              <Text color="$buttonText" fontWeight="bold">
                {isNewUser ? 'Create Password' : 'Login'}
              </Text>
            </Button>
            {!isNewUser && !showDeleteConfirm && (
              <Button
                onPress={() => setShowDeleteConfirm(true)}
                backgroundColor="$secondary"
                borderRadius="$4"
                padding="$3"
                width="100%"
              >
                <Text color="$buttonText" fontWeight="bold">
                  Reset Everything
                </Text>
              </Button>
            )}
          </YStack>
        </View>
      </YStack>
    </KeyboardAvoidingView>
  );
}
