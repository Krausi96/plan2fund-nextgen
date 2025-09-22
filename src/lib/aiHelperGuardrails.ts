// Enhanced AI Helper Guardrails - Integrates with existing system
import rawPrograms from "../data/programs";

export interface AIHelperResponse {
  type: 'chips' | 'clarification' | 'redirect' | 'suggestion_ticket' | 'plan_assistance';
  content: any;
  confidence: number;
  guardrails: {
    programInvented: boolean;
    offTopic: boolean;
    unknownProgram: boolean;
    withinScope: boolean;
  };
}

export interface Chip {
  field: string;
  label: string;
  value: string;
  confidence: number;
  editable: boolean;
}

export interface SuggestionTicket {
  id: string;
  programName: string;
  urls: string[];
  reason: string;
  status: 'open' | 'reviewed' | 'rejected';
  createdAt: string;
}

export class AIHelperGuardrails {
  private programs: any[];
  private maxClarifications = 3;

  constructor() {
    this.programs = rawPrograms.programs;
  }

  /**
   * Process user input with enhanced guardrails
   */
  async processInput(input: string, context?: 'plan' | 'intake' | 'general'): Promise<AIHelperResponse> {
    const lowerInput = input.toLowerCase();
    
    // Check for off-topic input
    if (this.isOffTopic(lowerInput)) {
      return {
        type: 'redirect',
        content: {
          message: 'I can help you with business planning and funding questions. Let me redirect you to our funding wizard.',
          redirectTo: '/reco'
        },
        confidence: 0.9,
        guardrails: {
          programInvented: false,
          offTopic: true,
          unknownProgram: false,
          withinScope: false
        }
      };
    }

    // Check for unknown program requests
    const unknownProgram = this.detectUnknownProgram(lowerInput);
    if (unknownProgram) {
      return {
        type: 'suggestion_ticket',
        content: this.createSuggestionTicket(unknownProgram, input),
        confidence: 0.8,
        guardrails: {
          programInvented: false,
          offTopic: false,
          unknownProgram: true,
          withinScope: true
        }
      };
    }

    // Check if this is plan assistance context
    if (context === 'plan' || this.isPlanRelated(lowerInput)) {
      return {
        type: 'plan_assistance',
        content: {
          message: 'I can help you with your business plan. What specific section would you like assistance with?',
          suggestions: [
            'Create an executive summary',
            'Develop financial projections',
            'Write a market analysis',
            'Define your value proposition',
            'Plan your go-to-market strategy'
          ]
        },
        confidence: 0.8,
        guardrails: {
          programInvented: false,
          offTopic: false,
          unknownProgram: false,
          withinScope: true
        }
      };
    }

    // Extract chips from input
    const chips = this.extractChips(input);
    if (chips.length > 0) {
      return {
        type: 'chips',
        content: chips,
        confidence: this.calculateChipConfidence(chips),
        guardrails: {
          programInvented: false,
          offTopic: false,
          unknownProgram: false,
          withinScope: true
        }
      };
    }

    // Provide clarification
    const clarification = this.generateClarification(input);
    return {
      type: 'clarification',
      content: clarification,
      confidence: 0.7,
      guardrails: {
        programInvented: false,
        offTopic: false,
        unknownProgram: false,
        withinScope: true
      }
    };
  }

  /**
   * Check if input is off-topic
   */
  private isOffTopic(input: string): boolean {
    const offTopicKeywords = [
      'write a poem', 'write a story', 'tell me a joke',
      'what is the weather', 'how to cook', 'movie recommendation',
      'sports', 'politics', 'religion', 'personal advice',
      'what time is it', 'what day is it', 'calendar',
      'news', 'entertainment', 'gaming', 'social media'
    ];
    
    return offTopicKeywords.some(keyword => input.includes(keyword));
  }

  /**
   * Check if input is plan-related
   */
  private isPlanRelated(input: string): boolean {
    const planKeywords = [
      'business plan', 'executive summary', 'financial projections',
      'market analysis', 'value proposition', 'go-to-market',
      'strategy', 'revenue model', 'competitive analysis',
      'team structure', 'funding requirements', 'milestones'
    ];
    
    return planKeywords.some(keyword => input.includes(keyword));
  }

  /**
   * Detect if user is asking about unknown programs
   */
  private detectUnknownProgram(input: string): string | null {
    const programNames = this.programs.map(p => p.name.toLowerCase());
    const programKeywords = this.programs.flatMap(p => 
      p.tags?.map((tag: string) => tag.toLowerCase()) || []
    );

    // Look for program-like phrases
    const programPatterns = [
      /(?:funding|grant|loan|program|scheme|initiative)\s+(?:called|named|for)\s+["']?([^"']+)["']?/i,
      /(?:i need|looking for|want)\s+(?:funding|grant|loan)\s+(?:for|from)\s+["']?([^"']+)["']?/i,
      /(?:is there|are there|do you have)\s+(?:any|a)\s+(?:funding|grant|loan)\s+(?:for|from)\s+["']?([^"']+)["']?/i
    ];

    for (const pattern of programPatterns) {
      const match = input.match(pattern);
      if (match) {
        const programName = match[1].toLowerCase();
        // Check if it's not in our known programs
        if (!programNames.some(name => name.includes(programName)) && 
            !programKeywords.some(keyword => keyword.includes(programName))) {
          return programName;
        }
      }
    }

    return null;
  }

