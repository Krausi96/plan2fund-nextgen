/**
 * Normalization System for Q&A Answers and LLM Extraction
 * Converts both user answers and extracted requirements to a common format for reliable matching
 */

// ============================================================================
// NORMALIZED VALUE SCHEMAS
// ============================================================================

export interface NormalizedLocation {
  countries: string[]; // ['austria', 'germany', 'eu']
  regions?: string[]; // ['vienna', 'tyrol']
  scope: 'local' | 'national' | 'regional' | 'eu' | 'international';
}

export interface NormalizedCompanyType {
  primary: 'startup' | 'sme' | 'large' | 'research' | 'nonprofit' | 'unknown';
  aliases: string[]; // Additional terms that match
  size?: 'micro' | 'small' | 'medium' | 'large';
}

export interface NormalizedCompanyStage {
  stage: 'idea' | 'pre_company' | 'inc_lt_6m' | 'inc_6_36m' | 'inc_gt_36m' | 'research_org' | 'unknown';
  ageRange?: { min?: number; max?: number }; // in months
  maturity: 'early' | 'growth' | 'mature' | 'unknown';
}

export interface NormalizedFundingAmount {
  min: number; // in EUR
  max: number; // in EUR
  range: 'under100k' | '100kto500k' | '500kto2m' | 'over2m' | 'custom';
}

export interface NormalizedIndustry {
  primary: string[]; // ['digital', 'sustainability', 'health']
  keywords: string[]; // Additional matching keywords
}

export interface NormalizedCoFinancing {
  required: boolean;
  percentage?: number; // 0-100
  type: 'none' | 'partial' | 'required' | 'flexible';
}

// ============================================================================
// Q&A ANSWER NORMALIZATION
// ============================================================================

/**
 * Normalize user answer for location
 */
export function normalizeLocationAnswer(value: string): NormalizedLocation {
  const lower = value.toLowerCase().trim();
  
  const countries: string[] = [];
  const regions: string[] = [];
  let scope: NormalizedLocation['scope'] = 'national';
  
  // Country detection
  if (lower.includes('austria') || lower.includes('österreich') || lower.includes('at')) {
    countries.push('austria');
  }
  if (lower.includes('germany') || lower.includes('deutschland') || lower.includes('de')) {
    countries.push('germany');
  }
  if (lower.includes('eu') || lower.includes('europe') || lower.includes('european') || lower.includes('europa')) {
    countries.push('eu');
    scope = 'eu';
  }
  if (lower.includes('international') || lower.includes('global') || lower.includes('worldwide')) {
    countries.push('international');
    scope = 'international';
  }
  
  // Region detection (Austrian states)
  const austrianStates = ['vienna', 'wien', 'tyrol', 'tirol', 'salzburg', 'styria', 'steiermark', 
                          'upper austria', 'oberösterreich', 'lower austria', 'niederösterreich',
                          'carinthia', 'kärnten', 'vorarlberg', 'burgenland'];
  for (const state of austrianStates) {
    if (lower.includes(state)) {
      regions.push(state);
    }
  }
  
  return {
    countries: countries.length > 0 ? countries : ['unknown'],
    regions: regions.length > 0 ? regions : undefined,
    scope
  };
}

/**
 * Normalize user answer for company type
 */
export function normalizeCompanyTypeAnswer(value: string): NormalizedCompanyType {
  const lower = value.toLowerCase().trim();
  
  let primary: NormalizedCompanyType['primary'] = 'unknown';
  const aliases: string[] = [];
  let size: NormalizedCompanyType['size'] | undefined;
  
  if (lower === 'startup' || lower.includes('startup') || lower.includes('start-up')) {
    primary = 'startup';
    aliases.push('startup', 'start-up', 'new venture', 'early-stage company');
    size = 'micro';
  } else if (lower === 'sme' || lower.includes('sme') || lower.includes('small') || lower.includes('medium') || lower.includes('mittelstand')) {
    primary = 'sme';
    aliases.push('sme', 'small and medium enterprise', 'small business', 'mittelstand', 'kmü');
    size = lower.includes('small') ? 'small' : 'medium';
  } else if (lower === 'large' || lower.includes('large') || lower.includes('enterprise')) {
    primary = 'large';
    aliases.push('large company', 'enterprise', 'corporation');
    size = 'large';
  } else if (lower === 'research' || lower.includes('research') || lower.includes('university') || lower.includes('academic') || lower.includes('institution')) {
    primary = 'research';
    aliases.push('research institution', 'university', 'academic institution', 'research organization');
  }
  
  return { primary, aliases, size };
}

