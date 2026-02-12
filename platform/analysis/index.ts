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

// Funding Overlay (unified pipeline)
export {
  enrichAllSectionRequirementsAtOnce,
  createFallbackRequirements,
  overlayFundingRequirements,
  hasFundingOverlay,
  getFundingOverlayInfo
} from './program-flow/generator';
