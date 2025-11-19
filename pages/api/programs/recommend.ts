import fs from 'fs';
import path from 'path';
import { NextApiRequest, NextApiResponse } from 'next';
import {
  normalizeLocationAnswer,
  normalizeCompanyTypeAnswer,
  normalizeCompanyStageAnswer,
  normalizeFundingAmountAnswer,
  normalizeFundingAmountExtraction,
  matchLocations,
  matchCompanyTypes,
  matchFundingAmounts,
  matchCompanyStages,
} from '../../../features/reco/engine/normalization';
import { scoreProgramsEnhanced } from '../../../features/reco/engine/enhancedRecoEngine';
import type { Program, EnhancedProgramResult } from '../../../features/reco/engine/enhancedRecoEngine';

type UserAnswers = Record<string, any>;

interface GeneratedProgram {
  id: string;
  name: string;
  url?: string | null;
  source?: string;
  location?: string | null;
  company_type?: string | null;
  funding_types?: string[];
  metadata?: {
    funding_amount_min?: number | null;
    funding_amount_max?: number | null;
    currency?: string | null;
    location?: string | null;
    description?: string | null;
    region?: string | null;
    company_stage?: string | null;
    deterministicScore?: number | null;
    deterministicConfidence?: string | null;
    deterministicEligibility?: string | null;
    structuredExplanation?: {
      matchedCriteria?: Array<Record<string, any>>;
      gaps?: Array<Record<string, any>>;
      reason?: string;
    };
  };
  categorized_requirements?: Record<string, any>;
}

type LLMProvider = 'custom' | 'openai';

interface LLMStats {
  provider: LLMProvider;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  latencyMs?: number;
}

const REQUIRED_FIELDS = ['location', 'company_type', 'funding_amount', 'company_stage'];
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
  let llmRawResponse: string | null = null;
  let fallbackUsed = false;
  let llmStats: LLMStats | null = null;
  let deterministicFallbackUsed = false;

  try {
    const generation = await generateProgramsWithLLM(answers, maxResults * 2);
    generated = generation.programs;
    llmRawResponse = generation.raw;
    llmStats = generation.stats ?? null;

    if (process.env.NODE_ENV !== 'production') {
      console.log('[reco][recommend] LLM raw response preview:', (llmRawResponse || '').slice(0, 2000));
      console.log('[reco][recommend] Programs parsed from LLM:', generated.length);
    } else {
      console.log('[reco][recommend] LLM returned', generated.length, 'programs; raw length:', llmRawResponse?.length || 0);
    }
  } catch (error: any) {
    llmError = error?.message || 'Unknown LLM error';
    console.error('generateProgramsWithLLM failed:', llmError);
  }

  let matching = generated.filter((program) => matchesAnswers(program, answers));
  if (matching.length === 0 && generated.length > 0) {
    // Surface something instead of empty response
    matching = generated;
    fallbackUsed = true;
  }
  if (matching.length === 0) {
    const deterministicFallback = await buildDeterministicFallbackPrograms(answers, maxResults);
    if (deterministicFallback.length > 0) {
      matching = deterministicFallback;
      fallbackUsed = true;
      deterministicFallbackUsed = true;
    }
  }
  if (matching.length === 0) {
    matching = buildFallbackPrograms(answers, maxResults);
    fallbackUsed = true;
  }

  return res.status(200).json({
    success: true,
    programs: matching.slice(0, maxResults),
    count: matching.length,
    debug: {
      requiredMissing: missingFields.length,
      llmProgramCount: generated.length,
      afterFiltering: matching.length,
      llmError,
      llmRaw: llmRawResponse,
      fallbackUsed,
      deterministicFallbackUsed,
      llmProvider: llmStats?.provider,
      llmPromptTokens: llmStats?.promptTokens,
      llmCompletionTokens: llmStats?.completionTokens,
      llmTotalTokens: llmStats?.totalTokens,
      llmLatencyMs: llmStats?.latencyMs,
    },
  });
}

