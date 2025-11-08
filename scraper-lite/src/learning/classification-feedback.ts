/**
 * Classification Feedback Loop
 * Tracks if URL classifications were correct and learns from mistakes
 */

import { getPool } from '../../db/db';

export interface ClassificationFeedback {
  url: string;
  predictedIsProgram: 'yes' | 'no' | 'maybe';
  predictedQuality: number;
  actualIsProgram: boolean; // True if page was successfully scraped with 5+ requirements
  actualQuality: number; // Number of requirements extracted
  wasCorrect: boolean;
}

/**
 * Record feedback after scraping a page
 */
export async function recordClassificationFeedback(
  url: string,
  predictedIsProgram: 'yes' | 'no' | 'maybe',
  predictedQuality: number,
  actualRequirementCount: number
): Promise<void> {
  try {
    const pool = getPool();
    const actualIsProgram = actualRequirementCount >= 5; // Good page if 5+ requirements
    const wasCorrect = 
      (predictedIsProgram === 'yes' && actualIsProgram) ||
      (predictedIsProgram === 'no' && !actualIsProgram) ||
      (predictedIsProgram === 'maybe' && actualIsProgram); // "maybe" is correct if it's a program
    
    await pool.query(`
      INSERT INTO classification_feedback (
        url, predicted_is_program, predicted_quality,
        actual_is_program, actual_quality, was_correct, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      ON CONFLICT (url) DO UPDATE SET
        actual_is_program = EXCLUDED.actual_is_program,
        actual_quality = EXCLUDED.actual_quality,
        was_correct = EXCLUDED.was_correct,
        updated_at = NOW()
    `, [url, predictedIsProgram, predictedQuality, actualIsProgram, actualRequirementCount, wasCorrect]);
  } catch (error: any) {
    // Silently fail - feedback is optional
    console.warn(`Failed to record feedback for ${url}: ${error.message}`);
  }
}

/**
 * Get classification accuracy statistics
 */
export async function getClassificationAccuracy(): Promise<{
  total: number;
  correct: number;
  accuracy: number;
  falsePositives: number; // Classified as program but wasn't
  falseNegatives: number; // Classified as not program but was
}> {
  try {
    const pool = getPool();
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE was_correct = true) as correct,
        COUNT(*) FILTER (WHERE predicted_is_program IN ('yes', 'maybe') AND actual_is_program = false) as false_positives,
        COUNT(*) FILTER (WHERE predicted_is_program = 'no' AND actual_is_program = true) as false_negatives
      FROM classification_feedback
    `);
    
    const row = result.rows[0];
    const total = parseInt(row.total) || 0;
    const correct = parseInt(row.correct) || 0;
    const accuracy = total > 0 ? (correct / total) * 100 : 0;
    
    return {
      total,
      correct,
      accuracy,
      falsePositives: parseInt(row.false_positives) || 0,
      falseNegatives: parseInt(row.false_negatives) || 0
    };
  } catch {
    return { total: 0, correct: 0, accuracy: 0, falsePositives: 0, falseNegatives: 0 };
  }
}

/**
 * Get common mistakes to improve prompts
 */
export async function getCommonMistakes(): Promise<Array<{
  url: string;
  predicted: string;
  actual: boolean;
  reason: string;
}>> {
  try {
    const pool = getPool();
    const result = await pool.query(`
      SELECT url, predicted_is_program, actual_is_program
      FROM classification_feedback
      WHERE was_correct = false
      ORDER BY created_at DESC
      LIMIT 20
    `);
    
    return result.rows.map((r: any) => ({
      url: r.url,
      predicted: r.predicted_is_program,
      actual: r.actual_is_program,
      reason: r.actual_is_program 
        ? 'False negative: Was a program but classified as no/maybe'
        : 'False positive: Not a program but classified as yes/maybe'
    }));
  } catch {
    return [];
  }
}

