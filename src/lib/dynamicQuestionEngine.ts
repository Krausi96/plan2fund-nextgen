// Dynamic Question Engine - Computes questions from programs.json overlays
// Removed static JSON import - using database instead
import { getQuestionsData } from '../data/questions';
import { dataSource } from './dataSource';

console.log('Dynamic Question Engine: Loading programs data from database...');

export interface DynamicQuestion {
  id: string;
  label: string;
  type: string;
  options: Array<{ value: string; label: string }>;
  required: boolean;
  informationValue: number;
  programsAffected: number;
  decisiveness: 'HARD' | 'SOFT' | 'UNCERTAIN';
  sourcePrograms: string[];
  uxWeight: number;
  isCoreQuestion: boolean;
  questionNumber: number;
}

export class DynamicQuestionEngine {
  private questions: DynamicQuestion[] = [];
  private t: (key: any) => string = (key: any) => key;

  constructor(translationFunction?: (key: any) => string) {
    if (translationFunction) {
      this.t = translationFunction;
    }
    // Don't compute at construction time - do it lazily
  }

  private async computeQuestions(): Promise<void> {
    const questionStats = new Map<string, {
      question: DynamicQuestion;
      programsAffected: number;
      informationValue: number;
      hardRules: number;
      softRules: number;
      uncertainRules: number;
      sourcePrograms: string[];
    }>();

    // Define UX weights for each question (higher = better UX, should come earlier)
    // Note: q8_funding_types is excluded from wizard - it will be derived instead
    const uxWeights: Record<string, number> = {
      'q1_country': 10,        // Essential - determines program eligibility
      'q4_theme': 9,           // High impact - determines program focus
      'q2_entity_stage': 7,    // Important - affects eligibility
      'q3_company_size': 6,    // Important - affects eligibility
      'q5_maturity_trl': 5,    // Moderate - affects program fit
      'q6_rnd_in_at': 4,       // Moderate - affects Austrian programs
      'q7_collaboration': 3,   // Lower - affects some programs
      'q9_team_diversity': 2,  // Lower - affects some programs
      'q10_env_benefit': 1     // Lower - affects environmental programs
    };

    // Start with universal questions as base (excluding q8_funding_types - will be derived)
    const translatedQuestionsData = getQuestionsData(this.t);
    for (const baseQuestion of translatedQuestionsData.universal) {
      const questionId = baseQuestion.id;
      
      // Skip q8_funding_types as it will be derived from program types
      if (questionId === 'q8_funding_types') {
        continue;
      }
      const rules: any[] = [];
      let programsAffected = 0;
      const sourcePrograms: string[] = [];

      // Find all programs that reference this question
      const programs = await dataSource.getGPTEnhancedPrograms();
      for (const program of programs) {
        // Check if program has overlays (legacy JSON format)
        if ((program as any).overlays && Array.isArray((program as any).overlays)) {
          for (const overlay of (program as any).overlays) {
            if (overlay.ask_if && overlay.ask_if.includes(questionId)) {
              console.log(`Found overlay for ${questionId} in program ${program.id}:`, overlay.ask_if);
              rules.push({
                programId: program.id,
                questionId: questionId,
                decisiveness: overlay.decisiveness,
                condition: overlay.ask_if,
                question: overlay.question
              });
              programsAffected++;
              sourcePrograms.push(program.id);
            }
          }
        }
        // For scraped programs, we'll use basic matching based on program type and target personas
        else if (program.target_personas && program.target_personas.length > 0) {
          // Basic matching for scraped programs
          if (questionId === 'q2_entity_stage' && program.target_personas.includes('startup')) {
            rules.push({
              programId: program.id,
              questionId: questionId,
              decisiveness: 'SOFT',
              condition: 'startup',
              question: 'What stage is your company at?'
            });
            programsAffected++;
            sourcePrograms.push(program.id);
          }
        }
      }

      // Calculate information value based on rule impact
      const hardRules = rules.filter(r => r.decisiveness === 'HARD').length;
      const softRules = rules.filter(r => r.decisiveness === 'SOFT').length;
      const uncertainRules = rules.filter(r => r.decisiveness === 'UNCERTAIN').length;
      
      const weightedImpact = (hardRules * 3) + (softRules * 2) + (uncertainRules * 1);
      const informationDensity = programsAffected > 0 ? weightedImpact / programsAffected : 0;
      const informationValue = Math.round(informationDensity * 100);

      // Get UX weight for this question
      const uxWeight = uxWeights[questionId] || 1;

      // Determine overall decisiveness
      let decisiveness: 'HARD' | 'SOFT' | 'UNCERTAIN' = 'UNCERTAIN';
      if (hardRules > 0) decisiveness = 'HARD';
      else if (softRules > 0) decisiveness = 'SOFT';

      const normalizedType =
        baseQuestion.type === 'single-select' ? 'single' :
        baseQuestion.type === 'multi-select' ? 'multiple' :
        baseQuestion.type;

      const dynamicQuestion: DynamicQuestion = {
        id: baseQuestion.id,
        label: baseQuestion.label,
        type: normalizedType,
        options: baseQuestion.options,
        required: baseQuestion.required,
        informationValue,
        programsAffected,
        decisiveness,
        sourcePrograms,
        uxWeight,
        isCoreQuestion: false, // Will be set later
        questionNumber: 0      // Will be set later
      };

      questionStats.set(questionId, {
        question: dynamicQuestion,
        programsAffected,
        informationValue,
        hardRules,
        softRules,
        uncertainRules,
        sourcePrograms
      });
    }

    // Sort by information value × UX weight (highest first)
    const sortedQuestions = Array.from(questionStats.values())
      .sort((a, b) => {
        const scoreA = a.informationValue * a.question.uxWeight;
        const scoreB = b.informationValue * b.question.uxWeight;
        return scoreB - scoreA;
      });

    // Limit to 7 core questions for better UX
    const coreQuestions = sortedQuestions.slice(0, 7);
    const overlayQuestions = sortedQuestions.slice(7);

    // Mark core questions
    coreQuestions.forEach((stat, index) => {
      stat.question.isCoreQuestion = true;
      stat.question.questionNumber = index + 1;
    });

    // Mark overlay questions
    overlayQuestions.forEach((stat, index) => {
      stat.question.isCoreQuestion = false;
      stat.question.questionNumber = index + 8;
    });

    this.questions = sortedQuestions.map(stat => stat.question);

    console.log('Dynamic Question Order (Core Questions ≤7):');
    coreQuestions.forEach((stat, i) => {
      const score = stat.informationValue * stat.question.uxWeight;
      console.log(`  ${i + 1}. ${stat.question.id} (score: ${score}, info: ${stat.informationValue}%, UX: ${stat.question.uxWeight}, programs: ${stat.programsAffected})`);
    });
    
    if (overlayQuestions.length > 0) {
      console.log('Overlay Questions (3 max):');
      overlayQuestions.slice(0, 3).forEach((stat, i) => {
        const score = stat.informationValue * stat.question.uxWeight;
        console.log(`  ${i + 8}. ${stat.question.id} (score: ${score}, info: ${stat.informationValue}%, UX: ${stat.question.uxWeight}, programs: ${stat.programsAffected})`);
      });
    }
  }

