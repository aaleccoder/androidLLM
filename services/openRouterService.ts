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

// --- OpenRouter API Types ---

export type ORMessage =
  | {
      role: 'user' | 'assistant' | 'system';
      content: string | ORContentPart[];
      name?: string;
    }
  | {
      role: 'tool';
      content: string;
      tool_call_id: string;
      name?: string;
    };

export type ORContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string; detail?: string } };

export interface ORRequest {
  messages?: ORMessage[];
  prompt?: string;
  model?: string;
  response_format?: { type: 'json_object' };
  stop?: string | string[];
  stream?: boolean;
  max_tokens?: number;
  temperature?: number;
  tools?: ORTool[];
  tool_choice?: ORToolChoice;
  seed?: number;
  top_p?: number;
  top_k?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  repetition_penalty?: number;
  logit_bias?: { [key: number]: number };
  top_logprobs?: number;
  min_p?: number;
  top_a?: number;
  prediction?: { type: 'content'; content: string };
  transforms?: string[];
  models?: string[];
  route?: 'fallback';
  provider?: ORProviderPreferences;
  modalities?: string[];
}

export interface ORTool {
  type: 'function';
  function: ORFunctionDescription;
}

export interface ORFunctionDescription {
  description?: string;
  name: string;
  parameters: object;
}

export type ORToolChoice =
  | 'none'
  | 'auto'
  | { type: 'function'; function: { name: string } };

export type ORProviderPreferences = Record<string, unknown>;

export interface ORResponse {
  id: string;
  choices: (ORNonStreamingChoice | ORStreamingChoice | ORNonChatChoice)[];
  created: number;
  model: string;
  object: 'chat.completion' | 'chat.completion.chunk';
  system_fingerprint?: string;
  usage?: ORResponseUsage;
}

export interface ORResponseUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface ORNonChatChoice {
  finish_reason: string | null;
  text: string;
  error?: ORErrorResponse;
}

export interface ORNonStreamingChoice {
  finish_reason: string | null;
  native_finish_reason: string | null;
  message: {
    content: string | null;
    role: string;
    tool_calls?: ORToolCall[];
  };
  error?: ORErrorResponse;
}

export interface ORStreamingChoice {
  finish_reason: string | null;
  native_finish_reason: string | null;
  delta: {
    content: string | null;
    role?: string;
    tool_calls?: ORToolCall[];
  };
  error?: ORErrorResponse;
}

export interface ORErrorResponse {
  code: number;
  message: string;
  metadata?: Record<string, unknown>;
}

export interface ORToolCall {
  id: string;
  type: 'function';
  function: ORFunctionCall;
}

export interface ORFunctionCall {
  name: string;
  arguments: string;
}

// --- OpenRouter Models API Types ---
export interface OpenRouterModel {
  id: string;
  name: string;
  created: number;
  description: string;
  architecture: {
    input_modalities: string[];
    output_modalities: string[];
    tokenizer: string;
  };
  top_provider: {
    is_moderated: boolean;
  };
  pricing: {
    prompt: string;
    completion: string;
    image: string;
    request: string;
    input_cache_read: string;
    input_cache_write: string;
    web_search: string;
    internal_reasoning: string;
  };
  context_length: number;
  per_request_limits: Record<string, string>;
}

export interface OpenRouterModelsResponse {
  data: OpenRouterModel[];
}

/**
 * Context management for chat history
 * Maintains a sliding window of recent messages for context
 */
class ChatContextManager {
  private history: ORMessage[] = [];

  addMessage(role: 'user' | 'assistant', content: string | ORContentPart[]): void {
    this.history.push({ role, content });
    if (this.history.length > HISTORY_WINDOW_SIZE) {
      this.history.shift();
    }
  }

