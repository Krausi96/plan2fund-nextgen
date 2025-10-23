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

export interface BranchingRule {
  id: string;
  condition: {
    field: string;
    operator: 'equals' | 'contains' | 'not_equals' | 'in' | 'not_in' | 'greater_than' | 'less_than';
    value: any;
  };
  effect: {
    type: 'hide_products_with_types' | 'show_at_national' | 'boost_tags';
    value: any;
  };
}

export interface ProgramFilteringEffects {
  hideProductsWithTypes?: string[];
  showAtNational?: boolean;
  boostTags?: string[];
}

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
      const hasFinancialData = /\d+[\s,]*[€|\$|euro|dollar]/i.test(content);
      return hasFinancialData ? true : 'Missing financial data - include budget, costs, and revenue projections';
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
    id: 'financial_data_consistency',
    fields: ['budget_total', 'cost_breakdown', 'revenue_projection'],
    validate: (data: Record<string, any>) => {
      const budgetTotal = parseFloat(data.budget_total) || 0;
      const costBreakdown = parseFloat(data.cost_breakdown) || 0;
      
      if (budgetTotal > 0 && costBreakdown > 0 && Math.abs(budgetTotal - costBreakdown) > budgetTotal * 0.1) {
        return 'Budget total and cost breakdown do not match (difference > 10%)';
      }
      return true;
    }
  },
  {
    id: 'team_size_appropriateness',
    fields: ['team_size', 'project_scope'],
    validate: (data: Record<string, any>) => {
      const teamSize = parseInt(data.team_size) || 0;
      const projectScope = data.project_scope?.toLowerCase() || '';
      
      if (teamSize > 50 && projectScope.includes('small')) {
        return 'Team size seems too large for a small project scope';
      }
      if (teamSize < 3 && projectScope.includes('large')) {
        return 'Team size seems too small for a large project scope';
      }
      return true;
    }
  },
  {
    id: 'timeline_realism',
    fields: ['project_duration', 'milestones'],
    validate: (data: Record<string, any>) => {
      const duration = parseInt(data.project_duration) || 0;
      const milestones = data.milestones || '';
      
      if (duration < 6 && milestones.includes('research')) {
        return 'Research projects typically require at least 6 months';
      }
      if (duration > 36 && !milestones.includes('commercialization')) {
        return 'Long projects should include commercialization milestones';
      }
      return true;
    }
  },
  {
    id: 'consortium_size_appropriateness',
    fields: ['consortium_partners', 'project_type'],
    validate: (data: Record<string, any>) => {
      const partners = data.consortium_partners || '';
      const projectType = data.project_type?.toLowerCase() || '';
      
      if (partners.includes(',')) {
        const partnerCount = partners.split(',').length;
        if (partnerCount > 20) {
          return 'Too many consortium partners (typically 2-8 partners)';
        }
        if (partnerCount < 2 && projectType.includes('collaborative')) {
          return 'Collaborative projects typically require at least 2 partners';
        }
      }
      
      if (projectType.includes('consortium') && !partners) {
        return 'Consortium projects require partner information';
      }
      
      return true;
    }
  }
];

// ============================================================================
// QUESTION ENGINE CLASS
// ============================================================================

export class QuestionEngine {
  private programs: Program[];
  private questions: SymptomQuestion[] = [];
  private overlayQuestions: SymptomQuestion[] = [];

  constructor(programs: Program[]) {
    this.programs = programs;
    this.initializeQuestions();
    this.loadBranchingRules();
  }

