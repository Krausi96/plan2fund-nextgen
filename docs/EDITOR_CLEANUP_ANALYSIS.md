# Editor Folder Structure - Cleanup Analysis

**Date:** 2025-01-XX  
**Purpose:** Analyze current structure, identify unused files, propose clean structure

---

## Current Structure

```
features/editor/
├── components/
│   ├── Editor.tsx                    ✅ ACTIVE - Main editor component
│   ├── ProductSelectionModal.tsx     ❌ UNUSED - Not imported anywhere
│   ├── ProgramSelector.tsx           ❌ UNUSED - Not imported anywhere
│   ├── RequirementsModal.tsx         ✅ ACTIVE - Used in Editor.tsx
│   ├── SectionContentRenderer.tsx    ✅ ACTIVE - Used in Editor.tsx
│   └── SimpleTextEditor.tsx          ✅ ACTIVE - Used in Editor.tsx
│
├── engine/
│   ├── aiHelper.ts                   ✅ ACTIVE - Used in Editor.tsx
│   └── categoryConverters.ts         ✅ ACTIVE - Used in reco engine (enhancedRecoEngine.ts)
│
├── hooks/
│   └── useSectionProgress.ts         ✅ ACTIVE - Used in Editor.tsx
│
├── prompts/
│   └── sectionPrompts.ts             ❌ UNUSED - Not imported anywhere
│
├── templates/
│   ├── ARCHITECTURE.md               📄 DOCS - Keep for reference
│   ├── data.ts                       ✅ ACTIVE - Exported via index.ts
│   ├── documents.ts                  ✅ ACTIVE - Exported via index.ts
│   ├── index.ts                      ✅ ACTIVE - Main export file
│   ├── README.md                     📄 DOCS - Keep for reference
│   ├── sections.ts                   ✅ ACTIVE - Exported via index.ts
│   ├── templateKnowledge.ts          ✅ ACTIVE - Exported via index.ts
│   └── types.ts                      ✅ ACTIVE - Exported via index.ts
│
├── types/
│   ├── editor.ts                     ❌ UNUSED - Not imported anywhere
│   └── plan.ts                       ✅ ACTIVE - Used in Editor.tsx
│
├── utils/
│   └── tableInitializer.ts           ✅ ACTIVE - Used in Editor.tsx
│
└── README.md                         📄 DOCS - Keep for reference
```

---

## Detailed Analysis

### ✅ ACTIVE FILES (Keep)

#### Components
1. **Editor.tsx** - Main editor component, entry point
2. **RequirementsModal.tsx** - Requirements checker modal
3. **SectionContentRenderer.tsx** - Renders tables/charts for sections
4. **SimpleTextEditor.tsx** - Plain text editor component

#### Engine
1. **aiHelper.ts** - AI generation and prompt building

#### Hooks
1. **useSectionProgress.ts** - Calculates section completion progress

#### Templates
1. **index.ts** - Main template registry (exports everything)
2. **sections.ts** - Master section templates
3. **data.ts** - Template data aggregator
4. **documents.ts** - Document templates
5. **templateKnowledge.ts** - Template knowledge base
6. **types.ts** - Template type definitions

#### Types
1. **plan.ts** - Plan document and section types

#### Utils
1. **tableInitializer.ts** - Initializes tables for sections

---

### ❌ UNUSED FILES (Can be removed)

1. **ProductSelectionModal.tsx**
   - **Status:** Not imported anywhere
   - **Reason:** Editor now uses product selector in header (dropdown)
   - **Action:** DELETE

2. **ProgramSelector.tsx**
   - **Status:** Not imported anywhere
   - **Reason:** Editor now uses ProgramFinderModal (generates programs on-demand)
   - **Action:** DELETE

3. **prompts/sectionPrompts.ts**
   - **Status:** Not imported anywhere
   - **Reason:** Prompts now come from `sectionTemplate.prompts` in templates
   - **Action:** DELETE

4. **types/editor.ts**
   - **Status:** Not imported anywhere
   - **Reason:** Contains unused unified editor types (Editor.tsx uses plan.ts types)
   - **Action:** DELETE

---

### ✅ ACTIVE (Used by other features)

1. **engine/categoryConverters.ts**
   - **Status:** Used by reco engine (`features/reco/engine/enhancedRecoEngine.ts`)
   - **Used for:** Converting categorized requirements to editor/library formats
   - **Action:** KEEP - Required by reco system

---

### 📄 DOCUMENTATION (Keep)

1. **README.md** - Editor documentation
2. **templates/README.md** - Template system documentation
3. **templates/ARCHITECTURE.md** - Template architecture docs

---

## Proposed Clean Structure

```
features/editor/
├── components/                    # UI Components
│   ├── Editor.tsx                # Main editor (entry point)
│   ├── RequirementsModal.tsx     # Requirements checker
│   ├── SectionContentRenderer.tsx # Tables/charts renderer
│   └── SimpleTextEditor.tsx      # Text editor component
│
├── engine/                       # AI & Business Logic
│   └── aiHelper.ts               # AI generation engine
│
├── hooks/                        # React Hooks
│   └── useSectionProgress.ts    # Progress calculation
│
├── templates/                    # Template System
│   ├── index.ts                 # Main export (registry)
│   ├── sections.ts              # Master section templates
│   ├── documents.ts            # Document templates
│   ├── templateKnowledge.ts    # Template knowledge base
│   ├── data.ts                 # Data aggregator
│   └── types.ts                # Template types
│
├── types/                       # TypeScript Types
│   └── plan.ts                 # Plan document types
│
├── utils/                       # Utilities
│   └── tableInitializer.ts     # Table initialization
│
└── README.md                    # Documentation
```

