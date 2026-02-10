/**
 * UNIFIED LLM CLIENT
 * Single entry point for all LLM calls
 * Consolidates: customLLM.ts + OpenAI initialization
 * Handles: Gemini, OpenRouter, Groq, OpenAI, Hugging Face formats
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
 * Central LLM call with fallback logic
 * Try custom LLM first, fallback to OpenAI
 */
export async function callLLM(request: LLMRequest): Promise<LLMResponse> {
  const started = Date.now();

  // Use OpenAI
  if (openaiClient) {
    const completion = await openaiClient.chat.completions.create({
      model: request.model || process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: request.messages,
      max_tokens: request.maxTokens,
      temperature: request.temperature,
      ...(request.responseFormat === 'json' ? { response_format: { type: 'json_object' } } : {}),
    });

    const latencyMs = Date.now() - started;
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
  throw new Error('No LLM configured. Set OPENAI_API_KEY');
}
