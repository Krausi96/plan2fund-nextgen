# What We Really Need from Desktop Files

## Quick Summary

### ✅ Already Done (In CurrentSelection):
- **DesktopConfigurator UI** - ✅ Fully merged into CurrentSelection
  - Product selection dropdown
  - Program connection (Program Finder, Paste Link, Upload Template)
  - Requirements checker stats
  - InfoTooltips
  - Template preview dialog

### ❌ Can Delete Now:
- **DesktopConfigurator.tsx** - ✅ Already merged, safe to delete after Desktop.tsx migration

### ⚠️ Need to Keep (But Rename/Move):
- **DesktopEditForm.tsx** - Simple edit form used by Sidebar and DocumentsBar
  - **Action:** Rename to `SectionDocumentEditForm.tsx` and move to `features/editor/components/shared/`
  - **Why:** Used by Sidebar.tsx (line 197) and DocumentsBar.tsx (line 61)
  - **What it does:** Simple form with title/name input and description textarea for editing sections/documents

### 🔄 Need to Move (Template Management):
- **Desktop.tsx** - Template state management logic
  - **Move to:** Editor.tsx
  - **What it does:**
    1. Loads sections/documents from templates API
    2. Manages disabled sections/documents state
    3. Manages custom sections/documents
    4. Exposes state to Sidebar and DocumentsBar
    5. Handles all edit/save/cancel operations

## Detailed Breakdown

### DesktopConfigurator.tsx - DELETE ✅

**Status:** Already fully merged into CurrentSelection.tsx

**What was merged:**
- Product selection dropdown with menu
- Program connection UI (3 methods)
- Requirements checker stats display
- InfoTooltip component
- Template upload and preview dialog
- All handlers and state

