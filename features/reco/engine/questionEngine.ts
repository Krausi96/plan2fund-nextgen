// SIMPLE QUESTION ENGINE - TOP-DOWN CONTEXTUAL APPROACH
// Questions are generated based on remaining programs after each answer
// Scoring and filtering use the SAME answer keys and values

import { Program } from '@/shared/types/requirements';

export interface SymptomQuestion {
  id: string;
  symptom: string;
  type: 'single-select' | 'multi-select';
  options: Array<{
    value: string;
    label: string;
  }>;
  required: boolean;
  category: string;
  priority: number;
}

export class QuestionEngine {
  private allPrograms: Program[];
  private remainingPrograms: Program[];
  private questions: SymptomQuestion[] = [];

  constructor(programs: Program[]) {
    this.allPrograms = programs;
    this.remainingPrograms = programs;
    console.log(`✅ QuestionEngine initialized with ${programs.length} programs`);
    this.generateInitialQuestion();
  }

  /**
   * Generate initial question - dynamically choose best first question
   * Prioritize company_type (85% coverage) over location (90% but may filter too aggressively)
   */
  private generateInitialQuestion(): void {
    // Analyze which question would be most effective first
    const locationOptions = this.extractOptionsFromRemainingPrograms('location');
    const companyTypeOptions = this.extractOptionsFromRemainingPrograms('company_type');
    
    // Prefer company_type if it has good options (better distribution, less aggressive filtering)
    // Location can be very aggressive if most programs are Austria-specific
    const firstQuestionId = companyTypeOptions.length >= 2 ? 'company_type' : 'location';
    
    const firstQuestion = this.getDefaultQuestion(firstQuestionId);
    if (firstQuestion) {
      // Update with actual options from programs if available
      if (firstQuestionId === 'company_type' && companyTypeOptions.length > 0) {
        firstQuestion.options = companyTypeOptions;
      } else if (firstQuestionId === 'location' && locationOptions.length > 0) {
        firstQuestion.options = locationOptions;
      }
      this.questions.push(firstQuestion);
    }
  }

  /**
   * Get first question (dynamically chosen: company_type or location)
   */
  public async getFirstQuestion(): Promise<SymptomQuestion | null> {
    return this.questions[0] || null;
  }

  /**
   * Get next question - CONTEXTUAL based on remaining programs
   * After each answer, filter programs, then determine what to ask next
   */
  public async getNextQuestion(answers: Record<string, any>): Promise<SymptomQuestion | null> {
    // Filter programs based on current answers
    this.remainingPrograms = this.filterPrograms(answers);
    console.log(`📊 After filtering: ${this.remainingPrograms.length} programs remaining`);

    // Core question order - optimized for filtering effectiveness
    // Start with company_type (better distribution) then location (may filter aggressively)
    // Then funding_amount, then optional questions 4-8
    const coreQuestions = [
      'company_type',  // First: 85% coverage, better distribution
      'location',      // Second: 90% coverage but may filter aggressively if asked first
      'funding_amount',
      'use_of_funds',
      'team_size',
      'impact',
      'deadline_urgency',
      'project_duration'
    ];

    // Find first unanswered core question
    for (const questionId of coreQuestions) {
      if (!answers[questionId]) {
        // Generate question based on remaining programs
        const question = this.generateQuestionFromRemainingPrograms(questionId);
        if (question) {
          // Check if we already have this question
          const existingIndex = this.questions.findIndex(q => q.id === questionId);
          if (existingIndex >= 0) {
            this.questions[existingIndex] = question; // Update with new options from remaining programs
          } else {
            this.questions.push(question);
          }
          return question;
        }
      }
    }

    // All core questions answered - check for overlay questions
    if (this.remainingPrograms.length === 0) {
      console.warn(`⚠️ All programs filtered out after ${Object.keys(answers).length} answers`);
      console.warn(`   Answers given: ${JSON.stringify(answers)}`);
      // Still return null to stop asking questions
      return null;
    }
    
    // Generate overlay questions (conditional questions beyond core 8)
    const overlayQuestion = this.generateOverlayQuestion(answers);
    if (overlayQuestion) {
      // Check if we already have this overlay question
      const existingIndex = this.questions.findIndex(q => q.id === overlayQuestion.id);
      if (existingIndex >= 0) {
        this.questions[existingIndex] = overlayQuestion;
      } else {
        this.questions.push(overlayQuestion);
      }
      return overlayQuestion;
    }
    
    // If we have programs but no more questions, we're done
    console.log(`✅ All ${coreQuestions.length} core questions completed, ${this.remainingPrograms.length} programs remaining`);
    return null;
  }

