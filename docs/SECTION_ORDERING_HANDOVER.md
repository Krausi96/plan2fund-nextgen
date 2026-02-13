# Section Ordering & Rendering Pipeline - Handover

## Architecture Overview

```
Input (Program/Template/Upload)
    ↓
normalizeDocumentStructure()
    ↓
buildDocumentStructure() [SOLE BUILDER]
    ↓
sortSectionsForSingleDocument() [SOLE ORDERING]
    ↓
setDocumentStructure() → zustand store
    ↓
organizeForUiRendering() [UI INJECTION ONLY]
    ↓
TreeNavigator | StandardStructurePanel | PreviewWorkspace | BlueprintInstantiation
```

---

## 1. ORDERING - Where Rules Are Defined

### Primary: Template Files (SOURCE OF TRUTH)

**Files:**
- `platform/templates/catalog/products/business_plan.ts`
- `platform/templates/catalog/products/strategy.ts`

**Mechanism:** Templates use `order` property:
```typescript
export const STRATEGY_SECTIONS: SectionTemplate[] = [
  {
    id: 'executive_summary',
    title: 'Executive Summary',
    order: 1,  // ← Defines position
    ...
  },
  {
    id: 'business_model_canvas',
    title: 'Business Model Canvas',
    order: 2,
    ...
  },
  // ...
];
```

### Secondary: structureBuilder.ts (ORDERING FUNCTION)

**File:** `platform/generation/structure/structureBuilder.ts`

```typescript
// Lines 434-519
export function sortSectionsForSingleDocument<T extends { id: string; title?: string; order?: number }>(
  sections: T[]
): T[] {
  // Memory constraints for special positioning
  const mustBeLast = ['introduction to application form', 'how to apply', 'submission instructions'];
  const shouldBeFirst = ['executive summary', 'overview', 'introduction'];

  // Separate sections into memory-aware groups
  const first: T[] = [];
  const middle: T[] = [];
  const last: T[] = [];

  for (const section of sections) {
    const titleLower = section.title?.toLowerCase() || '';
    const isMustBeLast = mustBeLast.some(pat => titleLower.includes(pat.toLowerCase()));
    const shouldBeFirstMatch = shouldBeFirst.some(pat => titleLower.includes(pat.toLowerCase()));

    if (isMustBeLast) {
      last.push(section);
    } else if (shouldBeFirstMatch) {
      first.push(section);
    } else {
      middle.push(section);
    }
  }

  // Sort by order property (template defines the order)
  const sortByTemplateOrder = <S extends { order?: number; id: string }>(items: S[]): S[] => {
    return [...items].sort((a, b) => {
      const orderA = a.order ?? 99;
      const orderB = b.order ?? 99;
      if (orderA !== orderB) return orderA - orderB;
      return a.id.localeCompare(b.id);
    });
  };

  return [...sortByTemplateOrder(first), ...sortByTemplateOrder(middle), ...sortByTemplateOrder(last)];
}
```

**Key:** Order is derived from template's `order` field, NOT hardcoded.

### Memory Constraints

Sections matching these titles are forced to specific positions:
- **First:** 'executive summary', 'overview', 'introduction'
- **Last:** 'introduction to application form', 'how to apply', 'submission instructions'

---

## 2. UI INJECTION - Where Special Sections Are Added

### File: `features/editor/lib/utils/organizeForUiRendering.ts`

**NOTE:** This file does NOT sort. It only injects UI placeholders.

```typescript
// Lines 38-56
export interface HierarchicalDocumentView {
  mainDocument: {
    id: string;
    name: string;
    sections: unknown[];
  };
  appendices: Array<{
    id: string;
    name: string;
    displayName: string;
    sections: unknown[];
  }>;
  sharedSections: unknown[];
}

// Special section IDs (UI-injected, not in DocumentStructure)
const SPECIAL_SECTION_IDS = {
  METADATA: 'metadata',        // Title Page
  ANCILLARY: 'ancillary',      // Table of Contents
  REFERENCES: 'references',
  APPENDICES: 'appendices',
  TABLES_DATA: 'tables_data',
  FIGURES_IMAGES: 'figures_images',
} as const;
```

**What it does:**
- Injects Title Page, TOC, References, Appendices placeholders for UI
- Groups sections hierarchically (main doc vs appendices vs shared)
- Does NOT reorder - assumes DocumentStructure.sections is already sorted

---

## 3. SPECIAL SECTIONS ID REFERENCE

| ID | UI Name | Injected By | Notes |
|----|---------|-------------|-------|
| `metadata` | Title Page | organizeForUiRendering | Not in DocumentStructure |
| `ancillary` | Table of Contents | organizeForUiRendering | Not in DocumentStructure |
| `references` | References | organizeForUiRendering | Special section |
| `appendices` | Appendices | organizeForUiRendering | Special section |
| `tables_data` | Tables/Data | organizeForUiRendering | Special section |
| `figures_images` | Figures/Images | organizeForUiRendering | Special section |

---

## 4. UI COMPONENTS & THEIR DATA SOURCES

### TreeNavigator
**File:** `features/editor/components/Navigation/CurrentSelection/TreeNavigator/TreeNavigator.tsx`

```typescript
// Lines 89-92
const sections = React.useMemo(() => {
  return documentStructure?.sections || [];  // Already sorted by structureBuilder
}, [documentStructure]);
```
**Action:** Reads pre-sorted sections from zustand store. NO sorting.

