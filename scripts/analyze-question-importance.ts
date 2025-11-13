/**
 * Analyze Question Importance and Scoring Distribution
 * Determines which questions are most valuable for matching
 */

// Import persona data
const DIVERSE_PERSONAS = [
  { id: 'p1', profile: { company_type: 'startup', location: 'austria', funding_amount: '100kto500k', company_stage: 'inc_lt_6m', industry_focus: 'digital', use_of_funds: 'rd', team_size: '3to5', co_financing: 'co_no', impact: 'economic', project_duration: 'under2', deadline_urgency: 'soon' } },
  { id: 'p2', profile: { company_type: 'sme', location: 'germany', funding_amount: 'over2m', company_stage: 'inc_gt_36m', industry_focus: 'manufacturing', use_of_funds: ['equipment', 'personnel'], team_size: 'over10', co_financing: 'co_yes', revenue_status: 'growing_revenue', impact: ['economic', 'environmental'], project_duration: '2to5', deadline_urgency: 'flexible' } },
  { id: 'p3', profile: { company_type: 'research', location: 'eu', funding_amount: '500kto2m', company_stage: 'research_org', industry_focus: 'health', impact: ['social', 'environmental'], project_duration: '5to10' } },
  { id: 'p4', profile: { company_type: 'large', location: 'international', funding_amount: '500kto2m', company_stage: 'inc_gt_36m', industry_focus: 'export', use_of_funds: ['marketing', 'equipment'], team_size: 'over10', co_financing: 'co_yes', revenue_status: 'growing_revenue', impact: 'economic', project_duration: '2to5', deadline_urgency: 'flexible' } },
  { id: 'p5', profile: { company_type: 'startup', location: 'austria', funding_amount: 'under100k', company_stage: 'idea', industry_focus: 'sustainability', use_of_funds: 'rd', team_size: '1to2', impact: 'environmental', project_duration: 'under2' } },
  { id: 'p6', profile: { company_type: 'startup', location: 'austria', funding_amount: 'under100k', company_stage: 'pre_company', industry_focus: 'digital', use_of_funds: 'rd', team_size: '1to2', impact: 'economic', project_duration: 'under2' } },
  { id: 'p7', profile: { company_type: 'startup', location: 'eu', funding_amount: '500kto2m', company_stage: 'inc_6_36m', industry_focus: ['digital', 'sustainability'], use_of_funds: ['marketing', 'personnel'], team_size: '6to10', co_financing: 'co_partial', revenue_status: 'early_revenue', impact: ['economic', 'environmental'], project_duration: '2to5', deadline_urgency: 'soon' } },
  { id: 'p8', profile: { company_type: 'sme', location: 'austria', funding_amount: 'under100k', company_stage: 'inc_6_36m', industry_focus: 'other', use_of_funds: 'personnel', team_size: '1to2', impact: 'social', project_duration: 'under2', deadline_urgency: 'urgent' } },
  { id: 'p9', profile: { company_type: 'large', location: 'germany', funding_amount: 'over2m', company_stage: 'inc_gt_36m', industry_focus: 'manufacturing', use_of_funds: ['equipment', 'personnel', 'marketing'], team_size: 'over10', co_financing: 'co_yes', revenue_status: 'growing_revenue', impact: 'economic', project_duration: '5to10', deadline_urgency: 'flexible' } },
  { id: 'p10', profile: { company_type: 'startup', location: 'eu', funding_amount: '500kto2m', company_stage: 'inc_6_36m', industry_focus: 'sustainability', use_of_funds: 'rd', team_size: '6to10', co_financing: 'co_partial', impact: 'environmental', project_duration: '2to5', deadline_urgency: 'soon' } },
  { id: 'p11', profile: { company_type: 'startup', location: 'austria', funding_amount: 'over2m', company_stage: 'inc_6_36m', industry_focus: 'health', use_of_funds: 'rd', team_size: '6to10', co_financing: 'co_yes', impact: ['social', 'economic'], project_duration: '2to5', deadline_urgency: 'flexible' } },
  { id: 'p12', profile: { company_type: 'startup', location: 'eu', funding_amount: '500kto2m', company_stage: 'inc_6_36m', industry_focus: ['digital', 'sustainability', 'health'], use_of_funds: ['rd', 'marketing'], team_size: '6to10', co_financing: 'co_partial', revenue_status: 'early_revenue', impact: ['economic', 'environmental', 'social'], project_duration: '2to5', deadline_urgency: 'soon' } },
  { id: 'p13', profile: { company_type: 'startup', location: 'austria', funding_amount: '100kto500k', company_stage: 'inc_lt_6m', industry_focus: 'digital', use_of_funds: 'rd', team_size: '3to5', co_financing: 'co_no', impact: 'economic', project_duration: 'under2', deadline_urgency: 'urgent' } },
  { id: 'p14', profile: { company_type: 'sme', location: 'germany', funding_amount: '500kto2m', company_stage: 'inc_6_36m', industry_focus: 'manufacturing', use_of_funds: ['equipment', 'personnel'], team_size: '6to10', co_financing: 'co_partial', revenue_status: 'early_revenue', impact: 'economic', project_duration: '2to5', deadline_urgency: 'soon' } },
  { id: 'p15', profile: { company_type: 'large', location: 'eu', funding_amount: 'over2m', company_stage: 'inc_gt_36m', industry_focus: 'export', use_of_funds: ['marketing', 'equipment'], team_size: 'over10', co_financing: 'co_yes', revenue_status: 'growing_revenue', impact: 'economic', project_duration: '2to5', deadline_urgency: 'flexible' } },
  { id: 'p16', profile: { company_type: 'startup', location: 'austria', funding_amount: '100kto500k', company_stage: 'inc_lt_6m', industry_focus: 'digital', use_of_funds: 'rd', team_size: '3to5', co_financing: 'co_no', impact: 'economic', project_duration: 'under2', deadline_urgency: 'soon' } },
  { id: 'p17', profile: { company_type: 'sme', location: 'germany', funding_amount: '500kto2m', company_stage: 'inc_6_36m', industry_focus: 'manufacturing', use_of_funds: ['marketing', 'personnel'], team_size: '6to10', co_financing: 'co_partial', revenue_status: 'early_revenue', impact: 'economic', project_duration: '2to5', deadline_urgency: 'soon' } },
  { id: 'p18', profile: { company_type: 'large', location: 'eu', funding_amount: 'over2m', company_stage: 'inc_gt_36m', industry_focus: 'export', use_of_funds: ['equipment', 'marketing'], team_size: 'over10', co_financing: 'co_yes', revenue_status: 'growing_revenue', impact: 'economic', project_duration: '5to10', deadline_urgency: 'flexible' } },
  { id: 'p19', profile: { company_type: 'sme', location: 'austria', funding_amount: '100kto500k', company_stage: 'inc_gt_36m', industry_focus: 'other', use_of_funds: 'personnel', team_size: '3to5', co_financing: 'co_no', revenue_status: 'early_revenue', impact: ['social', 'environmental'], project_duration: '2to5', deadline_urgency: 'flexible' } },
  { id: 'p20', profile: { company_type: 'startup', location: 'eu', funding_amount: '500kto2m', company_stage: 'inc_6_36m', industry_focus: 'sustainability', use_of_funds: 'rd', team_size: '6to10', co_financing: 'co_partial', impact: 'environmental', project_duration: '2to5', deadline_urgency: 'soon' } },
];

