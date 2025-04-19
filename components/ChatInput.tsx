import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Keyboard, TextInput, View, Animated, Easing, TouchableOpacity, Pressable, StyleSheet, ViewStyle, LayoutChangeEvent, Platform, NativeSyntheticEvent, TextInputSelectionChangeEventData } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Send, Bold, Italic, Code, Heading, List, ListOrdered, Link2, X, Image as ImageIcon, ChevronsUpDown } from 'lucide-react-native';
import Markdown from 'react-native-markdown-display';
import { markdownStyles } from '../utils/markdownStyles';

// Model option type now includes provider
type ModelOption = {
  id: string;
  displayName: string;
  provider: 'gemini' | 'openrouter';
};

const GEMINI_MODELS: ModelOption[] = [
  { id: 'gemini-2.0-flash', displayName: 'Gemini 2.0 Flash', provider: 'gemini' },
  { id: 'gemini-1.5-pro', displayName: 'Gemini 1.5 Pro', provider: 'gemini' },
  { id: 'gemini-2.5-pro', displayName: 'Gemini 2.5 Pro', provider: 'gemini' },
];

interface ChatInputProps {
  onSend: (message: string, model: ModelOption) => void;
  isGenerating?: boolean;
  onStopGeneration?: () => void;
  currentModel: ModelOption;
  onModelChange: (model: ModelOption) => void;
  openRouterModels: ModelOption[];  // Changed from string[] to ModelOption[]
  addOpenRouterModel: (modelName: ModelOption) => void;  // Changed parameter type to ModelOption
  className?: string;
  style?: ViewStyle | ViewStyle[];
  showModelMenu: boolean;
  setShowModelMenu: (show: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredModels: ModelOption[];
  connectionStatus: 'connected' | 'error' | 'unknown';
}

const ChatInput = ({
  onSend,
  isGenerating = false,
  onStopGeneration,
  currentModel,
  onModelChange,
  openRouterModels,
  addOpenRouterModel,
  className,
  style,
  showModelMenu,
  setShowModelMenu,
  searchQuery,
  setSearchQuery,
  filteredModels,
  connectionStatus,
}: ChatInputProps) => {
  const [input, setInput] = useState<string>("");
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [expandedInput, setExpandedInput] = useState<string>("");
  const [inputHeight, setInputHeight] = useState<number>(80);
  const animatedHeight = useRef(new Animated.Value(80)).current;
  const animatedToolbarOpacity = useRef(new Animated.Value(0)).current;
  const inputRef = useRef<TextInput>(null);
  const [keyboardHeight, setKeyboardHeight] = useState<number>(0);
  const [selection, setSelection] = useState<{ start: number; end: number }>({ start: 0, end: 0 });
  const [editing, setEditing] = useState<boolean>(false);

  // Track current height in a ref to avoid using private Animated.Value API
  const currentHeight = useRef(80);

  // Keyboard event listeners for toolbar placement
  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Animate expand/collapse
  useEffect(() => {
    if (isExpanded) {
      // Only animate to expanded if not already at a larger height
      const toValue = Math.max(currentHeight.current, 120);
      Animated.timing(animatedHeight, {
        toValue,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start(() => {
        currentHeight.current = toValue;
      });
      Animated.timing(animatedToolbarOpacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }).start();
      setExpandedInput(input);
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      // Only animate to collapsed if not already at a smaller height
      Animated.timing(animatedHeight, {
        toValue: 120,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start(() => {
        currentHeight.current = 120;
      });
      Animated.timing(animatedToolbarOpacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start();
      setInput(expandedInput);
      Keyboard.dismiss();
    }
  }, [isExpanded]);

  // Markdown toolbar actions
  type MarkdownAction = 'bold' | 'italic' | 'code' | 'heading' | 'ul' | 'ol' | 'link';
  const handleMarkdown = (action: MarkdownAction) => {
    const value = isExpanded ? expandedInput : input;
    const sel = selection;
    let before = value.slice(0, sel.start);
    let selected = value.slice(sel.start, sel.end);
    let after = value.slice(sel.end);
    let newText = value;
    let newSelection = { ...sel };
    switch (action) {
      case 'bold':
        newText = before + `**${selected || 'bold text'}**` + after;
        newSelection = {
          start: before.length + 2,
          end: before.length + 2 + (selected ? selected.length : 8),
        };
        break;
      case 'italic':
        newText = before + `*${selected || 'italic text'}*` + after;
        newSelection = {
          start: before.length + 1,
          end: before.length + 1 + (selected ? selected.length : 10),
        };
        break;
      case 'code':
        newText = before + `${selected || 'code'}` + after;
        newSelection = {
          start: before.length + 1,
          end: before.length + 1 + (selected ? selected.length : 4),
        };
        break;
      case 'heading':
        newText = before + `# ${selected || 'Heading'}` + after;
        newSelection = {
          start: before.length + 2,
          end: before.length + 2 + (selected ? selected.length : 7),
        };
        break;
      case 'ul':
        newText = before + `\n- ${selected || 'List item'}` + after;
        newSelection = {
          start: before.length + 4,
          end: before.length + 4 + (selected ? selected.length : 9),
        };
        break;
      case 'ol':
        newText = before + `\n1. ${selected || 'List item'}` + after;
        newSelection = {
          start: before.length + 5,
          end: before.length + 5 + (selected ? selected.length : 9),
        };
        break;
      case 'link':
        newText = before + `[${selected || 'text'}](url)` + after;
        newSelection = {
          start: before.length + 1,
          end: before.length + 1 + (selected ? selected.length : 4),
        };
        break;
    }
    if (isExpanded) {
      setExpandedInput(newText);
      setTimeout(() => setSelection(newSelection), 0);
    } else {
      setInput(newText);
      setTimeout(() => setSelection(newSelection), 0);
    }
  };

  const handleSend = useCallback(() => {
    const value = isExpanded ? expandedInput : input;
    if (value.trim()) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onSend(value.trim(), currentModel);
      setInput("");
      setExpandedInput("");
      setIsExpanded(false);
      Keyboard.dismiss();
    }
  }, [input, expandedInput, isExpanded, onSend, currentModel]);

  const handleStop = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onStopGeneration?.();
  }, [onStopGeneration]);

  const hasInput = (isExpanded ? expandedInput : input).trim().length > 0;

  // Handle outside press to collapse
  useEffect(() => {
    if (!isExpanded) return;
    const handleKeyboardHide = () => setIsExpanded(false);
    const subscription = Keyboard.addListener('keyboardDidHide', handleKeyboardHide);
    return () => subscription.remove();
  }, [isExpanded]);

  // For accessibility: collapse on blur
  const handleBlur = () => {
    setIsExpanded(false);
  };

  // For dynamic height (optional, can be removed if fixed height is preferred)
  const onContentSizeChange = (e: any) => {
    if (isExpanded) {
      const h = Math.min(Math.max(e.nativeEvent.contentSize.height, 120), 260);
      // Only set height if it changed, and don't override collapse
      if (currentHeight.current !== h && h > 120) {
        animatedHeight.setValue(h);
        currentHeight.current = h;
      }
    }
  };

  return (
    <View style={{ width: '100%' }}>
      <View style={{ flex: 1 }}>
        {/* This View is for the chat messages area, parent should control flex layout */}
        {/* ...existing code for chat messages goes here... */}
      </View>
      <View style={{ height: 10 }}>
        {/* Reduced margin between chats and input */}
      </View>
      <View style={{ width: '100%' }}>
        <Animated.View
          className="bg-primary px-4 pt-4 pb-2 rounded-t-3xl flex-col justify-between"
          style={{
            height: animatedHeight,
            minHeight: 80,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -12 },
            shadowOpacity: 0.38,
            shadowRadius: 32,
            elevation: 24,
          }}
        >
          <View className={`flex-row items-center space-x-2 w-full ${!isExpanded ? 'h-full justify-center' : ''}`}>
            <TextInput
              ref={inputRef}
              className="flex-1 text-base text-text font-sans bg-transparent border-0 rounded-2xl px-3 py-2"
              placeholder={`Message ${currentModel.provider === 'gemini' ? 'Gemini' : 'OpenRouter'}...`}
              placeholderTextColor="#a3a3a3"
              value={isExpanded ? expandedInput : input}
              onChangeText={isExpanded ? setExpandedInput : setInput}
              multiline={true}
              maxLength={4000}
              style={{ backgroundColor: 'transparent', borderWidth: 0, textAlignVertical: 'top' }}
              onFocus={() => { setIsExpanded(true); setEditing(true); }}
              onBlur={() => { setIsExpanded(false); setEditing(false); }}
              onContentSizeChange={onContentSizeChange}
              blurOnSubmit={true}
              returnKeyType="done"
              onSubmitEditing={handleSend}
              accessible
              accessibilityLabel="Chat input"
              selection={selection}
              onSelectionChange={e => setSelection(e.nativeEvent.selection)}
            />
            <TouchableOpacity
              onPress={() => setIsExpanded((v) => !v)}
              accessibilityLabel={isExpanded ? 'Collapse input' : 'Expand input'}
              className="p-2"
            >
              <ChevronsUpDown size={22} color="#a3a3a3" />
            </TouchableOpacity>
          </View>
          {/* Markdown toolbar and send button at the bottom of the chat input */}
          {isExpanded && (
            <Animated.View
              className="flex-row items-center justify-between px-1 pt-2"
              style={{ opacity: animatedToolbarOpacity }}
              pointerEvents={isExpanded ? 'auto' : 'none'}
            >
              <View className="flex-row items-center">
                <TouchableOpacity onPress={() => handleMarkdown('bold')} accessibilityLabel="Bold" style={{ marginRight: 24 }}>
                  <Bold size={22} color="#a3a3a3" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleMarkdown('italic')} accessibilityLabel="Italic" style={{ marginRight: 24 }}>
                  <Italic size={22} color="#a3a3a3" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleMarkdown('code')} accessibilityLabel="Code" style={{ marginRight: 24 }}>
                  <Code size={22} color="#a3a3a3" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleMarkdown('heading')} accessibilityLabel="Heading" style={{ marginRight: 24 }}>
                  <Heading size={22} color="#a3a3a3" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleMarkdown('ul')} accessibilityLabel="Unordered List" style={{ marginRight: 24 }}>
                  <List size={22} color="#a3a3a3" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleMarkdown('ol')} accessibilityLabel="Ordered List" style={{ marginRight: 24 }}>
                  <ListOrdered size={22} color="#a3a3a3" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleMarkdown('link')} accessibilityLabel="Link">
                  <Link2 size={22} color="#a3a3a3" />
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                onPress={handleSend}
                accessibilityLabel="Send"
                className="ml-4 rounded-full bg-accent p-2"
                style={{ shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 6, elevation: 6 }}
                disabled={!hasInput}
              >
                <Send size={22} color="#fff" />
              </TouchableOpacity>
            </Animated.View>
          )}
        </Animated.View>
      </View>
    </View>
  );
};

/**
 * IMPORTANT: OpenRouter Integration Notes
 * 
 * This component is designed to work with both Gemini and OpenRouter models:
 * 
 * 1. Provider-specific handling: currentModel.provider tells the component which service to use
 * 2. ModelOption format: All models (Gemini and OpenRouter) use the ModelOption type:
 *    {
 *      id: string;            // The model ID used by the API (e.g., "openai/gpt-4o")
 *      displayName: string;   // User-friendly name (e.g., "GPT-4o")
 *      provider: 'gemini' | 'openrouter';  // Which service this model belongs to
 *    }
 * 3. OpenRouter model conversion: When fetching models from OpenRouter, convert them:
 *    openRouterModel => ({
 *      id: openRouterModel.id,        
 *      displayName: openRouterModel.name,  
 *      provider: 'openrouter'
 *    })
 * 
 * The onSend callback automatically uses the currently selected model.
 */

export default ChatInput;
