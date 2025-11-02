# 👋 Welcome to Plan2Fund - Repository Restructure & Scraper Guide

**Date:** 2025-11-02  
**For:** New Team Member  
**Status:** ✅ Repository Recently Restructured

---

## 📋 Your Tasks Overview

### 1. **Complete Repository Structure Documentation** 
   - Map ALL files to their purpose
   - Document scraper-lite folder structure (manual vs automatic scripts)
   - Identify loose files and improve organization

### 2. **Scraper-Lite & Database Deep Dive**
   - Understand URL discovery process
   - Requirements parsing and quality assessment
   - Pattern learning system
   - URL monitoring and blacklisting
   - **Database connection and integration** ⚠️ IMPORTANT

### 3. **Repository Cleanup**
   - Remove redundant scripts and markdown files
   - Delete dead code and unused components
   - Keep repo lightweight
   - **Keep `legacy/institutionConfig.ts`** (NOT legacy - still used!)
   - **Keep `legacy/webScraperService.ts`** but disable code (documentation only)

---

## 🏗️ Repository Structure Overview

### **Current Organization (Post-Restructure)**

```
plan2fund-nextgen/
├── features/              # Feature modules (self-contained)
│   ├── reco/             # Recommendation engine
│   ├── editor/            # Business plan editor
│   ├── intake/            # User onboarding
│   ├── export/            # Export & payments
│   └── library/           # Program library
│
├── shared/                # Shared code (used by multiple features)
│   ├── components/        # Shared React components
│   │   ├── layout/       # Header, Footer, Breadcrumbs (7 files)
│   │   ├── common/       # Hero, CTA, SEO (18 files)
│   │   └── ui/           # Base UI primitives (9 files)
│   ├── lib/              # Shared utilities (15 files)
│   ├── types/             # TypeScript types (3 files)
│   ├── contexts/          # React contexts (2 files)
│   ├── data/              # Static data files (6 files)
│   └── i18n/              # Internationalization (1 file)
│
├── pages/                 # Next.js Pages (CANNOT MOVE - Framework Requirement)
│   ├── api/               # API routes (14 files)
│   └── *.tsx              # Page components (26 files)
│
├── scraper-lite/          # Backend Data Collection System
│   ├── src/               # Core scraper code (8 files)
│   ├── scripts/            # Utility scripts (22 files - see below)
│   ├── docs/              # Documentation (4 files)
│   └── data/              # Scraped data storage
│
├── legacy/                # Legacy Code (Reference Only)
│   ├── institutionConfig.ts    # ⚠️ STILL USED - DO NOT DELETE
│   └── webScraperService.ts   # Keep but disable code (docs only)
│
└── [other root files]
```

---

## 🔍 Scraper-Lite Structure Deep Dive

### **Core Scraper Code** (`scraper-lite/src/`)

| File | Purpose | Runs When |
|------|---------|-----------|
| `extract.ts` | Extracts metadata & 18 requirement categories from HTML | Every scrape |
| `scraper.ts` | Main scraping logic (discovery + scraping + state management) | Manual or auto-cycle |
| `config.ts` | Loads institution configuration from `legacy/institutionConfig.ts` | On startup |
| `utils.ts` | URL normalization, page classification utilities | Every operation |
| `db/neon-client.ts` | Database connection pool (NEON PostgreSQL) | Every database operation |
| `db/page-repository.ts` | Save/read pages from database | Every scrape |
| `db/job-repository.ts` | Job queue management | Every discovery/scrape |
| `db/neon-schema.sql` | Database schema | Migration only |

### **Scripts Directory** (`scraper-lite/scripts/`) - **22 Files**

#### **🔴 MANUAL SCRIPTS** (Run when needed)

| Script | Purpose | When to Run |
|--------|---------|-------------|
| `add-new-institution.js` | Add new institution to config | When adding new funding source |
| `migrate-to-neon.js` | Migrate JSON data to database | One-time migration |
| `test-neon-connection.js` | Test database connection | When debugging DB issues |
| `reset-state.js` | Clear scraping state (JSON) | When state gets corrupted |
| `debug-extraction.js` | Debug extraction for specific URL | When extraction fails |
| `quick-summary.js` | Quick stats overview | Anytime for status check |

#### **🟡 ANALYSIS SCRIPTS** (Run for quality assessment)

| Script | Purpose | When to Run |
|--------|---------|-------------|
| `comprehensive-quality-analysis.js` | Full quality report (all categories) | After scraping cycles |
| `monitor-improvements.js` | Track extraction quality over time | Periodically |
| `monitor-metadata.js` | Monitor metadata extraction rates | Periodically |
| `analyze-category-usefulness.js` | Check if categories are meaningful | After scraping |
| `analyze-url-quality.js` | Evaluate URL quality (detail pages vs noise) | After discovery |
| `quality-check-urls.js` | Validate scraped URLs | Periodically |

