import { StyleSheet } from 'react-native';
import { MD3Theme } from 'react-native-paper';

export const createMarkdownStyles = (theme: MD3Theme) => StyleSheet.create({
  // Base styles
  body: {
    color: theme.dark ? '#E1E1E1' : '#1A1A1A',
    fontSize: 16,
    lineHeight: 24,
  },
  
  // Code elements
  code_block: {
    backgroundColor: '#000000', // Set background to black
    color: '#FFFFFF', // Set text color to white
    padding: 16,
    borderRadius: 6,
    fontFamily: 'monospace',
    marginVertical: 12,
    width: '100%',
  },
  code_inline: {
    backgroundColor: theme.dark ? '#2D2D2D' : '#F1F1F1',
    color: theme.dark ? '#E1E1E1' : '#1A1A1A',
    padding: 4,
    paddingHorizontal: 6,
    borderRadius: 4,
    fontFamily: 'monospace',
  },
  
  // Links
  link: {
    color: theme.colors.primary,
    textDecorationLine: 'underline',
  },
  
  // Headings
  heading1: {
    fontSize: 24,
    marginTop: 24,
    marginBottom: 12,
    fontWeight: '600',
    color: theme.dark ? '#E1E1E1' : '#1A1A1A',
    lineHeight: 32,
  },
  heading2: {
    fontSize: 20,
    marginTop: 20,
    marginBottom: 10,
    fontWeight: '600',
    color: theme.dark ? '#E1E1E1' : '#1A1A1A',
    lineHeight: 28,
  },
  heading3: {
    fontSize: 18,
    marginTop: 16,
    marginBottom: 8,
    fontWeight: '600',
    color: theme.dark ? '#E1E1E1' : '#1A1A1A',
    lineHeight: 26,
  },
  
  // Lists
  bullet_list: {
    marginVertical: 8,
  },
  ordered_list: {
    marginVertical: 8,
  },
  list_item: {
    marginBottom: 4,
    flexDirection: 'row',
    paddingLeft: 8,
  },
  
  // Blockquotes
  blockquote: {
    backgroundColor: theme.dark ? '#2D2D2D' : '#F1F1F1',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderLeftWidth: 4,
    borderLeftColor: theme.dark ? '#4A4A4A' : '#DCDCDC',
    borderRadius: 4,
    marginVertical: 12,
  },

  // Paragraphs
  paragraph: {
    marginVertical: 8,
    width: '100%',
  },

  // Horizontal rule
  hr: {
    backgroundColor: theme.dark ? '#404040' : '#E0E0E0',
    height: 1,
    marginVertical: 20,
  },
  
  // Table styles
  table: {
    borderWidth: 1,
    borderColor: theme.dark ? '#404040' : '#E0E0E0',
    borderRadius: 6,
    marginVertical: 12,
    width: '100%',
    overflow: 'hidden',
  },
  thead: {
    backgroundColor: theme.dark ? '#2D2D2D' : '#F7F7F8',
  },
  th: {
    padding: 12,
    fontWeight: '600',
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.dark ? '#404040' : '#E0E0E0',
  },
  tr: {
    flexDirection: 'row',
  },
  td: {
    padding: 12,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.dark ? '#404040' : '#E0E0E0',
  }
});
