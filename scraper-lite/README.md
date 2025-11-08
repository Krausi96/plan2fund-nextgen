# Scraper-Lite: Unified Documentation

**Complete guide to the scraper-lite directory structure, commands, and usage.**

---

## 📁 Directory Structure

```
scraper-lite/
├── unified-scraper.ts          # Main entry point - orchestrates discovery & scraping
├── db/                          # Database layer
│   └── db.ts                    # All database operations (PostgreSQL/Neon)
├── src/                         # Source code organized by function
│   ├── config/                  # Configuration
│   │   ├── config.ts             # Runtime configuration (env vars, settings)
│   │   └── institutionConfig.ts  # Institution definitions (seed URLs, funding types)
│   ├── core/                    # Core LLM functionality
│   │   ├── llm-discovery.ts     # URL classification (is program page?)
│   │   ├── llm-extract.ts       # Requirement extraction from pages
│   │   └── llmCache.ts          # LLM response caching
│   ├── learning/                # Autonomous learning system
│   │   └── auto-learning.ts     # Unified learning module (merged from 4 files)
│   ├── rescraping/              # Re-scraping system
│   │   └── unified-rescraping.ts # Overview pages, blacklisted URLs re-scraping
│   ├── utils/                   # Utility functions
│   │   ├── blacklist.ts         # URL blacklisting (hardcoded + database patterns)
│   │   ├── blacklist-recheck.ts # Re-check low-confidence exclusions
│   │   ├── date.ts              # Date normalization
│   │   ├── funding-types.ts     # Funding type normalization & inference
│   │   ├── login.ts             # Login page detection
│   │   ├── overview-filters.ts  # Overview page detection & filter exploration
│   │   └── utils.ts             # General utilities (fetchHtml, etc.)
│   └── db/                      # Database schema & migrations
│       ├── neon-schema.sql      # PostgreSQL schema definition
│       └── run-migration.ts     # Migration runner
├── test/                        # Test & utility scripts
│   ├── reusable/                # Reusable monitoring/debugging tools
│   │   ├── analyze-discovery.ts      # Discovery analysis
│   │   ├── analyze-extracted-data.ts # Data quality analysis
│   │   ├── analyze-requirement-values.ts # Deep requirement value analysis
│   │   ├── analyze-requirements.ts   # Requirement quality analysis
│   │   ├── check-queue.ts            # Queue status
│   │   ├── check-results.ts           # Results verification
│   │   ├── monitor-learning.ts        # Learning system status
│   │   ├── show-actual-data.ts        # Sample data viewer
│   │   └── speed-test.ts              # Performance testing
│   ├── one-time/                # One-time utility scripts
│   │   ├── check-openai-usage.ts     # OpenAI API usage check
│   │   ├── clean-bad-urls.ts         # Clean invalid URLs
│   │   ├── clean-failed-jobs.ts       # Clean failed scraping jobs
│   │   ├── full-cycle-test.ts         # Full cycle test (integrated into main)
│   │   └── queue-test-url.ts          # Queue a test URL
│   ├── analyze-test-files.ts   # Test file analysis
│   ├── db-status.ts             # Database health check
│   ├── fix-category-names.ts    # Fix requirement category names
│   ├── full-cycle-demo.ts       # Full cycle demonstration
│   ├── learn-requirement-patterns.ts # Manual requirement pattern learning
│   ├── manage-blacklist.ts      # Manual blacklist management
│   ├── normalize-funding-types.ts    # Normalize funding types in DB
│   ├── recheck-blacklist.ts      # Manual blacklist re-check
│   ├── show-full-cycle-status.ts     # Full cycle status overview
│   ├── test-merged-learning.ts  # Test merged learning module
│   ├── test-next-batch-features.ts   # Test new features
│   └── test-small-batch.ts      # Small batch test (integrated into main)
├── data/                        # Data storage
│   └── lite/                    # Scraper-lite data
│       ├── llm-cache/           # LLM response cache
│       │   └── cache.json        # Cached LLM responses
│       ├── raw/                  # Raw HTML files (4286 files)
│       └── state.json            # Scraper state
└── docs/                        # Historical documentation
    └── [35+ markdown files]     # Implementation history, analysis, etc.
```

