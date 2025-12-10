# Editor Architecture Documentation

## Overview

This document clarifies the organization of the editor codebase, specifically what comes from the parent `Editor` component vs what is local to each child component. It also maps file relationships and identifies sources of truth.

## Source of Truth Mapping

### Core State Sources
1. **`lib/hooks/core/store/index.ts`** (569 lines) - **PRIMARY SOURCE OF TRUTH**
   - Zustand store for plan state
   - All plan mutations (updateAnswer, addDataset, etc.)
   - Plan hydration logic
   - **Dependencies:** `editorHelpers.ts` (buildSectionFromTemplate, persistPlan)

2. **`lib/hooks/core/useEditor.ts`** (677 lines) - **SECONDARY SOURCE OF TRUTH**
   - Product/program selection state
   - Template management state
   - Document selection state
   - **Dependencies:** `useEditorStore`, `editorHelpers.ts`, `@templates`

3. **`lib/hooks/configuration/template-configuration/useTemplateConfigurationState.tsx`** (427 lines)
   - Computes template configuration state from useEditor output
   - **Dependencies:** `useEditor`, `editorHelpers.ts`

### Helper Sources of Truth
1. **`lib/helpers/editorHelpers.ts`** (574 lines) - **UTILITY SOURCE OF TRUTH**
   - Plan building/conversion functions
   - Metadata helpers
   - Document/section helpers
   - **Used by:** store/index.ts, useEditor.ts, componentPropsHelpers.ts

2. **`lib/helpers/editorContextHelpers.ts`** (55 lines)
   - Shared editor context creation
   - **Used by:** Editor.tsx, componentPropsHelpers.ts, CurrentSelection.tsx

3. **`lib/helpers/templateHandlersHelpers.ts`** (140 lines)
   - Template handler extraction
   - **Used by:** componentPropsHelpers.ts

4. **`lib/helpers/componentPropsHelpers.ts`** (199 lines)
   - Props preparation for child components
   - **Dependencies:** editorContextHelpers, templateHandlersHelpers, editorHelpers

### Template Sources
1. **`lib/templates/sections.ts`** (255 lines) - **TEMPLATE DATA SOURCE**
   - Master section templates by product type
   - **Used by:** `lib/templates/index.ts`

2. **`lib/templates/documents.ts`** (1089 lines) - **TEMPLATE DATA SOURCE**
   - Master document templates by funding/product type
   - **Used by:** `lib/templates/index.ts`

3. **`lib/templates/api.ts`** (611 lines) - **TEMPLATE API SOURCE**
   - Template loading/merging logic
   - File extraction/parsing
   - **Dependencies:** sections.ts, documents.ts

4. **`lib/templates/index.ts`** (77 lines) - **TEMPLATE PUBLIC API**
   - Exports getSections(), getDocuments()
   - **Dependencies:** sections.ts, documents.ts, api.ts

## Data Flow

### Parent Component: `Editor.tsx` (471 lines)

The `Editor` component is the single source of truth for:
- **Product selection** (`selectedProduct`, `productOptions`) - from `useEditor`
- **Program connection** (`programSummary`, `programLoading`, `programError`) - from `useEditor`
- **Template management** (`allSections`, `allDocuments`, `disabledSections`, `disabledDocuments`, `customSections`, `customDocuments`) - from `useEditor`
- **Document selection** (`clickedDocumentId`, `handleSelectDocument`) - from `useEditor`
- **Plan state** (from `useEditorStore`)
- **Template configuration state** (via `useTemplateConfigurationState`)

**File Relationships:**
```
Editor.tsx
├── useEditor (lib/hooks/core/useEditor.ts)
│   ├── useEditorStore (lib/hooks/core/store/index.ts)
│   ├── editorHelpers.ts
│   └── @templates (lib/templates/index.ts)
├── useTemplateConfigurationState
├── useTemplateConfigurationHandlers
├── useEditorAutoActivation
├── useEditorComputedValues
└── componentPropsHelpers.ts
    ├── editorContextHelpers.ts
    ├── templateHandlersHelpers.ts
    └── editorHelpers.ts
```

### Child Components

