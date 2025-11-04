# Quality Improvement Cycle - Manual Scripts

## Overview

Two scripts are available for comprehensive quality improvement:

1. **`full-quality-cycle.js`** - Complete cycle from scratch
2. **`quick-quality-improvement.js`** - Fast analysis of existing data

## Full Quality Cycle

**Script**: `scripts/manual/full-quality-cycle.js`

**What it does:**
1. Initial Quality Assessment
2. Discovery Phase (finds new URLs)
3. Scraping Phase (extracts data)
4. Pattern Learning
5. Comprehensive Quality Analysis
6. Extraction Improvement Analysis
7. Category Usefulness Analysis
8. Re-scraping Low Quality Pages
9. Validation of Improvements
10. Final Quality Report
11. System Verification

**Usage:**
```bash
cd scraper-lite
node scripts/manual/full-quality-cycle.js
```

**Environment Variables:**
- `LITE_ALL_INSTITUTIONS=1` - Use all institutions (default: first 3)
- `MAX_CYCLES=3` - Number of discovery/scraping cycles
- `SCRAPE_BATCH_SIZE=50` - Pages to scrape per batch
- `LITE_MAX_DISCOVERY_PAGES=500` - Max pages to discover per cycle

**Duration**: ~30-60 minutes (depending on discovery size)

## Quick Quality Improvement

**Script**: `scripts/manual/quick-quality-improvement.js`

**What it does:**
1. Initial Quality Assessment
2. Comprehensive Quality Analysis
3. Extraction Improvement Analysis
4. Category Usefulness Analysis
5. Discovery Coverage Analysis
6. URL Quality Check
7. Final Quality Report

**Usage:**
```bash
cd scraper-lite
node scripts/manual/quick-quality-improvement.js
```

**Duration**: ~2-5 minutes (no discovery/scraping)

## Key Insights from Latest Run

### Discovery Coverage
- ✅ All 101 institutions have autoDiscovery enabled
- ✅ 266 seed URLs across all institutions
- ✅ 0 institutions missing autoDiscovery

### Database Coverage
- **Grant**: 424 pages (1.1% coverage)
- **Loan**: 200 pages (1.2% coverage)
- **Bank Loan**: 37 pages (0.5% coverage)
- **Equity**: 16 pages (0.1% coverage)
- **Null funding_type**: 498 pages (needs fixing)

### Issues Identified
1. **Funding Type Gaps**: 1,024 pages have `null` funding_type
   - Need to fix funding_type assignment
   - Should infer from URL patterns or metadata

2. **Strict URL Filtering**: `isProgramDetailPage()` may be too strict
   - May miss valid program pages
   - Consider relaxing patterns

3. **Data Quality**: 
   - Funding amounts: 17.6% coverage (target: 40%+)
   - Deadlines: 6.3% coverage (target: 30%+)
   - Contact info: 16.2% coverage (target: 40%+)

## Recommendations

### To Improve Discovery
1. ✅ Enable autoDiscovery for all institutions (DONE)
2. Relax `isProgramDetailPage()` patterns
3. Add more seed URLs per institution
4. Improve institution-specific patterns

### To Improve Accuracy
1. Fix funding_type assignment (currently null)
2. Validate extracted data before saving
3. Add data quality checks
4. Implement confidence scores

### To Eliminate Mistakes
1. Validate funding amounts (filter years, invalid numbers)
2. Validate deadlines (proper date format)
3. Validate contact info (email format, phone format)
4. Cross-check with institution-specific rules

## Individual Scripts

You can also run individual scripts for specific improvements:

- `verify-database-quality.js` - Check overall data quality
- `comprehensive-quality-analysis.js` - Deep dive into all categories
- `improve-extraction.js` - Analyze extraction patterns
- `analyze-category-usefulness.js` - Category effectiveness
- `analyze-discovery-coverage.js` - URL discovery coverage
- `quality-check-urls.js` - URL quality validation
- `rescrape-pages.js` - Re-scrape low quality pages
- `validate-improvements.js` - Validate improvements

## Next Steps

1. **Fix Funding Type Assignment**
   ```bash
   node scripts/manual/fix-null-funding-types.js
   ```

2. **Re-scrape Low Quality Pages**
   ```bash
   node scripts/manual/rescrape-pages.js --missing-only
   ```

3. **Run Full Cycle** (when you have time)
   ```bash
   node scripts/manual/full-quality-cycle.js
   ```

