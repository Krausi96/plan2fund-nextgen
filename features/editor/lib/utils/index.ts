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
  generateDocumentStructureFromProfile,
} from './program-flows/structure-generation/structureGenerator';

// Export conversion functions
export { generateProgramBlueprint } from './program-flows/conversion/programConverter';

// Export legacy conversion functions
export { migrateLegacySetup } from './legacy-conversion/legacyMigrator';

// Additional utilities from other modules
export { inferProductTypeFromBlueprint, instantiateFromBlueprint } from './blueprint-flows/document-instantiation/instantiateFromBlueprint';
export { normalizeDocumentStructure } from './document-flows/normalization/normalizeDocumentStructure';
export { processDocumentSecurely, splitDocumentIntoParts } from './document-flows/processing/documentProcessor';
export { validateDocumentContent } from './document-flows/security/contentSecurityValidator';
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