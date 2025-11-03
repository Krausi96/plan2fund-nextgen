# 🔧 Scraper Improvements Needed

**Date:** 2025-01-03  
**Test Cycle:** Full cycle test results

---

## 📊 **Test Results Summary**

- **Discovery:** 0 new URLs found (131/140 already seen = 93.7%)
- **Scraping:** 83 new pages scraped (227 total)
- **Database:** ❌ Not connected (DATABASE_URL not set)
- **Failed Jobs:** 3 (extraction errors)

---

## ❌ **Critical Issues**

### **1. Database Connection Not Set**
**Status:** ❌ **BLOCKING**

**Problem:**
- All saves fail with: `DATABASE_URL environment variable is not set`
- Pages saved to JSON only, not database
- Can't use database quality scripts effectively

**Impact:** High - Data not persisting to database

**Fix:**
```bash
# Set in .env.local
DATABASE_URL=postgresql://...
```

**Priority:** 🔴 **P0 - Must fix immediately**

---

### **2. Discovery Not Finding New URLs**
**Status:** ⚠️ **Needs Investigation**

**Problem:**
- 0 new URLs discovered
- 131/140 URLs already in `state.seen`
- Acceptance rate: 0%

**Possible Causes:**
1. All URLs already discovered (expected if running multiple times)
2. Discovery depth too shallow
3. URL filtering too strict
4. Need fresh seed URLs

**Current State:**
- Total URLs seen: 5,658
- Discovery pages processed: 140
- Programs found: 0

**Solutions:**
- Reset `state.seen` for specific domains (if re-discovering)
- Use new seed URLs
- Increase `LITE_MAX_DISCOVERY_PAGES` (currently 50)
- Increase discovery depth (`maxDepth`)

**Priority:** 🟡 **P1 - If need fresh URLs**

---

### **3. Query Parameter URLs Still Being Scraped**
**Status:** ⚠️ **Partially Fixed**

**Problem:**
Still seeing query parameter URLs in results:
- `?type%5BB0%5D=call` (should be filtered)
- `?type%5B0%5D=c` (should be filtered)

**Examples Found:**
- `https://www.ffg.at/en/diversityscheck?type%5BB0%5D=call`
- `https://www.ffg.at/en/diversityscheck?type%5BB0%5D=service`
- `https://www.ffg.at/en/diversitec/ausschreibunng?type%5B0%5D=c`

**Current Filter:**
```typescript
/(filter|field_|search|suche|query|sort=|type%5B|year%5B|combine_|combine%5B|page=|offset=|limit=|year=|type=|category=)/
```

**Missing Patterns:**
- `type%5BB0%5D` (double B)
- `type%5B0%5D` (already included, but case sensitivity?)

**Fix Needed:**
```typescript
// Make case-insensitive and catch double B pattern
/(filter|field_|search|suche|query|sort=|type%5b|type%5bb|year%5b|combine%5b|page=|offset=|limit=|year=|type=|category=)/i
```

**Priority:** 🟡 **P1 - Data quality**

---

### **4. Contact Email Extraction Still Has Issues**
**Status:** ⚠️ **Partially Fixed**

**Problem:**
Still extracting invalid contacts:
- `1994-1996` (date range)
- `2024-2026` (date range)
- `2021-2027` (date range)
- `2025-2027` (date range)
- `post@aws.atCommercial` (email + trailing text)

**Root Cause:**
- Email cleaning not stopping at word boundaries properly
- Date range validation not catching all patterns

**Current Code:**
```typescript
// ENHANCED: Exclude date ranges (e.g., "2022-2026" mistaken as email)
if (/^\d{4}-\d{4}$/.test(e.split('@')[0])) return false;
// ENHANCED: Exclude if starts with numbers followed by dash (likely date)
if (/^\d{4}-\d/.test(e)) return false;
```

**Issue:**
- Pattern `^\d{4}-\d{4}$` checks before `@`, but date might be at start of domain part
- Need to check entire email string

**Fix Needed:**
```typescript
// Better date range detection
const emailLower = e.toLowerCase();
if (/\d{4}-\d{4}/.test(emailLower)) return false; // Any date range in email
if (/^(\d{4}-\d{2,4}|199\d|200\d|201\d|202\d)@/.test(emailLower)) return false; // Starts with year
```

