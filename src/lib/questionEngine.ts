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
    description?: string; // Additional context for the option
    fundingTypes?: string[]; // Which funding types this answer suggests
    nextQuestions?: string[]; // Which questions to ask next
  }>;
  required: boolean;
  category: 'funding_need' | 'business_stage' | 'innovation_level' | 'team_size' | 'location' | 'specific_requirements';
  phase: 1 | 2 | 3; // 1: Broad, 2: Specific, 3: Refinement
  conditionalLogic?: QuestionCondition[];
  skipConditions?: QuestionCondition[]; // NEW: Conditions to skip this question
  followUpQuestions?: string[]; // NEW: Questions to ask after this one
  isCoreQuestion?: boolean;
  questionNumber?: number;
  aiGuidance?: string; // AI guidance for the question
  metadata?: {
    programsAffected?: number;
    informationValue?: number;
    decisiveness?: 'HARD' | 'SOFT' | 'UNCERTAIN';
    uxWeight?: number;
    priority?: number;
  };
}

export interface QuestionCondition {
  questionId: string;
  operator: 'equals' | 'contains' | 'not_equals' | 'in' | 'not_in' | 'greater_than' | 'less_than';
  value: any;
  action: 'show' | 'hide' | 'require' | 'optional';
  logic?: 'AND' | 'OR'; // NEW: Support for AND/OR logic
}

export interface EligibilityAnalysis {
  location: Map<string, number>;
  companyAge: Map<number, number>;
  revenue: Map<string, number>;
  teamSize: Map<number, number>;
  researchFocus: Map<string, number>;
  internationalCollaboration: Map<string, number>;
  impact: Map<string, number>;
  documents: Map<string, number>;
  other: Map<string, number>;
}

export interface BranchingRule {
  id: string;
  condition: {
    field: string;
    operator: 'equals' | 'contains' | 'not_equals' | 'in' | 'not_in' | 'greater_than' | 'less_than';
    value: any;
  };
  action: 'show' | 'hide' | 'require' | 'optional';
  targetQuestion: string;
}


// QUESTION ENGINE CLASS
// ============================================================================

export class QuestionEngine {
  private allPrograms: Program[]; // Keep original programs
  private remainingPrograms: Program[]; // Currently matching programs (DYNAMIC)
  private questions: SymptomQuestion[] = [];
  private askedQuestions: string[] = []; // Track which questions we've asked

  constructor(programs: Program[]) {
    this.allPrograms = programs;
    this.remainingPrograms = programs; // Start with all programs
    console.log(`🔄 Initializing QuestionEngine with ${programs.length} programs`);
    
    // DEBUG: Check if programs have eligibility_criteria
    if (programs.length > 0) {
      console.log('🔍 DEBUG: First program sample:', {
        id: programs[0].id,
        name: programs[0].name,
        hasEligibilityCriteria: !!(programs[0] as any).eligibility_criteria,
        eligibilityKeys: programs[0] ? Object.keys((programs[0] as any).eligibility_criteria || {}) : []
      });
      console.log('🔍 DEBUG: Full eligibility_criteria:', (programs[0] as any).eligibility_criteria);
    }
    
    try {
      this.initializeQuestions();
    } catch (error) {
      console.error('❌ Error initializing QuestionEngine:', error);
      console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    }
  }

  /**
   * Analyze eligibility criteria from ALL programs to generate dynamic questions
   */
  private initializeQuestions(): void {
    console.log('🔄 Analyzing eligibility criteria from ALL programs...');
    console.log(`📊 Programs available: ${this.allPrograms.length}`);
    
    // STEP 1: Extract ALL eligibility criteria from programs
    const eligibilityAnalysis = this.analyzeEligibilityCriteria();
    
    // STEP 2: Generate questions based on frequency and importance
    this.generateQuestionsFromEligibilityAnalysis(eligibilityAnalysis);
    
    console.log(`✅ Generated ${this.questions.length} dynamic questions from eligibility criteria`);
  }

