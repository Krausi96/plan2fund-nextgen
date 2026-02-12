/**
 * AI ORCHESTRATOR - Simplified
 * Routes to existing prompts and parsers
 * Adds: centralized caching only
 * Validation schemas imported from core/validation
 */

import { createHash } from 'crypto';
import { callLLM } from './llmClient';
import { RECOMMENDATION_SYSTEM_PROMPT, buildRecommendationUserPrompt } from './prompts/recommendation';
import { buildSectionWritingPrompt, buildSectionImprovementPrompt } from './prompts/section';
import { parseProgramResponse } from './parsers/responseParsers';
import { UserAnswersSchema } from '@/platform/core/validation';

// ============================================================================
// CACHE (Centralized)
// ============================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const programCache = new Map<string, CacheEntry<any>>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

function getCacheKey(data: Record<string, any>): string {
  const sortedKeys = Object.keys(data).sort();
  const normalized: Record<string, any> = {};
  sortedKeys.forEach(key => { normalized[key] = data[key]; });
  return createHash('sha256').update(JSON.stringify(normalized)).digest('hex');
}

function getCached<T>(cache: Map<string, CacheEntry<T>>, key: string): T | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) return entry.data;
  return null;
}

function setCache<T>(cache: Map<string, CacheEntry<T>>, key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

// ============================================================================
// MAIN ORCHESTRATOR
// ============================================================================

export type AITaskType =
  | 'recommendPrograms'
  | 'generateBlueprint'
  | 'analyzeBusiness'
  | 'writeSection'
  | 'improveSection';

export interface AIRequest {
  type: AITaskType;
  payload: Record<string, any>;
}

export interface AIResponse {
  success: boolean;
  data?: any;
  error?: string;
  llmStats?: {
    provider: 'custom' | 'openai';
    model?: string;
    latencyMs: number;
    tokens?: { prompt: number; completion: number; total: number };
  };
  cached?: boolean;
  cacheAge?: number;
  fallback?: boolean;
  message?: string;
}

export async function callAI(request: AIRequest): Promise<AIResponse> {
  switch (request.type) {
    case 'recommendPrograms':
      return handleRecommendPrograms(request.payload);
    case 'analyzeBusiness':
      return handleAnalyzeBusiness(request.payload);
    case 'writeSection':
      return handleWriteSection(request.payload);
    case 'improveSection':
      return handleImproveSection(request.payload);
    default:
      return { success: false, error: `Unknown AI task type: ${request.type}` };
  }
}

// ============================================================================
// DATE VALIDATION UTILITY
// ============================================================================

function ensureFutureDate(dateValue: string | undefined, fieldName: string): string | undefined {
  if (!dateValue) return undefined;
  
  const date = new Date(dateValue);
  const now = new Date();
  
  if (isNaN(date.getTime())) {
    console.warn(`[orchestrator] Invalid ${fieldName} date format: ${dateValue}`);
    return undefined;
  }
  
  if (date <= now) {
    console.warn(`[orchestrator] ${fieldName} is in the past (${dateValue}), adjusting to future date`);
    // Return a reasonable future date (1 year from now)
    const futureDate = new Date(now);
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    return futureDate.toISOString();
  }
  
  return dateValue;
}

// ============================================================================
// HANDLERS (Use existing prompts/parsers)
// ============================================================================

async function handleRecommendPrograms(payload: any): Promise<AIResponse> {
  console.log('🔍 [orch] recommendPrograms START');
  const validated = UserAnswersSchema.safeParse(payload.answers);
  if (!validated.success) {
    console.error('❌ [orch] Validation failed:', JSON.stringify(validated.error.format(), null, 2));
    console.error('📊 [orch] Received fields:', Object.keys(payload.answers));
    return { success: false, error: 'Invalid answers', data: validated.error?.format() };
  }
  const answers = validated.data;
  const maxResults = payload.max_results || 10;
  const projectOneliner = payload.oneliner || '';
  const language = payload.language || 'en';

  const validatedDeadline = ensureFutureDate(answers.deadline_urgency, 'deadline_urgency');

  const profile = [
    projectOneliner ? `Project pitch: ${projectOneliner}` : null,
    `Location: ${answers.location}`,
    `Organisation type: ${answers.organisation_type}`,
    answers.organisation_type_sub === 'has_company' && answers.legal_form ? `Legal form: ${answers.legal_form}` : null,
    `Company stage: ${answers.company_stage}`,
    `Funding need: €${answers.funding_amount}`,
    answers.revenue_status !== undefined ? `Revenue status: ${answers.revenue_status === 0 ? 'Pre-revenue' : '€' + answers.revenue_status}` : null,
    answers.industry_focus?.length ? `Industry: ${answers.industry_focus.join(', ')}` : null,
    answers.use_of_funds?.length ? `Use of funds: ${answers.use_of_funds.join(', ')}` : null,
    answers.co_financing ? `Co-financing: ${answers.co_financing}` : null,
    answers.impact_focus?.length ? `Impact focus: ${answers.impact_focus.join(', ')}` : null,
    validatedDeadline ? `Deadline urgency: ${validatedDeadline}` : null,
  ].filter(Boolean).join('\n');

  const cacheKey = getCacheKey(answers);
  const cached = getCached(programCache, cacheKey);
  if (cached) {
    console.log('💾 [orch] Cache HIT -', cached.programs?.length || 0, 'programs');
    return { success: true, data: cached.programs?.slice(0, maxResults) || [], cached: true };
  }
  console.log('📡 [orch] Cache MISS - calling LLM');

  const userPrompt = buildRecommendationUserPrompt(profile, maxResults, language);

  console.log('🤖 [orch] LLM call starting...');
  const llmResponse = await callLLM({
    messages: [
      { role: 'system', content: RECOMMENDATION_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    responseFormat: 'json',
    temperature: 0.2,
    maxTokens: 8000,
  });

  if (!llmResponse.output) {
    console.error('❌ [orch] Empty LLM response');
    return { success: false, error: 'Empty LLM response' };
  }
  console.log('📥 [orch] LLM response OK -', llmResponse.output.length, 'chars');

  const parsed = parseProgramResponse(llmResponse.output);
  console.log('✨ [orch] Parsed -', parsed.programs?.length || 0, 'programs');
  setCache(programCache, cacheKey, parsed);

  return {
    success: true,
    data: parsed.programs?.slice(0, maxResults) || [],
    llmStats: {
      provider: llmResponse.provider,
      model: llmResponse.model,
      latencyMs: llmResponse.latencyMs,
      tokens: llmResponse.usage ? {
        prompt: llmResponse.usage.promptTokens || 0,
        completion: llmResponse.usage.completionTokens || 0,
        total: llmResponse.usage.totalTokens || 0,
      } : undefined,
    },
  };
}

async function handleAnalyzeBusiness(payload: any): Promise<AIResponse> {
  const { businessData } = payload;
  if (!businessData) return { success: false, error: 'Missing businessData' };

  const llmResponse = await callLLM({
    messages: [
      { role: 'system', content: 'You are a business analyst. Return JSON only.' },
      { role: 'user', content: `Analyze: ${JSON.stringify(businessData)}` },
    ],
    responseFormat: 'json',
    temperature: 0.5,
    maxTokens: 4000,
  });

  if (!llmResponse.output) return { success: false, error: 'Empty LLM response' };

  return {
    success: true,
    data: JSON.parse(llmResponse.output),
    llmStats: {
      provider: llmResponse.provider,
      model: llmResponse.model,
      latencyMs: llmResponse.latencyMs,
      tokens: llmResponse.usage ? {
        prompt: llmResponse.usage.promptTokens || 0,
        completion: llmResponse.usage.completionTokens || 0,
        total: llmResponse.usage.totalTokens || 0,
      } : undefined,
    },
  };
}

async function handleAssistantRequest(payload: any): Promise<AIResponse> {
  const { message, context, action, conversationHistory } = payload;
  
  // Extract blueprint data from context
  const { aiPrompt, requirements } = context;
  
  // Create system prompt based on action and context
  let systemPrompt = `You are an expert business plan writing assistant.`;
  if (context.programType) {
    systemPrompt += ` You specialize in ${context.programType} applications.`;
  }
  if (context.programName) {
    systemPrompt += ` You are specifically helping with the ${context.programName} program.`;
  }
  systemPrompt += `\n\nCurrent section: ${context.sectionTitle || 'Unknown section'}`;
  
  // Add blueprint requirements to system prompt if available
  if (requirements && requirements.length > 0) {
    systemPrompt += `\n\nSECTION REQUIREMENTS (must address these):`;
    requirements.forEach((req: any) => {
      const title = req.title || req.description || req;
      systemPrompt += `\n- ${title}`;
    });
  }
  
  // Create user prompt
  let userPrompt = `User request: ${message}\n\n`;
  if (context.currentContent) {
    userPrompt += `Current content in ${context.sectionTitle || 'section'}:\n${context.currentContent}\n\n`;
  }
  
  // Add aiPrompt guidance if available
  if (aiPrompt) {
    userPrompt += `GUIDANCE FROM BLUEPRINT:\n${aiPrompt}\n\n`;
  }
  
  userPrompt += `Please help with this section.`;
  
  // Build messages array with conversation history
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: systemPrompt }
  ];
  
  // Add conversation history if provided
  if (conversationHistory && conversationHistory.length > 0) {
    conversationHistory.forEach(msg => {
      messages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      });
    });
  }
  
  // Add current user message
  messages.push({ role: 'user', content: userPrompt });
  
  const llmResponse = await callLLM({
    messages,
    temperature: payload.temperature || 0.7,
    maxTokens: payload.maxTokens || 1000,
  });
  
  if (!llmResponse.output) return { success: false, error: 'Empty LLM response' };
  
  // Parse and return the response in the expected format
  try {
    const parsedResponse = JSON.parse(llmResponse.output);
    return {
      success: true,
      data: parsedResponse,
      llmStats: {
        provider: llmResponse.provider,
        model: llmResponse.model,
        latencyMs: llmResponse.latencyMs,
        tokens: llmResponse.usage ? {
          prompt: llmResponse.usage.promptTokens || 0,
          completion: llmResponse.usage.completionTokens || 0,
          total: llmResponse.usage.totalTokens || 0,
        } : undefined,
      },
    };
  } catch (error) {
    // If JSON parsing fails, return as plain text
    return {
      success: true,
      data: { content: llmResponse.output },
      llmStats: {
        provider: llmResponse.provider,
        model: llmResponse.model,
        latencyMs: llmResponse.latencyMs,
        tokens: llmResponse.usage ? {
          prompt: llmResponse.usage.promptTokens || 0,
          completion: llmResponse.usage.completionTokens || 0,
          total: llmResponse.usage.totalTokens || 0,
        } : undefined,
      },
    };
  }
}

