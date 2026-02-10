/**
 * Analysis Layer - Consolidated from features/reco/lib/
 * 
 * Unified analysis utilities for:
 * - Program discovery and analysis (from ProgramFinder flow)
 * - Document analysis (from document upload flow)
 * - Cross-flow convergence to DocumentStructure
 */

// Program Analysis
export {
  analyzeUserProfileForPrograms,
  matchProgramsToProfile,
  calculateProgramMatchScore,
  sortProgramsByRelevance
} from './lib/programAnalyzer';

// Program Persistence (consolidated from features/reco/lib/programPersistence.ts)
export {
  saveSelectedProgram,
  loadSelectedProgram,
  clearSelectedProgram,
  validateAndSanitize
} from './lib/programPersistence';

// Analysis Configuration
export {
  MIN_ANSWERED_QUESTIONS,
  MAX_VISIBLE_RESULTS,
  DEFAULT_MAX_RESULTS,
  CONFIDENCE_THRESHOLD,
  MAX_BATCH_ANALYSIS
} from './lib/config';

// Document Analysis
export {
  analyzeUploadedDocument,
  analyzeDocumentQuality,
  extractDocumentInsights
} from './lib/documentAnalyzer';

// Unified Analysis Types
export type {
  ProgramAnalysisResult,
  DocumentAnalysisResult,
  AnalysisContext,
  MatchScore,
  PersistedProgram,
  SectionInfo
} from './types';