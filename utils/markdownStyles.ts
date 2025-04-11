import { StyleSheet } from 'react-native';
import { MD3Theme } from 'react-native-paper';

export const createMarkdownStyles = (theme: MD3Theme) => StyleSheet.create({
  // Base styles
  body: {
    color: theme.dark ? '#F3F4F6' : '#1F2937',
    fontSize: 16,
    lineHeight: 24,
  },
  
  // Code elements
  code_block: {
    backgroundColor: theme.dark ? '#111827' : '#F1F3F5',
    color: theme.dark ? '#F3F4F6' : '#1F2937',
    padding: 16,
    borderRadius: 6,
    fontFamily: 'monospace',
    marginVertical: 12,
    width: '100%',
  },
  code_inline: {
    backgroundColor: theme.dark ? '#1F2937' : '#E9ECEF',
    color: theme.dark ? '#F3F4F6' : '#1F2937',
    padding: 4,
    paddingHorizontal: 6,
    borderRadius: 4,
    fontFamily: 'monospace',
  },
  
  // Links
  link: {
    color: '#6366F1',
    textDecorationLine: 'underline',
  },
  
  // Headings
  heading1: {
    fontSize: 24,
    marginTop: 24,
    marginBottom: 12,
    fontWeight: '600',
    color: theme.dark ? '#F3F4F6' : '#111827',
    lineHeight: 32,
  },
  heading2: {
    fontSize: 20,
    marginTop: 20,
    marginBottom: 10,
    fontWeight: '600',
    color: theme.dark ? '#F3F4F6' : '#111827',
    lineHeight: 28,
  },
  heading3: {
    fontSize: 18,
    marginTop: 16,
    marginBottom: 8,
    fontWeight: '600',
    color: theme.dark ? '#F3F4F6' : '#111827',
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
    backgroundColor: theme.dark ? '#1F2937' : '#F1F3F5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderLeftWidth: 4,
    borderLeftColor: theme.dark ? '#374151' : '#D1D5DB',
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
    backgroundColor: theme.dark ? '#374151' : '#E5E7EB',
    height: 1,
    marginVertical: 20,
  },
  
  // Table styles
  table: {
    borderWidth: 1,
    borderColor: theme.dark ? '#374151' : '#E5E7EB',
    borderRadius: 6,
    marginVertical: 12,
    width: '100%',
    overflow: 'hidden',
  },
  thead: {
    backgroundColor: theme.dark ? '#1F2937' : '#F1F3F5',
  },
  th: {
    padding: 12,
    fontWeight: '600',
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.dark ? '#374151' : '#E5E7EB',
    color: theme.dark ? '#F3F4F6' : '#111827',
  },
  tr: {
    flexDirection: 'row',
  },
  td: {
    padding: 12,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.dark ? '#374151' : '#E5E7EB',
    color: theme.dark ? '#F3F4F6' : '#111827',
  }
});
