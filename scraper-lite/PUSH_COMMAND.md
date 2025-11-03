# 🚀 Push Command

## Quick Push

```bash
# Stage all scraper-lite changes
git add scraper-lite/

# Commit
git commit -m "Enhance scraper automation: quality checks, auto-rescraping, funding type fixes

- Fix funding_type assignment in scraper.ts
- Enhance timeline/document extraction patterns  
- Integrate database quality checks into auto-cycle
- Add component data verification to auto-cycle
- Implement auto-rescraping for low-quality pages
- Organize scripts into automatic/manual folders
- Clean up outdated documentation"

# Push
git push
```

## Files Changed Summary

### Core Changes
- `src/scraper.ts` - Fixed funding_type
- `src/extract.ts` - Enhanced extraction
- `scripts/automatic/auto-cycle.js` - Enhanced automation

### Scripts Organized
- Moved to `scripts/automatic/` and `scripts/manual/`

### Documentation
- Cleaned up outdated MD files
- Kept: `README.md`, `DEPLOYMENT_CHECKLIST.md`, `docs/*`

### Institution Config
- ✅ Uses `legacy/institutionConfig.ts` (no changes needed)
- ⚠️ `shared/lib/institutionConfig.ts` exists but not used by scraper

## After Push - Verify

```bash
# 1. Check database connection
cd scraper-lite
node scripts/manual/test-neon-connection.js

# 2. Check funding types (after new scrape)
node scripts/manual/check-funding-types.js

# 3. Run auto-cycle
node scripts/automatic/auto-cycle.js
```

