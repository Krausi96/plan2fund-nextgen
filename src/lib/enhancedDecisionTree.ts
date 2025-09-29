// ========= PLAN2FUND — ENHANCED DECISION TREE ENGINE =========
// Enhanced decision tree that uses structured requirements

import { ProgramRequirements, DecisionTreeQuestion, ProgramScore, RequirementScore } from '@/types/requirements';
import { UserAnswers } from '@/types';

export interface EnhancedDecisionTreeResult {
  recommendations: ProgramScore[];
  explanations: string[];
  gaps: string[];
  fallbackPrograms: ProgramScore[];
  hasMatches: boolean;
  nextQuestions: DecisionTreeQuestion[];
  confidence: 'high' | 'medium' | 'low';
}

export class EnhancedDecisionTreeEngine {
  private programs: Map<string, ProgramRequirements> = new Map();
  private questions: Map<string, DecisionTreeQuestion> = new Map();

  /**
   * Load program requirements
   */
  loadProgramRequirements(requirements: ProgramRequirements[]): void {
    requirements.forEach(req => {
      this.programs.set(req.programId, req);
      
      // Index questions
      req.decisionTreeQuestions.forEach(question => {
        this.questions.set(question.id, question);
      });
    });
  }

  /**
   * Process user answers and generate recommendations
   */
  async processDecisionTree(
    answers: UserAnswers,
    _currentNodeId: string = 'q1_country'
  ): Promise<EnhancedDecisionTreeResult> {
    // Process answers

    // Score all programs
    const programScores = await this.scoreAllPrograms(answers);
    
    // Filter eligible programs
    const eligiblePrograms = programScores.filter(score => score.eligibility === 'eligible');
    
    // Generate explanations
    const explanations = this.generateExplanations(eligiblePrograms);
    
    // Identify gaps
    const gaps = this.identifyGaps(eligiblePrograms);
    
    // Get fallback programs if no matches
    const fallbackPrograms = eligiblePrograms.length === 0 ? 
      programScores.filter(score => score.overallScore > 30) : [];
    
    // Determine next questions
    const nextQuestions = this.getNextQuestions(answers);
    
    // Calculate confidence
    const confidence = this.calculateConfidence(eligiblePrograms, answers);

    return {
      recommendations: eligiblePrograms,
      explanations,
      gaps,
      fallbackPrograms,
      hasMatches: eligiblePrograms.length > 0,
      nextQuestions,
      confidence
    };
  }

  /**
   * Score all programs based on user answers
   */
  private async scoreAllPrograms(answers: UserAnswers): Promise<ProgramScore[]> {
    const scores: ProgramScore[] = [];

    for (const [, program] of this.programs) {
      const score = await this.scoreProgram(program, answers);
      scores.push(score);
    }

    return scores.sort((a, b) => b.overallScore - a.overallScore);
  }

  /**
   * Score a single program
   */
  private async scoreProgram(program: ProgramRequirements, answers: UserAnswers): Promise<ProgramScore> {
    const categoryScores: Record<string, number> = {};
    const requirementScores: RequirementScore[] = [];
    const gaps: string[] = [];
    const recommendations: string[] = [];

    // Score each category
    const categories = ['eligibility', 'documents', 'financial', 'technical', 'legal', 'timeline', 'geographic', 'team', 'project', 'compliance'];
    
    for (const category of categories) {
      const categoryRequirements = program[category as keyof ProgramRequirements] as any[];
      if (!categoryRequirements) continue;

      const categoryScore = this.scoreCategory(categoryRequirements, answers, program.scoringWeights[category as keyof typeof program.scoringWeights]);
      categoryScores[category] = categoryScore.score;
      
      requirementScores.push(...categoryScore.requirementScores);
      gaps.push(...categoryScore.gaps);
      recommendations.push(...categoryScore.recommendations);
    }

    // Calculate overall score
    const overallScore = this.calculateOverallScore(categoryScores, program.scoringWeights);
    
    // Determine eligibility
    const eligibility = this.determineEligibility(requirementScores, program);
    
    // Calculate confidence
    const confidence = this.calculateProgramConfidence(requirementScores, answers);

    return {
      programId: program.programId,
      overallScore,
      categoryScores,
      requirementScores,
      eligibility,
      gaps: [...new Set(gaps)], // Remove duplicates
      recommendations: [...new Set(recommendations)],
      confidence
    };
  }

