# Scripts Directory

## Essential Scripts (Workflow)

### Core Workflow
- **`learn-patterns-from-config.js`** - Learn URL patterns from `institutionConfig.ts`
  - Run AFTER adding URLs to `institutionConfig.ts`
  - Extracts patterns automatically from `programUrls` you added
  - Saves to `data/lite/url-patterns.json`

### State Management
- **`reset-state.js`** - Manage `state.json`
  - `node scripts/reset-state.js stats` - Show stats
  - `node scripts/reset-state.js clean-jobs` - Remove done/failed jobs
  - `node scripts/reset-state.js reset` - Full reset (with backup)

### Monitoring & Quality
- **`monitor-improvements.js`** - Monitor extraction quality improvements
  - Shows meaningful vs generic items by category
  - Tracks context/heading extraction usage
  - Tracks progress toward 75% meaningful target

- **`quality-check-urls.js`** - Check URL quality
  - Identifies category pages vs detail pages
  - Shows excluded content
  - Quality metrics (good detail page rate, etc.)

- **`quick-summary.js`** - Quick overview of scraping results
  - Total pages, pages by institution
  - Extraction quality metrics
  - Meaningful requirements rate

- **`analyze-url-quality.js`** - Analyze URL quality for pattern refinement
  - Identifies category pages and low-quality URLs
  - Suggests exclusion patterns
  - Helps refine `isProgramDetailPage()` patterns

## Usage Workflow

### 1. After Adding URLs to Config
```bash
node scripts/learn-patterns-from-config.js
```

### 2. Discover URLs
```bash
node run-lite.js discover
# Or with options:
LITE_ALL_INSTITUTIONS=1 LITE_MAX_DISCOVERY_PAGES=200 node run-lite.js discover
```

### 3. Scrape Discovered URLs
```bash
node run-lite.js scrape
# Or with limit:
LITE_MAX_URLS=100 node run-lite.js scrape
```

### 4. Monitor Progress
```bash
node scripts/monitor-improvements.js
node scripts/quick-summary.js
node scripts/quality-check-urls.js
```

### 5. Refine Patterns (if needed)
```bash
node scripts/analyze-url-quality.js
# Review suggestions, then update src/utils.ts
```

## Multiple Funding Types

**How it works:**
- Each institution in `institutionConfig.ts` has a `fundingTypes` array
- Example: AWS has `["grant", "loan", "bank_loan", "equity", "guarantee"]`
- When scraping, each page gets ALL funding types from its institution
- One URL can have multiple funding types assigned automatically

**Why this works:**
- An institution may offer multiple funding mechanisms
- All programs from that institution inherit the institution's funding types
- No need to parse funding type per URL - it's assigned at institution level

✅ **Conclusion:** Multiple funding types per website/institution is handled automatically!