  /**
   * Generate question based on what's common in REMAINING programs
   * Uses actual database values, converts to plain language
   */
  private generateQuestionFromRemainingPrograms(questionId: string): SymptomQuestion | null {
    const options = this.extractOptionsFromRemainingPrograms(questionId);
    
    if (options.length === 0) {
      // Fallback to default options if no data
      return this.getDefaultQuestion(questionId);
    }

    return {
      id: questionId,
      symptom: this.getQuestionText(questionId),
      type: this.getQuestionType(questionId),
      options: options,
      required: true,
      category: this.getQuestionCategory(questionId),
      priority: this.getQuestionPriority(questionId)
    };
  }

  /**
   * Extract options from remaining programs' requirements
   * Converts database values to plain language options
   */
  private extractOptionsFromRemainingPrograms(questionId: string): Array<{value: string, label: string}> {
    const valueCounts = new Map<string, number>();

    // Analyze remaining programs
    for (const program of this.remainingPrograms) {
      const values = this.extractValuesFromProgram(program, questionId);
      for (const value of values) {
        valueCounts.set(value, (valueCounts.get(value) || 0) + 1);
      }
    }

    // Convert to options (plain language, sorted by frequency)
    const options: Array<{value: string, label: string}> = [];
    const sorted = Array.from(valueCounts.entries()).sort((a, b) => b[1] - a[1]);

    for (const [value] of sorted) {
      const label = this.valueToPlainLanguage(questionId, value);
      if (label) {
        options.push({ value, label });
      }
    }

    // Limit to top 5-6 options
    return options.slice(0, 6);
  }

  /**
   * Extract values from a program's requirements for a specific question
   */
  private extractValuesFromProgram(program: Program, questionId: string): string[] {
    const categorized = (program as any).categorized_requirements || {};
    const values: string[] = [];

    // Location
    if (questionId === 'location') {
      const geoReqs = categorized.geographic || [];
      // Process location type requirements (handle both 'location' and 'specific_location' for backward compatibility)
      for (const req of geoReqs) {
        if (req.type === 'location' || req.type === 'specific_location') {
          const val = this.normalizeLocationValue(req.value);
          if (val) values.push(val);
        }
      }
      if ((program as any).eligibility_criteria?.location) {
        const val = this.normalizeLocationValue((program as any).eligibility_criteria.location);
        if (val) values.push(val);
      }
    }

    // Company type
    if (questionId === 'company_type') {
      const eligReqs = categorized.eligibility || [];
      for (const req of eligReqs) {
        if (req.type === 'company_type' || req.type === 'company_stage') {
          const val = this.normalizeCompanyTypeValue(req.value);
          if (val) values.push(val);
        }
      }
    }

    // Funding amount
    if (questionId === 'funding_amount') {
      const finReqs = categorized.financial || [];
      for (const req of finReqs) {
        if (req.type === 'funding_amount' || req.type === 'funding_amount_max') {
          const val = this.normalizeFundingAmountValue(req.value);
          if (val) values.push(val);
        }
      }
    }

    // Use of funds
    if (questionId === 'use_of_funds') {
      const useReqs = categorized.use_of_funds || [];
      for (const req of useReqs) {
        const val = this.normalizeUseOfFundsValue(req.value);
        if (val) values.push(val);
      }
    }

    // Team size
    if (questionId === 'team_size') {
      const teamReqs = categorized.team || [];
      for (const req of teamReqs) {
        if (req.type === 'team_size' || req.type === 'min_team_size') {
          const val = this.normalizeTeamSizeValue(req.value);
          if (val) values.push(val);
        }
      }
    }

    // Impact
    if (questionId === 'impact') {
      const impactReqs = categorized.impact || [];
      for (const req of impactReqs) {
        const val = this.normalizeImpactValue(req.value);
        if (val) values.push(val);
      }
    }

    // Deadline urgency
    if (questionId === 'deadline_urgency') {
      const timelineReqs = categorized.timeline || [];
      for (const req of timelineReqs) {
        if (req.type === 'deadline' || req.type === 'application_deadline') {
          const val = this.normalizeDeadlineValue(req.value);
          if (val) values.push(val);
        }
      }
    }

    // Project duration
    if (questionId === 'project_duration') {
      const timelineReqs = categorized.timeline || [];
      for (const req of timelineReqs) {
        if (req.type === 'project_duration' || req.type === 'duration') {
          const val = this.normalizeProjectDurationValue(req.value);
          if (val) values.push(val);
        }
      }
    }

    return values;
  }

  // Normalization functions - convert DB values to consistent keys
  private normalizeLocationValue(value: any): string | null {
    const str = String(value || '').toLowerCase();
    if (str.includes('austria') || str.includes('österreich') || str === 'at') return 'austria';
    if (str.includes('germany') || str.includes('deutschland') || str === 'de') return 'germany';
    if (str.includes('eu') || str.includes('europe') || str.includes('european')) return 'eu';
    return 'international';
  }

