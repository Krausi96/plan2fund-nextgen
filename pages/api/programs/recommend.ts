import { NextApiRequest, NextApiResponse } from 'next';

// ============================================================================
// TYPES
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

const REQUIRED_FIELDS = ['location', 'organisation_type', 'funding_amount', 'company_stage'];
const DEFAULT_MAX_RESULTS = 10;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const answers: UserAnswers = req.body?.answers || {};
  const maxResults = Number(req.body?.max_results) || DEFAULT_MAX_RESULTS;

  const missingFields = REQUIRED_FIELDS.filter((field) => answers[field] === undefined || answers[field] === null || answers[field] === '');
  if (missingFields.length > 0) {
    return res.status(400).json({
      error: 'Missing required answers',
      missing: missingFields,
    });
  }

  let generated: GeneratedProgram[] = [];
  let llmError: string | null = null;


  try {
    const generation = await generateProgramsWithLLM(answers, maxResults * 2);
    generated = generation.programs;


    // Production-ready logging
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[reco][recommend] Generated ${generated.length} programs`);
    }
  } catch (error: any) {
    llmError = error?.message || 'Unknown LLM error';
    console.error('generateProgramsWithLLM failed:', llmError);
  }

  // LLM already matches programs - no fallback needed (simplified)
  const matching = generated;

  return res.status(200).json({
    success: true,
    programs: matching.slice(0, maxResults),
    count: matching.length,
  });
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
    answers.industry_focus && `Industry: ${Array.isArray(answers.industry_focus) ? answers.industry_focus.join(', ') : answers.industry_focus}`,
    answers.co_financing && `Co-financing: ${answers.co_financing === 'co_no' ? 'ONLY grants/subsidies' : 'can accept loans/equity'}`,
    answers.co_financing_percentage && `Co-financing %: ${answers.co_financing_percentage}`,
    answers.legal_form && `Legal form: ${answers.legal_form}`,
    answers.deadline_urgency && `Timeline: ${answers.deadline_urgency}`,
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

  const { isCustomLLMEnabled, callCustomLLM } = await import('../../../features/ai/clients/customLLM');
  const OpenAI = (await import('openai')).default;

  const CUSTOM_MAX_TOKENS = 6000;
  const OPENAI_MAX_TOKENS = 3000;

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
    let lastCustomError: Error | null = null;

    if (isCustomLLMEnabled()) {
      const started = Date.now();
      try {
        const response = await callCustomLLM({
          messages,
          responseFormat: 'json',
          temperature,
          maxTokens: CUSTOM_MAX_TOKENS, // Trimmed to reduce latency/timeouts while keeping headroom
        });
        const latencyMs = response.latencyMs ?? Date.now() - started;
        return {
          responseText: response.output,
          rawResponse: response.output,
          provider: 'custom',
          usage: response.usage,
          latencyMs,
        };
      } catch (error: any) {

        lastCustomError = error instanceof Error ? error : new Error(error?.message || 'LLM failed');
        console.warn(`[reco][recommend] LLM failed, using OpenAI fallback`);
      }
    }

    if (process.env.OPENAI_API_KEY) {
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const started = Date.now();
      const completion = await client.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages,
        response_format: { type: 'json_object' },
        max_tokens: OPENAI_MAX_TOKENS, // Slightly reduced to avoid long generations that can stall
        temperature,
      });
      const responseText = completion.choices[0]?.message?.content || null;
      const latencyMs = Date.now() - started;
      return {
        responseText,
        rawResponse: responseText,
        provider: 'openai',
        usage: {
          promptTokens: completion.usage?.prompt_tokens,
          completionTokens: completion.usage?.completion_tokens,
          totalTokens: completion.usage?.total_tokens,
        },
        latencyMs,
      };
    }

    if (lastCustomError) {
      throw lastCustomError;
    }

    throw new Error('No LLM configured');
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

      if (provider === 'openai' && isCustomLLMEnabled()) {

      }

      if (!responseText) {
        if (attempt < maxAttempts) {
          console.warn(`[reco][recommend] Attempt ${attempt}: Empty response, retrying...`);
          continue;
        }
        return { programs: [], raw: rawResponse, stats: lastStats };
      }

      const parsed = parseLLMResponse(responseText);
      let programs = Array.isArray(parsed?.programs) ? parsed.programs : [];

      // Filter out generic programs before validation
      const filteredPrograms = programs.filter((program: any) => {
        const name = (program.name || '').toLowerCase();
        const isGeneric = 
          name.includes('general category') ||
          name.includes('general program') ||
          name.includes('general grant') ||
          name.includes('general loan') ||
          name.includes('general funding') ||
          name.includes('category of') ||
          name.includes('represents a category');
        return !isGeneric && program.name && program.name.length >= 5;
      });

      // Validate response: must have at least one VALID program
      if (filteredPrograms.length === 0) {
        if (attempt < maxAttempts) {
          console.warn(`[reco][recommend] Attempt ${attempt}: No valid programs, retrying...`);
          lastRawResponse = rawResponse;
          continue;
        } else {
          // Last attempt failed - log for debugging
          console.error(
            `[reco][recommend] All ${maxAttempts} attempts failed. No valid programs (${programs.length} total, ${programs.length - filteredPrograms.length} generic).`
          );
          console.error(`[reco][recommend] Final raw response:`, rawResponse?.substring(0, 1000));
          lastRawResponse = rawResponse;
          return { programs: [], raw: rawResponse, stats: lastStats };
        }
      }

      // Update programs to use valid ones
      programs = filteredPrograms;

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
            metadata: {
              organization: program.organization || program.metadata?.organization || null,
              typical_timeline: program.typical_timeline || program.metadata?.typical_timeline || null,
              competitiveness: program.competitiveness || program.metadata?.competitiveness || null,
              // Preserve any additional metadata fields
              ...program.metadata
            },
            application_requirements: program.application_requirements || {
              documents: [],
              sections: [],
              financial_requirements: {
                financial_statements_required: [],
                years_required: [],
                co_financing_proof_required: false,
                own_funds_proof_required: false
              }
            },
            source: 'llm_generated',
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

// Removed summarizeProfile and inferFundingPreference - simplified inline

function parseLLMResponse(responseText: string) {
  try {
    const sanitized = sanitizeLLMResponse(responseText);

    const parsed = JSON.parse(sanitized);

    return parsed;
  } catch (error) {
    console.error('[reco][parseLLMResponse] Failed to parse LLM JSON:', (error as Error).message);
    return {};
  }
}

// ============================================================================
// UTILITIES (consolidated from llmUtils.ts and scoring.ts)
// ============================================================================

/**
 * Sanitize LLM JSON response
 */
function sanitizeLLMResponse(text: string): string {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/```json/gi, '```');
  cleaned = cleaned.replace(/```/g, '');
  cleaned = cleaned.replace(/^Here is the JSON requested:\s*/i, '');
  cleaned = cleaned.replace(/^Here is .*?JSON:\s*/i, '');
  cleaned = cleaned.replace(/^Response:\s*/i, '');
  const firstCurly = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');
  const starts: number[] = [];
  if (firstCurly >= 0) starts.push(firstCurly);
  if (firstBracket >= 0) starts.push(firstBracket);
  if (starts.length > 0) {
    const start = Math.min(...starts);
    const endCurly = cleaned.lastIndexOf('}');
    const endBracket = cleaned.lastIndexOf(']');
    const end = Math.max(endCurly, endBracket);
    if (end >= start) {
      cleaned = cleaned.slice(start, end + 1);
    }
  }
  return cleaned.trim();
}

// Removed complex fallback code - LLM is primary, no catalog fallback needed
// Types are now imported from @/features/reco/types

