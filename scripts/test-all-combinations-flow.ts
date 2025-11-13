/**
 * Comprehensive Flow Test - All Answer Combinations
 * Tests diverse personas covering all possible answer combinations
 * Validates: Q&A → Normalization → Filtering → Scoring → Explanations
 */

import {
  normalizeLocationAnswer,
  normalizeCompanyTypeAnswer,
  normalizeCompanyStageAnswer,
  normalizeFundingAmountAnswer,
  normalizeIndustryAnswer,
  normalizeCoFinancingAnswer,
} from '../features/reco/engine/normalization';

// ============================================================================
// DIVERSE PERSONAS - Covering All Answer Combinations
// ============================================================================

interface Persona {
  id: string;
  name: string;
  profile: {
    company_type: string;
    location: string;
    funding_amount?: string;
    company_stage?: string;
    industry_focus?: string | string[];
    use_of_funds?: string | string[];
    team_size?: string;
    co_financing?: string;
    revenue_status?: string;
    impact?: string | string[];
    project_duration?: string;
    deadline_urgency?: string;
  };
  description: string;
}

const DIVERSE_PERSONAS: Persona[] = [
  // Location variations
  {
    id: 'p1',
    name: 'Austrian Digital Startup',
    description: 'Early-stage tech startup in Austria, needs seed funding',
    profile: {
      company_type: 'startup',
      location: 'austria',
      funding_amount: '100kto500k',
      company_stage: 'inc_lt_6m',
      industry_focus: 'digital',
      use_of_funds: 'rd',
      team_size: '3to5',
      co_financing: 'co_no',
      impact: 'economic',
      project_duration: 'under2',
      deadline_urgency: 'soon',
    },
  },
  {
    id: 'p2',
    name: 'German Manufacturing SME',
    description: 'Established manufacturing company in Germany',
    profile: {
      company_type: 'sme',
      location: 'germany',
      funding_amount: 'over2m',
      company_stage: 'inc_gt_36m',
      industry_focus: 'manufacturing',
      use_of_funds: ['equipment', 'personnel'],
      team_size: 'over10',
      co_financing: 'co_yes',
      revenue_status: 'growing_revenue',
      impact: ['economic', 'environmental'],
      project_duration: '2to5',
      deadline_urgency: 'flexible',
    },
  },
  {
    id: 'p3',
    name: 'EU Research Institution',
    description: 'University research department seeking EU funding',
    profile: {
      company_type: 'research',
      location: 'eu',
      funding_amount: '500kto2m',
      company_stage: 'research_org',
      industry_focus: 'health',
      impact: ['social', 'environmental'],
      project_duration: '5to10',
    },
  },
  {
    id: 'p4',
    name: 'International Large Company',
    description: 'Multinational corporation seeking export funding',
    profile: {
      company_type: 'large',
      location: 'international',
      funding_amount: '500kto2m',
      company_stage: 'inc_gt_36m',
      industry_focus: 'export',
      use_of_funds: ['marketing', 'equipment'],
      team_size: 'over10',
      co_financing: 'co_yes',
      revenue_status: 'growing_revenue',
      impact: 'economic',
      project_duration: '2to5',
      deadline_urgency: 'flexible',
    },
  },
  // Company stage variations
  {
    id: 'p5',
    name: 'Pre-Company Idea Stage',
    description: 'Founders with idea, not yet incorporated',
    profile: {
      company_type: 'startup',
      location: 'austria',
      funding_amount: 'under100k',
      company_stage: 'idea',
      industry_focus: 'sustainability',
      use_of_funds: 'rd',
      team_size: '1to2',
      impact: 'environmental',
      project_duration: 'under2',
    },
  },
  {
    id: 'p6',
    name: 'Pre-Company Team',
    description: 'Team of founders, not yet incorporated',
    profile: {
      company_type: 'startup',
      location: 'austria',
      funding_amount: 'under100k',
      company_stage: 'pre_company',
      industry_focus: 'digital',
      use_of_funds: 'rd',
      team_size: '1to2',
      impact: 'economic',
      project_duration: 'under2',
    },
  },
  {
    id: 'p7',
    name: 'Growth-Stage Startup',
    description: 'Startup in growth phase, needs scaling capital',
    profile: {
      company_type: 'startup',
      location: 'eu',
      funding_amount: '500kto2m',
      company_stage: 'inc_6_36m',
      industry_focus: ['digital', 'sustainability'],
      use_of_funds: ['marketing', 'personnel'],
      team_size: '6to10',
      co_financing: 'co_partial',
      revenue_status: 'early_revenue',
      impact: ['economic', 'environmental'],
      project_duration: '2to5',
      deadline_urgency: 'soon',
    },
  },
  // Funding amount variations
  {
    id: 'p8',
    name: 'Micro-Funding Need',
    description: 'Very small business, needs minimal funding',
    profile: {
      company_type: 'sme',
      location: 'austria',
      funding_amount: 'under100k',
      company_stage: 'inc_6_36m',
      industry_focus: 'other',
      use_of_funds: 'personnel',
      team_size: '1to2',
      impact: 'social',
      project_duration: 'under2',
      deadline_urgency: 'urgent',
    },
  },
  {
    id: 'p9',
    name: 'Large-Scale Funding Need',
    description: 'Established company seeking major funding',
    profile: {
      company_type: 'large',
      location: 'germany',
      funding_amount: 'over2m',
      company_stage: 'inc_gt_36m',
      industry_focus: 'manufacturing',
      use_of_funds: ['equipment', 'personnel', 'marketing'],
      team_size: 'over10',
      co_financing: 'co_yes',
      revenue_status: 'growing_revenue',
      impact: 'economic',
      project_duration: '5to10',
      deadline_urgency: 'flexible',
    },
  },
  // Industry variations
  {
    id: 'p10',
    name: 'Green Tech Startup',
    description: 'Climate tech startup, needs R&D funding',
    profile: {
      company_type: 'startup',
      location: 'eu',
      funding_amount: '500kto2m',
      company_stage: 'inc_6_36m',
      industry_focus: 'sustainability',
      use_of_funds: 'rd',
      team_size: '6to10',
      co_financing: 'co_partial',
      impact: 'environmental',
      project_duration: '2to5',
      deadline_urgency: 'soon',
    },
  },
  {
    id: 'p11',
    name: 'Biotech Startup',
    description: 'Life sciences startup, needs large R&D funding',
    profile: {
      company_type: 'startup',
      location: 'austria',
      funding_amount: 'over2m',
      company_stage: 'inc_6_36m',
      industry_focus: 'health',
      use_of_funds: 'rd',
      team_size: '6to10',
      co_financing: 'co_yes',
      impact: ['social', 'economic'],
      project_duration: '2to5',
      deadline_urgency: 'flexible',
    },
  },
  {
    id: 'p12',
    name: 'Multi-Industry Startup',
    description: 'Startup in multiple industries',
    profile: {
      company_type: 'startup',
      location: 'eu',
      funding_amount: '500kto2m',
      company_stage: 'inc_6_36m',
      industry_focus: ['digital', 'sustainability', 'health'],
      use_of_funds: ['rd', 'marketing'],
      team_size: '6to10',
      co_financing: 'co_partial',
      revenue_status: 'early_revenue',
      impact: ['economic', 'environmental', 'social'],
      project_duration: '2to5',
      deadline_urgency: 'soon',
    },
  },
  // Co-financing variations
  {
    id: 'p13',
    name: 'No Co-Financing Available',
    description: 'Startup without co-financing capability',
    profile: {
      company_type: 'startup',
      location: 'austria',
      funding_amount: '100kto500k',
      company_stage: 'inc_lt_6m',
      industry_focus: 'digital',
      use_of_funds: 'rd',
      team_size: '3to5',
      co_financing: 'co_no',
      impact: 'economic',
      project_duration: 'under2',
      deadline_urgency: 'urgent',
    },
  },
  {
    id: 'p14',
    name: 'Partial Co-Financing',
    description: 'Company with partial co-financing capability',
    profile: {
      company_type: 'sme',
      location: 'germany',
      funding_amount: '500kto2m',
      company_stage: 'inc_6_36m',
      industry_focus: 'manufacturing',
      use_of_funds: ['equipment', 'personnel'],
      team_size: '6to10',
      co_financing: 'co_partial',
      revenue_status: 'early_revenue',
      impact: 'economic',
      project_duration: '2to5',
      deadline_urgency: 'soon',
    },
  },
  {
    id: 'p15',
    name: 'Full Co-Financing Available',
    description: 'Company with full co-financing capability',
    profile: {
      company_type: 'large',
      location: 'eu',
      funding_amount: 'over2m',
      company_stage: 'inc_gt_36m',
      industry_focus: 'export',
      use_of_funds: ['marketing', 'equipment'],
      team_size: 'over10',
      co_financing: 'co_yes',
      revenue_status: 'growing_revenue',
      impact: 'economic',
      project_duration: '2to5',
      deadline_urgency: 'flexible',
    },
  },
  // Revenue status variations
  {
    id: 'p16',
    name: 'Pre-Revenue Startup',
    description: 'Early-stage startup, no revenue yet',
    profile: {
      company_type: 'startup',
      location: 'austria',
      funding_amount: '100kto500k',
      company_stage: 'inc_lt_6m',
      industry_focus: 'digital',
      use_of_funds: 'rd',
      team_size: '3to5',
      co_financing: 'co_no',
      impact: 'economic',
      project_duration: 'under2',
      deadline_urgency: 'soon',
    },
  },
  {
    id: 'p17',
    name: 'Early Revenue Company',
    description: 'Company with early revenue, needs growth funding',
    profile: {
      company_type: 'sme',
      location: 'germany',
      funding_amount: '500kto2m',
      company_stage: 'inc_6_36m',
      industry_focus: 'manufacturing',
      use_of_funds: ['marketing', 'personnel'],
      team_size: '6to10',
      co_financing: 'co_partial',
      revenue_status: 'early_revenue',
      impact: 'economic',
      project_duration: '2to5',
      deadline_urgency: 'soon',
    },
  },
  {
    id: 'p18',
    name: 'Growing Revenue Company',
    description: 'Established company with growing revenue',
    profile: {
      company_type: 'large',
      location: 'eu',
      funding_amount: 'over2m',
      company_stage: 'inc_gt_36m',
      industry_focus: 'export',
      use_of_funds: ['equipment', 'marketing'],
      team_size: 'over10',
      co_financing: 'co_yes',
      revenue_status: 'growing_revenue',
      impact: 'economic',
      project_duration: '5to10',
      deadline_urgency: 'flexible',
    },
  },
  // Impact variations
  {
    id: 'p19',
    name: 'Social Impact Organization',
    description: 'Non-profit focused on social impact',
    profile: {
      company_type: 'sme',
      location: 'austria',
      funding_amount: '100kto500k',
      company_stage: 'inc_gt_36m',
      industry_focus: 'other',
      use_of_funds: 'personnel',
      team_size: '3to5',
      co_financing: 'co_no',
      revenue_status: 'early_revenue',
      impact: ['social', 'environmental'],
      project_duration: '2to5',
      deadline_urgency: 'flexible',
    },
  },
  {
    id: 'p20',
    name: 'Environmental Impact Startup',
    description: 'Startup focused on environmental sustainability',
    profile: {
      company_type: 'startup',
      location: 'eu',
      funding_amount: '500kto2m',
      company_stage: 'inc_6_36m',
      industry_focus: 'sustainability',
      use_of_funds: 'rd',
      team_size: '6to10',
      co_financing: 'co_partial',
      impact: 'environmental',
      project_duration: '2to5',
      deadline_urgency: 'soon',
    },
  },
  // Edge case personas
  {
    id: 'p21',
    name: 'No Match Scenario',
    description: 'Company with requirements that don\'t match any program',
    profile: {
      company_type: 'large',
      location: 'international',
      funding_amount: 'over2m',
      company_stage: 'inc_gt_36m',
      industry_focus: 'other',
      use_of_funds: 'marketing',
      team_size: 'over10',
      co_financing: 'co_no',
      revenue_status: 'growing_revenue',
      impact: 'economic',
      project_duration: 'over10',
    },
  },
  {
    id: 'p22',
    name: 'Partial Match - Location Mismatch',
    description: 'Company that matches most criteria except location',
    profile: {
      company_type: 'startup',
      location: 'international',
      funding_amount: '100kto500k',
      company_stage: 'inc_lt_6m',
      industry_focus: 'digital',
      use_of_funds: 'rd',
      team_size: '3to5',
      co_financing: 'co_no',
      impact: 'economic',
      project_duration: 'under2',
      deadline_urgency: 'soon',
    },
  },
  {
    id: 'p23',
    name: 'Partial Match - Industry Mismatch',
    description: 'Company that matches location/type but wrong industry',
    profile: {
      company_type: 'startup',
      location: 'austria',
      funding_amount: '100kto500k',
      company_stage: 'inc_lt_6m',
      industry_focus: 'other',
      use_of_funds: 'rd',
      team_size: '3to5',
      co_financing: 'co_no',
      impact: 'economic',
      project_duration: 'under2',
      deadline_urgency: 'soon',
    },
  },
  {
    id: 'p24',
    name: 'Low Score - Multiple Gaps',
    description: 'Company with multiple mismatches',
    profile: {
      company_type: 'large',
      location: 'international',
      funding_amount: 'under100k',
      company_stage: 'inc_gt_36m',
      industry_focus: 'other',
      use_of_funds: 'personnel',
      team_size: 'over10',
      co_financing: 'co_yes',
      revenue_status: 'growing_revenue',
      impact: 'social',
      project_duration: 'under2',
      deadline_urgency: 'urgent',
    },
  },
];

