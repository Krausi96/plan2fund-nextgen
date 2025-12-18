# Editor Library (`lib/`) - Complete Guide

## 📁 Folder Structure Overview

```
lib/
├── types.ts                    # TypeScript type definitions
├── store/                      # State management & data builders
│   ├── editorStore.ts          # Zustand store (state + actions)
│   ├── sectionBuilders.ts       # Build section lists for different views
│   └── documentBuilders.ts     # Build document lists for different views
├── constants/                  # Constants & IDs
│   └── editorConstants.ts      # Product options, section IDs, helper functions
├── renderers/                  # Preview/rendering utilities
│   └── rendererUtils.ts        # Page numbers, translations, table formatting
├── styles/                     # UI styling constants (DEPRECATED)
│   └── editorStyles.ts         # DEPRECATED - Tailwind classes & inline styles
├── utils/                      # General utility functions
│   └── editorUtils.ts          # Click handling, input normalization
├── hooks/                      # React hooks
│   ├── useEditorSelectors.ts   # Read state (selectors)
│   ├── useEditorActions.ts     # Write state (actions)
│   ├── useEditorState.ts       # Combined state hooks for UI areas
│   └── useEditorHandlers.ts    # Handler creation hooks
└── index.ts                    # Unified exports (public API)
```

---

## 📚 What Each Folder Does

### `types.ts` - Type Definitions
**Purpose:** All TypeScript interfaces and types used throughout the editor.

**Contains:**
- `BusinessPlan`, `PlanSection`, `PlanDocument` - Core data structures
- `ProductType`, `ProductOption` - Product selection types
- `SectionTemplate`, `DocumentTemplate` - Template types
- All other editor-related types

**When to use:** Import types when defining props, state, or function parameters.

---

### `store/` - State Management & Data Builders

#### `editorStore.ts` - Core Zustand Store
**Purpose:** Single source of truth for all editor state.

**Contains:**
- `EditorState` interface - All state properties
- `EditorActions` interface - All state update functions
- `useEditorStore` hook - Zustand store instance
- Helper types: `SectionWithMetadata`, `DocumentWithMetadata`

**When to use:** 
- Directly: Rarely (use hooks instead)
- Via hooks: Always (use `useEditorSelectors`, `useEditorActions`, `useEditorState`)

#### `sectionBuilders.ts` - Section List Builders
**Purpose:** Transform raw sections into formatted lists for different UI views.

**Functions:**
- `buildSectionsForSidebar()` - Builds sections for sidebar navigation
- `buildSectionsForConfig()` - Builds sections for configuration view

**When to use:** Used internally by selectors. You typically use hooks like `useSectionsForSidebar()` instead.

#### `documentBuilders.ts` - Document List Builders
**Purpose:** Transform raw documents into formatted lists for different UI views.

**Functions:**
- `buildDocumentsForConfig()` - Builds documents for configuration view
- `getDocumentCounts()` - Counts enabled/total documents

**When to use:** Used internally by selectors. You typically use hooks like `useDocumentsForConfig()` instead.

---

### `constants/` - Constants & Helper Functions

#### `editorConstants.ts` - Constants & IDs
**Purpose:** All constants, IDs, and simple helper functions.

**Contains:**
- `DEFAULT_PRODUCT_OPTIONS` - Available product types (Submission, Review, Strategy)
- `METADATA_SECTION_ID`, `ANCILLARY_SECTION_ID`, etc. - Special section IDs
- `getSelectedProductMeta()` - Get product metadata by type
- `isSpecialSectionId()` - Check if section is special (metadata, references, etc.)
- `getSectionTitle()` - Get translated title for special sections

**When to use:** Import constants and helper functions when you need IDs or product metadata.

---

### `renderers/` - Preview/Rendering Utilities

#### `rendererUtils.ts` - Preview Rendering Helpers
**Purpose:** Utilities for rendering document preview (PDF-like view).

**Functions:**
- `PAGE_STYLE` - A4 page dimensions and styling
- `getTranslation()` - Get German/English translations for preview labels
- `calculatePageNumber()` - Calculate page number based on section index
- `formatTableLabel()` - Convert camelCase/snake_case to Title Case

**When to use:** When building preview/export functionality (PreviewWorkspace component).

---

### `utils/` - General Utility Functions

#### `editorUtils.ts` - Utility Functions
**Purpose:** Reusable helper functions for common operations.

**Functions:**
- `shouldIgnoreClick()` - Prevent card clicks when clicking buttons/inputs
- `normalizeProgramInput()` - Extract program ID from URL or validate simple ID

**When to use:** When you need to handle click events or normalize user input.

---

### `hooks/` - React Hooks

#### `useEditorSelectors.ts` - Read State (Selectors)
**Purpose:** Hooks that read/select state from the store.

**Categories:**
- **Boolean selectors:** `useIsNewUser()`, `useHasPlan()`, `useIsEditingSection()`
- **Set selectors:** `useDisabledSectionsSet()`, `useDisabledDocumentsSet()`
- **Data selectors:** `useSectionsForSidebar()`, `useDocumentsForConfig()`, `useSelectedProductMeta()`

**When to use:** When you need to read state in components.

