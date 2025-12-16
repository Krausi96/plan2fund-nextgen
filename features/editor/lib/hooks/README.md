# Editor Hooks

This directory contains React hooks for editor UI interactions.

## Hook Categories

### Core State Hooks
- **`useEditorState.ts`** - Consolidated state hooks that combine multiple store calls
  - `useEditorState()` - Basic editor state
  - `useSidebarState()` - Complete sidebar state + actions
  - `useDocumentsBarState()` - Complete documents bar state + actions
  - `useConfiguratorState()` - Product/program selection state
  - `usePreviewState()` - Preview workspace state
  - And more...

- **`useEditorStore.ts`** - Store action hooks
  - `useEditorActions()` - Access store actions via selector
  - `useEscapeKeyHandler()` - Handle Escape key press

### Internal Helper Functions
- **`useToggleHandlers()`** - Internal helper for creating toggle handlers (used by consolidated hooks)
  - Provides `toggle`, `isDisabled`, and counts
  
- **`useEditHandlers()`** - Internal helper for creating edit handlers (used by consolidated hooks)
  - Provides `onEdit`, `onSave`, `onCancel` handlers

Note: These helpers are internal to `useEditorState.ts` and not exported. Components should use the consolidated hooks like `useSidebarState()` and `useDocumentsBarState()` instead.

## Usage Pattern

Most components should use the consolidated hooks from `useEditorState.ts`:

```tsx
// ✅ Recommended: Use consolidated hook
import { useSidebarState } from '@/features/editor/lib';

function Sidebar() {
  const { sections, actions, isNewUser } = useSidebarState();
}
```

The toggle and edit handlers are internal helpers used by the consolidated hooks. If you need this functionality, use the consolidated hooks that expose them:

```tsx
// ✅ Use consolidated hooks that include handlers
import { useSidebarState, useDocumentsBarState } from '@/features/editor/lib';

function Component() {
  const { actions } = useSidebarState();
  // actions includes: toggleSection, editSection, cancelEdit, etc.
}
```

## When to Add a New Hook

- **Add to `useEditorState.ts`**: If it consolidates multiple store calls for a UI area
- **Add new file**: If it's a standalone utility hook that's used by multiple components
- **Keep in component**: If it's only used by one component (preferred for simple hooks)
