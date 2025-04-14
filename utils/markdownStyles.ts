import { StyleSheet } from "react-native";

/**
 * Creates markdown styles for chat messages based on theme and role
 * @param isDarkMode - Whether dark mode is enabled
 * @param role - The role of the message sender (user or assistant)
 */
export const markdownStyles = (isDarkMode: boolean, role: 'user' | 'assistant') => {
  // Common styles for all elements
  const baseTextColor = {
    user: "#FFFFFF", // User messages always have white text
    assistant: isDarkMode ? "#FFFFFF" : "#111827" // Assistant messages: white in dark mode, dark in light mode
  };

  // Background colors for code blocks and inline code
  const codeBackgroundColor = {
    user: "rgba(0, 0, 0, 0.25)",
    assistant: isDarkMode ? "rgba(0, 0, 0, 0.25)" : "rgba(0, 0, 0, 0.05)"
  };

  // Link colors
  const linkColor = {
    user: "#B5FCCD", // Accent color for user messages
    assistant: isDarkMode ? "#3A59D1" : "#3A59D1" // Primary blue for assistant messages
  };

  // Base styles for text elements with smaller fonts
  const baseStyles = (textColor: any) => ({
    body: {
      color: textColor,
      fontSize: 11,
      lineHeight: 16,
    },
    paragraph: {
      color: textColor,
      marginVertical: 6,
      fontSize: 11,
      lineHeight: 16,
    },
    heading1: {
      color: textColor,
      fontWeight: "bold" as const,
      fontSize: 11,
      marginBottom: 6,
      marginTop: 10,
    },
    heading2: {
      color: textColor,
      fontWeight: "bold" as const,
      fontSize: 11,
      marginTop: 8,
      marginBottom: 4,
    },
    code_block: {
      backgroundColor: role === 'user' ? codeBackgroundColor.user : codeBackgroundColor.assistant,
      padding: 8,
      borderRadius: 6,
      fontFamily: "monospace",
      fontSize: 10,
      color: textColor,
      marginVertical: 6,
    },
    code_inline: {
      backgroundColor: role === 'user' ? codeBackgroundColor.user : codeBackgroundColor.assistant,
      padding: 2,
      borderRadius: 3,
      fontFamily: "monospace",
      fontSize: 10,
      color: textColor,
    },
    link: {
      color: role === 'user' ? linkColor.user : linkColor.assistant,
      textDecorationLine: "underline" as const,
      fontSize: 11,
    },
    bullet_list_item: {
      color: textColor,
      fontSize: 11,
      marginVertical: 2,
    },
    ordered_list_item: {
      color: textColor,
      fontSize: 11,
      marginVertical: 2,
    },
    strong: {
      fontWeight: "bold" as const,
      color: textColor,
      fontSize: 11,
    },
    em: {
      fontStyle: "italic" as const,
      color: textColor,
      fontSize: 11,
    },
  });

  // Create styles for user and assistant
  const userStyles = StyleSheet.create(baseStyles(baseTextColor.user));
  const assistantStyles = StyleSheet.create(baseStyles(baseTextColor.assistant));

  return { user: userStyles, assistant: assistantStyles };
};