  /**
   * Analyze all eligibility criteria from programs
   */
  private analyzeEligibilityCriteria(): EligibilityAnalysis {
    const analysis: EligibilityAnalysis = {
      location: new Map(),
      companyAge: new Map(),
      revenue: new Map(),
      teamSize: new Map(),
      researchFocus: new Map(),
      internationalCollaboration: new Map(),
      impact: new Map(),
      documents: new Map(),
      other: new Map()
    };

    console.log('🔍 Analyzing eligibility criteria from programs...');
    let programsWithCriteria = 0;
    
    for (const program of this.allPrograms) {
      const eligibility = (program as any).eligibility_criteria;
      const categorized = (program as any).categorized_requirements;
      
      if (!eligibility && !categorized) continue;
      programsWithCriteria++;

      // Location analysis
      if (eligibility?.location) {
        const location = eligibility.location.toLowerCase();
        analysis.location.set(location, (analysis.location.get(location) || 0) + 1);
      }

      // Company age analysis
      if (eligibility?.max_company_age) {
        const age = eligibility.max_company_age;
        analysis.companyAge.set(age, (analysis.companyAge.get(age) || 0) + 1);
      }
      
      // Industry focus analysis (from eligibility OR categorized)
      if (eligibility?.industry_focus) {
        const industry = eligibility.industry_focus;
        analysis.other.set(`industry_${industry}`, (analysis.other.get(`industry_${industry}`) || 0) + 1);
      } else if (categorized?.project) {
        const industryReq = categorized.project.find((req: any) => req.type === 'industry_focus');
        if (industryReq) {
          analysis.other.set(`industry_${industryReq.value}`, (analysis.other.get(`industry_${industryReq.value}`) || 0) + 1);
        }
      }

      // Revenue analysis (from eligibility OR categorized)
      if (eligibility?.revenue_min || eligibility?.revenue_max) {
        const revenueRange = `${eligibility.revenue_min || 0}-${eligibility.revenue_max || 'unlimited'}`;
        analysis.revenue.set(revenueRange, (analysis.revenue.get(revenueRange) || 0) + 1);
      } else if (categorized?.financial) {
        const revenueReq = categorized.financial.find((req: any) => req.type === 'revenue_range');
        if (revenueReq && revenueReq.value) {
          const revenueRange = `${revenueReq.value.min || 0}-${revenueReq.value.max || 'unlimited'}`;
          analysis.revenue.set(revenueRange, (analysis.revenue.get(revenueRange) || 0) + 1);
        }
      }

      // Team size analysis (from eligibility OR categorized)
      if (eligibility?.min_team_size) {
        const teamSize = eligibility.min_team_size;
        analysis.teamSize.set(teamSize, (analysis.teamSize.get(teamSize) || 0) + 1);
      } else if (categorized?.team) {
        const teamReq = categorized.team.find((req: any) => req.type === 'min_team_size');
        if (teamReq) {
          analysis.teamSize.set(teamReq.value, (analysis.teamSize.get(teamReq.value) || 0) + 1);
        }
      }

      // Research focus analysis (from eligibility OR categorized)
      if (eligibility?.research_focus) {
        analysis.researchFocus.set('required', (analysis.researchFocus.get('required') || 0) + 1);
      } else if (categorized?.project) {
        const researchReq = categorized.project.find((req: any) => req.type === 'research_focus');
        if (researchReq && researchReq.value) {
          analysis.researchFocus.set('required', (analysis.researchFocus.get('required') || 0) + 1);
        }
      }

      // International collaboration analysis (from eligibility OR categorized)
      if (eligibility?.international_collaboration) {
        analysis.internationalCollaboration.set('required', (analysis.internationalCollaboration.get('required') || 0) + 1);
      } else if (categorized?.consortium) {
        const collabReq = categorized.consortium.find((req: any) => req.type === 'international_collaboration');
        if (collabReq && collabReq.value) {
          analysis.internationalCollaboration.set('required', (analysis.internationalCollaboration.get('required') || 0) + 1);
        }
      }
      
      // Extract project type from categorized (NEW!)
      if (categorized?.project) {
        const projectTypeReq = categorized.project.find((req: any) => req.type === 'project_type');
        if (projectTypeReq) {
          analysis.other.set(`project_${projectTypeReq.value}`, (analysis.other.get(`project_${projectTypeReq.value}`) || 0) + 1);
        }
      }
      
      // Extract innovation level from categorized (NEW!)
      if (categorized?.innovation) {
        const innovationReq = categorized.innovation.find((req: any) => req.type === 'innovation_level');
        if (innovationReq) {
          analysis.other.set(`innovation_${innovationReq.value}`, (analysis.other.get(`innovation_${innovationReq.value}`) || 0) + 1);
        }
      }
      
      // Extract TRL level from categorized (NEW!)
      if (categorized?.technical) {
        const trlReq = categorized.technical.find((req: any) => req.type === 'trl_level');
        if (trlReq) {
          analysis.other.set(`trl_${trlReq.value}`, (analysis.other.get(`trl_${trlReq.value}`) || 0) + 1);
        }
      }
      
      // Extract market stage from categorized (NEW!)
      if (categorized?.market) {
        const marketReq = categorized.market.find((req: any) => req.type === 'market_stage');
        if (marketReq) {
          analysis.other.set(`market_${marketReq.value}`, (analysis.other.get(`market_${marketReq.value}`) || 0) + 1);
        }
      }
      
      // Extract co-financing from categorized (NEW!)
      if (categorized?.financial) {
        const coFinancingReq = categorized.financial.find((req: any) => req.type === 'co_financing');
        if (coFinancingReq) {
          analysis.other.set(`cofinancing_${coFinancingReq.value}`, (analysis.other.get(`cofinancing_${coFinancingReq.value}`) || 0) + 1);
        }
      }
    }

    console.log(`✅ Found ${programsWithCriteria} programs with eligibility criteria`);
    console.log('📊 Analysis results:');
    console.log(`  - Location: ${analysis.location.size} unique values`);
    console.log(`  - Company Age: ${analysis.companyAge.size} unique values`);
    console.log(`  - Revenue: ${analysis.revenue.size} unique values`);
    console.log(`  - Team Size: ${analysis.teamSize.size} unique values`);
    console.log(`  - Research Focus: ${analysis.researchFocus.size} unique values`);
    console.log(`  - International Collaboration: ${analysis.internationalCollaboration.size} unique values`);

    return analysis;
  }

