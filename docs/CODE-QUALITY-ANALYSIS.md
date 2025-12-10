# Code Quality Analysis & Refactoring Plan

**Date:** 2024  
**Status:** Pre-Phase 2 Analysis  
**Purpose:** Analyze code quality, file sizes, and identify refactoring opportunities before Phase 2

---

## File Size Analysis

### Target: ~500 lines per file

### Files Exceeding Target:

1. **`features/editor/components/Editor.tsx`** - ~1819 lines
   - **Status:** 🔴 CRITICAL - 3.6x target size
   - **Issues:**
     - Main orchestrator component with too many responsibilities
     - Contains product config, template management, document management logic
     - Large JSX rendering logic
   - **Refactoring Opportunities:**
     - Extract product configuration to separate component/hook
     - Extract template/document management UI to separate components
     - Split JSX into smaller sub-components
     - Move business logic to custom hooks (already partially done)

2. **`features/editor/lib/hooks/useEditorStore.ts`** - ~1463 lines
   - **Status:** 🔴 CRITICAL - 2.9x target size
   - **Issues:**
     - Large Zustand store with many actions
     - Complex hydrate function (~150 lines)
     - Many action functions (30+)
   - **Refactoring Opportunities:**
     - Split into multiple stores (plan store, UI store, actions store)
     - Extract hydrate logic to separate module
     - Group related actions into separate files
     - Extract type definitions to separate file

3. **`features/editor/components/layout/Workspace/Navigation/Configuration/CurrentSelection/CurrentSelection.tsx`** - ~1048 lines
   - **Status:** 🟡 HIGH - 2.1x target size
   - **Issues:**
     - Orchestrator component with overlay positioning logic
     - Change tracking logic
     - Step navigation logic
     - Large JSX for configurator overlay
   - **Refactoring Opportunities:**
     - Extract overlay positioning to custom hook
     - Extract change tracking to custom hook
     - Split step components further
     - Extract configurator overlay to separate component

4. **`features/editor/lib/templates/api.ts`** - ~638 lines
   - **Status:** 🟡 MEDIUM - 1.3x target size
   - **Issues:**
     - Multiple responsibilities (program loading, merging, file extraction)
   - **Refactoring Opportunities:**
     - Split into: `programLoader.ts`, `templateMerger.ts`, `fileExtractor.ts`
     - Each file ~200 lines

---

## Function Size Analysis

### Target: Functions should be focused and readable (~50-100 lines max)

### Large Functions Identified:

1. **`useEditorStore.hydrate()`** - ~150 lines
   - **Location:** `features/editor/lib/hooks/useEditorStore.ts:246-396`
   - **Issues:**
     - Complex logic mixing template loading, section building, plan creation
     - Multiple responsibilities
   - **Refactoring:**
     - Extract template loading to `loadTemplates()`
     - Extract section building to `buildPlanSections()`
     - Extract plan creation to `createPlan()`
     - Keep hydrate as orchestrator (~30 lines)

2. **`Editor.tsx` render logic** - Multiple large sections
   - **Location:** `features/editor/components/Editor.tsx`
   - **Issues:**
     - Large JSX blocks (200+ lines each)
     - Complex conditional rendering
   - **Refactoring:**
     - Extract to sub-components: `EditorWorkspace`, `EditorContent`, `EditorSidebar`

3. **`loadProgramSections()`** - ~120 lines
   - **Location:** `features/editor/lib/templates/api.ts:114-232`
   - **Issues:**
     - Repetitive code for project/financial/technical mapping
   - **Refactoring:**
     - Extract mapping logic to `mapRequirementToSection(req, category, idx)`
     - Reduce to ~40 lines

4. **`mergeSections()`** - ~100 lines
   - **Location:** `features/editor/lib/templates/api.ts:238-332`
   - **Issues:**
     - Complex merging logic with multiple conditions
   - **Refactoring:**
     - Extract exact match logic to `mergeExactMatch()`
     - Extract fuzzy match logic to `mergeFuzzyMatch()`
     - Extract program-only addition to `addProgramOnlySections()`

---

## Duplicate Code Analysis

### Identified Patterns:

1. **Section/Document Mapping Pattern**
   - **Location:** `loadProgramSections()` - project/financial/technical sections
   - **Issue:** Same mapping logic repeated 3 times
   - **Fix:** Extract to `createSectionFromRequirement(req, category, idx, programId)`

