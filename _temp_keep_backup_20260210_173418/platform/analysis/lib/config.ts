/**
 * Analysis Configuration
 * Consolidated from features/reco/lib/config.ts
 */

/**
 * Minimum number of answered questions required before program generation
 */
export const MIN_ANSWERED_QUESTIONS = 5;

/**
 * Maximum number of programs to show initially in results
 */
export const MAX_VISIBLE_RESULTS = 10;

/**
 * Default number of programs to request from LLM
 */
export const DEFAULT_MAX_RESULTS = 5;

/**
 * Confidence threshold for program matches (0-100)
 */
export const CONFIDENCE_THRESHOLD = 70;

/**
 * Maximum number of programs to analyze in a single batch
 */
export const MAX_BATCH_ANALYSIS = 20;