---

## Cleanup Actions

### Step 1: Delete Unused Files

```bash
# Delete unused components
rm features/editor/components/ProductSelectionModal.tsx
rm features/editor/components/ProgramSelector.tsx

# Delete unused prompts
rm features/editor/prompts/sectionPrompts.ts
rmdir features/editor/prompts  # If empty

# Delete unused types
rm features/editor/types/editor.ts

# Review categoryConverters.ts
# Option A: Keep types, move to types/categoryConverters.ts
# Option B: Delete if not needed
```

### Step 2: Verify Imports

After deletion, verify no broken imports:
```bash
# Check for any remaining references
grep -r "ProductSelectionModal" features/
grep -r "ProgramSelector" features/
grep -r "sectionPrompts" features/
grep -r "editor\.ts" features/
```

### Step 3: Update Documentation

Update README.md to reflect current structure.

---

## File Usage Matrix

| File | Used In | Status | Action |
|------|---------|--------|--------|
| `Editor.tsx` | `pages/editor.tsx` | ✅ Active | Keep |
| `RequirementsModal.tsx` | `Editor.tsx` | ✅ Active | Keep |
| `SectionContentRenderer.tsx` | `Editor.tsx` | ✅ Active | Keep |
| `SimpleTextEditor.tsx` | `Editor.tsx` | ✅ Active | Keep |
| `ProductSelectionModal.tsx` | None | ❌ Unused | Delete |
| `ProgramSelector.tsx` | None | ❌ Unused | Delete |
| `aiHelper.ts` | `Editor.tsx` | ✅ Active | Keep |
| `categoryConverters.ts` | `features/reco/engine/enhancedRecoEngine.ts` | ✅ Active | Keep |
| `useSectionProgress.ts` | `Editor.tsx` | ✅ Active | Keep |
| `sectionPrompts.ts` | None | ❌ Unused | Delete |
| `plan.ts` | `Editor.tsx` | ✅ Active | Keep |
| `editor.ts` | None | ❌ Unused | Delete |
| `tableInitializer.ts` | `Editor.tsx` | ✅ Active | Keep |
| `templates/*` | `Editor.tsx` (via `@templates`) | ✅ Active | Keep |

---

## Import Dependencies

### Editor.tsx Imports
```typescript
// ✅ All these are used and needed:
import { PlanDocument, PlanSection, ConversationMessage } from '@/features/editor/types/plan';
import { SectionTemplate, getSections } from '@templates';
import { createAIHelper } from '@/features/editor/engine/aiHelper';
import { calculateSectionProgress } from '@/features/editor/hooks/useSectionProgress';
import SimpleTextEditor from './SimpleTextEditor';
import RequirementsModal from './RequirementsModal';
import SectionContentRenderer from './SectionContentRenderer';
import { initializeTablesForSection, sectionNeedsTables } from '@/features/editor/utils/tableInitializer';
```

### No Imports Found For
- `ProductSelectionModal.tsx` - ❌
- `ProgramSelector.tsx` - ❌
- `sectionPrompts.ts` - ❌
- `editor.ts` - ❌

---

## Recommendations

### Immediate Actions

1. **Delete unused files** (4 files)
   - `components/ProductSelectionModal.tsx`
   - `components/ProgramSelector.tsx`
   - `prompts/sectionPrompts.ts`
   - `types/editor.ts`

2. **Review categoryConverters.ts**
   - Check if types are needed elsewhere
   - If yes: Extract types to `types/categoryConverters.ts`
   - If no: Delete entire file

3. **Remove empty folders**
   - `prompts/` (if empty after deletion)

### Future Improvements

1. **Consolidate types**
   - Move all types to `types/` folder
   - Consider single `types/index.ts` export

2. **Organize components**
   - Group related components (e.g., modals/)
   - Consider subfolders if components grow

3. **Documentation**
   - Update README.md with current structure
   - Add JSDoc comments to exported functions

---

## Cleanup Script

```bash
#!/bin/bash
# Editor Cleanup Script

echo "Cleaning up unused editor files..."

# Delete unused components
rm -f features/editor/components/ProductSelectionModal.tsx
rm -f features/editor/components/ProgramSelector.tsx

# Delete unused prompts
rm -f features/editor/prompts/sectionPrompts.ts

# Delete unused types
rm -f features/editor/types/editor.ts

# Remove empty prompts folder if it exists
if [ -d "features/editor/prompts" ] && [ -z "$(ls -A features/editor/prompts)" ]; then
  rmdir features/editor/prompts
fi

echo "Cleanup complete!"
echo "Please verify no broken imports with:"
echo "  grep -r 'ProductSelectionModal\|ProgramSelector\|sectionPrompts\|editor\.ts' features/"
```

---

## Summary

**Files to Keep:** 14 files
**Files to Delete:** 4 files

**Cleanup Impact:**
- Reduces codebase size
- Removes confusion about unused components
- Makes structure clearer
- No breaking changes (files not imported)

**Next Steps:**
1. Execute cleanup
2. Verify no broken imports
3. Update documentation
4. Proceed with AI improvements

---

**End of Analysis**

