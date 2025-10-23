// Symptom-Based Question Engine - Phase 2 Step 2.1 + Validation Integration
// Generates smart, conditional questions based on funding requirements
// Questions get more specific over time (broad → specific)
// No jargon - symptom-based language
// INTEGRATED: Advanced validation from validationRules.ts

import { Program } from '../types/requirements';

export interface SymptomQuestion {
  id: string;
  symptom: string; // User-friendly question text
  type: 'single-select' | 'multi-select' | 'text' | 'number' | 'boolean';
  options: Array<{
    value: string;
    label: string;
    fundingTypes?: string[]; // Which funding types this answer suggests
    nextQuestions?: string[]; // Which questions to ask next
  }>;
  required: boolean;
  category: 'funding_need' | 'business_stage' | 'innovation_level' | 'team_size' | 'location' | 'specific_requirements';
  phase: 1 | 2 | 3; // 1: Broad, 2: Specific, 3: Refinement
  conditionalLogic?: QuestionCondition[];
  skipConditions?: QuestionCondition[]; // NEW: Conditions to skip this question
  followUpQuestions?: string[]; // NEW: Questions to ask after this one
  
  // NEW: Enhanced properties from dynamicQuestionEngine.ts
  informationValue?: number; // How much information this question provides
  programsAffected?: number; // How many programs this question affects
  decisiveness?: 'HARD' | 'SOFT' | 'UNCERTAIN'; // How decisive this question is
  uxWeight?: number; // UX priority weight
  isCoreQuestion?: boolean; // Whether this is a core question or overlay
  questionNumber?: number; // Order in the question flow
  sourcePrograms?: string[]; // Which programs generated this question
  aiGuidance?: string; // AI guidance text for the user
  validationRules?: {
    min_length?: number;
    max_length?: number;
    min_value?: number;
    max_value?: number;
    pattern?: string;
    lastError?: string;
  };
}

export interface QuestionCondition {
  questionId: string;
  operator: 'equals' | 'contains' | 'not_equals' | 'in' | 'not_in' | 'greater_than' | 'less_than';
  value: any;
  action: 'show' | 'hide' | 'require' | 'optional';
  logic?: 'AND' | 'OR'; // NEW: Support for AND/OR logic
}

export interface QuestionFlow {
  currentQuestion: SymptomQuestion | null;
  nextQuestions: SymptomQuestion[];
  completedQuestions: string[];
  fundingTypes: string[];
  programs: Program[];
}

export interface UserContext {
  sector?: string;
  stage?: string;
  location?: string;
  fundingType?: string;
  teamSize?: string;
  revenue?: string;
  [key: string]: any;
}

// NEW: Interface for question statistics
export interface QuestionStats {
  informationValue: number;
  programsAffected: number;
  decisiveness: 'HARD' | 'SOFT' | 'UNCERTAIN';
  uxWeight: number;
  isCoreQuestion: boolean;
  sourcePrograms: string[];
}

// NEW: Interface for branching rules (from data/questions.ts)
export interface BranchingRule {
  description: string;
  ask_if: string;
  effect: string;
}

// NEW: Interface for program filtering effects
export interface ProgramFilteringEffects {
  hideProductsWithTypes?: string[];
  showAtNational?: boolean;
  boostTags?: string[];
}

// INTEGRATED: Validation Interfaces (from validationRules.ts)
export interface QualityCheck {
  id: string;
  description: string;
  validate: (content: string) => boolean | string; // return true or an error message
}

export interface ValidationRule {
  id: string;
  fields: string[];
  validate: (data: Record<string, any>) => boolean | string;
}

// INTEGRATED: Validation Constants (from validationRules.ts)
export const QUALITY_CHECKS: QualityCheck[] = [
  {
    id: 'word_count_check',
    description: 'Ensure content is within prescribed word count range',
    validate: (content: string) => {
      const wordCount = content.trim().split(/\s+/).length;
      // This would be called with min/max parameters in practice
      return wordCount > 0 ? true : 'Content must have at least one word';
    }
  },
  {
    id: 'problem_solution_completeness',
    description: 'Verify that both problem and solution descriptions are present',
    validate: (content: string) => {
      const hasProblem = /problem|challenge|issue|pain|gap/i.test(content);
      const hasSolution = /solution|approach|method|technology|innovation/i.test(content);
      
      if (!hasProblem) return 'Missing problem statement - clearly define the problem you are solving';
      if (!hasSolution) return 'Missing solution description - explain how you will solve the problem';
      return true;
    }
  },
  {
    id: 'market_data_presence',
    description: 'Validate that market size, growth and customer demographics are included',
    validate: (content: string) => {
      const hasMarketSize = /\d+[\s,]*[billion|million|thousand|€|\$]/i.test(content);
      const hasGrowth = /growth|increase|expand|cagr|rate/i.test(content);
      const hasDemographics = /customer|user|target|segment|demographic/i.test(content);
      
      if (!hasMarketSize) return 'Missing market size data - include specific market size numbers';
      if (!hasGrowth) return 'Missing growth information - include market growth rates or trends';
      if (!hasDemographics) return 'Missing customer demographics - describe your target audience';
      return true;
    }
  },
  {
    id: 'financial_consistency',
    description: 'Ensure budget totals match sum of costs and revenue projections are plausible',
    validate: (content: string) => {
      // This would be more sophisticated in practice, checking actual financial data
      const hasNumbers = /\d+[\s,]*[€|\$]/i.test(content);
      const hasNegative = /-\s*\d+[\s,]*[€|\$]/i.test(content);
      
      if (!hasNumbers) return 'Missing financial data - include budget and revenue information';
      if (hasNegative && !content.includes('loss') && !content.includes('deficit')) {
        return 'Negative numbers found without explanation - justify any negative values';
      }
      return true;
    }
  },
  {
    id: 'trl_justification',
    description: 'Check that TRL stated aligns with evidence provided',
    validate: (content: string) => {
      const hasTRL = /trl\s*[1-9]|technology\s*readiness\s*level/i.test(content);
      const hasEvidence = /prototype|test|trial|validation|proof|evidence|demonstration/i.test(content);
      
      if (hasTRL && !hasEvidence) {
        return 'TRL mentioned without supporting evidence - provide proof of your technology readiness level';
      }
      return true;
    }
  },
  {
    id: 'gdpr_compliance',
    description: 'For sections containing personal data, verify GDPR compliance acknowledgment',
    validate: (content: string) => {
      const hasPersonalData = /personal|individual|customer|user|data|privacy/i.test(content);
      const hasGDPR = /gdpr|data\s*protection|privacy\s*policy|consent|lawful/i.test(content);
      
      if (hasPersonalData && !hasGDPR) {
        return 'Personal data mentioned without GDPR compliance - address data protection requirements';
      }
      return true;
    }
  },
  {
    id: 'austrian_eu_compliance',
    description: 'Check that references to legislation are accurate',
    validate: (content: string) => {
      const hasLegalRefs = /law|regulation|compliance|legal|austrian|eu|european/i.test(content);
      const hasSpecificRefs = /gmbh|gmbh\s*law|state\s*aid|eu\s*taxonomy|horizon\s*europe/i.test(content);
      
      if (hasLegalRefs && !hasSpecificRefs) {
        return 'Legal references too vague - be specific about Austrian/EU regulations';
      }
      return true;
    }
  },
  {
    id: 'impact_metrics',
    description: 'Ensure impact claims are supported by specific metrics',
    validate: (content: string) => {
      const hasImpact = /impact|benefit|effect|contribution|improvement/i.test(content);
      const hasMetrics = /\d+[\s,]*[jobs|emissions|reduction|increase|%]/i.test(content);
      
      if (hasImpact && !hasMetrics) {
        return 'Impact claims without metrics - provide specific, measurable impact indicators';
      }
      return true;
    }
  },
  {
    id: 'competitive_analysis',
    description: 'Verify competitive landscape analysis is included',
    validate: (content: string) => {
      const hasCompetition = /competitor|competition|alternative|rival|market\s*leader/i.test(content);
      const hasDifferentiation = /unique|different|advantage|edge|superior|better/i.test(content);
      
      if (!hasCompetition) return 'Missing competitive analysis - identify and analyze competitors';
      if (!hasDifferentiation) return 'Missing differentiation - explain your competitive advantages';
      return true;
    }
  },
  {
    id: 'team_qualifications',
    description: 'Ensure team members have relevant experience and qualifications',
    validate: (content: string) => {
      const hasTeam = /team|founder|manager|director|expert|specialist/i.test(content);
      const hasExperience = /experience|background|qualification|education|degree|phd|mba/i.test(content);
      
      if (hasTeam && !hasExperience) return 'Team mentioned without qualifications - detail relevant experience and expertise';
      return true;
    }
  }
];