---

## 🚀 Commands

### Main Scraper Commands

#### **Full Cycle (Discovery + Scraping)**
```bash
# Run full cycle with default limits (50 discovery, 20 scraping)
npm run scraper:unified -- full

# Run with custom limits
npm run scraper:unified -- full --max=10    # 10 discovery + 10 scraping
npm run scraper:unified -- full --max=3     # 3 discovery + 3 scraping
```

#### **Discovery Only**
```bash
# Discover new URLs (default: 50)
npm run scraper:unified -- discover

# Discover with custom limit
npm run scraper:unified -- discover --max=5
```

#### **Scraping Only**
```bash
# Scrape queued URLs (default: 20)
npm run scraper:unified -- scrape

# Scrape with custom limit
npm run scraper:unified -- scrape --max=5
```

### Database Commands

#### **Database Migration**
```bash
# Run database migrations
npm run lite:migrate
```

#### **Database Status**
```bash
# Check database health and statistics
npm run db:status
```

### Monitoring & Analysis Commands

#### **Learning System Monitor**
```bash
# Monitor learning system status (accuracy, patterns, etc.)
npm run monitor:learning
```

#### **Discovery Analysis**
```bash
# Analyze discovery results
npm run test:analyze-discovery
```

#### **Requirements Analysis**
```bash
# Analyze requirement quality
npm run test:analyze-requirements
```

#### **Data Quality Analysis**
```bash
# Analyze extracted data quality
npm run analyze:data
```

#### **Requirement Values Analysis**
```bash
# Deep analysis of requirement values
npm run analyze:values
```

#### **Show Actual Data**
```bash
# View sample extracted data
npm run show:data
```

#### **Full Cycle Status**
```bash
# Show full cycle status (what's extracted, learned, integrated)
npx tsx scraper-lite/test/show-full-cycle-status.ts
```

### Blacklist Commands

#### **Manage Blacklist**
```bash
# Add URL to blacklist
npm run blacklist:add

# Remove URL from blacklist
npm run blacklist:remove

# List all blacklisted URLs
npm run blacklist:list

# Clean old blacklist entries
npm run blacklist:clean
```

#### **Re-check Blacklist**
```bash
# Manually re-check low-confidence blacklisted URLs
npm run blacklist:recheck
```

### Maintenance Commands

#### **Normalize Funding Types**
```bash
# Normalize funding types in database
npm run normalize:funding-types
```

#### **Clean Failed Jobs**
```bash
# Clean failed scraping jobs
npm run clean:failed
```

### Testing Commands

#### **Speed Test**
```bash
# Performance testing
npm run test:speed
```

#### **Full Cycle Test** (Legacy - now integrated)
```bash
# Legacy full cycle test (use main command instead)
npm run test:full-cycle
```

---

## 📖 Detailed File Descriptions

### Core Files

#### `unified-scraper.ts`
**Main entry point** - Orchestrates the entire scraping cycle:
- **Discovery**: Finds new URLs from seed URLs and overview pages
- **Classification**: Uses LLM to classify URLs (program page or not)
- **Scraping**: Extracts requirements and metadata from pages
- **Learning**: Automatically learns patterns and improves
- **Re-scraping**: Automatically re-scrapes overview pages and low-confidence blacklisted URLs
- **Blacklist Re-check**: Periodically re-checks exclusions

**Key Functions:**
- `discoverPrograms()` - Discovery phase
- `scrapePrograms()` - Scraping phase
- `main()` - Command-line interface

**Usage:**
```bash
npm run scraper:unified -- [discover|scrape|full] [--max=N]
```

#### `db/db.ts`
**Database layer** - All database operations:
- Connection pooling (PostgreSQL/Neon)
- Page CRUD operations
- Requirement management
- Scraping job queue
- URL pattern learning
- Classification feedback
- Quality rules storage
- Requirement patterns storage

