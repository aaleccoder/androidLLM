import { StyleSheet } from "react-native";

/**
 * Creates markdown styles for chat messages based on theme and role
 * @param role - The role of the message sender (user or assistant)
 */
export const markdownStyles = (role: 'user' | 'assistant') => {
  // Color palette from tailwind.config.js
  const palette = {
    text: '#EBE9FC',
    userText: '#181818',
    background: '#1E1E1E',
    primary: '#181818',
    accent: '#61BA82',
  };

  // Role-based accent for links/code
  const accentColor = palette.accent;
  const textColor = role === 'user' ? palette.userText : palette.text;
  const codeBg = palette.background;

  // Base styles for text elements
  const baseStyles = {
    body: {
      color: textColor,
      fontSize: 14,
      lineHeight: 22,
      fontFamily: 'System',
    },
    paragraph: {
      color: textColor,
      marginVertical: 8,
      fontSize: 14,
      lineHeight: 22,
      fontFamily: 'System',
    },
    heading1: {
      color: textColor,
      fontWeight: 'bold' as const,
      fontSize: 18,
      marginBottom: 10,
      marginTop: 18,
      lineHeight: 26,
      fontFamily: 'System',
    },
    heading2: {
      color: textColor,
      fontWeight: 'bold' as const,
      fontSize: 16,
      marginTop: 14,
      marginBottom: 8,
      lineHeight: 24,
      fontFamily: 'System',
    },
    code_block: {
      backgroundColor: codeBg,
      padding: 12,
      borderRadius: 8,
      fontFamily: 'monospace',
      fontSize: 13,
      color: textColor, // Use role-based text color for code blocks
      marginVertical: 10,
    },
    fence: {
      backgroundColor: codeBg,
      padding: 12,
      borderRadius: 8,
      fontFamily: 'monospace',
      fontSize: 13,
      color: textColor, // Use role-based text color for code blocks
      marginVertical: 10,
    },
    code_inline: {
      backgroundColor: codeBg,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      fontFamily: 'monospace',
      fontSize: 13,
      color: accentColor,
    },
    link: {
      color: accentColor,
      textDecorationLine: 'underline' as const,
      fontSize: 14,
    },
    bullet_list_item: {
      color: textColor,
      fontSize: 14,
      marginVertical: 4,
      lineHeight: 22,
      fontFamily: 'System',
    },
    ordered_list_item: {
      color: textColor,
      fontSize: 14,
      marginVertical: 4,
      lineHeight: 22,
      fontFamily: 'System',
    },
    strong: {
      fontWeight: 'bold' as const,
      color: textColor,
      fontSize: 14,
    },
    em: {
      fontStyle: 'italic' as const,
      color: textColor,
      fontSize: 14,
    },
  };

  return {
    user: StyleSheet.create(baseStyles),
    assistant: StyleSheet.create(baseStyles),
  };
};
