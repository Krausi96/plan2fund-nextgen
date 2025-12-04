# Handover: CurrentSelection Component Fixes & Refactoring

**Date:** 2024  
**Component:** `features/editor/components/layout/Workspace/Navigation/CurrentSelection.tsx`  
**Priority:** High

---

## Overview

This document outlines critical fixes and improvements needed for the `CurrentSelection` component, which serves as the main configurator for business plan setup. The component is currently a large monolithic file (~1682 lines) that needs both functional fixes and structural refactoring.

---

## Critical Issues to Fix

### 1. ❌ Auto-Jump to Step 3 When Selecting Product

**Problem:**  
When a user selects a product in Step 1, the configurator immediately jumps to Step 3 (Abschnitte & Dokumente) without user interaction. This is jarring and prevents users from reviewing their selection or accessing Step 2.

**Current Behavior:**
```typescript
// Line 242-257 in CurrentSelection.tsx
useEffect(() => {
  if (isExpanded) {
    // ...
    if (!productType) {
      setActiveStep(1);
    } else {
      // Product selected - go to Step 3 (Step 2 is optional, can be accessed later)
      setActiveStep(3);  // ❌ This auto-jumps!
    }
  }
}, [isExpanded, productType, programSummary?.id]);
```

**Expected Behavior:**
- User selects product → stays on Step 1 (or moves to Step 2 if program connection is available)
- User manually clicks Step 3 tab → navigates to Step 3
- No automatic navigation unless explicitly triggered by user action

**Fix Required:**
- Remove automatic `setActiveStep(3)` when product is selected
- Only set initial step to 1 if no product exists
- Let users manually navigate between steps using the step tabs
- Consider adding a "Continue" button in Step 1 that explicitly moves to Step 2/3

**Location:** `features/editor/components/layout/Workspace/Navigation/CurrentSelection.tsx` (lines 242-257)

---

### 2. ❌ State Synchronization: Sidebar, DocumentsBar, CurrentSelection

**Problem:**  
The three components (Sidebar, DocumentsBar, CurrentSelection Step 3) should show identical state for sections and documents, but there may be inconsistencies in:
- Disabled/enabled state
- Section counts
- Document counts
- Visual indicators (checkboxes, badges, icons)

**Current Architecture:**
- All three components receive `templateState` from `Editor.tsx`
- `templateState` is computed in a `useMemo` (lines 1061-1166 in Editor.tsx)
- State includes: `disabledSections`, `disabledDocuments`, `allSections`, `allDocuments`

**Verification Checklist:**
- [ ] When a section is disabled in CurrentSelection Step 3, does it show as disabled in Sidebar?
- [ ] When a document is toggled in DocumentsBar, does it update in CurrentSelection Step 3?
- [ ] Are section counts consistent across all three components?
- [ ] Do special sections (Title Page, TOC, References, Appendices) appear in all three places?
- [ ] Are checkboxes synchronized (checked/unchecked state matches)?

**Files to Check:**
- `features/editor/components/Editor.tsx` (templateState computation)
- `features/editor/components/layout/Workspace/Navigation/Sidebar.tsx`
- `features/editor/components/layout/Workspace/Content/DocumentsBar.tsx`
- `features/editor/components/layout/Workspace/Navigation/CurrentSelection.tsx` (Step 3)

**Potential Issues:**
- Different filtering logic in each component
- Missing props being passed
- State not updating reactively
- Special sections handled differently in each component

---

### 3. ❌ DocumentsBar: "Dokumente hinzufügen" Message Gets Cut

**Problem:**  
When clicking "Dokumente hinzufügen" (Add Document) in DocumentsBar, the form/message text gets cut off, likely due to:
- Fixed height constraints
- Overflow hidden
- Text truncation
- Container width limitations

**Location:** `features/editor/components/layout/Workspace/Content/DocumentsBar.tsx`

**Current Code:**
```typescript
// Lines 111-139
{showAddDocument && !expandedDocumentId && (
  <div className="flex-shrink-0 col-span-3 border border-white/20 bg-white/10 rounded-lg p-2.5 space-y-2 min-w-[420px]">
    <p className="text-xs text-white/70 font-semibold mb-2">
      {t('editor.desktop.documents.custom.title' as any) || 'Ein benutzerdefiniertes Dokument zu Ihrem Plan hinzufügen'}
    </p>
    // ... form fields
  </div>
)}
```

