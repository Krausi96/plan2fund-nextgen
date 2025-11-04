# 🧠 Learning, Discovery & Intelligence Enhancement Guide

**Date:** 2025-11-02  
**Status:** Complete Analysis

---

## 🤖 What's Automatic vs Manual

### ✅ **AUTOMATIC** (Self-Running)

#### 1. **Pattern Learning** 🔄
**Location:** `scraper-lite/src/utils.ts`, `learn-patterns-from-scraped.js`

**What it does:**
- Automatically learns URL patterns from successfully scraped pages
- Identifies good vs. bad URLs
- Updates `data/lite/url-patterns.json`
- Improves URL filtering automatically

**When it runs:**
- After each scraping batch (if enabled)
- When `learn-patterns-from-scraped.js` is called
- Patterns are loaded and used during discovery

**How to trigger:**
```bash
# Automatic in auto-cycle
node scraper-lite/run-lite.js auto

# Manual trigger
node scraper-lite/scripts/learn-patterns-from-scraped.js
```

---

#### 2. **URL Discovery** 🔍
**Location:** `scraper-lite/src/scraper.ts` → `discover()`

**What it does:**
- Automatically discovers new URLs from seed pages
- Uses learned patterns to identify program pages
- Detects overview pages automatically
- Filters out bad URLs using exclusion patterns
- Uses institution-specific keywords

**When it runs:**
- As part of `auto-cycle`
- When manually called: `npm run lite:discover`
- Continuously explores up to `maxDepth`

**How to trigger:**
```bash
# Automatic in auto-cycle
node scraper-lite/run-lite.js auto

# Manual discovery only
npm run lite:discover
# Or:
node scraper-lite/run-lite.js discover
```

---

#### 3. **Auto-Cycle (Full Automation)** 🤖
**Location:** `scraper-lite/scripts/auto-cycle.js`

**What it does:**
1. **Discovery** - Finds new URLs
2. **Scraping** - Processes queued URLs in batches
3. **Pattern Learning** - Learns from successful pages
4. **Retry Logic** - Automatically retries failed jobs (up to 3x)
5. **Self-Stopping** - Stops when no new URLs found

**When it runs:**
- **MANUAL** (you must trigger it)
- Can be scheduled (cron, task scheduler)

**How to trigger:**
```bash
# Run automated cycle
node scraper-lite/run-lite.js auto

# With custom settings
MAX_CYCLES=5 SCRAPE_BATCH_SIZE=100 node scraper-lite/run-lite.js auto
```

**Environment variables:**
- `MAX_CYCLES=10` - Max cycles to run (default: 10)
- `MIN_NEW_URLS=5` - Min new URLs to continue (default: 5)
- `SCRAPE_BATCH_SIZE=100` - URLs per batch (default: 100)
- `LITE_MAX_DISCOVERY_PAGES=200` - Discovery pages per cycle
- `LITE_ALL_INSTITUTIONS=1` - Use all institutions (default: first 3)

---

#### 4. **Automatic Retry Logic** 🔄
**Location:** `scraper-lite/src/scraper.ts` → `scrape()`

**What it does:**
- Automatically retries failed jobs (up to 3 attempts)
- Doesn't mark as permanently failed until max attempts
- Resets to 'queued' for retry

**When it runs:**
- **AUTOMATIC** during scraping
- Part of `scrape()` function

---

#### 5. **Extraction Quality Tracking** 📊
**Location:** `scraper-lite/src/extract.ts`

**What it does:**
- Tracks extraction success rates
- Validates meaningful vs. generic content
- Filters out noise automatically
- Improves extraction patterns based on results

**When it runs:**
- **AUTOMATIC** during extraction
- Every time a page is scraped

---

### ⚙️ **MANUAL** (You Must Run)

#### 1. **Quality Analysis Scripts** 📊

**Database Quality:**
```bash
# Check database quality (requirements, categories, completeness)
node scraper-lite/scripts/verify-database-quality.js
```

**Extraction Quality:**
```bash
# Monitor extraction improvements over time
node scraper-lite/scripts/monitor-improvements.js

# Comprehensive quality analysis
node scraper-lite/scripts/comprehensive-quality-analysis.js

# Quick summary
node scraper-lite/scripts/quick-summary.js
```

**Metadata Quality:**
```bash
# Monitor metadata extraction (funding, deadlines, contacts)
node scraper-lite/scripts/monitor-metadata.js
```

---

#### 2. **Pattern Learning Scripts** 🎓

**Learn from Scraped Data:**
```bash
# Learn URL patterns from successfully scraped pages
node scraper-lite/scripts/learn-patterns-from-scraped.js
```

**Learn from Config:**
```bash
# Extract patterns from institutionConfig.ts
node scraper-lite/scripts/learn-patterns-from-config.js
```

---

#### 3. **Extraction Improvement** 🔧