  public async getQuestionOrder(): Promise<DynamicQuestion[]> {
    if (this.questions.length === 0) {
      await this.computeQuestions();
    }
    return this.questions;
  }

  public async getCoreQuestions(): Promise<DynamicQuestion[]> {
    if (this.questions.length === 0) {
      await this.computeQuestions();
    }
    return this.questions.filter(q => q.isCoreQuestion);
  }

  public async getOverlayQuestions(): Promise<DynamicQuestion[]> {
    if (this.questions.length === 0) {
      await this.computeQuestions();
    }
    return this.questions.filter(q => !q.isCoreQuestion).slice(0, 3);
  }

  public async getNextQuestion(answers: Record<string, any>): Promise<DynamicQuestion | null> {
    if (this.questions.length === 0) {
      await this.computeQuestions();
    }
    
    // First, find unanswered core questions (prioritize these)
    const coreQuestions = await this.getCoreQuestions();
    for (const question of coreQuestions) {
      if (question.required && !answers[question.id]) {
        return question;
      }
    }
    
    // Then, find unanswered overlay questions (only if core questions are done)
    const overlayQuestions = await this.getOverlayQuestions();
    for (const question of overlayQuestions) {
      if (question.required && !answers[question.id]) {
        return question;
      }
    }
    
    return null; // All questions answered
  }

  public getQuestionById(id: string): DynamicQuestion | undefined {
    return this.questions.find(q => q.id === id);
  }

  public getQuestionStats(): Array<{
    id: string;
    informationValue: number;
    programsAffected: number;
    decisiveness: string;
    sourcePrograms: string[];
  }> {
    return this.questions.map(q => ({
      id: q.id,
      informationValue: q.informationValue,
      programsAffected: q.programsAffected,
      decisiveness: q.decisiveness,
      sourcePrograms: q.sourcePrograms
    }));
  }

  // Method to recompute questions when programs change
  public async recomputeQuestions(): Promise<void> {
    await this.computeQuestions();
  }
}

export const dynamicQuestionEngine = new DynamicQuestionEngine();
export default dynamicQuestionEngine;
