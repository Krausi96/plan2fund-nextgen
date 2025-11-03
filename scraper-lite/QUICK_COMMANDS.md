# 🚀 Quick Commands - Run Scraper Cycle

## Full Automatic Cycle (Recommended)
```bash
cd scraper-lite
$env:LITE_ALL_INSTITUTIONS=1
node scripts/automatic/auto-cycle.js
```

## Single Cycle with Limits
```bash
cd scraper-lite
$env:LITE_ALL_INSTITUTIONS=0
$env:MAX_CYCLES=1
$env:SCRAPE_BATCH_SIZE=30
node scripts/automatic/auto-cycle.js
```

## Discovery Only
```bash
cd scraper-lite
$env:LITE_MAX_DISCOVERY_PAGES=50
node manual discover
```

## Scrape Only
```bash
cd scraper-lite
$env:LITE_MAX_URLS=50
node manual scrape
```

