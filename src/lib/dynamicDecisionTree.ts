// Dynamic Decision Tree System - Phase 3 Step 1
// Generates personalized questions based on program requirements

export interface DecisionTreeQuestion {
  id: string;
  question: string;
  type: 'single' | 'multiple' | 'text' | 'number' | 'boolean';
  options?: Array<{ value: string; label: string; weight?: number }>;
  required: boolean;
  program_specific: boolean;
  section_hint?: string;
  validation_rules?: {
    min_length?: number;
    max_length?: number;
    min_value?: number;
    max_value?: number;
    pattern?: string;
  };
  follow_up_questions?: string[];
  ai_guidance?: string;
}

export interface DecisionTreeResult {
  programId: string;
  questions: DecisionTreeQuestion[];
  total_questions: number;
  estimated_time: number; // in minutes
  difficulty: 'easy' | 'medium' | 'hard';
}

export class DynamicDecisionTreeEngine {
  private programData: any;

  constructor(programData: any) {
    this.programData = programData;
  }

  /**
   * Generate dynamic decision tree questions based on program requirements
   */
  generateDecisionTree(programId: string): DecisionTreeResult {
    const program = this.programData.find((p: any) => p.id === programId);
    if (!program) {
      throw new Error(`Program ${programId} not found`);
    }

    const questions = this.buildQuestionsFromProgram(program);
    const totalQuestions = questions.length;
    const estimatedTime = this.calculateEstimatedTime(questions);
    const difficulty = this.calculateDifficulty(program);

    return {
      programId,
      questions,
      total_questions: totalQuestions,
      estimated_time: estimatedTime,
      difficulty
    };
  }

  /**
   * Build questions from program data
   */
  private buildQuestionsFromProgram(program: any): DecisionTreeQuestion[] {
    const questions: DecisionTreeQuestion[] = [];

    // 1. Use categorized requirements if available (Layer 1&2)
    if (program.categorized_requirements && Object.keys(program.categorized_requirements).length > 0) {
      questions.push(...this.generateQuestionsFromCategorizedRequirements(program.categorized_requirements));
    } else {
      // 2. Fallback to basic eligibility questions
      questions.push(...this.generateEligibilityQuestions(program));

      // 3. Program-specific questions from decision_tree_questions
      if (program.decision_tree_questions && Array.isArray(program.decision_tree_questions)) {
        questions.push(...program.decision_tree_questions.map((q: any) => ({
          ...q,
          program_specific: true,
          required: true
        })));
      }

      // 4. Funding amount questions
      questions.push(...this.generateFundingQuestions(program));

      // 5. Timeline questions
      questions.push(...this.generateTimelineQuestions(program));

      // 6. Team and experience questions
      questions.push(...this.generateTeamQuestions(program));

      // 7. Industry-specific questions
      questions.push(...this.generateIndustryQuestions(program));
    }

    // 7. Document readiness questions
    questions.push(...this.generateDocumentQuestions(program));

    return questions;
  }

  /**
   * Generate questions from categorized requirements (Layer 1&2)
   */
  private generateQuestionsFromCategorizedRequirements(categorizedRequirements: any): DecisionTreeQuestion[] {
    const questions: DecisionTreeQuestion[] = [];
    let questionIndex = 0;

    Object.entries(categorizedRequirements).forEach(([category, data]: [string, any]) => {
      if (data && Array.isArray(data) && data.length > 0) {
        const categoryQuestions = this.createQuestionsForCategory(category, data, questionIndex);
        questions.push(...categoryQuestions);
        questionIndex += categoryQuestions.length;
      }
    });

    // Add skip logic between questions
    this.addSkipLogic(questions);

    return questions;
  }