#### 1. **Sidebar** (`Navigation/Sidebar/Sidebar.tsx`) - 875 lines ⚠️
- **From Parent (via props):**
  - `plan` - Business plan data
  - `activeSectionId` - Currently active section
  - `onSelectSection` - Handler to select a section
  - `templateState` - All template management state and handlers
  - `selectedProductMeta` - Product metadata
  - `programSummary` - Program information
- **Local:**
  - Section rendering logic (SectionNavigationTree component - 625 lines)
  - Card/list view toggle
  - Section filtering for document views
- **Dependencies:** `useEditorStore` (constants), `SectionDocumentEditForm`

#### 2. **DocumentsBar** (`Navigation/Documents/DocumentsBar.tsx`) - 338 lines ✓
- **From Parent (via props):**
  - `templateState` - All template management state and handlers
  - `selectedProductMeta` - Product metadata
  - `isNewUser` - Whether user has a plan yet
- **Local:**
  - Document card rendering
  - Document selection UI
  - Add document form UI
- **Dependencies:** `SectionDocumentEditForm`

#### 3. **CurrentSelection/Config** (`Navigation/Configuration/CurrentSelection.tsx`) - 529 lines ⚠️
- **From Parent (via props):**
  - `templateState` - All template management state and handlers
  - `selectedProduct` - Current product type
  - `productOptions` - Available products
  - `programSummary` - Program information
  - `progressSummary` - Requirements progress
  - `workspaceGridRef` - Grid container ref for overlay positioning
  - `isConfiguratorOpen` - Configurator overlay state
- **Local:**
  - Configurator overlay UI
  - Step navigation (uses `useConfiguratorStepNavigation`)
  - Change tracking (uses `useConfiguratorChangeTracking`)
  - Overlay positioning (uses `useConfiguratorOverlayPosition`)
- **Dependencies:** 
  - `editorContextHelpers.ts` (getSelectedProductMeta)
  - `editorHelpers.ts` (calculateRequirementsStats)
  - Child components: ProductSelection, ProgramSelection, SectionsDocumentsManagement, RequirementsDisplay

#### 4. **PreviewWorkspace** (`Preview/PreviewWorkspace.tsx`) - 525 lines ⚠️
- **From Parent (via props):**
  - `plan` - Business plan data
  - `focusSectionId` - Section to focus on
  - `editingSectionId` - Section being edited
  - `disabledSections` - Disabled section IDs
  - `selectedProductMeta` - Product metadata
  - `selectedDocumentName` - Additional document name
  - All update handlers (`onTitlePageChange`, `onAncillaryChange`, etc.)
- **Local:**
  - Preview rendering
  - View mode (page/fluid)
  - Zoom controls
  - Watermark toggle
- **Dependencies:** `DocumentRenderer` (from Renderer/)

#### 5. **SectionEditor** (`SectionEditor/SectionEditor.tsx`) - 404 lines ✓
- **From Parent (via props):**
  - `sectionId` - Section to edit
  - `onClose` - Close handler
- **From Store (via hooks):**
  - `plan` - Business plan data
  - `activeQuestionId` - Active question ID
  - All editor actions (updateAnswer, addDataset, etc.)
- **Local:**
  - Section editor UI
  - AI chat functionality (uses `useSectionEditorAI` - 650 lines ⚠️)
  - Question editing
  - Special sections handling
  - Position/drag management (uses `useSectionEditorPosition`, `useSectionEditorDrag`)
- **Dependencies:**
  - `useSectionEditorState` (145 lines ✓)
  - `useSectionEditorHandlers` (107 lines ✓)
  - `useSectionEditorAI` (650 lines ⚠️)
  - `useSectionEditorPosition` (225 lines ✓)
  - `useSectionEditorDrag` (134 lines ✓)
  - `sectionAiClient.ts` (684 lines ⚠️)
  - Components: AIChat, SpecialSections, QuestionEditor, etc.

## File Size Analysis (>500 lines)

### Files Requiring Attention:
1. **`lib/templates/documents.ts`** - 1089 lines
   - **Type:** Data file (template definitions)
   - **Action:** Keep as-is (data files can exceed limit)

