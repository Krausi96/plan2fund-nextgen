// AI Helper Guardrails - Constrains AI helper to intake accelerator & scout only
import rawPrograms from '@/data/programs';

export interface AIHelperResponse {
  type: 'chips' | 'clarification' | 'redirect' | 'suggestion_ticket';
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
   * Process user input with guardrails
   */
  async processInput(input: string): Promise<AIHelperResponse> {
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
      'sports', 'politics', 'religion', 'personal advice'
    ];
    
    return offTopicKeywords.some(keyword => input.includes(keyword));
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
        field: 'location',
        label: 'Location',
        value: 'Vienna, Austria',
        confidence: 0.95,
        editable: true
      });
    } else if (lowerInput.includes('austria') || lowerInput.includes('österreich')) {
      chips.push({
        field: 'country',
        label: 'Country',
        value: 'Austria',
        confidence: 0.9,
        editable: true
      });
    } else if (lowerInput.includes('germany') || lowerInput.includes('deutschland')) {
      chips.push({
        field: 'country',
        label: 'Country',
        value: 'Germany',
        confidence: 0.9,
        editable: true
      });
    }

    // Sector chips (required)
    if (lowerInput.includes('tech') || lowerInput.includes('software') || lowerInput.includes('ai') || lowerInput.includes('digital')) {
      chips.push({
        field: 'sector',
        label: 'Sector',
        value: 'Technology',
        confidence: 0.9,
        editable: true
      });
    } else if (lowerInput.includes('food') || lowerInput.includes('restaurant') || lowerInput.includes('bakery') || lowerInput.includes('catering')) {
      chips.push({
        field: 'sector',
        label: 'Sector',
        value: 'Food & Beverage',
        confidence: 0.9,
        editable: true
      });
    } else if (lowerInput.includes('health') || lowerInput.includes('medical') || lowerInput.includes('pharma')) {
      chips.push({
        field: 'sector',
        label: 'Sector',
        value: 'Healthcare',
        confidence: 0.9,
        editable: true
      });
    } else if (lowerInput.includes('sustainability') || lowerInput.includes('environment') || lowerInput.includes('green')) {
      chips.push({
        field: 'sector',
        label: 'Sector',
        value: 'Sustainability',
        confidence: 0.9,
        editable: true
      });
    }

    // Stage chips (required)
    if (lowerInput.includes('startup') || lowerInput.includes('new business') || lowerInput.includes('founding')) {
      chips.push({
        field: 'stage',
        label: 'Stage',
        value: 'Startup',
        confidence: 0.9,
        editable: true
      });
    } else if (lowerInput.includes('established') || lowerInput.includes('existing') || lowerInput.includes('company')) {
      chips.push({
        field: 'stage',
        label: 'Stage',
        value: 'Established',
        confidence: 0.8,
        editable: true
      });
    }

    // Team size chips (required)
    if (lowerInput.includes('solo') || lowerInput.includes('just me') || lowerInput.includes('individual')) {
      chips.push({
        field: 'team_size',
        label: 'Team Size',
        value: 'Solo (1 person)',
        confidence: 0.9,
        editable: true
      });
    } else if (lowerInput.includes('team') || lowerInput.includes('partners') || lowerInput.includes('co-founders')) {
      const teamMatch = input.match(/(\d+)\s*(?:people|person|team|members)/i);
      if (teamMatch) {
        chips.push({
          field: 'team_size',
          label: 'Team Size',
          value: `${teamMatch[1]} people`,
          confidence: 0.9,
          editable: true
        });
      } else {
        chips.push({
          field: 'team_size',
          label: 'Team Size',
          value: 'Small team (2-5 people)',
          confidence: 0.8,
          editable: true
        });
      }
    }

    // Funding type chips (required)
    if (lowerInput.includes('grant') || lowerInput.includes('funding') || lowerInput.includes('subsidy')) {
      chips.push({
        field: 'funding_type',
        label: 'Funding Type',
        value: 'Grant',
        confidence: 0.9,
        editable: true
      });
    }
    if (lowerInput.includes('loan') || lowerInput.includes('credit') || lowerInput.includes('borrow')) {
      chips.push({
        field: 'funding_type',
        label: 'Funding Type',
        value: 'Loan',
        confidence: 0.9,
        editable: true
      });
    }
    if (lowerInput.includes('investment') || lowerInput.includes('equity') || lowerInput.includes('investor')) {
      chips.push({
        field: 'funding_type',
        label: 'Funding Type',
        value: 'Investment',
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

    // Ensure we have at least sector, stage, team, location, amount
    const requiredFields = ['sector', 'stage', 'team_size', 'location', 'amount'];
    const existingFields = chips.map(c => c.field);
    const missingFields = requiredFields.filter(field => !existingFields.includes(field));
    
    // Add default chips for missing required fields
    missingFields.forEach(field => {
      const defaults = {
        sector: { value: 'Technology', confidence: 0.5 },
        stage: { value: 'Startup', confidence: 0.5 },
        team_size: { value: 'Small team (2-5 people)', confidence: 0.5 },
        location: { value: 'Austria', confidence: 0.5 },
        amount: { value: '€50,000', confidence: 0.5 }
      };
      
      if (defaults[field]) {
        chips.push({
          field,
          label: field.charAt(0).toUpperCase() + field.slice(1).replace('_', ' '),
          value: defaults[field].value,
          confidence: defaults[field].confidence,
          editable: true
        });
      }
    });

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
