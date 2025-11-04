// SIMPLIFIED DYNAMIC QUESTION ENGINE
// Analyzes categorized_requirements from scraper-lite to generate questions dynamically
// Questions adapt to what requirements actually exist in the data

import { Program } from '@/shared/types/requirements';

export interface SymptomQuestion {
  id: string;
  symptom: string;
  type: 'single-select' | 'multi-select' | 'text' | 'number' | 'boolean';
  options: Array<{
    value: string;
    label: string;
    description?: string;
  }>;
  required: boolean;
  category: string;
  priority: number; // Lower = asked first (based on frequency)
}

interface RequirementTypeFrequency {
  category: string;
  type: string;
  frequency: number; // How many programs have this requirement
  values: Map<string, number>; // Unique values and their frequencies
  programs: Set<string>; // Which programs have this
}

export class QuestionEngine {
  private allPrograms: Program[];
  private remainingPrograms: Program[];
  private questions: SymptomQuestion[] = [];
  private requirementFrequencies: RequirementTypeFrequency[] = [];

  constructor(programs: Program[]) {
    this.allPrograms = programs;
    this.remainingPrograms = programs;
    console.log(`✅ Dynamic QuestionEngine initialized with ${programs.length} programs`);
    this.analyzeRequirements();
    this.generateQuestions();
  }

  /**
   * Step 1: Analyze ALL programs' categorized_requirements
   * Find which requirement types are most common
   */
  private analyzeRequirements(): void {
    const frequencyMap = new Map<string, RequirementTypeFrequency>();

    // Analyze each program's categorized_requirements
    for (const program of this.allPrograms) {
      const categorized = (program as any).categorized_requirements;
      if (!categorized || typeof categorized !== 'object') continue;

      // For each category (geographic, team, financial, etc.)
      for (const [category, items] of Object.entries(categorized)) {
        if (!Array.isArray(items)) continue;

        // For each requirement item in this category
        for (const item of items) {
          if (!item || typeof item !== 'object') continue;

          const reqType = item.type || 'unknown';
          const key = `${category}:${reqType}`;
          
          // Get or create frequency tracker
          if (!frequencyMap.has(key)) {
            frequencyMap.set(key, {
              category,
              type: reqType,
              frequency: 0,
              values: new Map(),
              programs: new Set()
            });
          }

          const tracker = frequencyMap.get(key)!;
          tracker.frequency++;
          tracker.programs.add((program as any).id || String(program));

          // Track unique values
          if (item.value !== undefined && item.value !== null) {
            const valueStr = this.normalizeValue(item.value, reqType);
            tracker.values.set(valueStr, (tracker.values.get(valueStr) || 0) + 1);
          }
        }
      }
    }

    // Convert to array and sort by frequency (most common first)
    this.requirementFrequencies = Array.from(frequencyMap.values())
      .sort((a, b) => b.frequency - a.frequency);

    console.log(`📊 Analyzed ${this.requirementFrequencies.length} unique requirement types`);
    console.log(`📊 Top 10 most common:`);
    this.requirementFrequencies.slice(0, 10).forEach((req, idx) => {
      console.log(`  ${idx + 1}. ${req.category}:${req.type} (${req.frequency} programs)`);
    });
  }

  /**
   * Step 2: Generate questions from analyzed requirements
   * Create questions for the most common requirement types
   */
  private generateQuestions(): void {
    const questionIdMap = new Map<string, string>(); // Map requirement type to question ID
    let priority = 0;

    // Generate questions for top requirement types (filter by frequency threshold)
    // Limit to max 10 questions to avoid overwhelming users
    const MIN_FREQUENCY = Math.max(3, Math.floor(this.allPrograms.length * 0.03)); // Lowered to 3% to generate more questions
    const MAX_QUESTIONS = 10; // Limit to prevent too many questions

    // First pass: Generate questions for requirement types that meet frequency threshold
    for (const req of this.requirementFrequencies) {
      // Skip if too rare
      if (req.frequency < MIN_FREQUENCY) continue;
      
      // Limit total questions to avoid overwhelming users
      if (this.questions.length >= MAX_QUESTIONS) {
        console.log(`⚠️ Reached question limit (${MAX_QUESTIONS}), skipping less common requirements`);
        break;
      }

      // Map requirement types to question IDs
      const questionId = this.mapRequirementToQuestionId(req.category, req.type);
      if (!questionId || questionIdMap.has(questionId)) continue; // Already generated or no mapping

      questionIdMap.set(questionId, questionId);

      // Generate question based on requirement type
      const question = this.createQuestionFromRequirement(req, questionId, priority++);
      if (question && question.options && question.options.length > 0) {
        this.questions.push(question);
        console.log(`✅ Generated question: ${questionId} (${req.frequency} programs, ${question.options.length} options)`);
      } else {
        console.warn(`⚠️ Skipped question ${questionId}: no options or question creation failed`);
      }
    }

    // Second pass: Ensure important questions are always generated (even if below threshold)
    // Important questions that should always be included
    const importantQuestionIds = ['location', 'company_type', 'company_age', 'revenue', 'funding_amount', 
      'use_of_funds', 'impact', 'co_financing', 'research_focus', 'consortium', 'market_size', 'team_size'];
    
    for (const importantId of importantQuestionIds) {
      if (this.questions.length >= MAX_QUESTIONS) break;
      if (questionIdMap.has(importantId)) continue; // Already generated
      
      // Find the requirement type that maps to this important question
      for (const req of this.requirementFrequencies) {
        const questionId = this.mapRequirementToQuestionId(req.category, req.type);
        if (questionId === importantId && req.frequency >= 2) { // At least 2 programs
          questionIdMap.set(questionId, questionId);
          const question = this.createQuestionFromRequirement(req, questionId, priority++);
          if (question && question.options && question.options.length > 0) {
            this.questions.push(question);
            console.log(`✅ Generated important question: ${questionId} (${req.frequency} programs, ${question.options.length} options)`);
            break;
          }
        }
      }
    }

    // Third pass: If we still have fewer than 5 questions, lower threshold and generate more
    if (this.questions.length < 5) {
      console.log(`⚠️ Only ${this.questions.length} questions generated, lowering threshold to generate more...`);
      const LOWER_THRESHOLD = Math.max(2, Math.floor(this.allPrograms.length * 0.01)); // 1% threshold
      
      for (const req of this.requirementFrequencies) {
        if (this.questions.length >= MAX_QUESTIONS) break;
        if (req.frequency < LOWER_THRESHOLD) continue;
        
        const questionId = this.mapRequirementToQuestionId(req.category, req.type);
        if (!questionId || questionIdMap.has(questionId)) continue;
        
        questionIdMap.set(questionId, questionId);
        const question = this.createQuestionFromRequirement(req, questionId, priority++);
        if (question && question.options && question.options.length > 0) {
          this.questions.push(question);
          console.log(`✅ Generated additional question: ${questionId} (${req.frequency} programs)`);
        }
      }
    }

    // Sort by importance (not just frequency)
    // Most important questions first: location, company_type, then by frequency
    const importanceOrder: Record<string, number> = {
      'location': 1,           // 1. Location (with subregion support)
      'company_type': 2,       // 2. Company type
      'company_age': 3,        // 3. Company age
      'revenue': 4,            // 4. Revenue
      'funding_amount': 5,     // 5. Funding amount (VERY IMPORTANT)
      'use_of_funds': 6,       // 6. Use of funds
      'impact': 7,             // 7. Impact (IMPORTANT - was missing!)
      'co_financing': 8,       // 8. Co-financing
      'research_focus': 9,     // 9. Research focus
      'consortium': 10,        // 10. Consortium
      'market_size': 11,       // 11. Market size
      'team_size': 12          // 12. Team size
    };
    
    this.questions.sort((a, b) => {
      const aImportance = importanceOrder[a.id] ?? 999;
      const bImportance = importanceOrder[b.id] ?? 999;
      
      // First sort by importance
      if (aImportance !== bImportance) {
        return aImportance - bImportance;
      }
      
      // Then by priority (frequency)
      return a.priority - b.priority;
    });
    
    console.log(`✅ Generated ${this.questions.length} dynamic questions from ${this.requirementFrequencies.length} requirement types`);
    console.log(`📊 Question order: ${this.questions.map(q => q.id).join(' → ')}`);
  }

