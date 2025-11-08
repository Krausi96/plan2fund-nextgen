# Scraper-Lite Cleanup - Execute Plan

## ❌ Files to DELETE

### 1. Obsolete Scripts
- `test/cleanup-old-files.js` - Obsolete
- `test/scripts/manual/clean-db-and-run-small-batch.js` - References non-existent files

### 2. Duplicate Files
- `db/db-status.ts` - Duplicate of `test/db-status.ts`

### 3. Unused Files
- `src/quality-rules.ts` - NOT imported/used anywhere (functions never called)

### 4. Obsolete Migration Files (Already in run-migration.ts)
- `src/db/migrate-add-extraction-method.sql`
- `src/db/migrate-add-feedback-table.sql`
- `src/db/migrate-add-quality-score.sql`
- `src/db/template-versions.sql` - Not used

### 5. Empty Directories
- `test/scripts/automatic/` - Empty
- `test/utils/` - Empty

### 6. Historical Documentation
- `docs/DISCUSSION_BEFORE_IMPLEMENTATION.md`
- `docs/IMPLEMENTATION_COMPLETE.md` (superseded)
- `docs/TEST_PLAN.md`
- `docs/TEST_RESULTS_ANALYSIS.md`
- `docs/TEST_CYCLE_SUMMARY.md`
- `docs/TESTING_GUIDE.md`

---

## ⚠️ Files to FIX

### 1. `src/utils.ts` - Line 295
**Problem**: `require('./db/institution-pattern-repository')` - File doesn't exist
**Fix**: Remove this code block (lines 292-310) - it's trying to load from non-existent file
**Impact**: This code is in `isProgramDetailPage()` which might not be used

---

## 🔧 Package.json Scripts to REMOVE

- `lite:discover` - References non-existent `run-lite.js`
- `lite:scrape` - References non-existent `run-lite.js`
- `lite:analyze` - References non-existent `analyze-coverage.js`
- `scraper:clean` - References obsolete `cleanup-old-files.js`

---

## ✅ Files to KEEP

### Core (15 files)
- `unified-scraper.ts`
- `src/config.ts`
- `src/institutionConfig.ts`
- `src/utils.ts` (after fix)
- `src/llm-extract.ts`
- `src/llmCache.ts`
- `src/llm-discovery.ts`
- `src/classification-feedback.ts`
- `src/auto-learning.ts`
- `src/learn-quality-patterns.ts`
- `db/db.ts`
- `src/db/run-migration.ts`
- `src/db/neon-schema.sql`

### Test Files (13 files)
- All in `test/` directory (except obsolete scripts)

### Documentation (4 files)
- `docs/COMPREHENSIVE_CATEGORY_ANALYSIS.md`
- `docs/ALL_IMPROVEMENTS_IMPLEMENTED.md`
- `docs/IMPROVEMENTS_AND_GOALS.md`
- `docs/RECO_AND_SCRAPER_INTEGRATION.md`

---

## 📊 Summary

**Total Files to Remove**: 15
- 2 obsolete scripts
- 1 duplicate
- 1 unused
- 4 obsolete migrations
- 2 empty directories
- 6 historical docs

**Files to Fix**: 1
- `src/utils.ts` (remove broken import)

**Scripts to Remove**: 4

---

## 🚀 Ready to Execute?

