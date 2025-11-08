# Scraper-Lite Cleanup Plan

## ✅ Files to KEEP (Core Functionality)

### Main Files
- **`unified-scraper.ts`** ✅ - Main entry point

### Source Files (src/)
- **`src/config.ts`** ✅ - Seed URLs, institution config
- **`src/institutionConfig.ts`** ✅ - Institution data (used by config.ts)
- **`src/utils.ts`** ✅ - URL utilities, HTML fetching
- **`src/llm-extract.ts`** ✅ - LLM extraction
- **`src/llmCache.ts`** ✅ - LLM caching
- **`src/llm-discovery.ts`** ✅ - LLM URL classification
- **`src/classification-feedback.ts`** ✅ - Feedback tracking
- **`src/auto-learning.ts`** ✅ - Autonomous learning
- **`src/learn-quality-patterns.ts`** ✅ - Pattern learning

### Database Files
- **`db/db.ts`** ✅ - Database operations
- **`src/db/run-migration.ts`** ✅ - Migration runner
- **`src/db/neon-schema.sql`** ✅ - Schema reference

### Test Files (test/)
- **`test/analyze-extracted-data.ts`** ✅
- **`test/analyze-requirement-values.ts`** ✅
- **`test/show-actual-data.ts`** ✅
- **`test/analyze-discovery.ts`** ✅
- **`test/analyze-requirements.ts`** ✅
- **`test/full-cycle-test.ts`** ✅
- **`test/monitor-learning.ts`** ✅
- **`test/speed-test.ts`** ✅
- **`test/db-status.ts`** ✅
- **`test/check-queue.ts`** ✅
- **`test/check-results.ts`** ✅
- **`test/check-openai-usage.ts`** ✅
- **`test/queue-test-url.ts`** ✅
- **`test/clean-bad-urls.ts`** ✅

---

## ❌ Files to REMOVE (Obsolete/Broken)

### Obsolete Scripts
- **`test/cleanup-old-files.js`** ❌ - Obsolete cleanup script
- **`test/scripts/manual/clean-db-and-run-small-batch.js`** ❌ - References non-existent `neon-client.ts`

### Duplicate Files
- **`db/db-status.ts`** ❌ - Duplicate of `test/db-status.ts` (same functionality)

### Unused Files
- **`src/quality-rules.ts`** ❌ - NOT imported anywhere (functions not used)
  - `validateQuality()` - Not called
  - `scoreCompleteness()` - Not called
  - Only `QualityRule` type is used, but it's defined in `learn-quality-patterns.ts`

### Broken Imports
- **`src/utils.ts`** ⚠️ - Line 295: `require('./db/institution-pattern-repository')` - File doesn't exist!
  - This is in `loadLearnedPatterns()` function - need to check if used

### Obsolete Migration Files (Already Run)
- **`src/db/migrate-add-extraction-method.sql`** ❌ - Already in `run-migration.ts`
- **`src/db/migrate-add-feedback-table.sql`** ❌ - Already in `run-migration.ts`
- **`src/db/migrate-add-quality-score.sql`** ❌ - Already in `run-migration.ts`
- **`src/db/template-versions.sql`** ❌ - Not used anywhere

### Empty Directories
- **`test/scripts/automatic/`** ❌ - Empty
- **`test/utils/`** ❌ - Empty

---

## ⚠️ Files to FIX

### Broken Imports
1. **`src/utils.ts`** - Line 295: Remove or fix `require('./db/institution-pattern-repository')`
   - Check if `loadLearnedPatterns()` is actually used

---

## 📋 Documentation to Consolidate

### Keep (Important)
- **`docs/COMPREHENSIVE_CATEGORY_ANALYSIS.md`** ✅
- **`docs/ALL_IMPROVEMENTS_IMPLEMENTED.md`** ✅
- **`docs/IMPROVEMENTS_AND_GOALS.md`** ✅
- **`docs/RECO_AND_SCRAPER_INTEGRATION.md`** ✅

### Archive/Remove (Historical)
- **`docs/DISCUSSION_BEFORE_IMPLEMENTATION.md`** ❌ - Historical discussion
- **`docs/IMPLEMENTATION_COMPLETE.md`** ❌ - Superseded by ALL_IMPROVEMENTS_IMPLEMENTED.md
- **`docs/TEST_PLAN.md`** ❌ - Historical
- **`docs/TEST_RESULTS_ANALYSIS.md`** ❌ - Historical
- **`docs/TEST_CYCLE_SUMMARY.md`** ❌ - Historical
- **`docs/TESTING_GUIDE.md`** ❌ - Can consolidate into one guide

---

## 🔧 Package.json Scripts to Remove

- **`lite:discover`** ❌ - References non-existent `run-lite.js`
- **`lite:scrape`** ❌ - References non-existent `run-lite.js`
- **`lite:analyze`** ❌ - References non-existent `analyze-coverage.js`
- **`scraper:clean`** ❌ - References obsolete `cleanup-old-files.js`

---

## 📊 Summary

### Files to Remove: 12
- 1 duplicate (db/db-status.ts)
- 1 unused (src/quality-rules.ts)
- 4 obsolete migrations (already in run-migration.ts)
- 2 obsolete scripts
- 1 broken import reference
- 2 empty directories
- 6 historical docs

### Files to Fix: 1
- src/utils.ts (broken import)

### Scripts to Remove: 4
- lite:discover, lite:scrape, lite:analyze, scraper:clean

---

## ✅ Action Plan

1. Remove obsolete files
2. Fix broken import in utils.ts
3. Remove obsolete package.json scripts
4. Consolidate documentation
5. Test that everything still works