2. **`components/layout/Renderer/AncillaryRenderer.tsx`** - 1000 lines
   - **Type:** Component (rendering logic)
   - **Action:** Split into: ListOfTables, ListOfFigures, ReferencesList, AppendicesList

3. **`components/layout/Workspace/Navigation/Sidebar/Sidebar.tsx`** - 875 lines
   - **Type:** Component
   - **Action:** Extract SectionNavigationTree to separate file

4. **`lib/hooks/core/useEditor.ts`** - 677 lines
   - **Type:** Hook
   - **Action:** Split into: useProductSelection, useTemplateManagement, useDocumentManagement, useProgramConnection

5. **`components/layout/Workspace/SectionEditor/lib/sectionAiClient.ts`** - 684 lines
   - **Type:** Utility (AI client logic)
   - **Action:** Split into: aiClient.ts, aiContextDetection.ts, aiActionParsing.ts

6. **`components/layout/Workspace/SectionEditor/hooks/useSectionEditorAI.ts`** - 650 lines
   - **Type:** Hook
   - **Action:** Split into: useAIChat.ts, useProactiveSuggestions.ts

7. **`lib/hooks/core/store/index.ts`** - 569 lines
   - **Type:** Store (Zustand)
   - **Action:** Extract actions to `store/actions.ts`

8. **`lib/helpers/editorHelpers.ts`** - 574 lines
   - **Type:** Utilities
   - **Action:** Split into: planHelpers.ts, metadataHelpers.ts, documentHelpers.ts

9. **`lib/templates/api.ts`** - 611 lines
   - **Type:** API utilities
   - **Action:** Split into: templateLoader.ts, templateParser.ts

## Helper Organization

### `editorContextHelpers.ts` (55 lines ✓)
- **Purpose:** Eliminates duplicate `getSelectedProductMeta` calls
- **Functions:**
  - `createEditorContext()` - Creates shared editor context (product options, selected product, product meta)
  - `createDocumentContext()` - Creates document context (document name, document sections)
- **Used by:** Editor.tsx, componentPropsHelpers.ts, CurrentSelection.tsx

### `templateHandlersHelpers.ts` (140 lines ✓)
- **Purpose:** Eliminates duplicate template handler extraction
- **Functions:**
  - `extractTemplateHandlers()` - Extracts all template handlers from TemplateState
  - `extractSectionTemplateState()` - Extracts section-specific state
  - `extractDocumentTemplateState()` - Extracts document-specific state
- **Used by:** componentPropsHelpers.ts

### `componentPropsHelpers.ts` (199 lines ✓)
- **Purpose:** Prepares props for child components from Editor's state
- **Functions:**
  - `prepareSidebarProps()` - Maps Editor state to Sidebar props
  - `prepareDocumentsProps()` - Maps Editor state to DocumentsBar props
  - `preparePreviewProps()` - Maps Editor state to PreviewWorkspace props
- **Dependencies:** editorContextHelpers, templateHandlersHelpers, editorHelpers

### `editorHelpers.ts` (574 lines ⚠️)
- **Purpose:** Pure utility functions for plan/document operations
- **Functions:**
  - `getSelectedProductMeta()` - Gets product metadata from options
  - `getDocumentSections()` - Gets sections for a document
  - `getSelectedDocumentName()` - Gets document name
  - Plan building/conversion functions
  - Metadata helpers
- **Used by:** store/index.ts, useEditor.ts, componentPropsHelpers.ts, CurrentSelection.tsx

## Hook Organization

### Core Hooks (`lib/hooks/core/`)
- `useEditor.ts` (677 lines ⚠️) - Main editor hook (product selection, template management, document management)
- `useEditorStore.ts` (26 lines ✓) - Re-exports store
- `store/index.ts` (569 lines ⚠️) - Zustand store for plan state
- `store/types.ts` (113 lines ✓) - Store type definitions

### Configuration Hooks (`lib/hooks/configuration/`)
- `template-configuration/useTemplateConfigurationState.tsx` (427 lines ✓) - Computes template state
- `template-configuration/useTemplateConfigurationHandlers.ts` (205 lines ✓) - Template action handlers
- `template-configuration/useTemplateConfigurationSync.ts` (51 lines ✓) - Syncs template changes to plan
- `configurator-ui/useConfiguratorStepNavigation.ts` (46 lines ✓) - Step navigation for configurator
- `configurator-ui/useConfiguratorChangeTracking.ts` (91 lines ✓) - Tracks pending changes
- `configurator-ui/useConfiguratorOverlayPosition.ts` (56 lines ✓) - Overlay positioning

