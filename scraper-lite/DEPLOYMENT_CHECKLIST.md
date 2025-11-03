# 🚀 Deployment Checklist

## ✅ What Needs to Be Pushed

### Essential Files (Modified/Created)
1. **`scraper-lite/src/scraper.ts`** - Fixed funding_type assignment
2. **`scraper-lite/src/extract.ts`** - Enhanced timeline/document extraction patterns
3. **`scraper-lite/scripts/automatic/auto-cycle.js`** - Enhanced with quality checks and auto-rescraping
4. **`scraper-lite/scripts/manual/verify-database-quality.js`** - Made exportable for auto-cycle
5. **`scraper-lite/scripts/manual/test-question-engine-data.js`** - Made exportable for auto-cycle
6. **`scraper-lite/scripts/manual/check-funding-types.js`** - New script for funding type monitoring

### Documentation Files (Optional but Recommended)
- `scraper-lite/AUTOMATION_ENHANCEMENTS.md` - Documentation of enhancements
- `scraper-lite/IMPROVEMENTS_SUMMARY.md` - Summary of improvements
- `scraper-lite/QUALITY_ANALYSIS_RESULTS.md` - Quality analysis results
- `scraper-lite/scripts/MANUAL_SCRIPTS_REVIEW.md` - Script review documentation

### Script Organization (Moved Files)
- Scripts moved to `scripts/automatic/` and `scripts/manual/` folders
- These are just reorganizations, functionality unchanged

---

## 🔧 What Needs Manual Setup

### 1. Institution Config Setup ✅ **ALREADY DONE**
**Status:** ✅ No manual setup needed - uses existing `legacy/institutionConfig.ts`

**How it works:**
- `scraper-lite/src/config.ts` imports from `legacy/institutionConfig.ts`
- Only uses institutions with `autoDiscovery: true`
- Automatically gets seed URLs, funding types, keywords from config

**To add new institutions:**
1. Edit `legacy/institutionConfig.ts`
2. Add institution with `autoDiscovery: true`
3. Include:
   - `programUrls` (seed URLs for discovery)
   - `fundingTypes` (e.g., ['grant', 'loan', 'equity'])
   - `keywords` (for program detection)
   - `region` (e.g., 'Austria')

**No need to edit `scraper-lite/src/config.ts`** - it auto-imports from legacy config.

### 2. Environment Variables ✅ **ALREADY SET**
**Required:**
- `DATABASE_URL` in `.env.local` (root directory) - ✅ Already configured

**Optional:**
- `LITE_ALL_INSTITUTIONS=1` - Use all institutions (default: first 3)
- `LITE_MAX_DISCOVERY_PAGES=200` - Max pages to discover per cycle
- `SCRAPE_BATCH_SIZE=100` - Batch size for scraping
- `MAX_CYCLES=10` - Max cycles to run

### 3. Database Schema ✅ **ALREADY SETUP**
**Required tables:**
- `pages` - Stores scraped page data
- `requirements` - Stores categorized requirements
- `jobs` - Job queue tracking

**Status:** ✅ Schema already exists, no manual setup needed

---

## 📋 InstitutionConfig Files Explained

### Two Files Exist:

1. **`legacy/institutionConfig.ts`** ✅ **ACTIVE - This is the one used**
   - Location: `legacy/institutionConfig.ts`
   - Used by: `scraper-lite/src/config.ts`
   - Contains: Full institution configs with autoDiscovery flag
   - **This is the source of truth for scraper-lite**

2. **`shared/lib/institutionConfig.ts`** ⚠️ **USED BY FRONTEND**
   - Location: `shared/lib/institutionConfig.ts`
   - Used by: Frontend components (likely)
   - May be a duplicate or legacy copy
   - **Not used by scraper-lite**

### Recommendation:
- ✅ **Keep `legacy/institutionConfig.ts`** - This is what scraper-lite uses
- ⚠️ **Check if `shared/lib/institutionConfig.ts` is still needed** - May be used by frontend
- If they're duplicates, consider consolidating later

---

## 🚀 How to Run Enhanced Auto-Cycle

### First Time Setup
```bash
# 1. Ensure DATABASE_URL is set in .env.local
cat .env.local | grep DATABASE_URL

# 2. Run enhanced auto-cycle
cd scraper-lite
node scripts/automatic/auto-cycle.js
```

### With Custom Options
```bash
# Use all institutions, custom batch size
LITE_ALL_INSTITUTIONS=1 SCRAPE_BATCH_SIZE=50 MAX_CYCLES=5 node scripts/automatic/auto-cycle.js
```

---

## ✅ Verification Steps

### After Pushing, Verify:

1. **Database Connection**
   ```bash
   node scraper-lite/scripts/manual/test-neon-connection.js
   ```

2. **Funding Types Assignment**
   ```bash
   node scraper-lite/scripts/manual/check-funding-types.js
   # Should show funding types (not all null)
   ```

3. **Quality Checks Work**
   ```bash
   node scraper-lite/scripts/manual/verify-database-quality.js
   ```

4. **Component Data Format**
   ```bash
   node scraper-lite/scripts/manual/test-question-engine-data.js
   ```

---

## 📝 Commit Command

```bash
# Stage all changes
git add scraper-lite/

# Commit with descriptive message
git commit -m "Enhance scraper automation: Add quality checks, auto-rescraping, and funding type fixes

- Fix funding_type assignment in scraper.ts
- Enhance timeline/document extraction patterns
- Integrate database quality checks into auto-cycle
- Add component data verification to auto-cycle
- Implement auto-rescraping for low-quality pages
- Organize scripts into automatic/manual folders
- Add documentation and monitoring scripts"

# Push to remote
git push
```

---

## ⚠️ Important Notes

### What NOT to Change Manually:
1. ✅ **Don't edit `scraper-lite/src/config.ts`** - It auto-imports from legacy config
2. ✅ **Don't modify database schema** - Already set up
3. ✅ **Don't create new config files** - Use existing `legacy/institutionConfig.ts`

### What TO Edit When Needed:
1. ✅ **Edit `legacy/institutionConfig.ts`** to add/modify institutions
2. ✅ **Set `autoDiscovery: true`** for institutions you want to scrape
3. ✅ **Add `programUrls`** (seed URLs) for each institution
4. ✅ **Set `fundingTypes`** array for each institution

---

## 🎯 Summary

**To make it run:**
1. ✅ Push the code changes (see commit command above)
2. ✅ Ensure `DATABASE_URL` is set (already done)
3. ✅ Institution config is already set up in `legacy/institutionConfig.ts`
4. ✅ No manual database setup needed
5. ✅ Run: `node scraper-lite/scripts/automatic/auto-cycle.js`

**To add new institutions:**
- Edit `legacy/institutionConfig.ts` only
- Add entry with `autoDiscovery: true`
- No other files need editing

**Everything else is automatic!** 🤖