  /**
   * Generate questions from eligibility analysis
   */
  private generateQuestionsFromEligibilityAnalysis(analysis: EligibilityAnalysis): void {
    this.questions = [];

    // Generate all questions first
    const questionCandidates: Array<{question: any, importance: number}> = [];

    // Location question (always most important - major filter)
    if (analysis.location.size > 0) {
      const locationQuestion = this.createLocationQuestion(analysis.location);
      questionCandidates.push({ question: locationQuestion, importance: 100 });
    }

    // Company Age question (high importance - major filter)
    if (analysis.companyAge.size > 0) {
      const companyAgeQuestion = this.createCompanyAgeQuestion(analysis.companyAge);
      const totalPrograms = Array.from(analysis.companyAge.values()).reduce((a, b) => a + b, 0);
      questionCandidates.push({ question: companyAgeQuestion, importance: 90 + (totalPrograms / this.allPrograms.length) * 10 });
    }

    // Revenue question (high importance - major filter)
    if (analysis.revenue.size > 0) {
      const revenueQuestion = this.createRevenueQuestion(analysis.revenue);
      const totalPrograms = Array.from(analysis.revenue.values()).reduce((a, b) => a + b, 0);
      questionCandidates.push({ question: revenueQuestion, importance: 85 + (totalPrograms / this.allPrograms.length) * 10 });
    }

    // Team Size question (medium importance)
    if (analysis.teamSize.size > 0) {
      const teamSizeQuestion = this.createTeamSizeQuestion(analysis.teamSize);
      const totalPrograms = Array.from(analysis.teamSize.values()).reduce((a, b) => a + b, 0);
      questionCandidates.push({ question: teamSizeQuestion, importance: 70 + (totalPrograms / this.allPrograms.length) * 15 });
    }

    // Research Focus question (medium importance)
    if (analysis.researchFocus.size > 0) {
      const researchQuestion = this.createResearchFocusQuestion(analysis.researchFocus);
      const totalPrograms = Array.from(analysis.researchFocus.values()).reduce((a, b) => a + b, 0);
      questionCandidates.push({ question: researchQuestion, importance: 60 + (totalPrograms / this.allPrograms.length) * 20 });
    }

    // International Collaboration question (lower importance)
    if (analysis.internationalCollaboration.size > 0) {
      const collaborationQuestion = this.createInternationalCollaborationQuestion(analysis.internationalCollaboration);
      const totalPrograms = Array.from(analysis.internationalCollaboration.values()).reduce((a, b) => a + b, 0);
      questionCandidates.push({ question: collaborationQuestion, importance: 50 + (totalPrograms / this.allPrograms.length) * 25 });
    }

    // Industry Focus question (from extracted criteria)
    const industryPrograms = Array.from(analysis.other.entries()).filter(([key]) => key.startsWith('industry_'));
    if (industryPrograms.length > 0) {
      const industryQuestion = this.createIndustryFocusQuestion(industryPrograms);
      const totalPrograms = industryPrograms.reduce((sum, [, count]) => sum + count, 0);
      questionCandidates.push({ question: industryQuestion, importance: 55 + (totalPrograms / this.allPrograms.length) * 20 });
    }

    // FALLBACK: If not enough questions from analysis, add standard questions
    if (questionCandidates.length < 3) {
      console.log(`⚠️ Only ${questionCandidates.length} questions from analysis, adding fallback questions`);
      
      // Add standard business questions
      questionCandidates.push({ question: this.createBusinessStageQuestion(), importance: 80 });
      questionCandidates.push({ question: this.createFundingNeedQuestion(), importance: 75 });
      questionCandidates.push({ question: this.createInnovationLevelQuestion(), importance: 70 });
      questionCandidates.push({ question: this.createTeamExperienceQuestion(), importance: 65 });
      questionCandidates.push({ question: this.createMarketQuestion(), importance: 60 });
    }

    // Sort by importance (highest first) and assign question numbers
    questionCandidates
      .sort((a, b) => b.importance - a.importance)
      .forEach((candidate, index) => {
        candidate.question.questionNumber = index + 1;
        this.questions.push(candidate.question);
      });

    console.log(`📊 Question ranking by importance:`);
    questionCandidates.forEach((candidate, index) => {
      console.log(`  ${index + 1}. ${candidate.question.id} (importance: ${candidate.importance.toFixed(1)})`);
    });

    // Ensure entry point is always consistent - Location is always first
    if (this.questions.length > 0 && this.questions[0].id !== 'location') {
      console.log(`⚠️  Warning: Location question is not first! Reordering...`);
      const locationIndex = this.questions.findIndex(q => q.id === 'location');
      if (locationIndex > 0) {
        const locationQuestion = this.questions.splice(locationIndex, 1)[0];
        this.questions.unshift(locationQuestion);
        // Reassign question numbers
        this.questions.forEach((q, index) => {
          q.questionNumber = index + 1;
        });
        console.log(`✅ Reordered: Location is now question 1`);
      }
    }
  }