  /**
   * Score a category of requirements
   */
  private scoreCategory(
    requirements: any[], 
    answers: UserAnswers, 
    weight: number
  ): {
    score: number;
    requirementScores: RequirementScore[];
    gaps: string[];
    recommendations: string[];
  } {
    let totalScore = 0;
    const requirementScores: RequirementScore[] = [];
    const gaps: string[] = [];
    const recommendations: string[] = [];

    for (const requirement of requirements) {
      const requirementScore = this.scoreRequirement(requirement, answers);
      requirementScores.push(requirementScore);
      
      totalScore += requirementScore.score * (requirement.priority === 'critical' ? 1.5 : 1);
      
      if (requirementScore.status === 'not_met') {
        gaps.push(requirement.title);
      }
      
      if (requirementScore.suggestions.length > 0) {
        recommendations.push(...requirementScore.suggestions);
      }
    }

    const averageScore = requirements.length > 0 ? totalScore / requirements.length : 0;
    const weightedScore = averageScore * weight;

    return {
      score: Math.round(weightedScore),
      requirementScores,
      gaps,
      recommendations
    };
  }

  /**
   * Score a single requirement
   */
  private scoreRequirement(requirement: any, answers: UserAnswers): RequirementScore {
    // Check if requirement is applicable
    if (!this.isRequirementApplicable(requirement, answers)) {
      return {
        requirementId: requirement.id,
        score: 0,
        status: 'not_applicable',
        message: 'Requirement not applicable to current context',
        suggestions: []
      };
    }

    // Check if requirement is met
    const isMet = this.checkRequirementMet(requirement, answers);
    
    if (isMet) {
      return {
        requirementId: requirement.id,
        score: 100,
        status: 'met',
        message: 'Requirement fully met',
        suggestions: []
      };
    }

    // Check if requirement is partially met
    const isPartiallyMet = this.checkRequirementPartiallyMet(requirement, answers);
    
    if (isPartiallyMet) {
      return {
        requirementId: requirement.id,
        score: 50,
        status: 'partial',
        message: 'Requirement partially met',
        suggestions: this.generateRequirementSuggestions(requirement, answers)
      };
    }

    return {
      requirementId: requirement.id,
      score: 0,
      status: 'not_met',
      message: 'Requirement not met',
      suggestions: this.generateRequirementSuggestions(requirement, answers)
    };
  }

  /**
   * Check if a requirement is applicable to current context
   */
  private isRequirementApplicable(requirement: any, answers: UserAnswers): boolean {
    // Check if requirement has conditions
    if (requirement.conditions) {
      return this.evaluateConditions(requirement.conditions, answers);
    }
    
    return true; // Default to applicable
  }

  /**
   * Check if a requirement is met
   */
  private checkRequirementMet(requirement: any, answers: UserAnswers): boolean {
    switch (requirement.type) {
      case 'boolean':
        return this.checkBooleanRequirement(requirement, answers);
      case 'numeric':
        return this.checkNumericRequirement(requirement, answers);
      case 'text':
        return this.checkTextRequirement(requirement, answers);
      case 'document':
        return this.checkDocumentRequirement(requirement, answers);
      case 'date':
        return this.checkDateRequirement(requirement, answers);
      case 'selection':
        return this.checkSelectionRequirement(requirement, answers);
      default:
        return false;
    }
  }

  /**
   * Check if a requirement is partially met
   */
  private checkRequirementPartiallyMet(_requirement: any, _answers: UserAnswers): boolean {
    // For now, we'll consider partial as not met
    // This can be enhanced based on specific requirement types
    return false;
  }

  /**
   * Check boolean requirement
   */
  private checkBooleanRequirement(requirement: any, answers: UserAnswers): boolean {
    const answerKey = this.findAnswerKey(requirement, answers);
    if (!answerKey) return false;
    
    const answer = answers[answerKey];
    return Boolean(answer);
  }