**Action:** Delete after Desktop.tsx migration (it's only used by Desktop.tsx)

---

### DesktopEditForm.tsx - KEEP BUT RENAME/MOVE ⚠️

**Current Location:** `features/editor/components/layout/Desktop/DesktopEditForm.tsx`

**New Location:** `features/editor/components/shared/SectionDocumentEditForm.tsx`

**What it does:**
- Simple form component (110 lines)
- Edits section/document title and description
- Used when user clicks "Edit" on a section or document

**Current Usage:**
1. **Sidebar.tsx** (line 197):
   ```typescript
   <DesktopEditForm
     type="section"
     item={editingSection}
     onSave={onSaveSection}
     onCancel={onCancelEdit}
   />
   ```

2. **DocumentsBar.tsx** (line 61):
   ```typescript
   <DesktopEditForm
     type="document"
     item={editingDocument}
     onSave={onSaveDocument}
     onCancel={onCancelEdit}
   />
   ```

**What's needed:**
- ✅ Keep the component (it's simple and works)
- ✅ Rename to `SectionDocumentEditForm.tsx`
- ✅ Move to `features/editor/components/shared/`
- ✅ Update imports in Sidebar.tsx and DocumentsBar.tsx

**What's NOT needed:**
- ❌ No complex logic to extract
- ❌ No state management to move
- ❌ Just a simple form component

---

### Desktop.tsx - MOVE TO EDITOR.TSX 🔄

**Current Location:** `features/editor/components/layout/Desktop/Desktop.tsx`

**What it does (Template Management):**

#### 1. Template Loading
```typescript
// Loads sections and documents based on:
// - productType (submission/review/strategy)
// - programSummary?.id (if program connected)
// - fundingType
useEffect(() => {
  const [loadedSections, loadedDocuments] = await Promise.all([
    getSections(fundingType, productType, programSummary?.id, baseUrl),
    getDocuments(fundingType, productType, programSummary?.id, baseUrl)
  ]);
  setSections(loadedSections);
  setDocuments(loadedDocuments);
}, [productType, programSummary?.id, fundingType]);
```

#### 2. Disabled State Management
```typescript
const [disabledSections, setDisabledSections] = useState<Set<string>>(new Set());
const [disabledDocuments, setDisabledDocuments] = useState<Set<string>>(new Set());

// Restores from plan metadata
// Updates parent via onUpdate callback
```

#### 3. Custom Templates
```typescript
const [customSections, setCustomSections] = useState<SectionTemplate[]>([]);
const [customDocuments, setCustomDocuments] = useState<DocumentTemplate[]>([]);
```

#### 4. Document Selection (for Sidebar filtering)
```typescript
const [productDocumentSelections, setProductDocumentSelections] = useState<Record<ProductType, string | null>>(...);
// Stored in sessionStorage
// Used to filter sections in Sidebar based on selected document
```

#### 5. All Handlers
- `onToggleSection` - Enable/disable section
- `onEditSection` - Start editing section
- `onSaveSection` - Save edited section
- `onCancelEdit` - Cancel editing
- `onAddCustomSection` - Add new custom section
- `onRemoveCustomSection` - Remove custom section
- `onToggleDocument` - Enable/disable document
- `onEditDocument` - Start editing document
- `onSaveDocument` - Save edited document
- `onAddCustomDocument` - Add new custom document
- `onRemoveCustomDocument` - Remove custom document
- `onDocumentSelectionChange` - Filter sidebar when document selected

**What needs to move:**
- ✅ All state variables (sections, documents, disabled, custom)
- ✅ Template loading useEffect
- ✅ All handler functions
- ✅ State management logic
- ✅ Metadata restoration logic
- ✅ onUpdate callback logic

**What's NOT needed:**
- ❌ UI rendering (already hidden, returns null)
- ❌ DesktopConfigurator usage (will be deleted)

**Reference in Editor.tsx:**
- Currently Desktop.tsx exposes state via `onTemplateStateExposed={setTemplateState}` (line 797)
- `templateState` is used in DocumentsBar (line 860) and Sidebar (line 898)
- After migration, Editor.tsx will manage this state directly

---

## CurrentSelection.tsx - Already Simplified ✅

**Status:** Already clean and simplified

**What's in CurrentSelection:**
- ✅ Collapsed view (product, program, sections count, documents count, requirements stats)
- ✅ Expanded overlay with:
  - 3-column explanation section
  - Requirements checker stats
  - Product selection (Plan tab)
  - Program connection (Program tab)
  - All configurator functionality

**What's NOT needed:**
- ❌ No template management (that's Desktop.tsx)
- ❌ No edit forms (that's DesktopEditForm)
- ❌ Already simplified - no further changes needed

---

## Summary Table

| File | Action | Reason |
|------|--------|--------|
| **DesktopConfigurator.tsx** | ✅ DELETE | Already merged into CurrentSelection |
| **DesktopEditForm.tsx** | ⚠️ RENAME & MOVE | Used by Sidebar and DocumentsBar, but rename to `SectionDocumentEditForm.tsx` |
| **Desktop.tsx** | 🔄 MOVE TO EDITOR.TSX | Template management logic needs to be in Editor.tsx |
| **CurrentSelection.tsx** | ✅ KEEP AS IS | Already simplified, no changes needed |

---

## Files Reference

### For Migration:
- **Source:** `features/editor/components/layout/Desktop/Desktop.tsx`
- **Destination:** `features/editor/components/Editor.tsx`
- **Handover Doc:** `docs/HANDOVER-DELETE-DESKTOP-FILES.md`

### For Edit Form:
- **Source:** `features/editor/components/layout/Desktop/DesktopEditForm.tsx`
- **Destination:** `features/editor/components/shared/SectionDocumentEditForm.tsx`
- **Used by:** `Sidebar.tsx`, `DocumentsBar.tsx`

### For CurrentSelection:
- **File:** `features/editor/components/layout/Workspace/Navigation/CurrentSelection.tsx`
- **Status:** ✅ Already simplified, no changes needed

