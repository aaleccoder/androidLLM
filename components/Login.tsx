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
import { DatabaseService } from '@/database/DatabaseService';

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
        router.replace('/ui/chat');
      }
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    }
  };

  const handleDelete = async () => {
    try {
      const dbService = new DatabaseService();
      await dbService.deleteAllData();
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
      <View className="flex-1 justify-center items-center px-4 py-8 bg-primary">
        <View className="w-full max-w-md bg-background rounded-3xl overflow-hidden shadow-2xl">
          <View className="px-8 py-10">
            {/* Logo & Title Section */}
            <View className="items-center mb-10">
              <View className="rounded-full p-6 mb-6 bg-accent shadow-lg">
                <Shield size={40} color="#ffffff" strokeWidth={2.5} />
              </View>
              <Text className="text-3xl font-bold mb-2 text-text">
                ChatLLM
              </Text>
              <Text className="text-sm text-center text-text/70">
                {isNewUser ? 'Create your secure password' : 'Welcome back'}
              </Text>
            </View>

            {/* Form Section */}
            <View className="space-y-4">
              <View className="space-y-3">
                <View className="rounded-2xl overflow-hidden bg-background border border-accent/20">
                  <PasswordInput
                    placeholder="Password"
                    password={password}
                    setPassword={setPassword}
                    autoFocus={false}
                  />
                </View>
                
                {isNewUser && (
                  <View className="rounded-2xl overflow-hidden bg-background border border-accent/20">
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
                <View className="flex-row items-center px-2 py-2">
                  <AlertTriangle size={16} color="#ef4444" />
                  <Text className="text-red-500 ml-2 text-xs">
                    {error}
                  </Text>
                </View>
              )}

              {/* Action Buttons */}
              <View className="space-y-8 mt-6">
                <TouchableOpacity
                  className="flex-row items-center justify-center py-3.5 rounded-2xl bg-accent shadow-lg mb-5"
                  onPress={handleSubmit}
                >
                  {isNewUser ? 
                    <UserPlus size={20} color="#ffffff" strokeWidth={2.5} /> : 
                    <LogIn size={20} color="#ffffff" strokeWidth={2.5} />
                  }
                  <Text className="text-white font-bold ml-2">
                    {isNewUser ? 'Create Password' : 'Login'}
                  </Text>
                </TouchableOpacity>
                
                {!isNewUser && (
                  <TouchableOpacity
                    className="flex-row items-center justify-center py-3.5 rounded-2xl border border-red-400/30"
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      setShowDeleteConfirm(true);
                    }}
                  >
                    <Text className="text-red-400 text-sm">
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