  /**
   * Check numeric requirement
   */
  private checkNumericRequirement(requirement: any, answers: UserAnswers): boolean {
    const answerKey = this.findAnswerKey(requirement, answers);
    if (!answerKey) return false;
    
    const answer = answers[answerKey];
    const numAnswer = Number(answer);
    
    if (isNaN(numAnswer)) return false;
    
    // Check against requirement thresholds
    if (requirement.minValue && numAnswer < requirement.minValue) return false;
    if (requirement.maxValue && numAnswer > requirement.maxValue) return false;
    
    return true;
  }

  /**
   * Check text requirement
   */
  private checkTextRequirement(requirement: any, answers: UserAnswers): boolean {
    const answerKey = this.findAnswerKey(requirement, answers);
    if (!answerKey) return false;
    
    const answer = answers[answerKey];
    return typeof answer === 'string' && answer.trim().length > 0;
  }

  /**
   * Check document requirement
   */
  private checkDocumentRequirement(_requirement: any, _answers: UserAnswers): boolean {
    // This would check if required documents are uploaded
    // For now, we'll assume documents are not uploaded
    return false;
  }

  /**
   * Check date requirement
   */
  private checkDateRequirement(requirement: any, answers: UserAnswers): boolean {
    const answerKey = this.findAnswerKey(requirement, answers);
    if (!answerKey) return false;
    
    const answer = answers[answerKey];
    const date = new Date(answer);
    
    if (isNaN(date.getTime())) return false;
    
    // Check date constraints
    if (requirement.minDate && date < new Date(requirement.minDate)) return false;
    if (requirement.maxDate && date > new Date(requirement.maxDate)) return false;
    
    return true;
  }

  /**
   * Check selection requirement
   */
  private checkSelectionRequirement(requirement: any, answers: UserAnswers): boolean {
    const answerKey = this.findAnswerKey(requirement, answers);
    if (!answerKey) return false;
    
    const answer = answers[answerKey];
    const validOptions = requirement.options || [];
    
    if (Array.isArray(answer)) {
      return answer.every(option => validOptions.includes(option));
    }
    
    return validOptions.includes(answer);
  }

  /**
   * Find the answer key for a requirement
   */
  private findAnswerKey(requirement: any, answers: UserAnswers): string | null {
    // Try to match requirement ID with answer keys
    if (answers[requirement.id]) return requirement.id;
    
    // Try to match based on requirement title
    const titleKey = requirement.title.toLowerCase().replace(/\s+/g, '_');
    if (answers[titleKey]) return titleKey;
    
    // Try to match based on requirement category
    const categoryKey = `${requirement.category}_${requirement.id}`;
    if (answers[categoryKey]) return categoryKey;
    
    return null;
  }

  /**
   * Generate suggestions for a requirement
   */
  private generateRequirementSuggestions(requirement: any, _answers: UserAnswers): string[] {
    const suggestions: string[] = [];
    
    if (requirement.guidance) {
      suggestions.push(requirement.guidance);
    }
    
    if (requirement.examples && requirement.examples.length > 0) {
      suggestions.push(`Examples: ${requirement.examples.join(', ')}`);
    }
    
    if (requirement.alternatives && requirement.alternatives.length > 0) {
      suggestions.push(`Alternatives: ${requirement.alternatives.join(', ')}`);
    }
    
    return suggestions;
  }

  /**
   * Calculate overall score
   */
  private calculateOverallScore(categoryScores: Record<string, number>, weights: any): number {
    let totalScore = 0;
    let totalWeight = 0;
    
    Object.entries(categoryScores).forEach(([category, score]) => {
      const weight = weights[category] || 0;
      totalScore += score * weight;
      totalWeight += weight;
    });
    
    return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
  }

  /**
   * Determine eligibility
   */
  private determineEligibility(requirementScores: RequirementScore[], program: ProgramRequirements): 'eligible' | 'not_eligible' | 'conditional' {
    const criticalRequirements = requirementScores.filter(score => 
      program.eligibility.find(req => req.id === score.requirementId)?.priority === 'critical'
    );
    
    const unmetCritical = criticalRequirements.filter(score => score.status === 'not_met');
    
    if (unmetCritical.length > 0) {
      return 'not_eligible';
    }
    
    const partialRequirements = requirementScores.filter(score => score.status === 'partial');
    
    if (partialRequirements.length > 0) {
      return 'conditional';
    }
    
    return 'eligible';
  }

