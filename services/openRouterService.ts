/**
 * OpenRouter API Service
 * 
 * Service worker for interacting with OpenRouter API
 * Handles:
 * - API configuration and initialization
 * - Message generation
 * - Context management
 */

// Default system prompt is empty unless user sets a custom one
export const DEFAULT_SYSTEM_PROMPT = '';

// History window size for context management
const HISTORY_WINDOW_SIZE = 10;

/**
 * Context management for chat history
 * Maintains a sliding window of recent messages for context
 */
class ChatContextManager {
  private history: Array<{role: 'user' | 'assistant', content: string}> = [];

  addMessage(role: 'user' | 'assistant', content: string): void {
    this.history.push({ role, content });
    if (this.history.length > HISTORY_WINDOW_SIZE) {
      this.history.shift();
    }
  }

  getHistory(): Array<{role: 'user' | 'assistant', content: string}> {
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
  private currentModel: string = 'mistral-7b';
  private contextManager: ChatContextManager;
  private customPrompt: string | undefined;
  private isCancelled: boolean = false;

  constructor(modelName: string = 'mistral-7b') {
    this.contextManager = new ChatContextManager();
    this.currentModel = modelName;
  }

  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  isInitialized(): boolean {
    return !!this.apiKey;
  }

  getCurrentModel(): string {
    return this.currentModel;
  }

  async changeModel(modelName: string): Promise<void> {
    if (this.currentModel === modelName) return;
    this.currentModel = modelName;
  }

  setCustomModel(modelName: string): void {
    this.currentModel = modelName;
  }

  setCustomPrompt(prompt: string | undefined): void {
    this.customPrompt = prompt;
  }

  cancelGeneration(): void {
    this.isCancelled = true;
  }

  resetChat(): void {
    this.contextManager.clearHistory();
  }

  /**
   * Send a message to the OpenRouter API and get a streaming response
   * Simulates streaming if API does not support it
   */
  async sendMessage(message: string, onPartialResponse?: (text: string) => void): Promise<string> {
    this.isCancelled = false;
    if (!this.apiKey) {
      return "API key not set. Please set your OpenRouter API key in the settings.";
    }

    // Add the user message to context
    this.contextManager.addMessage('user', message);

    // Prepare the messages for OpenRouter API
    const messages = [
      ...(this.customPrompt ? [{ role: 'system', content: this.customPrompt }] : []),
      ...this.contextManager.getHistory()
    ];

    // Log all request data
    console.log('[OpenRouter] Sending request:', {
      endpoint: 'https://openrouter.ai/api/v1/chat/completions',
      apiKeySet: !!this.apiKey,
      model: this.currentModel,
      messages,
      stream: false
    });

    try {
      console.log('[OpenRouter] Sending request to OpenRouter servers...');
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.currentModel,
          messages: messages.map(m => ({ role: m.role, content: m.content })),
          stream: false // Set to true if streaming is supported and handled
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[OpenRouter] API error:', errorText);
        // Check for invalid model error
        if (errorText.includes('not a valid model ID')) {
          return `The model "${this.currentModel}" is not a valid OpenRouter model. Please check your model name or select a valid model from https://openrouter.ai/models.`;
        }
        throw new Error(`OpenRouter API error: ${errorText}`);
      }

      const data = await response.json();
      const fullResponse = data.choices?.[0]?.message?.content || '';
      let currentResponse = '';

      // Simulate streaming by sending partial responses
      if (onPartialResponse) {
        const words = fullResponse.split(' ');
        for (const word of words) {
          if (this.isCancelled) {
            const finalResponse = currentResponse.trim() + ' [Generation stopped]';
            this.contextManager.addMessage('assistant', finalResponse);
            return finalResponse;
          }
          currentResponse += word + ' ';
          onPartialResponse(currentResponse.trim());
          await new Promise(resolve => setTimeout(resolve, 40));
        }
      }

      if (!this.isCancelled) {
        this.contextManager.addMessage('assistant', fullResponse);
        return fullResponse;
      }
      const stoppedResponse = currentResponse.trim() + ' [Generation stopped]';
      this.contextManager.addMessage('assistant', stoppedResponse);
      return stoppedResponse;
    } catch (error) {
      const err = error as Error;
      // Surface invalid model error if present in error message
      if (typeof err.message === 'string' && err.message.includes('not a valid model ID')) {
        return `The model "${this.currentModel}" is not a valid OpenRouter model. Please check your model name or select a valid model from https://openrouter.ai/models.`;
      }
      console.error('[OpenRouter] Error generating response:', error);
      return "I'm sorry, I encountered an error processing your request. Please try again.";
    }
  }
}

// Export a singleton instance
export const openRouterService = new OpenRouterService();