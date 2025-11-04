/**
 * Pattern Learning and Feedback System
 * 
 * Tracks extraction pattern success rates and automatically adjusts
 * pattern priority based on what works.
 */

import { getPool } from './neon-client';

export interface ExtractionPattern {
  id?: number;
  pattern_type: 'timeline' | 'financial' | 'contact' | 'trl' | 'market_size' | 'documents' | 'eligibility' | 'other';
  pattern_text: string;
  pattern_regex?: string;
  host?: string; // Optional: pattern specific to a host
  confidence: number; // 0.0 to 1.0
  usage_count: number;
  success_count: number;
  failure_count: number;
  success_rate: number; // Calculated: success_count / usage_count
  last_used_at?: Date;
  created_at?: Date;
  updated_at?: Date;
}

/**
 * Record pattern usage and outcome
 */
export async function recordPatternUsage(
  patternType: ExtractionPattern['pattern_type'],
  patternText: string,
  success: boolean,
  host?: string
): Promise<void> {
  const pool = getPool();
  
  try {
    // Find or create pattern
    const existing = await pool.query(
      `SELECT id, usage_count, success_count, failure_count, confidence 
       FROM extraction_patterns 
       WHERE pattern_type = $1 AND pattern_text = $2 
       AND (host IS NULL AND $3::text IS NULL OR host = $3)`,
      [patternType, patternText, host || null]
    );
    
    if (existing.rows.length > 0) {
      const pattern = existing.rows[0];
      const newUsageCount = pattern.usage_count + 1;
      const newSuccessCount = success ? pattern.success_count + 1 : pattern.success_count;
      const newFailureCount = !success ? pattern.failure_count + 1 : pattern.failure_count;
      const newSuccessRate = newUsageCount > 0 ? (newSuccessCount / newUsageCount) * 100 : 0;
      
      // Adjust confidence based on success rate
      // High success rate (>80%) = high confidence
      // Medium (50-80%) = medium confidence
      // Low (<50%) = low confidence
      let newConfidence = pattern.confidence;
      if (newUsageCount >= 5) { // Only adjust after sufficient samples
        if (newSuccessRate >= 80) {
          newConfidence = Math.min(1.0, newConfidence + 0.05);
        } else if (newSuccessRate >= 50) {
          newConfidence = Math.max(0.3, Math.min(0.8, newConfidence));
        } else {
          newConfidence = Math.max(0.1, newConfidence - 0.05);
        }
      }
      
      await pool.query(
        `UPDATE extraction_patterns 
         SET usage_count = $1, 
             success_count = $2, 
             failure_count = $3,
             success_rate = $4,
             confidence = $5,
             last_used_at = NOW(),
             updated_at = NOW()
         WHERE id = $6`,
        [newUsageCount, newSuccessCount, newFailureCount, newSuccessRate, newConfidence, pattern.id]
      );
    } else {
      // Create new pattern
      const initialConfidence = 0.5; // Start with medium confidence
      await pool.query(
        `INSERT INTO extraction_patterns 
         (pattern_type, pattern_text, host, confidence, usage_count, success_count, failure_count, success_rate, created_at, updated_at)
         VALUES ($1, $2, $3, $4, 1, $5, $6, $7, NOW(), NOW())`,
        [
          patternType,
          patternText,
          host || null,
          initialConfidence,
          success ? 1 : 0,
          success ? 0 : 1,
          success ? 100 : 0
        ]
      );
    }
  } catch (error: any) {
    // Silently fail - don't break scraping if learning fails
    console.warn(`Failed to record pattern usage: ${error.message}`);
  }
}

/**
 * Get high-confidence patterns for a given type
 */
export async function getHighConfidencePatterns(
  patternType: ExtractionPattern['pattern_type'],
  host?: string,
  minConfidence: number = 0.6
): Promise<ExtractionPattern[]> {
  const pool = getPool();
  
  try {
    const result = await pool.query(
      `SELECT * FROM extraction_patterns 
       WHERE pattern_type = $1 
       AND confidence >= $2
       AND (host IS NULL AND $3::text IS NULL OR host = $3)
       ORDER BY confidence DESC, success_rate DESC
       LIMIT 20`,
      [patternType, minConfidence, host || null]
    );
    
    return result.rows.map(row => ({
      id: row.id,
      pattern_type: row.pattern_type,
      pattern_text: row.pattern_text,
      pattern_regex: row.pattern_regex,
      host: row.host,
      confidence: parseFloat(row.confidence),
      usage_count: parseInt(row.usage_count),
      success_count: parseInt(row.success_count),
      failure_count: parseInt(row.failure_count),
      success_rate: parseFloat(row.success_rate),
      last_used_at: row.last_used_at,
      created_at: row.created_at,
      updated_at: row.updated_at
    }));
  } catch (error: any) {
    console.warn(`Failed to get patterns: ${error.message}`);
    return [];
  }
}

/**
 * Track extraction success for a page
 */
export async function recordExtractionSuccess(
  pageId: number,
  url: string,
  extractedFields: string[],
  missingFields: string[]
): Promise<void> {
  const pool = getPool();
  
  try {
    const host = new URL(url).hostname.replace('www.', '');
    
    // Record which fields were successfully extracted
    for (const field of extractedFields) {
      await pool.query(
        `INSERT INTO extraction_metrics (page_id, host, field_name, extracted, created_at)
         VALUES ($1, $2, $3, true, NOW())
         ON CONFLICT DO NOTHING`,
        [pageId, host, field]
      );
    }
    
    // Record which fields were missing
    for (const field of missingFields) {
      await pool.query(
        `INSERT INTO extraction_metrics (page_id, host, field_name, extracted, created_at)
         VALUES ($1, $2, $3, false, NOW())
         ON CONFLICT DO NOTHING`,
        [pageId, host, field]
      );
    }
  } catch (error: any) {
    // Silently fail
    console.warn(`Failed to record extraction success: ${error.message}`);
  }
}

/**
 * Get extraction success rates by host
 */
export async function getExtractionSuccessRates(host?: string): Promise<Record<string, number>> {
  const pool = getPool();
  
  try {
    const query = host
      ? `SELECT field_name, 
                COUNT(*) FILTER (WHERE extracted = true) as success_count,
                COUNT(*) as total_count
         FROM extraction_metrics
         WHERE host = $1
         GROUP BY field_name`
      : `SELECT field_name, 
                COUNT(*) FILTER (WHERE extracted = true) as success_count,
                COUNT(*) as total_count
         FROM extraction_metrics
         GROUP BY field_name`;
    
    const result = await pool.query(query, host ? [host] : []);
    
    const rates: Record<string, number> = {};
    result.rows.forEach(row => {
      const total = parseInt(row.total_count);
      const success = parseInt(row.success_count);
      rates[row.field_name] = total > 0 ? (success / total) * 100 : 0;
    });
    
    return rates;
  } catch (error: any) {
    console.warn(`Failed to get extraction rates: ${error.message}`);
    return {};
  }
}