  /**
   * Create questions for a specific category from categorized requirements
   */
  private createQuestionsForCategory(category: string, data: any[], startIndex: number): DecisionTreeQuestion[] {
    const questions: DecisionTreeQuestion[] = [];

    switch (category) {
      case 'co_financing':
        questions.push(this.createCoFinancingQuestion(data, startIndex));
        break;
      case 'trl_level':
        questions.push(this.createTRLQuestion(data, startIndex));
        break;
      case 'impact':
        questions.push(this.createImpactQuestion(data, startIndex));
        break;
      case 'consortium':
        questions.push(this.createConsortiumQuestion(data, startIndex));
        break;
      case 'eligibility':
        questions.push(this.createEligibilityQuestion(data, startIndex));
        break;
      case 'financial':
        questions.push(this.createFinancialQuestion(data, startIndex));
        break;
      case 'team':
        questions.push(this.createTeamQuestion(data, startIndex));
        break;
      case 'project':
        questions.push(this.createProjectQuestion(data, startIndex));
        break;
      case 'geographic':
        questions.push(this.createGeographicQuestion(data, startIndex));
        break;
      case 'timeline':
        questions.push(this.createTimelineQuestion(data, startIndex));
        break;
      case 'technical':
        questions.push(this.createTechnicalQuestion(data, startIndex));
        break;
      case 'legal':
        questions.push(this.createLegalQuestion(data, startIndex));
        break;
      case 'compliance':
        questions.push(this.createComplianceQuestion(data, startIndex));
        break;
      case 'documents':
        questions.push(this.createDocumentsQuestion(data, startIndex));
        break;
      case 'capex_opex':
        questions.push(this.createCapexOpexQuestion(data, startIndex));
        break;
      case 'use_of_funds':
        questions.push(this.createUseOfFundsQuestion(data, startIndex));
        break;
      case 'revenue_model':
        questions.push(this.createRevenueModelQuestion(data, startIndex));
        break;
      case 'market_size':
        questions.push(this.createMarketSizeQuestion(data, startIndex));
        break;
    }

    return questions;
  }

  /**
   * Add skip logic between questions
   */
  private addSkipLogic(questions: DecisionTreeQuestion[]): void {
    for (let i = 0; i < questions.length - 1; i++) {
      questions[i].follow_up_questions = [questions[i + 1].id];
    }
    questions[questions.length - 1].follow_up_questions = [];
  }

  /**
   * Generate eligibility questions based on program criteria
   */
  private generateEligibilityQuestions(program: any): DecisionTreeQuestion[] {
    const questions: DecisionTreeQuestion[] = [];

    // Company stage question
    if (program.target_personas && program.target_personas.includes('startup')) {
      questions.push({
        id: 'company_stage',
        question: 'What stage is your company currently in?',
        type: 'single',
        options: [
          { value: 'idea', label: 'Idea Stage - Concept only', weight: 1 },
          { value: 'mvp', label: 'MVP/Prototype - Product in development', weight: 2 },
          { value: 'revenue', label: 'Generating Revenue - Early customers', weight: 3 },
          { value: 'growth', label: 'Growth Stage - Scaling operations', weight: 4 }
        ],
        required: true,
        program_specific: true,
        section_hint: 'executive_summary',
        ai_guidance: 'This helps determine if you meet the program\'s target stage requirements.'
      });
    }

    // Team size question
    if (program.eligibility_criteria?.min_team_size || program.eligibility_criteria?.max_team_size) {
      questions.push({
        id: 'team_size',
        question: 'How many people are currently in your team?',
        type: 'number',
        required: true,
        program_specific: true,
        validation_rules: {
          min_value: 1,
          max_value: 100
        },
        ai_guidance: 'Some programs have minimum or maximum team size requirements.'
      });
    }

    // Company age question
    if (program.eligibility_criteria?.max_age) {
      questions.push({
        id: 'company_age',
        question: 'How many years has your company been operating?',
        type: 'number',
        required: true,
        program_specific: true,
        validation_rules: {
          min_value: 0,
          max_value: 10
        },
        ai_guidance: 'This program may have age restrictions for companies.'
      });
    }

    return questions;
  }

  /**
   * Generate funding-related questions
   */
  private generateFundingQuestions(program: any): DecisionTreeQuestion[] {
    const questions: DecisionTreeQuestion[] = [];

    if (program.funding_amount_min || program.funding_amount_max) {
      questions.push({
        id: 'funding_needed',
        question: 'How much funding do you need?',
        type: 'number',
        required: true,
        program_specific: true,
        validation_rules: {
          min_value: program.funding_amount_min || 0,
          max_value: program.funding_amount_max || 1000000
        },
        ai_guidance: `This program offers between €${program.funding_amount_min?.toLocaleString() || '0'} and €${program.funding_amount_max?.toLocaleString() || 'unlimited'} in funding.`
      });
    }

    return questions;
  }

