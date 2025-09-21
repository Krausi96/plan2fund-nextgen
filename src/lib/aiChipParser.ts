// AI Chip Parser - Converts free text to structured chips
export interface Chip {
  id: string;
  label: string;
  value: string;
  confidence: number;
  required: boolean;
}

export interface ParsedChips {
  chips: Chip[];
  missingRequired: string[];
  clarifications: string[];
  confidence: number;
}

export class AIChipParser {
  private sectorKeywords = {
    'AI': ['ai', 'artificial intelligence', 'machine learning', 'ml', 'deep learning', 'neural', 'algorithm'],
    'Health': ['health', 'healthcare', 'medical', 'medtech', 'biotech', 'clinical', 'pharma', 'therapeutic'],
    'SaaS': ['saas', 'software as a service', 'platform', 'web app', 'application', 'software'],
    'Manufacturing': ['manufacturing', 'production', 'factory', 'industrial', 'machinery', 'equipment'],
    'Creative': ['creative', 'design', 'media', 'content', 'art', 'culture', 'entertainment'],
    'Fintech': ['fintech', 'financial', 'banking', 'payment', 'financing', 'investment', 'trading'],
    'GreenTech': ['green', 'sustainability', 'environment', 'climate', 'energy', 'renewable', 'carbon'],
    'Biotech': ['biotech', 'biotechnology', 'bio', 'genetic', 'molecular', 'life science'],
    'Education': ['education', 'edtech', 'learning', 'training', 'academic', 'university', 'school'],
    'Retail': ['retail', 'ecommerce', 'commerce', 'shopping', 'marketplace', 'consumer'],
    'Mobility': ['mobility', 'transport', 'logistics', 'automotive', 'vehicle', 'transportation'],
    'Research': ['research', 'r&d', 'development', 'scientific', 'academic', 'institution'],
    'Other': []
  };

  private stageKeywords = {
    'Idea': ['idea', 'concept', 'early', 'pre', 'initial'],
    'MVP': ['mvp', 'prototype', 'beta', 'pilot', 'proof of concept', 'poc'],
    'Revenue': ['revenue', 'revenue generating', 'profitable', 'earning', 'sales'],
    'Growth': ['growth', 'scaling', 'expanding', 'growing'],
    'Scaleup': ['scaleup', 'scale-up', 'scaled', 'large', 'enterprise']
  };

  private locationKeywords = {
    'Vienna': ['vienna', 'wien'],
    'Graz': ['graz'],
    'Salzburg': ['salzburg'],
    'Linz': ['linz'],
    'Innsbruck': ['innsbruck'],
    'Austria': ['austria', 'at', 'österreich'],
    'EU': ['eu', 'europe', 'european union'],
    'Germany': ['germany', 'deutschland', 'de'],
    'Switzerland': ['switzerland', 'schweiz', 'ch']
  };

  public parseInput(input: string): ParsedChips {
    const normalizedInput = input.toLowerCase().trim();
    const chips: Chip[] = [];
    const missingRequired: string[] = [];
    const clarifications: string[] = [];

    // Parse location
    const location = this.parseLocation(normalizedInput);
    if (location) {
      chips.push({
        id: 'location',
        label: 'Location',
        value: location,
        confidence: 0.9,
        required: true
      });
    } else {
      missingRequired.push('location');
    }

    // Parse stage
    const stage = this.parseStage(normalizedInput);
    if (stage) {
      chips.push({
        id: 'stage',
        label: 'Stage',
        value: stage,
        confidence: 0.8,
        required: true
      });
    } else {
      missingRequired.push('stage');
    }

    // Parse team size
    const teamSize = this.parseTeamSize(normalizedInput);
    if (teamSize) {
      chips.push({
        id: 'team_size',
        label: 'Team Size',
        value: teamSize.toString(),
        confidence: 0.9,
        required: true
      });
    } else {
      missingRequired.push('team_size');
    }

    // Parse sector
    const sector = this.parseSector(normalizedInput);
    if (sector) {
      chips.push({
        id: 'sector',
        label: 'Sector',
        value: sector,
        confidence: 0.8,
        required: true
      });
    } else {
      missingRequired.push('sector');
    }

    // Parse funding need
    const fundingNeed = this.parseFundingNeed(normalizedInput);
    if (fundingNeed) {
      chips.push({
        id: 'funding_need',
        label: 'Funding Need',
        value: fundingNeed.toString(),
        confidence: 0.9,
        required: true
      });
    } else {
      missingRequired.push('funding_need');
    }

    // Parse optional fields
    const collaboration = this.parseCollaboration(normalizedInput);
    if (collaboration) {
      chips.push({
        id: 'collaboration',
        label: 'Collaboration',
        value: collaboration,
        confidence: 0.7,
        required: false
      });
    }

    const legalForm = this.parseLegalForm(normalizedInput);
    if (legalForm) {
      chips.push({
        id: 'legal_form',
        label: 'Legal Form',
        value: legalForm,
        confidence: 0.7,
        required: false
      });
    }

    // Generate clarifications for missing required fields
    if (missingRequired.length > 0) {
      clarifications.push(...this.generateClarifications(missingRequired));
    }

    // Calculate overall confidence
    const confidence = chips.length > 0 
      ? chips.reduce((sum, chip) => sum + chip.confidence, 0) / chips.length 
      : 0;

    return {
      chips,
      missingRequired,
      clarifications: clarifications.slice(0, 2), // Max 2 clarifications
      confidence
    };
  }

