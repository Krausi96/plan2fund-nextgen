/**
 * Automatic Learning and Feedback System for Extraction Patterns
 * 
 * This module tracks which extraction patterns work best and automatically
 * adjusts pattern priority based on success rates.
 */

import { recordPatternUsage, getHighConfidencePatterns } from './db/pattern-repository';

export interface PatternMatch {
  pattern: string;
  patternType: 'timeline' | 'financial' | 'contact' | 'trl' | 'market_size' | 'documents' | 'eligibility' | 'other';
  matched: boolean;
  host?: string;
}

/**
 * Track pattern usage and learn from results
 */
export async function learnFromExtraction(
  patternType: PatternMatch['patternType'],
  patternText: string,
  success: boolean,
  host?: string
): Promise<void> {
  try {
    await recordPatternUsage(patternType, patternText, success, host);
  } catch (error: any) {
    // Silently fail - don't break extraction
    console.warn(`Learning failed: ${error.message}`);
  }
}

/**
 * Get learned patterns for a specific type
 * Returns patterns sorted by confidence (best first)
 */
export async function getLearnedPatterns(
  patternType: PatternMatch['patternType'],
  host?: string
): Promise<Array<{ pattern: string; confidence: number }>> {
  try {
    const patterns = await getHighConfidencePatterns(patternType, host, 0.4);
    return patterns.map(p => ({
      pattern: p.pattern_text,
      confidence: p.confidence
    }));
  } catch (error: any) {
    return [];
  }
}

/**
 * Enhance timeline extraction with learned patterns
 */
export async function enhanceTimelineExtraction(
  text: string,
  host?: string
): Promise<string[]> {
  try {
    const learned = await getLearnedPatterns('timeline', host);
    const matches: string[] = [];
    
    for (const learnedPattern of learned) {
      try {
        const regex = new RegExp(learnedPattern.pattern, 'gi');
        const match = text.match(regex);
        if (match) {
          matches.push(...match);
          // Record successful pattern usage
          await learnFromExtraction('timeline', learnedPattern.pattern, true, host);
        }
      } catch {
        // Invalid regex, skip
      }
    }
    
    return matches;
  } catch {
    return [];
  }
}

/**
 * Track extraction outcome for a page
 */
export async function trackExtractionOutcome(
  pageId: number,
  url: string,
  extracted: {
    deadline?: boolean;
    funding_amount?: boolean;
    contact_email?: boolean;
    contact_phone?: boolean;
    timeline?: boolean;
    financial?: boolean;
    trl_level?: boolean;
    market_size?: boolean;
  }
): Promise<void> {
  try {
    const { recordExtractionSuccess } = await import('./db/pattern-repository');
    
    const extractedFields: string[] = [];
    const missingFields: string[] = [];
    
    if (extracted.deadline !== undefined) {
      if (extracted.deadline) extractedFields.push('deadline');
      else missingFields.push('deadline');
    }
    if (extracted.funding_amount !== undefined) {
      if (extracted.funding_amount) extractedFields.push('funding_amount');
      else missingFields.push('funding_amount');
    }
    if (extracted.contact_email !== undefined) {
      if (extracted.contact_email) extractedFields.push('contact_email');
      else missingFields.push('contact_email');
    }
    if (extracted.contact_phone !== undefined) {
      if (extracted.contact_phone) extractedFields.push('contact_phone');
      else missingFields.push('contact_phone');
    }
    if (extracted.timeline !== undefined) {
      if (extracted.timeline) extractedFields.push('timeline');
      else missingFields.push('timeline');
    }
    if (extracted.financial !== undefined) {
      if (extracted.financial) extractedFields.push('financial');
      else missingFields.push('financial');
    }
    if (extracted.trl_level !== undefined) {
      if (extracted.trl_level) extractedFields.push('trl_level');
      else missingFields.push('trl_level');
    }
    if (extracted.market_size !== undefined) {
      if (extracted.market_size) extractedFields.push('market_size');
      else missingFields.push('market_size');
    }
    
    await recordExtractionSuccess(pageId, url, extractedFields, missingFields);
  } catch (error: any) {
    // Silently fail
    console.warn(`Failed to track extraction outcome: ${error.message}`);
  }
}