  /**
   * Extract chips from input - Enhanced to reliably extract sector, stage, team, location, amount
   */
  private extractChips(input: string): Chip[] {
    const chips: Chip[] = [];
    const lowerInput = input.toLowerCase();

    // Location chips (required)
    if (lowerInput.includes('vienna') || lowerInput.includes('wien')) {
      chips.push({
        field: 'q1_country',
        label: 'Location',
        value: 'AT',
        confidence: 0.95,
        editable: true
      });
    } else if (lowerInput.includes('austria') || lowerInput.includes('österreich')) {
      chips.push({
        field: 'q1_country',
        label: 'Country',
        value: 'AT',
        confidence: 0.9,
        editable: true
      });
    } else if (lowerInput.includes('germany') || lowerInput.includes('deutschland')) {
      chips.push({
        field: 'q1_country',
        label: 'Country',
        value: 'DE',
        confidence: 0.9,
        editable: true
      });
    }

    // Sector chips (required)
    if (lowerInput.includes('tech') || lowerInput.includes('software') || lowerInput.includes('ai') || lowerInput.includes('digital')) {
      chips.push({
        field: 'q4_theme',
        label: 'Sector',
        value: 'INNOVATION_DIGITAL',
        confidence: 0.9,
        editable: true
      });
    } else if (lowerInput.includes('food') || lowerInput.includes('restaurant') || lowerInput.includes('bakery') || lowerInput.includes('catering')) {
      chips.push({
        field: 'q4_theme',
        label: 'Sector',
        value: 'FOOD_BEVERAGE',
        confidence: 0.9,
        editable: true
      });
    } else if (lowerInput.includes('health') || lowerInput.includes('medical') || lowerInput.includes('pharma')) {
      chips.push({
        field: 'q4_theme',
        label: 'Sector',
        value: 'HEALTH_LIFE_SCIENCE',
        confidence: 0.9,
        editable: true
      });
    } else if (lowerInput.includes('sustainability') || lowerInput.includes('environment') || lowerInput.includes('green')) {
      chips.push({
        field: 'q4_theme',
        label: 'Sector',
        value: 'SUSTAINABILITY',
        confidence: 0.9,
        editable: true
      });
    }

    // Stage chips (required)
    if (lowerInput.includes('startup') || lowerInput.includes('new business') || lowerInput.includes('founding')) {
      chips.push({
        field: 'q2_entity_stage',
        label: 'Stage',
        value: 'INC_LT_6M',
        confidence: 0.9,
        editable: true
      });
    } else if (lowerInput.includes('established') || lowerInput.includes('existing') || lowerInput.includes('company')) {
      chips.push({
        field: 'q2_entity_stage',
        label: 'Stage',
        value: 'INC_GT_36M',
        confidence: 0.8,
        editable: true
      });
    }

    // Team size chips (required)
    if (lowerInput.includes('solo') || lowerInput.includes('just me') || lowerInput.includes('individual')) {
      chips.push({
        field: 'q3_company_size',
        label: 'Team Size',
        value: 'MICRO_0_9',
        confidence: 0.9,
        editable: true
      });
    } else if (lowerInput.includes('team') || lowerInput.includes('partners') || lowerInput.includes('co-founders')) {
      const teamMatch = input.match(/(\d+)\s*(?:people|person|team|members)/i);
      if (teamMatch) {
        const size = parseInt(teamMatch[1]);
        let value = 'MICRO_0_9';
        if (size >= 10 && size < 50) value = 'SMALL_10_49';
        else if (size >= 50 && size < 250) value = 'MEDIUM_50_249';
        else if (size >= 250) value = 'LARGE_250_PLUS';
        
        chips.push({
          field: 'q3_company_size',
          label: 'Team Size',
          value,
          confidence: 0.9,
          editable: true
        });
      } else {
        chips.push({
          field: 'q3_company_size',
          label: 'Team Size',
          value: 'SMALL_10_49',
          confidence: 0.8,
          editable: true
        });
      }
    }

    // Funding type chips (required)
    if (lowerInput.includes('grant') || lowerInput.includes('funding') || lowerInput.includes('subsidy')) {
      chips.push({
        field: 'q8_funding_types',
        label: 'Funding Type',
        value: 'GRANT',
        confidence: 0.9,
        editable: true
      });
    }
    if (lowerInput.includes('loan') || lowerInput.includes('credit') || lowerInput.includes('borrow')) {
      chips.push({
        field: 'q8_funding_types',
        label: 'Funding Type',
        value: 'LOAN',
        confidence: 0.9,
        editable: true
      });
    }
    if (lowerInput.includes('investment') || lowerInput.includes('equity') || lowerInput.includes('investor')) {
      chips.push({
        field: 'q8_funding_types',
        label: 'Funding Type',
        value: 'EQUITY',
        confidence: 0.9,
        editable: true
      });
    }

    // Amount chips (required)
    const amountMatch = input.match(/(?:€|EUR|euro)\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/i);
    if (amountMatch) {
      chips.push({
        field: 'amount',
        label: 'Funding Amount',
        value: `€${amountMatch[1]}`,
        confidence: 0.95,
        editable: true
      });
    } else if (lowerInput.includes('thousand') || lowerInput.includes('k')) {
      const kMatch = input.match(/(\d+)\s*(?:thousand|k)/i);
      if (kMatch) {
        chips.push({
          field: 'amount',
          label: 'Funding Amount',
          value: `€${kMatch[1]},000`,
          confidence: 0.8,
          editable: true
        });
      }
    }

    // TRL chips
    if (lowerInput.includes('proof of concept') || lowerInput.includes('prototype')) {
      chips.push({
        field: 'q5_maturity_trl',
        label: 'Technology Readiness',
        value: 'TRL_3_4',
        confidence: 0.9,
        editable: true
      });
    } else if (lowerInput.includes('pilot') || lowerInput.includes('testing')) {
      chips.push({
        field: 'q5_maturity_trl',
        label: 'Technology Readiness',
        value: 'TRL_7_8',
        confidence: 0.9,
        editable: true
      });
    }

    // R&D location chips
    if (lowerInput.includes('r&d') || lowerInput.includes('research') || lowerInput.includes('development')) {
      if (lowerInput.includes('austria') || lowerInput.includes('vienna')) {
        chips.push({
          field: 'q6_rnd_in_at',
          label: 'R&D Location',
          value: 'YES',
          confidence: 0.9,
          editable: true
        });
      } else {
        chips.push({
          field: 'q6_rnd_in_at',
          label: 'R&D Location',
          value: 'NO',
          confidence: 0.8,
          editable: true
        });
      }
    }

    // Environmental benefit chips
    if (lowerInput.includes('environment') || lowerInput.includes('sustainability') || lowerInput.includes('green')) {
      chips.push({
        field: 'q10_env_benefit',
        label: 'Environmental Benefit',
        value: 'SOME',
        confidence: 0.8,
        editable: true
      });
    }

    return chips.slice(0, 8); // Allow up to 8 chips
  }