export const VALIDATION_RULES: ValidationRule[] = [
  {
    id: 'executive_summary_completeness',
    fields: ['problem_statement', 'solution_overview', 'target_market', 'funding_request'],
    validate: (data: Record<string, any>) => {
      const missing = [];
      if (!data.problem_statement) missing.push('problem statement');
      if (!data.solution_overview) missing.push('solution overview');
      if (!data.target_market) missing.push('target market');
      if (!data.funding_request) missing.push('funding request');
      
      if (missing.length > 0) {
        return `Missing required fields: ${missing.join(', ')}`;
      }
      return true;
    }
  },
  {
    id: 'financial_consistency_check',
    fields: ['total_budget', 'funding_request', 'co_financing'],
    validate: (data: Record<string, any>) => {
      const totalBudget = parseFloat(data.total_budget) || 0;
      const fundingRequest = parseFloat(data.funding_request) || 0;
      const coFinancing = parseFloat(data.co_financing) || 0;
      
      if (Math.abs(fundingRequest + coFinancing - totalBudget) > 0.01) {
        return 'Funding request and co-financing must equal total budget';
      }
      
      if (fundingRequest > totalBudget) {
        return 'Funding request cannot exceed total budget';
      }
      
      return true;
    }
  },
  {
    id: 'market_size_validation',
    fields: ['market_size', 'growth_rate', 'target_segment'],
    validate: (data: Record<string, any>) => {
      const marketSize = parseFloat(data.market_size) || 0;
      const growthRate = parseFloat(data.growth_rate) || 0;
      
      if (marketSize <= 0) {
        return 'Market size must be greater than zero';
      }
      
      if (growthRate < -100 || growthRate > 1000) {
        return 'Growth rate seems unrealistic (should be between -100% and 1000%)';
      }
      
      if (!data.target_segment) {
        return 'Target market segment must be specified';
      }
      
      return true;
    }
  },
  {
    id: 'team_structure_validation',
    fields: ['founders', 'key_employees', 'advisors'],
    validate: (data: Record<string, any>) => {
      const founders = Array.isArray(data.founders) ? data.founders.length : 0;
      
      if (founders === 0) {
        return 'At least one founder must be specified';
      }
      
      if (founders > 5) {
        return 'Too many founders (typically 1-3 founders)';
      }
      
      return true;
    }
  },
  {
    id: 'timeline_realism_check',
    fields: ['start_date', 'end_date', 'milestones'],
    validate: (data: Record<string, any>) => {
      const startDate = new Date(data.start_date);
      const endDate = new Date(data.end_date);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return 'Invalid start or end date format';
      }
      
      if (endDate <= startDate) {
        return 'End date must be after start date';
      }
      
      const durationMonths = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                           (endDate.getMonth() - startDate.getMonth());
      
      if (durationMonths > 60) {
        return 'Project duration seems too long (typically 12-36 months)';
      }
      
      return true;
    }
  },
  {
    id: 'trl_evidence_validation',
    fields: ['trl_level', 'trl_evidence', 'development_stage'],
    validate: (data: Record<string, any>) => {
      const trlLevel = parseInt(data.trl_level) || 0;
      const hasEvidence = data.trl_evidence && data.trl_evidence.trim().length > 0;
      
      if (trlLevel < 1 || trlLevel > 9) {
        return 'TRL level must be between 1 and 9';
      }
      
      if (trlLevel >= 5 && !hasEvidence) {
        return 'TRL 5+ requires supporting evidence (prototypes, tests, trials)';
      }
      
      return true;
    }
  },
  {
    id: 'job_creation_realism',
    fields: ['job_count', 'job_timeline', 'salary_range'],
    validate: (data: Record<string, any>) => {
      const jobCount = parseInt(data.job_count) || 0;
      const salaryMin = parseFloat(data.salary_range?.split('-')[0]) || 0;
      const salaryMax = parseFloat(data.salary_range?.split('-')[1]) || 0;
      
      if (jobCount <= 0) {
        return 'Job creation count must be greater than zero';
      }
      
      if (jobCount > 100) {
        return 'Job creation count seems unrealistic for startup (typically 5-50 jobs)';
      }
      
      if (salaryMin > 0 && salaryMax > 0 && salaryMin > salaryMax) {
        return 'Minimum salary cannot be greater than maximum salary';
      }
      
      if (salaryMin > 0 && salaryMin < 20000) {
        return 'Salary range seems too low for Austrian market';
      }
      
      return true;
    }
  },
  {
    id: 'consortium_validation',
    fields: ['has_consortium', 'partners', 'agreements'],
    validate: (data: Record<string, any>) => {
      const hasConsortium = data.has_consortium === true || data.has_consortium === 'true';
      const partners = Array.isArray(data.partners) ? data.partners : [];
      
      if (hasConsortium && partners.length === 0) {
        return 'Consortium indicated but no partners specified';
      }
      
      if (hasConsortium && partners.length > 10) {
        return 'Too many consortium partners (typically 2-8 partners)';
      }
      
      return true;
    }
  }
];

export class QuestionEngine {
  private programs: Program[] = [];
  private questions: SymptomQuestion[] = [];
  private context: UserContext = {};
  private overlayQuestions: SymptomQuestion[] = []; // NEW: Program overlay questions
  private questionStats: Map<string, QuestionStats> = new Map(); // NEW: Question statistics
  private branchingRules: BranchingRule[] = []; // NEW: Branching rules from data/questions.ts

  constructor(programs: Program[] = []) {
    this.programs = programs;
    this.initializeQuestions(); // Keep core questions for now
    this.loadBranchingRules(); // NEW: Load branching rules
    // Note: computeOverlayQuestions() will be called separately after construction
  }

  // NEW: Initialize overlay questions after construction
  public async initializeOverlayQuestions(): Promise<void> {
    await this.computeOverlayQuestions();
  }


