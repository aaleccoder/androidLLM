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

// Default system prompt to establish assistant behavior
const DEFAULT_SYSTEM_PROMPT = `You are a helpful AI assistant for Android development. 
You provide accurate, relevant information and code examples when asked.
Respond in markdown format when appropriate.`;

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

/**
 * GeminiService class for handling all interactions with Gemini API
 */
export class GeminiService {
  private model: GenerativeModel | null = null;
  private contextManager: ChatContextManager;
  private chatSession: ChatSession | null = null;
  private apiKey: string = '';
  
  constructor(modelName: string = 'gemini-pro') {
    this.contextManager = new ChatContextManager();
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
        this.model = genAI.getGenerativeModel({ model: 'gemini-pro' });
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
   * Initialize a new chat session with the system prompt
   */
  private async initializeChat(): Promise<void> {
    try {
      if (!this.model) {
        throw new Error('Model not initialized. API key might not be set.');
      }
      
      this.chatSession = this.model.startChat({
        history: [{
          role: 'user',
          parts: [{ text: DEFAULT_SYSTEM_PROMPT }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1000,
        },
      });
    } catch (error) {
      console.error('Failed to initialize chat session:', error);
      throw error;
    }
  }
  
  /**
   * Send a message to the Gemini API and get a response
   * Implements chain of thought reasoning by allowing the model to "think"
   * before providing a final answer
   */
  async sendMessage(message: string): Promise<string> {
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
      
      // Chain of thought: First ask the model to reason about the response
      const thinkingPrompt = `Based on the user query: "${message}", think through the appropriate response step by step before answering.`;
      
      // Get the reasoning response (not shown to user)
      const reasoningResponse = await this.model.generateContent([{ text: thinkingPrompt }]);
      const reasoning = reasoningResponse.response.text();
      
      // Use the reasoning to generate the final response
      const finalPrompt = `Based on your reasoning: ${reasoning}\n\nNow provide a concise and helpful response to the user's query: "${message}"`;
      
      // Get the final response using the chat session to maintain context
      if (!this.chatSession) {
        throw new Error('Chat session not initialized');
      }
      
      const result = await this.chatSession.sendMessage([{ text: finalPrompt }]);
      const response = result.response.text();
      
      // Add the response to context
      this.contextManager.addMessage('model', response);
      
      return response;
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
  
  /**
   * Predict what the user might ask next based on the conversation history
   */
  async predictNextQuery(): Promise<string> {
    if (!this.model) {
      return '';
    }
    
    if (!this.chatSession) {
      try {
        await this.initializeChat();
      } catch (error) {
        return '';
      }
    }
    
    try {
      const history = this.contextManager.getHistory();
      if (history.length < 2) {
        return '';
      }
      
      const predictionPrompt = `Based on the conversation history, predict what the user might ask next. Provide just one likely question.`;
      const result = await this.model.generateContent([{ text: predictionPrompt }]);
      return result.response.text();
    } catch (error) {
      console.error('Error predicting next query:', error);
      return '';
    }
  }
}

// Export a singleton instance
export const geminiService = new GeminiService();