# Web Scraper: Context & Current State

## 📋 **What We're Building**

A web scraper that discovers and extracts funding program information from multiple institutions (government agencies, banks, etc.) across Austria, Germany, EU, and more. The scraper:

1. **Discovers** program URLs automatically from institution websites
2. **Scrapes** program details (eligibility, requirements, funding amounts, deadlines, etc.)
3. **Categorizes** requirements into 18 categories
4. **Saves** structured data to JSON files for use in a funding matching system

## 🔄 **Recent Changes (Last Session)**

### ✅ **Simplifications Applied**

1. **Removed Unused Code:**
   - Deleted `parseEligibilityTextEnhanced()` and `parseRequirementsTextEnhanced()` - never used
   - Removed `isSectionFullyExplored()` - redundant with `unscrapedUrls` tracking
   - Cleaned up empty `programFocus: []` fields from all institutions

2. **Fixed Category Page Exploration (MAJOR FIX):**
   - **Increased depth**: 2 → 3 levels (explore category pages deeper)
   - **Increased discovery limit**: 100 → 200 URLs per institution
   - **Enhanced link extraction**: Now extracts from article cards, `.content`, `.card`, `.teaser`, list items
   - **Better program detection**: Finds program links even without keywords in URLs
   - **Result**: Went from 44-49 programs to **55 programs** (no more duplicates!)

3. **Increased URL Processing:**
   - Process 50 URLs per institution (was 15)

### 📊 **Current State**

- **Total Programs**: 55 (was stuck at 44-49)
- **Requirements Coverage**: 100% have some requirements, 47% have 5+ categories
- **Structured Data**: 28/55 have funding amounts, deadlines, or contact info
- **Discovery State**: Tracking explored sections per institution

## 🐛 **Current Challenges**

### 1. **Still Not Finding All Programs**
- **FFG**: 137 unscraped URLs but only 3 programs scraped
- **WKO**: 149 unscraped URLs but only 1 program scraped
- Many discovered URLs are:
  - Category/listing pages (filtered by `isProgramDetailPage()`)
  - Query parameter URLs (filtered by `isRealProgramUrl()`)
  - Need deeper exploration to find actual program detail pages

### 2. **Requirements Categories Gaps**
- `co_financing`: 0% populated
- `trl_level`: 0% populated
- `compliance`: 7% populated
- `revenue_model`: 18% populated
- Many categories only have 1-2 items when they could have more

### 3. **Duplicate Detection**
- Discovery state tracks explored sections but may miss new programs
- Some institutions have many unscraped URLs that aren't being processed

## 📁 **File Structure**

### **Core Files**

1. **`src/lib/webScraperService.ts`** ⚠️ **SCREEN THIS**
   - Main scraper logic
   - Discovery state management
   - URL extraction and validation
   - Program scraping and requirement categorization
   - **Check for**: Inconsistencies in depth limits, URL processing limits, link extraction logic

2. **`src/lib/institutionConfig.ts`** ⚠️ **SCREEN THIS**
   - Institution configurations (38 institutions)
   - Selectors for data extraction
   - Keywords for discovery
   - **Check for**: Inconsistent selectors, missing keywords, duplicate configs

### **Data Files**

- **`data/scraped-programs-latest.json`** - Latest scraped programs (55 programs)
- **`data/discovery-state.json`** - Tracks explored sections per institution

### **Test/Analysis Scripts**

Run these to understand current state:

1. **`scripts/analyze-requirements.js`** ✅ **KEEP**
   - Analyzes requirement category population
   - Shows which categories are under-populated
   - Run: `node scripts/analyze-requirements.js`

2. **`scripts/test-discovery.js`** ✅ **KEEP**
   - Shows discovery state per institution
   - Shows unscraped URLs count
   - Run: `node scripts/test-discovery.js`

3. **`scripts/test-specific-urls.js`** ✅ **KEEP**
   - Tests why specific URLs are being rejected
   - Shows validation failures
   - Run: `node scripts/test-specific-urls.js`

4. **`scripts/debug-validate-url.js`** ❌ **REDUNDANT** - Delete this
   - Tests AWS URLs manually with validation
   - `test-specific-urls.js` does the same but more comprehensively
   - **Action**: DELETE - `test-specific-urls.js` covers this

5. **`scripts/compare-runs.js`** ⚠️ **MAYBE REDUNDANT** - Check before deleting
   - Shows programs grouped by scrape date
   - Might be useful for tracking progress over time
   - **Action**: Review - if `analyze-requirements.js` covers this, DELETE

## 🚀 **How to Run**

### **Main Scraper**

