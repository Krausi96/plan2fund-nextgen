# Editor Architecture Simplification Plan

**Date:** Latest  
**Status:** ✅ Phase 3 Complete - UI State Moved to Zustand Store  
**Next Phase:** Phase 4 - Component Splitting (Optional)

---

## 📊 Current State Analysis

### File Size Status
| File | Lines | Status | Priority |
|------|-------|--------|----------|
| `SectionEditor.tsx` | 395 | ✅ **COMPLETE** | - |
| `Sidebar.tsx` | 846 | ⚠️ Large | MEDIUM |
| `PreviewWorkspace.tsx` | 598 | ⚠️ Large | MEDIUM |
| `Editor.tsx` | 467 | ✅ Good | - |

### Hook Structure Status
- ✅ **Hooks reorganized** with descriptive directory structure
- ✅ **All hooks renamed** with clear, descriptive names
- ✅ **SectionEditor hooks extracted** (6 hooks, 5 components, 1 utility)
- ⚠️ **Editor.tsx hooks** - Keep separate (recommended, not consolidated)

---

## ✅ Phase 1: SectionEditor Split (COMPLETE)

**Goal:** Reduce `SectionEditor.tsx` from 1681 lines to <300 lines

**Result:** ✅ **395 lines (76.5% reduction)**

### What Was Extracted:

#### Hooks (6 total):
1. `useSectionEditorPosition.ts` (~200 lines) - Position management
2. `useSectionEditorDrag.ts` (~100 lines) - Drag & drop
3. `useSectionEditorState.ts` (~150 lines) - State management
4. `useSectionEditorAI.ts` (~600 lines) - AI chat logic
5. `useSectionEditorHandlers.ts` (~80 lines) - Action handlers
6. `useQuestionHighlight.ts` (~40 lines) - Question highlighting

#### Components (5 total):
1. `QuestionEditor.tsx` (~80 lines) - Question display
2. `WelcomeState.tsx` (~65 lines) - Welcome/empty state
3. `SectionEditorHeader.tsx` (~120 lines) - Header with navigation
4. `SkipDialog.tsx` (~80 lines) - Skip dialog
5. `ActionsFooter.tsx` (~40 lines) - Actions footer

#### Utilities (1 total):
1. `fileDropHandler.ts` (~90 lines) - File drop logic

**Total extracted: ~1,645 lines across 13 files**

---

## ✅ Phase 1.5: Hook Reorganization (COMPLETE)

**Goal:** Create descriptive, comprehensible hook directory structure

**Result:** ✅ **Complete - All hooks reorganized with descriptive names**

### New Structure:
```
hooks/
├── core/                                    # Foundation hooks
│   ├── useEditor.ts
│   └── store/
│       ├── index.ts
│       └── types.ts
├── configuration/                           # Configuration domain
│   ├── template-configuration/             # Template config subdomain
│   │   ├── useTemplateConfigurationState.tsx
│   │   ├── useTemplateConfigurationHandlers.ts
│   │   └── useTemplateConfigurationSync.ts
│   └── configurator-ui/                    # Configurator UI subdomain
│       ├── useConfiguratorChangeTracking.ts
│       ├── useConfiguratorOverlayPosition.ts
│       ├── useConfiguratorRequirementsStats.ts
│       └── useConfiguratorStepNavigation.ts
└── editor-behavior/                         # Editor behavior domain
    ├── auto-activation/
    │   └── useEditorAutoActivation.ts
    └── computed-values/
        └── useEditorComputedValues.ts
```

### Renamed Hooks:
- `useTemplateState` → `useTemplateConfigurationState`
- `useTemplateHandlers` → `useTemplateConfigurationHandlers`
- `useTemplateUpdate` → `useTemplateConfigurationSync`
- `useEditorActivation` → `useEditorAutoActivation`
- `useEditorMemos` → `useEditorComputedValues`
- `useChangeTracking` → `useConfiguratorChangeTracking`
- `useOverlayPosition` → `useConfiguratorOverlayPosition`
- `useRequirementsStats` → `useConfiguratorRequirementsStats`
- `useStepNavigation` → `useConfiguratorStepNavigation`