interface QuestionStats {
  id: string;
  label: string;
  required: boolean;
  priority: number;
  timesAsked: number;
  timesSkipped: number;
  coverage: number; // % of personas who see this question
  isHardBlocker: boolean; // Can this disqualify you?
  estimatedProgramCoverage: number; // % of programs that have this requirement
  recommendedWeight: number;
  recommendedRequired: boolean;
}

const QUESTION_ANALYSIS: QuestionStats[] = [
  {
    id: 'company_type',
    label: 'What type of company are you?',
    required: true,
    priority: 1,
    timesAsked: 0,
    timesSkipped: 0,
    coverage: 0,
    isHardBlocker: true,
    estimatedProgramCoverage: 85, // 85% of programs have company type requirements
    recommendedWeight: 25,
    recommendedRequired: true,
  },
  {
    id: 'location',
    label: 'Where is your company based?',
    required: true,
    priority: 2,
    timesAsked: 0,
    timesSkipped: 0,
    coverage: 0,
    isHardBlocker: true,
    estimatedProgramCoverage: 90, // 90% of programs have location requirements
    recommendedWeight: 25,
    recommendedRequired: true,
  },
  {
    id: 'company_stage',
    label: 'What stage is your company at?',
    required: false,
    priority: 3,
    timesAsked: 0,
    timesSkipped: 0,
    coverage: 0,
    isHardBlocker: false,
    estimatedProgramCoverage: 35, // 35% of programs have stage requirements
    recommendedWeight: 8,
    recommendedRequired: false,
  },
  {
    id: 'team_size',
    label: 'How many people are in your team?',
    required: false,
    priority: 4,
    timesAsked: 0,
    timesSkipped: 0,
    coverage: 0,
    isHardBlocker: false,
    estimatedProgramCoverage: 12, // 12% of programs have team size requirements
    recommendedWeight: 2,
    recommendedRequired: false,
  },
  {
    id: 'industry_focus',
    label: 'What industry are you in?',
    required: false,
    priority: 5,
    timesAsked: 0,
    timesSkipped: 0,
    coverage: 0,
    isHardBlocker: false,
    estimatedProgramCoverage: 45, // 45% of programs have industry focus
    recommendedWeight: 15,
    recommendedRequired: false,
  },
  {
    id: 'use_of_funds',
    label: 'How will you use the funds?',
    required: false,
    priority: 6,
    timesAsked: 0,
    timesSkipped: 0,
    coverage: 0,
    isHardBlocker: false,
    estimatedProgramCoverage: 18, // 18% of programs restrict fund usage
    recommendedWeight: 4,
    recommendedRequired: false,
  },
  {
    id: 'funding_amount',
    label: 'How much funding do you need?',
    required: false,
    priority: 7,
    timesAsked: 0,
    timesSkipped: 0,
    coverage: 0,
    isHardBlocker: false,
    estimatedProgramCoverage: 70, // 70% of programs have funding ranges
    recommendedWeight: 20,
    recommendedRequired: true, // Should be required!
  },
  {
    id: 'co_financing',
    label: 'Can you provide co-financing?',
    required: false,
    priority: 8,
    timesAsked: 0,
    timesSkipped: 0,
    coverage: 0,
    isHardBlocker: true, // When required, it's a hard blocker
    estimatedProgramCoverage: 28, // 28% of programs require co-financing
    recommendedWeight: 5,
    recommendedRequired: false,
  },
  {
    id: 'revenue_status',
    label: 'What is your current revenue status?',
    required: false,
    priority: 9,
    timesAsked: 0,
    timesSkipped: 0,
    coverage: 0,
    isHardBlocker: false,
    estimatedProgramCoverage: 10, // 10% of programs have revenue requirements
    recommendedWeight: 2,
    recommendedRequired: false,
  },
  {
    id: 'impact',
    label: 'What impact does your project have?',
    required: false,
    priority: 10,
    timesAsked: 0,
    timesSkipped: 0,
    coverage: 0,
    isHardBlocker: false,
    estimatedProgramCoverage: 15, // 15% of programs focus on impact
    recommendedWeight: 3,
    recommendedRequired: false,
  },
  {
    id: 'project_duration',
    label: 'How long is your project?',
    required: false,
    priority: 11,
    timesAsked: 0,
    timesSkipped: 0,
    coverage: 0,
    isHardBlocker: false,
    estimatedProgramCoverage: 5, // 5% of programs have duration requirements
    recommendedWeight: 1,
    recommendedRequired: false,
  },
  {
    id: 'deadline_urgency',
    label: 'When do you need funding by?',
    required: false,
    priority: 12,
    timesAsked: 0,
    timesSkipped: 0,
    coverage: 0,
    isHardBlocker: false,
    estimatedProgramCoverage: 0, // 0% - this is user preference, not program requirement
    recommendedWeight: 0, // Don't score this, use for filtering only
    recommendedRequired: false,
  },
];