  private normalizeCompanyTypeValue(value: any): string | null {
    const str = String(value || '').toLowerCase();
    if (str.includes('startup') || str.includes('start-up') || str.includes('new venture')) return 'startup';
    if (str.includes('sme') || str.includes('small') || str.includes('medium') || str.includes('mittelstand')) return 'sme';
    if (str.includes('large') || str.includes('enterprise')) return 'large';
    if (str.includes('research') || str.includes('university') || str.includes('academic')) return 'research';
    return null;
  }

  private normalizeFundingAmountValue(value: any): string | null {
    if (typeof value === 'number') {
      if (value < 100000) return 'under100k';
      if (value < 500000) return '100kto500k';
      if (value < 2000000) return '500kto2m';
      return 'over2m';
    }
    const str = String(value || '').toLowerCase();
    if (str.includes('under') || str.includes('<') || str.includes('less')) return 'under100k';
    if (str.includes('100') && str.includes('500')) return '100kto500k';
    if (str.includes('500') && str.includes('2000')) return '500kto2m';
    if (str.includes('over') || str.includes('>') || str.includes('more')) return 'over2m';
    return null;
  }

  private normalizeUseOfFundsValue(value: any): string | null {
    const str = String(value || '').toLowerCase();
    if (str.includes('research') || str.includes('development') || str.includes('rd')) return 'rd';
    if (str.includes('marketing') || str.includes('promotion')) return 'marketing';
    if (str.includes('equipment') || str.includes('infrastructure')) return 'equipment';
    if (str.includes('personnel') || str.includes('hiring') || str.includes('team')) return 'personnel';
    return null;
  }

  private normalizeTeamSizeValue(value: any): string | null {
    if (typeof value === 'number') {
      if (value <= 2) return '1to2';
      if (value <= 5) return '3to5';
      if (value <= 10) return '6to10';
      return 'over10';
    }
    const str = String(value || '').toLowerCase();
    if (str.includes('1') || str.includes('2') || str.includes('solo')) return '1to2';
    if (str.includes('3') || str.includes('4') || str.includes('5')) return '3to5';
    if (str.includes('6') || str.includes('7') || str.includes('8') || str.includes('9') || str.includes('10')) return '6to10';
    if (str.includes('over') || str.includes('more')) return 'over10';
    return null;
  }

  private normalizeImpactValue(value: any): string | null {
    const str = String(value || '').toLowerCase();
    if (str.includes('economic') || str.includes('job') || str.includes('growth')) return 'economic';
    if (str.includes('social') || str.includes('community') || str.includes('society')) return 'social';
    if (str.includes('environment') || str.includes('climate') || str.includes('sustainability')) return 'environmental';
    return null;
  }

  private normalizeDeadlineValue(_value: any): string | null {
    // This is complex - would need date parsing
    // For now, return default options
    return null;
  }

  private normalizeProjectDurationValue(value: any): string | null {
    const str = String(value || '').toLowerCase();
    if (str.includes('under') || str.includes('<2') || str.includes('short')) return 'under2';
    if (str.includes('2') && str.includes('5')) return '2to5';
    if (str.includes('5') && str.includes('10')) return '5to10';
    if (str.includes('over') || str.includes('>10') || str.includes('long')) return 'over10';
    return null;
  }

  // Value to plain language (for display)
  private valueToPlainLanguage(questionId: string, value: string): string {
    const mappings: Record<string, Record<string, string>> = {
      location: {
        'austria': 'wizard.options.austria',
        'germany': 'wizard.options.germany',
        'eu': 'wizard.options.eu',
        'international': 'wizard.options.international'
      },
      company_type: {
        'startup': 'wizard.options.startup',
        'sme': 'wizard.options.sme',
        'large': 'wizard.options.large',
        'research': 'wizard.options.research'
      },
      funding_amount: {
        'under100k': 'wizard.options.under100k',
        '100kto500k': 'wizard.options.100kto500k',
        '500kto2m': 'wizard.options.500kto2m',
        'over2m': 'wizard.options.over2m'
      },
      use_of_funds: {
        'rd': 'wizard.options.researchDevelopment',
        'marketing': 'wizard.options.marketing',
        'equipment': 'wizard.options.equipment',
        'personnel': 'wizard.options.personnel'
      },
      team_size: {
        '1to2': 'wizard.options.1to2People',
        '3to5': 'wizard.options.3to5People',
        '6to10': 'wizard.options.6to10People',
        'over10': 'wizard.options.over10People'
      },
      impact: {
        'economic': 'wizard.options.economicImpact',
        'social': 'wizard.options.socialImpact',
        'environmental': 'wizard.options.environmentalImpact'
      },
      deadline_urgency: {
        'urgent': 'wizard.options.within1Month',
        'soon': 'wizard.options.within3Months',
        'flexible': 'wizard.options.within6Months'
      },
      project_duration: {
        'under2': 'wizard.options.under2Years',
        '2to5': 'wizard.options.2to5Years',
        '5to10': 'wizard.options.5to10Years',
        'over10': 'wizard.options.over10Years'
      }
    };

    return mappings[questionId]?.[value] || value;
  }

