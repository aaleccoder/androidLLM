import React from 'react';
import { StyleSheet } from 'react-native';
import { View } from 'tamagui';
import { useTheme } from '../context/themeContext';
import Markdown from 'react-native-markdown-display';

interface ChatMessageProps {
  content: string;
  role: 'user' | 'assistant';
  isLast?: boolean;
  isGenerating?: boolean;
}

export const ChatMessage = ({ content, role, isLast = false, isGenerating = false }: ChatMessageProps) => {
  const { isDarkMode, theme } = useTheme();
  const isUser = role === 'user';
  
  // Define markdown styles directly here until we fix the markdownStyles utility
  const mdStyles = {
    user: StyleSheet.create({
      body: {
        color: "#FFFFFF",
        fontSize: 16,
        lineHeight: 24,
      },
      heading1: {
        color: "#FFFFFF",
        fontWeight: "bold",
        fontSize: 24,
        marginBottom: 8,
      },
      heading2: {
        color: "#FFFFFF",
        fontWeight: "bold",
        fontSize: 20,
        marginTop: 16,
        marginBottom: 8,
      },
      code_block: {
        backgroundColor: "rgba(0, 0, 0, 0.1)",
        padding: 12,
        borderRadius: 8,
      },
      code_inline: {
        backgroundColor: "rgba(0, 0, 0, 0.1)",
        padding: 4,
        borderRadius: 4,
      },
      link: {
        color: "#B5FCCD",
        textDecorationLine: "underline",
      },
      bullet_list: {
        marginVertical: 8,
      },
      bullet_list_item: {
        marginVertical: 4,
      }
    }),
    assistant: StyleSheet.create({
      body: {
        color: isDarkMode ? "#FFFFFF" : "#000000",
        fontSize: 16,
        lineHeight: 24,
      },
      heading1: {
        color: isDarkMode ? "#FFFFFF" : "#000000",
        fontWeight: "bold",
        fontSize: 24,
        marginBottom: 8,
      },
      heading2: {
        color: isDarkMode ? "#FFFFFF" : "#000000",
        fontWeight: "bold",
        fontSize: 20,
        marginTop: 16,
        marginBottom: 8,
      },
      code_block: {
        backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
        padding: 12,
        borderRadius: 8,
      },
      code_inline: {
        backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
        padding: 4,
        borderRadius: 4,
      },
      link: {
        color: "#3A59D1",
        textDecorationLine: "underline",
      },
      bullet_list: {
        marginVertical: 8,
      },
      bullet_list_item: {
        marginVertical: 4,
      }
    })
  };
  
  return (
    <View style={[
      styles.messageContainer,
      isUser
        ? [styles.userMessage, { backgroundColor: isDarkMode ? '#3A59D1' : '#d1e3ff' }]
        : [styles.assistantMessage, { backgroundColor: isDarkMode ? '#333' : '#f5f5f5' }],
    ]}>
      {isUser ? (
        <View style={styles.textContent}>
          <Markdown style={mdStyles.user}>
            {content}
          </Markdown>
        </View>
      ) : (
        <View style={styles.textContent}>
          <Markdown style={mdStyles.assistant}>
            {content}
          </Markdown>
          {isLast && isGenerating && (
            <View
              style={[
                styles.cursor,
                { backgroundColor: isDarkMode ? '#fff' : '#000' }
              ]}
            />
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  messageContainer: {
    borderRadius: 16,
    paddingHorizontal: 16, 
    paddingVertical: 12,
    marginVertical: 4,
    maxWidth: '85%',
    alignSelf: 'flex-start',
  },
  userMessage: {
    alignSelf: 'flex-end',
  },
  assistantMessage: {
    alignSelf: 'flex-start',
  },
  textContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cursor: {
    width: 2,
    height: 16,
    marginLeft: 4,
    marginTop: 3,
  },
});
