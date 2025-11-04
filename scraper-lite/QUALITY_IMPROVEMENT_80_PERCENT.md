# 🎯 Quality Improvement Plan - Target: 80% Quality Score

## ✅ Completed Improvements

### 1. Enhanced Table-Based Extraction
- ✅ Improved funding amount extraction from HTML tables
- ✅ Added deadline extraction from HTML tables  
- ✅ Added contact info extraction from HTML tables
- ✅ Expanded keywords for better pattern matching
- ✅ Better handling of millions, ranges, and euros

### 2. Discovery Cycle Running
- ✅ Full cycle with all institutions enabled
- ✅ Max discovery pages: 1000 per cycle
- ✅ 5 cycles to find maximum URLs

---

## 📊 Current Status vs Target

| Metric | Current | Target | Gap |
|--------|---------|--------|-----|
| **Quality Score** | 53.3/100 | 80+/100 | -26.7 |
| **Funding Amounts** | 17.6% | 40%+ | -22.4% |
| **Deadlines** | 6.3% | 30%+ | -23.7% |
| **Contact Info** | 16.2% | 40%+ | -23.8% |
| **Pages with All Critical** | 21.6% | 40%+ | -18.4% |
| **Total Pages** | 1,216 | 3,000+ | -1,784 |

---

## 🚀 Next Steps to Reach 80%

### Step 1: Wait for Discovery Cycle (Running Now)
The discovery cycle is running in the background. It will:
- Find new URLs from existing seed URLs
- Scrape pages with improved extraction patterns
- Learn better patterns automatically

**Expected Result:** 1,216 → 2,000-3,000 pages

### Step 2: Re-scrape Low Quality Pages
Once discovery cycle completes:

```bash
cd C:\Users\kevin\plan2fund\one_prompt_webapp_agent_package\plan2fund-nextgen\scraper-lite
node scripts/manual/rescrape-pages.js --missing-only
```

This will re-scrape pages missing:
- Funding amounts
- Deadlines  
- Contact info

**Expected Result:** 
- Funding amounts: 17.6% → 35-40%+
- Deadlines: 6.3% → 25-30%+
- Contact info: 16.2% → 35-40%+

### Step 3: Verify Quality Improvement
After re-scraping:

```bash
cd C:\Users\kevin\plan2fund\one_prompt_webapp_agent_package\plan2fund-nextgen\scraper-lite
node scripts/manual/verify-database-quality.js
```

**Expected Result:** Quality score 53.3 → 70-80+

### Step 4: Add More Seed URLs (If Needed)
If quality still below 80%, add more seed URLs:

1. Visit institution websites
2. Find specific program detail pages
3. Add to `scraper-lite/src/config.ts` in each institution's `seedUrls`

**Target:** 500-1000 total seed URLs (currently ~266)

---

## 📈 Expected Timeline

- **Now**: Discovery cycle running (30-60 min)
- **After cycle**: Re-scrape missing data (30-60 min)
- **Verify**: Check quality score (2 min)
- **If needed**: Add more seed URLs and repeat

---

## 🎯 Quality Score Calculation

The quality score is calculated as:
```
(Requirements Coverage × 0.3) +
(Critical Categories × 0.3) +
(Funding Amounts × 0.2) +
(All Categories × 0.2)
```

**To reach 80%:**
- Requirements Coverage: 77.6% → 85%+ ✅ (already good)
- Critical Categories: 21.6% → 50%+ (need improvement)
- Funding Amounts: 17.6% → 40%+ (need improvement)
- All Categories: 100% ✅ (already perfect)

**Key Improvements Needed:**
1. More pages with all critical categories (21.6% → 50%+)
2. More funding amounts extracted (17.6% → 40%+)
3. More deadlines extracted (6.3% → 30%+)
4. More contact info extracted (16.2% → 40%+)

---

## 💡 Key Improvements Made

### Table Extraction Enhancements:
- ✅ Expanded funding keywords (20+ patterns)
- ✅ Better million/euro handling
- ✅ Range pattern detection
- ✅ Deadline extraction from tables
- ✅ Contact info extraction from tables
- ✅ Runs even if initial patterns found data

### Pattern Improvements:
- ✅ More relaxed keyword matching
- ✅ Better context validation
- ✅ Institution-specific patterns learned
- ✅ Fallback strategies when data missing

---

## ✅ Action Checklist

- [x] Improve extraction patterns for tables
- [x] Add deadline extraction from tables
- [x] Add contact extraction from tables
- [x] Start discovery cycle with more pages
- [ ] Wait for discovery cycle to complete
- [ ] Re-scrape pages with missing data
- [ ] Verify quality score reaches 80%+
- [ ] Add more seed URLs if needed

---

**Status:** Discovery cycle running, extraction patterns improved. Next: Re-scrape low quality pages once cycle completes.