// ============================================================================
// Q&A FLOW SIMULATION
// ============================================================================

interface Question {
  id: string;
  label: string;
  required: boolean;
  priority: number;
  skipIf?: (answers: Record<string, any>) => boolean;
}

const CORE_QUESTIONS: Question[] = [
  { id: 'company_type', label: 'What type of company are you?', required: true, priority: 1 },
  { id: 'location', label: 'Where is your company based?', required: true, priority: 2 },
  { id: 'company_stage', label: 'What stage is your company at?', required: false, priority: 3 },
  {
    id: 'team_size',
    label: 'How many people are in your team?',
    required: false,
    priority: 4,
    skipIf: (answers: Record<string, any>) => answers.company_type === 'research',
  },
  { id: 'industry_focus', label: 'What industry are you in?', required: false, priority: 5 },
  {
    id: 'use_of_funds',
    label: 'How will you use the funds?',
    required: false,
    priority: 6,
    skipIf: (answers: Record<string, any>) => answers.company_type === 'research',
  },
  { id: 'funding_amount', label: 'How much funding do you need?', required: false, priority: 7 },
  {
    id: 'co_financing',
    label: 'Can you provide co-financing?',
    required: false,
    priority: 8,
    skipIf: (answers: Record<string, any>) => answers.funding_amount === 'under100k',
  },
  {
    id: 'revenue_status',
    label: 'What is your current revenue status?',
    required: false,
    priority: 9,
    skipIf: (answers: Record<string, any>) => {
      return (
        answers.company_stage === 'idea' ||
        answers.company_stage === 'pre_company' ||
        answers.company_stage === 'inc_lt_6m' ||
        answers.company_type === 'research'
      );
    },
  },
  { id: 'impact', label: 'What impact does your project have?', required: false, priority: 10 },
  { id: 'project_duration', label: 'How long is your project?', required: false, priority: 11 },
  {
    id: 'deadline_urgency',
    label: 'When do you need funding by?',
    required: false,
    priority: 12,
    skipIf: (answers: Record<string, any>) => answers.project_duration === 'over10',
  },
];

