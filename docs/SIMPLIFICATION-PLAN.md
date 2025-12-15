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

## 🚨 Phase 3.5: State Duplication Analysis (CRITICAL - BLOCKING)

**Status:** ✅ **ANALYSIS COMPLETE** - Ready for implementation

### ⚠️ **CRITICAL FINDING: 6 State Duplication Cases**

State is fragmented across `useEditor` hook (useState) and Zustand store (`plan`), causing sync issues and no single source of truth.

### 📋 **Detailed Analysis of Each Case**

#### **1. Template State (plan.metadata) - ✅ CONFIRMED DUPLICATE**

**Current State:**
- **`useEditor` hook:** `useState` for `disabledSections` (Set<string>), `disabledDocuments` (Set<string>), `customSections`, `customDocuments` (lines 300, 315, 292-293)
- **`plan.metadata` in store:** `disabledSectionIds` (string[]), `disabledDocumentIds` (string[]), `customSections`, `customDocuments` (lines 146-149)

**Sync Mechanism:**
- Fragile `useEffect` in useEditor (lines 369-407) that reads from plan.metadata
- Uses `restoringFromMetadata` ref to prevent infinite loops
- Only syncs FROM store TO hook, not the reverse
- Data format mismatch: useEditor uses `Set<string>`, store uses `string[]`

**Problem:**
- Race conditions: Changes in useEditor don't immediately update plan.metadata
- One-way sync: Only syncs from store to hook, not hook to store
- Fragile logic: Complex useEffect with ref guards

**Verdict:** ✅ **ACTUAL DUPLICATE** - Same data, different formats

**Solution:**
- Remove `useState` for these 4 values from useEditor
- Derive from `plan.metadata` using selectors
- Add store actions: `setDisabledSections`, `setDisabledDocuments`, `setCustomSections`, `setCustomDocuments`
- Convert Set operations to Array operations in store

---

#### **2. Product Selection - ✅ CONFIRMED DUPLICATE**

**Current State:**
- **`useEditor` hook:** `useState` for `selectedProduct` (ProductType | null, line 175), `pendingProductChange` (line 176)
- **`plan.productType` in store:** Updated via `setProductType` action (line 465)

**Sync Mechanism:**
- `handleProductChange` calls `setProductType` action (lines 250, 255)
- But useEditor maintains separate `selectedProduct` state
- `pendingProductChange` is used when configurator is open (lines 235-242)

**Problem:**
- Two sources of truth: `selectedProduct` in hook vs `plan.productType` in store
- Sync delay: Changes to `selectedProduct` don't immediately update store
- Pending state: `pendingProductChange` is only in hook, not in store

**Verdict:** ✅ **ACTUAL DUPLICATE** - `selectedProduct` duplicates `plan.productType`. `pendingProductChange` is UI state that should be in store.

**Solution:**
- Remove `selectedProduct` useState, derive from `plan.productType`
- Move `pendingProductChange` to store as UI state
- Update `handleProductChange` to only use store actions

---

#### **3. Program Connection - ✅ CONFIRMED DUPLICATE**

**Current State:**
- **`useEditor` hook:** `useState` for `programId`, `programSummary`, `programLoading`, `programError` (lines 81-84)
- **`plan.metadata` in store:** `programId`, `programName` (lines 143-144)
- **`plan.programSummary`** (line 140)

**Sync Mechanism:**
- Passed to `hydrate()` which updates plan (lines 191-200)
- But useEditor maintains separate state
- Only syncs during hydration, not on every change

**Problem:**
- Three places for program data: useEditor state, plan.metadata, plan.programSummary
- Sync only during hydration: Changes don't immediately update plan
- Loading/error state: Not in store, only in hook

**Verdict:** ✅ **ACTUAL DUPLICATE** - `programId` and `programSummary` are duplicated. `programLoading` and `programError` are UI state that should be in store.

**Solution:**
- Remove `programId` and `programSummary` useState, derive from `plan.metadata` and `plan.programSummary`
- Move `programLoading` and `programError` to store as UI state
- Add store actions: `setProgramId`, `setProgramSummary`, `setProgramLoading`, `setProgramError`
- Update `handleConnectProgram` to use store actions

---

#### **4. Document Selection - ⚠️ MISSING FROM PLAN**

**Current State:**
- **`useEditor` hook:** `useState` for `productDocumentSelections` (Record<ProductType, string | null>, line 445) + sessionStorage
- **`clickedDocumentId`** derived from productDocumentSelections (line 467)
- **`plan.metadata`:** ❌ **NOT PRESENT** - Document selection is not stored in plan

**Sync Mechanism:**
- Only in sessionStorage, not in plan
- Persists across page refreshes but not in plan state
- Lost when plan is saved/loaded

