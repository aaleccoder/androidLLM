import React from 'react';
import { View, Text } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { markdownStyles } from '../utils/markdownStyles';

interface ChatMessageProps {
  content: string;
  role: 'user' | 'assistant';
  isLast?: boolean;
  isGenerating?: boolean;
}

export const ChatMessage = ({ content, role, isLast = false, isGenerating = false }: ChatMessageProps) => {
  const isUser = role === 'user';
  
  // Get appropriate markdown styles based on role
  const mdStyles = markdownStyles(role);

  return (
    <View className={`${isUser ? 'self-end ml-16' : 'self-start w-full'} mb-3`}>
      <View
        className={`
          px-2.5 py-1.5 rounded-xl
          ${isUser 
            ? 'bg-blue-600 rounded-tr-sm rounded-br-sm shadow-sm shadow-blue-800/20' 
            : 'bg-zinc-700 rounded-lg shadow-sm shadow-black/20 border-l-3 border-l-blue-600'
          }
        `}
      >
        <Markdown
          style={isUser ? mdStyles.user : mdStyles.assistant}
        >
          {content}
        </Markdown>
        
        {isLast && isGenerating && (
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