**Key Functions:**
- `getPool()` - Get database connection pool
- `savePageWithRequirements()` - Save page with requirements (applies learned patterns)
- `getQueuedUrls()` - Get URLs to scrape
- `markUrlQueued()` - Queue a URL for scraping
- `learnUrlPatternFromPage()` - Learn URL patterns

### Configuration

#### `src/config/config.ts`
**Runtime configuration** - Reads from environment variables:
- `OPENAI_API_KEY` - OpenAI API key
- `CUSTOM_LLM_ENDPOINT` - Custom LLM endpoint (e.g., OpenRouter)
- `DISABLE_LLM` - Disable LLM (for testing)
- `DATABASE_URL` - PostgreSQL connection string
- `MAX_DISCOVERY` - Max URLs to discover (default: 50)
- `MAX_SCRAPE` - Max URLs to scrape (default: 20)
- `FORCE_UPDATE` - Re-scrape existing pages (default: false)

#### `src/config/institutionConfig.ts`
**Institution definitions** - Seed URLs and funding types:
- Institution metadata (name, region, website)
- Seed URLs for discovery
- Default funding types per institution
- Program focus areas

**To add new institutions:**
1. Add entry to `institutions` array
2. Define `seedUrls`, `fundingTypes`, `region`, etc.

### Core LLM Functions

#### `src/core/llm-discovery.ts`
**URL classification** - Determines if a URL is a funding program page:
- `classifyUrl()` - Classify single URL
- `batchClassifyUrls()` - Classify multiple URLs (batch)
- Uses improved prompts (learns from mistakes)
- Returns: `isProgramPage`, `fundingType`, `qualityScore`, `isOverviewPage`

#### `src/core/llm-extract.ts`
**Requirement extraction** - Extracts structured data from pages:
- `extractWithLLM()` - Extract requirements, metadata, funding details
- Uses caching to avoid duplicate LLM calls
- Returns: `categorized_requirements`, `metadata`, `funding_types`, etc.

#### `src/core/llmCache.ts`
**LLM response caching** - Caches LLM responses to reduce API calls:
- Stores responses by URL + prompt hash
- Reduces costs and improves speed
- Cache stored in `data/lite/llm-cache/cache.json`

### Learning System

#### `src/learning/auto-learning.ts`
**Unified learning module** - All learning functionality in one file:

**Classification Feedback:**
- `recordClassificationFeedback()` - Record feedback after scraping
- `getClassificationAccuracy()` - Get accuracy statistics
- `getCommonMistakes()` - Get common mistakes for prompt improvement

**Quality Pattern Learning:**
- `analyzeFundingType()` - Analyze examples per funding type
- `generateQualityRules()` - Generate quality rules from analysis
- `learnAllPatterns()` - Learn patterns for all funding types
- `getStoredQualityRules()` - Get stored quality rules

**Requirement Pattern Learning:**
- `learnRequirementPatterns()` - Learn requirement patterns
- `storeRequirementPatterns()` - Store patterns in database
- `getStoredRequirementPatterns()` - Get stored patterns
- `autoLearnRequirementPatterns()` - Auto-learn requirement patterns

**Auto-Learning Orchestration:**
- `shouldLearnQualityPatterns()` - Check if it's time to learn
- `autoLearnQualityPatterns()` - Trigger auto-learning
- `getImprovedClassificationPrompt()` - Generate improved prompts
- `getLearningStatus()` - Report learning status

**Automatic Integration:**
- Runs every 100 new pages
- Learns from classification feedback
- Improves prompts automatically
- Filters generic requirements automatically
- Deduplicates requirements automatically

### Re-Scraping System

#### `src/rescraping/unified-rescraping.ts`
**Re-scraping system** - Handles re-scraping of:
- Overview pages (older than 7 days)
- Low-confidence blacklisted URLs (might be false positives)
- Manually flagged pages (future feature)

