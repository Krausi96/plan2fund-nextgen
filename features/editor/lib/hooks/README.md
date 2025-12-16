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

### UI Interaction Hooks
- **`useEditHandlers.ts`** - Handlers for editing items (sections/documents)
  - Provides `onEdit`, `onSave`, `onCancel` handlers

- **`useToggleHandlers.ts`** - Handlers for toggling items enabled/disabled
  - Provides `toggle`, `isDisabled`, and counts

### Positioning Hooks
- **`useDropdownPosition.ts`** - Calculates dropdown menu position
  - Used by ProductSelection, ProgramSelection

- **`useConfiguratorHooks.ts`** - Configurator overlay positioning and navigation
  - `useConfiguratorOverlayPosition()` - Calculate overlay position
  - `useConfiguratorChangeTracking()` - Track pending changes
  - `useConfiguratorStepNavigation()` - Step navigation (1, 2, 3)

### Feature-Specific Hooks
- **`usePreviewControls.ts`** - Preview view mode and zoom controls
  - Manages viewMode, zoomPreset, showWatermark

## Usage Pattern

Most components should use the consolidated hooks from `useEditorState.ts`:

```tsx
// ✅ Recommended: Use consolidated hook
import { useSidebarState } from '@/features/editor/lib';

function Sidebar() {
  const { sections, actions, isNewUser } = useSidebarState();
}
```

For specific functionality, use individual hooks:

```tsx
// ✅ For specific needs
import { useEditHandlers, useToggleHandlers } from '@/features/editor/lib';

function Component() {
  const editHandlers = useEditHandlers(...);
  const toggleHandlers = useToggleHandlers(...);
}
```

## When to Add a New Hook

- **Add to `useEditorState.ts`**: If it consolidates multiple store calls for a UI area
- **Add new file**: If it's a standalone utility hook (like `useDropdownPosition`)
- **Keep in component**: If it's only used by one component