**Issues to Check:**
- Container has `min-w-[420px]` but parent might have width constraints
- Text might be truncated with `truncate` class
- Form might be cut off by parent's `overflow-hidden`
- Horizontal scroll might not be working properly

**Fix Required:**
- Ensure form container has adequate width
- Check parent container constraints (DocumentsBar has `maxHeight: '200px'` in Editor.tsx)
- Verify text wrapping vs truncation
- Test on different screen sizes
- Consider making form scrollable or expanding container height

**Related Translation Keys:**
- `editor.desktop.documents.custom.title` (EN: "Add a custom document to your plan")
- `editor.desktop.documents.custom.name`
- `editor.desktop.documents.custom.description`

---

## Refactoring Proposal: Split CurrentSelection Component

### Current State
- **File:** `CurrentSelection.tsx` (~1682 lines)
- **Location:** `features/editor/components/layout/Workspace/Navigation/`
- **Issues:**
  - Monolithic component handling multiple concerns
  - Hard to maintain and test
  - Difficult to navigate and understand
  - Mixed responsibilities (UI, state management, business logic)

### Proposed Structure

```
features/editor/components/layout/Workspace/Navigation/CurrentSelection/
├── index.tsx                          # Main component (orchestrator)
├── CurrentSelectionSummary.tsx        # Collapsed view (summary badge)
├── ConfiguratorOverlay.tsx            # Expanded overlay container
├── steps/
│   ├── Step1ProductSelection.tsx      # Step 1: Product type selection
│   ├── Step2ProgramConnection.tsx     # Step 2: Program connection
│   └── Step3SectionsDocuments.tsx    # Step 3: Sections & Documents management
├── components/
│   ├── StepNavigation.tsx            # Step tabs (1, 2, 3)
│   ├── ConfirmCancelButtons.tsx      # Footer buttons
│   ├── RequirementsChecker.tsx       # Requirements checking UI
│   └── ProductOptionsList.tsx        # Product selection UI
├── hooks/
│   ├── useConfiguratorState.ts       # State management for configurator
│   ├── useStepNavigation.ts          # Step navigation logic
│   └── useOverlayPosition.ts         # Overlay positioning logic
└── types.ts                           # TypeScript types and interfaces
```

### Component Breakdown

#### 1. `index.tsx` (Main Component)
**Responsibilities:**
- Render collapsed summary view
- Manage overlay open/close state
- Coordinate between summary and configurator
- Handle portal rendering

**Lines to Extract:** ~65-713 (collapsed view), portal setup

#### 2. `CurrentSelectionSummary.tsx`
**Responsibilities:**
- Display current selection summary
- Show product, program, section/document counts
- Handle click to expand configurator

**Lines to Extract:** ~65-713

#### 3. `ConfiguratorOverlay.tsx`
**Responsibilities:**
- Overlay container and positioning
- Header with "Aktuelle Auswahl" title
- Step navigation tabs
- Confirm/Cancel buttons (sticky footer)
- Content area with scrolling

**Lines to Extract:** ~714-1682 (overlay content)

#### 4. `steps/Step1ProductSelection.tsx`
**Responsibilities:**
- Product type selection UI
- Product options display
- Product change handling
- Show sections/documents preview (if needed)

**Lines to Extract:** ~740-825 (Step 1 content)

#### 5. `steps/Step2ProgramConnection.tsx`
**Responsibilities:**
- Program connection input
- Program finder button
- Program error/loading states
- Template extraction from files

**Lines to Extract:** ~825-958 (Step 2 content)

#### 6. `steps/Step3SectionsDocuments.tsx`
**Responsibilities:**
- Sections list with toggles
- Documents list with toggles
- Add custom section/document forms
- Special sections handling (Title Page, TOC, References, Appendices)

**Lines to Extract:** ~958-1200 (Step 3 content)

#### 7. `components/StepNavigation.tsx`
**Responsibilities:**
- Step tabs rendering
- Active step highlighting
- Click handlers for step navigation

**Lines to Extract:** ~784-835 (step navigation)

#### 8. `components/ConfirmCancelButtons.tsx`
**Responsibilities:**
- Confirm button (apply changes)
- Cancel button (revert changes)
- Sticky positioning at bottom

**Lines to Extract:** ~1200-1250 (buttons)