  /**
   * Generate timeline questions
   */
  private generateTimelineQuestions(program: any): DecisionTreeQuestion[] {
    const questions: DecisionTreeQuestion[] = [];

    if (program.deadline) {
      questions.push({
        id: 'application_timeline',
        question: 'When do you plan to apply for this program?',
        type: 'single',
        options: [
          { value: 'immediately', label: 'Immediately (within 1 month)', weight: 3 },
          { value: 'soon', label: 'Soon (1-3 months)', weight: 2 },
          { value: 'later', label: 'Later (3-6 months)', weight: 1 },
          { value: 'planning', label: 'Just planning (6+ months)', weight: 0 }
        ],
        required: true,
        program_specific: true,
        ai_guidance: `The application deadline is ${new Date(program.deadline).toLocaleDateString()}.`
      });
    }

    return questions;
  }

  /**
   * Generate team and experience questions
   */
  private generateTeamQuestions(_program: any): DecisionTreeQuestion[] {
    const questions: DecisionTreeQuestion[] = [];

    questions.push({
      id: 'team_experience',
      question: 'What is your team\'s experience in this industry?',
      type: 'single',
      options: [
        { value: 'none', label: 'No experience - New to industry', weight: 1 },
        { value: 'some', label: 'Some experience - 1-3 years', weight: 2 },
        { value: 'moderate', label: 'Moderate experience - 3-7 years', weight: 3 },
        { value: 'extensive', label: 'Extensive experience - 7+ years', weight: 4 }
      ],
      required: true,
      program_specific: false,
      section_hint: 'team',
      ai_guidance: 'This helps assess your team\'s readiness for the program.'
    });

    return questions;
  }

  /**
   * Generate industry-specific questions
   */
  private generateIndustryQuestions(_program: any): DecisionTreeQuestion[] {
    const questions: DecisionTreeQuestion[] = [];

    if (_program.tags && _program.tags.includes('innovation')) {
      questions.push({
        id: 'innovation_level',
        question: 'How innovative is your product/service?',
        type: 'single',
        options: [
          { value: 'incremental', label: 'Incremental improvement - Small enhancement', weight: 1 },
          { value: 'moderate', label: 'Moderate innovation - New approach', weight: 2 },
          { value: 'disruptive', label: 'Disruptive innovation - Game-changing', weight: 3 },
          { value: 'breakthrough', label: 'Breakthrough innovation - Revolutionary', weight: 4 }
        ],
        required: true,
        program_specific: true,
        section_hint: 'innovation',
        ai_guidance: 'This program focuses on innovative projects and technologies.'
      });
    }

    return questions;
  }

  /**
   * Generate document readiness questions
   */
  private generateDocumentQuestions(_program: any): DecisionTreeQuestion[] {
    const questions: DecisionTreeQuestion[] = [];

    questions.push({
      id: 'document_readiness',
      question: 'Which documents do you currently have ready?',
      type: 'multiple',
      options: [
        { value: 'business_plan', label: 'Business Plan', weight: 3 },
        { value: 'financial_projections', label: 'Financial Projections', weight: 3 },
        { value: 'pitch_deck', label: 'Pitch Deck', weight: 2 },
        { value: 'team_cv', label: 'Team CVs', weight: 2 },
        { value: 'market_research', label: 'Market Research', weight: 2 },
        { value: 'prototype', label: 'Prototype/Demo', weight: 2 },
        { value: 'patents', label: 'Patents/IP Documentation', weight: 1 },
        { value: 'none', label: 'None yet - Need to create', weight: 0 }
      ],
      required: true,
      program_specific: false,
      section_hint: 'documents',
      ai_guidance: 'This helps determine what documents you need to prepare for the application.'
    });

    return questions;
  }

  /**
   * Calculate estimated time to complete questions
   */
  private calculateEstimatedTime(questions: DecisionTreeQuestion[]): number {
    const timePerQuestion = {
      'single': 1,
      'multiple': 2,
      'text': 3,
      'number': 1,
      'boolean': 0.5
    };

    return questions.reduce((total, question) => {
      return total + (timePerQuestion[question.type] || 1);
    }, 0);
  }