  /**
   * Map requirement category:type to question ID
   * Now maps ALL 18-19 categories from scraper-lite!
   */
  private mapRequirementToQuestionId(category: string, type: string): string | null {
    // Geographic - Location (include city, country, specific_location, region, etc.)
    if (category === 'geographic' && (
      type === 'location' || 
      type === 'specific_location' ||
      type === 'region' || 
      type === 'city' ||
      type === 'country' ||
      type === 'subregion' ||
      type.includes('location') || 
      type.includes('region') || 
      type.includes('standort') ||
      type.includes('city') ||
      type.includes('country')
    )) {
      return 'location';
    }

    // Team - Company age
    if (category === 'team' && (type === 'max_company_age' || type === 'company_age' || type.includes('age') || type.includes('unternehmen_alter'))) {
      return 'company_age';
    }

    // Team - Team size
    if (category === 'team' && (type === 'min_team_size' || type === 'team_size' || type.includes('team') || type.includes('mitarbeiter') || type.includes('personal'))) {
      return 'team_size';
    }

    // Financial - Revenue
    if (category === 'financial' && (type === 'revenue' || type === 'revenue_range' || type.includes('revenue') || type.includes('umsatz'))) {
      return 'revenue';
    }

    // Financial - Funding amount
    if (category === 'financial' && (type === 'funding_amount' || type.includes('funding') || type.includes('förderbetrag') || type.includes('förderhöhe'))) {
      return 'funding_amount';
    }

    // Financial - Co-financing
    if (category === 'financial' && (type === 'co_financing' || type.includes('cofinancing') || type.includes('eigenmittel') || type.includes('eigenanteil'))) {
      return 'co_financing';
    }

    // Co-financing category (separate from financial)
    if (category === 'co_financing' && (type === 'co_financing' || type.includes('cofinancing') || type.includes('eigenmittel') || type.includes('eigenanteil'))) {
      return 'co_financing';
    }

    // Financial - Revenue model - REMOVED: Dynamic options without translations, too specific
    // if (category === 'revenue_model' || (category === 'financial' && type.includes('revenue_model'))) {
    //   return 'revenue_model';
    // }

    // Financial - Use of funds
    if (category === 'use_of_funds' || (category === 'financial' && type.includes('use_of_funds'))) {
      return 'use_of_funds';
    }

    // Financial - CAPEX/OPEX - REMOVED: Too technical (users don't know CAPEX vs OPEX)
    // if (category === 'capex_opex' || (category === 'financial' && (type.includes('capex') || type.includes('opex') || type.includes('investition')))) {
    //   return 'investment_type';
    // }

    // Project - Research focus
    if (category === 'project' && (type === 'research_focus' || type.includes('research') || type.includes('forschung'))) {
      return 'research_focus';
    }

    // Project - Innovation focus - REMOVED: Too vague (what does "innovation focus" mean?)
    // if (category === 'project' && (type === 'innovation_focus' || type.includes('innovation') || type.includes('innovation'))) {
    //   return 'innovation_focus';
    // }

    // Project - Sustainability focus - REMOVED: Too vague (what does "sustainability focus" mean?)
    // if (category === 'project' && (type === 'sustainability_focus' || type.includes('sustainability') || type.includes('nachhaltigkeit'))) {
    //   return 'sustainability_focus';
    // }

    // Project - Industry focus - REMOVED: Overlaps with sector, dynamic options without translations
    // if (category === 'project' && (type === 'industry_focus' || type.includes('industry') || type.includes('branche'))) {
    //   return 'industry_focus';
    // }

    // Consortium - International collaboration
    if (category === 'consortium' && (type === 'international_collaboration' || type === 'cooperation' || type === 'consortium_required' || type.includes('consortium') || type.includes('partner') || type.includes('konsortium') || type.includes('cooperation'))) {
      return 'consortium';
    }

    // Technical - TRL level - REMOVED: Too technical (users don't know what TRL means)
    // if (category === 'technical' && (type === 'trl_level' || type.includes('trl') || type.includes('reifegrad'))) {
    //   return 'trl_level';
    // }

    // Technical - Technology focus - REMOVED: Dynamic options without translations, too technical
    // if (category === 'technical' && (type === 'technology_focus' || type.includes('technology') || type.includes('technologie'))) {
    //   return 'technology_focus';
    // }

    // Eligibility - Company type
    if (category === 'eligibility' && (type === 'company_type' || type.includes('company_type') || type.includes('unternehmenstyp'))) {
      return 'company_type';
    }

    // Eligibility - Company stage (maps to company_type question)
    if (category === 'eligibility' && (type === 'company_stage' || type.includes('company_stage') || type.includes('unternehmen_stage'))) {
      return 'company_type'; // Company stage is part of company type
    }

    // Eligibility - Sector - REMOVED: Dynamic options without translations, overlaps with industry
    // if (category === 'eligibility' && (type === 'sector' || type.includes('sector') || type.includes('branche'))) {
    //   return 'sector';
    // }

    // Timeline - Deadline - REMOVED: Not relevant for funding discovery
    // if (category === 'timeline' && (type === 'deadline' || type.includes('deadline') || type.includes('frist'))) {
    //   return 'deadline_urgency';
    // }

    // Timeline - Duration - Skip (not relevant for funding discovery, but allow generation for completeness)
    // Note: timeline_duration questions are generated but not used for filtering

    // Impact - Important for funding discovery
    if (category === 'impact' && (type === 'sustainability' || type === 'employment_impact' || type === 'social' || type === 'climate_environmental' || type === 'impact_requirement' || type.includes('impact') || type.includes('wirkung') || type.includes('nachhaltigkeit'))) {
      return 'impact';
    }

    // Market - Market size
    if (category === 'market_size' && (type === 'market_scope' || type.includes('market') || type.includes('markt'))) {
      return 'market_size';
    }

    // Documents - Required documents - Skip (not relevant for filtering, but allow generation)
    // Note: documents_* questions are generated but not used for filtering

    // Legal - Legal compliance - REMOVED: Too vague
    // if (category === 'legal' && (type === 'legal_compliance' || type.includes('legal') || type.includes('rechtlich'))) {
    //   return 'legal_compliance';
    // }

    // Don't auto-generate questions - only use properly mapped ones
    // Auto-generated questions create garbage options from raw scraped data
    return null;
  }