**All imports and function calls updated.**

---

## 🎯 Phase 2: Hook Consolidation (DEFERRED - Not Recommended)

**Status:** ⏸️ **DEFERRED** - Decision made to keep hooks separate

**Reasoning:**
- Each hook has clear single responsibility
- Hooks are small (48-203 lines each)
- Better testability and reusability
- Follows React best practices
- More maintainable than one large hook

**Recommendation:** Skip this phase, proceed to Phase 3

---

## ✅ Phase 3: State Management Optimization (COMPLETE)

**Goal:** Reduce prop drilling and improve state access patterns

**Status:** ✅ **COMPLETE** - UI state moved to Zustand store

**What Was Done:**
- ✅ Added `isConfiguratorOpen` and `editingSectionId` to Zustand store
- ✅ Added `setIsConfiguratorOpen` and `setEditingSectionId` actions
- ✅ Updated `useEditor.ts` to read UI state from store instead of useState
- ✅ All components now access UI state through store (via useEditor hook)

**Benefits Achieved:**
- ✅ Single source of truth for UI state
- ✅ Better performance (selective subscriptions via Zustand)
- ✅ Easier to debug (state centralized in store)
- ✅ Foundation for eliminating prop drilling

**Remaining Work (Optional):**
- Components can be updated to read directly from store instead of receiving props
- `templateState` prop passing can be eliminated in future phase
- Further optimization of component prop interfaces

**Implementation Details:**
1. ✅ Added UI state fields to `EditorStoreState` interface
2. ✅ Added initial state values in store (`isConfiguratorOpen: false`, `editingSectionId: null`)
3. ✅ Added actions to store (`setIsConfiguratorOpen`, `setEditingSectionId`)
4. ✅ Updated `useEditor.ts` to use store instead of `useState`
5. ✅ Updated action selectors to include new actions

---

## ⚠️ CRITICAL CONCERNS BEFORE PHASE 4

### 🚨 Hook Organization & Duplication Issues

**Problem:** The hook structure has grown organically and may contain:
- **Duplicate functionality** across multiple hooks
- **Unclear responsibilities** - hooks that do similar things
- **Inconsistent patterns** - some hooks in `lib/hooks`, some in component-specific `hooks/` folders
- **Too many hooks** - potentially redundant abstractions

**Current Hook Count:**
- `lib/hooks/` - ~15 hooks (core, configuration, editor-behavior)
- Component-specific hooks - ~10+ hooks (Sidebar, Preview, SectionEditor, Documents, etc.)
- **Total: ~25+ hooks** - This seems excessive for the editor functionality

**Investigation Needed:**
1. **Audit all hooks** - Create a comprehensive list with:
   - Purpose/responsibility
   - Dependencies
   - Where they're used
   - Potential duplicates
2. **Identify duplicates** - Look for hooks doing similar things:
   - State management hooks that could be consolidated
   - UI hooks that overlap
   - Data transformation hooks that duplicate logic
3. **Propose consolidation** - Reduce hook count by 30-50% through:
   - Merging similar hooks
   - Moving component-specific hooks to shared location if reusable
   - Eliminating redundant abstractions

### 📁 `lib/` Directory Structure Concerns

**Problem:** The `lib/` directory structure is unclear:
- What belongs in `lib/` vs component-specific folders?
- `lib/hooks/` vs component `hooks/` - when to use which?
- `lib/helpers/` vs `lib/templates/` - unclear boundaries
- Potential duplicate code between `lib/` and components

**Current Structure:**
```
lib/
├── hooks/          # Shared hooks (but also hooks in components/)
├── helpers/        # Helper functions
├── templates/      # Template loading/management
├── types/          # Type definitions
└── constants/      # Constants
```

**Questions to Answer:**
1. Should all hooks be in `lib/hooks/` or keep component-specific ones?
2. Are there duplicate helper functions in `lib/helpers/` and component folders?
3. Is the `lib/templates/` structure optimal or should it be reorganized?
4. Are there conflicting patterns (e.g., multiple ways to do the same thing)?

