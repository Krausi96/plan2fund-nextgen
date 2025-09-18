// Decision Tree Logic for Recommendation Engine
import { UserProfile } from './schemas/userProfile';
import { scorePrograms } from './scoring';
// Import removed - will load data dynamically;

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
    // Program Type Selection (First Question)
    this.nodes.set('program_type', {
      id: 'program_type',
      question: 'What type of funding are you looking for?',
      type: 'single',
      options: [
        { value: 'GRANT', label: 'Grant (Non-repayable funding)', nextNodeId: 'grant_eligibility' },
        { value: 'LOAN', label: 'Loan (Repayable funding)', nextNodeId: 'loan_eligibility' },
        { value: 'EQUITY', label: 'Equity Investment', nextNodeId: 'equity_eligibility' },
        { value: 'VISA', label: 'Visa/Immigration Support', nextNodeId: 'visa_eligibility' },
        { value: 'MIXED', label: 'Multiple types (I\'m not sure)', nextNodeId: 'mixed_eligibility' }
      ]
    });

    // Grant Eligibility Path
    this.nodes.set('grant_eligibility', {
      id: 'grant_eligibility',
      question: 'Are you eligible for Austrian grants?',
      type: 'conditional',
      condition: (answers) => this.checkGrantEligibility(answers),
      nextNodeId: 'grant_preferences'
    });

    // Loan Eligibility Path
    this.nodes.set('loan_eligibility', {
      id: 'loan_eligibility',
      question: 'Do you have collateral or guarantees for a loan?',
      type: 'single',
      options: [
        { value: 'YES', label: 'Yes, I have collateral/guarantees', nextNodeId: 'loan_preferences' },
        { value: 'NO', label: 'No, I need unsecured funding', nextNodeId: 'grant_eligibility' },
        { value: 'UNSURE', label: 'I\'m not sure', nextNodeId: 'loan_preferences' }
      ]
    });

    // Equity Eligibility Path
    this.nodes.set('equity_eligibility', {
      id: 'equity_eligibility',
      question: 'What stage is your business at?',
      type: 'single',
      options: [
        { value: 'IDEA', label: 'Just an idea (Pre-seed)', nextNodeId: 'grant_eligibility' },
        { value: 'PROTOTYPE', label: 'Prototype/MVP (Seed)', nextNodeId: 'equity_preferences' },
        { value: 'REVENUE', label: 'Generating revenue (Series A)', nextNodeId: 'equity_preferences' },
        { value: 'SCALING', label: 'Scaling (Series B+)', nextNodeId: 'equity_preferences' }
      ]
    });

    // Visa Eligibility Path
    this.nodes.set('visa_eligibility', {
      id: 'visa_eligibility',
      question: 'What is your immigration status?',
      type: 'single',
      options: [
        { value: 'NON_EU', label: 'Non-EU citizen', nextNodeId: 'visa_preferences' },
        { value: 'EU', label: 'EU citizen', nextNodeId: 'grant_eligibility' },
        { value: 'UNSURE', label: 'I\'m not sure', nextNodeId: 'visa_preferences' }
      ]
    });

    // Mixed Path
    this.nodes.set('mixed_eligibility', {
      id: 'mixed_eligibility',
      question: 'Let me help you find the best options. What describes your situation best?',
      type: 'single',
      options: [
        { value: 'STARTUP', label: 'I\'m starting a new business', nextNodeId: 'grant_eligibility' },
        { value: 'EXPANDING', label: 'I\'m expanding an existing business', nextNodeId: 'loan_eligibility' },
        { value: 'IMMIGRATING', label: 'I need to immigrate to Austria', nextNodeId: 'visa_eligibility' },
        { value: 'INVESTING', label: 'I\'m looking for investors', nextNodeId: 'equity_eligibility' }
      ]
    });

    // Preference Questions (Common to all paths)
    this.nodes.set('grant_preferences', {
      id: 'grant_preferences',
      question: 'What are your preferences for grant funding?',
      type: 'multiple',
      options: [
        { value: 'INNOVATION', label: 'Innovation/R&D focus' },
        { value: 'SUSTAINABILITY', label: 'Sustainability/Environment' },
        { value: 'SOCIAL_IMPACT', label: 'Social impact' },
        { value: 'EXPORT', label: 'Export/International' },
        { value: 'DIGITAL', label: 'Digital transformation' }
      ],
      nextNodeId: 'scoring'
    });

    this.nodes.set('loan_preferences', {
      id: 'loan_preferences',
      question: 'What are your preferences for loan funding?',
      type: 'multiple',
      options: [
        { value: 'WORKING_CAPITAL', label: 'Working capital' },
        { value: 'EQUIPMENT', label: 'Equipment purchase' },
        { value: 'REAL_ESTATE', label: 'Real estate' },
        { value: 'EXPANSION', label: 'Business expansion' },
        { value: 'GUARANTEE', label: 'Government guarantee' }
      ],
      nextNodeId: 'scoring'
    });

    this.nodes.set('equity_preferences', {
      id: 'equity_preferences',
      question: 'What are your preferences for equity investment?',
      type: 'multiple',
      options: [
        { value: 'ANGEL', label: 'Angel investors' },
        { value: 'VC', label: 'Venture capital' },
        { value: 'CROWDFUNDING', label: 'Crowdfunding' },
        { value: 'STRATEGIC', label: 'Strategic investors' },
        { value: 'FAMILY_OFFICE', label: 'Family office' }
      ],
      nextNodeId: 'scoring'
    });

    this.nodes.set('visa_preferences', {
      id: 'visa_preferences',
      question: 'What are your preferences for visa support?',
      type: 'multiple',
      options: [
        { value: 'STARTUP_VISA', label: 'Startup visa (Red-White-Red Card)' },
        { value: 'FREELANCE', label: 'Freelance permit' },
        { value: 'EMPLOYMENT', label: 'Employment visa' },
        { value: 'INVESTMENT', label: 'Investment visa' },
        { value: 'FAMILY', label: 'Family reunification' }
      ],
      nextNodeId: 'scoring'
    });

    // Terminal Scoring Node
    this.nodes.set('scoring', {
      id: 'scoring',
      question: '',
      type: 'single',
      isTerminal: true
    });
  }

  private checkGrantEligibility(answers: Record<string, any>): boolean {
    // Check if user is eligible for Austrian grants
    const country = answers.country || answers.q1_country;
    const stage = answers.stage || answers.q2_entity_stage;
    const theme = answers.theme || answers.q4_theme;

    return (
      (country === 'AT' || country === 'EU') &&
      (stage === 'PRE_COMPANY' || stage === 'INC_LT_6M' || stage === 'INC_GT_6M') &&
      (theme === 'INNOVATION_DIGITAL' || theme === 'SUSTAINABILITY' || theme === 'SOCIAL_IMPACT')
    );
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

  public async processDecisionTree(answers: Record<string, any>, _currentNodeId: string = 'program_type'): Promise<DecisionTreeResult> {
    try {
      // Score programs based on current answers
      const scoredPrograms = await scorePrograms({ answers });
      
      // Filter programs based on decision tree path
      const filteredPrograms = this.filterProgramsByPath(answers, scoredPrograms);
      
      // Generate explanations
      const explanations = this.generateExplanations(answers, filteredPrograms);
      
      // Check for gaps
      const gaps = this.identifyGaps(answers, filteredPrograms);
      
      // Get fallback programs if no matches
      const fallbackPrograms = filteredPrograms.length === 0 ? 
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

  private filterProgramsByPath(answers: Record<string, any>, programs: any[]): any[] {
    const programType = answers.program_type || answers.q3_program_type;
    if (!programType) return programs;

    return programs.filter(program => {
      const programTags = program.tags || [];
      const programTypeLower = programType.toLowerCase();
      
      switch (programTypeLower) {
        case 'grant':
          return programTags.includes('grant') || program.type === 'grant';
        case 'loan':
          return programTags.includes('loan') || program.type === 'loan';
        case 'equity':
          return programTags.includes('equity') || program.type === 'equity';
        case 'visa':
          return programTags.includes('visa') || program.type === 'visa';
        case 'mixed':
          return true; // Show all programs for mixed type
        default:
          return true;
      }
    });
  }

  private generateExplanations(answers: Record<string, any>, programs: any[]): string[] {
    const explanations: string[] = [];
    
    if (programs.length === 0) {
      explanations.push('No programs match your current criteria. Let me suggest some alternatives.');
      return explanations;
    }

    const programType = answers.program_type || answers.q3_program_type;
    if (programType) {
      explanations.push(`Found ${programs.length} ${programType.toLowerCase()} programs that match your criteria.`);
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
      const response = await fetch('/programs.json');
      const data = await response.json();
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
        requestedProgramType: answers.program_type,
        requestedIndustry: answers.industry
      },
      suggestedPrograms: [],
      status: 'OPEN',
      createdAt: new Date().toISOString()
    };
  }
}

export const decisionTreeEngine = new DecisionTreeEngine();
export default decisionTreeEngine;
