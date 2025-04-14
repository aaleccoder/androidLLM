/**
 * OpenRouter API Service
 * 
 * Service worker for interacting with OpenRouter API via OpenAI client
 * Handles:
 * - API configuration and initialization
 * - Message generation with streaming support
 * - Context management
 * - Model selection
 */
import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources';

// Default system prompt is empty unless user sets a custom one
export const DEFAULT_SYSTEM_PROMPT = '';

// History window size for context management
const HISTORY_WINDOW_SIZE = 10;

/**
 * Context management for chat history
 * Maintains a sliding window of recent messages for context
 */
class ChatContextManager {
  private history: Array<{ role: 'user' | 'assistant' | 'system', content: string }> = [];
  
  /**
   * Adds a message to the chat history
   */
  addMessage(role: 'user' | 'assistant' | 'system', content: string): void {
    this.history.push({ role, content });
    
    // Maintain the history window size
    if (this.history.length > HISTORY_WINDOW_SIZE) {
      this.history.shift();
    }
  }
  
  /**
   * Gets the current chat history
   */
  getHistory(): Array<{ role: 'user' | 'assistant' | 'system', content: string }> {
    return [...this.history];
  }
  
  /**
   * Clears the chat history
   */
  clearHistory(): void {
    this.history = [];
  }
}

/**
 * OpenRouterService class for handling all interactions with OpenRouter API
 */
export class OpenRouterService {
  private apiKey: string = '';
  private currentModel: string = 'mistral-7b';
  private contextManager: ChatContextManager;
  private customPrompt: string | undefined;
  private isCancelled: boolean = false;
  private openai: OpenAI | null = null;
  
  /**
   * Initialize the OpenRouter service with the model name
   */
  constructor(modelName: string = 'openrouter/mistral-7b') {
    this.contextManager = new ChatContextManager();
    this.currentModel = modelName;
  }
  
  /**
   * Set the API key and initialize the OpenAI client
   */
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
    
    if (apiKey) {
      try {
        this.openai = new OpenAI({
          baseURL: 'https://openrouter.ai/api/v1',
          apiKey: this.apiKey,
          defaultHeaders: {
            'HTTP-Referer': 'https://github.com/androidLLM',
            'X-Title': 'AndroidLLM',
          },
        });
      } catch (error) {
        console.error('Failed to initialize OpenRouter client:', error);
        this.openai = null;
      }
    } else {
      this.openai = null;
    }
  }
  
  /**
   * Check if the service has been properly initialized with a valid API key
   */
  isInitialized(): boolean {
    return !!this.apiKey && !!this.openai;
  }
  
  /**
   * Get the current model name
   */
  getCurrentModel(): string {
    return this.currentModel;
  }
  
  /**
   * Change the current model and reset the chat context
   */
  async changeModel(modelName: string): Promise<void> {
    if (this.currentModel === modelName) return;
    this.currentModel = modelName;
    this.resetChat();
  }
  
  /**
   * Set a custom model name
   */
  setCustomModel(modelName: string): void {
    if (!modelName) return;
    this.currentModel = modelName;
    this.resetChat();
  }
  
  /**
   * Set a custom system prompt
   */
  setCustomPrompt(prompt: string | undefined): void {
    this.customPrompt = prompt;
  }
  
  /**
   * Cancel the current generation
   */
  cancelGeneration(): void {
    this.isCancelled = true;
  }
  
  /**
   * Reset the chat context
   */
  resetChat(): void {
    this.contextManager.clearHistory();
  }
  
  /**
   * Send a message to the OpenRouter API and get a streaming response when possible
   */
  async sendMessage(message: string, onPartialResponse?: (text: string) => void): Promise<string> {
    this.isCancelled = false;
    
    if (!this.apiKey || !this.openai) {
      return 'API key not set. Please set your OpenRouter API key in the settings.';
    }
    
    // Add the user message to context
    this.contextManager.addMessage('user', message);
    
    // Prepare message format for OpenAI API
    const messages: ChatCompletionMessageParam[] = [
      ...(this.customPrompt
        ? [{
            role: 'system' as "system",
            content: this.customPrompt
          }]
        : []),
      ...this.contextManager.getHistory().map(m => ({
        role: m.role as "system" | "user" | "assistant" | "function" | "developer" | "tool",
        content: m.content
      }))
    ];
    
    try {
      // Handle streaming if a callback is provided
      if (onPartialResponse) {
        let stream;
        
        try {
          // First try streaming
          stream = await this.openai.chat.completions.create({
            model: this.currentModel,
            messages: messages,
            stream: true,
            temperature: 0.7,
          });
          
          if (!stream || typeof stream[Symbol.asyncIterator] !== 'function') {
            throw new Error('Streaming not supported or response is empty.');
          }
        } catch (streamErr) {
          // If streaming fails, fall back to regular completion
          console.warn('Streaming failed, falling back to regular completion:', streamErr);
          
          const completion = await this.openai.chat.completions.create({
            model: this.currentModel,
            messages: messages,
            temperature: 0.7,
          });
          
          const content = completion.choices?.[0]?.message?.content || '';
          
          if (content) {
            this.contextManager.addMessage('assistant', content);
            return (
              '⚠️ Streaming is not supported for this model/provider. Displaying full response instead.\n\n' +
              content
            );
          }
          
          return 'No response from OpenRouter API.';
        }
        
        let fullResponse = '';
        
        // Process stream chunks
        for await (const chunk of stream) {
          const content = chunk.choices?.[0]?.delta?.content || '';
          
          if (content) {
            fullResponse += content;
            onPartialResponse(fullResponse);
          }
          
          // Handle cancellation during streaming
          if (this.isCancelled) {
            const stopped = fullResponse + ' [Generation stopped]';
            this.contextManager.addMessage('assistant', stopped);
            return stopped;
          }
        }
        
        // Add final response to context
        this.contextManager.addMessage('assistant', fullResponse);
        return fullResponse;
      } else {
        // Non-streaming approach
        const completion = await this.openai.chat.completions.create({
          model: this.currentModel,
          messages: messages,
          temperature: 0.7,
        });
        
        const content = completion.choices?.[0]?.message?.content || '';
        
        if (content) {
          this.contextManager.addMessage('assistant', content);
          return content;
        }
        
        return 'No response from OpenRouter API.';
      }
    } catch (error: any) {
      // Handle specific error cases with user-friendly messages
      if (error.message?.includes('no body') || error.message?.includes('Streaming not supported')) {
        return 'Streaming is not supported for this model/provider, or the response was empty. Please try again without streaming or switch models.';
      }
      
      if (error.message?.includes('not a valid model ID')) {
        return `The model "${this.currentModel}" is not a valid OpenRouter model. Please check your model name or select a valid model from https://openrouter.ai/models.`;
      }
      
      if (error.message?.includes('401') || error.message?.toLowerCase().includes('key')) {
        return 'OpenRouter authentication error: Please ensure you have entered a valid OpenRouter API key.';
      }
      
      if (error.message?.includes('429')) {
        return 'Rate limit exceeded. Please wait and try again later.';
      }
      
      if (error.message?.includes('network')) {
        return 'Network error: Please check your internet connection.';
      }
      
      console.error('OpenRouter API error:', error);
      return "I'm sorry, I encountered an error processing your request. Please try again.";
    }
  }
}

// Export a singleton instance
export const openRouterService = new OpenRouterService();