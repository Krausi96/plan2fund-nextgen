# Migration Status: Types, Hooks, Domains

**Question:** What from `domains`, `types`, `hooks` is not migrated yet? Or should we keep that?

---

## 📊 ANALYSIS

### **1. HOOKS** (`features/editor/lib/hooks/`)
**File:** `useEditorHandlers.ts`

**Status:** ⚠️ **NOT USED - CAN DELETE**
- Provides `useToggleHandlers()` and `useEditHandlers()`
- Comments say "Used by: useEditorState.ts" (which was deleted in Phase 10)
- **Current Usage:** NONE found in codebase
- **Action:** ✅ **DELETE** - Dead code from old editor store

---

### **2. TYPES** (`features/editor/lib/types/`)

#### **Status: PARTIALLY CONSOLIDATED**

| Type File | Contents | Current Usage | Action |
|-----------|----------|---|---|
| `core/product-types.ts` | `ProductType`, `ProductOption` | ✅ Used by TreeNavigator | **KEEP** for now |
| `core/template-types.ts` | Template types | Not checked | **KEEP for UI** |
| `documents/document-types.ts` | `PlanDocument`, `PlanSection` | ✅ Used by LivePreviewBox | **KEEP for UI** |
| `program/program-types.ts` | `FundingProgram`, `DocumentStructure` | ✅ Used in utils | **KEEP for UI** |
| `workflow/setup-types.ts` | Setup wizard types | Used in old flow | **REVIEW** |
| `ui/ui-components.ts` | `EditHandlers`, `ToggleHandlers` | Referenced but hooks deleted | **CHECK** |
| `ui/navigation-types.ts` | `TreeNode` | ✅ Used by TreeNavigator | **KEEP** |
| `ai/ai-types.ts` | `ConversationMessage` | Likely used | **KEEP** |
| `ai/diagnostics-types.ts` | Diagnostic types | Likely used | **KEEP** |

#### **Key Finding:**
- **`types.ts` (barrel export)** - Still valid, used by components
- **Consolidated to `platform/core/types/`:** Already done for:
  - Blueprint types
  - Program types  
  - Project types
- **Still in features (UI-only):** ProductType, DocumentTemplate, PlanDocument, TreeNode

**Verdict:** ✅ **KEEP** - These are UI-layer types needed by editor components

---

### **3. DOMAINS** (`features/editor/lib/store/domains/`)

#### **5 Files, ALL OBSOLETE**

| Domain | Purpose | Migrated To | Action |
|--------|---------|---|---|
| `planDomain.ts` | Plan state management | ✅ `platform/core/store/useProjectStore` | **DELETE** |
| `programDomain.ts` | Program state | ✅ `useProjectStore` | **DELETE** |
| `setupWizardDomain.ts` | Setup wizard state | ✅ `useProjectStore` | **DELETE** |
| `templateDomain.ts` | Template state | ✅ `useProjectStore` | **DELETE** |
| `uiDomain.ts` | UI state (toggles, etc.) | ✅ `useProjectStore` | **DELETE** |

**Evidence:**
- Phase 10 deleted the old editor store
- All state consolidated into `useProjectStore`
- No imports found for these domain files
- Comments reference "useEditorState.ts" (deleted)

**Verdict:** ❌ **DELETE ALL** - Fully replaced by `useProjectStore`

---

## 🎯 ACTION PLAN

### **IMMEDIATE (Delete Now)**

```bash
# Domains - all 5 files
rm features/editor/lib/store/domains/planDomain.ts
rm features/editor/lib/store/domains/programDomain.ts
rm features/editor/lib/store/domains/setupWizardDomain.ts
rm features/editor/lib/store/domains/templateDomain.ts
rm features/editor/lib/store/domains/uiDomain.ts
rmdir features/editor/lib/store/domains/

# Hooks - dead code
rm features/editor/lib/hooks/useEditorHandlers.ts
rmdir features/editor/lib/hooks/
```

### **LATER (Keep for Now)**

Keep the entire `features/editor/lib/types/` directory because:
- UI components still need `TreeNode`, `PlanDocument`, `ProductType`
- These are NOT in `platform/core/types` (those are business model types)
- These are UI-specific type definitions

---

## 📁 FINAL STRUCTURE

After cleanup:

```
features/editor/lib/
├── types/                      ✅ KEEP (UI types)
│   ├── core/
│   ├── documents/
│   ├── program/
│   ├── ui/
│   ├── ai/
│   └── types.ts
├── hooks/                      ✅ KEEP (any remaining UI hooks)
├── templates/                  ✅ KEEP (template data)
├── constants.ts                ✅ KEEP
├── renderers.ts                ✅ KEEP
└── index.ts                    ✅ KEEP

# DELETED:
# ❌ store/domains/*            (all 5 files + directory)
# ❌ hooks/useEditorHandlers.ts (if no other hooks exist)
```

---

## ✅ SUMMARY

| Item | Keep/Delete | Reason |
|------|---|---|
| **domains/** | ❌ DELETE | All state in useProjectStore |
| **hooks/useEditorHandlers.ts** | ❌ DELETE | Dead code, no usage |
| **types/** | ✅ KEEP | UI-layer type definitions still needed |

**Next Step:** Delete domains and hooks, then run TypeScript check to ensure no broken imports.