  // Helper functions
  private getQuestionText(questionId: string): string {
    const texts: Record<string, string> = {
      location: 'wizard.questions.location',
      company_type: 'wizard.questions.companyType',
      funding_amount: 'wizard.questions.fundingAmount',
      use_of_funds: 'wizard.questions.useOfFunds',
      team_size: 'wizard.questions.teamSize',
      impact: 'wizard.questions.impact',
      deadline_urgency: 'wizard.questions.deadlineUrgency',
      project_duration: 'wizard.questions.projectDuration'
    };
    return texts[questionId] || questionId;
  }

  private getQuestionType(questionId: string): 'single-select' | 'multi-select' {
    const multiSelect = ['use_of_funds', 'impact'];
    return multiSelect.includes(questionId) ? 'multi-select' : 'single-select';
  }

  private getQuestionCategory(questionId: string): string {
    const categories: Record<string, string> = {
      location: 'geographic',
      company_type: 'eligibility',
      funding_amount: 'financial',
      use_of_funds: 'financial',
      team_size: 'team',
      impact: 'impact',
      deadline_urgency: 'timeline',
      project_duration: 'timeline'
    };
    return categories[questionId] || 'general';
  }

  private getQuestionPriority(questionId: string): number {
    const priorities: Record<string, number> = {
      location: 1,
      company_type: 2,
      funding_amount: 3,
      use_of_funds: 4,
      team_size: 5,
      impact: 6,
      deadline_urgency: 7,
      project_duration: 8
    };
    return priorities[questionId] || 999;
  }

  /**
   * Default question if no data found in remaining programs
   */
  private getDefaultQuestion(questionId: string): SymptomQuestion | null {
    const defaults: Record<string, SymptomQuestion> = {
      location: {
        id: 'location',
        symptom: 'wizard.questions.location',
        type: 'single-select',
        options: [
          { value: 'austria', label: 'wizard.options.austria' },
          { value: 'germany', label: 'wizard.options.germany' },
          { value: 'eu', label: 'wizard.options.eu' },
          { value: 'international', label: 'wizard.options.international' }
        ],
        required: true,
        category: 'geographic',
        priority: 1
      },
      company_type: {
        id: 'company_type',
        symptom: 'wizard.questions.companyType',
        type: 'single-select',
        options: [
          { value: 'startup', label: 'wizard.options.startup' },
          { value: 'sme', label: 'wizard.options.sme' },
          { value: 'large', label: 'wizard.options.large' },
          { value: 'research', label: 'wizard.options.research' }
        ],
        required: true,
        category: 'eligibility',
        priority: 2
      },
      funding_amount: {
        id: 'funding_amount',
        symptom: 'wizard.questions.fundingAmount',
        type: 'single-select',
        options: [
          { value: 'under100k', label: 'wizard.options.under100k' },
          { value: '100kto500k', label: 'wizard.options.100kto500k' },
          { value: '500kto2m', label: 'wizard.options.500kto2m' },
          { value: 'over2m', label: 'wizard.options.over2m' }
        ],
        required: false,
        category: 'financial',
        priority: 3
      },
      use_of_funds: {
        id: 'use_of_funds',
        symptom: 'wizard.questions.useOfFunds',
        type: 'multi-select',
        options: [
          { value: 'rd', label: 'wizard.options.researchDevelopment' },
          { value: 'marketing', label: 'wizard.options.marketing' },
          { value: 'equipment', label: 'wizard.options.equipment' },
          { value: 'personnel', label: 'wizard.options.personnel' }
        ],
        required: false,
        category: 'financial',
        priority: 4
      },
      team_size: {
        id: 'team_size',
        symptom: 'wizard.questions.teamSize',
        type: 'single-select',
        options: [
          { value: '1to2', label: 'wizard.options.1to2People' },
          { value: '3to5', label: 'wizard.options.3to5People' },
          { value: '6to10', label: 'wizard.options.6to10People' },
          { value: 'over10', label: 'wizard.options.over10People' }
        ],
        required: false,
        category: 'team',
        priority: 5
      },
      impact: {
        id: 'impact',
        symptom: 'wizard.questions.impact',
        type: 'multi-select',
        options: [
          { value: 'economic', label: 'wizard.options.economicImpact' },
          { value: 'social', label: 'wizard.options.socialImpact' },
          { value: 'environmental', label: 'wizard.options.environmentalImpact' }
        ],
        required: false,
        category: 'impact',
        priority: 6
      },
      deadline_urgency: {
        id: 'deadline_urgency',
        symptom: 'wizard.questions.deadlineUrgency',
        type: 'single-select',
        options: [
          { value: 'urgent', label: 'wizard.options.within1Month' },
          { value: 'soon', label: 'wizard.options.within3Months' },
          { value: 'flexible', label: 'wizard.options.within6Months' }
        ],
        required: false,
        category: 'timeline',
        priority: 7
      },
      project_duration: {
        id: 'project_duration',
        symptom: 'wizard.questions.projectDuration',
        type: 'single-select',
        options: [
          { value: 'under2', label: 'wizard.options.under2Years' },
          { value: '2to5', label: 'wizard.options.2to5Years' },
          { value: '5to10', label: 'wizard.options.5to10Years' },
          { value: 'over10', label: 'wizard.options.over10Years' }
        ],
        required: false,
        category: 'timeline',
        priority: 8
      }
    };

    return defaults[questionId] || null;
  }

