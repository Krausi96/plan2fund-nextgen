// On-demand recommendation API
// Takes Q&A answers, filters seed URLs, extracts on-demand, returns matches
import { NextApiRequest, NextApiResponse } from 'next';
import * as fs from 'fs';
import * as path from 'path';
import { extractWithLLM } from '../../../scraper-lite/src/core/llm-extract';
import {
  normalizeLocationAnswer,
  normalizeCompanyTypeAnswer,
  normalizeCompanyStageAnswer,
  normalizeFundingAmountAnswer,
  normalizeIndustryAnswer,
  normalizeCoFinancingAnswer,
  normalizeLocationExtraction,
  normalizeCompanyTypeExtraction,
  normalizeCompanyStageExtraction,
  normalizeFundingAmountExtraction,
  normalizeCoFinancingExtraction,
  matchLocations,
  matchCompanyTypes,
  matchCompanyStages,
  matchFundingAmounts,
  matchIndustries,
  matchCoFinancing,
} from '../../../features/reco/engine/normalization';

interface SeedEntry {
  institution_id: string;
  institution_name: string;
  seed_url: string;
  funding_types: string[];
}

interface UserAnswers {
  location?: string;
  company_type?: string;
  company_stage?: string;
  team_size?: string;
  revenue_status?: string;
  co_financing?: string;
  industry_focus?: string;
  funding_amount?: string;
  use_of_funds?: string;
  impact?: string;
  deadline_urgency?: string;
  project_duration?: string;
}

// Question to extraction field mapping
const QUESTION_TO_EXTRACTION_MAP = {
  location: {
    extracts: ['geographic.location', 'geographic.specific_location'],
    description: 'Geographic eligibility requirements',
  },
  company_type: {
    extracts: ['eligibility.company_type'],
    description: 'Company type requirements (SME, startup, etc.)',
  },
  company_stage: {
    extracts: ['eligibility.company_stage', 'team.company_age', 'team.max_company_age'],
    description: 'Company stage/age requirements',
  },
  team_size: {
    extracts: ['team.team_size', 'team.min_team_size'],
    description: 'Team size requirements',
  },
  revenue_status: {
    extracts: ['financial.revenue', 'financial.revenue_range'],
    description: 'Revenue requirements',
  },
  co_financing: {
    extracts: ['financial.co_financing', 'financial.own_contribution'],
    description: 'Co-financing requirements',
  },
  industry_focus: {
    extracts: ['project.industry_focus', 'project.sector_focus'],
    description: 'Industry/sector focus',
  },
  funding_amount: {
    extracts: ['metadata.funding_amount_min', 'metadata.funding_amount_max'],
    description: 'Funding amount range',
  },
  use_of_funds: {
    extracts: ['funding_details.use_of_funds'],
    description: 'How funds can be used',
  },
  impact: {
    extracts: ['impact.environmental_impact', 'impact.social_impact', 'impact.economic_impact'],
    description: 'Impact requirements',
  },
  deadline_urgency: {
    extracts: ['timeline.deadline', 'timeline.open_deadline'],
    description: 'Deadline information',
  },
  project_duration: {
    extracts: ['timeline.duration', 'timeline.project_duration'],
    description: 'Project duration requirements',
  },
};

/**
 * Filter seed URLs based on user answers
 */
function filterSeedsByAnswers(seeds: SeedEntry[], answers: UserAnswers): SeedEntry[] {
  let filtered = seeds;

  // Filter by location (Austria, EU, etc.)
  if (answers.location) {
    const locationLower = answers.location.toLowerCase();
    if (locationLower.includes('austria') || locationLower.includes('österreich')) {
      // Keep Austrian institutions
      filtered = filtered.filter(seed => {
        const name = seed.institution_name.toLowerCase();
        return name.includes('austria') || 
               name.includes('österreich') || 
               name.includes('wien') ||
               name.includes('vienna') ||
               seed.seed_url.includes('.at');
      });
    } else if (locationLower.includes('eu') || locationLower.includes('europe')) {
      // Keep EU institutions
      filtered = filtered.filter(seed => {
        const name = seed.institution_name.toLowerCase();
        return name.includes('eu') || 
               name.includes('europe') ||
               seed.seed_url.includes('.europa.eu');
      });
    }
  }

  // Filter by funding type (if user specified)
  // This is implicit in the seed's funding_types array
  // We'll extract and match later

  return filtered;
}