  getHistory(): ORMessage[] {
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
   * Fetch available models from OpenRouter
   */
  async fetchAvailableModels(): Promise<OpenRouterModel[]> {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey ? { 'Authorization': `Bearer ${this.apiKey}` } : {})
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch models');
      }
      const data: OpenRouterModelsResponse = await response.json();
      return data.data;
    } catch (error) {
      console.error('[OpenRouter] Error fetching models:', error);
      throw error;
    }
  }

  /**
   * Send a message to the OpenRouter API and get a streaming or non-streaming response
   * If onPartialResponse is provided, will use streaming (SSE) if supported by the API
   * Returns the full response string, or error string if failed
   */
  async sendMessage(
    message: string,
    onPartialResponse?: (text: string) => void,
    options?: Partial<Omit<ORRequest, 'messages' | 'prompt' | 'model' | 'stream'>>
  ): Promise<string> {
    this.isCancelled = false;
    if (!this.apiKey) {
      return "API key not set. Please set your OpenRouter API key in the settings.";
    }

    // Add the user message to context
    this.contextManager.addMessage('user', message);

    // Prepare the messages for OpenRouter API
    const messages: ORMessage[] = [
      ...(this.customPrompt ? [{ role: 'system' as const, content: this.customPrompt }] : []),
      ...this.contextManager.getHistory()
    ];

    // Build request body
    const reqBody: ORRequest = {
      model: this.currentModel,
      messages,
      stream: !!onPartialResponse,
      ...options
    };

    // Log all request data
    console.log('[OpenRouter] Sending request:', {
      endpoint: 'https://openrouter.ai/api/v1/chat/completions',
      apiKeySet: !!this.apiKey,
      model: this.currentModel,
      messages,
      stream: reqBody.stream,
      options
    });

    try {
      if (reqBody.stream && onPartialResponse) {
        // --- Streaming via SSE ---
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          body: JSON.stringify(reqBody)
        });
        if (!response.ok || !response.body) {
          const errorText = await response.text();
          throw new Error(`OpenRouter API error: ${errorText}`);
        }
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';
        let fullResponse = '';
        let done = false;
        while (!done && !this.isCancelled) {
          const { value, done: streamDone } = await reader.read();
          done = streamDone;
          if (value) {
            buffer += decoder.decode(value, { stream: true });
            // SSE: split by newlines, process each event
            let lines = buffer.split(/\r?\n/);
            buffer = lines.pop() || '';
            for (const line of lines) {
              if (line.startsWith('data:')) {
                const dataStr = line.slice(5).trim();
                if (!dataStr || dataStr === '[DONE]') continue;
                try {
                  const chunk: ORResponse = JSON.parse(dataStr);
                  const choice = chunk.choices?.[0];
                  if (choice && 'delta' in choice && choice.delta && typeof choice.delta.content === 'string') {
                    fullResponse += choice.delta.content;
                    onPartialResponse(fullResponse);
                  }
                  // Handle finish_reason
                  if (choice && 'finish_reason' in choice && choice.finish_reason) {
                    done = true;
                    break;
                  }
                } catch (err) {
                  // Ignore parse errors for keep-alive/comments
                }
              }
            }
          }
        }
        if (this.isCancelled) {
          const stopped = fullResponse.trim() + ' [Generation stopped]';
          this.contextManager.addMessage('assistant', stopped);
          return stopped;
        }
        this.contextManager.addMessage('assistant', fullResponse);
        return fullResponse;
      } else {
        // --- Non-streaming ---
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          body: JSON.stringify(reqBody)
        });
        if (!response.ok) {
          const errorText = await response.text();
          if (errorText.includes('not a valid model ID')) {
            return `The model \"${this.currentModel}\" is not a valid OpenRouter model. Please check your model name or select a valid model from https://openrouter.ai/models.`;
          }
          throw new Error(`OpenRouter API error: ${errorText}`);
        }
        const data: ORResponse = await response.json();
        // Handle error in response
        const err = data.choices?.[0]?.error;
        if (err) {
          return `OpenRouter error: ${err.message}`;
        }
        const choice = data.choices?.[0];
        let fullResponse = '';
        if (choice) {
          if ('message' in choice && choice.message && typeof choice.message.content === 'string') {
            fullResponse = choice.message.content;
          } else if ('text' in choice && typeof choice.text === 'string') {
            fullResponse = choice.text;
          }
        }
        this.contextManager.addMessage('assistant', fullResponse);
        return fullResponse;
      }
    } catch (error) {
      const err = error as Error;
      if (typeof err.message === 'string' && err.message.includes('not a valid model ID')) {
        return `The model \"${this.currentModel}\" is not a valid OpenRouter model. Please check your model name or select a valid model from https://openrouter.ai/models.`;
      }
      console.error('[OpenRouter] Error generating response:', error);
      return "I'm sorry, I encountered an error processing your request. Please try again.";
    }
  }
}

// Export a singleton instance
export const openRouterService = new OpenRouterService();