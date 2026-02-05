// Export functions from the new organized structure

// Export document setup utilities
export {
  normalizeProgramInput,
} from './2-program-flows/program-flows/input-handling/urlParser';
export {
  normalizeFundingProgram,
  normalizeProgramSetup,
} from './2-program-flows/program-flows/data-processing/programNormalizer';
export {
  generateDocumentStructureFromProfile,
} from './2-program-flows/program-flows/structure-generation/structureGenerator';

// Export conversion functions
export { generateProgramBlueprint } from './2-program-flows/program-flows/conversion/programConverter';

// Export legacy conversion functions
export { migrateLegacySetup } from './3-legacy-conversion/legacy-conversion/legacyMigrator';

// Additional utilities from other modules
export { inferProductTypeFromBlueprint, instantiateFromBlueprint } from './4-blueprint-flows/blueprint-flows/document-instantiation/instantiateFromBlueprint';
export { normalizeDocumentStructure } from './1-document-flows/document-flows/normalization/normalizeDocumentStructure';
export { processDocumentSecurely, splitDocumentIntoParts } from './1-document-flows/document-flows/processing/documentProcessor';
export { validateDocumentContent, detectMultipleSectionsWithoutTitles } from './1-document-flows/document-flows/processing/security/contentSecurityValidator';
export { sortSectionsByCanonicalOrder, getCompleteSectionList, getSectionIcon, isSpecialSection, getSpecialSectionConfig, createSpecialSection, enhanceWithSpecialSectionsCentralized } from './1-document-flows/document-flows/sections/utilities/sectionUtilities';
export { detectDocumentStructure } from './1-document-flows/document-flows/processing/detection/documentStructureDetector';
export { enhanceWithSpecialSections } from './1-document-flows/document-flows/sections/enhancement/sectionEnhancement';
export { applyDetectionResults } from './1-document-flows/document-flows/processing/structure/applyDetectionResults';
export { organizeDocumentStructureForUi, getFlatDocumentView } from './1-document-flows/document-flows/organizeForUiRendering';
export type { HierarchicalDocumentView } from './1-document-flows/document-flows/organizeForUiRendering';
export { unifiedDeduplicateSections, unifiedDetectAndApply, processDocumentStructure, createUnifiedDocumentStructure } from './1-document-flows/document-flows/common/documentProcessingUtils';

// Export types

export type {
  ProgramSummary,
  ProductType,
  PlanSection,
  PlanDocument,
  FundingProgram,
  DocumentStructure,
  SetupDiagnostics,
} from '../types/types';