async function generateProgramsWithLLM(
  answers: UserAnswers,
  maxPrograms: number
): Promise<{ programs: GeneratedProgram[]; raw: string | null; stats?: LLMStats | null }> {
  const profile = summarizeProfile(answers);
  const fundingPreference = inferFundingPreference(answers);

  // Build instructions with retry variations
  const buildInstructions = (attempt: number = 1): string => {
    let instructions = `You are an expert on European funding programs.
Return up to ${maxPrograms} programs that match this profile:

${profile}

Matching Criteria (in priority order):
1. Location Match (CRITICAL): Program must be available in user's location or EU-wide. If no location-specific programs match, include EU-wide programs.
2. Company Type Match (CRITICAL): Must accept user's company type. Allow broader matches (e.g., startups can apply to SME programs).
3. Company Stage Match (CRITICAL): Must accept user's company stage. Allow adjacent stages (e.g., inc_lt_6m can apply to inc_6_36m programs).
4. Funding Amount (FLEXIBLE): If user needs €X, accept programs with range €X/3 to €X*3. Example: User needs €50k → Accept €17k-€150k programs.
5. Co-financing (CRITICAL if co_no): Only grants/subsidies if user cannot provide co-financing.
6. Industry Focus (BONUS): Match if program focuses on user's industry, but not required.

Rules:
1. Location: Only programs available in the specified location or EU-wide.
2. Compatibility: Company type and stage must match the user (with flexibility for adjacent stages/types).
3. Funding range: Align with user's need (be lenient: ±200% range acceptable).
4. Funding types: CRITICAL - Use the MOST SPECIFIC subtype available. These are the PRIMARY funding types:
   
   **EQUITY (use the most specific subtype that fits the program):**
   - angel_investment (individual investors, typically early stage)
   - venture_capital (VC funds, typically scaleups)
   - crowdfunding (community-based)
   - equity (only if subtype unclear or program doesn't specify)
   
   **LOANS (use the most specific subtype that fits the program):**
   - bank_loan (traditional bank loans)
   - leasing (equipment/asset leasing)
   - micro_credit (small loans)
   - repayable_advance (repayable grants/advances)
   - loan (only if subtype unclear or program doesn't specify)
   
   **GRANTS:**
   - grant (national or international grants - specify in description)
   
   **OTHER CRITICAL TYPES:**
   - guarantee (loan guarantees, export guarantees)
   - visa_application (visa/residency support for founders/employees)
   - subsidy (direct subsidies)
   - convertible (convertible notes/loans)
   
   Programs can have multiple types (e.g., ["grant", "guarantee"]).
   **DO NOT prioritize support types** (coaching, mentoring, networking) - these are secondary.
5. Unknown values: Return null but keep the key.
6. Program Names (CRITICAL): Use REAL, SPECIFIC program names only. Do NOT use generic names like "General Category", "General Program", or "Category of X". Use actual program names from the knowledge base (e.g., "AWS Seedfinancing", "FFG Basisprogramm", "KfW ERP-Umweltprogramm", "Horizon Europe", "EIC Accelerator"). If you don't know a specific program name, use a descriptive but specific name based on the organization (e.g., "FFG Innovation Grant" not "General Grant Category").
7. Description: 2-3 sentences explaining what the program offers and why it matches the user (location, stage, amount, industry).
8. Requirements: Include in description: co-financing needs, deadlines, key constraints.
9. Metadata: organization (e.g., "FFG", "AWS", "KfW", "EU Commission"), co_financing_required (boolean), co_financing_percentage (number or null), application_deadlines (string or null), typical_timeline (string or null), competitiveness ("high", "medium", "low" or null).

Return JSON only with this exact structure:
{
  "programs": [
    {
      "id": "string",
      "name": "string",
      "website": "https://example.com",
      "funding_types": ["grant","loan"],
      "funding_amount_min": 5000,
      "funding_amount_max": 20000,
      "currency": "EUR",
      "location": "Austria",
      "company_type": "startup",
      "company_stage": "inc_lt_6m",
      "description": "2-3 sentences: what the program offers, why it matches this user (location/stage/amount/industry), and key requirements (co-financing, deadlines)",
      "metadata": {
        "region": "Austria",
        "program_focus": ["digital","innovation"],
        "organization": "FFG",
        "co_financing_required": false,
        "co_financing_percentage": null,
        "application_deadlines": null,
        "typical_timeline": "2-3 months",
        "competitiveness": "medium"
      },
      "categorized_requirements": {}
    }
  ]
}`;

    // Add program knowledge base
    const programKnowledge = `
Key European Funding Programs to Consider:
- Austria: AWS Seedfinancing, FFG Basisprogramm, FFG Bridge, aws Innovation Fund
- Germany: KfW programs (ERP-Umweltprogramm, Digitalisierungskredit), ZIM, EXIST-Gründerstipendium, Gründungszuschuss
- EU-wide: Horizon Europe, EIC Accelerator, COSME, LIFE, Erasmus+, Interreg
- Research: Horizon Europe, Marie Curie, ERC grants, national research programs
- Startups: EXIST, AWS Seedfinancing, EIC Accelerator, national startup grants
- SMEs: KfW loans, ZIM, COSME, national SME support programs, EU SME support
`;
    instructions += programKnowledge;

    // Special handling for research institutions
    if (answers.company_type === 'research' || answers.company_stage === 'research_org') {
      instructions += `

SPECIAL: Research Institutions
- Research institutions can access both research grants AND innovation/business funding
- Key programs: Horizon Europe (research grants), EIC Accelerator (innovation), FFG research programs (Austria), national research funding
- Research orgs with co-financing capacity can access: grants, loans, equity, guarantees
- Examples:
  * Horizon Europe Pillar 2 (collaborative research, €500k-€5M+)
  * EIC Accelerator (deep tech innovation, grants + equity, €500k-€2.5M)
  * FFG research programs (Austria, various amounts)
  * Marie Curie Actions (researcher mobility, €200k-€500k)
  * ERC grants (individual researchers, €1M-€2.5M)
- If user needs €500k: Consider Horizon Europe, EIC Accelerator, large national research grants
- Research institutions are eligible for EU-wide programs even if based in specific country
`;
    }

    // Special handling for large amounts (€500k+)
    const fundingAmount = typeof answers.funding_amount === 'number' ? answers.funding_amount : 0;
    if (fundingAmount >= 500000) {
      instructions += `

SPECIAL: Large Funding Amounts (€500k+)
- For amounts €500k and above, prioritize EU-wide programs and large national programs
- Key programs for large amounts:
  * Horizon Europe (€500k-€5M+, EU-wide, research/innovation)
  * EIC Accelerator (€500k-€2.5M, EU-wide, deep tech)
  * InvestEU (€500k-€50M+, EU-wide, various types)
  * Large national programs (country-specific, €500k+)
- Be more flexible with location matching - EU-wide programs are acceptable
- Consider multiple funding types (grants, loans, equity, guarantees) for large amounts
- For equity: Consider venture_capital (typically for scaleups), but also consider angel_investment or crowdfunding if appropriate
- Use the MOST SPECIFIC subtype that fits the program, not just based on amount
`;
    } else if (fundingAmount >= 50000 && fundingAmount < 500000) {
      instructions += `

SPECIAL: Medium Funding Amounts (€50k-€500k)
- For amounts €50k-€500k, consider various funding types
- For equity: Consider angel_investment, venture_capital, or crowdfunding based on program characteristics
- For loans: Consider bank_loan, leasing, or other loan types based on program characteristics
- Use the MOST SPECIFIC subtype that fits the program, not just based on amount
`;
    } else if (fundingAmount < 50000) {
      instructions += `

SPECIAL: Small Funding Amounts (<€50k)
- For amounts <€50k, consider:
  * micro_credit (for small loans)
  * crowdfunding (for equity)
  * Small grants and subsidies
- But also consider other subtypes if they fit the program characteristics
- Use the MOST SPECIFIC subtype that fits the program, not just based on amount
`;
    }

    // Industry-specific specialized types
    const industries = Array.isArray(answers.industry_focus) ? answers.industry_focus : (answers.industry_focus ? [answers.industry_focus] : []);
    if (industries.some(ind => ind === 'export' || ind.includes('export'))) {
      instructions += `

SPECIAL: Export-Focused Company
- User focuses on export/international business
- Include export guarantees (guarantee type) and export support programs
- Examples: EU export guarantee programs, national export initiatives, export insurance
- Export guarantees can be combined with grants, loans, or guarantees
- Include at least 1-2 programs with guarantee type for export
`;
    }

    // Visa application support for international founders
    const isInternational = answers.location &&
      (answers.location === 'EU' ||
        (typeof answers.location === 'string' && answers.location.toLowerCase().includes('international')) ||
        (Array.isArray(answers.location) && answers.location.some((loc) => loc === 'EU' || loc.toLowerCase().includes('international'))));
    
    if (isInternational || answers.company_type === 'startup') {
      instructions += `

SPECIAL: International/Startup Context
- Consider visa_application programs for international founders or employees
- Examples: Startup visa programs, founder visa programs, skilled worker visa support
- Can combine with other funding types: ["grant", "visa_application"]
- Include at least 1 program with visa_application type when relevant
`;
    }

    // Add emphasis on returning programs for retries
    if (attempt > 1) {
      instructions += `\n\nRETRY INSTRUCTIONS (Attempt ${attempt}):
- You previously returned 0 programs. This is not acceptable.
- Be more lenient with matching criteria
- Consider EU-wide programs if location-specific ones aren't available
- Include programs with broader eligibility if exact matches aren't found
- Minimum ${Math.min(3, maxPrograms)} programs required
- If you cannot find specific programs, suggest general categories with example programs
- Location flexibility: If user is in Austria/Germany but no local programs match, suggest EU-wide programs
- Stage flexibility: If exact stage doesn't match, suggest programs for adjacent stages (e.g., inc_lt_6m can apply to inc_6_36m programs)
- Amount flexibility: If funding amount is slightly outside range, still include if within 3x tolerance
`;
    }

    // Enhanced diversity enforcement - focus on IMPORTANT funding types and subtypes
    if (fundingPreference.allowMix) {
      instructions += `\n10. DIVERSITY REQUIREMENT (CRITICAL - Focus on IMPORTANT types and subtypes):
   - You MUST return a mix of different funding types with SPECIFIC SUBTYPES
   - Use the MOST SPECIFIC subtype available (don't use generic "equity" when "venture_capital" or "angel_investment" applies)
   
   **EQUITY SUBTYPES (use specific ones):**
   - angel_investment (early stage, €50k-€500k)
   - venture_capital (scaleups, €500k+)
   - crowdfunding (community-based)
   - equity (only if subtype unclear)
   
   **LOAN SUBTYPES (use specific ones):**
   - bank_loan (traditional bank loans)
   - leasing (equipment/asset leasing)
   - micro_credit (small loans, €5k-€50k)
   - repayable_advance (repayable grants)
   - loan (only if subtype unclear)
   
   **OTHER IMPORTANT TYPES:**
   - grant (national/international - specify in description)
   - guarantee (loan guarantees, export guarantees)
   - visa_application (visa/residency support)
   - subsidy, convertible
   
   - Minimum distribution for ${maxPrograms} programs:
     * 30-40% grants (${Math.round(maxPrograms * 0.35)} programs) - national and international
     * 25-35% loans with subtypes (${Math.round(maxPrograms * 0.3)} programs) - use bank_loan, leasing, micro_credit when applicable
     * 15-25% equity with subtypes (${Math.round(maxPrograms * 0.2)} programs) - use venture_capital, angel_investment, crowdfunding when applicable
     * 10-15% guarantees (${Math.round(maxPrograms * 0.125)} programs)
     * 5-10% visa_application (${Math.round(maxPrograms * 0.075)} programs) - when relevant for international founders
     * 5-10% other (subsidy, convertible, etc.)
   - Do NOT return all grants or all loans
   - Use SPECIFIC SUBTYPES - don't default to generic types
   - Example for ${maxPrograms} programs: ${Math.round(maxPrograms * 0.35)} grants, ${Math.round(maxPrograms * 0.3)} loans (with subtypes), ${Math.round(maxPrograms * 0.2)} equity (with subtypes), ${Math.round(maxPrograms * 0.125)} guarantees, ${Math.round(maxPrograms * 0.075)} visa_application
   - If you cannot find enough variety, prioritize loans (with subtypes), equity (with subtypes), and guarantees over grants`;
    } else {
      instructions += `\n10. RESTRICTION (CRITICAL):
   - User CANNOT provide co-financing
   - ONLY return grants, subsidies, and support types (coaching, mentoring, networking, acceleration_program)
   - Support types are allowed even without co-financing (they're not financial instruments)
   - Do NOT include loans, guarantees, or equity
   - If unsure, default to grants and support types only`;
    }

    return instructions;
  };

  const { isCustomLLMEnabled, callCustomLLM } = await import('../../../shared/lib/ai/customLLM');
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
        console.log(
          `[reco][recommend] Custom LLM completed in ${latencyMs}ms (prompt tokens: ${response.usage?.promptTokens ?? 'n/a'}, completion tokens: ${response.usage?.completionTokens ?? 'n/a'})`
        );
        return {
          responseText: response.output,
          rawResponse: response.output,
          provider: 'custom',
          usage: response.usage,
          latencyMs,
        };
      } catch (error: any) {
        const latencyMs = Date.now() - started;
        lastCustomError = error instanceof Error ? error : new Error(error?.message || 'Custom LLM failed');
        console.warn(
          `[reco][recommend] Custom LLM failed after ${latencyMs}ms, attempting OpenAI fallback: ${lastCustomError.message}`
        );
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
      const latencyMs = Date.now() - started;
      const responseText = completion.choices[0]?.message?.content || null;
      console.log(
        `[reco][recommend] OpenAI fallback completed in ${latencyMs}ms (prompt tokens: ${completion.usage?.prompt_tokens ?? 'n/a'}, completion tokens: ${completion.usage?.completion_tokens ?? 'n/a'})`
      );
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
        console.log('[reco][recommend] Custom LLM unavailable — using OpenAI fallback for this attempt');
      }

      if (!responseText) {
        if (attempt < maxAttempts) {
          console.log(`[reco][recommend] Attempt ${attempt}: Empty response, retrying...`);
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
          console.log(`[reco][recommend] Attempt ${attempt}: No valid programs (${programs.length} total, ${programs.length - filteredPrograms.length} generic), retrying...`);
          console.log(`[reco][recommend] Raw response preview:`, rawResponse?.substring(0, 500));
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
        console.log(`[reco][recommend] Success on attempt ${attempt} after ${attempt - 1} failures`);
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
            location: program.location || null,
            company_type: program.company_type || null,
            funding_types: Array.isArray(program.funding_types) ? program.funding_types : [],
            metadata: {
              funding_amount_min: program.funding_amount_min ?? null,
              funding_amount_max: program.funding_amount_max ?? null,
              currency: program.currency || 'EUR',
              location: program.location || null,
              description: program.description || null,
              region: program.location || null,
              company_stage: program.company_stage || null,
              organization: program.metadata?.organization || null,
              co_financing_required: program.metadata?.co_financing_required ?? null,
              co_financing_percentage: program.metadata?.co_financing_percentage ?? null,
              application_deadlines: program.metadata?.application_deadlines || null,
              typical_timeline: program.metadata?.typical_timeline || null,
              competitiveness: program.metadata?.competitiveness || null,
              program_focus: program.metadata?.program_focus || null,
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

function summarizeProfile(answers: UserAnswers): string {
  const critical: string[] = [];
  const important: string[] = [];
  const optional: string[] = [];

  // CRITICAL (must match)
  if (answers.location) {
    const region = answers.location_region ? ` (${answers.location_region})` : '';
    critical.push(`Location: ${answers.location}${region}`);
  }
  if (answers.company_type) {
    critical.push(`Company type: ${answers.company_type}`);
  }
  if (typeof answers.company_stage === 'number') {
    critical.push(`Company stage: ${answers.company_stage} months`);
  } else if (answers.company_stage) {
    critical.push(`Company stage: ${answers.company_stage}`);
  }
  if (answers.co_financing) {
    const coFinancingNote = answers.co_financing === 'co_no' 
      ? ' (ONLY grants/subsidies - no loans/equity/guarantees)' 
      : ' (can accept loans, equity, guarantees)';
    critical.push(`Co-financing: ${answers.co_financing}${coFinancingNote}`);
    if (answers.co_financing_percentage) {
      critical.push(`Co-financing percentage: ${answers.co_financing_percentage}%`);
    }
  }

  // IMPORTANT (should match)
  if (answers.funding_amount !== undefined && answers.funding_amount !== null) {
    const amount = typeof answers.funding_amount === 'number'
      ? `€${answers.funding_amount.toLocaleString()}`
      : answers.funding_amount;
    important.push(`Funding need: ${amount} (flexible: programs with ±200% range acceptable)`);
  }
  if (answers.industry_focus) {
    const industries = Array.isArray(answers.industry_focus) ? answers.industry_focus : [answers.industry_focus];
    important.push(`Industry focus: ${industries.join(', ')}`);
  }

  // OPTIONAL (nice to have)
  if (answers.use_of_funds) {
    const useCases = Array.isArray(answers.use_of_funds) ? answers.use_of_funds : [answers.use_of_funds];
    optional.push(`Use of funds: ${useCases.join(', ')}`);
  }
  if (answers.team_size) {
    optional.push(`Team size: ${answers.team_size}`);
  }
  if (answers.revenue_status) {
    optional.push(`Revenue status: ${answers.revenue_status}`);
  }
  if (answers.impact_focus) {
    const impacts = Array.isArray(answers.impact_focus) ? answers.impact_focus : [answers.impact_focus];
    optional.push(`Impact focus: ${impacts.join(', ')}`);
  }
  if (answers.deadline_urgency) {
    optional.push(`Deadline urgency: ${answers.deadline_urgency}`);
  }
  if (answers.project_duration) {
    optional.push(`Project duration: ${answers.project_duration} months`);
  }
  if (answers.impact) {
    const impacts = Array.isArray(answers.impact) ? answers.impact : [answers.impact];
    optional.push(`Impact: ${impacts.join(', ')}`);
  }

  // Build structured profile
  const sections: string[] = [];
  
  if (critical.length > 0) {
    sections.push('CRITICAL REQUIREMENTS (must match):');
    sections.push(...critical);
  }
  
  if (important.length > 0) {
    if (sections.length > 0) sections.push('');
    sections.push('IMPORTANT PREFERENCES (should match):');
    sections.push(...important);
  }
  
  if (optional.length > 0) {
    if (sections.length > 0) sections.push('');
    sections.push('ADDITIONAL CONTEXT (nice to have):');
    sections.push(...optional);
  }

  return sections.join('\n');
}

function inferFundingPreference(answers: UserAnswers) {
  const instruments = new Set<string>(['grant']);
  const coFinancing = (answers.co_financing || '').toString().toLowerCase();
  const stageMonths = typeof answers.company_stage === 'number' ? answers.company_stage : null;
  const stageCategory = typeof answers.company_stage === 'string' ? answers.company_stage : null;

  if (coFinancing !== 'co_no') {
    instruments.add('loan');
    instruments.add('guarantee');
  }

  const allowEquity =
    (stageMonths !== null && stageMonths >= 6) ||
    (stageMonths === null &&
      stageCategory !== null &&
      stageCategory !== 'idea' &&
      stageCategory !== 'pre_company');

  if (allowEquity) {
    instruments.add('equity');
  }

  return {
    values: Array.from(instruments),
    allowMix: coFinancing !== 'co_no',
  };
}

function parseLLMResponse(responseText: string) {
  try {
    const sanitized = sanitizeLLMResponse(responseText);
    if (process.env.NODE_ENV !== 'production') {
      console.log('[reco][parseLLMResponse] Sanitized response length:', sanitized.length);
      console.log('[reco][parseLLMResponse] First 500 chars:', sanitized.substring(0, 500));
    }
    const parsed = JSON.parse(sanitized);
    if (process.env.NODE_ENV !== 'production') {
      console.log('[reco][parseLLMResponse] Parsed keys:', Object.keys(parsed));
      console.log('[reco][parseLLMResponse] Programs array length:', Array.isArray(parsed?.programs) ? parsed.programs.length : 'not an array');
    }
    return parsed;
  } catch (error) {
    console.error('[reco][parseLLMResponse] Failed to parse LLM JSON:', error);
    console.error('[reco][parseLLMResponse] Response text (first 1000 chars):', responseText.substring(0, 1000));
    return {};
  }
}

function sanitizeLLMResponse(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith('```')) {
    const withoutFence = trimmed.replace(/```json|```/g, '');
    return withoutFence.trim();
  }
  return trimmed;
}

function normalizeCompanyStageValue(value: any): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value === 'number') {
    if (value < 0) return 'pre_company';
    if (value < 6) return 'inc_lt_6m';
    if (value < 36) return 'inc_6_36m';
    return 'inc_gt_36m';
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    return value;
  }
  return null;
}

