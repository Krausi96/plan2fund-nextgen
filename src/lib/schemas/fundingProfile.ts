// Canonical Funding Profile Schema
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

// Controlled vocabularies
export const SECTOR_MAPPING: Record<string, string> = {
  // Health & Medical
  'medtech': 'Health',
  'healthtech': 'Health',
  'biotech': 'Health',
  'healthcare': 'Health',
  'medical': 'Health',
  'pharma': 'Health',
  'life sciences': 'Health',
  
  // Technology
  'ai': 'AI',
  'artificial intelligence': 'AI',
  'machine learning': 'AI',
  'ml': 'AI',
  'tech': 'Tech',
  'software': 'Tech',
  'saas': 'Tech',
  'fintech': 'Fintech',
  'financial technology': 'Fintech',
  'blockchain': 'Fintech',
  'crypto': 'Fintech',
  
  // Manufacturing & Industry
  'manufacturing': 'Manufacturing',
  'industry': 'Manufacturing',
  'automotive': 'Manufacturing',
  'engineering': 'Manufacturing',
  'carpentry': 'Manufacturing',
  'construction': 'Manufacturing',
  
  // Creative & Media
  'creative': 'Creative',
  'creative industries': 'Creative',
  'media': 'Creative',
  'design': 'Creative',
  'arts': 'Creative',
  'entertainment': 'Creative',
  
  // Sustainability
  'green': 'GreenTech',
  'green energy': 'GreenTech',
  'sustainability': 'GreenTech',
  'renewable': 'GreenTech',
  'climate': 'GreenTech',
  'environmental': 'GreenTech',
  
  // Research
  'research': 'Research',
  'academic': 'Research',
  'university': 'Research',
  'spin-off': 'Research',
  'spin off': 'Research',
  
  // Services
  'services': 'Services',
  'consulting': 'Services',
  'professional services': 'Services',
  'business services': 'Services',
  
  // Retail & E-commerce
  'retail': 'Retail',
  'ecommerce': 'Retail',
  'e-commerce': 'Retail',
  'marketplace': 'Retail'
};

export const STAGE_MAPPING: Record<string, string> = {
  'idea': 'idea',
  'concept': 'idea',
  'early stage': 'idea',
  'pre-seed': 'idea',
  'seed': 'idea',
  
  'mvp': 'mvp',
  'prototype': 'mvp',
  'beta': 'mvp',
  'pilot': 'mvp',
  'proof of concept': 'mvp',
  'poc': 'mvp',
  
  'revenue': 'revenue',
  'market ready': 'revenue',
  'traction': 'revenue',
  'early revenue': 'revenue',
  'first customers': 'revenue',
  
  'growth': 'growth',
  'growth stage': 'growth',
  'scaling': 'growth',
  'expansion': 'growth',
  'series a': 'growth',
  
  'scaleup': 'scaleup',
  'scale up': 'scaleup',
  'scale-up': 'scaleup',
  'mature': 'scaleup',
  'established': 'scaleup',
  'series b': 'scaleup',
  'series c': 'scaleup'
};

export const LOCATION_MAPPING: Record<string, { city: string; country: string }> = {
  'wien': { city: 'Vienna', country: 'AT' },
  'vienna': { city: 'Vienna', country: 'AT' },
  'graz': { city: 'Graz', country: 'AT' },
  'linz': { city: 'Linz', country: 'AT' },
  'salzburg': { city: 'Salzburg', country: 'AT' },
  'innsbruck': { city: 'Innsbruck', country: 'AT' },
  'klagenfurt': { city: 'Klagenfurt', country: 'AT' },
  'bregenz': { city: 'Bregenz', country: 'AT' },
  'st. pölten': { city: 'St. Pölten', country: 'AT' },
  'st pölten': { city: 'St. Pölten', country: 'AT' },
  'eisenstadt': { city: 'Eisenstadt', country: 'AT' },
  
  'berlin': { city: 'Berlin', country: 'DE' },
  'munich': { city: 'Munich', country: 'DE' },
  'hamburg': { city: 'Hamburg', country: 'DE' },
  'frankfurt': { city: 'Frankfurt', country: 'DE' },
  'cologne': { city: 'Cologne', country: 'DE' },
  'stuttgart': { city: 'Stuttgart', country: 'DE' },
  'düsseldorf': { city: 'Düsseldorf', country: 'DE' },
  'leipzig': { city: 'Leipzig', country: 'DE' },
  'dortmund': { city: 'Dortmund', country: 'DE' },
  'essen': { city: 'Essen', country: 'DE' },
  
  'zurich': { city: 'Zurich', country: 'CH' },
  'geneva': { city: 'Geneva', country: 'CH' },
  'basel': { city: 'Basel', country: 'CH' },
  'bern': { city: 'Bern', country: 'CH' },
  'lausanne': { city: 'Lausanne', country: 'CH' }
};

export const PROGRAM_TYPE_MAPPING: Record<string, string> = {
  'grant': 'grant',
  'grants': 'grant',
  'funding': 'grant',
  'förderung': 'grant',
  'subsidy': 'grant',
  'subsidies': 'grant',
  
  'loan': 'loan',
  'loans': 'loan',
  'credit': 'loan',
  'financing': 'loan',
  'bank loan': 'loan',
  'kredit': 'loan',
  
  'equity': 'equity',
  'investment': 'equity',
  'investor': 'equity',
  'venture capital': 'equity',
  'vc': 'equity',
  'angel': 'equity',
  'angel investor': 'equity',
  
  'visa': 'visa',
  'immigration': 'visa',
  'work permit': 'visa',
  'residence permit': 'visa',
  'aufenthalt': 'visa'
};

// Validation functions
export function validateFundingProfile(profile: Partial<FundingProfile>): FundingProfile | null {
  if (!profile || typeof profile !== 'object') return null;
  
  // Required fields validation
  if (!profile.raw_input || !profile.session_id) return null;
  
  // Confidence validation (all must be 0.0-1.0)
  if (profile.confidence) {
    for (const [, value] of Object.entries(profile.confidence)) {
      if (typeof value !== 'number' || value < 0 || value > 1) {
        return null;
      }
    }
  }
  
  // Stage validation
  if (profile.stage && !['idea', 'mvp', 'revenue', 'growth', 'scaleup'].includes(profile.stage)) {
    return null;
  }
  
  // Program type validation
  if (profile.program_type && !['grant', 'loan', 'equity', 'visa'].includes(profile.program_type)) {
    return null;
  }
  
  // Language validation
  if (profile.language && !['DE', 'EN'].includes(profile.language)) {
    return null;
  }
  
  // Intent validation
  if (profile.intent && !['business_intake', 'offtopic'].includes(profile.intent)) {
    return null;
  }
  
  // TRL validation
  if (profile.trl && (profile.trl < 1 || profile.trl > 9)) {
    return null;
  }
  
  return profile as FundingProfile;
}

// Default confidence values
export const DEFAULT_CONFIDENCE = {
  sector: 0.0,
  stage: 0.0,
  team_size: 0.0,
  location_city: 0.0,
  location_country: 0.0,
  funding_need_eur: 0.0,
  program_type: 0.0,
  collaboration: 0.0,
  trl: 0.0,
  language: 0.0,
  intent: 0.0
};
