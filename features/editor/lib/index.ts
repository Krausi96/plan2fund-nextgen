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
export type { ProductType, ProductOption } from './types/core/product-types';
export type { SubsectionTemplate, SectionTemplate, DocumentTemplate } from './types/core/template-types';

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

export {
  shouldIgnoreClick,
} from '@/platform/analysis/internal/1-document-flows/document-flows/utils/editorUtils';



// Document Setup utilities
export {
  normalizeFundingProgram,
} from '@/platform/analysis/internal/data-processing/programNormalizer';
export {
  generateDocumentStructureFromProfile,
} from '@/platform/analysis/internal/structure-generation/structureGenerator';

// Conversion utilities
export { generateProgramBlueprint } from '@/platform/analysis/internal/conversion/programConverter';

// Legacy conversion utilities

// Blueprint Instantiation utilities
export {
  inferProductTypeFromBlueprint,
  instantiateFromBlueprint,
} from '@/platform/analysis/internal/4-blueprint-flows/blueprint-flows/document-instantiation/instantiateFromBlueprint';

// Section Detection utilities
export { getCompleteSectionList } from '@/platform/analysis/internal/1-document-flows/document-flows/organizeForUiRendering';
export { getSectionIcon } from './utils/organizeForUiRendering';
export { isSpecialSectionId as isSpecialSection } from './constants';
export { createSpecialSection } from '@/platform/analysis/internal/1-document-flows/document-flows/sections/enhancement/sectionEnhancement';
// Document processing functions - now available through doc-import module
// TODO: Eventually migrate these to use doc-import directly
export { enhanceWithSpecialSections } from '@/platform/analysis/internal/1-document-flows/document-flows/sections/enhancement/sectionEnhancement';
export { sortSectionsForSingleDocument, sortSectionsForMultiDocument } from '@/platform/analysis/internal/1-document-flows/document-flows/organizeForUiRendering';
export { isSpecialSection as isSpecialSectionUtil } from './utils/organizeForUiRendering';
export { detectDocumentStructure } from '@/platform/analysis/internal/1-document-flows/document-flows/processing/detection/documentStructureDetector';
export { applyDetectionResults } from '@/platform/analysis/internal/1-document-flows/document-flows/processing/detection/documentStructureDetector';
export { processUploadedDocument } from '@/platform/analysis/internal/documentProcessor';
export { normalizeDocumentStructure } from '@/platform/analysis/internal/1-document-flows/document-flows/normalization/normalizeDocumentStructure';
export { splitDocumentIntoParts } from '@/platform/analysis/internal/1-document-flows/document-flows/processing/documentProcessor';
export { validateDocumentContent } from '@/platform/analysis/internal/1-document-flows/document-flows/processing/security/contentSecurityValidator';

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
  UPGRADE_SECTIONS,
  // Action functions
  addCustomDocument,
  addCustomSection,
  addCustomSubsection,
} from './templates';