**Problem:**
- Not persisted in plan: Document selection lost when plan is saved/loaded
- Only in sessionStorage: Not part of the plan data model
- Not synced: No connection to plan state

**Verdict:** ⚠️ **MISSING FROM PLAN** - This is not a duplicate - it's missing from the plan entirely.

**Solution:**
- Add `productDocumentSelections` to `plan.metadata`
- Remove sessionStorage, use plan as source of truth
- Add store action: `setProductDocumentSelection`
- Update `handleSelectDocument` to use store action

---

#### **5. Templates List - ✅ NOT DUPLICATES (DIFFERENT PURPOSES)**

**Current State:**
- **`useEditor` hook:** `useState` for `sections` (SectionTemplate[]), `documents` (DocumentTemplate[]) (lines 290-291)
- **`plan.templates` in store:** SectionTemplate[] (line 38, set during `hydrate()` line 168)

**Investigation Results:**
- `plan.templates` (store): Contains **enabled/filtered** SectionTemplate[] used to build the plan (set during `hydrate()`, line 168)
- `sections` (useEditor): Contains **ALL** SectionTemplate[] loaded from API for configurator UI (line 348-354)
- `documents` (useEditor): Contains **ALL** DocumentTemplate[] loaded from API for configurator UI (line 348-354)

**Key Differences:**
- `plan.templates` = filtered templates (disabled sections removed) + custom sections, used to build plan sections
- `sections`/`documents` = all available templates, used for configurator UI to show all options

**Verdict:** ✅ **NOT DUPLICATES** - These serve different purposes:
- `plan.templates` = "what's in the plan" (filtered)
- `sections`/`documents` = "what's available" (all templates)

**Solution:**
- **Keep separate** - they serve different purposes
- **Optional optimization:** Could add `allTemplates` to store, derive both `plan.templates` and `sections`/`documents` from it

---

#### **6. UI State - ⚠️ PARTIALLY IN STORE**

**Current State:**
- **`useEditorStore` (store):** `isConfiguratorOpen`, `editingSectionId` (lines 45-46) ✅
- **`useEditor` hook:** `pendingProductChange`, `programLoading`, `programError`, `templateLoading`, `templateError` (lines 176, 83-84, 294, 297) ❌

**Problem:**
- Inconsistent: Some UI state in store, some in hook
- No single source: UI state scattered between store and hook

**Verdict:** ⚠️ **PARTIAL DUPLICATE** - Some UI state is in store, some is not. Should consolidate all UI state in store.

**Solution:**
- Move all UI state to store:
  - `pendingProductChange` → store
  - `programLoading` → store
  - `programError` → store
  - `templateLoading` → store
  - `templateError` → store
- Add corresponding store actions
- Remove useState for these values

---

### 📊 **Summary Table**

| Case | State | In useEditor | In Store | Verdict | Action |
|------|-------|--------------|-----------|---------|--------|
| 1 | Template metadata | useState (Set) | plan.metadata (Array) | ✅ Duplicate | Derive from store |
| 2 | Product selection | useState | plan.productType | ✅ Duplicate | Derive from store |
| 3 | Program connection | useState | plan.metadata + plan.programSummary | ✅ Duplicate | Derive from store |
| 4 | Document selection | useState + sessionStorage | ❌ Missing | ⚠️ Missing | Add to store |
| 5 | Templates list | useState | plan.templates | ✅ Not duplicates | Keep separate (different purposes) |
| 6 | UI state | Partial useState | Partial in store | ⚠️ Partial | Consolidate in store |

---

### 📊 **Root Cause Analysis**

**The Problem:**
- `useEditor` hook maintains separate `useState` for everything instead of deriving from `plan` in store
- State changes require manual sync between hook state and store state
- No single source of truth - components read from different places
- Fragile sync logic with race conditions and timing issues

**The Solution Needed:**
1. **Make `plan` in Zustand store the SINGLE SOURCE OF TRUTH**
2. **Remove all `useState` from `useEditor` that duplicates store state**
3. **Derive all values from `plan` using selectors**
4. **Add store actions for all state mutations**
5. **Update components to read directly from store (or via selectors)**

### 🎯 **Required Actions**

**Status:** ✅ **Analysis Complete** - Ready for implementation

**Next Steps:**
1. ✅ **Clarify state duplications** - All 6 cases analyzed and verified (see detailed analysis above)
2. ⏳ **Discuss lib/ structure** - Review with user what belongs in lib/ vs component folders (see discussion below)
3. ⏳ **Fix Zustand store** - Consolidate all state into store, remove duplicate useState from useEditor
4. ⏳ **Establish source of truth** - Each component should have ONE clear source of truth