  /**
   * Filter programs based on answers
   * Uses SAME keys and values as scoring
   */
  private filterPrograms(answers: Record<string, any>): Program[] {
    let filtered = [...this.allPrograms];

    // Location filter
    if (answers.location) {
      filtered = filtered.filter(p => this.matchesLocation(p, answers.location));
    }

    // Company type filter
    if (answers.company_type) {
      filtered = filtered.filter(p => this.matchesCompanyType(p, answers.company_type));
    }

    // Funding amount filter
    if (answers.funding_amount) {
      filtered = filtered.filter(p => this.matchesFundingAmount(p, answers.funding_amount));
    }

    // Use of funds filter
    if (answers.use_of_funds) {
      const uses = Array.isArray(answers.use_of_funds) ? answers.use_of_funds : [answers.use_of_funds];
      filtered = filtered.filter(p => uses.some((use: string) => this.matchesUseOfFunds(p, use)));
    }

    // Team size filter
    if (answers.team_size) {
      filtered = filtered.filter(p => this.matchesTeamSize(p, answers.team_size));
    }

    // Impact filter
    if (answers.impact) {
      const impacts = Array.isArray(answers.impact) ? answers.impact : [answers.impact];
      filtered = filtered.filter(p => impacts.some((imp: string) => this.matchesImpact(p, imp)));
    }

    // Overlay question filters
    // Research focus filter
    if (answers.research_focus) {
      const focuses = Array.isArray(answers.research_focus) ? answers.research_focus : [answers.research_focus];
      filtered = filtered.filter(p => this.matchesResearchFocus(p, focuses));
    }

    // Consortium filter
    if (answers.consortium) {
      filtered = filtered.filter(p => this.matchesConsortium(p, answers.consortium));
    }

    // Industry focus filter
    if (answers.industry_focus) {
      const industries = Array.isArray(answers.industry_focus) ? answers.industry_focus : [answers.industry_focus];
      filtered = filtered.filter(p => this.matchesIndustryFocus(p, industries));
    }

    // TRL level filter
    if (answers.trl_level) {
      filtered = filtered.filter(p => this.matchesTRL(p, answers.trl_level));
    }

    return filtered;
  }

  // Matching functions - use SAME logic as scoring
  private matchesLocation(program: Program, userLocation: string): boolean {
    const categorized = (program as any).categorized_requirements;
    const geoReqs = categorized?.geographic || [];
    const userLoc = String(userLocation).toLowerCase();
    let hasLocationRequirement = false;

    // Check categorized_requirements.geographic
    // Handle both 'location' and 'specific_location' for backward compatibility with old data
    for (const req of geoReqs) {
      if (req.type === 'location' || req.type === 'specific_location') {
        hasLocationRequirement = true;
        const reqValue = String(req.value || '').toLowerCase();
        if (userLoc === 'austria' && (reqValue.includes('austria') || reqValue.includes('vienna') || reqValue === 'at' || reqValue.includes('österreich'))) return true;
        if (userLoc === 'germany' && (reqValue.includes('germany') || reqValue.includes('deutschland') || reqValue === 'de')) return true;
        if (userLoc === 'eu' && (reqValue.includes('eu') || reqValue.includes('europe') || reqValue.includes('europa'))) return true;
        if (userLoc === 'international') return true;
      }
    }

    // Check eligibility_criteria.location
    const eligLoc = String((program as any).eligibility_criteria?.location || '').toLowerCase();
    if (eligLoc) {
      hasLocationRequirement = true;
      if (
        (userLoc === 'austria' && eligLoc.includes('austria')) ||
        (userLoc === 'germany' && eligLoc.includes('germany')) ||
        (userLoc === 'eu' && eligLoc.includes('eu')) ||
        (userLoc === 'international')
      ) return true;
    }

    // If no location requirement exists, program accepts all locations (like company_type)
    if (!hasLocationRequirement) {
      return true;
    }

    // If user selected international, always show program
    if (userLoc === 'international') {
      return true;
    }

    // Has requirement but doesn't match user's location
    return false;
  }