function matchesAnswers(program: GeneratedProgram, answers: UserAnswers): boolean {
  const categorized = program.categorized_requirements || {};
  const metadata = program.metadata || {};

  if (answers.location) {
    const userLocation = normalizeLocationAnswer(answers.location);
    const programLocation = metadata.location || program.location || categorized.geographic?.[0]?.value;
    if (programLocation) {
      const normalizedProgramLocation = normalizeLocationAnswer(programLocation);
      
      // More lenient: Allow EU-wide programs for EU countries
      const userCountries = userLocation.countries || [];
      const programCountries = normalizedProgramLocation.countries || [];
      const programScope = normalizedProgramLocation.scope;
      const userIsEuCountry =
        userCountries.includes('austria') ||
        userCountries.includes('germany') ||
        userCountries.includes('eu');
      const programIsEuWide = programCountries.includes('eu') || programScope === 'eu';
      const programIsInternational = programCountries.includes('international') || programScope === 'international';

      if (userIsEuCountry && (programIsEuWide || programIsInternational)) {
        // Accept EU-wide/international programs for EU countries
      } else if (!matchLocations(userLocation, normalizedProgramLocation)) {
        return false;
      }
    }
  }

  if (answers.company_type) {
    const userType = normalizeCompanyTypeAnswer(answers.company_type);
    const programType = program.company_type || categorized.eligibility?.[0]?.value;
    if (programType) {
      const normalizedProgramType = normalizeCompanyTypeAnswer(programType);
      if (!matchCompanyTypes(userType, normalizedProgramType)) {
        return false;
      }
    }
  }

  if (answers.company_stage !== undefined && answers.company_stage !== null) {
    const userStageValue = normalizeCompanyStageValue(answers.company_stage);
    if (userStageValue) {
      const userStage = normalizeCompanyStageAnswer(userStageValue);
      const programStageValue =
        (program as any).company_stage ||
        metadata.company_stage ||
        categorized.eligibility?.find((item: any) => item.type === 'company_stage')?.value;
      if (programStageValue) {
        const normalizedProgramStage = normalizeCompanyStageAnswer(programStageValue);
        if (!matchCompanyStages(userStage, normalizedProgramStage)) {
          return false;
        }
      }
    }
  }

  if (answers.funding_amount !== undefined && answers.funding_amount !== null) {
    const userAmount = normalizeFundingAmountAnswer(answers.funding_amount);
    const programAmount = normalizeFundingAmountExtraction(
      metadata.funding_amount_min ?? null,
      metadata.funding_amount_max ?? null
    );
    if (programAmount && !matchFundingAmounts(userAmount, programAmount)) {
      const userNeed = typeof answers.funding_amount === 'number' ? answers.funding_amount : userAmount.max;
      const min = metadata.funding_amount_min || 0;
      const max = metadata.funding_amount_max || 0;
      const tolerance = userNeed < 10000 ? 5 : 3;
      const withinTolerance =
        (min === 0 || min <= userNeed * tolerance) &&
        (max === 0 || max <= userNeed * tolerance * 1.5);
      if (!withinTolerance) {
        return false;
      }
    }
  }

  return true;
}

