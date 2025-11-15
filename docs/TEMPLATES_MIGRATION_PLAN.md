# Templates Migration Plan

## Current Usage Analysis

### Editor Uses (Can Move):
- ✅ `getSections()` - Main function to get section templates
- ✅ `SectionTemplate` type - TypeScript type
- ✅ `getTemplateKnowledge()` - AI guidance for sections
- ✅ `MASTER_SECTIONS` - Direct access (in categoryConverters)
- ✅ `sections.ts` - Master section templates (67KB, 1699 lines)
- ✅ `templateKnowledge.ts` - Template knowledge base (26KB, 534 lines)
- ✅ `types.ts` - TypeScript types (SectionTemplate)

### Other Files Use (Must Stay in Shared):
- ⚠️ `getDocuments()` - Used by preview.tsx, export.tsx, API
- ⚠️ `getDocument()` - Used by export.tsx
- ⚠️ `documents.ts` - Document templates (29KB, 888 lines)
- ⚠️ `overrides.ts` - Program-specific document overrides

### Not Used (Can Delete):
- ❌ `generator.ts` - LLM template generator (deprecated, not used)

## Recommendation: Split Templates

**Move to Editor:**
- `sections.ts` → `features/editor/templates/sections.ts`
- `templateKnowledge.ts` → `features/editor/templates/templateKnowledge.ts`
- `types.ts` → `features/editor/templates/types.ts` (only SectionTemplate)

**Keep in Shared:**
- `documents.ts` - Used by preview/export/API
- `overrides.ts` - Used for documents
- `index.ts` - Split into two: one for sections (editor), one for documents (shared)

## New Structure

```
features/editor/
├── templates/                         # 🆕 NEW: Editor-specific templates
│   ├── sections.ts                    # Master section templates
│   ├── templateKnowledge.ts           # Template knowledge base
│   ├── types.ts                       # SectionTemplate type
│   └── index.ts                       # getSections(), getTemplateKnowledge()

shared/templates/
├── documents.ts                       # ✅ KEEP: Document templates
├── overrides.ts                       # ✅ KEEP: Document overrides
├── types.ts                           # ✅ KEEP: DocumentTemplate type
└── index.ts                           # ✅ KEEP: getDocuments(), getDocument()
```

## What Editor Actually Needs

### Minimal Required Files:

1. **sections.ts** - Master section templates
   - Contains: MASTER_SECTIONS (grants, bankLoans, equity, visa)
   - Used by: Editor to load sections
   - Size: 67KB (can't reduce, it's data)

2. **templateKnowledge.ts** - Template knowledge
   - Contains: TEMPLATE_KNOWLEDGE (guidance for each section)
   - Used by: AI Helper for better prompts
   - Size: 26KB (can't reduce, it's data)

3. **types.ts** - SectionTemplate type
   - Contains: SectionTemplate interface
   - Used by: All editor components
   - Size: 1.6KB (minimal)

4. **index.ts** - Exports
   - Contains: getSections(), getTemplateKnowledge()
   - Used by: Editor.tsx
   - Size: 3KB (minimal)

**Total: ~97KB (mostly data, can't be reduced)**

## Migration Steps

1. **Create `features/editor/templates/` folder**
2. **Move sections.ts** → `features/editor/templates/sections.ts`
3. **Move templateKnowledge.ts** → `features/editor/templates/templateKnowledge.ts`
4. **Create `features/editor/templates/types.ts`** - Extract only SectionTemplate
5. **Create `features/editor/templates/index.ts`** - Export getSections(), getTemplateKnowledge()
6. **Update imports in editor:**
   - `@/shared/templates` → `@/features/editor/templates`
7. **Keep documents.ts in shared** - Used by preview/export/API
8. **Update shared/templates/index.ts** - Remove section exports, keep document exports
9. **Delete generator.ts** - Not used

## Benefits

- ✅ **Clearer ownership** - Editor templates in editor folder
- ✅ **Reduced coupling** - Editor doesn't depend on shared templates
- ✅ **Better organization** - Sections vs Documents separated
- ✅ **Smaller shared** - Only document templates in shared

## File Size Summary

**Editor Templates (to move):**
- sections.ts: 67KB
- templateKnowledge.ts: 26KB
- types.ts: 1.6KB (extract SectionTemplate only)
- index.ts: 3KB
- **Total: ~97KB**

**Shared Templates (keep):**
- documents.ts: 29KB
- overrides.ts: 6.7KB
- types.ts: 1.6KB (keep DocumentTemplate)
- index.ts: 3KB (keep document exports)
- **Total: ~40KB**

---

**Status:** Ready to migrate - Clear separation of concerns