  /**
   * Create location question from analysis
   */
  private createLocationQuestion(locationMap: Map<string, number>): any {
    const options = Array.from(locationMap.entries())
      .sort(([,a], [,b]) => b - a) // Sort by frequency
      .map(([location, frequency]) => ({
        value: location,
        label: `wizard.options.${location}`,
        description: `${frequency} programs available`,
        fundingTypes: ['grants', 'loans']
      }));

    return {
      id: 'location',
      symptom: 'wizard.questions.location',
      type: 'single-select',
      options,
      required: true,
      category: 'location',
      phase: 1,
      isCoreQuestion: true,
      skipConditions: [] // Location is always asked first
    };
  }

  /**
   * Create company age question from analysis
   */
  private createCompanyAgeQuestion(ageMap: Map<number, number>): any {
    const ageRanges = this.createAgeRanges(ageMap);
    const options = ageRanges.map(range => ({
      value: range.value,
      label: range.label,
      description: `${range.programs} programs available`,
      fundingTypes: ['grants', 'loans']
    }));

    return {
      id: 'company_age',
      symptom: 'wizard.questions.companyAge',
      type: 'single-select',
      options,
      required: true,
      category: 'business_stage',
      phase: 1,
      isCoreQuestion: true,
      // NEW: Only ask this question if we have location context
      skipConditions: [{
        questionId: 'location',
        operator: 'equals',
        value: null,
        action: 'hide'
      }]
    };
  }

  /**
   * Create revenue question from analysis
   */
  private createRevenueQuestion(revenueMap: Map<string, number>): any {
    const revenueRanges = this.createRevenueRanges(revenueMap);
    const options = revenueRanges.map(range => ({
      value: range.value,
      label: range.label,
      description: `${range.programs} programs available`,
      fundingTypes: ['grants', 'loans', 'equity']
    }));

    return {
      id: 'current_revenue',
      symptom: 'wizard.questions.currentRevenue',
      type: 'single-select',
      options,
      required: true,
      category: 'funding_need',
      phase: 1,
      isCoreQuestion: true,
      skipConditions: [] // No skip conditions - can be asked anytime
    };
  }

  /**
   * Create team size question from analysis
   */
  private createTeamSizeQuestion(teamSizeMap: Map<number, number>): any {
    const teamRanges = this.createTeamRanges(teamSizeMap);
    const options = teamRanges.map(range => ({
      value: range.value,
      label: range.label,
      description: `${range.programs} programs available`,
      fundingTypes: ['grants', 'loans']
    }));

    return {
      id: 'team_size',
      symptom: 'wizard.questions.teamSize',
      type: 'single-select',
      options,
      required: true,
      category: 'team_size',
      phase: 1,
      isCoreQuestion: true,
      skipConditions: [] // No skip conditions
    };
  }

  /**
   * Create research focus question from analysis
   */
  private createResearchFocusQuestion(researchMap: Map<string, number>): any {
    const totalPrograms = Array.from(researchMap.values()).reduce((a, b) => a + b, 0);
    const options = [
      {
        value: 'yes',
        label: 'wizard.options.yes',
        description: `${totalPrograms} research programs available`,
        fundingTypes: ['grants']
      },
      {
        value: 'no',
        label: 'wizard.options.no',
        description: 'Commercial/market programs',
        fundingTypes: ['grants', 'loans', 'equity']
      }
    ];

    return {
      id: 'research_focus',
      symptom: 'wizard.questions.researchFocus',
      type: 'single-select',
      options,
      required: true,
      category: 'specific_requirements',
      phase: 2,
      isCoreQuestion: true,
      skipConditions: [] // Can be asked after basics are covered
    };
  }

  /**
   * Create international collaboration question from analysis
   */
  private createInternationalCollaborationQuestion(collaborationMap: Map<string, number>): any {
    const totalPrograms = Array.from(collaborationMap.values()).reduce((a, b) => a + b, 0);
    const options = [
      {
        value: 'yes',
        label: 'wizard.options.yes',
        description: `${totalPrograms} consortium programs available`,
        fundingTypes: ['grants']
      },
      {
        value: 'no',
        label: 'wizard.options.no',
        description: 'Individual application programs',
        fundingTypes: ['grants', 'loans', 'equity']
      }
    ];

    return {
      id: 'international_collaboration',
      symptom: 'wizard.questions.internationalCollaboration',
      type: 'single-select',
      options,
      required: true,
      category: 'specific_requirements',
      phase: 2,
      isCoreQuestion: true
    };
  }

  /**
   * Create age ranges from company age data
   */
  private createAgeRanges(ageMap: Map<number, number>): Array<{value: string, label: string, programs: number}> {
    const ages = Array.from(ageMap.keys()).sort((a, b) => a - b);
    const ranges = [];

    // Create ranges based on actual data
    if (ages.some(age => age <= 2)) {
      ranges.push({ value: 'under_2_years', label: 'wizard.options.under2Years', programs: ages.filter(age => age <= 2).reduce((sum, age) => sum + (ageMap.get(age) || 0), 0) });
    }
    if (ages.some(age => age > 2 && age <= 5)) {
      ranges.push({ value: '2_5_years', label: 'wizard.options.2to5Years', programs: ages.filter(age => age > 2 && age <= 5).reduce((sum, age) => sum + (ageMap.get(age) || 0), 0) });
    }
    if (ages.some(age => age > 5 && age <= 10)) {
      ranges.push({ value: '5_10_years', label: 'wizard.options.5to10Years', programs: ages.filter(age => age > 5 && age <= 10).reduce((sum, age) => sum + (ageMap.get(age) || 0), 0) });
    }
    if (ages.some(age => age > 10)) {
      ranges.push({ value: 'over_10_years', label: 'wizard.options.over10Years', programs: ages.filter(age => age > 10).reduce((sum, age) => sum + (ageMap.get(age) || 0), 0) });
    }

    return ranges;
  }

