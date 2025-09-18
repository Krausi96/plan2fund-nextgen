// Intake Parser with AI Assistance and Deterministic Fallbacks
import { 
  FundingProfile, 
  SECTOR_MAPPING, 
  STAGE_MAPPING, 
  LOCATION_MAPPING, 
  PROGRAM_TYPE_MAPPING,
  DEFAULT_CONFIDENCE,
  // validateFundingProfile
} from './schemas/fundingProfile';

interface ParseResult {
  profile: FundingProfile;
  needsOverlay: boolean;
  overlayQuestions: string[];
  processingTime: number;
}

interface OverlayQuestion {
  field: string;
  question: string;
  options?: string[];
  required: boolean;
}

class IntakeParser {
  private aiTimeout = 2000; // 2 seconds timeout for AI
  private maxOverlayQuestions = 3;

  async parseInput(rawInput: string, sessionId: string, userId?: string): Promise<ParseResult> {
    const startTime = Date.now();
    
    try {
      // First, try AI parsing with timeout
      const aiResult = await this.parseWithAI(rawInput);
      
      if (aiResult && this.isHighConfidence(aiResult)) {
        return {
          profile: this.createProfile(aiResult, rawInput, sessionId, userId),
          needsOverlay: false,
          overlayQuestions: [],
          processingTime: Date.now() - startTime
        };
      }
      
      // Fallback to deterministic parsing
      const deterministicResult = this.parseDeterministic(rawInput);
      
      // Check if we need overlay questions
      const { needsOverlay, overlayQuestions } = this.assessOverlayNeeds(deterministicResult);
      
      return {
        profile: this.createProfile(deterministicResult, rawInput, sessionId, userId),
        needsOverlay,
        overlayQuestions,
        processingTime: Date.now() - startTime
      };
      
    } catch (error) {
      console.error('Error in intake parsing:', error);
      
      // Emergency fallback
      const emergencyResult = this.parseEmergency(rawInput);
      return {
        profile: this.createProfile(emergencyResult, rawInput, sessionId, userId),
        needsOverlay: true,
        overlayQuestions: ['sector', 'stage', 'funding_need'],
        processingTime: Date.now() - startTime
      };
    }
  }

  private async parseWithAI(input: string): Promise<Partial<FundingProfile> | null> {
    try {
      // Simulate AI API call with timeout
      const aiPromise = this.callAIAPI(input);
      const timeoutPromise = new Promise<null>((_, reject) => 
        setTimeout(() => reject(new Error('AI timeout')), this.aiTimeout)
      );
      
      const result = await Promise.race([aiPromise, timeoutPromise]);
      return result;
      
    } catch (error) {
      console.warn('AI parsing failed:', error);
      return null;
    }
  }

  private async callAIAPI(input: string): Promise<Partial<FundingProfile> | null> {
    // In a real implementation, this would call OpenAI or similar
    // For now, simulate with deterministic parsing
    return this.parseDeterministic(input);
  }

  private parseDeterministic(input: string): Partial<FundingProfile> {
    const lowerInput = input.toLowerCase();
    const result: Partial<FundingProfile> = {
      confidence: { ...DEFAULT_CONFIDENCE }
    };

    // Language detection
    result.language = this.detectLanguage(input);
    result.confidence!.language = 0.9;

    // Intent detection
    result.intent = this.detectIntent(input);
    result.confidence!.intent = 0.8;

    if (result.intent === 'offtopic') {
      return result;
    }

    // Sector detection
    result.sector = this.extractSector(lowerInput);
    result.confidence!.sector = result.sector ? 0.8 : 0.0;

    // Stage detection
    result.stage = this.extractStage(lowerInput);
    result.confidence!.stage = result.stage ? 0.8 : 0.0;

    // Team size detection
    result.team_size = this.extractTeamSize(lowerInput);
    result.confidence!.team_size = result.team_size ? 0.8 : 0.0;

    // Location detection
    const location = this.extractLocation(lowerInput);
    result.location_city = location.city;
    result.location_country = location.country;
    result.confidence!.location_city = location.city ? 0.8 : 0.0;
    result.confidence!.location_country = location.country ? 0.8 : 0.0;

    // Funding amount detection
    const funding = this.extractFundingAmount(input);
    result.funding_need_eur = funding.amount;
    result.raw_amount_text = funding.rawText;
    result.currency_detected = funding.currency;
    result.confidence!.funding_need_eur = funding.amount ? 0.8 : 0.0;

    // Program type detection
    result.program_type = this.extractProgramType(lowerInput);
    result.confidence!.program_type = result.program_type ? 0.8 : 0.0;

    // Collaboration detection
    result.collaboration = this.extractCollaboration(lowerInput);
    result.confidence!.collaboration = result.collaboration ? 0.8 : 0.0;

    // TRL detection
    result.trl = this.extractTRL(lowerInput);
    result.confidence!.trl = result.trl ? 0.8 : 0.0;

    return result;
  }

