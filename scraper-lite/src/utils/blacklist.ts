/**
 * Blacklist/Exclusion Utilities
 * Checks database-backed exclusions and hardcoded fallbacks
 */

import { getPool } from '../../db/db';

// Hardcoded exclusion patterns (fallback for common exclusions)
const HARDCODED_EXCLUSIONS = [
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
  
  // Housing/Real Estate
  /wohnbau|wohnung|wohnbauförderung|wohnungsbau|wohnbeihilfe|bauen-wohnen|raumplanung/i,
  /housing|real.estate|immobilie|baufinanzierung|hypothek|mortgage/i,
  
  // Agriculture/Forestry
  /landwirtschaft|forstwirtschaft|agriculture|forestry/i,
  /pflanzenschutz|gentechnik|almwirtschaft|agrarbehoerde|bodenschutz|schutzwald|forstliche|walderschliessung/i,
  
  // Infrastructure/Construction
  /verkehrsinfrastruktur|traffic|bahninfrastruktur|eisenbahn|bau-neubau|bauordnung|baurecht|bauprojekt/i,
  /construction|infrastructure|building|neubau/i,
  
  // Private consumer
  /privatkunden|private|consumer|endkunde/i,
];

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
      WHERE host = $1 AND pattern_type = 'exclude'
      ORDER BY confidence DESC, usage_count DESC
    `, [host.replace('www.', '')]);
    
    return result.rows;
  } catch {
    return [];
  }
}

