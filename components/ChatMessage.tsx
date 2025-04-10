import React from 'react';
import { View, Text } from 'react-native';
import { Surface } from 'react-native-paper';
import { useTheme } from '../context/themeContext';
import Markdown from 'react-native-markdown-display';
import { createMarkdownStyles } from '@/utils/markdownStyles';

interface ChatMessageProps {
  message: string;
  isUser?: boolean;
  isStreaming?: boolean;
}

export const ChatMessage = ({ message, isUser = false, isStreaming = false }: ChatMessageProps) => {
  const { theme, isDarkMode } = useTheme();
  const markdownStyles = createMarkdownStyles(theme);
  
  if (isUser) {
    return (
      <View className="items-end my-1 mx-4 pb-0.5">
        <Surface
          className="max-w-[80%] px-4 py-2.5 rounded-message rounded-tr-sm bg-primary"
          elevation={0}
        >
          <View className="flex-shrink">
            <Markdown style={{
              body: {
                ...markdownStyles.body,
                color: theme.colors.onPrimary,
              }
            }}>
              {message}
            </Markdown>
          </View>
        </Surface>
      </View>
    );
  }

  return (
    <Surface
      className={`w-full py-5 my-0.5 ${isDarkMode ? 'bg-neutral-900' : 'bg-neutral-50'}`}
      elevation={0}
    >
      <View className="px-4 max-w-[800px] w-full self-center">
        <Markdown
          style={markdownStyles}
          rules={{
            code_block: (node, children, parent, styles) => (
              <View key={node.key} className="overflow-hidden" style={markdownStyles.code_block}>
                <Text className="text-white">
                  {children}
                </Text>
              </View>
            ),
          }}
        >
          {message}
        </Markdown>
        {isStreaming && (
          <View className={`h-1 w-[100px] mt-2 rounded-sm self-center bg-primary`} />
        )}
      </View>
    </Surface>
  );
};