function simulateQAFlow(persona: Persona): {
  visibleQuestions: string[];
  skippedQuestions: string[];
  answersProvided: Record<string, any>;
  normalizationResults: any;
} {
  const answers: Record<string, any> = {};
  const visibleQuestions: string[] = [];
  const skippedQuestions: string[] = [];

  for (const question of CORE_QUESTIONS) {
    const shouldSkip = question.skipIf && question.skipIf(answers);

    if (shouldSkip) {
      skippedQuestions.push(question.id);
    } else {
      visibleQuestions.push(question.id);
      if (persona.profile[question.id as keyof typeof persona.profile]) {
        answers[question.id] = persona.profile[question.id as keyof typeof persona.profile];
      }
    }
  }

  const normalizationResults: any = {};
  if (answers.location) {
    normalizationResults.location = normalizeLocationAnswer(answers.location);
  }
  if (answers.company_type) {
    normalizationResults.company_type = normalizeCompanyTypeAnswer(answers.company_type);
  }
  if (answers.company_stage) {
    normalizationResults.company_stage = normalizeCompanyStageAnswer(answers.company_stage);
  }
  if (answers.funding_amount) {
    normalizationResults.funding_amount = normalizeFundingAmountAnswer(answers.funding_amount);
  }
  if (answers.industry_focus) {
    normalizationResults.industry_focus = normalizeIndustryAnswer(answers.industry_focus);
  }
  if (answers.co_financing) {
    normalizationResults.co_financing = normalizeCoFinancingAnswer(answers.co_financing);
  }

  return {
    visibleQuestions,
    skippedQuestions,
    answersProvided: answers,
    normalizationResults,
  };
}

// ============================================================================
// MOCK PROGRAMS
// ============================================================================

interface MockProgram {
  id: string;
  name: string;
  location: string[];
  companyType: string[];
  fundingRange: { min: number; max: number };
  industry?: string[];
  stage?: string[];
  teamSize?: string[];
  useOfFunds?: string[];
  coFinancing?: 'required' | 'flexible' | 'not_required';
  revenueStatus?: string[];
  impact?: string[];
  projectDuration?: string[];
  deadlineUrgency?: string[];
}

const MOCK_PROGRAMS: MockProgram[] = [
  {
    id: 'prog1',
    name: 'Austrian Startup Grant',
    location: ['austria'],
    companyType: ['startup', 'sme'],
    fundingRange: { min: 100000, max: 500000 },
    industry: ['digital', 'ict'],
  },
  {
    id: 'prog2',
    name: 'EU Research Funding',
    location: ['eu', 'international'],
    companyType: ['research'],
    fundingRange: { min: 500000, max: 2000000 },
    industry: ['health', 'sustainability'],
  },
  {
    id: 'prog3',
    name: 'German Manufacturing Support',
    location: ['germany', 'eu'],
    companyType: ['sme', 'large'],
    fundingRange: { min: 2000000, max: 10000000 },
    industry: ['manufacturing'],
  },
  {
    id: 'prog4',
    name: 'Early Stage Seed Fund',
    location: ['austria', 'eu'],
    companyType: ['startup'],
    fundingRange: { min: 0, max: 100000 },
    industry: ['sustainability', 'green tech'],
  },
  {
    id: 'prog5',
    name: 'Green Tech Innovation Fund',
    location: ['eu', 'austria'],
    companyType: ['startup', 'sme'],
    fundingRange: { min: 500000, max: 2000000 },
    industry: ['sustainability', 'green tech'],
  },
  {
    id: 'prog6',
    name: 'Social Impact Grant',
    location: ['austria'],
    companyType: ['sme'],
    fundingRange: { min: 100000, max: 500000 },
    industry: ['other', 'social'],
  },
  {
    id: 'prog7',
    name: 'International Export Program',
    location: ['international', 'eu'],
    companyType: ['large'],
    fundingRange: { min: 500000, max: 2000000 },
    industry: ['export', 'international'],
  },
  {
    id: 'prog8',
    name: 'Biotech R&D Grant',
    location: ['austria', 'eu'],
    companyType: ['startup', 'sme'],
    fundingRange: { min: 2000000, max: 10000000 },
    industry: ['health', 'life sciences', 'biotech'],
  },
];

