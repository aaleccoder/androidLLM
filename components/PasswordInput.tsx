import React from 'react';
import { TextInput, TextInputProps } from 'react-native';

interface PasswordInputProps {
  placeholder: string;
  password?: string;
  setPassword: (password: string) => void;
  autoFocus?: boolean;
}

export const PasswordInput: React.FC<PasswordInputProps> = ({ 
  placeholder, 
  password, 
  setPassword, 
  autoFocus 
}) => {

  return (
    <TextInput
      placeholder={placeholder}
      secureTextEntry
      value={password}
      onChangeText={setPassword}
      autoFocus={autoFocus}
      className={`
        text-base px-4 py-3
        bg-background text-text
      rounded-md border-accent`}
      placeholderTextColor='#666'
      selectionColor='#EBE9FC'
    />
  );
};
