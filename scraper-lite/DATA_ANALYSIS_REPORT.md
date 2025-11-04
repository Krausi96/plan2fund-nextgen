# 📊 Comprehensive Data Analysis Report

## Current Status

### 📄 Pages Scraped
- **Total Pages**: 1,216
- **Pages with Requirements**: 944 (77.6%)
- **Pages with ALL Critical Categories**: 263 (21.6%)

### 📋 Requirements Extracted
- **Total Requirements**: 20,287
- **Average per Page**: 16.7 requirements
- **All 19 Categories**: ✅ Present

### 🎯 Meaningfulness
- **Average Score**: 59.8/100
- **High Quality (80+)**: 2,487 (24.9%)
- **Medium Quality (50+)**: 8,241 (82.4%)
- **Low Quality (<50)**: 1,759 (17.6%)

### 📊 Overall Data Quality Score: **53.3/100**
⚠️ **Good quality, but significant room for improvement**

---

## 🔍 Data Completeness Analysis

### ✅ Strengths (Good Coverage)
- **Title & Description**: 100% ✅
- **Geographic**: 831 pages (68.3%) ✅
- **Financial**: 789 pages (64.9%) ✅
- **Project**: 738 pages (60.7%) ✅
- **Eligibility**: 700 pages (57.6%) ✅
- **Region**: 702 pages (57.7%) ✅

### ⚠️ Weaknesses (Low Coverage)

#### Critical Metadata Missing:
1. **Funding Amounts**: Only 17.6% (214/1216 pages)
   - Target: 40%+
   - Missing: 1,002 pages

2. **Deadlines**: Only 6.3% (77/1216 pages)
   - Target: 30%+
   - Missing: 1,139 pages

3. **Contact Info**: Only 16.2% (197/1216 pages)
   - Target: 40%+
   - Missing: 1,019 pages

#### Low Category Coverage:
- **Market Size**: 19 pages (1.6%) ❌
- **Co-Financing**: 15 pages (1.2%) ❌
- **TRL Level**: 9 pages (0.7%) ❌
- **Revenue Model**: 95 pages (7.8%) ⚠️

---

## 🎯 Why Data is Missing

### 1. **Discovery Issues**
- Many URLs may not have been discovered
- URL filtering might be too strict
- Seed URLs may not cover all programs

### 2. **Extraction Issues**
- Patterns may not match all page structures
- Some data in tables/structured formats not captured
- Institution-specific patterns missing

### 3. **Data Quality Issues**
- False positives filtered out (years mistaken as amounts)
- Validation too strict
- Missing fallback extraction strategies

---

## 🚀 How to Improve

### 1. **Add More Seed URLs** ⭐ HIGH PRIORITY

**Current Status:**
- ~101 institutions with auto-discovery
- ~266 seed URLs total
- Average: ~2.6 URLs per institution

**Action:**
```bash
# Check current seed URLs
cd scraper-lite
node -e "const {getAllSeedUrls, institutions} = require('./src/config.ts'); console.log('Total:', getAllSeedUrls().length); institutions.forEach(i => console.log(i.name, ':', i.seedUrls.length));"
```

**How to Add More:**
1. Visit each institution's website
2. Find ALL program pages (not just main pages)
3. Add program detail page URLs to `seedUrls` in `config.ts`
4. Target: 5-10 seed URLs per institution = 500-1000 total URLs

**Example:**
```typescript
{
  name: "AWS",
  seedUrls: [
    "https://www.aws.at/en/aws-seedfinancing/",
    "https://www.aws.at/en/aws-preseed/",
    "https://www.aws.at/en/aws-growth-investment/",
    // Add MORE specific program URLs here
  ]
}
```

### 2. **Improve Extraction Patterns** ⭐ HIGH PRIORITY

**Current Issues:**
- Funding amounts: Only 17.6% extracted
- Deadlines: Only 6.3% extracted
- Contact info: Only 16.2% extracted

**Actions:**

#### A. Table-Based Extraction
Many funding pages have data in tables like:
```html
<table>
  <tr><td>Funding Amount</td><td>€500,000</td></tr>
  <tr><td>Deadline</td><td>15.03.2025</td></tr>
</table>
```

**Improve:** Add table extraction patterns in `extract.ts`

#### B. Structured Data Extraction
Many sites use JSON-LD or microdata:
```html
<script type="application/ld+json">
{"@type": "FundingScheme", "amount": "500000"}
</script>
```

