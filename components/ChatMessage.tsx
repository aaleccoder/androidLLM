import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Copy, Check } from 'lucide-react-native';
import Markdown from 'react-native-markdown-display';
import { markdownStyles } from '../utils/markdownStyles';
import { tokenizeCode, Token, TokenType } from '../utils/simpleSyntaxHighlight';

interface ChatMessageProps {
  content: string;
  role: 'user' | 'assistant';
  isLast?: boolean;
  isGenerating?: boolean;
}

// Atom One Dark color map for token types
const tokenColors: Record<TokenType, string> = {
  keyword: '#c678dd',
  string: '#98c379',
  comment: '#5c6370',
  number: '#d19a66',
  identifier: '#abb2bf',
  operator: '#56b6c2',
  punctuation: '#abb2bf',
  whitespace: '#abb2bf',
  default: '#abb2bf',
};

// Extracted CodeBlock component for code fences
const CodeBlock = ({ code, language }: { code: string; language: string }) => {
  const [copied, setCopied] = useState(false);
  const tokens = tokenizeCode(code, language);
  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
    // TODO: Add clipboard copy logic if needed
  };
  return (
    <View style={{ backgroundColor: '#282c34', borderRadius: 8, padding: 12, marginVertical: 10 }}>
      <TouchableOpacity
        onPress={handleCopy}
        accessibilityLabel="Copy code to clipboard"
        style={{ position: 'absolute', top: 8, right: 8, zIndex: 10, padding: 4 }}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        {copied ? <Check size={18} color="#98c379" /> : <Copy size={18} color="#abb2bf" />}
      </TouchableOpacity>
      <Text style={{ fontFamily: 'monospace', fontSize: 13, flexWrap: 'wrap', color: '#abb2bf' }}>
        {tokens.map((token, i) => (
          <Text key={i} style={{ color: tokenColors[token.type] }}>
            {token.text}
          </Text>
        ))}
      </Text>
    </View>
  );
};

// Custom rule for code blocks (fence)
const rules = {
  fence: (
    node: { content: string; info?: string },
    children: any,
    parent: any,
    styles: any
  ) => {
    const code = node.content;
    const language = node.info ? node.info.split(' ')[0] : 'text';
    return <CodeBlock code={code} language={language} />;
  },
};

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
            ? 'bg-accent rounded-tr-sm rounded-br-sm shadow-sm shadow-accent/20 text-primary' 
            : 'bg-background rounded-lg shadow-sm shadow-black/20 border-l-3 border-l-accent text-text'
          }
        `}
      >
        <Markdown
          style={isUser ? mdStyles.user : mdStyles.assistant}
          rules={rules}
        >
          {content}
        </Markdown>
        
        {isLast && isGenerating && (
          <View
            className={`
              w-0.5 h-2.5 ml-0.5 mt-0.5
              bg-text
              animate-pulse
            `}
          />
        )}
      </View>
    </View>
  );
};