  private parseEmergency(_input: string): Partial<FundingProfile> {
    return {
      intent: 'business_intake',
      language: 'EN',
      confidence: { ...DEFAULT_CONFIDENCE, intent: 0.5, language: 0.5 }
    };
  }

  private detectLanguage(input: string): 'DE' | 'EN' | null {
    // Simple language detection based on common words
    const germanWords = ['aus', 'und', 'der', 'die', 'das', 'mit', 'für', 'von', 'in', 'auf', 'ist', 'sind', 'haben', 'werden', 'können', 'müssen', 'sollen', 'dürfen', 'möchten', 'wollen'];
    const englishWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'have', 'has', 'had', 'will', 'would', 'could', 'should'];
    
    const lowerInput = input.toLowerCase();
    const germanCount = germanWords.filter(word => lowerInput.includes(word)).length;
    const englishCount = englishWords.filter(word => lowerInput.includes(word)).length;
    
    if (germanCount > englishCount) return 'DE';
    if (englishCount > germanCount) return 'EN';
    return null;
  }

  private detectIntent(input: string): 'business_intake' | 'offtopic' | null {
    const lowerInput = input.toLowerCase();
    
    // Off-topic indicators
    const offtopicPatterns = [
      'write a poem', 'write a haiku', 'write a story', 'write a song',
      'tell me a joke', 'make me laugh', 'entertain me', 'amuse me',
      'what is love', 'philosophy', 'meaning of life', 'universe',
      'weather', 'sports', 'politics', 'gossip', 'celebrity'
    ];
    
    if (offtopicPatterns.some(pattern => lowerInput.includes(pattern))) {
      return 'offtopic';
    }
    
    // Business indicators
    const businessPatterns = [
      'business', 'startup', 'company', 'funding', 'grant', 'loan', 'investment',
      'team', 'founder', 'entrepreneur', 'revenue', 'profit', 'market',
      'product', 'service', 'customer', 'client', 'user', 'technology',
      'innovation', 'research', 'development', 'growth', 'scaling'
    ];
    
    if (businessPatterns.some(pattern => lowerInput.includes(pattern))) {
      return 'business_intake';
    }
    
    return null;
  }

  private extractSector(input: string): string | null {
    for (const [key, value] of Object.entries(SECTOR_MAPPING)) {
      if (input.includes(key)) {
        return value;
      }
    }
    return null;
  }

  private extractStage(input: string): 'scaleup' | 'idea' | 'mvp' | 'revenue' | 'growth' | null {
    for (const [key, value] of Object.entries(STAGE_MAPPING)) {
      if (input.includes(key)) {
        return value as 'scaleup' | 'idea' | 'mvp' | 'revenue' | 'growth';
      }
    }
    return null;
  }

  private extractTeamSize(input: string): number | null {
    // Look for team size patterns
    const patterns = [
      /(\d+)\s*(?:person|people|founder|founders|team|member|members)/i,
      /(?:team|team size|team size of|team of)\s*(\d+)/i,
      /(\d+)\s*(?:person|people)\s*(?:team|founders?)/i
    ];
    
    for (const pattern of patterns) {
      const match = input.match(pattern);
      if (match) {
        const size = parseInt(match[1]);
        if (size > 0 && size < 1000) {
          return size;
        }
      }
    }
    
    return null;
  }

  private extractLocation(input: string): { city: string | null; country: string | null } {
    for (const [key, value] of Object.entries(LOCATION_MAPPING)) {
      if (input.includes(key)) {
        return value;
      }
    }
    return { city: null, country: null };
  }

  private extractFundingAmount(input: string): { amount: number | null; rawText: string | null; currency: string | null } {
    // Amount patterns
    const patterns = [
      // EUR patterns
      /(?:€|EUR|Euro|euro)\s*(\d+(?:[.,]\d+)?)\s*(?:k|K|thousand|000)?/i,
      /(\d+(?:[.,]\d+)?)\s*(?:k|K|thousand|000)\s*(?:€|EUR|Euro|euro)?/i,
      /(\d+(?:[.,]\d+)?)\s*(?:€|EUR|Euro|euro)/i,
      /(?:ca\.|circa|about|around)\s*(\d+(?:[.,]\d+)?)\s*(?:k|K|thousand|000)?/i,
      /(\d+(?:[.,]\d+)?)\s*(?:Mio|million|Million)/i,
      
      // Generic patterns
      /(?:funding|need|seeking|looking for|want)\s*(?:€|EUR|Euro|euro)?\s*(\d+(?:[.,]\d+)?)\s*(?:k|K|thousand|000)?/i,
      /(\d+(?:[.,]\d+)?)\s*(?:k|K|thousand|000)\s*(?:funding|need|seeking|looking for|want)/i
    ];
    
    for (const pattern of patterns) {
      const match = input.match(pattern);
      if (match) {
        let amount = parseFloat(match[1].replace(',', '.'));
        
        // Handle k/thousand multiplier
        if (input.toLowerCase().includes('k') || input.toLowerCase().includes('thousand') || input.toLowerCase().includes('000')) {
          amount *= 1000;
        }
        
        // Handle million multiplier
        if (input.toLowerCase().includes('mio') || input.toLowerCase().includes('million')) {
          amount *= 1000000;
        }
        
        if (amount > 0) {
          return {
            amount: Math.round(amount),
            rawText: match[0],
            currency: 'EUR'
          };
        }
      }
    }
    
    return { amount: null, rawText: null, currency: null };
  }

  private extractProgramType(input: string): 'grant' | 'visa' | 'loan' | 'equity' | null {
    for (const [key, value] of Object.entries(PROGRAM_TYPE_MAPPING)) {
      if (input.includes(key)) {
        return value as 'grant' | 'visa' | 'loan' | 'equity';
      }
    }
    return null;
  }

  private extractCollaboration(input: string): 'yes' | 'no' | 'unsure' | null {
    if (input.includes('collaboration') || input.includes('partnership') || input.includes('cooperation')) {
      if (input.includes('yes') || input.includes('ja') || input.includes('sure') || input.includes('definitely')) {
        return 'yes';
      }
      if (input.includes('no') || input.includes('nein') || input.includes('not') || input.includes('nicht')) {
        return 'no';
      }
      return 'unsure';
    }
    return null;
  }

  private extractTRL(input: string): number | null {
    const trlPattern = /(?:TRL|trl|technology readiness level)\s*(\d)/i;
    const match = input.match(trlPattern);
    if (match) {
      const trl = parseInt(match[1]);
      if (trl >= 1 && trl <= 9) {
        return trl;
      }
    }
    return null;
  }

  private isHighConfidence(profile: Partial<FundingProfile>): boolean {
    if (!profile.confidence) return false;
    
    const requiredFields = ['sector', 'stage', 'team_size', 'location_city', 'funding_need_eur'];
    const highConfidenceCount = requiredFields.filter(field => 
      profile.confidence![field as keyof typeof profile.confidence] > 0.7
    ).length;
    
    return highConfidenceCount >= 3;
  }

  private assessOverlayNeeds(profile: Partial<FundingProfile>): { needsOverlay: boolean; overlayQuestions: string[] } {
    const questions: string[] = [];
    
    if (!profile.sector || (profile.confidence?.sector || 0) < 0.5) {
      questions.push('sector');
    }
    
    if (!profile.stage || (profile.confidence?.stage || 0) < 0.5) {
      questions.push('stage');
    }
    
    if (!profile.funding_need_eur || (profile.confidence?.funding_need_eur || 0) < 0.5) {
      questions.push('funding_need');
    }
    
    // Limit to max 3 questions
    const overlayQuestions = questions.slice(0, this.maxOverlayQuestions);
    
    return {
      needsOverlay: overlayQuestions.length > 0,
      overlayQuestions
    };
  }

  private createProfile(
    data: Partial<FundingProfile>, 
    rawInput: string, 
    sessionId: string, 
    userId?: string
  ): FundingProfile {
    return {
      sector: data.sector || null,
      stage: data.stage || null,
      team_size: data.team_size || null,
      location_city: data.location_city || null,
      location_country: data.location_country || null,
      funding_need_eur: data.funding_need_eur || null,
      program_type: data.program_type || null,
      collaboration: data.collaboration || null,
      trl: data.trl || null,
      language: data.language || null,
      intent: data.intent || null,
      confidence: data.confidence || { ...DEFAULT_CONFIDENCE },
      raw_amount_text: data.raw_amount_text || null,
      currency_detected: data.currency_detected || null,
      raw_input: rawInput,
      parsed_at: new Date().toISOString(),
      session_id: sessionId,
      user_id: userId
    };
  }

  getOverlayQuestions(questionTypes: string[]): OverlayQuestion[] {
    const questions: OverlayQuestion[] = [];
    
    for (const type of questionTypes) {
      switch (type) {
        case 'sector':
          questions.push({
            field: 'sector',
            question: 'What sector is your business in?',
            options: Object.values(SECTOR_MAPPING).filter((v, i, a) => a.indexOf(v) === i),
            required: true
          });
          break;
          
        case 'stage':
          questions.push({
            field: 'stage',
            question: 'What stage is your business at?',
            options: ['idea', 'mvp', 'revenue', 'growth', 'scaleup'],
            required: true
          });
          break;
          
        case 'funding_need':
          questions.push({
            field: 'funding_need_eur',
            question: 'How much funding do you need? (in EUR)',
            required: true
          });
          break;
      }
    }
    
    return questions;
  }
}

export const intakeParser = new IntakeParser();
export default intakeParser;
