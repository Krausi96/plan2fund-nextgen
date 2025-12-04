# Handover: Delete Desktop Files & Simplify CurrentSelection

## 🎯 Goal

Delete all Desktop-related files and move template management logic to Editor.tsx, simplifying the architecture.

## 📋 Current State

### Files to Delete (After Migration):
1. `features/editor/components/layout/Desktop/Desktop.tsx` - Template management logic
2. `features/editor/components/layout/Desktop/DesktopConfigurator.tsx` - Already merged into CurrentSelection
3. `features/editor/components/layout/Desktop/DesktopEditForm.tsx` - Simple edit form (see below)

### Files to Keep/Refactor:
- `features/editor/components/layout/Desktop/DesktopEditForm.tsx` - **KEEP BUT RENAME/MOVE**
  - Simple form component for editing sections/documents
  - Used by: `Sidebar.tsx` and `DocumentsBar.tsx`
  - **Action:** Rename to `SectionDocumentEditForm.tsx` and move to `features/editor/components/shared/`

## 🔍 What Each File Does

### Desktop.tsx (DELETE AFTER MIGRATION)
**Purpose:** Template state management (hidden UI, only manages state)

**Key Responsibilities:**
1. **Loads templates** - Calls `getSections()` and `getDocuments()` based on product type and program
2. **Manages disabled state** - Tracks which sections/documents are disabled
3. **Manages custom templates** - Tracks user-created custom sections/documents
4. **Exposes template state** - Via `onTemplateStateExposed` callback to Editor.tsx
5. **Notifies parent** - Calls `onUpdate` when disabled/custom state changes
6. **Document selection** - Manages which document is selected (for sidebar filtering)

**Current Usage:**
- Used in `Editor.tsx` line 783 with `hideConfigurator={true}`
- Returns `null` (no UI), but all hooks still run to manage state
- Exposes state via `onTemplateStateExposed={setTemplateState}`

**What Needs to Move:**
- All template loading logic (useEffect with getSections/getDocuments)
- Disabled sections/documents state management
- Custom sections/documents state management
- Document selection state (for sidebar filtering)
- All handlers (onToggleSection, onEditSection, onSaveSection, etc.)

### DesktopConfigurator.tsx (CAN DELETE NOW)
**Status:** ✅ Already merged into `CurrentSelection.tsx`
- All UI logic is now in CurrentSelection
- Only used by Desktop.tsx (which will be deleted)
- **Safe to delete** after Desktop.tsx migration

### DesktopEditForm.tsx (KEEP BUT RENAME)
**Purpose:** Simple form for editing section/document title and description

**What it does:**
- Simple form with title/name input and description textarea
- Used when editing sections in Sidebar or documents in DocumentsBar
- Very lightweight, no complex logic

**Current Usage:**
- `Sidebar.tsx` line 197 - For editing sections
- `DocumentsBar.tsx` line 61 - For editing documents

**Action Required:**
1. Rename to `SectionDocumentEditForm.tsx`
2. Move to `features/editor/components/shared/`
3. Update imports in Sidebar.tsx and DocumentsBar.tsx

## 📐 What's Really Needed from Configuration

### From DesktopConfigurator (Already in CurrentSelection):
✅ **KEEP:**
- Product selection dropdown
- Program connection (Program Finder, Paste Link, Upload Template)
- Requirements checker stats display
- InfoTooltips for explanations
- Template preview dialog

❌ **NOT NEEDED:**
- Nothing - all essential features are already in CurrentSelection

### From Desktop.tsx Template Management:
✅ **MUST MOVE:**
1. **Template Loading:**
   ```typescript
   // Loads sections and documents based on:
   // - productType (submission/review/strategy)
   // - programSummary?.id (if program connected)
   // - fundingType
   const [sections, setSections] = useState<SectionTemplate[]>([]);
   const [documents, setDocuments] = useState<DocumentTemplate[]>([]);
   ```

2. **Disabled State:**
   ```typescript
   const [disabledSections, setDisabledSections] = useState<Set<string>>(new Set());
   const [disabledDocuments, setDisabledDocuments] = useState<Set<string>>(new Set());
   ```

3. **Custom Templates:**
   ```typescript
   const [customSections, setCustomSections] = useState<SectionTemplate[]>([]);
   const [customDocuments, setCustomDocuments] = useState<DocumentTemplate[]>([]);
   ```

4. **Document Selection (for Sidebar filtering):**
   ```typescript
   const [productDocumentSelections, setProductDocumentSelections] = useState<Record<ProductType, string | null>>(...);
   ```

5. **All Handlers:**
   - `onToggleSection`, `onEditSection`, `onSaveSection`, `onCancelEdit`
   - `onToggleDocument`, `onEditDocument`, `onSaveDocument`
   - `onAddCustomSection`, `onRemoveCustomSection`
   - `onAddCustomDocument`, `onRemoveCustomDocument`
   - `onDocumentSelectionChange` (for sidebar filtering)

## 🚀 Migration Plan

### Step 1: Move Template Management to Editor.tsx

**Location:** `features/editor/components/Editor.tsx`

