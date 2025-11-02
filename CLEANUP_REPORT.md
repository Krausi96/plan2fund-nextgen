# 📋 Repository Restructure & Cleanup - Progress Tracking

**Date:** 2025-11-02  
**Status:** In Progress  
**Single Source of Truth for All Progress**

---

## ✅ Completed Tasks

### 1. Legacy Files
- ✅ `legacy/webScraperService.ts` - Commented out (documentation only)

### 2. Markdown Consolidation
- ✅ Consolidated structure docs into `REPOSITORY_STRUCTURE.md`
- ✅ Deleted redundant files:
  - `REPO_STRUCTURE_ANALYSIS.md`
  - `STRUCTURE.md`
  - `MIGRATION_PLAN_V2.md`
  - `PROPER_FILE_MAPPING.md`
  - `RESTRUCTURE_COMPLETE.md`

### 3. Database Status
- ✅ **Wired and Working**
  - Scraper saves to database (primary) + JSON (fallback)
  - API reads from database via `scraper-lite/src/db/page-repository.ts`
  - Connection via `DATABASE_URL` env var
  - JSON kept for backwards compatibility/fallback

---

## 🔍 Root Scripts Analysis

### ❌ Safe to Delete (Migration/Restructure - DONE)

These scripts were used for the repository restructure and are no longer needed:

1. `scripts/execute-restructure.js` - File movement script
2. `scripts/fix-all-imports.js` - Import path fixes
3. `scripts/fix-remaining-imports.js` - Additional import fixes
4. `scripts/fix-corrupted-imports.js` - Import repair
5. `scripts/comprehensive-mapping.js` - File mapping generator
6. `scripts/migrate-to-functional.js` - Migration to functional structure
7. `scripts/organize-shared-components.js` - Component organization
8. `scripts/verify-imports.js` - Import verification
9. `scripts/read-and-map-files.js` - File analysis
10. `scripts/complete-file-analysis.js` - File analysis

**Status:** All restructure work complete, these are obsolete.

### ❌ Safe to Delete (Legacy/Broken)

1. `scripts/run-scraper-direct.js`
   - **Reason:** Old scraper (Puppeteer-based)
   - **Replacement:** `scraper-lite/run-lite.js`
   - **Status:** Broken (references non-existent paths)