  /**
   * Initialize DYNAMIC core questions based on actual program data
   */
  private initializeQuestions(): void {
    console.log('🔄 Generating DYNAMIC core questions from program data...');
    
    // Analyze program data to generate core questions
    const programTypes = new Set(this.programs.map(p => p.type || (p as any).program_type));
    const fundingAmounts = this.programs
      .map(p => (p as any).funding_amount_max || (p as any).funding_amount || (p as any).maxAmount || 0)
      .filter(amount => amount > 0);
    
    this.questions = [];
    
    // Core Question 1: Funding Type (based on actual program types)
    if (programTypes.size > 0) {
      this.questions.push({
        id: 'funding_type',
        symptom: 'wizard.questions.fundingType',
        type: 'single-select',
        options: Array.from(programTypes).map(type => ({
          value: type,
          label: `wizard.options.${type}`,
          fundingTypes: [type]
        })),
        required: true,
        category: 'funding_need',
        phase: 1,
        isCoreQuestion: true
      });
    }
    
    // Core Question 2: Organization Type (based on program descriptions)
    const hasStartupPrograms = this.programs.some(p => 
      (p as any).description?.toLowerCase().includes('startup') ||
      (p as any).description?.toLowerCase().includes('gründer')
    );
    const hasSMEPrograms = this.programs.some(p => 
      (p as any).description?.toLowerCase().includes('kmu') ||
      (p as any).description?.toLowerCase().includes('sme')
    );
    const hasResearchPrograms = this.programs.some(p => 
      (p as any).description?.toLowerCase().includes('research') ||
      (p as any).description?.toLowerCase().includes('forschung')
    );
    
    if (hasStartupPrograms || hasSMEPrograms || hasResearchPrograms) {
      const orgOptions = [];
      if (hasStartupPrograms) orgOptions.push({ value: 'startup', label: 'wizard.options.startup', fundingTypes: ['grants', 'equity'] });
      if (hasSMEPrograms) orgOptions.push({ value: 'sme', label: 'wizard.options.sme', fundingTypes: ['grants', 'loans', 'equity'] });
      if (hasResearchPrograms) orgOptions.push({ value: 'research', label: 'wizard.options.research', fundingTypes: ['grants'] });
      orgOptions.push({ value: 'large', label: 'wizard.options.large', fundingTypes: ['loans', 'equity'] });
      
      this.questions.push({
        id: 'organization_type',
        symptom: 'wizard.questions.organizationType',
        type: 'single-select',
        options: orgOptions,
        required: true,
        category: 'specific_requirements',
        phase: 1,
        isCoreQuestion: true
      });
    }
    
    // Core Question 3: Funding Amount (based on actual funding ranges)
    if (fundingAmounts.length > 0) {
      const maxAmount = Math.max(...fundingAmounts);
      const minAmount = Math.min(...fundingAmounts);
      
      // Create dynamic funding amount ranges based on actual data
      const amountOptions = [];
      
      if (minAmount < 50000) {
        amountOptions.push({ 
          value: 'under_50k', 
          label: `wizard.options.under50k (€0 - €50,000)`, 
          fundingTypes: ['grants', 'loans'] 
        });
      }
      
      if (maxAmount >= 50000) {
        amountOptions.push({ 
          value: '50k_100k', 
          label: `wizard.options.50k100k (€50,000 - €100,000)`, 
          fundingTypes: ['grants', 'loans', 'equity'] 
        });
      }
      
      if (maxAmount >= 100000) {
        amountOptions.push({ 
          value: '100k_500k', 
          label: `wizard.options.100k500k (€100,000 - €500,000)`, 
          fundingTypes: ['grants', 'loans', 'equity'] 
        });
      }
      
      if (maxAmount >= 500000) {
        amountOptions.push({ 
          value: 'over_500k', 
          label: `wizard.options.over500k (€500,000+)`, 
          fundingTypes: ['loans', 'equity'] 
        });
      }
      
      if (amountOptions.length > 0) {
        this.questions.push({
          id: 'funding_amount',
          symptom: 'wizard.questions.fundingAmount',
          type: 'single-select',
          options: amountOptions,
          required: true,
          category: 'specific_requirements',
          phase: 1,
          isCoreQuestion: true
        });
      }
    }
    
    // Core Question 4: Business Stage (based on program focus)
    const hasEarlyStagePrograms = this.programs.some(p => 
      (p as any).description?.toLowerCase().includes('idea') ||
      (p as any).description?.toLowerCase().includes('concept') ||
      (p as any).description?.toLowerCase().includes('startup')
    );
    const hasGrowthPrograms = this.programs.some(p => 
      (p as any).description?.toLowerCase().includes('growth') ||
      (p as any).description?.toLowerCase().includes('scale') ||
      (p as any).description?.toLowerCase().includes('expansion')
    );
    
    if (hasEarlyStagePrograms || hasGrowthPrograms) {
      const stageOptions = [];
      if (hasEarlyStagePrograms) {
        stageOptions.push({ value: 'just_idea', label: 'wizard.options.conceptPhase', fundingTypes: ['grants', 'equity'] });
        stageOptions.push({ value: 'building', label: 'wizard.options.developmentPhase', fundingTypes: ['grants', 'equity', 'loans'] });
      }
      stageOptions.push({ value: 'selling', label: 'wizard.options.marketEntry', fundingTypes: ['loans', 'grants', 'equity'] });
      if (hasGrowthPrograms) {
        stageOptions.push({ value: 'growing', label: 'wizard.options.growthPhase', fundingTypes: ['loans', 'equity'] });
      }
      
      this.questions.push({
        id: 'business_stage',
        symptom: 'wizard.questions.businessStage',
        type: 'single-select',
        options: stageOptions,
        required: true,
        category: 'business_stage',
        phase: 1,
        isCoreQuestion: true
      });
    }
    
    // Core Question 5: Main Goal (based on program purposes)
    const hasInnovationPrograms = this.programs.some(p => 
      (p as any).description?.toLowerCase().includes('innovation') ||
      (p as any).description?.toLowerCase().includes('technology')
    );
    const hasMarketPrograms = this.programs.some(p => 
      (p as any).description?.toLowerCase().includes('market') ||
      (p as any).description?.toLowerCase().includes('commercial')
    );
    
    if (hasInnovationPrograms || hasMarketPrograms) {
      const goalOptions = [];
      if (hasInnovationPrograms) {
        goalOptions.push({ value: 'develop_tech', label: 'wizard.options.developTech', fundingTypes: ['grants', 'equity'] });
      }
      goalOptions.push({ value: 'launch_product', label: 'wizard.options.launchProduct', fundingTypes: ['grants', 'equity'] });
      if (hasMarketPrograms) {
        goalOptions.push({ value: 'expand_market', label: 'wizard.options.expandMarket', fundingTypes: ['loans', 'grants'] });
      }
      goalOptions.push({ value: 'hire_team', label: 'wizard.options.hireTeam', fundingTypes: ['grants', 'loans'] });
      
      this.questions.push({
        id: 'main_goal',
        symptom: 'wizard.questions.mainGoal',
        type: 'single-select',
        options: goalOptions,
        required: true,
        category: 'funding_need',
        phase: 1,
        isCoreQuestion: true
      });
    }
    
    console.log(`✅ Generated ${this.questions.length} DYNAMIC core questions from ${this.programs.length} programs`);
  }