  /**
   * Create revenue ranges from revenue data
   */
  private createRevenueRanges(revenueMap: Map<string, number>): Array<{value: string, label: string, programs: number}> {
    const ranges = [];
    
    // Analyze revenue ranges and create meaningful options
    for (const [range, count] of revenueMap.entries()) {
      const [min] = range.split('-');
      const minNum = parseInt(min) || 0;
      
      if (minNum < 100000) {
        ranges.push({ value: 'under_100k', label: 'wizard.options.under100k', programs: count });
      } else if (minNum < 500000) {
        ranges.push({ value: '100k_500k', label: 'wizard.options.100kto500k', programs: count });
      } else if (minNum < 2000000) {
        ranges.push({ value: '500k_2m', label: 'wizard.options.500kto2m', programs: count });
      } else {
        ranges.push({ value: 'over_2m', label: 'wizard.options.over2m', programs: count });
      }
    }

    return ranges;
  }

  /**
   * Create team size ranges from team size data
   */
  private createTeamRanges(teamSizeMap: Map<number, number>): Array<{value: string, label: string, programs: number}> {
    const teamSizes = Array.from(teamSizeMap.keys()).sort((a, b) => a - b);
    const ranges = [];

    if (teamSizes.some(size => size <= 2)) {
      ranges.push({ value: '1_2_people', label: 'wizard.options.1to2People', programs: teamSizes.filter(size => size <= 2).reduce((sum, size) => sum + (teamSizeMap.get(size) || 0), 0) });
    }
    if (teamSizes.some(size => size > 2 && size <= 5)) {
      ranges.push({ value: '3_5_people', label: 'wizard.options.3to5People', programs: teamSizes.filter(size => size > 2 && size <= 5).reduce((sum, size) => sum + (teamSizeMap.get(size) || 0), 0) });
    }
    if (teamSizes.some(size => size > 5 && size <= 10)) {
      ranges.push({ value: '6_10_people', label: 'wizard.options.6to10People', programs: teamSizes.filter(size => size > 5 && size <= 10).reduce((sum, size) => sum + (teamSizeMap.get(size) || 0), 0) });
    }
    if (teamSizes.some(size => size > 10)) {
      ranges.push({ value: 'over_10_people', label: 'wizard.options.over10People', programs: teamSizes.filter(size => size > 10).reduce((sum, size) => sum + (teamSizeMap.get(size) || 0), 0) });
    }

    return ranges;
  }

  /**
   * Get first question (for SmartWizard compatibility)
   */
  public async getFirstQuestion(): Promise<SymptomQuestion | null> {
    console.log('🎯 Getting first question...');
    console.log('🎯 Available questions:', this.questions.length);
    const question = await this.getNextQuestionEnhanced({});
    console.log('🎯 First question result:', question ? question.id : 'null');
    return question;
  }

  /**
   * Get next question with enhanced logic - PROGRESSIVE FILTERING
   */
  public async getNextQuestionEnhanced(answers: Record<string, any>): Promise<SymptomQuestion | null> {
    console.log(`🔍 Getting next question from ${Object.keys(answers).length} answers`);
    console.log(`📊 Total programs: ${this.allPrograms.length}`);
    
    // NEW: Calculate remaining programs after filtering AND UPDATE STATE
    this.remainingPrograms = this.applyMajorFilters(answers);
    console.log(`📊 Programs remaining: ${this.remainingPrograms.length} / ${this.allPrograms.length}`);
    
    // NEW: Only stop early if we have ≤10 programs AND answered at least 5 questions
    if (this.remainingPrograms.length <= 10 && Object.keys(answers).length >= 5) {
      console.log(`✅ Only ${this.remainingPrograms.length} programs remain (well narrowed), stopping questions early`);
      return null;
    }
    
    // Check if we should stop asking questions based on match quality
    const shouldStop = await this.shouldStopQuestions(answers);
    if (shouldStop) {
      console.log('✅ Stopping questions due to excellent match quality');
      return null;
    }
    
    console.log('🔍 Continuing with question selection...');
    
    // NEW: Select questions that narrow down the program pool most effectively
    let bestQuestion: SymptomQuestion | null = null;
    let bestQuestionScore = 0;
    
    // Check core questions with smart selection
    for (const question of this.questions) {
      if (!answers[question.id] && !this.askedQuestions.includes(question.id)) {
        // NEW: Check if this question should be shown based on conditional logic
        if (this.shouldShowQuestion(question, answers)) {
          // NEW: Score this question by how well it narrows down programs
          const informationValue = this.calculateInformationValue(question, answers, this.remainingPrograms);
          console.log(`📊 Question ${question.id} score: ${informationValue.toFixed(2)}`);
          
          if (informationValue > bestQuestionScore) {
            bestQuestion = question;
            bestQuestionScore = informationValue;
          }
        }
      }
    }
    
    if (bestQuestion) {
      // Track that we asked this question
      this.askedQuestions.push(bestQuestion.id);
      console.log(`✅ Selected question: ${bestQuestion.id} (score: ${bestQuestionScore.toFixed(2)})`);
      return bestQuestion;
    }
    
    console.log('❌ No more questions to ask');
    return null;
  }