const SCRAPED_PROGRAMS_PATH = path.join(
  process.cwd(),
  'scraper-lite',
  'data',
  'legacy',
  'scraped-programs-latest.json'
);
const MIGRATED_PROGRAMS_PATH = path.join(process.cwd(), 'data', 'migrated-programs.json');
let cachedCatalogPrograms: Program[] | null = null;

async function buildDeterministicFallbackPrograms(
  answers: UserAnswers,
  maxPrograms: number
): Promise<GeneratedProgram[]> {
  try {
    const catalog = await loadCatalogPrograms();
    if (!catalog.length) {
      return [];
    }
    const scored = await scoreProgramsEnhanced(answers as any, 'strict', catalog);
    return scored.slice(0, maxPrograms).map(mapDeterministicProgramToGenerated);
  } catch (error) {
    console.error('[reco][recommend] Deterministic fallback failed:', error);
    return [];
  }
}

async function loadCatalogPrograms(): Promise<Program[]> {
  if (cachedCatalogPrograms) {
    return cachedCatalogPrograms;
  }

  const sources = [SCRAPED_PROGRAMS_PATH, MIGRATED_PROGRAMS_PATH];

  for (const source of sources) {
    if (!source) continue;
    if (fs.existsSync(source)) {
      try {
        const fileContents = fs.readFileSync(source, 'utf-8');
        const parsed = JSON.parse(fileContents);
        const rawPrograms = Array.isArray(parsed?.programs) ? parsed.programs : parsed;
        const mappedPrograms = rawPrograms.map(mapRawCatalogProgram);
        cachedCatalogPrograms = mappedPrograms;
        console.log(
          `[reco][recommend] Loaded ${mappedPrograms.length} catalog programs from ${path.relative(
            process.cwd(),
            source
          )}`
        );
        return mappedPrograms;
      } catch (error) {
        console.warn(`[reco][recommend] Failed to load catalog programs from ${source}:`, error);
      }
    }
  }

  cachedCatalogPrograms = [];
  return cachedCatalogPrograms;
}