// Normalization functions are now imported from normalization.ts

/**
 * Check if extracted program matches user answers (using normalization)
 */
function matchesAnswers(extracted: any, answers: UserAnswers): boolean {
  const categorized = extracted.categorized_requirements || {};
  const metadata = extracted.metadata || {};
  let matchCount = 0;
  let totalChecks = 0;
  const criticalChecks: boolean[] = [];
  
  // Location match (normalized)
  if (answers.location) {
    totalChecks++;
    const geoReqs = categorized.geographic || [];
    const userLocation = normalizeLocationAnswer(answers.location);
    
    if (geoReqs.length === 0) {
      // No location requirement = accepts all locations
      matchCount++;
    } else {
      let hasLocation = false;
      for (const req of geoReqs) {
        const reqValue = String(req.value || '');
        const extractedLocation = normalizeLocationExtraction(reqValue);
        if (matchLocations(userLocation, extractedLocation)) {
          hasLocation = true;
          break;
        }
      }
      if (hasLocation) {
        matchCount++;
        criticalChecks.push(true);
      } else {
        criticalChecks.push(false);
        return false; // Critical: location must match
      }
    }
  }

  // Company type match (normalized)
  if (answers.company_type) {
    totalChecks++;
    const eligReqs = categorized.eligibility || [];
    const userType = normalizeCompanyTypeAnswer(answers.company_type);
    
    if (eligReqs.length === 0) {
      matchCount++;
    } else {
      let hasType = false;
      for (const req of eligReqs) {
        if (req.type === 'company_type') {
          const reqValue = String(req.value || '');
          const extractedType = normalizeCompanyTypeExtraction(reqValue);
          if (matchCompanyTypes(userType, extractedType)) {
            hasType = true;
            break;
          }
        }
      }
      if (hasType) {
        matchCount++;
        criticalChecks.push(true);
      } else {
        criticalChecks.push(false);
        return false; // Critical: company type must match
      }
    }
  }

  // Company stage match (normalized)
  if (answers.company_stage) {
    totalChecks++;
    const stageReqs = [
      ...(categorized.eligibility || []),
      ...(categorized.team || [])
    ];
    const userStage = normalizeCompanyStageAnswer(answers.company_stage);
    
    if (stageReqs.length === 0) {
      matchCount++;
    } else {
      let hasStage = false;
      for (const req of stageReqs) {
        const reqType = String(req?.type || '').toLowerCase();
        const reqValue = String(req?.value || '');
        
        if (reqType.includes('stage') || reqType.includes('company_age') || 
            reqType.includes('max_company_age') || reqValue.includes('year') || 
            reqValue.includes('month') || reqValue.includes('age')) {
          const extractedStage = normalizeCompanyStageExtraction(reqValue);
          if (matchCompanyStages(userStage, extractedStage)) {
            hasStage = true;
            break;
          }
        }
      }
      if (hasStage) matchCount++;
    }
  }

  // Funding amount match (normalized)
  if (answers.funding_amount) {
    totalChecks++;
    const userAmount = normalizeFundingAmountAnswer(answers.funding_amount);
    const extractedAmount = normalizeFundingAmountExtraction(
      metadata.funding_amount_min,
      metadata.funding_amount_max
    );
    
    if (matchFundingAmounts(userAmount, extractedAmount)) {
      matchCount++;
    } else {
      return false; // Critical: funding amount must match
    }
  }

  // Industry focus match (normalized)
  if (answers.industry_focus) {
    totalChecks++;
    const projectReqs = categorized.project || [];
    const userIndustry = normalizeIndustryAnswer(answers.industry_focus);
    
    const extractedIndustries = projectReqs
      .filter((req: any) => req.type === 'industry_focus' || req.type === 'sector_focus')
      .map((req: any) => String(req.value || ''));
    
    if (matchIndustries(userIndustry, extractedIndustries)) {
      matchCount++;
    }
  }

  // Co-financing match (normalized)
  if (answers.co_financing) {
    totalChecks++;
    const financialReqs = categorized.financial || [];
    const userCoFinancing = normalizeCoFinancingAnswer(answers.co_financing);
    
    let hasCoFinancing = true; // Default: no requirement = flexible
    for (const req of financialReqs) {
      if (req.type === 'co_financing' || req.type === 'own_contribution') {
        const reqValue = String(req.value || '');
        const extractedCoFinancing = normalizeCoFinancingExtraction(reqValue);
        hasCoFinancing = matchCoFinancing(userCoFinancing, extractedCoFinancing);
        break;
      }
    }
    
    if (hasCoFinancing) matchCount++;
  }

  // Require at least 50% of checks to pass
  // Critical checks (location, company_type, funding_amount) must all pass
  const allCriticalPass = criticalChecks.length === 0 || criticalChecks.every(c => c);
  const matchRatio = totalChecks > 0 ? matchCount / totalChecks : 1;
  
  return allCriticalPass && matchRatio >= 0.5;
}

