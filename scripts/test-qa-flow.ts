/**
 * Comprehensive Q&A Flow Test Suite
 * Tests 10 diverse personas through the Q&A flow
 * Analyzes: question order, depth, normalization, ranking
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
// EXTENDED PERSONAS (10 Diverse Profiles)
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
  expectedQuestions: number; // How many questions should they see
  expectedSkips: string[]; // Which questions should be skipped
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
    expectedQuestions: 12,
    expectedSkips: ['revenue_status'], // Pre-revenue stage
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
    expectedSkips: ['use_of_funds', 'team_size', 'revenue_status'], // Research orgs
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
    expectedQuestions: 11,
    expectedSkips: ['co_financing', 'revenue_status'], // Under 100k, pre-company
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
    expectedSkips: ['co_financing', 'revenue_status'], // Under 100k, idea stage
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
  },

  // 8. Non-Profit Organization
  {
    id: 'p8',
    name: 'Non-Profit Organization',
    description: 'Social impact organization seeking grant funding',
    profile: {
      company_type: 'sme', // Closest match
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
    expectedSkips: ['revenue_status'], // Early stage
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
    expectedSkips: ['use_of_funds', 'team_size', 'revenue_status', 'deadline_urgency'], // Research org, long project
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
  { id: 'funding_amount', label: 'How much funding do you need?', required: false, priority: 3 },
  { id: 'company_stage', label: 'What stage is your company at?', required: false, priority: 4 },
  { id: 'industry_focus', label: 'What industry are you in?', required: false, priority: 5 },
  {
    id: 'use_of_funds',
    label: 'How will you use the funds?',
    required: false,
    priority: 6,
    skipIf: (answers: Record<string, any>) => answers.company_type === 'research',
  },
  {
    id: 'team_size',
    label: 'How many people are in your team?',
    required: false,
    priority: 7,
    skipIf: (answers: Record<string, any>) => answers.company_type === 'research',
  },
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
  questionOrder: number[];
  answersProvided: Record<string, any>;
  normalizationResults: any;
} {
  const answers: Record<string, any> = {};
  const visibleQuestions: string[] = [];
  const skippedQuestions: string[] = [];
  const questionOrder: number[] = [];

  // Simulate answering questions in order
  for (const question of CORE_QUESTIONS) {
    const shouldSkip = question.skipIf && question.skipIf(answers);
    
    if (shouldSkip) {
      skippedQuestions.push(question.id);
    } else {
      visibleQuestions.push(question.id);
      questionOrder.push(question.priority);
      
      // Add answer if provided in persona profile
      if (persona.profile[question.id as keyof typeof persona.profile]) {
        answers[question.id] = persona.profile[question.id as keyof typeof persona.profile];
      }
    }
  }

  // Test normalization
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
    questionOrder,
    answersProvided: answers,
    normalizationResults,
  };
}

// ============================================================================
// ANALYSIS FUNCTIONS
// ============================================================================

function analyzeQuestionOrder(): {
  currentOrder: string[];
  recommendations: string[];
  issues: string[];
} {
  const currentOrder = CORE_QUESTIONS.map((q) => q.id);
  
  const recommendations: string[] = [];
  const issues: string[] = [];

  // Check if required questions come first
  const requiredQuestions = CORE_QUESTIONS.filter((q) => q.required);
  const optionalQuestions = CORE_QUESTIONS.filter((q) => !q.required);
  
  const firstRequiredIndex = CORE_QUESTIONS.findIndex((q) => q.required);
  const lastOptionalIndex = CORE_QUESTIONS.map((q) => q.required).lastIndexOf(false);
  
  if (firstRequiredIndex > 0) {
    issues.push('Required questions should come first');
  }
  
  // Check question depth (how many questions total)
  if (CORE_QUESTIONS.length > 12) {
    issues.push(`Too many questions (${CORE_QUESTIONS.length}). Consider reducing to 8-10 core questions.`);
  } else if (CORE_QUESTIONS.length < 8) {
    issues.push(`Too few questions (${CORE_QUESTIONS.length}). May not capture enough information.`);
  }

  // Check question grouping
  const financialQuestions = ['funding_amount', 'co_financing', 'revenue_status'];
  const companyQuestions = ['company_type', 'company_stage', 'team_size'];
  const projectQuestions = ['industry_focus', 'use_of_funds', 'impact', 'project_duration'];
  
  recommendations.push('Group related questions together: Company → Financial → Project → Timeline');
  
  return {
    currentOrder,
    recommendations,
    issues,
  };
}

function analyzeQuestionDepth(persona: Persona, flowResult: any): {
  questionsSeen: number;
  questionsAnswered: number;
  completionRate: number;
  depthScore: number;
} {
  const questionsSeen = flowResult.visibleQuestions.length;
  const questionsAnswered = Object.keys(flowResult.answersProvided).length;
  const completionRate = questionsSeen > 0 ? (questionsAnswered / questionsSeen) * 100 : 0;
  
  // Depth score: higher = more information captured
  // Base score: 1 point per answered question
  // Bonus: required questions answered, all categories covered
  let depthScore = questionsAnswered;
  if (flowResult.answersProvided.company_type) depthScore += 2; // Required
  if (flowResult.answersProvided.location) depthScore += 2; // Required
  if (flowResult.answersProvided.funding_amount) depthScore += 1.5; // Important
  if (flowResult.answersProvided.company_stage) depthScore += 1;
  if (flowResult.answersProvided.industry_focus) depthScore += 1;
  
  return {
    questionsSeen,
    questionsAnswered,
    completionRate,
    depthScore,
  };
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

function runTests() {
  console.log('🧪 Q&A Flow Comprehensive Test Suite\n');
  console.log('=' .repeat(80));
  
  // Test each persona
  const results: any[] = [];
  
  for (const persona of PERSONAS) {
    console.log(`\n📋 Testing Persona: ${persona.name} (${persona.id})`);
    console.log(`   Description: ${persona.description}`);
    
    const flowResult = simulateQAFlow(persona);
    const depthAnalysis = analyzeQuestionDepth(persona, flowResult);
    
    // Check if expectations match
    const questionsMatch = flowResult.visibleQuestions.length === persona.expectedQuestions;
    const skipsMatch = persona.expectedSkips.every((skip) =>
      flowResult.skippedQuestions.includes(skip)
    );
    
    console.log(`\n   Questions Seen: ${flowResult.visibleQuestions.length} (expected: ${persona.expectedQuestions})`);
    console.log(`   Questions Skipped: ${flowResult.skippedQuestions.join(', ') || 'none'}`);
    console.log(`   Questions Answered: ${depthAnalysis.questionsAnswered}`);
    console.log(`   Completion Rate: ${depthAnalysis.completionRate.toFixed(1)}%`);
    console.log(`   Depth Score: ${depthAnalysis.depthScore.toFixed(1)}`);
    
    if (!questionsMatch) {
      console.log(`   ⚠️  WARNING: Question count mismatch!`);
    }
    if (!skipsMatch) {
      console.log(`   ⚠️  WARNING: Skip logic mismatch!`);
    }
    
    // Show normalization results
    if (Object.keys(flowResult.normalizationResults).length > 0) {
      console.log(`\n   Normalization Results:`);
      Object.entries(flowResult.normalizationResults).forEach(([key, value]) => {
        console.log(`     ${key}:`, JSON.stringify(value, null, 2).split('\n').join('\n     '));
      });
    }
    
    results.push({
      persona,
      flowResult,
      depthAnalysis,
      questionsMatch,
      skipsMatch,
    });
  }
  
  // Overall analysis
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 OVERALL ANALYSIS\n');
  
  const orderAnalysis = analyzeQuestionOrder();
  console.log('Question Order Analysis:');
  console.log(`  Current Order: ${orderAnalysis.currentOrder.join(' → ')}`);
  if (orderAnalysis.issues.length > 0) {
    console.log(`  ⚠️  Issues:`);
    orderAnalysis.issues.forEach((issue) => console.log(`    - ${issue}`));
  }
  if (orderAnalysis.recommendations.length > 0) {
    console.log(`  💡 Recommendations:`);
    orderAnalysis.recommendations.forEach((rec) => console.log(`    - ${rec}`));
  }
  
  // Average metrics
  const avgQuestionsSeen = results.reduce((sum, r) => sum + r.depthAnalysis.questionsSeen, 0) / results.length;
  const avgCompletionRate = results.reduce((sum, r) => sum + r.depthAnalysis.completionRate, 0) / results.length;
  const avgDepthScore = results.reduce((sum, r) => sum + r.depthAnalysis.depthScore, 0) / results.length;
  
  console.log(`\nAverage Metrics Across All Personas:`);
  console.log(`  Average Questions Seen: ${avgQuestionsSeen.toFixed(1)}`);
  console.log(`  Average Completion Rate: ${avgCompletionRate.toFixed(1)}%`);
  console.log(`  Average Depth Score: ${avgDepthScore.toFixed(1)}`);
  
  // Normalization necessity check
  console.log(`\n🔍 Normalization Analysis:`);
  const hasVariations = results.some((r) => {
    const norm = r.flowResult.normalizationResults;
    return (
      (norm.location && norm.location.countries.length > 1) ||
      (norm.company_type && norm.company_type.aliases.length > 1) ||
      (norm.industry_focus && norm.industry_focus.keywords.length > 1)
    );
  });
  
  if (hasVariations) {
    console.log(`  ✅ Normalization is NECESSARY - Found variations in answers that need normalization`);
    console.log(`     Examples: Multiple location aliases, company type variations, industry keywords`);
  } else {
    console.log(`  ⚠️  Normalization may not be necessary - Limited variations found`);
  }
  
  // Question depth recommendations
  console.log(`\n💡 Recommendations:`);
  if (avgQuestionsSeen > 10) {
    console.log(`  - Consider reducing question count (currently ${avgQuestionsSeen.toFixed(1)} average)`);
    console.log(`  - Focus on most impactful questions first`);
  }
  if (avgCompletionRate < 80) {
    console.log(`  - Low completion rate (${avgCompletionRate.toFixed(1)}%) - consider making more questions optional`);
  }
  if (orderAnalysis.currentOrder.length > 12) {
    console.log(`  - Too many questions - consider progressive disclosure or grouping`);
  }
  
  console.log('\n' + '='.repeat(80));
}

// Run tests
runTests();

export { runTests, PERSONAS, simulateQAFlow };

