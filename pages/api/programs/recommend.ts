import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { createHash } from 'crypto';
import { checkRecommendRateLimit, rateLimitHeaders, rateLimitExceededResponse } from '@/platform/api/utils/rateLimit';
import { callAI } from '@/platform/ai/orchestrator';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

type UserAnswers = Record<string, any>;

interface GeneratedProgram {
  id: string;
  name: string;
  url?: string | null;
  source?: string;
  location?: string | null;
  organisation_type?: string | null;  // Standardized from company_type
  company_stage?: string | null;    // Matches questionnaire values: idea, MVP, revenue, growth
  funding_types?: string[];
  // Additional questionnaire fields
  legal_form?: string | null;       // Derived legal form based on organisation type
  co_financing_percentage?: string | null;  // User-specified co-financing percentage
  deadline_urgency?: string | null; // Timing requirements
  organisation_type_other?: string | null;  // Custom organisation type
  organisation_type_sub?: string | null;    // Sub-type for individuals
  revenue_status_category?: string | null;  // Categorical revenue status
  metadata?: {
    funding_amount_min?: number | null;
    funding_amount_max?: number | null;
    currency?: string | null;
    location?: string | null;
    description?: string | null;
    region?: string | null;
    deterministicScore?: number | null;
    deterministicConfidence?: string | null;
    deterministicEligibility?: string | null;
    structuredExplanation?: {
      matchedCriteria?: Array<Record<string, any>>;
      gaps?: Array<Record<string, any>>;
      reason?: string;
    };
  };
  // Application requirements parsed in blueprintGenerator.ts
  application_requirements?: any;
}

type LLMProvider = 'custom' | 'openai';

interface LLMStats {
  provider: LLMProvider;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  latencyMs?: number;
}

// ============================================================================
// ZOD VALIDATION SCHEMA
// ============================================================================

/**
 * Zod schema for validating user answers from questionnaire
 * Ensures runtime type safety beyond TypeScript compile-time checks
 */
const UserAnswersSchema = z.object({
  // Required fields (validated at runtime)
  location: z.string().min(1, 'Location is required'),
  organisation_type: z.string().min(1, 'Organisation type is required'),
  funding_amount: z.number().positive('Funding amount must be positive'),
  company_stage: z.enum(['idea', 'MVP', 'revenue', 'growth']),
  
  // Optional fields (with type validation)
  revenue_status: z.union([z.number().min(0), z.literal(0)]).optional(),
  revenue_status_category: z.string().optional(),
  industry_focus: z.array(z.string()).min(1).optional(),
  co_financing: z.enum(['co_yes', 'co_no', 'co_flexible']).optional(),
  co_financing_percentage: z.string().optional(),
  legal_form: z.string().optional(),
  deadline_urgency: z.string().optional(),
  use_of_funds: z.array(z.string()).optional(),
  impact_focus: z.array(z.string()).optional(),
  organisation_type_other: z.string().optional(),
  organisation_type_sub: z.enum(['no_company', 'has_company']).optional(),
  location_region: z.string().optional(),
  funding_intent: z.string().optional(),
}).strict(); // Reject unknown fields

// ============================================================================
// IN-MEMORY CACHE
// ============================================================================

/**
 * In-memory cache for program recommendations
 * Key: SHA-256 hash of normalized answers
 * Value: { programs, timestamp }
 * TTL: 1 hour (3600000ms)
 */
interface CachedPrograms {
  programs: GeneratedProgram[];
  timestamp: number;
  stats?: LLMStats;
}

const programCache = new Map<string, CachedPrograms>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Generate deterministic cache key from user answers
 * Normalizes object by sorting keys before hashing
 */
function getCacheKey(answers: Record<string, any>): string {
  // Sort keys for consistent hashing
  const sortedKeys = Object.keys(answers).sort();
  const normalized = sortedKeys.reduce((acc, key) => {
    acc[key] = answers[key];
    return acc;
  }, {} as Record<string, any>);
  
  const jsonString = JSON.stringify(normalized);
  return createHash('sha256').update(jsonString).digest('hex');
}

/**
 * Clean expired cache entries (called periodically)
 */
