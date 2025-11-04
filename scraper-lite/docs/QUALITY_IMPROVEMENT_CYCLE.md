# Quality Improvement Cycle - Using Existing Scripts

## Overview

**You should use the existing `auto-cycle.js` script** which already includes all quality checks!

## Recommended: Use Existing Auto-Cycle

**Script**: `scripts/automatic/auto-cycle.js`

**What it already includes:**
1. ✅ Discovery Phase (finds new URLs)
2. ✅ Scraping Phase (extracts data in batches)
3. ✅ Pattern Learning (every 2 cycles)
4. ✅ Extraction Quality Analysis (every 3 cycles)
5. ✅ Database Quality Check (every 2 cycles)
6. ✅ Component Data Verification
7. ✅ Auto-Rescrape Low Quality Pages (every 4 cycles)
8. ✅ Retry Failed Jobs
9. ✅ Detailed Analysis & Monitoring

**Usage:**
```bash
cd scraper-lite

# Basic run (first 3 institutions)
node scripts/automatic/auto-cycle.js

# Full run (all institutions, more cycles)
LITE_ALL_INSTITUTIONS=1 MAX_CYCLES=5 SCRAPE_BATCH_SIZE=100 node scripts/automatic/auto-cycle.js
```

**Environment Variables:**
- `LITE_ALL_INSTITUTIONS=1` - Use all institutions (default: first 3)
- `MAX_CYCLES=3` - Number of discovery/scraping cycles (default: 10)
- `SCRAPE_BATCH_SIZE=100` - Pages to scrape per batch (default: 100)
- `LITE_MAX_DISCOVERY_PAGES=500` - Max pages to discover per cycle (default: 200)
- `MIN_NEW_URLS=5` - Minimum new URLs to continue (default: 5)

**Duration**: ~30-60 minutes (depending on discovery size)

## Wrapper Scripts

### full-quality-cycle.js
**Location**: `scripts/manual/full-quality-cycle.js`

This is now a **wrapper** around `auto-cycle.js` that sets recommended defaults.

**Usage:**
```bash
cd scraper-lite
node scripts/manual/full-quality-cycle.js
```

### quick-quality-improvement.js
**Location**: `scripts/manual/quick-quality-improvement.js`

Fast analysis of existing data **without** discovery/scraping.

**Usage:**
```bash
cd scraper-lite
node scripts/manual/quick-quality-improvement.js
```

**Duration**: ~2-5 minutes

## Individual Manual Scripts

For specific tasks, you can run individual scripts:

### Quality Analysis
- `verify-database-quality.js` - Overall quality metrics
- `comprehensive-quality-analysis.js` - Deep dive into categories
- `analyze-category-usefulness.js` - Category effectiveness
- `improve-extraction.js` - Extraction pattern analysis

### Discovery & URLs
- `analyze-discovery-coverage.js` - URL discovery coverage
- `quality-check-urls.js` - URL quality validation

### Maintenance
- `rescrape-pages.js` - Re-scrape low quality pages
- `validate-improvements.js` - Validate improvements

## Key Insights

### Discovery Coverage
- ✅ All 101 institutions have autoDiscovery enabled
- ✅ 266 seed URLs across all institutions

### Database Coverage
- **Grant**: 424 pages
- **Loan**: 200 pages
- **Bank Loan**: 37 pages
- **Equity**: 16 pages

### Current Data Quality
- **Overall Score**: 53.3/100
- **Funding Amounts**: 17.6% coverage (target: 40%+)
- **Deadlines**: 6.3% coverage (target: 30%+)
- **Contact Info**: 16.2% coverage (target: 40%+)
- **Meaningfulness Scores**: 59.8 average

## Recommendations

### To Improve Discovery
1. ✅ Enable autoDiscovery for all institutions (DONE)
2. Relax `isProgramDetailPage()` patterns
3. Add more seed URLs per institution

### To Improve Data Quality
1. Fix funding_type assignment (1,024 pages have null)
2. Improve extraction patterns for amounts, deadlines, contacts
3. Re-scrape low quality pages: `node scripts/manual/rescrape-pages.js --missing-only`

## Next Steps

1. **Run Auto-Cycle** (recommended):
   ```bash
   cd scraper-lite
   LITE_ALL_INSTITUTIONS=1 MAX_CYCLES=3 node scripts/automatic/auto-cycle.js
   ```

2. **Fix Funding Types**:
   ```bash
   node scripts/manual/fix-null-funding-types.js
   ```

3. **Re-scrape Low Quality Pages**:
   ```bash
   node scripts/manual/rescrape-pages.js --missing-only
   ```