function mapRawCatalogProgram(raw: any): Program {
  const fundingTypes = Array.isArray(raw?.funding_types)
    ? raw.funding_types
    : raw?.type
    ? [raw.type]
    : [];
  const amountMin =
    raw?.funding_amount_min ??
    raw?.amount?.min ??
    raw?.minAmount ??
    (typeof raw?.funding_amount === 'number' ? raw.funding_amount : 0);
  const amountMax =
    raw?.funding_amount_max ??
    raw?.amount?.max ??
    raw?.maxAmount ??
    (typeof raw?.funding_amount === 'number' ? raw.funding_amount : 0);
  const currency = raw?.currency || raw?.amount?.currency || 'EUR';

  let categorizedRequirements = raw?.categorized_requirements || raw?.requirements || {};
  if (typeof categorizedRequirements === 'string') {
    try {
      categorizedRequirements = JSON.parse(categorizedRequirements);
    } catch (error) {
      categorizedRequirements = {};
    }
  }

  return {
    id: String(raw?.id || raw?.program_id || raw?.page_id || `catalog_${Math.random().toString(36).slice(2)}`),
    name: raw?.name || raw?.program_name || 'Funding Program',
    type: raw?.program_type || raw?.type || fundingTypes[0] || 'grant',
    program_type: raw?.program_type || raw?.type || fundingTypes[0] || 'grant',
    description: raw?.description || raw?.metadata?.description || '',
    url: raw?.url || raw?.source_url || null,
    region: raw?.region || raw?.metadata?.region || null,
    funding_types: fundingTypes,
    funding_amount_min: amountMin,
    funding_amount_max: amountMax,
    currency,
    amount: {
      min: amountMin || 0,
      max: amountMax || 0,
      currency,
    },
    categorized_requirements: categorizedRequirements,
    metadata: {
      ...raw?.metadata,
      description: raw?.description || raw?.metadata?.description,
      region: raw?.region || raw?.metadata?.region,
      source: raw?.source_url || raw?.url || raw?.source,
    },
  };
}

