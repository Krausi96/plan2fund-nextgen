// Consolidated extraction: metadata, requirements (18 categories), normalization, analytics
import * as cheerio from 'cheerio';
import { z } from 'zod';

// ============================================================================
// REQUIREMENT CATEGORIES & TYPES
// ============================================================================

export const REQUIREMENT_CATEGORIES = [
  // Eligibility - Split into subcategories
  'company_type', 'company_stage', 'industry_restriction', 'eligibility_criteria',
  // Documents
  'documents',
  // Financial
  'financial',
  // Technical
  'technical',
  // Legal
  'legal',
  // Timeline
  'timeline',
  // Geographic
  'geographic',
  // Team
  'team',
  // Project - Split into subcategories
  'innovation_focus', 'technology_area', 'research_domain', 'sector_focus',
  // Compliance
  'compliance',
  // Impact - Split into subcategories
  'environmental_impact', 'social_impact', 'economic_impact', 'innovation_impact',
  // Other categories
  'capex_opex', 'use_of_funds', 'revenue_model', 
  'market_size', 'co_financing', 'trl_level', 'consortium',
  'diversity',
  // New categories (Priority 1)
  'application_process', 'evaluation_criteria', 'repayment_terms', 
  'equity_terms', 'intellectual_property', 'success_metrics', 'restrictions'
] as const;

export type RequirementCategory = typeof REQUIREMENT_CATEGORIES[number];

export interface RequirementItem {
  type: string;
  value: string;
  required: boolean;
  source: string;
  // For documents: structure/requirements description
  description?: string;
  // For documents: format requirements (PDF, max pages, etc.)
  format?: string;
  // For documents: nested requirements (what the document must contain)
  requirements?: string[];
  // Meaningfulness score (0-100): How specific and actionable is this requirement
  meaningfulness_score?: number;
}

// ============================================================================
// METADATA EXTRACTION
// ============================================================================

// Helper function to safely call matchAll with fallback
// PERFORMANCE: Add timeout for regex operations on large strings
function safeMatchAll(str: string, regex: RegExp): RegExpMatchArray[] {
  try {
    if (typeof str !== 'string' || str == null) return [];
    
    // PERFORMANCE: For very large strings, limit regex matching to prevent hanging
    const MAX_REGEX_SIZE = 500000; // 500KB
    const textToMatch = str.length > MAX_REGEX_SIZE ? str.substring(0, MAX_REGEX_SIZE) : str;
    
    if (!regex.global) {
      // matchAll requires global flag - if missing, fall back to match
      const match = textToMatch.match(regex);
      return match ? [match as RegExpMatchArray] : [];
    }
    
    // PERFORMANCE: Limit number of matches to prevent slow operations
    const allMatches = Array.from(textToMatch.matchAll(regex));
    return allMatches.slice(0, 100); // Limit to first 100 matches per pattern
  } catch (e: any) {
    // Fallback to regular match if matchAll fails for any reason
    try {
      const textToMatch = str.length > 500000 ? str.substring(0, 500000) : str;
      const match = textToMatch.match(regex);
      return match ? [match as RegExpMatchArray] : [];
    } catch {
      return [];
    }
  }
}

/**
 * Calculate meaningfulness score (0-100) for a requirement value
 * Higher score = more specific, actionable, and valuable
 */
export function calculateMeaningfulnessScore(value: string | number | object): number {
  if (value == null) return 0;
  
  const valStr = typeof value === 'string' ? value : typeof value === 'object' ? JSON.stringify(value) : String(value);
  const lower = valStr.toLowerCase().trim();
  
  // Empty or too short
  if (valStr.length < 10) return 10;
  
  // Generic placeholder words (low score)
  const genericWords = ['specified', 'available', 'required', 'see below', 'see above', 'contact', 'n/a', 'tbd'];
  if (genericWords.some(word => lower.includes(word) && lower.length < 50)) return 20;
  
  // Institution names or company names (noise)
  const noisePatterns = [
    /\b(ffg|aws|mbh|gmbh|inc\.|ltd\.|corporation|austrian\s*(?:research|science|business))\b/i,
    /^(?:the|die|der|das)\s+(?:program|programm|funding|förderung|institution)/i
  ];
  if (noisePatterns.some(pattern => pattern.test(valStr)) && valStr.length < 100) return 15;
  
  let score = 50; // Base score
  
  // Length bonus (specific details are usually longer)
  if (valStr.length >= 20) score += 10;
  if (valStr.length >= 50) score += 10;
  if (valStr.length >= 100) score += 5;
  
  // Quantifiers and numbers (high value)
  if (/\d+/.test(valStr)) score += 15;
  if (/\d+%/.test(valStr) || /\d+,\d+/.test(valStr) || /\d+\.\d+/.test(valStr)) score += 10;
  
  // Specific action words (actionable)
  const actionWords = ['must', 'required', 'need', 'should', 'min', 'max', 'between', 'from', 'to'];
  if (actionWords.some(word => lower.includes(word))) score += 10;
  
  // Specific entities (locations, types, etc.)
  if (/\b(eur|€|usd|\$|gbp|£)/i.test(valStr)) score += 5;
  if (/\b(years?|months?|days?|weeks?)\b/i.test(valStr)) score += 5;
  if (/\b(austria|vienna|germany|france|spain|italy|netherlands|eu|european)\b/i.test(valStr)) score += 5;
  
  // Document-specific indicators (high value)
  if (/\b(pdf|doc|docx|xls|xlsx|ppt|pptx|format|max|pages?|seite|seiten)\b/i.test(valStr)) score += 10;
  if (/\b(certificate|certification|diploma|degree|transcript|cv|resume|proposal|business plan)\b/i.test(valStr)) score += 15;
  
  // Timeline-specific indicators (high value)
  if (/\b(deadline|frist|until|by|before|application|submission|submission date)\b/i.test(valStr)) score += 10;
  if (/\b\d{1,2}[\.\/\-]\d{1,2}[\.\/\-]\d{2,4}\b/.test(valStr)) score += 15; // Date patterns
  
  // Technical/specific requirement indicators
  if (/\b(technology|technical|specification|standard|protocol|api|framework|platform)\b/i.test(valStr)) score += 10;
  if (/\b(tr[il]|trl level|technology readiness)\b/i.test(valStr)) score += 15;
  
  // Penalize if too generic
  if (lower === 'required' || lower === 'yes' || lower === 'no') score = 20;
  
  // Bonus for structured content (lists, numbered items, colons, dashes)
  if (/\b\d+\.\s+/.test(valStr) || /\b[•\-\*]\s+/.test(valStr)) score += 5; // List items
  if (/:\s+[A-Z]/.test(valStr)) score += 5; // Structured like "Key: Value"
  
  // Cap at 100
  return Math.min(100, Math.max(0, score));
}

// ============================================================================
// VALIDATION FUNCTIONS (Auto-generated from analysis)
// ============================================================================

/**
 * Category-specific length validation based on statistics
 */
function validateCategoryLength(category: string, value: string): boolean {
  const lengths: Record<string, { min: number; max: number }> = {
    'financial': { min: 42, max: 305 },
    'geographic': { min: 23, max: 180 },
    'timeline': { min: 24, max: 240 },
    // Eligibility - split categories
    'company_type': { min: 24, max: 240 },
    'company_stage': { min: 24, max: 240 },
    'industry_restriction': { min: 24, max: 240 },
    'eligibility_criteria': { min: 24, max: 240 },
    'documents': { min: 10, max: 240 },
    // Project - split categories
    'innovation_focus': { min: 30, max: 257 },
    'technology_area': { min: 30, max: 257 },
    'research_domain': { min: 30, max: 257 },
    'sector_focus': { min: 30, max: 257 },
    // Impact - split categories
    'environmental_impact': { min: 25, max: 268 },
    'social_impact': { min: 25, max: 268 },
    'economic_impact': { min: 25, max: 268 },
    'innovation_impact': { min: 25, max: 268 },
    'team': { min: 22, max: 270 },
    'consortium': { min: 33, max: 180 },
    'technical': { min: 32, max: 323 },
    'legal': { min: 21, max: 240 },
    'use_of_funds': { min: 73, max: 360 },
    'compliance': { min: 20, max: 309 },
    'co_financing': { min: 28, max: 133 },
    'market_size': { min: 62, max: 275 },
    'trl_level': { min: 10, max: 16 },
    'revenue_model': { min: 17, max: 211 },
    'capex_opex': { min: 23, max: 240 },
    'diversity': { min: 24, max: 240 },
  };
  const rules = lengths[category];
  if (!rules) return true; // Unknown category, allow
  return value.length >= rules.min && value.length <= rules.max;
}

/**
 * Enhanced generic placeholder detection
 */
function isGenericPlaceholderEnhanced(value: string): boolean {
  const lower = value.toLowerCase().trim();
  if (lower.length < 5) return false;
  const patterns = [
    /^(specified|required|available|soll|muss|müssen|erforderlich|nötig|benötigt)(\s|$)/i,
    /^(technical|technisch|requirements?|anforderungen?)\s*(specified|required|available)?$/i,
    /^(legal|rechtlich)\s*(compliance|required|specified)?$/i,
    /^(compliance|konformität)\s*(required|specified)?$/i,
    /^(innovation|forschung|research)\s*(required|specified)?$/i,
    /^(funding|finanzierung)\s*(available|required|specified)?$/i,
    /^(consortium|konsortium|partner|partnership)\s*(required|specified)?$/i,
    /^(use of funds|verwendung|zweck)\s*(specified|required)?$/i,
    /^(revenue|umsatz|erlös)\s*(model\s*)?(specified|required)?$/i,
    /^(market size|marktgröße)\s*(requirements?|specified|required)?$/i,
    /^(duration|laufzeit|zeitraum)\s*(specified|required)?$/i,
    /^(team|mitarbeiter|personnel)\s*(required|specified)?$/i,
    /^(n\/a|tbd|to be determined|see below|see above|contact|contact us|kontakt)/i,
    /^(the|die|der|das)\s+(?:program|programm|funding|förderung|institution)/i,
    /^(required|erforderlich|notwendig|nötig)\s*$/i,
    /^(specified|angegeben|festgelegt)\s*$/i,
    /^(available|verfügbar|vorhanden)\s*$/i,
    /^(see|siehe|siehe unten|siehe oben)/i,
    /^(contact|kontakt|anfrage)/i,
    // NEW: Common generic placeholders found in data
    /^(ideation\s*\/?\s*concept\s*stage)$/i,
    /^(capex\s*\/?\s*opex\s*requirements?)$/i,
    /^(termine\s+und\s+fristen|deadlines\s+and\s+deadlines)$/i,
    /^(fristen|deadlines)$/i,
    /^(requirements?)$/i
  ];
  
  // Check exact matches for common placeholders
  const exactMatches = [
    'ideation / concept stage',
    'ideation/concept stage',
    'concept stage',
    'ideation stage',
    'capex/opex requirements',
    'capex / opex requirements',
    'capex opex requirements',
    'opex requirements',
    'capex requirements',
    'requirements',
    'termine und fristen',
    'deadlines and deadlines',
    'fristen',
    'deadlines'
  ];
  
  if (exactMatches.includes(lower)) return true;
  
  return patterns.some(p => p.test(lower));
}

/**
 * Enhanced noise detection (institution names without context)
 */
function isNoiseEnhanced(value: string): boolean {
  const lower = value.toLowerCase().trim();
  const patterns = [
    /\b(ffg|aws|mbh|gmbh|inc\.|ltd\.|corporation|austrian\s*(?:research|science|business))\b/i,
    /^(?:the|die|der|das)\s+(?:program|programm|funding|förderung|institution)/i,
    /^(?:ffg|aws)\s*$/i,
    /^(?:ffg|aws)\s+(?:program|programm|funding|förderung)/i
  ];
  return patterns.some(p => p.test(lower)) && value.length < 100;
}

/**
 * Check if text has encoding issues (garbled characters)
 */
function hasEncodingIssues(value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  
  // Check for common encoding issues (garbled characters)
  // These patterns indicate UTF-8 encoding issues or wrong character encoding
  
  // Check for specific common encoding errors
  const commonErrors = [
    /ÔÇô/, // Should be em dash —
    /ÔÇ£/, // Should be opening quote "
    /ÔÇ¥/, // Should be closing quote "
    /ÔÇÖ/, // Should be apostrophe '
    /ÔÇó/, // Should be bullet •
    /ÔÇ»/, // Should be percent %
    /├ñ/, // Should be ä
    /├Â/, // Should be ä
    /├╝/, // Should be ü
    /├╜/, // Should be ü
    /├╢/, // Should be ö
    /├╡/, // Should be ö
    /├ƒ/, // Should be ß
  ];
  
  // If we find encoding error patterns, it's likely garbled
  if (commonErrors.some(pattern => pattern.test(value))) return true;
  
  // Check ratio of potentially problematic characters
  const problematicChars = (value.match(/[^\x20-\x7E\u00A0-\u00FF]/g) || []).length;
  if (problematicChars > value.length * 0.1 && value.length > 20) {
    // More than 10% problematic characters
    return true;
  }
  
  return false;
}

/**
 * Check if numbers are realistic for the category
 */
function hasValidNumberRange(category: string, value: string): boolean {
  if (!value || typeof value !== 'string') return true; // No numbers = OK
  
  const numbers = value.match(/\d+/g);
  if (!numbers || numbers.length === 0) return true; // No numbers = OK
  
  const currentYear = new Date().getFullYear();
  
  for (const numStr of numbers) {
    const num = parseInt(numStr, 10);
    
    // Financial category - check for realistic amounts
    if (category === 'financial' || category === 'co_financing') {
      // Very small amounts (< 1 EUR) without context
      if (num > 0 && num < 1 && !/[€$£]/.test(value)) return false;
      
      // Very large amounts (> 1 billion) without context
      if (num > 1000000000 && !/\b(million|mio|billion|milliarde)\b/i.test(value)) {
        // Could be a page number or ID, not an amount
        return false;
      }
    }
    
    // Team category - check for realistic team sizes
    if (category === 'team') {
      // Team size 0 or > 1000 is unrealistic
      if (num === 0 || num > 1000) return false;
    }
    
    // Timeline category - check for realistic durations
    if (category === 'timeline') {
      // Years in timeline that are too far in past/future
      if (numStr.length === 4) {
        if (num < 1900 || num > currentYear + 20) return false;
      }
      
      // Duration > 100 years is unrealistic
      if (num > 100 && /\b(year|jahr)\b/i.test(value)) return false;
      
      // Duration < 1 day but expressed as days
      if (num < 1 && /\b(day|tag)\b/i.test(value)) return false;
    }
    
    // Geographic category - check for realistic postal codes or years
    if (category === 'geographic') {
      // Years in geographic context (should be reasonable)
      if (numStr.length === 4) {
        if (num < 1900 || num > currentYear + 10) return false;
      }
      
      // Postal codes should be reasonable (Austria: 1000-9999, Germany: 10000-99999)
      if (numStr.length === 4 || numStr.length === 5) {
        if (num < 1000 || num > 99999) return false;
      }
    }
  }
  
  return true;
}

/**
 * Relaxed invalid data type validation
 * Allows descriptions if they are meaningful (>30 chars) even without pattern match
 * FIX: Made more lenient - allow descriptions >30 chars (was 50) to reduce false positives
 * ENHANCED: Added encoding and number validation
 */
function hasValidDataType(category: string, value: string): boolean {
  // Allow descriptions if they are meaningful (not just check patterns)
  // FIX: Reduced minimum from 20 to 15 chars to allow shorter but valid requirements
  if (value.length < 15) return false; // Too short = likely invalid
  
  // ENHANCED: Check for encoding issues
  if (hasEncodingIssues(value)) return false;
  
  // ENHANCED: Check for realistic number ranges
  if (!hasValidNumberRange(category, value)) return false;
  
  const relaxed: Record<string, RegExp> = {
    'financial': /(funding|finanzierung|grant|subvention|zuschuss|betrag|amount|euro|eur|€|\d)/i,
    'team': /(team|mitarbeiter|personnel|personal|staff|member|qualification|qualifikation|\d)/i,
    'geographic': /(austria|österreich|vienna|wien|germany|deutschland|france|spain|italy|eu|europe|region|location|standort|gebiet|area|location)/i,
    'timeline': /(deadline|frist|date|datum|duration|laufzeit|zeitraum|year|jahr|month|monat|day|tag|week|woche|\d)/i
  };
  
  const pattern = relaxed[category];
  if (!pattern) return true; // Unknown category, allow
  
  // FIX: More lenient - check pattern OR allow if meaningful description (>30 chars, was 50)
  // OR if it passes category-specific length validation (meaningful enough)
  return pattern.test(value) || value.length > 30 || (value.length >= 15 && validateCategoryLength(category, value));
}



/**
 * Helper to create a requirement item with automatic meaningfulness scoring
 * (Currently unused - kept for potential future use)
 */
/*
function _createRequirementItem(
  type: string,
  value: string | number | object,
  required: boolean = true,
  source: string = 'context_extraction',
  description?: string,
  format?: string,
  requirements?: string[]
): RequirementItem {
  const item: RequirementItem = {
    type,
    value: typeof value === 'object' ? JSON.stringify(value) : String(value),
    required,
    source,
    meaningfulness_score: calculateMeaningfulnessScore(value)
  };
  
  if (description) item.description = description;
  if (format) item.format = format;
  if (requirements) item.requirements = requirements;
  
  return item;
}
*/

export interface ExtractedMeta {
  title: string;
  description: string;
  funding_amount_min?: number | null;
  funding_amount_max?: number | null;
  currency?: string | null;
  deadline?: string | null;
  open_deadline?: boolean;
  contact_email?: string | null;
  contact_phone?: string | null;
  categorized_requirements: Record<string, any[]>;
  metadata_json?: Record<string, any>;
}

function extractJsonLd($: cheerio.CheerioAPI): Record<string, any> {
  const jsonLd: any[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const json = JSON.parse($(el).text());
      jsonLd.push(json);
    } catch {
      // ignore invalid JSON
    }
  });
  return jsonLd.length > 0 ? { jsonLd } : {};
}

function extractOpenGraph($: cheerio.CheerioAPI): Record<string, any> {
  const og: Record<string, string> = {};
  $('meta[property^="og:"]').each((_, el) => {
    const prop = $(el).attr('property')?.replace('og:', '');
    const content = $(el).attr('content');
    if (prop && content) og[prop] = content;
  });
  return Object.keys(og).length > 0 ? { openGraph: og } : {};
}

function extractMicrodata($: cheerio.CheerioAPI): Record<string, any> {
  const microdata: Record<string, any> = {};
  $('[itemscope]').each((_, el) => {
    const type = $(el).attr('itemtype');
    if (type) {
      const props: Record<string, string> = {};
      $(el).find('[itemprop]').each((_, propEl) => {
        const prop = $(propEl).attr('itemprop');
        const content = $(propEl).attr('content') || $(propEl).text().trim();
        if (prop && content) props[prop] = content;
      });
      if (Object.keys(props).length > 0) {
        microdata[type] = props;
      }
    }
  });
  return Object.keys(microdata).length > 0 ? { microdata } : {};
}

// ============================================================================
// SMART DISCOVERY HELPER FUNCTIONS
// ============================================================================

/**
 * Extract structured geography (country, region, subregion, city) from text and geographic requirements
 */
function extractStructuredGeography(text: string, geographicReqs: RequirementItem[]): {
  country?: string;
  region?: string;
  subregion?: string;
  city?: string;
  eu_eligible?: boolean;
} | null {
  // const lower = text.toLowerCase(); // Unused
  const result: any = {};
  
  // Check for EU eligibility
  if (/\b(eu|european union|europa|europe)\b/i.test(text)) {
    result.eu_eligible = true;
  }
  
  // Extract from geographic requirements first
  for (const req of geographicReqs) {
    const val = req.value.toLowerCase();
    // Country
    if (/\b(austria|österreich)\b/.test(val) && !result.country) {
      result.country = 'Austria';
    }
    // Major regions (Bundesländer)
    const regionMap: Record<string, string> = {
      'steiermark': 'Styria', 'styria': 'Styria',
      'oberösterreich': 'Upper Austria', 'upper austria': 'Upper Austria',
      'niederösterreich': 'Lower Austria', 'lower austria': 'Lower Austria',
      'tirol': 'Tyrol', 'tyrol': 'Tyrol',
      'vorarlberg': 'Vorarlberg',
      'burgenland': 'Burgenland',
      'kärnten': 'Carinthia', 'carinthia': 'Carinthia',
      'salzburg': 'Salzburg'
    };
    for (const [key, value] of Object.entries(regionMap)) {
      if (val.includes(key) && !result.region) {
        result.region = value;
        break;
      }
    }
    // Cities
    const cityMap: Record<string, string> = {
      'wien': 'Vienna', 'vienna': 'Vienna',
      'salzburg': 'Salzburg',
      'graz': 'Graz',
      'linz': 'Linz',
      'innsbruck': 'Innsbruck',
      'klagenfurt': 'Klagenfurt'
    };
    for (const [key, value] of Object.entries(cityMap)) {
      if (val.includes(key) && !result.city) {
        result.city = value;
        break;
      }
    }
    // Subregions
    if (/\b(mostviertel|waldviertel|mühlviertel|innviertel)\b/i.test(val) && !result.subregion) {
      const match = val.match(/\b(mostviertel|waldviertel|mühlviertel|innviertel)\b/i);
      if (match) result.subregion = match[1];
    }
  }
  
  // Fallback: Extract directly from text if not found in requirements
  if (!result.country && /\b(austria|österreich)\b/i.test(text)) {
    result.country = 'Austria';
  }
  
  return Object.keys(result).length > 0 ? result : null;
}

/**
 * Extract funding type from content (grant, loan, equity, guarantee, etc.)
 */
function extractFundingType(text: string): string | null {
  const lower = text.toLowerCase();
  
  // Priority order (most specific first)
  if (/\b(grant|zuschuss|förderung|subvention|beihilfe|scholarship)\b/i.test(lower)) {
    return 'grant';
  }
  if (/\b(loan|kredit|darlehen|finanzierungskredit)\b/i.test(lower) && !/\b(guarantee|bürgschaft)\b/i.test(lower)) {
    return 'loan';
  }
  if (/\b(equity|beteiligung|kapitalbeteiligung|investition)\b/i.test(lower)) {
    return 'equity';
  }
  if (/\b(guarantee|bürgschaft|garantie|aval)\b/i.test(lower)) {
    return 'guarantee';
  }
  if (/\b(venture capital|risikokapital|wagniskapital)\b/i.test(lower)) {
    return 'venture_capital';
  }
  if (/\b(microcredit|mikrokredit)\b/i.test(lower)) {
    return 'microcredit';
  }
  
  return null;
}

/**
 * Extract industry/sector focus from content
 */
function extractIndustries(text: string): string[] {
  const lower = text.toLowerCase();
  const industries: string[] = [];
  
  const industryKeywords: Record<string, string[]> = {
    'manufacturing': ['manufacturing', 'produktion', 'industrie', 'fertigung'],
    'technology': ['technology', 'technologie', 'tech', 'it', 'software', 'hardware'],
    'healthcare': ['healthcare', 'gesundheitswesen', 'medizin', 'health', 'pharma'],
    'energy': ['energy', 'energie', 'solar', 'wind', 'renewable', 'erneuerbar'],
    'agriculture': ['agriculture', 'landwirtschaft', 'agrar', 'food', 'lebensmittel'],
    'tourism': ['tourism', 'tourismus', 'travel', 'hotel', 'gastronomie'],
    'construction': ['construction', 'bau', 'infrastructure', 'infrastruktur'],
    'retail': ['retail', 'handel', 'commerce', 'e-commerce'],
    'education': ['education', 'bildung', 'schule', 'university', 'universität'],
    'biotech': ['biotech', 'biotechnologie', 'biotech', 'life sciences']
  };
  
  for (const [industry, keywords] of Object.entries(industryKeywords)) {
    if (keywords.some(kw => lower.includes(kw)) && !industries.includes(industry)) {
      industries.push(industry);
    }
  }
  
  return industries;
}

/**
 * Extract technology focus areas from content
 */
function extractTechnologyFocus(text: string): string[] {
  const lower = text.toLowerCase();
  const tech: string[] = [];
  
  const techKeywords: Record<string, string[]> = {
    'ai': ['artificial intelligence', 'ai', 'machine learning', 'ml', 'deep learning', 'künstliche intelligenz', 'ki'],
    'iot': ['iot', 'internet of things', 'internet der dinge', 'smart devices', 'connected devices'],
    'blockchain': ['blockchain', 'distributed ledger', 'crypto', 'bitcoin', 'ethereum'],
    'cloud': ['cloud', 'cloud computing', 'saas', 'paas', 'iaas'],
    'cybersecurity': ['cybersecurity', 'cyber security', 'sicherheit', 'security', 'data protection'],
    'data_analytics': ['data analytics', 'big data', 'data science', 'business intelligence', 'bi'],
    'robotics': ['robotics', 'roboter', 'automation', 'automation'],
    'ar_vr': ['ar', 'vr', 'augmented reality', 'virtual reality', 'mixed reality'],
    'fintech': ['fintech', 'financial technology', 'payments', 'banking tech'],
    'cleantech': ['cleantech', 'clean tech', 'green tech', 'sustainability tech']
  };
  
  for (const [technology, keywords] of Object.entries(techKeywords)) {
    if (keywords.some(kw => lower.includes(kw)) && !tech.includes(technology)) {
      tech.push(technology);
    }
  }
  
  return tech;
}

/**
 * Extract program topics/themes from content
 */
function extractProgramTopics(text: string): string[] {
  const lower = text.toLowerCase();
  const topics: string[] = [];
  
  const topicKeywords: Record<string, string[]> = {
    'innovation': ['innovation', 'forschung', 'research', 'development', 'entwicklung'],
    'sustainability': ['sustainability', 'nachhaltigkeit', 'climate', 'klima', 'environment', 'umwelt'],
    'digitalization': ['digitalization', 'digitalisierung', 'digital transformation', 'digitale transformation'],
    'startup': ['startup', 'start-up', 'neugründung', 'neue unternehmen', 'gründung'],
    'sme': ['sme', 'small business', 'mittelstand', 'km unternehmen', 'small and medium'],
    'export': ['export', 'international', 'internationalisierung', 'auslandsmärkte'],
    'rd': ['rd', 'r&d', 'research and development', 'forschung und entwicklung'],
    'growth': ['growth', 'wachstum', 'expansion', 'scaling', 'skalierung'],
    'inclusion': ['inclusion', 'diversity', 'vielfalt', 'equality', 'gleichstellung']
  };
  
  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    if (keywords.some(kw => lower.includes(kw)) && !topics.includes(topic)) {
      topics.push(topic);
    }
  }
  
  return topics;
}

