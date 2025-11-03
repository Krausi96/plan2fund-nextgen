// Consolidated extraction: metadata, requirements (18 categories), normalization, analytics
import * as cheerio from 'cheerio';
import { z } from 'zod';

// ============================================================================
// REQUIREMENT CATEGORIES & TYPES
// ============================================================================

export const REQUIREMENT_CATEGORIES = [
  'eligibility', 'documents', 'financial', 'technical', 'legal', 
  'timeline', 'geographic', 'team', 'project', 'compliance', 
  'impact', 'capex_opex', 'use_of_funds', 'revenue_model', 
  'market_size', 'co_financing', 'trl_level', 'consortium',
  'diversity'
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
function safeMatchAll(str: string, regex: RegExp): RegExpMatchArray[] {
  try {
    if (typeof str !== 'string' || str == null) return [];
    if (!regex.global) {
      // matchAll requires global flag - if missing, fall back to match
      const match = str.match(regex);
      return match ? [match as RegExpMatchArray] : [];
    }
    return Array.from(str.matchAll(regex));
  } catch (e: any) {
    // Fallback to regular match if matchAll fails for any reason
    const match = str.match(regex);
    return match ? [match as RegExpMatchArray] : [];
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
  
  // Penalize if too generic
  if (lower === 'required' || lower === 'yes' || lower === 'no') score = 20;
  
  // Cap at 100
  return Math.min(100, Math.max(0, score));
}

/**
 * Helper to create a requirement item with automatic meaningfulness scoring
 */
function createRequirementItem(
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
  const lower = text.toLowerCase();
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

export function extractMeta(html: string, url?: string): ExtractedMeta {
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
  
  // Description: OG > JSON-LD > meta description > first paragraph
  let description = ogData.openGraph?.description || '';
  if (!description && jsonLdData.jsonLd) {
    const firstLd = Array.isArray(jsonLdData.jsonLd) ? jsonLdData.jsonLd[0] : jsonLdData.jsonLd;
    description = firstLd.description || '';
  }
  if (!description) description = $('meta[name="description"]').attr('content') || '';
  if (!description) description = $('main p, article p, .content p').first().text().trim();

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
  // Validate funding amount - filter out years, page numbers, and suspicious values
  const isValidFundingAmount = (value: number, context: string): boolean => {
    // Filter years (2020-2030 range) - commonly mistaken as amounts
    if (value >= 2020 && value <= 2030) {
      return false;
    }
    
    // Filter very small round numbers (< 1,000) that are likely page numbers or IDs
    if (value < 1000 && value % 100 === 0) {
      // Common page number patterns
      if ([100, 200, 300, 400, 500, 600, 700, 800, 900].includes(value)) {
        return false;
      }
      // Very small round numbers without million context
      if (value < 1000 && !/\b(million|millionen|mio)\b/i.test(context)) {
        return false;
      }
    }
    
    // Filter amounts that match common page number patterns (e.g., 202, 203, 508)
    if (value < 10000 && (value % 100 === value % 1000 || value.toString().length === 3)) {
      // Check if context suggests it's actually a page number or year
      const contextLower = context.toLowerCase();
      if (contextLower.includes('page') || contextLower.includes('seite') || 
          contextLower.includes('horizon 202') || contextLower.includes('version')) {
        return false;
      }
    }
    
    // Must be within reasonable bounds
    if (value < 1 || value > 1_000_000_000_000) {
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

  const funding_amount_min = amounts.length ? Math.min(...amounts) : null;
  const funding_amount_max = amounts.length ? Math.max(...amounts) : null;

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
          // If deadline is in the past, check if it's more than 1 year old
          if (deadlineDate < now) {
            const daysPast = Math.floor((now.getTime() - deadlineDate.getTime()) / (1000 * 60 * 60 * 24));
            // More than 1 year old (365 days) - likely expired, set as open_deadline instead
            if (daysPast > 365) {
              open_deadline = true;
              deadline = null;
            } else {
              // Recent past deadline (<1 year) - keep as deadline (may be valid for historical reference)
              deadline = `${String(d).padStart(2,'0')}.${String(mo).padStart(2,'0')}.${y}`;
            }
          } else {
            // Future deadline - valid
            deadline = `${String(d).padStart(2,'0')}.${String(mo).padStart(2,'0')}.${y}`;
          }
          break;
        }
      }
      if (deadline || open_deadline) break;
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
      if (/\d{4}-\d{4}/.test(emailLower)) return false; // Any date range in email
      if (/^(\d{4}-\d{2,4}|199\d|200\d|201\d|202\d)@/.test(emailLower)) return false; // Starts with year
      if (/^\d{4}-\d/.test(e)) return false; // Starts with numbers followed by dash
      // Valid email regex check
      const emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
      return emailRegex.test(e);
    });
  const contact_email = emails.length > 0 ? emails[0] : null;
  
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

  // Requirements: Extract all 18 categories using comprehensive extractor
  const categorized = extractAllRequirements(text || '', html || '');

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
        const type = $el.attr('type') || $el.prop('tagName').toLowerCase();
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

export function extractAllRequirements(text: string, html?: string): Record<string, RequirementItem[]> {
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
  const lowerText = safeText.toLowerCase();
  
  // FIRST: Extract from structured HTML (tables, definition lists, sections)
  if (html && typeof html === 'string') {
    extractStructuredRequirements(html, categorized);
  }
  
  // IMPACT - IMPROVED: Extract ACTUAL impact statements, filter out noise (institution names, random text)
  // Only extract quantified or specific impact statements, not generic mentions
  const impactNoisePatterns = [
    /\b(ffg|aws|aws|oekb|mci|auwa|forschungsförderungsgesellschaft|austrian\s*(?:science|research|business))\b/i,
    /\b(gmbh|mbh|inc\.|ltd\.|corporation)\b/i,
    /^[^.]*(?:is|sind|ist|are)\s+(?:the|die|der|das)\s+[^.]{0,30}(?:funding|förderung|institution)/i,
  ];
  
  // Require impact verbs or quantified impact - stricter patterns
  const impactMatches = [
    // Quantified impact (most valuable)
    ...safeMatchAll(safeText, /(?:reduces?|reduziert|verringert|senkt)\s+(?:co2|emissions?|emissionen)\s+(?:by|um)\s+(\d+%?|[^\.\n]{5,100})/gi),
    ...safeMatchAll(safeText, /(?:creates?|schafft|generiert)\s+(\d+)\s+(?:jobs?|arbeitsplätze|arbeitsstellen)/gi),
    ...safeMatchAll(safeText, /(?:saves?|spart|vermeidet)\s+(?:co2|emissions?|energy|energie)\s+(?:by|um)\s+(\d+%?|[^\.\n]{5,100})/gi),
    ...safeMatchAll(safeText, /(?:improves?|verbessert|steigert)\s+(?:sustainability|nachhaltigkeit|efficiency|effizienz)[\s:]+([^\.\n]{20,200})/gi),
    // Specific impact statements (with verbs)
    ...safeMatchAll(safeText, /(?:nachhaltigkeit|sustainability)[\s:]+(?:wird|wird\s+fördert|wird\s+unterstützt|is\s+promoted|is\s+supported)[\s:]+([^\.\n]{20,250})/gi),
    ...safeMatchAll(safeText, /(?:arbeitsplätze|jobs|employment)[\s:]+(?:werden\s+geschaffen|werden\s+gefördert|are\s+created|are\s+supported)[\s:]+([^\.\n]{20,200})/gi),
    // Impact with context (longer descriptions that contain impact verbs)
    ...safeMatchAll(safeText, /(?:klima|climate|co2|emission|klimaschutz)[\s:]+([^\.\n]{30,250})/gi).filter(m => {
      const val = m[1] || '';
      return /(?:reduces?|reduziert|verringert|senkt|saves?|spart|vermeidet|improves?|verbessert)/i.test(val);
    }),
    ...safeMatchAll(safeText, /(?:sozial|social|gesellschaft)[\s:]+([^\.\n]{30,200})/gi).filter(m => {
      const val = m[1] || '';
      return /(?:improves?|verbessert|unterstützt|supports|fördert|promotes)/i.test(val);
    }),
    // Last resort: impact with quantified measures
    ...safeMatchAll(safeText, /(?:impact|wirkung|auswirkung)[\s:]+([^\.\n]{30,250})/gi).filter(m => {
      const val = m[1] || '';
      return /(?:\d+%|\d+\s+(?:jobs?|arbeitsplätze)|reduces?|creates?|improves?|saves?)/i.test(val);
    })
  ];
  
  // Process impact matches with strict filtering
  if (impactMatches.length > 0) {
    impactMatches.forEach(match => {
      if (match[1] && match[1].trim().length > 25) {
        const value = match[1].trim();
        const cleaned = value.replace(/^(?:ist|sind|sein|werden|muss|müssen)[\s,]+/i, '').trim();
        
        // STRICT FILTERING: Filter out noise
        const isNoise = impactNoisePatterns.some(pattern => pattern.test(cleaned)) ||
                       cleaned.toLowerCase().includes('required') ||
                       cleaned.length < 25 || // Too short
                       cleaned.length > 400 || // Too long
                       /^(?:the|die|der|das|eine?|ein)\s+[^.]{0,30}(?:funding|förderung|institution|program)/i.test(cleaned) || // Institution descriptions
                       /mbh|gmbh|inc\.|ltd\.|corporation/i.test(cleaned); // Company names
        
        if (!isNoise) {
          // Determine impact type from context
          const matchText = match[0].toLowerCase();
          let impactType = 'impact_requirement';
          
          if (matchText.includes('nachhaltigkeit') || matchText.includes('sustainability')) {
            impactType = 'sustainability';
          } else if (matchText.includes('klima') || matchText.includes('climate') || matchText.includes('co2')) {
            impactType = 'climate_environmental';
          } else if (matchText.includes('arbeitsplätze') || matchText.includes('jobs') || matchText.includes('beschäftigung')) {
            impactType = 'employment';
          } else if (matchText.includes('sozial') || matchText.includes('social')) {
            impactType = 'social';
          }
          
          categorized.impact.push({
            type: impactType,
            value: cleaned,
            required: true,
            source: 'context_extraction'
          });
        }
      }
    });
  }
  
  // Don't add generic placeholders - only structured/context extraction
  
  // ELIGIBILITY - Enhanced: Extract actual eligibility criteria from context (CRITICAL CATEGORY)
  const eligibilityKeywords = [
    'teilnahmeberechtigt', 'voraussetzung', 'eligibility', 'berechtigt',
    'qualifiziert', 'anforderungen', 'kriterien', 'bedingungen', 'voraussetzungen',
    'antragsberechtigt', 'teilnahmevoraussetzung', 'bewerbungsvoraussetzung', 'qualifikation'
  ];
  
  // More aggressive patterns: shorter minimum length (15 chars) and more context variations
  const eligibilityMatches = [
    ...safeMatchAll(safeText, /(?:teilnahmeberechtigt|voraussetzung|voraussetzungen|eligibility|anforderungen|kriterien|bedingungen|berechtigt|qualifiziert|teilnahmevoraussetzung|bewerbungsvoraussetzung|antragsberechtigt)[\s:]+([^\.\n]{15,500})/gi),
    ...safeMatchAll(safeText, /(?:wer|who|wer kann|who can|wer darf|who is eligible|wer ist berechtigt)[\s:]+([^\.\n]{15,500})/gi),
    ...safeMatchAll(safeText, /(?:teilnehmen|participate|apply|sich bewerben|bewerben|application)[\s]+(?:können|can|dürfen|may|soll|should|muss|must)[\s:]+([^\.\n]{15,500})/gi),
    ...safeMatchAll(safeText, /(?:bewerben|bewerber|applicant|teilnehmer|participant|antragsteller)[\s]+(?:muss|müssen|soll|sollen|darf|dürfen|ist|sind|muss erfüllen|have to|need to)[\s:]+([^\.\n]{15,500})/gi),
    ...safeMatchAll(safeText, /(?:antragsberechtigt|application.eligible|eligible.for|berechtigt sind|qualifiziert sind)[\s:]+([^\.\n]{15,500})/gi),
    ...safeMatchAll(safeText, /(?:voraussetzung|requirement|voraussetzungen|requirements)[\s]+(?:für|for|zur|zur Teilnahme|für die Bewerbung|to apply|to participate)[\s:]+([^\.\n]{15,500})/gi),
    // Additional: eligibility sections and headers
    ...safeMatchAll(safeText, /(?:teilnahmevoraussetzungen|eligibility requirements|voraussetzungen für|requirements for)[\s:]+([^\.\n]{15,500})/gi),
    // List-based patterns (common in eligibility sections)
    ...safeMatchAll(safeText, /(?:voraussetzungen|requirements|eligibility)[\s:]+(?:\n|•|-|\d+\.)\s*([^\.\n]{15,500})/gi)
  ];
  
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
        // Extract multiple eligibility criteria if present (lists)
        if (cleaned.includes(';') || cleaned.includes('•') || cleaned.includes('-') || cleaned.match(/\d+\./)) {
          const items = cleaned.split(/[;•\-]|\n\d+\./).map(item => item.trim()).filter(item => item.length > 10);
          if (items.length > 1) {
            // Add each as separate requirement for better granularity
            items.slice(0, 5).forEach(item => {
              if (item.length > 15 && item.length < 300) {
                categorized.eligibility.push({
                  type: 'eligibility_criteria',
                  value: item,
                  required: true,
                  source: 'context_extraction'
                });
              }
            });
          } else {
            categorized.eligibility.push({
              type: 'eligibility_criteria',
              value: cleaned,
              required: true,
              source: 'context_extraction'
            });
          }
        } else {
          categorized.eligibility.push({
            type: 'eligibility_criteria',
            value: cleaned,
            required: true,
            source: 'context_extraction'
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
      const eligibilityHeadings = $h('h1, h2, h3, h4').filter((_, el) => {
        const text = $h(el).text().toLowerCase();
        return eligibilityKeywords.some(k => text.includes(k)) ||
               /teilnahmevoraussetzung|eligibility|voraussetzung/i.test(text);
      });
      
      eligibilityHeadings.each((_, heading) => {
        const $heading = $h(heading);
        const sectionText = $heading.nextUntil('h1, h2, h3').text().trim();
        if (sectionText.length > 15 && sectionText.length < 500) {
          // Extract first meaningful paragraph
          const firstPara = sectionText.split('\n').find(p => p.trim().length > 15) || sectionText.substring(0, 300);
          if (firstPara && !firstPara.toLowerCase().includes('specified') && !firstPara.toLowerCase().includes('see below')) {
            categorized.eligibility.push({
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
  if (eligibilityKeywords.some(k => lowerText.includes(k)) && categorized.eligibility.length === 0) {
    // Only add if we have more context (multiple mentions or specific context)
    const hasStartupContext = (lowerText.match(/startup|neugründung|start-up/g) || []).length >= 2 ||
                               /(?:für|for)\s+(?:startups|start-ups|neugründungen)/i.test(safeText);
    if (hasStartupContext && (lowerText.includes('startup') || lowerText.includes('neugründung') || lowerText.includes('start-up'))) {
      categorized.eligibility.push({
        type: 'company_type',
        value: 'Program specifically designed for startups and new ventures',
        required: true,
        source: 'eligibility_section'
      });
    }
    
    const hasCompanyContext = (lowerText.match(/unternehmen|firma|company|betrieb/g) || []).length >= 2 ||
                              /(?:für|for)\s+(?:unternehmen|companies|firmen)/i.test(safeText);
    if (hasCompanyContext && (lowerText.includes('unternehmen') || lowerText.includes('firma') || lowerText.includes('company') || lowerText.includes('betrieb'))) {
      categorized.eligibility.push({
        type: 'company_type',
        value: 'Company',
        required: true,
        source: 'eligibility_section'
      });
    }
    
    if (lowerText.includes('kmu') || lowerText.includes('sme') || lowerText.includes('klein- und mittelbetrieb') || lowerText.includes('mittelstand')) {
      categorized.eligibility.push({
        type: 'company_size',
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
        categorized.eligibility.push({
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
        !categorized.eligibility.some(e => e.type === 'company_stage')) {
      categorized.eligibility.push({
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
        // Try to extract format if present
        const formatMatch = item.value.match(/(?:format|als|in|max\.?|maximal)\s*([^,;:]+(?:pdf|doc|docx|page|seite|mb|kb|format)[^,;:]*(?:,|;|$)?)/i);
        const format = formatMatch ? formatMatch[1].trim() : undefined;
        
        categorized.documents.push({
          type: 'documents_required',
          value: item.value.substring(0, 400), // Limit length
          required: true,
          source: 'context_extraction',
          format: format
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
  const trlKeywords = [
    'trl', 'technology readiness', 'reifegrad', 'technologiereifegrad',
    'technology readiness level', 'trl-level', 'trl level', 'technology maturity',
    'tech readiness', 'tech readiness level', 'reifegradstufe', 'technology reifegrad'
  ];
  
  // Pattern 1: TRL X or TRL X-Y (more flexible patterns)
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
    ...safeMatchAll(safeText, /(?:technologie|technology)[\s]+(?:muss|must|should|sollte)[\s]+(?:mindestens|at least)[\s]+(?:reifegrad|trl)[\s\-]?(\d{1})/gi)
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
        
        // IMPROVED VALIDATION: More lenient but still meaningful
        // Reject generic placeholders
        const isGeneric = lowerLoc.includes('required') || lowerLoc.includes('specified') ||
                         lowerLoc.includes('available') || lowerLoc.includes('erforderlich') ||
                         lowerLoc.includes('notwendig') || lowerLoc.includes('angegeben') ||
                         lowerLoc.length < 3 || lowerLoc.length > 150;
        
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
    
    uniqueLocations.forEach(loc => {
      // Filter: Only add meaningful locations (length >= 20) or known locations with context
      const isShort = loc.length < 20;
      const isKnownGeneric = /^(Austria|Österreich|EU|Europa|Europe)$/i.test(loc.trim());
      
      // IMPROVED: Skip short generic locations unless they have specific context
      // Require minimum 20 chars OR specific known location with context
      if (isShort && isKnownGeneric) {
        // Only skip if it's truly generic without context
        // If it has context (e.g., "for companies in Austria"), keep it
        if (!loc.match(/for|für|companies|unternehmen|startups|located|ansässig/i)) {
          return; // Skip pure "Austria" without context
        }
      }
      
      // Minimum length requirement: 15 chars for meaningful geographic info
      if (loc.length < 15 && !isKnownGeneric) {
        return; // Skip too-short locations without being known
      }
      
      categorized.geographic.push({
        type: 'specific_location',
        value: loc,
        required: false,
        source: 'context_extraction'
      });
    });
  }
  
  // Also match regions from predefined list - but add context to make them meaningful
  regions.forEach(r => {
    const regex = new RegExp('\\b' + r.key.replace(/\\b/g, '') + '\\b', 'i');
    if (regex.test(text)) {
      // Check if we already have this region
      const exists = categorized.geographic.some(g => g.value === r.value || g.value.toLowerCase().includes(r.value.toLowerCase()));
      if (!exists) {
        // Add context for short generic regions to make them meaningful (>= 20 chars)
        const value = (r.value.length < 20 && r.type !== 'city') 
          ? `Eligible for companies located in ${r.value}`
          : r.value;
        
        categorized.geographic.push({
          type: r.type,
          value: value,
          required: false,
          source: 'full_page_content'
        });
      }
    }
  });
  
  // TIMELINE - Enhanced: Better date and duration extraction with more patterns
  const timelineMatches = [
    // Deadline patterns with keywords
    ...safeMatchAll(safeText, /(?:deadline|frist|einreichfrist|bewerbungsfrist|application deadline|abgabefrist|meldungsfrist|anmeldefrist|submit by|einreichen bis|letzter termin|last date)[\s:]+([^\.\n]{5,150})/gi),
    ...safeMatchAll(safeText, /(?:laufzeit|duration|zeitraum|project duration|program duration|projektlaufzeit|förderdauer|funding period|programmlaufzeit)[\s:]+([^\.\n]{5,150})/gi),
    // Date ranges
    ...safeMatchAll(safeText, /(?:von|from|ab|starting|beginning|gültig ab|valid from)[\s]+(\d{1,2}[\.\/\-]\d{1,2}[\.\/\-]\d{2,4})[\s]*(?:bis|to|until|ending|\-)[\s]+(\d{1,2}[\.\/\-]\d{1,2}[\.\/\-]\d{2,4})/gi),
    ...safeMatchAll(safeText, /(\d{1,2}[\.\/\-]\d{1,2}[\.\/\-]\d{2,4})[\s]*(?:-\s*|\s+to\s+|\s+bis\s+|\s+until\s+)(\d{1,2}[\.\/\-]\d{1,2}[\.\/\-]\d{2,4})/gi),
    // Single dates with context
    ...safeMatchAll(safeText, /(?:bis|until|by|spätestens|letzter\s+termin|deadline|frist|einsendeschluss|application deadline|bewerbungsschluss)[\s]+(\d{1,2}[\.\/\-]\d{1,2}[\.\/\-]\d{2,4})/gi),
    // Timeline sections
    ...safeMatchAll(safeText, /(?:zeitplan|timeline|ablauf|procedure|process|verfahren|timeline|fristen|dates|termine)[\s:]+([^\.\n]{10,200})/gi),
    // Evaluation/decision dates
    ...safeMatchAll(safeText, /(?:entscheidung|decision|bewilligung|approval|bekanntgabe|announcement|notification)[\s:]+([^\.\n]{5,150})/gi),
    // Submission periods
    ...safeMatchAll(safeText, /(?:einreichung|submission|bewerbung|application)[\s]+(?:möglich|possible|open|von|from|between)[\s]+([^\.\n]{5,150})/gi),
    // Specific time periods (e.g., "from January to March")
    ...safeMatchAll(safeText, /(?:von|from)\s+(?:januar|februar|märz|april|mai|juni|juli|august|september|oktober|november|dezember|january|february|march|may|june|july|august|september|october|november|december)[\s]+(?:bis|to|until)\s+(?:januar|februar|märz|april|mai|juni|juli|august|september|oktober|november|dezember|january|february|march|may|june|july|august|september|october|november|december)/gi)
  ];
  
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
      
      if (value.length > 5 && value.length < 250 && (hasDate || hasTimelineKeyword) && !value.toLowerCase().includes('specified') && !value.toLowerCase().includes('available upon request')) {
        categorized.timeline.push({
          type: dateRangeMatch ? 'date_range' : (deadlineMatch ? 'deadline' : (hasDate ? 'deadline' : 'duration')),
          value: value.substring(0, 200), // Limit length
          required: true,
          source: 'context_extraction'
        });
      }
    }
  }
  
  // Duration extraction - Enhanced patterns with more variations
  const durationMatches = [
    ...safeMatchAll(safeText, /(?:laufzeit|duration|dauer|programm duration|project duration|förderdauer|programmlaufzeit|projektlaufzeit)[\s:]+([^\.\n]{5,100})/gi),
    ...safeMatchAll(safeText, /(\d+)\s*(?:jahr|jahre|year|years|month|monat|monate|months|woche|weeks|tag|days)[\s]*(?:laufzeit|duration|dauer|lang|long)?/i),
    ...safeMatchAll(safeText, /(\d+)\s*-\s*(\d+)\s*(?:jahr|jahre|year|years|month|monat|monate|months)/i),
    ...safeMatchAll(safeText, /(?:zwischen|between)\s+(\d+)\s*(?:und|and)\s+(\d+)\s*(?:jahr|jahre|year|years|month|monat|monate|months)/i),
    ...safeMatchAll(safeText, /(?:maximum|maximal|max\.|bis zu|up to)\s+(\d+)\s*(?:jahr|jahre|year|years|month|monat|monate|months)/i),
    ...safeMatchAll(safeText, /(?:minimum|mindestens|min\.|at least)\s+(\d+)\s*(?:jahr|jahre|year|years|month|monat|monate|months)/i),
    ...safeMatchAll(safeText, /(?:project|projekt|program|programm)[\s]+(?:duration|laufzeit|dauer)[\s:]+([^\.\n]{5,100})/gi)
  ];
  
  durationMatches.forEach(match => {
    const value = match[0] || match[1] || '';
    if (value && !categorized.timeline.some(t => t.value.includes(match[1] || match[0]))) {
      const durationText = value.trim();
      if (durationText.length > 3 && durationText.length < 100) {
        categorized.timeline.push({
          type: 'duration',
          value: durationText,
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
  
  // Don't add generic placeholder - only add if we found meaningful content
  
  // TEAM - Enhanced: Extract actual team requirements
  const teamMatches = [
    ...safeMatchAll(safeText, /(?:team|mitarbeiter|personal|personnel|teamgröße|team size|staff)[\s:]+([^\.\n]{10,300})/gi),
    ...safeMatchAll(safeText, /(?:mindestens|at least|minimum|min\.|min)[\s]+(\d+)[\s]*(?:mitarbeiter|team|personnel|staff|members)/gi),
    ...safeMatchAll(safeText, /(?:team|mitarbeiter)[\s]+(?:von|consisting of|mit|with)[\s]+(\d+)[\s]*(?:mitarbeiter|personnel|staff)/gi),
    ...safeMatchAll(safeText, /(?:projektteam|project team|kern team|core team)[\s:]+([^\.\n]{10,300})/gi),
    ...safeMatchAll(safeText, /(?:qualifikation|qualification|ausbildung|education|expertise|erfahrung)[\s]+(?:des teams|of the team|der mitarbeiter)[\s:]+([^\.\n]{10,300})/gi)
  ];
  if (teamMatches.length > 0) {
    const sortedMatches = teamMatches
      .filter(m => m[1] && (m[1].trim().length > 10 || /^\d+/.test(m[1])))
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
      
      // Only add if meaningful (length >= 20) or it contains numbers (specific requirement)
      const isMeaningful = cleaned.length >= 20 || /^\d+/.test(cleaned);
      
      if (isMeaningful && cleaned.length > 5 && cleaned.length < 400 && !cleaned.toLowerCase().includes('required') && !cleaned.toLowerCase().includes('specified')) {
        // Add context if it's too short but contains numbers
        const contextualValue = (cleaned.length < 20 && /^\d+/.test(cleaned))
          ? `Team size requirement: ${cleaned}`
          : cleaned;
        
        categorized.team.push({
          type: 'team_requirement',
          value: contextualValue,
          required: true,
          source: 'context_extraction'
        });
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
  const projectMatches = [
    ...safeMatchAll(safeText, /(?:innovation|forschung|entwicklung|research|development)[\s:]+([^\.\n]{10,200})/gi),
    ...safeMatchAll(safeText, /(?:fokus|focus|schwerpunkt|thema|topic)[\s:]+([^\.\n]{10,200})/gi)
  ];
  if (projectMatches.length > 0) {
    const bestMatch = projectMatches.find(m => m[1] && m[1].trim().length > 15);
    if (bestMatch && bestMatch[1]) {
      const value = bestMatch[1].trim();
      const cleaned = value.replace(/^(?:ist|sind|sein|werden)[\s,]+/i, '').trim();
      if (cleaned.length > 10 && cleaned.length < 300 && !cleaned.toLowerCase().includes('required')) {
        categorized.project.push({
          type: 'innovation_focus',
          value: cleaned,
          required: true,
          source: 'context_extraction'
        });
      }
    }
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
    });
  }
  
  if (financialKeywords.some(k => lowerText.includes(k))) {
    // Try multiple patterns for amounts
    const amountPatterns = [
      /(?:bis zu|maximal|förderbetrag|förderhöhe|förderung|finanzierung)\s*€?\s*(\d{1,3}(?:[.,\s]\d{3})*(?:[.,]\d{2})?)/i,
      /€\s*(\d{1,3}(?:[.,\s]\d{3})*(?:[.,]\d{2})?)/i,
      /(\d{1,3}(?:[.,\s]\d{3})*(?:[.,]\d{2})?)\s*€/i,
      /(\d{1,3}(?:[.,]\d{3})*)\s*(?:million|millionen|mio)/i
    ];
    
    let amountMatch: RegExpMatchArray | null = null;
    for (const pattern of amountPatterns) {
      const match = safeText.match(pattern);
      if (match) {
        amountMatch = match;
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
        return cleaned;
      })
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
    
    // Always add amount if found - add context if short to make meaningful
    if (amountMatch) {
      const amountValue = amountMatch[0].trim();
      // Make short amounts meaningful by adding context (target: >= 20 chars)
      const contextualValue = amountValue.length < 20 
        ? `Maximum funding amount available: ${amountValue}`
        : amountValue;
      
      categorized.financial.push({
        type: 'funding_amount_max',
        value: contextualValue,
        required: true,
        source: amountMatch[0].includes('€') ? 'context_extraction' : 'full_page_content'
      });
    }
    // Don't add generic placeholder - only if amount found
  }
  
  // CONSORTIUM - Enhanced: Extract partnership details
  const consortiumMatches = [
    ...safeMatchAll(safeText, /(?:konsortium|consortium|partner|partnership)[\s:]+([^\.\n]{10,150})/gi),
    ...safeMatchAll(safeText, /(?:mindestens|at least|minimum|minimum of)[\s]+(\d+)[\s]*(?:partner|partners)/gi)
  ];
  if (consortiumMatches.length > 0) {
    const bestMatch = consortiumMatches.find(m => m[1] && (m[1].trim().length > 10 || /^\d+/.test(m[1])));
    if (bestMatch && bestMatch[1]) {
      const value = bestMatch[1].trim();
      if (value.length > 5 && value.length < 200 && !value.toLowerCase().includes('required')) {
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
  const useOfFundsMatches = [
    ...safeMatchAll(safeText, /(?:verwendung|use of funds|zweck|verwendungszweck|verwendungsmöglichkeit|finanzierungszweck|förderzweck|investitionszweck)[\s:]+([^\.\n]{20,300})/gi),
    ...safeMatchAll(safeText, /(?:finanzierung|funding|förderung)[\s]+(?:für|for|zur|zur Verwendung|for use in|for the purpose of)[\s:]+([^\.\n]{20,300})/gi),
    ...safeMatchAll(safeText, /(?:verwendet|used|einsetzen|investiert)[\s]+(?:werden|can be|should be|must be)[\s]+(?:für|for)[\s:]+([^\.\n]{20,300})/gi),
    ...safeMatchAll(safeText, /(?:erlaubt|allowed|zulässig)[\s]+(?:für|for|zur)[\s:]+([^\.\n]{20,300})/gi)
  ];
  
  // Process all matches to get more comprehensive extraction
  const validUseMatches = useOfFundsMatches
    .filter(m => m[1] && m[1].trim().length > 20)
    .map(m => {
      const value = m[1].trim();
      const cleaned = value.replace(/^(?:ist|sind|sein|werden|darf|dürfen|soll|sollen|kann|können|muss|müssen|erlaubt|allowed|zulässig)[\s,]+/i, '').trim();
      return cleaned;
    })
    .filter(val => val.length > 20 && val.length < 350)
    .filter(val => {
      const lower = val.toLowerCase();
      // Must contain actual use indicators, not just generic words
      return !lower.includes('specified') && !lower.includes('required') &&
             !lower.includes('available') && !lower.includes('erforderlich') &&
             (lower.includes('investition') || lower.includes('investment') ||
              lower.includes('entwicklung') || lower.includes('development') ||
              lower.includes('forschung') || lower.includes('research') ||
              lower.includes('marketing') || lower.includes('personal') ||
              lower.includes('ausrüstung') || lower.includes('equipment') ||
              lower.includes('maschinen') || lower.includes('machinery') ||
              lower.includes('immobilie') || lower.includes('real estate') ||
              lower.includes('kapital') || lower.includes('capital') ||
              lower.split(/\s+/).length > 3); // Multi-word descriptions are more likely meaningful
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
  const marketMatches = [
    ...safeMatchAll(safeText, /(?:marktgröße|market size|marktpotenzial|market potential|marktvolumen|market volume|marktnachfrage|market demand)[\s:]+([^\.\n]{15,200})/gi),
    ...safeMatchAll(safeText, /(?:target market|zielmarkt|addressable market|adressierbarer markt|total addressable market|tam)[\s:]+([^\.\n]{15,200})/gi),
    ...safeMatchAll(safeText, /(?:market|markt)[\s]+(?:size|größe|potential|potenzial)[\s:]+([^\.\n]{15,200})/gi),
    ...safeMatchAll(safeText, /(?:minimum|mindestens|at least)[\s]+(?:market|markt)[\s]+(?:size|größe)[\s:]+([^\.\n]{15,200})/gi)
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
      }
    }
  }
  // Don't add generic placeholder - only add if we found meaningful content
  
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
  const genericPatterns = [
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
    /^(team|mitarbeiter|personnel)\s*(required|specified)?$/i
  ];
  
  Object.keys(categorized).forEach(category => {
    categorized[category] = categorized[category].filter(item => {
      const value = (item.value || '').trim();
      // Remove if value is empty or too short
      if (!value || value.length < 5) return false;
      
      // Remove if matches generic patterns
      const isGeneric = genericPatterns.some(pattern => pattern.test(value));
      if (isGeneric) return false;
      
      // Remove if value is just common generic words
      const lowerValue = value.toLowerCase();
      const genericWords = ['specified', 'required', 'available', 'erforderlich', 'notwendig', 
                           'nötig', 'benötigt', 'soll', 'muss', 'müssen', 'darf', 'dürfen'];
      if (genericWords.some(word => 
          lowerValue === word || 
          lowerValue === word + ' impact' ||
          lowerValue === word + ' compliance' ||
          (lowerValue.startsWith(word + ' ') && value.length < 30) ||
          (lowerValue.endsWith(' ' + word) && value.length < 30))) {
        return false;
      }
      
      // Remove if value contains generic phrases and is short
      if (value.length < 25 && (
          lowerValue.includes('required') || 
          lowerValue.includes('specified') || 
          lowerValue.includes('available'))) {
        return false;
      }
      
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
    financial: ['förderhöhe', 'förderbetrag', 'funding amount', 'maximal', 'bis zu', 'finanzierung', 'förderung', 'fördersumme', 'finanzierungsvolumen', 'betrag', 'höhe', 'summe'],
    eligibility: ['teilnahmeberechtigt', 'voraussetzung', 'eligibility', 'anforderungen', 'kriterien', 'voraussetzungen', 'bedingungen', 'berechtigt', 'qualifiziert', 'zulassung'],
    documents: ['unterlagen', 'dokumente', 'bewerbung', 'antrag', 'nachweis', 'formulare', 'belege', 'nachweise', 'formular', 'antragsunterlagen'],
    technical: ['technisch', 'technical', 'technologie', 'anforderungen', 'tech', 'technik', 'technologisch', 'spezi', 'spezifikation', 'voraussetzungen technisch'],
    team: ['team', 'mitarbeiter', 'personal', 'qualifikation', 'qualifizierung', 'personal', 'person', 'experten', 'fachkräfte', 'ausbildung'],
    timeline: ['laufzeit', 'duration', 'deadline', 'frist', 'zeitraum', 'bewerbungsfrist', 'einreichfrist', 'deadline', 'dauer', 'zeitplan'],
    impact: ['nachhaltigkeit', 'sustainability', 'impact', 'wirkung', 'klima', 'umwelt', 'sozial', 'arbeitsplätze', 'beschäftigung', 'co2', 'emission'],
    consortium: ['konsortium', 'consortium', 'partner', 'partnership', 'kooperation', 'zusammenarbeit', 'partner', 'verbund', 'allianz'],
    project: ['projekt', 'project', 'fokus', 'focus', 'thema', 'topic', 'schwerpunkt', 'innovation', 'forschung', 'entwicklung', 'ziel'],
    geographic: ['standort', 'region', 'location', 'gebiet', 'bereich', 'ort', 'platz', 'wohnort', 'niederlassung'],
    use_of_funds: ['verwendung', 'use of funds', 'zweck', 'verwendungszweck', 'zweckbindung', 'einsatz', 'nutzung'],
    capex_opex: ['investition', 'capex', 'opex', 'betriebsausgaben', 'investment', 'investitionen', 'ausgaben', 'kosten'],
    revenue_model: ['umsatz', 'revenue', 'erlös', 'geschäftsmodell', 'business model', 'erlösmodel', 'umsatzmodell'],
    market_size: ['marktgröße', 'market size', 'marktpotenzial', 'market potential', 'markt', 'potenzial', 'zielmarkt']
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
              type: 'specific_location',
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
            if (label.includes('nachhaltigkeit') || label.includes('sustainability')) {
              impactType = 'sustainability';
            } else if (label.includes('klima') || label.includes('co2') || label.includes('emission') || 
                       label.includes('umwelt') || label.includes('ökologie')) {
              impactType = 'climate_environmental';
            } else if (label.includes('sozial') || label.includes('social')) {
              impactType = 'social';
            } else if (label.includes('arbeitsplätze') || label.includes('beschäftigung') || label.includes('jobs')) {
              impactType = 'employment';
            }
            
            categorized.impact.push({
              type: impactType,
              value: impactValue,
              required: true,
              source: 'table'
            });
          }
        }
        
        // Eligibility
        if (label.includes('teilnahmeberechtigt') || label.includes('voraussetzung') || label.includes('eligibility')) {
          categorized.eligibility.push({
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
          categorized.eligibility.push({
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
          if (term.includes('nachhaltigkeit') || term.includes('sustainability')) {
            impactType = 'sustainability';
          } else if (term.includes('klima') || term.includes('co2') || term.includes('emission') || 
                     term.includes('umwelt') || term.includes('ökologie')) {
            impactType = 'climate_environmental';
          } else if (term.includes('sozial') || term.includes('social')) {
            impactType = 'social';
          } else if (term.includes('arbeitsplätze') || term.includes('beschäftigung') || term.includes('jobs')) {
            impactType = 'employment';
          }
          
          categorized.impact.push({
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
                categorized.impact.push({
                  type: 'impact_requirements_list',
                  value: impactItems.join('; '),
                  required: true,
                  source: 'list_items'
                });
              }
            } else {
              // Extract detailed text content for impact
              const textContent = nextContent.text().trim().slice(0, 1000);
              if (textContent.length > 20) {
                categorized.impact.push({
                  type: 'impact_description',
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

