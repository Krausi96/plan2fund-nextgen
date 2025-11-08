/**
 * Custom LLM Wrapper
 * Provides optional integration with self-hosted / fine-tuned models.
 * Falls back to OpenAI when custom endpoint is disabled or fails.
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'json' | 'text';
}

export interface ChatResponse {
  id: string;
  model: string;
  createdAt: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  output: string;
  latencyMs: number;
  provider: 'custom' | 'fallback';
}

interface CustomLLMConfig {
  endpoint: string;
  apiKey?: string;
  model?: string;
  timeoutMs: number;
}

// OpenRouter can be slow, especially on free tier
// Reduced from 60s to 40s for faster failures (with retry logic, this is safe)
const DEFAULT_TIMEOUT = parseInt(process.env.CUSTOM_LLM_TIMEOUT || '40000', 10); // 40 seconds (configurable)

function now(): number {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now();
  }
  return Date.now();
}

function getConfig(): CustomLLMConfig | null {
  const endpoint = process.env.CUSTOM_LLM_ENDPOINT;
  if (!endpoint) {
    return null;
  }

  return {
    endpoint,
    apiKey: process.env.CUSTOM_LLM_API_KEY,
    model: process.env.CUSTOM_LLM_MODEL || 'plan2fund-custom-1',
    timeoutMs: process.env.CUSTOM_LLM_TIMEOUT
      ? Number(process.env.CUSTOM_LLM_TIMEOUT)
      : DEFAULT_TIMEOUT,
  };
}

export function isCustomLLMEnabled(): boolean {
  return getConfig() !== null;
}

export class CustomLLMError extends Error {
  public status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'CustomLLMError';
    this.status = status;
  }
}

export async function callCustomLLM(request: ChatRequest): Promise<ChatResponse> {
  const config = getConfig();
  if (!config) {
    throw new CustomLLMError('Custom LLM not configured');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);
  const started = now();

  try {
    // Log request for debugging (without sensitive data)
    console.log(`🔗 Calling Custom LLM: ${config.endpoint}, model: ${request.model || config.model}`);
    
    const requestBody = {
      model: request.model || config.model,
      messages: request.messages,
      temperature: request.temperature ?? 0.2,
      max_tokens: request.maxTokens,
      // OpenRouter requires response_format as object for JSON mode
      ...(request.responseFormat === 'json' ? { response_format: { type: 'json_object' } } : {}),
    };
    
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
        // OpenRouter requires HTTP-Referer header
        ...(config.endpoint.includes('openrouter.ai') ? { 
          'HTTP-Referer': 'https://plan2fund.com',
          'X-Title': 'Plan2Fund Scraper'
        } : {}),
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      let errorMessage = `Custom LLM request failed (${response.status}): ${errorText}`;
      
      // Handle rate limits specifically
      if (response.status === 429) {
        errorMessage = `Rate limit hit (429): ${errorText}. OpenRouter free tier has rate limits. Wait a moment or upgrade.`;
      }
      
      throw new CustomLLMError(errorMessage, response.status);
    }

    const json = await response.json();
    const latencyMs = now() - started;

    // Expecting OpenAI-compatible response structure. Fall back to best-effort parsing.
    const output = json.choices?.[0]?.message?.content
      || json.output
      || json.content
      || JSON.stringify(json);

    return {
      id: json.id || `custom-${Date.now()}`,
      model: json.model || config.model || 'custom-model',
      createdAt: new Date().toISOString(),
      usage: {
        promptTokens: json.usage?.prompt_tokens,
        completionTokens: json.usage?.completion_tokens,
        totalTokens: json.usage?.total_tokens,
      },
      output,
      latencyMs,
      provider: 'custom',
    };
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new CustomLLMError('Custom LLM request timed out', 504);
    }
    if (error instanceof CustomLLMError) {
      throw error;
    }
    throw new CustomLLMError(error?.message || 'Custom LLM request failed');
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Utility helper: try custom LLM, fall back to a provided handler on failure.
 */
export async function withCustomLLMFallback(
  request: ChatRequest,
  fallback: () => Promise<string>
): Promise<ChatResponse> {
  if (!isCustomLLMEnabled()) {
    const fallbackOutput = await fallback();
    return {
      id: `fallback-${Date.now()}`,
      model: 'openai-fallback',
      createdAt: new Date().toISOString(),
      output: fallbackOutput,
      latencyMs: 0,
      provider: 'fallback',
    };
  }

  try {
    const custom = await callCustomLLM(request);
    return custom;
  } catch (error) {
    console.warn('[CustomLLM] Falling back to OpenAI:', error);
    const fallbackOutput = await fallback();
    return {
      id: `fallback-${Date.now()}`,
      model: 'openai-fallback',
      createdAt: new Date().toISOString(),
      output: fallbackOutput,
      latencyMs: 0,
      provider: 'fallback',
    };
  }
}