  private initializeQuestions(): void {
    this.questions = [
      // PHASE 1: BROAD SYMPTOMS (2-3 questions)
      {
        id: 'funding_need',
        symptom: "What's your biggest challenge right now?",
        type: 'single-select',
        options: [
          {
            value: 'need_money_start',
            label: 'I need money to get started',
            fundingTypes: ['grants', 'equity'],
            nextQuestions: ['business_stage', 'innovation_level']
          },
          {
            value: 'need_money_grow',
            label: 'I need money to grow my business',
            fundingTypes: ['loans', 'grants', 'equity'],
            nextQuestions: ['business_stage', 'revenue_level']
          },
          {
            value: 'need_money_research',
            label: 'I need money for research/development',
            fundingTypes: ['grants', 'equity'],
            nextQuestions: ['innovation_level', 'research_focus']
          },
          {
            value: 'need_money_team',
            label: 'I need money to hire people',
            fundingTypes: ['grants', 'loans'],
            nextQuestions: ['team_size', 'business_stage']
          }
        ],
        required: true,
        category: 'funding_need',
        phase: 1
      },
      {
        id: 'business_stage',
        symptom: 'How far along is your business?',
        type: 'single-select',
        options: [
          {
            value: 'just_idea',
            label: 'I just have an idea',
            fundingTypes: ['grants', 'equity'],
            nextQuestions: ['innovation_level']
          },
          {
            value: 'building',
            label: 'I\'m building something',
            fundingTypes: ['grants', 'equity', 'loans'],
            nextQuestions: ['innovation_level', 'team_size']
          },
          {
            value: 'selling',
            label: 'I\'m already selling',
            fundingTypes: ['loans', 'grants', 'equity'],
            nextQuestions: ['revenue_level', 'team_size']
          },
          {
            value: 'growing',
            label: 'I\'m growing fast',
            fundingTypes: ['loans', 'equity'],
            nextQuestions: ['revenue_level', 'expansion_plans']
          }
        ],
        required: true,
        category: 'business_stage',
        phase: 1
      },
      {
        id: 'main_goal',
        symptom: 'What\'s your main goal?',
        type: 'single-select',
        options: [
          {
            value: 'launch_product',
            label: 'Launch my product/service',
            fundingTypes: ['grants', 'equity'],
            nextQuestions: ['innovation_level']
          },
          {
            value: 'expand_market',
            label: 'Expand to new markets',
            fundingTypes: ['loans', 'grants'],
            nextQuestions: ['revenue_level', 'team_size']
          },
          {
            value: 'develop_tech',
            label: 'Develop new technology',
            fundingTypes: ['grants', 'equity'],
            nextQuestions: ['innovation_level', 'research_focus']
          },
          {
            value: 'hire_team',
            label: 'Hire more people',
            fundingTypes: ['grants', 'loans'],
            nextQuestions: ['team_size', 'business_stage']
          }
        ],
        required: true,
        category: 'funding_need',
        phase: 1
      },

      // PHASE 2: SPECIFIC SYMPTOMS (2-3 questions based on Phase 1)
      {
        id: 'innovation_level',
        symptom: 'What kind of innovation are you working on?',
        type: 'single-select',
        options: [
          {
            value: 'digital_tech',
            label: 'Digital technology (AI, software, apps)',
            fundingTypes: ['grants', 'equity'],
            nextQuestions: ['tech_readiness']
          },
          {
            value: 'health_tech',
            label: 'Health technology (medical devices, biotech)',
            fundingTypes: ['grants', 'equity'],
            nextQuestions: ['tech_readiness', 'regulatory_requirements']
          },
          {
            value: 'green_tech',
            label: 'Green technology (clean energy, sustainability)',
            fundingTypes: ['grants', 'equity'],
            nextQuestions: ['tech_readiness', 'environmental_impact']
          },
          {
            value: 'manufacturing',
            label: 'Manufacturing or industrial innovation',
            fundingTypes: ['grants', 'loans'],
            nextQuestions: ['tech_readiness', 'production_scale']
          },
          {
            value: 'other',
            label: 'Something else',
            fundingTypes: ['grants', 'equity', 'loans'],
            nextQuestions: ['tech_readiness']
          }
        ],
        required: false,
        category: 'innovation_level',
        phase: 2,
        conditionalLogic: [
          {
            questionId: 'funding_need',
            operator: 'in',
            value: ['need_money_start', 'need_money_research'],
            action: 'show'
          },
          {
            questionId: 'main_goal',
            operator: 'in',
            value: ['launch_product', 'develop_tech'],
            action: 'show'
          }
        ]
      },
      {
        id: 'revenue_level',
        symptom: 'What\'s your current revenue?',
        type: 'single-select',
        options: [
          {
            value: 'no_revenue',
            label: 'No revenue yet',
            fundingTypes: ['grants', 'equity'],
            nextQuestions: ['team_size']
          },
          {
            value: 'under_100k',
            label: 'Under €100,000 per year',
            fundingTypes: ['grants', 'loans', 'equity'],
            nextQuestions: ['team_size', 'growth_plans']
          },
          {
            value: '100k_1m',
            label: '€100,000 - €1 million per year',
            fundingTypes: ['loans', 'equity', 'grants'],
            nextQuestions: ['team_size', 'expansion_plans']
          },
          {
            value: 'over_1m',
            label: 'Over €1 million per year',
            fundingTypes: ['loans', 'equity'],
            nextQuestions: ['team_size', 'expansion_plans']
          }
        ],
        required: false,
        category: 'business_stage',
        phase: 2,
        conditionalLogic: [
          {
            questionId: 'business_stage',
            operator: 'in',
            value: ['selling', 'growing'],
            action: 'show'
          },
          {
            questionId: 'funding_need',
            operator: 'equals',
            value: 'need_money_grow',
            action: 'show'
          }
        ]
      },
      {
        id: 'team_size',
        symptom: 'How many people are on your team?',
        type: 'single-select',
        options: [
          {
            value: 'solo',
            label: 'Just me',
            fundingTypes: ['grants', 'equity'],
            nextQuestions: ['location']
          },
          {
            value: '2_5',
            label: '2-5 people',
            fundingTypes: ['grants', 'loans', 'equity'],
            nextQuestions: ['location']
          },
          {
            value: '6_20',
            label: '6-20 people',
            fundingTypes: ['loans', 'grants', 'equity'],
            nextQuestions: ['location']
          },
          {
            value: '20_plus',
            label: '20+ people',
            fundingTypes: ['loans', 'equity'],
            nextQuestions: ['location']
          }
        ],
        required: false,
        category: 'team_size',
        phase: 2
      },

      // PHASE 3: REFINEMENT (1-2 questions)
      {
        id: 'location',
        symptom: 'Where are you located?',
        type: 'single-select',
        options: [
          {
            value: 'austria',
            label: 'Austria',
            fundingTypes: ['grants', 'loans', 'equity'],
            nextQuestions: []
          },
          {
            value: 'eu',
            label: 'Other EU country',
            fundingTypes: ['grants', 'loans', 'equity'],
            nextQuestions: []
          },
          {
            value: 'outside_eu',
            label: 'Outside EU',
            fundingTypes: ['equity', 'visa'],
            nextQuestions: []
          }
        ],
        required: true,
        category: 'location',
        phase: 3
      },
      {
        id: 'tech_readiness',
        symptom: 'How advanced is your technology?',
        type: 'single-select',
        options: [
          {
            value: 'early_stage',
            label: 'Early stage - just an idea',
            fundingTypes: ['grants', 'equity'],
            nextQuestions: []
          },
          {
            value: 'prototype',
            label: 'I have a prototype',
            fundingTypes: ['grants', 'equity', 'loans'],
            nextQuestions: []
          },
          {
            value: 'testing',
            label: 'I\'m testing with customers',
            fundingTypes: ['grants', 'loans', 'equity'],
            nextQuestions: []
          },
          {
            value: 'market_ready',
            label: 'Ready for market',
            fundingTypes: ['loans', 'equity'],
            nextQuestions: []
          }
        ],
        required: false,
        category: 'innovation_level',
        phase: 3,
        conditionalLogic: [
          {
            questionId: 'innovation_level',
            operator: 'not_equals',
            value: 'other',
            action: 'show'
          }
        ]
      }
    ];
  }

  // Get the first question to start the flow
  getFirstQuestion(): SymptomQuestion {
    return this.questions.find(q => q.id === 'funding_need')!;
  }

  // Get the next question based on current answers
  getNextQuestion(answers: Record<string, any>): SymptomQuestion | null {
    // Find the last answered question
    const answeredQuestionIds = Object.keys(answers);
    if (answeredQuestionIds.length === 0) {
      return this.getFirstQuestion();
    }

    const lastAnsweredId = answeredQuestionIds[answeredQuestionIds.length - 1];
    const lastAnsweredQuestion = this.questions.find(q => q.id === lastAnsweredId);
    
    if (!lastAnsweredQuestion) {
      return null;
    }

    // Get the answer value
    const answerValue = answers[lastAnsweredId];
    const selectedOption = lastAnsweredQuestion.options.find(opt => opt.value === answerValue);
    
    if (!selectedOption || !selectedOption.nextQuestions) {
      return null;
    }

    // Find the next question based on the answer
    const nextQuestionId = selectedOption.nextQuestions[0];
    const nextQuestion = this.questions.find(q => q.id === nextQuestionId);
    
    if (!nextQuestion) {
      return null;
    }

    // Check skip conditions first
    if (nextQuestion.skipConditions) {
      const shouldSkip = this.evaluateConditionalLogic(nextQuestion.skipConditions, answers);
      if (shouldSkip) {
        return this.getNextQuestion({ ...answers, [nextQuestionId]: 'skipped' });
      }
    }

    // Check conditional logic
    if (nextQuestion.conditionalLogic) {
      const shouldShow = this.evaluateConditionalLogic(nextQuestion.conditionalLogic, answers);
      if (!shouldShow) {
        return this.getNextQuestion({ ...answers, [nextQuestionId]: 'skipped' });
      }
    }

    return nextQuestion;
  }

  // Evaluate conditional logic for showing/hiding questions with AND/OR support
  private evaluateConditionalLogic(conditions: QuestionCondition[], answers: Record<string, any>): boolean {
    if (conditions.length === 0) return true;
    
    let result = false;
    let logicOperator = 'AND'; // Default to AND
    
    for (let i = 0; i < conditions.length; i++) {
      const condition = conditions[i];
      const conditionResult = this.evaluateSingleCondition(condition, answers);
      
      if (i === 0) {
        result = conditionResult;
      } else {
        if (logicOperator === 'AND') {
          result = result && conditionResult;
        } else if (logicOperator === 'OR') {
          result = result || conditionResult;
        }
      }
      
      // Set logic operator for next iteration
      logicOperator = condition.logic || 'AND';
    }
    
    return result;
  }

  // NEW: Evaluate a single condition
  private evaluateSingleCondition(condition: QuestionCondition, answers: Record<string, any>): boolean {
    const answerValue = answers[condition.questionId];
    if (answerValue === undefined) {
      return false;
    }

    switch (condition.operator) {
      case 'equals':
        return answerValue === condition.value;
      case 'not_equals':
        return answerValue !== condition.value;
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(answerValue);
      case 'not_in':
        return Array.isArray(condition.value) && !condition.value.includes(answerValue);
      case 'contains':
        return typeof answerValue === 'string' && answerValue.includes(condition.value);
      case 'greater_than':
        return Number(answerValue) > Number(condition.value);
      case 'less_than':
        return Number(answerValue) < Number(condition.value);
      default:
        return false;
    }
  }

  // Get all questions for a specific phase
  getQuestionsByPhase(phase: 1 | 2 | 3): SymptomQuestion[] {
    return this.questions.filter(q => q.phase === phase);
  }

  // Get questions by category
  getQuestionsByCategory(category: string): SymptomQuestion[] {
    return this.questions.filter(q => q.category === category);
  }

  // ENHANCED: Validate an answer with content quality checks
  validateAnswer(question: SymptomQuestion, answer: any): boolean {
    if (question.required && (!answer || answer === '')) {
      return false;
    }

    if (question.type === 'single-select' || question.type === 'multi-select') {
      const validValues = question.options.map(opt => opt.value);
      if (question.type === 'single-select') {
        return validValues.includes(answer);
      } else {
        return Array.isArray(answer) && answer.every(val => validValues.includes(val));
      }
    }

    // ENHANCED: Apply content quality validation for text answers
    if (question.type === 'text' && typeof answer === 'string') {
      return this.validateTextContent(answer, question);
    }

    return true;
  }

