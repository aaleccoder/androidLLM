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
   * Cancel the current generation
   */
  cancelGeneration(): void {
    this.isCancelled = true;
  }

  /**
   * Send a message to the Gemini API and get a streaming response
   * Implements chain of thought reasoning by allowing the model to "think"
   * before providing a final answer
   */
  async sendMessage(message: string, onPartialResponse?: (text: string) => void): Promise<string> {
    this.isCancelled = false;
    
    if (!this.model) {
      return "API key not set. Please set your Gemini API key in the settings.";
    }
    
    if (!this.chatSession) {
      try {
        await this.initializeChat();
      } catch (error) {
        return "Couldn't initialize chat session. Please check your API key in settings.";
      }
    }
    
    try {
      // Add the user message to context
      this.contextManager.addMessage('user', message);
      
      // Get the final response using the chat session to maintain context
      if (!this.chatSession) {
        throw new Error('Chat session not initialized');
      }
      
      try {
        // Send message and get response
        const result = await this.chatSession.sendMessage([{ text: message }]);
        const fullResponse = result.response.text();
        let currentResponse = '';
        
        // Simulate streaming by sending partial responses
        if (onPartialResponse) {
          const words = fullResponse.split(' ');
          
          // Send partial responses word by word with a small delay
          for (const word of words) {
            if (this.isCancelled) {
              // If cancelled, add what we have so far to context and return
              const finalResponse = currentResponse.trim() + ' [Generation stopped]';
              this.contextManager.addMessage('model', finalResponse);
              return finalResponse;
            }
            
            currentResponse += word + ' ';
            onPartialResponse(currentResponse.trim());
            // Small delay to simulate typing
            await new Promise(resolve => setTimeout(resolve, 50));
          }
        }
        
        // Only add to context and return full response if not cancelled
        if (!this.isCancelled) {
          this.contextManager.addMessage('model', fullResponse);
          return fullResponse;
        }
        
        const stoppedResponse = currentResponse.trim() + ' [Generation stopped]';
        this.contextManager.addMessage('model', stoppedResponse);
        return stoppedResponse;
      } catch (error) {
        console.error('Error processing response:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error generating response:', error);
      return "I'm sorry, I encountered an error processing your request. Please try again.";
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