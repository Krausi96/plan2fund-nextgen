// Unified Intake Engine - Phase 2 Step 2.2 + Integrated Files
// Processes user answers into structured profiles
// AI-enhanced parsing with rule-based fallbacks
// User profiling and target group detection
// INTEGRATED: intakeParser.ts, targetGroupDetection.ts, aiHelper.ts, schemas


// INTEGRATED: Target Group Detection Types
export type TargetGroup = 'startups' | 'sme' | 'advisors' | 'universities' | 'default';

export interface DetectionResult {
  targetGroup: TargetGroup;
  source: 'url' | 'utm' | 'referrer' | 'query' | 'localStorage' | 'default';
  confidence: number;
}

// INTEGRATED: Funding Profile Schema
export interface FundingProfile {
  // Core business data
  sector: string | null;                    // Controlled list + best-fit mapping
  stage: 'idea' | 'mvp' | 'revenue' | 'growth' | 'scaleup' | null;
  team_size: number | null;                 // Integer
  location_city: string | null;             // Normalized city name
  location_country: string | null;          // Normalized country code (AT, DE, etc.)
  funding_need_eur: number | null;          // Integer, EUR normalized
  program_type: 'grant' | 'loan' | 'equity' | 'visa' | null;
  collaboration: 'yes' | 'no' | 'unsure' | null;
  trl: number | null;                       // 1-9 or null
  language: 'DE' | 'EN' | null;             // Detected language
  intent: 'business_intake' | 'offtopic' | null;
  
  // Confidence tracking (0.0-1.0)
  confidence: {
    sector: number;
    stage: number;
    team_size: number;
    location_city: number;
    location_country: number;
    funding_need_eur: number;
    program_type: number;
    collaboration: number;
    trl: number;
    language: number;
    intent: number;
  };
  
  // Raw data for QA
  raw_amount_text: string | null;
  currency_detected: string | null;
  raw_input: string;
  
  // Metadata
  parsed_at: string;
  session_id: string;
  user_id?: string;
}

// INTEGRATED: Enhanced User Profile (from schemas/userProfile.ts)
export interface UserProfile {
  // Core business data
  sector: string | null;
  stage: 'idea' | 'mvp' | 'revenue' | 'growth' | 'scaleup' | null;
  teamSize: number | null;
  location: {
    city: string | null;
    country: string | null;
  };
  fundingNeed: {
    amount: number | null;
    currency: string | null;
    types: string[]; // ['grants', 'loans', 'equity']
  };
  collaboration: 'yes' | 'no' | 'unsure' | null;
  trl: number | null; // Technology Readiness Level 1-9
  language: 'DE' | 'EN' | null;
  
  // Target group detection
  targetGroup: 'startups' | 'sme' | 'advisors' | 'universities' | 'default';
  targetGroupConfidence: number;
  
  // Confidence scores (0.0-1.0)
  confidence: {
    sector: number;
    stage: number;
    teamSize: number;
    location: number;
    fundingNeed: number;
    collaboration: number;
    trl: number;
    overall: number;
  };
  
  // Raw data for debugging
  rawAnswers: Record<string, any>;
  parsedAt: string;
  sessionId: string;
  userId?: string;
}

// INTEGRATED: Mapping Constants (from schemas/fundingProfile.ts)
export const SECTOR_MAPPING: Record<string, string> = {
  // Health & Medical
  'medtech': 'Health',
  'healthtech': 'Health',
  'biotech': 'Health',
  'healthcare': 'Health',
  'medical': 'Health',
  'pharma': 'Health',
  'life_science': 'Health',
  'digital_health': 'Health',
  
  // Technology
  'tech': 'Technology',
  'software': 'Technology',
  'ai': 'Technology',
  'ml': 'Technology',
  'blockchain': 'Technology',
  'fintech': 'Technology',
  'edtech': 'Technology',
  'digital': 'Technology',
  'it': 'Technology',
  'cybersecurity': 'Technology',
  
  // Environment & Energy
  'green': 'Environment',
  'climate': 'Environment',
  'energy': 'Environment',
  'renewable': 'Environment',
  'sustainability': 'Environment',
  'cleantech': 'Environment',
  'environmental': 'Environment',
  
  // Manufacturing & Industry
  'manufacturing': 'Manufacturing',
  'industrial': 'Manufacturing',
  'automotive': 'Manufacturing',
  'aerospace': 'Manufacturing',
  'materials': 'Manufacturing',
  
  // Other
  'other': 'Other',
  'unknown': 'Other'
};

