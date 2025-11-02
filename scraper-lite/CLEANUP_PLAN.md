# 🧹 Cleanup Plan - Safe Deletion Guide

## ✅ SAFE TO DELETE (Recommended)

### 1. Backup Files
```
scraper-lite/data/lite/state.json.backup.*
```
**Reason**: Old automatic backups, data now in NEON database  
**Impact**: None - data is in database

### 2. Old Scripts (If Unused)
Check these scripts - may be test/debug scripts:
- `scraper-lite/scripts/debug-extraction.js` - Debug script?
- `scraper-lite/scripts/test-extract-meta.ts` - Test file?

## 📦 KEEP AS BACKUP (But Not Critical)

### 1. Current State File
```
scraper-lite/data/lite/state.json
```
**Reason**: Still used as fallback in scraper.ts (dual-write mode)  
**Action**: Can be kept for now, but can remove once fully on database

### 2. Raw HTML Files
```
scraper-lite/data/lite/raw/*.html
```
**Reason**: Useful for debugging extraction issues  
**Action**: Can delete to save space, but useful to keep sample

### 3. Old Scraped Data
```
data/scraped-programs-latest.json
data/scraped-programs-*.json (old dates)
```
**Reason**: Fallback for API if database fails  
**Action**: Keep latest, delete old dated ones after verifying in database

## ⚠️ DO NOT DELETE (Critical)

### 1. Active Code
- `scraper-lite/src/scraper.ts` - Active scraper
- `scraper-lite/src/extract.ts` - Active extraction
- `scraper-lite/src/db/*` - Database client
- `pages/api/programs.ts` - Active API

### 2. Configuration
- `scraper-lite/src/config.ts` - Institution config
- `.env.local` - Database connection

### 3. Legacy (Keep for Reference)
- `legacy/webScraperService.ts` - Reference code
- `legacy/institutionConfig.ts` - Reference config

## 🎯 Recommended Cleanup Steps

### Step 1: Delete Backup Files
```bash
Remove-Item scraper-lite/data/lite/state.json.backup.*
```

### Step 2: Archive Old Scraped Data
```bash
# Keep latest, archive old ones
Move-Item data/scraped-programs-2025-*.json data/archive/ -ErrorAction SilentlyContinue
```

### Step 3: Clean Raw HTML (Optional)
```bash
# Keep sample, delete rest
# Or just leave it - not hurting anything
```

### Step 4: Update Scraper (Remove JSON Fallback)
Once confident database is stable:
- Remove `loadState()` / `saveState()` calls
- Remove JSON fallback logic
- Delete `state.json` file

## 📊 Space Savings Estimate

- Backup files: ~few MB
- Old scraped JSON: ~check size
- Raw HTML: ~large (1658 files) - optional cleanup