  // NEW: Validate text content using quality checks
  private validateTextContent(content: string, question: SymptomQuestion): boolean {
    // Apply relevant quality checks based on question category
    const relevantChecks = this.getRelevantQualityChecks(question);
    
    for (const check of relevantChecks) {
      const result = check.validate(content);
      if (result !== true) {
        // Store validation error for display
        if (!question.validationRules) {
          question.validationRules = {};
        }
        question.validationRules.lastError = result as string;
        return false;
      }
    }
    
    return true;
  }

  // NEW: Get relevant quality checks for a question
  private getRelevantQualityChecks(question: SymptomQuestion): QualityCheck[] {
    const relevantChecks: QualityCheck[] = [];
    
    // Always include basic word count check
    relevantChecks.push(QUALITY_CHECKS.find(c => c.id === 'word_count_check')!);
    
    // Add category-specific checks
    switch (question.category) {
      case 'funding_need':
        relevantChecks.push(QUALITY_CHECKS.find(c => c.id === 'financial_consistency')!);
        break;
      case 'innovation_level':
        relevantChecks.push(QUALITY_CHECKS.find(c => c.id === 'trl_justification')!);
        break;
      case 'business_stage':
        relevantChecks.push(QUALITY_CHECKS.find(c => c.id === 'problem_solution_completeness')!);
        relevantChecks.push(QUALITY_CHECKS.find(c => c.id === 'market_data_presence')!);
        break;
      case 'specific_requirements':
        relevantChecks.push(QUALITY_CHECKS.find(c => c.id === 'competitive_analysis')!);
        relevantChecks.push(QUALITY_CHECKS.find(c => c.id === 'team_qualifications')!);
        break;
    }
    
    return relevantChecks.filter(check => check !== undefined);
  }

  // Get funding types based on answers
  getFundingTypes(answers: Record<string, any>): string[] {
    const fundingTypes = new Set<string>();
    
    Object.entries(answers).forEach(([questionId, answerValue]) => {
      const question = this.questions.find(q => q.id === questionId);
      if (question) {
        const option = question.options.find(opt => opt.value === answerValue);
        if (option && option.fundingTypes) {
          option.fundingTypes.forEach(type => fundingTypes.add(type));
        }
      }
    });

    return Array.from(fundingTypes);
  }

  // NEW: Get programs that match funding types (enhanced from old system)
  getProgramsByFundingType(fundingTypes: string[]): Program[] {
    return this.programs.filter(program => {
      if (!program.type) return false;
      return fundingTypes.includes(program.type);
    });
  }

  // NEW: Generate context-aware smart questions
  generateContextualQuestions(answers: Record<string, any>): SymptomQuestion[] {
    // Update context with current answers
    this.updateContext(answers);
    
    const contextualQuestions: SymptomQuestion[] = [];
    const availablePrograms = this.getAvailablePrograms(answers);
    
    // Generate questions based on context
    contextualQuestions.push(...this.generateSectorSpecificQuestions());
    contextualQuestions.push(...this.generateStageSpecificQuestions());
    contextualQuestions.push(...this.generateLocationSpecificQuestions());
    contextualQuestions.push(...this.generateProgramSpecificQuestions(availablePrograms));
    
    return contextualQuestions;
  }

  // Update context with new answers
  private updateContext(answers: Record<string, any>): void {
    // Map answers to context
    if (answers.business_stage) {
      this.context.stage = answers.business_stage;
    }
    if (answers.funding_need) {
      this.context.fundingType = this.getFundingTypes(answers).join(',');
    }
    if (answers.location) {
      this.context.location = answers.location;
    }
    if (answers.team_size) {
      this.context.teamSize = answers.team_size;
    }
    if (answers.revenue_level) {
      this.context.revenue = answers.revenue_level;
    }
  }

  // Get programs that are still available after current exclusions
  private getAvailablePrograms(answers: Record<string, any>): Program[] {
    return this.programs.filter(program => {
      return this.isProgramStillEligible(program, answers);
    });
  }

  // Check if a program is still eligible based on current answers
  private isProgramStillEligible(program: Program, answers: Record<string, any>): boolean {
    // Check entity stage exclusions
    if (answers.entity_stage) {
      if (program.target_personas && !program.target_personas.includes(answers.entity_stage)) {
        return false;
      }
    }

    // Check funding type exclusions
    if (answers.funding_need) {
      const fundingTypes = this.getFundingTypes(answers);
      if (program.type && !fundingTypes.includes(program.type)) {
        return false;
      }
    }

    // Check location exclusions
    if (answers.location) {
      // Check location eligibility using tags or requirements
      if (program.tags && program.tags.some(tag => tag.toLowerCase().includes('austria')) && 
          answers.location && !answers.location.toLowerCase().includes('austria')) {
        return false;
      }
    }

    // Check team size exclusions using requirements
    if (answers.team_size && program.requirements) {
      const minTeam = program.requirements.min_team_size;
      const maxTeam = program.requirements.max_team_size;
      if (minTeam && answers.team_size < minTeam) {
        return false;
      }
      if (maxTeam && answers.team_size > maxTeam) {
        return false;
      }
    }

    return true;
  }

  // Generate questions that help exclude programs based on eligibility
  private generateEligibilityExclusionQuestions(availablePrograms: Program[]): SymptomQuestion[] {
    const questions: SymptomQuestion[] = [];
    
    // If we have too many programs, ask questions to narrow down
    if (availablePrograms.length > 5) {
      // Check if we can ask about TRL level
      const trlPrograms = availablePrograms.filter(p => p.requirements?.trl_level);
      if (trlPrograms.length > 0) {
        questions.push({
          id: 'trl_level_exclusion',
          symptom: 'What is your technology readiness level?',
          type: 'single-select',
          options: [
            { value: 'trl_1_3', label: 'TRL 1-3 (Basic research)', fundingTypes: ['grants'] },
            { value: 'trl_4_6', label: 'TRL 4-6 (Development)', fundingTypes: ['grants', 'loans'] },
            { value: 'trl_7_9', label: 'TRL 7-9 (Commercial)', fundingTypes: ['loans', 'equity'] }
          ],
          required: true,
          category: 'innovation_level',
          phase: 2,
          conditionalLogic: []
        });
      }
    }

    return questions;
  }

  // Generate questions that help exclude programs based on funding requirements
  private generateFundingExclusionQuestions(availablePrograms: Program[], answers: Record<string, any>): SymptomQuestion[] {
    const questions: SymptomQuestion[] = [];
    
    // Check if we can ask about co-financing
    const coFinancingPrograms = availablePrograms.filter(p => p.requirements?.co_financing);
    if (coFinancingPrograms.length > 0 && !answers.co_financing) {
      questions.push({
        id: 'co_financing_exclusion',
        symptom: 'What percentage of co-financing can you provide?',
        type: 'single-select',
        options: [
          { value: '0_10', label: '0-10%', fundingTypes: ['grants'] },
          { value: '10_25', label: '10-25%', fundingTypes: ['grants', 'loans'] },
          { value: '25_50', label: '25-50%', fundingTypes: ['grants', 'loans', 'equity'] },
          { value: '50_plus', label: '50%+', fundingTypes: ['loans', 'equity'] }
        ],
        required: true,
        category: 'specific_requirements',
        phase: 3,
        conditionalLogic: []
      });
    }

    return questions;
  }



  // Generate sector-specific questions based on context
  private generateSectorSpecificQuestions(): SymptomQuestion[] {
    const questions: SymptomQuestion[] = [];
    
    // If we know the sector, ask sector-specific questions
    if (this.context.sector) {
      switch (this.context.sector) {
        case 'healthcare':
          questions.push(this.createHealthcareQuestion());
          break;
        case 'technology':
          questions.push(this.createSectorQuestion());
          break;
        case 'energy':
          questions.push(this.createEnergyQuestion());
          break;
      }
    } else {
      // Ask sector question if not known
      questions.push(this.createSectorQuestion());
    }
    
    return questions;
  }

  // Generate stage-specific questions based on context
  private generateStageSpecificQuestions(): SymptomQuestion[] {
    const questions: SymptomQuestion[] = [];
    
    if (this.context.stage === 'startup') {
      questions.push(this.createStartupQuestion());
    } else if (this.context.stage === 'sme') {
      questions.push(this.createSMEQuestion());
    }
    
    return questions;
  }

  // Generate location-specific questions based on context
  private generateLocationSpecificQuestions(): SymptomQuestion[] {
    const questions: SymptomQuestion[] = [];
    
    if (this.context.location === 'austria') {
      questions.push(this.createAustriaQuestion());
    } else if (this.context.location === 'eu') {
      questions.push(this.createEUQuestion());
    }
    
    return questions;
  }

  // Generate program-specific questions based on context
  private generateProgramSpecificQuestions(availablePrograms: Program[]): SymptomQuestion[] {
    const questions: SymptomQuestion[] = [];
    
    // Only ask if we have too many programs
    if (availablePrograms.length > 5) {
      questions.push(...this.generateEligibilityExclusionQuestions(availablePrograms));
      questions.push(...this.generateFundingExclusionQuestions(availablePrograms, {}));
    }
    
    return questions;
  }