**Improve:** Enhance JSON-LD extraction (already started, needs more patterns)

#### C. Institution-Specific Patterns
Each institution has different page structures.

**Improve:** 
- Run `improve-extraction.js` to learn patterns
- Add institution-specific extraction rules
- Store patterns in database for reuse

### 3. **Relax Discovery Filtering** ⭐ MEDIUM PRIORITY

**Current Issue:**
- `isProgramDetailPage()` may be too strict
- Many valid program pages rejected

**Action:**
- Review `src/utils.ts` `isProgramDetailPage()` function
- Relax patterns to accept more URLs
- Add more funding/program keywords

### 4. **Run More Discovery Cycles** ⭐ HIGH PRIORITY

**Current Status:**
- 0 jobs queued (all scraped or discovered)
- Need to discover more URLs

**Action:**
```bash
cd scraper-lite

# Run full cycle with more discovery
$env:LITE_ALL_INSTITUTIONS=1
$env:MAX_CYCLES=5
$env:LITE_MAX_DISCOVERY_PAGES=1000
$env:SCRAPE_BATCH_SIZE=100
node scripts/automatic/auto-cycle.js
```

### 5. **Re-scrape Low Quality Pages** ⭐ MEDIUM PRIORITY

**Action:**
```bash
cd scraper-lite
node scripts/manual/rescrape-pages.js --missing-only
```

This will:
- Find pages missing funding amounts, deadlines, contacts
- Re-queue them for scraping
- Use improved extraction patterns

---

## 📈 Expected Improvements

### If You Add More Seed URLs:
- **Current**: 1,216 pages
- **With 500 seed URLs**: ~3,000-5,000 pages (estimated)
- **With 1000 seed URLs**: ~6,000-10,000 pages (estimated)

### If You Improve Extraction Patterns:
- **Funding Amounts**: 17.6% → 40%+ (target)
- **Deadlines**: 6.3% → 30%+ (target)
- **Contact Info**: 16.2% → 40%+ (target)

### If You Run More Discovery:
- More URLs discovered per cycle
- Better coverage of institutions
- More pages with complete data

---

## 🎯 Recommended Action Plan

### Phase 1: Immediate (Today)
1. ✅ Run quality check (DONE)
2. 🔄 Run full cycle with more discovery:
   ```bash
   cd scraper-lite
   $env:LITE_ALL_INSTITUTIONS=1; $env:MAX_CYCLES=5; $env:LITE_MAX_DISCOVERY_PAGES=1000; node scripts/automatic/auto-cycle.js
   ```

### Phase 2: Short Term (This Week)
1. Add more seed URLs (target: 500+ total)
2. Run `improve-extraction.js` to learn patterns
3. Re-scrape low quality pages:
   ```bash
   node scripts/manual/rescrape-pages.js --missing-only
   ```

### Phase 3: Medium Term (This Month)
1. Improve table-based extraction
2. Add institution-specific patterns
3. Relax discovery filtering
4. Target: 5,000+ pages, 60%+ quality score

---

## 📊 Current Metrics Summary

| Metric | Current | Target | Gap |
|--------|---------|--------|-----|
| Total Pages | 1,216 | 5,000+ | -3,784 |
| Funding Amounts | 17.6% | 40%+ | -22.4% |
| Deadlines | 6.3% | 30%+ | -23.7% |
| Contact Info | 16.2% | 40%+ | -23.8% |
| Quality Score | 53.3/100 | 70+/100 | -16.7 |
| Critical Categories | 21.6% | 40%+ | -18.4% |

---

## 💡 Key Insights

1. **You have good foundational data** (1,216 pages, 20,287 requirements)
2. **Main gaps are in metadata** (amounts, deadlines, contacts)
3. **Discovery needs more seed URLs** to find more pages
4. **Extraction patterns need improvement** for better data capture
5. **Re-scraping will help** once patterns are improved

---

## 🚀 Quick Wins

1. **Run discovery cycle** (30-60 min):
   ```bash
   cd scraper-lite
   $env:LITE_ALL_INSTITUTIONS=1; $env:MAX_CYCLES=3; node scripts/automatic/auto-cycle.js
   ```

2. **Check quality** (2 min):
   ```bash
   node scripts/manual/verify-database-quality.js
   ```

3. **Re-scrape missing data** (varies):
   ```bash
   node scripts/manual/rescrape-pages.js --missing-only
   ```

---

**Next Steps:** Run the discovery cycle with more pages to find more URLs and improve data quality!