  /**
   * Calculate difficulty based on program requirements
   */
  private calculateDifficulty(program: any): 'easy' | 'medium' | 'hard' {
    let score = 0;

    // More funding = harder
    if (program.funding_amount_max > 500000) score += 2;
    else if (program.funding_amount_max > 100000) score += 1;

    // More requirements = harder
    if (program.requirements && Object.keys(program.requirements).length > 5) score += 2;
    else if (program.requirements && Object.keys(program.requirements).length > 3) score += 1;

    // More complex eligibility = harder
    if (program.eligibility_criteria && Object.keys(program.eligibility_criteria).length > 3) score += 1;

    // Innovation focus = harder
    if (program.tags && program.tags.includes('innovation')) score += 1;

    if (score >= 4) return 'hard';
    if (score >= 2) return 'medium';
    return 'easy';
  }

  /**
   * Get follow-up questions based on answers
   */
  getFollowUpQuestions(_questionId: string, _answer: any): DecisionTreeQuestion[] {
    // This would be implemented to show additional questions based on previous answers
    // For now, return empty array
    return [];
  }

  /**
   * Validate answers against program requirements
   */
  validateAnswers(answers: Record<string, any>): {
    valid: boolean;
    errors: string[];
    warnings: string[];
    recommendations: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Validate required questions
    const requiredQuestions = this.getRequiredQuestions();
    for (const question of requiredQuestions) {
      if (!answers[question.id]) {
        errors.push(`Question "${question.question}" is required`);
      }
    }

    // Validate funding amount
    if (answers.funding_needed) {
      const program = this.programData.find((p: any) => p.id === this.programData[0]?.id);
      if (program) {
        if (answers.funding_needed < program.funding_amount_min) {
          warnings.push(`Requested funding (€${answers.funding_needed.toLocaleString()}) is below minimum (€${program.funding_amount_min.toLocaleString()})`);
        }
        if (answers.funding_needed > program.funding_amount_max) {
          errors.push(`Requested funding (€${answers.funding_needed.toLocaleString()}) exceeds maximum (€${program.funding_amount_max.toLocaleString()})`);
        }
      }
    }

    // Validate team size
    if (answers.team_size) {
      const program = this.programData.find((p: any) => p.id === this.programData[0]?.id);
      if (program?.eligibility_criteria) {
        if (program.eligibility_criteria.min_team_size && answers.team_size < program.eligibility_criteria.min_team_size) {
          errors.push(`Team size (${answers.team_size}) is below minimum requirement (${program.eligibility_criteria.min_team_size})`);
        }
        if (program.eligibility_criteria.max_team_size && answers.team_size > program.eligibility_criteria.max_team_size) {
          errors.push(`Team size (${answers.team_size}) exceeds maximum requirement (${program.eligibility_criteria.max_team_size})`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      recommendations
    };
  }

  /**
   * Get all required questions
   */
  private getRequiredQuestions(): DecisionTreeQuestion[] {
    // This would return all required questions
    // For now, return empty array
    return [];
  }

  /**
   * Create co-financing question from categorized data
   */
  private createCoFinancingQuestion(_data: any[], index: number): DecisionTreeQuestion {
    // const evidence = data.flatMap(d => d.evidence);
    // const confidence = Math.max(...data.map(d => d.confidence));

    return {
      id: `q_${index}`,
      question: 'What percentage can you co-finance?',
      type: 'single',
      options: [
        { value: '0-10%', label: '0-10%' },
        { value: '10-25%', label: '10-25%' },
        { value: '25-50%', label: '25-50%' },
        { value: '50%+', label: '50%+' }
      ],
      required: true,
      program_specific: true,
      validation_rules: {
        min_value: 0,
        max_value: 100
      },
      follow_up_questions: [],
      ai_guidance: 'co_financing'
    };
  }

  /**
   * Create TRL question from categorized data
   */
  private createTRLQuestion(_data: any[], index: number): DecisionTreeQuestion {
    // const evidence = data.flatMap(d => d.evidence);
    // const confidence = Math.max(...data.map(d => d.confidence));

    return {
      id: `q_${index}`,
      question: 'What is your technology readiness level (TRL)?',
      type: 'single',
      options: [
        { value: 'TRL 1-3', label: 'TRL 1-3 (Basic research)' },
        { value: 'TRL 4-6', label: 'TRL 4-6 (Development)' },
        { value: 'TRL 7-9', label: 'TRL 7-9 (Commercial)' }
      ],
      required: true,
      program_specific: true,
      validation_rules: {
        min_value: 1,
        max_value: 9
      },
      follow_up_questions: [],
      ai_guidance: 'trl_level'
    };
  }

  /**
   * Create impact question from categorized data
   */
  private createImpactQuestion(_data: any[], index: number): DecisionTreeQuestion {
    // const evidence = data.flatMap(d => d.evidence);
    // const confidence = Math.max(...data.map(d => d.confidence));

    return {
      id: `q_${index}`,
      question: 'What type of impact will your project have?',
      type: 'multiple',
      options: [
        { value: 'local', label: 'Local impact' },
        { value: 'regional', label: 'Regional impact' },
        { value: 'national', label: 'National impact' },
        { value: 'international', label: 'International impact' }
      ],
      required: true,
      program_specific: true,
      validation_rules: {},
      follow_up_questions: [],
      ai_guidance: 'impact'
    };
  }

  /**
   * Create consortium question from categorized data
   */
  private createConsortiumQuestion(_data: any[], index: number): DecisionTreeQuestion {
    // const evidence = data.flatMap(d => d.evidence);
    // const confidence = Math.max(...data.map(d => d.confidence));

    return {
      id: `q_${index}`,
      question: 'Do you have consortium partners?',
      type: 'single',
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' },
        { value: 'planning', label: 'Planning to find partners' }
      ],
      required: true,
      program_specific: true,
      validation_rules: {},
      follow_up_questions: [],
      ai_guidance: 'consortium'
    };
  }

  /**
   * Create eligibility question from categorized data
   */
  private createEligibilityQuestion(_data: any[], index: number): DecisionTreeQuestion {
    // const evidence = data.flatMap(d => d.evidence);
    // const confidence = Math.max(...data.map(d => d.confidence));

    return {
      id: `q_${index}`,
      question: 'Do you meet the eligibility requirements?',
      type: 'single',
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' },
        { value: 'partially', label: 'Partially' }
      ],
      required: true,
      program_specific: true,
      validation_rules: {},
      follow_up_questions: [],
      ai_guidance: 'eligibility'
    };
  }

  /**
   * Create financial question from categorized data
   */
  private createFinancialQuestion(_data: any[], index: number): DecisionTreeQuestion {
    // const evidence = data.flatMap(d => d.evidence);
    // const confidence = Math.max(...data.map(d => d.confidence));

    return {
      id: `q_${index}`,
      question: 'What is your funding requirement?',
      type: 'single',
      options: [
        { value: '<50k', label: '< €50k' },
        { value: '50k-100k', label: '€50k - €100k' },
        { value: '100k-500k', label: '€100k - €500k' },
        { value: '500k+', label: '€500k+' }
      ],
      required: true,
      program_specific: true,
      validation_rules: {},
      follow_up_questions: [],
      ai_guidance: 'financial'
    };
  }

  /**
   * Create team question from categorized data
   */
  private createTeamQuestion(_data: any[], index: number): DecisionTreeQuestion {
    // const evidence = data.flatMap(d => d.evidence);
    // const confidence = Math.max(...data.map(d => d.confidence));

    return {
      id: `q_${index}`,
      question: 'What is your team composition?',
      type: 'single',
      options: [
        { value: '1-2', label: '1-2 people' },
        { value: '3-5', label: '3-5 people' },
        { value: '6-10', label: '6-10 people' },
        { value: '10+', label: '10+ people' }
      ],
      required: true,
      program_specific: true,
      validation_rules: {},
      follow_up_questions: [],
      ai_guidance: 'team'
    };
  }

  /**
   * Create project question from categorized data
   */
  private createProjectQuestion(_data: any[], index: number): DecisionTreeQuestion {
    // const evidence = data.flatMap(d => d.evidence);
    // const confidence = Math.max(...data.map(d => d.confidence));

    return {
      id: `q_${index}`,
      question: 'What is your project focus?',
      type: 'multiple',
      options: [
        { value: 'innovation', label: 'Innovation' },
        { value: 'research', label: 'Research' },
        { value: 'development', label: 'Development' },
        { value: 'commercialization', label: 'Commercialization' }
      ],
      required: true,
      program_specific: true,
      validation_rules: {},
      follow_up_questions: [],
      ai_guidance: 'project'
    };
  }

  /**
   * Create geographic question from categorized data
   */
  private createGeographicQuestion(_data: any[], index: number): DecisionTreeQuestion {
    // const evidence = data.flatMap(d => d.evidence);
    // const confidence = Math.max(...data.map(d => d.confidence));

    return {
      id: `q_${index}`,
      question: 'Where is your project located?',
      type: 'single',
      options: [
        { value: 'austria', label: 'Austria' },
        { value: 'eu', label: 'EU' },
        { value: 'international', label: 'International' }
      ],
      required: true,
      program_specific: true,
      validation_rules: {},
      follow_up_questions: [],
      ai_guidance: 'geographic'
    };
  }

  /**
   * Create timeline question from categorized data
   */
  private createTimelineQuestion(_data: any[], index: number): DecisionTreeQuestion {
    // const evidence = data.flatMap(d => d.evidence);
    // const confidence = Math.max(...data.map(d => d.confidence));

    return {
      id: `q_${index}`,
      question: 'What is your project timeline?',
      type: 'single',
      options: [
        { value: '<6months', label: '< 6 months' },
        { value: '6-12months', label: '6-12 months' },
        { value: '1-2years', label: '1-2 years' },
        { value: '2+years', label: '2+ years' }
      ],
      required: true,
      program_specific: true,
      validation_rules: {},
      follow_up_questions: [],
      ai_guidance: 'timeline'
    };
  }

  /**
   * Create technical question from categorized data
   */
  private createTechnicalQuestion(_data: any[], index: number): DecisionTreeQuestion {
    // const evidence = data.flatMap(d => d.evidence);
    // const confidence = Math.max(...data.map(d => d.confidence));

    return {
      id: `q_${index}`,
      question: 'What is your technical readiness level?',
      type: 'single',
      options: [
        { value: 'basic', label: 'Basic' },
        { value: 'intermediate', label: 'Intermediate' },
        { value: 'advanced', label: 'Advanced' },
        { value: 'expert', label: 'Expert' }
      ],
      required: true,
      program_specific: true,
      validation_rules: {},
      follow_up_questions: [],
      ai_guidance: 'technical'
    };
  }

  /**
   * Create legal question from categorized data
   */
  private createLegalQuestion(_data: any[], index: number): DecisionTreeQuestion {
    // const evidence = data.flatMap(d => d.evidence);
    // const confidence = Math.max(...data.map(d => d.confidence));

    return {
      id: `q_${index}`,
      question: 'What legal structure do you have?',
      type: 'single',
      options: [
        { value: 'gmbh', label: 'GmbH' },
        { value: 'ag', label: 'AG' },
        { value: 'og', label: 'OG' },
        { value: 'other', label: 'Other' }
      ],
      required: true,
      program_specific: true,
      validation_rules: {},
      follow_up_questions: [],
      ai_guidance: 'legal'
    };
  }

  /**
   * Create compliance question from categorized data
   */
  private createComplianceQuestion(_data: any[], index: number): DecisionTreeQuestion {
    // const evidence = data.flatMap(d => d.evidence);
    // const confidence = Math.max(...data.map(d => d.confidence));

    return {
      id: `q_${index}`,
      question: 'What compliance requirements do you have?',
      type: 'multiple',
      options: [
        { value: 'none', label: 'None' },
        { value: 'basic', label: 'Basic' },
        { value: 'complex', label: 'Complex' },
        { value: 'very_complex', label: 'Very Complex' }
      ],
      required: true,
      program_specific: true,
      validation_rules: {},
      follow_up_questions: [],
      ai_guidance: 'compliance'
    };
  }

  /**
   * Create documents question from categorized data
   */
  private createDocumentsQuestion(_data: any[], index: number): DecisionTreeQuestion {
    // const evidence = data.flatMap(d => d.evidence);
    // const confidence = Math.max(...data.map(d => d.confidence));

    return {
      id: `q_${index}`,
      question: 'What documents can you provide?',
      type: 'multiple',
      options: [
        { value: 'business_plan', label: 'Business Plan' },
        { value: 'financial_projections', label: 'Financial Projections' },
        { value: 'team_cv', label: 'Team CVs' },
        { value: 'technical_docs', label: 'Technical Documentation' }
      ],
      required: true,
      program_specific: true,
      validation_rules: {},
      follow_up_questions: [],
      ai_guidance: 'documents'
    };
  }

  /**
   * Create capex/opex question from categorized data
   */
  private createCapexOpexQuestion(_data: any[], index: number): DecisionTreeQuestion {
    // const evidence = data.flatMap(d => d.evidence);
    // const confidence = Math.max(...data.map(d => d.confidence));

    return {
      id: `q_${index}`,
      question: 'What are your capital and operational expenses?',
      type: 'single',
      options: [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
        { value: 'very_high', label: 'Very High' }
      ],
      required: true,
      program_specific: true,
      validation_rules: {},
      follow_up_questions: [],
      ai_guidance: 'capex_opex'
    };
  }

  /**
   * Create use of funds question from categorized data
   */
  private createUseOfFundsQuestion(_data: any[], index: number): DecisionTreeQuestion {
    // const evidence = data.flatMap(d => d.evidence);
    // const confidence = Math.max(...data.map(d => d.confidence));

    return {
      id: `q_${index}`,
      question: 'How will you use the funding?',
      type: 'multiple',
      options: [
        { value: 'rd', label: 'R&D' },
        { value: 'marketing', label: 'Marketing' },
        { value: 'operations', label: 'Operations' },
        { value: 'expansion', label: 'Expansion' }
      ],
      required: true,
      program_specific: true,
      validation_rules: {},
      follow_up_questions: [],
      ai_guidance: 'use_of_funds'
    };
  }

  /**
   * Create revenue model question from categorized data
   */
  private createRevenueModelQuestion(_data: any[], index: number): DecisionTreeQuestion {
    // const evidence = data.flatMap(d => d.evidence);
    // const confidence = Math.max(...data.map(d => d.confidence));

    return {
      id: `q_${index}`,
      question: 'What is your revenue model?',
      type: 'single',
      options: [
        { value: 'subscription', label: 'Subscription' },
        { value: 'one_time', label: 'One-time sales' },
        { value: 'freemium', label: 'Freemium' },
        { value: 'marketplace', label: 'Marketplace' }
      ],
      required: true,
      program_specific: true,
      validation_rules: {},
      follow_up_questions: [],
      ai_guidance: 'revenue_model'
    };
  }

  /**
   * Create market size question from categorized data
   */
  private createMarketSizeQuestion(_data: any[], index: number): DecisionTreeQuestion {
    // const evidence = data.flatMap(d => d.evidence);
    // const confidence = Math.max(...data.map(d => d.confidence));

    return {
      id: `q_${index}`,
      question: 'What is your target market size?',
      type: 'single',
      options: [
        { value: 'small', label: 'Small (< €1M)' },
        { value: 'medium', label: 'Medium (€1M - €10M)' },
        { value: 'large', label: 'Large (€10M - €100M)' },
        { value: 'very_large', label: 'Very Large (€100M+)' }
      ],
      required: true,
      program_specific: true,
      validation_rules: {},
      follow_up_questions: [],
      ai_guidance: 'market_size'
    };
  }
}

/**
 * Factory function to create decision tree engine
 */
export function createDecisionTreeEngine(programData: any[]): DynamicDecisionTreeEngine {
  return new DynamicDecisionTreeEngine(programData);
}

/**
 * Utility function to get decision tree for a specific program
 */
export async function getDecisionTreeForProgram(programId: string): Promise<DecisionTreeResult> {
  // This would fetch program data and create decision tree
  // For now, return a mock result
  const mockProgram = {
    id: programId,
    name: 'Sample Program',
    target_personas: ['startup'],
    eligibility_criteria: { min_team_size: 2, max_age: 5 },
    funding_amount_min: 50000,
    funding_amount_max: 200000,
    deadline: '2024-12-31',
    tags: ['innovation'],
    decision_tree_questions: []
  };

  const engine = new DynamicDecisionTreeEngine([mockProgram]);
  return engine.generateDecisionTree(programId);
}

// Add question creation methods for categorized requirements
// (Methods would be added here in a real implementation)
