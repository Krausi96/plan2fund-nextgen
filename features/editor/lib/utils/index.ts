// Export functions from the new organized structure

// Export document setup utilities
export {
  normalizeProgramInput,
} from './program-flows/input-handling/urlParser';
export {
  normalizeFundingProgram,
  normalizeProgramSetup,
} from './program-flows/data-processing/programNormalizer';
export {
  generateProgramBlueprint,
  migrateLegacySetup,
  generateDocumentStructureFromProfile,
} from './program-flows/structure-generation/structureGenerator';

// Additional utilities from other modules
export { inferProductTypeFromBlueprint, instantiateFromBlueprint } from './blueprint-flows/document-instantiation/instantiateFromBlueprint';
export { normalizeDocumentStructure } from './document-flows/normalization/normalizeDocumentStructure';
export { sortSectionsByCanonicalOrder, getCompleteSectionList, getSectionIcon, isSpecialSection } from './section-flows/utilities/sectionUtilities';
export { detectSpecialSections } from './section-flows/detection/detectSpecialSections';
export { enhanceWithSpecialSections } from './section-flows/enhancement/enhanceWithSpecialSections';
export { applyDetectionResults } from './section-flows/application/applyDetectionResults';

// Export types

export type {
  ProgramSummary,
  ProductType,
  PlanSection,
  PlanDocument,
  FundingProgram,
  DocumentStructure,
  SetupDiagnostics,
} from './types';