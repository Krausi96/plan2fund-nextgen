// Decision Tree Logic for Recommendation Engine
import { UserProfile } from '../types';
import { scorePrograms } from './scoring';
import { doctorDiagnostic } from './doctorDiagnostic';
import { dataSource } from './dataSource';

export interface DecisionTreeNode {
  id: string;
  question: string;
  type: 'single' | 'multiple' | 'text' | 'conditional';
  options?: Array<{
    value: string;
    label: string;
    nextNodeId?: string;
  }>;
  condition?: (answers: Record<string, any>) => boolean;
  nextNodeId?: string;
  isTerminal?: boolean;
}

export interface DecisionTreeResult {
  recommendations: any[];
  explanations: string[];
  gaps: string[];
  fallbackPrograms: any[];
}

export class DecisionTreeEngine {
  private nodes: Map<string, DecisionTreeNode> = new Map();
  private userProfile: UserProfile | null = null;

  constructor() {
    this.initializeTree();
  }

  private initializeTree(): void {
    // Use hardcoded tree for now - this will be replaced with dynamic generation
    this.initializeHardcodedTree();
  }

  private initializeHardcodedTree(): void {
    // Start with country question (not Program Type - that's an outcome)
    this.nodes.set('q1_country', {
      id: 'q1_country',
      question: 'Where will the project be carried out?',
      type: 'single',
      options: [
        { value: 'AT', label: 'Austria only', nextNodeId: 'q2_entity_stage' },
        { value: 'EU', label: 'EU (incl. Austria)', nextNodeId: 'q2_entity_stage' },
        { value: 'NON_EU', label: 'Outside EU', nextNodeId: 'q2_entity_stage' }
      ]
    });

    // Entity Stage Question
    this.nodes.set('q2_entity_stage', {
      id: 'q2_entity_stage',
      question: 'What is your legal setup & company age?',
      type: 'single',
      options: [
        { value: 'PRE_COMPANY', label: 'Not yet incorporated (team / natural persons)', nextNodeId: 'q3_company_size' },
        { value: 'INC_LT_6M', label: 'Incorporated < 6 months', nextNodeId: 'q3_company_size' },
        { value: 'INC_6_36M', label: 'Incorporated 6–36 months', nextNodeId: 'q3_company_size' },
        { value: 'INC_GT_36M', label: 'Incorporated > 36 months', nextNodeId: 'q3_company_size' },
        { value: 'RESEARCH_ORG', label: 'Research organisation / university', nextNodeId: 'q3_company_size' },
        { value: 'NONPROFIT', label: 'Non-profit / association', nextNodeId: 'q3_company_size' }
      ]
    });

    // Company Size Question
    this.nodes.set('q3_company_size', {
      id: 'q3_company_size',
      question: 'How many employees (FTE) does your organisation have?',
      type: 'single',
      options: [
        { value: 'MICRO_0_9', label: '0–9 (micro)', nextNodeId: 'q4_theme' },
        { value: 'SMALL_10_49', label: '10–49 (small)', nextNodeId: 'q4_theme' },
        { value: 'MEDIUM_50_249', label: '50–249 (medium)', nextNodeId: 'q4_theme' },
        { value: 'LARGE_250_PLUS', label: '250+ (large)', nextNodeId: 'q4_theme' }
      ]
    });

    // Theme Question
    this.nodes.set('q4_theme', {
      id: 'q4_theme',
      question: 'Which area(s) best fit your project?',
      type: 'multiple',
      options: [
        { value: 'INNOVATION_DIGITAL', label: 'Innovation / Digital / Deep Tech', nextNodeId: 'q5_maturity_trl' },
        { value: 'SUSTAINABILITY', label: 'Sustainability / Climate / Energy / Environment', nextNodeId: 'q5_maturity_trl' },
        { value: 'HEALTH_LIFE_SCIENCE', label: 'Health / Life Sciences / MedTech / Biotech', nextNodeId: 'q5_maturity_trl' },
        { value: 'SPACE_DOWNSTREAM', label: 'Space / GNSS / Earth Observation (downstream)', nextNodeId: 'q5_maturity_trl' },
        { value: 'INDUSTRY_MANUFACTURING', label: 'Industry / Manufacturing', nextNodeId: 'q5_maturity_trl' },
        { value: 'OTHER', label: 'Other', nextNodeId: 'q5_maturity_trl' }
      ]
    });

    // Maturity TRL Question
    this.nodes.set('q5_maturity_trl', {
      id: 'q5_maturity_trl',
      question: 'What is your current maturity (approx. TRL)?',
      type: 'single',
      options: [
        { value: 'TRL_1_2', label: 'Idea / Research (TRL 1–2)', nextNodeId: 'q6_rnd_in_at' },
        { value: 'TRL_3_4', label: 'Proof of concept (TRL 3–4)', nextNodeId: 'q6_rnd_in_at' },
        { value: 'TRL_5_6', label: 'Prototype / demonstrator (TRL 5–6)', nextNodeId: 'q6_rnd_in_at' },
        { value: 'TRL_7_8', label: 'Pilot / market launch (TRL 7–8)', nextNodeId: 'q6_rnd_in_at' },
        { value: 'TRL_9', label: 'Scaling (TRL 9+)', nextNodeId: 'q6_rnd_in_at' }
      ]
    });

    // R&D in Austria Question
    this.nodes.set('q6_rnd_in_at', {
      id: 'q6_rnd_in_at',
      question: 'Will you conduct R&D or experimental development in Austria?',
      type: 'single',
      options: [
        { value: 'YES', label: 'Yes', nextNodeId: 'q7_collaboration' },
        { value: 'NO', label: 'No', nextNodeId: 'q7_collaboration' },
        { value: 'UNSURE', label: 'Unsure', nextNodeId: 'q7_collaboration' }
      ]
    });

    // Collaboration Question
    this.nodes.set('q7_collaboration', {
      id: 'q7_collaboration',
      question: 'Do you plan to collaborate with research institutions or companies?',
      type: 'single',
      options: [
        { value: 'NONE', label: 'No collaboration planned', nextNodeId: 'q8_funding_types' },
        { value: 'WITH_RESEARCH', label: 'With research institution(s)', nextNodeId: 'q8_funding_types' },
        { value: 'WITH_COMPANY', label: 'With company(ies)', nextNodeId: 'q8_funding_types' },
        { value: 'WITH_BOTH', label: 'With both research & companies', nextNodeId: 'q8_funding_types' }
      ]
    });

    // Funding Types Question
    this.nodes.set('q8_funding_types', {
      id: 'q8_funding_types',
      question: 'Which funding types are acceptable?',
      type: 'multiple',
      options: [
        { value: 'GRANT', label: 'Grants', nextNodeId: 'q9_team_diversity' },
        { value: 'LOAN', label: 'Loans', nextNodeId: 'q9_team_diversity' },
        { value: 'GUARANTEE', label: 'Guarantees', nextNodeId: 'q9_team_diversity' },
        { value: 'EQUITY', label: 'Equity / blended finance', nextNodeId: 'q9_team_diversity' }
      ]
    });

    // Team Diversity Question
    this.nodes.set('q9_team_diversity', {
      id: 'q9_team_diversity',
      question: 'At grant award, will women own >25% of shares?',
      type: 'single',
      options: [
        { value: 'YES', label: 'Yes', nextNodeId: 'q10_env_benefit' },
        { value: 'NO', label: 'No', nextNodeId: 'q10_env_benefit' },
        { value: 'UNKNOWN', label: 'Not sure / TBD', nextNodeId: 'q10_env_benefit' }
      ]
    });

    // Environmental Benefit Question
    this.nodes.set('q10_env_benefit', {
      id: 'q10_env_benefit',
      question: 'Will the project measurably reduce emissions/energy/waste in the EU?',
      type: 'single',
      options: [
        { value: 'STRONG', label: 'Yes, central to the project', nextNodeId: 'scoring' },
        { value: 'SOME', label: 'Partly / co-benefit', nextNodeId: 'scoring' },
        { value: 'NONE', label: 'No / not applicable', nextNodeId: 'scoring' }
      ]
    });

    // Terminal Scoring Node
    this.nodes.set('scoring', {
      id: 'scoring',
      question: '',
      type: 'single',
      isTerminal: true
    });
  }