  /**
   * Compute overlay questions from program data
   */
  public async computeOverlayQuestions(): Promise<void> {
    console.log('🔄 Computing overlay questions from program data...');
    
    // Filter out error pages and low-quality programs
    const validPrograms = this.programs.filter(program => {
      // Filter out error pages
      const isErrorPage = program.name?.toLowerCase().includes('not found') ||
                         program.name?.toLowerCase().includes('error') ||
                         program.name?.toLowerCase().includes('newsletter') ||
                         program.name?.toLowerCase().includes('bad gateway') ||
                         (program as any).description?.toLowerCase().includes('seite wurde nicht gefunden');
      
      // Filter out programs without meaningful categorized_requirements
      const hasValidRequirements = program.categorized_requirements && 
        Object.values(program.categorized_requirements).some(category => 
          (Array.isArray(category) && category.length > 0) ||
          (typeof category === 'object' && category !== null && 'evidence' in category && Array.isArray(category.evidence) && category.evidence.length > 0)
        );
      
      return !isErrorPage && hasValidRequirements;
    });
    
    console.log(`📊 Filtered programs: ${this.programs.length} → ${validPrograms.length} valid programs`);
    
    // Debug: Log valid programs with their categorized_requirements
    validPrograms.forEach((program, index) => {
      if (index < 5) { // Log first 5 programs for debugging
        console.log(`🔍 Program ${index + 1}: ${program.name}`, {
          hasCategorizedRequirements: !!program.categorized_requirements,
          categorizedRequirementsKeys: program.categorized_requirements ? Object.keys(program.categorized_requirements) : [],
          categorizedRequirements: program.categorized_requirements
        });
      }
    });
    
    // Debug: Count programs with categorized_requirements
    const programsWithRequirements = validPrograms.filter(p => p.categorized_requirements);
    console.log(`📊 Programs with categorized_requirements: ${programsWithRequirements.length}/${validPrograms.length}`);
    
    // Performance optimization for large datasets
    const maxProgramsToProcess = Math.min(validPrograms.length, 100);
    const programsToProcess = validPrograms.slice(0, maxProgramsToProcess);
    
    if (validPrograms.length > 100) {
      console.log(`⚠️ Large dataset detected (${validPrograms.length} programs). Processing first 100 for performance.`);
    }

    const overlayQuestions: SymptomQuestion[] = [];
    
    for (const program of programsToProcess) {
      if (program.categorized_requirements) {
        const questions = this.generateQuestionsFromCategorizedRequirements(program);
        if (questions.length > 0) {
          console.log(`✅ Generated ${questions.length} questions from program: ${program.name}`);
        }
        overlayQuestions.push(...questions);
      }
    }
    
    // Remove duplicates and sort by priority
    this.overlayQuestions = this.deduplicateQuestions(overlayQuestions);
    
    // FALLBACK: If no overlay questions were generated, create some basic ones
    if (this.overlayQuestions.length === 0) {
      console.log('⚠️ No overlay questions generated, creating fallback questions...');
      this.overlayQuestions = this.generateFallbackQuestions();
    }
    
    console.log(`✅ Computed ${this.overlayQuestions.length} overlay questions from ${programsToProcess.length} programs`);
    
    if (validPrograms.length > 50) {
      console.log(`📊 Performance metrics:`, {
        totalPrograms: this.programs.length,
        validPrograms: validPrograms.length,
        processedPrograms: programsToProcess.length,
        generatedQuestions: overlayQuestions.length,
        finalQuestions: this.overlayQuestions.length,
        efficiency: `${Math.round((this.overlayQuestions.length / programsToProcess.length) * 100)}%`
      });
    }
  }

