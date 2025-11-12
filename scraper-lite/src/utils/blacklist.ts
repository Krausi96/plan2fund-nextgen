/**
 * Blacklist/Exclusion Utilities
 * Checks database-backed exclusions and hardcoded fallbacks
 * 
 * THIS IS THE SINGLE SOURCE OF TRUTH FOR EXCLUSION KEYWORDS
 * All exclusion keywords are defined here and exported for use in:
 * - unified-scraper.ts (runtime filtering)
 * - cleanup-irrelevant.ts (database cleanup)
 * - Self-learning system (learns new patterns automatically)
 */

import { getPool } from '../../db/db';

// ============================================================================
// EXCLUSION KEYWORDS - Single source of truth
// ============================================================================

/**
 * String keywords to match in URLs (for cleanup scripts and simple checks)
 * THIS IS THE SINGLE SOURCE OF TRUTH - all exclusion keywords consolidated here
 */
export const EXCLUSION_KEYWORDS: string[] = [
  // Jobs/Careers
  'stellenangebote',
  'stellenangebot',
  'jobboerse',
  'jobs',
  'karriere',
  'careers',
  'career',
  'stellen',
  'aktuell',
  // Training/Education
  'weiterbildung',
  'mitarbeiterweiterbildung',
  'lehrling',
  'lehrlings',
  'kursdatenbank',
  // Events
  'event',
  'events',
  'veranstaltung',
  'veranstaltungen',
  'events/kalender',
  'event-tipps',
  'events-workshops',
  // Legal/Privacy
  'newsletter',
  'data-protection',
  'privacy-policy',
  'datenschutz',
  'impressum',
  'ueber-uns',
  'about-us',
  'about',
  'ueber',
  'über',
  'chi-siamo',
  'downloads',
  'download',
  'privacy',
  'confidentialite',
  'mentions-legales',
  'note-legali',
  // Info/FAQ/Help pages
  'info',
  'information',
  'informations',
  'faq',
  'frequently-asked',
  'fragen',
  'questions',
  'help',
  'hilfe',
  'contact',
  'news',
  'press',
  'media',
  // Service pages
  'service',
  'newsroom',
  'magazine',
  'presse',
  'die-sfg',
  'barrierefreiheit',
  'impact-eureka',
  'service/cases',
  'web-services',
  // Consulting/Advisory (not funding programs)
  'alarmanlagen',
  'sonderfoerder',
  'sonderförder',
  'coaching',
  'cluster',
  'technologieinfrastruktur',
  'netzwerk',
  'beratung-',
  'beratung/',
  'beratungsscheck',
  'unternehmensberatung',
  'rechtsberatung',
  'consulting',
  // Guidelines/Policy pages
  'richtlinien',
  'guidelines',
  'policy',
  'policies',
  'richtlinie',
  'bestimmungen',
  'bedingungen',
  'terms',
  'conditions',
  'terms-and-conditions',
  'regulations',
  'regeln',
  'vorschriften',
  'standards',
  'normen',
  'anleitung',
  'instructions',
  'handbuch',
  'manual',
  'dokumentation',
  // Obsolete/non-program pages
  'overview',
  'übersicht',
  'uebersicht',
  'general',
  'allgemein',
  'home',
  'startseite',
  'index',
  'main',
  'sitemap',
  'navigation',
  'menu',
  // Housing/Real Estate (not business funding)
  'wohnbau',
  'wohnbauförderung',
  'wohnung',
  'wohnungsbau',
  'wohnungsförderung',
  'wohnbeihilfe',
  'bauen-wohnen',
  'raumplanung',
  'housing',
  'real estate',
  'immobilie',
  'immobilien',
  'baufinanzierung',
  'hypothek',
  'mortgage',
  'privatkunden',
  'private',
  // Agriculture/Forestry (not startup/SME funding)
  'landwirtschaft',
  'forstwirtschaft',
  'agriculture',
  'forestry',
  'pflanzenschutz',
  'gentechnik',
  'almwirtschaft',
  'agrarbehoerde',
  'bodenschutz',
  'schutzwald',
  'forstliche',
  'walderschliessung',
  // Infrastructure (not business funding)
  'verkehrsinfrastruktur',
  'traffic',
  'bahninfrastruktur',
  'eisenbahn',
  'bau-neubau',
  'bauordnung',
  'baurecht',
  'gestalten',
  'bauprojekt',
  'construction',
  'infrastructure',
  'building',
  'neubau',
  // Category/listing pages
  'brancheninformationen',
  'gastronomie-und-tourismus',
  'themen/',
  'programm/',
  'programme/',
  'foerderungen/',
  'ausschreibungen/',
  'calls/',
  // Success stories/showcases (not funding programs)
  'success-stories',
  'success-story',
  'geförderte-projekte',
  'gefoerderte-projekte',
  // Info/About/Discovery pages
  '/info/',
  'descubre-',
  'discover/',
  'discoveries/',
  'awards/',
  'impact-stories/',
  'portfolio/',
  'topics/',
  'organizacion',
  'transparencia',
  'valores',
  // Tirol-specific meta pages
  'business-angel-summit',
  'datahubtirol',
  'startuptirol',
  'zukunftsfit',
  // Login/Auth
  'login',
  'connexion',
  'espace-client',
  // Other
  'meta-extern',
  'meta/',
  'cases'
];