  // Smart question creators with context
  private createSectorQuestion(): SymptomQuestion {
    return {
      id: 'sector_context',
      symptom: 'What sector is your project in?',
      type: 'single-select',
      options: [
        { value: 'healthcare', label: 'Healthcare & Life Sciences', fundingTypes: ['grants'] },
        { value: 'technology', label: 'Technology & Digital', fundingTypes: ['grants', 'equity'] },
        { value: 'energy', label: 'Energy & Environment', fundingTypes: ['grants'] },
        { value: 'manufacturing', label: 'Manufacturing & Industry', fundingTypes: ['grants', 'loans'] },
        { value: 'other', label: 'Other', fundingTypes: ['grants', 'loans', 'equity'] }
      ],
      required: true,
      category: 'funding_need',
      phase: 1,
      conditionalLogic: []
    };
  }

  private createHealthcareQuestion(): SymptomQuestion {
    return {
      id: 'healthcare_regulatory',
      symptom: 'Do you need regulatory approval for your product?',
      type: 'single-select',
      options: [
        { value: 'yes', label: 'Yes, we need approval', fundingTypes: ['grants'] },
        { value: 'no', label: 'No, we don\'t need approval', fundingTypes: ['grants', 'loans', 'equity'] },
        { value: 'unsure', label: 'We\'re not sure yet', fundingTypes: ['grants'] }
      ],
      required: true,
      category: 'specific_requirements',
      phase: 2,
      conditionalLogic: []
    };
  }


  private createEnergyQuestion(): SymptomQuestion {
    return {
      id: 'energy_renewable',
      symptom: 'Is your project focused on renewable energy?',
      type: 'single-select',
      options: [
        { value: 'yes', label: 'Yes, renewable energy', fundingTypes: ['grants'] },
        { value: 'no', label: 'No, traditional energy', fundingTypes: ['loans', 'equity'] },
        { value: 'hybrid', label: 'Both renewable and traditional', fundingTypes: ['grants', 'loans'] }
      ],
      required: true,
      category: 'specific_requirements',
      phase: 2,
      conditionalLogic: []
    };
  }

  private createStartupQuestion(): SymptomQuestion {
    return {
      id: 'startup_trl',
      symptom: 'How developed is your technology?',
      type: 'single-select',
      options: [
        { value: 'trl_1_3', label: 'Basic research (TRL 1-3)', fundingTypes: ['grants'] },
        { value: 'trl_4_6', label: 'Development phase (TRL 4-6)', fundingTypes: ['grants', 'equity'] },
        { value: 'trl_7_9', label: 'Commercial ready (TRL 7-9)', fundingTypes: ['loans', 'equity'] }
      ],
      required: true,
      category: 'innovation_level',
      phase: 2,
      conditionalLogic: []
    };
  }

  private createSMEQuestion(): SymptomQuestion {
    return {
      id: 'sme_revenue',
      symptom: 'What is your annual revenue?',
      type: 'single-select',
      options: [
        { value: 'under_100k', label: 'Under €100,000', fundingTypes: ['grants', 'loans'] },
        { value: '100k_500k', label: '€100,000 - €500,000', fundingTypes: ['grants', 'loans', 'equity'] },
        { value: '500k_2m', label: '€500,000 - €2 million', fundingTypes: ['loans', 'equity'] },
        { value: 'over_2m', label: 'Over €2 million', fundingTypes: ['loans', 'equity'] }
      ],
      required: true,
      category: 'business_stage',
      phase: 2,
      conditionalLogic: []
    };
  }

  private createAustriaQuestion(): SymptomQuestion {
    return {
      id: 'austria_region',
      symptom: 'Which Austrian region are you based in?',
      type: 'single-select',
      options: [
        { value: 'vienna', label: 'Vienna', fundingTypes: ['grants', 'loans', 'equity'] },
        { value: 'upper_austria', label: 'Upper Austria', fundingTypes: ['grants', 'loans'] },
        { value: 'lower_austria', label: 'Lower Austria', fundingTypes: ['grants', 'loans'] },
        { value: 'styria', label: 'Styria', fundingTypes: ['grants', 'loans'] },
        { value: 'tyrol', label: 'Tyrol', fundingTypes: ['grants', 'loans'] },
        { value: 'other', label: 'Other region', fundingTypes: ['grants', 'loans'] }
      ],
      required: true,
      category: 'location',
      phase: 3,
      conditionalLogic: []
    };
  }

  private createEUQuestion(): SymptomQuestion {
    return {
      id: 'eu_country',
      symptom: 'Which EU country are you based in?',
      type: 'single-select',
      options: [
        { value: 'germany', label: 'Germany', fundingTypes: ['grants', 'loans', 'equity'] },
        { value: 'france', label: 'France', fundingTypes: ['grants', 'loans', 'equity'] },
        { value: 'italy', label: 'Italy', fundingTypes: ['grants', 'loans'] },
        { value: 'spain', label: 'Spain', fundingTypes: ['grants', 'loans'] },
        { value: 'other', label: 'Other EU country', fundingTypes: ['grants', 'loans'] }
      ],
      required: true,
      category: 'location',
      phase: 3,
      conditionalLogic: []
    };
  }


  // Get programs that match the current answers
  getMatchingPrograms(answers: Record<string, any>): Program[] {
    const fundingTypes = this.getFundingTypes(answers);
    
    return this.programs.filter(program => {
      // Basic filtering by funding type
      if (program.type && !fundingTypes.includes(program.type)) {
        return false;
      }

      // Add more sophisticated matching logic here
      // This will be enhanced in the scoring engine
      return true;
    });
  }

  // NEW: Compute overlay questions from program data (from dynamicQuestionEngine.ts)
  private async computeOverlayQuestions(): Promise<void> {
    if (this.programs.length === 0) {
      console.log('⚠️ No programs available for overlay questions');
      return;
    }

    const questionStats = new Map<string, QuestionStats>();
    const overlayQuestions: SymptomQuestion[] = [];

    console.log(`🔄 Computing overlay questions from ${this.programs.length} programs...`);
    
    // Performance optimization for large datasets
    const maxProgramsToProcess = Math.min(this.programs.length, 100); // Limit to 100 programs for performance
    const programsToProcess = this.programs.slice(0, maxProgramsToProcess);
    
    if (this.programs.length > 100) {
      console.log(`⚠️ Large dataset detected (${this.programs.length} programs). Processing first 100 for performance.`);
    }

    // Analyze each program's requirements to generate overlay questions
    for (const program of programsToProcess) {
      console.log(`🔍 Processing program ${program.id}:`, {
        hasCategorizedRequirements: !!program.categorized_requirements,
        categorizedRequirementsKeys: program.categorized_requirements ? Object.keys(program.categorized_requirements) : []
      });

      if (program.categorized_requirements && Object.keys(program.categorized_requirements).length > 0) {
        const programQuestions = this.generateQuestionsFromCategorizedRequirements(
          program.categorized_requirements,
          program.id
        );

        console.log(`✅ Generated ${programQuestions.length} questions from program ${program.id}`);

        // Calculate statistics for each question
        for (const question of programQuestions) {
          const stats = this.calculateQuestionStats(question, program);
          questionStats.set(question.id, stats);
          overlayQuestions.push(question);
        }
      } else {
        console.log(`⚠️ Program ${program.id} has no categorized_requirements`);
      }
    }

    // Deduplicate and sort questions by information value
    this.overlayQuestions = this.deduplicateAndSortQuestions(overlayQuestions, questionStats);
    this.questionStats = questionStats;

    console.log(`✅ Computed ${this.overlayQuestions.length} overlay questions from ${programsToProcess.length} programs`);
    
    // Log performance metrics for large datasets
    if (this.programs.length > 50) {
      console.log(`📊 Performance metrics:`, {
        totalPrograms: this.programs.length,
        processedPrograms: programsToProcess.length,
        generatedQuestions: overlayQuestions.length,
        finalQuestions: this.overlayQuestions.length,
        efficiency: `${Math.round((this.overlayQuestions.length / programsToProcess.length) * 100)}%`
      });
    }
  }

  // NEW: Calculate question statistics (from dynamicQuestionEngine.ts)
  private calculateQuestionStats(question: SymptomQuestion, program: Program): QuestionStats {
    const programsAffected = this.programs.filter(p => 
      this.isQuestionRelevantToProgram(question, p)
    ).length;

    const informationValue = this.calculateInformationValue(question, programsAffected);
    const decisiveness = this.calculateDecisiveness(question, programsAffected);
    const uxWeight = this.calculateUXWeight(question, programsAffected);

    return {
      informationValue,
      programsAffected,
      decisiveness,
      uxWeight,
      isCoreQuestion: false, // Overlay questions are not core
      sourcePrograms: [program.id]
    };
  }

  // NEW: Calculate information value of a question
  private calculateInformationValue(question: SymptomQuestion, programsAffected: number): number {
    // Base information value from question type and complexity
    let baseValue = 1.0;
    
    if (question.type === 'multi-select') baseValue = 1.5;
    if (question.type === 'text') baseValue = 2.0;
    if (question.type === 'number') baseValue = 1.2;

    // Scale by how many programs this affects
    const programRatio = programsAffected / this.programs.length;
    let scaledValue = baseValue * (0.5 + programRatio * 0.5);

    // Bonus for questions that can eliminate many programs
    if (programRatio < 0.3) scaledValue *= 1.5; // High elimination potential

    return Math.round(scaledValue * 100) / 100;
  }