  public setUserProfile(profile: UserProfile): void {
    this.userProfile = profile;
  }

  public getNextQuestion(currentAnswers: Record<string, any>, currentNodeId: string): DecisionTreeNode | null {
    const currentNode = this.nodes.get(currentNodeId);
    if (!currentNode) return null;

    // If it's a conditional node, check the condition
    if (currentNode.type === 'conditional' && currentNode.condition) {
      const shouldProceed = currentNode.condition(currentAnswers);
      if (shouldProceed && currentNode.nextNodeId) {
        return this.nodes.get(currentNode.nextNodeId) || null;
      } else {
        // Fallback to grant eligibility if condition fails
        return this.nodes.get('grant_eligibility') || null;
      }
    }

    // If it's a terminal node, return null
    if (currentNode.isTerminal) {
      return null;
    }

    // Return the next node
    if (currentNode.nextNodeId) {
      return this.nodes.get(currentNode.nextNodeId) || null;
    }

    return null;
  }

  public async processDecisionTree(answers: Record<string, any>, _currentNodeId: string = 'q1_country'): Promise<DecisionTreeResult> {
    try {
      // Use doctor diagnostic for better program matching
      const symptoms = doctorDiagnostic.analyzeSymptoms(answers);
      const diagnosis = await doctorDiagnostic.makeDiagnosis(symptoms);
      
      // Get programs from enhanced data source
      const programs = await dataSource.getPrograms();
      
      // Filter programs based on diagnosis if confidence is high
      let filteredPrograms = programs;
      if (diagnosis.confidence > 0.7) {
        filteredPrograms = diagnosis.programs;
      }
      
      // Score programs using enhanced engine
      const scoredPrograms = await scorePrograms({ answers, programs: filteredPrograms });
      
      // Generate explanations with doctor reasoning
      const explanations = this.generateExplanations(answers, scoredPrograms, diagnosis);
      
      // Check for gaps
      const gaps = this.identifyGaps(answers, scoredPrograms);
      
      // Get fallback programs if no matches
      const fallbackPrograms = scoredPrograms.length === 0 ? 
        await this.getFallbackPrograms(answers) : [];

      return {
        recommendations: filteredPrograms,
        explanations,
        gaps,
        fallbackPrograms
      };
    } catch (error) {
      console.error('Error in decision tree processing:', error);
      return {
        recommendations: [],
        explanations: ['An error occurred while processing your request.'],
        gaps: ['System error'],
        fallbackPrograms: []
      };
    }
  }


