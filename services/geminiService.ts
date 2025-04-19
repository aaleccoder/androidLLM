/**
 * Gemini API Service
 * 
 * Service worker for interacting with Google's Gemini API
 * Handles:
 * - API configuration and initialization
 * - Message generation
 * - Context management
 * - Chain of thought reasoning
 */
import { GoogleGenerativeAI, GenerativeModel, ChatSession } from '@google/generative-ai';
import { useData } from '../context/dataContext';

// Default system prompt is empty unless user sets a custom one
export const DEFAULT_SYSTEM_PROMPT = '';

// History window size for context management
const HISTORY_WINDOW_SIZE = 10;

/**
 * Context management for chat history
 * Maintains a sliding window of recent messages for context
 */
class ChatContextManager {
  private history: Array<{role: 'user' | 'model', parts: Array<{text: string}>}> = [];
  
  /**
   * Adds a message to the chat history
   */
  addMessage(role: 'user' | 'model', content: string): void {
    this.history.push({ 
      role, 
      parts: [{ text: content }]
    });
    
    // Maintain the history window size
    if (this.history.length > HISTORY_WINDOW_SIZE) {
      this.history.shift();
    }
  }
  
  /**
   * Gets the current chat history
   */
  getHistory(): Array<{role: 'user' | 'model', parts: Array<{text: string}>}> {
    return [...this.history];
  }
  
  /**
   * Clears the chat history
   */
  clearHistory(): void {
    this.history = [];
  }
}

export type GeminiModel = 'gemini-2.0-flash' | 'gemini-1.5-pro' | 'gemini-2.5-pro';

/**
 * GeminiService class for handling all interactions with Gemini API
 */
export class GeminiService {
  private model: GenerativeModel | null = null;
  private contextManager: ChatContextManager;
  private chatSession: ChatSession | null = null;
  private apiKey: string = '';
  private isCancelled: boolean = false;
  private requestInProgress: boolean = false;
  private currentModel: GeminiModel = 'gemini-1.5-pro';
  private customPrompt: string | undefined;
  
  constructor(modelName: GeminiModel = 'gemini-1.5-pro') {
    this.contextManager = new ChatContextManager();
    this.currentModel = modelName;
    this.initialize(modelName);
  }
  
  /**
   * Initialize the Gemini service with the model name
   * This is called during construction and when the API key changes
   */
  private initialize(modelName: string): void {
    // The actual initialization of the model happens in initializeWithApiKey
    // which is called when the API key is set
  }

  /**
   * Change the current model and reinitialize the chat session
   */
  async changeModel(modelName: GeminiModel): Promise<void> {
    if (this.currentModel === modelName) return;
    
    this.currentModel = modelName;
    if (this.apiKey) {
      const genAI = new GoogleGenerativeAI(this.apiKey);
      this.model = genAI.getGenerativeModel({ model: modelName });
      await this.initializeChat();
    }
  }

  /**
   * Get the current model name
   */
  getCurrentModel(): GeminiModel {
    return this.currentModel;
  }