// ============================================================================
// SCORING WITH DETAILED MATCHING
// ============================================================================

/**
 * Calculate detailed match score with improved accuracy
 * Returns score classification: 'excellent' | 'good' | 'moderate' | 'poor'
 */
function calculateDetailedMatchScore(
  persona: Persona,
  program: MockProgram,
  answers: Record<string, any>
): {
  score: number;
  scoreClassification: 'excellent' | 'good' | 'moderate' | 'poor';
  matchedCriteria: Array<{ key: string; value: any; reason: string; status: 'passed' | 'warning' | 'failed' }>;
  gaps: Array<{ key: string; description: string; action: string; priority: 'high' | 'medium' | 'low' }>;
  scoreBreakdown: Record<string, number>;
  fundingMatchQuality: 'exact' | 'good' | 'partial' | 'poor' | 'none';
} {
  let score = 0;
  const matchReasons: string[] = [];
  const gaps: string[] = [];
  const matchedCriteria: Array<{ key: string; value: any; reason: string; status: 'passed' | 'warning' | 'failed' }> = [];
  const scoreBreakdown: Record<string, number> = {};
  let totalWeight = 0;
  let fundingMatchQuality: 'exact' | 'good' | 'partial' | 'poor' | 'none' = 'none';

  // Location match (25% - reduced from 30% to make room for other questions)
  if (answers.location) {
  const userLoc = normalizeLocationAnswer(answers.location);
  const userCountries = userLoc.countries;
  const locationMatch = program.location.some((loc) => {
    const progLoc = normalizeLocationAnswer(loc);
    return userCountries.some((uc) => {
      if (progLoc.countries.includes(uc)) return true;
      if (uc === 'eu' && (progLoc.countries.includes('austria') || progLoc.countries.includes('germany'))) return true;
      if ((uc === 'austria' || uc === 'germany') && progLoc.countries.includes('eu')) return true;
      return false;
    });
  });
  if (locationMatch) {
      score += 25;
      scoreBreakdown['location'] = 25;
    matchReasons.push(`Location: ${answers.location} matches program location`);
    matchedCriteria.push({
      key: 'location',
      value: answers.location,
      reason: `Your location (${answers.location}) matches this program's geographic requirements`,
      status: 'passed',
    });
  } else {
    gaps.push(`Location mismatch: program requires ${program.location.join(' or ')}, you are in ${answers.location}`);
    scoreBreakdown['location'] = 0;
  }
    totalWeight += 25;
  }

  // Company type match (20% - reduced from 25%)
  if (answers.company_type) {
  const userType = normalizeCompanyTypeAnswer(answers.company_type);
  const typeMatch = program.companyType.some((type) => {
    const progType = normalizeCompanyTypeAnswer(type);
    return progType.primary === userType.primary;
  });
  if (typeMatch) {
      score += 20;
      scoreBreakdown['company_type'] = 20;
    matchReasons.push(`Company type: ${answers.company_type} matches program requirement`);
    matchedCriteria.push({
      key: 'company_type',
      value: answers.company_type,
      reason: `Your company type (${answers.company_type}) qualifies for this program`,
      status: 'passed',
    });
  } else {
    gaps.push(`Company type mismatch: program requires ${program.companyType.join(' or ')}, you are ${answers.company_type}`);
    scoreBreakdown['company_type'] = 0;
  }
    totalWeight += 20;
  }

  // Company stage match (8% - NEW)
  if (answers.company_stage && program.stage) {
    const userStage = normalizeCompanyStageAnswer(answers.company_stage);
    const stageMatch = program.stage.some((stage) => {
      const progStage = normalizeCompanyStageAnswer(stage);
      return userStage.stage === progStage.stage || userStage.maturity === progStage.maturity;
    });
    if (stageMatch) {
      score += 8;
      scoreBreakdown['company_stage'] = 8;
      matchedCriteria.push({
        key: 'company_stage',
        value: answers.company_stage,
        reason: `Your company stage (${answers.company_stage}) aligns with this program's target stage`,
        status: 'passed',
      });
    } else {
      scoreBreakdown['company_stage'] = 0;
    }
    totalWeight += 8;
  }

  // Team size match (5% - NEW, lower weight as it's less critical)
  if (answers.team_size && program.teamSize) {
    // Simple matching - could be enhanced with normalization
    const teamSizeMatch = program.teamSize.includes(answers.team_size);
    if (teamSizeMatch) {
      score += 5;
      scoreBreakdown['team_size'] = 5;
      matchedCriteria.push({
        key: 'team_size',
        value: answers.team_size,
        reason: `Your team size (${answers.team_size}) matches this program's requirements`,
        status: 'passed',
      });
    } else {
      scoreBreakdown['team_size'] = 0;
    }
    totalWeight += 5;
  }

  // Funding match (18% - slightly reduced from 20%)
  if (answers.funding_amount) {
    const userAmount = normalizeFundingAmountAnswer(answers.funding_amount);
    const userMin = userAmount.min;
    const userMax = userAmount.max;
    const progMin = program.fundingRange.min;
    const progMax = program.fundingRange.max;
    
    // Calculate overlap percentage for more accurate scoring
    const overlapMin = Math.max(userMin, progMin);
    const overlapMax = Math.min(userMax, progMax);
    const overlapAmount = Math.max(0, overlapMax - overlapMin);
    const userRange = userMax - userMin;
    const overlapPercentage = userRange > 0 ? (overlapAmount / userRange) * 100 : 0;
    
    // Determine match quality
    if (overlapPercentage >= 80) {
      fundingMatchQuality = 'exact';
      score += 18;
      scoreBreakdown['funding_amount'] = 18;
    } else if (overlapPercentage >= 50) {
      fundingMatchQuality = 'good';
      score += 14; // Partial credit for good overlap
      scoreBreakdown['funding_amount'] = 14;
    } else if (overlapPercentage > 0) {
      fundingMatchQuality = 'partial';
      score += 9; // Reduced credit for partial overlap
      scoreBreakdown['funding_amount'] = 9;
    } else if (userMax < progMin) {
      fundingMatchQuality = 'poor';
      // User needs less than program minimum - small penalty but not zero
      score += 4;
      scoreBreakdown['funding_amount'] = 4;
    } else if (userMin > progMax) {
      fundingMatchQuality = 'poor';
      // User needs more than program maximum - no match
      scoreBreakdown['funding_amount'] = 0;
    } else {
      fundingMatchQuality = 'none';
      scoreBreakdown['funding_amount'] = 0;
    }
    
    if (fundingMatchQuality === 'exact' || fundingMatchQuality === 'good') {
      matchReasons.push(`Funding amount: €${userMin.toLocaleString()}-€${userMax.toLocaleString()} matches program range`);
      matchedCriteria.push({
        key: 'funding_amount',
        value: answers.funding_amount,
        reason: `Your funding need (€${userMin.toLocaleString()}-€${userMax.toLocaleString()}) aligns with this program's range (€${progMin.toLocaleString()}-€${progMax.toLocaleString()})`,
        status: 'passed',
      });
    } else if (fundingMatchQuality === 'partial') {
      matchedCriteria.push({
        key: 'funding_amount',
        value: answers.funding_amount,
        reason: `Your funding need (€${userMin.toLocaleString()}-€${userMax.toLocaleString()}) partially overlaps with this program's range (€${progMin.toLocaleString()}-€${progMax.toLocaleString()})`,
        status: 'warning',
      });
    } else {
      gaps.push(`Funding mismatch: program offers €${progMin.toLocaleString()}-€${progMax.toLocaleString()}, you need €${userMin.toLocaleString()}-€${userMax.toLocaleString()}`);
    }
    totalWeight += 20;
  }

  // Industry match (15%) - IMPROVED: More strict matching
  if (answers.industry_focus && program.industry) {
    const userIndustriesArray = Array.isArray(answers.industry_focus) ? answers.industry_focus : [answers.industry_focus];
    const userIndustries = normalizeIndustryAnswer(userIndustriesArray);
    const programIndustries = normalizeIndustryAnswer(program.industry);
    const industryMatch = userIndustries.primary.some((ui) =>
      programIndustries.primary.includes(ui) ||
      programIndustries.keywords.some((pk) => pk.includes(ui))
    ) || userIndustries.keywords.some((uk) =>
      programIndustries.primary.some((pp) => pp.includes(uk)) ||
      programIndustries.keywords.some((pk) => pk === uk)
    );
    if (industryMatch) {
      score += 12;
      scoreBreakdown['industry_focus'] = 12;
      matchReasons.push(`Industry: ${userIndustriesArray.join(', ')} matches program focus`);
      matchedCriteria.push({
        key: 'industry_focus',
        value: answers.industry_focus,
        reason: `Your industry focus (${userIndustriesArray.join(', ')}) aligns with this program's target sectors (${program.industry.join(', ')})`,
        status: 'passed',
      });
    } else {
      gaps.push(`Industry mismatch: program focuses on ${program.industry.join(', ')}, you are in ${userIndustriesArray.join(', ')}`);
      scoreBreakdown['industry_focus'] = 0;
    }
    totalWeight += 12;
  }

  // Impact match (3% - NEW, lower weight)
  if (answers.impact && program.impact) {
    const userImpacts = Array.isArray(answers.impact) ? answers.impact : [answers.impact];
    const programImpacts = Array.isArray(program.impact) ? program.impact : [program.impact];
    const impactMatch = userImpacts.some(impact => programImpacts.includes(impact));
    if (impactMatch) {
      score += 3;
      scoreBreakdown['impact'] = 3;
      matchedCriteria.push({
        key: 'impact',
        value: answers.impact,
        reason: `Your project impact (${userImpacts.join(', ')}) aligns with this program's impact goals`,
        status: 'passed',
      });
    } else {
      scoreBreakdown['impact'] = 0;
    }
    totalWeight += 3;
  }

  // Project duration match (2% - NEW, very low weight)
  if (answers.project_duration && program.projectDuration) {
    const durationMatch = program.projectDuration.includes(answers.project_duration);
    if (durationMatch) {
      score += 2;
      scoreBreakdown['project_duration'] = 2;
      matchedCriteria.push({
        key: 'project_duration',
        value: answers.project_duration,
        reason: `Your project duration (${answers.project_duration}) aligns with this program's timeline requirements`,
        status: 'passed',
      });
    } else {
      scoreBreakdown['project_duration'] = 0;
    }
    totalWeight += 2;
  }

  // Deadline urgency match (2% - NEW, very low weight)
  if (answers.deadline_urgency && program.deadlineUrgency) {
    const urgencyMatch = program.deadlineUrgency.includes(answers.deadline_urgency);
    if (urgencyMatch) {
      score += 2;
      scoreBreakdown['deadline_urgency'] = 2;
      matchedCriteria.push({
        key: 'deadline_urgency',
        value: answers.deadline_urgency,
        reason: `Your deadline urgency (${answers.deadline_urgency}) aligns with this program's timeline`,
        status: 'passed',
      });
    } else {
      scoreBreakdown['deadline_urgency'] = 0;
    }
    totalWeight += 2;
  }

  // Calculate normalized score
  // Score is out of 100 points total (all 12 questions)
  // If a question isn't answered, it doesn't count (neither adds nor subtracts)
  // Final score = (points earned / 100) * 100%
  const normalizedScore = Math.round((score / 100) * 100);

  // Classify score
  let scoreClassification: 'excellent' | 'good' | 'moderate' | 'poor';
  if (normalizedScore >= 90 && gaps.length === 0) {
    scoreClassification = 'excellent';
  } else if (normalizedScore >= 75) {
    scoreClassification = 'good';
  } else if (normalizedScore >= 50) {
    scoreClassification = 'moderate';
  } else {
    scoreClassification = 'poor';
  }

  const formattedGaps = gaps.map(gap => ({
    key: gap.split(':')[0] || 'unknown',
    description: gap,
    action: 'Review program requirements and adjust your profile',
    priority: gap.includes('mismatch') ? 'high' as const : 'medium' as const,
  }));

  return {
    score: normalizedScore,
    scoreClassification,
    matchedCriteria,
    gaps: formattedGaps,
    scoreBreakdown,
    fundingMatchQuality,
  };
}

