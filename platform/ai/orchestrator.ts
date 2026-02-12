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
import { parseProgramResponse, parseBlueprintResponse, LLMTruncatedJsonError } from './parsers/responseParsers';
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

async function handleGenerateBlueprint(payload: any): Promise<AIResponse> {
  console.log('\n📋 [BLUEPRINT] Starting blueprint generation...');
  
  // Accept both new programInfo format and legacy documentStructure format
  const programInfo = payload.programInfo || payload.documentStructure;
  const userContext = payload.userContext;
  
  if (!programInfo) {
    console.error('❌ [BLUEPRINT] Missing programInfo or documentStructure');
    return { success: false, error: 'Missing programInfo or documentStructure' };
  }
  
  console.log('[BLUEPRINT] Input type:', programInfo.programName ? 'programInfo' : 'documentStructure');

  // Check cache
  const cacheKey = JSON.stringify({ programInfo, context: userContext });
  const cached = getCached(blueprintCache, cacheKey);
  if (cached) {
    console.log('💾 [BLUEPRINT] Cache HIT - returning cached blueprint');
    return { success: true, data: cached.blueprint, cached: true };
  }
  console.log('📡 [BLUEPRINT] Cache MISS - calling LLM...');

  return await generateBlueprintWithRetry(programInfo, userContext, cacheKey, 0);
}