**Improve Extraction:**
```bash
# Analyze and improve extraction quality
node scraper-lite/scripts/improve-extraction.js
```

**Debug Extraction:**
```bash
# Debug extraction for specific URL
node scraper-lite/scripts/debug-extraction.js <url>
```

---

#### 4. **URL Quality Analysis** 🔍

**Analyze URLs:**
```bash
# Analyze URL quality (identify category vs detail pages)
node scraper-lite/scripts/analyze-url-quality.js

# Evaluate unseen URLs
node scraper-lite/scripts/evaluate-unseen-urls.js

# Quality check URLs
node scraper-lite/scripts/quality-check-urls.js
```

---

#### 5. **State Management** 🗂️

**Reset State:**
```bash
# Show stats
node scraper-lite/scripts/reset-state.js stats

# Clean done/failed jobs
node scraper-lite/scripts/reset-state.js clean-jobs

# Full reset (with backup)
node scraper-lite/scripts/reset-state.js reset
```

**Safe Cleanup:**
```bash
# Clean up old data safely
node scraper-lite/scripts/safe-cleanup.js
```

---

#### 6. **Rescraping** 🔄

**Rescrape Pages:**
```bash
# Rescrape specific pages (e.g., for better extraction)
node scraper-lite/scripts/rescrape-pages.js
```

---

## 🧠 Intelligence Enhancement Opportunities

### Current Learning Mechanisms

#### ✅ **What We Have:**

1. **Pattern Learning** ✅
   - Learns URL patterns from successful pages
   - Saves to `data/lite/url-patterns.json`
   - Used during discovery to filter URLs

2. **Keyword Learning** ✅
   - Uses institution-specific keywords
   - Global funding/program keywords
   - Exclusion keywords for filtering

3. **Extraction Quality Tracking** ✅
   - Tracks meaningful vs. generic content
   - Validates extraction results
   - Filters out noise

4. **Automatic Retry** ✅
   - Retries failed jobs
   - Learning from failures

---

### 🚀 **Enhancement Opportunities**

#### 1. **Enhanced Pattern Learning** (Medium Priority)

**Current:** Basic pattern learning from scraped URLs

**Enhancement Ideas:**
- **Confidence Scoring**: Track pattern success rate (95% = high confidence)
- **Pattern Evolution**: Update patterns based on success/failure
- **Cross-Institution Learning**: Learn patterns that work across institutions
- **Database Storage**: Store patterns in `url_patterns` table for persistence

**Implementation:**
```javascript
// Add to scraper-lite/src/utils.ts
function learnPatternFromSuccess(url: string, isGood: boolean) {
  const pattern = extractPattern(url);
  if (isGood) {
    // Increase confidence
    pattern.confidence = (pattern.confidence || 0.5) + 0.1;
  } else {
    // Decrease confidence
    pattern.confidence = (pattern.confidence || 0.5) - 0.1;
  }
  // Save to database or file
}
```

---

#### 2. **Extraction Quality Feedback Loop** (High Priority)

**Current:** Basic extraction, no feedback loop

**Enhancement Ideas:**
- **Success Tracking**: Track which extraction methods work best per site
- **Site-Specific Extractors**: Learn site-specific extraction patterns
- **AI-Enhanced Extraction**: Use AI to improve extraction for difficult sites
- **Continuous Improvement**: Automatically improve extraction based on results

**Implementation:**
```javascript
// Track extraction success per site
const extractionMetrics = {
  site: 'ffg.at',
  methods: {
    regex: { success: 0.7, attempts: 100 },
    css: { success: 0.9, attempts: 100 },
    ai: { success: 0.95, attempts: 50 }
  }
};

// Use best method per site
function getBestExtractionMethod(site: string) {
  const metrics = extractionMetrics[site];
  return Object.entries(metrics.methods)
    .sort((a, b) => b[1].success - a[1].success)[0][0];
}
```

---

#### 3. **Automatic Quality Monitoring** (High Priority)

**Current:** Manual quality checks

**Enhancement Ideas:**
- **Auto-Quality Reports**: Generate quality reports automatically after scraping
- **Quality Alerts**: Alert when quality drops below threshold
- **Auto-Rescraping**: Automatically rescrape low-quality pages
- **Quality Dashboards**: Real-time quality metrics

**Implementation:**
```javascript
// Auto-quality check after scraping
async function autoQualityCheck() {
  const quality = await verifyDatabaseQuality();
  if (quality.avgCompleteness < 0.6) {
    console.warn('⚠️ Quality below threshold, triggering rescrape');
    await rescrapeLowQualityPages();
  }
}
```

---

#### 4. **Intelligent Discovery** (Medium Priority)

**Current:** Basic discovery with keywords

**Enhancement Ideas:**
- **Priority-Based Discovery**: Discover high-priority URLs first
- **Smart Depth Control**: Adjust depth based on URL quality
- **Incremental Discovery**: Only discover new URLs since last run
- **Pattern-Guided Discovery**: Use learned patterns to guide discovery

