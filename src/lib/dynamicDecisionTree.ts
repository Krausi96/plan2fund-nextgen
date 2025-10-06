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

    // 1. Basic eligibility questions
    questions.push(...this.generateEligibilityQuestions(program));

    // 2. Program-specific questions from decision_tree_questions
    if (program.decision_tree_questions && Array.isArray(program.decision_tree_questions)) {
      questions.push(...program.decision_tree_questions.map((q: any) => ({
        ...q,
        program_specific: true,
        required: true
      })));
    }

    // 3. Funding amount questions
    questions.push(...this.generateFundingQuestions(program));

    // 4. Timeline questions
    questions.push(...this.generateTimelineQuestions(program));

    // 5. Team and experience questions
    questions.push(...this.generateTeamQuestions(program));

    // 6. Industry-specific questions
    questions.push(...this.generateIndustryQuestions(program));

    // 7. Document readiness questions
    questions.push(...this.generateDocumentQuestions(program));

    return questions;
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