**Key Functions:**
- `getReScrapeTasks()` - Get re-scrape tasks
- `markReScrapeCompleted()` - Mark task as completed
- `getReScrapeStats()` - Get statistics

**Automatic Integration:**
- Runs after scraping phase
- Processes up to 3 tasks per cycle
- Integrated into `unified-scraper.ts`

### Utilities

#### `src/utils/blacklist.ts`
**URL blacklisting** - Excludes unwanted URLs:
- Hardcoded patterns (career pages, contact pages, etc.)
- Database-backed patterns (learned from scraping)
- `isUrlExcluded()` - Check if URL should be excluded

**Hardcoded Exclusions:**
- Career/job pages (`/karriere/`, `/career/`, `/jobs/`)
- Contact pages (`/contact/`, `/kontakt/`)
- About pages (`/about/`, `/ueber/`)
- Legal pages (`/imprint/`, `/privacy/`)
- News/media pages (`/news/`, `/press/`)

#### `src/utils/blacklist-recheck.ts`
**Blacklist re-check** - Re-checks low-confidence exclusions:
- `recheckExcludedUrl()` - Re-check single URL
- `runRecheckCycle()` - Run full re-check cycle
- Prevents false positives

**Automatic Integration:**
- Runs every 7 days
- Integrated into `unified-scraper.ts`

#### `src/utils/funding-types.ts`
**Funding type normalization** - Normalizes funding types:
- `normalizeFundingTypes()` - Normalize to canonical types
- `inferFundingType()` - Infer from URL/content
- Canonical types: `grant`, `loan`, `equity`, `subsidy`, `guarantee`, etc.

#### `src/utils/date.ts`
**Date normalization** - Normalizes dates:
- `normalizeDate()` - Parse and normalize dates
- Handles various date formats
- Returns ISO format

#### `src/utils/login.ts`
**Login detection** - Detects login-required pages:
- `requiresLogin()` - Check if page requires login
- Uses heuristics (form fields, keywords)

#### `src/utils/overview-filters.ts`
**Overview page detection** - Detects overview pages:
- `isOverviewPage()` - Check if page lists multiple programs
- `exploreOverviewFilters()` - Explore filters on overview pages

#### `src/utils/utils.ts`
**General utilities**:
- `fetchHtml()` - Fetch HTML from URL
- `isUrlExcluded()` - Check blacklist (delegates to `blacklist.ts`)

### Database Schema

#### `src/db/neon-schema.sql`
**PostgreSQL schema** - Defines all tables:
- `pages` - Scraped pages
- `requirements` - Extracted requirements
- `scraping_jobs` - Scraping queue
- `url_patterns` - Learned URL patterns
- `classification_feedback` - Classification feedback
- `quality_rules` - Learned quality rules
- `requirement_patterns` - Learned requirement patterns

#### `src/db/run-migration.ts`
**Migration runner** - Runs database migrations:
- Reads `neon-schema.sql`
- Executes SQL statements
- Handles errors gracefully

---

## 🔄 Full Cycle Flow

The scraper runs a fully autonomous cycle:

```
1. DISCOVERY
   ├─ Get seed URLs from institutionConfig.ts
   ├─ Check existing pages in database
   ├─ Re-check overview pages (7+ days old)
   ├─ Fetch HTML from seed URLs
   ├─ Extract links from pages
   ├─ Classify links with LLM (using improved prompts)
   └─ Queue high-quality program pages

2. SCRAPING
   ├─ Get queued URLs
   ├─ Fetch HTML from URLs
   ├─ Extract requirements with LLM
   ├─ Apply learned requirement patterns (filter generic, deduplicate)
   ├─ Normalize funding types, dates, metadata
   ├─ Save to database
   ├─ Record classification feedback
   └─ Learn URL patterns

3. LEARNING (Automatic)
   ├─ Classification feedback recorded after each scrape
   ├─ URL patterns learned after each scrape
   ├─ Quality patterns learned every 100 pages
   └─ Requirement patterns learned every 100 pages

4. FEEDBACK INTEGRATION (Automatic)
   ├─ Improved prompts generated from mistakes
   ├─ Next discovery uses improved prompts
   └─ Classification accuracy improves over time

5. RE-SCRAPING (Automatic)
   ├─ Overview pages re-checked after 7 days
   ├─ Low-confidence blacklisted URLs re-checked
   └─ Integrated into scraping phase

6. BLACKLIST RE-CHECK (Automatic)
   ├─ Runs every 7 days
   ├─ Re-checks low-confidence exclusions
   └─ Prevents false positives
```

