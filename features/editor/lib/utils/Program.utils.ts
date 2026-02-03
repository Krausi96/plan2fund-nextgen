/**
 * UNIFIED EDITOR UTILITIES
 * 
 * Consolidated utility file combining program and section utilities.
 * All functions have been moved to their respective specialized modules.
 * 
 * @deprecated Import functions from the specific utility modules instead:
 * - Document setup functions: './step2-document-setup/processProgramData'
 * - Blueprint instantiation functions: './step3-blueprint-instantiation/instantiateFromBlueprint'
 * - Document normalization functions: './document-normalization/normalizeDocumentStructure'
 * - Section detection functions: './sectionDetection/*'
 */

// Re-export document setup functions from their new location
export {
  normalizeProgramInput,
  normalizeFundingProgram,
  normalizeProgramSetup,
  generateDocumentStructureFromProfile,
} from './step2-document-setup/processProgramData';

// Re-export blueprint instantiation functions from their new location
export {
  inferProductTypeFromBlueprint,
  instantiateFromBlueprint,
} from './step3-blueprint-instantiation/instantiateFromBlueprint';

// Re-export document normalization functions from their new location
export { normalizeDocumentStructure, mergeUploadedContentWithSpecialSections } from './document-normalization/normalizeDocumentStructure';

// Re-export section detection functions from their new location
export { 
  sortSectionsByCanonicalOrder, 
  getCompleteSectionList, 
  getSectionIcon, 
  isSpecialSection 
} from './sectionDetection/sectionUtilities';
export { enhanceWithSpecialSections } from './sectionDetection/enhanceWithSpecialSections';
export { detectSpecialSections } from './sectionDetection/detectSpecialSections';
export { applyDetectionResults } from './sectionDetection/applyDetectionResults';

// Re-export types
export type { TranslationFunction } from './sectionDetection/types';