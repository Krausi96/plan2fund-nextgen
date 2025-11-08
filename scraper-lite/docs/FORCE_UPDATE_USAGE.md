# Force Update Feature - Usage Guide

## 🎯 What It Does

The `FORCE_UPDATE` flag allows you to **re-scrape existing pages** to:
- ✅ Update old data with new improvements
- ✅ Refresh outdated information (deadlines, amounts, etc.)
- ✅ Fix low-quality pages (apply new category structure)

---

## 📋 Usage

### Option 1: Environment Variable

```bash
# Enable force update
FORCE_UPDATE=true npm run scraper:unified -- scrape --max=50

# Or in PowerShell
$env:FORCE_UPDATE="true"; npm run scraper:unified -- scrape --max=50
```

### Option 2: Command-Line Argument

```bash
npm run scraper:unified -- scrape --max=50 --force-update
```

### Option 3: In .env.local

Add to `.env.local`:
```
FORCE_UPDATE=true
```

Then run normally:
```bash
npm run scraper:unified -- scrape --max=50
```

---

## 🔍 How It Works

### Normal Mode (Default)
```bash
npm run scraper:unified -- scrape --max=50
```
- ✅ Scrapes **new URLs** only
- ⏭️ **Skips existing URLs** (efficient)
- 💰 **Saves API calls**

### Force Update Mode
```bash
FORCE_UPDATE=true npm run scraper:unified -- scrape --max=50
```
- ✅ Scrapes **all URLs** (new + existing)
- 🔄 **Updates existing pages** with new data
- 💰 **Uses more API calls** (re-scrapes everything)

---

## 📊 What Gets Updated

When you force update, the database **updates**:
- ✅ Title & description
- ✅ Funding amounts (min/max)
- ✅ Deadlines
- ✅ Contact information
- ✅ Funding types
- ✅ Program focus
- ✅ Region
- ✅ **All requirements** (deleted and re-inserted with new structure)
- ✅ Metadata JSON

**Note**: The page ID stays the same (no duplicates created)

---

## 🎯 When to Use

### ✅ Use Force Update When:
1. **After improvements** - Update old pages with new category structure
2. **Data cleanup** - Fix low-quality pages
3. **Refresh deadlines** - Update expired/rolling deadlines
4. **Fix metadata** - Correct funding amounts, contact info
5. **One-time cleanup** - Migrate old data to new structure

### ❌ Don't Use Force Update When:
1. **Normal scraping** - Just discovering new pages
2. **Recent pages** - Pages scraped in last 7 days are probably fine
3. **Cost-sensitive** - Force update uses more API calls
4. **Large batches** - Can be slow/expensive for many pages

---

## 💡 Best Practices

### 1. Targeted Updates
Instead of updating everything, update specific pages:

```bash
# Update only low-quality pages (requires custom script)
npm run update-low-quality-pages
```

### 2. Batch Updates
Update in smaller batches:

```bash
# Update 10 pages at a time
FORCE_UPDATE=true npm run scraper:unified -- scrape --max=10
```

### 3. Check Before Update
Check what will be updated:

```bash
# See which pages exist
npm run db:status

# Then update specific ones
FORCE_UPDATE=true npm run scraper:unified -- scrape --max=50
```

---

## 📈 Example Output

### Normal Mode:
```
📋 Scraping 20 programs with LLM (8 parallel)...
[1/20] https://www.aws.at/en/aws-seedfinancing/...
   ⏭️  Already in database, skipping (use --force-update to re-scrape)
[2/20] https://www.ffg.at/en/program/...
   🤖 Extracting with LLM...
   ✅ Saved (ID: 5416): 10000-50000 EUR, 15 requirements
✅ Scraping complete: 1 saved, 19 skipped
```

### Force Update Mode:
```
📋 Scraping 20 programs with LLM (8 parallel)...
[1/20] https://www.aws.at/en/aws-seedfinancing/...
   🔄 Force update: Re-scraping existing page...
   🤖 Extracting with LLM...
   ✅ Saved (ID: 5318): 10000-50000 EUR, 18 requirements (updated)
[2/20] https://www.ffg.at/en/program/...
   🤖 Extracting with LLM...
   ✅ Saved (ID: 5416): 10000-50000 EUR, 15 requirements
✅ Scraping complete: 20 saved (1 updated), 0 skipped
```

---

## ⚠️ Important Notes

1. **No Duplicates**: Database uses `ON CONFLICT DO UPDATE` - no duplicates created
2. **Requirements Replaced**: Old requirements are deleted, new ones inserted
3. **Page ID Preserved**: Same page ID (no new records)
4. **API Costs**: Force update uses more LLM API calls
5. **Time**: Takes longer (re-scrapes everything)

---

## 🚀 Quick Start

### Update All Existing Pages:
```bash
FORCE_UPDATE=true npm run scraper:unified -- scrape --max=1000
```

### Update Specific Batch:
```bash
FORCE_UPDATE=true npm run scraper:unified -- scrape --max=50
```

### Normal Scraping (No Updates):
```bash
npm run scraper:unified -- scrape --max=50
```

---

## ✅ Summary

- **Default**: Skips existing pages (efficient)
- **Force Update**: Re-scrapes existing pages (updates them)
- **No Duplicates**: Database prevents duplicates automatically
- **Use When**: You want to refresh old data with improvements

**Your database stays clean - no garbage, just updates!** 🎯