  private generateExplanations(_answers: Record<string, any>, programs: any[], diagnosis?: any): string[] {
    const explanations: string[] = [];
    
    if (programs.length === 0) {
      explanations.push('No programs match your current criteria. Let me suggest some alternatives.');
      return explanations;
    }

    explanations.push(`Found ${programs.length} programs that match your criteria.`);
    
    // Add doctor diagnostic reasoning
    if (diagnosis) {
      explanations.push(`Diagnosis: ${diagnosis.primary} (confidence: ${Math.round(diagnosis.confidence * 100)}%)`);
      if (diagnosis.reasoning) {
        explanations.push(diagnosis.reasoning);
      }
    }

    // Add specific explanations based on user profile
    if (this.userProfile) {
      if (this.userProfile.segment === 'B2C_FOUNDER') {
        explanations.push('As a startup founder, I\'ve prioritized programs that support early-stage innovation.');
      } else if (this.userProfile.segment === 'SME_LOAN') {
        explanations.push('For established businesses, I\'ve focused on programs that support growth and expansion.');
      }
    }

    return explanations;
  }

  private identifyGaps(answers: Record<string, any>, programs: any[]): string[] {
    const gaps: string[] = [];
    
    if (programs.length === 0) {
      gaps.push('No programs found for your criteria');
    }

    // Check for missing critical information
    if (!answers.country && !answers.q1_country) {
      gaps.push('Country information is missing');
    }
    if (!answers.stage && !answers.q2_entity_stage) {
      gaps.push('Business stage information is missing');
    }
    if (!answers.theme && !answers.q4_theme) {
      gaps.push('Business theme/industry information is missing');
    }

    return gaps;
  }

  private async getFallbackPrograms(_answers: Record<string, any>): Promise<any[]> {
    try {
      // Load programs dynamically
      const data = await import('../../data/programs.json').then(module => module.default);
      const allPrograms = data.programs || [];
      return allPrograms.slice(0, 3).map((program: any) => ({
        ...program,
        score: 50, // Neutral score for fallback programs
        why: ['This is a general recommendation based on available programs.']
      }));
    } catch (error) {
      console.error('Error loading fallback programs:', error);
      return [];
    }
  }

  public createGapTicket(answers: Record<string, any>, _gaps: string[]): any {
    return {
      id: `gap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: this.userProfile?.id || 'anonymous',
      reason: 'NO_MATCHES',
      context: {
        answers,
        signals: {},
        requestedIndustry: answers.q4_theme
      },
      suggestedPrograms: [],
      status: 'OPEN',
      createdAt: new Date().toISOString()
    };
  }
}

export const decisionTreeEngine = new DecisionTreeEngine();
export default decisionTreeEngine;
