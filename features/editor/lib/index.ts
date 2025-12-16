/**

 * STRUCTURE:
 *   - TYPES: Type definitions (ProductType, PlanSection, etc.)
 *   - STORE: Zustand store + hooks (useEditorStore, useSectionsForSidebar, etc.)
 *   - HOOKS: React hooks for UI interactions (useEditorState, useEditHandlers, etc.)
 *   - HELPERS: Utility functions and constants (styles, calculations, etc.)
 *   - AI CLIENT: Section AI functionality (detectAIContext, generateSectionContent)
 * 
 * USAGE EXAMPLES:
 *   // Import types
 *   import type { ProductType, PlanSection } from '@/features/editor/lib';
 * 
 *   // Import hooks
 *   import { useEditorState, useSidebarState } from '@/features/editor/lib';
 * 
 *   // Import store selectors
 *   import { useHasPlan, useIsNewUser } from '@/features/editor/lib';
 * 
 *   // Import helpers
 *   import { SECTION_STYLES, calculateCompletion } from '@/features/editor/lib';
 * 
 * FILE ORGANIZATION:
 *   lib/
 *   ├── types.ts                    # Type definitions
 *   ├── store/
 *   │   └── editorStore.ts          # Zustand store + selectors + helpers
 *   ├── hooks/
 *   │   ├── useEditorState.ts       # Consolidated state hooks (includes toggle/edit handlers)
 *   │   ├── useEditorStore.ts       # Store action hooks
 *   │   └── selectors.ts            # Store selectors
 *   └── index.ts                    # This file - unified exports
 * ============================================================================
 */
// ============================================================================
// TYPES - Type definitions only
// ============================================================================

export type {
  ProductType,
  ProductOption,
  TitlePage,
  PlanSection,
  PlanDocument,
  BusinessPlan,
  ProgramSummary,
  ConnectCopy,
  ConversationMessage,
  QuestionStatus,
  Section,
} from './types';

export type {
  SectionTemplate,
  DocumentTemplate,
} from './types';

// ============================================================================
// STORE - Zustand store + hooks
// ============================================================================

// Store exports (store definition only)
export {
  useEditorStore,
  METADATA_SECTION_ID,
  ANCILLARY_SECTION_ID,
  REFERENCES_SECTION_ID,
  APPENDICES_SECTION_ID,
  isSpecialSectionId,
} from './store/editorStore';

// Selector exports (organized selectors)
export {
  // Boolean selectors
  useIsNewUser,
  useHasPlan,
  useIsWaitingForPlan,
  useIsEditingSection,
  useIsEditingDocument,
  // Set selectors
  useDisabledSectionsSet,
  useDisabledDocumentsSet,
  // Data selectors
  useSelectedProductMeta,
  useEffectiveEditingSectionId,
  useVisibleSections,
  useVisibleDocuments,
  useSectionsForConfig,
  useSectionsForSidebar,
  useDocumentsForConfig,
  useDocumentsForBar,
  useDocumentCounts,
  useSectionsAndDocumentsCounts,
} from './hooks/selectors';

export type {
  EditorStore,
  EditorActions,
  EditorState,
  SectionWithMetadata,
  DocumentWithMetadata,
} from './store/editorStore';

// ============================================================================
// HOOKS - React hooks for UI interactions
// ============================================================================

export {
  useEditorActions,
  useEscapeKeyHandler,
} from './hooks/useEditorStore';

export {
  useEditorState,
  useSidebarState,
  useDocumentsBarState,
  usePreviewState,
  useConfiguratorState,
  useSectionsDocumentsManagementState,
  useSectionEditorState,
} from './hooks/useEditorState';

// ============================================================================
// HELPERS - Utility functions and constants
// ============================================================================

export {
  DEFAULT_PRODUCT_OPTIONS,
  getSelectedProductMeta,
  SECTION_STYLES,
  INLINE_STYLES,
  SIDEBAR_STYLES,
  DOCUMENTS_BAR_STYLES,
  calculateCompletion,
  getProgressIntent,
  shouldIgnoreClick,
  PAGE_STYLE,
  EDITOR_STYLES,
  getTranslation,
  calculatePageNumber,
  formatTableLabel,
  renderTable,
  normalizeProgramInput,
} from './store/editorStore';

// ============================================================================
// AI CLIENT - Section AI functionality
// ============================================================================

export {
  detectAIContext,
  parseAIActions,
  generateSectionContent,
} from '../components/Editor/sectionAiClient';

export type {
  SectionAiRequest,
  SectionAiResponse,
  AIContext,
  AIAction,
  AIActionCallbacks,
} from '../components/Editor/sectionAiClient';