export const STAGE_MAPPING: Record<string, string> = {
  'idea': 'idea',
  'concept': 'idea',
  'early': 'idea',
  'pre_seed': 'idea',
  'mvp': 'mvp',
  'prototype': 'mvp',
  'development': 'mvp',
  'beta': 'mvp',
  'revenue': 'revenue',
  'selling': 'revenue',
  'commercial': 'revenue',
  'growth': 'growth',
  'scaling': 'growth',
  'scaleup': 'scaleup',
  'expansion': 'scaleup'
};

export const LOCATION_MAPPING: Record<string, { country: string; city?: string }> = {
  'austria': { country: 'AT' },
  'vienna': { country: 'AT', city: 'Vienna' },
  'germany': { country: 'DE' },
  'berlin': { country: 'DE', city: 'Berlin' },
  'munich': { country: 'DE', city: 'Munich' },
  'switzerland': { country: 'CH' },
  'zurich': { country: 'CH', city: 'Zurich' },
  'eu': { country: 'EU' },
  'europe': { country: 'EU' },
  'usa': { country: 'US' },
  'united_states': { country: 'US' }
};

export const PROGRAM_TYPE_MAPPING: Record<string, string> = {
  'grant': 'grant',
  'grants': 'grant',
  'funding': 'grant',
  'subsidy': 'grant',
  'loan': 'loan',
  'loans': 'loan',
  'credit': 'loan',
  'equity': 'equity',
  'investment': 'equity',
  'venture': 'equity',
  'visa': 'visa',
  'immigration': 'visa'
};

export const DEFAULT_CONFIDENCE = 0.5;

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export interface ParseResult {
  profile: UserProfile;
  validation: ValidationResult;
  processingTime: number;
  needsOverlay: boolean;
  overlayQuestions: string[];
}

// INTEGRATED: Target Group Detection (from targetGroupDetection.ts)
const UTM_TARGET_MAPPING: Record<string, TargetGroup> = {
  'startup': 'startups',
  'startups': 'startups',
  'founder': 'startups',
  'founders': 'startups',
  'sme': 'sme',
  'smes': 'sme',
  'scaleup': 'sme',
  'scaleups': 'sme',
  'advisor': 'advisors',
  'advisors': 'advisors',
  'consultant': 'advisors',
  'consultants': 'advisors',
  'university': 'universities',
  'universities': 'universities',
  'accelerator': 'universities',
  'accelerators': 'universities'
};

const REFERRER_MAPPING: Record<string, TargetGroup> = {
  'linkedin.com': 'advisors',
  'xing.com': 'advisors',
  'startup.com': 'startups',
  'crunchbase.com': 'startups',
  'angel.co': 'startups',
  'university.edu': 'universities',
  'ac.at': 'universities',
  'researchgate.net': 'universities',
  'google.com': 'default',
  'bing.com': 'default',
  'duckduckgo.com': 'default'
};

// Standalone validation function for backward compatibility
export function validateFundingProfile(profile: FundingProfile): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  // Required field validation
  if (!profile.sector) {
    errors.push('Sector is required');
  }

  if (!profile.stage) {
    errors.push('Business stage is required');
  }

  if (!profile.location_country) {
    errors.push('Country is required');
  }

  // Confidence validation
  if (profile.confidence.sector < 0.3) {
    warnings.push('Sector confidence is low - consider providing more details');
  }

  if (profile.confidence.stage < 0.3) {
    warnings.push('Stage confidence is low - consider clarifying your business stage');
  }

  // Funding amount validation
  if (profile.funding_need_eur && profile.funding_need_eur < 1000) {
    warnings.push('Funding amount seems low - double-check if this is correct');
  }

  if (profile.funding_need_eur && profile.funding_need_eur > 10000000) {
    warnings.push('Funding amount seems high - consider breaking into smaller rounds');
  }

  // Suggestions
  if (!profile.collaboration) {
    suggestions.push('Consider specifying if you\'re open to collaboration');
  }

  if (!profile.trl) {
    suggestions.push('Technology readiness level would help with program matching');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    suggestions
  };
}

export class IntakeEngine {
  private maxOverlayQuestions = 3;

