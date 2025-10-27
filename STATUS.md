# Status Quo - Web Scraper

## Files (3 Total - Minimal)

1. **`src/lib/webScraperService.ts`** - Core scraper (all logic)
2. **`scripts/independent-scraper.ts`** - Runner (npm run scraper:run)
3. **`scripts/run-cron.sh`** - Cron helper

## How to Run

### Manual:
```bash
npm run scraper:run
```

### Automatic:
```bash
crontab .cron-config.txt
# Runs every 6 hours
```

## What It Does

- Scrapes 11 institutions (AWS, FFG, VBA, EU, etc.)
- Detects 6 funding types (grant, loan, equity, visa, consulting, service)
- Extracts deep requirements (co-financing %, TRL levels, impact types)
- Saves to: `data/scraped-programs-latest.json`
- Self-learning: Keyword confidence + pattern success rates

## Current Data

- File: `data/scraped-programs-latest.json`
- Programs: 3 (test data with categorized_requirements)
- Status: Ready for SmartWizard testing

## Next Steps

1. Test SmartWizard with test data
2. Verify 10-15 profound questions appear
3. Then decide: Run live scraper or use test data