  private matchesCompanyType(program: Program, userType: string): boolean {
    const categorized = (program as any).categorized_requirements;
    const eligReqs = categorized?.eligibility || [];
    const userT = String(userType).toLowerCase();
    let hasRequirement = false;

    for (const req of eligReqs) {
      if (req.type === 'company_type' || req.type === 'company_stage') {
        hasRequirement = true;
        const reqValue = String(req.value || '').toLowerCase();
        if (userT === 'startup' && (reqValue.includes('startup') || reqValue.includes('new venture'))) return true;
        if (userT === 'sme' && (reqValue.includes('sme') || reqValue.includes('small') || reqValue.includes('medium'))) return true;
        if (userT === 'large' && reqValue.includes('large')) return true;
        if (userT === 'research' && (reqValue.includes('research') || reqValue.includes('university'))) return true;
      }
    }

    const personas = (program as any).target_personas || [];
    if (personas.length > 0) {
      hasRequirement = true;
      if (userT === 'startup' && personas.some((p: any) => String(p).toLowerCase().includes('startup'))) return true;
      if (userT === 'sme' && personas.some((p: any) => String(p).toLowerCase().includes('sme'))) return true;
      if (userT === 'research' && personas.some((p: any) => String(p).toLowerCase().includes('research') || String(p).toLowerCase().includes('university'))) return true;
    }

    // Only return true if no requirement exists (program accepts all types)
    return !hasRequirement;
  }

  private matchesFundingAmount(program: Program, userAmount: string): boolean {
    const categorized = (program as any).categorized_requirements;
    const finReqs = categorized?.financial || [];
    const elig = (program as any).eligibility_criteria;

    // Get max funding from program
    let maxAmount = (program as any).maxAmount || elig?.funding_amount_max || 0;
    if (typeof maxAmount === 'string') {
      maxAmount = parseInt(maxAmount.replace(/[^0-9]/g, '')) || 0;
    }

    // Check if program has funding amount requirements
    const hasFundingReq = finReqs.some((req: any) => req.type === 'funding_amount' || req.type === 'funding_amount_max') || maxAmount > 0;

    if (!hasFundingReq) {
      return true; // No requirement = available
    }

    const ranges: Record<string, number> = {
      'under100k': 100000,
      '100kto500k': 500000,
      '500kto2m': 2000000,
      'over2m': Infinity
    };

    const userMax = ranges[userAmount] || Infinity;
    // If user wants under100k (max 100k), program must offer at least 50k
    // If user wants more (e.g., over2m), program must offer at least 50% of that
    // Programs offering MORE than user's max are always acceptable
    if (maxAmount >= userMax) return true; // Program offers more than user needs - always good
    return maxAmount >= userMax * 0.5; // Program must cover at least 50% of user's max need
  }

  private matchesUseOfFunds(program: Program, use: string): boolean {
    const categorized = (program as any).categorized_requirements;
    const useReqs = categorized?.use_of_funds || [];
    const useStr = String(use).toLowerCase();

    // If no requirement, program accepts all uses
    if (useReqs.length === 0) {
      return true;
    }

    // Check if user's use matches any requirement
    for (const req of useReqs) {
      const reqValue = String(req.value || '').toLowerCase();
      if (useStr === 'rd' && (reqValue.includes('research') || reqValue.includes('development') || reqValue.includes('rd'))) return true;
      if (useStr === 'marketing' && (reqValue.includes('marketing') || reqValue.includes('promotion'))) return true;
      if (useStr === 'equipment' && (reqValue.includes('equipment') || reqValue.includes('infrastructure') || reqValue.includes('capex'))) return true;
      if (useStr === 'personnel' && (reqValue.includes('personnel') || reqValue.includes('hiring') || reqValue.includes('team') || reqValue.includes('staff'))) return true;
    }

    return false; // Has requirement but doesn't match
  }

  private matchesTeamSize(program: Program, userSize: string): boolean {
    const categorized = (program as any).categorized_requirements;
    const teamReqs = categorized?.team || [];
    const elig = (program as any).eligibility_criteria;

    const ranges: Record<string, number> = {
      '1to2': 2,
      '3to5': 5,
      '6to10': 10,
      'over10': Infinity
    };

    const userSizeNum = ranges[userSize] || Infinity;

    // Check if program has min team size requirement
    for (const req of teamReqs) {
      if (req.type === 'min_team_size' || req.type === 'team_size') {
        const minSize = typeof req.value === 'number' ? req.value : parseInt(String(req.value)) || 0;
        if (minSize > userSizeNum) return false;
      }
    }

    if (elig?.min_team_size && elig.min_team_size > userSizeNum) return false;

    return true;
  }