/**
 * Tier 3: Generate programs using LLM (like ChatGPT)
 * This is the fallback when seed URLs are disabled or unavailable
 */
async function generateProgramsWithLLM(
  answers: UserAnswers,
  maxPrograms: number = 20
): Promise<any[]> {
  try {
    // Summarize user profile
    const profileParts: string[] = [];
    if (answers.location) profileParts.push(`Location: ${answers.location}`);
    if (answers.company_type) profileParts.push(`Company Type: ${answers.company_type}`);
    if (answers.company_stage) profileParts.push(`Company Stage: ${answers.company_stage}`);
    if (answers.funding_amount) profileParts.push(`Funding Amount: ${answers.funding_amount}`);
    if (answers.industry_focus) {
      const industries = Array.isArray(answers.industry_focus) 
        ? answers.industry_focus.join(', ') 
        : answers.industry_focus;
      profileParts.push(`Industry Focus: ${industries}`);
    }
    if (answers.co_financing) profileParts.push(`Co-financing: ${answers.co_financing}`);
    if (answers.impact) profileParts.push(`Impact: ${answers.impact}`);
    
    const userProfile = profileParts.join('\n');

    const prompt = `You are an expert on European funding programs (grants, loans, subsidies).

Based on this user profile, suggest ${maxPrograms} relevant funding programs:

${userProfile}

For each program, provide a JSON object with:
- name: Program name
- institution: Institution/organization name
- funding_amount_min: Minimum funding amount (number)
- funding_amount_max: Maximum funding amount (number)
- currency: Currency code (default: EUR)
- location: Geographic eligibility (e.g., "Austria", "Germany", "EU")
- company_type: Eligible company types (e.g., "startup", "sme", "research")
- industry_focus: Industry/sector focus (array of strings)
- deadline: Application deadline if known (YYYY-MM-DD format, or null)
- open_deadline: Boolean indicating if deadline is open/rolling
- website: Program website URL if known (or null)
- description: Brief program description

Return a JSON object with a "programs" array containing the program objects.

Example format:
{
  "programs": [
    {
      "name": "FFG General Programme",
      "institution": "Austrian Research Promotion Agency",
      "funding_amount_min": 50000,
      "funding_amount_max": 500000,
      "currency": "EUR",
      "location": "Austria",
      "company_type": "startup",
      "industry_focus": ["digital", "technology"],
      "deadline": null,
      "open_deadline": true,
      "website": "https://www.ffg.at",
      "description": "Supports research and innovation projects for startups and SMEs"
    }
  ]
}`;

    // Call LLM
    const { isCustomLLMEnabled, callCustomLLM } = await import('../../../shared/lib/ai/customLLM');
    const OpenAI = (await import('openai')).default;
    
    let responseText: string | null = null;
    
    if (isCustomLLMEnabled()) {
      const customResponse = await callCustomLLM({
        messages: [
          { role: 'system', content: 'You are an expert on European funding programs. Return only valid JSON arrays.' },
          { role: 'user', content: prompt }
        ],
        responseFormat: 'json',
        temperature: 0.3,
        maxTokens: 4000,
      });
      responseText = customResponse.output;
    } else if (process.env.OPENAI_API_KEY) {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
      
      // Note: OpenAI's json_object format requires object, not array
      // Prompt already asks for {"programs": [...]} format
      const completion = await openai.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: 'You are an expert on European funding programs. Return a JSON object with a "programs" array.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 4000,
      });
      
      responseText = completion.choices[0]?.message?.content || null;
    } else {
      throw new Error('No LLM available: Set OPENAI_API_KEY or CUSTOM_LLM_ENDPOINT');
    }

    if (!responseText) {
      throw new Error('LLM returned empty response');
    }

    // Parse JSON response
    let programs: any[];
    try {
      const parsed = JSON.parse(responseText);
      // Handle both array and object formats
      if (Array.isArray(parsed)) {
        programs = parsed;
      } else if (parsed.programs && Array.isArray(parsed.programs)) {
        programs = parsed.programs;
      } else {
        // Try to extract array from response text
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          programs = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No programs array found in response');
        }
      }
    } catch (parseError) {
      console.error('Failed to parse LLM response:', responseText);
      throw new Error('LLM returned invalid JSON');
    }

    // Convert to our program format
    return programs.map((p: any, index: number) => {
      return {
        id: `llm_${(p.name || `program_${index}`).toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
        name: p.name || `Program ${index + 1}`,
        url: p.website || null,
        institution_id: `llm_${(p.institution || 'unknown').toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
        funding_types: ['grant'], // Default to grant
        metadata: {
          funding_amount_min: p.funding_amount_min || 0,
          funding_amount_max: p.funding_amount_max || 0,
          currency: p.currency || 'EUR',
          deadline: p.deadline || null,
          open_deadline: p.open_deadline || false,
          description: p.description || '',
          region: p.location || answers.location || '',
        },
        categorized_requirements: {
          geographic: [{ 
            type: 'location', 
            value: p.location || answers.location || '', 
            confidence: 0.8 
          }],
          eligibility: [{ 
            type: 'company_type', 
            value: p.company_type || answers.company_type || '', 
            confidence: 0.8 
          }],
          project: Array.isArray(p.industry_focus) 
            ? p.industry_focus.map((ind: string) => ({
                type: 'industry_focus',
                value: ind,
                confidence: 0.7
              }))
            : (p.industry_focus ? [{
                type: 'industry_focus',
                value: p.industry_focus,
                confidence: 0.7
              }] : []),
          metadata: {
            funding_amount_min: p.funding_amount_min || 0,
            funding_amount_max: p.funding_amount_max || 0,
            currency: p.currency || 'EUR',
            deadline: p.deadline || null,
            open_deadline: p.open_deadline || false,
          }
        },
        eligibility_criteria: {},
        extracted_at: new Date().toISOString(),
        source: 'llm_generated',
      };
    });
  } catch (error: any) {
    console.error('❌ LLM fallback failed:', error);
    // Return empty array if LLM fails - system will handle gracefully
    return [];
  }
}