async function handleWriteSection(payload: any): Promise<AIResponse> {
  // Handle two different payload structures:
  // 1. Traditional: { sectionTitle, context, guidance }
  // 2. Assistant: { message, context, action, conversationHistory }
  
  if (payload.message && payload.context && payload.action) {
    // This is an AI assistant request
    console.log('[WRITER] 📝 AI Assistant writing section:', payload.context?.sectionTitle);
    return await handleAssistantRequest(payload);
  } else {
    // This is a traditional section writing request
    const { sectionTitle, context, guidance } = payload;
    if (!sectionTitle || !context) {
      console.error('[WRITER] ❌ Missing sectionTitle or context');
      return { success: false, error: 'Missing sectionTitle or context' };
    }
    
    console.log('[WRITER] 📝 Writing section:', sectionTitle, '- guidance provided:', !!guidance);
    const userPrompt = buildSectionWritingPrompt(sectionTitle, guidance);
    
    const llmResponse = await callLLM({
      messages: [
        { role: 'system', content: 'You are an expert business plan writer.' },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      maxTokens: 2000,
    });
    
    if (!llmResponse.output) {
      console.error('[WRITER] ❌ Empty LLM response');
      return { success: false, error: 'Empty LLM response' };
    }
    
    console.log('[WRITER] ✅ Section written successfully:', sectionTitle);
    return {
      success: true,
      data: { content: llmResponse.output },
      llmStats: {
        provider: llmResponse.provider,
        model: llmResponse.model,
        latencyMs: llmResponse.latencyMs,
        tokens: llmResponse.usage ? {
          prompt: llmResponse.usage.promptTokens || 0,
          completion: llmResponse.usage.completionTokens || 0,
          total: llmResponse.usage.totalTokens || 0,
        } : undefined,
      },
    };
  }
}

async function handleImproveSection(payload: any): Promise<AIResponse> {
  const { sectionTitle, currentContent } = payload;
  if (!sectionTitle || !currentContent) return { success: false, error: 'Missing sectionTitle or currentContent' };

  const userPrompt = buildSectionImprovementPrompt(sectionTitle, currentContent);

  const llmResponse = await callLLM({
    messages: [
      { role: 'system', content: 'You are an expert editor.' },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.6,
    maxTokens: 2000,
  });

  if (!llmResponse.output) return { success: false, error: 'Empty LLM response' };

  return {
    success: true,
    data: { improvedContent: llmResponse.output },
    llmStats: {
      provider: llmResponse.provider,
      model: llmResponse.model,
      latencyMs: llmResponse.latencyMs,
      tokens: llmResponse.usage ? {
        prompt: llmResponse.usage.promptTokens || 0,
        completion: llmResponse.usage.completionTokens || 0,
        total: llmResponse.usage.totalTokens || 0,
      } : undefined,
    },
  };
}