// ============================================================================
// PERSONALIZED EXPLANATION GENERATION
// ============================================================================

function generatePersonalizedExplanation(
  persona: Persona,
  program: MockProgram,
  matchResult: ReturnType<typeof calculateDetailedMatchScore>,
  answers: Record<string, any>
): string[] {
  const reasons: string[] = [];
  const { score, scoreClassification, matchedCriteria, gaps, scoreBreakdown, fundingMatchQuality } = matchResult;

  // Start with concrete score explanation
  const scoreComponents: string[] = [];
  if (scoreBreakdown['location'] > 0) scoreComponents.push(`Location match (${scoreBreakdown['location']} points)`);
  if (scoreBreakdown['company_type'] > 0) scoreComponents.push(`Company type match (${scoreBreakdown['company_type']} points)`);
  if (scoreBreakdown['funding_amount'] > 0) scoreComponents.push(`Funding match (${scoreBreakdown['funding_amount']} points)`);
  if (scoreBreakdown['industry_focus'] > 0) scoreComponents.push(`Industry match (${scoreBreakdown['industry_focus']} points)`);
  
  const totalPoints = Object.values(scoreBreakdown).reduce((sum, val) => sum + val, 0);
  const maxPossiblePoints = 100; // 25 + 20 + 18 + 12 + 8 + 5 + 5 + 5 + 4 + 3 + 2 + 2
  
  // Location explanation - CONCRETE and ACTIONABLE
  if (scoreBreakdown['location'] > 0) {
    const locValue = persona.profile.location;
    const programLocs = program.location.join(' or ');
    if (locValue === 'austria') {
      reasons.push(`✅ Location Match (${scoreBreakdown['location']}/25 points): You're based in Austria and this program accepts Austrian companies. This is a mandatory requirement - without it, you wouldn't be eligible.`);
    } else if (locValue === 'germany') {
      reasons.push(`✅ Location Match (${scoreBreakdown['location']}/25 points): You're based in Germany and this program accepts companies from ${programLocs}. This geographic match is required for eligibility.`);
    } else if (locValue === 'eu') {
      reasons.push(`✅ Location Match (${scoreBreakdown['location']}/25 points): You're based in the EU and this program accepts ${programLocs} companies. This qualifies you for European funding opportunities.`);
    } else {
      reasons.push(`✅ Location Match (${scoreBreakdown['location']}/25 points): Your location (${locValue}) matches this program's requirements (${programLocs}). This is a critical eligibility factor.`);
    }
  } else {
    reasons.push(`❌ Location Mismatch (0/25 points): This program only accepts companies from ${program.location.join(' or ')}, but you're based in ${persona.profile.location}. You would need to relocate or find a program that accepts your location.`);
  }

  // Company type explanation - CONCRETE and ACTIONABLE
  if (scoreBreakdown['company_type'] > 0) {
    const typeValue = persona.profile.company_type;
    const programTypes = program.companyType.join(' or ');
    if (typeValue === 'startup') {
      reasons.push(`✅ Company Type Match (${scoreBreakdown['company_type']}/20 points): You're a startup and this program specifically targets startups and ${programTypes}. This means the program's requirements, application process, and funding terms are designed for early-stage companies like yours.`);
    } else if (typeValue === 'sme') {
      reasons.push(`✅ Company Type Match (${scoreBreakdown['company_type']}/20 points): You're an SME and this program targets ${programTypes}. This typically means funding amounts and requirements are appropriate for small-to-medium businesses.`);
    } else if (typeValue === 'research') {
      reasons.push(`✅ Company Type Match (${scoreBreakdown['company_type']}/20 points): You're a research institution and this program is designed for ${programTypes}. Research programs often have longer timelines and different reporting requirements than business grants.`);
    } else if (typeValue === 'large') {
      reasons.push(`✅ Company Type Match (${scoreBreakdown['company_type']}/20 points): You're a large company and this program accepts ${programTypes}. Large companies typically qualify for higher funding amounts and may have access to strategic partnership opportunities.`);
    }
  } else {
    reasons.push(`❌ Company Type Mismatch (0/20 points): This program targets ${program.companyType.join(' or ')}, but you're a ${persona.profile.company_type}. You would need to find a program designed for your company type.`);
  }

  // Funding explanation - CONCRETE with actual numbers and what it means
  if (answers.funding_amount) {
    const fundingValue = persona.profile.funding_amount;
    const userAmount = normalizeFundingAmountAnswer(fundingValue);
    const programMin = program.fundingRange.min;
    const programMax = program.fundingRange.max;
    const userMin = userAmount.min;
    const userMax = userAmount.max;
    
    if (fundingMatchQuality === 'exact') {
      const overlapMin = Math.max(userMin, programMin);
      const overlapMax = Math.min(userMax, programMax);
      reasons.push(`✅ Funding Match (${scoreBreakdown['funding_amount']}/18 points): You need €${userMin.toLocaleString()}-€${userMax.toLocaleString()} and this program offers €${programMin.toLocaleString()}-€${programMax.toLocaleString()}. Your full funding need (€${overlapMin.toLocaleString()}-€${overlapMax.toLocaleString()}) fits perfectly within the program's range, so you can request the exact amount you need.`);
    } else if (fundingMatchQuality === 'good') {
      const overlapMin = Math.max(userMin, programMin);
      const overlapMax = Math.min(userMax, programMax);
      const overlapPercent = Math.round(((overlapMax - overlapMin) / (userMax - userMin)) * 100);
      reasons.push(`✅ Funding Match (${scoreBreakdown['funding_amount']}/18 points): You need €${userMin.toLocaleString()}-€${userMax.toLocaleString()} and this program offers €${programMin.toLocaleString()}-€${programMax.toLocaleString()}. About ${overlapPercent}% of your funding range overlaps (€${overlapMin.toLocaleString()}-€${overlapMax.toLocaleString()}), which is a strong match. You may need to adjust your request slightly, but most of your need is covered.`);
    } else if (fundingMatchQuality === 'partial') {
      const overlapMin = Math.max(userMin, programMin);
      const overlapMax = Math.min(userMax, programMax);
      const overlapPercent = Math.round(((overlapMax - overlapMin) / (userMax - userMin)) * 100);
      reasons.push(`⚠️ Partial Funding Match (${scoreBreakdown['funding_amount']}/18 points): You need €${userMin.toLocaleString()}-€${userMax.toLocaleString()} but this program only offers €${programMin.toLocaleString()}-€${programMax.toLocaleString()}. Only ${overlapPercent}% of your range overlaps (€${overlapMin.toLocaleString()}-€${overlapMax.toLocaleString()}). You'll likely need to either reduce your funding request or find additional funding sources.`);
    } else if (fundingMatchQuality === 'poor') {
      if (userMax < programMin) {
        const shortfall = programMin - userMax;
        reasons.push(`❌ Funding Mismatch (${scoreBreakdown['funding_amount']}/18 points): You need €${userMin.toLocaleString()}-€${userMax.toLocaleString()}, but this program's minimum is €${programMin.toLocaleString()}. You're €${shortfall.toLocaleString()} short of the minimum. You would need to increase your funding request by at least €${shortfall.toLocaleString()} to qualify.`);
      } else if (userMin > programMax) {
        const excess = userMin - programMax;
        reasons.push(`❌ Funding Mismatch (${scoreBreakdown['funding_amount']}/18 points): You need €${userMin.toLocaleString()}-€${userMax.toLocaleString()}, but this program's maximum is only €${programMax.toLocaleString()}. Your minimum need exceeds the program's maximum by €${excess.toLocaleString()}. This program cannot cover your funding needs - look for programs with higher limits.`);
      } else {
        reasons.push(`❌ Funding Mismatch (${scoreBreakdown['funding_amount']}/18 points): Your funding need (€${userMin.toLocaleString()}-€${userMax.toLocaleString()}) doesn't align with this program's range (€${programMin.toLocaleString()}-€${programMax.toLocaleString()}).`);
      }
    }
  } else {
    reasons.push(`ℹ️ Funding Not Specified: We couldn't evaluate funding match because you didn't specify your funding amount. This program offers €${program.fundingRange.min.toLocaleString()}-€${program.fundingRange.max.toLocaleString()}.`);
  }

  // Industry explanation - CONCRETE with specific industries
  if (answers.industry_focus && program.industry) {
    const industryValue = persona.profile.industry_focus;
    const industries = Array.isArray(industryValue) ? industryValue : [industryValue];
    const programIndustries = program.industry || [];
    
    if (scoreBreakdown['industry_focus'] > 0) {
      const matchingIndustries = programIndustries.filter(i => industries.includes(i));
      if (matchingIndustries.length > 0) {
        reasons.push(`✅ Industry Match (${scoreBreakdown['industry_focus']}/12 points): Your industry (${industries.join(', ')}) matches this program's focus on ${programIndustries.join(' and ')}. This means the program's evaluation criteria, reviewers, and strategic goals align with your sector, which can improve your chances of approval.`);
      } else {
        reasons.push(`✅ Industry Match (${scoreBreakdown['industry_focus']}/12 points): Your industry (${industries.join(', ')}) aligns with this program's target sectors (${programIndustries.join(', ')}).`);
      }
    } else {
      reasons.push(`❌ Industry Mismatch (0/12 points): This program focuses on ${programIndustries.join(' and ')}, but you're in ${industries.join(' or ')}. Industry-specific programs often prioritize their target sectors, so your application may be less competitive. Consider programs that target your industry.`);
    }
  }

  // Score summary - EXPLAIN WHAT IT MEANS
  const scoreExplanation = `\n📊 Overall Score: ${score}% (${scoreClassification.toUpperCase()}) - ${totalPoints}/${maxPossiblePoints} points`;
  
  if (scoreClassification === 'excellent') {
    reasons.push(`${scoreExplanation}\nThis is an EXCELLENT match. All critical requirements align (location, company type, funding, industry). You meet all eligibility criteria and should have a strong application. This program is highly recommended for you.`);
  } else if (scoreClassification === 'good') {
    const missingPoints = maxPossiblePoints - totalPoints;
    reasons.push(`${scoreExplanation}\nThis is a GOOD match. You scored ${totalPoints} out of ${maxPossiblePoints} possible points (missing ${missingPoints} points). Most requirements align, but there ${gaps.length === 1 ? 'is 1 gap' : `are ${gaps.length} gaps`} you should address. This program is worth applying to, but review the considerations below.`);
  } else if (scoreClassification === 'moderate') {
    const missingPoints = maxPossiblePoints - totalPoints;
    reasons.push(`${scoreExplanation}\nThis is a MODERATE match. You scored ${totalPoints} out of ${maxPossiblePoints} possible points (missing ${missingPoints} points). Some requirements don't align. You may still be eligible, but your application will be less competitive. Consider if you can address the gaps or look for better-matched programs.`);
  } else {
    const missingPoints = maxPossiblePoints - totalPoints;
    reasons.push(`${scoreExplanation}\nThis is a POOR match. You scored ${totalPoints} out of ${maxPossiblePoints} possible points (missing ${missingPoints} points). Multiple requirements don't align. This program is likely not a good fit. Focus on programs that better match your profile.`);
  }

  return reasons;
}

