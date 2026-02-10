/**
 * Analysis Layer - Public API
 */

// Program Persistence
export {
  saveSelectedProgram,
  loadSelectedProgram,
  clearSelectedProgram,
  validateAndSanitize
} from './internal/programPersistence';

// Document Analysis
export { analyzeDocument } from './documentAnalyzer';

// Program Analysis
export { analyzeProgram } from './programAnalyzer';

// Business Quality Analysis
export { analyzeBusinessQuality } from './businessAnalyzer';

// Analysis Configuration
export {
  MIN_ANSWERED_QUESTIONS,
  MAX_VISIBLE_RESULTS,
  DEFAULT_MAX_RESULTS,
  CONFIDENCE_THRESHOLD,
  MAX_BATCH_ANALYSIS
} from './config';

// Unified Analysis Types
export type {
  ProgramAnalysisResult,
  DocumentAnalysisResult,
  AnalysisContext,
  MatchScore,
  SectionInfo
} from './types';
