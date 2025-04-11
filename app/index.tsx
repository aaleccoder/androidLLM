/**
 * Main Entry/Login Screen
 * 
 * This component handles:
 * - New user registration with password creation
 * - Existing user authentication
 * - Account deletion functionality
 * - Themed UI presentation with GlueStack UI
 */
import React, { useState } from 'react';
import { useNavigation } from 'expo-router';
import { useTheme } from '../context/themeContext';
import { useAuth } from '../hooks/useAuth';

// Import Lucide icons
import { Lock, Eye, EyeOff, AlertTriangle, Trash, Bot } from 'lucide-react-native';

import {
  Box,
  VStack,
  Heading,
  Text,
  Input,
  InputField,
  InputSlot,
  Button,
  ButtonText,
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  Center,
  HStack
} from "@gluestack-ui/themed";

/**
 * Entry point component - handles login and registration
 */
const Page: React.FC = () => {
  const { isDarkMode } = useTheme();
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
    <Box className={`flex-1 justify-center items-center p-6 ${isDarkMode ? 'bg-neutral-950' : 'bg-neutral-50'}`}>
      <Center className="w-full max-w-md">
        <Box className={`w-full p-8 rounded-3xl ${isDarkMode ? 'bg-neutral-900' : 'bg-neutral-100'} shadow-md`}>
          <VStack space="lg" alignItems="center">
            {/* Logo and App Title */}
            <Center className="mb-6">
              <Box className={`rounded-full p-6 ${isDarkMode ? 'bg-neutral-800' : 'bg-neutral-200'} mb-4`}>
                <Bot size={40} color="#6366F1" />
              </Box>
              <Heading size="2xl" className="font-bold text-accent-400">
                ChatLLM
              </Heading>
            </Center>

            {/* Title */}
            <Heading className={`mb-6 text-center ${isDarkMode ? 'text-neutral-100' : 'text-neutral-900'}`}>
              {isNewUser ? 'Create Password' : 'Welcome Back'}
            </Heading>

            {/* Password Field */}
            <Input
              className="w-full mb-4 rounded-xl"
              variant="outline"
              size="lg"
            >
              <InputSlot pl="$3">
                <Lock size={20} color="#6366F1" />
              </InputSlot>
              <InputField
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                className={isDarkMode ? 'text-neutral-100' : 'text-neutral-900'}
                placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
              />
              <InputSlot pr="$3" onPress={() => setShowPassword(!showPassword)}>
                {showPassword ?
                  <EyeOff size={20} color={isDarkMode ? "#6B7280" : "#9CA3AF"} /> :
                  <Eye size={20} color={isDarkMode ? "#6B7280" : "#9CA3AF"} />
                }
              </InputSlot>
            </Input>

            {/* Confirm Password Field (for new users) */}
            {isNewUser && (
              <Input
                className="w-full mb-4 rounded-xl"
                variant="outline"
                size="lg"
              >
                <InputSlot pl="$3">
                  <Lock size={20} color="#6366F1" />
                </InputSlot>
                <InputField
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  className={isDarkMode ? 'text-neutral-100' : 'text-neutral-900'}
                  placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
                />
                <InputSlot pr="$3" onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  {showConfirmPassword ?
                    <EyeOff size={20} color={isDarkMode ? "#6B7280" : "#9CA3AF"} /> :
                    <Eye size={20} color={isDarkMode ? "#6B7280" : "#9CA3AF"} />
                  }
                </InputSlot>
              </Input>
            )}

            {/* Error Message */}
            {error ? (
              <Text className="text-error-500 text-center mb-4">{error}</Text>
            ) : null}

            {/* Submit Button */}
            <Button
              className="w-full rounded-xl mb-4"
              size="lg"
              onPress={handleSubmit}
            >
              <ButtonText>
                {isNewUser ? 'Create Password' : 'Login'}
              </ButtonText>
            </Button>

            {/* Reset Button (only for existing users) */}
            {!isNewUser && !showDeleteConfirm && (
              <Button
                variant="outline"
                className="w-full rounded-xl"
                size="lg"
                action="negative"
                onPress={() => setShowDeleteConfirm(true)}
              >
                <Trash size={18} color="#DC2626" style={{ marginRight: 8 }} />
                <ButtonText>Reset Everything</ButtonText>
              </Button>
            )}
          </VStack>
        </Box>
      </Center>

      {/* Delete Confirmation Dialog */}
      <AlertDialog isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)}>
        <AlertDialogBackdrop />
        <AlertDialogContent className={`rounded-3xl m-4 ${isDarkMode ? 'bg-neutral-900' : 'bg-neutral-100'}`}>
          <AlertDialogHeader>
            <HStack space="sm" alignItems="center">
              <AlertTriangle size={24} color="#DC2626" />
              <Heading size="lg" className={isDarkMode ? 'text-neutral-100' : 'text-neutral-900'}>Delete All Data</Heading>
            </HStack>
          </AlertDialogHeader>
          <AlertDialogBody>
            <Text className={isDarkMode ? 'text-neutral-300' : 'text-neutral-700'}>
              This will delete all your data permanently! This action cannot be undone.
            </Text>
          </AlertDialogBody>
          <AlertDialogFooter className="gap-3">
            <Button
              variant="outline"
              action="secondary"
              onPress={() => setShowDeleteConfirm(false)}
              className="flex-1"
            >
              <ButtonText>Cancel</ButtonText>
            </Button>
            <Button
              action="negative"
              onPress={handleDelete}
              className="flex-1"
            >
              <Trash size={18} color="white" style={{ marginRight: 8 }} />
              <ButtonText>Yes, Delete Everything</ButtonText>
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Box>
  );
};

export default Page;