  /**
   * Create a question from a requirement type
   */
  private createQuestionFromRequirement(
    req: RequirementTypeFrequency,
    questionId: string,
    priority: number
  ): SymptomQuestion | null {
    // Location question (with subregion support)
    if (questionId === 'location') {
      const locations = Array.from(req.values.keys());
      const normalized = this.normalizeLocations(locations);
      return {
        id: 'location',
        symptom: 'wizard.questions.location',
        type: 'single-select',
        options: normalized.map(loc => ({
          value: loc,
          label: `wizard.options.${loc}`,
          description: loc.includes('vienna') || loc.includes('tyrol') || loc.includes('salzburg') || loc.includes('berlin') || loc.includes('munich') 
            ? 'wizard.options.subregionHint' 
            : `${req.values.get(loc) || 0} programs available`
        })),
        required: true,
        category: 'location',
        priority
      };
    }

    // Company age question
    if (questionId === 'company_age') {
      const ages = Array.from(req.values.keys())
        .map(v => this.parseAgeFromValue(v))
        .filter(a => !isNaN(a) && a > 0)
        .sort((a, b) => a - b);
      
      if (ages.length > 0) {
        return {
          id: 'company_age',
          symptom: 'wizard.questions.companyAge',
          type: 'single-select',
          options: this.createAgeRanges(ages),
          required: true,
          category: 'business_stage',
          priority
        };
      }
    }

    // Revenue question
    if (questionId === 'revenue') {
      const revenues = Array.from(req.values.keys());
      return {
        id: 'revenue',
        symptom: 'wizard.questions.currentRevenue',
        type: 'single-select',
        options: this.createRevenueRanges(revenues),
        required: true,
        category: 'funding_need',
        priority
      };
    }

    // Team size question
    if (questionId === 'team_size') {
      const sizes = Array.from(req.values.keys())
        .map(v => this.parseSizeFromValue(v))
        .filter(s => !isNaN(s) && s > 0)
        .sort((a, b) => a - b);
      
      if (sizes.length > 0) {
        return {
          id: 'team_size',
          symptom: 'wizard.questions.teamSize',
          type: 'single-select',
          options: this.createTeamRanges(sizes),
          required: true,
          category: 'team_size',
          priority
        };
      }
    }

    // Research focus question
    if (questionId === 'research_focus') {
      return {
        id: 'research_focus',
        symptom: 'wizard.questions.researchFocus',
        type: 'single-select',
        options: [
          { value: 'yes', label: 'wizard.options.yes' },
          { value: 'no', label: 'wizard.options.no' }
        ],
        required: false,
        category: 'specific_requirements',
        priority
      };
    }

    // Consortium question
    if (questionId === 'consortium') {
      return {
        id: 'consortium',
        symptom: 'wizard.questions.internationalCollaboration',
        type: 'single-select',
        options: [
          { value: 'yes', label: 'wizard.options.yes' },
          { value: 'no', label: 'wizard.options.no' }
        ],
        required: false,
        category: 'specific_requirements',
        priority
      };
    }

    // Funding amount question
    if (questionId === 'funding_amount') {
      const amounts = Array.from(req.values.keys());
      return {
        id: 'funding_amount',
        symptom: 'wizard.questions.fundingAmount',
        type: 'single-select',
        options: this.createFundingAmountRanges(amounts),
        required: false,
        category: 'funding_need',
        priority
      };
    }

    // TRL level question - REMOVED: Too technical (users don't know what TRL means)
    // if (questionId === 'trl_level') { ... }

    // Co-financing question - SIMPLIFIED: Changed to yes/no instead of percentage
    if (questionId === 'co_financing') {
      return {
        id: 'co_financing',
        symptom: 'wizard.questions.coFinancing',
        type: 'single-select',
        options: [
          { value: 'yes', label: 'wizard.options.yes' },
          { value: 'no', label: 'wizard.options.no' }
        ],
        required: false,
        category: 'funding_need',
        priority
      };
    }

    // Innovation focus question - REMOVED: Too vague (what does "innovation focus" mean?)
    // if (questionId === 'innovation_focus') { ... }

    // Sustainability focus question - REMOVED: Too vague (what does "sustainability focus" mean?)
    // if (questionId === 'sustainability_focus') { ... }

    // Industry focus question - REMOVED: Overlaps with sector, dynamic options without translations
    // if (questionId === 'industry_focus') { ... }

    // Technology focus question - REMOVED: Dynamic options without translations, too technical/jargon
    // if (questionId === 'technology_focus') { ... }

    // Company type question - use ACTUAL database values
    if (questionId === 'company_type') {
      // Extract actual values from database
      const rawValues = Array.from(req.values.keys());
      
      // Normalize company type values from database
      const normalizedTypes = new Set<string>();
      rawValues.forEach(val => {
        const lower = String(val).toLowerCase();
        // Map actual DB values to question options
        if (lower.includes('startup') || lower.includes('start-up') || lower.includes('new venture')) {
          normalizedTypes.add('startup');
        } else if (lower.includes('sme') || lower.includes('small') || lower.includes('medium') || lower.includes('mittelstand')) {
          normalizedTypes.add('sme');
        } else if (lower.includes('large') || lower.includes('enterprise') || lower.includes('groß')) {
          normalizedTypes.add('large');
        } else if (lower.includes('research') || lower.includes('university') || lower.includes('academic') || lower.includes('forschung')) {
          normalizedTypes.add('research');
        } else if (lower.includes('company') || lower.includes('unternehmen')) {
          // "Company" is generic - map to all types or SME
          normalizedTypes.add('sme');
        }
      });
      
      // Fallback to standard options if no matches
      const options = normalizedTypes.size > 0 
        ? Array.from(normalizedTypes).map(type => ({
            value: type,
            label: `wizard.options.${type}`
          }))
        : [
            { value: 'startup', label: 'wizard.options.startup' },
            { value: 'sme', label: 'wizard.options.sme' },
            { value: 'large', label: 'wizard.options.large' },
            { value: 'research', label: 'wizard.options.research' }
          ];
      
      return {
        id: 'company_type',
        symptom: 'wizard.questions.companyType',
        type: 'single-select',
        options,
        required: false,
        category: 'eligibility',
        priority
      };
    }

    // Sector question - REMOVED: Dynamic options without translations, overlaps with other questions
    // if (questionId === 'sector') { ... }

    // Deadline urgency question - REMOVED: Not relevant for funding discovery
    // This doesn't filter programs effectively, users don't know their urgency at this stage
    // if (questionId === 'deadline_urgency') { ... }

    // Project duration question - REMOVED: Too specific, not relevant for funding discovery
    // Users don't know their project duration at this stage
    // if (questionId === 'project_duration') { ... }

    // Impact question - Important for funding discovery
    if (questionId === 'impact') {
      return {
        id: 'impact',
        symptom: 'wizard.questions.impact',
        type: 'multi-select',
        options: [
          { value: 'sustainability', label: 'wizard.options.sustainabilityImpact' },
          { value: 'employment', label: 'wizard.options.employmentImpact' },
          { value: 'social', label: 'wizard.options.socialImpact' },
          { value: 'climate', label: 'wizard.options.climateImpact' },
          { value: 'economic', label: 'wizard.options.economicImpact' }
        ],
        required: false,
        category: 'impact',
        priority
      };
    }

    // Market size question
    if (questionId === 'market_size') {
      return {
        id: 'market_size',
        symptom: 'wizard.questions.marketSize',
        type: 'single-select',
        options: [
          { value: 'local', label: 'wizard.options.local' },
          { value: 'national', label: 'wizard.options.national' },
          { value: 'eu', label: 'wizard.options.eu' },
          { value: 'international', label: 'wizard.options.international' }
        ],
        required: false,
        category: 'market',
        priority
      };
    }

    // Revenue model question - REMOVED: Dynamic options without translations, too specific
    // if (questionId === 'revenue_model') { ... }

    // Use of funds question
    if (questionId === 'use_of_funds') {
      return {
        id: 'use_of_funds',
        symptom: 'wizard.questions.useOfFunds',
        type: 'multi-select',
        options: [
          { value: 'rd', label: 'wizard.options.researchDevelopment' },
          { value: 'marketing', label: 'wizard.options.marketing' },
          { value: 'equipment', label: 'wizard.options.equipment' },
          { value: 'personnel', label: 'wizard.options.personnel' },
          { value: 'infrastructure', label: 'wizard.options.infrastructure' }
        ],
        required: false,
        category: 'financial',
        priority
      };
    }

    // Investment type question (CAPEX/OPEX) - REMOVED: Too technical (users don't know CAPEX vs OPEX)
    // if (questionId === 'investment_type') { ... }

    // Legal compliance question - REMOVED: Too vague (users don't know what this means)
    // if (questionId === 'legal_compliance') { ... }

    // Has documents question - REMOVED: Not relevant for funding discovery
    // This question doesn't help find funding programs, it's just informational
    // if (questionId === 'has_documents') { ... }

    // Don't auto-generate questions - they create garbage options
    // Only return questions for properly mapped requirement types
    return null;
  }