```bash
# Cycle mode (one institution at a time, faster)
npm run scraper:cycle

# Or with deep mode (full re-exploration)
node scripts/trigger-full-scraper.js cycle deep
```

### **Analysis Tools**

```bash
# Analyze requirements
node scripts/analyze-requirements.js

# Check discovery state
node scripts/test-discovery.js

# Test specific URLs
node scripts/test-specific-urls.js
```

## 📍 **Where Data Ends Up**

1. **Scraped Programs**: `data/scraped-programs-latest.json`
   - All scraped program data with requirements, structured data
   - Used by the main application

2. **Discovery State**: `data/discovery-state.json`
   - Tracks which sections have been explored
   - Tracks known URLs and unscraped URLs per institution
   - Used to skip already-explored sections in incremental mode

## ✅ **Your Tasks**

### **Phase 1: Screen Files for Inconsistencies**

1. **`webScraperService.ts`** - Look for:
   - Inconsistent depth limits (should be 3, not mixed values)
   - Inconsistent URL limits (should be 200 for discovery, 50 for processing)
   - Duplicate logic (skip checks, validation, etc.)
   - Dead code or commented sections

2. **`institutionConfig.ts`** - Look for:
   - Institutions with identical selectors (could be shared)
   - Missing keywords
   - Inconsistent baseUrl formats
   - Institutions with `autoDiscovery: false` that should be true

### **Phase 2: Clean Up Test Files**

Run each test script, check if redundant:
```bash
# Check what each script does
cat scripts/debug-validate-url.js
cat scripts/compare-runs.js
```

Delete if redundant with `analyze-requirements.js`, `test-discovery.js`, or `test-specific-urls.js`

### **Phase 3: Run Scraper & Analyze**

1. **Run scraper**:
   ```bash
   node scripts/trigger-full-scraper.js cycle deep
   ```

2. **Analyze results**:
   ```bash
   node scripts/analyze-requirements.js
   node scripts/test-discovery.js
   ```

3. **Check for**:
   - Did we get more than 55 programs?
   - Are requirements better populated?
   - Are there still many unscraped URLs?

### **Phase 4: Fix Gaps**

1. **More Unique URLs**:
   - Why are FFG and WKO finding 137-149 URLs but only scraping 3-1 programs?
   - Are query parameter URLs (`?field_themenbereich[0]=2`) being filtered too aggressively?
   - Should we explore category pages even deeper?

2. **Better Category Population**:
   - Why is `co_financing` 0%? Check `parseEligibilityText()` for co-financing detection
   - Why is `trl_level` 0%? Check for TRL pattern detection
   - Enhance `parseFullPageContent()` to catch more requirement patterns

3. **Link Extraction**:
   - Are we missing program links on category pages?
   - Should we extract from more selectors?
   - Are article/card extraction patterns working?

## 🔍 **Key Methods to Understand**

### **`discoverRealProgramUrls()`**
- Main discovery logic
- Breadth-first exploration with queue
- Uses `extractLinksFromPage()` to get links
- Filters with `isProgramDetailPage()` to find scrapable URLs

### **`extractLinksFromPage()`**
- Extracts links from a page
- Two passes: keyword-matching + content area extraction
- Should find program links in cards/articles/lists

### **`isProgramDetailPage()`**
- Determines if URL is a detail page (not category page)
- Filters out `/wettbewerbe/`, `/competitions/`, etc.
- This might be too strict - check if blocking valid programs

### **`extract18Categories()`**
- Extracts requirements into 18 categories
- Uses `parseEligibilityText()`, `parseRequirementsText()`, `parseFullPageContent()`
- This is where category gaps need fixing

## 📊 **Success Metrics**

- **Program Count**: > 55 (aim for 80+)
- **Unscraped URLs**: Should decrease after fixes
- **Requirements**: All 18 categories should have > 30% population
- **Unique Programs**: No duplicates (check source_url uniqueness)

## 🚨 **Known Issues**

1. **Category pages not fully explored**: `/spezialprogramme/wettbewerbe/` might have 20 programs, but we only find the category page URL
2. **Query parameters filtered**: FFG URLs like `?field_themenbereich[0]=2` are filtered out but might have programs
3. **Link extraction misses some**: Program cards might not match our selectors
4. **Requirements parsing incomplete**: Many patterns not detected yet

## 💡 **Tips**

- Check console logs during scraping - they show what URLs are discovered vs skipped
- Use `test-discovery.js` to see which institutions have the most unscraped URLs
- Use `analyze-requirements.js` to see which categories need enhancement
- Focus on FFG and WKO first - they have the most untapped URLs

Good luck! 🚀