### 🔧 Build Errors

**Status:** Unknown - needs investigation
- Check for TypeScript compilation errors
- Check for runtime errors
- Verify all imports resolve correctly
- Test that the application builds successfully

---

## 🎯 Phase 4: Component Splitting (DEFERRED - Pending Investigation)

**Goal:** Split large components (Sidebar, PreviewWorkspace) into smaller, focused components

**Status:** ⏸️ **DEFERRED** - Must complete hook audit and cleanup first

### 4.1 Split Sidebar (846 lines → <500 lines)

**Proposed Structure:**
```
Sidebar/
├── Sidebar.tsx (~300 lines) - Main orchestrator
├── components/
│   ├── SectionList.tsx (~200 lines)
│   ├── SectionItem.tsx (~150 lines)
│   ├── SectionManagement.tsx (~150 lines)
│   └── SectionProgress.tsx (~50 lines)
└── hooks/
    └── useSidebar.ts (existing)
```

### 4.2 Split PreviewWorkspace (598 lines → <400 lines)

**Proposed Structure:**
```
PreviewWorkspace/
├── PreviewWorkspace.tsx (~250 lines) - Main orchestrator
├── components/
│   ├── PreviewViewport.tsx (~200 lines)
│   ├── PreviewControls.tsx (~100 lines)
│   └── PreviewScrollManager.tsx (~50 lines)
└── hooks/
    └── usePreview.ts (existing)
```

**Estimated Time:** 4-5 days

---

## 📋 Implementation Roadmap

### ✅ Week 1: Critical Refactoring (COMPLETE)
- ✅ Split SectionEditor - Extract hooks (position, drag, state)
- ✅ Split SectionEditor - Extract components (QuestionEditor, etc.)
- ✅ Reorganize hooks with descriptive structure
- ✅ Rename hooks with descriptive names
- ✅ Update all imports and function calls

### 🔄 Week 2: State Management (NEXT)
- [ ] Add UI state to store
- [ ] Migrate components to use store directly
- [ ] Remove prop drilling
- [ ] Testing & verification

### ⏸️ Week 3: Component Splitting (FUTURE)
- [ ] Split Sidebar component
- [ ] Split PreviewWorkspace component
- [ ] Testing & verification

---

## 🎯 Success Metrics

### Code Quality
- ✅ No file >500 lines (except store/index.ts)
- ✅ Average component size <300 lines
- ✅ Clear, descriptive hook names
- ✅ Organized directory structure

### Performance
- ✅ Reduced re-renders (store subscriptions vs prop changes)
- ✅ Smaller bundle size (better tree-shaking)
- ✅ Faster development (easier to find code)

### Maintainability
- ✅ Clear component boundaries
- ✅ Single responsibility principle
- ✅ Easier testing (smaller units)
- ✅ Better code organization

---

## 📚 Related Documentation

- `docs/HANDOVER-REFACTORING-PHASE2.md` - Detailed handover with current status
- `docs/HANDOVER-REFACTORING-COMPLETE.md` - Previous work completed

---

---

## 🔍 Phase 3.5: Further Simplification & Duplicate Detection (IN PROGRESS)

**Status:** 🔄 **IN PROGRESS** - Hook cleanup complete, duplicate detection needed

### ✅ Completed (Latest Session)

1. **Converted 4 "fake hooks" to helper functions:**
   - ✅ `useConfiguratorRequirementsStats` → `calculateRequirementsStats()` helper
   - ✅ `usePreview` → `preparePreviewProps()` helper
   - ✅ `useSidebar` → `prepareSidebarProps()` helper
   - ✅ `useDocuments` → `prepareDocumentsProps()` helper
   - **Result:** Removed 4 hook files, added `componentPropsHelpers.ts`

2. **Extracted 3 duplicate patterns:**
   - ✅ `getSelectedProductMeta()` - Removed 5 duplicate lookups
   - ✅ `getSelectedDocumentName()` - Removed 2 duplicate calculations
   - ✅ `isAdditionalDocument()` - Removed 3 duplicate checks
   - **Result:** Added to `editorHelpers.ts`, removed ~28 duplicate lines