  // Sector mapping for normalization
  private sectorMapping: Record<string, string> = {
    'digital_tech': 'Technology',
    'health_tech': 'Health',
    'green_tech': 'Environment',
    'manufacturing': 'Manufacturing',
    'other': 'Other'
  };

  // Stage mapping from question answers to profile stages
  private stageMapping: Record<string, string> = {
    'just_idea': 'idea',
    'building': 'mvp',
    'selling': 'revenue',
    'growing': 'growth'
  };

  // Team size mapping
  private teamSizeMapping: Record<string, number> = {
    'solo': 1,
    '2_5': 3,
    '6_20': 10,
    '20_plus': 25
  };

  // Location mapping
  private locationMapping: Record<string, { country: string; city?: string }> = {
    'austria': { country: 'AT' },
    'eu': { country: 'EU' },
    'outside_eu': { country: 'NON_EU' }
  };

  // TRL mapping from tech readiness answers
  private trlMapping: Record<string, number> = {
    'early_stage': 2,
    'prototype': 4,
    'testing': 6,
    'market_ready': 8
  };

  constructor() {
    // Initialize any required services
  }

  // INTEGRATED: Target Group Detection Methods (from targetGroupDetection.ts)
  public detectTargetGroup(): DetectionResult {
    if (typeof window === 'undefined') {
      return { targetGroup: 'default', source: 'default', confidence: 0 };
    }

    // Check UTM parameters
    const urlParams = new URLSearchParams(window.location.search);
    const utmSource = urlParams.get('utm_source')?.toLowerCase();
    const utmCampaign = urlParams.get('utm_campaign')?.toLowerCase();
    const utmContent = urlParams.get('utm_content')?.toLowerCase();

    if (utmSource && UTM_TARGET_MAPPING[utmSource]) {
      return {
        targetGroup: UTM_TARGET_MAPPING[utmSource],
        source: 'utm',
        confidence: 0.9
      };
    }

    if (utmCampaign && UTM_TARGET_MAPPING[utmCampaign]) {
      return {
        targetGroup: UTM_TARGET_MAPPING[utmCampaign],
        source: 'utm',
        confidence: 0.8
      };
    }

    if (utmContent && UTM_TARGET_MAPPING[utmContent]) {
      return {
        targetGroup: UTM_TARGET_MAPPING[utmContent],
        source: 'utm',
        confidence: 0.7
      };
    }

    // Check referrer
    const referrer = document.referrer?.toLowerCase();
    if (referrer) {
      for (const [domain, targetGroup] of Object.entries(REFERRER_MAPPING)) {
        if (referrer.includes(domain)) {
          return {
            targetGroup,
            source: 'referrer',
            confidence: 0.6
          };
        }
      }
    }

    // Check query parameters
    const query = urlParams.get('q')?.toLowerCase() || '';
    for (const [keyword, targetGroup] of Object.entries(UTM_TARGET_MAPPING)) {
      if (query.includes(keyword)) {
        return {
          targetGroup,
          source: 'query',
          confidence: 0.5
        };
      }
    }

    // Check localStorage
    try {
      const stored = localStorage.getItem('plan2fund_target_group');
      if (stored && UTM_TARGET_MAPPING[stored]) {
        return {
          targetGroup: UTM_TARGET_MAPPING[stored],
          source: 'localStorage',
          confidence: 0.4
        };
      }
    } catch (e) {
      // localStorage not available
    }

    return { targetGroup: 'default', source: 'default', confidence: 0 };
  }

