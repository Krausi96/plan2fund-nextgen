# Scraper-Lite Cleanup Analysis

## 📁 Current File Structure

### Core Files (✅ KEEP - Actively Used)

#### Main Entry Point
- **`unified-scraper.ts`** ✅ - Main scraper entry point

#### Source Files (src/)
- **`src/config.ts`** ✅ - Seed URLs and institution config
- **`src/utils.ts`** ✅ - URL utilities, HTML fetching, page detection
- **`src/llm-extract.ts`** ✅ - LLM-based extraction
- **`src/llmCache.ts`** ✅ - LLM result caching
- **`src/llm-discovery.ts`** ✅ - LLM-based URL classification
- **`src/classification-feedback.ts`** ✅ - Classification feedback tracking
- **`src/auto-learning.ts`** ✅ - Autonomous learning system
- **`src/learn-quality-patterns.ts`** ✅ - Quality pattern learning
- **`src/institutionConfig.ts`** ✅ - Institution configuration data (used by config.ts)

#### Database Files
- **`db/db.ts`** ✅ - Consolidated database operations
- **`src/db/run-migration.ts`** ✅ - Database migration runner
- **`src/db/neon-schema.sql`** ✅ - Database schema reference

#### Test Files (test/)
- **`test/analyze-extracted-data.ts`** ✅ - Data quality analysis
- **`test/analyze-requirement-values.ts`** ✅ - Requirement values analysis
- **`test/show-actual-data.ts`** ✅ - Show actual extracted data
- **`test/analyze-discovery.ts`** ✅ - Discovery analysis
- **`test/analyze-requirements.ts`** ✅ - Requirements analysis
- **`test/full-cycle-test.ts`** ✅ - Full cycle testing
- **`test/monitor-learning.ts`** ✅ - Learning system monitoring
- **`test/speed-test.ts`** ✅ - Speed testing
- **`test/db-status.ts`** ✅ - Database status check
- **`test/check-queue.ts`** ✅ - Queue checking
- **`test/check-results.ts`** ✅ - Results checking
- **`test/check-openai-usage.ts`** ✅ - OpenAI usage check
- **`test/queue-test-url.ts`** ✅ - Queue test URL
- **`test/clean-bad-urls.ts`** ✅ - Clean bad URLs

---

## ⚠️ Files to Review

### Potentially Unused
- **`src/quality-rules.ts`** ⚠️ - Need to check if used
- **`db/db-status.ts`** ⚠️ - Duplicate of test/db-status.ts?
- **`test/cleanup-old-files.js`** ⚠️ - Cleanup script, might be obsolete

### Obsolete Scripts in package.json
- **`lite:discover`** ❌ - References `run-lite.js` (doesn't exist)
- **`lite:scrape`** ❌ - References `run-lite.js` (doesn't exist)
- **`lite:analyze`** ❌ - References `analyze-coverage.js` (doesn't exist)
- **`scraper:clean`** ⚠️ - References `cleanup-old-files.js` (might be obsolete)

### Migration Files
- **`src/db/migrate-add-extraction-method.sql`** ⚠️ - Already run?
- **`src/db/migrate-add-feedback-table.sql`** ⚠️ - Already run?
- **`src/db/migrate-add-quality-score.sql`** ⚠️ - Already run?
- **`src/db/template-versions.sql`** ⚠️ - Need to check

### Test Scripts
- **`test/scripts/manual/clean-db-and-run-small-batch.js`** ⚠️ - Manual script, might be obsolete
- **`test/scripts/automatic/`** ⚠️ - Need to check contents
- **`test/utils/`** ⚠️ - Need to check contents

---

## 📋 Documentation Files

### Keep (Reference)
- **`docs/COMPREHENSIVE_CATEGORY_ANALYSIS.md`** ✅ - Important analysis
- **`docs/ALL_IMPROVEMENTS_IMPLEMENTED.md`** ✅ - Implementation summary
- **`docs/IMPROVEMENTS_AND_GOALS.md`** ✅ - Goals and improvements
- **`docs/RECO_AND_SCRAPER_INTEGRATION.md`** ✅ - Reco integration docs

### Review (Might Consolidate)
- **`docs/DISCUSSION_BEFORE_IMPLEMENTATION.md`** ⚠️ - Historical, might archive
- **`docs/IMPLEMENTATION_COMPLETE.md`** ⚠️ - Historical, might archive
- **`docs/TEST_PLAN.md`** ⚠️ - Might consolidate
- **`docs/TEST_RESULTS_ANALYSIS.md`** ⚠️ - Historical results
- **`docs/TEST_CYCLE_SUMMARY.md`** ⚠️ - Historical summary
- **`docs/TESTING_GUIDE.md`** ⚠️ - Might consolidate

---

## 🔍 Next Steps

1. Check if `quality-rules.ts` is used
2. Check if `db/db-status.ts` is duplicate
3. Check test scripts directories
4. Check migration files (already run?)
5. Remove obsolete package.json scripts
6. Consolidate documentation