#### `useEditorActions.ts` - Write State (Actions)
**Purpose:** Hooks that update state in the store.

**Functions:**
- `useEditorActions()` - Get store actions via selector pattern
- `useEscapeKeyHandler()` - Handle Escape key press

**When to use:** When you need to update state (usually via `useEditorState` hooks instead).

#### `useEditorState.ts` - Combined State Hooks
**Purpose:** Unified hooks that combine state + actions for specific UI areas.

**Hooks:**
- `useSidebarState()` - Complete sidebar state + actions
- `useDocumentsBarState()` - Complete documents bar state + actions
- `useConfiguratorState()` - Product/program selection state + actions
- `usePreviewState()` - Preview workspace state
- `useSectionsDocumentsManagementState()` - Sections/documents management state

**When to use:** **RECOMMENDED** - Use these instead of individual selectors/actions. They provide everything you need for a UI area.

#### `useEditorHandlers.ts` - Handler Creation Hooks
**Purpose:** Hooks that create reusable handlers for common interactions.

**Functions:**
- `useToggleHandlers()` - Create toggle handlers for enabling/disabling items
- `useEditHandlers()` - Create edit handlers for editing items

**When to use:** Used internally by `useEditorState` hooks. Rarely used directly.

---

## 🎯 Quick Reference: What to Import Where

### In Components (Most Common)

```typescript
// ✅ RECOMMENDED: Use combined state hooks
import { useSidebarState, useDocumentsBarState } from '@/features/editor/lib';

// ✅ For specific needs: Use selectors
import { useIsNewUser, useHasPlan } from '@/features/editor/lib';

// ✅ For utilities: Use utility functions
import { shouldIgnoreClick } from '@/features/editor/lib';

// ✅ For types: Import types
import type { SectionTemplate, ProductType } from '@/features/editor/lib';
```

### In Hooks/Store Files

```typescript
// ✅ Use builders directly
import { buildSectionsForSidebar } from '../store/sectionBuilders';

// ✅ Use constants
import { DEFAULT_PRODUCT_OPTIONS, METADATA_SECTION_ID } from '../constants/editorConstants';

// ✅ Use store directly
import { useEditorStore } from '../store/editorStore';
```

---

## 📖 Common Patterns

### Pattern 1: Using Combined State Hook (Recommended)
```typescript
function Sidebar() {
  // ✅ One hook gives you everything
  const { sections, actions, isNewUser } = useSidebarState();
  
  return (
    <div>
      {sections.map(section => (
        <button onClick={() => actions.setActiveSectionId(section.id)}>
          {section.title}
        </button>
      ))}
    </div>
  );
}
```

### Pattern 2: Using Individual Selectors
```typescript
function MyComponent() {
  // ✅ Use specific selectors when you only need one thing
  const isNewUser = useIsNewUser();
  const sections = useSectionsForSidebar(t);
  
  // ...
}
```

### Pattern 2: Using Utility Functions
```typescript
import { shouldIgnoreClick } from '@/features/editor/lib';

function Card({ onSelect }) {
  return (
    <div onClick={(e) => {
      // ✅ Prevent selection when clicking buttons
      if (shouldIgnoreClick(e.target as HTMLElement)) return;
      onSelect();
    }}>
      <button>Edit</button>
    </div>
  );
}
```

---

## 🔍 Finding What You Need

### "I need to read state"
→ Use hooks from `useEditorSelectors.ts` or `useEditorState.ts`

### "I need to update state"
→ Use `useEditorActions()` or combined hooks from `useEditorState.ts`

### "I need styling"
→ Use Tailwind classes directly in components

### "I need to transform data"
→ Use builders from `sectionBuilders.ts` or `documentBuilders.ts` (usually via hooks)

### "I need constants/IDs"
→ Use from `editorConstants.ts`

### "I need types"
→ Import from `types.ts`

---

## 🚫 What NOT to Do

❌ **Don't import from internal files directly**
```typescript
// ❌ BAD
import { buildSectionsForSidebar } from '@/features/editor/lib/store/sectionBuilders';

// ✅ GOOD - Use the hook instead
import { useSectionsForSidebar } from '@/features/editor/lib';
```

❌ **Don't use store directly in components**
```typescript
// ❌ BAD
const plan = useEditorStore(state => state.plan);

// ✅ GOOD - Use selector hook
const plan = useEditorStore(state => state.plan); // Actually this is OK, but prefer:
const { plan } = useEditorState(); // Better - uses combined hook
```

---

## 📝 Summary

- **`types.ts`** = Type definitions
- **`store/`** = State management & data transformation
- **`constants/`** = Constants & simple helpers
- **`renderers/`** = Preview rendering utilities
- **`styles/`** = UI styling constants (DEPRECATED - use inline Tailwind classes)
- **`utils/`** = General utility functions
- **`hooks/`** = React hooks (selectors, actions, combined state)
- **`index.ts`** = Public API (import from here)

**Styling note:** All UI components now use inline Tailwind classes directly rather than importing style constants. This makes it easier to customize dimensions and appearance by editing the components directly.

**Most common:** Use `useEditorState.ts` hooks in components, import everything from `index.ts`.
