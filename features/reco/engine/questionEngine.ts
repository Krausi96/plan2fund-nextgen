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

    // Second pass: Ensure CORE 8 questions are always generated (even if below threshold)
    // Core questions that are essential for finding the right funding program
    const coreQuestionIds = ['location', 'company_type', 'funding_amount', 'use_of_funds', 
      'impact', 'team_size', 'deadline_urgency', 'project_duration'];
    
    // Conditional/Overlay questions (refinement, not critical for filtering)
    const conditionalQuestionIds = ['consortium', 'market_size', 'project_stage', 'research_focus', 'co_financing'];
    
    const importantQuestionIds = [...coreQuestionIds, ...conditionalQuestionIds];
    
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
    // CORE 8 QUESTIONS (for initial filtering - most important for finding programs):
    // 1. location, 2. company_type, 3. funding_amount, 4. use_of_funds, 
    // 5. impact, 6. team_size, 7. deadline_urgency, 8. project_duration
    // CONDITIONAL/OVERLAY QUESTIONS (refinement only - not critical):
    // 9. consortium, 10. market_size, 11. project_stage, 12. research_focus, 13. co_financing
    const importanceOrder: Record<string, number> = {
      // CORE 8 (always asked first - essential for filtering)
      'location': 1,           // 1. Location (geographic filtering)
      'company_type': 2,       // 2. Company type (eligibility)
      'funding_amount': 3,     // 3. Funding amount (financial fit)
      'use_of_funds': 4,      // 4. Use of funds (project fit)
      'impact': 5,            // 5. Impact focus (program alignment)
      'team_size': 6,         // 6. Team size (eligibility)
      'deadline_urgency': 7,   // 7. Deadline urgency (when do you need funding?)
      'project_duration': 8,   // 8. Project duration (timeline fit)
      
      // CONDITIONAL/OVERLAY (asked when needed - not critical)
      'consortium': 9,        // 9. Consortium (overlay - refinement only)
      'market_size': 10,      // 10. Market size (overlay - refinement only)
      'project_stage': 11,    // 11. Project stage (how developed is your project?)
      'research_focus': 12,   // 12. Research focus (project refinement)
      'co_financing': 13,     // 13. Co-financing (financial refinement)
      'company_age': 14,      // 14. Company age (conditional - if needed)
      'revenue': 15          // 15. Revenue (conditional - if needed)
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
    
    // Project - Development stage (how developed is the project - overlay question)
    // Maps to company_stage but asks about PROJECT maturity, not company stage
    // Note: eligibility:company_stage maps to company_type (core), not project_stage
    // project_stage is separate overlay question about project development
    if (category === 'project' && (type.includes('development') || type.includes('maturity') || type.includes('stage'))) {
      return 'project_stage';
    }

    // Eligibility - Sector - REMOVED: Dynamic options without translations, overlaps with industry
    // if (category === 'eligibility' && (type === 'sector' || type.includes('sector') || type.includes('branche'))) {
    //   return 'sector';
    // }

    // Timeline - Deadline - IMPORTANT: When user needs funding (urgency)
    if (category === 'timeline' && (type === 'deadline' || type.includes('deadline') || type.includes('frist'))) {
      return 'deadline_urgency';
    }

    // Timeline - Duration - IMPORTANT: Project timeline fit
    if (category === 'timeline' && (type === 'duration' || type.includes('duration') || type.includes('dauer') || type.includes('laufzeit'))) {
      return 'project_duration';
    }

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

    // Deadline urgency question - IMPORTANT: When user needs funding
    if (questionId === 'deadline_urgency') {
      return {
        id: 'deadline_urgency',
        symptom: 'wizard.questions.deadlineUrgency',
        type: 'single-select',
        options: [
          { value: 'within_1_month', label: 'wizard.options.within1Month' },
          { value: 'within_3_months', label: 'wizard.options.within3Months' },
          { value: 'within_6_months', label: 'wizard.options.within6Months' },
          { value: 'more_than_6_months', label: 'wizard.options.moreThan6Months' }
        ],
        required: false,
        category: 'timeline',
        priority
      };
    }

    // Project duration question - IMPORTANT: How long is the project
    if (questionId === 'project_duration') {
      return {
        id: 'project_duration',
        symptom: 'wizard.questions.projectDuration',
        type: 'single-select',
        options: [
          { value: 'less_than_6_months', label: 'wizard.options.lessThan6Months' },
          { value: '6_to_12_months', label: 'wizard.options.6to12Months' },
          { value: '1_to_2_years', label: 'wizard.options.1to2Years' },
          { value: 'more_than_2_years', label: 'wizard.options.moreThan2Years' }
        ],
        required: false,
        category: 'timeline',
        priority
      };
    }
    
    // Project stage question - How developed is your project (overlay)
    if (questionId === 'project_stage') {
      return {
        id: 'project_stage',
        symptom: 'wizard.questions.projectStage',
        type: 'single-select',
        options: [
          { value: 'idea_concept', label: 'wizard.options.ideaConcept' },
          { value: 'early_development', label: 'wizard.options.earlyDevelopment' },
          { value: 'advanced_development', label: 'wizard.options.advancedDevelopment' },
          { value: 'ready_to_launch', label: 'wizard.options.readyToLaunch' }
        ],
        required: false,
        category: 'project',
        priority
      };
    }

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
    
    // SMART CONDITIONAL FILTERING: Generate questions when filtering is ineffective
    // This is why we need it - some questions filter well, others don't filter at all
    // Generate more questions when many programs remain to improve filtering
    
    const remainingPercent = (this.remainingPrograms.length / this.allPrograms.length) * 100;
    const answersGiven = Object.keys(answers).length;
    
    // If filtering is ineffective (many programs remain after answers), generate more questions
    if (remainingPercent > 50 && answersGiven >= 3 && this.questions.length < 12) {
      // >50% remain after 3+ questions - filtering is ineffective, need more questions
      console.log(`🔗 Smart conditional: ${remainingPercent.toFixed(1)}% remain after ${answersGiven} answers - generating more questions`);
      this.generateConditionalQuestions(12);
    } else if (remainingPercent > 30 && answersGiven >= 2 && this.questions.length < 10) {
      // >30% remain after 2+ answers - moderate effectiveness
      this.generateConditionalQuestions(10);
    } else if (remainingPercent > 20 && answersGiven >= 1 && this.questions.length < 8) {
      // >20% remain after 1+ answer - some filtering happening
      this.generateConditionalQuestions(8);
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
   * SMART LOGIC: Analyzes REMAINING programs to generate relevant questions
   */
  private generateConditionalQuestions(maxQuestions: number): void {
    // Check if we already have enough questions
    const currentCount = this.questions.length;
    if (currentCount >= maxQuestions) return;
    
    const remainingCount = this.remainingPrograms.length;
    if (remainingCount === 0) return;
    
    // Analyze requirement types in REMAINING programs only
    const remainingReqFrequencies = new Map<string, {category: string, type: string, frequency: number, programs: Set<string>}>();
    
    for (const program of this.remainingPrograms) {
      const categorized = program.categorized_requirements || {};
      for (const [category, requirements] of Object.entries(categorized)) {
        if (!Array.isArray(requirements)) continue;
        
        for (const req of requirements) {
          const key = `${category}:${req.type}`;
          if (!remainingReqFrequencies.has(key)) {
            remainingReqFrequencies.set(key, {
              category,
              type: req.type,
              frequency: 0,
              programs: new Set()
            });
          }
          const entry = remainingReqFrequencies.get(key)!;
          entry.programs.add(program.id);
          entry.frequency = entry.programs.size;
        }
      }
    }
    
    // Convert to array and sort by frequency
    const remainingReqs = Array.from(remainingReqFrequencies.values())
      .sort((a, b) => b.frequency - a.frequency);
    
    // Use threshold based on REMAINING programs (2% minimum, or at least 2 programs)
    const LOWER_THRESHOLD = Math.max(2, Math.floor(remainingCount * 0.02));
    
    const questionIdMap = new Map(this.questions.map(q => [q.id, true]));
    let priority = currentCount;
    
    // Generate questions from requirement types that appear in remaining programs
    for (const req of remainingReqs) {
      if (this.questions.length >= maxQuestions) break;
      if (req.frequency < LOWER_THRESHOLD) continue; // Skip rare requirements in remaining programs
      
      const questionId = this.mapRequirementToQuestionId(req.category, req.type);
      
      if (!questionId || questionIdMap.has(questionId)) continue;
      
      questionIdMap.set(questionId, true);
      
      // Create question using remaining programs only
      const question = this.createQuestionFromRemainingPrograms(req, questionId, priority++);
      
      if (question && question.options && question.options.length > 0) {
        this.questions.push(question);
        console.log(`🔗 Conditional question added: ${questionId} (${req.frequency}/${remainingCount} remaining programs, ${question.options.length} options)`);
      }
    }
    
    // Re-sort by priority
    this.questions.sort((a, b) => a.priority - b.priority);
  }
  
  /**
   * Create question from remaining programs only (for conditional questions)
   */
  private createQuestionFromRemainingPrograms(
    req: {category: string, type: string, frequency: number},
    questionId: string,
    priority: number
  ): SymptomQuestion | null {
    // Extract options from remaining programs only
    const optionSet = new Set<string>();
    
    for (const program of this.remainingPrograms) {
      const categorized = program.categorized_requirements || {};
      const categoryReqs = categorized[req.category] || [];
      
      for (const requirement of categoryReqs) {
        if (requirement.type !== req.type) continue;
        
        const value = this.extractValueForQuestion(requirement, questionId);
        if (value) {
          optionSet.add(value);
        }
      }
    }
    
    // Use existing createQuestionFromRequirement to get the question structure
    // But we'll override the options
    const tempReq: RequirementTypeFrequency = { 
      category: req.category, 
      type: req.type, 
      frequency: req.frequency,
      values: new Map(),
      programs: new Set()
    };
    const question = this.createQuestionFromRequirement(tempReq, questionId, priority);
    
    if (!question) return null;
    
    // Recalculate options from remaining programs
    // Use hardcoded options based on questionId (same as createQuestionFromRequirement)
    const options: Array<{value: string, label: string}> = [];
    const uniqueValues = Array.from(optionSet);
    
    // Map to clean options based on question type
    if (questionId === 'location') {
      const normalized = this.normalizeLocations(uniqueValues);
      options.push(...normalized.map(loc => ({
        value: loc,
        label: `wizard.options.${loc}`
      })));
    } else if (questionId === 'company_type') {
      // Use standard company type options
      const typeSet = new Set<string>();
      uniqueValues.forEach(v => {
        const lower = String(v).toLowerCase();
        if (lower.includes('startup') || lower.includes('ideation')) typeSet.add('startup');
        if (lower.includes('sme') || lower.includes('small')) typeSet.add('sme');
        if (lower.includes('large')) typeSet.add('large');
        if (lower.includes('research') || lower.includes('university')) typeSet.add('research');
      });
      Array.from(typeSet).forEach(type => {
        options.push({ value: type, label: `wizard.options.${type}` });
      });
    } else {
      // For other questions, use extracted values directly
      uniqueValues.forEach(value => {
        options.push({ value: String(value), label: `wizard.options.${value}` });
      });
    }
    
    if (options.length === 0) return null;
    
    question.options = options;
    return question;
  }
  
  /**
   * Extract value for a question from a requirement
   */
  private extractValueForQuestion(requirement: any, questionId: string): string | null {
    const value = requirement.value;
    if (!value) return null;
    
    // Use same extraction logic as matching functions
    if (questionId === 'location') {
      return this.extractLocationValue(value);
    } else if (questionId === 'company_type') {
      return this.extractCompanyTypeValue(value);
    } else if (questionId === 'funding_amount') {
      return this.extractFundingAmountValue(value);
    } else if (questionId === 'impact') {
      return this.extractImpactValue(value);
    }
    
    // Default: return string value
    return String(value);
  }
  
  private extractLocationValue(value: any): string | null {
    if (typeof value === 'string') {
      const lower = value.toLowerCase();
      if (lower.includes('vienna') || lower.includes('wien')) return 'vienna';
      if (lower.includes('tyrol') || lower.includes('tirol')) return 'tyrol';
      if (lower.includes('salzburg')) return 'salzburg';
      if (lower.includes('berlin')) return 'berlin';
      if (lower.includes('munich') || lower.includes('münchen')) return 'munich';
      if (lower.includes('austria') || lower.includes('österreich')) return 'austria';
      if (lower.includes('germany') || lower.includes('deutschland')) return 'germany';
      if (lower.includes('eu') || lower.includes('europe') || lower.includes('european')) return 'eu';
    }
    return null;
  }
  
  private extractCompanyTypeValue(value: any): string | null {
    if (typeof value === 'string') {
      const lower = value.toLowerCase();
      if (lower.includes('startup') || lower.includes('ideation') || lower.includes('concept')) return 'startup';
      if (lower.includes('sme') || lower.includes('small') || lower.includes('medium')) return 'sme';
      if (lower.includes('large') || lower.includes('enterprise')) return 'large';
      if (lower.includes('research') || lower.includes('university') || lower.includes('academic')) return 'research';
    }
    return null;
  }
  
  private extractFundingAmountValue(value: any): string | null {
    const num = this.parseFundingAmountValue(value);
    if (num === null) return null;
    if (num >= 500000) return 'over_500k';
    if (num >= 200000) return '200k_500k';
    return 'under_200k';
  }
  
  private extractImpactValue(value: any): string | null {
    if (typeof value === 'string') {
      const lower = value.toLowerCase();
      if (lower.includes('climate') || lower.includes('environment') || lower.includes('sustainability')) return 'sustainability';
      if (lower.includes('employment') || lower.includes('jobs') || lower.includes('arbeitsplatz')) return 'employment';
      if (lower.includes('innovation') || lower.includes('technology')) return 'innovation';
      if (lower.includes('social') || lower.includes('community')) return 'social';
    }
    return null;
  }
  
  private parseFundingAmountValue(value: any): number | null {
    if (typeof value === 'number') return value;
    if (typeof value !== 'string') return null;
    
    // Remove currency symbols and commas
    const cleaned = value.replace(/[€$£,]/g, '').trim();
    const match = cleaned.match(/([\d.]+)\s*(million|mio|m|thousand|k)?/i);
    if (!match) return null;
    
    let num = parseFloat(match[1]);
    const unit = match[2]?.toLowerCase();
    if (unit === 'million' || unit === 'mio' || unit === 'm') num *= 1000000;
    else if (unit === 'thousand' || unit === 'k') num *= 1000;
    
    return num;
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
    
    // Save current state
    const originalAllPrograms = this.allPrograms;
    const originalRemainingPrograms = this.remainingPrograms;
    
    // Temporarily set programs for filtering
    this.allPrograms = programsToFilter;
    this.remainingPrograms = programsToFilter; // Start with all programs
    
    try {
      // Filter and update remainingPrograms
      const filtered = this.filterPrograms(answers);
      this.remainingPrograms = filtered;
      return filtered;
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

    // Impact filter (multi-select support - handle both array and single string)
    if (answers.impact) {
      const before = filtered.length;
      const impactArray = Array.isArray(answers.impact) ? answers.impact : [answers.impact];
      if (impactArray.length > 0) {
        filtered = filtered.filter(program => this.matchesImpact(program, impactArray));
      const after = filtered.length;
        console.log(`🔍 Impact filter (${impactArray.join(', ')}): ${before} → ${after} (${before - after} filtered)`);
      }
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

    // Deadline urgency filter
    if (answers.deadline_urgency) {
      const before = filtered.length;
      filtered = filtered.filter(program => this.matchesDeadlineUrgency(program, answers.deadline_urgency));
      const after = filtered.length;
      console.log(`🔍 Deadline urgency filter (${answers.deadline_urgency}): ${before} → ${after} (${before - after} filtered)`);
    }

    // Project duration filter
    if (answers.project_duration) {
      const before = filtered.length;
      filtered = filtered.filter(program => this.matchesProjectDuration(program, answers.project_duration));
      const after = filtered.length;
      console.log(`🔍 Project duration filter (${answers.project_duration}): ${before} → ${after} (${before - after} filtered)`);
    }

    // Project stage filter (overlay)
    if (answers.project_stage) {
      const before = filtered.length;
      filtered = filtered.filter(program => this.matchesProjectStage(program, answers.project_stage));
      const after = filtered.length;
      console.log(`🔍 Project stage filter (${answers.project_stage}): ${before} → ${after} (${before - after} filtered)`);
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
    
    // Check team requirements - user must meet minimum
    if (categorized?.team) {
      const teamReqs = categorized.team.filter((r: any) => 
        r.type === 'min_team_size' || r.type === 'team_size' || r.type === 'team_requirement'
      );
      if (teamReqs.length > 0) {
        // Parse min size from requirement value
        for (const req of teamReqs) {
          const minSize = this.parseSizeFromValue(req.value);
          if (!isNaN(minSize) && userSize < minSize) {
            return false; // User doesn't meet minimum
          }
        }
      }
    }
    
    if (eligibility?.min_team_size) {
      const minSize = typeof eligibility.min_team_size === 'number' 
        ? eligibility.min_team_size 
        : this.parseSizeFromValue(eligibility.min_team_size);
      if (!isNaN(minSize) && userSize < minSize) return false;
    }
    
    // If no team size requirement, include program (default to available)
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
    
    // Has impact requirement but no match - exclude if requirement is mandatory
    // But if requirement is optional, include program
    const hasRequired = categorized.impact.some((r: any) => r.required === true);
    return !hasRequired; // Include if not required, exclude if required
  }

  // @ts-ignore - Used in filterPrograms
  private matchesMarketSize(program: Program, userMarket: string): boolean {
    const categorized = (program as any).categorized_requirements;
    if (categorized?.market_size && categorized.market_size.length > 0) {
      // Check ALL market_size requirement types (not just 'market_scope')
      const marketReqs = categorized.market_size;
      const progMarkets = marketReqs.map((r: any) => String(r.value || r.type || '').toLowerCase());
        const userM = String(userMarket).toLowerCase();
      
      // Map user selections to program values
      const marketMapping: Record<string, string[]> = {
        'local': ['local', 'regional', 'region', 'lokaler', 'regionaler'],
        'national': ['national', 'country', 'österreich', 'austria', 'germany', 'deutschland'],
        'eu': ['eu', 'europe', 'european', 'europäisch'],
        'international': ['international', 'global', 'worldwide', 'weltweit']
      };
      
      const userKeywords = marketMapping[userM] || [userM];
      
      // Check if any program market matches user keywords
      return progMarkets.some((m: string) => 
        userKeywords.some(keyword => m.includes(keyword) || keyword.includes(m)) ||
        m.includes(userM) || userM.includes(m)
      );
    }
    // If no market_size requirement, show program (default to available)
    return true;
  }

  // @ts-ignore - Used in filterPrograms
  private matchesDeadlineUrgency(program: Program, userUrgency: string): boolean {
    const categorized = (program as any).categorized_requirements;
    if (!categorized?.timeline) return true; // No deadline requirement = available
    
    // Find deadline requirements
    const deadlines = categorized.timeline.filter((r: any) => 
      r.type.includes('deadline') || r.type.includes('frist')
    );
    
    if (deadlines.length === 0) return true; // No deadline = available
    
    // Parse deadline dates from requirements
    const now = new Date();
    const urgencyMonths: Record<string, number> = {
      'within_1_month': 1,
      'within_3_months': 3,
      'within_6_months': 6,
      'more_than_6_months': 12
    };
    
    const userMonths = urgencyMonths[userUrgency] || 6;
    const deadlineDate = new Date(now.getTime() + userMonths * 30 * 24 * 60 * 60 * 1000);
    
    // Check if any program deadline is within user's timeframe
    for (const deadline of deadlines) {
      const deadlineStr = String(deadline.value || '').toLowerCase();
      // Try to extract date from deadline string
      const dateMatch = deadlineStr.match(/(\d{1,2})[.\s]+(\d{1,2})[.\s]+(\d{4})/); // DD.MM.YYYY or DD MM YYYY
      if (dateMatch) {
        const [, day, month, year] = dateMatch;
        const progDeadline = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        if (progDeadline >= now && progDeadline <= deadlineDate) {
          return true; // Program deadline matches user urgency
        }
      }
    }
    
    // If can't parse date, show program (default to available)
    return true;
  }

  // @ts-ignore - Used in filterPrograms
  private matchesProjectDuration(program: Program, userDuration: string): boolean {
    const categorized = (program as any).categorized_requirements;
    if (!categorized?.timeline) return true; // No duration requirement = available
    
    // Find duration requirements
    const durations = categorized.timeline.filter((r: any) => 
      r.type.includes('duration') || r.type.includes('dauer') || r.type.includes('laufzeit')
    );
    
    if (durations.length === 0) return true; // No duration requirement = available
    
    // Map user duration to months
    const durationMonths: Record<string, {min: number, max: number}> = {
      'less_than_6_months': { min: 0, max: 6 },
      '6_to_12_months': { min: 6, max: 12 },
      '1_to_2_years': { min: 12, max: 24 },
      'more_than_2_years': { min: 24, max: 999 }
    };
    
    const userRange = durationMonths[userDuration] || { min: 0, max: 999 };
    
    // Parse duration from requirement values
    for (const duration of durations) {
      const durationStr = String(duration.value || '').toLowerCase();
      
      // Extract months/years from duration string
      const monthMatch = durationStr.match(/(\d+)\s*(month|monat|m)/i);
      const yearMatch = durationStr.match(/(\d+)\s*(year|jahr|y)/i);
      
      let progMonths = 0;
      if (monthMatch) {
        progMonths = parseInt(monthMatch[1]);
      } else if (yearMatch) {
        progMonths = parseInt(yearMatch[1]) * 12;
      } else {
        // Try to extract number (assume months if < 50, years if >= 50)
        const numMatch = durationStr.match(/(\d+)/);
        if (numMatch) {
          const num = parseInt(numMatch[1]);
          progMonths = num < 50 ? num : num * 12;
        }
      }
      
      if (progMonths > 0 && progMonths >= userRange.min && progMonths <= userRange.max) {
        return true; // Program duration matches user duration
      }
    }
    
    // If can't parse duration, show program (default to available)
    return true;
  }

  // @ts-ignore - Used in filterPrograms
  private matchesProjectStage(program: Program, userStage: string): boolean {
    const categorized = (program as any).categorized_requirements;
    
    // Check eligibility:company_stage (can be used for project stage)
    if (categorized?.eligibility) {
      const stageReqs = categorized.eligibility.filter((r: any) => 
        r.type === 'company_stage' || r.type.includes('stage')
      );
      
      for (const req of stageReqs) {
        const reqValue = String(req.value || '').toLowerCase();
        
        // Map user stage to requirement values
        const stageMapping: Record<string, string[]> = {
          'idea_concept': ['ideation', 'concept', 'idea', 'early', 'pre-startup'],
          'early_development': ['development', 'prototype', 'early', 'startup'],
          'advanced_development': ['advanced', 'testing', 'pilot', 'growth'],
          'ready_to_launch': ['ready', 'launch', 'market', 'mature', 'established']
        };
        
        const keywords = stageMapping[userStage] || [];
        if (keywords.some(keyword => reqValue.includes(keyword))) {
          return true; // Match found
        }
      }
    }
    
    // If no stage requirement, show program (default to available)
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