  /**
   * Calculate program confidence
   */
  private calculateProgramConfidence(requirementScores: RequirementScore[], _answers: UserAnswers): 'high' | 'medium' | 'low' {
    const metRequirements = requirementScores.filter(score => score.status === 'met');
    const totalRequirements = requirementScores.length;
    
    if (totalRequirements === 0) return 'low';
    
    const metPercentage = metRequirements.length / totalRequirements;
    
    if (metPercentage >= 0.8) return 'high';
    if (metPercentage >= 0.5) return 'medium';
    return 'low';
  }

  /**
   * Generate explanations
   */
  private generateExplanations(programScores: ProgramScore[]): string[] {
    const explanations: string[] = [];
    
    if (programScores.length === 0) {
      explanations.push('No programs match your current criteria. Consider adjusting your answers or exploring different funding types.');
      return explanations;
    }
    
    programScores.slice(0, 3).forEach((score) => {
      const program = this.programs.get(score.programId);
      if (!program) return;
      
      let explanation = `${program.programName}: `;
      
      if (score.overallScore >= 80) {
        explanation += 'Excellent match! ';
      } else if (score.overallScore >= 60) {
        explanation += 'Good match. ';
      } else {
        explanation += 'Partial match. ';
      }
      
      if (score.recommendations.length > 0) {
        explanation += `Consider: ${score.recommendations.slice(0, 2).join(', ')}.`;
      }
      
      explanations.push(explanation);
    });
    
    return explanations;
  }

  /**
   * Identify gaps
   */
  private identifyGaps(programScores: ProgramScore[]): string[] {
    const allGaps = programScores.flatMap(score => score.gaps);
    return [...new Set(allGaps)];
  }

  /**
   * Get next questions to ask
   */
  private getNextQuestions(answers: UserAnswers): DecisionTreeQuestion[] {
    const unansweredQuestions: DecisionTreeQuestion[] = [];
    
    for (const [questionId, question] of this.questions) {
      if (!answers[questionId] && question.requirementId) {
        // Check if this question is relevant based on current answers
        if (this.isQuestionRelevant(question, answers)) {
          unansweredQuestions.push(question);
        }
      }
    }
    
    // Sort by priority and return top 3
    return unansweredQuestions
      .sort((a, b) => this.getQuestionPriority(b) - this.getQuestionPriority(a))
      .slice(0, 3);
  }

  /**
   * Check if a question is relevant based on current answers
   */
  private isQuestionRelevant(question: DecisionTreeQuestion, answers: UserAnswers): boolean {
    // Check skip conditions
    if (question.skipConditions) {
      for (const condition of question.skipConditions) {
        if (this.evaluateCondition(condition.condition, answers)) {
          return false;
        }
      }
    }
    
    return true;
  }

  /**
   * Get question priority
   */
  private getQuestionPriority(question: DecisionTreeQuestion): number {
    // Higher priority for questions that affect more programs
    return question.requirementId ? 1 : 0;
  }

  /**
   * Calculate overall confidence
   */
  private calculateConfidence(programScores: ProgramScore[], _answers: UserAnswers): 'high' | 'medium' | 'low' {
    if (programScores.length === 0) return 'low';
    
    const highConfidencePrograms = programScores.filter(score => score.confidence === 'high');
    const highConfidencePercentage = highConfidencePrograms.length / programScores.length;
    
    if (highConfidencePercentage >= 0.5) return 'high';
    if (highConfidencePercentage >= 0.2) return 'medium';
    return 'low';
  }

  /**
   * Evaluate conditions
   */
  private evaluateConditions(_conditions: any, _answers: UserAnswers): boolean {
    // Simple condition evaluation
    // This can be enhanced with more complex logic
    return true;
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(_condition: string, _answers: UserAnswers): boolean {
    // Simple condition evaluation
    // This can be enhanced with more complex logic
    return false;
  }
}

// Export singleton instance
export const enhancedDecisionTreeEngine = new EnhancedDecisionTreeEngine();