export async function extractMeta(html: string, url?: string): Promise<ExtractedMeta> {
  const $ = cheerio.load(html);
  
  // Structured data (JSON-LD, OpenGraph, Microdata)
  const jsonLdData = extractJsonLd($ as cheerio.CheerioAPI);
  const ogData = extractOpenGraph($ as cheerio.CheerioAPI);
  const microdata = extractMicrodata($ as cheerio.CheerioAPI);
  const metadata_json = { ...jsonLdData, ...ogData, ...microdata };
  
  // Title: OG > JSON-LD > H1 > title tag
  let title = ogData.openGraph?.title || '';
  if (!title && jsonLdData.jsonLd) {
    const firstLd = Array.isArray(jsonLdData.jsonLd) ? jsonLdData.jsonLd[0] : jsonLdData.jsonLd;
    title = firstLd.name || firstLd.headline || firstLd.title || '';
  }
  if (!title) title = ($('h1').first().text() || $('title').text() || '').trim();
  
  // Description: OG > JSON-LD > meta description > first paragraph > title (fallback)
  let description = ogData.openGraph?.description || '';
  if (!description && jsonLdData.jsonLd) {
    const firstLd = Array.isArray(jsonLdData.jsonLd) ? jsonLdData.jsonLd[0] : jsonLdData.jsonLd;
    description = firstLd.description || '';
  }
  if (!description) description = $('meta[name="description"]').attr('content') || '';
  if (!description) description = $('main p, article p, .content p').first().text().trim();
  // ENHANCED: If still no description, try multiple paragraphs or use title as fallback
  if (!description || description.trim().length < 10) {
    // Try to get first 2-3 paragraphs
    const paragraphs = $('main p, article p, .content p').slice(0, 3).map((_, p) => $(p).text().trim()).get();
    description = paragraphs.filter(p => p.length > 10).join(' ').substring(0, 500);
  }
  // Final fallback: use title if description is still missing/short
  if (!description || description.trim().length < 10) {
    description = title || '';
  }

  // Extract body text with better error handling (fixes "Cannot read properties of undefined" errors)
  let safeTextForMatch: string = '';
  try {
    const bodyText = $('body').clone().find('script,style,noscript').remove().end().text();
    // Ensure we have a primitive string - cheerio text() might return special objects
    if (bodyText == null || bodyText === undefined) {
      safeTextForMatch = '';
    } else if (typeof bodyText === 'string') {
      safeTextForMatch = bodyText;
    } else if (typeof bodyText === 'object' && bodyText !== null) {
      // Handle cheerio objects or other special cases
      safeTextForMatch = String(bodyText);
    } else {
      safeTextForMatch = String(bodyText || '');
    }
    // Final safety check
    if (typeof safeTextForMatch !== 'string') {
      safeTextForMatch = '';
    }
  } catch (e: any) {
    // If any conversion fails, default to empty string
    console.warn(`Warning: Failed to extract body text for ${url || 'unknown'}:`, e?.message || String(e));
    safeTextForMatch = '';
  }
  const text = safeTextForMatch; // Keep for backward compatibility
  const lower = safeTextForMatch.toLowerCase();

  // Amounts - Enhanced patterns with better context and filtering
  const amounts: number[] = [];
  const amountContext: Array<{value: number, context: string}> = [];
  
  // Enhanced patterns with context
  const millionRe = /(\d{1,3}(?:[.,]\d{3})?|\d(?:[.,]\d)?)\s*(million|millionen|mio\.?|Mio\.?)/gi;
  const euroRe = /€\s*(\d{1,3}(?:[.,\s]\d{3})*(?:[.,]\d{2})?)/gi;
  const euroAfterRe = /(\d{1,3}(?:[.,\s]\d{3})*(?:[.,]\d{2})?)\s*€/gi; // Amount before €
  const nearRe = /(bis zu|maximal|förderbetrag|förderhöhe|fördersumme|betrag|amount|up to|max\.?|fördervolumen|finanzierungsvolumen|investitionsvolumen)\s*[:\s]*€?\s*(\d{1,3}(?:[.,\s]\d{3})*(?:[.,]\d{2})?)/gi;
  const rangeRe = /(?:von|from|zwischen|between|minimum|minimum of|mindestens|at least)\s*€?\s*(\d{1,3}(?:[.,\s]\d{3})*(?:[.,]\d{2})?)\s*(?:bis|to|-|und|and|maximum)\s*€?\s*(\d{1,3}(?:[.,\s]\d{3})*(?:[.,]\d{2})?)/gi;
  // Additional: percentage-based amounts (e.g., "50% up to 100,000 EUR")
  const percentAmountRe = /(\d{1,3})\s*%[^.]{0,50}?(?:bis zu|up to|maximal|maximum)\s*€?\s*(\d{1,3}(?:[.,\s]\d{3})*(?:[.,]\d{2})?)/gi;
  // IMPROVED: Validate funding amount - filter out years, page numbers, and suspicious values
  // More precise but not too strict - ensure we capture real funding amounts
  // FIXED: Reject amounts < 1,000 EUR (likely page numbers/IDs, not funding amounts)
  const isValidFundingAmount = (value: number, context: string): boolean => {
    // Reject amounts < 1,000 EUR (unless explicitly in funding context with keywords)
    if (value < 1000) {
      // Only accept if context explicitly mentions funding keywords
      const hasStrongFundingContext = /\b(förderung|funding|finanzierung|grant|betrag|amount|euro|€|subvention|zuschuss|förderbetrag|förderhöhe|finanzierungsbetrag)\b/i.test(context);
      if (!hasStrongFundingContext) {
        return false; // Reject - likely page number, ID, or other non-funding value
      }
    }
    // Filter years (2020-2030 range) - commonly mistaken as amounts
    if (value >= 2020 && value <= 2030) {
      return false;
    }
    
    const contextLower = context.toLowerCase();
    
    // Filter very small amounts (< 100 EUR) unless explicitly in funding context
    if (value < 100) {
      // Only allow if context clearly indicates funding (not page numbers, years, etc.)
      const hasFundingContext = /\b(förderung|funding|finanzierung|grant|betrag|amount|euro|€|subvention|zuschuss)\b/i.test(context);
      if (!hasFundingContext) {
        return false;
      }
    }
    
    // Filter small round numbers (100-999) that are likely page numbers or IDs
    if (value >= 100 && value < 1000 && value % 100 === 0) {
      // Common page number patterns (200, 300, etc.) - filter unless in funding context
      if ([100, 200, 300, 400, 500, 600, 700, 800, 900].includes(value)) {
        const hasFundingContext = /\b(förderung|funding|finanzierung|grant|betrag|amount|euro|€)\b/i.test(context);
        if (!hasFundingContext) {
          return false;
        }
      }
    }
    
    // FIX: Filter amounts 200-999 that are likely page numbers, IDs, or phone numbers (not funding amounts)
    // Numbers like 222, 508, etc. are almost never real funding amounts
    if (value >= 200 && value < 1000) {
      // Check if context suggests it's actually a page number, year, phone number, or ID
      if (contextLower.includes('page') || contextLower.includes('seite') || 
          contextLower.includes('horizon 202') || contextLower.includes('version') ||
          contextLower.includes('tel') || contextLower.includes('phone') ||
          contextLower.includes('id') || contextLower.includes('nummer') ||
          /\b\d{3}-\d{3}\b/.test(context) || // Phone number pattern
          /\b\d{3}\.\d{3}\b/.test(context)) { // Another phone pattern
        return false;
      }
      // STRICT: Numbers 200-999 are suspicious unless they have VERY strong funding context
      // Require: Both currency symbol AND funding keyword, not just one
      const hasCurrency = /[€$£]|eur|euro|usd|dollar/i.test(context);
      const hasStrongFundingKeyword = /\b(förderbetrag|förderhöhe|fördersumme|funding amount|finanzierungsbetrag|betrag|amount|grant amount)\b/i.test(context);
      
      // If it's 202-209 range, almost certainly a year/page number unless very explicit
      if (value >= 202 && value <= 209) {
        // Need both currency AND explicit funding keyword
        if (!(hasCurrency && hasStrongFundingKeyword)) {
          return false;
        }
      }
      
      // For other numbers 200-999, require strong funding context
      // Numbers like 222, 333, 444, 555, 666, 777, 888, 999 are almost certainly not amounts
      if ([222, 333, 444, 555, 666, 777, 888, 999].includes(value)) {
        // These patterns are almost never funding amounts - require extremely strong context
        if (!(hasCurrency && hasStrongFundingKeyword && context.length > 50)) {
          return false;
        }
      }
      
      // For other numbers in 200-999 range, require currency + funding context
      if (!hasCurrency || !hasStrongFundingKeyword) {
        return false;
      }
    }
    
    // Filter very large amounts that are likely errors (unless in million context)
    if (value > 1_000_000_000 && !/\b(million|millionen|mio|billion)\b/i.test(context)) {
      // Only allow if context mentions millions/billions
      return false;
    }
    
    // Must be within reasonable bounds for funding programs
    if (value < 1 || value > 10_000_000_000_000) {
      return false;
    }
    
    return true;
  };

  const pushParsed = (raw: string, ctx: string) => {
    let s = raw.replace(/[^\d.,\s]/g, '').replace(/\s+/g, '');
    if (s.length === 0) return;
    const lastComma = s.lastIndexOf(',');
    const lastDot = s.lastIndexOf('.');
    if (lastComma > lastDot) { s = s.replace(/\./g, '').replace(/,(\d{1,2})$/, '.$1'); } else { s = s.replace(/,/g, ''); }
    const n = parseFloat(s);
    if (!isNaN(n) && n > 0) {
      const value = /\b(million|millionen|mio)\b/i.test(ctx) ? Math.round(n * 1_000_000) : Math.round(n);
      // Validate funding amount - filter out years, page numbers, suspicious values
      if (isValidFundingAmount(value, ctx)) {
        amounts.push(value);
        amountContext.push({value, context: ctx.substring(0, 100)});
      }
    }
  };
  // safeTextForMatch already defined above
  for (const m of safeMatchAll(safeTextForMatch, millionRe)) pushParsed(m[1], m[0]);
  for (const m of safeMatchAll(safeTextForMatch, euroRe)) pushParsed(m[1], m[0]);
  for (const m of safeMatchAll(safeTextForMatch, euroAfterRe)) pushParsed(m[1], m[0]);
  for (const m of safeMatchAll(safeTextForMatch, nearRe)) pushParsed(m[2], m[0]);
  for (const m of safeMatchAll(safeTextForMatch, rangeRe)) {
    pushParsed(m[1], m[0]);
    pushParsed(m[2], m[0]);
  }
  for (const m of safeMatchAll(safeTextForMatch, percentAmountRe)) {
    pushParsed(m[2], m[0]); // Extract the max amount from percentage-based patterns
  }

  // ENHANCED: Also check for amounts near funding/program keywords (even if no explicit keywords)
  if (amounts.length === 0) {
    // Look for amounts in paragraphs that contain funding-related words
    const fundingParagraphs = safeTextForMatch.split(/[.\n]/).filter(p => {
      const lower = p.toLowerCase();
      return lower.includes('förder') || lower.includes('funding') || lower.includes('finanzier') ||
             lower.includes('kredit') || lower.includes('darlehen') || lower.includes('grant') ||
             lower.includes('subvention') || lower.includes('zuschuss') || lower.includes('beihilfe') ||
             lower.includes('kapital') || lower.includes('investment') || lower.includes('investition');
    });
    
    for (const para of fundingParagraphs) {
      const paraMatches = safeMatchAll(para, /(\d{1,3}(?:[.,\s]\d{3})*(?:[.,]\d{2})?)\s*(?:million|millionen|mio\.?|Mio\.?|€|EUR|euro)/gi);
      for (const m of paraMatches) {
        pushParsed(m[1], m[0]);
      }
      // Also check for € patterns in these paragraphs
      const euroMatches = safeMatchAll(para, /€\s*(\d{1,3}(?:[.,\s]\d{3})*(?:[.,]\d{2})?)/gi);
      for (const m of euroMatches) {
        pushParsed(m[1], m[0]);
      }
    }
  }

  // ENHANCED: Extract funding amounts from structured data and tables as fallback
  if (amounts.length === 0) {
    // Try to extract from JSON-LD structured data
    if (jsonLdData.jsonLd && Array.isArray(jsonLdData.jsonLd)) {
      for (const item of jsonLdData.jsonLd) {
        if (item.price || item.amount || item.maxValue || item.value) {
          const value = item.price || item.amount || item.maxValue || item.value;
          const num = typeof value === 'string' ? parseFloat(value.replace(/[^\d.,]/g, '').replace(',', '.')) : value;
          if (!isNaN(num) && num > 0) {
            const rounded = Math.round(num);
            if (rounded >= 1 && rounded <= 1_000_000_000_000) {
              amounts.push(rounded);
            }
          }
        }
      }
    }
    
    // Try to extract from OpenGraph
    if (ogData.openGraph?.price || ogData.openGraph?.amount) {
      const value = ogData.openGraph.price || ogData.openGraph.amount;
      const num = typeof value === 'string' ? parseFloat(value.replace(/[^\d.,]/g, '').replace(',', '.')) : value;
      if (!isNaN(num) && num > 0) {
        const rounded = Math.round(num);
        if (rounded >= 1 && rounded <= 1_000_000_000_000) {
          amounts.push(rounded);
        }
      }
    }
    
    // Enhanced: Look for amounts in common financial contexts (even without explicit keywords)
    const fallbackAmountPatterns = [
      /(?:bis\s+zu|maximal|maximum|up\s+to)\s*€?\s*(\d{1,3}(?:[.,\s]\d{3})*(?:[.,]\d{2})?)/gi,
      /(?:finanzierung|funding|förderung)\s+(?:von|of|bis|up\s+to)?\s*€?\s*(\d{1,3}(?:[.,\s]\d{3})*(?:[.,]\d{2})?)/gi,
      /€\s*(\d{1,3}(?:[.,\s]\d{3})*(?:[.,]\d{2})?)\s+(?:verfügbar|available|maximal|maximum)/gi,
      /(?:beträgt|betragen|amounts?\s+to|is|are)\s*€?\s*(\d{1,3}(?:[.,\s]\d{3})*(?:[.,]\d{2})?)/gi,
      /(?:kredit|darlehen|loan|finanzierung)\s+(?:bis\s+zu|maximal|von|up\s+to)?\s*€?\s*(\d{1,3}(?:[.,\s]\d{3})*(?:[.,]\d{2})?)/gi
    ];
    
    for (const pattern of fallbackAmountPatterns) {
      const matches = safeMatchAll(safeTextForMatch, pattern);
      for (const m of matches) {
        if (m[1]) pushParsed(m[1], m[0]);
      }
    }
    
    // Also check HTML tables for funding amounts
    try {
      $('table').each((_, table) => {
        const $table = $(table);
        $table.find('tr').each((_, row) => {
          const $row = $(row);
          const cells = $row.find('td, th').map((_, cell) => $(cell).text().trim()).get();
          if (cells.length >= 2) {
            const label = cells[0].toLowerCase();
            const value = cells[1];
            // Look for funding-related labels
            if (label.includes('förderhöhe') || label.includes('förderbetrag') || label.includes('funding') || 
                label.includes('maximal') || label.includes('betrag') || label.includes('finanzierung') ||
                label.includes('kredit') || label.includes('darlehen') || label.includes('volumen') ||
                label.includes('höhe') || label.includes('summe') || label.includes('kapital')) {
              // Extract number from value
              const numMatch = value.match(/(\d{1,3}(?:[.,\s]\d{3})*(?:[.,]\d{2})?)/);
              if (numMatch) {
                pushParsed(numMatch[1], value);
              }
            }
          }
        });
      });
    } catch (e) {
      // Ignore errors in table parsing
    }
  }

  // ENHANCED: Parse numeric values from text descriptions (for funding_amount_description)
  // Extract numbers from descriptions like "bis zu 75.000 EUR" → 75000
  // IMPROVED: Better range extraction (e.g., "from EUR 20,000 - EUR 150,000")
  const descriptionAmountPatterns = [
    // Range patterns: "EUR 20,000 - EUR 150,000" or "from EUR 20,000 to EUR 150,000"
    /(?:from|von|zwischen|between)\s*(?:EUR|€|euro)\s*(\d{1,3}(?:[.,\s]\d{3})*(?:[.,]\d{2})?)\s*(?:-|to|bis|und|and)\s*(?:EUR|€|euro)?\s*(\d{1,3}(?:[.,\s]\d{3})*(?:[.,]\d{2})?)\s*(?:EUR|€|euro)?/gi,
    /(?:EUR|€|euro)\s*(\d{1,3}(?:[.,\s]\d{3})*(?:[.,]\d{2})?)\s*(?:-|to|bis|und|and)\s*(?:EUR|€|euro)?\s*(\d{1,3}(?:[.,\s]\d{3})*(?:[.,]\d{2})?)\s*(?:EUR|€|euro)?/gi,
    // Single amount patterns
    /(?:bis\s+zu|up\s+to|maximal|maximum|max\.?)\s*(\d{1,3}(?:[.,\s]\d{3})*(?:[.,]\d{2})?)\s*(?:€|EUR|euro|million|millionen|mio)/gi,
    /(\d{1,3}(?:[.,\s]\d{3})*(?:[.,]\d{2})?)\s*(?:€|EUR|euro|million|millionen|mio)\s*(?:bis\s+zu|up\s+to|maximal|maximum)/gi,
    /(?:von|from|zwischen|between|minimum|mindestens|at\s+least)\s*(\d{1,3}(?:[.,\s]\d{3})*(?:[.,]\d{2})?)\s*(?:€|EUR|euro|million|millionen|mio)/gi,
    // Project volume patterns: "from EUR 20,000 - EUR 150,000 eligible costs"
    /(?:project\s+volume|projektvolumen|eligible\s+costs|förderbare\s+kosten)\s*(?:from|von)?\s*(?:EUR|€|euro)?\s*(\d{1,3}(?:[.,\s]\d{3})*(?:[.,]\d{2})?)\s*(?:-|to|bis)\s*(?:EUR|€|euro)?\s*(\d{1,3}(?:[.,\s]\d{3})*(?:[.,]\d{2})?)\s*(?:EUR|€|euro)?/gi
  ];
  
  // If we have amounts already, use them. Otherwise, try to extract from descriptions
  if (amounts.length === 0) {
    for (const pattern of descriptionAmountPatterns) {
      const matches = safeMatchAll(safeTextForMatch, pattern);
      for (const m of matches) {
        // Extract first number (min)
        if (m[1]) pushParsed(m[1], m[0]);
        // Extract second number if range (max)
        if (m[2]) pushParsed(m[2], m[0]);
      }
    }
  }

  // IMPROVED: Calculate min/max with validation - filter out unrealistic values
  let funding_amount_min: number | null = null;
  let funding_amount_max: number | null = null;
  let funding_amount_status: string | null = null; // 'extracted', 'unknown', 'varies', 'contact_required', 'not_specified'
  
  // Check for phrases indicating unknown/variable amounts
  const unknownAmountPatterns = [
    /(?:varies|varies by|abhängig|depends|abhängig von|depends on|je nach|depending on)/i,
    /(?:contact us|kontaktieren sie uns|contact.*for.*details|für details kontaktieren|für weitere informationen kontaktieren)/i,
    /(?:not specified|nicht angegeben|keine angabe|no fixed amount|kein fester betrag)/i,
    /(?:individual|individuell|case by case|einzelfall)/i,
    /(?:up to|bis zu).*(?:contact|kontakt|discuss|besprechen)/i,
    /(?:project.*specific|projektbezogen|case.*specific)/i
  ];
  
  const hasUnknownAmountPhrase = unknownAmountPatterns.some(pattern => pattern.test(lower));
  const hasContactPhrase = /(?:contact|kontakt|reach out|ansprechpartner)/i.test(lower) && 
                           /(?:for.*details|für.*details|information|informationen|amount|betrag|funding|finanzierung)/i.test(lower);
  
  // ENHANCED: Also check for percentage-based funding (e.g., "up to 50% of costs")
  const percentagePatterns = [
    /(?:bis zu|up to|maximal|maximum)\s*(\d{1,3}(?:[.,]\d+)?)\s*%/i,
    /(\d{1,3}(?:[.,]\d+)?)\s*%\s*(?:der|of|von)\s*(?:kosten|costs|ausgaben|expenses|investition|investment)/i
  ];
  
  const percentageMatches = percentagePatterns.flatMap(p => safeMatchAll(safeTextForMatch, p));
  if (percentageMatches.length > 0 && amounts.length === 0) {
    // Extract percentage and try to find cost context
    const percentageMatch = percentageMatches[0];
    if (percentageMatch && percentageMatch[1]) {
      const percentage = parseFloat(percentageMatch[1].replace(',', '.'));
      // Look for cost amounts in context
      const costContext = safeTextForMatch.substring(Math.max(0, safeTextForMatch.indexOf(percentageMatch[0]) - 200), safeTextForMatch.indexOf(percentageMatch[0]) + 200);
      const costMatches = costContext.match(/(\d{1,3}(?:[.,\s]\d{3})*(?:[.,]\d{2})?)\s*(?:€|EUR|euro|million|millionen|mio)/i);
      if (costMatches && costMatches[1]) {
        const costAmount = parseFloat(costMatches[1].replace(/[.,\s]/g, '').replace(/,(\d{1,2})$/, '.$1'));
        if (!isNaN(costAmount) && costAmount > 0) {
          const fundingAmount = Math.round(costAmount * (percentage / 100));
          if (fundingAmount >= 1000) { // Only if reasonable amount
            amounts.push(fundingAmount);
            amountContext.push({ value: fundingAmount, context: percentageMatch[0] });
          }
        }
      }
    }
  }
  
  if (amounts.length > 0) {
    // Filter out unrealistic values (too small or suspicious patterns)
    const validAmounts = amounts.filter(amt => {
      // Remove amounts < 100 EUR (unless clearly in funding context)
      if (amt < 100) {
        // Check if any context mentions funding
        const hasFundingContext = amountContext.some(ctx => 
          ctx.value === amt && /\b(förderung|funding|finanzierung|grant|betrag|amount|euro|€|subvention|zuschuss)\b/i.test(ctx.context)
        );
        return hasFundingContext;
      }
      // Remove extremely large amounts (> 1 trillion) unless in billion context
      if (amt > 1_000_000_000_000) {
        const hasBillionContext = amountContext.some(ctx => 
          ctx.value === amt && /\b(billion|milliarde)\b/i.test(ctx.context)
        );
        return hasBillionContext;
      }
      return true;
    });
    
    if (validAmounts.length > 0) {
      funding_amount_min = Math.min(...validAmounts);
      funding_amount_max = Math.max(...validAmounts);
      funding_amount_status = 'extracted';
      
      // Sanity check: if min and max are very close and both small (< 1000), might be wrong
      if (funding_amount_max - funding_amount_min < 100 && funding_amount_max < 1000) {
        // Check if we have good context - might be page numbers
        const hasGoodContext = amountContext.some(ctx => 
          (ctx.value === funding_amount_min || ctx.value === funding_amount_max) &&
          /\b(förderung|funding|finanzierung|grant|betrag|amount|euro|€|subvention|zuschuss)\b/i.test(ctx.context)
        );
        if (!hasGoodContext) {
          // Likely page numbers or other non-funding values
          funding_amount_min = null;
          funding_amount_max = null;
          funding_amount_status = null;
        }
      }
    }
  } else if (hasUnknownAmountPhrase || hasContactPhrase) {
    // We know they fund but amount is unknown - set status
    if (hasUnknownAmountPhrase) {
      funding_amount_status = /varies|abhängig|depends/i.test(lower) ? 'varies' : 'unknown';
    } else if (hasContactPhrase) {
      funding_amount_status = 'contact_required';
    }
  }

  // Deadlines - Enhanced patterns with better context matching and HTML structure extraction
  let open_deadline = /(laufend|rolling|ongoing|bis auf weiteres|continuously|open|keine frist|permanent|dauerhaft|open-ended|kontinuierlich)/i.test(lower);
  let deadline: string | null = null;
  
  // ENHANCED: Extract from HTML structure first (deadline-specific classes/IDs)
  try {
    const deadlineSelectors = [
      '.deadline', '.frist', '.einreichfrist', '.bewerbungsfrist',
      '[class*="deadline"]', '[class*="frist"]', '[id*="deadline"]', '[id*="frist"]',
      '.application-deadline', '.submission-deadline', '.due-date'
    ];
    for (const selector of deadlineSelectors) {
      $(selector).each((_, el) => {
        const deadlineText = $(el).text().trim();
        if (deadlineText && !deadline) {
          // Try to extract date from this element
          const dateMatch = deadlineText.match(/(\d{1,2})[.\/\-\s]+(\d{1,2})[.\/\-\s]+(\d{2,4})/);
          if (dateMatch) {
            const d = parseInt(dateMatch[1], 10);
            const mo = parseInt(dateMatch[2], 10);
            const y = parseInt(dateMatch[3], 10) + (parseInt(dateMatch[3], 10) < 100 ? 2000 : 0);
            if (d >= 1 && d <= 31 && mo >= 1 && mo <= 12 && y >= 2020 && y <= 2030) {
              deadline = `${String(d).padStart(2,'0')}.${String(mo).padStart(2,'0')}.${y}`;
              return false; // Break loop
            }
          }
        }
      });
      if (deadline) break;
    }
  } catch (e) {
    // Ignore errors
  }
  
  // Enhanced: Look for dates in context with deadline keywords first
  if (!deadline && !open_deadline) {
    const deadlineKeywordPatterns = [
      /(deadline|frist|einreichfrist|bewerbungsfrist|einsendefrist|antragsfrist|abgabefrist|meldungsfrist|anmeldefrist|bewerbungsschluss|einsendeschluss|abgabeschluss)[\s:]+(?:bis\s+)?(\d{1,2})[.\/\-\s]+(\d{1,2})[.\/\-\s]+(\d{2,4})/gi,
      /(?:bis|until|by|spätestens|letzter\s+termin|deadline|frist|einsendeschluss|application deadline|bewerbungsschluss)[\s]+(\d{1,2})[.\/\-\s]+(\d{1,2})[.\/\-\s]+(\d{2,4})/gi,
      /(\d{1,2})[.\/\-\s]+(\d{1,2})[.\/\-\s]+(\d{2,4})[\s]+(?:ist|deadline|frist|abgabe|schluss)/gi,
      // Month name formats
      /(?:deadline|frist|bis|until|by|bewerbungsschluss|einsendeschluss)[\s:]+(\d{1,2})[\s.,]+(januar|februar|märz|april|mai|juni|juli|august|september|oktober|november|dezember|january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[\s.,]+(\d{2,4})/gi,
      // Table format: <td>Deadline</td><td>15.03.2025</td>
      /(?:deadline|frist|bewerbungsschluss)[\s:]*[\s\n]*(\d{1,2})[.\/\-\s]+(\d{1,2})[.\/\-\s]+(\d{2,4})/gi,
      // Open deadlines
      /(?:rolling|kontinuierlich|offen|open|continuous|no\s+deadline|keine\s+frist|laufend)/gi
    ];
    
    const monthNames: Record<string, number> = {
      'januar': 1, 'january': 1, 'jan': 1, 
      'februar': 2, 'february': 2, 'feb': 2, 
      'märz': 3, 'march': 3, 'mar': 3,
      'april': 4, 'apr': 4, 
      'mai': 5, 'may': 5, 
      'juni': 6, 'june': 6, 'jun': 6,
      'juli': 7, 'july': 7, 'jul': 7, 
      'august': 8, 'aug': 8, 
      'september': 9, 'sep': 9, 
      'oktober': 10, 'october': 10, 'oct': 10, 
      'november': 11, 'nov': 11, 
      'dezember': 12, 'december': 12, 'dec': 12
    };
  
    for (const pattern of deadlineKeywordPatterns) {
      // Check for open/rolling deadlines first
      if (pattern.source.includes('rolling|kontinuierlich|offen|open|continuous')) {
        const openMatch = safeTextForMatch.match(/(?:rolling|kontinuierlich|offen|open|continuous|no\s+deadline|keine\s+frist|laufend)/i);
        if (openMatch) {
          open_deadline = true;
          deadline = null;
          break;
        }
        continue;
      }
      
      const matches = safeMatchAll(safeTextForMatch, pattern);
      for (const match of matches) {
        let d: number, mo: number, y: number;
        
        // Check if it's a month name format
        const monthName = match[2] || match[3];
        if (monthName && monthNames[monthName.toLowerCase()]) {
          d = parseInt(match[1], 10);
          mo = monthNames[monthName.toLowerCase()];
          y = parseInt(match[3] || match[4] || '2025', 10);
          if (y < 100) y += 2000;
        } else {
          d = parseInt(match[1] || match[2] || match[0], 10);
          mo = parseInt(match[2] || match[3] || match[1], 10);
          const yStr = match[3] || match[4] || match[2] || match[0];
          y = parseInt(yStr, 10) + (parseInt(yStr, 10) < 100 ? 2000 : 0);
        }
        
        if (d >= 1 && d <= 31 && mo >= 1 && mo <= 12 && y >= 2020 && y <= 2030) {
          const deadlineDate = new Date(y, mo - 1, d);
          const now = new Date();
          now.setHours(0, 0, 0, 0); // Compare dates only, not times
          deadlineDate.setHours(0, 0, 0, 0);
          
          // FIX: Only extract deadlines that are in the future (not past)
          // Don't extract past deadlines - they're expired
          if (deadlineDate >= now) {
            // Future deadline - valid
            deadline = `${String(d).padStart(2,'0')}.${String(mo).padStart(2,'0')}.${y}`;
            break;
          } else {
            // Past deadline - skip it (don't extract)
            // If it's an open/rolling deadline, that will be caught by other patterns
            continue;
          }
        }
      }
      if (deadline || open_deadline) break;
    }
  }
  
  // ENHANCED: Extract deadline from HTML tables (if not found yet)
  if (!deadline && !open_deadline) {
    try {
      $('table').each((_, table) => {
        const $table = $(table);
        $table.find('tr').each((_, row) => {
          const $row = $(row);
          const cells = $row.find('td, th').map((_, cell) => $(cell).text().trim()).get();
          if (cells.length >= 2) {
            const label = cells[0].toLowerCase();
            const value = cells[1];
            if (label.includes('deadline') || label.includes('frist') || label.includes('einreichfrist') || 
                label.includes('bewerbungsfrist') || label.includes('einsendefrist') || label.includes('abgabefrist') ||
                label.includes('bewerbungsschluss') || label.includes('einsendeschluss') || label.includes('abgabeschluss')) {
              const dateMatch = value.match(/(\d{1,2})[.\/\-\s]+(\d{1,2})[.\/\-\s]+(\d{2,4})/);
              if (dateMatch) {
                const d = parseInt(dateMatch[1], 10);
                const mo = parseInt(dateMatch[2], 10);
                const y = parseInt(dateMatch[3], 10) + (parseInt(dateMatch[3], 10) < 100 ? 2000 : 0);
                if (d >= 1 && d <= 31 && mo >= 1 && mo <= 12 && y >= 2020 && y <= 2030) {
                  deadline = `${String(d).padStart(2,'0')}.${String(mo).padStart(2,'0')}.${y}`;
                  return false; // Break loops
                }
              } else if (/(laufend|rolling|ongoing|bis auf weiteres|continuously|open|keine frist|permanent)/i.test(value)) {
                open_deadline = true;
                return false; // Break loops
              }
            }
          }
        });
        if (deadline || open_deadline) return false; // Break table loop
      });
    } catch (e) {
      // Ignore errors
    }
  }
  
  // Fallback: Try multiple date formats (if no deadline found yet)
  if (!deadline && !open_deadline) {
    // Try multiple date formats (fallback)
    const dateFormats = [
      safeTextForMatch.match(/(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{2,4})/), // DD.MM.YYYY
      safeTextForMatch.match(/(\d{2,4})[.\/-](\d{1,2})[.\/-](\d{1,2})/), // YYYY.MM.DD
      safeTextForMatch.match(/(\d{1,2})\s+(januar|februar|märz|april|mai|juni|juli|august|september|oktober|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+(\d{2,4})/i), // DD Month YYYY
    ];
    const monthNames: Record<string, number> = {
      'januar': 1, 'january': 1, 'jan': 1, 
      'februar': 2, 'february': 2, 'feb': 2, 
      'märz': 3, 'march': 3, 'mar': 3,
      'april': 4, 'apr': 4, 
      'mai': 5, 'may': 5, 
      'juni': 6, 'june': 6, 'jun': 6,
      'juli': 7, 'july': 7, 'jul': 7, 
      'august': 8, 'aug': 8, 
      'september': 9, 'sep': 9, 
      'oktober': 10, 'october': 10, 'oct': 10, 
      'november': 11, 'nov': 11, 
      'dezember': 12, 'december': 12, 'dec': 12
    };
    
    for (const dateMatch of dateFormats) {
      if (dateMatch) {
        let d: number, mo: number, y: number;
        if (dateMatch[2] && monthNames[dateMatch[2].toLowerCase()]) {
          // DD Month YYYY format
          d = parseInt(dateMatch[1], 10);
          mo = monthNames[dateMatch[2].toLowerCase()];
          y = parseInt(dateMatch[3], 10);
        } else if (parseInt(dateMatch[1], 10) > 31) {
          // YYYY.MM.DD format
          y = parseInt(dateMatch[1], 10);
          mo = parseInt(dateMatch[2], 10);
          d = parseInt(dateMatch[3], 10);
        } else {
          // DD.MM.YYYY format
          d = parseInt(dateMatch[1], 10);
          mo = parseInt(dateMatch[2], 10);
          y = parseInt(dateMatch[3], 10) + (parseInt(dateMatch[3], 10) < 100 ? 2000 : 0);
        }
        if (d >= 1 && d <= 31 && mo >= 1 && mo <= 12 && y >= 2020 && y <= 2030) {
          deadline = `${String(d).padStart(2,'0')}.${String(mo).padStart(2,'0')}.${y}`;
          break;
        }
      }
    }
    
    // Also check for deadline keywords with dates nearby
    if (!deadline) {
      const deadlineContext = safeTextForMatch.match(/(deadline|frist|einreichfrist|bewerbungsfrist|einsendefrist|antragsfrist)[\s:]+(?:bis\s+)?(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{2,4})/i);
      if (deadlineContext) {
        const d = parseInt(deadlineContext[2], 10);
        const mo = parseInt(deadlineContext[3], 10);
        const y = parseInt(deadlineContext[4], 10) + (parseInt(deadlineContext[4], 10) < 100 ? 2000 : 0);
        deadline = `${String(d).padStart(2,'0')}.${String(mo).padStart(2,'0')}.${y}`;
      }
    }
  }

  // Contacts - Enhanced patterns with better cleaning
  let emailMatches: IterableIterator<RegExpMatchArray>;
  try {
    emailMatches = safeTextForMatch.matchAll(/[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}/g);
  } catch (e) {
    // Fallback if matchAll fails
    const match = safeTextForMatch.match(/[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}/g);
    emailMatches = (match || []).map(m => [m] as RegExpMatchArray)[Symbol.iterator]();
  }
  const emails = Array.from(emailMatches)
    .map(m => {
      let email = m[0];
      // Enhanced: Better cleaning - stop at first non-email character after TLD
      // Pattern: capture email@domain.tld and stop before any letter/number that continues
      // Look for TLD (2-4 chars) followed by capital letter or number (start of next word)
      const betterClean = email.match(/^([a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+\.([a-z]{2,4}))(?=[A-Z0-9]|$)/i);
      if (betterClean && betterClean[1]) {
        return betterClean[1]; // Return cleaned email
      }
      // Fallback: Original method
      const tldMatch = email.match(/^(.+@[a-zA-Z0-9.-]+\.([a-z]{2,}))([^a-z0-9].*)?$/i);
      if (tldMatch && tldMatch[1]) {
        return tldMatch[1];
      }
      email = email.replace(/^(.+@.+\.[a-z]{2,})[^a-z0-9].*$/i, '$1');
      return email.trim();
    })
    .filter(e => {
      if (!e || !e.includes('@')) return false;
      // Basic validation: must have @ and a valid domain structure
      const parts = e.split('@');
      if (parts.length !== 2) return false;
      const domain = parts[1];
      if (!domain.includes('.')) return false;
      const tld = domain.split('.').pop();
      if (!tld || tld.length < 2) return false;
      // Exclude test/example domains
      if (e.includes('example.com') || e.includes('test@') || e.includes('noreply')) return false;
      // ENHANCED: Exclude date ranges anywhere in email (e.g., "2022-2026" mistaken as email)
      const emailLower = e.toLowerCase();
      // Filter date ranges like "2021-2027", "2020-2030"
      if (/\d{4}-\d{4}/.test(emailLower)) return false; // Any date range in email
      if (/^\d{4}-\d{4}@/.test(emailLower)) return false; // Date range before @
      // Filter if starts with year patterns
      if (/^(199\d|200\d|201\d|202\d|203\d)/.test(emailLower)) {
        // Allow if it's clearly an email (has @domain.tld structure)
        if (!/@[a-z0-9.-]+\.[a-z]{2,}/.test(emailLower)) {
          return false;
        }
      }
      // Filter emails that are just date ranges
      if (/^\d{4}-\d{2,4}$/.test(emailLower.split('@')[0])) return false;
      if (/^\d{4}-\d/.test(e)) return false; // Starts with numbers followed by dash
      // Valid email regex check
      const emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
      return emailRegex.test(e);
    });
  let contact_email = emails.length > 0 ? emails[0] : null;
  
  // Phone patterns - Austrian and international formats with better cleaning
  const phonePatterns = [
    /(?:\+43|0043|0)\s*(?:\(0\))?\s*(\d{1,4})[\s\/-]?(\d{3,4})[\s\/-]?(\d{3,8})/, // Austrian
    /(?:\+\d{1,3}[\s-]?)?(?:\(?\d{2,4}\)?[\s-]?)?(\d{3,4})[\s-]?(\d{3,8})/, // General
    /(\d{3,4})[\s\/-]?(\d{3,4})[\s\/-]?(\d{3,8})/ // Local format
  ];
  let contact_phone: string | null = null;
  for (const pattern of phonePatterns) {
    const match = safeTextForMatch.match(pattern);
    if (match) {
      let phone = match[0].trim();
      // Clean trailing invalid characters (common issue: +4350700Text)
      phone = phone.replace(/[^\d+\s\-()\/]+$/, '').trim();
      const digitsOnly = phone.replace(/\D/g, '');
      if (digitsOnly.length >= 7 && digitsOnly.length <= 15) {
        contact_phone = phone;
        break;
      }
    }
  }
  
  // ENHANCED: Extract contact info from HTML tables (if not found yet)
  if (!contact_email || !contact_phone) {
    try {
      $('table').each((_, table) => {
        const $table = $(table);
        $table.find('tr').each((_, row) => {
          const $row = $(row);
          const cells = $row.find('td, th').map((_, cell) => $(cell).text().trim()).get();
          if (cells.length >= 2) {
            const label = cells[0].toLowerCase();
            const value = cells[1];
            if (!contact_email && (label.includes('kontakt') || label.includes('contact') || label.includes('email') || 
                 label.includes('e-mail') || label.includes('phone') || label.includes('telefon') ||
                 label.includes('tel') || label.includes('ansprechpartner'))) {
              const emailMatch = value.match(/[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}/);
              if (emailMatch) {
                contact_email = emailMatch[0];
              }
            }
            if (!contact_phone && (label.includes('telefon') || label.includes('phone') || label.includes('tel') || 
                 label.includes('kontakt'))) {
              const phoneMatch = value.match(/(?:\+43|0043|0)\s*(?:\(0\))?\s*\d{1,4}[\s\/-]?\d{3,4}[\s\/-]?\d{3,8}/);
              if (phoneMatch) {
                contact_phone = phoneMatch[0].trim();
              }
            }
          }
        });
        if (contact_email && contact_phone) return false; // Break table loop
      });
    } catch (e) {
      // Ignore errors
    }
  }

  // Requirements: Extract all 18 categories using comprehensive extractor
  // PERFORMANCE: Add logging for large pages to debug slow extraction
  const textSize = (text || '').length;
  const htmlSize = (html || '').length;
  if (textSize > 100000 || htmlSize > 500000) {
    console.log(`    ⚠️  Large page: ${(textSize / 1024).toFixed(0)}KB text, ${(htmlSize / 1024).toFixed(0)}KB HTML - extraction may take longer`);
  }
  
  const categorized = await extractAllRequirements(text || '', html || '', url);

  // FORM-BASED APPLICATION DETECTION
  // Detect if application requires login/account or form-based submission
  const loginPatterns = [
    /(?:login|anmelden|registrieren|register|account|benutzerkonto|user account)/i,
    /(?:bewerbung|application)[\s]+(?:über|via|through)[\s]+(?:portal|system|plattform|platform)/i,
    /(?:online|digital)[\s]+(?:bewerbung|application)[\s]+(?:erforderlich|required|necessary)/i,
    /(?:erst|first)[\s]+(?:registrieren|register|anmelden|login)/i
  ];
  
  const hasLoginIndicator = loginPatterns.some(pattern => pattern.test(lower || ''));
  
  // Detect form fields in HTML
  let hasFormFields = false;
  let formFields: Array<{name?: string, label?: string, required: boolean}> = [];
  
  try {
    const inputs = $('input[type="text"], input[type="email"], select, textarea');
    if (inputs.length > 0) {
      hasFormFields = true;
      inputs.slice(0, 10).each((_, el) => {
        const $el = $(el);
        const name = $el.attr('name') || '';
        // const type = $el.attr('type') || $el.prop('tagName').toLowerCase(); // Unused
        const label = $el.prev('label').text().trim() || 
                     $el.closest('label').text().trim() ||
                     $el.attr('placeholder') || '';
        const required = $el.attr('required') !== undefined;
        
        if (name || label) {
          formFields.push({
            name: name.substring(0, 50),
            label: label.substring(0, 100),
            required
          });
        }
      });
    }
  } catch (e) {
    // Ignore errors
  }
  
  // Add application method to metadata
  if (hasLoginIndicator || hasFormFields) {
    metadata_json.application_method = hasLoginIndicator ? 'online_portal' : 'online_form';
    metadata_json.requires_account = hasLoginIndicator;
    if (formFields.length > 0) {
      metadata_json.form_fields = formFields.slice(0, 10);
    }
  }

  // ============================================================================
  // SMART DISCOVERIES: Intelligent extraction of program characteristics
  // ============================================================================
  
  // 1. STRUCTURED GEOGRAPHY: Extract country, region, subregion, city separately
  const structuredGeography = extractStructuredGeography(safeTextForMatch, categorized.geographic);
  if (structuredGeography) {
    metadata_json.geography = structuredGeography;
    // Also set region field if not already set (for backward compatibility)
    if (!metadata_json.region && structuredGeography.region) {
      metadata_json.region = structuredGeography.region;
    }
  }
  
  // 2. FUNDING TYPE: Detect from content (grant, loan, equity, guarantee, etc.)
  const fundingType = extractFundingType(safeTextForMatch);
  if (fundingType && !metadata_json.funding_type) {
    metadata_json.funding_type = fundingType;
  }
  
  // 3. INDUSTRY/SECTOR: Extract industry focus areas
  const industries = extractIndustries(safeTextForMatch);
  if (industries.length > 0) {
    metadata_json.industries = industries;
  }
  
  // 4. TECHNOLOGY FOCUS: Extract technology areas (AI, IoT, Blockchain, etc.)
  const techFocus = extractTechnologyFocus(safeTextForMatch);
  if (techFocus.length > 0) {
    metadata_json.technology_focus = techFocus;
  }
  
  // 5. PROGRAM TOPICS/THEMES: Extract program focus areas
  const topics = extractProgramTopics(safeTextForMatch);
  if (topics.length > 0) {
    metadata_json.program_topics = topics;
  }

  // 6. FUNDING AMOUNT STATUS: Track if amount is unknown/variable/requires contact
  if (funding_amount_status) {
    metadata_json.funding_amount_status = funding_amount_status;
  }

  return {
    title,
    description,
    funding_amount_min,
    funding_amount_max,
    currency: (funding_amount_min || funding_amount_max) ? 'EUR' : null,
    deadline,
    open_deadline,
    contact_email,
    contact_phone,
    categorized_requirements: categorized,
    metadata_json
  };
}

// ============================================================================
// REQUIREMENTS EXTRACTION (18 CATEGORIES)
// ============================================================================

export function initializeCategories(): Record<string, RequirementItem[]> {
  const categorized: Record<string, RequirementItem[]> = {};
  REQUIREMENT_CATEGORIES.forEach(category => {
    categorized[category] = [];
  });
  return categorized;
}

export async function extractAllRequirements(text: string, html?: string, url?: string): Promise<Record<string, RequirementItem[]>> {
  const categorized = initializeCategories();
  // Ensure text is always a valid string (matchAll requires a real string, not just String(obj))
  let safeText: string;
  if (typeof text === 'string') {
    safeText = text;
  } else if (text == null) {
    safeText = '';
  } else {
    safeText = String(text);
  }
  
  // PERFORMANCE: Limit text size for very large pages (prevent slow regex matching)
  // Many regex patterns can be very slow on large text - limit to 500KB
  const MAX_TEXT_SIZE = 500000; // 500KB limit for regex matching
  if (safeText.length > MAX_TEXT_SIZE) {
    // Keep first part (usually most relevant) and last part (often has summary)
    const firstPart = safeText.substring(0, MAX_TEXT_SIZE / 2);
    const lastPart = safeText.substring(safeText.length - MAX_TEXT_SIZE / 2);
    safeText = firstPart + '\n\n[... truncated ...]\n\n' + lastPart;
  }
  
  const lowerText = safeText.toLowerCase();
  
  // FIRST: Extract from structured HTML (tables, definition lists, sections)
  // PERFORMANCE: Limit HTML size for structured extraction too
  if (html && typeof html === 'string') {
    const htmlSize = html.length;
    const MAX_HTML_FOR_STRUCTURED = 1 * 1024 * 1024; // 1MB limit for structured extraction
    const htmlToProcess = htmlSize > MAX_HTML_FOR_STRUCTURED ? html.substring(0, MAX_HTML_FOR_STRUCTURED) : html;
    extractStructuredRequirements(htmlToProcess, categorized);
  }
  
  // IMPACT - ENHANCED: More patterns, broader matching, lower minimum length
  const impactNoisePatterns = [
    /\b(ffg|aws|aws|oekb|mci|auwa|forschungsförderungsgesellschaft|austrian\s*(?:science|research|business))\b/i,
    /\b(gmbh|mbh|inc\.|ltd\.|corporation)\b/i,
    /^[^.]*(?:is|sind|ist|are)\s+(?:the|die|der|das)\s+[^.]{0,30}(?:funding|förderung|institution)/i,
  ];
  
  // Broader impact patterns - ULTRA-RELAXED with more fallback patterns
  const impactMatches = [
    // Quantified impact (most valuable)
    ...safeMatchAll(safeText, /(?:reduces?|reduziert|verringert|senkt)\s+(?:co2|emissions?|emissionen)\s+(?:by|um)\s+(\d+%?|[^\.\n]{5,150})/gi),
    ...safeMatchAll(safeText, /(?:creates?|schafft|generiert)\s+(\d+)\s+(?:jobs?|arbeitsplätze|arbeitsstellen)/gi),
    ...safeMatchAll(safeText, /(?:saves?|spart|vermeidet)\s+(?:co2|emissions?|energy|energie)\s+(?:by|um)\s+(\d+%?|[^\.\n]{5,150})/gi),
    ...safeMatchAll(safeText, /(?:improves?|verbessert|steigert)\s+(?:sustainability|nachhaltigkeit|efficiency|effizienz)[\s:]+([^\.\n]{10,250})/gi),
    // Specific impact statements (with verbs) - broader, lower minimum
    ...safeMatchAll(safeText, /(?:nachhaltigkeit|sustainability)[\s:]+(?:wird|wird\s+fördert|wird\s+unterstützt|is\s+promoted|is\s+supported|fördert|promotes|supports)[\s:]+([^\.\n]{10,300})/gi),
    ...safeMatchAll(safeText, /(?:arbeitsplätze|jobs|employment|beschäftigung)[\s:]+(?:werden\s+geschaffen|werden\s+gefördert|are\s+created|are\s+supported|schafft|creates|fördert)[\s:]+([^\.\n]{10,250})/gi),
    // Impact with context (broader patterns, lower minimum)
    ...safeMatchAll(safeText, /(?:klima|climate|co2|emission|klimaschutz|umwelt|environment)[\s:]+([^\.\n]{15,300})/gi).filter(m => {
      const val = m[1] || '';
      return /(?:reduces?|reduziert|verringert|senkt|saves?|spart|vermeidet|improves?|verbessert|fördert|promotes|supports|schützt)/i.test(val);
    }),
    ...safeMatchAll(safeText, /(?:sozial|social|gesellschaft|society)[\s:]+([^\.\n]{15,250})/gi).filter(m => {
      const val = m[1] || '';
      return /(?:improves?|verbessert|unterstützt|supports|fördert|promotes|schafft|creates)/i.test(val);
    }),
    // Economic impact
    ...safeMatchAll(safeText, /(?:wirtschaftlich|economic|wirtschaft|economy)[\s:]+(?:impact|wirkung|auswirkung|beiträgt|contributes)[\s:]+([^\.\n]{10,250})/gi),
    // Generic impact patterns (MUCH BROADER - accept even without numbers if long enough)
    ...safeMatchAll(safeText, /(?:impact|wirkung|auswirkung|effekt|effect)[\s:]+([^\.\n]{15,300})/gi).filter(m => {
      const val = m[1] || '';
      return /(?:\d+%|\d+\s+(?:jobs?|arbeitsplätze)|reduces?|creates?|improves?|saves?|fördert|promotes|supports|schafft|verbessert)/i.test(val) ||
             val.length >= 30; // LOWERED from 50 - accept shorter descriptions
    }),
    // Impact verbs in general context
    ...safeMatchAll(safeText, /(?:fördert|promotes|supports|unterstützt|schafft|creates|verbessert|improves)[\s:]+(?:nachhaltigkeit|sustainability|klima|climate|umwelt|environment|sozial|social|arbeitsplätze|jobs)[\s:]+([^\.\n]{10,250})/gi),
    // NEW: Fallback patterns - catch more generic impact mentions
    ...safeMatchAll(safeText, /(?:ziel|goal|target|objective|zweck|purpose)[\s:]+(?:ist|sind|is|are|soll|sollen|muss|müssen)[\s:]+([^\.\n]{15,300})/gi).filter(m => {
      const val = m[1] || '';
      return /(?:nachhaltigkeit|sustainability|klima|climate|umwelt|environment|sozial|social|arbeitsplätze|jobs|impact|wirkung|innovation|innovation)/i.test(val);
    }),
    // NEW: Impact sections/headers
    ...safeMatchAll(safeText, /(?:impact|wirkung|auswirkung|effekt|ziel|goal)[\s:]+([^\.\n]{15,300})/gi).filter(m => {
      const val = m[1] || '';
      return val.length >= 20 && !val.toLowerCase().includes('required') && !val.toLowerCase().includes('specified');
    })
  ];
  
  // Process impact matches with MORE RELAXED filtering
  if (impactMatches.length > 0) {
    impactMatches.forEach(match => {
      if (match[1] && match[1].trim().length > 10) { // LOWERED from 15
        const value = match[1].trim();
        const cleaned = value.replace(/^(?:ist|sind|sein|werden|muss|müssen)[\s,]+/i, '').trim();
        
        // MORE RELAXED FILTERING: Accept shorter content, filter less aggressively
        const isNoise = impactNoisePatterns.some(pattern => pattern.test(cleaned)) ||
                       (cleaned.toLowerCase().includes('required') && cleaned.length < 30) || // LOWERED from 50
                       cleaned.length < 10 || // LOWERED from 15
                       cleaned.length > 500 || // Too long
                       /^(?:the|die|der|das|eine?|ein)\s+[^.]{0,30}(?:funding|förderung|institution|program)/i.test(cleaned) || // Institution descriptions
                       (/mbh|gmbh|inc\.|ltd\.|corporation/i.test(cleaned) && cleaned.length < 30); // LOWERED from 50
        
        if (!isNoise) {
          // FIX: Categorize impact into 4 types: environmental, social, economic, innovation
          const matchText = match[0].toLowerCase();
          const valueText = cleaned.toLowerCase();
          let impactType = 'impact_requirement';
          
          // Environmental impact
          if (matchText.includes('nachhaltigkeit') || matchText.includes('sustainability') ||
              matchText.includes('klima') || matchText.includes('climate') || 
              matchText.includes('co2') || matchText.includes('emission') ||
              matchText.includes('umwelt') || matchText.includes('environment') ||
              valueText.includes('co2') || valueText.includes('emission') ||
              valueText.includes('energy') || valueText.includes('energie')) {
            impactType = 'environmental_impact';
          } 
          // Social impact
          else if (matchText.includes('arbeitsplätze') || matchText.includes('jobs') || 
                   matchText.includes('beschäftigung') || matchText.includes('employment') ||
                   matchText.includes('sozial') || matchText.includes('social') ||
                   matchText.includes('community') || matchText.includes('gemeinschaft') ||
                   valueText.includes('jobs') || valueText.includes('arbeitsplätze') ||
                   valueText.includes('community') || valueText.includes('social')) {
            impactType = 'social_impact';
          }
          // Economic impact
          else if (matchText.includes('revenue') || matchText.includes('umsatz') ||
                   matchText.includes('growth') || matchText.includes('wachstum') ||
                   matchText.includes('economic') || matchText.includes('wirtschaftlich') ||
                   matchText.includes('market') || matchText.includes('markt') ||
                   valueText.includes('revenue') || valueText.includes('growth') ||
                   valueText.includes('economic') || valueText.includes('market')) {
            impactType = 'economic_impact';
          }
          // Innovation impact
          else if (matchText.includes('innovation') || matchText.includes('rd') ||
                   matchText.includes('research') || matchText.includes('forschung') ||
                   matchText.includes('development') || matchText.includes('entwicklung') ||
                   matchText.includes('technology') || matchText.includes('technologie') ||
                   valueText.includes('innovation') || valueText.includes('rd') ||
                   valueText.includes('research') || valueText.includes('technology')) {
            impactType = 'innovation_impact';
          }
          
          // Store in separate top-level category instead of as type
          const impactCategory = impactType; // e.g., 'environmental_impact', 'social_impact', etc.
          if (!categorized[impactCategory]) {
            categorized[impactCategory] = [];
          }
          categorized[impactCategory].push({
            type: impactType,
            value: cleaned,
            required: true,
            source: 'context_extraction'
          });
        }
      }
    });
  }
  
  // FALLBACK: If no impact extracted but impact keywords exist, extract any impact-related content
  const hasAnyImpact = (categorized['environmental_impact']?.length || 0) + 
                       (categorized['social_impact']?.length || 0) + 
                       (categorized['economic_impact']?.length || 0) + 
                       (categorized['innovation_impact']?.length || 0) > 0;
  if (!hasAnyImpact && (lowerText.includes('impact') || lowerText.includes('wirkung') || lowerText.includes('nachhaltigkeit') || lowerText.includes('sustainability') || lowerText.includes('ziel') || lowerText.includes('goal'))) {
    const fallbackMatches = [
      ...safeMatchAll(safeText, /(?:impact|wirkung|ziel|goal|nachhaltigkeit|sustainability)[\s:]+([^\.\n]{15,300})/gi),
      ...safeMatchAll(safeText, /(?:ziel|goal|objective|zweck|purpose)[\s]+(?:ist|sind|is|are)[\s:]+([^\.\n]{15,300})/gi)
    ];
    if (fallbackMatches.length > 0) {
      const bestFallback = fallbackMatches.find(m => {
        const val = m[1] || '';
        return val.trim().length >= 15 && 
               !val.toLowerCase().includes('required') && 
               !val.toLowerCase().includes('specified') &&
               (val.toLowerCase().includes('nachhaltigkeit') || 
                val.toLowerCase().includes('sustainability') ||
                val.toLowerCase().includes('klima') ||
                val.toLowerCase().includes('climate') ||
                val.toLowerCase().includes('sozial') ||
                val.toLowerCase().includes('social') ||
                val.toLowerCase().includes('wirtschaft') ||
                val.toLowerCase().includes('economic') ||
                val.toLowerCase().includes('innovation'));
      });
      if (bestFallback && bestFallback[1]) {
        const value = bestFallback[1].trim();
        if (value.length >= 15 && value.length < 500) {
          // Determine impact type
          const lowerVal = value.toLowerCase();
          let impactType = 'impact_requirement';
          if (lowerVal.includes('nachhaltigkeit') || lowerVal.includes('sustainability') || lowerVal.includes('klima') || lowerVal.includes('climate') || lowerVal.includes('co2')) {
            impactType = 'environmental_impact';
          } else if (lowerVal.includes('sozial') || lowerVal.includes('social') || lowerVal.includes('jobs') || lowerVal.includes('arbeitsplätze')) {
            impactType = 'social_impact';
          } else if (lowerVal.includes('wirtschaft') || lowerVal.includes('economic') || lowerVal.includes('revenue') || lowerVal.includes('umsatz')) {
            impactType = 'economic_impact';
          } else if (lowerVal.includes('innovation') || lowerVal.includes('research') || lowerVal.includes('forschung')) {
            impactType = 'innovation_impact';
          }
          // Store in separate top-level category instead of as type
          const impactCategory = impactType; // e.g., 'environmental_impact', 'social_impact', etc.
          if (!categorized[impactCategory]) {
            categorized[impactCategory] = [];
          }
          categorized[impactCategory].push({
            type: impactType,
            value: value,
            required: true,
            source: 'fallback_extraction'
          });
        }
      }
    }
  }
  
  // Don't add generic placeholders - only structured/context extraction
  
  // ELIGIBILITY - Enhanced: Extract actual eligibility criteria from context (CRITICAL CATEGORY)
  const eligibilityKeywords = [
    'teilnahmeberechtigt', 'voraussetzung', 'eligibility', 'berechtigt',
    'qualifiziert', 'anforderungen', 'kriterien', 'bedingungen', 'voraussetzungen',
    'antragsberechtigt', 'teilnahmevoraussetzung', 'bewerbungsvoraussetzung', 'qualifikation',
    // ENHANCED: Added missing keywords from diagnosis
    'zulassung', 'teilnahme', 'wer kann teilnehmen', 'wer kann beantragen', 
    'wer ist berechtigt', 'eligible', 'qualification', 'requirements', 'criteria',
    'who can apply', 'who can participate', 'who is eligible',
    // ADDITIONAL: More comprehensive keywords
    'wer darf teilnehmen', 'wer darf beantragen', 'wer darf sich bewerben',
    'teilnahmevoraussetzungen', 'bewerbungsvoraussetzungen', 'antragsberechtigung',
    'wer kann förderung erhalten', 'wer kann förderung beantragen',
    'qualifikationskriterien', 'teilnahmekriterien', 'bewerbungskriterien',
    'who can receive funding', 'who can apply for funding',
    'eligibility requirements', 'qualification requirements',
    'application requirements', 'participation requirements',
    'who may apply', 'who may participate', 'who qualifies'
  ];
  
  // More aggressive patterns: shorter minimum length (15 chars) and more context variations
  const eligibilityMatches = [
    ...safeMatchAll(safeText, /(?:teilnahmeberechtigt|voraussetzung|voraussetzungen|eligibility|anforderungen|kriterien|bedingungen|berechtigt|qualifiziert|teilnahmevoraussetzung|bewerbungsvoraussetzung|antragsberechtigt|teilnahmevoraussetzungen|bewerbungsvoraussetzungen|antragsberechtigung)[\s:]+([^\.\n]{15,500})/gi),
    ...safeMatchAll(safeText, /(?:wer|who|wer kann|who can|wer darf|who is eligible|wer ist berechtigt|wer darf teilnehmen|wer darf beantragen|wer darf sich bewerben|wer kann förderung erhalten|wer kann förderung beantragen)[\s:]+([^\.\n]{15,500})/gi),
    ...safeMatchAll(safeText, /(?:qualifikationskriterien|teilnahmekriterien|bewerbungskriterien|eligibility requirements|qualification requirements|application requirements|participation requirements)[\s:]+([^\.\n]{15,500})/gi),
    ...safeMatchAll(safeText, /(?:teilnehmen|participate|apply|sich bewerben|bewerben|application)[\s]+(?:können|can|dürfen|may|soll|should|muss|must)[\s:]+([^\.\n]{15,500})/gi),
    ...safeMatchAll(safeText, /(?:bewerben|bewerber|applicant|teilnehmer|participant|antragsteller)[\s]+(?:muss|müssen|soll|sollen|darf|dürfen|ist|sind|muss erfüllen|have to|need to)[\s:]+([^\.\n]{15,500})/gi),
    ...safeMatchAll(safeText, /(?:antragsberechtigt|application.eligible|eligible.for|berechtigt sind|qualifiziert sind)[\s:]+([^\.\n]{15,500})/gi),
    ...safeMatchAll(safeText, /(?:voraussetzung|requirement|voraussetzungen|requirements)[\s]+(?:für|for|zur|zur Teilnahme|für die Bewerbung|to apply|to participate)[\s:]+([^\.\n]{15,500})/gi),
    // Additional: eligibility sections and headers
    ...safeMatchAll(safeText, /(?:teilnahmevoraussetzungen|eligibility requirements|voraussetzungen für|requirements for)[\s:]+([^\.\n]{15,500})/gi),
    // List-based patterns (common in eligibility sections)
    ...safeMatchAll(safeText, /(?:voraussetzungen|requirements|eligibility)[\s:]+(?:\n|•|-|\d+\.)\s*([^\.\n]{15,500})/gi)
  ];
  
  // LEARNING: Try learned eligibility patterns first - FIX: Make it synchronous for better quality improvement
  // On retry, learned patterns should be used to improve extraction
  try {
    const { getLearnedPatterns } = require('./extract-learning');
    const host = url ? new URL(url).hostname.replace('www.', '') : undefined;
    // FIX: Use await to ensure learned patterns are applied before extraction
    const learnedPatterns = await getLearnedPatterns('eligibility', host).catch(() => []);
    for (const learnedPattern of learnedPatterns.slice(0, 5)) { // Limit to top 5 patterns
      try {
        const regex = new RegExp(learnedPattern.pattern, 'gi');
        const match = safeText.match(regex);
        if (match) {
          // Add to matches if not already present
          eligibilityMatches.push(match as RegExpMatchArray);
          const { learnFromExtraction } = require('./extract-learning');
          learnFromExtraction('eligibility', learnedPattern.pattern, true, host).catch(() => {});
        }
      } catch {}
    }
  } catch {}
  
  if (eligibilityMatches.length > 0) {
    // Sort by length to get most detailed match
    const sortedMatches = eligibilityMatches
      .filter(m => m[1] && m[1].trim().length > 20)
      .sort((a, b) => b[1].trim().length - a[1].trim().length);
    
    const bestMatch = sortedMatches[0];
    if (bestMatch && bestMatch[1]) {
      const value = bestMatch[1].trim();
      let cleaned = value.replace(/^(?:sind|sollen|müssen|dürfen|müssen|ist|werden|kann|können)[\s,]+/i, '').trim();
      cleaned = cleaned.replace(/^(?:teilnahmeberechtigt|voraussetzung|eligibility|anforderungen)[\s:]+/i, '').trim();
      
      // Extract list if present (often eligibility is in list format)
      if (cleaned.includes('•') || cleaned.includes('-') || cleaned.match(/^\d+\./)) {
        const listItems = cleaned.split(/[•\-]\s*|\n\d+\.\s*/).filter(item => item.trim().length > 10);
        if (listItems.length > 0) {
          cleaned = listItems.slice(0, 5).map(item => item.trim()).join('; ');
        }
      }
      
      // CRITICAL CATEGORY - improved filtering for meaningful eligibility criteria
      // Require minimum 20 chars for meaningful content (increased from 15)
      const isGeneric = cleaned.toLowerCase().includes('specified') || 
                       cleaned.toLowerCase().includes('available') ||
                       cleaned.toLowerCase().includes('see below') ||
                       cleaned.toLowerCase() === 'required' ||
                       cleaned.toLowerCase() === 'not specified' ||
                       /^(?:the|die|der|das)\s+(?:program|programm|funding|förderung)/i.test(cleaned) ||
                       cleaned.length < 20; // Minimum meaningful length
      
      if (!isGeneric && cleaned.length < 500) {
        // FIX: Split eligibility into company_type, company_stage, industry_restriction
        const categorizeEligibility = (text: string): { type: string, value: string } | null => {
          const lower = text.toLowerCase();
          
          // Company Types
          const companyTypePatterns = [
            { pattern: /\b(sme|small\s+and\s+medium\s+enterprise|kleine?\s+und\s+mittlere?\s+unternehmen|km[ui])\b/i, value: 'SMEs' },
            { pattern: /\b(startup|start-up|neugründung|neugruendung)\b/i, value: 'Startups' },
            { pattern: /\b(einzelunternehmer|sole\s+proprietor|sole\s+trader|freelancer|freiberufler)\b/i, value: 'Solo founder' },
            { pattern: /\b(established\s+company|etabliertes\s+unternehmen|established\s+business)\b/i, value: 'Established companies' },
            { pattern: /\b(unternehmen|company|business|firm|firma)\b/i, value: 'Companies' }
          ];
          
          // Company Stages
          const companyStagePatterns = [
            { pattern: /\b(idea\s+stage|ideenstadium|konzeptphase|concept\s+stage|ideation)\b/i, value: 'Idea stage' },
            { pattern: /\b(poc|proof\s+of\s+concept|machbarkeitsstudie|feasibility)\b/i, value: 'PoC' },
            { pattern: /\b(seed|seed\s+stage|seedphase)\b/i, value: 'Seed' },
            { pattern: /\b(early\s+stage|frühe\s+phase|early\s+phase)\b/i, value: 'Early stage' },
            { pattern: /\b(expanding|wachstum|growth|scaling|scale)\b/i, value: 'Expanding' },
            { pattern: /\b(growth\s+stage|wachstumsphase)\b/i, value: 'Growth stage' },
            { pattern: /\b(scale\s+stage|skalierungsphase)\b/i, value: 'Scale stage' }
          ];
          
          // Industry Restrictions
          const industryPatterns = [
            { pattern: /\b(technology|technologie|tech|it|software|hardware)\b/i, value: 'Technology companies' },
            { pattern: /\b(manufacturing|produktion|industrie|industrial)\b/i, value: 'Manufacturing' },
            { pattern: /\b(services|dienstleistungen|service)\b/i, value: 'Services' },
            { pattern: /\b(digital|digitalization|digitalisierung)\b/i, value: 'Digital services' },
            { pattern: /\b(healthcare|gesundheitswesen|health)\b/i, value: 'Healthcare' },
            { pattern: /\b(energy|energie|renewable|erneuerbar)\b/i, value: 'Energy' }
          ];
          
          // Try to match company type first
          for (const { pattern, value } of companyTypePatterns) {
            if (pattern.test(lower)) {
              return { type: 'company_type', value };
            }
          }
          
          // Try to match company stage
          for (const { pattern, value } of companyStagePatterns) {
            if (pattern.test(lower)) {
              return { type: 'company_stage', value };
            }
          }
          
          // Try to match industry
          for (const { pattern, value } of industryPatterns) {
            if (pattern.test(lower)) {
              return { type: 'industry_restriction', value };
            }
          }
          
          // If no specific match, check if it's a generic eligibility criteria
          if (text.length > 20 && text.length < 300) {
            return { type: 'eligibility_criteria', value: text };
          }
          
          return null;
        };
        
        // Extract multiple eligibility criteria if present (lists)
        if (cleaned.includes(';') || cleaned.includes('•') || cleaned.includes('-') || cleaned.match(/\d+\./)) {
          const items = cleaned.split(/[;•\-]|\n\d+\./).map(item => item.trim()).filter(item => item.length > 10);
          if (items.length > 1) {
            // Add each as separate requirement, categorized by type
            items.slice(0, 10).forEach(item => {
              if (item.length > 15 && item.length < 300) {
                const categorizedElig = categorizeEligibility(item);
                if (categorizedElig) {
                  // Check for duplicates
                  // Check for duplicates in the specific eligibility category
                  const eligCategory = categorizedElig.type;
                  const isDuplicate = (categorized[eligCategory] || []).some((e: any) => 
                    e.type === categorizedElig.type && e.value.toLowerCase() === categorizedElig.value.toLowerCase()
                  );
                  if (!isDuplicate) {
                    // Store in separate top-level category
                    const eligCategory = categorizedElig.type; // e.g., 'company_type', 'company_stage', etc.
                    if (!categorized[eligCategory]) {
                      categorized[eligCategory] = [];
                    }
                    categorized[eligCategory].push({
                      type: categorizedElig.type as any,
                      value: categorizedElig.value,
                      required: true,
                      source: 'context_extraction'
                    });
                  }
                }
              }
            });
          } else {
            const categorizedElig = categorizeEligibility(cleaned);
            if (categorizedElig) {
              // Store in separate top-level category
              const eligCategory = categorizedElig.type;
              if (!categorized[eligCategory]) {
                categorized[eligCategory] = [];
              }
              categorized[eligCategory].push({
                type: categorizedElig.type as any,
                value: categorizedElig.value,
                required: true,
                source: 'context_extraction'
              });
            }
          }
        } else {
          const categorizedElig = categorizeEligibility(cleaned);
          if (categorizedElig) {
            // Store in separate top-level category
            const eligCategory = categorizedElig.type;
            if (!categorized[eligCategory]) {
              categorized[eligCategory] = [];
            }
            categorized[eligCategory].push({
              type: categorizedElig.type as any,
              value: categorizedElig.value,
              required: true,
              source: 'context_extraction'
            });
          }
        }
      }
    }
  }
  
  // FALLBACK: If no eligibility extracted but eligibility keywords exist, extract any eligibility-related content
  const hasAnyEligibility = (categorized['company_type']?.length || 0) + 
                            (categorized['company_stage']?.length || 0) + 
                            (categorized['industry_restriction']?.length || 0) + 
                            (categorized['eligibility_criteria']?.length || 0) > 0;
  if (!hasAnyEligibility && (lowerText.includes('eligibility') || lowerText.includes('voraussetzung') || lowerText.includes('berechtigt') || lowerText.includes('qualifiziert') || lowerText.includes('who can') || lowerText.includes('wer kann'))) {
    const fallbackMatches = [
      ...safeMatchAll(safeText, /(?:eligibility|voraussetzung|berechtigt|qualifiziert|who can|wer kann)[\s:]+([^\.\n]{15,300})/gi),
      ...safeMatchAll(safeText, /(?:wer|who)[\s]+(?:kann|can|darf|may|ist|is)[\s]+(?:teilnehmen|participate|bewerben|apply|berechtigt|eligible)[\s:]+([^\.\n]{15,300})/gi)
    ];
    if (fallbackMatches.length > 0) {
      const bestFallback = fallbackMatches.find(m => {
        const val = m[1] || '';
        return val.trim().length >= 15 && 
               !val.toLowerCase().includes('required') && 
               !val.toLowerCase().includes('specified');
      });
      if (bestFallback && bestFallback[1]) {
        const value = bestFallback[1].trim();
        if (value.length >= 15 && value.length < 500) {
          // Store in separate top-level category
          if (!categorized['eligibility_criteria']) {
            categorized['eligibility_criteria'] = [];
          }
          categorized['eligibility_criteria'].push({
            type: 'eligibility_criteria',
            value: value,
            required: true,
            source: 'fallback_extraction'
          });
        }
      }
    }
  }
  
  // ENHANCED: Also extract from heading sections (eligibility is often in dedicated sections)
  if (html && typeof html === 'string') {
    try {
      const cheerio = require('cheerio');
      const $h = cheerio.load(html);
      // Look for headings that indicate eligibility sections
      const eligibilityHeadings = $h('h1, h2, h3, h4').filter((_: any, el: any) => {
        const text = $h(el).text().toLowerCase();
        return eligibilityKeywords.some(k => text.includes(k)) ||
               /teilnahmevoraussetzung|eligibility|voraussetzung/i.test(text);
      });
      
      eligibilityHeadings.each((_: any, heading: any) => {
        const $heading = $h(heading);
        const sectionText = $heading.nextUntil('h1, h2, h3').text().trim();
        if (sectionText.length > 15 && sectionText.length < 500) {
          // Extract first meaningful paragraph
          const firstPara = sectionText.split('\n').find((p: string) => p.trim().length > 15) || sectionText.substring(0, 300);
          if (firstPara && !firstPara.toLowerCase().includes('specified') && !firstPara.toLowerCase().includes('see below')) {
            // Store in separate top-level category
            if (!categorized['eligibility_criteria']) {
              categorized['eligibility_criteria'] = [];
            }
            categorized['eligibility_criteria'].push({
              type: 'eligibility_criteria',
              value: firstPara.trim(),
              required: true,
              source: 'heading_section'
            });
          }
        }
      });
    } catch (e) {
      // Ignore errors in HTML parsing
    }
  }
  
  // Also extract specific eligibility types - but make them meaningful with context
  const hasAnyEligibility2 = (categorized['company_type']?.length || 0) + 
                             (categorized['company_stage']?.length || 0) + 
                             (categorized['industry_restriction']?.length || 0) + 
                             (categorized['eligibility_criteria']?.length || 0) > 0;
  if (eligibilityKeywords.some(k => lowerText.includes(k)) && !hasAnyEligibility2) {
    // Only add if we have more context (multiple mentions or specific context)
    const hasStartupContext = (lowerText.match(/startup|neugründung|start-up/g) || []).length >= 2 ||
                               /(?:für|for)\s+(?:startups|start-ups|neugründungen)/i.test(safeText);
    if (hasStartupContext && (lowerText.includes('startup') || lowerText.includes('neugründung') || lowerText.includes('start-up'))) {
      if (!categorized['company_type']) {
        categorized['company_type'] = [];
      }
      categorized['company_type'].push({
        type: 'company_type',
        value: 'Program specifically designed for startups and new ventures',
        required: true,
        source: 'eligibility_section'
      });
    }
    
    const hasCompanyContext = (lowerText.match(/unternehmen|firma|company|betrieb/g) || []).length >= 2 ||
                              /(?:für|for)\s+(?:unternehmen|companies|firmen)/i.test(safeText);
    if (hasCompanyContext && (lowerText.includes('unternehmen') || lowerText.includes('firma') || lowerText.includes('company') || lowerText.includes('betrieb'))) {
      if (!categorized['company_type']) {
        categorized['company_type'] = [];
      }
      categorized['company_type'].push({
        type: 'company_type',
        value: 'Company',
        required: true,
        source: 'eligibility_section'
      });
    }
    
    if (lowerText.includes('kmu') || lowerText.includes('sme') || lowerText.includes('klein- und mittelbetrieb') || lowerText.includes('mittelstand')) {
      if (!categorized['company_type']) {
        categorized['company_type'] = [];
      }
      categorized['company_type'].push({
        type: 'company_type',
        value: 'SME',
        required: true,
        source: 'eligibility_section'
      });
    }
  }
  
  // COMPANY STAGE - Extract development/stage requirements (ide, seed, series-a, etc.)
  const stageMatches = [
    ...safeMatchAll(safeText, /(?:stage|stadium|phase|phase|entwicklungsstand|reifegrad|startup.stage|company.stage)[\s:]+([^\.\n]{5,200})/gi),
    ...safeMatchAll(safeText, /(?:ide|idea|konzept|concept|prototyp|prototype|mvp|minimum viable product)[\s:]+([^\.\n]{5,200})/gi),
    ...safeMatchAll(safeText, /(?:seed|pre-seed|preseed|early.stage|frühe.phase)[\s:]+([^\.\n]{5,200})/gi),
    ...safeMatchAll(safeText, /(?:series.[a-c]|series-a|series-b|series-c|wachstum|growth|scale|skalierung)[\s:]+([^\.\n]{5,200})/gi),
    ...safeMatchAll(safeText, /(?:für|for|gilt für|available for)[\s]+(?:ide|seed|series|early|late)[\s]+(?:stage|phase|startups|unternehmen)[\s:]+([^\.\n]{5,200})/gi),
    ...safeMatchAll(safeText, /(?:geeignet für|suitable for|target)[\s]+(?:ide|seed|series|early|late|growth)[\s:]+([^\.\n]{5,200})/gi)
  ];
  
  if (stageMatches.length > 0) {
    const sortedMatches = stageMatches
      .filter(m => m[1] && m[1].trim().length > 3)
      .sort((a, b) => b[1].trim().length - a[1].trim().length);
    
    const bestMatch = sortedMatches[0];
    if (bestMatch && bestMatch[1]) {
      const value = bestMatch[1].trim();
      let cleaned = value.replace(/^(?:sind|soll|muss|müssen|darf|dürfen|ist|werden|kann|können|required|erforderlich|geeignet|suitable)[\s,]+/i, '').trim();
      cleaned = cleaned.replace(/^(?:für|for|gilt für|available for)[\s:]+/i, '').trim();
      
      // Normalize common stage terms
      const lowerCleaned = cleaned.toLowerCase();
      let normalizedStage = cleaned;
      if (/ide|idea|konzept|concept/.test(lowerCleaned)) {
        normalizedStage = 'Ideation / Concept Stage';
      } else if (/prototyp|prototype|mvp|minimum viable/.test(lowerCleaned)) {
        normalizedStage = 'Prototype / MVP Stage';
      } else if (/seed|pre-seed|preseed|early.stage|frühe/.test(lowerCleaned)) {
        normalizedStage = 'Seed / Early Stage';
      } else if (/series-a|series.a/.test(lowerCleaned)) {
        normalizedStage = 'Series A';
      } else if (/series-b|series.b/.test(lowerCleaned)) {
        normalizedStage = 'Series B';
      } else if (/series-c|series.c|growth|wachstum|scale/.test(lowerCleaned)) {
        normalizedStage = 'Growth / Scale Stage';
      }
      
      // Only add if meaningful (length >= 20) or it's a normalized stage
      const isNormalized = normalizedStage !== cleaned;
      const isMeaningful = cleaned.length >= 20 || isNormalized;
      
      if (isMeaningful && cleaned.length > 3 && cleaned.length < 300 && !cleaned.toLowerCase().includes('required') && !cleaned.toLowerCase().includes('specified')) {
        if (!categorized['company_stage']) {
          categorized['company_stage'] = [];
        }
        categorized['company_stage'].push({
          type: 'company_stage',
          value: normalizedStage.length < 100 ? normalizedStage : cleaned,
          required: false,
          source: 'context_extraction'
        });
      }
    }
  }
  
  // Also detect stage keywords directly
  const stageKeywords = [
    { keywords: ['ide', 'idea', 'konzept', 'concept'], value: 'Ideation / Concept Stage' },
    { keywords: ['prototyp', 'prototype', 'mvp', 'minimum viable'], value: 'Prototype / MVP Stage' },
    { keywords: ['seed', 'pre-seed', 'preseed', 'early stage', 'frühe phase'], value: 'Seed / Early Stage' },
    { keywords: ['series-a', 'series a'], value: 'Series A' },
    { keywords: ['series-b', 'series b'], value: 'Series B' },
    { keywords: ['series-c', 'series c', 'growth', 'scale'], value: 'Growth / Scale Stage' }
  ];
  
  stageKeywords.forEach(({ keywords, value }) => {
    if (keywords.some(k => lowerText.includes(k.toLowerCase())) && 
        !(categorized['company_stage'] || []).some((e: any) => e.type === 'company_stage')) {
      if (!categorized['company_stage']) {
        categorized['company_stage'] = [];
      }
      categorized['company_stage'].push({
        type: 'company_stage',
        value: value,
        required: false,
        source: 'full_page_content'
      });
    }
  });
  
  // DOCUMENTS - Enhanced: Extract actual document lists from context with more depth and better patterns
  const docMatches = [
    ...safeMatchAll(safeText, /(?:unterlagen|dokumente|bewerbung|antrag|nachweis|document|application|formulare|belege|antragsunterlagen|bewerbungsunterlagen)[\s:]+([^\.\n]{20,400})/gi),
    ...safeMatchAll(safeText, /(?:erforderlich|required|benötigt|notwendig|mitzubringen|einzureichen|beizufügen|beizulegen)[\s:]+([^\.\n]{20,400})/gi),
    ...safeMatchAll(safeText, /(?:folgende|following|nachfolgende)[\s]+(?:unterlagen|dokumente|belege|nachweise|dokumentation)[\s:]+([^\.\n]{20,400})/gi),
    ...safeMatchAll(safeText, /(?:bitte|please)[\s]+(?:reichen|submit|send|provide|einzureichen|beizufügen)[\s]+(?:sie|you|folgende|the following|ein)[\s:]+([^\.\n]{20,400})/gi),
    ...safeMatchAll(safeText, /(?:einreichen|submit|send|provide|beifügen)[\s]+(?:sie|bitte|please)?[\s]+(?:folgende|the following|nachfolgende|einige)[\s]+(?:unterlagen|dokumente)[\s:]+([^\.\n]{20,400})/gi),
    ...safeMatchAll(safeText, /(?:checkliste|checklist|liste|list)[\s]+(?:für|for|der|of)[\s]+(?:unterlagen|dokumente|bewerbung)[\s:]+([^\.\n]{20,400})/gi)
  ];
  
  // Process all matches, not just the first one
  const validDocMatches = docMatches
    .filter(m => m[1] && m[1].trim().length > 20)
    .map(m => {
      const value = m[1].trim();
      const cleaned = value.replace(/^(?:sind|sollen|müssen|benötigt|notwendig|erforderlich|required)[\s,]+/i, '').trim();
      return { value: cleaned, original: value };
    })
    .filter(item => item.value.length > 20 && item.value.length < 500);
  
  // Check if it looks like a document list - Enhanced detection
  validDocMatches.forEach(item => {
    const hasDocTerms = /businessplan|business\s+plan|cv|lebenslauf|curriculum|vitae|antrag|prototyp|finanzplan|financial\s+plan|pitch|deck|unterlagen|dokumente|formular|nachweis|zeugnis|referenz|portfolio|konzept|exposé|projektbeschreibung|project\s+description|geschäftsmodell|business\s+model|meilenstein|milestone/i.test(item.value);
    const hasListStructure = item.value.includes(',') || item.value.includes(';') || item.value.includes('•') || item.value.includes('-') || item.value.includes('\n') || item.value.split(/\s+/).length > 5;
    // Check for document-specific indicators
    const hasDocumentIndicators = /(?:max|maximal|bis zu|up to|format|als|in)\s*(?:\d+|pdf|doc|docx|word|mb|kb|seiten|pages)/i.test(item.value);
    
    if (hasDocTerms || (hasListStructure && hasDocumentIndicators)) {
      // Don't add duplicates
      const isDuplicate = categorized.documents.some(d => {
        const similarity = d.value.toLowerCase().includes(item.value.substring(0, 30).toLowerCase()) ||
                          item.value.toLowerCase().includes(d.value.substring(0, 30).toLowerCase());
        return similarity;
      });
      
      if (!isDuplicate) {
        // FIX: Split comma-separated lists and bullet points into individual documents
        const splitDocuments = (docText: string): string[] => {
          // Split by comma, semicolon, bullet points, or newlines
          const separators = /[,\n;•\-]|\d+\.\s+/;
          const items = docText.split(separators)
            .map(item => item.trim())
            .filter(item => item.length > 3 && item.length < 200);
          
          // If we got multiple items, return them
          if (items.length > 1) {
            return items;
          }
          
          // If single item, return as is
          return [docText];
        };
        
        const documents = splitDocuments(item.value);
        
        documents.forEach(doc => {
          // Try to extract format if present
          const formatMatch = doc.match(/(?:format|als|in|max\.?|maximal)\s*([^,;:]+(?:pdf|doc|docx|page|seite|mb|kb|format)[^,;:]*(?:,|;|$)?)/i);
          const format = formatMatch ? formatMatch[1].trim() : undefined;
          
          // Check for duplicates again
          const isDocDuplicate = categorized.documents.some(d => 
            d.value.toLowerCase() === doc.toLowerCase() ||
            (d.value.toLowerCase().includes(doc.toLowerCase().substring(0, 20)) && Math.abs(d.value.length - doc.length) < 10)
          );
          
          if (!isDocDuplicate) {
            categorized.documents.push({
              type: 'documents_required',
              value: doc.substring(0, 200), // Limit length
              required: true,
              source: 'context_extraction',
              format: format
            });
          }
        });
      }
    }
  });
  
  // Fallback: Keyword-based document detection (expanded)
  const docTerms = [
    'pitch deck', 'businessplan', 'antragsformular', 'finanzplan', 'cv', 'lebenslauf',
    'prototyp', 'meilensteinplan', 'projektbeschreibung', 'geschäftsmodell',
    'bewerbung', 'antrag', 'unterlagen', 'dokumente', 'nachweis', 'zeugnis',
    'referenz', 'portfolio', 'konzept', 'exposé', 'unternehmenskonzept',
    'marktanalyse', 'market analysis', 'konkurrenzanalyse', 'competitor analysis',
    'finanzierungsplan', 'funding plan', 'cashflow', 'cash flow', 'prognose',
    'forecast', 'prognose', 'bilanzen', 'balance sheet', 'guv', 'p&l',
    'rechnungslegung', 'accounting', 'steuerbescheid', 'tax certificate',
    'handelsregisterauszug', 'commercial register', 'gesellschaftsvertrag',
    'articles of association', 'patent', 'patent', 'marke', 'trademark',
    'zertifikat', 'certificate', 'akkreditierung', 'accreditation'
  ];
  const foundDocs = docTerms.filter(t => lowerText.includes(t));
  if (foundDocs.length > 0 && !categorized.documents.some(d => d.source === 'context_extraction')) {
    categorized.documents.push({
      type: 'documents_required',
      value: foundDocs.slice(0, 5).join(', '),
      required: true,
      source: 'full_page_content'
    });
  }
  
  // CO-FINANCING - Enhanced: More comprehensive extraction with more patterns
  const coFinancingKeywords = [
    'eigenmittel', 'eigenkapital', 'co-financing', 'cofinanzierung', 
    'eigenanteil', 'mitfinanzierung', 'eigenbeitrag', 'selbstfinanzierung',
    'eigenfinanzierung', 'cofinancing', 'eigenfinanzierung', 'anteil', 'eigenbeitrag',
    'selbstbehalt', 'eigenleistung', 'eigenquote', 'matching funds', 'counterpart funding'
  ];
  
  // Pattern 1: Percentage with keywords (e.g., "30% eigenmittel", "eigenanteil von 50%")
  const coFinancingMatches = [
    ...safeMatchAll(safeText, /(\d{1,3})[%\s]*(?:eigen|co-financ|mitfinanz|eigenbeitrag|eigenanteil|selbstfinanz|selbstbehalt|eigenleistung)/i),
    ...safeMatchAll(safeText, /(?:eigenmittel|eigenanteil|eigenkapital|mitfinanzierung|co-financ|eigenbeitrag|selbstbehalt)[\s:]+(?:von|of|bis|up to|min\.?|minimal|mindestens|at least|beträgt|betragen|is|are)[\s:]*(\d{1,3})[%\s]*/gi),
    ...safeMatchAll(safeText, /(?:eigenmittel|eigenanteil|eigenkapital|mitfinanzierung)[\s]+(?:von|of|beträgt|betragen|is|are|in höhe von|in the amount of)[\s]+(?:von\s+)?(\d{1,3})[%\s]*/gi),
    ...safeMatchAll(safeText, /(\d{1,3})[%\s]*(?:eigen|co-financ|mitfinanz|eigenbeitrag|eigenanteil)[\s]*(?:erforderlich|required|notwendig|notwendig|muss|müssen)/i),
    ...safeMatchAll(safeText, /(?:minimum|mindestens|at least|minimal)[\s]+(\d{1,3})[%\s]*(?:eigen|eigenmittel|eigenanteil|eigenkapital)/i),
    ...safeMatchAll(safeText, /(?:financing|finanzierung)[\s]+(?:ratio|verhältnis|quote)[\s:]+(\d{1,3})[%\s]*(?:eigen|eigenmittel)/i),
    ...safeMatchAll(safeText, /(?:funding|förderung)[\s]+(?:covers|deckt|abdeckt)[\s]+(\d{1,3})[%\s]*(?:of|von|der)/i),
    ...safeMatchAll(safeText, /(\d{1,3})[%\s]*(\d{1,3})[%\s]*/gi).filter(m => {
      // Check if context mentions co-financing
      const context = safeText.substring(Math.max(0, safeText.indexOf(m[0]) - 50), safeText.indexOf(m[0]) + 50).toLowerCase();
      return context.includes('eigen') || context.includes('co-financ') || context.includes('mitfinanz');
    })
  ];
  
  if (coFinancingMatches.length > 0 || coFinancingKeywords.some(keyword => lowerText.includes(keyword))) {
    let bestPercentage: string | null = null;
    
    // Extract all percentage values
    const percentages: number[] = [];
    coFinancingMatches.forEach(match => {
      const pct = parseInt(match[1] || match[2] || '0', 10);
      if (pct > 0 && pct <= 100) {
        percentages.push(pct);
      }
    });
    
    if (percentages.length > 0) {
      // Use most common or highest percentage
      bestPercentage = Math.max(...percentages).toString() + '%';
    } else {
      // Check for percentage patterns near keywords
      const nearPercentage = text.match(/(?:eigenmittel|eigenanteil|eigenkapital|mitfinanzierung)[^.]{0,50}?(\d{1,3})[%\s]/i);
      if (nearPercentage) {
        const pct = parseInt(nearPercentage[1], 10);
        if (pct > 0 && pct <= 100) {
          bestPercentage = pct.toString() + '%';
        }
      }
    }
    
    if (bestPercentage || coFinancingKeywords.some(keyword => lowerText.includes(keyword))) {
      // Only add if we have a meaningful percentage, not generic "required"
      if (bestPercentage) {
        categorized.co_financing.push({
          type: 'co_financing_percentage',
          value: `Co-financing requirement: ${bestPercentage}`,
          required: true,
          source: 'context_extraction'
        });
      } else {
        // Extract context around co-financing keywords to make it meaningful
        const contextMatch = safeText.match(/(?:eigenmittel|eigenanteil|eigenkapital|mitfinanzierung|co-financ)[^.]{0,100}/i);
        if (contextMatch && contextMatch[0].length > 20) {
          categorized.co_financing.push({
            type: 'co_financing_percentage',
            value: contextMatch[0].trim(),
            required: true,
            source: 'context_extraction'
          });
        }
      }
    }
  }
  
  // TRL LEVEL - Enhanced: More comprehensive extraction with more patterns
  // IMPROVED: Expanded patterns to increase coverage from 0.7%
  const trlKeywords = [
    'trl', 'technology readiness', 'reifegrad', 'technologiereifegrad',
    'technology readiness level', 'trl-level', 'trl level', 'technology maturity',
    'tech readiness', 'tech readiness level', 'reifegradstufe', 'technology reifegrad',
    'maturity level', 'reifegradstufe', 'technology readiness level'
  ];
  
  // Pattern 1: TRL X or TRL X-Y (more flexible patterns - expanded)
  const trlMatches = [
    ...safeMatchAll(safeText, /trl[\s\-]?level?[\s\-]?(\d{1})[\s\-]?[–-]?[\s\-]?(\d{1})?/gi),
    ...safeMatchAll(safeText, /trl[\s\-]?(\d{1})[\s\-]?[–-]?[\s\-]?(\d{1})?/gi),
    ...safeMatchAll(safeText, /technology[\s]+readiness[\s]+level[\s\-]?(\d{1})[\s\-]?[–-]?[\s\-]?(\d{1})?/gi),
    ...safeMatchAll(safeText, /reifegrad[\s\-]?(\d{1})[\s\-]?[–-]?[\s\-]?(\d{1})?/gi),
    ...safeMatchAll(safeText, /technologiereifegrad[\s\-]?(\d{1})[\s\-]?[–-]?[\s\-]?(\d{1})?/gi),
    ...safeMatchAll(safeText, /reifegradstufe[\s\-]?(\d{1})[\s\-]?[–-]?[\s\-]?(\d{1})?/gi),
    ...safeMatchAll(safeText, /(?:technology|tech)[\s]+(?:readiness|reifegrad)[\s]+(?:level|stufe)?[\s\-]?(\d{1})/gi),
    ...safeMatchAll(safeText, /(?:minimum|mindestens|at least|min\.|ab)[\s]+trl[\s\-]?(\d{1})/gi),
    ...safeMatchAll(safeText, /trl[\s\-]?(\d{1})[\s\-]?(?:oder|or|bis|up to)[\s\-]?(\d{1})/gi),
    ...safeMatchAll(safeText, /(?:technologie|technology)[\s]+(?:muss|must|should|sollte)[\s]+(?:mindestens|at least)[\s]+(?:reifegrad|trl)[\s\-]?(\d{1})/gi),
    // Additional patterns for better coverage
    ...safeMatchAll(safeText, /(?:trl|reifegrad)[\s]+(?:von|from|between|zwischen|bis|to)[\s]+(\d{1})[\s\-]?[–-]?[\s\-]?(\d{1})?/gi),
    ...safeMatchAll(safeText, /(?:technology|technologie)[\s]+(?:readiness|reifegrad)[\s:]+([^\.\n]{5,100})/gi),
    ...safeMatchAll(safeText, /(?:maturity|reifegrad)[\s]+(?:level|stufe)[\s\-]?(\d{1})/gi)
  ];
  
  if (trlMatches.length > 0 || trlKeywords.some(keyword => lowerText.includes(keyword))) {
    let bestTRL: string | null = null;
    
    // Extract all TRL values
    const trlValues: Array<{min: number, max?: number}> = [];
    trlMatches.forEach(match => {
      const min = parseInt(match[1] || '0', 10);
      const max = match[2] ? parseInt(match[2], 10) : undefined;
      if (min >= 1 && min <= 9) {
        trlValues.push({ min, max: max && max >= min && max <= 9 ? max : undefined });
      }
    });
    
    if (trlValues.length > 0) {
      // Use first valid match (most specific)
      const trl = trlValues[0];
      bestTRL = trl.max ? `TRL ${trl.min}-${trl.max}` : `TRL ${trl.min}`;
    } else {
      // Fallback: check for single digit near keyword
      const nearTRL = text.match(/(?:trl|reifegrad|technology[\s]+readiness)[^.]{0,30}?(\d{1})[^.]{0,30}?(?:[–-](\d{1}))?/i);
      if (nearTRL) {
        const min = parseInt(nearTRL[1], 10);
        const max = nearTRL[2] ? parseInt(nearTRL[2], 10) : undefined;
        if (min >= 1 && min <= 9) {
          bestTRL = max ? `TRL ${min}-${max}` : `TRL ${min}`;
        }
      }
    }
    
    if (bestTRL || trlKeywords.some(keyword => lowerText.includes(keyword))) {
      // Only add if we have a meaningful TRL value, not generic "TRL specified"
      if (bestTRL) {
        categorized.trl_level.push({
          type: 'trl_level',
          value: bestTRL,
          required: true,
          source: 'context_extraction'
        });
        
        // LEARNING: Track successful TRL pattern match
        try {
          const { learnFromExtraction } = require('./extract-learning');
          const host = url ? new URL(url).hostname.replace('www.', '') : undefined;
          learnFromExtraction('trl', `TRL ${bestTRL}`, true, host).catch(() => {});
        } catch {}
      } else {
        // Extract context around TRL keywords to make it meaningful
        const contextMatch = safeText.match(/(?:trl|reifegrad|technology[\s]+readiness)[^.]{0,100}/i);
        if (contextMatch && contextMatch[0].length > 15) {
          categorized.trl_level.push({
            type: 'trl_level',
            value: contextMatch[0].trim(),
            required: true,
            source: 'context_extraction'
          });
        }
      }
    }
  }
  
  // GEOGRAPHIC - Enhanced: Extract specific locations and regions (EXPANDED)
  const regions = [
    // Austrian Cities
    { key: 'wien', value: 'Vienna', type: 'city' },
    { key: 'vienna', value: 'Vienna', type: 'city' },
    { key: 'salzburg', value: 'Salzburg', type: 'city' },
    { key: 'graz', value: 'Graz', type: 'city' },
    { key: 'linz', value: 'Linz', type: 'city' },
    { key: 'innsbruck', value: 'Innsbruck', type: 'city' },
    { key: 'klagenfurt', value: 'Klagenfurt', type: 'city' },
    { key: 'villach', value: 'Villach', type: 'city' },
    { key: 'wels', value: 'Wels', type: 'city' },
    { key: 'st. pölten', value: 'St. Pölten', type: 'city' },
    { key: 'dornbirn', value: 'Dornbirn', type: 'city' },
    { key: 'steyr', value: 'Steyr', type: 'city' },
    { key: 'wiener neustadt', value: 'Wiener Neustadt', type: 'city' },
    { key: 'feldkirch', value: 'Feldkirch', type: 'city' },
    // Austrian Regions (Bundesländer)
    { key: 'steiermark', value: 'Styria', type: 'region' },
    { key: 'styria', value: 'Styria', type: 'region' },
    { key: 'oberösterreich', value: 'Upper Austria', type: 'region' },
    { key: 'upper austria', value: 'Upper Austria', type: 'region' },
    { key: 'oberösterreich', value: 'Oberösterreich', type: 'region' },
    { key: 'niederösterreich', value: 'Lower Austria', type: 'region' },
    { key: 'lower austria', value: 'Lower Austria', type: 'region' },
    { key: 'niederösterreich', value: 'Niederösterreich', type: 'region' },
    { key: 'tirol', value: 'Tyrol', type: 'region' },
    { key: 'tyrol', value: 'Tyrol', type: 'region' },
    { key: 'vorarlberg', value: 'Vorarlberg', type: 'region' },
    { key: 'burgenland', value: 'Burgenland', type: 'region' },
    { key: 'kärnten', value: 'Carinthia', type: 'region' },
    { key: 'carinthia', value: 'Carinthia', type: 'region' },
    { key: 'kärnten', value: 'Kärnten', type: 'region' },
    { key: 'salzburg', value: 'Salzburg', type: 'region' }, // Also a region
    // Countries and Larger Regions
    { key: 'österreich', value: 'Austria', type: 'country' },
    { key: 'austria', value: 'Austria', type: 'country' },
    { key: '\\beu\\b', value: 'EU', type: 'region' },
    { key: 'european union', value: 'EU', type: 'region' },
    { key: 'europa', value: 'EU', type: 'region' },
    // Sub-regions and districts
    { key: 'mostviertel', value: 'Mostviertel', type: 'subregion' },
    { key: 'waldviertel', value: 'Waldviertel', type: 'subregion' },
    { key: 'mühlviertel', value: 'Mühlviertel', type: 'subregion' },
    { key: 'innviertel', value: 'Innviertel', type: 'subregion' }
  ];
  
  // Extract from context (location mentions with context) - ENHANCED with more patterns
  const locationMatches = [
    ...safeMatchAll(safeText, /(?:standort|location|region|ort|platz|gebiet|bereich|niederlassung|sitz|based|located|ansässig|domiciled)[\s:]+([^\.\n]{5,150})/gi),
    ...safeMatchAll(safeText, /(?:in|für|aus|von|für Unternehmen in|for companies in|for startups in|in der Region|in Österreich|in Austria|in|für|aus|von)\s+(Wien|Vienna|Salzburg|Graz|Linz|Innsbruck|Klagenfurt|Villach|Wels|St\.\s*Pölten|Dornbirn|Steyr|Wiener\s*Neustadt|Feldkirch|Steiermark|Oberösterreich|Niederösterreich|Upper\s*Austria|Lower\s*Austria|Tirol|Tyrol|Vorarlberg|Burgenland|Kärnten|Carinthia|Styria)[\s,\.]/gi),
    ...safeMatchAll(safeText, /(Wien|Vienna|Salzburg|Graz|Linz|Innsbruck|Klagenfurt|Villach|Wels|St\.\s*Pölten|Dornbirn|Steyr|Wiener\s*Neustadt|Feldkirch|Steiermark|Oberösterreich|Niederösterreich|Tirol|Tyrol|Vorarlberg|Burgenland|Kärnten|Carinthia|Styria|Mostviertel|Waldviertel|Mühlviertel|Innviertel)\s+(?:startup|unternehmen|firma|company|business|ansässig|located|based|in|für)/gi),
    ...safeMatchAll(safeText, /(?:gilt für|available for|for companies|für Unternehmen|für Firmen)\s+(?:in|in der|in der Region|in Österreich|in Austria|in Vienna|in Wien|in|für)\s+([^\.\n]{5,100})/gi),
    ...safeMatchAll(safeText, /(?:region|regionen|regions?|bundesland|bundesländer)[\s:]+([^\.\n]{10,200})/gi),
    ...safeMatchAll(safeText, /(?:geografisch|geographical|geographic|standort|standortanforderung)[\s:]+([^\.\n]{10,200})/gi),
    ...safeMatchAll(safeText, /(?:nur|only|exclusively)\s+(?:für|for)\s+(?:unternehmen|companies|firmen)\s+(?:in|aus|from)\s+([^\.\n]{5,100})/gi),
    ...safeMatchAll(safeText, /(?:beschränkt|limited|restricted)\s+(?:auf|to|für|for)\s+([^\.\n]{5,100})/gi),
    ...safeMatchAll(safeText, /(?:standort|ansässigkeit|domicile)\s+(?:muss|müssen|soll|sollen|ist|sind|erforderlich|required)[\s:]+([^\.\n]{5,150})/gi)
  ];
  
  if (locationMatches.length > 0) {
    const uniqueLocations = new Set<string>();
    locationMatches.forEach(match => {
      if (match[1] && match[1].trim().length > 2) {
        const loc = match[1].trim();
        const lowerLoc = loc.toLowerCase();
        
        // IMPROVED VALIDATION: Filter out company addresses and registration numbers
        // Reject company registration numbers (HRB, FN, etc.)
        const hasCompanyRegistration = /\b(HRB|FN|Firmenbuchnummer|Registernummer|Amtsgericht|Registergericht|Commercial Register|Company Register)\b/i.test(loc);
        // Reject addresses (street names, postal codes, etc.)
        const hasAddress = /\b(Straße|Strasse|Street|Avenue|Platz|Square|Gasse|Lane|Weg|Road|Postleitzahl|PLZ|Postal Code|Zip Code)\b/i.test(loc) ||
                          /\b\d{4,5}\s+[A-ZÄÖÜ][a-zäöüß]+/i.test(loc) || // Postal code patterns
                          /\b[A-ZÄÖÜ][a-zäöüß]+\s+\d+[a-z]?\b/i.test(loc); // Street name patterns
        // Reject generic placeholders
        const isGeneric = lowerLoc.includes('required') || lowerLoc.includes('specified') ||
                         lowerLoc.includes('available') || lowerLoc.includes('erforderlich') ||
                         lowerLoc.includes('notwendig') || lowerLoc.includes('angegeben') ||
                         lowerLoc.length < 3 || lowerLoc.length > 150;
        
        // REJECT if it contains company registration or address patterns
        if (hasCompanyRegistration || hasAddress) {
          return; // Skip this location match
        }
        
        // FIXED: Stricter validation - reject non-location text
        // Reject if it contains service/program keywords (not locations)
        const hasServiceKeywords = /(?:strategy support|topics|developments|service|program|programm|funding service|performance monitoring|european solidarity corps|volunteering|support|supporting)/i.test(loc);
        if (hasServiceKeywords) {
          return; // Skip - not a location
        }
        
        // Accept if it contains location indicators
        const hasLocationIndicator = 
          lowerLoc.includes('österreich') || lowerLoc.includes('austria') ||
          lowerLoc.includes('vienna') || lowerLoc.includes('wien') ||
          lowerLoc.includes('salzburg') || lowerLoc.includes('graz') ||
          lowerLoc.includes('linz') || lowerLoc.includes('innsbruck') ||
          lowerLoc.includes('steiermark') || lowerLoc.includes('styria') ||
          lowerLoc.includes('oberösterreich') || lowerLoc.includes('niederösterreich') ||
          lowerLoc.includes('tirol') || lowerLoc.includes('tyrol') ||
          lowerLoc.includes('vorarlberg') || lowerLoc.includes('burgenland') ||
          lowerLoc.includes('kärnten') || lowerLoc.includes('carinthia') ||
          lowerLoc.includes('region') || lowerLoc.includes('stadt') ||
          lowerLoc.includes('city') || lowerLoc.includes('country') ||
          lowerLoc.includes('europa') || lowerLoc.includes('eu') ||
          lowerLoc.includes('bundesland') || lowerLoc.includes('state') ||
          /^[A-ZÄÖÜ][a-zäöüß]+\s*([A-ZÄÖÜ][a-zäöüß]+)?/.test(loc) || // Looks like a proper name
          regions.some(r => {
            const regex = new RegExp(r.key.replace(/\\b/g, '\\b'), 'i');
            return regex.test(lowerLoc);
          }); // Matches known region
        
        // Also accept longer contextual descriptions that mention locations
        const isContextualLocation = loc.length > 30 && loc.length < 150 &&
          (lowerLoc.includes('in ') || lowerLoc.includes('für ') || 
           lowerLoc.includes('aus ') || lowerLoc.includes('von ') ||
           lowerLoc.includes('in der ') || lowerLoc.includes('in den ')) &&
          !isGeneric;
        
        if (!isGeneric && (hasLocationIndicator || isContextualLocation)) {
          // Clean up the location string
          let cleaned = loc.replace(/^(?:in|für|aus|von|from|to)\s+/i, '')
                           .replace(/\s+(?:ist|sind|soll|muss|müssen|required|erforderlich)[\s,]*$/i, '')
                           .trim();
          
          // For short locations (like "Austria"), try to get more context from surrounding text
          if (cleaned.length < 20 && match[0]) {
            // Try to get more context from the original match
            const matchContext = match[0].substring(0, 200);
            // Extract a longer description if available
            if (matchContext.length > cleaned.length + 10) {
              // Use context if it contains the location and is more descriptive
              const contextLower = matchContext.toLowerCase();
              if (contextLower.includes(cleaned.toLowerCase()) && matchContext.length > 30) {
                // Clean the context but keep it longer
                let enhanced = matchContext.replace(/^(?:standort|location|region|ort|platz|gebiet|bereich)[\s:]+/i, '')
                                          .replace(/\s+(?:ist|sind|soll|muss)[\s,]*$/i, '')
                                          .trim();
                if (enhanced.length > cleaned.length && enhanced.length < 200) {
                  cleaned = enhanced;
                }
              }
            }
          }
          
          if (cleaned.length >= 3 && cleaned.length < 200) {
            uniqueLocations.add(cleaned);
          }
        }
      }
    });
    
    // FIX: Hierarchical geographic extraction - if city/region mentioned, also add country (and vice versa)
    // Map cities/regions to their countries
    const locationHierarchy: Record<string, string> = {
      // Austrian cities
      'vienna': 'Austria', 'wien': 'Austria',
      'salzburg': 'Austria', 'graz': 'Austria', 'linz': 'Austria',
      'innsbruck': 'Austria', 'klagenfurt': 'Austria',
      // Austrian regions (Bundesländer)
      'styria': 'Austria', 'steiermark': 'Austria',
      'upper austria': 'Austria', 'oberösterreich': 'Austria',
      'lower austria': 'Austria', 'niederösterreich': 'Austria',
      'tyrol': 'Austria', 'tirol': 'Austria',
      'vorarlberg': 'Austria', 'burgenland': 'Austria',
      'carinthia': 'Austria', 'kärnten': 'Austria',
      // German cities
      'berlin': 'Germany', 'munich': 'Germany', 'münchen': 'Germany',
      'hamburg': 'Germany', 'frankfurt': 'Germany',
      // German regions
      'bavaria': 'Germany', 'bayern': 'Germany',
      'baden-württemberg': 'Germany',
    };
    
    const extractedLocations = new Set<string>();
    const countriesToAdd = new Set<string>();
    
    uniqueLocations.forEach(loc => {
      // Known generic locations that should always be included (even if short)
      const knownLocations = ['austria', 'österreich', 'at', 'germany', 'deutschland', 'de', 
                              'eu', 'europa', 'europe', 'european union', 'international'];
      const isKnownLocation = knownLocations.some(known => 
        loc.toLowerCase().trim() === known || loc.toLowerCase().includes(known)
      );
      
      // Accept if:
      // 1. It's a known location (Austria, Germany, EU, etc.)
      // 2. It's at least 3 characters and contains location keywords
      // 3. It's at least 10 characters (for more specific locations)
      const hasLocationKeywords = /(austria|österreich|germany|deutschland|eu|europa|europe|vienna|wien|region|city|country|standort|location)/i.test(loc);
      const isValidLength = loc.length >= 3;
      const isLongEnough = loc.length >= 10;
      
      if (isKnownLocation || (hasLocationKeywords && isValidLength && (isLongEnough || isKnownLocation))) {
        // Clean up common prefixes/suffixes
        let cleaned = loc.trim();
        cleaned = cleaned.replace(/^(?:in|für|aus|von|for|from|to)\s+/i, '');
        cleaned = cleaned.replace(/\s+(?:ist|sind|soll|muss|müssen|required|erforderlich)[\s,]*$/i, '');
        cleaned = cleaned.trim();
        
        if (cleaned.length >= 3 && cleaned.length < 200) {
          extractedLocations.add(cleaned);
          
          // HIERARCHICAL: Check if this is a city/region that should have country added
          const locLower = cleaned.toLowerCase();
          for (const [key, country] of Object.entries(locationHierarchy)) {
            if (locLower.includes(key) || key.includes(locLower)) {
              // Found a city/region - add its country
              countriesToAdd.add(country);
              break;
            }
          }
          
          // HIERARCHICAL: If country is mentioned, we could add known cities/regions, but that's too aggressive
          // Instead, just ensure country is extracted
          if (locLower.includes('austria') || locLower.includes('österreich')) {
            countriesToAdd.add('Austria');
          } else if (locLower.includes('germany') || locLower.includes('deutschland')) {
            countriesToAdd.add('Germany');
          }
        }
      }
    });
    
    // Add all extracted locations
    extractedLocations.forEach(loc => {
      categorized.geographic.push({
        type: 'location',
        value: loc,
        required: false,
        source: 'context_extraction'
      });
    });
    
    // Add countries from hierarchy (only if not already extracted)
    countriesToAdd.forEach(country => {
      const alreadyExists = Array.from(extractedLocations).some(loc => 
        loc.toLowerCase().includes(country.toLowerCase()) || 
        country.toLowerCase().includes(loc.toLowerCase())
      );
      if (!alreadyExists) {
        categorized.geographic.push({
          type: 'location',
          value: country,
          required: false,
          source: 'hierarchical_extraction'
        });
      }
    });
  }
  
  // Also match regions from predefined list - but add context to make them meaningful
  regions.forEach(r => {
    const regex = new RegExp('\\b' + r.key.replace(/\\b/g, '') + '\\b', 'i');
    if (regex.test(text)) {
      // Check if we already have this region
      const exists = categorized.geographic.some(g => g.value === r.value || g.value.toLowerCase().includes(r.value.toLowerCase()));
      if (!exists) {
        // Use 'location' type to match QuestionEngine expectations
        // Keep the original value for simple locations (Austria, Germany, EU)
        // Add context for longer descriptions
        const value = (r.value.length < 20 && r.type !== 'city') 
          ? `Eligible for companies located in ${r.value}`
          : r.value;
        
        categorized.geographic.push({
          type: 'location',
          value: value,
          required: false,
          source: 'full_page_content'
        });
      }
    }
  });
  
  // CRITICAL FIX: Institution-based and URL-based geographic extraction (should be 90%+)
  // Most AWS programs are Austria-only - extract from institution context
  if (url) {
    try {
      const urlObj = new URL(url);
      const host = urlObj.hostname.toLowerCase();
      
      // Institution-based: AWS = Austria
      if (host.includes('aws.at') || host.includes('austria-wirtschaftsservice')) {
        const hasAustria = categorized.geographic.some(g => 
          g.value.toLowerCase().includes('austria') || g.value.toLowerCase().includes('österreich')
        );
        if (!hasAustria) {
          categorized.geographic.push({
            type: 'location',
            value: 'Austria',
            required: false,
            source: 'institution_default'
          });
        }
      }
      
      // URL-based: .at = Austria, .de = Germany
      if (host.endsWith('.at') && !host.includes('aws.at')) {
        const hasAustria = categorized.geographic.some(g => 
          g.value.toLowerCase().includes('austria') || g.value.toLowerCase().includes('österreich')
        );
        if (!hasAustria) {
          categorized.geographic.push({
            type: 'location',
            value: 'Austria',
            required: false,
            source: 'domain_extraction'
          });
        }
      } else if (host.endsWith('.de')) {
        const hasGermany = categorized.geographic.some(g => 
          g.value.toLowerCase().includes('germany') || g.value.toLowerCase().includes('deutschland')
        );
        if (!hasGermany) {
          categorized.geographic.push({
            type: 'location',
            value: 'Germany',
            required: false,
            source: 'domain_extraction'
          });
        }
      } else if (host.includes('.ec.europa.eu') || host.includes('europa.eu')) {
        // EU institutions = EU-wide eligibility
        const hasEU = categorized.geographic.some(g => 
          g.value.toLowerCase().includes('eu') || g.value.toLowerCase().includes('europe') || g.value.toLowerCase().includes('european')
        );
        if (!hasEU) {
          categorized.geographic.push({
            type: 'location',
            value: 'EU',
            required: false,
            source: 'domain_extraction'
          });
        }
      }
    } catch (e) {
      // Invalid URL, skip
    }
  }
  
  // FINAL FALLBACK: If still no geographic data and we have a URL, try domain-based extraction
  if (categorized.geographic.length === 0 && url) {
    try {
      const urlObj = new URL(url);
      const host = urlObj.hostname.toLowerCase();
      if (host.endsWith('.at')) {
        categorized.geographic.push({
          type: 'location',
          value: 'Austria',
          required: false,
          source: 'domain_fallback'
        });
      } else if (host.endsWith('.de')) {
        categorized.geographic.push({
          type: 'location',
          value: 'Germany',
          required: false,
          source: 'domain_fallback'
        });
      } else if (host.includes('.ec.europa.eu') || host.includes('europa.eu')) {
        categorized.geographic.push({
          type: 'location',
          value: 'EU',
          required: false,
          source: 'domain_fallback'
        });
      }
    } catch (e) {
      // Invalid URL, skip
    }
  }
  
  // CRITICAL FIX: Body text scanning for location keywords (broader extraction)
  // Scan entire body text for "Austria", "Österreich", "eligible in", etc.
  const bodyTextLower = lowerText;
  if (bodyTextLower.includes('austria') || bodyTextLower.includes('österreich')) {
    const hasAustria = categorized.geographic.some(g => 
      g.value.toLowerCase().includes('austria') || g.value.toLowerCase().includes('österreich')
    );
    if (!hasAustria) {
      // Extract context around "Austria" mention
      const austriaMatch = safeText.match(/(?:[^\.\n]{0,50}(?:austria|österreich)[^\.\n]{0,50})/i);
      if (austriaMatch) {
        const context = austriaMatch[0].trim();
        if (context.length > 5 && context.length < 150) {
          categorized.geographic.push({
            type: 'location',
            value: context,
            required: false,
            source: 'body_text_scan'
          });
        } else {
          categorized.geographic.push({
            type: 'location',
            value: 'Austria',
            required: false,
            source: 'body_text_scan'
          });
        }
      } else {
        categorized.geographic.push({
          type: 'location',
          value: 'Austria',
          required: false,
          source: 'body_text_scan'
        });
      }
    }
  }
  
  // Extract from project descriptions (often mention location)
  // Check all project subcategories
  const allProjectCategories = ['innovation_focus', 'technology_area', 'research_domain', 'sector_focus'];
  const hasAnyProject = allProjectCategories.some(cat => (categorized[cat]?.length || 0) > 0);
  if (hasAnyProject) {
    allProjectCategories.forEach(cat => {
      (categorized[cat] || []).forEach((proj: any) => {
        const projText = String(proj.value || '').toLowerCase();
        if (projText.includes('austria') || projText.includes('österreich')) {
          const hasAustria = categorized.geographic.some(g => 
            g.value.toLowerCase().includes('austria') || g.value.toLowerCase().includes('österreich')
          );
          if (!hasAustria) {
            categorized.geographic.push({
              type: 'location',
              value: 'Austria',
              required: false,
              source: 'project_description'
            });
          }
        }
      });
    });
  }
  
  // TIMELINE - Enhanced: Better date and duration extraction with more patterns
  // ULTRA-IMPROVED: More comprehensive patterns, lower minimums to increase coverage
  
  // CRITICAL FIX: Open deadline detection (should be 90%+ coverage)
  // Many programs have "open deadline" or "rolling application" - extract this
  // ENHANCED: More patterns and better detection
  const openDeadlinePatterns = [
    /\b(open\s+deadline|rolling\s+application|anytime|ongoing|continuously|no\s+deadline|keine\s+frist|laufend|jederzeit|ohne\s+frist|kein\s+bewerbungsschluss|open\s+application|rolling|continuous)\b/i,
    /\b(no\s+closing\s+date|kein\s+abgabeschluss|kein\s+einreichungsschluss|kein\s+bewerbungsschluss|keine\s+abgabefrist)\b/i,
    /\b(continuously\s+open|laufend\s+geöffnet|permanently\s+open|dauerhaft\s+geöffnet)\b/i,
    /\b(apply\s+anytime|bewerbung\s+jederzeit|application\s+possible\s+at\s+any\s+time)\b/i
  ];
  
  const hasOpenDeadlinePhrase = openDeadlinePatterns.some(pattern => pattern.test(safeText));
  if (hasOpenDeadlinePhrase) {
    const hasOpenDeadline = categorized.timeline.some(t => 
      t.value.toLowerCase().includes('open') || t.value.toLowerCase().includes('rolling') || 
      t.value.toLowerCase().includes('laufend') || t.value.toLowerCase().includes('jederzeit') ||
      t.value.toLowerCase().includes('continuous') || t.value.toLowerCase().includes('ongoing')
    );
    if (!hasOpenDeadline) {
      categorized.timeline.push({
        type: 'deadline',
        value: 'Open deadline (rolling application)',
        required: false,
        source: 'open_deadline_detection'
      });
    }
  }
  
  // INTELLIGENCE: Try learned timeline patterns first (if available)
  let timelineMatches: RegExpMatchArray[] = [];
  try {
    const { getLearnedPatterns } = require('./extract-learning');
    const host = url ? new URL(url).hostname.replace('www.', '') : undefined;
    const learnedPatterns = await getLearnedPatterns('timeline', host).catch(() => []);
    for (const learnedPattern of learnedPatterns.slice(0, 5)) { // Limit to top 5 patterns
      try {
        const regex = new RegExp(learnedPattern.pattern, 'gi');
        const match = safeText.match(regex);
        if (match) {
          timelineMatches.push(match as RegExpMatchArray);
          const { learnFromExtraction } = require('./extract-learning');
          learnFromExtraction('timeline', learnedPattern.pattern, true, host).catch(() => {});
        }
      } catch {}
    }
  } catch {}
  
  // Add standard patterns
  timelineMatches = timelineMatches.concat(
    // Deadline patterns with keywords (expanded - more variations, LOWERED minimum)
    safeMatchAll(safeText, /(?:deadline|frist|einreichfrist|bewerbungsfrist|application deadline|abgabefrist|meldungsfrist|anmeldefrist|submit by|einreichen bis|letzter termin|last date|application date|bewerbungsdatum|fristende|schluss|abgabeschluss|einsendeschluss|bewerbungsschluss|bewerbungsende|einreichungsende|abgabeende|einsendeende|letzter einreichtermin|letzter abgabetermin|bis spätestens|bis zum|spätestens bis|einreichfrist endet|bewerbungsfrist endet|frist endet|schlusstermin|abgabetermin)[\s:]+([^\.\n]{3,150})/gi), // LOWERED from 5
    safeMatchAll(safeText, /(?:application deadline|submission deadline|deadline for application|deadline for submission|closing date|due date|application due|submission due|last date|final date|deadline date|application closes|submission closes|closing deadline)[\s:]+([^\.\n]{3,150})/gi),
    // More flexible deadline patterns
    safeMatchAll(safeText, /(?:bewerbung|application|antrag|submission)[\s]+(?:bis|until|by|spätestens)[\s]+([^\.\n]{5,150})/gi),
    safeMatchAll(safeText, /(?:einreichung|submission)[\s]+(?:möglich|possible|bis|until|by)[\s]+([^\.\n]{5,150})/gi),
    safeMatchAll(safeText, /(?:laufzeit|duration|zeitraum|project duration|program duration|projektlaufzeit|förderdauer|funding period|programmlaufzeit|dauer|zeitdauer|projektlaufzeit)[\s:]+([^\.\n]{5,150})/gi),
    // Date ranges (expanded patterns)
    safeMatchAll(safeText, /(?:von|from|ab|starting|beginning|gültig ab|valid from|gültig|valid|start)[\s]+(\d{1,2}[\.\/\-]\d{1,2}[\.\/\-]\d{2,4})[\s]*(?:bis|to|until|ending|\-|end)[\s]+(\d{1,2}[\.\/\-]\d{1,2}[\.\/\-]\d{2,4})/gi),
    safeMatchAll(safeText, /(\d{1,2}[\.\/\-]\d{1,2}[\.\/\-]\d{2,4})[\s]*(?:-\s*|\s+to\s+|\s+bis\s+|\s+until\s+|\s+until\s+)(\d{1,2}[\.\/\-]\d{1,2}[\.\/\-]\d{2,4})/gi),
    // Single dates with context (more patterns)
    safeMatchAll(safeText, /(?:bis|until|by|spätestens|letzter\s+termin|deadline|frist|einsendeschluss|application deadline|bewerbungsschluss|abschluss|ende|closing)[\s]+(\d{1,2}[\.\/\-]\d{1,2}[\.\/\-]\d{2,4})/gi),
    // Timeline sections (expanded)
    safeMatchAll(safeText, /(?:zeitplan|timeline|ablauf|procedure|process|verfahren|timeline|fristen|dates|termine|kalender|schedule|programmablauf)[\s:]+([^\.\n]{10,200})/gi),
    // Evaluation/decision dates (expanded)
    safeMatchAll(safeText, /(?:entscheidung|decision|bewilligung|approval|bekanntgabe|announcement|notification|auswahl|selection|prüfung|review)[\s:]+([^\.\n]{5,150})/gi),
    // Submission periods (expanded)
    safeMatchAll(safeText, /(?:einreichung|submission|bewerbung|application|antragstellung)[\s]+(?:möglich|possible|open|von|from|between|zwischen|bis|until)[\s]+([^\.\n]{5,150})/gi),
    // Specific time periods (e.g., "from January to March")
    safeMatchAll(safeText, /(?:von|from)\s+(?:januar|februar|märz|april|mai|juni|juli|august|september|oktober|november|dezember|january|february|march|may|june|july|august|september|october|november|december)[\s]+(?:bis|to|until)\s+(?:januar|februar|märz|april|mai|juni|juli|august|september|oktober|november|dezember|january|february|march|may|june|july|august|september|october|november|december)/gi),
    // Additional patterns: "open until", "rolling deadline", "continuous"
    safeMatchAll(safeText, /(?:laufend|rolling|ongoing|continuous|kontinuierlich|offen|open)[\s]+(?:deadline|frist|application|bewerbung|einreichung)?/gi),
    // Pattern: "Applications accepted until", "Bewerbungen bis"
    safeMatchAll(safeText, /(?:applications?|bewerbungen?|anträge?|submissions?)[\s]+(?:accepted|angenommen|möglich|possible|open)[\s]+(?:until|bis|by|until the end of)[\s]+([^\.\n]{5,150})/gi),
    // Pattern: "Call closes", "Ausschreibung endet"
    safeMatchAll(safeText, /(?:call|ausschreibung|program|programm)[\s]+(?:closes?|endet|ends?|läuft bis|runs until)[\s]+([^\.\n]{5,150})/gi)
  );
  
  if (timelineMatches.length > 0) {
    // Prefer date ranges or deadlines
    const dateRangeMatch = timelineMatches.find(m => m[0].match(/\d{1,2}[\.\/\-]\d{1,2}[\.\/\-]\d{2,4}/) && (m[2] || m[0].includes('bis') || m[0].includes('to') || m[0].includes('until')));
    const deadlineMatch = timelineMatches.find(m => m[0].toLowerCase().includes('deadline') || m[0].toLowerCase().includes('frist') || m[0].toLowerCase().includes('bis'));
    const bestMatch = dateRangeMatch || deadlineMatch || timelineMatches[0];
    
    if (bestMatch && bestMatch[1]) {
      const value = bestMatch[0].trim();
      // Extract actual date or meaningful timeline info
      const hasDate = /\d{1,2}[\.\/\-]\d{1,2}[\.\/\-]\d{2,4}/.test(value);
      const hasTimelineKeyword = /(?:laufzeit|duration|zeitraum|deadline|frist|zeitplan|timeline|ablauf)/i.test(value);
      
      // ENHANCED: Reject cost-related terms from timeline extraction
      const isCostRelated = /(?:kosten|cost|material|sachkosten|drittkosten|personalkosten|reisekosten|anlagennutzung|materialkosten|ausgaben|expenses|investition|betrag|summe|finanzierung|förderung|bezahlung|payment|fee|gebühr)/i.test(value);
      
      if (value.length > 5 && value.length < 250 && (hasDate || hasTimelineKeyword) && !value.toLowerCase().includes('specified') && !value.toLowerCase().includes('available upon request') && !isCostRelated) {
        categorized.timeline.push({
          type: dateRangeMatch ? 'date_range' : (deadlineMatch ? 'deadline' : (hasDate ? 'deadline' : 'duration')),
          value: value.substring(0, 200), // Limit length
          required: true,
          source: 'context_extraction'
        });
        
        // LEARNING: Track successful pattern match (async, don't block)
        try {
          const { learnFromExtraction } = require('./extract-learning');
          const host = url ? new URL(url).hostname.replace('www.', '') : undefined;
          const patternText = bestMatch[0].substring(0, 100); // Store first 100 chars of pattern
          learnFromExtraction('timeline', patternText, true, host).catch(() => {}); // Fire and forget
        } catch {}
      }
    }
  }
  
  // Duration extraction - Enhanced patterns with more variations
  // FIX: Normalize duration to months for consistency
  const durationMatches = [
    ...safeMatchAll(safeText, /(?:laufzeit|duration|dauer|programm duration|project duration|förderdauer|programmlaufzeit|projektlaufzeit)[\s:]+([^\.\n]{5,100})/gi),
    ...safeMatchAll(safeText, /(\d+)\s*(?:jahr|jahre|year|years|month|monat|monate|months|woche|weeks|tag|days)[\s]*(?:laufzeit|duration|dauer|lang|long)?/i),
    ...safeMatchAll(safeText, /(\d+)\s*-\s*(\d+)\s*(?:jahr|jahre|year|years|month|monat|monate|months)/i),
    ...safeMatchAll(safeText, /(?:zwischen|between)\s+(\d+)\s*(?:und|and)\s+(\d+)\s*(?:jahr|jahre|year|years|month|monat|monate|months)/i),
    ...safeMatchAll(safeText, /(?:maximum|maximal|max\.|bis zu|up to)\s+(\d+)\s*(?:jahr|jahre|year|years|month|monat|monate|months)/i),
    ...safeMatchAll(safeText, /(?:minimum|mindestens|min\.|at least)\s+(\d+)\s*(?:jahr|jahre|year|years|month|monat|monate|months)/i),
    ...safeMatchAll(safeText, /(?:project|projekt|program|programm)[\s]+(?:duration|laufzeit|dauer)[\s:]+([^\.\n]{5,100})/gi)
  ];
  
  /**
   * Normalize duration to months
   * Examples: "2 years" → "24 months", "1-3 years" → "12-36 months"
   */
  const normalizeDurationToMonths = (durationText: string): string => {
    // Extract numeric values and units
    const yearRangeMatch = durationText.match(/(\d+)\s*-\s*(\d+)\s*(?:jahr|jahre|year|years)/i);
    if (yearRangeMatch) {
      const minYears = parseInt(yearRangeMatch[1]);
      const maxYears = parseInt(yearRangeMatch[2]);
      return `${minYears * 12}-${maxYears * 12} months`;
    }
    
    const singleYearMatch = durationText.match(/(\d+)\s*(?:jahr|jahre|year|years)/i);
    if (singleYearMatch) {
      const years = parseInt(singleYearMatch[1]);
      return `${years * 12} months`;
    }
    
    // Already in months - keep as is
    const monthMatch = durationText.match(/(\d+)\s*(?:-\s*\d+)?\s*(?:month|monat|monate|months)/i);
    if (monthMatch) {
      return durationText; // Already normalized
    }
    
    // Weeks - convert to months (approximate: 1 month ≈ 4.33 weeks, but we'll use 4 for simplicity)
    const weekMatch = durationText.match(/(\d+)\s*(?:woche|weeks)/i);
    if (weekMatch) {
      const weeks = parseInt(weekMatch[1]);
      const months = Math.round(weeks / 4.33);
      return `${months} months`;
    }
    
    // Days - convert to months (approximate: 1 month ≈ 30 days)
    const dayMatch = durationText.match(/(\d+)\s*(?:tag|days)/i);
    if (dayMatch) {
      const days = parseInt(dayMatch[1]);
      const months = Math.round(days / 30);
      return months > 0 ? `${months} months` : durationText; // Keep original if < 1 month
    }
    
    // If no specific unit found, return original
    return durationText;
  };
  
  durationMatches.forEach(match => {
    const value = match[0] || match[1] || '';
    if (value && !categorized.timeline.some(t => t.value.includes(match[1] || match[0]))) {
      const durationText = value.trim();
      
      // FIXED: Only accept time-related patterns (months, years, weeks, days)
      // Reject non-time-related text like "Material- und Sachkosten", "Kosten", etc.
      const hasTimeUnit = /(?:jahr|jahre|year|years|month|monat|monate|months|woche|weeks|tag|days|duration|laufzeit|dauer|zeitraum)/i.test(durationText);
      const hasNumber = /\d/.test(durationText);
      
      // ENHANCED: Reject if it contains cost/material keywords (not duration) - more strict exclusion
      const hasCostKeywords = /(?:kosten|cost|material|sachkosten|drittkosten|personalkosten|reisekosten|anlagennutzung|materialkosten|ausgaben|expenses|investition|investitionen|betrag|summe|finanzierung|förderung|bezahlung|payment|fee|gebühr|km[ou]|sme|unternehmen|forschungseinrichtung|planned|groß|small|medium)/i.test(durationText);
      
      if (durationText.length > 3 && durationText.length < 100 && hasTimeUnit && hasNumber && !hasCostKeywords) {
        // Normalize to months
        const normalized = normalizeDurationToMonths(durationText);
        
        categorized.timeline.push({
          type: 'duration',
          value: normalized,
          required: true,
          source: 'context_extraction'
        });
      }
    }
  });
  
  // Additional: Extract specific months/years mentioned with timeline context
  const monthYearPattern = /(?:deadline|frist|bis|until|by)[\s:]+(?:der\s+)?(\d{1,2})\.\s*(januar|februar|märz|april|mai|juni|juli|august|september|oktober|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[\s,]*(\d{2,4})?/i;
  const monthYearMatch = safeText.match(monthYearPattern);
  if (monthYearMatch && !categorized.timeline.some(t => t.value.includes(monthYearMatch[0]))) {
    categorized.timeline.push({
      type: 'deadline',
      value: monthYearMatch[0].trim(),
      required: true,
      source: 'context_extraction'
    });
  }
  
  // FALLBACK: If no timeline extracted but timeline keywords exist, extract any timeline-related content
  if (categorized.timeline.length === 0 && (lowerText.includes('deadline') || lowerText.includes('frist') || lowerText.includes('laufzeit') || lowerText.includes('duration') || lowerText.includes('zeitraum') || lowerText.includes('timeline'))) {
    const fallbackMatches = [
      ...safeMatchAll(safeText, /(?:deadline|frist|laufzeit|duration|zeitraum|timeline)[\s:]+([^\.\n]{5,200})/gi),
      ...safeMatchAll(safeText, /(?:bis|until|by|spätestens)[\s]+([^\.\n]{5,200})/gi)
    ];
    if (fallbackMatches.length > 0) {
      const bestFallback = fallbackMatches.find(m => {
        const val = m[1] || '';
        return val.trim().length >= 5 && 
               !val.toLowerCase().includes('required') && 
               !val.toLowerCase().includes('specified') &&
               (/\d/.test(val) || val.toLowerCase().includes('open') || val.toLowerCase().includes('laufend') || val.toLowerCase().includes('rolling'));
      });
      if (bestFallback && bestFallback[1]) {
        const value = bestFallback[1].trim();
        if (value.length >= 5 && value.length < 250) {
          let timelineType = 'duration';
          if (value.toLowerCase().includes('deadline') || value.toLowerCase().includes('frist') || value.toLowerCase().includes('bis')) {
            timelineType = 'deadline';
          } else if (value.toLowerCase().includes('open') || value.toLowerCase().includes('laufend') || value.toLowerCase().includes('rolling')) {
            timelineType = 'open_deadline';
          }
          categorized.timeline.push({
            type: timelineType,
            value: value,
            required: true,
            source: 'fallback_extraction'
          });
        }
      }
    }
  }
  
  // Don't add generic placeholder - only add if we found meaningful content
  
  // TEAM - Enhanced: Extract actual team requirements with better numeric extraction
  // CRITICAL: Team extraction must be 100% reliable - add comprehensive patterns
  const teamMatches = [
    ...safeMatchAll(safeText, /(?:team|mitarbeiter|personal|personnel|teamgröße|team size|staff)[\s:]+([^\.\n]{8,300})/gi), // LOWERED from 10 to 8
    ...safeMatchAll(safeText, /(?:mindestens|at least|minimum|min\.|min)[\s]+(\d+)[\s]*(?:mitarbeiter|team|personnel|staff|members|personen|people|employees)/gi),
    ...safeMatchAll(safeText, /(?:team|mitarbeiter)[\s]+(?:von|consisting of|mit|with|besteht aus|consists of)[\s]+(\d+)[\s]*(?:mitarbeiter|personnel|staff|personen|people|employees)/gi),
    ...safeMatchAll(safeText, /(?:projektteam|project team|kern team|core team)[\s:]+([^\.\n]{8,300})/gi), // LOWERED from 10 to 8
    ...safeMatchAll(safeText, /(?:qualifikation|qualification|ausbildung|education|expertise|erfahrung)[\s]+(?:des teams|of the team|der mitarbeiter)[\s:]+([^\.\n]{8,300})/gi), // LOWERED from 10 to 8
    // NEW: More patterns for team size extraction
    ...safeMatchAll(safeText, /(?:team|mitarbeiter|personal)[\s]+(?:muss|soll|sollen|besteht|besteht mit|must have|should have|must consist of)[\s]+(?:mindestens|at least|minimum|min\.?)[\s]*(\d+)/gi),
    ...safeMatchAll(safeText, /(?:team|mitarbeiter|personal)[\s]+(?:von|bis|minimum|maximum)[\s]+(\d+)[\s]*(?:bis|to|maximum|max\.?)[\s]*(\d+)?/gi),
    ...safeMatchAll(safeText, /(\d+)[\s]*(?:mitarbeiter|personnel|staff|team members|personen|people|employees)[\s]+(?:sind|muss|soll|required|erforderlich)/gi),
    ...safeMatchAll(safeText, /(?:teamgröße|team size)[\s:]+(?:mindestens|at least|minimum|min\.?)[\s]*(\d+)/gi),
    // ADDITIONAL: More comprehensive patterns for 100% reliability
    ...safeMatchAll(safeText, /(?:team|mitarbeiter|personal|personnel|staff)[\s]+(?:aus|of|consisting of|besteht aus)[\s]+([^\.\n]{10,200})/gi),
    ...safeMatchAll(safeText, /(?:team|mitarbeiter|personal|personnel|staff)[\s]+(?:muss|soll|sollen|must|should|have to)[\s]+(?:haben|have|bestehen|consist of)[\s]+([^\.\n]{10,200})/gi),
    ...safeMatchAll(safeText, /(?:team|mitarbeiter|personal|personnel|staff)[\s]+(?:sollte|should|muss|must)[\s]+(?:umfassen|include|consist of)[\s]+([^\.\n]{10,200})/gi),
    ...safeMatchAll(safeText, /(?:anzahl|number|count)[\s]+(?:mitarbeiter|personnel|staff|team members)[\s:]+([^\.\n]{5,200})/gi),
    ...safeMatchAll(safeText, /(?:team|mitarbeiter|personal|personnel|staff)[\s]+(?:erforderlich|required|necessary)[\s:]+([^\.\n]{10,200})/gi)
  ];
  if (teamMatches.length > 0) {
    // First, try to extract numeric values directly
    const numericMatches = teamMatches
      .map(m => {
        // Check if match[1] or match[2] contains a number
        const numStr = m[1]?.match(/^\d+/) || m[2]?.match(/^\d+/);
        if (numStr) {
          return { value: parseInt(numStr[0]), match: m };
        }
        // Also check if the text contains a number
        const textNum = m[1]?.match(/\b(\d+)\b/);
        if (textNum) {
          return { value: parseInt(textNum[1]), match: m };
        }
        return null;
      })
      .filter((m): m is { value: number; match: RegExpMatchArray } => m !== null);
    
    // If we found numeric matches, use them
    if (numericMatches.length > 0) {
      const bestNumeric = numericMatches[0];
      const teamSize = bestNumeric.value;
      if (teamSize > 0 && teamSize < 10000) { // Reasonable range
        categorized.team.push({
          type: 'min_team_size',
          value: String(teamSize),
          required: true,
          source: 'context_extraction'
        });
      }
    }
    
    // Also extract text descriptions (for non-numeric requirements)
    const sortedMatches = teamMatches
      .filter(m => m[1] && (m[1].trim().length >= 8 || /^\d+/.test(m[1]))) // LOWERED from 10 to 8
      .sort((a, b) => {
        const aLen = a[1].trim().length;
        const bLen = b[1].trim().length;
        // Prefer numeric matches (more specific) or longer text
        if (/^\d+/.test(a[1]) && !/^\d+/.test(b[1])) return -1;
        if (/^\d+/.test(b[1]) && !/^\d+/.test(a[1])) return 1;
        return bLen - aLen;
      });
    
    const bestMatch = sortedMatches[0];
    if (bestMatch && bestMatch[1]) {
      const value = bestMatch[1].trim();
      let cleaned = value.replace(/^(?:sind|soll|muss|müssen|darf|dürfen|ist|werden|kann|können|required|erforderlich)[\s,]+/i, '').trim();
      cleaned = cleaned.replace(/^(?:team|mitarbeiter|personal|personnel)[\s:]+/i, '').trim();
      
      // Only add if meaningful (length >= 15) or it contains numbers (specific requirement) - LOWERED from 20 to 15
      const isMeaningful = cleaned.length >= 15 || /^\d+/.test(cleaned);
      
      if (isMeaningful && cleaned.length > 5 && cleaned.length < 400 && !cleaned.toLowerCase().includes('required') && !cleaned.toLowerCase().includes('specified')) {
        // Extract numeric team size if present (if not already added above)
        const numericMatch = cleaned.match(/^\d+/);
        if (numericMatch && numericMatches.length === 0) { // Only add if we didn't already add numeric
          const teamSize = parseInt(numericMatch[0]);
          if (teamSize > 0 && teamSize < 10000) {
            categorized.team.push({
              type: 'min_team_size',
              value: String(teamSize),
              required: true,
              source: 'context_extraction'
            });
          }
        } else if (!numericMatch) {
          // If no specific number, add as team_size description
          categorized.team.push({
            type: 'team_size',
            value: cleaned,
            required: true,
            source: 'context_extraction'
          });
        }
      }
    }
  }
  
  // FALLBACK: If no team data extracted but team keywords exist, extract any team-related content
  // ENHANCED: More relaxed fallback patterns for better coverage
  if (categorized.team.length === 0 && (lowerText.includes('team') || lowerText.includes('mitarbeiter') || lowerText.includes('personal') || lowerText.includes('personnel') || lowerText.includes('staff') || lowerText.includes('founder') || lowerText.includes('gründer') || lowerText.includes('entrepreneur'))) {
    const fallbackMatches = [
      ...safeMatchAll(safeText, /(?:team|mitarbeiter|personal|personnel|staff|founder|gründer|entrepreneur)[\s:]+([^\.\n]{8,200})/gi),
      ...safeMatchAll(safeText, /([^\.\n]{8,200})[\s]*(?:team|mitarbeiter|personal|personnel|staff|founder|gründer|entrepreneur)[\s:]/gi),
      // More specific patterns for startup/company team requirements
      ...safeMatchAll(safeText, /(?:startup|unternehmen|company|firma)[\s]+(?:muss|soll|sollen|must|should)[\s]+(?:haben|have|bestehen|consist of)[\s]+([^\.\n]{8,200})/gi),
      ...safeMatchAll(safeText, /(?:founder|gründer|entrepreneur)[\s]+(?:muss|soll|sollen|must|should)[\s]+(?:haben|have|sein|be)[\s]+([^\.\n]{8,200})/gi)
    ];
    if (fallbackMatches.length > 0) {
      const bestFallback = fallbackMatches.find(m => m[1] && m[1].trim().length >= 8 && !m[1].toLowerCase().includes('required') && !m[1].toLowerCase().includes('specified'));
      if (bestFallback && bestFallback[1]) {
        const value = bestFallback[1].trim();
        // More relaxed: accept 8+ chars (was 10)
        if (value.length >= 8 && value.length < 300) {
          categorized.team.push({
            type: 'team_size',
            value: value,
            required: true,
            source: 'fallback_extraction'
          });
        }
      }
    }
  }
  
  // Don't add generic placeholder - only add if we found meaningful content

  // QUALIFICATION
  const qualMatches = [
    ...safeMatchAll(safeText, /(?:qualifikation|ausbildung|studium|education|qualification)[\s:]+([^\.\n]{10,150})/gi)
  ];
  if (qualMatches.length > 0) {
    const bestMatch = qualMatches.find(m => m[1] && m[1].trim().length > 10);
    if (bestMatch && bestMatch[1]) {
      const value = bestMatch[1].trim();
      if (value.length > 10 && value.length < 200 && !value.toLowerCase().includes('required')) {
        categorized.team.push({
          type: 'qualification',
          value: value,
          required: true,
          source: 'context_extraction'
        });
      }
    }
  }
  // Don't add generic placeholder - only add if we find meaningful content
  
  // PROJECT - Enhanced: Extract actual project focus/requirements
  // FIX: Categorize into 4 types: innovation_focus, technology_area, research_domain, sector_focus
  const projectMatches = [
    ...safeMatchAll(safeText, /(?:innovation|forschung|entwicklung|research|development)[\s:]+([^\.\n]{10,200})/gi),
    ...safeMatchAll(safeText, /(?:fokus|focus|schwerpunkt|thema|topic)[\s:]+([^\.\n]{10,200})/gi),
    ...safeMatchAll(safeText, /(?:technologie|technology|tech|ai|iot|blockchain|biotechnology)[\s:]+([^\.\n]{10,200})/gi),
    ...safeMatchAll(safeText, /(?:sector|sektor|industrie|industry|branche)[\s:]+([^\.\n]{10,200})/gi)
  ];
  
  const categorizeProject = (text: string): { type: string, value: string } | null => {
    const lower = text.toLowerCase();
    
    // Innovation Focus
    if (lower.includes('digitalization') || lower.includes('digitalisierung') ||
        lower.includes('sustainability') || lower.includes('nachhaltigkeit') ||
        lower.includes('rd') || lower.includes('r&d') ||
        lower.includes('innovation') || lower.includes('digital transformation')) {
      return { type: 'innovation_focus', value: text };
    }
    
    // Technology Areas
    if (lower.includes('ai') || lower.includes('artificial intelligence') ||
        lower.includes('iot') || lower.includes('internet of things') ||
        lower.includes('blockchain') || lower.includes('biotechnology') ||
        lower.includes('machine learning') || lower.includes('deep learning') ||
        lower.includes('robotics') || lower.includes('roboter') ||
        lower.includes('software') || lower.includes('hardware')) {
      return { type: 'technology_area', value: text };
    }
    
    // Research Domains
    if (lower.includes('life sciences') || lower.includes('lebenswissenschaften') ||
        lower.includes('materials science') || lower.includes('materialwissenschaften') ||
        lower.includes('energy research') || lower.includes('energieforschung') ||
        lower.includes('medical research') || lower.includes('medizinforschung') ||
        lower.includes('pharmaceutical') || lower.includes('pharmazeutisch')) {
      return { type: 'research_domain', value: text };
    }
    
    // Sector Focus
    if (lower.includes('manufacturing') || lower.includes('produktion') ||
        lower.includes('healthcare') || lower.includes('gesundheitswesen') ||
        lower.includes('energy') || lower.includes('energie') ||
        lower.includes('agriculture') || lower.includes('landwirtschaft') ||
        lower.includes('tourism') || lower.includes('tourismus') ||
        lower.includes('construction') || lower.includes('bau')) {
      return { type: 'sector_focus', value: text };
    }
    
    // Default: innovation_focus if no specific match
    if (text.length > 10 && text.length < 300) {
      return { type: 'innovation_focus', value: text };
    }
    
    return null;
  };
  
  if (projectMatches.length > 0) {
    const processedMatches = new Set<string>();
    
    projectMatches.forEach(match => {
      if (match[1] && match[1].trim().length > 15) {
        const value = match[1].trim();
        const cleaned = value.replace(/^(?:ist|sind|sein|werden)[\s,]+/i, '').trim();
        
        // Avoid duplicates
        if (processedMatches.has(cleaned.toLowerCase())) return;
        processedMatches.add(cleaned.toLowerCase());
        
        if (cleaned.length > 10 && cleaned.length < 300 && !cleaned.toLowerCase().includes('required')) {
          const categorizedProj = categorizeProject(cleaned);
          if (categorizedProj) {
            // Check for duplicates
            // Check for duplicates in the specific project category
            const projCategory = categorizedProj.type;
            const isDuplicate = (categorized[projCategory] || []).some((p: any) => 
              p.type === categorizedProj.type && p.value.toLowerCase() === categorizedProj.value.toLowerCase()
            );
            if (!isDuplicate) {
              // Store in separate top-level category
              const projCategory = categorizedProj.type; // e.g., 'innovation_focus', 'technology_area', etc.
              if (!categorized[projCategory]) {
                categorized[projCategory] = [];
              }
              categorized[projCategory].push({
                type: categorizedProj.type as any,
                value: categorizedProj.value,
                required: true,
                source: 'context_extraction'
              });
            }
          }
        }
      }
    });
  }
  // Don't add generic placeholder - only add if we find meaningful content
  
  // COMPLIANCE - Enhanced: Extract actual compliance requirements
  const complianceMatches = [
    ...safeMatchAll(safeText, /(?:compliance|konformität|richtlinie|standard|norm|vorschrift|regulation)[\s:]+([^\.\n]{15,400})/gi),
    ...safeMatchAll(safeText, /(?:muss|müssen|soll|sollen)[\s]+(?:den|der|die|the)[\s]+(?:richtlinien|standards|norms|regulations|vorschriften)[\s:]+([^\.\n]{15,400})/gi),
    ...safeMatchAll(safeText, /(?:erfüllen|meet|comply)[\s]+(?:mit|with)[\s]+(?:richtlinien|standards|norms|regulations|compliance)[\s:]+([^\.\n]{15,400})/gi),
    ...safeMatchAll(safeText, /(?:iso|en|din|ec)[\s]+(\d+)[\s:]+([^\.\n]{10,200})/gi),
    ...safeMatchAll(safeText, /(?:certification|zertifizierung|zertifikat)[\s:]+([^\.\n]{15,400})/gi)
  ];
  if (complianceMatches.length > 0) {
    const sortedMatches = complianceMatches
      .filter(m => m[1] && m[1].trim().length > 15)
      .sort((a, b) => b[1].trim().length - a[1].trim().length);
    
    const bestMatch = sortedMatches[0];
    if (bestMatch && bestMatch[1]) {
      const value = bestMatch[1].trim();
      let cleaned = value.replace(/^(?:sind|soll|muss|müssen|darf|dürfen|erforderlich|required)[\s,]+/i, '').trim();
      cleaned = cleaned.replace(/^(?:compliance|konformität|richtlinie|standard|norm)[\s:]+/i, '').trim();
      
      if (cleaned.length > 15 && cleaned.length < 400 && !cleaned.toLowerCase().includes('required') && !cleaned.toLowerCase().includes('specified')) {
        categorized.compliance.push({
          type: 'compliance_requirement',
          value: cleaned,
          required: true,
          source: 'context_extraction'
        });
      }
    }
  }
  // Don't add generic placeholder - only add if we find meaningful content
  
  // LEGAL - Enhanced: Extract actual legal requirements
  const legalMatches = [
    ...safeMatchAll(safeText, /(?:rechtlich|legal|gesetz|recht|law)[\s:]+([^\.\n]{15,200})/gi)
  ];
  if (legalMatches.length > 0) {
    const bestMatch = legalMatches.find(m => m[1] && m[1].trim().length > 15);
    if (bestMatch && bestMatch[1]) {
      const value = bestMatch[1].trim();
      const cleaned = value.replace(/^(?:sind|soll|muss|müssen|darf|dürfen|erforderlich|required)[\s,]+/i, '').trim();
      if (cleaned.length > 15 && cleaned.length < 300 && !cleaned.toLowerCase().includes('required') && !cleaned.toLowerCase().includes('compliance')) {
        categorized.legal.push({
          type: 'legal_compliance',
          value: cleaned,
          required: true,
          source: 'context_extraction'
        });
      }
    }
  }
  // Don't add generic placeholder - only add if we find meaningful content
  
  // TECHNICAL - Enhanced: Extract actual technical requirements from context
  const technicalMatches = [
    ...safeMatchAll(safeText, /(?:technisch|technical|technologie|tech|technik|technologisch)[\s:]+([^\.\n]{15,300})/gi),
    ...safeMatchAll(safeText, /(?:anforderungen|requirements|spezi|spezifikation|technische.anforderungen)[\s:]+([^\.\n]{15,300})/gi),
    ...safeMatchAll(safeText, /(?:muss|müssen|soll|sollen|darf|dürfen|sind|erforderlich)\s+(?:technisch|technical|technologisch)[\s:]+([^\.\n]{15,300})/gi),
    ...safeMatchAll(safeText, /(?:technisch|technical)[\s]+(?:sind|muss|müssen|soll|sollen|erforderlich|benötigt)[\s:]+([^\.\n]{15,300})/gi),
    ...safeMatchAll(safeText, /(?:technologie|technik|technology)[\s]+(?:muss|müssen|soll|sollen|ist|sind|erforderlich)[\s:]+([^\.\n]{15,300})/gi)
  ];
  if (technicalMatches.length > 0) {
    // Use best match (prefer longer, more descriptive ones)
    const bestMatch = technicalMatches
      .filter(m => m[1] && m[1].trim().length > 20)
      .sort((a, b) => b[1].trim().length - a[1].trim().length)[0];
    
    if (bestMatch && bestMatch[1]) {
      const value = bestMatch[1].trim();
      // Clean up common prefixes/suffixes more aggressively
      let cleaned = value.replace(/^(?:sind|soll|sollen|muss|müssen|darf|dürfen|ist|werden|kann|technisch|technical)[\s,]+/i, '').trim();
      cleaned = cleaned.replace(/^(?:anforderungen|requirements|spezi|spezifikation)[\s:]+/i, '').trim();
      cleaned = cleaned.replace(/[\s,]+$/i, '').trim();
      
      // Remove if it's still too generic
      const lowerCleaned = cleaned.toLowerCase();
      if (cleaned.length > 15 && cleaned.length < 400 &&
          !lowerCleaned.includes('required') && 
          !lowerCleaned.includes('specified') &&
          !lowerCleaned.match(/^(technical|technisch|anforderungen?)(\s|$)/i) &&
          !lowerCleaned.match(/^(muss|müssen|soll|sollen)(\s|$)/i)) {
        categorized.technical.push({
          type: 'technical_requirement',
          value: cleaned,
          required: true,
          source: 'context_extraction'
        });
      }
    }
  }
  // Don't add generic placeholder - only add if we find meaningful content
  
  // FINANCIAL - CRITICAL CATEGORY - Enhanced extraction with more patterns
  const financialKeywords = [
    'finanzierung', 'funding', 'investition', 'förderung', 'förderbetrag',
    'förderhöhe', 'maximalförderung', 'maximal', 'bis zu',
    'zuwendung', 'subvention', 'darlehen', 'kredit', 'grant',
    'betrag', 'volumen', 'summe', 'höhe', 'amount', 'loan',
    'finanzierungsvolumen', 'fördervolumen', 'finanzierungsbetrag'
  ];
  
  // PRIORITY 2: Handle variable funding amounts (contact for amount, variable, etc.)
  const variableAmountMatches = [
    ...safeMatchAll(safeText, /(?:contact\s+for\s+amount|kontakt\s+für\s+betrag|betrag\s+auf\s+anfrage|amount\s+on\s+request)/gi),
    ...safeMatchAll(safeText, /(?:variable\s+amount|variabler\s+betrag|flexible\s+funding|flexible\s+finanzierung)/gi),
    ...safeMatchAll(safeText, /(?:individual\s+assessment|individuelle\s+beurteilung|case-by-case)/gi)
  ];
  if (variableAmountMatches.length > 0 && categorized.financial.length === 0) {
    categorized.financial.push({
      type: 'funding_amount_status',
      value: 'Variable amount - contact for details',
      required: false,
      source: 'context_extraction'
    });
  }
  
  // Always try to extract financial info (CRITICAL category)
  const financialContextMatches = [
    ...safeMatchAll(safeText, /(?:förderhöhe|förderbetrag|finanzierung|funding|maximal|fördervolumen|finanzierungsvolumen|betrag|summe|höhe)[\s:]+([^\.\n]{15,300})/gi),
    ...safeMatchAll(safeText, /(?:finanzierung|funding|förderung|darlehen|kredit)[\s]+(?:von|of|bis zu|up to|maximal|maximum|zwischen|between|von|from)[\s:]+([^\.\n]{15,300})/gi),
    ...safeMatchAll(safeText, /(?:beträgt|betragen|is|are|amounts to|kann|können)[\s]+(?:bis zu|up to|maximal)?[\s]*€?\s*([^\.\n]{15,300})/gi),
    ...safeMatchAll(safeText, /(?:verfügbar|available|bereitgestellt|provided)[\s]+(?:sind|ist|are|is)[\s]+(?:bis zu|up to|maximal|maximum)?[\s]*€?\s*([^\.\n]{15,300})/gi),
    ...safeMatchAll(safeText, /(?:finanzierungsvolumen|fördervolumen|investitionsvolumen)[\s:]+([^\.\n]{15,300})/gi)
  ];
  
  // Process financial context matches (CRITICAL - extract even if no explicit keywords)
  const validFinancialContexts = financialContextMatches
    .filter(m => m[1] && m[1].trim().length > 15)
    .map(m => {
      const value = m[1].trim();
      const cleaned = value.replace(/^(?:ist|sind|beträgt|betragen|bis zu|up to|maximal|maximum)[\s,]+/i, '').trim();
      return cleaned;
    })
    .filter(val => val.length > 15 && val.length < 320)
    .filter(val => {
      const lower = val.toLowerCase();
      return !lower.includes('specified') && !lower.includes('available') &&
             !lower.includes('erforderlich') && !lower.includes('required') &&
             (lower.includes('€') || lower.includes('euro') || 
              /\d/.test(val) || val.split(/\s+/).length > 2);
    });
  
  if (validFinancialContexts.length > 0) {
        // LEARNING: Try learned financial patterns first - FIX: Make it synchronous for better quality improvement
        try {
          const { getLearnedPatterns } = require('./extract-learning');
          const host = url ? new URL(url).hostname.replace('www.', '') : undefined;
          // FIX: Use await to ensure learned patterns are applied before extraction
          const learnedPatterns = await getLearnedPatterns('financial', host).catch(() => []);
          for (const learnedPattern of learnedPatterns.slice(0, 5)) { // Limit to top 5 patterns
            try {
              const regex = new RegExp(learnedPattern.pattern, 'gi');
              const match = safeText.match(regex);
              if (match) {
                // Add to financial matches if not already present
                validFinancialContexts.push(match[0]);
                const { learnFromExtraction } = require('./extract-learning');
                learnFromExtraction('financial', learnedPattern.pattern, true, host).catch(() => {});
              }
            } catch {}
          }
        } catch {}
    
    // Add all unique meaningful financial contexts (not just one)
    const uniqueFinancials = new Set<string>();
    validFinancialContexts.forEach(context => {
      const isDuplicate = Array.from(uniqueFinancials).some(existing => {
        const similarity = existing.toLowerCase().includes(context.toLowerCase().substring(0, 30)) ||
                          context.toLowerCase().includes(existing.toLowerCase().substring(0, 30));
        return similarity && Math.abs(existing.length - context.length) < 50;
      });
      if (!isDuplicate) {
        uniqueFinancials.add(context);
      }
    });
    
    uniqueFinancials.forEach(context => {
      categorized.financial.push({
        type: 'funding_amount_description',
        value: context.length >= 20 ? context : `Funding information: ${context}`,
        required: true,
        source: 'context_extraction'
      });
      
      // LEARNING: Track successful financial extraction
      try {
        const { learnFromExtraction } = require('./extract-learning');
        const host = url ? new URL(url).hostname.replace('www.', '') : undefined;
        learnFromExtraction('financial', context.substring(0, 100), true, host).catch(() => {});
      } catch {}
    });
  }
  
    if (financialKeywords.some(k => lowerText.includes(k))) {
    // Try multiple patterns for amounts - IMPROVED to capture full amount with currency
    const amountPatterns = [
      // Pattern 1: "bis zu 50.000 EUR" or "bis zu 50.000€" - capture full amount with currency
      /(?:bis zu|maximal|förderbetrag|förderhöhe|förderung|finanzierung)\s*(\d{1,3}(?:[.,\s]\d{3})*(?:[.,]\d{2})?)\s*(?:€|EUR|euro)/i,
      // Pattern 2: "€ 50.000" or "EUR 50.000" - currency first
      /(?:€|EUR|euro)\s*(\d{1,3}(?:[.,\s]\d{3})*(?:[.,]\d{2})?)/i,
      // Pattern 3: "50.000 €" or "50.000 EUR" - currency after
      /(\d{1,3}(?:[.,\s]\d{3})*(?:[.,]\d{2})?)\s*(?:€|EUR|euro)/i,
      // Pattern 4: "50 Millionen EUR" or "50 Mio. EUR"
      /(\d{1,3}(?:[.,]\d{3})*)\s*(?:million|millionen|mio\.?)\s*(?:€|EUR|euro)?/i
    ];
    
    let amountMatch: RegExpMatchArray | null = null;
    let fullAmountText = '';
    for (const pattern of amountPatterns) {
      const match = safeText.match(pattern);
      if (match) {
        amountMatch = match;
        fullAmountText = match[0]; // Capture full match including currency
        break;
      }
    }
    
    // Also try to extract context around financial keywords - ENHANCED for better depth
    const financialContextMatches = [
      ...safeMatchAll(safeText, /(?:förderhöhe|förderbetrag|finanzierung|funding|maximal|fördervolumen|finanzierungsvolumen)[\s:]+([^\.\n]{15,250})/gi),
      ...safeMatchAll(safeText, /(?:finanzierung|funding|förderung)[\s]+(?:von|of|bis zu|up to|maximal|maximum|zwischen|between)[\s:]+([^\.\n]{15,250})/gi),
      ...safeMatchAll(safeText, /(?:beträgt|betragen|is|are|amounts to|kann)[\s]+(?:bis zu|up to|maximal)?[\s]*€?\s*([^\.\n]{15,250})/gi)
    ];
    
    // Process all context matches for better extraction
    const validFinancialContexts = financialContextMatches
      .filter(m => m[1] && m[1].trim().length > 15)
      .map(m => {
        const value = m[1].trim();
        const cleaned = value.replace(/^(?:ist|sind|beträgt|betragen|bis zu|up to|maximal|maximum)[\s,]+/i, '').trim();
        // CRITICAL: Reject incomplete patterns like "bis zu 50" or "maximal 5" without currency
        const hasCurrency = /(?:€|EUR|euro|currency)/i.test(cleaned);
        const hasAmount = /\d{1,3}(?:[.,\s]\d{3})*(?:[.,]\d{2})?/.test(cleaned);
        
        // ENHANCED: Reject incomplete patterns (e.g., "bis zu 50", "maximal 5", "up to 10")
        const isIncompletePattern = !hasCurrency && /^(?:bis zu|maximal|up to|max|min|minimum|mindestens)\s*\d{1,2}(?:\s|$|,|\.)/i.test(cleaned);
        
        // ENHANCED: Also reject if it's just a description without actual amount
        const isDescriptionOnly = !hasAmount && !hasCurrency && cleaned.length > 50;
        
        // ENHANCED: Reject patterns like "Maximum funding amount available: bis zu 50" (incomplete)
        const hasIncompleteContext = /(?:maximum|maximal|minimum|min|bis zu|up to)\s+(?:funding|amount|betrag|summe|förderung|finanzierung)[\s:]+(?:bis zu|up to|maximal)?\s*\d{1,2}(?:\s|$|,|\.)/i.test(cleaned);
        
        return (isIncompletePattern || isDescriptionOnly || hasIncompleteContext) ? null : cleaned;
      })
      .filter(val => val !== null) // Filter out incomplete patterns
      .filter(val => val.length > 15 && val.length < 280)
      .filter(val => {
        const lower = val.toLowerCase();
        return !lower.includes('specified') && !lower.includes('available') &&
               !lower.includes('erforderlich') && !lower.includes('required') &&
               (lower.includes('€') || lower.includes('euro') || 
                /\d/.test(val) || val.split(/\s+/).length > 3);
      });
    
      if (validFinancialContexts.length > 0) {
      // Use the longest/most detailed match
      const bestMatch = validFinancialContexts.sort((a, b) => b.length - a.length)[0];
      if (bestMatch) {
        let addedNumericValue = false;
        
        // ENHANCED: Try to extract numeric values from description (including ranges)
        // Pattern 1: Range "EUR 20,000 - EUR 150,000" or "from EUR 20,000 to EUR 150,000"
        const rangeMatch = bestMatch.match(/(?:from|von|zwischen|between)?\s*(?:EUR|€|euro)?\s*(\d{1,3}(?:[.,\s]\d{3})*(?:[.,]\d{2})?)\s*(?:-|to|bis|und|and)\s*(?:EUR|€|euro)?\s*(\d{1,3}(?:[.,\s]\d{3})*(?:[.,]\d{2})?)\s*(?:EUR|€|euro)?/i);
        if (rangeMatch && rangeMatch[1] && rangeMatch[2]) {
          const minStr = rangeMatch[1].replace(/[.,\s]/g, '');
          const maxStr = rangeMatch[2].replace(/[.,\s]/g, '');
          const minValue = parseInt(minStr);
          const maxValue = parseInt(maxStr);
          
          // Check if in millions
          const isMillion = /\b(million|millionen|mio)\b/i.test(bestMatch);
          const finalMin = isMillion ? minValue * 1_000_000 : minValue;
          const finalMax = isMillion ? maxValue * 1_000_000 : maxValue;
          
          if (finalMin >= 100 && finalMax <= 1_000_000_000_000 && finalMin < finalMax) {
            // Add both min and max
            const hasMin = categorized.financial.some(f => 
              f.type === 'funding_amount_min' && Math.abs(Number(f.value) - finalMin) < 1000
            );
            const hasMax = categorized.financial.some(f => 
              f.type === 'funding_amount_max' && Math.abs(Number(f.value) - finalMax) < 1000
            );
            
            if (!hasMin) {
              categorized.financial.push({
                type: 'funding_amount_min',
                value: String(finalMin),
                required: true,
                source: 'description_parsing'
              });
            }
            if (!hasMax) {
              categorized.financial.push({
                type: 'funding_amount_max',
                value: String(finalMax),
                required: true,
                source: 'description_parsing'
              });
            }
            // Don't add description if we got numeric values
            addedNumericValue = true;
          }
        }
        
        // Pattern 2: Single amount (only if range didn't match)
        if (!addedNumericValue) {
          const numericMatch = bestMatch.match(/(\d{1,3}(?:[.,\s]\d{3})*(?:[.,]\d{2})?)/);
          if (numericMatch) {
            const numStr = numericMatch[1].replace(/[.,\s]/g, '');
            const numValue = parseInt(numStr);
            // Check if it's in millions
            const isMillion = /\b(million|millionen|mio)\b/i.test(bestMatch);
            const finalValue = isMillion ? numValue * 1_000_000 : numValue;
            
            if (finalValue >= 100 && finalValue <= 1_000_000_000_000) {
              // Check for duplicates
              const isDuplicate = categorized.financial.some(f => 
                (f.type === 'funding_amount_max' || f.type === 'funding_amount_min') && 
                Math.abs(Number(f.value) - finalValue) < 1000
              );
              if (!isDuplicate) {
                categorized.financial.push({
                  type: 'funding_amount_max',
                  value: String(finalValue),
                  required: true,
                  source: 'description_parsing'
                });
              }
              // Don't add description if we got numeric value
              addedNumericValue = true;
            }
          }
        }
        
        // Only add description if we didn't extract numeric values
        if (!addedNumericValue) {
          // Check for duplicates
          const isDuplicate = categorized.financial.some(f => {
            const similarity = f.value.toLowerCase().includes(bestMatch.toLowerCase().substring(0, 30)) ||
                              bestMatch.toLowerCase().includes(f.value.toLowerCase().substring(0, 30));
            return similarity;
          });
          if (!isDuplicate) {
            categorized.financial.push({
              type: 'funding_amount_description',
              value: bestMatch,
              required: true,
              source: 'context_extraction'
            });
          }
        }
      }
    }
    
    // Always add amount if found - IMPROVED: use fullAmountText if available (includes currency)
    if (amountMatch) {
      // Use fullAmountText if it includes currency, otherwise use match[0]
      const amountValue = (fullAmountText && /(?:€|EUR|euro)/i.test(fullAmountText)) 
        ? fullAmountText.trim() 
        : amountMatch[0].trim();
      
      // CRITICAL: Reject incomplete amounts (missing currency, too short, suspicious patterns)
      const hasCurrency = /(?:€|EUR|euro)/i.test(amountValue);
      const isIncomplete = (
        !hasCurrency && amountValue.length < 20 && // No currency and too short
        /^(?:bis zu|maximal|up to)\s*\d{1,2}$/i.test(amountValue.trim()) // Pattern like "bis zu 50" or "maximal 5"
      );
      
      if (isIncomplete) {
        // Skip incomplete amounts - don't add them
        // These are likely truncated or missing context
      } else {
        // Make short amounts meaningful by adding context (target: >= 20 chars)
        // But only if it doesn't already have currency
        const contextualValue = (!hasCurrency && amountValue.length < 20)
          ? `Maximum funding amount available: ${amountValue}`
          : amountValue;
        
        categorized.financial.push({
          type: 'funding_amount_max',
          value: contextualValue,
          required: true,
          source: amountValue.includes('€') || amountValue.includes('EUR') ? 'context_extraction' : 'full_page_content'
        });
      }
    }
    // Don't add generic placeholder - only if amount found
  }
  
  // CONSORTIUM - Enhanced: Extract partnership details
  // FIX: Reject contact info, only extract partnership requirements
  const consortiumMatches = [
    ...safeMatchAll(safeText, /(?:konsortium|consortium|partner|partnership)[\s:]+([^\.\n]{10,150})/gi),
    ...safeMatchAll(safeText, /(?:mindestens|at least|minimum|minimum of)[\s]+(\d+)[\s]*(?:partner|partners)/gi),
    ...safeMatchAll(safeText, /(?:minimum|mindestens|at least)\s+(\d+)\s*(?:partner|partners)\s+(?:aus|from|von)\s+(\d+)\s*(?:länder|countries)/gi)
  ];
  if (consortiumMatches.length > 0) {
    const bestMatch = consortiumMatches.find(m => m[1] && (m[1].trim().length > 10 || /^\d+/.test(m[1])));
    if (bestMatch && bestMatch[1]) {
      const value = bestMatch[1].trim();
      
      // FIX: Reject contact information (phone numbers, emails, names)
      const isContactInfo = 
        /\+?\d{1,4}[\s\-\.]?\d{1,4}[\s\-\.]?\d{1,4}[\s\-\.]?\d{1,4}/.test(value) || // Phone number
        /@/.test(value) || // Email
        /^(?:mag\.|dr\.|prof\.|ing\.|mag|dr|prof|ing)\s+[A-Z]/.test(value) || // Name with title
        /^[A-Z][a-z]+\s+[A-Z][a-z]+:\s*\+?\d/.test(value); // "Name: +43..."
      
      // Only accept partnership requirements, not contact info
      const isPartnershipRequirement = 
        /\b(partner|partners|partnership|konsortium|consortium|minimum|mindestens|at least|required|erforderlich)\b/i.test(value) ||
        /^\d+\s*(?:partner|partners)/i.test(value);
      
      if (value.length > 5 && value.length < 200 && 
          !isContactInfo && isPartnershipRequirement &&
          !value.toLowerCase().includes('required') && 
          !value.toLowerCase().includes('specified')) {
        categorized.consortium.push({
          type: 'consortium_requirement',
          value: value,
          required: true,
          source: 'context_extraction'
        });
      }
    }
  }
  // Don't add generic placeholder - only add if we found meaningful content
  
  // USE OF FUNDS - Enhanced: Extract actual usage requirements with more depth
  // USE OF FUNDS - ULTRA-ENHANCED: More patterns, much less strict filtering, lower minimums
  const useOfFundsMatches = [
    // Direct patterns - LOWERED minimum length
    ...safeMatchAll(safeText, /(?:verwendung|use of funds|zweck|verwendungszweck|verwendungsmöglichkeit|finanzierungszweck|förderzweck|investitionszweck|zweckbindung)[\s:]+([^\.\n]{10,400})/gi),
    ...safeMatchAll(safeText, /(?:finanzierung|funding|förderung)[\s]+(?:für|for|zur|zur Verwendung|for use in|for the purpose of|dient|dienen)[\s:]+([^\.\n]{10,400})/gi),
    ...safeMatchAll(safeText, /(?:verwendet|used|einsetzen|investiert|genutzt|utilized)[\s]+(?:werden|can be|should be|must be|kann|darf|soll)[\s]+(?:für|for|zur)[\s:]+([^\.\n]{10,400})/gi),
    ...safeMatchAll(safeText, /(?:erlaubt|allowed|zulässig|geeignet)[\s]+(?:für|for|zur)[\s:]+([^\.\n]{10,400})/gi),
    // Common use cases
    ...safeMatchAll(safeText, /(?:investition|investment|investitionen|investments)[\s]+(?:in|into|für|for)[\s:]+([^\.\n]{10,400})/gi),
    ...safeMatchAll(safeText, /(?:kosten|costs|ausgaben|expenses)[\s]+(?:für|for|von|of)[\s:]+([^\.\n]{10,400})/gi),
    // List patterns (common in funding pages)
    ...safeMatchAll(safeText, /(?:verwendet|used|geeignet|suitable)[\s]+(?:für|for|zur)[\s:]*\s*(?:investition|entwicklung|forschung|marketing|personal|ausrüstung|equipment|maschinen|machinery|immobilie|kapital)[\s:]+([^\.\n]{10,300})/gi),
    // Generic patterns (broader)
    ...safeMatchAll(safeText, /(?:kann|können|darf|dürfen|soll|sollen|muss|müssen)[\s]+(?:für|for|zur|zur Finanzierung|for financing)[\s:]+([^\.\n]{10,400})/gi),
    // NEW: Fallback patterns - catch more generic mentions
    ...safeMatchAll(safeText, /(?:finanziert|financed|gefördert|funded)[\s]+(?:werden|can be|should be|kann|soll)[\s]+(?:für|for|zur)[\s:]+([^\.\n]{10,400})/gi),
    ...safeMatchAll(safeText, /(?:zweck|purpose|ziel|goal)[\s]+(?:der|des|of|the)[\s]+(?:finanzierung|funding|förderung)[\s:]+([^\.\n]{10,400})/gi),
    // NEW: Use case lists (common format: "The funding can be used for: X, Y, Z")
    ...safeMatchAll(safeText, /(?:verwendet|used|geeignet|suitable)[\s]+(?:für|for|zur)[\s:]+([^\.\n]{10,400})/gi),
    // NEW: Section headers for use of funds
    ...safeMatchAll(safeText, /(?:verwendungszweck|use of funds|zweckbindung|verwendungsmöglichkeit)[\s:]+([^\.\n]{10,400})/gi)
  ];
  
  // Process all matches with MUCH MORE RELAXED filtering
  const validUseMatches = useOfFundsMatches
    .filter(m => m[1] && m[1].trim().length > 10) // LOWERED from 15
    .map(m => {
      const value = m[1].trim();
      const cleaned = value.replace(/^(?:ist|sind|sein|werden|darf|dürfen|soll|sollen|kann|können|muss|müssen|erlaubt|allowed|zulässig|geeignet)[\s,]+/i, '').trim();
      return cleaned;
    })
    .filter(val => val.length >= 10 && val.length < 500) // LOWERED minimum from 15 to 10
    .filter(val => {
      const lower = val.toLowerCase();
      // MUCH LESS STRICT - accept if it has common use indicators OR is reasonably long OR has multiple words
      const hasUseIndicator = lower.includes('investition') || lower.includes('investment') ||
              lower.includes('entwicklung') || lower.includes('development') ||
              lower.includes('forschung') || lower.includes('research') ||
              lower.includes('marketing') || lower.includes('personal') ||
              lower.includes('ausrüstung') || lower.includes('equipment') ||
              lower.includes('maschinen') || lower.includes('machinery') ||
              lower.includes('immobilie') || lower.includes('real estate') ||
              lower.includes('kapital') || lower.includes('capital') ||
              lower.includes('innovation') || lower.includes('technologie') ||
              lower.includes('infrastruktur') || lower.includes('infrastructure') ||
              lower.includes('software') || lower.includes('hardware') ||
              lower.includes('schulung') || lower.includes('training') ||
              lower.includes('material') || lower.includes('equipment') ||
              lower.includes('maschine') || lower.includes('machine') ||
              lower.split(/\s+/).length >= 2 || // LOWERED from 3 - accept 2-word descriptions
              val.length >= 20; // Accept if reasonably long even without specific keywords
      
      // Reject if it's clearly not a use case
      const valLower = val.toLowerCase();
      const isGeneric = valLower.includes('specified') || valLower.includes('required') ||
                       valLower.includes('available') || valLower.includes('erforderlich') ||
                       valLower.includes('contact') || valLower.includes('kontakt') ||
                       (val.length < 20 && !hasUseIndicator); // LOWERED from 30
      
      return hasUseIndicator && !isGeneric;
    });
  
  if (validUseMatches.length > 0) {
    // Add the most detailed/meaningful match (longest is usually most descriptive)
    const bestMatch = validUseMatches.sort((a, b) => b.length - a.length)[0];
    if (bestMatch) {
      // Check if it's not a duplicate
      const isDuplicate = categorized.use_of_funds.some(u => {
        const similarity = u.value.toLowerCase().includes(bestMatch.toLowerCase().substring(0, 30)) ||
                          bestMatch.toLowerCase().includes(u.value.toLowerCase().substring(0, 30));
        return similarity && Math.abs(bestMatch.length - u.value.length) < 50;
      });
      
      if (!isDuplicate) {
        categorized.use_of_funds.push({
          type: 'use_of_funds',
          value: bestMatch,
          required: true,
          source: 'context_extraction'
        });
      }
    }
  }
  
  // FALLBACK: If no use_of_funds extracted but keywords exist, extract any use-related content
  if (categorized.use_of_funds.length === 0 && (lowerText.includes('verwendung') || lowerText.includes('use of') || lowerText.includes('zweck') || lowerText.includes('eligible cost') || lowerText.includes('förderbare'))) {
    const fallbackMatches = [
      ...safeMatchAll(safeText, /(?:verwendung|use of|zweck|eligible cost|förderbare)[\s:]+([^\.\n]{15,300})/gi),
      ...safeMatchAll(safeText, /(?:kann|can|darf|may)[\s]+(?:verwendet|used|genutzt|utilized)[\s]+(?:werden|be)[\s]+(?:für|for)[\s:]+([^\.\n]{15,300})/gi),
      ...safeMatchAll(safeText, /(?:funding|förderung|finanzierung)[\s]+(?:kann|can|darf|may)[\s]+(?:verwendet|used)[\s]+(?:werden|be)[\s]+(?:für|for)[\s:]+([^\.\n]{15,300})/gi)
    ];
    if (fallbackMatches.length > 0) {
      const bestFallback = fallbackMatches.find(m => m[1] && m[1].trim().length >= 15 && !m[1].toLowerCase().includes('required'));
      if (bestFallback && bestFallback[1]) {
        const value = bestFallback[1].trim();
        if (value.length >= 15 && value.length < 400) {
          categorized.use_of_funds.push({
            type: 'use_of_funds',
            value: value,
            required: true,
            source: 'fallback_extraction'
          });
        }
      }
    }
  }
  
  // Don't add generic placeholder - only add if we found meaningful content
  
  // CAPEX/OPEX - Enhanced: Extract investment/operational requirements
  const capexMatches = [
    ...safeMatchAll(safeText, /(?:investition|capex|opex|betriebsausgaben|investment|operational)[\s:]+([^\.\n]{15,200})/gi)
  ];
  if (capexMatches.length > 0) {
    const bestMatch = capexMatches.find(m => m[1] && m[1].trim().length > 15);
    if (bestMatch && bestMatch[1]) {
      const value = bestMatch[1].trim();
      const cleaned = value.replace(/^(?:ist|sind|sein|werden)[\s,]+/i, '').trim();
      if (cleaned.length > 15 && cleaned.length < 300 && !cleaned.toLowerCase().includes('requirements')) {
        categorized.capex_opex.push({
          type: 'capex_opex',
          value: cleaned,
          required: true,
          source: 'context_extraction'
        });
      }
    }
  } else if (lowerText.includes('investition') || lowerText.includes('capex') || lowerText.includes('opex') || lowerText.includes('betriebsausgaben')) {
    categorized.capex_opex.push({
      type: 'capex_opex',
      value: 'Capex/Opex requirements',
      required: true,
      source: 'full_page_content'
    });
  }
  
  // REVENUE MODEL - Enhanced: Extract revenue model details
  const revenueMatches = [
    ...safeMatchAll(safeText, /(?:umsatz|revenue|erlös|geschäftsmodell|business model)[\s:]+([^\.\n]{15,200})/gi)
  ];
  if (revenueMatches.length > 0) {
    const bestMatch = revenueMatches.find(m => m[1] && m[1].trim().length > 15);
    if (bestMatch && bestMatch[1]) {
      const value = bestMatch[1].trim();
      const cleaned = value.replace(/^(?:ist|sind|sein|werden)[\s,]+/i, '').trim();
      if (cleaned.length > 15 && cleaned.length < 300 && !cleaned.toLowerCase().includes('specified')) {
        categorized.revenue_model.push({
          type: 'revenue_model',
          value: cleaned,
          required: true,
          source: 'context_extraction'
        });
      }
    }
  }
  // Don't add generic placeholder - only add if we found meaningful content
  
  // MARKET SIZE - Enhanced: Extract market size requirements with more patterns
  // IMPROVED: Expanded patterns to increase coverage from 2.1%
  const marketMatches = [
    ...safeMatchAll(safeText, /(?:marktgröße|market size|marktpotenzial|market potential|marktvolumen|market volume|marktnachfrage|market demand)[\s:]+([^\.\n]{15,200})/gi),
    ...safeMatchAll(safeText, /(?:target market|zielmarkt|addressable market|adressierbarer markt|total addressable market|tam)[\s:]+([^\.\n]{15,200})/gi),
    ...safeMatchAll(safeText, /(?:market|markt)[\s]+(?:size|größe|potential|potenzial)[\s:]+([^\.\n]{15,200})/gi),
    ...safeMatchAll(safeText, /(?:minimum|mindestens|at least)[\s]+(?:market|markt)[\s]+(?:size|größe)[\s:]+([^\.\n]{15,200})/gi),
    // Additional patterns for better coverage
    ...safeMatchAll(safeText, /(?:marktnachfrage|market demand|marktpotential)[\s:]+([^\.\n]{15,200})/gi),
    ...safeMatchAll(safeText, /(?:zielgruppe|target group|target audience)[\s:]+([^\.\n]{15,200})/gi),
    ...safeMatchAll(safeText, /(?:market|markt)[\s]+(?:opportunity|chance|chancen|opportunität)[\s:]+([^\.\n]{15,200})/gi),
    ...safeMatchAll(safeText, /(?:business model|geschäftsmodell)[\s]+(?:market|markt)[\s:]+([^\.\n]{15,200})/gi)
  ];
  if (marketMatches.length > 0) {
    const bestMatch = marketMatches.find(m => m[1] && m[1].trim().length > 15);
    if (bestMatch && bestMatch[1]) {
      const value = bestMatch[1].trim();
      const cleaned = value.replace(/^(?:ist|sind|sein|werden)[\s,]+/i, '').trim();
      if (cleaned.length > 15 && cleaned.length < 300 && !cleaned.toLowerCase().includes('requirements')) {
        categorized.market_size.push({
          type: 'market_size',
          value: cleaned,
          required: true,
          source: 'context_extraction'
        });
        
        // LEARNING: Track successful market size pattern match
        try {
          const { learnFromExtraction } = require('./extract-learning');
          const host = url ? new URL(url).hostname.replace('www.', '') : undefined;
          learnFromExtraction('market_size', bestMatch[0].substring(0, 100), true, host).catch(() => {});
        } catch {}
      }
    }
  }
  // Don't add generic placeholder - only add if we found meaningful content
  
  // ============================================================================
  // NEW CATEGORIES (Priority 1)
  // ============================================================================
  
  // APPLICATION_PROCESS - How to apply, steps, timeline
  const applicationProcessMatches = [
    ...safeMatchAll(safeText, /(?:how\s+to\s+apply|bewerbung|antrag|application\s+process|application\s+steps)[\s:]+([^\.\n]{20,500})/gi),
    ...safeMatchAll(safeText, /(?:step\s+\d+|schritt\s+\d+|schritt\s+1|schritt\s+2|schritt\s+3)[\s:]+([^\.\n]{10,200})/gi),
    ...safeMatchAll(safeText, /(?:apply\s+via|bewerben\s+über|submit\s+via|einreichen\s+über)[\s:]+([^\.\n]{10,200})/gi),
    ...safeMatchAll(safeText, /(?:online\s+portal|online\s+form|email\s+application|bewerbungsportal)[\s:]+([^\.\n]{10,200})/gi)
  ];
  if (applicationProcessMatches.length > 0) {
    applicationProcessMatches.forEach(match => {
      if (match[1] && match[1].trim().length > 15) {
        const value = match[1].trim();
        const cleaned = value.replace(/^(?:ist|sind|soll|muss|müssen|erforderlich|required)[\s,]+/i, '').trim();
        if (cleaned.length > 15 && cleaned.length < 500 && !cleaned.toLowerCase().includes('required')) {
          const isDuplicate = categorized.application_process.some(a => 
            a.value.toLowerCase().includes(cleaned.toLowerCase().substring(0, 30)) ||
            cleaned.toLowerCase().includes(a.value.toLowerCase().substring(0, 30))
          );
          if (!isDuplicate) {
            categorized.application_process.push({
              type: 'application_steps',
              value: cleaned,
              required: true,
              source: 'context_extraction'
            });
          }
        }
      }
    });
  }
  
  // EVALUATION_CRITERIA - Scoring, selection criteria
  const evaluationCriteriaMatches = [
    ...safeMatchAll(safeText, /(?:evaluation\s+criteria|bewertungskriterien|scoring|bewertung)[\s:]+([^\.\n]{20,500})/gi),
    ...safeMatchAll(safeText, /(?:selection\s+criteria|auswahlkriterien|selection\s+based\s+on)[\s:]+([^\.\n]{20,500})/gi),
    ...safeMatchAll(safeText, /(?:innovation\s*\(?\d+%?\)?|market\s+potential\s*\(?\d+%?\)?|team\s*\(?\d+%?\)?)[\s:]+([^\.\n]{10,200})/gi),
    ...safeMatchAll(safeText, /(?:maximum\s+score|maximale\s+punktzahl|points|punkte)[\s:]+([^\.\n]{10,200})/gi)
  ];
  if (evaluationCriteriaMatches.length > 0) {
    evaluationCriteriaMatches.forEach(match => {
      if (match[1] && match[1].trim().length > 15) {
        const value = match[1].trim();
        const cleaned = value.replace(/^(?:ist|sind|soll|muss|müssen|erforderlich|required)[\s,]+/i, '').trim();
        if (cleaned.length > 15 && cleaned.length < 500 && !cleaned.toLowerCase().includes('required')) {
          const isDuplicate = categorized.evaluation_criteria.some(e => 
            e.value.toLowerCase().includes(cleaned.toLowerCase().substring(0, 30)) ||
            cleaned.toLowerCase().includes(e.value.toLowerCase().substring(0, 30))
          );
          if (!isDuplicate) {
            categorized.evaluation_criteria.push({
              type: 'scoring_criteria',
              value: cleaned,
              required: true,
              source: 'context_extraction'
            });
          }
        }
      }
    });
  }
  
  // REPAYMENT_TERMS - For loans (interest, repayment schedule)
  const repaymentTermsMatches = [
    ...safeMatchAll(safeText, /(?:interest\s+rate|zins|zinssatz|zinsen)[\s:]+([^\.\n]{10,200})/gi),
    ...safeMatchAll(safeText, /(?:repayment\s+period|rückzahlungsdauer|tilgungsdauer)[\s:]+([^\.\n]{10,200})/gi),
    ...safeMatchAll(safeText, /(?:repayment\s+schedule|tilgungsplan|rückzahlungsplan)[\s:]+([^\.\n]{10,200})/gi),
    ...safeMatchAll(safeText, /(?:grace\s+period|tilgungsfreie\s+zeit|stundung)[\s:]+([^\.\n]{10,200})/gi),
    ...safeMatchAll(safeText, /(?:collateral|sicherheit|bürgschaft)[\s:]+([^\.\n]{10,200})/gi)
  ];
  if (repaymentTermsMatches.length > 0) {
    repaymentTermsMatches.forEach(match => {
      if (match[1] && match[1].trim().length > 10) {
        const value = match[1].trim();
        const cleaned = value.replace(/^(?:ist|sind|soll|muss|müssen|erforderlich|required)[\s,]+/i, '').trim();
        if (cleaned.length > 10 && cleaned.length < 300) {
          const isDuplicate = categorized.repayment_terms.some(r => 
            r.value.toLowerCase().includes(cleaned.toLowerCase().substring(0, 30)) ||
            cleaned.toLowerCase().includes(r.value.toLowerCase().substring(0, 30))
          );
          if (!isDuplicate) {
            categorized.repayment_terms.push({
              type: 'repayment_terms',
              value: cleaned,
              required: true,
              source: 'context_extraction'
            });
          }
        }
      }
    });
  }
  
  // EQUITY_TERMS - For equity (valuation, stake, exit)
  const equityTermsMatches = [
    ...safeMatchAll(safeText, /(?:valuation|bewertung|pre-money|post-money)[\s:]+([^\.\n]{10,200})/gi),
    ...safeMatchAll(safeText, /(?:equity\s+stake|beteiligung|anteil)[\s:]+([^\.\n]{10,200})/gi),
    ...safeMatchAll(safeText, /(?:dilution|verwässerung)[\s:]+([^\.\n]{10,200})/gi),
    ...safeMatchAll(safeText, /(?:exit\s+terms|exit|ausstieg)[\s:]+([^\.\n]{10,200})/gi),
    ...safeMatchAll(safeText, /(?:voting\s+rights|stimmrechte)[\s:]+([^\.\n]{10,200})/gi)
  ];
  if (equityTermsMatches.length > 0) {
    equityTermsMatches.forEach(match => {
      if (match[1] && match[1].trim().length > 10) {
        const value = match[1].trim();
        const cleaned = value.replace(/^(?:ist|sind|soll|muss|müssen|erforderlich|required)[\s,]+/i, '').trim();
        if (cleaned.length > 10 && cleaned.length < 300) {
          const isDuplicate = categorized.equity_terms.some(e => 
            e.value.toLowerCase().includes(cleaned.toLowerCase().substring(0, 30)) ||
            cleaned.toLowerCase().includes(e.value.toLowerCase().substring(0, 30))
          );
          if (!isDuplicate) {
            categorized.equity_terms.push({
              type: 'equity_terms',
              value: cleaned,
              required: true,
              source: 'context_extraction'
            });
          }
        }
      }
    });
  }
  
  // INTELLECTUAL_PROPERTY - IP ownership, licensing
  const ipMatches = [
    ...safeMatchAll(safeText, /(?:intellectual\s+property|geistiges\s+eigentum|IP|patent)[\s:]+([^\.\n]{20,300})/gi),
    ...safeMatchAll(safeText, /(?:IP\s+ownership|eigentum\s+an\s+IP|patent\s+rights)[\s:]+([^\.\n]{20,300})/gi),
    ...safeMatchAll(safeText, /(?:licensing|lizenzierung|license)[\s:]+([^\.\n]{20,300})/gi),
    ...safeMatchAll(safeText, /(?:IP\s+remains\s+with|IP\s+verbleibt\s+bei)[\s:]+([^\.\n]{20,300})/gi)
  ];
  if (ipMatches.length > 0) {
    ipMatches.forEach(match => {
      if (match[1] && match[1].trim().length > 15) {
        const value = match[1].trim();
        const cleaned = value.replace(/^(?:ist|sind|soll|muss|müssen|erforderlich|required)[\s,]+/i, '').trim();
        if (cleaned.length > 15 && cleaned.length < 500 && !cleaned.toLowerCase().includes('required')) {
          const isDuplicate = categorized.intellectual_property.some(i => 
            i.value.toLowerCase().includes(cleaned.toLowerCase().substring(0, 30)) ||
            cleaned.toLowerCase().includes(i.value.toLowerCase().substring(0, 30))
          );
          if (!isDuplicate) {
            categorized.intellectual_property.push({
              type: 'ip_ownership',
              value: cleaned,
              required: true,
              source: 'context_extraction'
            });
          }
        }
      }
    });
  }
  
  // SUCCESS_METRICS - KPIs, milestones, success criteria
  const successMetricsMatches = [
    ...safeMatchAll(safeText, /(?:success\s+metrics|erfolgskriterien|KPIs|key\s+performance\s+indicators)[\s:]+([^\.\n]{20,300})/gi),
    ...safeMatchAll(safeText, /(?:milestones|meilensteine|milestone)[\s:]+([^\.\n]{20,300})/gi),
    ...safeMatchAll(safeText, /(?:target|ziel|goal)[\s:]+([^\.\n]{20,300})/gi).filter(m => 
      /(?:customers?|kunden|revenue|umsatz|employees?|mitarbeiter|jobs?|arbeitsplätze)/i.test(m[1] || '')
    ),
    ...safeMatchAll(safeText, /(?:must\s+achieve|muss\s+erreichen|erfolgreich\s+sein)[\s:]+([^\.\n]{20,300})/gi)
  ];
  if (successMetricsMatches.length > 0) {
    successMetricsMatches.forEach(match => {
      if (match[1] && match[1].trim().length > 15) {
        const value = match[1].trim();
        const cleaned = value.replace(/^(?:ist|sind|soll|muss|müssen|erforderlich|required)[\s,]+/i, '').trim();
        if (cleaned.length > 15 && cleaned.length < 500 && !cleaned.toLowerCase().includes('required')) {
          const isDuplicate = categorized.success_metrics.some(s => 
            s.value.toLowerCase().includes(cleaned.toLowerCase().substring(0, 30)) ||
            cleaned.toLowerCase().includes(s.value.toLowerCase().substring(0, 30))
          );
          if (!isDuplicate) {
            categorized.success_metrics.push({
              type: 'success_criteria',
              value: cleaned,
              required: true,
              source: 'context_extraction'
            });
          }
        }
      }
    });
  }
  
  // RESTRICTIONS - Exclusions, prohibited uses
  const restrictionsMatches = [
    ...safeMatchAll(safeText, /(?:not\s+eligible|nicht\s+geeignet|ausgeschlossen|excluded)[\s:]+([^\.\n]{20,300})/gi),
    ...safeMatchAll(safeText, /(?:prohibited\s+uses|verbotene\s+verwendung|nicht\s+erlaubt)[\s:]+([^\.\n]{20,300})/gi),
    ...safeMatchAll(safeText, /(?:cannot\s+be\s+used|darf\s+nicht\s+verwendet\s+werden)[\s:]+([^\.\n]{20,300})/gi),
    ...safeMatchAll(safeText, /(?:exclusions|ausschlüsse|ausgeschlossen)[\s:]+([^\.\n]{20,300})/gi)
  ];
  if (restrictionsMatches.length > 0) {
    restrictionsMatches.forEach(match => {
      if (match[1] && match[1].trim().length > 15) {
        const value = match[1].trim();
        const cleaned = value.replace(/^(?:ist|sind|soll|muss|müssen|erforderlich|required)[\s,]+/i, '').trim();
        if (cleaned.length > 15 && cleaned.length < 500 && !cleaned.toLowerCase().includes('required')) {
          const isDuplicate = categorized.restrictions.some(r => 
            r.value.toLowerCase().includes(cleaned.toLowerCase().substring(0, 30)) ||
            cleaned.toLowerCase().includes(r.value.toLowerCase().substring(0, 30))
          );
          if (!isDuplicate) {
            categorized.restrictions.push({
              type: 'restrictions',
              value: cleaned,
              required: true,
              source: 'context_extraction'
            });
          }
        }
      }
    });
  }
  
  // DIVERSITY
  if (lowerText.includes('frauen') || lowerText.includes('female') || lowerText.includes('divers') || lowerText.includes('diversität') || lowerText.includes('gender') || lowerText.includes('esg')) {
    // Only add if we can extract actual diversity requirements
    const diversityMatches = [
      ...safeMatchAll(safeText, /(?:frauen|female|divers|diversität|gender|esg)[\s:]+([^\.\n]{15,200})/gi)
    ];
    if (diversityMatches.length > 0) {
      const bestMatch = diversityMatches.find(m => m[1] && m[1].trim().length > 15);
      if (bestMatch && bestMatch[1]) {
        const value = bestMatch[1].trim();
        const cleaned = value.replace(/^(?:sind|soll|muss|müssen|erforderlich|required)[\s,]+/i, '').trim();
        if (cleaned.length > 15 && cleaned.length < 300 && !cleaned.toLowerCase().includes('requirement')) {
          categorized.diversity.push({
            type: 'diversity_requirement',
            value: cleaned,
            required: true,
            source: 'context_extraction'
          });
        }
      }
    }
  }
  
  // POST-PROCESSING: Remove any items with generic placeholder values
  // (Using isGenericPlaceholderEnhanced function instead of inline patterns)
  
    Object.keys(categorized).forEach(category => {
    categorized[category] = categorized[category].filter(item => {
      const value = String(item.value || '').trim();
      const categoryKey = category as string;
      
      // Remove if value is empty
      if (!value || value.length === 0) return false;
      
      // Category-specific length validation
      if (!validateCategoryLength(categoryKey, value)) return false;
      
      // Enhanced generic placeholder detection
      if (isGenericPlaceholderEnhanced(value)) return false;
      
      // Enhanced noise detection
      if (isNoiseEnhanced(value)) return false;
      
      // Relaxed data type validation (for financial, team, geographic, timeline)
      if (!hasValidDataType(categoryKey, value)) return false;
      
      // Remove duplicates (similarity check)
      const isDuplicate = categorized[category].some(other => {
        if (other === item) return false;
        const otherValue = String(other.value || '').trim();
        const similarity = otherValue.toLowerCase().includes(value.toLowerCase().substring(0, 30)) ||
                          value.toLowerCase().includes(otherValue.toLowerCase().substring(0, 30));
        return similarity && Math.abs(otherValue.length - value.length) < 50;
      });
      if (isDuplicate) return false;
      
      return true;
    });
  });
  
  return categorized;
}

// Extract from structured HTML elements (tables, definition lists, sections, headings)
function extractStructuredRequirements(html: string, categorized: Record<string, RequirementItem[]>): void {
  const $ = cheerio.load(html);
  
  // HEADING-BASED EXTRACTION: Find sections by headings and extract content below
  const headingKeywords: Record<string, string[]> = {
    financial: ['förderhöhe', 'förderbetrag', 'funding amount', 'maximal', 'bis zu', 'finanzierung', 'förderung', 'fördersumme', 'finanzierungsvolumen', 'betrag', 'höhe', 'summe', 'funding', 'financing', 'grant amount', 'loan amount', 'investment amount'],
    // Eligibility - split into subcategories
    company_type: ['teilnahmeberechtigt', 'voraussetzung', 'eligibility', 'anforderungen', 'kriterien', 'voraussetzungen', 'bedingungen', 'berechtigt', 'qualifiziert', 'zulassung', 'teilnahme', 'wer kann teilnehmen', 'wer kann beantragen', 'wer ist berechtigt', 'eligible', 'qualification', 'requirements', 'criteria', 'who can apply', 'who can participate', 'who is eligible', 'teilnahmevoraussetzungen', 'bewerbungsvoraussetzungen', 'antragsberechtigung', 'qualifikationskriterien', 'teilnahmekriterien', 'bewerbungskriterien', 'application requirements', 'participation requirements', 'qualification requirements', 'eligibility requirements', 'startup', 'sme', 'unternehmen', 'company', 'firma'],
    company_stage: ['company stage', 'unternehmensphase', 'startup stage', 'growth stage', 'seed', 'early stage', 'expansion', 'wachstum', 'skalierung'],
    industry_restriction: ['industry', 'branche', 'sektor', 'sector', 'technology', 'technologie', 'manufacturing', 'produktion', 'healthcare', 'gesundheitswesen'],
    eligibility_criteria: ['teilnahmeberechtigt', 'voraussetzung', 'eligibility', 'anforderungen', 'kriterien', 'voraussetzungen', 'bedingungen', 'berechtigt', 'qualifiziert', 'zulassung', 'teilnahme', 'wer kann teilnehmen', 'wer kann beantragen', 'wer ist berechtigt', 'eligible', 'qualification', 'requirements', 'criteria', 'who can apply', 'who can participate', 'who is eligible', 'teilnahmevoraussetzungen', 'bewerbungsvoraussetzungen', 'antragsberechtigung', 'qualifikationskriterien', 'teilnahmekriterien', 'bewerbungskriterien', 'application requirements', 'participation requirements', 'qualification requirements', 'eligibility requirements'],
    documents: ['unterlagen', 'dokumente', 'bewerbung', 'antrag', 'nachweis', 'formulare', 'belege', 'nachweise', 'formular', 'antragsunterlagen', 'bewerbungsunterlagen', 'benötigte unterlagen', 'erforderliche dokumente', 'documents required', 'required documents', 'application documents', 'application materials', 'submission documents', 'forms', 'required documents', 'benötigte dokumente', 'erforderliche unterlagen', 'supporting documents', 'beiliegende dokumente', 'nachweisdokumente', 'proof documents', 'beweisunterlagen', 'documentation', 'dokumentation', 'documentation requirements', 'dokumentationsanforderungen'],
    technical: ['technisch', 'technical', 'technologie', 'anforderungen', 'tech', 'technik', 'technologisch', 'spezi', 'spezifikation', 'voraussetzungen technisch'],
    team: ['team', 'mitarbeiter', 'personal', 'qualifikation', 'qualifizierung', 'personal', 'person', 'experten', 'fachkräfte', 'ausbildung', 'team size', 'teamgröße', 'number of employees', 'anzahl mitarbeiter', 'team members', 'teammitglieder', 'staff', 'personal', 'personnel', 'team composition', 'teamzusammensetzung', 'team requirements', 'teamanforderungen', 'qualifikationsanforderungen', 'qualification requirements', 'personalanforderungen', 'staff requirements', 'team structure', 'teamstruktur', 'teamgröße', 'team size', 'personnel requirements', 'staffing', 'besetzung', 'teamaufbau', 'team structure', 'team composition', 'team members', 'teammitglieder', 'anzahl mitarbeiter', 'number of employees', 'personnel', 'personal', 'staff', 'mitarbeiter', 'team', 'qualifikation', 'qualification', 'ausbildung', 'education', 'expertise', 'erfahrung', 'experience', 'founder', 'gründer', 'entrepreneur', 'startup team', 'projektteam', 'project team', 'kern team', 'core team', 'who can apply', 'wer kann teilnehmen', 'teilnahmevoraussetzungen'],
    timeline: ['laufzeit', 'duration', 'deadline', 'frist', 'zeitraum', 'bewerbungsfrist', 'einreichfrist', 'deadline', 'dauer', 'zeitplan', 'bewerbungsschluss', 'einreichschluss', 'abgabeschluss', 'bis zum', 'bis spätestens', 'bis', 'application deadline', 'submission deadline', 'closing date', 'due date', 'project duration', 'projektdauer', 'laufzeit', 'duration', 'zeitraum', 'timeframe', 'timeline', 'zeitplan', 'schedule', 'deadline', 'frist', 'bewerbungsfrist', 'application deadline', 'submission deadline', 'open deadline', 'laufende bewerbung', 'rolling application', 'continuous application'],
    // Impact - split into subcategories
    environmental_impact: ['nachhaltigkeit', 'sustainability', 'klima', 'climate', 'umwelt', 'environment', 'co2', 'emission', 'environmental impact', 'umweltauswirkungen', 'klimawirkung', 'climate impact', 'nachhaltigkeitswirkung', 'sustainability impact', 'nachhaltigkeitsziele', 'sustainability goals', 'sdg', 'sustainable development goals', 'nachhaltigkeitsziel', 'sustainability objective'],
    social_impact: ['sozial', 'social', 'arbeitsplätze', 'jobs', 'beschäftigung', 'employment', 'social impact', 'soziale wirkung', 'gemeinschaft', 'community', 'inclusion', 'inklusion'],
    economic_impact: ['wirtschaftlich', 'economic', 'wirtschaft', 'economy', 'revenue', 'umsatz', 'growth', 'wachstum', 'economic impact', 'wirtschaftliche wirkung', 'gdp', 'bip', 'market', 'markt'],
    innovation_impact: ['innovation', 'rd', 'r&d', 'research', 'forschung', 'development', 'entwicklung', 'technology', 'technologie', 'innovation impact', 'innovationswirkung'],
    consortium: ['konsortium', 'consortium', 'partner', 'partnership', 'kooperation', 'zusammenarbeit', 'partner', 'verbund', 'allianz', 'joint application', 'gemeinsame bewerbung', 'multiple partners', 'mehrere partner', 'partneranforderungen', 'partner requirements', 'konsortialanforderungen', 'consortium requirements', 'partnerschaftsanforderungen', 'partnership requirements', 'kooperationsanforderungen', 'collaboration requirements', 'verbundanforderungen', 'allianzanforderungen', 'alliance requirements'],
    // Project - split into subcategories
    innovation_focus: ['innovation', 'innovative', 'digitalization', 'digitalisierung', 'sustainability', 'nachhaltigkeit', 'rd', 'r&d', 'digital transformation', 'innovation focus', 'innovationsschwerpunkt'],
    technology_area: ['technology', 'technologie', 'tech', 'ai', 'artificial intelligence', 'iot', 'internet of things', 'blockchain', 'biotechnology', 'machine learning', 'deep learning', 'robotics', 'software', 'hardware', 'technology area', 'technologiebereich'],
    research_domain: ['research', 'forschung', 'life sciences', 'lebenswissenschaften', 'materials science', 'materialwissenschaften', 'energy research', 'energieforschung', 'medical research', 'medizinforschung', 'pharmaceutical', 'pharmazeutisch', 'research domain', 'forschungsbereich'],
    sector_focus: ['sector', 'sektor', 'industrie', 'industry', 'branche', 'manufacturing', 'produktion', 'healthcare', 'gesundheitswesen', 'energy', 'energie', 'agriculture', 'landwirtschaft', 'tourism', 'tourismus', 'construction', 'bau', 'sector focus', 'sektorschwerpunkt'],
    geographic: ['standort', 'region', 'location', 'gebiet', 'bereich', 'ort', 'platz', 'wohnort', 'niederlassung', 'eligible regions', 'geographic scope', 'available in', 'applies to', 'gültig für', 'gültig in', 'fördergebiet', 'förderregion', 'förderbare regionen', 'eligible locations', 'eligible countries', 'eligible areas', 'geografischer bereich', 'räumlicher geltungsbereich', 'fördergebiets', 'standortanforderungen', 'location requirements', 'region requirements', 'country', 'länder', 'countries', 'eligible', 'berechtigt', 'gültig'],
    use_of_funds: ['verwendung', 'use of funds', 'zweck', 'verwendungszweck', 'zweckbindung', 'einsatz', 'nutzung', 'verwendungsmöglichkeiten', 'use of funding', 'funding purpose', 'förderzweck', 'verwendungsbereich', 'use of grant', 'use of loan', 'verwendungszwecke', 'funding use', 'eligible costs', 'förderbare kosten', 'eligible expenses', 'förderbare ausgaben', 'what can be funded', 'was kann gefördert werden', 'funding scope', 'förderumfang'],
    capex_opex: ['investition', 'capex', 'opex', 'betriebsausgaben', 'investment', 'investitionen', 'ausgaben', 'kosten'],
    revenue_model: ['umsatz', 'revenue', 'erlös', 'geschäftsmodell', 'business model', 'erlösmodel', 'umsatzmodell'],
    market_size: ['marktgröße', 'market size', 'marktpotenzial', 'market potential', 'markt', 'potenzial', 'zielmarkt'],
    // New categories
    application_process: ['bewerbung', 'application', 'antrag', 'how to apply', 'wie bewerben', 'bewerbungsprozess', 'application process', 'application steps', 'bewerbungsschritte', 'submission process', 'einreichprozess', 'apply', 'bewerben', 'antrag stellen', 'application procedure', 'bewerbungsverfahren', 'submission', 'einreichung'],
    evaluation_criteria: ['bewertung', 'evaluation', 'scoring', 'bewertungskriterien', 'evaluation criteria', 'selection criteria', 'auswahlkriterien', 'bewertungsverfahren', 'evaluation process', 'scoring system', 'bewertungssystem', 'selection process', 'auswahlverfahren', 'assessment', 'beurteilung'],
    repayment_terms: ['rückzahlung', 'repayment', 'tilgung', 'zins', 'interest', 'zinssatz', 'interest rate', 'rückzahlungsbedingungen', 'repayment terms', 'tilgungsplan', 'repayment schedule', 'tilgungsdauer', 'repayment period', 'stundung', 'grace period', 'sicherheit', 'collateral'],
    equity_terms: ['beteiligung', 'equity', 'valuation', 'bewertung', 'dilution', 'verwässerung', 'exit', 'ausstieg', 'equity stake', 'beteiligungsquote', 'voting rights', 'stimmrechte', 'pre-money', 'post-money'],
    intellectual_property: ['geistiges eigentum', 'intellectual property', 'ip', 'patent', 'patent', 'lizenz', 'license', 'licensing', 'lizenzierung', 'ip ownership', 'eigentum an ip', 'patent rights', 'patentrechte'],
    success_metrics: ['erfolgskriterien', 'success criteria', 'kpis', 'key performance indicators', 'milestones', 'meilensteine', 'targets', 'ziele', 'success metrics', 'erfolgsmessung', 'performance indicators', 'leistungsindikatoren'],
    restrictions: ['ausschlüsse', 'exclusions', 'nicht förderfähig', 'not eligible', 'ausgeschlossen', 'excluded', 'verboten', 'prohibited', 'nicht erlaubt', 'not allowed', 'restrictions', 'einschränkungen', 'ausschlusskriterien', 'exclusion criteria']
  };
  
  $('h1, h2, h3, h4, h5, h6').each((_, heading) => {
    const headingText = $(heading).text().toLowerCase().trim();
    const $next = $(heading).nextUntil('h1, h2, h3, h4, h5, h6');
    const sectionText = $next.text().trim();
    
    if (sectionText.length < 20 || sectionText.length > 1500) return; // Skip too short or too long
    
    // Check each category for matching headings
    Object.entries(headingKeywords).forEach(([category, keywords]) => {
      const matchedKeyword = keywords.find(k => headingText.includes(k.toLowerCase()));
      if (matchedKeyword && sectionText.length > 30) {
        // Extract first meaningful sentence/paragraph, prioritizing lists if present
        const $nextEl = $(heading).nextUntil('h1, h2, h3, h4, h5, h6');
        const $list = $nextEl.find('ul, ol').first();
        let value = '';
        
        // Prefer list if available (more structured)
        if ($list.length > 0) {
          try {
            const listItems = $list.find('li').slice(0, 5).map((_, li) => {
              try {
                return $(li).text().trim();
              } catch (e) {
                return '';
              }
            }).get();
            value = listItems.filter(item => item && item.length > 5 && item.length < 200).join('; ');
          } catch (e: any) {
            // If list processing fails, fall back to text extraction
            console.warn(`Warning: Failed to process list items:`, e?.message || String(e));
            value = '';
          }
        }
        
        // If no list or list too short, use text
        if (!value || value.length < 20) {
          const firstSentence = sectionText.split(/[\.\n!?]/)[0].trim();
          const firstPara = sectionText.substring(0, Math.min(350, sectionText.length)).trim();
          value = firstSentence.length > 25 ? firstSentence : firstPara;
        }
        
        // Clean value
        value = value.replace(/^(?:sind|soll|muss|müssen|darf|dürfen|ist|werden|kann)[\s,]+/i, '').trim();
        value = value.replace(/\s+/g, ' '); // Normalize whitespace
        
        if (value.length > 20 && value.length < 500 && 
            !value.toLowerCase().includes('required') && 
            !value.toLowerCase().includes('specified') &&
            !value.toLowerCase().includes('available')) {
          // Check if we already have structured data for this category
          const existing = categorized[category] || [];
          const hasStructured = existing.some(item => 
            item.source === 'table' || 
            item.source === 'list' || 
            item.source === 'definition_list' ||
            (item.source === 'heading_section' && item.value.length > value.length)
          );
          
          if (!hasStructured || existing.length === 0) {
            categorized[category].push({
              type: `${category}_requirement`,
              value: value,
              required: true,
              source: 'heading_section'
            });
          }
        }
      }
    });
  });
  
  // Extract from tables (common pattern for funding programs)
  $('table').each((_, table) => {
    const $table = $(table);
    $table.find('tr').each((_, row) => {
      const $row = $(row);
      const cells = $row.find('td, th').map((_, cell) => $(cell).text().trim()).get();
      
      if (cells.length >= 2) {
        const label = cells[0].toLowerCase();
        const value = cells[1];
        
        // Financial amounts - expanded keywords
        if (label.includes('förderhöhe') || label.includes('förderbetrag') || label.includes('funding amount') || 
            label.includes('maximal') || label.includes('bis zu') || label.includes('förderung') ||
            label.includes('kredit') || label.includes('darlehen') || label.includes('finanzierung') ||
            label.includes('volumen') || label.includes('betrag') || label.includes('höhe') ||
            label.includes('amount') || label.includes('summe') || label.includes('kapital')) {
          // Make it meaningful if short
          const valueStr = value.trim();
          const contextualValue = valueStr.length < 20 
            ? `Funding amount: ${valueStr}`
            : valueStr;
          
          categorized.financial.push({
            type: 'funding_amount_max',
            value: contextualValue,
            required: true,
            source: 'table'
          });
        }
        
        // Co-financing percentages
        if (label.includes('eigenmittel') || label.includes('eigenanteil') || label.includes('co-financing') || 
            label.includes('mitfinanzierung') || label.includes('eigenkapital')) {
          const pctMatch = value.match(/(\d{1,3})[%\s]*/);
          if (pctMatch) {
            categorized.co_financing.push({
              type: 'co_financing_percentage',
              value: pctMatch[1] + '%',
              required: true,
              source: 'table'
            });
          }
        }
        
        // Deadline extraction from tables
        if (label.includes('deadline') || label.includes('frist') || label.includes('einreichfrist') || 
            label.includes('bewerbungsfrist') || label.includes('einsendefrist') || label.includes('abgabefrist') ||
            label.includes('meldungsfrist') || label.includes('anmeldefrist') || label.includes('bewerbungsschluss') ||
            label.includes('einsendeschluss') || label.includes('abgabeschluss') || label.includes('letzter termin') ||
            label.includes('bis') || label.includes('until') || label.includes('by')) {
          // Extract date from value
          const dateMatch = value.match(/(\d{1,2})[.\/\-\s]+(\d{1,2})[.\/\-\s]+(\d{2,4})/);
          if (dateMatch) {
            const d = parseInt(dateMatch[1], 10);
            const mo = parseInt(dateMatch[2], 10);
            const y = parseInt(dateMatch[3], 10) + (parseInt(dateMatch[3], 10) < 100 ? 2000 : 0);
            if (d >= 1 && d <= 31 && mo >= 1 && mo <= 12 && y >= 2020 && y <= 2030) {
              // FIX: Only extract deadlines that are in the future (not past)
              const deadlineDate = new Date(y, mo - 1, d);
              const now = new Date();
              now.setHours(0, 0, 0, 0); // Compare dates only, not times
              deadlineDate.setHours(0, 0, 0, 0);
              
              if (deadlineDate >= now) {
                // Future deadline - valid
                categorized.timeline.push({
                  type: 'deadline',
                  value: `${String(d).padStart(2,'0')}.${String(mo).padStart(2,'0')}.${y}`,
                  required: true,
                  source: 'table'
                });
              }
              // Past deadline - skip it (don't extract)
            }
          } else if (/(laufend|rolling|ongoing|bis auf weiteres|continuously|open|keine frist|permanent)/i.test(value)) {
            categorized.timeline.push({
              type: 'open_deadline',
              value: 'Open application / Rolling deadline',
              required: false,
              source: 'table'
            });
          } else {
            // Keep text as-is if no date found
            categorized.timeline.push({
              type: 'deadline',
              value: value.trim(),
              required: true,
              source: 'table'
            });
          }
        }
        
        // Contact info from tables
        if (label.includes('kontakt') || label.includes('contact') || label.includes('email') || 
            label.includes('e-mail') || label.includes('phone') || label.includes('telefon') ||
            label.includes('tel') || label.includes('anfrage') || label.includes('inquiry') ||
            label.includes('ansprechpartner') || label.includes('contact person')) {
          // Check for email
          const emailMatch = value.match(/[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}/);
          if (emailMatch) {
            // Contact email should not be in eligibility - skip or handle separately
            // Skipping contact extraction from eligibility category
          }
          // Check for phone
          const phoneMatch = value.match(/(?:\+43|0043|0)\s*(?:\(0\))?\s*\d{1,4}[\s\/-]?\d{3,4}[\s\/-]?\d{3,8}/);
          if (phoneMatch) {
            // Contact phone should not be in eligibility - skip or handle separately
            // Skipping contact extraction from eligibility category
          }
        }
        
        // Duration/Timeline
        if (label.includes('laufzeit') || label.includes('duration') || label.includes('zeitraum') || 
            label.includes('deadline') || label.includes('frist')) {
          categorized.timeline.push({
            type: 'duration',
            value: value.trim(),
            required: true,
            source: 'table'
          });
        }
        
        // TRL Level
        if (label.includes('trl') || label.includes('technology readiness') || label.includes('reifegrad')) {
          const trlMatch = value.match(/trl[\s\-]?(\d{1})/i);
          if (trlMatch) {
            categorized.trl_level.push({
              type: 'trl_level',
              value: 'TRL ' + trlMatch[1],
              required: true,
              source: 'table'
            });
          }
        }
        
        // Geographic location
        if (label.includes('standort') || label.includes('region') || label.includes('location') || 
            label.includes('gebiet') || label.includes('bereich')) {
          if (value && value.length > 2 && value.length < 100) {
            categorized.geographic.push({
              type: 'location',
              value: value.trim(),
              required: true,
              source: 'table'
            });
          }
        }
        
        // Impact - from tables
        if (label.includes('nachhaltigkeit') || label.includes('sustainability') || label.includes('impact') || 
            label.includes('wirkung') || label.includes('klima') || label.includes('umwelt') || 
            label.includes('sozial') || label.includes('arbeitsplätze') || label.includes('beschäftigung') ||
            label.includes('co2') || label.includes('emission') || label.includes('ökologie')) {
          const impactValue = value.trim();
          if (impactValue.length > 5 && impactValue.length < 500) {
            // Determine impact type from label or value
            let impactType = 'impact_requirement';
            // Map to new separate categories
            if (label.includes('nachhaltigkeit') || label.includes('sustainability') ||
                label.includes('klima') || label.includes('co2') || label.includes('emission') || 
                label.includes('umwelt') || label.includes('ökologie')) {
              impactType = 'environmental_impact';
            } else if (label.includes('sozial') || label.includes('social') ||
                       label.includes('arbeitsplätze') || label.includes('beschäftigung') || label.includes('jobs')) {
              impactType = 'social_impact';
            } else if (label.includes('wirtschaft') || label.includes('economic') || label.includes('revenue')) {
              impactType = 'economic_impact';
            } else if (label.includes('innovation') || label.includes('rd') || label.includes('research')) {
              impactType = 'innovation_impact';
            } else {
              impactType = 'environmental_impact'; // Default fallback
            }
            
            // Store in separate top-level category
            if (!categorized[impactType]) {
              categorized[impactType] = [];
            }
            categorized[impactType].push({
              type: impactType,
              value: impactValue,
              required: true,
              source: 'table'
            });
          }
        }
        
        // Eligibility
        if (label.includes('teilnahmeberechtigt') || label.includes('voraussetzung') || label.includes('eligibility')) {
          // Store in separate top-level category
          if (!categorized['eligibility_criteria']) {
            categorized['eligibility_criteria'] = [];
          }
          categorized['eligibility_criteria'].push({
            type: 'eligibility_criteria',
            value: value.trim(),
            required: true,
            source: 'table'
          });
        }
        
        // Documents - from table rows with document-related labels
        if (label.includes('unterlage') || label.includes('dokument') || label.includes('bewerbung') || 
            label.includes('antrag') || label.includes('nachweis') || label.includes('zeugnis')) {
          // If value looks like a document list (contains commas, semicolons, or bullet-like patterns)
          const docValue = value.trim();
          if (docValue.length > 5 && docValue.length < 500) {
            // Try to extract format requirements
            const formatMatch = docValue.match(/(?:format|als|in|max\.?|maximal)\s*([^,;:]+(?:pdf|doc|docx|page|seite|mb|kb)[^,;:]*(?:,|;|$)?)/i);
            const format = formatMatch ? formatMatch[1].trim() : undefined;
            
            // If value contains structured info (colon, dash, parentheses)
            const colonMatch = docValue.match(/^([^:]+?):\s*(.+)$/);
            const dashMatch = docValue.match(/^([^-]+?)\s*[-–]\s*(.+)$/);
            
            let docName = docValue;
            let description: string | undefined;
            
            if (colonMatch && colonMatch[2].length > 10) {
              docName = colonMatch[1].trim();
              description = colonMatch[2].trim();
            } else if (dashMatch && dashMatch[2].length > 10) {
              docName = dashMatch[1].trim();
              description = dashMatch[2].trim();
            }
            
            categorized.documents.push({
              type: description ? 'document_with_structure' : 'documents_required',
              value: docName,
              required: true,
              source: 'table',
              description: description,
              format: format
            });
          }
        }
      }
    });
    
    // Check if table header indicates documents column
    const $headerRow = $table.find('thead tr, tr:first-child');
    const headerCells = $headerRow.find('th, td').map((_, cell) => $(cell).text().trim().toLowerCase()).get();
    const hasDocHeader = headerCells.some(h => 
      h.includes('unterlage') || h.includes('dokument') || h.includes('bewerbung') || h.includes('antrag')
    );
    
    if (hasDocHeader) {
      // Extract all rows, treat each row as potentially containing documents
      $table.find('tbody tr, tr:not(:first-child)').each((_, row) => {
        const $row = $(row);
        const cells = $row.find('td, th').map((_, cell) => $(cell).text().trim()).get();
        
        // Find the cell in the document column (same index as header)
        const docHeaderIndex = headerCells.findIndex(h => 
          h.includes('unterlage') || h.includes('dokument') || h.includes('bewerbung') || h.includes('antrag')
        );
        
        if (docHeaderIndex >= 0 && cells[docHeaderIndex]) {
          const docCell = cells[docHeaderIndex];
          if (docCell.length > 3 && docCell.length < 500) {
            // Extract format and description from table cell
            const formatMatch = docCell.match(/(?:format|als|in|max\.?|maximal)\s*([^,;:]+(?:pdf|doc|docx|page|seite|mb|kb)[^,;:]*(?:,|;|$)?)/i);
            const format = formatMatch ? formatMatch[1].trim() : undefined;
            
            const colonMatch = docCell.match(/^([^:]+?):\s*(.+)$/);
            const dashMatch = docCell.match(/^([^-]+?)\s*[-–]\s*(.+)$/);
            
            let docName = docCell;
            let description: string | undefined;
            
            if (colonMatch && colonMatch[2].length > 10) {
              docName = colonMatch[1].trim();
              description = colonMatch[2].trim();
            } else if (dashMatch && dashMatch[2].length > 10) {
              docName = dashMatch[1].trim();
              description = dashMatch[2].trim();
            }
            
            categorized.documents.push({
              type: description ? 'document_with_structure' : 'documents_required',
              value: docName,
              required: true,
              source: 'table_column',
              description: description,
              format: format
            });
          }
        }
      });
    }
  });
  
  // Extract from definition lists (dl/dt/dd - common in German sites)
  $('dl').each((_, dl) => {
    const $dl = $(dl);
    $dl.find('dt').each((_, dt) => {
      const $dt = $(dt);
      const $dd = $dt.next('dd');
      if ($dd.length === 0) return;
      
      const term = $dt.text().trim().toLowerCase();
      const definition = $dd.text().trim();
      
      // Financial
      if ((term.includes('förderung') || term.includes('betrag') || term.includes('finanzierung') || 
           term.includes('förderhöhe') || term.includes('förderbetrag')) && definition.match(/\d+.*€|€.*\d+/)) {
        categorized.financial.push({
          type: 'funding_amount',
          value: definition,
          required: true,
          source: 'definition_list'
        });
      }
      
      // Co-financing
      if (term.includes('eigenmittel') || term.includes('eigenanteil') || term.includes('eigenkapital') || 
          term.includes('mitfinanzierung') || term.includes('selbstfinanzierung')) {
        const pctMatch = definition.match(/(\d{1,3})[%\s]*/);
        if (pctMatch) {
          categorized.co_financing.push({
            type: 'co_financing_percentage',
            value: pctMatch[1] + '%',
            required: true,
            source: 'definition_list'
          });
        }
      }
      
      // Eligibility - company type
      if (term.includes('teilnahmeberechtigt') || term.includes('eligibility') || term.includes('voraussetzung') || 
          term.includes('berechtigt') || term.includes('anforderungen')) {
        if (definition.toLowerCase().includes('startup') || definition.toLowerCase().includes('unternehmen') || 
            definition.toLowerCase().includes('kmu') || definition.toLowerCase().includes('betrieb')) {
          // Store in separate top-level category
          if (!categorized['company_type']) {
            categorized['company_type'] = [];
          }
          categorized['company_type'].push({
            type: 'company_type',
            value: definition.trim(),
            required: true,
            source: 'definition_list'
          });
        }
      }
      
      // Timeline
      if (term.includes('laufzeit') || term.includes('duration') || term.includes('deadline') || 
          term.includes('frist') || term.includes('zeitraum')) {
        categorized.timeline.push({
          type: 'duration',
          value: definition.trim(),
          required: true,
          source: 'definition_list'
        });
      }
      
      // Impact - from definition lists
      if (term.includes('nachhaltigkeit') || term.includes('sustainability') || term.includes('impact') || 
          term.includes('wirkung') || term.includes('klima') || term.includes('umwelt') || 
          term.includes('sozial') || term.includes('arbeitsplätze') || term.includes('beschäftigung') ||
          term.includes('co2') || term.includes('emission') || term.includes('ökologie')) {
        if (definition.length > 5 && definition.length < 500) {
          let impactType = 'impact_requirement';
          // Map to new separate categories
          if (term.includes('nachhaltigkeit') || term.includes('sustainability') ||
              term.includes('klima') || term.includes('co2') || term.includes('emission') || 
              term.includes('umwelt') || term.includes('ökologie')) {
            impactType = 'environmental_impact';
          } else if (term.includes('sozial') || term.includes('social') ||
                     term.includes('arbeitsplätze') || term.includes('beschäftigung') || term.includes('jobs')) {
            impactType = 'social_impact';
          } else if (term.includes('wirtschaft') || term.includes('economic') || term.includes('revenue')) {
            impactType = 'economic_impact';
          } else if (term.includes('innovation') || term.includes('rd') || term.includes('research')) {
            impactType = 'innovation_impact';
          } else {
            impactType = 'environmental_impact'; // Default fallback
          }
          
          // Store in separate top-level category
          if (!categorized[impactType]) {
            categorized[impactType] = [];
          }
          categorized[impactType].push({
            type: impactType,
            value: definition.trim(),
            required: true,
            source: 'definition_list'
          });
        }
      }
      
      // Documents - from definition lists
      if (term.includes('unterlage') || term.includes('dokument') || term.includes('bewerbung') || 
          term.includes('antrag') || term.includes('nachweis')) {
        if (definition.length > 3 && definition.length < 500) {
          // Extract format requirements
          const formatMatch = definition.match(/(?:format|als|in|max\.?|maximal)\s*([^,;:]+(?:pdf|doc|docx|page|seite|mb|kb)[^,;:]*(?:,|;|$)?)/i);
          const format = formatMatch ? formatMatch[1].trim() : undefined;
          
          // Extract description from structured patterns
          const colonMatch = definition.match(/^([^:]+?):\s*(.+)$/);
          const dashMatch = definition.match(/^([^-]+?)\s*[-–]\s*(.+)$/);
          
          let docName = definition.trim();
          let description: string | undefined;
          
          if (colonMatch && colonMatch[2].length > 10) {
            docName = colonMatch[1].trim();
            description = colonMatch[2].trim();
          } else if (dashMatch && dashMatch[2].length > 10) {
            docName = dashMatch[1].trim();
            description = dashMatch[2].trim();
          }
          
          categorized.documents.push({
            type: description ? 'document_with_structure' : 'documents_required',
            value: docName,
            required: true,
            source: 'definition_list',
            description: description,
            format: format
          });
        }
      }
    });
  });
  
  // Extract from structured sections with common class names and headings
  const structuredSections = [
    { selector: '.foerderbetrag, .funding-amount, [class*="amount"], [class*="förder"], [class*="betrag"]', category: 'financial', type: 'funding_amount' },
    { selector: '.deadline, .frist, [class*="deadline"], [class*="frist"]', category: 'timeline', type: 'deadline' },
    { selector: '.eigenmittel, .co-financing, [class*="eigen"], [class*="mitfinanz"]', category: 'co_financing', type: 'co_financing_percentage' },
    { selector: '.laufzeit, .duration, [class*="laufzeit"], [class*="duration"]', category: 'timeline', type: 'duration' },
    { selector: '.voraussetzung, .eligibility, [class*="voraussetzung"], [class*="eligibility"], [class*="anforderung"]', category: 'eligibility', type: 'eligibility_criteria' },
    { selector: '.nachhaltigkeit, .sustainability, .impact, .wirkung, [class*="nachhalt"], [class*="sustain"], [class*="impact"], [class*="wirkung"], [class*="klima"], [class*="umwelt"], [class*="sozial"]', category: 'impact', type: 'impact_requirement' }
  ];
  
  structuredSections.forEach(({ selector, category, type }) => {
    try {
      $(selector).each((_, el) => {
        try {
          const text = $(el).text().trim();
          if (text && text.length > 5 && text.length < 300) {
            // Only add if value contains actual data (not just labels)
            if (text.match(/\d+/) || text.length > 20) {
              categorized[category].push({
                type,
                value: text,
                required: true,
                source: 'structured_section'
              });
            }
          }
        } catch (e: any) {
          // Skip this element if processing fails
          return;
        }
      });
    } catch (e: any) {
      // Skip this selector if processing fails
      console.warn(`Warning: Failed to process selector ${selector}:`, e?.message || String(e));
    }
  });
  
  // Extract from headings followed by content (e.g., "Voraussetzungen", "Anforderungen")
  const sectionHeadings = [
    { pattern: /(?:voraussetzung|anforderung|bedingung|kriterien|eligibility)/i, category: 'eligibility' },
    { pattern: /(?:förderbetrag|förderhöhe|finanzierung|funding)/i, category: 'financial' },
    { pattern: /(?:eigenmittel|eigenanteil|mitfinanzierung|co-financ)/i, category: 'co_financing' },
    { pattern: /(?:laufzeit|deadline|frist|dauer)/i, category: 'timeline' },
    { pattern: /(?:standort|region|gebiet|location)/i, category: 'geographic' },
    { pattern: /(?:unterlage|dokument|bewerbung|antrag)/i, category: 'documents' },
    { pattern: /(?:nachhaltigkeit|impact|wirkung)/i, category: 'impact' },
    { pattern: /(?:trl|reifegrad|technology readiness)/i, category: 'trl_level' }
  ];
  
  $('h1, h2, h3, h4').each((_, heading) => {
    const headingText = $(heading).text().trim().toLowerCase();
    const $heading = $(heading);
    const nextContent = $heading.nextUntil('h1, h2, h3, h4');
    
    for (const { pattern, category } of sectionHeadings) {
      if (pattern.test(headingText)) {
        // Check if next content includes lists (ul/ol) - these are often document lists
        const $lists = nextContent.find('ul, ol').first();
        const $listItems = $lists.find('li');
        
        if ($listItems.length > 0 && category === 'documents') {
          // Extract actual list items as individual documents with structure/requirements
          $listItems.each((_, li) => {
            const $li = $(li);
            let itemText = $li.text().trim();
            // Clean up: remove numbers, bullets, extra whitespace
            const cleaned = itemText.replace(/^[\d.\-\•\*\u2022]\s*/, '').trim();
            
            if (cleaned.length > 3 && cleaned.length < 500) {
              // Check for nested lists (sub-requirements within the document item)
              const $nestedList = $li.find('ul, ol').first();
              const nestedItems: string[] = [];
              
              if ($nestedList.length > 0) {
                // Extract nested requirements (what the document must contain)
                $nestedList.find('li').each((_, nestedLi) => {
                  const nestedText = $(nestedLi).text().trim().replace(/^[\d.\-\•\*\u2022]\s*/, '');
                  if (nestedText.length > 2) nestedItems.push(nestedText);
                });
                // Remove nested list content from main text (to avoid duplication)
                itemText = $li.clone().children('ul, ol').remove().end().text().trim().replace(/^[\d.\-\•\*\u2022]\s*/, '');
              }
              
              // Extract format requirements (PDF, max pages, file size, etc.) - Enhanced patterns
              const formatPatterns = [
                /(?:format|als|in|im)\s*(?:Format\s+)?([^,;:]+(?:pdf|doc|docx|word|excel|xls|ppt|powerpoint|txt|rtf)[^,;:]*(?:,|;|$)?)/i,
                /(?:max\.?|maximal|max\.?|höchstens|bis zu)\s*(\d+)\s*(?:seite|pages?|seiten)?/i,
                /(?:max\.?|maximal)\s*([^,;:]+(?:mb|kb|gb|bytes?|size|größe)[^,;:]*(?:,|;|$)?)/i,
                /(?:maximal|max\.?)\s*(\d+)\s*(?:zeilen|lines|characters?|zeichen)/i,
                /(?:im\s+)?([a-z]{3,4})\s*(?:format|file|datei)/i,
                /([a-z]{3,4})\s*(?:datei|file|format|dokument)/i
              ];
              
              let format: string | undefined = undefined;
              for (const pattern of formatPatterns) {
                const match = itemText.match(pattern);
                if (match) {
                  format = match[1] || match[0];
                  if (format.length > 50) format = format.substring(0, 50);
                  break;
                }
              }
              
              // Extract description (text after colon, dash, or in parentheses)
              const colonMatch = itemText.match(/^([^:]+?):\s*(.+)$/);
              const dashMatch = itemText.match(/^([^-]+?)\s*[-–]\s*(.+)$/);
              const parenMatch = itemText.match(/^([^(]+?)\s*\(([^)]+)\)/);
              
              let docName = cleaned;
              let description: string | undefined;
              
              if (colonMatch) {
                docName = colonMatch[1].trim();
                description = colonMatch[2].trim();
              } else if (dashMatch) {
                docName = dashMatch[1].trim();
                description = dashMatch[2].trim();
              } else if (parenMatch) {
                docName = parenMatch[1].trim();
                description = parenMatch[2].trim();
              }
              
              categorized.documents.push({
                type: 'document_with_structure',
                value: docName,
                required: true,
                source: 'list_items',
                description: description || (nestedItems.length === 0 ? undefined : undefined), // Will use requirements array
                format: format,
                requirements: nestedItems.length > 0 ? nestedItems : undefined
              });
            }
          });
        } else {
          // For impact category: extract structured content (lists, detailed descriptions)
          if (category === 'impact') {
            const $lists = nextContent.find('ul, ol').first();
            const $listItems = $lists.find('li');
            
            if ($listItems.length > 0) {
              // Extract impact items as structured list
              const impactItems: string[] = [];
              $listItems.each((_, li) => {
                const itemText = $(li).text().trim().replace(/^[\d.\-\•\*\u2022]\s*/, '');
                if (itemText.length > 3 && itemText.length < 300) {
                  impactItems.push(itemText);
                }
              });
              
              if (impactItems.length > 0) {
                // Determine impact type from content and store in separate category
                const impactText = impactItems.join('; ').toLowerCase();
                let impactCategory = 'environmental_impact'; // Default
                if (impactText.includes('sozial') || impactText.includes('social') || impactText.includes('jobs') || impactText.includes('arbeitsplätze')) {
                  impactCategory = 'social_impact';
                } else if (impactText.includes('wirtschaft') || impactText.includes('economic') || impactText.includes('revenue')) {
                  impactCategory = 'economic_impact';
                } else if (impactText.includes('innovation') || impactText.includes('rd') || impactText.includes('research')) {
                  impactCategory = 'innovation_impact';
                }
                if (!categorized[impactCategory]) {
                  categorized[impactCategory] = [];
                }
                categorized[impactCategory].push({
                  type: impactCategory,
                  value: impactItems.join('; '),
                  required: true,
                  source: 'list_items'
                });
              }
            } else {
              // Extract detailed text content for impact
              const textContent = nextContent.text().trim().slice(0, 1000);
              if (textContent.length > 20) {
                // Determine impact type from content and store in separate category
                const impactText = textContent.toLowerCase();
                let impactCategory = 'environmental_impact'; // Default
                if (impactText.includes('sozial') || impactText.includes('social') || impactText.includes('jobs') || impactText.includes('arbeitsplätze')) {
                  impactCategory = 'social_impact';
                } else if (impactText.includes('wirtschaft') || impactText.includes('economic') || impactText.includes('revenue')) {
                  impactCategory = 'economic_impact';
                } else if (impactText.includes('innovation') || impactText.includes('rd') || impactText.includes('research')) {
                  impactCategory = 'innovation_impact';
                }
                if (!categorized[impactCategory]) {
                  categorized[impactCategory] = [];
                }
                categorized[impactCategory].push({
                  type: impactCategory,
                  value: textContent.slice(0, 500),
                  required: true,
                  source: 'heading_section'
                });
              }
            }
          } else {
            // Fallback: extract text content (existing behavior for other categories)
            const textContent = nextContent.text().trim().slice(0, 500);
            if (textContent.length > 20) {
              categorized[category].push({
                type: `${category}_section`,
                value: textContent.slice(0, 200),
                required: true,
                source: 'heading_section'
              });
            }
          }
        }
        break;
      }
    }
  });
  
  // Also check for standalone lists near document-related headings
  $('ul, ol').each((_, list) => {
    const $list = $(list);
    const $prevElements = $list.prevAll('h1, h2, h3, h4, p, div').slice(0, 3);
    
    // Check if any preceding element mentions documents
    const hasDocContext = $prevElements.text().toLowerCase().match(
      /(?:unterlage|dokument|bewerbung|antrag|erforderlich|benötigt)/i
    );
    
    if (hasDocContext) {
      const $listItems = $list.find('li');
      if ($listItems.length > 0 && $listItems.length < 20) { // Reasonable document count
        $listItems.each((_, li) => {
          const $li = $(li);
          let itemText = $li.text().trim();
          const cleaned = itemText.replace(/^[\d.\-\•\*\u2022]\s*/, '').trim();
          
          if (cleaned.length > 3 && cleaned.length < 500) {
            // Extract nested requirements
            const $nestedList = $li.find('ul, ol').first();
            const nestedItems: string[] = [];
            
            if ($nestedList.length > 0) {
              $nestedList.find('li').each((_, nestedLi) => {
                const nestedText = $(nestedLi).text().trim().replace(/^[\d.\-\•\*\u2022]\s*/, '');
                if (nestedText.length > 2) nestedItems.push(nestedText);
              });
              itemText = $li.clone().children('ul, ol').remove().end().text().trim().replace(/^[\d.\-\•\*\u2022]\s*/, '');
            }
            
            // Extract format and description (same logic as above)
            const formatMatch = itemText.match(/(?:format|als|in|max\.?|maximal|max\.?)\s*([^,;:]+(?:pdf|doc|docx|page|seite|mb|kb|format)[^,;:]*(?:,|;|$)?)/i);
            const format = formatMatch ? formatMatch[1].trim() : undefined;
            
            const colonMatch = itemText.match(/^([^:]+?):\s*(.+)$/);
            const dashMatch = itemText.match(/^([^-]+?)\s*[-–]\s*(.+)$/);
            const parenMatch = itemText.match(/^([^(]+?)\s*\(([^)]+)\)/);
            
            let docName = cleaned;
            let description: string | undefined;
            
            if (colonMatch) {
              docName = colonMatch[1].trim();
              description = colonMatch[2].trim();
            } else if (dashMatch) {
              docName = dashMatch[1].trim();
              description = dashMatch[2].trim();
            } else if (parenMatch) {
              docName = parenMatch[1].trim();
              description = parenMatch[2].trim();
            }
            
            categorized.documents.push({
              type: 'document_with_structure',
              value: docName,
              required: true,
              source: 'contextual_list',
              description: description,
              format: format,
              requirements: nestedItems.length > 0 ? nestedItems : undefined
            });
          }
        });
      }
    }
  });
}

// ============================================================================
// NORMALIZATION (ZOD SCHEMA)
// ============================================================================

// Zod schema for normalized page metadata (18-20 fields)
export const PageMetadataSchema = z.object({
  // Core identifiers
  url: z.string().url(),
  title: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  
  // Funding amounts
  funding_amount_min: z.number().nullable().optional(),
  funding_amount_max: z.number().nullable().optional(),
  currency: z.string().nullable().optional(),
  
  // Deadlines
  deadline: z.string().nullable().optional(),
  open_deadline: z.boolean().optional().default(false),
  
  // Contact (allow any string, we'll validate email format ourselves)
  contact_email: z.string().nullable().optional(),
  contact_phone: z.string().nullable().optional(),
  
  // Funding & program info
  funding_types: z.array(z.string()).optional().default([]),
  program_focus: z.array(z.string()).optional().default([]),
  region: z.string().nullable().optional(),
  
  // Requirements (18 categories)
  categorized_requirements: z.record(z.string(), z.array(z.any())).default({}),
  
  // Metadata
  schema_version: z.string().default('1.0'),
  metadata_json: z.record(z.string(), z.any()).default({}), // Extras for schema evolution
  fetched_at: z.string().datetime().optional(),
  raw_html_path: z.string().nullable().optional()
});

export type PageMetadata = z.infer<typeof PageMetadataSchema>;

export function normalizeMetadata(raw: any): PageMetadata {
  try {
    // Simple preprocessing: ensure numbers are numbers
    const funding_amount_min = (raw.funding_amount_min != null && raw.funding_amount_min !== undefined) ? Number(raw.funding_amount_min) : null;
    const funding_amount_max = (raw.funding_amount_max != null && raw.funding_amount_max !== undefined) ? Number(raw.funding_amount_max) : null;
    
    // Simple validation - use raw values directly
    const validated: any = {
      url: raw.url || '',
      title: raw.title ?? null,
      description: raw.description ?? null,
      funding_amount_min: (funding_amount_min != null && !isNaN(funding_amount_min)) ? funding_amount_min : null,
      funding_amount_max: (funding_amount_max != null && !isNaN(funding_amount_max)) ? funding_amount_max : null,
      currency: raw.currency ?? null,
      deadline: raw.deadline ?? null,
      open_deadline: raw.open_deadline ?? false,
      contact_email: raw.contact_email ?? null,
      contact_phone: raw.contact_phone ?? null,
      funding_types: raw.funding_types || [],
      program_focus: raw.program_focus || [],
      region: raw.region ?? null,
      categorized_requirements: raw.categorized_requirements || {},
      schema_version: raw.schema_version || '1.0',
      metadata_json: raw.metadata_json || {},
      fetched_at: raw.fetched_at || new Date().toISOString(),
      raw_html_path: raw.raw_html_path ?? null
    };
    
    // Return validated directly - don't use Zod (it may transform/strip values)
    // The validated object has all our extracted values correctly typed
    return validated as PageMetadata;
  } catch (e: any) {
    // Last resort: return minimal valid structure
    return {
      url: raw.url || '',
      title: raw.title || null,
      description: raw.description || null,
      funding_amount_min: null,
      funding_amount_max: null,
      currency: null,
      deadline: null,
      open_deadline: false,
      contact_email: null,
      contact_phone: null,
      funding_types: [],
      program_focus: [],
      region: null,
      categorized_requirements: raw.categorized_requirements || {},
      schema_version: '1.0',
      metadata_json: { _error: String(e) },
      fetched_at: raw.fetched_at || new Date().toISOString(),
      raw_html_path: null
    };
  }
}

// ============================================================================
// CATEGORY ANALYTICS
// ============================================================================

export interface CategoryStats {
  category: string;
  totalFound: number;
  totalPages: number;
  coverage: number; // percentage
  avgItemsPerPage: number;
  examples: string[];
}

export function analyzeCategoryCoverage(pages: Array<{ categorized_requirements?: Record<string, any[]> }>): CategoryStats[] {
  const stats: Record<string, CategoryStats> = {};
  
  REQUIREMENT_CATEGORIES.forEach(cat => {
    stats[cat] = {
      category: cat,
      totalFound: 0,
      totalPages: pages.length,
      coverage: 0,
      avgItemsPerPage: 0,
      examples: []
    };
  });
  
  pages.forEach(page => {
    const reqs = page.categorized_requirements || {};
    REQUIREMENT_CATEGORIES.forEach(cat => {
      const items = reqs[cat] || [];
      if (items.length > 0) {
        stats[cat].totalFound++;
        // Collect example values
        items.slice(0, 3).forEach(item => {
          if (typeof item === 'object' && item.value && !stats[cat].examples.includes(item.value)) {
            stats[cat].examples.push(item.value);
          }
        });
      }
    });
  });
  
  // Calculate metrics
  REQUIREMENT_CATEGORIES.forEach(cat => {
    const stat = stats[cat];
    stat.coverage = stat.totalPages > 0 ? (stat.totalFound / stat.totalPages) * 100 : 0;
    
    // Count total items
    let totalItems = 0;
    pages.forEach(page => {
      const items = page.categorized_requirements?.[cat] || [];
      totalItems += items.length;
    });
    stat.avgItemsPerPage = stat.totalFound > 0 ? totalItems / stat.totalFound : 0;
  });
  
  return Object.values(stats).sort((a, b) => b.coverage - a.coverage);
}

export function printCategoryReport(stats: CategoryStats[]): void {
  console.log('\n📊 Category Coverage Report\n');
  console.log('Category'.padEnd(20) + 'Coverage'.padEnd(12) + 'Pages Found'.padEnd(15) + 'Avg/Page'.padEnd(12) + 'Examples');
  console.log('─'.repeat(100));
  
  stats.forEach(stat => {
    const coverage = stat.coverage.toFixed(1).padStart(5) + '%';
    const found = String(stat.totalFound).padStart(4) + `/${stat.totalPages}`;
    const avg = stat.avgItemsPerPage.toFixed(1);
    const examples = stat.examples.slice(0, 2).join(', ') || 'none';
    console.log(
      stat.category.padEnd(20) + 
      coverage.padEnd(12) + 
      found.padEnd(15) + 
      avg.padEnd(12) + 
      examples
    );
  });
  
  console.log('\n✅ Categories with coverage > 0%:', stats.filter(s => s.coverage > 0).length);
  console.log('⚠️  Categories with 0% coverage:', stats.filter(s => s.coverage === 0).length);
}

