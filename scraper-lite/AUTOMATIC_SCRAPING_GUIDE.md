# 🤖 Automatic Scraping Guide

## Quick Start - One Command

### Windows PowerShell (Recommended):
```powershell
cd scraper-lite
.\run-cycle.ps1
```

### Windows CMD:
```cmd
cd scraper-lite
run-cycle.bat
```

### Direct Node.js:
```powershell
cd scraper-lite
node scripts/automatic/auto-cycle.js
```

---

## What It Does Automatically

The automatic cycle runs these steps **completely hands-free**:

1. **🔍 Discovery** - Finds new URLs from all institutions
2. **📥 Scraping** - Processes queued URLs in batches
3. **🧠 Learning** - Learns patterns from successful scrapes
4. **🔄 Retry** - Automatically retries failed jobs (up to 3 times)
5. **📊 Quality Check** - Identifies low-quality pages for re-scraping
6. **♻️ Repeat** - Continues until no new URLs found or max cycles reached

---

## Configuration Options

You can customize the automatic cycle with environment variables:

```powershell
# Set before running
$env:MAX_CYCLES=10                    # Number of cycles (default: 10)
$env:SCRAPE_BATCH_SIZE=50             # URLs per batch (default: 100)
$env:LITE_MAX_DISCOVERY_PAGES=200     # Max discovery pages per cycle
$env:LITE_ALL_INSTITUTIONS=1          # Use all institutions (1 = yes, 0 = first 3 only)
$env:MIN_NEW_URLS=5                   # Minimum new URLs to continue (default: 5)

# Then run
node scripts/automatic/auto-cycle.js
```

### Example: Run with custom settings
```powershell
$env:MAX_CYCLES=5
$env:SCRAPE_BATCH_SIZE=20
node scripts/automatic/auto-cycle.js
```

---

## Available Automatic Scripts

### 1. **Main Automatic Cycle** ⭐
**File**: `scripts/automatic/auto-cycle.js`

**What it does**:
- Full automatic cycle (discovery → scraping → learning → retry)
- Runs until no new URLs or max cycles
- Self-improving based on quality metrics

**Usage**:
```powershell
node scripts/automatic/auto-cycle.js
```

---

### 2. **Windows Wrapper Scripts**

#### PowerShell (`run-cycle.ps1`):
```powershell
.\run-cycle.ps1
```

#### Batch File (`run-cycle.bat`):
```cmd
run-cycle.bat
```

Both set environment variables and call `auto-cycle.js`

---

### 3. **Scheduled Runner** (For Continuous Operation)
**File**: `scripts/automatic/auto-cycle-scheduler.js`

**What it does**:
- Runs cycles on a schedule (like cron)
- For continuous/background operation

**Usage**:
```powershell
node scripts/automatic/auto-cycle-scheduler.js
```

---

### 4. **Monitoring Scripts**

#### Monitor Improvements:
```powershell
node scripts/automatic/monitor-improvements.js
```

#### Monitor Metadata:
```powershell
node scripts/automatic/monitor-metadata.js
```

---

## Typical Workflow

### Option 1: Run Once (Manual)
```powershell
cd scraper-lite
.\run-cycle.ps1
```

### Option 2: Run Continuously (Background)
```powershell
cd scraper-lite
node scripts/automatic/auto-cycle-scheduler.js
```

### Option 3: Custom Settings
```powershell
cd scraper-lite
$env:MAX_CYCLES=5
$env:SCRAPE_BATCH_SIZE=20
node scripts/automatic/auto-cycle.js
```

---

## What Gets Scraped

The automatic cycle:
- ✅ Discovers new URLs from all institutions in `src/config.ts`
- ✅ Processes queued URLs from `state.json`
- ✅ Extracts all metadata (funding amounts, deadlines, requirements, etc.)
- ✅ Saves to database automatically
- ✅ Learns patterns and improves extraction
- ✅ Retries failed jobs automatically

---

## Output

The automatic cycle will show:
- 📊 Discovery progress (new URLs found)
- 📥 Scraping progress (URLs processed)
- ✅ Successful saves
- ❌ Errors (with automatic retry)
- 📈 Quality metrics
- 🧠 Pattern learning results

---

## Stopping

Press `Ctrl+C` to stop the automatic cycle at any time.

It will:
- Save current state
- Complete current batch
- Exit gracefully

---

## Troubleshooting

### If it stops too early:
- Check `MIN_NEW_URLS` setting (might be too high)
- Check if there are actually new URLs to discover

### If it's too slow:
- Reduce `SCRAPE_BATCH_SIZE` (smaller batches = more frequent updates)
- Reduce `LITE_MAX_DISCOVERY_PAGES` (less discovery per cycle)

### If you want to see more detail:
- Check `state.json` for current queue status
- Run `node scripts/manual/verify-database-quality.js` to see results

---

## Summary

**Main automatic script**: `scripts/automatic/auto-cycle.js`

**Easiest way to run**:
```powershell
cd scraper-lite
.\run-cycle.ps1
```

**That's it!** It will run completely automatically until done or stopped.

---

**Last Updated**: 2025-01-30

