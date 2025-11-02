# 🚀 Quick Start: Get New Data & Check Quality

**Last Updated:** 2025-11-02

---

## 📥 Get New Data

### Option 1: Full Automated Cycle (Recommended) ✅

```bash
# Run fully automated: Discovery → Scrape → Learn → Improve
node scraper-lite/run-lite.js auto
```

**What it does:**
- ✅ Discovers new URLs automatically
- ✅ Scrapes in batches (100 URLs per batch)
- ✅ Learns patterns from successful pages
- ✅ Retries failed jobs (up to 3x)
- ✅ Stops when no new URLs found
- ✅ Saves to database automatically

**With custom settings:**
```bash
MAX_CYCLES=5 SCRAPE_BATCH_SIZE=50 node scraper-lite/run-lite.js auto
```

---

### Option 2: Step-by-Step (Manual Control)

```bash
# Step 1: Discover new URLs
npm run lite:discover

# Step 2: Scrape discovered URLs
npm run lite:scrape

# Step 3: Learn patterns
node scraper-lite/scripts/learn-patterns-from-scraped.js

# Step 4: Check quality
node scraper-lite/scripts/verify-database-quality.js
```

---

## 🔍 Check Data Quality

### Quick Quality Check
```bash
# Database quality (requirements, categories, completeness)
node scraper-lite/scripts/verify-database-quality.js
```

**Current Status:**
- ✅ 1,024 pages in database
- ✅ 21,220 requirements
- ✅ All 18 categories present
- ⚠️ Funding amounts: 17.6% coverage (can improve)
- ⚠️ Deadlines: 7.6% coverage (can improve)

---

### Detailed Quality Analysis

```bash
# Monitor extraction improvements
node scraper-lite/scripts/monitor-improvements.js

# Monitor metadata extraction
node scraper-lite/scripts/monitor-metadata.js

# Comprehensive quality analysis
node scraper-lite/scripts/comprehensive-quality-analysis.js

# Quick summary
node scraper-lite/scripts/quick-summary.js
```

---

## 🧠 Enhance Intelligence

### Learn Patterns
```bash
# Learn URL patterns from successfully scraped pages
node scraper-lite/scripts/learn-patterns-from-scraped.js

# Learn from institution config
node scraper-lite/scripts/learn-patterns-from-config.js
```

### Improve Extraction
```bash
# Analyze and improve extraction quality
node scraper-lite/scripts/improve-extraction.js
```

### Analyze URLs
```bash
# Analyze URL quality
node scraper-lite/scripts/analyze-url-quality.js

# Evaluate unseen URLs
node scraper-lite/scripts/evaluate-unseen-urls.js
```

---

## 🤖 What's Always Learning?

### Automatic (During Scraping):
1. ✅ **URL Patterns** - Learns which patterns lead to good pages
2. ✅ **Extraction Methods** - Tracks which methods work best
3. ✅ **Quality Metrics** - Tracks extraction success rates
4. ✅ **Failure Patterns** - Learns what to avoid

### Manual (Run Scripts):
1. ⚙️ **Pattern Learning** - `learn-patterns-from-scraped.js`
2. ⚙️ **Extraction Improvement** - `improve-extraction.js`
3. ⚙️ **Quality Analysis** - Various analysis scripts

---

## 📋 Recommended Daily Workflow

```bash
# 1. Get new data
node scraper-lite/run-lite.js auto

# 2. Check quality
node scraper-lite/scripts/verify-database-quality.js

# 3. Monitor improvements (optional)
node scraper-lite/scripts/monitor-improvements.js
```

---

## 🎯 Intelligence Enhancement Ideas

### Priority 1: Better Extraction
- Improve funding amount extraction (currently 17.6%)
- Improve deadline extraction (currently 7.6%)
- Improve contact email extraction (currently 12.7%)

### Priority 2: Database-Driven Learning
- Store patterns in `url_patterns` table
- Track pattern confidence over time
- Auto-select best patterns per site

### Priority 3: Auto-Quality Monitoring
- Auto-quality checks after scraping
- Auto-rescrape low-quality pages
- Quality alerts/dashboards

---

**For full details, see:** `docs/LEARNING_AND_INTELLIGENCE.md`

