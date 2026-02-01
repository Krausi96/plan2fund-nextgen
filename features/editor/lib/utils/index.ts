// Export functions from the new organized structure

// Export unified editor utilities
export {
  normalizeProgramInput,
  normalizeFundingProgram,
  normalizeProgramSetup,
  generateProgramBlueprint,
  generateDocumentStructureFromProfile,
  parseProgramFromUrl,
  migrateLegacySetup,
  inferProductTypeFromBlueprint,
  instantiateFromBlueprint,
  normalizeDocumentStructure,
  sortSectionsByCanonicalOrder,
  getCompleteSectionList,
  getSectionIcon,
  isSpecialSection,
  enhanceWithSpecialSections,
  detectSpecialSections,
  applyDetectionResults,
} from './Program.utils';

// Export types
export type { TranslationFunction } from './Program.utils';
export type {
  ProgramSummary,
  ProductType,
  PlanSection,
  PlanDocument,
  FundingProgram,
  DocumentStructure,
  SetupDiagnostics,
} from './types';