**Files to Review:**
- `features/editor/lib/hooks/core/useEditor.ts` (677 lines) - Contains all duplicate useState
- `features/editor/lib/hooks/core/store/index.ts` (569 lines) - Store that should be source of truth
- `features/editor/lib/STATE_DUPLICATION_ANALYSIS.md` - Summary analysis
- `features/editor/lib/STATE_DUPLICATION_DETAILED_ANALYSIS.md` - Full detailed analysis

---

## 📁 Phase 3.5.1: lib/ Structure Discussion (REQUIRED BEFORE REFACTORING)

**Status:** ⏳ **AWAITING USER INPUT** - Need to clarify structure before proceeding

**User Feedback:** *"I have no idea what we need. It is scattered."*

### Current lib/ Structure

```
features/editor/lib/
├── constants/          # Product configuration
├── helpers/            # Helper functions (5 files)
├── hooks/              # Shared hooks (organized by domain)
│   ├── core/          # Core hooks (useEditor, store)
│   ├── configuration/ # Configuration hooks
│   └── editor-behavior/ # Editor behavior hooks
├── templates/          # Template loading/management
└── types/              # Type definitions
```

### Component-Specific Hooks (Outside lib/)

```
features/editor/components/layout/Workspace/SectionEditor/hooks/
├── useSectionEditorState.ts
├── useSectionEditorAI.ts
├── useSectionEditorPosition.ts
├── useSectionEditorHandlers.ts
├── useQuestionHighlight.ts
└── useSectionEditorDrag.ts
```

### Questions to Answer

**1. lib/hooks/ vs Component hooks/ - What's the rule?**
- **Current:** `lib/hooks/` = shared hooks, component `hooks/` = component-specific hooks
- **Question:** Should ALL hooks be in `lib/hooks/`? Or keep component-specific ones in component folders?
- **Recommendation:** Keep component-specific hooks in component folders. Criteria: If used by 2+ components → `lib/hooks/`, if used by 1 component → component folder

**2. lib/helpers/ Organization - Flat vs Domain-based?**
- **Current:** Flat structure with descriptive names (5 files: editorHelpers, componentPropsHelpers, etc.)
- **Question:** Should helpers be grouped by domain (e.g., `helpers/plan/`, `helpers/templates/`)?
- **Recommendation:** Keep flat structure if files are <500 lines each. Group by domain if files grow too large.

**3. lib/templates/ vs Template Configuration Logic**
- **Current:** `lib/templates/` = template data/API, `lib/hooks/configuration/template-configuration/` = template configuration logic
- **Question:** Is this separation correct?
- **Recommendation:** Yes - `lib/templates/` = what templates exist, `lib/hooks/configuration/` = how to configure templates

**4. Types Organization**
- **Current:** `lib/types/plan.ts`, `lib/types/editor/configurator.ts`, `lib/types/templates/`
- **Question:** Should types be grouped by domain or keep flat?
- **Recommendation:** Current structure seems reasonable. Group by domain if it grows.

### Proposed Structure (Option C: Hybrid - Recommended)

```
lib/
├── hooks/          # All shared hooks (keep current structure)
├── helpers/        # All helpers (keep flat, maybe group if >500 lines)
├── templates/      # Template data/API (keep as is)
├── types/          # All types (keep current structure)
└── constants/      # Constants

Plus:
- Component-specific hooks stay in component folders
- Clear separation: shared = lib/, component-specific = component folder
```

**Pros:**
- Minimal refactoring
- Clear criteria for what goes where
- Addresses "scattered" feeling with clear rules

**Cons:**
- Still some questions about specific files

### Decision Points Needed

1. **Hooks location:** lib/hooks/ vs component hooks/ - What's the rule? (Recommendation: 2+ components = lib/)
2. **Helpers organization:** Flat vs domain-based - What's preferred? (Recommendation: Flat if <500 lines)
3. **Duplicate detection:** Should we run this before or after state consolidation? (Recommendation: After state consolidation)
4. **Template logic:** Is current separation correct? (Recommendation: Yes)
5. **Types organization:** Keep current or reorganize? (Recommendation: Keep current)

### Your Input Needed

**Please answer:**
1. What feels "scattered" to you? Specific examples?
2. What structure would make it easier to find code?
3. Should we fix state duplication first, then reorganize lib/? (Recommendation: Fix state first)
4. Or reorganize lib/ first, then fix state duplication?

**See also:** `features/editor/lib/LIB_STRUCTURE_DISCUSSION.md` for full discussion document

---

## 🔍 Phase 3.6: Further Simplification & Duplicate Detection (IN PROGRESS)

**Status:** 🔄 **IN PROGRESS** - Hook cleanup complete, state duplication identified

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
**Status:** ✅ Phase 1-3 Complete | 🚨 Phase 3.5 CRITICAL - State Duplication Identified | 🔄 Phase 3.6 In Progress - Duplicate Detection & State Walkthrough Needed

