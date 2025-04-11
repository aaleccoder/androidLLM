import React from 'react';
import { Box } from '@gluestack-ui/themed';
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
      <Box className="items-end my-1 mx-4 pb-0.5">
        <Box
          className={`max-w-[80%] px-4 py-2.5 rounded-message rounded-tr-sm ${
            isDarkMode ? 'bg-accent-500' : 'bg-primary-600'
          }`}
          style={{ elevation: 1 }}
        >
          <Box className="flex-shrink">
            <Markdown style={{
              body: {
                ...markdownStyles.body,
                color: '#FFFFFF', // User messages always white for contrast
              }
            }}>
              {message}
            </Markdown>
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      className={`w-full py-5 my-0.5 ${isDarkMode ? 'bg-neutral-900' : 'bg-neutral-50'}`}
    >
      <Box className="px-4 max-w-[800px] w-full self-center">
        <Markdown
          style={{
            ...markdownStyles,
            body: {
              ...markdownStyles.body,
            },
            code_block: {
              ...markdownStyles.code_block,
            },
            code_inline: {
              ...markdownStyles.code_inline,
            },
          }}
          rules={{
            code_block: (node, children, parent, styles) => (
              <Box key={node.key} className="overflow-hidden rounded-xl" style={styles}>
                {children}
              </Box>
            ),
          }}
        >
          {message}
        </Markdown>
        {isStreaming && (
          <Box className={`h-1 w-[100px] mt-2 rounded-sm ${
            isDarkMode ? 'bg-accent-500' : 'bg-primary-600'
          }`} />
        )}
      </Box>
    </Box>
  );
};
