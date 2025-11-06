# Legacy Scraper Files

**Status**: These files are kept for reference only. The active scraper is `scraper-lite/`.

## Files

### `webScraperService.ts`
- **Size**: 2,468 lines
- **Technology**: Puppeteer (headless browser)
- **Status**: Replaced by `scraper-lite/` (axios + cheerio)
- **Why kept**: Reference implementation, some logic ported to scraper-lite

### `institutionConfig.ts`
- **Status**: ✅ **ACTIVE** - Single source of truth
- **Used by**: `scraper-lite/src/config.ts` (imports from here)
- **Contains**: All institution definitions, seed URLs, keywords, funding types
- **Do not modify**: This is the canonical config

### `scripts/`
- **Status**: Legacy scripts, not actively used
- **Files**:
  - `run-scraper-direct.js` - Old direct scraper runner
  - `run-discovery-only.js` - Old discovery-only script
  - `run-cycles-with-analysis.js` - Old analysis script
  - `test-*.js` - Old test scripts
- **Use instead**: `scraper-lite/run-lite.js`

## Migration Path

If you need something from legacy:
1. Check if it's already in `scraper-lite/`
2. If not, port the logic (don't copy directly)
3. Update `scraper-lite/README.md` with new features









