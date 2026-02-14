// Export functions from the new organized structure

// Export document setup utilities

export {
  normalizeFundingProgram,
  normalizeProgramSetup,
} from '@/platform/analysis/program-flow/normalizer';
// generateDocumentStructureFromProfile removed - use buildDocumentStructure instead

// Export conversion functions
export { generateProgramSummary } from '@/platform/analysis/program-flow/converter';

// Export legacy conversion functions

// Additional utilities from other modules
export { inferProductTypeFromBlueprint, instantiatePlanFromStructure } from '@/platform/generation/plan/instantiation';

export { validateDocumentContent, detectMultipleSectionsWithoutTitles } from '@/platform/analysis/internal/document-flows/processing/security/contentSecurityValidator';

export { organizeForUiRendering } from '@/features/editor/lib/utils/organizeForUiRendering';
export type { HierarchicalDocumentView } from '@/features/editor/lib/utils/organizeForUiRendering';
// New centralized location
export { sortSectionsForSingleDocument, getSectionIcon, isSpecialSection, getCompleteSectionList } from './organizeForUiRendering';

// Export types

export type {
  ProgramSummary,
  ProductType,
  PlanSection,
  PlanDocument,
  FundingProgram,
  DocumentStructure,
} from '@/platform/core/types';