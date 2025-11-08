# Implementation Summary - Blacklist & Discovery

## ✅ What Was Implemented

### 1. Database-Backed Blacklist

**File**: `scraper-lite/src/utils-blacklist.ts`
- ✅ `isUrlExcluded()` - Checks database exclusions + hardcoded fallbacks
- ✅ `getExclusionPatterns()` - Debug helper to list exclusions

**Changes to `db.ts`**:
- ✅ `learnUrlPatternFromPage()` now supports `pattern_type = 'exclude'`
- ✅ Auto-learns exclusions from 404s, login pages, and pages with 0 requirements

**Integration**:
- ✅ Discovery checks blacklist before processing seeds
- ✅ Scraping checks blacklist before fetching URLs
- ✅ Auto-learns exclusions from failed scrapes

### 2. Better Discovery Logging

**Changes to `unified-scraper.ts`**:
- ✅ Shows **why** each seed is processed:
  - `✅ New seed URL`
  - `🔄 Re-checking overview page (last: date)`
  - `⚠️  Already in DB but processing anyway`
- ✅ Separates phases:
  - `📋 Phase 1: Processing X NEW seed URLs`
  - `🔄 Phase 2: Re-checking X overview pages`

### 3. Auto-Learning Exclusions

**Triggers**:
- ✅ HTTP 404 → Learn exclusion
- ✅ Requires login → Learn exclusion
- ✅ 0 requirements extracted → Learn exclusion
- ✅ Blacklisted URL → Learn exclusion

**Confidence**:
- ✅ Exclusions start at 0.7 confidence (lower than includes)
- ✅ Confidence decreases on conflict (might be false positive)

### 4. Blacklist Management Script

**File**: `scraper-lite/test/manage-blacklist.ts`

**Commands**:
```bash
npm run blacklist:add -- --pattern="/news/" --host="example.com" [--reason="Manual exclusion"]
npm run blacklist:remove -- --pattern="/news/" --host="example.com"
npm run blacklist:list [--host="example.com"]
npm run blacklist:clean [--min-confidence=0.5]
```

---

## 📋 How It Works

### Blacklist Check Flow

1. **Discovery**:
   ```
   Seed URL → isUrlExcluded() → Database check → Hardcoded fallback → Process or Skip
   ```

2. **Scraping**:
   ```
   Queued URL → isUrlExcluded() → Database check → Hardcoded fallback → Fetch or Skip
   ```

3. **Learning**:
   ```
   Failed scrape → learnUrlPatternFromPage(url, host, false) → Store exclusion pattern
   ```

### Why Database is Better

**Before (Hardcoded)**:
- ❌ Scattered across multiple files
- ❌ Requires code deployment to update
- ❌ No learning from mistakes
- ❌ Hard to maintain

**After (Database)**:
- ✅ Centralized in `url_patterns` table
- ✅ Update without code changes
- ✅ Auto-learns from failed scrapes
- ✅ Queryable and analyzable
- ✅ Institution-specific exclusions
- ✅ Confidence-based filtering

---

## 🔄 Re-Checking Blacklisted URLs

### Current Implementation

**Not yet implemented** - but here's the plan:

1. **Periodic Re-Check** (every 30 days):
   ```typescript
   // Re-check low-confidence exclusions
   const blacklistedToRecheck = await pool.query(`
     SELECT learned_from_url 
     FROM url_patterns
     WHERE pattern_type = 'exclude'
       AND confidence < 0.8
       AND updated_at < NOW() - INTERVAL '30 days'
   `);
   ```

2. **Manual Override**:
   ```bash
   npm run blacklist:remove -- --pattern="/pattern/" --host="example.com"
   npm run scraper:unified -- scrape --url="exact-url" --force-update
   ```

3. **Auto-Remove on Success**:
   - If blacklisted URL successfully scrapes → remove exclusion
   - If excluded pattern matches good URL → lower confidence

---

## 📝 Industry-Specific Seeds

### What to Add

**Examples** (add to `institutionConfig.ts`):

#### Tech/IT
```typescript
{
  name: 'FFG - Digital Innovation',
  baseUrl: 'https://www.ffg.at',
  programUrls: [
    'https://www.ffg.at/en/programme/digital-innovation',
    'https://www.ffg.at/en/programme/ict',
  ],
  fundingTypes: ['grant'],
  programFocus: ['technology', 'digital', 'innovation'],
  region: 'Austria',
  autoDiscovery: true,
  keywords: ['digital', 'ICT', 'AI', 'software', 'tech']
}
```

#### Manufacturing
```typescript
{
  name: 'AWS - Industry 4.0',
  baseUrl: 'https://aws.at',
  programUrls: [
    'https://www.aws.at/en/aws-digitalization/industry-4.0/',
  ],
  fundingTypes: ['grant', 'loan'],
  programFocus: ['manufacturing', 'automation'],
  region: 'Austria',
  autoDiscovery: true,
  keywords: ['industry 4.0', 'manufacturing', 'automation']
}
```

#### Green/Energy
```typescript
{
  name: 'Klimafonds - Green Tech',
  baseUrl: 'https://www.klimafonds.gv.at',
  programUrls: [
    'https://www.klimafonds.gv.at/foerderung/green-tech/',
  ],
  fundingTypes: ['grant'],
  programFocus: ['sustainability', 'energy', 'climate'],
  region: 'Austria',
  autoDiscovery: true,
  keywords: ['green tech', 'renewable', 'climate', 'energy']
}
```

---

## 🎯 Next Steps

1. ✅ **Test blacklist system** - Run discovery and check exclusions
2. ✅ **Add industry seeds** - Expand coverage gradually
3. ⚠️ **Implement re-check** - Periodic re-check of blacklisted URLs
4. ⚠️ **Monitor learning** - Check if exclusions are working correctly

---

## 📊 Usage Examples

### Check if URL is blacklisted
```typescript
import { isUrlExcluded } from './src/utils-blacklist';
const excluded = await isUrlExcluded('https://example.com/news/');
```

### Add manual exclusion
```bash
npm run blacklist:add -- --pattern="/news/" --host="example.com" --reason="Not a program page"
```

### List all exclusions
```bash
npm run blacklist:list
```

### Clean low-confidence exclusions
```bash
npm run blacklist:clean -- --min-confidence=0.5
```

---

## ✅ Summary

**Blacklisting**:
- ✅ Uses existing `url_patterns` table with `pattern_type = 'exclude'`
- ✅ Keeps hardcoded patterns as fallback
- ✅ Auto-learns from failed scrapes
- ✅ Manual management via scripts

**Discovery**:
- ✅ Better logging shows why seeds are processed
- ✅ Separate phases for new seeds vs overview re-check
- ✅ Clear distinction between new and re-checked URLs

**Industry Seeds**:
- ✅ Examples provided for Tech, Manufacturing, Green/Energy
- ✅ Add to `institutionConfig.ts` with appropriate metadata

**Re-Check System**:
- ⚠️ Plan documented, not yet implemented
- ✅ Manual override available via blacklist scripts