async function generateBlueprintWithRetry(
  documentStructure: any,
  userContext: any,
  cacheKey: string,
  retryCount: number
): Promise<AIResponse> {
  const userPrompt = buildBlueprintUserPrompt(documentStructure, userContext);
  console.log('[generateBlueprintWithRetry] Prompt length:', userPrompt.length, 'chars');

  // Call LLM with strict constraints - small output only
  console.log('[generateBlueprintWithRetry] Calling LLM with maxTokens=800, temperature=0.2');
  const llmResponse = await callLLM({
    messages: [
      { role: 'system', content: BLUEPRINT_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    responseFormat: 'json',
    temperature: 0.2,
    maxTokens: 800,
  });
  
  console.log('[generateBlueprintWithRetry] LLM response received:', llmResponse.output?.length || 0, 'chars');
  console.log('[generateBlueprintWithRetry] finishReason:', llmResponse.finishReason);
  
  // CRITICAL: Check for MAX_TOKENS - retry with ultra-compact output
  if (llmResponse.finishReason === 'MAX_TOKENS' && retryCount === 0) {
    console.warn('[BLUEPRINT] ⚠️ finishReason=MAX_TOKENS detected, retrying with ultra-compact JSON...');
    
    const progName = documentStructure.programName || 'Program';
    
    const ultraCompactPrompt = `Generate ULTRA-COMPACT funding blueprint for: ${progName}

Rules:
- MAX 3 sections
- MAX 1 requirement per section
- Titles: 1-3 words max
- Descriptions: 5 words max
- Total output: UNDER 2000 characters

Return ONLY this JSON structure (use minimal keys):
{"documents":[{"id":"md","name":"${progName}","p":"App","r":true}],"sections":[{"id":"s1","did":"md","t":"Title","ty":"normal","r":true,"pc":true,"req":[{"id":"r1","ti":"Req","d":"Desc","c":"financial","p":"high"}],"ap":"Write."}]}

Ultra-compact. Under 2000 chars. JSON only. Complete it fully.`;
    
    const ultraCompactResponse = await callLLM({
      messages: [
        { role: 'system', content: 'RETURN ONLY VALID JSON. NO TEXT. COMPLETE THE JSON.' },
        { role: 'user', content: ultraCompactPrompt },
      ],
      responseFormat: 'json',
      temperature: 0.1,
      maxTokens: 2000,
    });

    console.log('[BLUEPRINT] Ultra-compact response length:', ultraCompactResponse.output.length, 'chars');
    
    if (ultraCompactResponse.output) {
      try {
        const ultraBlueprint = parseBlueprintResponse(ultraCompactResponse.output);
        setCache(blueprintCache, cacheKey, { blueprint: ultraBlueprint });
        console.log('✅ [BLUEPRINT] ULTRA-COMPACT RETRY SUCCESSFUL');
        return {
          success: true,
          data: ultraBlueprint,
          llmStats: {
            provider: ultraCompactResponse.provider,
            model: ultraCompactResponse.model,
            latencyMs: ultraCompactResponse.latencyMs,
            tokens: ultraCompactResponse.usage ? {
              prompt: ultraCompactResponse.usage.promptTokens || 0,
              completion: ultraCompactResponse.usage.completionTokens || 0,
              total: ultraCompactResponse.usage.totalTokens || 0,
            } : undefined,
          },
        };
      } catch (ultraError) {
        console.error('[BLUEPRINT] Ultra-compact retry also failed:', ultraError);
      }
    }
  }
  
  if (!llmResponse.output) {
    console.error('❌ [BLUEPRINT] Empty LLM response');
    return { success: false, error: 'Empty LLM response' };
  }

  try {
    // Use existing parser (now strict - will throw on invalid JSON)
    const blueprint = parseBlueprintResponse(llmResponse.output);
    
    // Ensure backward compatibility: if there are documents with sections, flatten them
    let processedBlueprint = blueprint;
    if (blueprint.documents && blueprint.documents.length > 0) {
      processedBlueprint = {
        ...blueprint,
        sections: blueprint.documents.flatMap(doc => doc.sections || [])
      };
    }
    
    setCache(blueprintCache, cacheKey, { blueprint: processedBlueprint });
    console.log('✅ [BLUEPRINT] Successfully generated and cached');

    return {
      success: true,
      data: processedBlueprint,
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
  } catch (parseError) {
    // Check if this is a truncated JSON error - retry with higher maxTokens
    const isTruncatedError = parseError instanceof LLMTruncatedJsonError;
    
    if (retryCount === 0) {
      if (isTruncatedError) {
        console.warn('[BLUEPRINT] ⚠️ Truncated JSON detected, retrying with higher maxTokens...');
      } else {
        console.warn('[BLUEPRINT] ⚠️ JSON parse failed on attempt 1, retrying with stricter enforcement...');
      }
      
      // Use higher maxTokens for retry to ensure complete JSON
      const retryMaxTokens = isTruncatedError ? 1500 : 3000;
      
      // Create retry prompt with stricter instructions
      const retryUserPrompt = buildBlueprintUserPrompt(documentStructure, userContext) + 
        `

CRITICAL: Your previous response was TRUNCATED (incomplete JSON).

IMPORTANT:
- Return ONLY valid, complete JSON.
- Do NOT truncate the response.
- Finish the JSON object fully.
- Ensure all objects and arrays are properly closed with } and ].
- Do NOT stop early.
- No markdown fences. No explanations.`;
      
      const retryLlmResponse = await callLLM({
        messages: [
          { role: 'system', content: BLUEPRINT_SYSTEM_PROMPT },
          { role: 'user', content: retryUserPrompt },
        ],
        responseFormat: 'json',
        temperature: 0.2, // Lower temperature for more deterministic output
        maxTokens: retryMaxTokens,
      });

      if (!retryLlmResponse.output) {
        console.error('❌ [BLUEPRINT] Retry also failed - empty response');
        return { success: false, error: 'Blueprint generation failed after retry' };
      }

      try {
        const retryBlueprint = parseBlueprintResponse(retryLlmResponse.output);
        
        let processedBlueprint = retryBlueprint;
        if (retryBlueprint.documents && retryBlueprint.documents.length > 0) {
          processedBlueprint = {
            ...retryBlueprint,
            sections: retryBlueprint.documents.flatMap(doc => doc.sections || [])
          };
        }
        
        setCache(blueprintCache, cacheKey, { blueprint: processedBlueprint });
        console.log('✅ [BLUEPRINT] RETRY SUCCESSFUL - blueprint generated and cached');

        return {
          success: true,
          data: processedBlueprint,
          llmStats: {
            provider: retryLlmResponse.provider,
            model: retryLlmResponse.model,
            latencyMs: retryLlmResponse.latencyMs,
            tokens: retryLlmResponse.usage ? {
              prompt: retryLlmResponse.usage.promptTokens || 0,
              completion: retryLlmResponse.usage.completionTokens || 0,
              total: retryLlmResponse.usage.totalTokens || 0,
            } : undefined,
          },
        };
      } catch (retryParseError) {
        const isRetryTruncated = retryParseError instanceof LLMTruncatedJsonError;
        // Even retry failed
        console.error('❌ [BLUEPRINT] RETRY FAILED');
        if (isRetryTruncated) {
          console.error('[BLUEPRINT] Retry parse error: LLM returned truncated JSON even after increased maxTokens');
        } else {
          console.error('[BLUEPRINT] Retry parse error:', retryParseError instanceof Error ? retryParseError.message : String(retryParseError));
        }
        return {
          success: false,
          error: isRetryTruncated 
            ? 'Blueprint generation failed: LLM consistently returns truncated JSON. Check token limits or model configuration.'
            : 'Blueprint generation failed: LLM returned invalid JSON even after retry. This may indicate a model issue or token limit exceeded.',
        };
      }
    } else {
      // Already retried once, fail now
      console.error('❌ [BLUEPRINT] Parse failed on retry (attempt 2) - giving up');
      return {
        success: false,
        error: 'Blueprint generation failed: LLM unable to generate valid JSON after retry',
      };
    }
  }
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
