# Scripts Directory

## 📁 Core Scripts

### 🤖 Automatic Scripts (`automatic/`)
Scripts that run automatically as part of cycles:

- **`auto-cycle.js`** - Fully automated self-running cycle (discover → scrape → learn → improve)
- **`learn-patterns-from-scraped.js`** - Automatic pattern learning from scraped pages (URL patterns for discovery)

**Usage:**
```bash
# Run automated cycle
node scripts/automatic/auto-cycle.js

# Or via wrapper
.\run-cycle.ps1      # PowerShell
run-cycle.bat        # Windows CMD
```

---

### 🛠️ Manual Scripts (`manual/`)
Core scripts for manual operations:

#### Main Operations
- **`rescrape-all.js`** - Re-scrape pages to improve data quality
```bash
  node scripts/manual/rescrape-all.js --missing --limit=50
```

- **`process-pdfs.js`** - Process PDF documents from queue
```bash
  node scripts/manual/process-pdfs.js --limit=20
  ```

#### Analysis & Quality
- **`verify-database-quality.js`** - Verify database quality and coverage
- **`analyze-data-quality-gaps.js`** - Analyze data quality gaps and priorities

#### Setup
- **`setup-learning-tables.js`** - Setup learning tables (one-time use)

---

## 🚀 Quick Start

### Automatic Scraping
```bash
cd scraper-lite
.\run-cycle.ps1
```

### Manual Rescraping
```bash
# Rescrape pages with missing data
node scripts/manual/rescrape-all.js --missing --limit=50

# Check quality
node scripts/manual/analyze-data-quality-gaps.js
```

### Process PDFs
```bash
node scripts/manual/process-pdfs.js --limit=20
```

---

## 📊 Workflow

1. **Run automatic cycle** → `auto-cycle.js`
2. **Rescrape missing data** → `rescrape-all.js --missing`
3. **Process PDFs** → `process-pdfs.js` (if needed)
4. **Check quality** → `analyze-data-quality-gaps.js`