/**
 * Normalize user answer for company stage
 */
export function normalizeCompanyStageAnswer(value: string): NormalizedCompanyStage {
  const lower = value.toLowerCase().trim();
  
  let stage: NormalizedCompanyStage['stage'] = 'unknown';
  let maturity: NormalizedCompanyStage['maturity'] = 'unknown';
  let ageRange: { min?: number; max?: number } | undefined;
  
  if (lower === 'idea' || lower.includes('idea') || lower.includes('concept')) {
    stage = 'idea';
    maturity = 'early';
    ageRange = { min: 0, max: 0 };
  } else if (lower === 'pre_company' || (lower.includes('pre') && lower.includes('company'))) {
    stage = 'pre_company';
    maturity = 'early';
    ageRange = { min: 0, max: 0 };
  } else if (lower === 'inc_lt_6m' || lower.includes('<6') || lower.includes('under 6') || lower.includes('newly founded') || lower.includes('seed') || lower === 'early_stage') {
    stage = 'inc_lt_6m';
    maturity = 'early';
    ageRange = { min: 0, max: 6 };
  } else if (lower === 'launch_stage' || (lower.includes('launch') && lower.includes('stage'))) {
    stage = 'inc_6_36m';
    maturity = 'early';
    ageRange = { min: 6, max: 12 };
  } else if (lower === 'inc_6_36m' || (lower.includes('6') && lower.includes('36')) || lower.includes('growth') || lower.includes('scale-up') || lower === 'growth_stage') {
    stage = 'inc_6_36m';
    maturity = 'growth';
    ageRange = { min: 6, max: 36 };
  } else if (lower === 'inc_gt_36m' || lower.includes('>36') || lower.includes('over 36') || lower.includes('established') || lower.includes('mature')) {
    stage = 'inc_gt_36m';
    maturity = 'mature';
    ageRange = { min: 36 };
  } else if (lower === 'research_org' || lower.includes('research') || lower.includes('university') || lower.includes('academic')) {
    stage = 'research_org';
    maturity = 'mature';
  }
  
  return { stage, ageRange, maturity };
}

/**
 * Normalize user answer for funding amount
 */
export function normalizeFundingAmountAnswer(value: string | number): NormalizedFundingAmount {
  let min = 0;
  let max = 0;
  let range: NormalizedFundingAmount['range'] = 'custom';
  
  if (typeof value === 'string') {
    const lower = value.toLowerCase().trim();
    
    if (lower === 'under100k' || lower.includes('under 100')) {
      min = 0;
      max = 100000;
      range = 'under100k';
    } else if (lower === '100kto500k' || (lower.includes('100') && lower.includes('500'))) {
      min = 100000;
      max = 500000;
      range = '100kto500k';
    } else if (lower === '500kto2m' || (lower.includes('500') && lower.includes('2'))) {
      min = 500000;
      max = 2000000;
      range = '500kto2m';
    } else if (lower === 'over2m' || lower.includes('over 2') || lower.includes('above 2')) {
      min = 2000000;
      max = 999999999;
      range = 'over2m';
    } else {
      // Try to parse as number
      const num = parseInt(lower.replace(/[^\d]/g, ''));
      if (!isNaN(num)) {
        min = num;
        max = num;
        range = 'custom';
      }
    }
  } else {
    min = value;
    max = value;
    range = 'custom';
  }
  
  return { min, max, range };
}

/**
 * Normalize user answer for industry
 */
export function normalizeIndustryAnswer(value: string | string[]): NormalizedIndustry {
  const values = Array.isArray(value) ? value : [value];
  const primary: string[] = [];
  const keywords: string[] = [];
  
  const industryMap: Record<string, { primary: string; keywords: string[] }> = {
    digital: { primary: 'digital', keywords: ['ict', 'it', 'software', 'technology', 'digitalization', 'digitization'] },
    sustainability: { primary: 'sustainability', keywords: ['green', 'climate', 'environmental', 'renewable', 'eco', 'circular economy'] },
    health: { primary: 'health', keywords: ['life sciences', 'biotech', 'pharmaceutical', 'medical', 'healthcare'] },
    manufacturing: { primary: 'manufacturing', keywords: ['production', 'industry 4.0', 'smart manufacturing', 'factory'] },
    export: { primary: 'export', keywords: ['international', 'global', 'trade', 'exporting'] },
  };
  
  for (const val of values) {
    const lower = val.toLowerCase().trim();
    const mapped = industryMap[lower];
    if (mapped) {
      primary.push(mapped.primary);
      keywords.push(...mapped.keywords);
    } else {
      primary.push(lower);
      keywords.push(lower);
    }
  }
  
  return { primary, keywords };
}

