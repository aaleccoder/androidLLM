import axios, { AxiosResponse } from 'axios';
import EventSource from 'react-native-sse';

export type ORMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export interface ORRequest {
  model: string;
  messages: ORMessage[];
  stream?: boolean;
  [key: string]: unknown;
}

export interface ORResponse {
  choices: { message: { content: string } }[];
}

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

export class OpenRouterService {
  private apiKey: string = '';
  private model: string = 'openai/gpt-4o';
  private requestInProgress: boolean = false;
  private lastMessage: string | null = null;
  private lastRateLimitInfo: { limit: number; remaining: number; reset: number } | null = null;
  private currentEventSource: EventSource | null = null;
  private cancelRequested: boolean = false;

  setApiKey(key: string): void {
    this.apiKey = key;
  }

  setModel(model: string): void {
    this.model = model;
  }

  setCustomModel(model: string): void {
    this.setModel(model);
  }

  getRateLimitInfo(): { limit: number; remaining: number; reset: number } | null {
    return this.lastRateLimitInfo;
  }

  async fetchAvailableModels(): Promise<OpenRouterModel[]> {
    if (!this.apiKey) throw new Error('API key not set.');
    const response = await axios.get('https://openrouter.ai/api/v1/models', {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    // Optionally update rate limit info from headers
    this._updateRateLimitInfo(response.headers);
    return response.data.data as OpenRouterModel[];
  }

  /**
   * Cancel the current streaming (SSE) request, if any.
   */
  cancelStreaming(): void {
    if (this.currentEventSource) {
      this.cancelRequested = true;
      this.currentEventSource.close();
      this.currentEventSource = null;
      this.requestInProgress = false;
      // Optionally, you could emit an event or callback here for UI feedback
      console.log('[OpenRouter SSE] Streaming cancelled by user.');
    }
  }

  /**
   * Send a message to OpenRouter using Server-Sent Events (SSE) for true streaming.
   * Calls onPartialResponse with each new chunk of content as it arrives.
   * Returns the full response when complete, or an error object.
   */
  async sendMessage(
    message: string,
    onPartialResponse?: (text: string) => void
  ): Promise<string | { error: string }> {
    if (!this.apiKey) {
      console.error('[OpenRouter SSE] API key not set');
      return { error: 'API key not set.' };
    }
    if (this.requestInProgress) {
      return { error: 'A request is already in progress. Please wait for the current response to finish.' };
    }
    if (this.lastMessage && message.trim() === this.lastMessage.trim()) {
      return { error: 'Duplicate message detected. Please modify your input before sending again.' };
    }
    this.requestInProgress = true;
    this.lastMessage = message;
    if (!onPartialResponse) {
      const reqBody: ORRequest = {
        model: this.model,
        messages: [{ role: 'user', content: message }],
        stream: false,
      };
      try {
        console.log('[OpenRouter SSE] Sending non-streaming request:', reqBody);
        const response: AxiosResponse<ORResponse> = await axios.post(
          'https://openrouter.ai/api/v1/chat/completions',
          reqBody,
          {
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
          }
        );
        this._updateRateLimitInfo(response.headers);
        // Check for rate limit error in response
        if ((response.data as any)?.error?.code === 429) {
          const msg =
            '⚠️ Rate limit exceeded for OpenRouter free models.\n\nYou have reached your daily free request limit. Add credits to your OpenRouter account to unlock more requests. See https://openrouter.ai/pricing for details.';
          this.requestInProgress = false;
          return msg;
        }
        const content: string = response.data.choices?.[0]?.message?.content || '';
        console.log('[OpenRouter SSE] Non-streaming response:', content);
        this.requestInProgress = false;
        return content;
      } catch (error: any) {
        // Axios error: check for rate limit in error response
        const errData = error?.response?.data;
        this._updateRateLimitInfo(error?.response?.headers);
        if (errData?.error?.code === 429) {
          const msg =
            '⚠️ Rate limit exceeded for OpenRouter free models.\n\nYou have reached your daily free request limit. Add credits to your OpenRouter account to unlock more requests. See https://openrouter.ai/pricing for details.';
          this.requestInProgress = false;
          return msg;
        }
        console.error('[OpenRouter SSE] Non-streaming request error:', error);
        this.requestInProgress = false;
        return { error: error?.message || 'Request error' };
      }
    }
    // SSE streaming logic
    const url = 'https://openrouter.ai/api/v1/chat/completions';
    const reqBody: ORRequest = {
      model: this.model,
      messages: [{ role: 'user', content: message }],
      stream: true,
    };
    let fullResponse = '';
    let resolved = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    console.log('[OpenRouter SSE] Attempting SSE connection:', { url, reqBody });
    return new Promise<string | { error: string }>((resolve) => {
      try {
        const es = new EventSource(url, {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          method: 'POST',
          body: JSON.stringify(reqBody),
        });
        this.currentEventSource = es;
        this.cancelRequested = false;
        console.log('[OpenRouter SSE] EventSource created');
        timeoutId = setTimeout(() => {
          if (!resolved) {
            resolved = true;
            es.close();
            this.requestInProgress = false;
            this.currentEventSource = null;
            console.error('[OpenRouter SSE] Timeout: No response from server after 60s');
            resolve({ error: 'SSE timeout: No response from server.' });
          }
        }, 60000);
        es.addEventListener('open', () => {
          console.log('[OpenRouter SSE] Connection opened');
        });
        es.addEventListener('message', (event: { data: string | null }) => {
          if (this.cancelRequested) {
            if (!resolved) {
              resolved = true;
              es.close();
              if (timeoutId) clearTimeout(timeoutId);
              this.requestInProgress = false;
              this.currentEventSource = null;
              resolve({ error: 'Streaming cancelled by user.' });
            }
            return;
          }
          console.log('[OpenRouter SSE] Message event:', event.data);
          if (!event.data) return;
          // Check for rate limit error in SSE stream
          try {
            const json = JSON.parse(event.data);
            if (json?.error?.code === 429) {
              const msg =
                '⚠️ Rate limit exceeded for OpenRouter free models.\n\nYou have reached your daily free request limit. Add credits to your OpenRouter account to unlock more requests. See https://openrouter.ai/pricing for details.';
              if (!resolved) {
                resolved = true;
                es.close();
                if (timeoutId) clearTimeout(timeoutId);
                this.requestInProgress = false;
                this.currentEventSource = null;
                if (onPartialResponse) onPartialResponse(msg);
                resolve(msg);
              }
              return;
            }
            // Append only the new content chunk (delta)
            const content: string | undefined = json.choices?.[0]?.delta?.content;
            if (content && !this.cancelRequested) {
              fullResponse += content;
              console.log('[OpenRouter SSE] Appending new content chunk:', content);
              onPartialResponse(fullResponse);
            }
          } catch (e) {
            console.warn('[OpenRouter SSE] JSON parse error:', e, event.data);
          }
          if (event.data === '[DONE]') {
            if (!resolved) {
              resolved = true;
              es.close();
              if (timeoutId) clearTimeout(timeoutId);
              this.requestInProgress = false;
              this.currentEventSource = null;
              console.log('[OpenRouter SSE] [DONE] received, closing connection.');
              resolve(fullResponse);
            }
            return;
          }
        });
        es.addEventListener('error', (event: any) => {
          console.error('[OpenRouter SSE] Error event:', event);
          this.currentEventSource = null;
          if (!resolved) {
            resolved = true;
            es.close();
            if (timeoutId) clearTimeout(timeoutId);
            this.requestInProgress = false;
            resolve({ error: 'SSE connection error' });
          }
        });
        es.addEventListener('close', () => {
          console.log('[OpenRouter SSE] Connection closed');
          this.currentEventSource = null;
          if (!resolved) {
            resolved = true;
            if (timeoutId) clearTimeout(timeoutId);
            this.requestInProgress = false;
            resolve(fullResponse || { error: 'SSE connection closed unexpectedly.' });
          }
        });
      } catch (error: any) {
        console.error('[OpenRouter SSE] Exception during EventSource setup:', error);
        this.currentEventSource = null;
        if (!resolved) {
          resolved = true;
          if (timeoutId) clearTimeout(timeoutId);
          this.requestInProgress = false;
          resolve({ error: error?.message || 'SSE request error' });
        }
      }
    });
  }

  private _updateRateLimitInfo(headers: any): void {
    if (!headers) return;
    const limit = parseInt(headers['x-ratelimit-limit'] || headers['X-RateLimit-Limit'] || '', 10);
    const remaining = parseInt(headers['x-ratelimit-remaining'] || headers['X-RateLimit-Remaining'] || '', 10);
    const reset = parseInt(headers['x-ratelimit-reset'] || headers['X-RateLimit-Reset'] || '', 10);
    if (!isNaN(limit) && !isNaN(remaining) && !isNaN(reset)) {
      this.lastRateLimitInfo = { limit, remaining, reset };
    }
  }
}

export const openRouterService = new OpenRouterService();