  /**
   * Generate DYNAMIC fallback questions based on actual program data
   */
  private generateFallbackQuestions(): SymptomQuestion[] {
    console.log('🔄 Generating DYNAMIC fallback questions from program data...');
    
    const questions: SymptomQuestion[] = [];
    
    // Analyze programs to generate questions dynamically
    const programTypes = new Set(this.programs.map(p => p.type || (p as any).program_type));
    const institutions = new Set(this.programs.map(p => (p as any).institution));
    const fundingAmounts = this.programs
      .map(p => (p as any).funding_amount_max || (p as any).funding_amount || (p as any).maxAmount || 0)
      .filter(amount => amount > 0);
    
    // Question 1: Funding type based on actual program types
    if (programTypes.size > 1) {
      questions.push({
        id: 'preferred_funding_type',
        symptom: 'wizard.questions.preferredFundingType',
        type: 'single-select',
        options: Array.from(programTypes).map(type => ({
          value: type,
          label: `wizard.options.${type}`,
          fundingTypes: [type]
        })),
        required: false,
        category: 'funding_need',
        phase: 2,
        isCoreQuestion: false
      });
    }
    
    // Question 2: Institution preference based on actual institutions
    if (institutions.size > 1) {
      questions.push({
        id: 'preferred_institution',
        symptom: 'wizard.questions.preferredInstitution',
        type: 'single-select',
        options: Array.from(institutions).slice(0, 4).map(institution => ({
          value: institution.toLowerCase().replace(/\s+/g, '_'),
          label: institution,
          fundingTypes: ['grants', 'loans', 'equity']
        })),
        required: false,
        category: 'specific_requirements',
        phase: 2,
        isCoreQuestion: false
      });
    }
    
    // Question 3: Project scope based on funding amounts
    if (fundingAmounts.length > 0) {
      const maxAmount = Math.max(...fundingAmounts);
      const minAmount = Math.min(...fundingAmounts);
      
      if (maxAmount > minAmount) {
        questions.push({
          id: 'project_scope',
          symptom: 'wizard.questions.projectScope',
          type: 'single-select',
          options: [
            { 
              value: 'small_scale', 
              label: `wizard.options.smallScale (€0 - €${Math.round(minAmount).toLocaleString()})`, 
              fundingTypes: ['grants'] 
            },
            { 
              value: 'medium_scale', 
              label: `wizard.options.mediumScale (€${Math.round(minAmount).toLocaleString()} - €${Math.round(maxAmount/2).toLocaleString()})`, 
              fundingTypes: ['grants', 'loans'] 
            },
            { 
              value: 'large_scale', 
              label: `wizard.options.largeScale (€${Math.round(maxAmount/2).toLocaleString()}+)`, 
              fundingTypes: ['loans', 'equity'] 
            }
          ],
          required: false,
          category: 'specific_requirements',
          phase: 2,
          isCoreQuestion: false
        });
      }
    }
    
    // Question 4: Innovation level based on program descriptions
    const hasInnovationPrograms = this.programs.some(p => 
      (p as any).description?.toLowerCase().includes('innovation') || 
      (p as any).description?.toLowerCase().includes('research') ||
      (p as any).description?.toLowerCase().includes('technology')
    );
    
    if (hasInnovationPrograms) {
      questions.push({
        id: 'innovation_level',
        symptom: 'wizard.questions.innovationLevel',
        type: 'single-select',
        options: [
          { value: 'basic', label: 'wizard.options.basicInnovation', fundingTypes: ['grants'] },
          { value: 'advanced', label: 'wizard.options.advancedInnovation', fundingTypes: ['grants', 'loans'] },
          { value: 'cutting_edge', label: 'wizard.options.cuttingEdgeInnovation', fundingTypes: ['grants', 'equity'] }
        ],
        required: false,
        category: 'innovation_level',
        phase: 2,
        isCoreQuestion: false
      });
    }
    
    // Question 5: Geographic focus based on source URLs
    const hasInternationalPrograms = this.programs.some(p => 
      (p as any).source_url?.includes('ec.europa.eu') || 
      (p as any).source_url?.includes('european') ||
      (p as any).description?.toLowerCase().includes('international')
    );
    
    if (hasInternationalPrograms) {
      questions.push({
        id: 'geographic_focus',
        symptom: 'wizard.questions.geographicFocus',
        type: 'single-select',
        options: [
          { value: 'local', label: 'wizard.options.localFocus', fundingTypes: ['grants', 'loans'] },
          { value: 'national', label: 'wizard.options.nationalFocus', fundingTypes: ['grants', 'loans'] },
          { value: 'international', label: 'wizard.options.internationalFocus', fundingTypes: ['grants', 'loans', 'equity'] }
        ],
        required: false,
        category: 'specific_requirements',
        phase: 2,
        isCoreQuestion: false
      });
    }
    
    console.log(`✅ Generated ${questions.length} DYNAMIC fallback questions from ${this.programs.length} programs`);
    return questions;
  }

