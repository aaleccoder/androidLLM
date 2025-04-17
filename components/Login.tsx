/**
 * Login Screen Component
 * 
 * This component handles:
 * - New user registration with password creation
 * - Existing user authentication
 */
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { KeyboardAvoidingView, Platform, View, TouchableOpacity } from 'react-native';
import { PasswordInput } from './PasswordInput';
import { StatusBar } from 'expo-status-bar';
import { Text } from 'react-native';
import { Shield, AlertTriangle, UserPlus, LogIn } from 'lucide-react-native';
import { DeleteConfirmation } from './DeleteConfirmation';

export function Login() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { isNewUser, error, setError, validateAndSavePassword, deleteAllData } = useAuth();

  const handleSubmit = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const success = await validateAndSavePassword(password, isNewUser ? confirmPassword : undefined);
      if (success) {
        router.push('/ui/chat');
      }
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteAllData();
      setShowDeleteConfirm(false);
      setError('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(err instanceof Error ? err.message : 'Failed to delete data');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <StatusBar style="light" />
      <View className="flex-1 justify-center items-center px-8 py-12 bg-zinc-900">
        <View className="w-full max-w-md rounded-3xl overflow-hidden elevation-5 bg-zinc-800">
          <View className="px-10 py-12 w-full">
            {/* Logo & App Title Section */}
            <View className="items-center mb-12">
              <View className="rounded-full p-7 mb-6 bg-zinc-700">
                <Shield size={48} color="#fff" />
              </View>
              <Text className="text-3xl font-bold mb-3 text-zinc-100">
                ChatLLM
              </Text>
              <Text className="text-base text-center opacity-80 text-zinc-300">
                {isNewUser ? 'Create your secure password' : 'Welcome back'}
              </Text>
            </View>

            {/* Form Section */}
            <View>
              <View className="mb-6">
                <View className="rounded-xl overflow-hidden mb-4 bg-zinc-700 border-zinc-400 border">
                  <PasswordInput
                    placeholder="Password"
                    password={password}
                    setPassword={setPassword}
                    autoFocus={false}
                  />
                </View>
                
                {isNewUser && (
                  <View className="rounded-xl overflow-hidden bg-zinc-700">
                    <PasswordInput
                      placeholder="Confirm Password"
                      password={confirmPassword}
                      setPassword={setConfirmPassword}
                      autoFocus={false}
                    />
                  </View>
                )}
              </View>

              {/* Error Message */}
              {error && (
                <View className="flex-row items-center px-2 py-2 mb-4">
                  <AlertTriangle size={18} color="rgb(239 68 68)" />
                  <Text className="text-red-500 ml-2 text-sm">
                    {error}
                  </Text>
                </View>
              )}

              {/* Action Buttons */}
              <View className="mt-6">
                <TouchableOpacity
                  className="flex-row items-center justify-center py-3 rounded-3xl mb-4 bg-blue-600"
                  onPress={handleSubmit}
                >
                  {isNewUser ? <UserPlus size={24} color="white" /> : <LogIn size={24} color="white" />}
                  <Text className="text-white font-bold ml-2">
                    {isNewUser ? 'Create Password' : 'Login'}
                  </Text>
                </TouchableOpacity>
                
                {!isNewUser && (
                  <TouchableOpacity
                    className="flex-row items-center justify-center py-3 rounded-3xl border border-red-400"
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      setShowDeleteConfirm(true);
                    }}
                  >
                    <Text className="text-red-400">
                      Reset All Data
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <DeleteConfirmation
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onDelete={handleDelete}
          title="Reset Application Data"
          message="This will delete all your saved conversations and settings. This action cannot be undone."
        />
      )}
    </KeyboardAvoidingView>
  );
}