#### **🟢 AUTOMATIC SCRIPTS** (Run by auto-cycle or scheduled)

| Script | Purpose | Runs |
|--------|---------|------|
| `auto-cycle.js` | **MAIN AUTOMATED SCRAPER** - Full discovery → scrape → learn → analyze loop | Continuous cycles |
| `evaluate-unseen-urls.js` | Evaluates unseen URLs, queues good ones, blacklists bad ones | Part of auto-cycle |
| `learn-patterns-from-scraped.js` | Learns URL patterns from successful scrapes | Part of auto-cycle |
| `improve-extraction.js` | Analyzes extraction and suggests improvements | Part of auto-cycle |

#### **🔵 CONFIGURATION & UTILITY SCRIPTS**

| Script | Purpose | When to Run |
|--------|---------|-------------|
| `learn-patterns-from-config.js` | Learn patterns from institution config | Configuration updates |
| `verify-system.js` | System health check | Anytime |
| `safe-cleanup.js` | Safe cleanup of old data | Maintenance |
| `analyze-cleanup.js` | Analyze what can be cleaned | Before cleanup |
| `analyze-config-stats.js` | Stats about institution config | Configuration review |
| `rescrape-pages.js` | Re-scrape existing pages | When extraction improves |
| `test-extract-meta.ts` | Test metadata extraction | Development |

### **How to Run Scraper**

```bash
# Manual discovery + scrape cycle
cd scraper-lite
node run-lite.js full-cycle

# Automated continuous cycles
node scripts/auto-cycle.js

# Test database connection
node scripts/test-neon-connection.js

# Quick quality check
node scripts/quick-summary.js
```

---

## 🗄️ Database Integration (NEON PostgreSQL)

### **Connection**

**Environment Variable Required:**
```bash
DATABASE_URL="postgresql://user:pass@host.neon.tech/dbname"
```

**Set in:** `.env.local` (root directory)

### **Database Schema** (`scraper-lite/src/db/neon-schema.sql`)

**Tables:**
1. **`pages`** - Scraped program data (metadata, funding amounts, deadlines, etc.)
2. **`requirements`** - Categorized requirements (18 categories per page)
3. **`scraping_jobs`** - Job queue (queued, running, done, failed)
4. **`seen_urls`** - URLs already discovered
5. **`url_patterns`** - Learned URL patterns (for filtering)

### **How It Works**

1. **Scraper writes to database:**
   ```typescript
   // In scraper.ts
   const { savePage, saveRequirements } = require('./db/page-repository');
   await savePage(metadata);
   await saveRequirements(pageId, categorized_requirements);
   ```

2. **API reads from database:**
   ```typescript
   // In pages/api/programs.ts
   const { getAllPages, searchPages } = require('../../scraper-lite/src/db/page-repository');
   const pages = await getAllPages(1000);
   ```

3. **Web app fetches via API:**
   ```typescript
   // Frontend
   fetch('/api/programs')
   ```

### **Database Files Location**

**Current:** `scraper-lite/src/db/` (working fine)  
**Future:** Could move to `database/` folder for better organization

**Files:**
- `neon-client.ts` - Connection pool
- `page-repository.ts` - Page CRUD operations
- `job-repository.ts` - Job queue operations
- `neon-schema.sql` - Database schema

---

## 📊 Scraper-Lite Workflow

### **1. URL Discovery**

**Process:**
1. Starts from seed URLs (from `legacy/institutionConfig.ts`)
2. Follows links with keyword filtering
3. Detects "overview pages" (listing pages) and extracts program links
4. Adds valid URLs to job queue
5. Tracks seen URLs to avoid duplicates

**Key Files:**
- `scraper.ts` - `discover()` function
- `utils.ts` - `isProgramDetailPage()`, `isOverviewPage()`
- `config.ts` - Institution keywords and seed URLs

### **2. Scraping**

**Process:**
1. Processes jobs from queue
2. Fetches HTML (with rate limiting: 4 req/sec per host)
3. Extracts metadata (funding, deadline, contact)
4. Extracts 18 requirement categories
5. Saves to database AND JSON (JSON for backwards compatibility)

**Key Files:**
- `extract.ts` - `extractMeta()`, `extractAllRequirements()`
- `scraper.ts` - `scrape()` function
- `db/page-repository.ts` - Database operations

### **3. Requirements Parsing**

**18 Categories Extracted:**
- `eligibility`, `financial`, `documents`, `geographic`, `team`, `project`, `timeline`, `impact`, `co_financing`, `trl`, `use_of_funds`, `reporting`, `intellectual_property`, `compliance`, `evaluation`, `success_criteria`, `application_process`, `deadline`

