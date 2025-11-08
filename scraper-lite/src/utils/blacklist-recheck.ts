/**
 * Blacklist Re-Check System
 * Periodically re-checks low-confidence exclusions to prevent false positives
 */

import { getPool } from '../../db/db';
import { fetchHtml } from '../utils';
import { isOverviewPage, requiresLogin } from '../utils';
import { extractWithLLM } from '../core/llm-extract';

interface RecheckResult {
  url: string;
  shouldExclude: boolean;
  reason: string;
  confidence: number;
}

/**
 * Re-check a single excluded URL to see if it should still be excluded
 */
export async function recheckExcludedUrl(url: string): Promise<RecheckResult> {
  try {
    // Fetch the page
    const result = await fetchHtml(url);
    
    // Check for 404
    if (result.status === 404) {
      return {
        url,
        shouldExclude: true,
        reason: 'HTTP 404',
        confidence: 0.9
      };
    }
    
    // Check for login requirement
    if (requiresLogin(url, result.html)) {
      return {
        url,
        shouldExclude: true,
        reason: 'Requires login',
        confidence: 0.9
      };
    }
    
    // Check if it's an overview page (might be valid)
    if (isOverviewPage(url, result.html)) {
      return {
        url,
        shouldExclude: false,
        reason: 'Overview page - valid for discovery',
        confidence: 0.8
      };
    }
    
    // Try to extract with LLM to see if it has requirements
    try {
      const llmResult = await extractWithLLM({
        html: result.html,
        url,
        title: '',
        description: ''
      });
      
      const reqCount = Object.values(llmResult.categorized_requirements || {}).reduce(
        (sum: number, arr: any[]) => sum + (Array.isArray(arr) ? arr.length : 0), 0
      ) as number;
      
      if (reqCount >= 5) {
        // Has requirements - should NOT be excluded
        return {
          url,
          shouldExclude: false,
          reason: `Has ${reqCount} requirements - valid program page`,
          confidence: 0.9
        };
      } else if (reqCount > 0) {
        // Has some requirements but few - might be valid
        return {
          url,
          shouldExclude: false,
          reason: `Has ${reqCount} requirements - might be valid`,
          confidence: 0.6
        };
      } else {
        // No requirements - should be excluded
        return {
          url,
          shouldExclude: true,
          reason: 'No requirements extracted',
          confidence: 0.8
        };
      }
    } catch (llmError) {
      // LLM extraction failed - can't determine, keep excluded
      return {
        url,
        shouldExclude: true,
        reason: 'LLM extraction failed',
        confidence: 0.5
      };
    }
  } catch (error: any) {
    // Fetch failed - keep excluded
    return {
      url,
      shouldExclude: true,
      reason: `Fetch failed: ${error.message}`,
      confidence: 0.7
    };
  }
}

/**
 * Re-check low-confidence exclusions (confidence < 0.8)
 * Returns URLs that should be removed from blacklist
 */
export async function recheckLowConfidenceExclusions(
  host?: string,
  maxRechecks: number = 10
): Promise<Array<{ url: string; pattern: string; reason: string }>> {
  const pool = getPool();
  
  // Get low-confidence exclusions
  const query = host
    ? `SELECT DISTINCT learned_from_url, pattern, confidence
       FROM url_patterns
       WHERE host = $1
         AND pattern_type = 'exclude'
         AND confidence < 0.8
         AND confidence > 0.5
       ORDER BY confidence ASC, usage_count ASC
       LIMIT $2`
    : `SELECT DISTINCT learned_from_url, pattern, confidence, host
       FROM url_patterns
       WHERE pattern_type = 'exclude'
         AND confidence < 0.8
         AND confidence > 0.5
       ORDER BY confidence ASC, usage_count ASC
       LIMIT $2`;
  
  const params = host ? [host, maxRechecks] : [maxRechecks];
  const result = await pool.query(query, params);
  
  const toRemove: Array<{ url: string; pattern: string; reason: string }> = [];
  
  console.log(`🔄 Re-checking ${result.rows.length} low-confidence exclusions...\n`);
  
  for (const row of result.rows) {
    const url = row.learned_from_url;
    const pattern = row.pattern;
    const confidence = row.confidence;
    
    console.log(`   Checking: ${url.substring(0, 60)}... (confidence: ${confidence.toFixed(2)})`);
    
    const recheckResult = await recheckExcludedUrl(url);
    
    if (!recheckResult.shouldExclude) {
      console.log(`   ✅ Should NOT be excluded: ${recheckResult.reason}`);
      toRemove.push({
        url,
        pattern,
        reason: recheckResult.reason
      });
    } else {
      console.log(`   ❌ Still excluded: ${recheckResult.reason}`);
      // Update confidence if higher
      if (recheckResult.confidence > confidence) {
        await pool.query(
          `UPDATE url_patterns
           SET confidence = $1
           WHERE pattern = $2 AND pattern_type = 'exclude'`,
          [recheckResult.confidence, pattern]
        );
      }
    }
  }
  
  return toRemove;
}

/**
 * Remove exclusions that should no longer be excluded
 */
export async function removeExclusions(
  exclusions: Array<{ url: string; pattern: string; reason: string }>
): Promise<number> {
  if (exclusions.length === 0) return 0;
  
  const pool = getPool();
  let removed = 0;
  
  for (const exclusion of exclusions) {
    try {
      // Remove the exclusion pattern
      const result = await pool.query(
        `DELETE FROM url_patterns
         WHERE pattern = $1 AND pattern_type = 'exclude'`,
        [exclusion.pattern]
      );
      
      if (result.rowCount && result.rowCount > 0) {
        removed += result.rowCount;
        console.log(`   ✅ Removed exclusion: ${exclusion.pattern} (${exclusion.reason})`);
      }
    } catch (error: any) {
      console.error(`   ❌ Failed to remove exclusion ${exclusion.pattern}: ${error.message}`);
    }
  }
  
  return removed;
}

/**
 * Full re-check cycle: check low-confidence exclusions and remove false positives
 */
export async function runRecheckCycle(
  host?: string,
  maxRechecks: number = 10,
  autoRemove: boolean = false
): Promise<{ checked: number; removed: number }> {
  console.log('🔄 Starting blacklist re-check cycle...\n');
  
  const toRemove = await recheckLowConfidenceExclusions(host, maxRechecks);
  
  let removed = 0;
  if (autoRemove && toRemove.length > 0) {
    removed = await removeExclusions(toRemove);
  } else if (toRemove.length > 0) {
    console.log(`\n⚠️  Found ${toRemove.length} exclusions to remove (use --auto-remove to apply)`);
    toRemove.forEach(e => {
      console.log(`   - ${e.pattern}: ${e.reason}`);
    });
  }
  
  console.log(`\n✅ Re-check complete: ${toRemove.length} checked, ${removed} removed\n`);
  
  return {
    checked: toRemove.length,
    removed
  };
}