  /**
   * Set the API key and initialize the model
   * This should be called after the data context is available
   */
  setApiKey(apiKey: string): void {
    if (this.apiKey === apiKey) {
      return; // No change, don't reinitialize
    }
    
    this.apiKey = apiKey;
    if (apiKey) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        this.model = genAI.getGenerativeModel({ model: this.currentModel });
        this.initializeChat();
      } catch (error) {
        console.error('Failed to initialize Gemini API with provided key:', error);
        this.model = null;
        this.chatSession = null;
      }
    } else {
      this.model = null;
      this.chatSession = null;
    }
  }
  
  /**
   * Check if the service has been properly initialized with a valid API key
   */
  isInitialized(): boolean {
    return this.model !== null;
  }
  
  /**
   * Set a custom system prompt
   */
  setCustomPrompt(prompt: string | undefined): void {
    if (this.customPrompt === prompt) return;
    this.customPrompt = prompt;
    if (this.model) {
      this.initializeChat();
    }
  }

  /**
   * Initialize a new chat session with the system prompt
   */
  private async initializeChat(): Promise<void> {
    try {
      if (!this.model) {
        throw new Error('Model not initialized. API key might not be set.');
      }
      
      const systemPrompt = this.customPrompt || DEFAULT_SYSTEM_PROMPT;
      
      this.chatSession = this.model.startChat({
        history: [{
          role: 'user',
          parts: [{ text: systemPrompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1000,
          candidateCount: 1,
          stopSequences: ["Human:", "Assistant:"],
        },
      });
    } catch (error) {
      console.error('Failed to initialize chat session:', error);
      throw error;
    }
  }
  
  /**
   * Cancel the current generation (streaming or simulated)
   */
  cancelGeneration(): void {
    this.isCancelled = true;
    this.requestInProgress = false;
  }

  /**
   * Send a message to the Gemini API and get a streaming response (true streaming if supported, else simulated)
   * @param message The user message
   * @param onPartialResponse Callback for streaming output
   * @returns The full response string
   */
  async sendMessage(message: string, onPartialResponse?: (text: string) => void): Promise<string> {
    if (this.requestInProgress) {
      const msg = '⏳ A request is already in progress. Please wait for the current response to finish.';
      console.warn('[Gemini] ' + msg);
      return msg;
    }
    this.isCancelled = false;
    this.requestInProgress = true;

    if (!this.model) {
      const msg = '❗ API key not set. Please add your Gemini API key in Settings.';
      console.error('[Gemini] ' + msg);
      this.requestInProgress = false;
      return msg;
    }

    if (!this.chatSession) {
      try {
        await this.initializeChat();
      } catch (error) {
        const msg = "❗ Couldn't initialize chat session. Please check your API key in Settings.";
        console.error('[Gemini] ' + msg, error);
        this.requestInProgress = false;
        return msg;
      }
    }

    try {
      this.contextManager.addMessage('user', message);
      if (!this.chatSession) {
        const msg = '❗ Chat session not initialized.';
        console.error('[Gemini] ' + msg);
        this.requestInProgress = false;
        return msg;
      }

      // Try true streaming if available
      const supportsStreaming = typeof this.chatSession.sendMessageStream === 'function';
      if (supportsStreaming && onPartialResponse) {
        let fullResponse = '';
        try {
          // @ts-ignore: sendMessageStream is not in all typings
          const stream = await this.chatSession.sendMessageStream([{ text: message }]);
          // Use stream.stream if available (Node.js SDK)
          const asyncIterable = (typeof stream.stream === 'function' || typeof stream.stream === 'object') ? stream.stream : stream;
          // Explicitly check for async iterator
          if (
            asyncIterable &&
            typeof asyncIterable === 'object' &&
            typeof (asyncIterable as AsyncIterable<unknown>)[Symbol.asyncIterator] === 'function'
          ) {
            for await (const chunk of asyncIterable as AsyncIterable<any>) {
              if (this.isCancelled) {
                const stopped = fullResponse.trim() + ' [Generation stopped]';
                this.contextManager.addMessage('model', stopped);
                this.requestInProgress = false;
                return stopped;
              }
              const part = typeof chunk.text === 'function' ? chunk.text() : '';
              if (part) {
                fullResponse += part;
                onPartialResponse(fullResponse);
              }
            }
            if (!this.isCancelled) {
              this.contextManager.addMessage('model', fullResponse);
              this.requestInProgress = false;
              return fullResponse;
            }
            const stopped = fullResponse.trim() + ' [Generation stopped]';
            this.contextManager.addMessage('model', stopped);
            this.requestInProgress = false;
            return stopped;
          }
        } catch (err) {
          this.requestInProgress = false;
          // Fallback to simulated streaming below
        }
      }

      // Fallback: Simulate streaming
      try {
        const result = await this.chatSession.sendMessage([{ text: message }]);
        const fullResponse = result.response.text();
        let currentResponse = '';
        if (onPartialResponse) {
          const words = fullResponse.split(' ');
          for (const word of words) {
            if (this.isCancelled) {
              const finalResponse = currentResponse.trim() + ' [Generation stopped]';
              this.contextManager.addMessage('model', finalResponse);
              this.requestInProgress = false;
              return finalResponse;
            }
            currentResponse += word + ' ';
            onPartialResponse(currentResponse.trim());
            await new Promise(resolve => setTimeout(resolve, 30));
          }
        }
        if (!this.isCancelled) {
          this.contextManager.addMessage('model', fullResponse);
          this.requestInProgress = false;
          return fullResponse;
        }
        const stoppedResponse = currentResponse.trim() + ' [Generation stopped]';
        this.contextManager.addMessage('model', stoppedResponse);
        this.requestInProgress = false;
        return stoppedResponse;
      } catch (error: any) {
        if (error?.code === 'ECONNABORTED' || error?.message?.includes('Network')) {
          const msg = '❗ Network error. Please check your internet connection.';
          console.error('[Gemini] ' + msg, error);
          this.requestInProgress = false;
          return msg;
        }
        const msg = "❗ I'm sorry, I encountered an error processing your request. Please try again.";
        console.error('[Gemini] ' + msg, error);
        this.requestInProgress = false;
        return msg;
      }
    } catch (error: any) {
      if (error?.code === 'ECONNABORTED' || error?.message?.includes('Network')) {
        const msg = '❗ Network error. Please check your internet connection.';
        console.error('[Gemini] ' + msg, error);
        this.requestInProgress = false;
        return msg;
      }
      const msg = "❗ I'm sorry, I encountered an error processing your request. Please try again.";
      console.error('[Gemini] ' + msg, error);
      this.requestInProgress = false;
      return msg;
    }
  }
  
  /**
   * Reset the chat context
   */
  resetChat(): void {
    this.contextManager.clearHistory();
    this.chatSession = null;
    if (this.model) {
      this.initializeChat();
    }
  }
}

// Export a singleton instance
export const geminiService = new GeminiService();