### StandardStructurePanel
**File:** `features/editor/components/Navigation/CurrentSelection/ProgramSelection/components/panels/StandardStructurePanel.tsx`

```typescript
// Lines 34-47
const getRequiredSections = () => {
  if (documentStructure?.sections && documentStructure.sections.length > 0) {
    return documentStructure.sections;  // Already sorted
  }
  // Fallback for display-only
  const productType = inferredProductType;
  if (productType && MASTER_SECTIONS[productType]) {
    return MASTER_SECTIONS[productType];
  }
  return [];
};
```
**Action:** Reads pre-sorted sections. Fallback returns template order.

### PreviewWorkspace
**File:** `features/editor/components/Preview/PreviewWorkspace.tsx`

```typescript
// Lines 118-144
const sectionsToRender = useMemo(() => {
  const allSections = planDocument?.sections || [];
  
  // Hide special sections for preview (handled by dedicated renderers)
  if (!selectedProgram) {
    return allSections.filter(section => 
      section.id !== 'metadata' &&
      section.id !== 'ancillary' && 
      section.id !== 'references' && 
      section.id !== 'appendices' &&
      section.id !== 'tables_data' &&
      section.id !== 'figures_images'
    );
  }
  return allSections.filter(...);
}, [planDocument?.sections, selectedProgram]);
```
**Action:** Filters sections. Relies on pre-sorted order from zustand.

### BlueprintInstantiation
**File:** `features/editor/components/Navigation/CurrentSelection/ProductCreation/BlueprintInstantiation/BlueprintInstantiation.tsx`

```typescript
// Line 231
const plan = instantiateFromBlueprint(documentStructure as any, productType as any, existingTitlePage);
```
**Action:** Calls `instantiateFromBlueprint()` from `platform/generation/plan/instantiation.ts`

---

## 5. DATA FLOW BY SOURCE

### Program Selection Flow
```
ProgramFinder (selects program)
    ↓
buildFromProgram() → applySectionOrdering() → sortSectionsForSingleDocument()
    ↓
setDocumentStructure()
    ↓
UI reads sorted sections
```

### Template/Free Option Flow
```
FreeOption (selects template)
    ↓
buildFromTemplate() → applySectionOrdering() → sortSectionsForSingleDocument()
    ↓
setDocumentStructure()
    ↓
UI reads sorted sections
```

### Upload Flow
```
DocumentUploadOption (uploads document)
    ↓
normalizeDocumentStructure()
    ↓
buildDocumentStructure() → applySectionOrdering()
    ↓
setDocumentStructure()
    ↓
UI reads sorted sections
```

---

## 6. KEY FILES SUMMARY

| File | Purpose | Key Function |
|------|---------|--------------|
| `platform/generation/structure/structureBuilder.ts` | Build DocumentStructure | `buildDocumentStructure()`, `sortSectionsForSingleDocument()` |
| `platform/templates/catalog/products/*.ts` | Define template sections with `order` | `STRATEGY_SECTIONS`, `BUSINESS_PLAN_SECTIONS` |
| `features/editor/lib/utils/organizeForUiRendering.ts` | UI injection only | `organizeForUiRendering()` - NO sorting |
| `platform/generation/plan/instantiation.ts` | Instantiate PlanDocument | `instantiateFromBlueprint()` |
| `features/editor/components/Preview/PreviewWorkspace.tsx` | Document preview | Uses pre-sorted sections |
| `features/editor/components/Navigation/CurrentSelection/TreeNavigator/TreeNavigator.tsx` | Tree navigation | Uses pre-sorted sections |
| `features/editor/components/Navigation/CurrentSelection/ProgramSelection/components/panels/StandardStructurePanel.tsx` | Panel display | Uses pre-sorted sections |

---

## 7. COMMON ISSUES & FIXES

### Issue: Sections not in expected order
**Cause:** Template missing `order` property or section ID not in canonical position
**Fix:** Add `order` field to template section

### Issue: Panel shows empty
**Cause:** `hasStructureData` checks wrong path (e.g., `documentStructure.source` vs `documentStructure.metadata.source`)
**Fix:** Use correct path from `documentStructure.metadata.source`

### Issue: Memory constraint not applied
**Cause:** Section title doesn't match constraint keywords exactly
**Fix:** Check `mustBeLast` / `shouldBeFirst` arrays in `sortSectionsForSingleDocument()`

### Issue: Different order in different views
**Cause:** View doing its own sorting (should not happen)
**Fix:** Remove local sorting, rely on pre-sorted from zustand

---

## 8. ID MISMATCH CHECKLIST

When adding new sections, verify:
- [ ] Template `id` matches what `sortSectionsForSingleDocument()` expects
- [ ] Template has `order` property
- [ ] No duplicate IDs across templates
- [ ] Special section IDs match `SPECIAL_SECTION_IDS` in organizeForUiRendering
- [ ] UI components filter by same IDs consistently

---

## 9. TESTING CHECKLIST

When changes are made:
1. Select program → verify sections in TreeNavigator
2. Select template → verify sections in StandardStructurePanel
3. Upload document → verify sections in PreviewWorkspace
4. Navigate to BlueprintInstantiation → verify order preserved
5. Check memory constraints (e.g., "Introduction to Application Form" should be last)
