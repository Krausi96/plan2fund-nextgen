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
    const { max_results = 10, extract_all = false } = req.body;

    // Load seed URLs
    const seedsPath = path.join(process.cwd(), 'scraper-lite', 'url-seeds.json');
    if (!fs.existsSync(seedsPath)) {
      return res.status(404).json({
        error: 'Seed file not found',
        message: 'scraper-lite/url-seeds.json is required',
      });
    }

    const seeds: SeedEntry[] = JSON.parse(fs.readFileSync(seedsPath, 'utf8'));

    // Filter seeds based on answers
    const relevantSeeds = filterSeedsByAnswers(seeds, answers);
    console.log(`📊 Filtered ${seeds.length} seeds → ${relevantSeeds.length} relevant seeds`);

    // Limit seeds to process (to avoid too many requests)
    const seedsToProcess = relevantSeeds.slice(0, Math.min(max_results * 2, 20));

    // Extract programs on-demand
    const programs: any[] = [];
    const extractionResults: any[] = [];

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

      // Stop if we have enough programs
      if (programs.length >= max_results) break;
    }

    // Return results with extraction mapping
    return res.status(200).json({
      success: true,
      programs,
      count: programs.length,
      extraction_results: extractionResults,
      question_mapping: QUESTION_TO_EXTRACTION_MAP,
      answers_provided: answers,
      seeds_checked: seedsToProcess.length,
      message: `Extracted ${programs.length} programs from ${seedsToProcess.length} seed URLs`,
    });

  } catch (error: any) {
    console.error('Recommendation API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}