  /**
   * Get first question
   */
  public async getFirstQuestion(): Promise<SymptomQuestion | null> {
    return this.questions[0] || null;
  }

  /**
   * Get next question - simple priority queue based on what's most important for remaining programs
   * Now includes conditional logic: asks more questions if many programs remain
   */
  public async getNextQuestion(answers: Record<string, any>): Promise<SymptomQuestion | null> {
    // Filter programs based on answers
    const beforeCount = this.remainingPrograms.length;
    this.remainingPrograms = this.filterPrograms(answers);
    const afterCount = this.remainingPrograms.length;
    const filteredCount = beforeCount - afterCount;
    
    console.log(`📊 Filtering summary: ${beforeCount} → ${afterCount} programs (${filteredCount} filtered, ${Object.keys(answers).length} answers given)`);
    
    // Conditional logic: Generate additional questions if many programs remain
    // This provides more precision when needed, fewer questions when not needed
    // Lower thresholds to generate more questions earlier
    if (this.remainingPrograms.length > 30 && this.questions.length < 10) {
      // Generate more questions if still many programs remain
      this.generateConditionalQuestions(10);
    }
    
    if (this.remainingPrograms.length > 50 && this.questions.length < 15) {
      // Generate questions 11-15 if still many programs
      this.generateConditionalQuestions(15);
    }
    
    if (this.remainingPrograms.length > 20 && this.questions.length < 20) {
      // Generate questions 16-20 if still moderate programs
      this.generateConditionalQuestions(20);
    }
    
    // If we've filtered down significantly, stop asking (but require at least 3 questions)
    if (this.remainingPrograms.length <= 5 && Object.keys(answers).length >= 3) {
      console.log(`✅ Filtered to ${this.remainingPrograms.length} programs, stopping questions (after ${Object.keys(answers).length} answers)`);
      return null;
    }
    
    // Don't stop too early - ensure at least 3 questions are asked (unless filtered down significantly)
    const minQuestions = Math.min(3, this.questions.length); // Use 3 or total questions, whichever is smaller
    const hasAskedEnough = Object.keys(answers).length >= minQuestions;
    const hasManyPrograms = this.remainingPrograms.length > 10;
    
    console.log(`🔍 Question decision: ${Object.keys(answers).length} answers, ${this.remainingPrograms.length} programs remaining, ${this.questions.length} total questions`);
    
    // Find first unanswered required question
    const unansweredRequired = this.questions.find(q => q.required && !answers[q.id]);
    if (unansweredRequired) {
      console.log(`✅ Found unanswered required question: ${unansweredRequired.id}`);
      return unansweredRequired;
    }
    
    // Then find first unanswered optional question
    const unansweredOptional = this.questions.find(q => !q.required && !answers[q.id]);
    if (unansweredOptional) {
      // Ask more optional questions if:
      // 1. We haven't asked minimum questions yet, OR
      // 2. Many programs remain (need more filtering), OR
      // 3. We haven't asked all available questions yet
      const allQuestionsAnswered = Object.keys(answers).length >= this.questions.length;
      if (!allQuestionsAnswered && (!hasAskedEnough || hasManyPrograms)) {
        console.log(`✅ Found unanswered optional question: ${unansweredOptional.id}`);
        return unansweredOptional;
      } else {
        console.log(`⏸️ Skipping optional question ${unansweredOptional.id} (all questions answered or filtered enough)`);
      }
    }
    
    // All questions answered OR we've asked enough and filtered enough
    const allAnswered = Object.keys(answers).length >= this.questions.length;
    if (allAnswered) {
      console.log(`✅ All ${this.questions.length} questions answered, stopping`);
    } else if (hasAskedEnough && !hasManyPrograms) {
      console.log(`✅ Asked ${Object.keys(answers).length} questions and filtered to ${this.remainingPrograms.length} programs, stopping`);
    } else {
      console.log(`⚠️ No more questions available after ${Object.keys(answers).length} answers (${this.questions.length} total questions)`);
    }
    return null;
  }