#### 9. `hooks/useConfiguratorState.ts`
**Responsibilities:**
- Manage `pendingProduct`, `pendingProgram`
- Track `originalProduct`, `originalProgram`
- Handle confirm/cancel logic
- State synchronization

**Lines to Extract:** ~123-281 (state management)

#### 10. `hooks/useStepNavigation.ts`
**Responsibilities:**
- Manage `activeStep` state
- Handle step transitions
- Prevent auto-jump to Step 3 (FIX #1)

**Lines to Extract:** Step navigation logic

#### 11. `hooks/useOverlayPosition.ts`
**Responsibilities:**
- Calculate overlay position
- Handle resize/scroll events
- Position overlay over CurrentSelection, DocumentsBar, and Sidebar

**Lines to Extract:** ~189-239 (overlay positioning)

### Benefits of Refactoring

1. **Maintainability:** Each component has a single responsibility
2. **Testability:** Smaller components are easier to test
3. **Reusability:** Components can be reused elsewhere
4. **Readability:** Clear file structure and naming
5. **Performance:** Better code splitting and lazy loading opportunities
6. **Collaboration:** Multiple developers can work on different parts

### Migration Strategy

1. **Phase 1:** Extract hooks first (no UI changes)
   - `useConfiguratorState.ts`
   - `useStepNavigation.ts`
   - `useOverlayPosition.ts`

2. **Phase 2:** Extract UI components
   - `StepNavigation.tsx`
   - `ConfirmCancelButtons.tsx`
   - `CurrentSelectionSummary.tsx`

3. **Phase 3:** Extract step components
   - `Step1ProductSelection.tsx`
   - `Step2ProgramConnection.tsx`
   - `Step3SectionsDocuments.tsx`

4. **Phase 4:** Extract main components
   - `ConfiguratorOverlay.tsx`
   - Refactor `index.tsx` to use all extracted components

5. **Phase 5:** Clean up and optimize
   - Remove unused code
   - Add tests
   - Update documentation

---

## Testing Checklist

### Issue #1: Auto-Jump Fix
- [ ] Select product in Step 1 → stays on Step 1
- [ ] Click Step 2 tab → navigates to Step 2
- [ ] Click Step 3 tab → navigates to Step 3
- [ ] No automatic navigation when product changes
- [ ] Initial state: Step 1 if no product, Step 1 if product exists (no auto-jump)

### Issue #2: State Synchronization
- [ ] Disable section in CurrentSelection Step 3 → appears disabled in Sidebar
- [ ] Enable section in Sidebar → appears enabled in CurrentSelection Step 3
- [ ] Toggle document in DocumentsBar → updates in CurrentSelection Step 3
- [ ] Section counts match across all three components
- [ ] Document counts match across all three components
- [ ] Special sections appear in all three places
- [ ] Checkbox states are synchronized

### Issue #3: DocumentsBar Text Cut
- [ ] Click "Dokumente hinzufügen" → form displays fully
- [ ] All text is visible (no truncation)
- [ ] Form is scrollable if needed
- [ ] Works on different screen sizes
- [ ] No horizontal overflow issues

### Refactoring
- [ ] All extracted components work independently
- [ ] No functionality lost after refactoring
- [ ] Performance is maintained or improved
- [ ] Code is easier to understand
- [ ] Tests pass for all components

---

## Files Reference

### Main Files
- `features/editor/components/layout/Workspace/Navigation/CurrentSelection.tsx` (1682 lines)
- `features/editor/components/Editor.tsx` (templateState, lines 1061-1166)
- `features/editor/components/layout/Workspace/Navigation/Sidebar.tsx`
- `features/editor/components/layout/Workspace/Content/DocumentsBar.tsx`

### Related Files
- `features/editor/hooks/useEditorStore.ts` (state management)
- `shared/i18n/translations/en.json` (translations)
- `shared/i18n/translations/de.json` (translations)

---

## Notes

- The component uses React portals for overlay rendering
- State is managed both locally (useState) and via props from Editor.tsx
- Special sections (METADATA, ANCILLARY, REFERENCES, APPENDICES) need special handling
- The component supports three product types: submission, review, strategy
- Translations are handled via `useI18n()` hook

---

## Questions?

If you encounter issues or need clarification:
1. Check existing handover documents in `/docs/`
2. Review component comments and type definitions
3. Test in browser DevTools to understand state flow
4. Check Editor.tsx for how templateState is computed

Good luck! 🚀