  /**
   * Generate clarification questions
   */
  private generateClarification(input: string): string[] {
    const clarifications: string[] = [];
    
    if (!input.includes('austria') && !input.includes('vienna')) {
      clarifications.push('Will your project be based in Austria?');
    }
    
    if (!input.includes('startup') && !input.includes('company') && !input.includes('business')) {
      clarifications.push('What stage is your business at?');
    }
    
    if (!input.includes('grant') && !input.includes('loan') && !input.includes('funding')) {
      clarifications.push('What type of funding are you looking for?');
    }

    if (!input.includes('tech') && !input.includes('health') && !input.includes('sustainability')) {
      clarifications.push('What sector is your business in?');
    }

    return clarifications.slice(0, this.maxClarifications);
  }

  /**
   * Create suggestion ticket for unknown programs
   */
  private createSuggestionTicket(programName: string, originalInput: string): SuggestionTicket {
    return {
      id: `suggestion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      programName,
      urls: this.extractUrls(originalInput),
      reason: `User requested information about "${programName}" which is not in our program register`,
      status: 'open',
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Extract URLs from input
   */
  private extractUrls(input: string): string[] {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return input.match(urlRegex) || [];
  }

  /**
   * Calculate confidence for chips
   */
  private calculateChipConfidence(chips: Chip[]): number {
    if (chips.length === 0) return 0;
    const totalConfidence = chips.reduce((sum, chip) => sum + chip.confidence, 0);
    return totalConfidence / chips.length;
  }

  /**
   * Get metrics for AI helper usage
   */
  getMetrics(): {
    totalRequests: number;
    chipsGenerated: number;
    clarificationsProvided: number;
    redirectsIssued: number;
    suggestionTicketsCreated: number;
    averageConfidence: number;
  } {
    // This would typically come from analytics data
    return {
      totalRequests: 0,
      chipsGenerated: 0,
      clarificationsProvided: 0,
      redirectsIssued: 0,
      suggestionTicketsCreated: 0,
      averageConfidence: 0
    };
  }
}

// Export singleton instance
export const aiHelperGuardrails = new AIHelperGuardrails();
