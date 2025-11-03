# Scripts Directory

## 📁 Organization

### 🤖 Automatic Scripts (`automatic/`)
Scripts that run automatically as part of cycles or scheduled tasks:

- **`auto-cycle.js`** - Fully automated self-running cycle (discover → scrape → learn → improve)
- **`learn-patterns-from-scraped.js`** - Automatic pattern learning from scraped pages
- **`monitor-improvements.js`** - Automatic quality monitoring and reporting
- **`monitor-metadata.js`** - Automatic metadata extraction monitoring

**Usage:**
```bash
# Run automated cycle
node scripts/automatic/auto-cycle.js

# Or via main entry point
node run-lite.js auto
```

### 🛠️ Manual Scripts (`manual/`)
Scripts for manual analysis, debugging, and maintenance:

#### Analysis & Quality
- **`comprehensive-quality-analysis.js`** - Full quality analysis
- **`analyze-category-usefulness.js`** - Analyze category extraction quality
- **`analyze-document-extraction.js`** - Analyze document extraction
- **`analyze-url-quality.js`** - Analyze URL quality
- **`quality-check-urls.js`** - Check URL quality
- **`quick-summary.js`** - Quick overview of results
- **`verify-database-quality.js`** - Verify database quality
- **`verify-database-json-sync.js`** - Verify database/JSON sync

#### Maintenance & Setup
- **`add-new-institution.js`** - Add new institution to config
- **`migrate-to-neon.js`** - Migrate data to NEON database
- **`reset-state.js`** - Reset scraping state
- **`cleanup-storage.js`** - Clean up storage
- **`safe-cleanup.js`** - Safe cleanup operations
- **`analyze-cleanup.js`** - Analyze what can be cleaned

#### Testing & Debugging
- **`test-api-endpoints.js`** - Test API endpoints
- **`test-database-returns.js`** - Test database queries
- **`test-neon-connection.js`** - Test NEON connection
- **`test-question-engine-data.js`** - Test QuestionEngine data
- **`test-extract-meta.ts`** - Test extraction metadata
- **`debug-extraction.js`** - Debug extraction issues
- **`verify-system.js`** - Verify system setup

#### Learning & Improvement
- **`learn-patterns-from-config.js`** - Learn patterns from config
- **`improve-extraction.js`** - Improve extraction based on analysis
- **`evaluate-unseen-urls.js`** - Evaluate unseen URLs
- **`analyze-config-stats.js`** - Analyze config statistics

#### Special Operations
- **`rescrape-pages.js`** - Rescrape specific pages

---

## 🔄 Full Quality Cycle

### Automated Cycle (Recommended)
```bash
# Full automated cycle with quality checks
node run-lite.js auto

# Or with options
MAX_CYCLES=5 SCRAPE_BATCH_SIZE=100 LITE_ALL_INSTITUTIONS=1 node run-lite.js auto
```

### Manual Cycle
```bash
# 1. Discover URLs
node run-lite.js discover

# 2. Scrape discovered URLs
node run-lite.js scrape

# 3. Check quality
node scripts/manual/quick-summary.js
node scripts/manual/monitor-improvements.js
node scripts/manual/quality-check-urls.js

# 4. Analyze quality gaps
node scripts/manual/comprehensive-quality-analysis.js
```

---

## 📊 Quality Monitoring

### Quick Quality Check
```bash
node scripts/manual/quick-summary.js
```

### Detailed Quality Analysis
```bash
node scripts/manual/comprehensive-quality-analysis.js
node scripts/manual/analyze-category-usefulness.js
node scripts/manual/analyze-document-extraction.js
```

### Database Quality Verification
```bash
node scripts/manual/verify-database-quality.js
node scripts/manual/verify-database-json-sync.js
```

---

## 🧪 Testing

### Test Database Connection
```bash
node scripts/manual/test-neon-connection.js
```

### Test API Endpoints
```bash
node scripts/manual/test-api-endpoints.js
```

### Test QuestionEngine Data
```bash
node scripts/manual/test-question-engine-data.js
```

---

## 🔧 Maintenance

### Add New Institution
```bash
node scripts/manual/add-new-institution.js
```

### Reset State
```bash
# Show stats
node scripts/manual/reset-state.js stats

# Clean completed/failed jobs
node scripts/manual/reset-state.js clean-jobs

# Full reset (with backup)
node scripts/manual/reset-state.js reset
```

### Cleanup Storage
```bash
node scripts/manual/safe-cleanup.js
node scripts/manual/analyze-cleanup.js
```
