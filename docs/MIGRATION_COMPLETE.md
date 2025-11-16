# Migration Complete: scraper-lite → features/shared

## Files Moved

### ✅ 1. `llm-extract.ts` → `features/reco/engine/llmExtract.ts`
- **Why**: Used for recommendation extraction (15 categories)
- **Updated imports**: 
  - `../../../shared` → `../../../../shared`
- **Fixed**: `detectPageType` now works with text mode

### ✅ 2. `db/db.ts` → `shared/lib/database.ts`
- **Why**: Generic database connection (not scraper-specific)
- **Used in**: 4 files (requirements, profile, repository, setup)

## Files Updated

### Imports Updated:
1. ✅ `pages/api/programs/recommend.ts` - Now imports from `features/reco/engine/llmExtract`
2. ✅ `pages/api/programmes/[id]/requirements.ts` - Now imports from `shared/lib/database`
3. ✅ `pages/api/user/profile.ts` - Now imports from `shared/lib/database`
4. ✅ `shared/user/database/repository.ts` - Now imports from `shared/lib/database`
5. ✅ `pages/api/db/setup.ts` - Now imports from `shared/lib/database`

### Config Updated:
6. ✅ `tsconfig.json` - Removed scraper-lite paths

## What's Left in scraper-lite

### Can be deleted:
- ❌ `src/core/llmCache.ts` - Not used
- ❌ `src/config/institutionConfig.ts` - Not used
- ❌ `src/utils.ts` - Not used
- ❌ `src/db/neon-schema.sql` - Schema file (not imported)
- ❌ `archive/` - Old files
- ❌ `scripts/` - Not used
- ❌ `data/` - Cache/data files
- ❌ `README.md` - Documentation

### Still needed (if you want to keep scraper-lite for future use):
- `db/db.ts` - **MOVED** to `shared/lib/database.ts` ✅
- `src/core/llm-extract.ts` - **MOVED** to `features/reco/engine/llmExtract.ts` ✅

## New Structure

```
features/reco/engine/
  ├── llmExtract.ts          ← Moved from scraper-lite/src/core/llm-extract.ts
  ├── enhancedRecoEngine.ts
  └── normalization.ts

shared/lib/
  └── database.ts            ← Moved from scraper-lite/db/db.ts
```

## Next Steps

1. ✅ All imports updated
2. ✅ All files moved
3. ✅ tsconfig.json updated
4. ⏳ **You can now delete the `scraper-lite/` directory** (or keep it for reference)

## Verification

Run `npm run typecheck` to verify everything compiles correctly.

