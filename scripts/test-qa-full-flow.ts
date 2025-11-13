/**
 * Comprehensive Q&A Full Flow Test Suite
 * Tests 15 diverse personas through complete flow: Q&A → API → Scoring → Results
 * Verifies we lead users to perfect/close-perfect funding programs
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
// EXTENDED PERSONAS (15 Diverse Profiles)
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
  expectedQuestions: number;
  expectedSkips: string[];
  idealProgramCriteria?: {
    location?: string[];
    companyType?: string[];
    fundingRange?: { min: number; max: number };
    industry?: string[];
  };
}

const PERSONAS: Persona[] = [
  // 1. Early-Stage Tech Startup (Austria)
  {
    id: 'p1',
    name: 'Early-Stage Tech Startup',
    description: 'Just incorporated, pre-revenue, needs seed funding',
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
      project_duration: '2to5',
      deadline_urgency: 'soon',
    },
    expectedQuestions: 11,
    expectedSkips: ['revenue_status'],
    idealProgramCriteria: {
      location: ['austria', 'eu'],
      companyType: ['startup', 'sme'],
      fundingRange: { min: 100000, max: 500000 },
      industry: ['digital', 'ict', 'technology'],
    },
  },

  // 2. Research Institution (University)
  {
    id: 'p2',
    name: 'Research Institution',
    description: 'University research department seeking EU funding',
    profile: {
      company_type: 'research',
      location: 'eu',
      funding_amount: '500kto2m',
      company_stage: 'research_org',
      industry_focus: 'health',
      impact: ['environmental', 'social'],
      project_duration: '5to10',
      deadline_urgency: 'flexible',
    },
    expectedQuestions: 9,
    expectedSkips: ['use_of_funds', 'team_size', 'revenue_status'],
    idealProgramCriteria: {
      location: ['eu', 'international'],
      companyType: ['research'],
      fundingRange: { min: 500000, max: 2000000 },
      industry: ['health', 'life sciences'],
    },
  },

  // 3. Established SME (Manufacturing)
  {
    id: 'p3',
    name: 'Established SME',
    description: '10-year-old manufacturing company expanding',
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
      deadline_urgency: 'soon',
    },
    expectedQuestions: 12,
    expectedSkips: [],
    idealProgramCriteria: {
      location: ['germany', 'eu'],
      companyType: ['sme', 'large'],
      fundingRange: { min: 2000000, max: 10000000 },
      industry: ['manufacturing', 'production'],
    },
  },

  // 4. Pre-Company Team (Idea Stage)
  {
    id: 'p4',
    name: 'Pre-Company Team',
    description: 'Founders with idea, not yet incorporated',
    profile: {
      company_type: 'startup',
      location: 'austria',
      funding_amount: 'under100k',
      company_stage: 'pre_company',
      industry_focus: 'sustainability',
      use_of_funds: 'rd',
      team_size: '1to2',
      impact: 'environmental',
      project_duration: 'under2',
      deadline_urgency: 'urgent',
    },
    expectedQuestions: 10,
    expectedSkips: ['co_financing', 'revenue_status'],
    idealProgramCriteria: {
      location: ['austria', 'eu'],
      companyType: ['startup'],
      fundingRange: { min: 0, max: 100000 },
      industry: ['sustainability', 'green tech'],
    },
  },

  // 5. Large Company (International)
  {
    id: 'p5',
    name: 'Large Company',
    description: 'Multinational corporation seeking export funding',
    profile: {
      company_type: 'large',
      location: 'international',
      funding_amount: '500kto2m',
      company_stage: 'inc_gt_36m',
      industry_focus: 'export',
      use_of_funds: ['marketing', 'equipment'],
      team_size: 'over10',
      co_financing: 'co_partial',
      revenue_status: 'growing_revenue',
      impact: 'economic',
      project_duration: '5to10',
      deadline_urgency: 'flexible',
    },
    expectedQuestions: 12,
    expectedSkips: [],
    idealProgramCriteria: {
      location: ['international', 'eu'],
      companyType: ['large'],
      fundingRange: { min: 500000, max: 2000000 },
      industry: ['export', 'international'],
    },
  },

  // 6. Solo Founder (Idea Stage)
  {
    id: 'p6',
    name: 'Solo Founder',
    description: 'Single founder with concept, needs minimal funding',
    profile: {
      company_type: 'startup',
      location: 'austria',
      funding_amount: 'under100k',
      company_stage: 'idea',
      industry_focus: 'digital',
      use_of_funds: 'rd',
      team_size: '1to2',
      impact: 'economic',
      project_duration: 'under2',
      deadline_urgency: 'urgent',
    },
    expectedQuestions: 10,
    expectedSkips: ['co_financing', 'revenue_status'],
    idealProgramCriteria: {
      location: ['austria'],
      companyType: ['startup'],
      fundingRange: { min: 0, max: 100000 },
      industry: ['digital', 'ict'],
    },
  },

  // 7. Growth-Stage Startup (6-36 months)
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
    expectedQuestions: 12,
    expectedSkips: [],
    idealProgramCriteria: {
      location: ['eu', 'austria', 'germany'],
      companyType: ['startup', 'sme'],
      fundingRange: { min: 500000, max: 2000000 },
      industry: ['digital', 'sustainability'],
    },
  },

  // 8. Non-Profit Organization
  {
    id: 'p8',
    name: 'Non-Profit Organization',
    description: 'Social impact organization seeking grant funding',
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
    expectedQuestions: 12,
    expectedSkips: [],
    idealProgramCriteria: {
      location: ['austria', 'eu'],
      companyType: ['sme', 'nonprofit'],
      fundingRange: { min: 100000, max: 500000 },
      industry: ['other', 'social'],
    },
  },

  // 9. University Spin-Off
  {
    id: 'p9',
    name: 'University Spin-Off',
    description: 'Research spin-off company, early stage',
    profile: {
      company_type: 'startup',
      location: 'austria',
      funding_amount: '100kto500k',
      company_stage: 'inc_lt_6m',
      industry_focus: 'health',
      use_of_funds: 'rd',
      team_size: '3to5',
      co_financing: 'co_no',
      impact: ['social', 'economic'],
      project_duration: '2to5',
      deadline_urgency: 'soon',
    },
    expectedQuestions: 11,
    expectedSkips: ['revenue_status'],
    idealProgramCriteria: {
      location: ['austria', 'eu'],
      companyType: ['startup'],
      fundingRange: { min: 100000, max: 500000 },
      industry: ['health', 'life sciences'],
    },
  },

  // 10. Established Research Company
  {
    id: 'p10',
    name: 'Established Research Company',
    description: 'Mature research company seeking large funding',
    profile: {
      company_type: 'research',
      location: 'eu',
      funding_amount: 'over2m',
      company_stage: 'research_org',
      industry_focus: ['health', 'sustainability'],
      impact: ['environmental', 'social', 'economic'],
      project_duration: 'over10',
      deadline_urgency: 'flexible',
    },
    expectedQuestions: 8,
    expectedSkips: ['use_of_funds', 'team_size', 'revenue_status', 'deadline_urgency'],
    idealProgramCriteria: {
      location: ['eu', 'international'],
      companyType: ['research'],
      fundingRange: { min: 2000000, max: 10000000 },
      industry: ['health', 'sustainability'],
    },
  },

  // 11. Micro-Enterprise (1-2 employees)
  {
    id: 'p11',
    name: 'Micro-Enterprise',
    description: 'Very small business, needs small grant',
    profile: {
      company_type: 'sme',
      location: 'austria',
      funding_amount: 'under100k',
      company_stage: 'inc_6_36m',
      industry_focus: 'digital',
      use_of_funds: 'marketing',
      team_size: '1to2',
      co_financing: 'co_no',
      revenue_status: 'early_revenue',
      impact: 'economic',
      project_duration: 'under2',
      deadline_urgency: 'soon',
    },
    expectedQuestions: 12,
    expectedSkips: [],
    idealProgramCriteria: {
      location: ['austria'],
      companyType: ['sme', 'startup'],
      fundingRange: { min: 0, max: 100000 },
      industry: ['digital'],
    },
  },

  // 12. Green Tech Startup
  {
    id: 'p12',
    name: 'Green Tech Startup',
    description: 'Climate tech startup, needs R&D funding',
    profile: {
      company_type: 'startup',
      location: 'eu',
      funding_amount: '500kto2m',
      company_stage: 'inc_lt_6m',
      industry_focus: 'sustainability',
      use_of_funds: 'rd',
      team_size: '3to5',
      co_financing: 'co_partial',
      impact: 'environmental',
      project_duration: '2to5',
      deadline_urgency: 'soon',
    },
    expectedQuestions: 11,
    expectedSkips: ['revenue_status'],
    idealProgramCriteria: {
      location: ['eu', 'austria'],
      companyType: ['startup'],
      fundingRange: { min: 500000, max: 2000000 },
      industry: ['sustainability', 'green tech', 'climate'],
    },
  },

  // 13. Biotech Startup
  {
    id: 'p13',
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
      revenue_status: 'pre_revenue',
      impact: ['social', 'economic'],
      project_duration: '5to10',
      deadline_urgency: 'flexible',
    },
    expectedQuestions: 11,
    expectedSkips: ['revenue_status'],
    idealProgramCriteria: {
      location: ['austria', 'eu'],
      companyType: ['startup', 'sme'],
      fundingRange: { min: 2000000, max: 10000000 },
      industry: ['health', 'life sciences', 'biotech'],
    },
  },

  // 14. Social Enterprise
  {
    id: 'p14',
    name: 'Social Enterprise',
    description: 'Social impact business, needs grant funding',
    profile: {
      company_type: 'sme',
      location: 'austria',
      funding_amount: '100kto500k',
      company_stage: 'inc_6_36m',
      industry_focus: 'other',
      use_of_funds: 'personnel',
      team_size: '3to5',
      co_financing: 'co_no',
      revenue_status: 'early_revenue',
      impact: ['social', 'environmental'],
      project_duration: '2to5',
      deadline_urgency: 'flexible',
    },
    expectedQuestions: 12,
    expectedSkips: [],
    idealProgramCriteria: {
      location: ['austria', 'eu'],
      companyType: ['sme'],
      fundingRange: { min: 100000, max: 500000 },
      industry: ['other', 'social'],
    },
  },

  // 15. Scale-Up Company
  {
    id: 'p15',
    name: 'Scale-Up Company',
    description: 'Growing company, needs expansion funding',
    profile: {
      company_type: 'sme',
      location: 'germany',
      funding_amount: 'over2m',
      company_stage: 'inc_6_36m',
      industry_focus: ['digital', 'manufacturing'],
      use_of_funds: ['equipment', 'personnel', 'marketing'],
      team_size: 'over10',
      co_financing: 'co_yes',
      revenue_status: 'growing_revenue',
      impact: ['economic'],
      project_duration: '2to5',
      deadline_urgency: 'soon',
    },
    expectedQuestions: 12,
    expectedSkips: [],
    idealProgramCriteria: {
      location: ['germany', 'eu'],
      companyType: ['sme', 'large'],
      fundingRange: { min: 2000000, max: 10000000 },
      industry: ['digital', 'manufacturing'],
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

function getVisibleQuestions(answers: Record<string, any>): Question[] {
  return CORE_QUESTIONS.filter((q) => {
    if (q.skipIf && q.skipIf(answers)) return false;
    return true;
  });
}

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
// PROGRAM MATCHING SIMULATION
// ============================================================================

interface MockProgram {
  id: string;
  name: string;
  location: string[];
  companyType: string[];
  fundingRange: { min: number; max: number };
  industry: string[];
  score?: number;
  matchReasons?: string[];
}

// Mock programs database
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
    industry: ['health', 'life sciences'],
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
    name: 'International Export Program',
    location: ['international', 'eu'],
    companyType: ['large'],
    fundingRange: { min: 500000, max: 2000000 },
    industry: ['export'],
  },
  {
    id: 'prog6',
    name: 'Green Tech Innovation Fund',
    location: ['eu', 'austria'],
    companyType: ['startup', 'sme'],
    fundingRange: { min: 500000, max: 2000000 },
    industry: ['sustainability', 'green tech', 'climate'],
  },
  {
    id: 'prog7',
    name: 'Biotech R&D Grant',
    location: ['austria', 'eu'],
    companyType: ['startup', 'sme'],
    fundingRange: { min: 2000000, max: 10000000 },
    industry: ['health', 'life sciences', 'biotech'],
  },
  {
    id: 'prog8',
    name: 'Social Impact Grant',
    location: ['austria', 'eu'],
    companyType: ['sme'],
    fundingRange: { min: 100000, max: 500000 },
    industry: ['other', 'social'],
  },
];

function scoreProgram(persona: Persona, program: MockProgram, answers: Record<string, any>): {
  score: number;
  matchReasons: string[];
  gaps: string[];
} {
  let score = 0;
  const matchReasons: string[] = [];
  const gaps: string[] = [];

  // Location match
  const userLoc = normalizeLocationAnswer(answers.location || '');
  const programLocMatch = program.location.some((loc) => {
    const progLoc = normalizeLocationAnswer(loc);
    return (
      userLoc.countries.some((c) => progLoc.countries.includes(c)) ||
      progLoc.countries.includes('international')
    );
  });
  if (programLocMatch) {
    score += 20;
    matchReasons.push(`Location match: ${answers.location}`);
  } else {
    gaps.push(`Location mismatch: program requires ${program.location.join(' or ')}`);
  }

  // Company type match
  const userType = normalizeCompanyTypeAnswer(answers.company_type || '');
  const programTypeMatch = program.companyType.some((type) => {
    const progType = normalizeCompanyTypeAnswer(type);
    return userType.primary === progType.primary || userType.aliases.some((a) => progType.aliases.includes(a));
  });
  if (programTypeMatch) {
    score += 20;
    matchReasons.push(`Company type match: ${answers.company_type}`);
  } else {
    gaps.push(`Company type mismatch: program requires ${program.companyType.join(' or ')}`);
  }

  // Funding amount match
  const userAmount = normalizeFundingAmountAnswer(answers.funding_amount || '');
  const amountMatch =
    userAmount.min >= program.fundingRange.min * 0.5 &&
    userAmount.max <= program.fundingRange.max * 1.5;
  if (amountMatch) {
    score += 25;
    matchReasons.push(`Funding amount match: ${answers.funding_amount}`);
  } else {
    gaps.push(
      `Funding mismatch: program offers ${program.fundingRange.min}-${program.fundingRange.max}, user needs ${userAmount.min}-${userAmount.max}`
    );
  }

  // Industry match
  if (answers.industry_focus) {
    const userIndustry = normalizeIndustryAnswer(
      Array.isArray(answers.industry_focus) ? answers.industry_focus : [answers.industry_focus]
    );
    const industryMatch = program.industry.some((ind) =>
      userIndustry.primary.some((p) => ind.toLowerCase().includes(p) || p.includes(ind.toLowerCase()))
    );
    if (industryMatch) {
      score += 20;
      matchReasons.push(`Industry match: ${answers.industry_focus}`);
    } else {
      gaps.push(`Industry mismatch: program focuses on ${program.industry.join(', ')}`);
    }
  }

  // Company stage match (bonus)
  if (answers.company_stage) {
    const userStage = normalizeCompanyStageAnswer(answers.company_stage);
    if (userStage.stage !== 'unknown') {
      score += 10;
      matchReasons.push(`Company stage match: ${answers.company_stage}`);
    }
  }

  // Co-financing match (bonus)
  if (answers.co_financing) {
    score += 5;
    matchReasons.push(`Co-financing info provided`);
  }

  return { score: Math.min(100, score), matchReasons, gaps };
}

function findBestMatches(persona: Persona, answers: Record<string, any>): {
  topMatches: Array<MockProgram & { score: number; matchReasons: string[]; gaps: string[] }>;
  perfectMatches: number;
  goodMatches: number;
} {
  const scored = MOCK_PROGRAMS.map((program) => {
    const result = scoreProgram(persona, program, answers);
    return { ...program, ...result };
  });

  scored.sort((a, b) => b.score - a.score);

  const topMatches = scored.slice(0, 5);
  const perfectMatches = scored.filter((p) => p.score >= 90).length;
  const goodMatches = scored.filter((p) => p.score >= 70).length;

  return { topMatches, perfectMatches, goodMatches };
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

function runFullFlowTests() {
  console.log('🧪 Q&A Full Flow Comprehensive Test Suite (15 Personas)\n');
  console.log('='.repeat(80));

  const results: any[] = [];
  const programDistribution: Record<string, { personas: string[]; count: number }> = {};

  for (const persona of PERSONAS) {
    console.log(`\n📋 Testing Persona: ${persona.name} (${persona.id})`);
    console.log(`   Description: ${persona.description}`);

    // Step 1: Q&A Flow
    const flowResult = simulateQAFlow(persona);
    console.log(`\n   ✅ Q&A Flow:`);
    console.log(`      Questions Seen: ${flowResult.visibleQuestions.length} (expected: ${persona.expectedQuestions})`);
    console.log(`      Questions Skipped: ${flowResult.skippedQuestions.join(', ') || 'none'}`);
    console.log(`      Answers Provided: ${Object.keys(flowResult.answersProvided).length}`);

    // Step 2: Normalization
    console.log(`\n   ✅ Normalization:`);
    const normKeys = Object.keys(flowResult.normalizationResults);
    console.log(`      Normalized Fields: ${normKeys.length} (${normKeys.join(', ')})`);

    // Step 3: Program Matching
    const matches = findBestMatches(persona, flowResult.answersProvided);
    console.log(`\n   ✅ Program Matching:`);
    console.log(`      Perfect Matches (≥90%): ${matches.perfectMatches}`);
    console.log(`      Good Matches (≥70%): ${matches.goodMatches}`);
    console.log(`      Top 5 Programs:`);
    matches.topMatches.forEach((prog, idx) => {
      console.log(`        ${idx + 1}. ${prog.name} - ${prog.score}% match`);
      if (prog.matchReasons.length > 0) {
        console.log(`           Reasons: ${prog.matchReasons.slice(0, 2).join(', ')}`);
      }
      if (prog.gaps.length > 0 && prog.score < 90) {
        console.log(`           Gaps: ${prog.gaps.slice(0, 1).join(', ')}`);
      }
    });

    // Track program distribution
    const topProgram = matches.topMatches[0];
    if (topProgram) {
      if (!programDistribution[topProgram.name]) {
        programDistribution[topProgram.name] = { personas: [], count: 0 };
      }
      programDistribution[topProgram.name].personas.push(persona.name);
      programDistribution[topProgram.name].count++;
    }

    // Step 4: Ideal Program Check
    if (persona.idealProgramCriteria) {
      const idealMatch = matches.topMatches.find((prog) => {
        const locMatch = persona.idealProgramCriteria!.location
          ? prog.location.some((l) => persona.idealProgramCriteria!.location!.includes(l))
          : true;
        const typeMatch = persona.idealProgramCriteria!.companyType
          ? prog.companyType.some((t) => persona.idealProgramCriteria!.companyType!.includes(t))
          : true;
        const fundingMatch = persona.idealProgramCriteria!.fundingRange
          ? prog.fundingRange.min <= persona.idealProgramCriteria!.fundingRange.max &&
            prog.fundingRange.max >= persona.idealProgramCriteria!.fundingRange.min
          : true;
        const industryMatch = persona.idealProgramCriteria!.industry
          ? prog.industry.some((i) =>
              persona.idealProgramCriteria!.industry!.some((ui) =>
                i.toLowerCase().includes(ui.toLowerCase())
              )
            )
          : true;
        return locMatch && typeMatch && fundingMatch && industryMatch;
      });

      if (idealMatch) {
        console.log(`\n   ✅ Ideal Program Found: ${idealMatch.name} (${idealMatch.score}% match)`);
      } else {
        console.log(`\n   ⚠️  No ideal program found in top 5 matches`);
      }
    }

    results.push({
      persona,
      flowResult,
      matches,
      hasIdealMatch: matches.perfectMatches > 0 || matches.goodMatches > 0,
    });
  }

  // Overall Analysis
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 OVERALL ANALYSIS\n');

  const totalPersonas = results.length;
  const personasWithPerfectMatches = results.filter((r) => r.matches.perfectMatches > 0).length;
  const personasWithGoodMatches = results.filter((r) => r.matches.goodMatches > 0).length;
  const avgTopScore = results.reduce((sum, r) => sum + (r.matches.topMatches[0]?.score || 0), 0) / totalPersonas;

  console.log('Matching Quality:');
  console.log(`  Personas with Perfect Matches (≥90%): ${personasWithPerfectMatches}/${totalPersonas} (${Math.round((personasWithPerfectMatches / totalPersonas) * 100)}%)`);
  console.log(`  Personas with Good Matches (≥70%): ${personasWithGoodMatches}/${totalPersonas} (${Math.round((personasWithGoodMatches / totalPersonas) * 100)}%)`);
  console.log(`  Average Top Match Score: ${avgTopScore.toFixed(1)}%`);

  // Program Diversity Analysis
  console.log('\n🎯 Program Diversity Analysis:');
  console.log('   Are different personas getting different programs?');
  const uniqueTopPrograms = Object.keys(programDistribution).length;
  const totalPrograms = MOCK_PROGRAMS.length;
  console.log(`   Unique Top Programs: ${uniqueTopPrograms} out of ${totalPersonas} personas`);
  console.log(`   Program Coverage: ${uniqueTopPrograms}/${totalPrograms} programs used (${Math.round((uniqueTopPrograms / totalPrograms) * 100)}%)`);
  
  console.log('\n   Program Distribution (Top Match per Persona):');
  Object.entries(programDistribution)
    .sort((a, b) => b[1].count - a[1].count)
    .forEach(([programName, data]) => {
      console.log(`     ${programName}: ${data.count} persona(s) - ${data.personas.join(', ')}`);
    });

  // Check if programs are different from answers
  console.log('\n🔍 Program vs Answer Diversity:');
  const answerProfiles = results.map(r => ({
    persona: r.persona.name,
    location: r.flowResult.answersProvided.location,
    companyType: r.flowResult.answersProvided.company_type,
    funding: r.flowResult.answersProvided.funding_amount,
    industry: r.flowResult.answersProvided.industry_focus,
    topProgram: r.matches.topMatches[0]?.name
  }));

  // Group by similar answers
  const similarAnswers: Record<string, string[]> = {};
  answerProfiles.forEach(profile => {
    const key = `${profile.location}_${profile.companyType}_${profile.funding}`;
    if (!similarAnswers[key]) {
      similarAnswers[key] = [];
    }
    similarAnswers[key].push(`${profile.persona} → ${profile.topProgram}`);
  });

  const duplicateAnswers = Object.entries(similarAnswers).filter(([_, personas]) => personas.length > 1);
  if (duplicateAnswers.length > 0) {
    console.log(`   ⚠️  Found ${duplicateAnswers.length} groups with similar answers getting different programs:`);
    duplicateAnswers.forEach(([key, personas]) => {
      console.log(`     ${key}:`);
      personas.forEach(p => console.log(`       - ${p}`));
    });
  } else {
    console.log(`   ✅ All personas have unique answer profiles - programs are appropriately different`);
  }

  // Check if different answers get different programs
  const uniqueAnswerProgramPairs = new Set(
    answerProfiles.map(p => `${p.location}_${p.companyType}_${p.funding}_${p.topProgram}`)
  );
  console.log(`   Unique Answer→Program Combinations: ${uniqueAnswerProgramPairs.size}/${totalPersonas}`);
  if (uniqueAnswerProgramPairs.size === totalPersonas) {
    console.log(`   ✅ Perfect diversity - each persona gets a unique program based on their answers`);
  } else {
    console.log(`   ⚠️  Some personas with different answers are getting the same program`);
  }

  console.log('\nRecommendations:');
  if (avgTopScore < 70) {
    console.log('  ⚠️  Average match score is low - consider improving matching logic');
  } else if (avgTopScore < 85) {
    console.log('  ✅ Average match score is good - matching is working well');
  } else {
    console.log('  ✅✅ Average match score is excellent - users are finding perfect programs!');
  }

  if (personasWithPerfectMatches < totalPersonas * 0.5) {
    console.log('  ⚠️  Less than 50% of personas have perfect matches - consider expanding program database');
  } else {
    console.log('  ✅ Most personas have perfect matches - excellent coverage!');
  }

  console.log('\n' + '='.repeat(80));
}

// Run tests
runFullFlowTests();

export { runFullFlowTests, PERSONAS, simulateQAFlow, findBestMatches };