/**
 * Regex patterns for URL path matching (more precise than keywords)
 */
export const HARD_SKIP_URL_PATTERNS: RegExp[] = [
  // Email protection
  /cdn-cgi\/l\/email-protection/i,
  /email-protection#/i,
  
  // Common non-program pages
  /\/news\//i,
  /\/press\//i,
  /\/contact\//i,
  /\/about\//i,
  /\/team\//i,
  /\/imprint\//i,
  /\/sitemap\//i,
  /\/accessibility\//i,
  /\/data-protection\//i,
  /\/disclaimer\//i,
  
  // Career/Job pages
  /\/karriere\//i,
  /\/career\//i,
  /\/careers\//i,
  /\/job\//i,
  /\/jobs\//i,
  /\/stellen\//i,
  /\/stellenangebote\//i,
  /\/recruitment\//i,
  /\/bewerbung\//i,
  
  // Housing/Real Estate
  /\/wohnbau\/|\/wohnung\/|\/wohnungsbau\/|\/wohnbeihilfe\/|\/bauen-wohnen\/|\/raumplanung\//i,
  /\/housing\/|\/real-estate\/|\/immobilie\/|\/baufinanzierung\/|\/hypothek\/|\/mortgage\//i,
  
  // Agriculture/Forestry
  /\/landwirtschaft\/|\/forstwirtschaft\/|\/agriculture\/|\/forestry\//i,
  /\/pflanzenschutz\/|\/gentechnik\/|\/almwirtschaft\/|\/agrarbehoerde\/|\/bodenschutz\/|\/schutzwald\/|\/forstliche\/|\/walderschliessung\//i,
  
  // Infrastructure/Construction
  /\/verkehrsinfrastruktur\/|\/traffic\/|\/bahninfrastruktur\/|\/eisenbahn\/|\/bau-neubau\/|\/bauordnung\/|\/baurecht\/|\/bauprojekt\//i,
  /\/construction\/|\/infrastructure\/|\/building\/|\/neubau\//i,
  
  // Private consumer
  /\/privatkunden\/|\/private\/|\/consumer\/|\/endkunde\//i,
  
  // Institution-specific patterns
  /bpifrance\.fr\/(?:nous-decouvrir|nos-actualites|appels-offres|espace-(?:investisseurs|fournisseurs)|reglementaire|politique-de-divulgation-de-vulnerabilites|plan-general-du-site|mentions-legales|accessibilite)/i,
  /bpifrance\.fr\/(?:download|media-file)/i,
  /bpifrance\.fr\/.*\/newsletter/i,
  /bpifrance\.fr\/nos-solutions\/(?:conseil|accompagnement)(?:\/|#|$)/i,
  /bpifrance\.fr\/nos-solutions\/financement\/financement(?:\/|#|$)/i,
  /kfw\.de\/(?:über-die-kfw|karriere|kontakt|impressum|phishing|inlandsfoerderung\/phishing-warnung)/i,
  /sparkasse\.at\/.*(?:filialen|kundenservice|impressum|agb|datenschutz|apps|mobile-payments)/i,
  /bank[a-z]*\.at\/.*(?:impressum|kontakt|karriere|kundenservice)/i,
  /indiegogo\.com\/help/i,
  /kickstarter\.com\/help/i,
  /ec\.europa\.eu\/info\/research-and-innovation\/funding\/funding-opportunities\/(?:find|how|what)/i,
  /research-and-innovation\.ec\.europa\.eu\/funding\/funding-opportunities\/(?:find|how|what)/i,
  /research-and-innovation\.ec\.europa\.eu\/funding\/funding-opportunities\/practical-guide/i,
  /ec\.europa\.eu\/[^?#]*\/about/i,
  /ec\.europa\.eu\/[^?#]*\/contact/i,
  /ec\.europa\.eu\/[^?#]*\/news/i,
  /bpifrance\.fr\/nouvelles|bpifrance\.fr\/actus/i,
  /bpifrance\.fr\/nous-decouvrir\/rejoignez-nous/i,
  /bpifrance\.fr\/catalogue-offres\/les-conquerants/i,
  /research-and-innovation\.ec\.europa\.eu\/funding\/funding-opportunities\/search/i,
  /viennabusinessagency\.at\/(?:data-protection|privacy|imprint|press|downloads?|events?|beratung|ueber-uns|about-us|service|newsroom|magazine|newsletter|consulting)(?:\/|$)/i,
  /sfg\.at\/die-sfg(?:\/|$)/i,
  /sfg\.at\/(?:impressum|datenschutz|presse|kontakt|jobs|stellenangebote|weiterbildung|ausbilden-weiterbilden)(?:\/|$)/i,
  /aws\.at\/(?:ueber-uns|about|kontakt|impressum|datenschutz|karriere|jobs|stellenangebote|newsletter|veranstaltungen|service\/cases)(?:\/|$)/i,
  /wko\.at\/(?:veranstaltungen|veranstaltungskalender|karriere|jobs|stellenangebote|newsletter|datenschutz|impressum)(?:\/|$)/i,
  /wko\.at\/.*(?:lehrling|lehrlings|weiterbildung|coaching|alarmanlagen|sonderfoerder|sonderförder|netzwerk)/i,
  /wko\.at\/foerderungen\/.*beratung/i,
  /eurekanetwork\.org\/(?:about-us|news|events|newsletter|privacy-policy|impact-eureka|login)(?:\/|$)/i,
  /standort-tirol\.at\/meta(?:-extern)?(?:\/|$)/i,
  /standort-tirol\.at\/unternehmen\/.*(?:sonderfoerder|sonderförder|veranstaltung|netzwerk|cluster)/i,
  /ffg\.at\/beratung/i,
  /bankaustria\.at\//i,
  /raiffeisen(?:-leasing)?\.at\//i,
  /umweltfoerderung\.at\/betriebe\//i,
  /viennabusinessagency\.at\/(?:$|consulting|events?)(?:\/|$)/i,
  // Bpifrance non-program pages (many 0-requirement pages)
  /bpifrance\.fr\/(?:accessibilite|reglementaire|politique-de-divulgation|espace-investisseurs|appels-offres|nos-actualites|nous-decouvrir)(?:\/|$)/i,
  /bpifrance\.fr\/nos-solutions\/(?:conseil|conseil\/conseil)(?:\/|$)/i,
  /bpifrance\.fr\/nos-solutions\/financement\/financement-expertise(?:\/|$)/i,
  // EU research pages (overview pages, not specific programs)
  /research-and-innovation\.ec\.europa\.eu\/funding\/funding-opportunities\/(?:find|how|what|search)(?:\/|$)/i,
  /cordis\.europa\.eu\/programme\/id\/(?:HORIZON|HORIZON-EURATOM|HORIZON-EIE)(?:\/|$)/i, // These are overview pages
  // Contact/team pages
  /viennabusinessagency\.at\/team-contact\//i,
  /ffg\.at\/(?:comet\/)?kontakt/i,
  /ffg\.at\/en\/(?:accessibility|accessibility-statement)/i,
  // WKO pages with no requirements
  /wko\.at\/foerderungen\/(?:fachkraeftestipendium|energie|gruenden|normenankauf|planet-fund|tech4people)(?:\/|$)/i,
  // Generic patterns
  /\/(stellenangebote|jobs|jobboerse|karriere|career|weiterbildung|events?|veranstaltungen?|newsletter|data-protection|privacy-policy)(?:\/|$)/i,
];

/**
 * Content keywords to check in page text (for pre-LLM heuristics)
 */
export const SUSPICIOUS_CONTENT_KEYWORDS: RegExp[] = [
  /newsletter/i,
  /inscrivez-vous/i,
  /abonnez-vous/i,
  /subscription/i,
  /subscribe/i,
  /connexion/i,
  /login/i,
  /se connecter/i,
  /press release/i,
  /communiqué de presse/i,
  /podcast/i,
  /actualités/i,
  /news/i,
  /cookies/i,
  /privacy/i,
  /conditions générales/i,
  /careers/i,
  /jobs/i,
  /à propos/i,
  /our mission/i,
  /stellenangebote/i,
  /weiterbildung/i,
  /veranstaltungen?/i,
  /events?/i,
];

// Legacy export for backward compatibility
const HARDCODED_EXCLUSIONS = HARD_SKIP_URL_PATTERNS;

/**
 * Check if URL is excluded (blacklisted)
 * Checks database exclusions first, then hardcoded fallbacks
 */
export async function isUrlExcluded(url: string): Promise<boolean> {
  try {
    const urlObj = new URL(url);
    const host = urlObj.hostname.replace('www.', '');
    const path = urlObj.pathname;
    
    // Check database exclusions
    const pool = getPool();
    const excludePatterns = await pool.query(`
      SELECT pattern, confidence 
      FROM url_patterns
      WHERE host = $1 
        AND pattern_type = 'exclude'
        AND confidence > 0.7
      ORDER BY confidence DESC, usage_count DESC
    `, [host]);
    
    for (const row of excludePatterns.rows) {
      try {
        // Convert pattern to regex (replace :id with \d+)
        // Use anchor (^) to match from start of path for exact matching
        let regexPattern = row.pattern.replace(/:id/g, '\\d+');
        
        // If pattern doesn't start with ^, add it for exact matching
        if (!regexPattern.startsWith('^')) {
          regexPattern = '^' + regexPattern;
        }
        // If pattern doesn't end with $, add it (unless it has wildcards)
        if (!regexPattern.endsWith('$') && !regexPattern.includes('*') && !regexPattern.includes('+')) {
          regexPattern = regexPattern + '$';
        }
        
        const regex = new RegExp(regexPattern, 'i');
        if (regex.test(path)) {
          return true; // Excluded!
        }
      } catch {
        // Invalid regex pattern, skip
        continue;
      }
    }
    
    // Fallback to hardcoded patterns
    const urlLower = url.toLowerCase();
    for (const pattern of HARDCODED_EXCLUSIONS) {
      if (pattern.test(urlLower)) {
        return true;
      }
    }
    
    return false; // Not excluded
  } catch {
    // On error, use hardcoded fallback
    const urlLower = url.toLowerCase();
    return HARDCODED_EXCLUSIONS.some(pattern => pattern.test(urlLower));
  }
}

/**
 * Get all exclusion patterns for a host (for debugging)
 */
export async function getExclusionPatterns(host: string): Promise<Array<{ pattern: string; confidence: number; usage_count: number }>> {
  try {
    const pool = getPool();
    const result = await pool.query(`
      SELECT pattern, confidence, usage_count
      FROM url_patterns
      WHERE host = $1 AND pattern_type = 'exclude' AND confidence >= 0.7
      ORDER BY confidence DESC, usage_count DESC
    `, [host.replace('www.', '')]);
    
    return result.rows;
  } catch {
    return [];
  }
}

/**
 * Get all blacklist patterns (database + hardcoded)
 */
export async function getAllBlacklistPatterns(): Promise<Array<{
  source: 'database' | 'hardcoded';
  pattern: string;
  confidence?: number;
  usage_count?: number;
  reason?: string;
}>> {
  try {
    const pool = getPool();
    
    // Get database patterns
    const dbPatterns = await pool.query(`
      SELECT pattern, confidence, usage_count
      FROM url_patterns
      WHERE pattern_type = 'exclude'
      ORDER BY confidence DESC, usage_count DESC
    `);
    
    // Get hardcoded patterns
    const hardcodedPatterns = HARDCODED_EXCLUSIONS.map((pattern) => ({
      source: 'hardcoded' as const,
      pattern: pattern.toString(),
      reason: getHardcodedPatternReason(pattern)
    }));
    
    return [
      ...dbPatterns.rows.map((r: any) => ({
        source: 'database' as const,
        pattern: r.pattern,
        confidence: r.confidence,
        usage_count: r.usage_count
      })),
      ...hardcodedPatterns
    ];
  } catch {
    // Fallback: return hardcoded patterns only
    return HARDCODED_EXCLUSIONS.map((pattern) => ({
      source: 'hardcoded' as const,
      pattern: pattern.toString(),
      reason: getHardcodedPatternReason(pattern)
    }));
  }
}

/**
 * Get reason for hardcoded pattern (for display)
 */
function getHardcodedPatternReason(pattern: RegExp): string {
  const patternStr = pattern.toString();
  if (patternStr.includes('karriere') || patternStr.includes('career') || patternStr.includes('job')) {
    return 'Career/job pages';
  }
  if (patternStr.includes('contact') || patternStr.includes('kontakt')) {
    return 'Contact pages';
  }
  if (patternStr.includes('about') || patternStr.includes('ueber')) {
    return 'About pages';
  }
  if (patternStr.includes('imprint') || patternStr.includes('privacy')) {
    return 'Legal pages';
  }
  if (patternStr.includes('news') || patternStr.includes('press')) {
    return 'News/media pages';
  }
  if (patternStr.includes('email-protection')) {
    return 'Email protection URLs';
  }
  return 'Common exclusion pattern';
}

/**
 * Update pattern confidence
 */
export async function updatePatternConfidence(
  pattern: string,
  newConfidence: number
): Promise<void> {
  try {
    const pool = getPool();
    await pool.query(`
      UPDATE url_patterns
      SET confidence = $1, updated_at = NOW()
      WHERE pattern = $2 AND pattern_type = 'exclude'
    `, [newConfidence, pattern]);
  } catch (error: any) {
    throw new Error(`Failed to update pattern confidence: ${error.message}`);
  }
}

/**
 * Add manual exclusion pattern
 * For 404s and confirmed low-quality pages, use high confidence (0.9)
 * For other cases, use medium confidence (0.7) that increases with confirmations
 */
export async function addManualExclusion(
  pattern: string,
  host: string,
  reason?: string
): Promise<void> {
  try {
    const pool = getPool();
    // High confidence for 404s and confirmed issues, medium for others
    const confidence = reason?.includes('404') || reason?.includes('HTTP') ? 0.9 : 0.7;
    
    await pool.query(`
      INSERT INTO url_patterns (pattern, pattern_type, host, confidence, learned_from_url, usage_count)
      VALUES ($1, 'exclude', $2, $3, $4, 1)
      ON CONFLICT (pattern, host, pattern_type) DO UPDATE SET
        confidence = GREATEST(url_patterns.confidence, $3),
        usage_count = url_patterns.usage_count + 1,
        updated_at = NOW()
    `, [pattern, host.replace('www.', ''), confidence, reason || 'manual']);
  } catch (error: any) {
    throw new Error(`Failed to add manual exclusion: ${error.message}`);
  }
}

/**
 * Remove exclusion pattern
 */
export async function removeExclusionPattern(
  pattern: string,
  host: string
): Promise<void> {
  try {
    const pool = getPool();
    await pool.query(`
      DELETE FROM url_patterns
      WHERE pattern = $1 AND host = $2 AND pattern_type = 'exclude'
    `, [pattern, host.replace('www.', '')]);
  } catch (error: any) {
    throw new Error(`Failed to remove exclusion pattern: ${error.message}`);
  }
}

