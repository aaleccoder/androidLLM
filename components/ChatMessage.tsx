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
        fontWeight: '500', // Make user messages slightly bolder
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
        fontWeight: '400', // Keep assistant messages regular weight
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
        ? [styles.userMessage, { 
            backgroundColor: isDarkMode ? '#3A59D1' : '#3A59D1',
            borderTopRightRadius: 4,
            borderBottomRightRadius: 4,
            shadowColor: isDarkMode ? '#3A59D1' : '#3A59D1',
            shadowOffset: { width: 1, height: 2 },
            shadowOpacity: 0.4,
            shadowRadius: 4,
            elevation: 4,
            borderLeftWidth: 0,
            marginLeft: 40 // Add margin to push user messages to the right
          }]
        : [styles.assistantMessage, { 
            backgroundColor: isDarkMode ? '#2A2A2A' : '#FFFFFF',
            borderTopLeftRadius: 4,
            borderBottomLeftRadius: 4,
            shadowColor: isDarkMode ? '#000' : '#ccc',
            shadowOffset: { width: -1, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 3,
            elevation: 2,
            borderRightWidth: 0,
            marginRight: 40, // Add margin to push assistant messages to the left
            borderLeftWidth: 3,
            borderLeftColor: isDarkMode ? '#3A59D1' : '#3A59D1' // Add accent line
          }],
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
    marginVertical: 6, // Increased vertical spacing between messages
    maxWidth: '85%',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'transparent',
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