/**
 * Fetch HTML from URL
 */
async function fetchHtml(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      signal: AbortSignal.timeout(10000), // 10s timeout
    });
    if (!response.ok) return null;
    return await response.text();
  } catch (error) {
    console.warn(`Failed to fetch ${url}:`, error);
    return null;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const answers: UserAnswers = req.body.answers || {};
    const { max_results = 10, extract_all = false, use_seeds = true } = req.body;
    
    // Check if seeds should be disabled (via parameter or env var)
    const disableSeeds = !use_seeds || process.env.DISABLE_SEED_URLS === 'true';

    // Tier 1: URL-Based Extraction (if enabled)
    let programs: any[] = [];
    let extractionResults: any[] = [];
    
    if (!disableSeeds) {
      // Load seed URLs
      const seedsPath = path.join(process.cwd(), 'scraper-lite', 'url-seeds.json');
      if (!fs.existsSync(seedsPath)) {
        console.log('⚠️ Seed file not found, using LLM fallback');
      } else {
        const seeds: SeedEntry[] = JSON.parse(fs.readFileSync(seedsPath, 'utf8'));

        // Filter seeds based on answers
        const relevantSeeds = filterSeedsByAnswers(seeds, answers);
        console.log(`📊 Filtered ${seeds.length} seeds → ${relevantSeeds.length} relevant seeds`);

        // Limit seeds to process (to avoid too many requests)
        const seedsToProcess = relevantSeeds.slice(0, Math.min(max_results * 2, 20));

        for (const seed of seedsToProcess) {
      try {
        console.log(`🔍 Fetching and extracting: ${seed.seed_url}`);
        
        // Fetch HTML
        const html = await fetchHtml(seed.seed_url);
        if (!html) {
          console.warn(`⚠️ Failed to fetch ${seed.seed_url}`);
          continue;
        }

        // Extract with LLM
        const extracted = await extractWithLLM({
          html,
          url: seed.seed_url,
          title: seed.institution_name,
        });

        // Check if it matches user answers
        if (extract_all || matchesAnswers(extracted, answers)) {
          const program = {
            id: `seed_${seed.institution_id}`,
            name: seed.institution_name,
            url: seed.seed_url,
            institution_id: seed.institution_id,
            funding_types: seed.funding_types,
            metadata: extracted.metadata || {},
            categorized_requirements: extracted.categorized_requirements || {},
            eligibility_criteria: {}, // Will be derived from categorized_requirements
            extracted_at: new Date().toISOString(),
          };

          programs.push(program);
          extractionResults.push({
            seed_url: seed.seed_url,
            institution: seed.institution_name,
            extracted_fields: Object.keys(extracted.categorized_requirements || {}),
            matches: extract_all ? 'all' : 'filtered',
          });
        }
      } catch (error: any) {
        console.error(`❌ Error processing ${seed.seed_url}:`, error.message);
        extractionResults.push({
          seed_url: seed.seed_url,
          institution: seed.institution_name,
          error: error.message,
        });
      }

          // Stop if we have enough programs (get more than needed for scoring, then take top 5)
          if (programs.length >= max_results * 2) break;
        }
      }
    }

    // Tier 3: LLM-Generated Programs (Fallback - Like ChatGPT)
    if (programs.length === 0) {
      console.log('⚠️ No programs from URL extraction, using LLM fallback (Tier 3)');
      programs = await generateProgramsWithLLM(answers, max_results * 2);
      extractionResults.push({
        source: 'llm_fallback',
        message: `Generated ${programs.length} programs using LLM (like ChatGPT)`,
      });
    }

    // Return results with extraction mapping
    return res.status(200).json({
      success: true,
      programs,
      count: programs.length,
      extraction_results: extractionResults,
      question_mapping: QUESTION_TO_EXTRACTION_MAP,
      answers_provided: answers,
      source: programs.length > 0 && programs[0].source === 'llm_generated' ? 'llm_fallback' : 'url_extraction',
      fallback_used: programs.length > 0 && programs[0].source === 'llm_generated',
      message: programs.length > 0 && programs[0].source === 'llm_generated' 
        ? `Generated ${programs.length} programs using LLM fallback (like ChatGPT)`
        : `Extracted ${programs.length} programs from seed URLs`,
    });

  } catch (error: any) {
    console.error('Recommendation API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}