function cleanExpiredCache(): void {
  const now = Date.now();
  let expiredCount = 0;
  
  for (const [key, value] of programCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      programCache.delete(key);
      expiredCount++;
    }
  }
  
  if (expiredCount > 0 && process.env.NODE_ENV !== 'production') {
    console.log(`[recommend][cache] Cleaned ${expiredCount} expired entries`);
  }
}

// Clean cache every 10 minutes
setInterval(cleanExpiredCache, 10 * 60 * 1000);

// ============================================================================
// API HANDLER
// ============================================================================

const DEFAULT_MAX_RESULTS = 10;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ============================================================================
  // RATE LIMIT CHECK
  // ============================================================================
  
  const rateLimitResult = checkRecommendRateLimit(req);
  
  // Set rate limit headers on all responses
  Object.entries(rateLimitHeaders(rateLimitResult)).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  
  if (!rateLimitResult.allowed) {
    console.warn(`[recommend] Rate limit exceeded for IP`);
    const response = rateLimitExceededResponse(rateLimitResult);
    return res.status(429).json(response);
  }

  // ============================================================================
  // STEP 1: Validate Input with Zod
  // ============================================================================
  
  try {
    const validatedAnswers = UserAnswersSchema.parse(req.body?.answers || {});
    const answers = validatedAnswers as UserAnswers;
    const maxResults = Number(req.body?.max_results) || DEFAULT_MAX_RESULTS;
    
    // ============================================================================
    // STEP 2: Check Cache
    // ============================================================================
    
    const cacheKey = getCacheKey(answers);
    const cached = programCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      const cacheAge = Math.floor((Date.now() - cached.timestamp) / 1000);
      console.log(`[recommend][cache] HIT - key: ${cacheKey.substring(0, 12)}... age: ${cacheAge}s`);
      
      return res.status(200).json({
        success: true,
        programs: cached.programs.slice(0, maxResults),
        count: cached.programs.length,
        cached: true,
        cacheAge,
      });
    }
    
    console.log(`[recommend][cache] MISS - key: ${cacheKey.substring(0, 12)}...`);
    
    // ============================================================================
    // STEP 3: Generate Programs with LLM
    // ============================================================================
    
    let generated: GeneratedProgram[] = [];
    let llmStats: LLMStats | undefined;

    try {
      const generation = await generateProgramsWithLLM(answers, maxResults * 2);
      generated = generation.programs;
      llmStats = generation.stats || undefined;

      // Production-ready logging
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[recommend] Generated ${generated.length} programs via ${llmStats?.provider}`);
      }
    } catch (error: any) {
      const llmError = error?.message || 'Unknown LLM error';
      console.error('[recommend] generateProgramsWithLLM failed:', llmError);
      return res.status(500).json({
        success: false,
        error: 'Failed to generate programs',
        details: llmError,
      });
    }

    const matching = generated;
    
    // ============================================================================
    // STEP 4: Store in Cache
    // ============================================================================
    
    programCache.set(cacheKey, {
      programs: matching,
      timestamp: Date.now(),
      stats: llmStats,
    });
    
    console.log(`[recommend][cache] SET - key: ${cacheKey.substring(0, 12)}... (${matching.length} programs)`);

    return res.status(200).json({
      success: true,
      programs: matching.slice(0, maxResults),
      count: matching.length,
      cached: false,
    });
    
  } catch (error) {
    // ============================================================================
    // VALIDATION ERROR HANDLING
    // ============================================================================
    
    if (error instanceof z.ZodError) {
      const fieldErrors = error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
        received: issue.code === 'invalid_type' ? (issue as any).received : undefined,
      }));
      
      console.error('[recommend] Validation failed:', fieldErrors);
      
      return res.status(400).json({
        success: false,
        error: 'Invalid input data',
        validation_errors: fieldErrors,
      });
    }
    
    // Unexpected error
    console.error('[recommend] Unexpected error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}

async function generateProgramsWithLLM(
  answers: UserAnswers,
  maxPrograms: number
): Promise<{ programs: GeneratedProgram[]; raw: string | null; stats?: LLMStats | null }> {
  // Simplified profile (just key fields)
  const profile = [
    answers.location && `Location: ${answers.location}`,
    answers.organisation_type && `Organisation type: ${answers.organisation_type}`,
    answers.company_stage && `Company stage: ${answers.company_stage}`,
    answers.funding_amount && `Funding need: €${answers.funding_amount}`,
    answers.revenue_status !== undefined && `Revenue: €${answers.revenue_status}`,
    answers.industry_focus && `Industry: ${Array.isArray(answers.industry_focus) ? answers.industry_focus.join(', ') : answers.industry_focus}`,
    answers.co_financing && `Co-financing: ${answers.co_financing === 'co_no' ? 'ONLY grants/subsidies' : 'can accept loans/equity'}`,
    answers.co_financing_percentage && `Co-financing %: ${answers.co_financing_percentage}`,
    answers.legal_form && `Legal form: ${answers.legal_form}`,
    answers.deadline_urgency && `Timeline: ${answers.deadline_urgency}`,
    answers.use_of_funds && `Use of funds: ${Array.isArray(answers.use_of_funds) ? answers.use_of_funds.join(', ') : answers.use_of_funds}`,
    answers.impact_focus && `Impact focus: ${Array.isArray(answers.impact_focus) ? answers.impact_focus.join(', ') : answers.impact_focus}`,
    answers.organisation_type_other && `Org type (other): ${answers.organisation_type_other}`,
    answers.organisation_type_sub && `Org sub-type: ${answers.organisation_type_sub}`,
  ].filter(Boolean).join('\n');
  
  const fundingPreference = {
    allowMix: answers.co_financing !== 'co_no',
  };

  // Build LLM prompt for program recommendation
  const buildInstructions = (attempt: number = 1): string => {
    const baseInstructions = `You are an expert on European funding programs. Return up to ${maxPrograms} programs matching this profile:

${profile}

CRITICAL MATCHING RULES:
1. Location: Must be available in user's location or EU-wide
2. Organisation stage: Must accept user's stage (allow adjacent stages)
3. Funding amount: Accept programs with range €X/3 to €X*3 (±200% tolerance)
4. Co-financing: If user cannot provide co-financing, ONLY grants/subsidies/support
5. Revenue status: Pre-revenue → grants/angel/crowdfunding; Early revenue → all except large VC; Established → all types

FUNDING TYPES (use most specific subtype):
- Equity: angel_investment, venture_capital, crowdfunding, equity
- Loans: bank_loan, leasing, micro_credit, repayable_advance, loan
- Grants: grant
- Other: guarantee, visa_application, subsidy, convertible

PROGRAM REQUIREMENTS:
- Use REAL program names (e.g., "AWS Seedfinancing", "FFG Basisprogramm", "Horizon Europe", "EIC Accelerator")
- NO generic names like "General Category" or "General Program"
- Description: 2-3 sentences (what it offers, why it matches, key requirements)
- Extract ALL fields at root level (not nested in metadata)

JSON STRUCTURE:
{
  "programs": [{
    "id": "string",
    "name": "string",
    "website": "https://example.com",
    "description": "2-3 sentences",
    "funding_types": ["grant","loan"],
    "funding_amount_min": 5000,
    "funding_amount_max": 20000,
    "currency": "EUR",
    "location": "Austria",
    "region": "Austria",
    "organisation_type": "startup",
    "company_stage": "idea",
    "revenue_status": "pre_revenue",
    "industry_focus": ["digital","innovation"],
    "co_financing": "co_yes",
    "co_financing_percentage": "30%",
    "funding_amount": 50000,
    "use_of_funds": ["product_development","hiring"],
    "impact_focus": ["environmental","social"],
    "legal_form": "gmbh",
    "deadline_urgency": "3_6_months",
  }]
}

Return programs matching user profile with basic information.`;

      const diversitySection = fundingPreference.allowMix
      ? `\n\nReturn mix of funding types (grants, loans, equity)`
      : `\n\nONLY grants/subsidies (user cannot provide co-financing)`;

    const retrySection = attempt > 1
      ? `\n\nRETRY (Attempt ${attempt}): Be more lenient. Minimum ${Math.min(3, maxPrograms)} programs required.`
      : '';

    const knowledgeBase = `

KEY PROGRAMS:
- Austria: AWS Seedfinancing, FFG Basisprogramm, FFG Bridge
- Germany: KfW programs, ZIM, EXIST-Gründerstipendium
- EU-wide: Horizon Europe, EIC Accelerator, COSME, LIFE`;

    return baseInstructions + diversitySection + retrySection + knowledgeBase;
  };

  const callLLMWithFallback = async (
    messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
    temperature: number
  ): Promise<{
    responseText: string | null;
    rawResponse: string | null;
    provider: LLMProvider;
    usage?: { promptTokens?: number; completionTokens?: number; totalTokens?: number };
    latencyMs?: number;
  }> => {
    // Use unified orchestrator instead of direct LLM calls
    try {
      const aiResult = await callAI({
        type: 'recommendPrograms',
        payload: {
          messages,
          temperature,
          maxTokens: 6000,
        },
      });

      if (aiResult.success && aiResult.data) {
        return {
          responseText: aiResult.data.response || aiResult.data.content || null,
          rawResponse: aiResult.data.response || aiResult.data.content || null,
          provider: aiResult.llmStats?.provider || 'custom',
          usage: aiResult.llmStats?.tokens ? {
            promptTokens: aiResult.llmStats.tokens.prompt,
            completionTokens: aiResult.llmStats.tokens.completion,
            totalTokens: aiResult.llmStats.tokens.total,
          } : undefined,
          latencyMs: aiResult.llmStats?.latencyMs,
        };
      } else {
        throw new Error(aiResult.error || 'Orchestrator failed');
      }
    } catch (error: any) {
      console.error('[recommend] orchestrator failed:', error.message);
      throw error;
    }
  };

  // Retry logic: up to 3 attempts
  const maxAttempts = 3;
  let lastRawResponse: string | null = null;
  let lastStats: LLMStats | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const instructions = buildInstructions(attempt);
      const messages = [
        { role: 'system' as const, content: 'Return funding programs as JSON only.' },
        { role: 'user' as const, content: instructions },
      ];

      // Adjust temperature slightly for retries
      const temperature = attempt === 1 ? 0.2 : 0.3;
      const { responseText, rawResponse, provider, usage, latencyMs } = await callLLMWithFallback(
        messages,
        temperature
      );

      lastStats = {
        provider,
        promptTokens: usage?.promptTokens,
        completionTokens: usage?.completionTokens,
        totalTokens: usage?.totalTokens,
        latencyMs,
      };

      if (provider === 'openai') {
        // Log OpenAI usage if needed
      }

      if (!responseText) {
        if (attempt < maxAttempts) {
          console.warn(`[reco][recommend] Attempt ${attempt}: Empty response, retrying...`);
          continue;
        }
        return { programs: [], raw: rawResponse, stats: lastStats };
      }

      const parsed = parseProgramResponse(responseText);
      const programs = parsed.programs; // Now returns { programs: [] } structure

      // Success - return programs
      if (attempt > 1) {

      }

      // Filter out generic/invalid programs
      const cleanedPrograms = programs.filter((program: any) => {
        const name = (program.name || '').toLowerCase();
        
        // Reject generic program names
        const isGeneric = 
          name.includes('general category') ||
          name.includes('general program') ||
          name.includes('general grant') ||
          name.includes('general loan') ||
          name.includes('general funding') ||
          name.includes('category of') ||
          name.includes('represents a category') ||
          (name.startsWith('general ') && name.length < 30);
        
        if (isGeneric) {
          console.warn(`[reco][recommend] Rejecting generic program: ${program.name}`);
          return false;
        }
        
        // Require minimum name length
        if (!program.name || program.name.length < 5) {
          console.warn(`[reco][recommend] Rejecting program with invalid name: ${program.name}`);
          return false;
        }
        
        return true;
      });

      return {
        raw: rawResponse,
        stats: lastStats,
        programs: cleanedPrograms.map((program: any, index: number) => {
          // Validate program structure
          if (!program.name && !program.id) {
            console.warn(`[reco][recommend] Program at index ${index} missing name and id`);
          }

          return {
            id: program.id || `llm_${index}`,
            name: program.name || `Program ${index + 1}`,
            url: program.website || program.url || null,
            description: program.description || null,
            location: program.location || null,
            region: program.region || program.location || null,
            organisation_type: program.organisation_type || program.company_type || null,  // Support both field names
            company_stage: program.company_stage || null,
            funding_types: Array.isArray(program.funding_types) ? program.funding_types : [],
            funding_amount_min: program.funding_amount_min ?? null,
            funding_amount_max: program.funding_amount_max ?? null,
            currency: program.currency || 'EUR',
            // Additional questionnaire fields
            legal_form: program.legal_form || null,
            co_financing_percentage: program.co_financing_percentage || null,
            deadline_urgency: program.deadline_urgency || null,
            organisation_type_other: program.organisation_type_other || null,
            organisation_type_sub: program.organisation_type_sub || null,
            revenue_status_category: program.revenue_status_category || null,
            // Existing fields
            program_focus: Array.isArray(program.program_focus) ? program.program_focus : (program.metadata?.program_focus || []),
            co_financing_required: program.co_financing_required ?? program.metadata?.co_financing_required ?? null,
            deadline: program.deadline || null,
            open_deadline: program.open_deadline ?? false,
            use_of_funds: Array.isArray(program.use_of_funds) ? program.use_of_funds : null,
            impact_focus: Array.isArray(program.impact_focus) ? program.impact_focus : null,
            // New fields
            repayable: program.repayable ?? (Array.isArray(program.funding_types) && program.funding_types.includes('loan')),
            repayable_percentage: program.repayable_percentage ?? null,
            repayable_type: program.repayable_type ?? (
              Array.isArray(program.funding_types) 
                ? (program.funding_types.includes('grant') && program.funding_types.includes('loan') ? 'mixed' :
                   program.funding_types.includes('loan') ? 'loan' :
                   program.funding_types.includes('grant') ? 'grant' : null)
                : null
            ),
            timeline: {
              application_deadline: program.timeline?.application_deadline || program.application_deadline || null,
              decision_time: program.timeline?.decision_time || program.decision_time || null,
              funding_start: program.timeline?.funding_start || program.funding_start || null,
            },
            effort_level: program.effort_level || 'medium',
            // Renamed fields (normalized)
            eligible_company_types: program.eligible_company_types || [program.organisation_type || program.company_type] || null,
            eligible_stage: program.eligible_stage || program.company_stage || null,
            metadata: {
              organization: program.organization || program.metadata?.organization || null,
              typical_timeline: program.typical_timeline || program.metadata?.typical_timeline || null,
              competitiveness: program.competitiveness || program.metadata?.competitiveness || null,
              // Preserve any additional metadata fields
              ...program.metadata
            },
            application_requirements: program.application_requirements || null,  // Use actual LLM data or null
            source: 'llm_generated',
            
            // Derived fields (computed once)
            is_grant: Array.isArray(program.funding_types) ? program.funding_types.includes('grant') : false,
            is_loan: Array.isArray(program.funding_types) ? program.funding_types.includes('loan') : false,
            funding_range: program.funding_amount_min && program.funding_amount_max 
              ? `${program.currency || 'EUR'}${program.funding_amount_min.toLocaleString()}–${program.funding_amount_max.toLocaleString()}`
              : null,
            deadline_display: program.open_deadline ? "Rolling" : (program.timeline?.application_deadline || program.deadline || null),
          };
        }),
      };
    } catch (error: any) {
      lastRawResponse = null;
      console.error(`[reco][recommend] Attempt ${attempt} failed:`, error?.message || error);
      
      if (attempt < maxAttempts) {
        console.log(`[reco][recommend] Retrying... (${attempt + 1}/${maxAttempts})`);
        // Wait briefly before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      } else {
        console.error(`[reco][recommend] All ${maxAttempts} attempts failed. Last error:`, error?.message || error);
        throw error;
      }
    }
  }

  // Should not reach here, but handle edge case
  return { programs: [], raw: lastRawResponse, stats: lastStats };
}
import { parseProgramResponse } from '@/platform/ai/parsers/responseParsers';






