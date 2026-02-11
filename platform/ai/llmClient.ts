/**
 * UNIFIED LLM CLIENT
 * Single entry point for all LLM calls
 * Handles: OpenAI, custom LLM endpoints (Groq, OpenRouter, Gemini, etc.)
 */

import OpenAI from 'openai';

export interface LLMRequest {
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'json' | 'text';
}

export interface LLMResponse {
  output: string;
  model: string;
  provider: 'custom' | 'openai';
  latencyMs: number;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

// Initialize OpenAI client (only if API key is set)
const openaiClient = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

/**
 * Generic custom LLM endpoint caller
 * Supports OpenAI-compatible endpoints (Groq, OpenRouter, etc.) and Gemini
 */
async function callCustomLLMEndpoint(
  request: LLMRequest,
  endpoint: string,
  apiKey: string,
  provider: string
): Promise<{ output: string; model: string; latencyMs: number; usage?: any }> {
  const started = Date.now();

  // Gemini API uses different format
  if (provider === 'gemini') {
    return callGeminiAPI(request, endpoint, apiKey);
  }

  // OpenAI-compatible format (Groq, OpenRouter, etc.)
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      messages: request.messages,
      temperature: request.temperature,
      max_tokens: request.maxTokens,
      model: request.model || process.env.CUSTOM_LLM_MODEL || 'gpt-4',
      ...(request.responseFormat === 'json' ? { response_format: { type: 'json_object' } } : {}),
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Custom LLM (${provider}) failed: ${response.status} ${errorData}`);
  }

  const data = await response.json();
  const latencyMs = Date.now() - started;

  return {
    output: data.choices?.[0]?.message?.content || '',
    model: data.model || request.model || 'custom',
    latencyMs,
    usage: data.usage,
  };
}

/**
 * Gemini API caller (Google)
 * Converts OpenAI format to Gemini format
 */
async function callGeminiAPI(
  request: LLMRequest,
  endpoint: string,
  apiKey: string
): Promise<{ output: string; model: string; latencyMs: number; usage?: any }> {
  const started = Date.now();

  // Convert messages to Gemini format
  const contents = request.messages.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }],
  }));

  // Gemini API expects key as query param
  const url = `${endpoint}?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents,
      generationConfig: {
        temperature: request.temperature || 0.7,
        maxOutputTokens: request.maxTokens || 2048,
        topP: 0.95,
        topK: 64,
      },
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Gemini API failed: ${response.status} ${errorData}`);
  }

  const data = await response.json();
  const latencyMs = Date.now() - started;

  // Extract text from Gemini response
  const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

  return {
    output: textContent,
    model: process.env.CUSTOM_LLM_MODEL || 'gemini-2.5-flash',
    latencyMs,
    usage: data.usageMetadata,
  };
}

/**
 * Central LLM call with fallback logic
 * Try custom LLM first, fallback to OpenAI
 */
export async function callLLM(request: LLMRequest): Promise<LLMResponse> {
  const started = Date.now();
  let lastCustomError: Error | null = null;

  // Try custom LLM first if configured
  const customEndpoint = process.env.CUSTOM_LLM_ENDPOINT;
  const customApiKey = process.env.CUSTOM_LLM_API_KEY;
  const customProvider = process.env.CUSTOM_LLM_PROVIDER;

  if (customEndpoint && customApiKey && customProvider) {
    try {
      console.log('🔌 [llmClient] Trying custom LLM provider:', customProvider);
      const customResponse = await callCustomLLMEndpoint(request, customEndpoint, customApiKey, customProvider);
      console.log('✅ [llmClient] Custom LLM succeeded');
      return {
        output: customResponse.output,
        model: customResponse.model,
        provider: 'custom',
        latencyMs: customResponse.latencyMs,
        usage: customResponse.usage,
      };
    } catch (error) {
      lastCustomError = error instanceof Error ? error : new Error(String(error));
      console.warn('[llmClient] Custom LLM failed, attempting OpenAI fallback:', lastCustomError.message);
    }
  }

  // Fallback to OpenAI
  if (openaiClient) {
    console.log('🔌 [llmClient] Trying OpenAI fallback');
    const completion = await openaiClient.chat.completions.create({
      model: request.model || process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: request.messages,
      max_tokens: request.maxTokens,
      temperature: request.temperature,
      ...(request.responseFormat === 'json' ? { response_format: { type: 'json_object' } } : {}),
    });

    const latencyMs = Date.now() - started;
    console.log('✅ [llmClient] OpenAI succeeded');
    return {
      output: completion.choices[0]?.message?.content || '',
      model: completion.model,
      provider: 'openai',
      latencyMs,
      usage: {
        promptTokens: completion.usage?.prompt_tokens,
        completionTokens: completion.usage?.completion_tokens,
        totalTokens: completion.usage?.total_tokens,
      },
    };
  }

  // No LLM configured
  if (lastCustomError) {
    throw lastCustomError;
  }

  throw new Error('No LLM configured. Set OPENAI_API_KEY or CUSTOM_LLM_ENDPOINT + CUSTOM_LLM_API_KEY');
}