  /**
   * Generate questions from categorized requirements
   */
  private generateQuestionsFromCategorizedRequirements(program: Program): SymptomQuestion[] {
    const questions: SymptomQuestion[] = [];
    
    if (!program.categorized_requirements) {
      console.log(`⚠️ No categorized_requirements for program: ${program.name}`);
      return questions;
    }
    
    const categories = program.categorized_requirements;
    console.log(`🔍 Processing categories for ${program.name}:`, Object.keys(categories));
    
    // Map categories to question types
    const categoryMappings = {
      'co_financing': {
        symptom: 'wizard.questions.coFinancing',
        type: 'boolean' as const,
        options: [
          { value: 'yes', label: 'wizard.options.yesCoFinancing' },
          { value: 'no', label: 'wizard.options.noCoFinancing' }
        ]
      },
      'trl_level': {
        symptom: 'wizard.questions.trlLevel',
        type: 'single-select' as const,
        options: [
          { value: '1-3', label: 'wizard.options.trl13' },
          { value: '4-6', label: 'wizard.options.trl46' },
          { value: '7-9', label: 'wizard.options.trl79' }
        ]
      },
      'impact': {
        symptom: 'wizard.questions.impact',
        type: 'multi-select' as const,
        options: [
          { value: 'economic', label: 'wizard.options.economicImpact' },
          { value: 'social', label: 'wizard.options.socialImpact' },
          { value: 'environmental', label: 'wizard.options.environmentalImpact' }
        ]
      },
      'consortium': {
        symptom: 'wizard.questions.consortium',
        type: 'boolean' as const,
        options: [
          { value: 'yes', label: 'wizard.options.yesConsortium' },
          { value: 'no', label: 'wizard.options.noConsortium' }
        ]
      },
      'eligibility': {
        symptom: 'wizard.questions.eligibility',
        type: 'single-select' as const,
        options: [
          { value: 'startup', label: 'wizard.options.startup' },
          { value: 'sme', label: 'wizard.options.sme' },
          { value: 'large', label: 'wizard.options.large' },
          { value: 'research', label: 'wizard.options.research' }
        ]
      },
      'financial': {
        symptom: 'wizard.questions.financial',
        type: 'single-select' as const,
        options: [
          { value: 'under_50k', label: 'wizard.options.under50k' },
          { value: '50k_100k', label: 'wizard.options.50k100k' },
          { value: '100k_500k', label: 'wizard.options.100k500k' },
          { value: 'over_500k', label: 'wizard.options.over500k' }
        ]
      }
    };
    
    // Generate questions for each category
    for (const [category, mapping] of Object.entries(categoryMappings)) {
      const categoryData = categories[category];
      
      // Check if category has meaningful data (either array with items or object with evidence)
      const hasValidData = categoryData && (
        (Array.isArray(categoryData) && categoryData.length > 0) ||
        (typeof categoryData === 'object' && categoryData !== null && 'evidence' in categoryData && Array.isArray(categoryData.evidence) && categoryData.evidence.length > 0)
      );
      
      if (hasValidData) {
        const question: SymptomQuestion = {
          id: `${program.id}_${category}`,
          symptom: mapping.symptom,
          type: mapping.type,
          options: mapping.options,
          required: true,
          category: 'specific_requirements',
          phase: 2,
          sourcePrograms: [program.id],
          isCoreQuestion: false
        };
        questions.push(question);
      }
    }
    
    return questions;
  }

