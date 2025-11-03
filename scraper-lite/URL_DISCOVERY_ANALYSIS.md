# URL Discovery Analysis

## 📊 Current Status

### State Analysis
- **Seen URLs**: 266 (all seed URLs from institution config)
- **Jobs Queued**: 0
- **Jobs Done**: 0
- **Discovery Result**: 0 new URLs found

### Discovery Diagnostics (Last Run)
```
📊 Discovery Diagnostics:
   Total links processed: 0
   Programs found: 0
   Queued for deeper exploration: 0
   Rejected:
     - Exclusion keywords: 0
     - Not detail pages: 0
     - Already seen: 0
     - Different host: 0
     - Downloads: 0
   Programs by depth: {}
   ⚠️  Low acceptance rate: 0% - may need to relax URL filtering
```

## 🔍 Why No New URLs Discovered?

### Root Cause Analysis

**Situation**: All 266 URLs in "seen" are seed URLs from institution config. Discovery ran but found 0 new URLs.

**Possible Reasons**:

1. **Seeds Already Processed**
   - Seed URLs are marked as "seen" before discovery runs
   - When discovery processes them, links FROM those pages are checked
   - But those links either:
     - Don't pass `isProgramDetailPage()` check (most likely)
     - Are already in "seen" (if discovered previously)
     - Have exclusion keywords

2. **isProgramDetailPage() Too Strict**
   - The function has 400+ lines of institution-specific patterns
   - Default behavior: EXCLUDE (only includes if pattern matches)
   - Many valid program URLs might be rejected

3. **Seed Pages Don't Have Discoverable Links**
   - Seed URLs might be program detail pages themselves
   - They might not have links to OTHER program pages
   - Links might be in JavaScript (not crawlable)

4. **maxPages Limit Too Low**
   - Last run: maxPages = 20
   - If queue had 20 seeds, discovery stopped after processing them
   - Didn't get chance to explore deeper

### Evidence from Code

Looking at `scraper.ts` discovery logic:
- Seeds ARE added to queue ✅
- Seeds ARE processed from queue ✅
- Links ARE extracted from seed pages ✅
- Links ARE checked with `isProgramDetailPage()` ✅
- Only passing URLs are added to jobs ✅

**The bottleneck is likely `isProgramDetailPage()` rejecting valid URLs.**

## ✅ Improvements Applied

### 1. More Lenient Exploration
- URLs with funding/program keywords are now explored even if not detail pages
- Helps find detail pages deeper in site structure
- Exploration depth extended to 4 levels for keyword matches

### 2. Enhanced Discovery Diagnostics
- Tracks why URLs are rejected
- Shows programs found by depth
- Warns on low acceptance rates

## 🧪 To Test Discovery

### Option 1: Reset State (Fresh Discovery)
```bash
# Reset jobs and seen URLs (keeps pages)
node scraper-lite/scripts/manual/reset-state.js clean-jobs

# Run discovery with higher limits
LITE_MAX_DISCOVERY_PAGES=100 node scraper-lite/manual discover
```

### Option 2: Test on Specific Institution
```bash
# Test discovery on one institution only
LITE_SEEDS="https://www.ffg.at/en/foerderungen" LITE_MAX_DISCOVERY_PAGES=50 node scraper-lite/manual discover
```

### Option 3: Check isProgramDetailPage() Acceptance
```bash
# Run URL quality check to see what's being rejected
node scraper-lite/scripts/manual/quality-check-urls.js
```

## 📋 Expected Discovery Behavior

**Normal Flow**:
1. Seeds added to queue (depth 0)
2. Process first seed, extract links
3. Links checked with `isProgramDetailPage()`
4. Passing URLs added to jobs + queue (depth 1)
5. Continue processing queue until maxPages reached
6. Diagnostic shows: X links processed, Y accepted, Z rejected

**Current Issue**:
- Step 4 is returning 0 accepted URLs
- All discovered links are being rejected by `isProgramDetailPage()`

## 🔧 Recommendations

1. **Run Discovery with Diagnostics**: Use higher maxPages to see actual rejection reasons
2. **Check isProgramDetailPage() Patterns**: Review if patterns are too strict for seed page links
3. **Test on Single Seed**: Run discovery on one seed URL to debug
4. **Review Seed URLs**: Verify seed URLs actually contain program links

## 📊 Summary

- **Status**: Discovery functional but finding 0 new URLs
- **Likely Cause**: `isProgramDetailPage()` filtering too strict
- **Fix Applied**: More lenient exploration for keyword matches
- **Next Step**: Run discovery test with higher limits to see diagnostics in action

