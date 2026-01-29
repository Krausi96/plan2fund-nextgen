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
  ConversationMessage,
  QuestionStatus,
  SectionTemplate,
  DocumentTemplate,
  DropdownPosition,
  DropdownPositionOptions,
  EditHandlers,
  ToggleHandlers,
  ConnectCopy,
  ProjectProfile,
  DocumentTemplateId,
  SetupWizardState,
} from './types/types';

// Document Setup types
export type {
  FundingProgram,
  DocumentStructure,
  SetupDiagnostics,
  SetupStatus,
  SetupSource,
} from './types/Program-Types';

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
} from './store/editorStore';

export type {
  SectionWithMetadata,
  DocumentWithMetadata,
} from './types/types';

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
  calculatePageNumber,
  shouldDisplayPageNumber,
  formatTableLabel,
} from './renderers';

// ============================================================================
// UTILS - General utility functions
// ============================================================================

export {
  shouldIgnoreClick,
} from './utils';

// Program utilities (now in Program.utils.ts)
export {
  normalizeProgramInput,
} from './utils/Program.utils';

// Document Setup utilities
export {
  normalizeFundingProgram,
  migrateLegacySetup,
  generateDocumentStructureFromProfile,
  // Simplified/deprecated functions
  parseProgramFromUrl, // @deprecated - use direct program input
  generateProgramBlueprint, // @deprecated - use normalizeFundingProgram instead
  // Removed functions (unused):
  // normalizeProgramSetup - never used
  // normalizeToProgramProfile - just wrapper for normalizeFundingProgram
  // generateBlueprintFromProfile - unused placeholder
  // syncTemplateStateFromPlan - use store actions instead
} from './utils/Program.utils';

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
} from './templates';
