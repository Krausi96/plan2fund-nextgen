/**
 * UNIFIED LLM CLIENT
 * Single entry point for all LLM calls
 * Consolidates: customLLM.ts + OpenAI initialization
 * Handles: Gemini, OpenRouter, Groq, OpenAI, Hugging Face formats
 */

import { callCustomLLM, isCustomLLMEnabled, CustomLLMError } from '@/features/ai/clients/customLLM';
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
  let lastCustomError: Error | null = null;

  // Try custom LLM first if enabled
  if (isCustomLLMEnabled()) {
    try {
      const customResponse = await callCustomLLM({
        messages: request.messages,
        temperature: request.temperature,
        maxTokens: request.maxTokens,
        responseFormat: request.responseFormat,
      });

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
  if (lastCustomError) {
    throw lastCustomError;
  }

  throw new Error('No LLM configured. Set OPENAI_API_KEY or CUSTOM_LLM_ENDPOINT');
}

export { CustomLLMError, isCustomLLMEnabled };