### Editor Behavior Hooks (`lib/hooks/editor-behavior/`)
- `auto-activation/useEditorAutoActivation.ts` (145 lines ✓) - Auto-activates sections on scroll/selection
- `computed-values/useEditorComputedValues.ts` (93 lines ✓) - Computed values (visible sections, etc.)

### SectionEditor Hooks (`components/layout/Workspace/SectionEditor/hooks/`)
- `useSectionEditorState.ts` (145 lines ✓) - Section editor state (section, question, template, stats)
- `useSectionEditorHandlers.ts` (107 lines ✓) - Section editor action handlers (skip, complete)
- `useSectionEditorPosition.ts` (225 lines ✓) - Panel position and dimensions
- `useSectionEditorDrag.ts` (134 lines ✓) - Drag & drop functionality
- `useSectionEditorAI.ts` (650 lines ⚠️) - AI chat functionality
- `useQuestionHighlight.ts` (43 lines ✓) - Question highlighting in preview

## Key Principles

1. **Single Source of Truth:** Editor component owns all state; children receive via props
2. **No Duplication:** Shared helpers eliminate duplicate calls to `getSelectedProductMeta`, `getDocumentSections`, etc.
3. **Clear Separation:** Each component's local logic is clearly separated from parent-provided props
4. **Helper Functions Over Hooks:** Simple prop mapping uses helper functions, not hooks
5. **Organized Hooks:** Hooks are grouped by concern (core, configuration, behavior, section editor)
6. **File Size Limit:** No file should exceed 500 lines (except data files like templates)

## File Relationship Graph

```
Editor.tsx (471 lines)
│
├── useEditor (677 lines) ⚠️
│   ├── useEditorStore → store/index.ts (569 lines) ⚠️
│   │   └── editorHelpers.ts (574 lines) ⚠️
│   └── @templates → templates/index.ts
│       ├── templates/sections.ts (255 lines) ✓
│       ├── templates/documents.ts (1089 lines) [DATA]
│       └── templates/api.ts (611 lines) ⚠️
│
├── useTemplateConfigurationState (427 lines) ✓
│   └── editorHelpers.ts
│
├── componentPropsHelpers.ts (199 lines) ✓
│   ├── editorContextHelpers.ts (55 lines) ✓
│   ├── templateHandlersHelpers.ts (140 lines) ✓
│   └── editorHelpers.ts
│
└── Child Components:
    ├── Sidebar.tsx (875 lines) ⚠️
    │   └── SectionNavigationTree (625 lines) [INLINE]
    │
    ├── DocumentsBar.tsx (338 lines) ✓
    │
    ├── CurrentSelection.tsx (529 lines) ⚠️
    │   ├── editorContextHelpers.ts
    │   └── editorHelpers.ts
    │
    ├── PreviewWorkspace.tsx (525 lines) ⚠️
    │   └── DocumentRenderer.tsx
    │
    └── SectionEditor.tsx (404 lines) ✓
        ├── useSectionEditorAI.ts (650 lines) ⚠️
        │   └── sectionAiClient.ts (684 lines) ⚠️
        └── Other hooks (all <500 lines) ✓
```

## Consolidation Opportunities

1. **Merge small related hooks** - Some hooks are <50 lines and could be combined
2. **Extract inline components** - SectionNavigationTree should be separate file
3. **Split large hooks** - useEditor, useSectionEditorAI need splitting
4. **Extract store actions** - Store actions should be in separate file
5. **Split large utilities** - editorHelpers.ts, sectionAiClient.ts need splitting

## Migration Notes

- Previously, `getSelectedProductMeta` was called in multiple places - now uses `createEditorContext()`
- Previously, template handlers were extracted inline - now uses `extractTemplateHandlers()`
- Previously, component props were prepared with inline logic - now uses dedicated helper functions