2. **Template to Plan Section Conversion**
   - **Location:** Multiple places in `useEditorStore.ts`
   - **Issue:** Similar conversion logic repeated
   - **Fix:** Extract to `buildSectionFromTemplate()` (already exists, but may need enhancement)

3. **Translation Key Fallbacks**
   - **Location:** Multiple components
   - **Issue:** Same pattern `t('key' as any) || 'fallback'` repeated
   - **Fix:** Create `useTranslation(key, fallback)` hook

4. **Error Handling Patterns**
   - **Location:** Multiple async functions
   - **Issue:** Similar try-catch-error logging patterns
   - **Fix:** Create `withErrorHandling()` wrapper or `useAsyncError()` hook

---

## Functional Programming Opportunities

### Current Issues:

1. **Imperative State Updates**
   - Multiple `setState()` calls in sequence
   - **Fix:** Use functional updates, combine state updates

2. **Side Effects in Components**
   - Multiple `useEffect` hooks with dependencies
   - **Fix:** Extract to custom hooks, use `useMemo`/`useCallback` more

3. **Mutable Data Structures**
   - Direct array/object mutations in some places
   - **Fix:** Use immutable patterns (spread operators, `map`, `filter`)

4. **Complex Conditionals**
   - Nested ternary operators, long if-else chains
   - **Fix:** Extract to functions, use early returns, use lookup objects

---

## Refactoring Priority

### Phase 2.0: Pre-Phase 2 Cleanup (BEFORE Phase 2.1)

**Priority:** 🔴 CRITICAL - Must do before Phase 2.1

1. **Split `useEditorStore.ts`** (2-3 days)
   - Extract hydrate logic to `lib/hydration/planHydration.ts`
   - Split actions into `lib/store/planActions.ts`, `lib/store/uiActions.ts`
   - Keep store as thin orchestrator (~300 lines)

2. **Split `Editor.tsx`** (2-3 days)
   - Extract product config to `components/ProductConfig.tsx`
   - Extract workspace layout to `components/EditorWorkspace.tsx`
   - Extract content area to `components/EditorContent.tsx`
   - Keep Editor as orchestrator (~400 lines)

3. **Refactor `api.ts`** (1 day)
   - Split into: `programLoader.ts`, `templateMerger.ts`, `fileExtractor.ts`
   - Each ~200 lines

4. **Extract Duplicate Code** (1 day)
   - Create `createSectionFromRequirement()` helper
   - Create `useTranslation()` hook
   - Create error handling utilities

**Total Effort:** 6-8 days

### Phase 2.1: Program Connection Fix

**Priority:** 🔴 CRITICAL - After cleanup

- Now that code is cleaner, fix program connection
- Easier to test and debug with smaller files

---

## Testing Requirements

### Before Phase 2.1:

1. **Code Quality Tests**
   - [ ] All files under 600 lines (target: 500)
   - [ ] All functions under 100 lines (target: 50)
   - [ ] No duplicate code patterns
   - [ ] All functions are pure or clearly marked as side-effect functions

2. **Functionality Tests**
   - [ ] Program connection trigger works
   - [ ] All existing features still work after refactoring
   - [ ] No performance regressions

3. **Code Review**
   - [ ] Review all refactored files
   - [ ] Check for proper error handling
   - [ ] Verify TypeScript types are correct
   - [ ] Check for proper memoization

---

## File Size Targets

| File | Current | Target | Status |
|------|---------|--------|--------|
| `Editor.tsx` | 1819 | 500 | 🔴 Needs split |
| `useEditorStore.ts` | 1463 | 500 | 🔴 Needs split |
| `CurrentSelection.tsx` | 1048 | 500 | 🟡 Needs split |
| `api.ts` | 638 | 500 | 🟡 Needs split |
| All other files | <500 | 500 | ✅ OK |

---

## Next Steps

1. **Create refactoring plan for each large file**
2. **Start with `useEditorStore.ts`** (most critical)
3. **Then `Editor.tsx`** (most visible)
4. **Then `api.ts`** (utility functions)
5. **Then `CurrentSelection.tsx`** (if time permits)
6. **Test program connection trigger**
7. **Proceed to Phase 2.1**

---

**Last Updated:** 2024  
**Status:** Ready for refactoring before Phase 2.1

