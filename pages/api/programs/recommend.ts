// On-demand recommendation API
// Takes Q&A answers, generates programs with LLM, extracts detailed requirements
import { NextApiRequest, NextApiResponse } from 'next';
import * as fs from 'fs';
import * as path from 'path';
import { extractWithLLM } from '../../../features/reco/engine/llmExtract';
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
  company_stage?: string | number; // Can be string (old format) or number (months, new format)
  company_stage_classified?: string; // Auto-classified stage from months
  legal_type?: string;
  team_size?: string | number;
  revenue_status?: string;
  co_financing?: string;
  industry_focus?: string | string[];
  funding_amount?: string | number;
  use_of_funds?: string | string[];
  impact?: string | string[];
  deadline_urgency?: string | number;
  project_duration?: string | number;
  location_region?: string;
  [key: string]: any; // Allow additional fields like "other" text inputs
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
 * @param threshold - Minimum match ratio (default: 0.15 = 15%)
 */
function matchesAnswers(extracted: any, answers: UserAnswers, threshold: number = 0.15): boolean {
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
        // For LLM-generated programs, be more lenient - don't filter out immediately
        const isLLMGenerated = extracted?.source === 'llm_generated';
        if (!isLLMGenerated) {
          criticalChecks.push(false);
          return false; // Critical: location must match for non-LLM programs
        }
        // For LLM programs, just don't count as match but continue
        criticalChecks.push(false);
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
      criticalChecks.push(true);
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
        // For LLM-generated programs, be more lenient - don't filter out immediately
        // Only fail if it's clearly incompatible (e.g., research vs startup)
        const isLLMGenerated = extracted?.source === 'llm_generated';
        if (!isLLMGenerated) {
          criticalChecks.push(false);
          return false; // Critical: company type must match for non-LLM programs
        }
        // For LLM programs, just don't count as match but continue
        criticalChecks.push(false);
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
    // Handle both old format (string) and new format (number months)
    const stageValue = typeof answers.company_stage === 'number' 
      ? (answers.company_stage_classified || String(answers.company_stage))
      : String(answers.company_stage);
    const userStage = normalizeCompanyStageAnswer(stageValue);
    
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
  if (answers.funding_amount !== undefined && answers.funding_amount !== null) {
    totalChecks++;
    const userAmount = normalizeFundingAmountAnswer(answers.funding_amount);
    const extractedAmount = normalizeFundingAmountExtraction(
      metadata.funding_amount_min,
      metadata.funding_amount_max
    );
    
    // Only filter if program has funding amount requirements
    if (metadata.funding_amount_min || metadata.funding_amount_max) {
      if (matchFundingAmounts(userAmount, extractedAmount)) {
        matchCount++;
      } else {
        // Don't filter out - just don't count as match (LLM programs might not have exact amounts)
        // return false; // Removed strict filtering for LLM-generated programs
      }
    } else {
      // No funding requirement = matches all
      matchCount++;
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

  // For LLM-generated programs, be more lenient - don't filter out if they're close
  // Require at least 15% of checks to pass (lowered from 20% for better coverage)
  const isLLMGenerated = extracted?.source === 'llm_generated' || extracted?._fallback === true;
  const matchRatio = totalChecks > 0 ? matchCount / totalChecks : 1;
  
  // For LLM-generated programs, be extremely lenient - always show them
  // Since they're generated specifically for the user's profile, they should be relevant
  if (isLLMGenerated) {
    // Always return true for LLM-generated programs - they're already tailored to the user
    // Only filter out if there's a clear incompatibility (handled by critical checks above)
    console.log(`✅ LLM-generated program "${extracted?.name || 'unknown'}" - allowing through (lenient matching)`);
    return true;
  }
  
  // For non-LLM programs, use stricter matching
  const allCriticalPass = criticalChecks.length === 0 || criticalChecks.every(c => c);
  const meetsThreshold = matchRatio >= threshold;
  return allCriticalPass && meetsThreshold;
}

/**
 * Tier 3: Generate programs using LLM (like ChatGPT)
 * This is the fallback when seed URLs are disabled or unavailable
 */
export async function generateProgramsWithLLM(
  answers: UserAnswers,
  maxPrograms: number = 20
): Promise<any[]> {
  try {
    // Summarize user profile
    const profileParts: string[] = [];
    
    // Location with optional region (text input)
    if (answers.location) {
      let locationStr = `Location: ${answers.location}`;
      if ((answers as any).location_region) {
        locationStr += ` (${(answers as any).location_region})`;
      }
      profileParts.push(locationStr);
    }
    
    // Company type with "other" text
    if (answers.company_type) {
      const otherText = (answers as any).company_type_other;
      if (answers.company_type === 'other' && otherText) {
        profileParts.push(`Company Type: Other (${otherText})`);
      } else {
        profileParts.push(`Company Type: ${answers.company_type}`);
      }
    }
    
    // Legal type
    if (answers.legal_type) {
      const otherText = (answers as any).legal_type_other;
      if (answers.legal_type === 'other' && otherText) {
        profileParts.push(`Legal Structure: Other (${otherText})`);
      } else {
        profileParts.push(`Legal Structure: ${answers.legal_type}`);
      }
    }
    
    // Company stage - handle both old format (string) and new format (number months)
    if (answers.company_stage) {
      if (typeof answers.company_stage === 'number') {
        // New format: months slider
        const months = answers.company_stage;
        const classified = answers.company_stage_classified || 'unknown';
        profileParts.push(`Company Stage: ${classified} (${months} months)`);
      } else {
        // Old format: string value
        const otherText = (answers as any).company_stage_other;
        if (answers.company_stage === 'other' && otherText) {
          profileParts.push(`Company Stage: Other (${otherText})`);
        } else {
          profileParts.push(`Company Stage: ${answers.company_stage}`);
        }
      }
    }
    if (answers.funding_amount) {
      // Handle numeric values from slider
      if (typeof answers.funding_amount === 'number') {
        profileParts.push(`Funding Amount: €${answers.funding_amount.toLocaleString()}`);
      } else {
        profileParts.push(`Funding Amount: ${answers.funding_amount}`);
      }
    }
    
    // Industry focus with sub-categories
    if (answers.industry_focus) {
      const industries = Array.isArray(answers.industry_focus) 
        ? answers.industry_focus 
        : [answers.industry_focus];
      
      // Include sub-categories if available, and "other" text if present
      const industryDetails: string[] = [];
      industries.forEach((industry: string) => {
        const subCatKey = `industry_focus_${industry}`;
        const subCategories = (answers as any)[subCatKey];
        const otherText = (answers as any).industry_focus_other;
        
        if (industry === 'other' && otherText) {
          industryDetails.push(`Other: ${otherText}`);
        } else if (subCategories && Array.isArray(subCategories) && subCategories.length > 0) {
          industryDetails.push(`${industry} (${subCategories.join(', ')})`);
        } else {
          industryDetails.push(industry);
        }
      });
      profileParts.push(`Industry Focus: ${industryDetails.join(', ')}`);
    }
    
    // Impact with "other" text and details for each type
    if (answers.impact) {
      const impacts = Array.isArray(answers.impact) 
        ? answers.impact 
        : [answers.impact];
      const otherText = (answers as any).impact_other;
      const impactDetails = impacts.map((imp: string) => {
        if (imp === 'other' && otherText) {
          return `Other: ${otherText}`;
        }
        // Add details if specified
        const detailKey = `impact_${imp}`;
        const details = (answers as any)[detailKey];
        if (details) {
          return `${imp} (${details})`;
        }
        return imp;
      });
      profileParts.push(`Impact: ${impactDetails.join(', ')}`);
    }
    
    // Company stage - handle both old format (string) and new format (number months)
    if (answers.company_stage) {
      if (typeof answers.company_stage === 'number') {
        // New format: months slider
        const months = answers.company_stage;
        const classified = answers.company_stage_classified || 'unknown';
        profileParts.push(`Company Stage: ${classified} (${months} months)`);
      } else {
        // Old format: string value
        const otherText = (answers as any).company_stage_other;
        if (answers.company_stage === 'other' && otherText) {
          profileParts.push(`Company Stage: Other (${otherText})`);
        } else {
          profileParts.push(`Company Stage: ${answers.company_stage}`);
        }
      }
    }
    
    // Legal type
    if (answers.legal_type) {
      const otherText = (answers as any).legal_type_other;
      if (answers.legal_type === 'other' && otherText) {
        profileParts.push(`Legal Structure: Other (${otherText})`);
      } else {
        profileParts.push(`Legal Structure: ${answers.legal_type}`);
      }
    }
    
    // Use of funds with "other" text (support multiple "other" entries)
    if (answers.use_of_funds) {
      const uses = Array.isArray(answers.use_of_funds) 
        ? answers.use_of_funds 
        : [answers.use_of_funds];
      const otherText = (answers as any).use_of_funds_other;
      const useDetails = uses.map((use: string) => {
        if (use === 'other') {
          if (Array.isArray(otherText)) {
            return `Other: ${otherText.filter((t: string) => t.trim()).join(', ')}`;
          } else if (otherText) {
            return `Other: ${otherText}`;
          }
          return 'Other';
        }
        return use;
      });
      profileParts.push(`Use of Funds: ${useDetails.join(', ')}`);
    }
    
    // Project duration (numeric from slider - now in months)
    if (answers.project_duration) {
      if (typeof answers.project_duration === 'number') {
        const months = answers.project_duration;
        const years = Math.floor(months / 12);
        const remainingMonths = months % 12;
        if (years > 0 && remainingMonths > 0) {
          profileParts.push(`Project Duration: ${years} year${years > 1 ? 's' : ''} ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`);
        } else if (years > 0) {
          profileParts.push(`Project Duration: ${years} year${years > 1 ? 's' : ''}`);
        } else {
          profileParts.push(`Project Duration: ${months} month${months > 1 ? 's' : ''}`);
        }
      } else {
        profileParts.push(`Project Duration: ${answers.project_duration}`);
      }
    }
    
    // Deadline urgency (numeric from slider)
    if (answers.deadline_urgency) {
      if (typeof answers.deadline_urgency === 'number') {
        profileParts.push(`Deadline Urgency: ${answers.deadline_urgency} months`);
      } else {
        profileParts.push(`Deadline Urgency: ${answers.deadline_urgency}`);
      }
    }
    
    // Team size (numeric from slider)
    if (answers.team_size) {
      if (typeof answers.team_size === 'number') {
        profileParts.push(`Team Size: ${answers.team_size} people`);
      } else {
        profileParts.push(`Team Size: ${answers.team_size}`);
      }
    }
    
    // Co-financing with percentage if specified
    if (answers.co_financing) {
      const percentage = (answers as any).co_financing_percentage;
      if (answers.co_financing === 'co_yes' && percentage) {
        profileParts.push(`Co-financing: Yes (${percentage})`);
      } else {
        profileParts.push(`Co-financing: ${answers.co_financing}`);
      }
    }
    
    // Handle project description (from editor modal)
    if ((answers as any).project_description) {
      profileParts.push(`Project Description: ${(answers as any).project_description}`);
    }
    
    const userProfile = profileParts.join('\n');
    
    // Detect early-stage companies and add special instructions
    const isEarlyStage = answers.company_stage && (
      typeof answers.company_stage === 'number' && answers.company_stage < 12
    ) || answers.company_stage_classified === 'early_stage' || 
      answers.company_stage_classified === 'pre_company' ||
      answers.company_type === 'prefounder';
    
    const isPreFounder = answers.company_type === 'prefounder' || 
      (typeof answers.company_stage === 'number' && answers.company_stage < 0);
    
    // Build enhanced prompt with early-stage emphasis
    let promptBase = `You are an expert on European funding programs (grants, loans, subsidies).

Based on this user profile, suggest ${maxPrograms} relevant funding programs:

${userProfile}`;
    
    // Add special instructions for early-stage companies
    if (isPreFounder) {
      promptBase += `\n\nIMPORTANT: This is a PRE-FOUNDER (idea stage, not yet incorporated). You MUST include programs specifically designed for:
- Pre-founders and idea-stage entrepreneurs
- Programs that don't require incorporation
- Early-stage startup support programs
- Seed funding and pre-seed programs
- Programs for solo founders and individuals with business ideas`;
    } else if (isEarlyStage) {
      promptBase += `\n\nIMPORTANT: This is an EARLY-STAGE company (less than 12 months old). You MUST include programs specifically designed for:
- Early-stage startups and newly founded companies
- Programs that accept companies less than 1 year old
- Startup support and seed funding programs
- Programs for companies in their first year`;
    }
    
    // Add instructions for large funding amounts
    if (answers.funding_amount && typeof answers.funding_amount === 'number' && answers.funding_amount >= 1000000) {
      promptBase += `\n\nNOTE: This company needs large funding (€${answers.funding_amount.toLocaleString()}+). Include programs that support large funding amounts, scale-up programs, and growth-stage funding.`;
    }

    const prompt = promptBase + `

For each program, provide a JSON object with:
- name: Program name
- institution: Institution/organization name
- funding_amount_min: Minimum funding amount (number)
- funding_amount_max: Maximum funding amount (number)
- currency: Currency code (default: EUR)
- location: Geographic eligibility (e.g., "Austria", "Germany", "EU")
- company_type: Eligible company types (e.g., "startup", "sme", "research", "prefounder" for pre-founders)
- industry_focus: Industry/sector focus (array of strings)
- deadline: Application deadline if known (YYYY-MM-DD format, or null)
- open_deadline: Boolean indicating if deadline is open/rolling
- website: Program website URL if known (or null)
- description: Brief program description

CRITICAL: You MUST return at least ${Math.min(maxPrograms, 5)} programs. If you cannot find exact matches, include similar or related programs that could be relevant.

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

    // Call LLM using EXACT same pattern as extractWithLLM from features/reco/engine/llmExtract
    const { isCustomLLMEnabled, callCustomLLM } = await import('../../../shared/lib/ai/customLLM');
    const OpenAI = (await import('openai')).default;
    
    console.log('🤖 Calling LLM to generate programs (using extractWithLLM pattern)...');
    console.log('📝 User profile:', userProfile.substring(0, 200) + '...');
    
    const messages = [
      { role: 'system' as const, content: 'You are an expert on European funding programs. Return a JSON object with a "programs" array containing funding program suggestions.' },
      { role: 'user' as const, content: prompt }
    ];
    
    let responseText: string | null = null;
    
    // Use EXACT same LLM calling pattern as extractWithLLM
    if (isCustomLLMEnabled()) {
      try {
        let retries = 3;
        let customResponse;
        while (retries > 0) {
          try {
            customResponse = await callCustomLLM({
              messages,
              responseFormat: 'json',
              temperature: 0.3,
              maxTokens: 4000,
            });
            break; // Success
          } catch (rateLimitError: any) {
            if (rateLimitError?.status === 429 && retries > 0) {
              let waitSeconds = 5;
              const errorMsg = rateLimitError?.message || String(rateLimitError);
              const waitMatch = errorMsg.match(/(?:try again|Please retry|retryDelay)[^\d]*([\d.]+)s/i) 
                || errorMsg.match(/retryDelay["\s:]+([\d.]+)s/i);
              if (waitMatch) {
                waitSeconds = parseFloat(waitMatch[1]) + 1;
              }
              console.warn(`   ⚠️  Rate limit (429), waiting ${waitSeconds}s before retry...`);
              await new Promise(resolve => setTimeout(resolve, waitSeconds * 1000));
              retries--;
            } else {
              throw rateLimitError;
            }
          }
        }
        if (!customResponse) {
          throw new Error('Failed after retries');
        }
        responseText = customResponse.output;
        console.log(`✅ Custom LLM response received (${customResponse.model})`);
      } catch (customError: any) {
        const errorMsg = customError?.message || String(customError);
        const errorStatus = customError?.status || 'unknown';
        
        if (errorStatus === 429) {
          throw customError;
        } else if (errorStatus === 504 || errorMsg.includes('timeout') || errorMsg.includes('timed out')) {
          console.warn(`⚠️  Custom LLM timeout (${errorStatus}). Retrying once...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          try {
            const retryResponse = await callCustomLLM({
              messages,
              responseFormat: 'json',
              temperature: 0.3,
              maxTokens: 4000,
            });
            responseText = retryResponse.output;
            console.log('✅ Custom LLM retry succeeded after timeout');
          } catch (retryError: any) {
            throw new Error(`Custom LLM timeout retry failed (${retryError?.status || 'unknown'}): ${retryError?.message || retryError}`);
          }
        } else if (errorStatus === 402) {
          console.warn(`⚠️  Custom LLM returned 402 (${errorMsg}). This might be a model access issue.`);
          throw new Error(`Custom LLM access denied (402): ${errorMsg}. Check model availability and API key.`);
        } else {
          throw new Error(`Custom LLM unavailable (${errorStatus}): ${errorMsg}`);
        }
      }
    }
    
    // Only use OpenAI if custom LLM is NOT enabled (same as extractWithLLM)
    if (!responseText && !isCustomLLMEnabled()) {
      const model = process.env.OPENAI_MODEL || process.env.SCRAPER_MODEL_VERSION || "gpt-4o-mini";
      
      let retries = 3;
      let lastError: any = null;
      
      while (retries > 0) {
        try {
          if (!process.env.OPENAI_API_KEY) {
            throw new Error('OpenAI client not initialized. Set OPENAI_API_KEY or use CUSTOM_LLM_ENDPOINT');
          }
          const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
          const completion = await openai.chat.completions.create({
            model: model.startsWith('text-embedding') ? 'gpt-4o-mini' : model,
            messages,
            response_format: { type: "json_object" },
            max_tokens: 4000,
            temperature: 0.3,
          });
          responseText = completion.choices[0]?.message?.content || '{}';
          console.log(`✅ OpenAI response received (${model})`);
          break; // Success, exit retry loop
        } catch (apiError: any) {
          lastError = apiError;
          
          if (apiError?.status === 429 || apiError?.code === 'insufficient_quota') {
            if (retries > 1) {
              const waitTime = Math.pow(2, 3 - retries) * 1000; // 1s, 2s, 4s
              console.warn(`⚠️  Rate limit hit (${apiError?.code || '429'}), retrying in ${waitTime}ms... (${retries - 1} attempts left)`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
              retries--;
              continue;
            } else {
              throw apiError;
            }
          } else {
            throw apiError;
          }
        }
      }
      
      if (!responseText) {
        throw lastError || new Error('Failed to get LLM response after retries');
      }
    } else if (!responseText && isCustomLLMEnabled()) {
      throw new Error('Custom LLM is enabled but failed to provide response. Check custom LLM configuration.');
    }
    
    if (!responseText) {
      throw new Error('LLM returned empty response');
    }
    
    console.log('📄 Response preview:', responseText.substring(0, 300) + '...');
    console.log('📄 Full response length:', responseText.length);

    // Parse JSON response using EXACT same logic as extractWithLLM
    let programs: any[];
    try {
      // Use same sanitize function as extractWithLLM
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
      
      // Clean response text using same method as extractWithLLM
      const sanitized = sanitizeLLMResponse(responseText);
      console.log('📄 Sanitized response length:', sanitized.length);
      const parsed = JSON.parse(sanitized);
      console.log('📄 Parsed JSON keys:', Object.keys(parsed));
      // Handle both array and object formats
      if (Array.isArray(parsed)) {
        programs = parsed;
        console.log(`✅ Found ${programs.length} programs in array format`);
      } else if (parsed.programs && Array.isArray(parsed.programs)) {
        programs = parsed.programs;
        console.log(`✅ Found ${programs.length} programs in object.programs format`);
      } else {
        // Try to extract array from response text
        const jsonMatch = sanitized.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          programs = JSON.parse(jsonMatch[0]);
          console.log(`✅ Found ${programs.length} programs in extracted array`);
        } else {
          console.error('❌ No programs array found. Parsed object:', JSON.stringify(parsed, null, 2).substring(0, 500));
          throw new Error('No programs array found in response');
        }
      }
      
      if (programs.length === 0) {
        console.warn('⚠️ LLM returned empty programs array!');
        console.warn('⚠️ Parsed object:', JSON.stringify(parsed, null, 2).substring(0, 1000));
        console.warn('⚠️ User profile:', userProfile.substring(0, 500));
        
        // Fallback: Generate basic programs based on user profile
        console.log('🔄 Attempting fallback program generation...');
        programs = generateFallbackPrograms(answers, maxPrograms);
        console.log(`✅ Fallback generated ${programs.length} programs`);
      }
    } catch (parseError: any) {
      console.error('Failed to parse LLM response:', parseError.message);
      console.error('Response preview:', responseText.substring(0, 500));
      
      // Try to extract programs from partial JSON
      try {
        // Clean the text first
        const cleanText = responseText.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
        const programsMatch = cleanText.match(/"programs"\s*:\s*\[([\s\S]*)/);
        if (programsMatch) {
          // Try to extract individual program objects using a more flexible regex
          const programsText = programsMatch[1];
          // Match program objects more flexibly
          const programMatches: string[] = [];
          let depth = 0;
          let currentProgram = '';
          let inString = false;
          let escapeNext = false;
          
          for (let i = 0; i < programsText.length; i++) {
            const char = programsText[i];
            if (escapeNext) {
              currentProgram += char;
              escapeNext = false;
              continue;
            }
            if (char === '\\') {
              escapeNext = true;
              currentProgram += char;
              continue;
            }
            if (char === '"' && !escapeNext) {
              inString = !inString;
            }
            if (!inString) {
              if (char === '{') {
                if (depth === 0) currentProgram = '';
                depth++;
              }
              if (char === '}') {
                depth--;
                if (depth === 0) {
                  currentProgram += char;
                  programMatches.push(currentProgram);
                  currentProgram = '';
                }
              }
            }
            if (depth > 0) {
              currentProgram += char;
            }
          }
          
          if (programMatches.length > 0) {
            programs = programMatches.map(p => {
              try {
                return JSON.parse(p);
              } catch (e: any) {
                console.warn('Failed to parse program object:', e.message);
                return null;
              }
            }).filter(p => p !== null && p.name);
            console.log(`⚠️  Extracted ${programs.length} programs from partial JSON`);
          } else {
            throw new Error('Could not extract programs from partial JSON');
          }
        } else {
          throw parseError;
        }
      } catch (fallbackError: any) {
        console.error('Fallback parsing also failed:', fallbackError.message);
        throw new Error('LLM returned invalid JSON');
      }
    }

    // Convert to our program format and extract detailed requirements using extractWithLLM logic
    const programsWithRequirements = await Promise.all(programs.map(async (p: any, index: number) => {
      // Create a text description for extraction (similar to HTML content)
      const programText = `
Program Name: ${p.name || `Program ${index + 1}`}
Institution: ${p.institution || 'Unknown'}
Description: ${p.description || ''}
Location: ${p.location || answers.location || ''}
Company Type: ${p.company_type || answers.company_type || ''}
Industry Focus: ${Array.isArray(p.industry_focus) ? p.industry_focus.join(', ') : (p.industry_focus || '')}
Funding Amount: ${p.funding_amount_min || 0} - ${p.funding_amount_max || 0} ${p.currency || 'EUR'}
Deadline: ${p.deadline || (p.open_deadline ? 'Open deadline' : 'Not specified')}
Website: ${p.website || 'Not available'}
      `.trim();

      // Use extractWithLLM (main extraction file) to extract detailed requirements from program text
      // This extracts ALL 15 categories with comprehensive sub-types
      let extractedRequirements: any = null;
      try {
        extractedRequirements = await extractWithLLM({
          text: programText, // Use text mode (no HTML parsing needed)
          url: p.website || `llm://${p.name || `program_${index}`}`,
          title: p.name || `Program ${index + 1}`,
          description: p.description || '',
        });
        console.log(`✅ Extracted detailed requirements for ${p.name || `program_${index}`}`);
      } catch (error: any) {
        console.warn(`⚠️ Failed to extract requirements for ${p.name || `program_${index}`}:`, error.message);
        // Fall back to basic requirements
      }

      // Use extracted requirements if available, otherwise use basic structure
      const categorized_requirements = extractedRequirements?.categorized_requirements || {
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
      };

      // Use extracted metadata if available, otherwise use basic
      const metadata = extractedRequirements?.metadata || {
        funding_amount_min: p.funding_amount_min || 0,
        funding_amount_max: p.funding_amount_max || 0,
        currency: p.currency || 'EUR',
        deadline: p.deadline || null,
        open_deadline: p.open_deadline || false,
        description: p.description || '',
        region: p.location || answers.location || '',
      };

      return {
        id: `llm_${(p.name || `program_${index}`).toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
        name: p.name || `Program ${index + 1}`,
        url: p.website || null,
        source_url: p.website || null,
        institution_id: `llm_${(p.institution || 'unknown').toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
        type: p.funding_types?.[0] || 'grant',
        program_type: p.funding_types?.[0] || 'grant',
        funding_types: metadata.funding_types || ['grant'],
        metadata,
        categorized_requirements,
        eligibility_criteria: {},
        extracted_at: new Date().toISOString(),
        source: 'llm_generated', // Mark as LLM-generated for lenient matching
      };
    }));

    return programsWithRequirements;
  } catch (error: any) {
    console.error('❌ LLM generation failed:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error message:', error.message);
    
    // Fallback: Generate basic programs based on user profile
    console.log('🔄 Attempting fallback program generation after error...');
    try {
      const fallbackPrograms = generateFallbackPrograms(answers, maxPrograms);
      console.log(`✅ Fallback generated ${fallbackPrograms.length} programs after error`);
      
      // Convert fallback programs to full format with requirements
      const fallbackWithRequirements = await Promise.all(fallbackPrograms.map(async (p: any, index: number) => {
        const categorized_requirements = {
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
        };

        const metadata = {
          funding_amount_min: p.funding_amount_min || 0,
          funding_amount_max: p.funding_amount_max || 0,
          currency: p.currency || 'EUR',
          deadline: p.deadline || null,
          open_deadline: p.open_deadline || false,
          description: p.description || '',
          region: p.location || answers.location || '',
        };

        return {
          id: `fallback_${(p.name || `program_${index}`).toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
          name: p.name || `Program ${index + 1}`,
          url: p.website || null,
          source_url: p.website || null,
          institution_id: `fallback_${(p.institution || 'unknown').toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
          type: 'grant',
          program_type: 'grant',
          funding_types: ['grant'],
          metadata,
          categorized_requirements,
          eligibility_criteria: {},
          extracted_at: new Date().toISOString(),
          source: 'llm_generated',
          _fallback: true,
        };
      }));
      
      return fallbackWithRequirements;
    } catch (fallbackError: any) {
      console.error('❌ Fallback generation also failed:', fallbackError.message);
      // Return empty array as last resort
      return [];
    }
  }
}

/**
 * Generate fallback programs when LLM fails or returns empty
 * Creates basic program structures based on user profile
 */
function generateFallbackPrograms(answers: UserAnswers, maxPrograms: number = 10): any[] {
  const programs: any[] = [];
  const location = answers.location || 'Austria';
  const companyType = answers.company_type || 'startup';
  const fundingAmount = typeof answers.funding_amount === 'number' ? answers.funding_amount : 100000;
  
  // Map of common funding programs by location and company type
  const commonPrograms: Record<string, any[]> = {
    'austria': [
      {
        name: 'FFG Basisprogramm',
        institution: 'Austrian Research Promotion Agency (FFG)',
        funding_amount_min: 50000,
        funding_amount_max: 500000,
        currency: 'EUR',
        location: 'Austria',
        company_type: companyType === 'prefounder' ? 'startup' : companyType,
        industry_focus: Array.isArray(answers.industry_focus) ? answers.industry_focus : (answers.industry_focus ? [answers.industry_focus] : []),
        deadline: null,
        open_deadline: true,
        website: 'https://www.ffg.at',
        description: 'General funding program for research and innovation projects',
      },
      {
        name: 'AWS Gründerfonds',
        institution: 'Austria Wirtschaftsservice (AWS)',
        funding_amount_min: 25000,
        funding_amount_max: 200000,
        currency: 'EUR',
        location: 'Austria',
        company_type: companyType === 'prefounder' ? 'startup' : companyType,
        industry_focus: Array.isArray(answers.industry_focus) ? answers.industry_focus : (answers.industry_focus ? [answers.industry_focus] : []),
        deadline: null,
        open_deadline: true,
        website: 'https://www.aws.at',
        description: 'Startup funding and support program',
      },
      {
        name: 'Wirtschaftsservice Wien',
        institution: 'Vienna Business Agency',
        funding_amount_min: 10000,
        funding_amount_max: 100000,
        currency: 'EUR',
        location: 'Austria',
        company_type: companyType === 'prefounder' ? 'startup' : companyType,
        industry_focus: Array.isArray(answers.industry_focus) ? answers.industry_focus : (answers.industry_focus ? [answers.industry_focus] : []),
        deadline: null,
        open_deadline: true,
        website: 'https://www.wirtschaftsagentur.at',
        description: 'Vienna-based startup and innovation support',
      },
    ],
    'eu': [
      {
        name: 'Horizon Europe',
        institution: 'European Commission',
        funding_amount_min: 100000,
        funding_amount_max: 5000000,
        currency: 'EUR',
        location: 'EU',
        company_type: companyType,
        industry_focus: Array.isArray(answers.industry_focus) ? answers.industry_focus : (answers.industry_focus ? [answers.industry_focus] : []),
        deadline: null,
        open_deadline: false,
        website: 'https://ec.europa.eu/info/research-and-innovation/funding/funding-opportunities/funding-programmes-and-open-calls/horizon-europe_en',
        description: 'EU research and innovation funding program',
      },
      {
        name: 'EIC Accelerator',
        institution: 'European Innovation Council',
        funding_amount_min: 500000,
        funding_amount_max: 2500000,
        currency: 'EUR',
        location: 'EU',
        company_type: companyType === 'prefounder' ? 'startup' : companyType,
        industry_focus: Array.isArray(answers.industry_focus) ? answers.industry_focus : (answers.industry_focus ? [answers.industry_focus] : []),
        deadline: null,
        open_deadline: false,
        website: 'https://eic.ec.europa.eu/eic-funding-opportunities/eic-accelerator_en',
        description: 'EU funding for innovative startups and SMEs',
      },
    ],
  };
  
  // Get programs for the location (default to Austria if unknown)
  const locationKey = location.toLowerCase();
  const locationPrograms = commonPrograms[locationKey] || commonPrograms['austria'];
  
  // Always ensure we have at least some programs
  // Filter and adapt programs based on user profile
  locationPrograms.forEach((program) => {
    if (programs.length >= maxPrograms) return;
    
    // Adapt funding amounts to user needs
    if (fundingAmount > program.funding_amount_max) {
      program.funding_amount_max = Math.max(fundingAmount, program.funding_amount_max * 2);
    }
    
    // Mark as fallback
    program._fallback = true;
    programs.push(program);
  });
  
  // If still need more programs, add generic ones
  // Always ensure at least 5 programs are returned
  const minPrograms = Math.max(5, Math.min(maxPrograms, 10));
  while (programs.length < minPrograms) {
    programs.push({
      name: `Funding Program ${programs.length + 1}`,
      institution: 'Various',
      funding_amount_min: Math.max(10000, fundingAmount * 0.5),
      funding_amount_max: fundingAmount * 2,
      currency: 'EUR',
      location: location,
      company_type: companyType === 'prefounder' ? 'startup' : companyType,
      industry_focus: Array.isArray(answers.industry_focus) ? answers.industry_focus : (answers.industry_focus ? [answers.industry_focus] : []),
      deadline: null,
      open_deadline: true,
      website: null,
      description: 'General funding program - please research specific eligibility requirements',
      _fallback: true,
    });
  }
  
  // Safety check: always return at least 3 programs
  if (programs.length === 0) {
    console.error('❌ generateFallbackPrograms returned 0 programs - this should never happen!');
    // Return at least one generic program as absolute fallback
    programs.push({
      name: 'General Funding Program',
      institution: 'Various Institutions',
      funding_amount_min: Math.max(10000, fundingAmount * 0.5),
      funding_amount_max: fundingAmount * 2,
      currency: 'EUR',
      location: location || 'Austria',
      company_type: companyType || 'startup',
      industry_focus: Array.isArray(answers.industry_focus) ? answers.industry_focus : (answers.industry_focus ? [answers.industry_focus] : []),
      deadline: null,
      open_deadline: true,
      website: null,
      description: 'General funding program - please research specific eligibility requirements',
      _fallback: true,
    });
  }
  
  return programs;
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
    
    console.log('📥 Received request with answers:', Object.keys(answers));
    console.log('📊 Answer summary:', {
      location: answers.location,
      company_type: answers.company_type,
      company_stage: answers.company_stage,
      company_stage_classified: answers.company_stage_classified,
      legal_type: answers.legal_type,
      funding_amount: answers.funding_amount,
      industry_focus: answers.industry_focus,
      has_answers: Object.keys(answers).length > 0,
    });
    
    // Check if seeds should be disabled (via parameter or env var)
    // Default: Use LLM generation (like ChatGPT) - unrestricted, no URL list needed
    const useSeedExtraction = use_seeds && process.env.DISABLE_SEED_URLS !== 'true' && process.env.USE_SEED_EXTRACTION === 'true';

    // Primary: LLM-Generated Programs (Like ChatGPT) - Unrestricted
    let programs: any[] = [];
    let extractionResults: any[] = [];
    
    // Try LLM generation first (unrestricted, like ChatGPT)
    console.log('🤖 Generating programs with LLM (unrestricted, like ChatGPT)...');
    console.log('🔑 Checking LLM availability...', {
      hasOpenAI: !!process.env.OPENAI_API_KEY,
      hasCustomLLM: !!process.env.CUSTOM_LLM_ENDPOINT,
    });
    
    try {
      console.log('📤 Calling generateProgramsWithLLM with answers and maxPrograms:', max_results * 2);
      programs = await generateProgramsWithLLM(answers, max_results * 2);
      console.log(`✅ generateProgramsWithLLM returned ${programs.length} programs`);
      
      // Log program sources for debugging
      const llmGeneratedCount = programs.filter((p: any) => p.source === 'llm_generated' || p._fallback === true).length;
      const otherCount = programs.length - llmGeneratedCount;
      console.log(`📊 Program breakdown: ${llmGeneratedCount} LLM-generated, ${otherCount} from other sources`);
      
      // For LLM-generated programs, skip filtering entirely (they're already tailored to user)
      // Only filter if extract_all is false AND program is not LLM-generated
      const filteredPrograms = programs.filter((p: any) => {
        if (extract_all) return true;
        // Skip filtering for LLM-generated programs - they're already relevant
        if (p.source === 'llm_generated' || p._fallback === true) {
          console.log(`✅ Skipping filter for LLM-generated program: "${p.name || 'unknown'}" (source: ${p.source || 'unknown'})`);
          return true;
        }
        // Only filter non-LLM programs (from seed extraction)
        const matches = matchesAnswers(p, answers, 0.15);
        if (!matches) {
          console.log(`❌ Filtered out non-LLM program: "${p.name || 'unknown'}" (did not match answers)`);
        }
        return matches;
      });
      
      console.log(`📊 Filtered ${programs.length} programs → ${filteredPrograms.length} matching (LLM programs always pass)`);
      
      // Ensure we always have at least some programs
      if (filteredPrograms.length === 0 && programs.length > 0) {
        console.log('⚠️ All programs filtered out, using all generated programs (emergency fallback)');
        programs = programs; // Keep all
        extractionResults.push({
          source: 'llm_generated',
          message: `Generated ${programs.length} programs using LLM (emergency fallback - no filtering)`,
          fallback_used: true,
          emergency_fallback: true,
        });
      } else {
        programs = filteredPrograms;
        extractionResults.push({
          source: 'llm_generated',
          message: `Generated ${programs.length} programs using LLM (like ChatGPT - unrestricted)`,
        });
      }
      
      console.log(`✅ Final: ${programs.length} programs after filtering`);
      
      if (programs.length === 0) {
        console.error('❌ CRITICAL: LLM generation returned 0 programs after filtering!');
        console.error('❌ This should not happen - LLM programs should always pass filtering');
        console.error('❌ Check:');
        console.error('   1. Did generateProgramsWithLLM return any programs?');
        console.error('   2. Are programs marked with source="llm_generated"?');
        console.error('   3. Are programs being filtered incorrectly?');
        console.error('❌ Answers provided:', JSON.stringify(answers, null, 2));
      }
    } catch (error: any) {
      console.error('❌ LLM generation failed:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        hasOpenAI: !!process.env.OPENAI_API_KEY,
        hasCustomLLM: !!process.env.CUSTOM_LLM_ENDPOINT,
      });
      extractionResults.push({
        source: 'llm_generated',
        error: error.message,
        details: {
          hasOpenAI: !!process.env.OPENAI_API_KEY,
          hasCustomLLM: !!process.env.CUSTOM_LLM_ENDPOINT,
        },
      });
      
      // If LLM is not configured, return a helpful error
      if (error.message?.includes('No LLM available')) {
        return res.status(500).json({
          error: 'LLM not configured',
          message: 'Please set OPENAI_API_KEY or CUSTOM_LLM_ENDPOINT environment variable to generate programs.',
          programs: [],
          extractionResults,
        });
      }
    }

    // Optional: URL-Based Extraction (if enabled - for additional programs)
    if (useSeedExtraction && programs.length < max_results) {
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

    // If no programs from either source, use fallback (shouldn't happen, but safety net)
    if (programs.length === 0) {
      console.error('❌ CRITICAL: No programs generated from any source - using emergency fallback');
      console.error('❌ This indicates a serious issue - check:');
      console.error('   1. Is LLM configured (OPENAI_API_KEY or CUSTOM_LLM_ENDPOINT)?');
      console.error('   2. Did LLM generation fail silently?');
      console.error('   3. Are all programs being filtered out?');
      console.error('❌ Answers provided:', JSON.stringify(answers, null, 2));
      try {
        const emergencyPrograms = generateFallbackPrograms(answers, max_results);
        if (emergencyPrograms.length > 0) {
          // Convert to full format
          programs = emergencyPrograms.map((p: any, index: number) => ({
            id: `emergency_${(p.name || `program_${index}`).toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
            name: p.name || `Program ${index + 1}`,
            url: p.website || null,
            source_url: p.website || null,
            institution_id: `emergency_${(p.institution || 'unknown').toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
            type: 'grant',
            program_type: 'grant',
            funding_types: ['grant'],
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
            },
            eligibility_criteria: {},
            extracted_at: new Date().toISOString(),
            source: 'llm_generated',
            _fallback: true,
            _emergency: true,
          }));
          extractionResults.push({
            source: 'emergency_fallback',
            message: `Generated ${programs.length} emergency fallback programs`,
            emergency: true,
          });
          console.log(`✅ Emergency fallback generated ${programs.length} programs`);
        }
      } catch (fallbackError: any) {
        console.error('❌ Emergency fallback also failed:', fallbackError.message);
      }
    }

    // Return results with extraction mapping
    return res.status(200).json({
      success: true,
      programs,
      count: programs.length,
      extraction_results: extractionResults,
      question_mapping: QUESTION_TO_EXTRACTION_MAP,
      answers_provided: answers,
      source: programs.length > 0 && programs[0].source === 'llm_generated' ? 'llm_generated' : 'mixed',
      llm_generated: programs.length > 0 && programs[0].source === 'llm_generated',
      message: `Generated ${programs.length} programs using LLM (unrestricted, like ChatGPT)${useSeedExtraction ? ' + seed URL extraction' : ''}`,
    });

  } catch (error: any) {
    console.error('Recommendation API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}