  /**
   * Check if we should stop asking questions
   */
  public async shouldStopQuestions(answers: Record<string, any>): Promise<boolean> {
    const answerCount = Object.keys(answers).length;
    
    // Don't stop if we haven't asked enough questions yet
    if (answerCount < 3) {
      return false;
    }
    
    // If we have 8+ answers, we can stop (reduced from 10)
    if (answerCount >= 8) {
      console.log(`✅ Sufficient answers provided (${answerCount})`);
      return true;
    }
    
    // Check if we have answered all available questions
    const totalQuestions = this.questions.length;
    if (answerCount >= totalQuestions) {
      console.log(`✅ All ${totalQuestions} questions answered`);
      return true;
    }
    
    return false;
  }

  /**
   * Get next question (for SmartWizard compatibility)
   */
  public async getNextQuestion(answers: Record<string, any>): Promise<SymptomQuestion | null> {
    return this.getNextQuestionEnhanced(answers);
  }

  /**
   * Get core questions
   */
  public getCoreQuestions(): SymptomQuestion[] {
    return this.questions.filter(q => q.isCoreQuestion);
  }

  /**
   * Get estimated total questions
   */
  public getEstimatedTotalQuestions(): number {
    return Math.min(this.questions.length, 40);
  }

  /**
   * Get question by ID
   */
  public getQuestionById(id: string): SymptomQuestion | undefined {
    return this.questions.find(q => q.id === id);
  }

  /**
   * Get current remaining program count
   */
  public getRemainingProgramCount(): number {
    return this.remainingPrograms.length;
  }

  /**
   * Apply major filters to programs
   */
  public applyMajorFilters(answers: Record<string, any>): Program[] {
    let filteredPrograms = [...this.allPrograms];
    const initialCount = filteredPrograms.length;
    
    // Location filter
    if (answers.location) {
      const beforeLocation = filteredPrograms.length;
      filteredPrograms = filteredPrograms.filter(program => {
        const eligibility = (program as any).eligibility_criteria;
        
        // If no location criteria, include the program (available to all)
        if (!eligibility || !eligibility.location) return true;
        
        const programLocation = eligibility.location.toLowerCase();
        const userLocation = answers.location.toLowerCase();
        
        // Exact match or broader scope
        if (userLocation === 'austria' && (programLocation === 'austria' || programLocation === 'vienna')) {
          return true;
        }
        if (userLocation === 'eu' && (programLocation === 'eu' || programLocation === 'austria' || programLocation === 'vienna')) {
          return true;
        }
        if (userLocation === 'international' && (programLocation === 'international' || programLocation === 'eu' || programLocation === 'austria' || programLocation === 'vienna')) {
          return true;
        }
        
        return programLocation === userLocation;
      });
      
      console.log(`📊 Location filter (${answers.location}): ${beforeLocation} → ${filteredPrograms.length} programs`);
    }
    
    // Company age filter
    if (answers.company_age) {
      const beforeAge = filteredPrograms.length;
      filteredPrograms = filteredPrograms.filter(program => {
        const eligibility = (program as any).eligibility_criteria;
        if (!eligibility || !eligibility.max_company_age) return true; // No age restriction = available
        
        // Parse the answer to get age in years
        const userAge = this.parseAgeAnswer(answers.company_age);
        const maxAge = eligibility.max_company_age;
        
        return userAge <= maxAge;
      });
      console.log(`📊 Company age filter (${answers.company_age}): ${beforeAge} → ${filteredPrograms.length} programs`);
    }
    
    // Revenue filter
    if (answers.current_revenue) {
      const beforeRevenue = filteredPrograms.length;
      filteredPrograms = filteredPrograms.filter(program => {
        const eligibility = (program as any).eligibility_criteria;
        if (!eligibility || (!eligibility.revenue_min && !eligibility.revenue_max)) return true;
        
        const userRevenue = this.parseRevenueAnswer(answers.current_revenue);
        if (eligibility.revenue_min && userRevenue < eligibility.revenue_min) return false;
        if (eligibility.revenue_max && userRevenue > eligibility.revenue_max) return false;
        
        return true;
      });
      console.log(`📊 Revenue filter (${answers.current_revenue}): ${beforeRevenue} → ${filteredPrograms.length} programs`);
    }
    
    // Team size filter
    if (answers.team_size) {
      const beforeTeam = filteredPrograms.length;
      filteredPrograms = filteredPrograms.filter(program => {
        const eligibility = (program as any).eligibility_criteria;
        if (!eligibility || !eligibility.min_team_size) return true;
        
        const userTeamSize = this.parseTeamSizeAnswer(answers.team_size);
        const minTeamSize = eligibility.min_team_size;
        
        return userTeamSize >= minTeamSize;
      });
      console.log(`📊 Team size filter (${answers.team_size}): ${beforeTeam} → ${filteredPrograms.length} programs`);
    }
    
    console.log(`📊 Total filtering: ${initialCount} → ${filteredPrograms.length} programs`);
    return filteredPrograms;
  }

