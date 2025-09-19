// Dynamic Wizard Engine - Computes question order from programs.json
import rawPrograms from '../data/programs';
import rawQuestions from '../data/questions';

export interface Question {
  id: string;
  label: string;
  type: 'single-select' | 'multi-select';
  options: Array<{ value: string; label: string }>;
  required: boolean;
  informationValue: number;
  programsAffected: number;
}

export interface ProgramRule {
  programId: string;
  questionId: string;
  decisiveness: 'HARD' | 'SOFT' | 'UNCERTAIN';
  condition: string;
  rationale: string;
}

export class DynamicWizardEngine {
  private programs: any[];
  private questions: any[];
  private questionOrder: Question[] = [];

  constructor() {
    this.programs = rawPrograms.programs;
    this.questions = rawQuestions.universal;
    this.computeQuestionOrder();
  }

  /**
   * Compute optimal question order based on information gain
   * Questions that split the program set most effectively come first
   */
  private computeQuestionOrder(): void {
    const questionStats = new Map<string, {
      question: any;
      programsAffected: number;
      informationValue: number;
      rules: ProgramRule[];
    }>();

    // Analyze each question's impact on programs
    for (const question of this.questions) {
      const rules: ProgramRule[] = [];
      let programsAffected = 0;

      // Find all program rules that reference this question
      for (const program of this.programs) {
        if (program.overlays) {
          // overlays is an object, not an array
          for (const [key, value] of Object.entries(program.overlays)) {
            if (key === question.id) {
              rules.push({
                programId: program.id,
                questionId: question.id,
                decisiveness: 'SOFT', // Default to SOFT since we don't have decisiveness in the object
                condition: `${question.id}:${value}`,
                rationale: `Program requires ${question.id} to be ${value}`
              });
              programsAffected++;
            }
          }
        }
      }

      // Calculate information value (how well this question splits the program set)
      const informationValue = this.calculateInformationValue(question.id, rules);

      questionStats.set(question.id, {
        question,
        programsAffected,
        informationValue,
        rules
      });
    }

    // Sort questions by information value (highest first)
    this.questionOrder = Array.from(questionStats.values())
      .sort((a, b) => b.informationValue - a.informationValue)
      .map(stat => ({
        ...stat.question,
        informationValue: stat.informationValue,
        programsAffected: stat.programsAffected
      }));
  }

  /**
   * Calculate information gain for a question
   * Higher value = question splits programs more effectively
   */
  private calculateInformationValue(_questionId: string, rules: ProgramRule[]): number {
    if (rules.length === 0) return 0;

    // Count HARD rules (high impact)
    const hardRules = rules.filter(r => r.decisiveness === 'HARD').length;
    const softRules = rules.filter(r => r.decisiveness === 'SOFT').length;
    const uncertainRules = rules.filter(r => r.decisiveness === 'UNCERTAIN').length;

    // Weight by decisiveness: HARD=3, SOFT=2, UNCERTAIN=1
    const weightedImpact = (hardRules * 3) + (softRules * 2) + (uncertainRules * 1);
    
    // Normalize by total programs to get information density
    const informationDensity = weightedImpact / this.programs.length;
    
    // Scale to 0-100 for readability
    return Math.round(informationDensity * 100);
  }

  /**
   * Get the computed question order
   */
  getQuestionOrder(): Question[] {
    return this.questionOrder;
  }

  /**
   * Get question order summary for debugging
   */
  getQuestionOrderSummary(): Array<{
    id: string;
    label: string;
    informationValue: number;
    programsAffected: number;
    reason: string;
  }> {
    return this.questionOrder.map(q => ({
      id: q.id,
      label: q.label,
      informationValue: q.informationValue,
      programsAffected: q.programsAffected,
      reason: this.getQuestionReason(q.id)
    }));
  }

  private getQuestionReason(questionId: string): string {
    const reasons: { [key: string]: string } = {
      'q1_country': 'Splits AT vs EU vs NON-EU programs (jurisdiction)',
      'q2_entity_stage': 'Splits startup vs established business programs',
      'q3_company_size': 'Splits micro/SME vs large company programs',
      'q4_theme': 'Splits by industry focus (innovation, health, sustainability)',
      'q5_maturity_trl': 'Splits by technology readiness level',
      'q6_rnd_in_at': 'Splits R&D vs non-R&D programs',
      'q7_collaboration': 'Splits collaborative vs solo programs',
      'q8_funding_types': 'Splits grant vs loan vs equity programs',
      'q9_team_diversity': 'Splits diversity-focused vs general programs',
      'q10_env_benefit': 'Splits environmental vs non-environmental programs'
    };
    return reasons[questionId] || 'General eligibility question';
  }

  /**
   * Simulate changing a program rule and recomputing order
   */
  simulateRuleChange(programId: string, newOverlay: any): Question[] {
    // Create a copy of programs with the changed rule
    const modifiedPrograms = this.programs.map(p => {
      if (p.id === programId) {
        return {
          ...p,
          overlays: { ...(p.overlays || {}), [newOverlay.questionId]: newOverlay.value }
        };
      }
      return p;
    });

    // Temporarily replace programs and recompute
    const originalPrograms = this.programs;
    this.programs = modifiedPrograms;
    this.computeQuestionOrder();
    const newOrder = [...this.questionOrder];
    
    // Restore original programs
    this.programs = originalPrograms;
    this.computeQuestionOrder();
    
    return newOrder;
  }

  /**
   * Get program type distribution after answering questions
   */
  getProgramTypeDistribution(_answers: Record<string, any>): Record<string, number> {
    const distribution: Record<string, number> = {};
    
    for (const program of this.programs) {
      const type = program.type || 'unknown';
      distribution[type] = (distribution[type] || 0) + 1;
    }
    
    return distribution;
  }
}

// Export singleton instance
export const dynamicWizard = new DynamicWizardEngine();