  private matchesImpact(program: Program, impact: string): boolean {
    const categorized = (program as any).categorized_requirements;
    const impactReqs = categorized?.impact || [];
    const impactStr = String(impact).toLowerCase();

    // If no requirement, program accepts all impacts
    if (impactReqs.length === 0) {
      return true;
    }

    // Check if user's impact matches any requirement
    for (const req of impactReqs) {
      const reqValue = String(req.value || '').toLowerCase();
      if (impactStr === 'economic' && (reqValue.includes('economic') || reqValue.includes('job') || reqValue.includes('growth'))) return true;
      if (impactStr === 'social' && (reqValue.includes('social') || reqValue.includes('community') || reqValue.includes('society'))) return true;
      if (impactStr === 'environmental' && (reqValue.includes('environment') || reqValue.includes('climate') || reqValue.includes('sustainability'))) return true;
    }

    return false; // Has requirement but doesn't match
  }

  // Overlay question matching functions
  private matchesResearchFocus(program: Program, focuses: string[]): boolean {
    const categorized = (program as any).categorized_requirements;
    const projectReqs = categorized?.project || [];
    
    // If no requirement, program accepts all focuses
    if (projectReqs.length === 0) {
      return true;
    }

    // Check if user's focus matches any requirement
    for (const req of projectReqs) {
      if (req.type === 'research_focus' || req.type === 'innovation_focus') {
        const reqValue = String(req.value || '').toLowerCase();
        if (focuses.some(focus => reqValue.includes(focus.toLowerCase()) || focus.toLowerCase().includes(reqValue))) {
          return true;
        }
      }
    }

    return false; // Has requirement but doesn't match
  }

  private matchesConsortium(program: Program, userConsortium: string): boolean {
    const categorized = (program as any).categorized_requirements;
    const consortiumReqs = categorized?.consortium || [];
    
    // If no requirement, program accepts both yes and no
    if (consortiumReqs.length === 0) {
      return true;
    }

    // If user says yes, program must require consortium
    if (userConsortium === 'yes') {
      return consortiumReqs.length > 0;
    }

    // If user says no, program should not require consortium (or accept anyway)
    return true; // Accept programs even if they require consortium (user can find partners)
  }

  private matchesIndustryFocus(program: Program, industries: string[]): boolean {
    const categorized = (program as any).categorized_requirements;
    const projectReqs = categorized?.project || [];
    
    // If no requirement, program accepts all industries
    if (projectReqs.length === 0) {
      return true;
    }

    // Check if user's industry matches any requirement
    for (const req of projectReqs) {
      if (req.type === 'industry_focus' || req.type === 'sector') {
        const reqValue = String(req.value || '').toLowerCase();
        if (industries.some(industry => reqValue.includes(industry.toLowerCase()) || industry.toLowerCase().includes(reqValue))) {
          return true;
        }
      }
    }

    return false; // Has requirement but doesn't match
  }

  private matchesTRL(program: Program, userTRL: string): boolean {
    const categorized = (program as any).categorized_requirements;
    const techReqs = categorized?.trl_level || categorized?.technical || [];
    
    // If no requirement, program accepts all TRL levels
    if (techReqs.length === 0) {
      return true;
    }

    // Check if user's TRL matches any requirement
    for (const req of techReqs) {
      if (req.type === 'trl_level' || req.type === 'trl') {
        const reqValue = String(req.value || '').toLowerCase();
        const userTRLLower = String(userTRL).toLowerCase();
        if (reqValue.includes(userTRLLower) || userTRLLower.includes(reqValue)) {
          return true;
        }
      }
    }

    return false; // Has requirement but doesn't match
  }

  // Public methods
  public getRemainingPrograms(): Program[] {
    return this.remainingPrograms;
  }

  public getRemainingProgramCount(): number {
    return this.remainingPrograms.length;
  }

  public getAllQuestions(): SymptomQuestion[] {
    return [...this.questions];
  }

  public getEstimatedTotalQuestions(): number {
    // 8 core questions + up to 4 overlay questions (research_focus, consortium, industry_focus, trl_level)
    return 12; // 8 core + 4 overlay max
  }

  public getCoreQuestions(): SymptomQuestion[] {
    return this.questions.filter(q => ['location', 'company_type', 'funding_amount', 'use_of_funds', 
      'team_size', 'impact', 'deadline_urgency', 'project_duration'].includes(q.id));
  }

  public getQuestionById(id: string): SymptomQuestion | undefined {
    return this.questions.find(q => q.id === id);
  }

  public async getNextQuestionEnhanced(answers: Record<string, any>): Promise<SymptomQuestion | null> {
    return this.getNextQuestion(answers);
  }