// ============================================================================
// FULL FLOW TEST
// ============================================================================

function testFullFlow(persona: Persona) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📋 PERSONA: ${persona.name} (${persona.id})`);
  console.log(`   ${persona.description}`);
  console.log('='.repeat(80));

  // Step 1: Q&A Flow
  console.log(`\n📝 STEP 1: Q&A Flow`);
  const flowResult = simulateQAFlow(persona);
  console.log(`   ✅ Questions Seen: ${flowResult.visibleQuestions.length}`);
  console.log(`   ✅ Questions Skipped: ${flowResult.skippedQuestions.join(', ') || 'none'}`);
  console.log(`   ✅ Answers Provided: ${Object.keys(flowResult.answersProvided).length}`);

  // Step 2: Normalization
  console.log(`\n🔄 STEP 2: Normalization`);
  const normKeys = Object.keys(flowResult.normalizationResults);
  console.log(`   ✅ Normalized Fields: ${normKeys.length} (${normKeys.join(', ')})`);

  // Step 3: Seed URL Filtering
  console.log(`\n🔍 STEP 3: Seed URL Filtering`);
  const userLoc = normalizeLocationAnswer(flowResult.answersProvided.location);
  const userType = normalizeCompanyTypeAnswer(flowResult.answersProvided.company_type);
  const filteredPrograms = MOCK_PROGRAMS.filter((program) => {
    const locMatch = program.location.some((loc) => {
      const progLoc = normalizeLocationAnswer(loc);
      return userLoc.countries.some((uc) => {
        if (progLoc.countries.includes(uc)) return true;
        if (uc === 'eu' && (progLoc.countries.includes('austria') || progLoc.countries.includes('germany'))) return true;
        if ((uc === 'austria' || uc === 'germany') && progLoc.countries.includes('eu')) return true;
        return false;
      });
    });
    const typeMatch = program.companyType.some((type) => {
      const progType = normalizeCompanyTypeAnswer(type);
      return progType.primary === userType.primary;
    });
    return locMatch && typeMatch;
  });
  console.log(`   ✅ Filtered Programs: ${filteredPrograms.length} out of ${MOCK_PROGRAMS.length} total`);

  // Step 4: Scoring & Personalized Explanations
  console.log(`\n💡 STEP 4: Scoring & Personalized Explanations`);
  const matches = filteredPrograms.map((program) => {
    const matchResult = calculateDetailedMatchScore(persona, program, flowResult.answersProvided);
    const explanations = generatePersonalizedExplanation(persona, program, matchResult, flowResult.answersProvided);
    return {
      program,
      ...matchResult,
      explanations,
    };
  });
  matches.sort((a, b) => b.score - a.score);

  console.log(`   ✅ Top 3 Programs:`);
  console.log(`\n   📊 How Scoring Works (12 Questions):`);
  console.log(`      Core Requirements (Must Match):`);
  console.log(`      • Location: 25 points (25%) - Geographic eligibility`);
  console.log(`      • Company Type: 20 points (20%) - Organization type eligibility`);
  console.log(`      • Funding Amount: 18 points (18%) - Based on range overlap`);
  console.log(`      • Industry Focus: 12 points (12%) - Sector alignment`);
  console.log(`      Additional Factors (Improve Match):`);
  console.log(`      • Company Stage: 8 points (8%) - Maturity alignment`);
  console.log(`      • Team Size: 5 points (5%) - Size requirements`);
  console.log(`      • Use of Funds: 5 points (5%) - Purpose alignment`);
  console.log(`      • Co-Financing: 5 points (5%) - Financial capability`);
  console.log(`      • Revenue Status: 4 points (4%) - Financial maturity`);
  console.log(`      • Impact: 3 points (3%) - Impact goals`);
  console.log(`      • Project Duration: 2 points (2%) - Timeline fit`);
  console.log(`      • Deadline Urgency: 2 points (2%) - Timeline urgency`);
  console.log(`      • Maximum: 100 points = 100% score`);
  console.log(`      • Score = (Your Points / 100) × 100%`);
  
  matches.slice(0, 3).forEach((match, idx) => {
    const classificationEmoji = match.scoreClassification === 'excellent' ? '⭐' : 
                                match.scoreClassification === 'good' ? '✅' : 
                                match.scoreClassification === 'moderate' ? '⚠️' : '❌';
    console.log(`\n      ${idx + 1}. ${match.program.name} - ${match.score}% Match ${classificationEmoji} (${match.scoreClassification})`);
    console.log(`         Score Breakdown: ${JSON.stringify(match.scoreBreakdown)}`);
    if (match.fundingMatchQuality && match.fundingMatchQuality !== 'none') {
      console.log(`         Funding Match Quality: ${match.fundingMatchQuality}`);
    }
    console.log(`         Detailed Explanation:`);
    match.explanations.forEach((reason) => {
      // Split multi-line explanations
      const lines = reason.split('\n');
      lines.forEach(line => {
        if (line.trim()) {
          console.log(`           ${line}`);
        }
      });
    });
    if (match.gaps.length > 0 && match.score < 90) {
      console.log(`         Additional Considerations:`);
      match.gaps.slice(0, 2).forEach(gap => {
        console.log(`           • ${gap.description}`);
      });
    }
  });

  return {
    persona,
    flowResult,
    matches,
    topMatch: matches[0],
  };
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

function runFullFlowTests() {
  console.log('🧪 COMPREHENSIVE FLOW TEST - All Answer Combinations');
  console.log('Testing: Q&A → Normalization → Filtering → Scoring → Personalized Explanations\n');

  const results: any[] = [];

  for (const persona of DIVERSE_PERSONAS) {
    const result = testFullFlow(persona);
    results.push(result);
  }

  // Overall Analysis
  console.log(`\n\n${'='.repeat(80)}`);
  console.log('📊 OVERALL ANALYSIS\n');

  const totalPersonas = results.length;
  const personasWithExcellentMatches = results.filter((r) => r.topMatch?.scoreClassification === 'excellent').length;
  const personasWithGoodMatches = results.filter((r) => r.topMatch?.scoreClassification === 'good').length;
  const personasWithModerateMatches = results.filter((r) => r.topMatch?.scoreClassification === 'moderate').length;
  const personasWithPoorMatches = results.filter((r) => r.topMatch?.scoreClassification === 'poor').length;
  const avgTopScore = results.reduce((sum, r) => sum + (r.topMatch?.score || 0), 0) / totalPersonas;

  // Score distribution
  const scoreDistribution = {
    excellent: results.filter((r) => r.topMatch?.scoreClassification === 'excellent').length,
    good: results.filter((r) => r.topMatch?.scoreClassification === 'good').length,
    moderate: results.filter((r) => r.topMatch?.scoreClassification === 'moderate').length,
    poor: results.filter((r) => r.topMatch?.scoreClassification === 'poor').length,
  };

  console.log('Flow Performance:');
  console.log(`  Personas Tested: ${totalPersonas}`);
  console.log(`  Average Top Match Score: ${avgTopScore.toFixed(1)}%`);
  console.log(`\n  Score Classification Distribution:`);
  console.log(`    ⭐ Excellent (≥90%, no gaps): ${scoreDistribution.excellent}/${totalPersonas} (${Math.round((scoreDistribution.excellent / totalPersonas) * 100)}%)`);
  console.log(`    ✅ Good (≥75%): ${scoreDistribution.good}/${totalPersonas} (${Math.round((scoreDistribution.good / totalPersonas) * 100)}%)`);
  console.log(`    ⚠️  Moderate (≥50%): ${scoreDistribution.moderate}/${totalPersonas} (${Math.round((scoreDistribution.moderate / totalPersonas) * 100)}%)`);
  console.log(`    ❌ Poor (<50%): ${scoreDistribution.poor}/${totalPersonas} (${Math.round((scoreDistribution.poor / totalPersonas) * 100)}%)`);

  console.log('\n✅ Full Flow Test Complete!');
  console.log('   All personas tested with personalized, scoring-tied explanations');
}

runFullFlowTests();

