import  EventSource from 'react-native-sse';

/**
 * OpenRouter API Service
 * 
 * Service worker for interacting with OpenRouter's API
 * Handles:
 * - API configuration and initialization
 * - Message generation with SSE streaming
 * - Model management
 * - Chat context management
 */

// Default system prompt is empty unless user sets a custom one
export const DEFAULT_SYSTEM_PROMPT = '';

// Base URL for OpenRouter API
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1';

// Required and optional headers for OpenRouter API
// These headers help with request tracking and app analytics on openrouter.ai
const OPENROUTER_HEADERS = {
  'Content-Type': 'application/json',
  // Required: API key authentication
  'Authorization': '', // Set dynamically with Bearer token
  // Optional: Help your app appear on OpenRouter rankings
  'HTTP-Referer': 'https://github.com/daeralys/androidLLM',
  'X-Title': 'androidLLM'
};

// Types for OpenRouter API responses
export interface OpenRouterModel {
  id: string;
  name: string;
  description: string;
  context_length: number;
  pricing: {
    prompt: string;
    completion: string;
  };
}

export type OpenRouterResponse = string | { error: string };

// Additional OpenRouter types and interfaces
interface SSEMessage {
  choices?: Array<{
    delta: {
      content?: string;
    };
  }>;
}

/**
 * Context management for chat history
 * Maintains a sliding window of messages
 */
class ChatContextManager {
  private history: Array<{ role: 'user' | 'assistant' | 'system', content: string }> = [];
  private readonly HISTORY_WINDOW_SIZE = 10;
  
  addMessage(role: 'user' | 'assistant' | 'system', content: string): void {
    this.history.push({ role, content });
    
    // Maintain history window size
    if (this.history.length > this.HISTORY_WINDOW_SIZE) {
      this.history.shift();
    }
  }
  
  getHistory(): Array<{ role: 'user' | 'assistant' | 'system', content: string }> {
    return [...this.history];
  }
  
  clearHistory(): void {
    this.history = [];
  }
}

/**
 * OpenRouterService class for handling all interactions with OpenRouter API
 */
export class OpenRouterService {
  private apiKey: string = '';
  private currentModel: string = '';
  private contextManager: ChatContextManager;
  private isCancelled: boolean = false;
  private requestInProgress: boolean = false;
  private customPrompt: string | undefined;
  private eventSource: EventSource | null = null;
  private abortController: AbortController | null = null;

  constructor(modelId: string = '') {
    this.contextManager = new ChatContextManager();
    this.currentModel = modelId;
  }

  /**
   * Set the API key
   */
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  /**
   * Set a custom model
   */
  setCustomModel(modelId: string): void {
    this.currentModel = modelId;
    this.resetChat();
  }

  /**
   * Check if service is initialized with API key
   */
  isInitialized(): boolean {
    return Boolean(this.apiKey);
  }

  /**
   * Set a custom system prompt
   */
  setCustomPrompt(prompt: string | undefined): void {
    if (this.customPrompt === prompt) return;
    this.customPrompt = prompt;
    this.resetChat();
  }

  /**
   * Cancel ongoing generation
   */
  cancelGeneration(): void {
    this.isCancelled = true;
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.requestInProgress = false;
  }

