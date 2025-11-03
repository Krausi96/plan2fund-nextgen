# Final Unification Plan

## What to do:
1. Copy ALL sections from `standardSectionTemplates.ts` → `sections.ts` (full content, not import)
2. Copy ALL documents from `additionalDocuments.ts` → `documents.ts` (full content, not import)  
3. Update `categoryConverters.ts` to use unified system
4. Delete old files:
   - `shared/lib/standardSectionTemplates.ts`
   - `features/editor/templates/additionalDocuments.ts`
   - `features/editor/templates/chapters.ts` (if not needed)
   - `features/editor/templates/productSectionTemplates.ts` (keep only workflow parts, move to unified)

## Status:
- sections.ts: Currently imports (bridge) - needs full content
- documents.ts: Currently imports (bridge) - needs full content  
- categoryConverters: Uses `getStandardSections()` - needs to use unified
- Old files: Still exist, need deletion

## Files to keep:
- `shared/lib/templates/` - NEW unified system (after content migration)
- `features/editor/templates/productSectionTemplates.ts` - Keep only if workflow used

## Result:
Single source of truth: `shared/lib/templates/`
- All sections in `sections.ts`
- All documents in `documents.ts`
- No more imports from old files