  /**
   * Generate conditional questions when needed for precision
   */
  private generateConditionalQuestions(maxQuestions: number): void {
    // Check if we already have enough questions
    const currentCount = this.questions.length;
    if (currentCount >= maxQuestions) return;
    
    // Generate additional questions from remaining requirement types
    const questionIdMap = new Map(this.questions.map(q => [q.id, true]));
    let priority = currentCount;
    const LOWER_THRESHOLD = Math.max(2, Math.floor(this.allPrograms.length * 0.01)); // 1% threshold for conditional questions
    
    // Try to generate questions from all requirement types, not just specific indices
    for (const req of this.requirementFrequencies) {
      if (this.questions.length >= maxQuestions) break;
      if (req.frequency < LOWER_THRESHOLD) continue; // Skip very rare requirements
      
      const questionId = this.mapRequirementToQuestionId(req.category, req.type);
      
      if (!questionId || questionIdMap.has(questionId)) continue;
      
      questionIdMap.set(questionId, true);
      const question = this.createQuestionFromRequirement(req, questionId, priority++);
      
      if (question && question.options && question.options.length > 0) {
        this.questions.push(question);
        console.log(`🔗 Conditional question added: ${questionId} (${req.frequency} programs, ${question.options.length} options)`);
      }
    }
    
    // Re-sort by priority
    this.questions.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Alias for compatibility
   */
  public async getNextQuestionEnhanced(answers: Record<string, any>): Promise<SymptomQuestion | null> {
    return this.getNextQuestion(answers);
  }

  /**
   * Get remaining programs (for scoring)
   */
  public getRemainingPrograms(): Program[] {
    return this.remainingPrograms;
  }

  /**
   * Public method to filter programs based on answers
   * Used by analysis scripts and testing
   * @param answers - User answers to filter by
   * @param startingPrograms - Optional starting set of programs (defaults to allPrograms)
   */
  public applyFilters(answers: Record<string, any>, startingPrograms?: Program[]): Program[] {
    // Use provided programs or start from all programs
    const programsToFilter = startingPrograms || this.allPrograms;
    
    // Create temporary QuestionEngine instance to use its filtering logic
    // Save current state
    const originalAllPrograms = this.allPrograms;
    const originalRemainingPrograms = this.remainingPrograms;
    
    // Temporarily set programs for filtering
    this.allPrograms = programsToFilter;
    
    try {
      return this.filterPrograms(answers);
    } finally {
      // Restore original state
      this.allPrograms = originalAllPrograms;
      this.remainingPrograms = originalRemainingPrograms;
    }
  }

  public getRemainingProgramCount(): number {
    return this.remainingPrograms.length;
  }

  public getCoreQuestions(): SymptomQuestion[] {
    return this.questions.filter(q => q.required);
  }

  public getAllQuestions(): SymptomQuestion[] {
    return [...this.questions]; // Return copy to prevent external modification
  }

  public getEstimatedTotalQuestions(): number {
    return this.questions.length;
  }

  public getQuestionById(id: string): SymptomQuestion | undefined {
    return this.questions.find(q => q.id === id);
  }

  /**
   * Unified filtering function - checks categorized_requirements directly
   * Note: This is called internally by getNextQuestion() and applyFilters()
   */
  private filterPrograms(answers: Record<string, any>): Program[] {
    let filtered = [...this.allPrograms];

    // Location filter
    if (answers.location) {
      const before = filtered.length;
      filtered = filtered.filter(program => this.matchesLocation(program, answers.location));
      const after = filtered.length;
      console.log(`🔍 Location filter (${answers.location}): ${before} → ${after} (${before - after} filtered)`);
    }

    // Company age filter
    if (answers.company_age) {
      const before = filtered.length;
      const userAge = this.parseAge(answers.company_age);
      filtered = filtered.filter(program => this.matchesCompanyAge(program, userAge));
      const after = filtered.length;
      console.log(`🔍 Company age filter (${answers.company_age}): ${before} → ${after} (${before - after} filtered)`);
    }

    // Revenue filter
    if (answers.revenue) {
      const before = filtered.length;
      const userRev = this.parseRevenue(answers.revenue);
      filtered = filtered.filter(program => this.matchesRevenue(program, userRev));
      const after = filtered.length;
      console.log(`🔍 Revenue filter (${answers.revenue}): ${before} → ${after} (${before - after} filtered)`);
    }

    // Team size filter
    if (answers.team_size) {
      const before = filtered.length;
      const userSize = this.parseTeamSize(answers.team_size);
      filtered = filtered.filter(program => this.matchesTeamSize(program, userSize));
      const after = filtered.length;
      console.log(`🔍 Team size filter (${answers.team_size}): ${before} → ${after} (${before - after} filtered)`);
    }

    // Research focus filter
    if (answers.research_focus === 'no') {
      const before = filtered.length;
      filtered = filtered.filter(program => !this.requiresResearch(program));
      const after = filtered.length;
      console.log(`🔍 Research focus filter (no): ${before} → ${after} (${before - after} filtered)`);
    }

    // Consortium filter - handle both yes and no
    if (answers.consortium !== undefined && answers.consortium !== null) {
      const before = filtered.length;
      if (answers.consortium === 'no') {
        // Filter out programs that require consortium
        filtered = filtered.filter(program => !this.requiresConsortium(program));
      } else if (answers.consortium === 'yes') {
        // Filter to programs that allow/require consortium
        filtered = filtered.filter(program => this.hasConsortiumOption(program));
      }
      const after = filtered.length;
      console.log(`🔍 Consortium filter (${answers.consortium}): ${before} → ${after} (${before - after} filtered)`);
    }

    // Funding amount filter
    if (answers.funding_amount) {
      const before = filtered.length;
      const userAmount = this.parseFundingAmount(answers.funding_amount);
      filtered = filtered.filter(program => this.matchesFundingAmount(program, userAmount));
      const after = filtered.length;
      console.log(`🔍 Funding amount filter (${answers.funding_amount}): ${before} → ${after} (${before - after} filtered)`);
    }

    // TRL level filter - REMOVED: Question removed (too technical)
    // if (answers.trl_level) { ... }

    // Co-financing filter - SIMPLIFIED: Now handles yes/no instead of percentage
    if (answers.co_financing) {
      const before = filtered.length;
      if (answers.co_financing === 'yes') {
        // If user has co-financing, filter to programs that allow/require it
        filtered = filtered.filter(program => this.hasCoFinancingRequirement(program));
      } else {
        // If user has no co-financing, filter to programs that don't require it
        filtered = filtered.filter(program => !this.requiresCoFinancing(program));
      }
      const after = filtered.length;
      console.log(`🔍 Co-financing filter (${answers.co_financing}): ${before} → ${after} (${before - after} filtered)`);
    }

    // Innovation focus filter - REMOVED: Question removed (too vague)
    // if (answers.innovation_focus === 'no') { ... }

    // Sustainability focus filter - REMOVED: Question removed (too vague)
    // if (answers.sustainability_focus === 'no') { ... }

    // Industry focus filter - REMOVED: Question removed
    // if (answers.industry_focus) { ... }

    // Technology focus filter - REMOVED: Question removed
    // if (answers.technology_focus) { ... }

    // Company type filter
    if (answers.company_type) {
      const before = filtered.length;
      filtered = filtered.filter(program => this.matchesCompanyType(program, answers.company_type));
      const after = filtered.length;
      console.log(`🔍 Company type filter (${answers.company_type}): ${before} → ${after} (${before - after} filtered)`);
    }

    // Sector filter - REMOVED: Question removed
    // if (answers.sector) { ... }

    // Impact filter (multi-select support - already handles arrays correctly)
    if (answers.impact && Array.isArray(answers.impact) && answers.impact.length > 0) {
      const before = filtered.length;
      filtered = filtered.filter(program => this.matchesImpact(program, answers.impact));
      const after = filtered.length;
      console.log(`🔍 Impact filter (${answers.impact.join(', ')}): ${before} → ${after} (${before - after} filtered)`);
    }

    // Market size filter
    if (answers.market_size) {
      const before = filtered.length;
      filtered = filtered.filter(program => this.matchesMarketSize(program, answers.market_size));
      const after = filtered.length;
      console.log(`🔍 Market size filter (${answers.market_size}): ${before} → ${after} (${before - after} filtered)`);
    }

    // Use of funds filter (multi-select support)
    if (answers.use_of_funds) {
      const before = filtered.length;
      if (Array.isArray(answers.use_of_funds)) {
        // Multi-select: program must match at least one selected use
        filtered = filtered.filter(program => 
          answers.use_of_funds.some((use: string) => this.matchesUseOfFunds(program, use))
        );
      } else {
        filtered = filtered.filter(program => this.matchesUseOfFunds(program, answers.use_of_funds));
      }
      const after = filtered.length;
      console.log(`🔍 Use of funds filter (${Array.isArray(answers.use_of_funds) ? answers.use_of_funds.join(', ') : answers.use_of_funds}): ${before} → ${after} (${before - after} filtered)`);
    }

    // Investment type filter (CAPEX/OPEX) - REMOVED: Question removed (too technical)
    // if (answers.investment_type) { ... }

    return filtered;
  }

  // Matching functions - check categorized_requirements directly
  private matchesLocation(program: Program, userLocation: string): boolean {
    const categorized = (program as any).categorized_requirements;
    const eligibility = (program as any).eligibility_criteria;
    
    // SIMPLE QUERY: Check ALL geographic requirement types (location, specific_location, region, city, country)
    const geoReqs = categorized?.geographic || [];
    if (geoReqs.length === 0 && !eligibility?.location) {
      // No location requirement = show for international, hide for specific locations
      return userLocation === 'international';
    }
    
    const userLoc = String(userLocation).toLowerCase();
    
    // Direct value matching - check all geographic requirements
    for (const req of geoReqs) {
      const reqValue = String(req.value || '').toLowerCase();
      if (!reqValue) continue;
      
      // Direct matches
      if (reqValue === userLoc) return true;
      if (reqValue.includes(userLoc) || userLoc.includes(reqValue)) return true;
      
      // Specific location mappings
      if (userLoc === 'austria' && (reqValue.includes('austria') || reqValue.includes('vienna') || reqValue === 'at')) return true;
      if (userLoc === 'germany' && (reqValue.includes('germany') || reqValue.includes('deutschland') || reqValue === 'de')) return true;
      if (userLoc === 'eu' && (reqValue.includes('eu') || reqValue.includes('europe') || reqValue.includes('european'))) return true;
      if (userLoc === 'vienna' && reqValue.includes('vienna')) return true;
      if (userLoc === 'international') return true; // International shows all
    }
    
    // Check eligibility_criteria.location
    if (eligibility?.location) {
      const progLoc = String(eligibility.location).toLowerCase();
      if (progLoc.includes(userLoc) || userLoc.includes(progLoc)) return true;
      if (userLoc === 'international') return true;
    }
    
    // If we have location requirements but no match, exclude
    return userLocation === 'international';
  }

  private matchesCompanyAge(program: Program, userAge: number): boolean {
    const categorized = (program as any).categorized_requirements;
    const eligibility = (program as any).eligibility_criteria;
    
    if (categorized?.team) {
      const ageReqs = categorized.team.filter((r: any) => 
        r.type === 'max_company_age' || r.type === 'company_age'
      );
      if (ageReqs.length > 0) {
        const maxAge = ageReqs[0].value;
        if (typeof maxAge === 'number' && userAge > maxAge) return false;
      }
    }
    
    if (eligibility?.max_company_age && userAge > eligibility.max_company_age) {
      return false;
    }
    
    return true;
  }

  private matchesRevenue(program: Program, userRev: number): boolean {
    const categorized = (program as any).categorized_requirements;
    const eligibility = (program as any).eligibility_criteria;
    
    if (categorized?.financial) {
      const revReqs = categorized.financial.filter((r: any) => 
        r.type === 'revenue' || r.type === 'revenue_range'
      );
      if (revReqs.length > 0) {
        const req = revReqs[0];
        if (req.value && typeof req.value === 'object') {
          const min = req.value.min || 0;
          const max = req.value.max || Infinity;
          if (userRev < min || userRev > max) return false;
        }
      }
    }
    
    if (eligibility?.revenue_min && userRev < eligibility.revenue_min) return false;
    if (eligibility?.revenue_max && userRev > eligibility.revenue_max) return false;
    
    return true;
  }

  private matchesTeamSize(program: Program, userSize: number): boolean {
    const categorized = (program as any).categorized_requirements;
    const eligibility = (program as any).eligibility_criteria;
    
    if (categorized?.team) {
      const teamReqs = categorized.team.filter((r: any) => 
        r.type === 'min_team_size' || r.type === 'team_size'
      );
      if (teamReqs.length > 0) {
        const minSize = teamReqs[0].value;
        if (typeof minSize === 'number' && userSize < minSize) return false;
      }
    }
    
    if (eligibility?.min_team_size && userSize < eligibility.min_team_size) return false;
    
    return true;
  }

  private requiresResearch(program: Program): boolean {
    const categorized = (program as any).categorized_requirements;
    const eligibility = (program as any).eligibility_criteria;
    
    if (categorized?.project) {
      return categorized.project.some((r: any) => 
        r.type === 'research_focus' && r.value
      );
    }
    
    return !!eligibility?.research_focus;
  }

  private requiresConsortium(program: Program): boolean {
    // SIMPLE QUERY: Check if consortium is required (not just optional)
    const categorized = (program as any).categorized_requirements;
    const eligibility = (program as any).eligibility_criteria;
    
    // If consortium requirement exists and is marked as required
    if (categorized?.consortium) {
      return categorized.consortium.some((r: any) => r.required === true);
    }
    
    if (eligibility?.consortium_required === true) {
      return true;
    }
    
    return false;
  }

  private hasConsortiumOption(program: Program): boolean {
    // SIMPLE QUERY: Check if consortium requirement exists (yes/no)
    const categorized = (program as any).categorized_requirements;
    const eligibility = (program as any).eligibility_criteria;
    
    // Has consortium requirement = yes
    if (categorized?.consortium && categorized.consortium.length > 0) {
      return true;
    }
    
    if (eligibility?.international_collaboration || eligibility?.consortium_required) {
      return true;
    }
    
    // No requirement = available (fair filtering)
    return true;
  }

  private matchesFundingAmount(program: Program, userAmount: number): boolean {
    // SIMPLE QUERY: Check funding_amount_max from DB
    const categorized = (program as any).categorized_requirements;
    const eligibility = (program as any).eligibility_criteria;
    
    // Parse max funding from various sources
    let max = Infinity;
    
    // Check eligibility_criteria first (cleaner)
    if (eligibility?.funding_amount_max) {
      max = typeof eligibility.funding_amount_max === 'number' 
        ? eligibility.funding_amount_max 
        : this.parseAmountFromString(String(eligibility.funding_amount_max));
    }
    
    // Check financial requirements
    if (categorized?.financial) {
      const maxReq = categorized.financial.find((r: any) => 
        r.type === 'funding_amount_max' || r.type === 'funding_amount'
      );
      if (maxReq?.value) {
        const parsed = this.parseAmountFromString(String(maxReq.value));
        if (parsed > 0 && parsed < max) {
          max = parsed;
        }
      }
    }
    
    // User wants programs that offer at least userAmount
    return max >= userAmount;
  }
  
  // Helper to parse amounts like "6 million", "30,21 €", "18 million"
  private parseAmountFromString(str: string): number {
    const lower = str.toLowerCase().replace(/[^\d,.\s]/g, '');
    const match = lower.match(/([\d,.\s]+)/);
    if (!match) return 0;
    
    let num = parseFloat(match[1].replace(/,/g, '').replace(/\s/g, ''));
    
    // Handle millions
    if (str.toLowerCase().includes('million') || str.toLowerCase().includes('mio')) {
      num *= 1000000;
    }
    if (str.toLowerCase().includes('thousand') || str.toLowerCase().includes('k')) {
      num *= 1000;
    }
    
    return num;
  }

  // Removed: matchesTRL - TRL question removed (too technical)
  // Removed: matchesCoFinancing - Replaced with simplified yes/no logic

  // @ts-ignore - Used in filterPrograms
  // Check if program has a co-financing requirement (for yes/no question)
  private hasCoFinancingRequirement(program: Program): boolean {
    const categorized = (program as any).categorized_requirements;
    if (categorized?.financial) {
      const coFinReqs = categorized.financial.filter((r: any) => r.type === 'co_financing');
      return coFinReqs.length > 0; // Program mentions co-financing
    }
    return true; // If no requirement, include program (fair filtering)
  }

  // @ts-ignore - Used in filterPrograms
  // Check if program requires co-financing (for filtering out programs that require it when user says "no")
  private requiresCoFinancing(program: Program): boolean {
    const categorized = (program as any).categorized_requirements;
    if (categorized?.financial) {
      const coFinReqs = categorized.financial.filter((r: any) => r.type === 'co_financing');
      if (coFinReqs.length > 0) {
        // Check if requirement value indicates mandatory co-financing
        // If it's a percentage or mentions co-financing, consider it required
        const reqPercent = this.parsePercentageFromValue(coFinReqs[0].value);
        return !isNaN(reqPercent) && reqPercent > 0; // Program requires some co-financing
      }
    }
    return false; // Program doesn't require co-financing
  }

  // @ts-ignore - Used in filterPrograms via dynamic calls
  private requiresInnovation(program: Program): boolean {
    const categorized = (program as any).categorized_requirements;
    if (categorized?.project) {
      return categorized.project.some((r: any) => r.type === 'innovation_focus' && r.value);
    }
    return false;
  }

  // @ts-ignore - Used in filterPrograms
  private requiresSustainability(program: Program): boolean {
    const categorized = (program as any).categorized_requirements;
    if (categorized?.project) {
      return categorized.project.some((r: any) => r.type === 'sustainability_focus' && r.value);
    }
    return false;
  }

  // @ts-ignore - Used in filterPrograms
  // matchesIndustry - REMOVED: Question removed
  // private matchesIndustry(program: Program, userIndustry: string): boolean { ... }

  // matchesTechnology - REMOVED: Question removed
  // private matchesTechnology(program: Program, userTech: string): boolean { ... }

  // @ts-ignore - Used in filterPrograms
  private matchesCompanyType(program: Program, userType: string): boolean {
    // SIMPLE QUERY: Map DB values to hardcoded options
    const categorized = (program as any).categorized_requirements;
    
    const typeReqs = categorized?.eligibility?.filter((r: any) => 
      r.type === 'company_type' || r.type === 'company_stage'
    ) || [];
    
    if (typeReqs.length === 0) {
      return true; // No requirement = available
    }
    
    const userT = String(userType).toLowerCase();
    
    // Map messy DB values to clean options
    for (const req of typeReqs) {
      const reqValue = String(req.value || '').toLowerCase();
      if (!reqValue) continue;
      
      // Map DB values to clean options
      if (userT === 'startup') {
        if (reqValue.includes('startup') || reqValue.includes('start-up') || 
            reqValue.includes('new venture') || reqValue.includes('ideation') ||
            reqValue.includes('concept stage')) {
          return true;
        }
      }
      if (userT === 'sme') {
        if (reqValue.includes('sme') || reqValue.includes('small') || 
            reqValue.includes('medium') || reqValue === 'company' ||
            reqValue.includes('mittelstand')) {
          return true;
        }
      }
      if (userT === 'large') {
        if (reqValue.includes('large') || reqValue.includes('enterprise') ||
            reqValue.includes('großunternehmen')) {
          return true;
        }
      }
      if (userT === 'research') {
        if (reqValue.includes('research') || reqValue.includes('university') ||
            reqValue.includes('academic') || reqValue.includes('forschung') ||
            reqValue.includes('researchers')) {
          return true;
        }
      }
    }
    
    return false; // Has requirement but no match
  }

  // matchesSector - REMOVED: Question removed
  // private matchesSector(program: Program, userSector: string): boolean { ... }

  private matchesImpact(program: Program, userImpacts: string[]): boolean {
    // SIMPLE QUERY: Map DB impact types to hardcoded options
    const categorized = (program as any).categorized_requirements;
    
    if (!categorized?.impact || categorized.impact.length === 0) {
      return true; // No requirement = available
    }
    
    const userImpactsLower = userImpacts.map(i => String(i).toLowerCase());
    
    // Check impact requirement types (not values - types are cleaner)
    for (const req of categorized.impact) {
      const reqType = String(req.type || '').toLowerCase();
      
      // Map DB impact types to clean options
      if (userImpactsLower.includes('sustainability') && 
          (reqType.includes('sustainability') || reqType.includes('sustainable'))) {
        return true;
      }
      if (userImpactsLower.includes('employment') && 
          (reqType.includes('employment') || reqType.includes('job'))) {
        return true;
      }
      if (userImpactsLower.includes('social') && reqType.includes('social')) {
        return true;
      }
      if (userImpactsLower.includes('climate') && 
          (reqType.includes('climate') || reqType.includes('environmental') || reqType.includes('environment'))) {
        return true;
      }
      if (userImpactsLower.includes('economic') && 
          (reqType.includes('economic') || reqType.includes('wirtschaft'))) {
        return true;
      }
      
      // Also check value if it's a clean impact keyword
      const reqValue = String(req.value || '').toLowerCase();
      if (reqValue && reqValue.length < 50) { // Skip long descriptions
        if (userImpactsLower.some(ui => reqValue.includes(ui) || ui.includes(reqValue))) {
          return true;
        }
      }
    }
    
    return false;
  }

  // @ts-ignore - Used in filterPrograms
  private matchesMarketSize(program: Program, userMarket: string): boolean {
    const categorized = (program as any).categorized_requirements;
    if (categorized?.market_size) {
      const marketReqs = categorized.market_size.filter((r: any) => r.type === 'market_scope');
      if (marketReqs.length > 0) {
        const progMarkets = marketReqs.map((r: any) => String(r.value).toLowerCase());
        const userM = String(userMarket).toLowerCase();
        return progMarkets.some((m: string) => m.includes(userM) || userM.includes(m));
      }
    }
    return true;
  }

  // @ts-ignore - Used in filterPrograms
  private matchesUseOfFunds(program: Program, userUse: string): boolean {
    const categorized = (program as any).categorized_requirements;
    if (categorized?.use_of_funds) {
      const useReqs = categorized.use_of_funds;
      if (useReqs.length > 0) {
        const programUses = useReqs.map((r: any) => String(r.value || r.type).toLowerCase());
        const userU = String(userUse).toLowerCase();
        
        // Map user selections to requirement values
        // Note: Question options use 'rd', 'marketing', 'equipment', 'personnel', 'infrastructure'
        const useMapping: Record<string, string[]> = {
          'rd': ['research', 'development', 'r&d', 'rd', 'forschung', 'entwicklung', 'research_development'],
          'research_development': ['research', 'development', 'r&d', 'rd', 'forschung', 'entwicklung'],
          'marketing': ['marketing', 'werbung', 'vertrieb'],
          'equipment': ['equipment', 'machinery', 'hardware', 'ausrüstung', 'maschinen'],
          'personnel': ['personnel', 'staff', 'employees', 'hiring', 'personal', 'mitarbeiter'],
          'infrastructure': ['infrastructure', 'facilities', 'infrastruktur'],
          'working_capital': ['working_capital', 'working capital', 'betriebskapital']
        };
        
        const mappedTypes = useMapping[userU] || [userU];
        return programUses.some((progUse: string) => 
          mappedTypes.some(mapped => progUse.includes(mapped) || mapped.includes(progUse))
        );
      }
    }
    return true; // Fair filtering - no use requirement = available
  }

  // @ts-ignore - Used in filterPrograms
  private matchesInvestmentType(program: Program, userType: string): boolean {
    const categorized = (program as any).categorized_requirements;
    if (categorized?.capex_opex) {
      const invReqs = categorized.capex_opex.filter((r: any) => r.type === 'investment_type');
      if (invReqs.length > 0) {
        const progTypes = invReqs.map((r: any) => String(r.value).toLowerCase());
        const userT = String(userType).toLowerCase();
        return progTypes.some((t: string) => t.includes(userT) || userT.includes(t) || userT === 'both');
      }
    }
    return true;
  }

  // Helper functions for value parsing and normalization
  private normalizeValue(value: any, _type: string): string {
    if (typeof value === 'object' && value !== null) {
      if (value.min !== undefined && value.max !== undefined) {
        return `${value.min}-${value.max}`;
      }
      return JSON.stringify(value);
    }
    return String(value).toLowerCase().trim();
  }

  private normalizeLocations(locations: string[]): string[] {
    const normalized = new Set<string>();
    const subregions = new Set<string>();
    
    for (const loc of locations) {
      const lower = String(loc).toLowerCase();
      
      // Main regions
      if (lower.includes('austria') || lower === 'at') {
        normalized.add('austria');
        // Extract subregion if available
        if (lower.includes('vienna') || lower.includes('wien')) {
          subregions.add('vienna');
        } else if (lower.includes('tyrol') || lower.includes('tirol')) {
          subregions.add('tyrol');
        } else if (lower.includes('salzburg')) {
          subregions.add('salzburg');
        }
      } else if (lower.includes('germany') || lower.includes('deutschland') || lower === 'de') {
        normalized.add('germany');
        if (lower.includes('berlin')) {
          subregions.add('berlin');
        } else if (lower.includes('munich') || lower.includes('münchen')) {
          subregions.add('munich');
        }
      } else if (lower.includes('eu') || lower.includes('europe') || lower.includes('european')) {
        normalized.add('eu');
      } else if (lower.includes('international') || lower.includes('global')) {
        normalized.add('international');
      }
    }
    
    // Combine main regions with subregions
    const result = Array.from(normalized);
    if (subregions.size > 0 && result.includes('austria')) {
      // Add subregions as additional options
      subregions.forEach(sub => {
        if (!result.includes(sub)) {
          result.push(sub);
        }
      });
    }
    
    return result.length > 0 ? result : ['austria', 'eu', 'international'];
  }

  private createAgeRanges(ages: number[]): Array<{value: string, label: string}> {
    const ranges = [];
    if (ages.some(a => a <= 2)) ranges.push({ value: '0_2_years', label: 'wizard.options.under2Years' });
    if (ages.some(a => a > 2 && a <= 5)) ranges.push({ value: '2_5_years', label: 'wizard.options.2to5Years' });
    if (ages.some(a => a > 5 && a <= 10)) ranges.push({ value: '5_10_years', label: 'wizard.options.5to10Years' });
    if (ages.some(a => a > 10)) ranges.push({ value: 'over_10_years', label: 'wizard.options.over10Years' });
    return ranges.length > 0 ? ranges : [
      { value: '0_2_years', label: 'wizard.options.under2Years' },
      { value: '2_5_years', label: 'wizard.options.2to5Years' },
      { value: '5_10_years', label: 'wizard.options.5to10Years' },
      { value: 'over_10_years', label: 'wizard.options.over10Years' }
    ];
  }

  private createRevenueRanges(revenues: string[]): Array<{value: string, label: string}> {
    const ranges = [];
    if (revenues.some(r => r.includes('100000') || r.includes('100k'))) {
      ranges.push({ value: 'under_100k', label: 'wizard.options.under100k' });
    }
    if (revenues.some(r => r.includes('500000') || r.includes('500k'))) {
      ranges.push({ value: '100k_500k', label: 'wizard.options.100kto500k' });
    }
    if (revenues.some(r => r.includes('2000000') || r.includes('2m'))) {
      ranges.push({ value: '500k_2m', label: 'wizard.options.500kto2m' });
    }
    ranges.push({ value: 'over_2m', label: 'wizard.options.over2m' });
    return ranges.length > 0 ? ranges : [
      { value: 'under_100k', label: 'wizard.options.under100k' },
      { value: '100k_500k', label: 'wizard.options.100kto500k' },
      { value: '500k_2m', label: 'wizard.options.500kto2m' },
      { value: 'over_2m', label: 'wizard.options.over2m' }
    ];
  }

  private createTeamRanges(sizes: number[]): Array<{value: string, label: string}> {
    const ranges = [];
    if (sizes.some(s => s <= 2)) ranges.push({ value: '1_2_people', label: 'wizard.options.1to2People' });
    if (sizes.some(s => s > 2 && s <= 5)) ranges.push({ value: '3_5_people', label: 'wizard.options.3to5People' });
    if (sizes.some(s => s > 5 && s <= 10)) ranges.push({ value: '6_10_people', label: 'wizard.options.6to10People' });
    if (sizes.some(s => s > 10)) ranges.push({ value: 'over_10_people', label: 'wizard.options.over10People' });
    return ranges.length > 0 ? ranges : [
      { value: '1_2_people', label: 'wizard.options.1to2People' },
      { value: '3_5_people', label: 'wizard.options.3to5People' },
      { value: '6_10_people', label: 'wizard.options.6to10People' },
      { value: 'over_10_people', label: 'wizard.options.over10People' }
    ];
  }

  private createFundingAmountRanges(amounts: string[]): Array<{value: string, label: string}> {
    const ranges = [];
    if (amounts.some(a => a.includes('50000') || a.includes('50k'))) {
      ranges.push({ value: 'under_50k', label: 'Under €50k' });
    }
    if (amounts.some(a => a.includes('200000') || a.includes('200k'))) {
      ranges.push({ value: '50k_200k', label: '€50k - €200k' });
    }
    if (amounts.some(a => a.includes('500000') || a.includes('500k'))) {
      ranges.push({ value: '200k_500k', label: '€200k - €500k' });
    }
    ranges.push({ value: 'over_500k', label: 'Over €500k' });
    return ranges.length > 0 ? ranges : [
      { value: 'under_50k', label: 'Under €50k' },
      { value: '50k_200k', label: '€50k - €200k' },
      { value: '200k_500k', label: '€200k - €500k' },
      { value: 'over_500k', label: 'Over €500k' }
    ];
  }

  // Removed: createTRLOptions - TRL question removed (too technical)
  // Removed: createCoFinancingOptions - Co-financing now uses yes/no instead of percentages

  // Parsing functions
  private parseAgeFromValue(value: any): number {
    if (typeof value === 'number') return value;
    const str = String(value).toLowerCase();
    const match = str.match(/(\d+)/);
    return match ? parseInt(match[1]) : NaN;
  }

  private parseSizeFromValue(value: any): number {
    if (typeof value === 'number') return value;
    const str = String(value).toLowerCase();
    const match = str.match(/(\d+)/);
    return match ? parseInt(match[1]) : NaN;
  }

  // Removed: parseTRLFromValue - TRL question removed (too technical)

  private parsePercentageFromValue(value: any): number {
    if (typeof value === 'number') return value;
    const str = String(value).toLowerCase().replace('%', '').trim();
    const match = str.match(/(\d+)/);
    return match ? parseInt(match[1]) : NaN;
  }

  private parseAge(answer: string): number {
    if (answer.includes('0_2') || answer.includes('2_years')) return 2;
    if (answer.includes('2_5') || answer.includes('5_years')) return 5;
    if (answer.includes('5_10') || answer.includes('10_years')) return 10;
    return 20;
  }

  private parseRevenue(answer: string): number {
    if (answer.includes('under_100')) return 50000;
    if (answer.includes('100k_500')) return 250000;
    if (answer.includes('500k_2m')) return 1000000;
    return 5000000;
  }

  private parseTeamSize(answer: string): number {
    if (answer.includes('1_2')) return 1;
    if (answer.includes('3_5')) return 3;
    if (answer.includes('6_10')) return 6;
    return 10;
  }

  private parseFundingAmount(answer: string): number {
    // Parse user's desired funding amount from answer
    if (answer.includes('under_50')) return 25000;
    if (answer.includes('50k_200')) return 100000;
    if (answer.includes('200k_500')) return 350000;
    if (answer.includes('over_500')) return 500000;
    return 500000; // Default to 500k
  }

  // Removed: parseTRL - TRL question removed (too technical)
  // Removed: parsePercentage - Co-financing now uses yes/no instead of percentages

  // parseDurationFromValue - REMOVED: Question removed (project_duration)
  // private parseDurationFromValue(value: any): number { ... }

  // createDurationRanges - REMOVED: Question removed (project_duration)
  // private createDurationRanges(durations: number[]): Array<{value: string, label: string}> { ... }
}