  /**
   * Get all remaining programs (for final scoring)
   */
  public getRemainingPrograms(): Program[] {
    return this.remainingPrograms;
  }

  private parseAgeAnswer(answer: string): number {
    // Convert answer like 'under_2_years', '2_5_years' to max age
    if (answer.includes('under_2') || answer.includes('2_years')) return 2;
    if (answer.includes('2_5') || answer.includes('5_years')) return 5;
    if (answer.includes('5_10') || answer.includes('10_years')) return 10;
    return 20; // older companies
  }

  private parseRevenueAnswer(answer: string): number {
    // Convert answer to approximate revenue number
    if (answer.includes('under_100')) return 50000;
    if (answer.includes('100k_500')) return 250000;
    if (answer.includes('500k_2m')) return 1000000;
    if (answer.includes('over_2m')) return 5000000;
    return 0;
  }

  private parseTeamSizeAnswer(answer: string): number {
    // Convert answer like '1_2_people', '3_5_people' to min size
    if (answer.includes('1_2') || answer.includes('1-2')) return 1;
    if (answer.includes('3_5') || answer.includes('3-5')) return 3;
    if (answer.includes('6_10') || answer.includes('6-10')) return 6;
    if (answer.includes('over_10')) return 10;
    return 1;
  }

  /**
   * Validate answers
   */
  public validateAnswers(answers: Record<string, any>): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    recommendations: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];
    
    // Validate required questions
    for (const question of this.questions) {
      if (question.required && !answers[question.id]) {
        errors.push(`Required question "${question.symptom}" not answered`);
      }
    }
    
    // Add validation logic here
    if (errors.length === 0) {
      recommendations.push('All required questions answered');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      recommendations
    };
  }

  /**
   * NEW: Check if a question should be shown based on conditional logic
   */
  private shouldShowQuestion(question: SymptomQuestion, answers: Record<string, any>): boolean {
    // If no conditional logic, show the question
    if (!question.skipConditions || question.skipConditions.length === 0) {
      return true;
    }
    
    // Check skip conditions
    for (const condition of question.skipConditions) {
      const answerValue = answers[condition.questionId];
      
      if (!answerValue) {
        continue; // Question hasn't been answered yet, can't skip
      }
      
      // Check if condition matches
      let shouldSkip = false;
      
      if (condition.operator === 'equals' && answerValue === condition.value) {
        shouldSkip = true;
      } else if (condition.operator === 'contains' && 
                 Array.isArray(condition.value) && 
                 condition.value.includes(answerValue)) {
        shouldSkip = true;
      } else if (condition.operator === 'in' && 
                 Array.isArray(condition.value) && 
                 condition.value.includes(answerValue)) {
        shouldSkip = true;
      } else if (condition.operator === 'not_equals' && answerValue !== condition.value) {
        shouldSkip = true;
      } else if (condition.operator === 'not_in' && 
                 Array.isArray(condition.value) && 
                 !condition.value.includes(answerValue)) {
        shouldSkip = true;
      }
      
      if (shouldSkip && condition.action === 'hide') {
        console.log(`🚫 Skipping question ${question.id} due to condition: ${condition.questionId} ${condition.operator} ${condition.value}`);
        return false;
      }
    }
    
    return true;
  }

  /**
   * NEW: Calculate information value - how much does this question narrow down the program pool?
   */
  private calculateInformationValue(
    question: SymptomQuestion,
    answers: Record<string, any>,
    remainingPrograms: Program[]
  ): number {
    // Base score starts with question phase (earlier questions are more valuable)
    let score = (4 - question.phase) * 30; // Phase 1 = 90, Phase 2 = 60, Phase 3 = 30
    
    // Check how many programs have requirements for this question's category
    let relevantPrograms = 0;
    
    for (const program of remainingPrograms) {
      const eligibility = (program as any).eligibility_criteria;
      
      if (!eligibility) {
        relevantPrograms += 0.1; // No requirements = less relevant
        continue;
      }
      
      // Check if this question is relevant to this program
      let isRelevant = false;
      
      switch (question.category) {
        case 'location':
          if (eligibility.location) isRelevant = true;
          break;
        case 'business_stage':
          if (eligibility.max_company_age || eligibility.min_company_age) isRelevant = true;
          break;
        case 'funding_need':
          if (eligibility.revenue_min || eligibility.revenue_max) isRelevant = true;
          break;
        case 'team_size':
          if (eligibility.min_team_size || eligibility.max_team_size) isRelevant = true;
          break;
        case 'specific_requirements':
          if (eligibility.research_focus || eligibility.international_collaboration) isRelevant = true;
          break;
        case 'innovation_level':
          if (eligibility.industry_focus || eligibility.research_focus) isRelevant = true;
          break;
        default:
          isRelevant = true; // Default to relevant
      }
      
      if (isRelevant) {
        relevantPrograms++;
      }
    }
    
    // Higher score if question is relevant to many programs
    const relevanceScore = (relevantPrograms / remainingPrograms.length) * 50;
    score += relevanceScore;
    
    // Penalize if we already answered similar questions (avoid redundant questions)
    const similarAnswers = Object.keys(answers).filter(key => {
      const keyCategory = question.category;
      const answerCategory = this.getQuestionCategory(key);
      return keyCategory === answerCategory;
    });
    
    if (similarAnswers.length > 0) {
      score -= similarAnswers.length * 10;
    }
    
    // Boost score for core questions
    if (question.isCoreQuestion) {
      score += 20;
    }
    
    // Penalize if we have enough answers already (encourage stopping)
    const answerCount = Object.keys(answers).length;
    if (answerCount >= 8) {
      score *= 0.5; // Reduce score significantly after 8 answers
    }
    
    return Math.max(0, score);
  }

  /**
   * NEW: Get question category from question ID (helper for similarity checking)
   */
  private getQuestionCategory(questionId: string): string {
    if (questionId === 'location') return 'location';
    if (questionId.includes('age') || questionId.includes('stage')) return 'business_stage';
    if (questionId.includes('revenue') || questionId.includes('funding')) return 'funding_need';
    if (questionId.includes('team') || questionId.includes('size')) return 'team_size';
    if (questionId.includes('research') || questionId.includes('innovation')) return 'innovation_level';
    return 'specific_requirements';
  }

  /**
   * Create fallback business stage question
   */
  private createBusinessStageQuestion(): SymptomQuestion {
    return {
      id: 'business_stage',
      symptom: 'wizard.questions.businessStage',
      type: 'single-select',
      options: [
        { label: 'wizard.options.idea', value: 'idea' },
        { label: 'wizard.options.mvp', value: 'mvp' },
        { label: 'wizard.options.revenue', value: 'revenue' },
        { label: 'wizard.options.scaling', value: 'scaling' }
      ],
      required: true,
      category: 'business_stage',
      phase: 1,
      questionNumber: 0
    };
  }

  /**
   * Create fallback funding need question
   */
  private createFundingNeedQuestion(): SymptomQuestion {
    return {
      id: 'funding_need',
      symptom: 'wizard.questions.fundingNeed',
      type: 'single-select',
      options: [
        { label: 'wizard.options.seed', value: 'seed' },
        { label: 'wizard.options.growth', value: 'growth' },
        { label: 'wizard.options.expansion', value: 'expansion' },
        { label: 'wizard.options.research', value: 'research' }
      ],
      required: true,
      category: 'funding_need',
      phase: 1,
      questionNumber: 0
    };
  }

  /**
   * Create fallback innovation level question
   */
  private createInnovationLevelQuestion(): SymptomQuestion {
    return {
      id: 'innovation_level',
      symptom: 'wizard.questions.innovationLevel',
      type: 'single-select',
      options: [
        { label: 'wizard.options.breakthrough', value: 'breakthrough' },
        { label: 'wizard.options.incremental', value: 'incremental' },
        { label: 'wizard.options.improvement', value: 'improvement' },
        { label: 'wizard.options.standard', value: 'standard' }
      ],
      required: true,
      category: 'innovation_level',
      phase: 2,
      questionNumber: 0
    };
  }

  /**
   * Create fallback team experience question
   */
  private createTeamExperienceQuestion(): SymptomQuestion {
    return {
      id: 'team_experience',
      symptom: 'wizard.questions.teamExperience',
      type: 'single-select',
      options: [
        { label: 'wizard.options.experienced', value: 'experienced' },
        { label: 'wizard.options.moderate', value: 'moderate' },
        { label: 'wizard.options.junior', value: 'junior' },
        { label: 'wizard.options.new', value: 'new' }
      ],
      required: true,
      category: 'team_size',
      phase: 2,
      questionNumber: 0
    };
  }

  /**
   * Create fallback market question
   */
  private createMarketQuestion(): SymptomQuestion {
    return {
      id: 'market_focus',
      symptom: 'wizard.questions.marketFocus',
      type: 'single-select',
      options: [
        { label: 'wizard.options.local', value: 'local' },
        { label: 'wizard.options.national', value: 'national' },
        { label: 'wizard.options.european', value: 'european' },
        { label: 'wizard.options.global', value: 'global' }
      ],
      required: true,
      category: 'specific_requirements',
      phase: 3,
      questionNumber: 0
    };
  }

  /**
   * Create industry focus question from extracted criteria
   */
  private createIndustryFocusQuestion(industryPrograms: [string, number][]): SymptomQuestion {
    const options = industryPrograms.map(([key, count]) => {
      const industry = key.replace('industry_', '');
      return {
        label: `wizard.options.${industry}`,
        value: industry,
        description: `${count} programs available`
      };
    });

    return {
      id: 'industry_focus',
      symptom: 'wizard.questions.industryFocus',
      type: 'single-select',
      options: options,
      required: true,
      category: 'specific_requirements',
      phase: 2,
      questionNumber: 0
    };
  }
}