/**
 * Conditional Question Engine - Layer 5
 * Enhances user experience by showing relevant questions based on previous answers
 * and user profile, implementing doctor-like top-down filtering
 */

export interface ConditionalQuestion {
  id: string;
  question_text: string;
  answer_options: string[];
  required: boolean;
  category: string;
  validation_rules?: any;
  conditions?: QuestionCondition[];
  follow_up_questions?: string[];
  skip_conditions?: QuestionCondition[];
}

export interface QuestionCondition {
  question_id: string;
  operator: 'equals' | 'contains' | 'not_equals' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: any;
  logic?: 'AND' | 'OR';
}

export interface UserProfile {
  entity_stage?: string;
  company_size?: string;
  industry?: string;
  funding_type?: string;
  location?: string;
  [key: string]: any;
}

export class ConditionalQuestionEngine {
  private questions: ConditionalQuestion[] = [];
  private userAnswers: Record<string, any> = {};
  private userProfile: UserProfile = {};

  constructor(questions: ConditionalQuestion[] = []) {
    this.questions = questions;
  }

  /**
   * Set user answers and profile for conditional logic
   */
  setUserContext(answers: Record<string, any>, profile: UserProfile = {}) {
    this.userAnswers = answers;
    this.userProfile = { ...profile, ...answers };
  }

  /**
   * Get questions that should be shown based on current answers and profile
   */
  getRelevantQuestions(): ConditionalQuestion[] {
    const relevantQuestions: ConditionalQuestion[] = [];
    const processedQuestions = new Set<string>();

    // Start with profile-based questions
    const profileQuestions = this.getProfileBasedQuestions();
    
    for (const question of profileQuestions) {
      if (this.shouldShowQuestion(question) && !processedQuestions.has(question.id)) {
        relevantQuestions.push(question);
        processedQuestions.add(question.id);
      }
    }

    // Add follow-up questions based on answers
    const followUpQuestions = this.getFollowUpQuestions(relevantQuestions);
    
    for (const question of followUpQuestions) {
      if (this.shouldShowQuestion(question) && !processedQuestions.has(question.id)) {
        relevantQuestions.push(question);
        processedQuestions.add(question.id);
      }
    }

    return relevantQuestions;
  }

  /**
   * Get questions based on user profile (top-down filtering)
   */
  private getProfileBasedQuestions(): ConditionalQuestion[] {
    const profileQuestions: ConditionalQuestion[] = [];

    // Entity stage based questions
    if (this.userProfile.entity_stage === 'startup') {
      profileQuestions.push(...this.getStartupQuestions());
    } else if (this.userProfile.entity_stage === 'sme') {
      profileQuestions.push(...this.getSMEQuestions());
    } else if (this.userProfile.entity_stage === 'researcher') {
      profileQuestions.push(...this.getResearcherQuestions());
    }

    // Industry based questions
    if (this.userProfile.industry) {
      profileQuestions.push(...this.getIndustryQuestions(this.userProfile.industry));
    }

    // Funding type based questions
    if (this.userProfile.funding_type) {
      profileQuestions.push(...this.getFundingTypeQuestions(this.userProfile.funding_type));
    }

    // Location based questions
    if (this.userProfile.location) {
      profileQuestions.push(...this.getLocationQuestions(this.userProfile.location));
    }

    return profileQuestions;
  }

  /**
   * Get follow-up questions based on current answers
   */
  private getFollowUpQuestions(currentQuestions: ConditionalQuestion[]): ConditionalQuestion[] {
    const followUpQuestions: ConditionalQuestion[] = [];

    for (const question of currentQuestions) {
      if (question.follow_up_questions) {
        for (const followUpId of question.follow_up_questions) {
          const followUpQuestion = this.questions.find(q => q.id === followUpId);
          if (followUpQuestion) {
            followUpQuestions.push(followUpQuestion);
          }
        }
      }
    }

    return followUpQuestions;
  }