function mapDeterministicProgramToGenerated(program: EnhancedProgramResult): GeneratedProgram {
  const amount = program.amount || {
    min: program.funding_amount_min ?? null,
    max: program.funding_amount_max ?? null,
    currency: program.currency ?? null,
  };

  return {
    id: program.id,
    name: program.name,
    url: program.url || program.source_url || null,
    source: 'deterministic_catalog',
    location: program.region || program.metadata?.region || null,
    company_type: program.program_type || program.type || null,
    funding_types: program.funding_types || (program.type ? [program.type] : []),
    metadata: {
      funding_amount_min: amount?.min ?? null,
      funding_amount_max: amount?.max ?? null,
      currency: amount?.currency ?? program.currency ?? null,
      location: program.region || program.metadata?.location || null,
      description: program.description || program.metadata?.description || null,
      region: program.region || program.metadata?.region || null,
      company_stage: program.metadata?.company_stage || null,
      deterministicScore: program.score,
      deterministicConfidence: program.confidence,
      deterministicEligibility: program.eligibility,
      structuredExplanation: {
        matchedCriteria: program.matchedCriteria,
        gaps: program.gaps,
        reason: program.reason,
      },
    },
    categorized_requirements: program.categorized_requirements,
  };
}

function buildFallbackPrograms(answers: UserAnswers, maxPrograms: number): GeneratedProgram[] {
  const programs: GeneratedProgram[] = [];
  const coFinancing = (answers.co_financing || '').toString().toLowerCase();
  const allowMix = coFinancing !== 'co_no';
  const fundingPreference = inferFundingPreference(answers);
  
  // Determine funding types to include in fallback
  const availableTypes = fundingPreference.values;
  
  for (let i = 0; i < Math.max(1, maxPrograms); i++) {
    // Distribute funding types across fallback programs
    let fundingType: string;
    if (allowMix && availableTypes.length > 1) {
      // Cycle through available types for diversity
      const typeIndex = i % availableTypes.length;
      fundingType = availableTypes[typeIndex];
    } else {
      // Only grants if co_financing is 'co_no'
      fundingType = 'grant';
    }
    
    // Adjust amount ranges based on funding type
    let amountMin = typeof answers.funding_amount === 'number' ? Math.max(1000, answers.funding_amount * 0.5) : 5000;
    let amountMax = typeof answers.funding_amount === 'number' ? answers.funding_amount * 2 : 20000;
    
    if (fundingType === 'loan' || fundingType === 'equity') {
      // Loans and equity typically have higher amounts
      amountMin = typeof answers.funding_amount === 'number' ? Math.max(10000, answers.funding_amount * 0.8) : 10000;
      amountMax = typeof answers.funding_amount === 'number' ? answers.funding_amount * 3 : 50000;
    }
    
    programs.push({
      id: `fallback_${i + 1}`,
      name: `General ${fundingType === 'grant' ? 'Grant' : fundingType === 'loan' ? 'Loan' : fundingType === 'equity' ? 'Equity' : 'Funding'} Option ${i + 1}`,
      url: null,
      funding_types: [fundingType],
      metadata: {
        funding_amount_min: amountMin,
        funding_amount_max: amountMax,
        currency: 'EUR',
        description: `Suggested ${fundingType} program based on your profile. Please verify details manually. This is a fallback option - the system could not generate specific program recommendations.`,
        location: answers.location || 'Austria',
        region: answers.location || 'Austria',
      },
      source: 'fallback',
    });
  }
  return programs;
}