  // NEW: Calculate decisiveness of a question
  private calculateDecisiveness(_question: SymptomQuestion, programsAffected: number): 'HARD' | 'SOFT' | 'UNCERTAIN' {
    const programRatio = programsAffected / this.programs.length;
    
    if (programRatio < 0.2) return 'HARD'; // Eliminates many programs
    if (programRatio > 0.8) return 'SOFT'; // Affects most programs
    return 'UNCERTAIN';
  }

  // NEW: Calculate UX weight for question prioritization
  private calculateUXWeight(question: SymptomQuestion, programsAffected: number): number {
    let weight = 1.0;

    // Core questions get higher weight
    if (question.isCoreQuestion) weight *= 2.0;

    // Questions that affect many programs get higher weight
    const programRatio = programsAffected / this.programs.length;
    weight *= (0.5 + programRatio * 0.5);

    // Required questions get higher weight
    if (question.required) weight *= 1.5;

    // Phase 1 questions get higher weight (broader impact)
    if (question.phase === 1) weight *= 1.3;

    return Math.round(weight * 100) / 100;
  }

  // NEW: Generate questions from categorized requirements
  private generateQuestionsFromCategorizedRequirements(
    categorizedRequirements: any,
    programId: string
  ): SymptomQuestion[] {
    const questions: SymptomQuestion[] = [];

    console.log(`🔍 Generating questions from categorized requirements for program ${programId}:`, categorizedRequirements);

    // Generate questions for each category
    for (const [category, requirements] of Object.entries(categorizedRequirements)) {
      if (Array.isArray(requirements) && requirements.length > 0) {
        console.log(`📝 Processing category ${category} with ${requirements.length} requirements`);
        const question = this.createQuestionFromCategory(category, requirements, programId);
        if (question) {
          console.log(`✅ Created question: ${question.id} for category ${category}`);
          questions.push(question);
        }
      } else if (requirements && typeof requirements === 'object') {
        console.log(`📝 Processing category ${category} with object requirements`);
        const question = this.createQuestionFromCategory(category, [requirements], programId);
        if (question) {
          console.log(`✅ Created question: ${question.id} for category ${category}`);
          questions.push(question);
        }
      }
    }

    console.log(`✅ Generated ${questions.length} questions from program ${programId}`);
    return questions;
  }

  // NEW: Create question from category requirements
  private createQuestionFromCategory(category: string, _requirements: any[], programId: string): SymptomQuestion | null {
    const questionId = `${category}_${programId}`;
    
    // Map category to question type and options
    const categoryMapping = {
      'co_financing': {
        symptom: 'Do you have co-financing available?',
        type: 'boolean' as const,
        options: [
          { value: 'yes', label: 'Yes, I have co-financing' },
          { value: 'no', label: 'No, I need full funding' }
        ]
      },
      'trl_level': {
        symptom: 'What is your technology readiness level?',
        type: 'single-select' as const,
        options: [
          { value: '1-3', label: 'Basic research (TRL 1-3)' },
          { value: '4-6', label: 'Development (TRL 4-6)' },
          { value: '7-9', label: 'Commercialization (TRL 7-9)' }
        ]
      },
      'impact': {
        symptom: 'What type of impact are you targeting?',
        type: 'multi-select' as const,
        options: [
          { value: 'economic', label: 'Economic impact' },
          { value: 'social', label: 'Social impact' },
          { value: 'environmental', label: 'Environmental impact' }
        ]
      },
      'consortium': {
        symptom: 'Do you have consortium partners?',
        type: 'boolean' as const,
        options: [
          { value: 'yes', label: 'Yes, I have partners' },
          { value: 'no', label: 'No, I work alone' }
        ]
      },
      'eligibility': {
        symptom: 'What is your organization type?',
        type: 'single-select' as const,
        options: [
          { value: 'startup', label: 'Startup' },
          { value: 'sme', label: 'SME' },
          { value: 'research', label: 'Research institution' }
        ]
      }
    };

    const mapping = categoryMapping[category as keyof typeof categoryMapping];
    if (!mapping) {
      console.log(`⚠️ No mapping found for category: ${category}`);
      return null;
    }

    return {
      id: questionId,
      symptom: mapping.symptom,
      type: mapping.type,
      options: mapping.options,
      required: true,
      category: category as any,
      phase: 2, // Overlay questions are phase 2
      sourcePrograms: [programId],
      informationValue: 1.0,
      programsAffected: 1,
      decisiveness: 'UNCERTAIN' as const,
      uxWeight: 1.0,
      isCoreQuestion: false
    };
  }

  // NEW: Check if question is relevant to a program
  private isQuestionRelevantToProgram(question: SymptomQuestion, program: Program): boolean {
    // Check if program has requirements in this category
    if (program.categorized_requirements) {
      const category = question.category;
      return Object.keys(program.categorized_requirements).includes(category);
    }
    return false;
  }

  // NEW: Deduplicate and sort questions by information value
  private deduplicateAndSortQuestions(questions: SymptomQuestion[], stats: Map<string, QuestionStats>): SymptomQuestion[] {
    // Deduplicate by question text
    const uniqueQuestions = new Map<string, SymptomQuestion>();
    
    for (const question of questions) {
      const key = question.symptom.toLowerCase();
      if (!uniqueQuestions.has(key)) {
        uniqueQuestions.set(key, question);
      } else {
        // Merge source programs
        const existing = uniqueQuestions.get(key)!;
        const existingStats = stats.get(existing.id);
        const currentStats = stats.get(question.id);
        
        if (existingStats && currentStats) {
          existingStats.sourcePrograms.push(...currentStats.sourcePrograms);
          existingStats.programsAffected = Math.max(existingStats.programsAffected, currentStats.programsAffected);
        }
      }
    }

    // Sort by information value (descending)
    return Array.from(uniqueQuestions.values()).sort((a, b) => {
      const statsA = stats.get(a.id);
      const statsB = stats.get(b.id);
      
      if (!statsA || !statsB) return 0;
      return statsB.informationValue - statsA.informationValue;
    });
  }

  // NEW: Get core questions (from dynamicQuestionEngine.ts)
  public getCoreQuestions(): SymptomQuestion[] {
    return this.questions.filter(q => q.isCoreQuestion !== false); // Default core questions
  }

  // NEW: Get overlay questions (from dynamicQuestionEngine.ts)
  public getOverlayQuestions(): SymptomQuestion[] {
    return this.overlayQuestions.slice(0, 50); // Top 50 overlay questions for better coverage
  }

  // NEW: Get next question with enhanced logic (from dynamicQuestionEngine.ts)
  public async getNextQuestionEnhanced(answers: Record<string, any>): Promise<SymptomQuestion | null> {
    // Update context with current answers
    this.updateContext(answers);
    
    console.log(`🔍 Getting next question. Current answers:`, Object.keys(answers));
    console.log(`🔍 Available overlay questions: ${this.overlayQuestions.length}`);
    
    // PRIORITY 1: Find unanswered overlay questions (generated from program data)
    const overlayQuestions = this.getOverlayQuestions();
    for (const question of overlayQuestions) {
      if (question.required && !answers[question.id]) {
        console.log(`✅ Found unanswered overlay question: ${question.id}`);
        return this.enhanceQuestionWithStats(question);
      }
    }
    
    // PRIORITY 2: Find unanswered core questions (fallback)
    const coreQuestions = this.getCoreQuestions();
    for (const question of coreQuestions) {
      if (question.required && !answers[question.id]) {
        console.log(`✅ Found unanswered core question: ${question.id}`);
        return this.enhanceQuestionWithStats(question);
      }
    }
    
    // PRIORITY 3: Find unanswered profile-based questions
    const profileQuestions = this.getProfileBasedQuestions(answers);
    for (const question of profileQuestions) {
      if (question.required && !answers[question.id]) {
        console.log(`✅ Found unanswered profile question: ${question.id}`);
        return this.enhanceQuestionWithStats(question);
      }
    }
    
    console.log(`✅ All questions answered`);
    return null; // All questions answered
  }

  // NEW: Enhance question with statistics
  private enhanceQuestionWithStats(question: SymptomQuestion): SymptomQuestion {
    const stats = this.questionStats.get(question.id);
    if (stats) {
      return {
        ...question,
        informationValue: stats.informationValue,
        programsAffected: stats.programsAffected,
        decisiveness: stats.decisiveness,
        uxWeight: stats.uxWeight,
        isCoreQuestion: stats.isCoreQuestion,
        sourcePrograms: stats.sourcePrograms
      };
    }
    return question;
  }

  // NEW: Get question by ID with statistics
  public getQuestionById(id: string): SymptomQuestion | undefined {
    const question = this.questions.find(q => q.id === id) || 
                   this.overlayQuestions.find(q => q.id === id);
    
    if (question) {
      return this.enhanceQuestionWithStats(question);
    }
    
    return undefined;
  }