  /**
   * Get core questions
   */
  public getCoreQuestions(): SymptomQuestion[] {
    return this.questions;
  }

  /**
   * Get overlay questions
   */
  public getOverlayQuestions(): SymptomQuestion[] {
    return this.overlayQuestions.slice(0, 50);
  }

  /**
   * Get next question with enhanced logic
   */
  public async getNextQuestionEnhanced(answers: Record<string, any>): Promise<SymptomQuestion | null> {
    console.log(`🔍 Getting next question from ${Object.keys(answers).length} answers`);
    
    // PRIORITY 1: Find unanswered core questions (reliable fallback)
    const coreQuestions = this.getCoreQuestions();
    for (const question of coreQuestions) {
      if (question.required && !answers[question.id]) {
        console.log(`✅ Found unanswered core question: ${question.id}`);
        return this.enhanceQuestionWithStats(question);
      }
    }
    
    // PRIORITY 2: Find unanswered overlay questions (generated from program data)
    const overlayQuestions = this.getOverlayQuestions();
    for (const question of overlayQuestions) {
      if (question.required && !answers[question.id] && question.options && question.options.length > 0) {
        console.log(`✅ Found unanswered overlay question: ${question.id}`);
        return this.enhanceQuestionWithStats(question);
      }
    }
    
    console.log('✅ No more questions to ask');
    return null;
  }