**Quality Checks:**
- Filters out generic/placeholder text
- Validates meaningful content
- Tracks extraction rates per category

**Monitoring:**
```bash
node scraper-lite/scripts/monitor-improvements.js
node scraper-lite/scripts/comprehensive-quality-analysis.js
```

### **4. Pattern Learning**

**System:**
- Learns URL patterns from successfully scraped pages
- Generates inclusion patterns (good URLs)
- Generates exclusion patterns (bad URLs - overview pages, downloads, etc.)
- Updates filtering logic automatically

**Scripts:**
- `learn-patterns-from-scraped.js` - Main learning script
- `learn-patterns-from-config.js` - Learn from institution config

### **5. URL Monitoring & Blacklisting**

**Process:**
1. `evaluate-unseen-urls.js` evaluates URLs from discovery
2. Classifies: program detail page → queue for scraping
3. Classifies: bad URL → add to blacklist
4. Blacklisted URLs are excluded from future discovery

**Blacklisting Criteria:**
- Overview/listing pages
- Download links (PDF, DOC, etc.)
- Query parameters (search, filter pages)
- Already seen URLs
- Pattern-based exclusion (learned)

---

## 🧹 Repository Cleanup Tasks

### **Priority 1: Scripts Cleanup**

**Keep (Essential):**
- `scraper-lite/scripts/auto-cycle.js` - Main automated scraper
- `scraper-lite/scripts/migrate-to-neon.js` - Database migration
- `scraper-lite/scripts/test-neon-connection.js` - DB testing
- `scraper-lite/run-lite.js` - Main scraper entry point

**Keep (Useful):**
- `scraper-lite/scripts/quick-summary.js` - Status checks
- `scraper-lite/scripts/comprehensive-quality-analysis.js` - Quality reports
- `scraper-lite/scripts/monitor-improvements.js` - Quality monitoring

**Review & Possibly Remove:**
- Duplicate analysis scripts (may consolidate)
- One-off migration scripts (after migration complete)
- Test scripts that are no longer needed

**Root `scripts/` folder:**
- Migration scripts (can remove after restructure complete)
- Analysis scripts (review if still needed)

### **Priority 2: Markdown Cleanup**

**Keep (Essential):**
- `REPOSITORY_STRUCTURE.md` - Structure documentation
- `scraper-lite/README.md` - Scraper documentation
- `scraper-lite/docs/DATABASE_INTEGRATION.md` - Database guide
- `COLLEAGUE_ONBOARDING_RESTRUCTURE.md` - This file

**Review & Consolidate:**
- Multiple structure/migration docs → consolidate to one
- Multiple quality analysis docs → consolidate
- Old migration plans → archive or remove

**Root Docs:**
- `docs/` folder - Review and consolidate if possible

### **Priority 3: Dead Code & Unused Components**

**Process:**
1. Run `npm run typecheck` - find unused imports
2. Search for components that are never imported
3. Check for duplicate components
4. Remove unused utility functions

**Components to Check:**
- `shared/components/` - Any components not imported?
- `features/*/components/` - Any unused feature components?
- Old test/stub components

**Dead Code Patterns:**
- Functions that are never called
- Types that are never used
- Constants that are never referenced

### **Priority 4: Legacy Files**

**⚠️ IMPORTANT - DO NOT DELETE:**
- `legacy/institutionConfig.ts` - **STILL ACTIVE** - Used by scraper
- `legacy/webScraperService.ts` - Keep for documentation but disable code