**What to do:**
1. Extract all template management logic from `Desktop.tsx` (lines ~150-900)
2. Move to Editor.tsx as:
   - State variables
   - useEffect hooks for loading templates
   - Handler functions
   - State management logic

**Key Functions to Move:**
- Template loading (getSections, getDocuments)
- Disabled state management
- Custom template management
- Document selection management
- All edit/save/cancel handlers

**Reference:**
- Current template state is in `Editor.tsx` line 380: `const [templateState, setTemplateState] = useState<{...}>(null);`
- This is populated by Desktop.tsx via `onTemplateStateExposed={setTemplateState}`
- After migration, Editor.tsx will manage this state directly

### Step 2: Update Sidebar and DocumentsBar

**Files:**
- `features/editor/components/layout/Workspace/Navigation/Sidebar.tsx`
- `features/editor/components/layout/Workspace/Content/DocumentsBar.tsx`

**What to do:**
1. Update imports to get template state from Editor.tsx props (instead of templateState)
2. Update DesktopEditForm import to new location:
   ```typescript
   // OLD:
   import { DesktopEditForm } from '@/features/editor/components/layout/Desktop/DesktopEditForm';
   
   // NEW:
   import { SectionDocumentEditForm } from '@/features/editor/components/shared/SectionDocumentEditForm';
   ```

### Step 3: Remove Desktop.tsx Usage

**File:** `features/editor/components/Editor.tsx`

**What to do:**
1. Remove `TemplateOverviewPanel` import (line 10)
2. Remove `TemplateOverviewPanel` usage (line 783-799)
3. Replace with direct template management logic

### Step 4: Delete Files

**Files to delete:**
1. ✅ `features/editor/components/layout/Desktop/Desktop.tsx`
2. ✅ `features/editor/components/layout/Desktop/DesktopConfigurator.tsx`
3. ⚠️ `features/editor/components/layout/Desktop/DesktopEditForm.tsx` - **ONLY AFTER RENAMING/MOVING**

### Step 5: Simplify CurrentSelection

**File:** `features/editor/components/layout/Workspace/Navigation/CurrentSelection.tsx`

**What can be simplified:**
- CurrentSelection is already simplified (DesktopConfigurator merged)
- No further simplification needed - it's clean now

## 📚 Reference Files

### For Template Management Logic:
- **Source:** `features/editor/components/layout/Desktop/Desktop.tsx`
  - Lines 150-900: All template management logic
  - Lines 193-218: Template loading (getSections, getDocuments)
  - Lines 220-261: Restore from metadata
  - Lines 263-349: Notify parent of changes
  - Lines 350-900: All handlers and state management

### For Current Implementation:
- **Editor.tsx:** `features/editor/components/Editor.tsx`
  - Line 380: `templateState` - where Desktop exposes state
  - Line 783-799: `TemplateOverviewPanel` usage
  - Line 860-915: How templateState is used in DocumentsBar and Sidebar

### For Edit Form:
- **DesktopEditForm.tsx:** `features/editor/components/layout/Desktop/DesktopEditForm.tsx`
  - Simple 110-line component
  - Just needs renaming and moving

### Documentation:
- **Design Spec:** `docs/CLARIFICATION-QUESTIONS-AND-VISUALS.md`
- **Z-Index Hierarchy:** `docs/Z-INDEX-HIERARCHY.md`
- **Configurator Review:** `docs/HANDOVER-CONFIGURATOR-OVERLAY-REVIEW.md`
- **What We Need:** `docs/WHAT-WE-NEED-FROM-DESKTOP.md` (this file's companion)

## ✅ Success Criteria

After migration:
- [ ] Desktop.tsx deleted
- [ ] DesktopConfigurator.tsx deleted
- [ ] DesktopEditForm.tsx renamed and moved to shared/
- [ ] Editor.tsx manages template state directly
- [ ] Sidebar and DocumentsBar get template state from Editor.tsx props
- [ ] All imports updated
- [ ] No build errors
- [ ] Template management still works (sections/documents load, can be disabled, custom templates work)
- [ ] Edit forms still work in Sidebar and DocumentsBar

## 🔧 Testing Checklist

After migration, test:
- [ ] Sections load correctly based on product type
- [ ] Documents load correctly based on product type
- [ ] Disabling sections works
- [ ] Disabling documents works
- [ ] Adding custom sections works
- [ ] Adding custom documents works
- [ ] Editing sections in Sidebar works
- [ ] Editing documents in DocumentsBar works
- [ ] Document selection filters sidebar correctly
- [ ] Template state persists correctly

## 📝 Notes

- Desktop.tsx currently returns `null` when `hideConfigurator={true}`, but all hooks still run
- Template state is exposed via `onTemplateStateExposed` callback
- Document selection is stored in sessionStorage (DOCUMENT_SELECTION_STORAGE_KEY)
- Custom templates are stored in plan metadata
- Disabled state is stored in plan metadata

---

**Priority:** HIGH  
**Estimated Time:** 2-3 hours  
**Complexity:** Medium (straightforward refactor, but many moving parts)