  /**
   * Enhance question with statistics
   */
  private enhanceQuestionWithStats(question: SymptomQuestion): SymptomQuestion {
    return {
      ...question,
      informationValue: this.calculateInformationValue(question),
      programsAffected: this.calculateProgramsAffected(question),
      decisiveness: this.calculateDecisiveness(question),
      uxWeight: this.calculateUXWeight(question)
    };
  }

  /**
   * Calculate information value of a question
   */
  private calculateInformationValue(question: SymptomQuestion): number {
    // Simple calculation based on question type and options
    let baseValue = 0.5;
    if (question.type === 'boolean') baseValue = 0.3;
    if (question.type === 'multi-select') baseValue = 0.7;
    if (question.options && question.options.length > 2) baseValue += 0.1;
    return Math.min(baseValue, 1.0);
  }

  /**
   * Calculate how many programs this question affects
   */
  private calculateProgramsAffected(question: SymptomQuestion): number {
    if (question.sourcePrograms) {
      return question.sourcePrograms.length;
    }
    return Math.min(this.programs.length, 10);
  }

  /**
   * Calculate decisiveness of a question
   */
  private calculateDecisiveness(question: SymptomQuestion): 'HARD' | 'SOFT' | 'UNCERTAIN' {
    if (question.type === 'boolean') return 'HARD';
    if (question.type === 'single-select' && question.options && question.options.length <= 3) return 'HARD';
    return 'SOFT';
  }

  /**
   * Calculate UX weight for question priority
   */
  private calculateUXWeight(question: SymptomQuestion): number {
    let weight = 0.5;
    if (question.isCoreQuestion) weight += 0.3;
    if (question.phase === 1) weight += 0.2;
    if (question.required) weight += 0.1;
    return Math.min(weight, 1.0);
  }

  /**
   * Get estimated total questions
   */
  public getEstimatedTotalQuestions(): number {
    const coreCount = this.getCoreQuestions().length;
    const overlayCount = Math.min(this.getOverlayQuestions().length, 20);
    return Math.min(coreCount + overlayCount, 25); // Cap at 25 for UX
  }

  /**
   * Initialize overlay questions
   */
  public async initializeOverlayQuestions(): Promise<void> {
    await this.computeOverlayQuestions();
  }

  /**
   * Remove duplicate questions
   */
  private deduplicateQuestions(questions: SymptomQuestion[]): SymptomQuestion[] {
    const seen = new Map<string, SymptomQuestion>();
    
    for (const question of questions) {
      const key = question.symptom.toLowerCase();
      if (!seen.has(key)) {
        seen.set(key, question);
      }
    }
    
    return Array.from(seen.values());
  }

  /**
   * Load branching rules
   */
  private loadBranchingRules(): void {
    // Branching rules loaded - can be implemented later if needed
    console.log('📋 Branching rules loaded');
  }

  /**
   * Get first question (for SmartWizard compatibility)
   */
  public async getFirstQuestion(): Promise<SymptomQuestion | null> {
    return this.getNextQuestionEnhanced({});
  }

  /**
   * Get question by ID (for SmartWizard compatibility)
   */
  public getQuestionById(id: string): SymptomQuestion | undefined {
    const allQuestions = [...this.questions, ...this.overlayQuestions];
    return allQuestions.find(q => q.id === id);
  }

  /**
   * Get next question (for SmartWizard compatibility)
   */
  public async getNextQuestion(answers: Record<string, any>): Promise<SymptomQuestion | null> {
    return this.getNextQuestionEnhanced(answers);
  }

  /**
   * Generate contextual questions (for SmartWizard compatibility)
   */
  public generateContextualQuestions(answers: Record<string, any>): SymptomQuestion[] {
    // Return overlay questions that match the current context
    return this.overlayQuestions.filter(q => {
      // Simple context matching - can be enhanced
      return q.required && !answers[q.id];
    });
  }

  /**
   * Validate answers (for SmartWizard compatibility)
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

    // Basic validation
    for (const question of this.questions) {
      if (question.required && !answers[question.id]) {
        errors.push(`Required question '${question.id}' not answered`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      recommendations
    };
  }
}