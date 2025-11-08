/**
 * Funding Type Normalization
 * Normalizes funding types to canonical list, handles duplicates and invalid types
 */

// Canonical funding types (from institutionConfig.ts)
const CANONICAL_FUNDING_TYPES = [
  'grant',
  'loan',
  'equity',
  'bank_loan',
  'leasing',
  'crowdfunding',
  'subsidy',
  'guarantee',
  'incentive',
  'investment',
  'venture_capital',
  'angel_investment',
  'government_support',
  'tax_incentive',
] as const;

// Mapping: invalid/duplicate types -> canonical type
const FUNDING_TYPE_MAP: Record<string, string | null> = {
  // Plural forms -> singular
  'grants': 'grant',
  'loans': 'loan',
  'subsidies': 'subsidy',
  'guarantees': 'guarantee',
  'investments': 'investment',
  
  // Variations
  'bank_loans': 'bank_loan',
  'bank loans': 'bank_loan',
  'bank-loan': 'bank_loan',
  'venture capital': 'venture_capital',
  'venture-capital': 'venture_capital',
  'vc': 'venture_capital',
  'angel investment': 'angel_investment',
  'angel-investment': 'angel_investment',
  'government support': 'government_support',
  'government-support': 'government_support',
  'tax incentive': 'tax_incentive',
  'tax-incentive': 'tax_incentive',
  'crowd funding': 'crowdfunding',
  'crowd-funding': 'crowdfunding',
  
  // Invalid types that should be mapped or removed (null means remove)
  'services': '', // Not a funding type, remove
  'service': '', // Not a funding type, remove
  'coaching': '', // Not a funding type, remove
  'mentoring': '', // Not a funding type, remove
  'consultations': '', // Not a funding type, remove
  'consultation': '', // Not a funding type, remove
  'networking opportunities': '', // Not a funding type, remove
  'networking': '', // Not a funding type, remove
  'real estate': '', // Not a funding type, remove
  'real-estate': '', // Not a funding type, remove
  'funding': '', // Too generic, remove
  'unknown': '', // Remove unknown, try to infer from context
};

/**
 * Normalize funding types array
 * - Removes duplicates
 * - Maps to canonical types
 * - Removes invalid types
 * - Returns empty array if all invalid
 */
export function normalizeFundingTypes(types: string[] | null | undefined): string[] {
  if (!types || !Array.isArray(types) || types.length === 0) {
    return [];
  }
  
  const normalized = new Set<string>();
  
  for (const type of types) {
    if (!type || typeof type !== 'string') continue;
    
    const lower = type.toLowerCase().trim();
    if (!lower || lower.length === 0) continue;
    
    // Check if already canonical
    if (CANONICAL_FUNDING_TYPES.includes(lower as any)) {
      normalized.add(lower);
      continue;
    }
    
    // Check mapping
    const mapped = FUNDING_TYPE_MAP[lower];
    if (mapped === '') {
      // Explicitly mapped to empty string = remove
      continue;
    } else if (mapped && mapped.length > 0) {
      // Mapped to canonical type
      normalized.add(mapped);
      continue;
    }
    
    // Try fuzzy matching (e.g., "grant" in "grants")
    const canonicalMatch = CANONICAL_FUNDING_TYPES.find(canonical => 
      lower.includes(canonical) || canonical.includes(lower)
    );
    if (canonicalMatch) {
      normalized.add(canonicalMatch);
      continue;
    }
    
    // If no match, skip (don't add invalid types)
    console.warn(`⚠️  Unknown funding type: "${type}" - skipping`);
  }
  
  return Array.from(normalized);
}

/**
 * Infer funding type from context if types are empty or unknown
 */
export function inferFundingType(
  url: string,
  institutionFundingTypes: string[],
  content?: string
): string[] {
  const urlLower = url.toLowerCase();
  const contentLower = (content || '').toLowerCase();
  
  // Check URL patterns
  if (urlLower.includes('grant') || urlLower.includes('foerderung') || urlLower.includes('subsidy')) {
    return ['grant'];
  }
  if (urlLower.includes('loan') || urlLower.includes('kredit') || urlLower.includes('darlehen')) {
    return ['loan'];
  }
  if (urlLower.includes('equity') || urlLower.includes('beteiligung') || urlLower.includes('venture')) {
    return ['equity'];
  }
  if (urlLower.includes('guarantee') || urlLower.includes('garantie') || urlLower.includes('bürgschaft')) {
    return ['guarantee'];
  }
  if (urlLower.includes('leasing')) {
    return ['leasing'];
  }
  if (urlLower.includes('crowdfunding') || urlLower.includes('crowd')) {
    return ['crowdfunding'];
  }
  
  // Check content keywords
  if (contentLower.includes('non-repayable') || contentLower.includes('zuschuss') || contentLower.includes('förderung')) {
    return ['grant'];
  }
  if (contentLower.includes('repay') || contentLower.includes('rückzahlung') || contentLower.includes('zinsen')) {
    return ['loan'];
  }
  if (contentLower.includes('equity stake') || contentLower.includes('beteiligung')) {
    return ['equity'];
  }
  
  // Use institution default
  if (institutionFundingTypes.length > 0) {
    return normalizeFundingTypes(institutionFundingTypes);
  }
  
  // Last resort: unknown (but normalized)
  return [];
}