  /**
   * Fetch available models from OpenRouter
   */
  async fetchAvailableModels(): Promise<OpenRouterModel[]> {
    try {
      if (!this.apiKey) {
        throw new Error('API key not set');
      }

      const response = await fetch(`${OPENROUTER_API_URL}/models`, {
        headers: {
          ...OPENROUTER_HEADERS,
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error: any) {
      console.error('Error fetching OpenRouter models:', error);
      throw new Error(error.message || 'Failed to fetch models');
    }
  }

  /**
   * Process an SSE data line according to OpenRouter specs
   */
  private processSSELine(line: string, fullResponse: string, onPartialResponse?: (text: string) => void): { 
    newResponse: string;
    done: boolean;
  } {
    // Handle comments (keep-alive messages)
    if (line.startsWith(':')) {
      // OpenRouter processing message, can be used for UI feedback
      return { newResponse: fullResponse, done: false };
    }

    // Handle data lines
    if (line.startsWith('data: ')) {
      const data = line.slice(6);
      if (data === '[DONE]') {
        return { newResponse: fullResponse, done: true };
      }

      try {
        const parsed = JSON.parse(data) as SSEMessage;
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) {
          const newResponse = fullResponse + content;
          onPartialResponse?.(newResponse);
          return { newResponse, done: false };
        }
      } catch (e) {
        // Ignore invalid JSON as per spec
      }
    }

    return { newResponse: fullResponse, done: false };
  }

  /**
   * Send a message to OpenRouter API with SSE streaming
   *
   * NOTE: We use react-native-sse's EventSource here because fetch does not support streaming/SSE in React Native environments.
   * This implementation follows the OpenRouter streaming API documentation:
   *   - POST to /chat/completions with stream: true
   *   - Use correct headers and JSON body
   *   - Handle SSE events for streaming responses
   */
  async sendMessage(message: string, onPartialResponse?: (text: string) => void): Promise<OpenRouterResponse> {
    if (this.requestInProgress) {
      return { error: '⏳ A request is already in progress. Please wait for the current response to finish.' };
    }

    if (!this.apiKey) {
      return { error: '❗ API key not set. Please add your OpenRouter API key in Settings.' };
    }

    if (!this.currentModel) {
      return { error: '❗ No model selected. Please select a model first.' };
    }

    this.isCancelled = false;
    this.requestInProgress = true;

    try {
      const systemPrompt = this.customPrompt || DEFAULT_SYSTEM_PROMPT;
      const messages = [
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        ...this.contextManager.getHistory(),
        { role: 'user', content: message }
      ];

      const eventSourceUrl = new URL(`${OPENROUTER_API_URL}/chat/completions`);
      const eventSource = new EventSource(eventSourceUrl.toString(), {
        headers: {
          ...OPENROUTER_HEADERS,
          'Authorization': `Bearer ${this.apiKey}`
        },
        method: 'POST',
        body: JSON.stringify({
          model: this.currentModel,
          messages,
          stream: true,
          temperature: 0.7,
          max_tokens: 4000,
        })
      });

      let fullResponse = '';

      return new Promise((resolve, reject) => {
        eventSource.addEventListener('message', (event: any) => {
          if (this.isCancelled) {
            eventSource.close();
            this.requestInProgress = false;
            const stoppedResponse = fullResponse + ' [Generation stopped]';
            this.contextManager.addMessage('user', message);
            this.contextManager.addMessage('assistant', stoppedResponse);
            resolve(stoppedResponse);
            return;
          }

          try {
            const line = event.data?.trim();
            if (!line) return;

            // Handle SSE comment lines (keep-alive)
            if (line.startsWith(':')) {
              return; // OpenRouter processing message, ignore
            }

            // Handle data lines
            if (line === '[DONE]') {
              eventSource.close();
              this.requestInProgress = false;
              this.contextManager.addMessage('user', message);
              this.contextManager.addMessage('assistant', fullResponse);
              resolve(fullResponse);
              return;
            }

            try {
              const parsed = JSON.parse(line);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                // Only send the new content to the partial response callback
                onPartialResponse?.(content);
                fullResponse += content;
              }
            } catch (e) {
              // Ignore invalid JSON as per SSE spec
            }
          } catch (e) {
            console.warn('Failed to process SSE message:', e);
          }
        });

        eventSource.addEventListener('error', (event: any) => {
          eventSource.close();
          this.requestInProgress = false;
          let errorMessage = 'Unknown SSE error';
          if (event && typeof event.message === 'string') {
            errorMessage = event.message;
          } else if (event && typeof event.reason === 'string') {
            errorMessage = event.reason;
          }
          reject(new Error(errorMessage));
        });

        this.eventSource = eventSource;
      });

    } catch (error: any) {
      this.requestInProgress = false;
      if (error?.message?.includes('Network') || error?.message?.includes('ECONNABORTED')) {
        return { error: '❗ Network error. Please check your internet connection.' };
      }
      console.error('OpenRouter API Error:', error);
      return { error: "❗ I'm sorry, I encountered an error processing your request. Please try again." };
    }
  }

  /**
   * Reset the chat context
   */
  resetChat(): void {
    this.contextManager.clearHistory();
  }
}

// Export a singleton instance
export const openRouterService = new OpenRouterService();