// Simulate Q&A flow to get actual coverage
function analyzeQuestionCoverage() {
  const CORE_QUESTIONS = [
    { id: 'company_type', required: true, priority: 1 },
    { id: 'location', required: true, priority: 2 },
    { id: 'company_stage', required: false, priority: 3 },
    {
      id: 'team_size',
      required: false,
      priority: 4,
      skipIf: (answers: Record<string, any>) => answers.company_type === 'research',
    },
    { id: 'industry_focus', required: false, priority: 5 },
    {
      id: 'use_of_funds',
      required: false,
      priority: 6,
      skipIf: (answers: Record<string, any>) => answers.company_type === 'research',
    },
    { id: 'funding_amount', required: false, priority: 7 },
    {
      id: 'co_financing',
      required: false,
      priority: 8,
      skipIf: (answers: Record<string, any>) => answers.funding_amount === 'under100k',
    },
    {
      id: 'revenue_status',
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
    { id: 'impact', required: false, priority: 10 },
    { id: 'project_duration', required: false, priority: 11 },
    {
      id: 'deadline_urgency',
      required: false,
      priority: 12,
      skipIf: (answers: Record<string, any>) => answers.project_duration === 'over10',
    },
  ];

  for (const persona of DIVERSE_PERSONAS) {
    const answers: Record<string, any> = {};
    
    for (const question of CORE_QUESTIONS) {
      const shouldSkip = question.skipIf && question.skipIf(answers);
      if (!shouldSkip) {
        const stats = QUESTION_ANALYSIS.find(q => q.id === question.id);
        if (stats) {
          stats.timesAsked++;
          if (persona.profile[question.id as keyof typeof persona.profile]) {
            // Question was answered
          }
        }
      } else {
        const stats = QUESTION_ANALYSIS.find(q => q.id === question.id);
        if (stats) {
          stats.timesSkipped++;
        }
      }
      
      // Add answer to context for skip logic
      if (persona.profile[question.id as keyof typeof persona.profile]) {
        answers[question.id] = persona.profile[question.id as keyof typeof persona.profile];
      }
    }
  }

  // Calculate coverage
  const totalPersonas = DIVERSE_PERSONAS.length;
  for (const stats of QUESTION_ANALYSIS) {
    stats.coverage = (stats.timesAsked / totalPersonas) * 100;
  }
}

function generateRecommendations() {
  console.log('📊 QUESTION IMPORTANCE ANALYSIS\n');
  console.log('='.repeat(80));
  
  // Sort by importance (coverage × program coverage)
  const sorted = [...QUESTION_ANALYSIS].sort((a, b) => {
    const importanceA = a.estimatedProgramCoverage * (a.isHardBlocker ? 2 : 1);
    const importanceB = b.estimatedProgramCoverage * (b.isHardBlocker ? 2 : 1);
    return importanceB - importanceA;
  });

  console.log('\n🎯 TIER 1: ESSENTIAL QUESTIONS (Must Ask)\n');
  const essential = sorted.filter(q => q.estimatedProgramCoverage >= 70 || q.isHardBlocker);
  essential.forEach(q => {
    console.log(`✅ ${q.label}`);
    console.log(`   Coverage: ${q.coverage.toFixed(1)}% of personas see this`);
    console.log(`   Program Coverage: ~${q.estimatedProgramCoverage}% of programs require this`);
    console.log(`   Hard Blocker: ${q.isHardBlocker ? 'YES' : 'NO'}`);
    console.log(`   Current Weight: ${q.recommendedWeight}%`);
    console.log(`   Should Be Required: ${q.recommendedRequired ? 'YES' : 'NO'}`);
    console.log('');
  });

  console.log('\n⚠️  TIER 2: IMPORTANT QUESTIONS (Should Ask)\n');
  const important = sorted.filter(q => 
    q.estimatedProgramCoverage >= 30 && 
    q.estimatedProgramCoverage < 70 && 
    !q.isHardBlocker
  );
  important.forEach(q => {
    console.log(`⚠️  ${q.label}`);
    console.log(`   Coverage: ${q.coverage.toFixed(1)}% of personas see this`);
    console.log(`   Program Coverage: ~${q.estimatedProgramCoverage}% of programs require this`);
    console.log(`   Current Weight: ${q.recommendedWeight}%`);
    console.log('');
  });

  console.log('\n❓ TIER 3: OPTIONAL QUESTIONS (Nice to Have)\n');
  const optional = sorted.filter(q => 
    q.estimatedProgramCoverage >= 10 && 
    q.estimatedProgramCoverage < 30
  );
  optional.forEach(q => {
    console.log(`❓ ${q.label}`);
    console.log(`   Coverage: ${q.coverage.toFixed(1)}% of personas see this`);
    console.log(`   Program Coverage: ~${q.estimatedProgramCoverage}% of programs require this`);
    console.log(`   Current Weight: ${q.recommendedWeight}%`);
    console.log(`   Recommendation: ${q.recommendedWeight <= 2 ? 'Consider removing or reducing' : 'Keep but optional'}`);
    console.log('');
  });

  console.log('\n🗑️  TIER 4: LOW VALUE QUESTIONS (Consider Removing)\n');
  const lowValue = sorted.filter(q => q.estimatedProgramCoverage < 10);
  lowValue.forEach(q => {
    console.log(`🗑️  ${q.label}`);
    console.log(`   Coverage: ${q.coverage.toFixed(1)}% of personas see this`);
    console.log(`   Program Coverage: ~${q.estimatedProgramCoverage}% of programs require this`);
    console.log(`   Current Weight: ${q.recommendedWeight}%`);
    console.log(`   Recommendation: Remove from scoring or use only for filtering`);
    console.log('');
  });

  // Calculate recommended scoring distribution
  console.log('\n📊 RECOMMENDED SCORING DISTRIBUTIONS\n');
  console.log('='.repeat(80));
  
  // Option A: Minimal (5 questions)
  const minimal = essential.slice(0, 3).concat(important.slice(0, 2));
  const minimalTotal = minimal.reduce((sum, q) => sum + q.recommendedWeight, 0);
  console.log('\n🎯 Option A: MINIMAL CORE (5 Questions)');
  console.log('   Fast completion, covers 80% of matching needs\n');
  minimal.forEach(q => {
    const percentage = ((q.recommendedWeight / minimalTotal) * 100).toFixed(1);
    console.log(`   • ${q.label}: ${q.recommendedWeight} points (${percentage}%)`);
  });
  console.log(`   Total: ${minimalTotal} points (normalize to 100%)`);
  console.log(`   Estimated completion time: 2-3 minutes`);

  // Option B: Balanced (7 questions)
  const balanced = essential.concat(important.slice(0, 2));
  const balancedTotal = balanced.reduce((sum, q) => sum + q.recommendedWeight, 0);
  console.log('\n⚖️  Option B: BALANCED CORE (7 Questions) - RECOMMENDED');
  console.log('   Good balance of speed and accuracy, covers 90% of matching needs\n');
  balanced.forEach(q => {
    const percentage = ((q.recommendedWeight / balancedTotal) * 100).toFixed(1);
    console.log(`   • ${q.label}: ${q.recommendedWeight} points (${percentage}%)`);
  });
  console.log(`   Total: ${balancedTotal} points (normalize to 100%)`);
  console.log(`   Estimated completion time: 3-4 minutes`);

  // Option C: Comprehensive (all questions)
  const comprehensive = sorted.filter(q => q.recommendedWeight > 0);
  const comprehensiveTotal = comprehensive.reduce((sum, q) => sum + q.recommendedWeight, 0);
  console.log('\n📚 Option C: COMPREHENSIVE (All Questions)');
  console.log('   Most accurate, but longer completion time\n');
  comprehensive.forEach(q => {
    const percentage = ((q.recommendedWeight / comprehensiveTotal) * 100).toFixed(1);
    console.log(`   • ${q.label}: ${q.recommendedWeight} points (${percentage}%)`);
  });
  console.log(`   Total: ${comprehensiveTotal} points (normalize to 100%)`);
  console.log(`   Estimated completion time: 5-7 minutes`);

  // Summary
  console.log('\n\n💡 RECOMMENDATIONS\n');
  console.log('='.repeat(80));
  console.log('\n1. MAKE FUNDING_AMOUNT REQUIRED');
  console.log('   Currently optional, but 70% of programs have funding ranges');
  console.log('   Users need to know if program covers their needs');
  
  console.log('\n2. REDUCE WEIGHTS FOR LOW-VALUE QUESTIONS');
  console.log('   Team Size: 5% → 2% (only 12% program coverage)');
  console.log('   Revenue Status: 4% → 2% (only 10% program coverage)');
  console.log('   Project Duration: 2% → 1% (only 5% program coverage)');
  console.log('   Deadline Urgency: 2% → 0% (not a program requirement, use for filtering only)');
  
  console.log('\n3. INCREASE WEIGHT FOR INDUSTRY');
  console.log('   Industry Focus: 12% → 15% (45% program coverage, important for matching)');
  
  console.log('\n4. CONSIDER PROGRESSIVE DISCLOSURE');
  console.log('   Phase 1: Ask 3 required questions → Show results');
  console.log('   Phase 2: Ask 4 optional questions → Refine results');
  console.log('   Phase 3: Ask remaining questions → Further refine');
  
  console.log('\n5. VALIDATE WITH REAL PROGRAM DATA');
  console.log('   Current weights are based on estimates');
  console.log('   Should analyze actual program requirements to confirm');
}

// Run analysis
analyzeQuestionCoverage();
generateRecommendations();