  // NEW: Get profile-based questions (from conditionalQuestionEngine.ts)
  private getProfileBasedQuestions(_answers: Record<string, any>): SymptomQuestion[] {
    const profileQuestions: SymptomQuestion[] = [];

    // Entity stage based questions
    if (this.context.stage === 'startup') {
      profileQuestions.push(...this.getStartupQuestions());
    } else if (this.context.stage === 'sme') {
      profileQuestions.push(...this.getSMEQuestions());
    } else if (this.context.stage === 'researcher') {
      profileQuestions.push(...this.getResearcherQuestions());
    }

    // Industry based questions
    if (this.context.sector) {
      profileQuestions.push(...this.getIndustryQuestions(this.context.sector));
    }

    // Funding type based questions
    if (this.context.fundingType) {
      profileQuestions.push(...this.getFundingTypeQuestions(this.context.fundingType));
    }

    // Location based questions
    if (this.context.location) {
      profileQuestions.push(...this.getLocationQuestions(this.context.location));
    }

    return profileQuestions;
  }

  // NEW: Get startup-specific questions
  private getStartupQuestions(): SymptomQuestion[] {
    return [
      {
        id: 'startup_trl_level',
        symptom: 'What is your technology readiness level (TRL)?',
        type: 'single-select',
        options: [
          { value: 'trl_1_3', label: 'TRL 1-3 (Basic research)', fundingTypes: ['grants'] },
          { value: 'trl_4_6', label: 'TRL 4-6 (Development)', fundingTypes: ['grants', 'equity'] },
          { value: 'trl_7_9', label: 'TRL 7-9 (Commercial)', fundingTypes: ['loans', 'equity'] }
        ],
        required: true,
        category: 'innovation_level',
        phase: 2,
        conditionalLogic: [
          { questionId: 'business_stage', operator: 'equals', value: 'just_idea', action: 'show' }
        ],
        aiGuidance: 'This helps determine if you meet the program\'s technology requirements.'
      },
      {
        id: 'startup_funding_stage',
        symptom: 'What funding stage are you seeking?',
        type: 'single-select',
        options: [
          { value: 'pre_seed', label: 'Pre-seed', fundingTypes: ['grants', 'equity'] },
          { value: 'seed', label: 'Seed', fundingTypes: ['grants', 'equity'] },
          { value: 'series_a', label: 'Series A', fundingTypes: ['equity'] },
          { value: 'series_b_plus', label: 'Series B+', fundingTypes: ['equity'] }
        ],
        required: true,
        category: 'funding_need',
        phase: 2,
        conditionalLogic: [
          { questionId: 'business_stage', operator: 'in', value: ['just_idea', 'building'], action: 'show' }
        ],
        aiGuidance: 'This helps match you with appropriate funding programs for your stage.'
      }
    ];
  }

  // NEW: Get SME-specific questions
  private getSMEQuestions(): SymptomQuestion[] {
    return [
      {
        id: 'sme_revenue',
        symptom: 'What is your annual revenue?',
        type: 'single-select',
        options: [
          { value: 'under_100k', label: 'Under €100,000', fundingTypes: ['grants', 'loans'] },
          { value: '100k_500k', label: '€100,000 - €500,000', fundingTypes: ['grants', 'loans', 'equity'] },
          { value: '500k_2m', label: '€500,000 - €2 million', fundingTypes: ['loans', 'equity'] },
          { value: 'over_2m', label: 'Over €2 million', fundingTypes: ['loans', 'equity'] }
        ],
        required: true,
        category: 'business_stage',
        phase: 2,
        conditionalLogic: [
          { questionId: 'business_stage', operator: 'in', value: ['selling', 'growing'], action: 'show' }
        ],
        aiGuidance: 'This helps determine your eligibility for different funding programs.'
      }
    ];
  }

  // NEW: Get researcher-specific questions
  private getResearcherQuestions(): SymptomQuestion[] {
    return [
      {
        id: 'researcher_institution',
        symptom: 'What type of research institution are you affiliated with?',
        type: 'single-select',
        options: [
          { value: 'university', label: 'University', fundingTypes: ['grants'] },
          { value: 'research_institute', label: 'Research Institute', fundingTypes: ['grants'] },
          { value: 'government_lab', label: 'Government Lab', fundingTypes: ['grants'] },
          { value: 'private_research', label: 'Private Research', fundingTypes: ['grants', 'equity'] }
        ],
        required: true,
        category: 'team_size',
        phase: 2,
        aiGuidance: 'This helps identify the most suitable funding programs for your institution type.'
      }
    ];
  }

  // NEW: Get industry-specific questions
  private getIndustryQuestions(industry: string): SymptomQuestion[] {
    const industryQuestions: Record<string, SymptomQuestion[]> = {
      'healthcare': [
        {
          id: 'health_regulatory',
          symptom: 'Do you need regulatory approval for your product?',
          type: 'single-select',
          options: [
            { value: 'yes', label: 'Yes, we need approval', fundingTypes: ['grants'] },
            { value: 'no', label: 'No, we don\'t need approval', fundingTypes: ['grants', 'loans', 'equity'] },
            { value: 'unsure', label: 'We\'re not sure yet', fundingTypes: ['grants'] }
          ],
          required: true,
          category: 'specific_requirements',
          phase: 2,
          aiGuidance: 'Healthcare products often require regulatory approval - this affects funding eligibility.'
        }
      ],
      'technology': [
        {
          id: 'tech_ai_ml',
          symptom: 'Does your project involve AI or machine learning?',
          type: 'single-select',
          options: [
            { value: 'yes', label: 'Yes, we use AI/ML', fundingTypes: ['grants', 'equity'] },
            { value: 'no', label: 'No, we don\'t use AI/ML', fundingTypes: ['grants', 'loans', 'equity'] },
            { value: 'planning', label: 'We\'re planning to use AI/ML', fundingTypes: ['grants'] }
          ],
          required: true,
          category: 'innovation_level',
          phase: 2,
          aiGuidance: 'AI/ML projects often have specialized funding programs available.'
        }
      ],
      'energy': [
        {
          id: 'energy_renewable',
          symptom: 'Is your project focused on renewable energy?',
          type: 'single-select',
          options: [
            { value: 'yes', label: 'Yes, renewable energy', fundingTypes: ['grants'] },
            { value: 'no', label: 'No, traditional energy', fundingTypes: ['loans', 'equity'] },
            { value: 'hybrid', label: 'Both renewable and traditional', fundingTypes: ['grants', 'loans'] }
          ],
          required: true,
          category: 'specific_requirements',
          phase: 2,
          aiGuidance: 'Renewable energy projects have access to specialized green funding programs.'
        }
      ]
    };

    return industryQuestions[industry] || [];
  }

  // NEW: Get funding type specific questions
  private getFundingTypeQuestions(fundingType: string): SymptomQuestion[] {
    const fundingQuestions: Record<string, SymptomQuestion[]> = {
      'grant': [
        {
          id: 'grant_non_dilutive',
          symptom: 'Are you looking for non-dilutive funding?',
          type: 'single-select',
          options: [
            { value: 'yes', label: 'Yes, non-dilutive preferred', fundingTypes: ['grants'] },
            { value: 'no', label: 'No, equity is acceptable', fundingTypes: ['grants', 'equity'] },
            { value: 'either', label: 'Either is fine', fundingTypes: ['grants', 'loans', 'equity'] }
          ],
          required: true,
          category: 'funding_need',
          phase: 2,
          aiGuidance: 'Grants provide non-dilutive funding - no equity required.'
        }
      ],
      'equity': [
        {
          id: 'equity_valuation',
          symptom: 'What is your company valuation?',
          type: 'single-select',
          options: [
            { value: 'under_1m', label: 'Under €1M', fundingTypes: ['equity'] },
            { value: '1m_5m', label: '€1M - €5M', fundingTypes: ['equity'] },
            { value: '5m_10m', label: '€5M - €10M', fundingTypes: ['equity'] },
            { value: 'over_10m', label: 'Over €10M', fundingTypes: ['equity'] }
          ],
          required: true,
          category: 'funding_need',
          phase: 2,
          aiGuidance: 'Valuation affects the type of equity investors and funding programs available.'
        }
      ]
    };

    return fundingQuestions[fundingType] || [];
  }

  // NEW: Get location-specific questions
  private getLocationQuestions(location: string): SymptomQuestion[] {
    if (location === 'austria') {
      return [
        {
          id: 'austria_region',
          symptom: 'Which Austrian region are you based in?',
          type: 'single-select',
          options: [
            { value: 'vienna', label: 'Vienna', fundingTypes: ['grants', 'loans', 'equity'] },
            { value: 'upper_austria', label: 'Upper Austria', fundingTypes: ['grants', 'loans'] },
            { value: 'lower_austria', label: 'Lower Austria', fundingTypes: ['grants', 'loans'] },
            { value: 'styria', label: 'Styria', fundingTypes: ['grants', 'loans'] },
            { value: 'tyrol', label: 'Tyrol', fundingTypes: ['grants', 'loans'] },
            { value: 'other', label: 'Other region', fundingTypes: ['grants', 'loans'] }
          ],
          required: true,
          category: 'location',
          phase: 3,
          aiGuidance: 'Some funding programs are region-specific within Austria.'
        }
      ];
    }

    return [];
  }

