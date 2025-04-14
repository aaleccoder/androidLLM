/**
 * Main Entry/Login Screen
 * 
 * This component handles:
 * - New user registration with password creation
 * - Existing user authentication
 * - Account deletion functionality
 * - Themed UI presentation with React Native Paper components
 */
import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/themeContext';
import { useAuth } from '../hooks/useAuth';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { PasswordInput } from '../components/PasswordInput';
import { StatusBar } from 'expo-status-bar';
import { Text as PaperText, Button as PaperButton } from 'react-native-paper';

// Import Lucide icons
import { Lock, LogIn, User, UserPlus } from 'lucide-react-native';

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
      <View
        className="flex-1 justify-center items-center p-6"
        style={{ backgroundColor: isDarkMode ? '#121212' : '#F5F5F5' }}
      >
        <View
          className="w-full max-w-md p-8 rounded-xl shadow-xl"
          style={{
            backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF',
            shadowColor: isDarkMode ? '#000000' : '#DDDDDD',
            shadowOpacity: 0.8,
            shadowRadius: 10,
          }}
        >
          <View className="space-y-4 items-center">
            <View
              className="rounded-full p-4"
              style={{ backgroundColor: isDarkMode ? '#2A2A2A' : '#F0F0F0' }}
            >
              <User size={40} />
            </View>
            <PaperText className="text-4xl font-bold" style={{ color: '#3A59D1' }}>
              ChatLLM
            </PaperText>
            <PaperText
              className="text-xl text-center"
              style={{ color: isDarkMode ? '#E0E0E0' : '#424242' }}
            >
              {isNewUser ? 'Create Password' : 'Welcome Back'}
            </PaperText>
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
              <PaperText className="text-red-500 text-center">
                {error}
              </PaperText>
            )}
            <PaperButton
              mode="contained"
              onPress={handleSubmit}
              style={{ backgroundColor: '#3A59D1', borderRadius: 8, width: '100%' }}
              labelStyle={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 }}
            >
              {isNewUser ? 'Create Password' : 'Login'}
            </PaperButton>
            {!isNewUser && !showDeleteConfirm && (
              <PaperButton
                mode="contained"
                onPress={() => setShowDeleteConfirm(true)}
                style={{ backgroundColor: '#EF4444', borderRadius: 8, width: '100%' }}
                labelStyle={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 }}
              >
                Reset Everything
              </PaperButton>
            )}
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
