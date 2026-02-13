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

// Funding Overlay (unified pipeline)
export {
  enrichAllSectionRequirementsAtOnce,
  createFallbackRequirements,
  overlayFundingRequirements,
  hasFundingOverlay,
  getFundingOverlayInfo
} from './program-flow/generator';
