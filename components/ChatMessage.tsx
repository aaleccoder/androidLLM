import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../context/themeContext';
import Markdown from 'react-native-markdown-display';
import { markdownStyles } from '../utils/markdownStyles';

interface ChatMessageProps {
  content: string;
  role: 'user' | 'assistant';
  isLast?: boolean;
  isGenerating?: boolean;
}

const LoadingBubble = ({ isDarkMode }: { isDarkMode: boolean }) => {
  const [dots, setDots] = React.useState('');

  React.useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => (prev.length < 3 ? prev + '.' : ''));
    }, 500); // Update every 500ms

    return () => clearInterval(interval);
  }, []);

  return (
    <View className="flex-row items-center h-6 px-3">
      <Text className={isDarkMode ? 'text-white text-lg' : 'text-black text-lg'}>
        {dots || '.'}
      </Text>
    </View>
  );
};

export const ChatMessage = ({ content, role, isLast = false, isGenerating = false }: ChatMessageProps) => {
  const { isDarkMode } = useTheme();
  const isUser = role === 'user';
  
  // Get appropriate markdown styles based on role and theme
  const mdStyles = markdownStyles(isDarkMode, role);

  return (
    <View className={`${isUser ? 'self-end ml-16' : 'self-start w-full'} mb-3`}>
      <View
        className={`
          px-2.5 py-1.5 rounded-xl
          ${isUser 
            ? 'bg-blue-600 rounded-tr-sm rounded-br-sm shadow-sm shadow-blue-800/20' 
            : isDarkMode 
              ? 'bg-zinc-700 rounded-lg shadow-sm shadow-black/20 border-l-3 border-l-blue-600' 
              : 'bg-zinc-100 rounded-lg shadow-sm shadow-black/10 border-l-3 border-l-blue-600'
          }
        `}
      >
        {content ? (
          <Markdown
            style={isUser ? mdStyles.user : mdStyles.assistant}
          >
            {content}
          </Markdown>
        ) : isLast && isGenerating ? (
          <LoadingBubble isDarkMode={isDarkMode} />
        ) : null}
        
        {content && isLast && isGenerating && (
          <View
            className={`
              w-0.5 h-2.5 ml-0.5 mt-0.5
              bg-white
              animate-pulse
            `}
          />
        )}
      </View>
    </View>
  );
};
