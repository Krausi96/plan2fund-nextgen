# Template Consolidation Summary

## Current Problem
- Unified system (`shared/lib/templates/`) just imports from old files (not real unification)
- Old files still exist with full content:
  - `shared/lib/standardSectionTemplates.ts` (550 lines)
  - `features/editor/templates/additionalDocuments.ts` (840 lines)
  - `features/editor/templates/chapters.ts` (140 lines - legacy, used in preview.tsx)
  - `features/editor/templates/productSectionTemplates.ts` (963 lines - has empty sections)

## What "Unification" Means
**Option 1: Keep imports (current, not true unification)**
- Unified files just import old files
- Old files still exist
- No reduction

**Option 2: Full migration (true unification)**
- Copy ALL content into unified files
- Delete old files
- Maximum reduction
- Single source of truth

## Recommended: Option 2

### Steps:
1. Copy all sections content → `shared/lib/templates/sections.ts`
2. Copy all documents content → `shared/lib/templates/documents.ts`
3. Update `categoryConverters.ts` to import from unified
4. Update `preview.tsx` to not use chapters (or move chapters to unified)
5. Delete old files

### Result:
- **Reduction:** Remove ~2,500 lines of duplicate/orphaned code
- **Clarity:** Single source of truth
- **Maintainability:** One place to update templates

## Files Status After Migration:

**Keep:**
- `shared/lib/templates/sections.ts` (all section content)
- `shared/lib/templates/documents.ts` (all document content)
- `shared/lib/templates/program-overrides.ts` (merge logic)
- `shared/lib/templates/index.ts` (entry point)

**Delete:**
- `shared/lib/standardSectionTemplates.ts`
- `features/editor/templates/additionalDocuments.ts`
- `features/editor/templates/chapters.ts` (or move to unified)
- Parts of `productSectionTemplates.ts` (keep only workflow)

## Decision Needed:
Do you want me to:
1. **Do full migration now?** (Copy all content, delete old files)
2. **Keep current approach?** (Just document what's what)

I recommend **#1** for true unification and reduction.

