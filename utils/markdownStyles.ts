import { StyleSheet } from "react-native";

export const markdownStyles = (isDarkMode: boolean, theme: any) => {
  return {
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
        color: theme?.colors?.primary || "#3A59D1",
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
};