/**
 * Normalize user answer for co-financing
 */
export function normalizeCoFinancingAnswer(value: string): NormalizedCoFinancing {
  const lower = value.toLowerCase().trim();
  
  if (lower === 'co_no' || lower.includes('no') || lower.includes('none')) {
    return { required: false, type: 'none' };
  } else if (lower === 'co_yes' || lower.includes('yes') || lower.includes('required')) {
    return { required: true, type: 'required' };
  } else if (lower === 'co_partial' || lower.includes('partial') || lower.includes('up to')) {
    // Try to extract percentage
    const percentMatch = lower.match(/(\d+)%/);
    const percentage = percentMatch ? parseInt(percentMatch[1]) : 50;
    return { required: true, percentage, type: 'partial' };
  }
  
  return { required: false, type: 'flexible' };
}

// ============================================================================
// LLM EXTRACTION NORMALIZATION
// ============================================================================

/**
 * Normalize LLM-extracted location requirement
 */
export function normalizeLocationExtraction(value: string): NormalizedLocation {
  const lower = value.toLowerCase();
  
  const countries: string[] = [];
  const regions: string[] = [];
  let scope: NormalizedLocation['scope'] = 'national';
  
  // Extract countries
  if (lower.includes('austria') || lower.includes('österreich') || lower.includes('austrian')) {
    countries.push('austria');
  }
  if (lower.includes('germany') || lower.includes('deutschland') || lower.includes('german')) {
    countries.push('germany');
  }
  if (lower.includes('eu') || lower.includes('europe') || lower.includes('european') || lower.includes('europa') || lower.includes('member state')) {
    countries.push('eu');
    scope = 'eu';
  }
  if (lower.includes('international') || lower.includes('global') || lower.includes('worldwide') || lower.includes('any country')) {
    countries.push('international');
    scope = 'international';
  }
  
  // Extract regions
  const regionPatterns = [
    { pattern: /vienna|wien/i, region: 'vienna' },
    { pattern: /tyrol|tirol/i, region: 'tyrol' },
    { pattern: /salzburg/i, region: 'salzburg' },
    { pattern: /styria|steiermark/i, region: 'styria' },
    { pattern: /upper austria|oberösterreich/i, region: 'upper austria' },
    { pattern: /lower austria|niederösterreich/i, region: 'lower austria' },
    { pattern: /carinthia|kärnten/i, region: 'carinthia' },
    { pattern: /vorarlberg/i, region: 'vorarlberg' },
    { pattern: /burgenland/i, region: 'burgenland' },
  ];
  
  for (const { pattern, region } of regionPatterns) {
    if (pattern.test(lower)) {
      regions.push(region);
    }
  }
  
  // Determine scope
  if (countries.includes('international')) {
    scope = 'international';
  } else if (countries.includes('eu')) {
    scope = 'eu';
  } else if (regions.length > 0) {
    scope = 'regional';
  } else if (countries.length > 0) {
    scope = 'national';
  }
  
  return {
    countries: countries.length > 0 ? countries : ['unknown'],
    regions: regions.length > 0 ? regions : undefined,
    scope
  };
}

/**
 * Normalize LLM-extracted company type requirement
 */