2. `scripts/learn-patterns-from-config.js`
   - **Reason:** Duplicate + broken (references `../src/config.ts` which doesn't exist)
   - **Replacement:** `scraper-lite/scripts/learn-patterns-from-config.js`
   - **Status:** Broken import paths

### ⚠️ Review Before Deleting (Database Scripts)

These may still be useful for database maintenance:

1. `scripts/database/migrate.js` - Database migration script
2. `scripts/database/add-categorized-requirements.js` - Database utility
3. `scripts/database/setup-database.sql` - Database setup
4. `scripts/database/migrate-enhanced-requirements.sql` - Schema migration
5. `scripts/database/migrate-database.sql` - Additional migration

**Note:** There's also `scraper-lite/scripts/migrate-to-neon.js` which may serve similar purpose. Review if these are duplicates.

### 📊 JSON Analysis Files (Keep or Archive)

These are analysis results, not scripts:

1. `scripts/comprehensive-mapping.json` - File mapping results
2. `scripts/file-mapping.json` - File mapping data
3. `scripts/import-analysis.json` - Import analysis results

**Recommendation:** Archive or delete if no longer needed for reference.

---

## 🎯 Recommended Actions

### Immediate Cleanup

1. **Delete obsolete migration scripts** (10 files listed above)
2. **Delete broken legacy scripts** (2 files: `run-scraper-direct.js`, `learn-patterns-from-config.js`)
3. **Review database scripts** - Keep only active ones, remove duplicates
4. **Archive analysis JSON files** - Move to `docs/archive/` or delete

### Structure Improvements

1. **Check for unused components** - Run `npm run typecheck` to identify
2. **Check for dead code** - Search for unused exports
3. **Review `shared/lib/webScraperService.ts`** - Check if duplicate of legacy version

---

## ✅ Cleanup Actions Taken

### Deleted Files (13 total)

**Obsolete Migration Scripts (10):**
- ✅ `scripts/execute-restructure.js`
- ✅ `scripts/fix-all-imports.js`
- ✅ `scripts/fix-remaining-imports.js`
- ✅ `scripts/fix-corrupted-imports.js`
- ✅ `scripts/comprehensive-mapping.js`
- ✅ `scripts/migrate-to-functional.js`
- ✅ `scripts/organize-shared-components.js`
- ✅ `scripts/verify-imports.js`
- ✅ `scripts/read-and-map-files.js`
- ✅ `scripts/complete-file-analysis.js`

**Legacy/Broken Scripts (2):**
- ✅ `scripts/run-scraper-direct.js` (replaced by scraper-lite)
- ✅ `scripts/learn-patterns-from-config.js` (broken, duplicate)

**Duplicate Code (1):**
- ✅ `shared/lib/webScraperService.ts` (duplicate of legacy version)

---

---

## 🎯 Current Phase: Repository Restructuring

### Goals
1. **Complete file tree analysis** - Map ALL files to proper locations
2. **Create meaningful subdirectories** - Organize by purpose, not just type
3. **Restructure carefully** - Fix imports, maintain functionality
4. **Documentation** - Single comprehensive guide (COMPLETE_REPO_MAP + SCRAPER_DEEP_DIVE combined)

### Progress
- [x] Database review complete
- [x] Obsolete scripts removed
- [x] Markdown consolidation
- [x] File tree analysis complete
- [x] Restructure planning complete
- [x] i18n moved to shared/i18n/translations with import fixes
- [x] TypeScript verification passed (0 errors)
- [x] Git commit & push successful (commit afd71de)
- [x] RequirementsChecker moved to shared/components/common/
- [x] Legacy data files moved to scraper-lite/data/legacy/
- [x] Old docs archived to docs/archive/
- [x] API paths updated for new data locations
- [ ] Final documentation (comprehensive repo map + scraper deep dive)

---

## 📊 Repository Structure Analysis

### Root-Level Items to Organize

#### `i18n/` folder (root)
- **Files:** `de.json`, `en.json`
- **Usage:** Imported by `shared/contexts/I18nContext.tsx` from `../../i18n/`
- **Decision:** Keep in root OR move to `shared/i18n/` (need to check all imports)
- **Status:** ✅ Actively used

#### `data/` folder (root)
- **Files:** Scraper data JSONs (scraped-programs-*.json, discovery-state.json, etc.)
- **Usage:** Legacy scraper data, some may still be used as fallback
- **Decision:** Move to `scraper-lite/data/` to consolidate all scraper data
- **Status:** ⚠️ Needs consolidation

#### `docs/` folder (root)
- **Files:** 11 documentation files
- **Usage:** Various analysis and documentation
- **Decision:** Consolidate or archive old docs
- **Status:** ⚠️ Needs review

#### Configuration files (root)
- **Files:** `tsconfig.json`, `next.config.js`, `tailwind.config.js`, `postcss.config.js`, `eslint.config.js`
- **Decision:** ✅ Keep in root (standard location)

#### MD files (root)
- **Files:** Multiple MD files
- **Decision:** Consolidate to essential ones
- **Status:** ⚠️ Needs consolidation

### Proposed Restructure Plan

#### Phase 1: Data Consolidation
1. Move `data/` → `scraper-lite/data/` (scraper-related JSON files)
2. Verify no broken imports

#### Phase 2: i18n Organization
1. Analyze all i18n imports
2. Move `i18n/` → `shared/i18n/` (if no conflicts)
3. Update all imports

#### Phase 3: Documentation
1. Keep essential docs: `REPOSITORY_STRUCTURE.md`, `COLLEAGUE_ONBOARDING_RESTRUCTURE.md`, `CLEANUP_REPORT.md`
2. Archive old docs to `docs/archive/` or consolidate
3. Create comprehensive guide combining repo map + scraper deep dive

#### Phase 4: Clean Structure
1. Ensure all files in logical subdirectories
2. Verify imports
3. Run typecheck
4. Push to git

---

## 📝 Remaining Tasks