  /**
   * Check if a question should be shown based on conditions
   */
  private shouldShowQuestion(question: ConditionalQuestion): boolean {
    // Check skip conditions first
    if (question.skip_conditions) {
      for (const condition of question.skip_conditions) {
        if (this.evaluateCondition(condition)) {
          return false; // Skip this question
        }
      }
    }

    // Check show conditions
    if (question.conditions) {
      let shouldShow = false;
      let logicOperator = 'AND';

      for (const condition of question.conditions) {
        const conditionResult = this.evaluateCondition(condition);
        
        if (logicOperator === 'AND') {
          shouldShow = shouldShow && conditionResult;
        } else if (logicOperator === 'OR') {
          shouldShow = shouldShow || conditionResult;
        }

        logicOperator = condition.logic || 'AND';
      }

      return shouldShow;
    }

    // If no conditions, show the question
    return true;
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(condition: QuestionCondition): boolean {
    const answerValue = this.userAnswers[condition.question_id];
    
    if (answerValue === undefined || answerValue === null) {
      return false;
    }

    switch (condition.operator) {
      case 'equals':
        return answerValue === condition.value;
      case 'not_equals':
        return answerValue !== condition.value;
      case 'contains':
        return String(answerValue).toLowerCase().includes(String(condition.value).toLowerCase());
      case 'greater_than':
        return Number(answerValue) > Number(condition.value);
      case 'less_than':
        return Number(answerValue) < Number(condition.value);
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(answerValue);
      case 'not_in':
        return Array.isArray(condition.value) && !condition.value.includes(answerValue);
      default:
        return false;
    }
  }

  /**
   * Get startup-specific questions
   */
  private getStartupQuestions(): ConditionalQuestion[] {
    return [
      {
        id: 'startup_trl_level',
        question_text: 'What is your technology readiness level (TRL)?',
        answer_options: ['TRL 1-3 (Basic research)', 'TRL 4-6 (Development)', 'TRL 7-9 (Commercial)'],
        required: true,
        category: 'technical',
        conditions: [
          { question_id: 'q2_entity_stage', operator: 'equals', value: 'startup' }
        ]
      },
      {
        id: 'startup_funding_stage',
        question_text: 'What funding stage are you seeking?',
        answer_options: ['Pre-seed', 'Seed', 'Series A', 'Series B+'],
        required: true,
        category: 'financial',
        conditions: [
          { question_id: 'q2_entity_stage', operator: 'equals', value: 'startup' }
        ]
      },
      {
        id: 'startup_team_size',
        question_text: 'How many team members do you have?',
        answer_options: ['1-2 (Solo founders)', '3-5 (Small team)', '6-10 (Growing team)', '10+ (Established team)'],
        required: true,
        category: 'team',
        conditions: [
          { question_id: 'q2_entity_stage', operator: 'equals', value: 'startup' }
        ]
      }
    ];
  }

  /**
   * Get SME-specific questions
   */
  private getSMEQuestions(): ConditionalQuestion[] {
    return [
      {
        id: 'sme_revenue',
        question_text: 'What is your annual revenue?',
        answer_options: ['< €100k', '€100k - €500k', '€500k - €2M', '€2M+'],
        required: true,
        category: 'financial',
        conditions: [
          { question_id: 'q2_entity_stage', operator: 'equals', value: 'sme' }
        ]
      },
      {
        id: 'sme_employees',
        question_text: 'How many employees do you have?',
        answer_options: ['1-9', '10-49', '50-249', '250+'],
        required: true,
        category: 'team',
        conditions: [
          { question_id: 'q2_entity_stage', operator: 'equals', value: 'sme' }
        ]
      }
    ];
  }

  /**
   * Get researcher-specific questions
   */
  private getResearcherQuestions(): ConditionalQuestion[] {
    return [
      {
        id: 'researcher_institution',
        question_text: 'What type of research institution are you affiliated with?',
        answer_options: ['University', 'Research Institute', 'Government Lab', 'Private Research'],
        required: true,
        category: 'team',
        conditions: [
          { question_id: 'q2_entity_stage', operator: 'equals', value: 'researcher' }
        ]
      },
      {
        id: 'researcher_publications',
        question_text: 'How many publications do you have?',
        answer_options: ['0-5', '6-20', '21-50', '50+'],
        required: true,
        category: 'project',
        conditions: [
          { question_id: 'q2_entity_stage', operator: 'equals', value: 'researcher' }
        ]
      }
    ];
  }

  /**
   * Get industry-specific questions
   */
  private getIndustryQuestions(industry: string): ConditionalQuestion[] {
    const industryQuestions: Record<string, ConditionalQuestion[]> = {
      'technology': [
        {
          id: 'tech_ai_ml',
          question_text: 'Does your project involve AI/ML?',
          answer_options: ['Yes', 'No'],
          required: true,
          category: 'technical',
          conditions: [
            { question_id: 'q8_industry', operator: 'equals', value: 'technology' }
          ]
        }
      ],
      'healthcare': [
        {
          id: 'health_regulatory',
          question_text: 'Do you need regulatory approval?',
          answer_options: ['Yes', 'No', 'Not sure'],
          required: true,
          category: 'compliance',
          conditions: [
            { question_id: 'q8_industry', operator: 'equals', value: 'healthcare' }
          ]
        }
      ],
      'energy': [
        {
          id: 'energy_renewable',
          question_text: 'Is your project focused on renewable energy?',
          answer_options: ['Yes', 'No'],
          required: true,
          category: 'impact',
          conditions: [
            { question_id: 'q8_industry', operator: 'equals', value: 'energy' }
          ]
        }
      ]
    };

    return industryQuestions[industry] || [];
  }

  /**
   * Get funding type specific questions
   */
  private getFundingTypeQuestions(fundingType: string): ConditionalQuestion[] {
    const fundingQuestions: Record<string, ConditionalQuestion[]> = {
      'grant': [
        {
          id: 'grant_non_dilutive',
          question_text: 'Are you looking for non-dilutive funding?',
          answer_options: ['Yes', 'No'],
          required: true,
          category: 'financial',
          conditions: [
            { question_id: 'q6_funding_amount', operator: 'contains', value: 'grant' }
          ]
        }
      ],
      'equity': [
        {
          id: 'equity_valuation',
          question_text: 'What is your company valuation?',
          answer_options: ['< €1M', '€1M - €5M', '€5M - €10M', '€10M+'],
          required: true,
          category: 'financial',
          conditions: [
            { question_id: 'q6_funding_amount', operator: 'contains', value: 'equity' }
          ]
        }
      ]
    };

    return fundingQuestions[fundingType] || [];
  }

  /**
   * Get location-specific questions
   */
  private getLocationQuestions(location: string): ConditionalQuestion[] {
    if (location === 'Austria') {
      return [
        {
          id: 'austria_region',
          question_text: 'Which Austrian region are you based in?',
          answer_options: ['Vienna', 'Upper Austria', 'Lower Austria', 'Styria', 'Tyrol', 'Other'],
          required: true,
          category: 'geographic',
          conditions: [
            { question_id: 'q1_country', operator: 'equals', value: 'Austria' }
          ]
        }
      ];
    }

    return [];
  }

  /**
   * Generate conditional questions from categorized requirements
   */
  generateFromCategorizedRequirements(categorizedRequirements: any): ConditionalQuestion[] {
    const questions: ConditionalQuestion[] = [];

    Object.entries(categorizedRequirements).forEach(([category, data]: [string, any]) => {
      if (!data || !Array.isArray(data) || data.length === 0) return;

      data.forEach((item: any, index: number) => {
        if (item.type && item.value) {
          const question: ConditionalQuestion = {
            id: `${category}_${item.type}_${index}`,
            question_text: this.generateQuestionText(category, item),
            answer_options: this.generateAnswerOptions(category, item),
            required: item.required !== false,
            category: category,
            validation_rules: this.generateValidationRules(category, item),
            conditions: this.generateConditions(category, item)
          };

          questions.push(question);
        }
      });
    });

    return questions;
  }

  /**
   * Generate question text from categorized data
   */
  private generateQuestionText(category: string, _item: any): string {
    const categoryQuestions: Record<string, string> = {
      'eligibility': 'Do you meet the eligibility requirements?',
      'financial': 'What is your funding requirement?',
      'technical': 'What is your technical readiness level?',
      'team': 'What is your team composition?',
      'project': 'What is your project focus?',
      'timeline': 'What is your project timeline?',
      'geographic': 'Where is your project located?',
      'impact': 'What impact do you expect?',
      'compliance': 'What compliance requirements do you have?',
      'documents': 'What documents can you provide?',
      'legal': 'What legal structure do you have?',
      'consortium': 'Do you need consortium partners?',
      'co_financing': 'What co-financing can you provide?',
      'trl_level': 'What is your technology readiness level?',
      'capex_opex': 'What are your capital and operational expenses?',
      'use_of_funds': 'How will you use the funding?',
      'revenue_model': 'What is your revenue model?',
      'market_size': 'What is your target market size?'
    };

    return categoryQuestions[category] || `Please provide information about ${category}`;
  }

  /**
   * Generate answer options from categorized data
   */
  private generateAnswerOptions(category: string, item: any): string[] {
    if (Array.isArray(item.value)) {
      return item.value;
    }

    // Generate options based on category
    const categoryOptions: Record<string, string[]> = {
      'eligibility': ['Yes', 'No', 'Partially'],
      'financial': ['< €50k', '€50k - €100k', '€100k - €500k', '€500k+'],
      'technical': ['Basic', 'Intermediate', 'Advanced', 'Expert'],
      'team': ['1-2 people', '3-5 people', '6-10 people', '10+ people'],
      'timeline': ['< 6 months', '6-12 months', '1-2 years', '2+ years'],
      'impact': ['Local', 'Regional', 'National', 'International'],
      'compliance': ['None', 'Basic', 'Complex', 'Very Complex']
    };

    return categoryOptions[category] || [String(item.value)];
  }

  /**
   * Generate validation rules
   */
  private generateValidationRules(category: string, item: any): any {
    const rules: any = {};

    if (category === 'financial' && typeof item.value === 'number') {
      rules.min_value = 0;
      rules.max_value = 10000000;
    }

    if (category === 'team' && typeof item.value === 'number') {
      rules.min_value = 1;
      rules.max_value = 1000;
    }

    return rules;
  }

  /**
   * Generate conditions for showing questions
   */
  private generateConditions(category: string, _item: any): QuestionCondition[] {
    const conditions: QuestionCondition[] = [];

    // Add category-specific conditions
    if (category === 'technical' && this.userProfile.entity_stage === 'startup') {
      conditions.push({
        question_id: 'q2_entity_stage',
        operator: 'equals',
        value: 'startup'
      });
    }

    if (category === 'financial' && this.userProfile.funding_type) {
      conditions.push({
        question_id: 'q6_funding_amount',
        operator: 'contains',
        value: this.userProfile.funding_type
      });
    }

    return conditions;
  }
}

export const conditionalQuestionEngine = new ConditionalQuestionEngine();
