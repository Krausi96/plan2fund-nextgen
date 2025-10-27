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
  private programs: Program[];
  private questions: SymptomQuestion[] = [];
  private overlayQuestions: SymptomQuestion[] = [];

  constructor(programs: Program[]) {
    this.programs = programs;
    console.log(`🔄 Initializing QuestionEngine with ${programs.length} programs`);
    
    try {
      this.initializeQuestions();
      this.initializeOverlayQuestions();
    } catch (error) {
      console.error('❌ Error initializing QuestionEngine:', error);
      console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    }
    this.loadBranchingRules();
  }

  /**
   * Analyze eligibility criteria from ALL programs to generate dynamic questions
   */
  private initializeQuestions(): void {
    console.log('🔄 Analyzing eligibility criteria from ALL programs...');
    console.log(`📊 Programs available: ${this.programs.length}`);
    
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
    
    for (const program of this.programs) {
      const eligibility = (program as any).eligibility_criteria;
      if (!eligibility) continue;
      programsWithCriteria++;

      // Location analysis
      if (eligibility.location) {
        const location = eligibility.location.toLowerCase();
        analysis.location.set(location, (analysis.location.get(location) || 0) + 1);
      }

      // Company age analysis
      if (eligibility.max_company_age) {
        const age = eligibility.max_company_age;
        analysis.companyAge.set(age, (analysis.companyAge.get(age) || 0) + 1);
      }
      
      // Industry focus analysis
      if (eligibility.industry_focus) {
        const industry = eligibility.industry_focus;
        analysis.other.set(`industry_${industry}`, (analysis.other.get(`industry_${industry}`) || 0) + 1);
      }

      // Revenue analysis
      if (eligibility.revenue_min || eligibility.revenue_max) {
        const revenueRange = `${eligibility.revenue_min || 0}-${eligibility.revenue_max || 'unlimited'}`;
        analysis.revenue.set(revenueRange, (analysis.revenue.get(revenueRange) || 0) + 1);
      }

      // Team size analysis
      if (eligibility.min_team_size) {
        const teamSize = eligibility.min_team_size;
        analysis.teamSize.set(teamSize, (analysis.teamSize.get(teamSize) || 0) + 1);
      }

      // Research focus analysis
      if (eligibility.research_focus) {
        analysis.researchFocus.set('required', (analysis.researchFocus.get('required') || 0) + 1);
      }

      // International collaboration analysis
      if (eligibility.international_collaboration) {
        analysis.internationalCollaboration.set('required', (analysis.internationalCollaboration.get('required') || 0) + 1);
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
      questionCandidates.push({ question: companyAgeQuestion, importance: 90 + (totalPrograms / this.programs.length) * 10 });
    }

    // Revenue question (high importance - major filter)
    if (analysis.revenue.size > 0) {
      const revenueQuestion = this.createRevenueQuestion(analysis.revenue);
      const totalPrograms = Array.from(analysis.revenue.values()).reduce((a, b) => a + b, 0);
      questionCandidates.push({ question: revenueQuestion, importance: 85 + (totalPrograms / this.programs.length) * 10 });
    }

    // Team Size question (medium importance)
    if (analysis.teamSize.size > 0) {
      const teamSizeQuestion = this.createTeamSizeQuestion(analysis.teamSize);
      const totalPrograms = Array.from(analysis.teamSize.values()).reduce((a, b) => a + b, 0);
      questionCandidates.push({ question: teamSizeQuestion, importance: 70 + (totalPrograms / this.programs.length) * 15 });
    }

    // Research Focus question (medium importance)
    if (analysis.researchFocus.size > 0) {
      const researchQuestion = this.createResearchFocusQuestion(analysis.researchFocus);
      const totalPrograms = Array.from(analysis.researchFocus.values()).reduce((a, b) => a + b, 0);
      questionCandidates.push({ question: researchQuestion, importance: 60 + (totalPrograms / this.programs.length) * 20 });
    }

    // International Collaboration question (lower importance)
    if (analysis.internationalCollaboration.size > 0) {
      const collaborationQuestion = this.createInternationalCollaborationQuestion(analysis.internationalCollaboration);
      const totalPrograms = Array.from(analysis.internationalCollaboration.values()).reduce((a, b) => a + b, 0);
      questionCandidates.push({ question: collaborationQuestion, importance: 50 + (totalPrograms / this.programs.length) * 25 });
    }

    // Industry Focus question (from extracted criteria)
    const industryPrograms = Array.from(analysis.other.entries()).filter(([key]) => key.startsWith('industry_'));
    if (industryPrograms.length > 0) {
      const industryQuestion = this.createIndustryFocusQuestion(industryPrograms);
      const totalPrograms = industryPrograms.reduce((sum, [, count]) => sum + count, 0);
      questionCandidates.push({ question: industryQuestion, importance: 55 + (totalPrograms / this.programs.length) * 20 });
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
      isCoreQuestion: true
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
      isCoreQuestion: true
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
      isCoreQuestion: true
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
      isCoreQuestion: true
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
      isCoreQuestion: true
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
    console.log('🎯 Available overlay questions:', this.overlayQuestions.length);
    const question = await this.getNextQuestionEnhanced({});
    console.log('🎯 First question result:', question ? question.id : 'null');
    return question;
  }

  /**
   * Get next question with enhanced logic
   */
  public async getNextQuestionEnhanced(answers: Record<string, any>): Promise<SymptomQuestion | null> {
    console.log(`🔍 Getting next question from ${Object.keys(answers).length} answers`);
    console.log(`📊 Available programs: ${this.programs.length}`);
    console.log(`📊 Core questions: ${this.questions.length}`);
    console.log(`📊 Overlay questions: ${this.overlayQuestions.length}`);
    
    // Check if we should stop asking questions based on match quality
    const shouldStop = await this.shouldStopQuestions(answers);
    if (shouldStop) {
      console.log('✅ Stopping questions due to excellent match quality');
      return null;
    }
    
    console.log('🔍 Continuing with question selection...');
    
    // Check core questions first
    for (const question of this.questions) {
      if (!answers[question.id]) {
        console.log(`✅ Found unanswered core question: ${question.id}`);
        return question;
      }
    }
    
    // Check overlay questions
    for (const question of this.overlayQuestions) {
      if (!answers[question.id]) {
        console.log(`✅ Found unanswered overlay question: ${question.id}`);
        return question;
      }
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
    const totalQuestions = this.questions.length + this.overlayQuestions.length;
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
   * Initialize overlay questions
   */
  public async initializeOverlayQuestions(): Promise<void> {
    // Initialize overlay questions from program data
    this.overlayQuestions = [];
    console.log('✅ Overlay questions initialized');
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
    return Math.min(this.questions.length + this.overlayQuestions.length, 40);
  }

  /**
   * Get question by ID
   */
  public getQuestionById(id: string): SymptomQuestion | undefined {
    const allQuestions = [...this.questions, ...this.overlayQuestions];
    return allQuestions.find(q => q.id === id);
  }

  /**
   * Apply major filters to programs
   */
  public applyMajorFilters(answers: Record<string, any>): Program[] {
    let filteredPrograms = [...this.programs];
    
    // Location filter
    if (answers.location) {
      filteredPrograms = filteredPrograms.filter(program => {
        const eligibility = (program as any).eligibility_criteria;
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
    }
    
    console.log(`📊 Major filters applied: ${this.programs.length} → ${filteredPrograms.length} programs`);
    return filteredPrograms;
  }

  /**
   * Generate contextual questions
   */
  public generateContextualQuestions(answers: Record<string, any>): SymptomQuestion[] {
    // Return overlay questions that haven't been answered yet
    return this.overlayQuestions.filter(q => !answers[q.id]);
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
   * Load branching rules
   */
  private loadBranchingRules(): void {
    console.log('📋 Branching rules loaded');
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