3. **Fixed infinite loop bug:**
   - ✅ Fixed `setIsConfiguratorOpen` infinite update loop in `CurrentSelection.tsx`

**Current Hook Count:** 18 hooks (down from 22)

---

### 🔄 Next Steps: State Walkthrough & Duplicate Detection

**Critical Task:** Walk through editor states with colleague to identify:
1. **New user state** - What happens when no product is selected?
2. **Configurator state** - How does configurator open/close affect other components?
3. **Preview state** - How does preview interact with section selection?
4. **Section sidebar state** - How does sidebar handle section/document changes?
5. **Document panel state** - How does document selection affect the editor?

**Goal:** Identify duplicate state management logic and unclear data flows.

---

### 🔍 Duplicate Detection Strategies

#### Using grep to find duplicates:

**1. Find duplicate function patterns:**
```bash
# Find all function definitions
grep -r "^export function\|^export const.*=" features/editor/lib --include="*.ts" --include="*.tsx" | sort

# Find duplicate function names
grep -r "^export function" features/editor/lib --include="*.ts" --include="*.tsx" | cut -d: -f2 | sed 's/export function //' | sed 's/(.*//' | sort | uniq -d

# Find similar function bodies (lines 5-15 of each function)
grep -A 10 "^export function" features/editor/lib --include="*.ts" --include="*.tsx" | grep -E "^\s+\w+.*=" | sort | uniq -d
```

**2. Find duplicate logic patterns:**
```bash
# Find duplicate array operations
grep -r "\.filter\|\.map\|\.find\|\.some" features/editor/lib --include="*.ts" --include="*.tsx" | sort

# Find duplicate conditional patterns
grep -r "if.*plan.*metadata\|if.*clickedDocumentId\|if.*selectedProduct" features/editor/lib --include="*.ts" --include="*.tsx" | sort

# Find duplicate object property access
grep -r "plan\.metadata\|plan\.sections\|templateState\." features/editor/lib --include="*.ts" --include="*.tsx" | sort | uniq -c | sort -rn
```

**3. Find duplicate imports/exports:**
```bash
# Find files exporting same things
grep -r "^export" features/editor/lib --include="*.ts" --include="*.tsx" | cut -d: -f2 | sort | uniq -d

# Find duplicate type definitions
grep -r "^export type\|^export interface" features/editor/lib --include="*.ts" --include="*.tsx" | cut -d: -f2 | sort | uniq -d
```

**4. PowerShell-specific commands:**
```powershell
# Find duplicate function names
Get-ChildItem -Path "features\editor\lib" -Recurse -Include "*.ts","*.tsx" | Select-String "^export function" | ForEach-Object { $_.Line -replace 'export function (\w+).*', '$1' } | Group-Object | Where-Object { $_.Count -gt 1 }

# Find files with similar content (same imports)
Get-ChildItem -Path "features\editor\lib" -Recurse -Include "*.ts","*.tsx" | ForEach-Object { Get-Content $_.FullName | Select-String "^import" } | Group-Object Line | Where-Object { $_.Count -gt 1 } | Sort-Object Count -Descending
```

**5. Find duplicate constants:**
```bash
# Find duplicate constant definitions
grep -r "^export const.*=" features/editor/lib --include="*.ts" --include="*.tsx" | cut -d: -f2 | sort | uniq -d
```

---

### 📋 Files to Review for Duplicates

**High Priority:**
- `lib/helpers/editorHelpers.ts` (474 lines) - Check for duplicate logic
- `lib/hooks/core/useEditor.ts` (704 lines) - Check for duplicate state management
- `lib/hooks/configuration/template-configuration/useTemplateConfigurationState.tsx` (442 lines) - Check for duplicate calculations

**Medium Priority:**
- `lib/templates/` - Check for duplicate template loading logic
- `lib/types/` - Check for duplicate type definitions

---

**Last Updated:** Latest  
**Status:** ✅ Phase 1-3 Complete | 🔄 Phase 3.5 In Progress - Duplicate Detection & State Walkthrough Needed

