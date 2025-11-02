# 🔄 Data Flow Analysis & Optimization

**Date:** 2025-11-02  
**Status:** Investigation Complete

---

## 📊 Current Data Flow

### Scraper Flow (scraper-lite/src/scraper.ts)

```
┌─────────────────┐
│  Scrape HTML    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Extract Meta   │
│  (18 categories)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Save to Database│  ✅ PRIMARY
│ - pages table   │
│ - requirements  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Update state.json│  ⚠️ Still used for job tracking
│ (jobs, seen)    │
└─────────────────┘
```

**Findings:**
- ✅ Saves to database (primary storage)
- ✅ Does NOT write to `scraped-programs-latest.json` (good!)
- ⚠️ Still maintains `state.json` for job queue tracking
- ⚠️ Saves raw HTML files (1,658 files, ~270MB)

### API Flow (pages/api/programs.ts)

```
Request: /api/programs?enhanced=true
    │
    ▼
┌─────────────────┐
│ Try JSON first  │  ❌ WRONG PRIORITY
│ (enhanced=true) │
└────────┬────────┘
    │ (if not found)
    ▼
┌─────────────────┐
│ Try Database    │  ✅ Has proper implementation
│ (pages table)   │
└────────┬────────┘
    │ (if error)
    ▼
┌─────────────────┐
│ Fallback JSON   │
└─────────────────┘
```

**Findings:**
- ❌ **Problem:** Tries JSON first (line 283-353)
- ✅ Database query exists (line 477-543)
- ✅ Proper requirement transformation
- ⚠️ Falls back to old JSON files

---

## 💾 Storage Analysis

### Current Storage Usage

**Total:** 269.73 MB in `scraper-lite/data/`

| Location | Files | Size | Purpose | Status |
|----------|-------|------|---------|--------|
| `lite/raw/*.html` | 1,658 | ~270 MB | Raw HTML for debugging | ⚠️ Can be archived/deleted |
| `lite/state.json` | 1 | ~few KB | Job queue state | ✅ Needed for job tracking |
| `lite/*.json` | 7 | Small | Patterns, insights | ✅ Needed |
| `legacy/*.json` | 9 | Small | Old scraped data | ⚠️ Only needed as fallback |

### Issues Found

1. **Raw HTML Files (270MB):**
   - 1,658 HTML files stored locally
   - Useful for debugging but takes space
   - Already stored in database metadata
   - **Recommendation:** Archive old files or enable cleanup

2. **JSON Fallback Priority:**
   - API tries JSON before database
   - Should be reverse
   - **Impact:** May serve stale data

3. **Dual State Management:**
   - `state.json` still used for job queue
   - Database has `scraping_jobs` table
   - **Recommendation:** Migrate job queue to database

---

## 🎯 Optimization Plan

### Phase 1: Fix API Priority (Critical)

**Current:**
```typescript
// Try JSON first
if (enhanced === 'true') {
  const dataPath = path.join(..., 'scraped-programs-latest.json');
  // ... JSON read
}
// Then database
const pages = await getAllPages(1000);
```

**Should be:**
```typescript
// Try Database first
try {
  const pages = await getAllPages(1000);
  // Transform and return
} catch (dbError) {
  // Fallback to JSON only if database fails
  const programs = getFallbackData();
}
```

### Phase 2: Clean Up Storage

**Remove/Archive:**
1. Raw HTML files older than 30 days (keep recent for debugging)
2. Old legacy JSON files (keep only `migrated-programs.json` as fallback)
3. Consolidate duplicate data files

**Keep:**
- `state.json` (needed for job tracking)
- Recent raw HTML (last 100 files for debugging)
- Pattern/insight JSON files (needed for scraper)

### Phase 3: Migrate Job Queue to Database

**Current:**
- Job queue in `state.json`
- Database has `scraping_jobs` table (unused?)

**Action:**
- Use `scraping_jobs` table for queue
- Remove `state.json` dependency
- Update `scraper.ts` to use database for jobs

---

## ✅ Recommended Changes

### 1. Update API Priority

**File:** `pages/api/programs.ts`

```typescript
// CHANGE: Try database FIRST, JSON as fallback
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { type, enhanced } = req.query;
  
  // PRIMARY: Try database first
  try {
    const { getAllPages, searchPages } = require('../../scraper-lite/src/db/page-repository');
    
    const pages = type 
      ? await searchPages({ region: type, limit: 1000 })
      : await getAllPages(1000);
    
    // Transform and return database data
    const programs = await transformPagesToPrograms(pages);
    
    return res.status(200).json({
      success: true,
      programs,
      source: 'database',
      count: programs.length
    });
  } catch (dbError) {
    console.warn('Database query failed, using JSON fallback:', dbError);
    // FALLBACK: JSON only if database fails
    const programs = getFallbackData();
    return res.status(200).json({
      success: true,
      programs,
      source: 'json_fallback',
      count: programs.length
    });
  }
}
```

### 2. Clean Up Raw HTML Files

**Create cleanup script:**
```bash
# Keep last 100 files, archive/delete older
node scraper-lite/scripts/cleanup-raw-html.js --keep=100
```

### 3. Archive Old JSON Files

**Move to archive:**
- `scraped-programs-2025-10-27.json` (old date)
- `scraped-programs-before-run.json` (old backup)
- Keep: `scraped-programs-latest.json` (as emergency fallback)

---

## 📈 Expected Improvements

### Storage Reduction

**Before:** 269.73 MB
**After:** ~5-10 MB (removing old HTML files)

**Savings:** ~260 MB (96% reduction)

### Data Freshness

**Before:** May serve stale JSON data
**After:** Always serves fresh database data

**Impact:** Components get latest scraped data

### Performance

**Before:** JSON file read (synchronous, blocks)
**After:** Database query (async, indexed)

**Impact:** Faster API responses

---

## 🔍 Verification Checklist

- [ ] API uses database as primary source
- [ ] JSON only used as fallback
- [ ] Raw HTML files cleaned up
- [ ] Old JSON files archived
- [ ] Job queue migrated to database
- [ ] Storage reduced significantly
- [ ] Components get fresh data

---

## 📝 Next Steps

1. **Update API priority** (Critical - do first)
2. **Clean up storage** (Medium - reduces disk usage)
3. **Migrate job queue** (Low - improves consistency)

---

**Status:** Ready to implement optimizations