**Implementation:**
```javascript
// Priority-based discovery
function prioritizeURLs(urls: string[]): string[] {
  return urls.sort((a, b) => {
    const aScore = getURLPriorityScore(a);
    const bScore = getURLPriorityScore(b);
    return bScore - aScore;
  });
}

function getURLPriorityScore(url: string): number {
  let score = 0;
  // High confidence pattern = higher score
  if (hasHighConfidencePattern(url)) score += 10;
  // Institution keyword = higher score
  if (hasInstitutionKeyword(url)) score += 5;
  // Funding keyword = higher score
  if (hasFundingKeyword(url)) score += 3;
  return score;
}
```

---

#### 5. **Database-Driven Learning** (High Priority)

**Current:** File-based learning (`url-patterns.json`)

**Enhancement Ideas:**
- **Store Patterns in Database**: Use `url_patterns` table
- **Pattern Analytics**: Track pattern effectiveness over time
- **Cross-Program Learning**: Learn from similar programs
- **Category-Based Learning**: Learn patterns specific to requirement categories

**Implementation:**
```sql
-- Store patterns in database
INSERT INTO url_patterns (host, pattern_type, pattern, learned_from_url, confidence)
VALUES ('ffg.at', 'include', '/foerderung/*', 'https://ffg.at/foerderung/...', 0.95);

-- Query effective patterns
SELECT pattern, AVG(confidence) as avg_confidence
FROM url_patterns
WHERE host = 'ffg.at' AND pattern_type = 'include'
GROUP BY pattern
ORDER BY avg_confidence DESC;
```

---

## 📋 Recommended Workflow

### Daily Workflow (Get New Data)

```bash
# 1. Run automated cycle (discovers + scrapes + learns)
node scraper-lite/run-lite.js auto

# 2. Check quality
node scraper-lite/scripts/verify-database-quality.js

# 3. Monitor improvements
node scraper-lite/scripts/monitor-improvements.js
```

### Weekly Workflow (Enhance Intelligence)

```bash
# 1. Learn patterns from new data
node scraper-lite/scripts/learn-patterns-from-scraped.js

# 2. Analyze extraction quality
node scraper-lite/scripts/improve-extraction.js

# 3. Comprehensive quality analysis
node scraper-lite/scripts/comprehensive-quality-analysis.js

# 4. Rescrape low-quality pages if needed
node scraper-lite/scripts/rescrape-pages.js
```

### Monthly Workflow (Deep Analysis)

```bash
# 1. Analyze URL quality
node scraper-lite/scripts/analyze-url-quality.js

# 2. Evaluate unseen URLs
node scraper-lite/scripts/evaluate-unseen-urls.js

# 3. Review and improve patterns
# (Manual review of url-patterns.json or url_patterns table)
```

---

## 🎯 Quick Commands Reference

### Get New Data
```bash
# Full automated cycle (recommended)
node scraper-lite/run-lite.js auto

# Just discovery
npm run lite:discover

# Just scraping
npm run lite:scrape
```

### Check Quality
```bash
# Database quality
node scraper-lite/scripts/verify-database-quality.js

# Extraction quality
node scraper-lite/scripts/monitor-improvements.js

# Quick summary
node scraper-lite/scripts/quick-summary.js
```

### Enhance Intelligence
```bash
# Learn patterns
node scraper-lite/scripts/learn-patterns-from-scraped.js

# Improve extraction
node scraper-lite/scripts/improve-extraction.js

# Analyze quality
node scraper-lite/scripts/comprehensive-quality-analysis.js
```

---

## 🔄 What's Always Learning?

### Automatic Learning (During Scraping):
1. ✅ **URL Patterns** - Learns which URL patterns lead to good pages
2. ✅ **Extraction Methods** - Tracks which methods work best
3. ✅ **Quality Metrics** - Tracks extraction success rates
4. ✅ **Failure Patterns** - Learns what to avoid (exclusion patterns)

### Manual Learning (When You Run Scripts):
1. ⚙️ **Pattern Refinement** - `learn-patterns-from-scraped.js`
2. ⚙️ **Extraction Improvement** - `improve-extraction.js`
3. ⚙️ **Quality Analysis** - Various analysis scripts
4. ⚙️ **URL Quality** - `analyze-url-quality.js`

---

## 🚀 Next Steps to Enhance Intelligence

### Priority 1: Database-Driven Learning
- Store patterns in `url_patterns` table
- Track pattern confidence over time
- Query effective patterns automatically

### Priority 2: Automatic Quality Monitoring
- Auto-quality checks after scraping
- Auto-rescrape low-quality pages
- Quality alerts/dashboards

### Priority 3: Extraction Feedback Loop
- Track extraction method success per site
- Auto-select best method per site
- Continuous improvement based on results

---

**Status:** ✅ System has learning capabilities - can be enhanced further!

