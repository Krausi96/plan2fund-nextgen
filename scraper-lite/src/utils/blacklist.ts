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
  
  // Career/Job pages (not funding programs)
  /\/karriere\//i,
  /\/career\//i,
  /\/careers\//i,
  /\/job\//i,
  /\/jobs\//i,
  /\/stellen\//i,
  /\/stellenangebote\//i,
  /\/recruitment\//i,
  /\/bewerbung\//i,
  /karriere|career|job|stellen|recruitment|bewerbung/i, // Also match in path/domain
  
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
    const hardcodedPatterns = HARDCODED_EXCLUSIONS.map((pattern, index) => ({
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
    return HARDCODED_EXCLUSIONS.map((pattern, index) => ({
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
 */
export async function addManualExclusion(
  pattern: string,
  host: string,
  reason?: string
): Promise<void> {
  try {
    const pool = getPool();
    await pool.query(`
      INSERT INTO url_patterns (pattern, pattern_type, host, confidence, learned_from_url, usage_count)
      VALUES ($1, 'exclude', $2, 0.9, 'manual', 1)
      ON CONFLICT (pattern, host, pattern_type) DO UPDATE SET
        confidence = 0.9,
        updated_at = NOW()
    `, [pattern, host.replace('www.', '')]);
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