**Priority:** 🟡 **P1 - Data quality**

---

### **5. Extraction Errors for Some Domains**
**Status:** ⚠️ **Needs Investigation**

**Problem:**
Getting "Cannot read properties of undefined (rea)" errors for:
- `viennabusinessagency.at` (multiple pages)
- `sfg.at` (multiple pages)

**Error Pattern:**
```
Cannot read properties of undefined (rea)
```

**Possible Causes:**
1. HTML structure different for these domains
2. Missing null checks in extraction code
3. Cheerio parsing issue
4. `safeTextForMatch` not properly initialized

**Investigation Needed:**
- Check HTML structure from these domains
- Add better error handling in `extractMeta()`
- Add null checks for `safeTextForMatch`

**Priority:** 🟡 **P2 - Affects specific domains**

---

## 📉 **Data Quality Metrics (Needs Improvement)**

### **Deadline Extraction: 7.6%** ⚠️
**Current:** 78/1024 pages (7.6%)  
**Target:** >30%

**Found Some Deadlines:**
- ✅ `12.11.2025`
- ✅ `31.03.2026`
- ✅ `09.10.2025`
- ✅ `18.03.2025`
- ✅ `10.09.2025`
- ✅ `20.11.2025`
- ✅ `01.10.2025`
- ✅ `07.11.2025`

**Improvements Needed:**
- Better HTML structure parsing (already improved, but needs more)
- More keyword patterns
- Better month name format support
- Context-aware extraction

---

### **Contact Email: 12.7%** ⚠️
**Current:** 130/1024 pages (12.7%)  
**Target:** >40%

**Issues:**
- Date ranges still being extracted
- Trailing text not cleaned properly
- Some valid emails missing

---

### **Funding Amount: 17.6%** ⚠️
**Current:** 180/1024 pages (17.6%)  
**Target:** >50%

**Issues:**
- Some amounts extracted incorrectly (very small values like "3 EUR", "4 EUR")
- Range extraction needs improvement
- Currency detection needs work

---

## ✅ **What's Working Well**

1. ✅ **Category Coverage** - All 18 categories present
2. ✅ **Smart Discoveries** - Geography, funding type, industries, tech focus, topics extraction working
3. ✅ **Scraping Process** - Batch processing, retry logic working
4. ✅ **Query Parameter Filtering** - Most patterns caught (need edge cases)
5. ✅ **Deadline Extraction** - Improved from before (found some deadlines)

---

## 🔧 **Recommended Fixes (Priority Order)**

### **P0: Critical (Must Fix)**
1. **Set DATABASE_URL** - Required for database storage
2. **Fix contact email date extraction** - Improve validation

### **P1: High Priority**
3. **Fix query parameter filtering** - Catch remaining patterns
4. **Investigate extraction errors** - Fix "Cannot read properties" for viennabusinessagency.at, sfg.at
5. **Improve deadline extraction** - Target 30%+ coverage

### **P2: Medium Priority**
6. **Improve funding amount extraction** - Target 50%+ coverage
7. **Improve contact email extraction** - Target 40%+ coverage
8. **Reset discovery state** - If need fresh URLs

---

## 📊 **Current Data Quality**

```
Pages with Requirements:        1024 / 1024 (100.0%)
Pages with Critical Categories: 272 / 1024 (26.6%)
Deadline Coverage:               78 / 1024 (7.6%) ⚠️
Contact Email Coverage:         130 / 1024 (12.7%) ⚠️
Funding Amount Coverage:        180 / 1024 (17.6%) ⚠️
Region Coverage:                 471 / 1024 (46.0%) ✅
```

---

## 🎯 **Next Steps**

1. **Immediate:** Set DATABASE_URL
2. **Fix contact email validation** (P0)
3. **Fix query parameter filtering** (P1)
4. **Investigate extraction errors** (P1)
5. **Improve deadline extraction** (P1)
6. **Test fixes** - Run another cycle to validate

---

**Last Updated:** 2025-01-03  
**Test Cycle:** Full automated cycle with 20 batch size

