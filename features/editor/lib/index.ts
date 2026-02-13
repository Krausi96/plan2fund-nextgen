/**
 * ============================================================================
 * EDITOR LIBRARY - UNIFIED EXPORTS (Public API)
 * ============================================================================
 * 
 * 📖 For detailed documentation, see: lib/README.md
 * ============================================================================
 */

// ============================================================================
// TYPES - Type definitions only
// ============================================================================

// Core types
export type { ProductType, ProductOption, SectionTemplate, SubsectionTemplate, DocumentTemplate } from '@/platform/core/types';

// Document types
export type { TitlePage, PlanSection, PlanDocument, BusinessPlan, SectionWithMetadata, DocumentWithMetadata } from '@/platform/core/types';

// Program types
export type { FundingProgram, ProgramSummary } from '@/platform/core/types/program';
export type { DocumentStructure } from '@/platform/core/types/project';

// Workflow types
export type { ProjectProfile, DocumentTemplateId, SetupWizardState } from '@/platform/core/types';

// Navigation types
export type { TreeNode } from './types/ui/navigation-types';

// ============================================================================
// STORE - Zustand store + types
// ============================================================================
// DEPRECATED: Editor store has been migrated to useProjectStore

// SectionWithMetadata and DocumentWithMetadata are already exported above in the TYPES section

// ============================================================================
// CONSTANTS - Constants and IDs
// ============================================================================

export {
  DEFAULT_PRODUCT_OPTIONS,
  getSelectedProductMeta,
  METADATA_SECTION_ID,
  ANCILLARY_SECTION_ID,
  REFERENCES_SECTION_ID,
  APPENDICES_SECTION_ID,
  TABLES_DATA_SECTION_ID,
  FIGURES_IMAGES_SECTION_ID,
  isSpecialSectionId,
  getSectionTitle,
} from './constants';


// ============================================================================
// RENDERERS - Rendering utilities
// ============================================================================

export {
  PAGE_STYLE,
  calculatePageNumber,
  shouldDisplayPageNumber,
  formatTableLabel,
} from './renderers';

// ============================================================================
// UTILS - General utility functions
// ============================================================================



// Document Setup utilities
export {
  normalizeFundingProgram,
} from '@/platform/analysis/program-flow/normalizer';
export {
  generateDocumentStructureFromProfile,
} from '@/platform/analysis/program-flow/generator';

// Conversion utilities
export { generateProgramBlueprint } from '@/platform/analysis/program-flow/converter';

// Legacy conversion utilities

// Blueprint Instantiation utilities
export {
  inferProductTypeFromBlueprint,
  instantiateFromBlueprint,
} from '@/platform/generation/plan/instantiation';

// Section Detection utilities
// @ts-ignore - getCompleteSectionList moved to utils, not exported
export { getCompleteSectionList } from '@/features/editor/lib/utils/organizeForUiRendering';
export { getSectionIcon } from './utils/organizeForUiRendering';
export { isSpecialSectionId as isSpecialSection } from './constants';
export { createSpecialSection } from '@/platform/analysis/internal/document-flows/sections/enhancement/sectionEnhancement';
// Document processing functions - now available through doc-import module
// TODO: Eventually migrate these to use doc-import directly
export { enhanceWithSpecialSections } from '@/platform/analysis/internal/document-flows/sections/enhancement/sectionEnhancement';
export { sortSectionsForSingleDocument } from './utils/organizeForUiRendering';
export { isSpecialSection as isSpecialSectionUtil } from './utils/organizeForUiRendering';
export { analyzeDocument } from '@/platform/analysis';
export { validateDocumentContent } from '@/platform/analysis/internal/document-flows/processing/security/contentSecurityValidator';

// ============================================================================
// AI CLIENT - Section AI functionality
// ============================================================================

export {
  detectAIContext,
  generateSectionContent,
} from '../components/Editor/sectionAiClient';

export type {
  SectionAiRequest,
  SectionAiResponse,
  AIContext,
  AIAction,
  AIActionCallbacks,
} from '../components/Editor/sectionAiClient';

// ============================================================================
// TEMPLATES - Section and document templates
// ============================================================================

export {
  MASTER_SECTIONS,
  SHARED_SPECIAL_SECTIONS,
  MASTER_DOCUMENTS_BY_PRODUCT,
  // Section catalogs
  BUSINESS_PLAN_SECTIONS,
  STRATEGY_SECTIONS,

  // Action functions
  addCustomDocument,
  addCustomSection,
  addCustomSubsection,
} from '@/platform/templates';

