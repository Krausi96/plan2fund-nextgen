# 🤖 Automatic Running Files

## ✅ Successfully Committed & Pushed!

- ✅ TypeScript check: **PASSED** (no errors)
- ✅ Code pushed to: `main` branch
- ✅ Commit: `565d709` - Smart discoveries implementation

## 📋 Files Used for Automatic Running

### **Primary Automatic Entry Point:**

#### 1. **`scraper-lite/manual`** (Main entry point)
```bash
# Run fully automated cycle (recommended)
node scraper-lite/manual auto
# or
node scraper-lite/manual auto-cycle
```

**What it does:**
- Calls `scripts/automatic/auto-cycle.js`
- Fully automated self-running cycle
- Best for production use

#### 2. **`scraper-lite/scripts/automatic/auto-cycle.js`** (Core automation logic)
**Location:** `scraper-lite/scripts/automatic/auto-cycle.js`

**Features:**
- ✅ Automatic discovery from all institutions
- ✅ Scraping in batches (configurable size)
- ✅ Pattern learning after each scrape
- ✅ Automatic retry of failed jobs
- ✅ Self-improvement based on quality metrics
- ✅ Stops when no new URLs found
- ✅ Runs up to MAX_CYCLES (default: 10)

**Environment Variables:**
```bash
MAX_CYCLES=10                    # Number of cycles to run
MIN_NEW_URLS=5                   # Minimum new URLs to continue
SCRAPE_BATCH_SIZE=100            # Batch size for scraping
LITE_MAX_DISCOVERY_PAGES=200     # Max discovery pages per cycle
LITE_ALL_INSTITUTIONS=1          # Use all institutions (not just first 3)
```

### **Alternative Entry Points:**

#### 3. **`scraper-lite/run-cycle.ps1`** (PowerShell script)
```powershell
.\scraper-lite/run-cycle.ps1
```

#### 4. **`scraper-lite/run-cycle.bat`** (Batch script for Windows)
```cmd
scraper-lite\run-cycle.bat
```

Both of these scripts:
- Set environment variables
- Call `scripts/automatic/auto-cycle.js`
- Windows-friendly wrappers

#### 5. **`scraper-lite/manual full-cycle`** (Manual full cycle)
```bash
node scraper-lite/manual full-cycle
```

**What it does:**
- Step 1: Discovery
- Step 2: Scraping  
- Step 3: Analysis (manual)
- Single run (not automated loop)

### **Supporting Automation Scripts:**

#### 6. **`scraper-lite/scripts/automatic/auto-cycle-scheduler.js`**
- Scheduled runs (cron-like)
- For continuous operation

#### 7. **`scraper-lite/scripts/automatic/learn-patterns-from-scraped.js`**
- Pattern learning (called by auto-cycle.js)
- Learns URL patterns automatically

#### 8. **`scraper-lite/scripts/automatic/monitor-improvements.js`**
- Monitors extraction improvements
- Quality tracking

#### 9. **`scraper-lite/scripts/automatic/monitor-metadata.js`**
- Monitors metadata completeness
- Coverage tracking

## 🚀 Quick Start Commands

### **Recommended (Fully Automatic):**
```bash
# Set environment variables
$env:LITE_ALL_INSTITUTIONS=1
$env:MAX_CYCLES=10
$env:SCRAPE_BATCH_SIZE=50

# Run automatic cycle
node scraper-lite/manual auto
```

### **Or use wrapper scripts:**
```bash
# Windows PowerShell
.\scraper-lite/run-cycle.ps1

# Windows CMD
scraper-lite\run-cycle.bat
```

### **Single Full Cycle:**
```bash
node scraper-lite/manual full-cycle
```

## 📊 What Gets Run Automatically

When you run `auto-cycle`, it executes:

1. **Discovery Phase**
   - Loads seeds from `src/config.ts`
   - Discovers new URLs with diagnostics
   - Uses overview page detection
   - Adaptive depth exploration

2. **Scraping Phase**
   - Processes queued URLs in batches
   - Extracts all metadata (including NEW smart discoveries):
     - ✅ Structured geography
     - ✅ Funding type
     - ✅ Industries
     - ✅ Technology focus
     - ✅ Program topics
     - ✅ Enhanced deadlines
   - Saves to database

3. **Learning Phase**
   - Learns URL patterns from successful pages
   - Updates pattern database

4. **Quality Phase**
   - Monitors extraction quality
   - Identifies low-quality pages for re-scraping

5. **Retry Phase**
   - Automatically retries failed jobs (up to 3 attempts)

6. **Repeat**
   - Continues until no new URLs found or MAX_CYCLES reached

## ⚙️ Configuration

All configuration is in:
- **`scraper-lite/src/config.ts`** - Institution definitions, seed URLs
- **Environment variables** - Batch size, cycles, limits

## 📝 Summary

**Main file for automatic running:** 
- `scraper-lite/scripts/automatic/auto-cycle.js`

**Entry points:**
- `node scraper-lite/manual auto` ⭐ (Recommended)
- `.\scraper-lite/run-cycle.ps1` (PowerShell)
- `scraper-lite\run-cycle.bat` (Batch)

All improvements (geography, funding type, industries, tech focus, topics) are **automatically included** in the extraction when running any of these!