  // NEW: Load branching rules (hardcoded from data/questions.ts)
  private loadBranchingRules(): void {
    // Branching rules integrated from data/questions.ts
    this.branchingRules = [
      {
        description: "Skip loans/guarantees if user only wants grants",
        ask_if: "not ('LOAN' in answers.q8_funding_types or 'GUARANTEE' in answers.q8_funding_types)",
        effect: "hide_products_with_types=['loan','guarantee']"
      },
      {
        description: "Show Austrian national programmes only if project is in Austria",
        ask_if: "answers.q1_country == 'AT' or (answers.q1_country == 'EU')",
        effect: "show_at_national=true"
      },
      {
        description: "Health & Life Science specialised programmes",
        ask_if: "'HEALTH_LIFE_SCIENCE' in answers.q4_theme",
        effect: "boost_tags=['health','life_science']"
      },
      {
        description: "Sustainability/Climate specialised programmes",
        ask_if: "'SUSTAINABILITY' in answers.q4_theme or answers.q10_env_benefit in ['STRONG','SOME']",
        effect: "boost_tags=['sustainability','climate','energy','environment']"
      },
      {
        description: "Space downstream specialised programmes",
        ask_if: "'SPACE_DOWNSTREAM' in answers.q4_theme",
        effect: "boost_tags=['space','gnss','eo']"
      }
    ];
  }

  // NEW: Process branching rules and apply effects
  public processBranchingRules(answers: Record<string, any>): ProgramFilteringEffects {
    const effects: ProgramFilteringEffects = {};

    for (const rule of this.branchingRules) {
      if (this.evaluateBranchingCondition(rule.ask_if, answers)) {
        this.applyBranchingEffect(rule.effect, effects);
      }
    }

    // Store filtering effects for later use
    // this.programFilteringEffects = effects;
    return effects;
  }

  // NEW: Evaluate branching rule conditions
  private evaluateBranchingCondition(condition: string, answers: Record<string, any>): boolean {
    try {
      // Handle complex conditions like "not ('LOAN' in answers.q8_funding_types or 'GUARANTEE' in answers.q8_funding_types)"
      if (condition.includes('not (')) {
        const innerCondition = condition.replace('not (', '').replace(')', '');
        return !this.evaluateBranchingCondition(innerCondition, answers);
      }

      // Handle OR conditions like "answers.q1_country == 'AT' or (answers.q1_country == 'EU')"
      if (condition.includes(' or ')) {
        const parts = condition.split(' or ');
        return parts.some(part => this.evaluateBranchingCondition(part.trim(), answers));
      }

      // Handle AND conditions
      if (condition.includes(' and ')) {
        const parts = condition.split(' and ');
        return parts.every(part => this.evaluateBranchingCondition(part.trim(), answers));
      }

      // Handle array contains like "'HEALTH_LIFE_SCIENCE' in answers.q4_theme"
      const arrayMatch = condition.match(/'([^']+)'\s+in\s+answers\.(\w+)/);
      if (arrayMatch) {
        const value = arrayMatch[1];
        const questionId = arrayMatch[2];
        const answer = answers[questionId];
        return Array.isArray(answer) && answer.includes(value);
      }

      // Handle equality like "answers.q1_country == 'AT'"
      const equalityMatch = condition.match(/answers\.(\w+)\s*==\s*'([^']+)'/);
      if (equalityMatch) {
        const questionId = equalityMatch[1];
        const expectedValue = equalityMatch[2];
        return answers[questionId] === expectedValue;
      }

      // Handle array contains with multiple values like "answers.q10_env_benefit in ['STRONG','SOME']"
      const arrayContainsMatch = condition.match(/answers\.(\w+)\s+in\s+\[([^\]]+)\]/);
      if (arrayContainsMatch) {
        const questionId = arrayContainsMatch[1];
        const values = arrayContainsMatch[2].split(',').map(v => v.trim().replace(/['"]/g, ''));
        const answer = answers[questionId];
        return values.includes(answer);
      }

      return false;
    } catch (error) {
      console.warn('Error evaluating branching condition:', condition, error);
      return false;
    }
  }

  // NEW: Apply branching rule effects
  private applyBranchingEffect(effect: string, effects: ProgramFilteringEffects): void {
    // Handle hide_products_with_types=['loan','guarantee']
    const hideMatch = effect.match(/hide_products_with_types=\[([^\]]+)\]/);
    if (hideMatch) {
      const types = hideMatch[1].split(',').map(t => t.trim().replace(/['"]/g, ''));
      effects.hideProductsWithTypes = [...(effects.hideProductsWithTypes || []), ...types];
    }

    // Handle show_at_national=true
    if (effect.includes('show_at_national=true')) {
      effects.showAtNational = true;
    }

    // Handle boost_tags=['health','life_science']
    const boostMatch = effect.match(/boost_tags=\[([^\]]+)\]/);
    if (boostMatch) {
      const tags = boostMatch[1].split(',').map(t => t.trim().replace(/['"]/g, ''));
      effects.boostTags = [...(effects.boostTags || []), ...tags];
    }
  }

  // NEW: Get filtered programs based on branching rules
  public getFilteredPrograms(answers: Record<string, any>): Program[] {
    const effects = this.processBranchingRules(answers);
    
    return this.programs.filter(program => {
      // Apply hide_products_with_types filter
      if (effects.hideProductsWithTypes && program.type) {
        if (effects.hideProductsWithTypes.includes(program.type)) {
          return false;
        }
      }

      // Apply show_at_national filter
      if (effects.showAtNational) {
        // Only show Austrian national programs
        // Check if program is Austria-specific using tags
        if (program.tags && program.tags.some(tag => tag.toLowerCase().includes('austria'))) {
          return true; // Austria-specific program
        }
      }

      return true;
    });
  }

  // NEW: Get boosted tags for program scoring
  public getBoostedTags(answers: Record<string, any>): string[] {
    const effects = this.processBranchingRules(answers);
    return effects.boostTags || [];
  }

  // NEW: Validate answers with enhanced validation (from dynamicDecisionTree.ts)
  public validateAnswers(answers: Record<string, any>): {
    valid: boolean;
    errors: string[];
    warnings: string[];
    recommendations: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Validate required questions
    const allQuestions = [...this.questions, ...this.overlayQuestions];
    for (const question of allQuestions) {
      if (question.required && !answers[question.id]) {
        errors.push(`Question "${question.symptom}" is required`);
      }
    }

    // Validate answer formats
    for (const [questionId, answer] of Object.entries(answers)) {
      const question = allQuestions.find(q => q.id === questionId);
      if (question && !this.validateAnswer(question, answer)) {
        errors.push(`Invalid answer for "${question.symptom}"`);
      }
    }

    // Add recommendations based on context
    if (this.context.stage === 'startup' && !answers.innovation_level) {
      recommendations.push('Consider specifying your innovation level for better program matching');
    }

    if (this.context.fundingType?.includes('grant') && !answers.co_financing) {
      recommendations.push('Grants often require co-financing - consider your contribution level');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      recommendations
    };
  }

  // INTEGRATED: Validation Helper Functions (from validationRules.ts)
  
  /**
   * Run all quality checks on content
   */
  public runQualityChecks(content: string): { passed: boolean; errors: string[] } {
    const errors: string[] = [];
    
    for (const check of QUALITY_CHECKS) {
      const result = check.validate(content);
      if (result !== true) {
        errors.push(result as string);
      }
    }
    
    return {
      passed: errors.length === 0,
      errors
    };
  }

  /**
   * Run validation rules on form data
   */
  public runValidationRules(data: Record<string, any>): { passed: boolean; errors: string[] } {
    const errors: string[] = [];
    
    for (const rule of VALIDATION_RULES) {
      const result = rule.validate(data);
      if (result !== true) {
        errors.push(result as string);
      }
    }
    
    return {
      passed: errors.length === 0,
      errors
    };
  }

  /**
   * Get specific quality check by ID
   */
  public getQualityCheck(checkId: string): QualityCheck | undefined {
    return QUALITY_CHECKS.find(check => check.id === checkId);
  }

  /**
   * Get specific validation rule by ID
   */
  public getValidationRule(ruleId: string): ValidationRule | undefined {
    return VALIDATION_RULES.find(rule => rule.id === ruleId);
  }

  /**
   * Run specific quality check
   */
  public runQualityCheck(checkId: string, content: string): boolean | string {
    const check = this.getQualityCheck(checkId);
    if (!check) {
      return `Quality check '${checkId}' not found`;
    }
    return check.validate(content);
  }

  /**
   * Run specific validation rule
   */
  public runValidationRule(ruleId: string, data: Record<string, any>): boolean | string {
    const rule = this.getValidationRule(ruleId);
    if (!rule) {
      return `Validation rule '${ruleId}' not found`;
    }
    return rule.validate(data);
  }

  /**
   * Get all quality check IDs
   */
  public getQualityCheckIds(): string[] {
    return QUALITY_CHECKS.map(check => check.id);
  }

  /**
   * Get all validation rule IDs
   */
  public getValidationRuleIds(): string[] {
    return VALIDATION_RULES.map(rule => rule.id);
  }
}