---

## 🎯 Common Use Cases

### Run a Small Batch Test
```bash
npm run scraper:unified -- full --max=3
```

### Check Learning Status
```bash
npm run monitor:learning
```

### Check Full Cycle Status
```bash
npx tsx scraper-lite/test/show-full-cycle-status.ts
```

### Analyze Requirements
```bash
npm run test:analyze-requirements
```

### Check Queue Status
```bash
npx tsx scraper-lite/test/reusable/check-queue.ts
```

### Add New Institution
1. Edit `src/config/institutionConfig.ts`
2. Add institution entry with seed URLs
3. Run discovery: `npm run scraper:unified -- discover --max=10`

### Force Re-scrape Existing Pages
Set environment variable:
```bash
export FORCE_UPDATE=true
npm run scraper:unified -- scrape --max=10
```

### Check Database Status
```bash
npm run db:status
```

---

## 🔧 Environment Variables

Required in `.env.local`:

```bash
# Database
DATABASE_URL=postgresql://user:password@host/database

# LLM (one of these)
OPENAI_API_KEY=sk-...
# OR
CUSTOM_LLM_ENDPOINT=https://openrouter.ai/api/v1/chat/completions
CUSTOM_LLM_API_KEY=sk-...

# Optional
DISABLE_LLM=false              # Disable LLM (for testing)
SCRAPER_CONCURRENCY=8          # Parallel scraping (default: 8)
FORCE_UPDATE=false             # Re-scrape existing pages
```

---

## 📊 Current Status

Check current status:
```bash
npx tsx scraper-lite/test/show-full-cycle-status.ts
```

Shows:
- Pages extracted
- Requirements extracted
- Classification accuracy
- Learned patterns
- Automatic integration status

---

## 🐛 Troubleshooting

### No URLs Discovered
- Check seed URLs in `institutionConfig.ts`
- Check blacklist: `npm run blacklist:list`
- Check database: `npm run db:status`

### LLM Errors
- Check API keys in `.env.local`
- Check rate limits
- Check `data/lite/llm-cache/cache.json` for cached responses

### Database Errors
- Check `DATABASE_URL` in `.env.local`
- Run migration: `npm run lite:migrate`
- Check connection: `npm run db:status`

### Low Classification Accuracy
- Check learning status: `npm run monitor:learning`
- Review mistakes: `npm run test:analyze-discovery`
- Wait for more feedback (needs 100+ classifications)

---

## 📚 Additional Documentation

- `INTEGRATION_COMPLETE.md` - Integration status
- `TEST_FILES_ANALYSIS.md` - Test files analysis
- `MERGE_SUMMARY.md` - Learning files merge summary
- `ARCHITECTURE_ANALYSIS.md` - Architecture analysis
- `docs/` - Historical documentation

---

## 🎉 Quick Start

1. **Setup environment:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your DATABASE_URL and LLM keys
   ```

2. **Run migration:**
   ```bash
   npm run lite:migrate
   ```

3. **Run small batch:**
   ```bash
   npm run scraper:unified -- full --max=3
   ```

4. **Check status:**
```bash
   npx tsx scraper-lite/test/show-full-cycle-status.ts
```

5. **Monitor learning:**
```bash
   npm run monitor:learning
```

---

**The scraper is fully autonomous!** Just run the main command and it handles discovery, scraping, learning, feedback integration, and re-scraping automatically. 🚀

