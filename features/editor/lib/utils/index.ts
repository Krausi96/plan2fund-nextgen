// Export functions from the new organized structure

// Export document setup utilities

export {
  normalizeFundingProgram,
  normalizeProgramSetup,
} from '@/platform/analysis/program-flow/normalizer';
export {
  generateDocumentStructureFromProfile,
} from '@/platform/analysis/program-flow/generator';

// Export conversion functions
export { generateProgramBlueprint } from '@/platform/analysis/program-flow/converter';

// Export legacy conversion functions

// Additional utilities from other modules
export { inferProductTypeFromBlueprint, instantiateFromBlueprint } from '@/platform/generation/plan/instantiation';
export { normalizeDocumentStructure } from '@/platform/analysis/internal/document-flows/document-flows/normalization/normalizeDocumentStructure';
export { splitDocumentIntoParts } from '@/platform/analysis/internal/document-flows/document-flows/processing/documentProcessor';
export { validateDocumentContent, detectMultipleSectionsWithoutTitles } from '@/platform/analysis/internal/document-flows/document-flows/processing/security/contentSecurityValidator';

export { detectDocumentStructure } from '@/platform/analysis/internal/document-flows/document-flows/processing/detection/documentStructureDetector';
export { applyDetectionResults } from '@/platform/analysis/internal/document-flows/document-flows/processing/detection/documentStructureDetector';
export { organizeForUiRendering } from '@/features/editor/lib/utils/organizeForUiRendering';
export type { HierarchicalDocumentView } from '@/features/editor/lib/utils/organizeForUiRendering';
// New centralized location
export { sortSectionsForSingleDocument, getSectionIcon, isSpecialSection, getCompleteSectionList } from './organizeForUiRendering';
export { unifiedDeduplicateSections, unifiedDetectAndApply, processDocumentStructure, createUnifiedDocumentStructure } from '@/platform/analysis/internal/document-flows/document-flows/common/documentProcessingUtils';

// Export types

export type {
  ProgramSummary,
  ProductType,
  PlanSection,
  PlanDocument,
  FundingProgram,
  DocumentStructure,
} from '../types/types';