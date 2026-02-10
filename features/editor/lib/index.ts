/**
 * ============================================================================
 * EDITOR LIBRARY - UNIFIED EXPORTS (Public API)
 * ============================================================================
 * 
 * 📚 QUICK START:
 * 
 *   // ✅ RECOMMENDED: Use combined state hooks (easiest)
 *   import { useSidebarState, useDocumentsBarState } from '@/features/editor/lib';
 * 
 *   // ✅ For specific needs: Use selectors
 *   import { useIsNewUser, useHasPlan, useSectionsForSidebar } from '@/features/editor/lib';
 * 
 *   // ❌ DEPRECATED: Style constants are no longer exported
 *   // All components now use inline Tailwind classes directly
 * 
 *   // ✅ For utilities: Use utility functions
 *   import { shouldIgnoreClick, normalizeProgramInput } from '@/features/editor/lib';
 * 
 *   // ✅ For types: Import types
 *   import type { SectionTemplate, ProductType } from '@/features/editor/lib';
 * 
 * 📁 FOLDER STRUCTURE:
 * 
 *   lib/
 *   ├── types.ts                    # TypeScript type definitions
 *   ├── store/                      # State management & data builders
 *   │   ├── editorStore.ts          # Zustand store (state + actions)
 *   │   ├── sectionBuilders.ts      # Build section lists for views
 *   │   └── documentBuilders.ts     # Build document lists for views
 *   ├── constants/                  # Constants & IDs
 *   │   └── editorConstants.ts      # Product options, section IDs, helpers
 *   ├── renderers/                  # Preview/rendering utilities
 *   │   └── rendererUtils.ts        # Page numbers, translations, formatting
 *   ├── utils/                      # General utility functions
 *   │   └── editorUtils.ts          # Click handling, input normalization
 *   ├── hooks/                      # React hooks
 *   │   ├── useEditorSelectors.ts   # Read state (selectors)
 *   │   ├── useEditorActions.ts     # Write state (actions)
 *   │   ├── useEditorState.ts       # Combined state hooks (RECOMMENDED)
 *   │   └── useEditorHandlers.ts    # Handler creation hooks
 *   └── index.ts                    # This file - unified exports
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
export type { FundingProgram, DocumentStructure, ProgramSummary, SetupDiagnostics, SetupStatus, SetupSource } from './types/program/program-types';

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
// SELECTORS - Store selectors (read state)
// ============================================================================

// DEPRECATED: useEditorSelectors has been migrated to useProjectStore selectors

// ============================================================================
// HOOKS - React hooks for UI interactions
// ============================================================================

// DEPRECATED: useEditorActions and useEditorState have been migrated to useProjectStore

// Removed deprecated exports - these hooks are now available via useProject
// (useToggleHandlers, useEditHandlers, useEditorHandlers migrated)

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
} from './utils/1-document-flows/document-flows/utils/editorUtils';

// Program utilities


// Document Setup utilities
export {
  normalizeFundingProgram,
} from './utils/2-program-flows/program-flows/data-processing/programNormalizer';
export {
  generateDocumentStructureFromProfile,
} from './utils/2-program-flows/program-flows/structure-generation/structureGenerator';

// Conversion utilities
export { generateProgramBlueprint } from './utils/2-program-flows/program-flows/conversion/programConverter';

// Legacy conversion utilities

// Blueprint Instantiation utilities
export {
  inferProductTypeFromBlueprint,
  instantiateFromBlueprint,
} from './utils/4-blueprint-flows/blueprint-flows/document-instantiation/instantiateFromBlueprint';

// Section Detection utilities
export { getCompleteSectionList, getSectionIcon } from './utils/1-document-flows/document-flows/organizeForUiRendering';
export { isSpecialSectionId as isSpecialSection } from './constants';
export { createSpecialSection } from './utils/1-document-flows/document-flows/sections/enhancement/sectionEnhancement';
// Document processing functions - now available through doc-import module
// TODO: Eventually migrate these to use doc-import directly
export { enhanceWithSpecialSections } from './utils/1-document-flows/document-flows/sections/enhancement/sectionEnhancement';
export { sortSectionsForSingleDocument, sortSectionsForMultiDocument, isSpecialSection as isSpecialSectionUtil } from './utils/1-document-flows/document-flows/organizeForUiRendering';
export { detectDocumentStructure } from './utils/1-document-flows/document-flows/processing/detection/documentStructureDetector';
export { applyDetectionResults } from './utils/1-document-flows/document-flows/processing/detection/documentStructureDetector';
export { processUploadedDocument } from './document-flow/processUploadedDocument';
export { normalizeDocumentStructure } from './utils/1-document-flows/document-flows/normalization/normalizeDocumentStructure';
export { splitDocumentIntoParts } from './utils/1-document-flows/document-flows/processing/documentProcessor';
export { validateDocumentContent } from './utils/1-document-flows/document-flows/processing/security/contentSecurityValidator';

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