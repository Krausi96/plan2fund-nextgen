# Scraper Test Scripts

## Analysis Scripts

### `analyze-requirements.js` ✅ **KEEP**
**Purpose**: Analyzes requirement category population across all programs
- Shows which categories are under-populated
- Shows top programs by requirements count
- Shows programs with structured data
- **Run**: `node scripts/analyze-requirements.js`
- **When to use**: After each scraper run to check requirements quality

### `test-discovery.js` ✅ **KEEP**
**Purpose**: Analyzes discovery state per institution
- Shows how many URLs discovered vs scraped
- Shows unscraped URLs per institution
- Helps identify institutions with untapped URLs
- **Run**: `node scripts/test-discovery.js`
- **When to use**: Before/after scraper runs to see discovery progress

### `test-specific-urls.js` ✅ **KEEP**
**Purpose**: Tests why specific unscraped URLs are being rejected
- Tests URL validation (status, content, program signals)
- Tests detail page detection
- Shows why URLs fail checks
- **Run**: `node scripts/test-specific-urls.js`
- **When to use**: Debugging why discovered URLs aren't being scraped

## Redundant Scripts (Delete)

### `debug-validate-url.js` ❌ **DELETE**
- Manual validation of AWS URLs
- **Redundant with**: `test-specific-urls.js` (does the same thing better)

### `compare-runs.js` ⚠️ **REVIEW**
- Shows programs grouped by scrape date
- **Decision**: If you only need current state, use `analyze-requirements.js`
- **Keep if**: You need historical comparison of scrape dates

## Other Scripts (Not for Testing)

- `trigger-full-scraper.js` - Main scraper trigger
- `test-extraction.ts` - TypeScript extraction test
- Database migration scripts - Not related to scraper testing