export function normalizeCompanyTypeExtraction(value: string): NormalizedCompanyType {
  const lower = value.toLowerCase();
  
  let primary: NormalizedCompanyType['primary'] = 'unknown';
  const aliases: string[] = [value];
  let size: NormalizedCompanyType['size'] | undefined;
  
  // Check for startup
  if (lower.includes('startup') || lower.includes('start-up') || lower.includes('new venture') || 
      lower.includes('early-stage') || lower.includes('seed stage')) {
    primary = 'startup';
    size = 'micro';
  }
  // Check for SME
  else if (lower.includes('sme') || lower.includes('small and medium') || lower.includes('small business') || 
           lower.includes('mittelstand') || lower.includes('kmü') || 
           (lower.includes('small') && lower.includes('enterprise'))) {
    primary = 'sme';
    // Try to determine size
    if (lower.includes('micro') || lower.includes('< 10')) {
      size = 'micro';
    } else if (lower.includes('small') || lower.includes('< 50')) {
      size = 'small';
    } else {
      size = 'medium';
    }
  }
  // Check for large
  else if (lower.includes('large') || lower.includes('enterprise') || lower.includes('corporation') || 
           lower.includes('> 250') || lower.includes('more than 250')) {
    primary = 'large';
    size = 'large';
  }
  // Check for research
  else if (lower.includes('research') || lower.includes('university') || lower.includes('academic') || 
           lower.includes('institution') || lower.includes('research organization')) {
    primary = 'research';
  }
  
  return { primary, aliases, size };
}

/**
 * Normalize LLM-extracted company stage/age requirement
 */
export function normalizeCompanyStageExtraction(value: string): NormalizedCompanyStage {
  const lower = value.toLowerCase();
  
  let stage: NormalizedCompanyStage['stage'] = 'unknown';
  let maturity: NormalizedCompanyStage['maturity'] = 'unknown';
  let ageRange: { min?: number; max?: number } | undefined;
  
  // Extract age in months/years
  const yearMatch = lower.match(/(\d+)\s*years?/);
  const monthMatch = lower.match(/(\d+)\s*months?/);
  const lessThanMatch = lower.match(/less than (\d+)/);
  const maxAgeMatch = lower.match(/max(?:imum)?\s*(?:age|company age)?\s*(?:of|:)?\s*(\d+)/);
  
  let maxAge: number | undefined;
  if (yearMatch) {
    maxAge = parseInt(yearMatch[1]) * 12; // Convert to months
  } else if (monthMatch) {
    maxAge = parseInt(monthMatch[1]);
  } else if (lessThanMatch) {
    maxAge = parseInt(lessThanMatch[1]) * 12; // Assume years
  } else if (maxAgeMatch) {
    maxAge = parseInt(maxAgeMatch[1]) * 12; // Assume years
  }
  
  // Determine stage based on age and keywords
  if (lower.includes('startup') || lower.includes('early stage') || lower.includes('newly founded') || 
      lower.includes('seed') || (maxAge && maxAge <= 6)) {
    stage = 'inc_lt_6m';
    maturity = 'early';
    ageRange = { min: 0, max: maxAge || 6 };
  } else if (lower.includes('growth') || lower.includes('scale-up') || 
             (maxAge && maxAge > 6 && maxAge <= 36)) {
    stage = 'inc_6_36m';
    maturity = 'growth';
    ageRange = { min: 6, max: maxAge || 36 };
  } else if (lower.includes('established') || lower.includes('mature') || 
             (maxAge && maxAge > 36)) {
    stage = 'inc_gt_36m';
    maturity = 'mature';
    ageRange = { min: 36, max: maxAge };
  } else if (lower.includes('idea') || lower.includes('concept') || lower.includes('pre-company')) {
    stage = 'idea';
    maturity = 'early';
    ageRange = { min: 0, max: 0 };
  } else if (lower.includes('research') || lower.includes('university') || lower.includes('academic')) {
    stage = 'research_org';
    maturity = 'mature';
  }
  
  return { stage, ageRange, maturity };
}

/**
 * Normalize LLM-extracted funding amount
 */
export function normalizeFundingAmountExtraction(min: number | null, max: number | null): NormalizedFundingAmount {
  const normalizedMin = min || 0;
  const normalizedMax = max || 0;
  
  let range: NormalizedFundingAmount['range'] = 'custom';
  
  if (normalizedMax <= 100000) {
    range = 'under100k';
  } else if (normalizedMax <= 500000) {
    range = '100kto500k';
  } else if (normalizedMax <= 2000000) {
    range = '500kto2m';
  } else {
    range = 'over2m';
  }
  
  return {
    min: normalizedMin,
    max: normalizedMax,
    range
  };
}

/**
 * Normalize LLM-extracted co-financing requirement
 */