  public storeTargetGroupSelection(targetGroup: TargetGroup): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('plan2fund_target_group', targetGroup);
      } catch (e) {
        // localStorage not available
      }
    }
  }

  // Main parsing function
  async parseAnswers(answers: Record<string, any>, sessionId: string, userId?: string): Promise<ParseResult> {
    const startTime = Date.now();
    
    try {
      // Parse answers into structured profile
      const profile = this.parseAnswersToProfile(answers, sessionId, userId);
      
      // Validate the profile
      const validation = this.validateProfile(profile);
      
      // Check if we need overlay questions
      const { needsOverlay, overlayQuestions } = this.assessOverlayNeeds(profile);
      
      return {
        profile,
        validation,
        processingTime: Date.now() - startTime,
        needsOverlay,
        overlayQuestions
      };
    } catch (error) {
      console.error('Intake parsing error:', error);
      throw new Error(`Failed to parse answers: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Parse answers into structured profile
  private parseAnswersToProfile(answers: Record<string, any>, sessionId: string, userId?: string): UserProfile {
    const profile: UserProfile = {
      sector: null,
      stage: null,
      teamSize: null,
      location: { city: null, country: null },
      fundingNeed: { amount: null, currency: null, types: [] },
      collaboration: null,
      trl: null,
      language: this.detectLanguage(),
      targetGroup: 'default',
      targetGroupConfidence: 0.5,
      confidence: {
        sector: 0.5,
        stage: 0.5,
        teamSize: 0.5,
        location: 0.5,
        fundingNeed: 0.5,
        collaboration: 0.5,
        trl: 0.5,
        overall: 0.5
      },
      rawAnswers: answers,
      parsedAt: new Date().toISOString(),
      sessionId,
      userId
    };

    // Parse sector from innovation level
    if (answers.innovation_level) {
      profile.sector = this.sectorMapping[answers.innovation_level] || 'Other';
      profile.confidence.sector = 0.8;
    }

    // Parse stage from business stage
    if (answers.business_stage) {
      profile.stage = this.stageMapping[answers.business_stage] as any || null;
      profile.confidence.stage = 0.8;
    }

    // Parse team size
    if (answers.team_size) {
      profile.teamSize = this.teamSizeMapping[answers.team_size] || null;
      profile.confidence.teamSize = 0.8;
    }

    // Parse location
    if (answers.location) {
      const location = this.locationMapping[answers.location];
      if (location) {
        profile.location.country = location.country;
        profile.confidence.location = 0.8;
      }
    }

    // Parse funding need and types
    if (answers.funding_need) {
      profile.fundingNeed.types = this.extractFundingTypes(answers);
      profile.confidence.fundingNeed = 0.7;
    }

    // Parse TRL from tech readiness
    if (answers.tech_readiness) {
      profile.trl = this.trlMapping[answers.tech_readiness] || null;
      profile.confidence.trl = 0.8;
    }

    // Detect target group
    const targetGroupResult = this.detectTargetGroup();
    profile.targetGroup = targetGroupResult.targetGroup as TargetGroup;
    profile.targetGroupConfidence = targetGroupResult.confidence;

    // Calculate overall confidence
    profile.confidence.overall = this.calculateOverallConfidence(profile.confidence);

    return profile;
  }

  // Extract funding types from answers
  private extractFundingTypes(answers: Record<string, any>): string[] {
    const fundingTypes = new Set<string>();
    
    // Map funding need answers to types
    const needMapping: Record<string, string[]> = {
      'need_money_start': ['grants', 'equity'],
      'need_money_grow': ['loans', 'grants', 'equity'],
      'need_money_research': ['grants', 'equity'],
      'need_money_team': ['grants', 'loans']
    };

    if (answers.funding_need && needMapping[answers.funding_need]) {
      needMapping[answers.funding_need].forEach(type => fundingTypes.add(type));
    }

    // Add types from business stage
    if (answers.business_stage === 'just_idea') {
      fundingTypes.add('grants');
      fundingTypes.add('equity');
    } else if (answers.business_stage === 'selling' || answers.business_stage === 'growing') {
      fundingTypes.add('loans');
    }

    return Array.from(fundingTypes);
  }


  // Detect language from answers
  private detectLanguage(): 'DE' | 'EN' | null {
    // Simple language detection based on answer patterns
    // In a real implementation, this would analyze the actual text content
    return 'EN'; // Default to English for now
  }

  // Calculate overall confidence score
  private calculateOverallConfidence(confidence: UserProfile['confidence']): number {
    const scores = [
      confidence.sector,
      confidence.stage,
      confidence.teamSize,
      confidence.location,
      confidence.fundingNeed,
      confidence.collaboration,
      confidence.trl
    ];
    
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  // Validate user profile
  validateProfile(profile: UserProfile): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Required field validation
    if (!profile.stage) {
      errors.push('Business stage is required');
    }

    if (!profile.location.country) {
      errors.push('Location is required');
    }

    if (profile.fundingNeed.types.length === 0) {
      warnings.push('No funding types detected');
    }

    // Confidence validation
    if (profile.confidence.overall < 0.3) {
      warnings.push('Low confidence in profile data');
      suggestions.push('Consider providing more specific answers');
    }

    // Business logic validation
    if (profile.stage === 'idea' && profile.teamSize && profile.teamSize > 10) {
      warnings.push('Large team size for idea stage');
    }

    if (profile.stage === 'growth' && profile.teamSize && profile.teamSize < 5) {
      warnings.push('Small team size for growth stage');
    }

    // TRL validation
    if (profile.trl && (profile.trl < 1 || profile.trl > 9)) {
      errors.push('Invalid Technology Readiness Level');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  // Assess if overlay questions are needed
  private assessOverlayNeeds(profile: UserProfile): { needsOverlay: boolean; overlayQuestions: string[] } {
    const overlayQuestions: string[] = [];

    // Check for missing critical information
    if (!profile.sector) {
      overlayQuestions.push('What industry are you in?');
    }

    if (!profile.fundingNeed.amount) {
      overlayQuestions.push('How much funding do you need?');
    }

    if (!profile.collaboration) {
      overlayQuestions.push('Are you open to collaboration?');
    }

    // Check for low confidence areas
    if (profile.confidence.sector < 0.5) {
      overlayQuestions.push('Can you describe your business sector?');
    }

    if (profile.confidence.fundingNeed < 0.5) {
      overlayQuestions.push('What type of funding are you looking for?');
    }

    return {
      needsOverlay: overlayQuestions.length > 0,
      overlayQuestions: overlayQuestions.slice(0, this.maxOverlayQuestions)
    };
  }

  // Enhance profile with AI (optional)
  async enhanceWithAI(profile: UserProfile): Promise<UserProfile> {
    try {
      // This would integrate with AI services to enhance the profile
      // For now, return the profile as-is
      return profile;
    } catch (error) {
      console.warn('AI enhancement failed, using basic profile:', error);
      return profile;
    }
  }

  // Get profile summary for display
  getProfileSummary(profile: UserProfile): string {
    const parts: string[] = [];
    
    if (profile.stage) {
      parts.push(`${profile.stage} stage`);
    }
    
    if (profile.sector) {
      parts.push(`${profile.sector} sector`);
    }
    
    if (profile.teamSize) {
      parts.push(`${profile.teamSize} person team`);
    }
    
    if (profile.location.country) {
      parts.push(`based in ${profile.location.country}`);
    }
    
    if (profile.fundingNeed.types.length > 0) {
      parts.push(`seeking ${profile.fundingNeed.types.join(', ')} funding`);
    }

    return parts.join(' • ');
  }

  // INTEGRATED: Enhanced Validation Functions (from schemas/fundingProfile.ts + validationRules.ts)
  public validateFundingProfile(profile: FundingProfile): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Required field validation
    if (!profile.sector) {
      errors.push('Sector is required');
    }

    if (!profile.stage) {
      errors.push('Business stage is required');
    }

    if (!profile.location_country) {
      errors.push('Country is required');
    }

    // ENHANCED: Business logic validation using validation rules
    const profileData = {
      problem_statement: profile.raw_input || '',
      solution_overview: profile.raw_input || '',
      target_market: profile.sector || '',
      funding_request: profile.funding_need_eur || 0,
      total_budget: profile.funding_need_eur || 0,
      co_financing: 0, // Default to 0 for now
      market_size: 0, // Would need to extract from raw_input
      growth_rate: 0, // Would need to extract from raw_input
      target_segment: profile.sector || '',
      founders: [profile.raw_input || ''], // Mock data for validation
      key_employees: [],
      advisors: [],
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
      milestones: [],
      trl_level: profile.trl || 0,
      trl_evidence: profile.raw_input || '',
      development_stage: profile.stage || '',
      job_count: 1, // Default for startup
      job_timeline: '12 months',
      salary_range: '30000-50000',
      has_consortium: profile.collaboration === 'yes',
      partners: [],
      agreements: []
    };

    // Apply business logic validation rules
    const businessValidation = this.runBusinessValidationRules(profileData);
    errors.push(...businessValidation.errors);
    warnings.push(...businessValidation.warnings);

    // Confidence validation
    if (profile.confidence.sector < 0.3) {
      warnings.push('Sector confidence is low - consider providing more details');
    }

    if (profile.confidence.stage < 0.3) {
      warnings.push('Stage confidence is low - consider clarifying your business stage');
    }

    // Funding amount validation
    if (profile.funding_need_eur && profile.funding_need_eur < 1000) {
      warnings.push('Funding amount seems low - double-check if this is correct');
    }

    if (profile.funding_need_eur && profile.funding_need_eur > 10000000) {
      warnings.push('Funding amount seems high - consider breaking into smaller rounds');
    }

    // ENHANCED: Content quality validation for raw input
    if (profile.raw_input) {
      const contentValidation = this.runContentQualityChecks(profile.raw_input);
      warnings.push(...contentValidation.warnings);
      suggestions.push(...contentValidation.suggestions);
    }

    // Suggestions
    if (!profile.collaboration) {
      suggestions.push('Consider specifying if you\'re open to collaboration');
    }

    if (!profile.trl) {
      suggestions.push('Technology readiness level would help with program matching');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  public validateUserProfile(profile: UserProfile): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Required field validation
    if (!profile.sector) {
      errors.push('Sector is required');
    }

    if (!profile.stage) {
      errors.push('Business stage is required');
    }

    if (!profile.location.country) {
      errors.push('Country is required');
    }

    // Confidence validation
    if (profile.confidence.sector < 0.3) {
      warnings.push('Sector confidence is low - consider providing more details');
    }

    if (profile.confidence.stage < 0.3) {
      warnings.push('Stage confidence is low - consider clarifying your business stage');
    }

    // Funding amount validation
    if (profile.fundingNeed.amount && profile.fundingNeed.amount < 1000) {
      warnings.push('Funding amount seems low - double-check if this is correct');
    }

    if (profile.fundingNeed.amount && profile.fundingNeed.amount > 10000000) {
      warnings.push('Funding amount seems high - consider breaking into smaller rounds');
    }

    // Suggestions
    if (!profile.collaboration) {
      suggestions.push('Consider specifying if you\'re open to collaboration');
    }

    if (!profile.trl) {
      suggestions.push('Technology readiness level would help with program matching');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  // INTEGRATED: AI Helper Functionality (from aiHelper.ts)
  public async generateAIGuidance(
    section: string,
    userAnswers: Record<string, any>
  ): Promise<string> {
    try {
      // Simulate AI guidance generation
      const guidance = this.generateContextualGuidance(section, userAnswers);
      return guidance;
    } catch (error) {
      console.warn('AI guidance generation failed:', error);
      return this.getFallbackGuidance(section);
    }
  }

  private generateContextualGuidance(
    section: string,
    userAnswers: Record<string, any>
  ): string {
    const sector = userAnswers.sector || 'your sector';
    const stage = userAnswers.stage || 'your stage';
    const fundingAmount = userAnswers.funding_amount || 'your funding amount';

    switch (section) {
      case 'executive_summary':
        return `Focus on your ${sector} solution at ${stage} stage, highlighting the ${fundingAmount} funding need and market opportunity.`;
      
      case 'market_analysis':
        return `Analyze the ${sector} market size, growth trends, and competitive landscape. Include data specific to your target market.`;
      
      case 'financial_projections':
        return `Create realistic 3-5 year projections based on your ${stage} stage. Include revenue models, cost structures, and funding requirements.`;
      
      case 'team':
        return `Highlight key team members and their relevant experience in ${sector}. Include advisors and their contributions.`;
      
      default:
        return `Provide clear, concise information about ${section} that demonstrates your understanding of the ${sector} market.`;
    }
  }

  private getFallbackGuidance(section: string): string {
    return `Please provide detailed information about ${section}. Be specific and include relevant examples.`;
  }

  // INTEGRATED: Advanced Parsing (from intakeParser.ts)
  public async parseInputWithAI(rawInput: string, sessionId: string, userId?: string): Promise<ParseResult> {
    const startTime = Date.now();
    
    try {
      // Try AI parsing first
      const aiResult = await this.parseWithAI(rawInput);
      
      if (aiResult && this.isHighConfidence(aiResult)) {
        const profile = this.createProfileFromAI(aiResult, rawInput, sessionId, userId);
        return {
          profile,
          validation: this.validateUserProfile(profile),
          processingTime: Date.now() - startTime,
          needsOverlay: false,
          overlayQuestions: []
        };
      }
      
      // Fallback to deterministic parsing
      const deterministicResult = this.parseDeterministic(rawInput);
      const profile = this.createProfileFromDeterministic(deterministicResult, rawInput, sessionId, userId);
      
      const { needsOverlay, overlayQuestions } = this.assessOverlayNeeds(profile);
      
      return {
        profile,
        validation: this.validateUserProfile(profile),
        processingTime: Date.now() - startTime,
        needsOverlay,
        overlayQuestions
      };
    } catch (error) {
      console.error('AI parsing error:', error);
      throw new Error(`Failed to parse input: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async parseWithAI(input: string): Promise<any> {
    // Simulate AI parsing with timeout
    return new Promise((resolve) => {
      setTimeout(() => {
        // Mock AI parsing result
        resolve({
          sector: this.extractSectorFromText(input),
          stage: this.extractStageFromText(input),
          funding_amount: this.extractFundingAmount(input),
          confidence: 0.8
        });
      }, 1000);
    });
  }

  private isHighConfidence(result: any): boolean {
    return result.confidence > 0.7;
  }

  private extractSectorFromText(text: string): string | null {
    const lowerText = text.toLowerCase();
    for (const [keyword, sector] of Object.entries(SECTOR_MAPPING)) {
      if (lowerText.includes(keyword)) {
        return sector;
      }
    }
    return null;
  }

  private extractStageFromText(text: string): string | null {
    const lowerText = text.toLowerCase();
    for (const [keyword, stage] of Object.entries(STAGE_MAPPING)) {
      if (lowerText.includes(keyword)) {
        return stage;
      }
    }
    return null;
  }

  private extractFundingAmount(text: string): number | null {
    const amountMatch = text.match(/(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:€|EUR|euro|euros)/i);
    if (amountMatch) {
      return parseInt(amountMatch[1].replace(/,/g, ''));
    }
    return null;
  }

  private createProfileFromAI(aiResult: any, rawInput: string, sessionId: string, userId?: string): UserProfile {
    return {
      sector: aiResult.sector,
      stage: aiResult.stage as any,
      teamSize: null,
      location: { city: null, country: null },
      fundingNeed: {
        amount: aiResult.funding_amount,
        currency: 'EUR',
        types: []
      },
      collaboration: null,
      trl: null,
      language: 'EN',
      targetGroup: 'default',
      targetGroupConfidence: 0,
      confidence: {
        sector: aiResult.confidence,
        stage: aiResult.confidence,
        teamSize: 0,
        location: 0,
        fundingNeed: aiResult.confidence,
        collaboration: 0,
        trl: 0,
        overall: aiResult.confidence
      },
      rawAnswers: { raw_input: rawInput },
      parsedAt: new Date().toISOString(),
      sessionId,
      userId
    };
  }

  private createProfileFromDeterministic(result: any, rawInput: string, sessionId: string, userId?: string): UserProfile {
    // Convert deterministic result to UserProfile
    return {
      sector: result.sector,
      stage: result.stage,
      teamSize: result.teamSize,
      location: result.location,
      fundingNeed: result.fundingNeed,
      collaboration: result.collaboration,
      trl: result.trl,
      language: result.language,
      targetGroup: result.targetGroup || 'default',
      targetGroupConfidence: result.targetGroupConfidence || 0,
      confidence: result.confidence,
      rawAnswers: { raw_input: rawInput },
      parsedAt: new Date().toISOString(),
      sessionId,
      userId
    };
  }

  private parseDeterministic(input: string): any {
    // Basic deterministic parsing
    return {
      sector: this.extractSectorFromText(input),
      stage: this.extractStageFromText(input),
      teamSize: null,
      location: { city: null, country: null },
      fundingNeed: {
        amount: this.extractFundingAmount(input),
        currency: 'EUR',
        types: []
      },
      collaboration: null,
      trl: null,
      language: 'EN',
      confidence: {
        sector: 0.5,
        stage: 0.5,
        teamSize: 0,
        location: 0,
        fundingNeed: 0.5,
        collaboration: 0,
        trl: 0,
        overall: 0.5
      }
    };
  }

  // INTEGRATED: Overlay Questions (from intakeParser.ts)
  public getOverlayQuestions(questionTypes: string[]): any[] {
    const questions: any[] = [];
    
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

  // INTEGRATED: Legacy parseInput method (from intakeParser.ts)
  public async parseInput(rawInput: string, sessionId: string, userId?: string): Promise<any> {
    const result = await this.parseInputWithAI(rawInput, sessionId, userId);
    return {
      profile: result.profile,
      needsOverlay: result.needsOverlay,
      overlayQuestions: result.overlayQuestions,
      processingTime: result.processingTime
    };
  }

  // INTEGRATED: Enhanced Validation Helper Methods (from validationRules.ts)
  
  /**
   * Run business logic validation rules on profile data
   */
  private runBusinessValidationRules(data: Record<string, any>): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Executive summary completeness
    if (!data.problem_statement || data.problem_statement.trim().length < 10) {
      errors.push('Problem statement is required and must be at least 10 characters');
    }

    if (!data.solution_overview || data.solution_overview.trim().length < 10) {
      errors.push('Solution overview is required and must be at least 10 characters');
    }

    // Financial consistency
    if (data.funding_request && data.total_budget) {
      if (data.funding_request > data.total_budget) {
        errors.push('Funding request cannot exceed total budget');
      }
    }

    // Market size validation
    if (data.market_size <= 0) {
      warnings.push('Market size should be specified for better program matching');
    }

    // Team structure validation
    if (!data.founders || data.founders.length === 0) {
      errors.push('At least one founder must be specified');
    }

    if (data.founders && data.founders.length > 5) {
      warnings.push('Large number of founders - consider if this is realistic for a startup');
    }

    // Timeline realism
    if (data.start_date && data.end_date) {
      const start = new Date(data.start_date);
      const end = new Date(data.end_date);
      const durationMonths = (end.getFullYear() - start.getFullYear()) * 12 + 
                           (end.getMonth() - start.getMonth());
      
      if (durationMonths > 60) {
        warnings.push('Project duration seems long - consider breaking into phases');
      }
    }

    // TRL evidence validation
    if (data.trl_level >= 5 && (!data.trl_evidence || data.trl_evidence.trim().length < 10)) {
      warnings.push('TRL 5+ requires supporting evidence - provide details about prototypes, tests, or trials');
    }

    // Job creation realism
    if (data.job_count > 100) {
      warnings.push('Job creation count seems high for a startup - consider if this is realistic');
    }

    // Consortium validation
    if (data.has_consortium && (!data.partners || data.partners.length === 0)) {
      warnings.push('Consortium indicated but no partners specified');
    }

    return { errors, warnings };
  }

  /**
   * Run content quality checks on raw input
   */
  private runContentQualityChecks(content: string): { warnings: string[]; suggestions: string[] } {
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Problem/solution completeness
    const hasProblem = /problem|challenge|issue|pain|gap/i.test(content);
    const hasSolution = /solution|approach|method|technology|innovation/i.test(content);
    
    if (!hasProblem) {
      suggestions.push('Consider clearly defining the problem you are solving');
    }
    
    if (!hasSolution) {
      suggestions.push('Consider explaining how you will solve the problem');
    }

    // Market data presence
    const hasMarketSize = /\d+[\s,]*[billion|million|thousand|€|\$]/i.test(content);
    const hasGrowth = /growth|increase|expand|cagr|rate/i.test(content);
    const hasDemographics = /customer|user|target|segment|demographic/i.test(content);
    
    if (!hasMarketSize) {
      suggestions.push('Include specific market size data to strengthen your application');
    }
    
    if (!hasGrowth) {
      suggestions.push('Include market growth information to show opportunity');
    }
    
    if (!hasDemographics) {
      suggestions.push('Describe your target audience for better program matching');
    }

    // Financial consistency
    const hasNumbers = /\d+[\s,]*[€|\$]/i.test(content);
    if (!hasNumbers) {
      suggestions.push('Include financial data to support your funding request');
    }

    // TRL justification
    const hasTRL = /trl\s*[1-9]|technology\s*readiness\s*level/i.test(content);
    const hasEvidence = /prototype|test|trial|validation|proof|evidence|demonstration/i.test(content);
    
    if (hasTRL && !hasEvidence) {
      warnings.push('TRL mentioned without supporting evidence - provide proof of your technology readiness level');
    }

    // Competitive analysis
    const hasCompetition = /competitor|competition|alternative|rival|market\s*leader/i.test(content);
    const hasDifferentiation = /unique|different|advantage|edge|superior|better/i.test(content);
    
    if (!hasCompetition) {
      suggestions.push('Include competitive analysis to strengthen your application');
    }
    
    if (!hasDifferentiation) {
      suggestions.push('Explain your competitive advantages');
    }

    // Team qualifications
    const hasTeam = /team|founder|manager|director|expert|specialist/i.test(content);
    const hasExperience = /experience|background|qualification|education|degree|phd|mba/i.test(content);
    
    if (hasTeam && !hasExperience) {
      suggestions.push('Detail relevant team experience and qualifications');
    }

    return { warnings, suggestions };
  }
}