**What to Do:**
- `institutionConfig.ts` - Keep as-is (it's not legacy!)
- `webScraperService.ts` - Add comment at top: "DISABLED - Documentation Only"

---

## ✅ Pre-Commit Checklist

**ALWAYS check before committing:**

1. **TypeScript Compilation:**
   ```bash
   npm run typecheck
   ```
   ✅ Must pass with 0 errors

2. **Git Status:**
   ```bash
   git status
   ```
   ✅ Review all changes

3. **Test Scraper (if changes to scraper):**
   ```bash
   cd scraper-lite
   node scripts/test-neon-connection.js
   ```

4. **Git Push:**
   ```bash
   git add .
   git commit -m "Descriptive commit message"
   git push origin main
   ```

---

## 📝 Task Breakdown

### **Task 1: Complete Repository Structure Documentation**

**Steps:**
1. Walk through EVERY folder and document:
   - What files exist
   - What each file does
   - When it runs (manual/automatic/scheduled)
   - Dependencies

2. Create file: `COMPLETE_REPO_MAP.md` with:
   - Full file tree with descriptions
   - Purpose of each script
   - Component usage map
   - Import dependency graph

3. Identify loose files:
   - Files in root that should be organized
   - Files in wrong locations
   - Duplicate files

4. Propose improvements:
   - Better folder organization
   - Consolidation opportunities
   - Clear naming conventions

### **Task 2: Scraper-Lite & Database Deep Dive**

**Steps:**
1. **Study URL Discovery:**
   - Read `scraper.ts` `discover()` function
   - Understand `isProgramDetailPage()` logic
   - Understand `isOverviewPage()` detection
   - Test with `node run-lite.js discover`

2. **Study Requirements Parsing:**
   - Read `extract.ts` `extractAllRequirements()`
   - Understand 18 category extraction
   - Run quality analysis: `node scripts/comprehensive-quality-analysis.js`
   - Discuss: What makes a requirement "useful"?

3. **Study Pattern Learning:**
   - Read `learn-patterns-from-scraped.js`
   - Understand how patterns are generated
   - Test learning: Run scraper, then pattern learning
   - Review learned patterns in `data/lite/learned-patterns.json`

4. **Study URL Monitoring:**
   - Read `evaluate-unseen-urls.js`
   - Understand blacklisting logic
   - Review blacklisted URLs

5. **Database Connection:**
   - **CRITICAL:** Verify `DATABASE_URL` in `.env.local`
   - Test connection: `node scripts/test-neon-connection.js`
   - Understand schema: Read `neon-schema.sql`
   - Trace data flow: Scraper → Database → API → Frontend

**Discussion Points:**
- How to improve URL discovery accuracy?
- How to improve requirement extraction quality?
- How to better train pattern learning?
- Database query optimization opportunities?
- Migration from JSON to database-only?

### **Task 3: Repository Cleanup**

**Steps:**
1. **Scripts Audit:**
   ```bash
   # List all scripts
   find . -name "*.js" -path "*/scripts/*" -o -name "*.js" -path "*/script/*" | sort
   
   # Identify duplicates
   # Identify unused scripts
   ```

2. **Markdown Audit:**
   ```bash
   # List all markdown files
   find . -name "*.md" | sort
   
   # Identify duplicates
   # Consolidate similar docs
   ```

3. **Dead Code Analysis:**
   ```bash
   # Find unused exports
   npm run typecheck  # Shows unused code warnings
   
   # Search for unused components
   grep -r "import.*ComponentName" --include="*.tsx" --include="*.ts"
   ```

4. **Component Usage Map:**
   - Create map: Component → Where used
   - Identify unused components
   - Identify duplicate components

5. **Legacy Files Review:**
   - Verify `institutionConfig.ts` usage (it's imported in `scraper-lite/src/config.ts`)
   - Disable `webScraperService.ts` code (add "DISABLED" comment)

---

## 🎯 Expected Deliverables

1. **`COMPLETE_REPO_MAP.md`**
   - Full file tree with descriptions
   - Script categorization (manual/automatic/analysis)
   - Component usage map
   - Improvement proposals

2. **`SCRAPER_DEEP_DIVE.md`**
   - URL discovery explanation
   - Requirements parsing process
   - Pattern learning system
   - Database integration details
   - Monitoring and blacklisting

3. **`CLEANUP_REPORT.md`**
   - Scripts to remove/keep
   - Markdown files to consolidate
   - Dead code identified
   - Unused components list
   - Cleanup execution plan

4. **Code Changes:**
   - Removed dead code
   - Removed unused components
   - Consolidated/removed redundant scripts
   - Disabled `webScraperService.ts`
   - All tests passing (`npm run typecheck` ✅)

---

## 🚨 Important Notes

### **DO NOT DELETE:**
- `legacy/institutionConfig.ts` - **ACTIVE** - Used by scraper
- `legacy/webScraperService.ts` - Keep for docs (just disable code)
- `scraper-lite/src/db/` - Database files (currently working)

### **Always Verify:**
- `npm run typecheck` passes before committing
- Database connection works before running scraper
- Git status shows expected changes

### **Ask Questions:**
- Database schema changes
- Scraper logic changes
- Component removal (may affect frontend)
- Script removal (may affect workflows)

---

## 📚 Key Files to Study

1. **Scraper Core:**
   - `scraper-lite/src/scraper.ts` - Main scraping logic
   - `scraper-lite/src/extract.ts` - Extraction logic
   - `scraper-lite/src/db/page-repository.ts` - Database operations

2. **Database:**
   - `scraper-lite/src/db/neon-schema.sql` - Schema
   - `scraper-lite/src/db/neon-client.ts` - Connection

3. **Configuration:**
   - `legacy/institutionConfig.ts` - Institution config (active!)
   - `scraper-lite/src/config.ts` - Config loader

4. **Structure:**
   - `REPOSITORY_STRUCTURE.md` - Current structure
   - `tsconfig.json` - Path aliases

---

**Good luck! 🚀**