  private parseLocation(input: string): string | null {
    // Check for specific cities
    for (const [city, keywords] of Object.entries(this.locationKeywords)) {
      for (const keyword of keywords) {
        if (input.includes(keyword)) {
          if (city === 'Vienna' || city === 'Graz' || city === 'Salzburg' || city === 'Linz' || city === 'Innsbruck') {
            return `${city}, Austria`;
          } else if (city === 'Austria') {
            return 'Austria';
          } else if (city === 'EU') {
            return 'EU';
          } else {
            return city;
          }
        }
      }
    }
    return null;
  }

  private parseStage(input: string): string | null {
    for (const [stage, keywords] of Object.entries(this.stageKeywords)) {
      for (const keyword of keywords) {
        if (input.includes(keyword)) {
          return stage;
        }
      }
    }
    return null;
  }

  private parseTeamSize(input: string): number | null {
    // Look for patterns like "team 3", "3 people", "3 founders", etc.
    const teamPatterns = [
      /team\s+(\d+)/,
      /(\d+)\s+people/,
      /(\d+)\s+founders?/,
      /(\d+)\s+employees?/,
      /(\d+)\s+staff/
    ];

    for (const pattern of teamPatterns) {
      const match = input.match(pattern);
      if (match) {
        return parseInt(match[1]);
      }
    }

    // Look for standalone numbers that might be team size
    const numberMatch = input.match(/\b(\d+)\b/);
    if (numberMatch) {
      const num = parseInt(numberMatch[1]);
      if (num >= 1 && num <= 1000) { // Reasonable team size range
        return num;
      }
    }

    return null;
  }

  private parseSector(input: string): string | null {
    for (const [sector, keywords] of Object.entries(this.sectorKeywords)) {
      for (const keyword of keywords) {
        if (input.includes(keyword)) {
          return sector;
        }
      }
    }
    return null;
  }

  private parseFundingNeed(input: string): number | null {
    // Look for various funding amount patterns
    const fundingPatterns = [
      /€?\s*(\d+(?:[.,]\d+)?)\s*k/i, // 150k, €150k, 150.000k
      /€?\s*(\d+(?:[.,]\d+)?)\s*million/i, // 2 million, €2 million
      /€?\s*(\d+(?:[.,]\d+)?)\s*mio/i, // 0.5 mio, 2 mio
      /€?\s*(\d+(?:[.,]\d+)?)\s*000/i, // 150000, 150.000
      /€?\s*(\d+(?:[.,]\d+)?)\s*eur/i, // 150000 EUR
      /€\s*(\d+(?:[.,]\d+)?)/i // €150000
    ];

    for (const pattern of fundingPatterns) {
      const match = input.match(pattern);
      if (match) {
        let amount = parseFloat(match[1].replace(',', '.'));
        
        // Apply multipliers
        if (pattern.source.includes('k')) {
          amount *= 1000;
        } else if (pattern.source.includes('million') || pattern.source.includes('mio')) {
          amount *= 1000000;
        } else if (pattern.source.includes('000')) {
          // Already in correct format
        }

        return Math.round(amount);
      }
    }

    return null;
  }

  private parseCollaboration(input: string): string | null {
    if (input.includes('collaboration') || input.includes('partnership') || input.includes('research')) {
      return 'Yes';
    } else if (input.includes('no collaboration') || input.includes('solo')) {
      return 'No';
    }
    return null;
  }

  private parseLegalForm(input: string): string | null {
    if (input.includes('gmbh') || input.includes('gmbh')) {
      return 'GmbH';
    } else if (input.includes('eu') || input.includes('e.u.')) {
      return 'e.U.';
    } else if (input.includes('association') || input.includes('verein')) {
      return 'Association';
    } else if (input.includes('university') || input.includes('spin-off') || input.includes('spin off')) {
      return 'University spin-off';
    }
    return null;
  }

  private generateClarifications(missingRequired: string[]): string[] {
    const clarifications: string[] = [];

    if (missingRequired.includes('location')) {
      clarifications.push('What is your project location?');
    }
    if (missingRequired.includes('stage')) {
      clarifications.push('What is your current development stage?');
    }
    if (missingRequired.includes('team_size')) {
      clarifications.push('How many people are on your team?');
    }
    if (missingRequired.includes('sector')) {
      clarifications.push('What sector does your project belong to?');
    }
    if (missingRequired.includes('funding_need')) {
      clarifications.push('How much funding do you need?');
    }

    return clarifications;
  }
}

export const aiChipParser = new AIChipParser();
