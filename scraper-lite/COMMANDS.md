# 📋 Copy-Paste Commands

## 🚀 Main Scripts

### 1. Automatic Full Cycle (Recommended)
```bash
cd scraper-lite
$env:LITE_ALL_INSTITUTIONS=1
node scripts/automatic/auto-cycle.js
```

### 2. Manual Full Cycle (Single Run)
```bash
cd scraper-lite
node manual full-cycle
```

### 3. Discovery Only
```bash
cd scraper-lite
$env:LITE_MAX_DISCOVERY_PAGES=50
node manual discover
```

### 4. Scrape Only
```bash
cd scraper-lite
$env:LITE_MAX_URLS=50
node manual scrape
```

### 5. Re-scrape All Pages (Update with New Fields)
```bash
cd scraper-lite
node scripts/manual/rescrape-pages.js
```

### 6. Re-scrape Missing Metadata Only
```bash
cd scraper-lite
node scripts/manual/rescrape-pages.js --missing-only
```

### 7. Validate Improvements
```bash
cd scraper-lite
node scripts/manual/validate-improvements.js
```

### 8. Verify Database Quality
```bash
cd scraper-lite
node scripts/manual/verify-database-quality.js
```

### 9. Quick Summary
```bash
cd scraper-lite
node scripts/manual/quick-summary.js
```

### 10. Comprehensive Quality Analysis
```bash
cd scraper-lite
node scripts/manual/comprehensive-quality-analysis.js
```

### 11. Test Database Connection
```bash
cd scraper-lite
node scripts/manual/test-neon-connection.js
```

### 12. Debug Discovery
```bash
cd scraper-lite
node scripts/manual/debug-discovery.js
```

### 13. Debug Extraction
```bash
cd scraper-lite
node scripts/manual/debug-extraction.js
```

### 14. Test API Endpoints
```bash
cd scraper-lite
node scripts/manual/test-api-endpoints.js
```

### 15. Reset State (Show Stats)
```bash
cd scraper-lite
node scripts/manual/reset-state.js stats
```

### 16. Reset State (Clean Jobs)
```bash
cd scraper-lite
node scripts/manual/reset-state.js clean-jobs
```

### 17. Reset State (Full Reset)
```bash
cd scraper-lite
node scripts/manual/reset-state.js reset
```

### 18. Cleanup Storage
```bash
cd scraper-lite
node scripts/manual/cleanup-storage.js
```

---

## 🤖 Alternative Wrapper Scripts

### PowerShell Script
```powershell
cd scraper-lite
.\run-cycle.ps1
```

### Batch Script (Windows CMD)
```cmd
cd scraper-lite
run-cycle.bat
```

### Via Main Entry Point
```bash
cd scraper-lite
$env:LITE_ALL_INSTITUTIONS=1
node manual auto
```

---

## 🔄 PM2 Scheduler (Production)

### Install PM2
```bash
npm install -g pm2
```

### Start Hourly Scheduler
```bash
cd scraper-lite
$env:LITE_ALL_INSTITUTIONS=1
pm2 start scripts/automatic/auto-cycle-scheduler.js --name scraper-hourly --cron "0 * * * *" --no-autorestart
```

### PM2 Management
```bash
pm2 list
pm2 logs scraper-hourly
pm2 stop scraper-hourly
pm2 delete scraper-hourly
```

---

## ⚙️ With Environment Variables

### Full Auto Cycle with Custom Settings
```bash
cd scraper-lite
$env:LITE_ALL_INSTITUTIONS=1
$env:MAX_CYCLES=10
$env:SCRAPE_BATCH_SIZE=50
$env:LITE_MAX_DISCOVERY_PAGES=200
node scripts/automatic/auto-cycle.js
```

### Custom Seeds
```bash
cd scraper-lite
$env:LITE_SEEDS="https://www.ffg.at/en/fundings,https://www.aws.at/foerderungen"
node manual discover
```

### Custom Scrape Limit
```bash
cd scraper-lite
$env:LITE_MAX_URLS=100
node manual scrape
```

