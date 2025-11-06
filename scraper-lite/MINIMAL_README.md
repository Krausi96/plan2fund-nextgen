# Scraper-Lite: Minimal Documentation

**Status:** Core functionality only - LLM extraction restored

## Core Files

- `src/scraper.ts` - Main scraping pipeline
- `src/extract.ts` - Pattern-based extraction
- `src/llm-extract.ts` - LLM-based extraction (restored)
- `src/scraper-llm.ts` - LLM scraper wrapper (restored)
- `src/config.ts` - Institution configuration
- `src/db/` - Database schema and client

## Usage

```bash
# Discover URLs
node scraper-lite/run-lite.js discover

# Scrape with pattern extraction
node scraper-lite/run-lite.js scrape

# Scrape with LLM extraction (when integrated)
# TODO: Integrate LLM into scraper.ts
```

## Next Steps (from redesign/PROGRESS.md)

1. Integrate LLM extraction into scraper.ts pipeline
2. Add caching (llmCache.ts)
3. Update database schema (add method, confidence fields)
4. Implement incremental updates

