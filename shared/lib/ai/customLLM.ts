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

// Increased timeout for complex prompts with many funding types and detailed descriptions
const DEFAULT_TIMEOUT = parseInt(process.env.CUSTOM_LLM_TIMEOUT || '90000', 10); // 90 seconds (configurable)

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
    
    // Check if this is Hugging Face Inference API (old format - deprecated)
    // New router.huggingface.co uses OpenAI-compatible format
    const isHuggingFaceOldFormat = config.endpoint.includes('api-inference.huggingface.co');
    // Check if this is Google Gemini API
    const isGemini = config.endpoint.includes('generativelanguage.googleapis.com');
    
    let requestBody: any;
    let headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Gemini uses x-goog-api-key header, others use Authorization Bearer
    if (isGemini) {
      headers['x-goog-api-key'] = config.apiKey || '';
    } else {
      headers['Authorization'] = config.apiKey ? `Bearer ${config.apiKey}` : '';
    }
    
    if (isGemini) {
      // Google Gemini API format
      // Convert messages to Gemini's contents format
      const contents: any[] = [];
      for (const msg of request.messages) {
        if (msg.role === 'system') {
          // Gemini doesn't have system role, prepend to first user message
          if (contents.length === 0 || contents[contents.length - 1].role !== 'user') {
            contents.push({
              role: 'user',
              parts: [{ text: `System: ${msg.content}\n\n` }]
            });
          } else {
            contents[contents.length - 1].parts[0].text = `System: ${msg.content}\n\n${contents[contents.length - 1].parts[0].text}`;
          }
        } else if (msg.role === 'user') {
          contents.push({
            role: 'user',
            parts: [{ text: msg.content }]
          });
        } else if (msg.role === 'assistant') {
          contents.push({
            role: 'model',
            parts: [{ text: msg.content }]
          });
        }
      }
      
      requestBody = {
        contents: contents,
        generationConfig: {
          temperature: request.temperature ?? 0.2,
          maxOutputTokens: request.maxTokens || 8000, // Increased to handle thoughts overhead
          ...(request.responseFormat === 'json' ? { 
            responseMimeType: 'application/json',
            // Add schema to force structured output and reduce thoughts overhead
            responseSchema: {
              type: 'object',
              properties: {
                programs: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      name: { type: 'string' },
                      website: { type: 'string' },
                      funding_types: { type: 'array', items: { type: 'string' } },
                      funding_amount_min: { type: 'number' },
                      funding_amount_max: { type: 'number' },
                      currency: { type: 'string' },
                      location: { type: 'string' },
                      company_type: { type: 'string' },
                      company_stage: { type: 'string' },
                      description: { type: 'string' }
                    },
                    required: ['id', 'name', 'funding_types']
                  }
                }
              },
              required: ['programs']
            }
          } : {}),
        }
      };
    } else if (isHuggingFaceOldFormat) {
      // Hugging Face Inference API format (old deprecated endpoint)
      // Convert messages to a single prompt string
      const prompt = request.messages
        .map(msg => {
          if (msg.role === 'system') return `System: ${msg.content}`;
          if (msg.role === 'user') return `User: ${msg.content}`;
          if (msg.role === 'assistant') return `Assistant: ${msg.content}`;
          return msg.content;
        })
        .join('\n\n');
      
      requestBody = {
        inputs: prompt,
        parameters: {
          max_new_tokens: request.maxTokens || 4000,
          temperature: request.temperature ?? 0.2,
          return_full_text: false,
        }
      };
    } else {
      // OpenAI-compatible format (Groq, OpenRouter, etc.)
      requestBody = {
        model: request.model || config.model,
        messages: request.messages,
        temperature: request.temperature ?? 0.2,
        max_tokens: request.maxTokens,
        // OpenRouter requires response_format as object for JSON mode
        ...(request.responseFormat === 'json' ? { response_format: { type: 'json_object' } } : {}),
      };
      
      // OpenRouter requires HTTP-Referer header
      if (config.endpoint.includes('openrouter.ai')) {
        headers['HTTP-Referer'] = 'https://plan2fund.com';
        headers['X-Title'] = 'Plan2Fund Scraper';
      }
    }
    
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers,
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

    // Parse response based on provider format
    let output: string;
    if (isGemini) {
      // Gemini returns { candidates: [{ content: { parts: [{ text: "..." }] } }] }
      const candidate = json.candidates?.[0];
      if (candidate?.content?.parts?.[0]?.text) {
        output = candidate.content.parts[0].text;
      } else if (candidate?.content?.parts && candidate.content.parts.length > 0) {
        // Try to get text from any part
        const textPart = candidate.content.parts.find((p: any) => p.text);
        output = textPart?.text || JSON.stringify(json);
      } else {
        // Log full response for debugging
        console.warn('⚠️ Gemini response missing text parts:', JSON.stringify(candidate?.content || {}));
        console.warn('⚠️ Full Gemini response payload:', JSON.stringify(json));
        output = JSON.stringify(json);
      }
    } else if (isHuggingFaceOldFormat) {
      // Hugging Face returns { generated_text: "..." } or array [{ generated_text: "..." }]
      if (Array.isArray(json)) {
        output = json[0]?.generated_text || json[0]?.text || '';
      } else {
        output = json.generated_text || json.text || '';
      }
      // Remove the original prompt if return_full_text was true
      if (output && request.messages.length > 0) {
        const prompt = request.messages.map(m => m.content).join('\n\n');
        if (output.startsWith(prompt)) {
          output = output.substring(prompt.length).trim();
        }
      }
    } else {
      // OpenAI-compatible response structure
      output = json.choices?.[0]?.message?.content
        || json.output
        || json.content
        || JSON.stringify(json);
    }

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
