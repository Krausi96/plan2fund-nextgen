/**
 * AI ORCHESTRATOR - Simplified
 * Routes to existing prompts and parsers
 * Adds: centralized caching only
 * Validation schemas imported from core/validation
 */

import { createHash } from 'crypto';
import { callLLM } from './llmClient';
import { RECOMMENDATION_SYSTEM_PROMPT, buildRecommendationUserPrompt } from './prompts/recommendation';
import { BLUEPRINT_SYSTEM_PROMPT, buildBlueprintUserPrompt } from './prompts/blueprint';
import { buildSectionWritingPrompt, buildSectionImprovementPrompt } from './prompts/section';
import { parseProgramResponse, parseBlueprintResponse } from './parsers/responseParsers';
import { UserAnswersSchema, BlueprintRequestSchema } from '@/platform/core/validation';

// ============================================================================
// CACHE (Centralized)
// ============================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const programCache = new Map<string, CacheEntry<any>>();
const blueprintCache = new Map<string, CacheEntry<any>>();
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
    latencyMs: number;
    tokens?: { prompt: number; completion: number; total: number };
  };
  cached?: boolean;
  cacheAge?: number;
}

export async function callAI(request: AIRequest): Promise<AIResponse> {
  switch (request.type) {
    case 'recommendPrograms':
      return handleRecommendPrograms(request.payload);
    case 'generateBlueprint':
      return handleGenerateBlueprint(request.payload);
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
  const validated = UserAnswersSchema.safeParse(payload.answers);
  if (!validated.success) {
    return { success: false, error: 'Invalid answers', data: validated.error?.format() };
  }
  const answers = validated.data;
  const maxResults = payload.max_results || 10;
  const projectOneliner = payload.oneliner || '';

  // Validate deadline is in the future
  const validatedDeadline = ensureFutureDate(answers.deadline_urgency, 'deadline_urgency');

  // Build profile for prompt - include ALL required fields
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

  // Check cache
  const cacheKey = getCacheKey(answers);
  const cached = getCached(programCache, cacheKey);
  if (cached) {
    return { success: true, data: cached.programs?.slice(0, maxResults) || [], cached: true };
  }

  // Use existing prompt builder
  const userPrompt = buildRecommendationUserPrompt(profile, maxResults);

  // Call LLM
  const llmResponse = await callLLM({
    messages: [
      { role: 'system', content: RECOMMENDATION_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    responseFormat: 'json',
    temperature: 0.2,
    maxTokens: 6000,
  });

  if (!llmResponse.output) {
    return { success: false, error: 'Empty LLM response' };
  }

  // Use existing parser
  const parsed = parseProgramResponse(llmResponse.output);
  setCache(programCache, cacheKey, parsed);

  return {
    success: true,
    data: parsed.programs?.slice(0, maxResults) || [],
    llmStats: {
      provider: llmResponse.provider,
      latencyMs: llmResponse.latencyMs,
      tokens: llmResponse.usage ? {
        prompt: llmResponse.usage.promptTokens || 0,
        completion: llmResponse.usage.completionTokens || 0,
        total: llmResponse.usage.totalTokens || 0,
      } : undefined,
    },
  };
}

async function handleGenerateBlueprint(payload: any): Promise<AIResponse> {
  const validated = BlueprintRequestSchema.safeParse(payload);
  if (!validated.success) {
    return { success: false, error: 'Invalid blueprint request', data: validated.error?.format() };
  }
  const { documentStructure, userContext } = validated.data;

  // Check cache
  const cacheKey = documentStructure.id;
  const cached = getCached(blueprintCache, cacheKey);
  if (cached) {
    return { success: true, data: cached.blueprint, cached: true };
  }

  // Use existing prompt builder
  const userPrompt = buildBlueprintUserPrompt(documentStructure, userContext);

  // Call LLM
  const llmResponse = await callLLM({
    messages: [
      { role: 'system', content: BLUEPRINT_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    responseFormat: 'json',
    temperature: 0.3,
    maxTokens: 8000,
  });

  if (!llmResponse.output) {
    return { success: false, error: 'Empty LLM response' };
  }

  // Use existing parser
  const blueprint = parseBlueprintResponse(llmResponse.output);
  setCache(blueprintCache, cacheKey, { blueprint });

  return {
    success: true,
    data: blueprint,
    llmStats: {
      provider: llmResponse.provider,
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
    data: parseBlueprintResponse(llmResponse.output),
    llmStats: { provider: llmResponse.provider, latencyMs: llmResponse.latencyMs },
  };
}

async function handleWriteSection(payload: any): Promise<AIResponse> {
  const { sectionTitle, context, guidance } = payload;
  if (!sectionTitle || !context) return { success: false, error: 'Missing sectionTitle or context' };

  const userPrompt = buildSectionWritingPrompt(sectionTitle, guidance);

  const llmResponse = await callLLM({
    messages: [
      { role: 'system', content: 'You are an expert business plan writer.' },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    maxTokens: 2000,
  });

  if (!llmResponse.output) return { success: false, error: 'Empty LLM response' };

  return {
    success: true,
    data: { content: llmResponse.output },
    llmStats: { provider: llmResponse.provider, latencyMs: llmResponse.latencyMs },
  };
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
    llmStats: { provider: llmResponse.provider, latencyMs: llmResponse.latencyMs },
  };
}
