# Final Unification - What to Do

## Current Problem
- Unified system still imports from old files (wrapper, not real unification)
- Old files still exist: `additionalDocuments.ts`, `standardSectionTemplates.ts`
- `productSectionTemplates.ts` has empty sections
- `chapters.ts` - legacy, only used in preview.tsx

## Solution: Move Content, Not Import

### Step 1: Move Sections Content
- Copy ALL sections from `standardSectionTemplates.ts` → `shared/lib/templates/sections.ts`
- Remove import bridge
- Delete `standardSectionTemplates.ts`

### Step 2: Move Documents Content  
- Copy ALL documents from `additionalDocuments.ts` → `shared/lib/templates/documents.ts`
- Remove import bridge
- Delete `additionalDocuments.ts`

### Step 3: Handle productSectionTemplates
- Option A: Populate empty sections from unified system
- Option B: Remove if not needed (keep workflow steps only)
- Option C: Delete entirely if workflow not used

### Step 4: Handle chapters.ts
- Check if still needed in preview.tsx
- If not, delete
- If yes, move to unified system or keep as legacy

## Files Status

### Can Delete After Unification:
- `features/editor/templates/additionalDocuments.ts` (840 lines) → Move to `documents.ts`
- `shared/lib/standardSectionTemplates.ts` (550 lines) → Move to `sections.ts`
- `features/editor/templates/chapters.ts` (140 lines) → Check if needed

### Keep (For Now):
- `features/editor/templates/productSectionTemplates.ts` (963 lines)
  - Has workflow steps (useful)
  - Has empty sections (can populate from unified system)
  - Has additionalDocuments inline (redundant with unified)

## Action: Do Full Migration Now?

**Option 1: Quick (Keep Bridges)**
- Keep imports, just update references
- Less risk, less reduction

**Option 2: Full Migration (Recommended)**
- Move all content into unified files
- Delete old files
- Maximum reduction
- More work but cleaner

Which do you prefer?

