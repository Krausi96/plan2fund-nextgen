# Migration Plan V2 - Based on Comprehensive Analysis

## Status: ✅ Repository Restored to Pre-Migration

We're back at commit `e0c59ac` - "Pre-migration: Clean structure docs, remove duplicates, prepare functional structure"

## Key Issues Found:

1. **Lib files incorrectly categorized**: Many engine files in `shared/lib` should be in feature engines
   - `enhancedRecoEngine.ts` → `features/reco/engine/`
   - `intakeEngine.ts` → `features/intake/engine/`
   - `export.ts` → `features/export/engine/`
   - `pricing.ts` → `features/export/engine/`
   - `questionEngine.ts` → `features/reco/engine/`

2. **Shared components confusion**: Some components in `common/` are feature-specific
   - `CartSummary.tsx` uses pricing → `features/export/components/`
   - `Hero.tsx` uses intake detection → `features/intake/components/` or `shared/components/`?

3. **Need manual review**: Some files are ambiguous and need user decision

## Next Steps:

1. ✅ Create comprehensive mapping (done)
2. 🔄 Refine mapping for lib files
3. 🔄 Get user confirmation on ambiguous files
4. 🔄 Execute migration with proper import updates

