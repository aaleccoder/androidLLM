import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Surface } from 'react-native-paper';
import { useTheme } from '../context/themeContext';
import Markdown from 'react-native-markdown-display';
import { createMarkdownStyles } from '@/utils/markdownStyles';

interface ChatMessageProps {
  message: string;
  isUser?: boolean;
}

export const ChatMessage = ({ message, isUser = false }: ChatMessageProps) => {
  const { theme, isDarkMode } = useTheme();
  const markdownStyles = createMarkdownStyles(theme);
  
  if (isUser) {
    return (
      <View style={styles.userMessageWrapper}>
        <Surface
          style={[
            styles.userMessageBubble,
            {
              backgroundColor: theme.colors.primary,
              borderTopRightRadius: 4,
            }
          ]}
          elevation={0}
        >
          <View style={styles.messageContent}>
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
      style={[
        styles.botMessageContainer,
        {
          backgroundColor: isDarkMode ? '#1E1E1E' : '#F7F7F8',
        }
      ]}
      elevation={0}
    >
      <View style={styles.botMessageContent}>
        <Markdown
          style={markdownStyles}
          rules={{
            code_block: (node, children, parent, styles) => (
              <View key={node.key} style={[markdownStyles.code_block, { overflow: 'hidden' }]}> {/* Use markdownStyles explicitly */}
                <Text style={{ color: '#FFFFFF' }}> {/* Ensure text color is white */}
                  {children}
                </Text>
              </View>
            ),
          }}
        >
          {message}
        </Markdown>
      </View>
    </Surface>
  );
};

const styles = StyleSheet.create({
  userMessageWrapper: {
    alignItems: 'flex-end',
    marginVertical: 4,
    marginHorizontal: 16,
    paddingBottom: 2,
  },
  userMessageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  messageContent: {
    flexShrink: 1,
  },
  botMessageContainer: {
    width: '100%',
    paddingVertical: 20,
    marginVertical: 2,
  },
  botMessageContent: {
    paddingHorizontal: 16,
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
  }
});