  public applyFilters(answers: Record<string, any>, startingPrograms?: Program[]): Program[] {
    const original = this.remainingPrograms;
    if (startingPrograms) {
      this.allPrograms = startingPrograms;
      this.remainingPrograms = startingPrograms;
    }
    const filtered = this.filterPrograms(answers);
    this.remainingPrograms = original;
    return filtered;
  }

  /**
   * Generate overlay questions (conditional questions beyond core 8)
   * Based on user's answers and remaining programs
   */
  private generateOverlayQuestion(answers: Record<string, any>): SymptomQuestion | null {
    // Overlay 1: Research focus (if user selected "research" company type)
    if (answers.company_type === 'research' && !answers.research_focus) {
      const options = this.extractOverlayOptions('research_focus');
      if (options.length > 0) {
        return {
          id: 'research_focus',
          symptom: 'wizard.questions.researchFocus',
          type: 'multi-select',
          options: options,
          required: false,
          category: 'project',
          priority: 9
        };
      }
    }

    // Overlay 2: Consortium requirement (if programs require it)
    const hasConsortiumRequirement = this.remainingPrograms.some((p: any) => {
      const cat = p.categorized_requirements || {};
      return (cat.consortium || []).length > 0;
    });

    if (hasConsortiumRequirement && !answers.consortium) {
      return {
        id: 'consortium',
        symptom: 'wizard.questions.consortium',
        type: 'single-select',
        options: [
          { value: 'yes', label: 'wizard.options.yes' },
          { value: 'no', label: 'wizard.options.no' }
        ],
        required: false,
        category: 'consortium',
        priority: 10
      };
    }

    // Overlay 3: Industry/Sector (if use_of_funds selected and programs specify industries)
    if (answers.use_of_funds && !answers.industry_focus) {
      const options = this.extractOverlayOptions('industry_focus');
      if (options.length > 0) {
        return {
          id: 'industry_focus',
          symptom: 'wizard.questions.industryFocus',
          type: 'multi-select',
          options: options,
          required: false,
          category: 'project',
          priority: 11
        };
      }
    }

    // Overlay 4: Technology Readiness Level (if programs require TRL)
    const hasTRLRequirement = this.remainingPrograms.some((p: any) => {
      const cat = p.categorized_requirements || {};
      return (cat.trl_level || cat.technical || []).some((req: any) => 
        req.type === 'trl_level' || req.type === 'trl'
      );
    });

    if (hasTRLRequirement && !answers.trl_level) {
      const options = this.extractOverlayOptions('trl_level');
      if (options.length > 0) {
        return {
          id: 'trl_level',
          symptom: 'wizard.questions.trlLevel',
          type: 'single-select',
          options: options,
          required: false,
          category: 'technical',
          priority: 12
        };
      }
    }

    // No more overlay questions
    return null;
  }

  /**
   * Extract options for overlay questions (research_focus, industry_focus, trl_level, etc.)
   */
  private extractOverlayOptions(questionId: string): Array<{value: string, label: string}> {
    const valueCounts = new Map<string, number>();

    // Research focus
    if (questionId === 'research_focus') {
      for (const program of this.remainingPrograms) {
        const categorized = (program as any).categorized_requirements || {};
        const projectReqs = categorized.project || [];
        for (const req of projectReqs) {
          if (req.type === 'research_focus' || req.type === 'innovation_focus') {
            const val = String(req.value || '').toLowerCase();
            if (val && val.length > 3) {
              valueCounts.set(val, (valueCounts.get(val) || 0) + 1);
            }
          }
        }
      }
    }

    // Industry focus
    if (questionId === 'industry_focus') {
      for (const program of this.remainingPrograms) {
        const categorized = (program as any).categorized_requirements || {};
        const projectReqs = categorized.project || [];
        for (const req of projectReqs) {
          if (req.type === 'industry_focus' || req.type === 'sector') {
            const val = String(req.value || '').toLowerCase();
            if (val && val.length > 3) {
              valueCounts.set(val, (valueCounts.get(val) || 0) + 1);
            }
          }
        }
      }
    }

    // TRL level
    if (questionId === 'trl_level') {
      for (const program of this.remainingPrograms) {
        const categorized = (program as any).categorized_requirements || {};
        const techReqs = categorized.trl_level || categorized.technical || [];
        for (const req of techReqs) {
          if (req.type === 'trl_level' || req.type === 'trl') {
            const val = String(req.value || '').toLowerCase();
            if (val && val.length > 2) {
              valueCounts.set(val, (valueCounts.get(val) || 0) + 1);
            }
          }
        }
      }
    }

    // Convert to options
    const options: Array<{value: string, label: string}> = [];
    const sorted = Array.from(valueCounts.entries()).sort((a, b) => b[1] - a[1]);

    for (const [value] of sorted.slice(0, 6)) {
      options.push({ value, label: value });
    }

    return options;
  }
}
