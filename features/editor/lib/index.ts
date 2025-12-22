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
  SectionTemplate,
  DocumentTemplate,
  DropdownPosition,
  DropdownPositionOptions,
  ZoomPreset,
  ViewMode,
  PreviewControls,
  EditHandlers,
  ToggleHandlers,
} from './types/types';

// ============================================================================
// STORE - Zustand store + types
// ============================================================================

export {
  useEditorStore,
} from './store/editorStore';

export type {
  EditorStore,
  EditorActions,
  EditorState,
  SectionWithMetadata,
  DocumentWithMetadata,
} from './store/editorStore';

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
  isSpecialSectionId,
  getSectionTitle,
} from './constants';

// ============================================================================
// SELECTORS - Store selectors (read state)
// ============================================================================

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
  useVisibleDocuments,
  useSectionsForConfig,
  useSectionsForSidebar,
  useDocumentsForConfig,
  useDocumentCounts,
  useSectionsAndDocumentsCounts,
} from './hooks/useEditorSelectors';

// ============================================================================
// HOOKS - React hooks for UI interactions
// ============================================================================

export {
  useEditorActions,
  useEscapeKeyHandler,
} from './hooks/useEditorActions';

export {
  useEditorState,
  useSidebarState,
  useDocumentsBarState,
  usePreviewState,
  useConfiguratorState,
  useSectionsDocumentsManagementState,
  useSectionEditorState,
} from './hooks/useEditorState';

export {
  useToggleHandlers,
  useEditHandlers,
} from './hooks/useEditorHandlers';

// ============================================================================
// RENDERERS - Rendering utilities
// ============================================================================

export {
  PAGE_STYLE,
  getTranslation,
  calculatePageNumber,
  formatTableLabel,
} from './renderers';

// ============================================================================
// UTILS - General utility functions
// ============================================================================

export {
  shouldIgnoreClick,
  normalizeProgramInput,
} from './utils';

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

// ============================================================================
// TEMPLATES - Section and document templates
// ============================================================================

export {
  MASTER_DOCUMENTS,
  MASTER_SECTIONS,
} from './templates';