export function normalizeCoFinancingExtraction(value: string): NormalizedCoFinancing {
  const lower = value.toLowerCase();
  
  // Extract percentage
  const percentMatch = lower.match(/(\d+)%/);
  const percentage = percentMatch ? parseInt(percentMatch[1]) : undefined;
  
  if (lower.includes('required') || lower.includes('must') || lower.includes('mandatory') || percentage) {
    return {
      required: true,
      percentage,
      type: percentage && percentage < 100 ? 'partial' : 'required'
    };
  } else if (lower.includes('not required') || lower.includes('no') || lower.includes('none')) {
    return { required: false, type: 'none' };
  }
  
  return { required: false, type: 'flexible' };
}

// ============================================================================
// MATCHING FUNCTIONS
// ============================================================================

/**
 * Check if normalized locations match
 */
export function matchLocations(user: NormalizedLocation, extracted: NormalizedLocation): boolean {
  // Check if any user country matches extracted countries
  const countryMatch = user.countries.some(uc => 
    extracted.countries.includes(uc) || 
    extracted.countries.includes('international') ||
    (uc === 'eu' && extracted.countries.includes('austria')) // EU includes Austria
  );
  
  // Check region match if both have regions
  const regionMatch = !user.regions || !extracted.regions || 
    user.regions.some(ur => extracted.regions!.includes(ur));
  
  // Scope compatibility
  const scopeMatch = 
    extracted.scope === 'international' || // International accepts all
    user.scope === extracted.scope ||
    (user.scope === 'national' && extracted.scope === 'regional'); // National includes regional
  
  return countryMatch && regionMatch && scopeMatch;
}

/**
 * Check if normalized company types match
 */
export function matchCompanyTypes(user: NormalizedCompanyType, extracted: NormalizedCompanyType): boolean {
  // Direct match
  if (user.primary === extracted.primary) return true;
  
  // Check aliases
  const aliasMatch = user.aliases.some(alias => 
    extracted.aliases.some(eAlias => 
      eAlias.toLowerCase().includes(alias.toLowerCase()) || 
      alias.toLowerCase().includes(eAlias.toLowerCase())
    )
  );
  
  return aliasMatch;
}

/**
 * Check if normalized company stages match
 */
export function matchCompanyStages(user: NormalizedCompanyStage, extracted: NormalizedCompanyStage): boolean {
  // Direct stage match
  if (user.stage === extracted.stage) return true;
  
  // Maturity match
  if (user.maturity === extracted.maturity) return true;
  
  // Age range overlap
  if (user.ageRange && extracted.ageRange) {
    const userMax = user.ageRange.max ?? Infinity;
    const userMin = user.ageRange.min ?? 0;
    const extractedMax = extracted.ageRange.max ?? Infinity;
    const extractedMin = extracted.ageRange.min ?? 0;
    
    // Check if ranges overlap
    if (userMin <= extractedMax && userMax >= extractedMin) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check if normalized funding amounts match
 */
export function matchFundingAmounts(user: NormalizedFundingAmount, extracted: NormalizedFundingAmount): boolean {
  // Program must offer at least 50% of user's need
  const userNeed = user.max;
  const programMax = extracted.max;
  
  if (programMax === 0) return true; // No limit specified = flexible
  
  // Program max should be >= 50% of user need, or user need within program range
  return programMax >= userNeed * 0.5 || (userNeed >= extracted.min && userNeed <= extracted.max);
}

/**
 * Check if normalized industries match
 */
export function matchIndustries(user: NormalizedIndustry, extracted: string[]): boolean {
  if (extracted.length === 0) return true; // No requirement = accepts all
  
  const extractedLower = extracted.map(e => e.toLowerCase());
  
  // Check if any user industry matches extracted industries
  return user.primary.some(up => 
    extractedLower.some(e => 
      e.includes(up) || up.includes(e) ||
      user.keywords.some(kw => e.includes(kw))
    )
  );
}

/**
 * Check if normalized co-financing matches
 */
export function matchCoFinancing(user: NormalizedCoFinancing, extracted: NormalizedCoFinancing): boolean {
  // If program doesn't require co-financing, it matches all users
  if (!extracted.required) return true;
  
  // If user can't provide co-financing but program requires it, no match
  if (!user.required && extracted.required && extracted.type === 'required') {
    return false;
  }
  
  // If both require, check percentage compatibility
  if (user.required && extracted.required) {
    if (extracted.percentage && user.percentage) {
      // User must be able to provide at least what program requires
      return user.percentage >= extracted.percentage;
    }
    return true; // Both require, assume compatible
  }
  
  return true;
}

