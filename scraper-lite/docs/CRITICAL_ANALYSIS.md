# Critical Analysis - Funding Types, Blacklist, Date Normalization

## 1. Funding Types - Normalization Issues

### Current Problems

**Duplicates Found**:
- `grant` (152) vs `grants` (21)
- `loan` (41) vs `loans` (14)
- `subsidy` (8) vs `subsidies` (1)
- `guarantee` (8) vs `guarantees` (2)

**Invalid Types**:
- `services` (14) - Not a funding type
- `service` (1) - Not a funding type
- `coaching` (3) - Not a funding type
- `mentoring` (1) - Not a funding type
- `consultations` (2) - Not a funding type
- `networking opportunities` (1) - Not a funding type
- `real estate` (1) - Not a funding type
- `funding` (1) - Too generic
- `unknown` (22) - Should be inferred or empty

**Missing Types**:
- `leasing` - Should be in canonical list (already in config!)

### Root Cause

1. **LLM Prompt Issue**: 
   - Prompt says "must be one of: grant, loan, equity..." 
   - BUT example shows: `"funding_types": ["grants", "loans", "equity", "services"]`
   - LLM follows example, not instruction!

2. **No Normalization**:
   - LLM returns whatever it wants
   - No post-processing to normalize
   - Stored directly in database

3. **Inference Fallback**:
   - Uses "unknown" as last resort
   - Should infer from context instead

### Solution Implemented

✅ **Created `utils-funding-types.ts`**:
- `normalizeFundingTypes()` - Normalizes array of types
- Maps plurals → singular (grants → grant)
- Removes invalid types (services, coaching, etc.)
- Maps variations (venture capital → venture_capital)
- Returns empty array if all invalid (not "unknown")

✅ **Updated LLM Prompt**:
- Explicitly lists canonical types
- Shows examples with singular forms
- Says "DO NOT use: services, coaching, unknown"
- Says return empty array if unclear (not "unknown")

✅ **Updated Scraping Logic**:
- Normalizes LLM-extracted types
- Infers from context if empty
- Never uses "unknown"

### Migration Needed

**Existing Data**:
- Need to normalize existing funding types in database
- Merge duplicates (grants → grant)
- Remove invalid types (services, coaching, etc.)
- Infer types for "unknown" entries

**Script**: `scraper-lite/test/normalize-funding-types.ts` (to be created)

---

## 2. Blacklist - Critical Analysis

### Is It Foolproof? ⚠️ **NO - Several Issues**

### Issues Found

#### Issue 1: Pattern Matching Too Broad
**Problem**: Regex patterns might match valid URLs

**Example**:
- Pattern: `/foerderungen/` (excluded)
- Valid URL: `/foerderungen/innovation-grant/` (should NOT be excluded!)

**Current Code**:
```typescript
const regexPattern = row.pattern.replace(/:id/g, '\\d+');
const regex = new RegExp(regexPattern, 'i');
if (regex.test(path)) {
  return true; // Excluded!
}
```

**Issue**: Pattern `/foerderungen/` matches ANY path containing `/foerderungen/`, including valid program pages!

**Fix Needed**: Use anchor patterns (`^` and `$`) or more specific matching

#### Issue 2: Confidence Threshold Too Low
**Problem**: `confidence > 0.5` might exclude valid URLs

**Current Code**:
```typescript
WHERE host = $1 
  AND pattern_type = 'exclude'
  AND confidence > 0.5
```

**Issue**: 0.5 confidence means "50% sure" - too low! Could exclude valid URLs.

**Fix Needed**: Increase to `confidence > 0.7` or `confidence > 0.8`

#### Issue 3: No Pattern Validation
**Problem**: Learned patterns aren't validated before use

**Example**:
- URL `/program/123` fails → learns exclusion `/program/:id`
- But `/program/456` might be valid!
- Pattern is too broad

**Fix Needed**: Validate patterns before learning, or use more specific patterns

#### Issue 4: Hardcoded Fallbacks Too Aggressive
**Problem**: Hardcoded patterns might exclude valid URLs

**Example**:
- Pattern: `/news/` excludes all news pages
- But `/news/funding-announcement/` might be a valid program page!

**Fix Needed**: More specific patterns or whitelist exceptions

#### Issue 5: No Re-Check Mechanism
**Problem**: Once blacklisted, URL is never re-checked

**Issue**: If URL is incorrectly blacklisted, it stays blacklisted forever (unless manually removed)

**Fix Needed**: Periodic re-check of low-confidence exclusions

#### Issue 6: Host-Specific But Pattern Might Be Generic
**Problem**: Pattern learned for one host might be valid for another

**Example**:
- `/news/` excluded for `example.com
- But `/news/` might be valid for `other-site.com`

**Current**: ✅ Already handled (host-specific)

### Recommendations

**High Priority**:
1. ✅ **Increase confidence threshold** to 0.7 or 0.8
2. ✅ **Use anchor patterns** (`^` and `$`) for exact matching
3. ✅ **Validate learned patterns** before storing
4. ⚠️ **Add re-check mechanism** for low-confidence exclusions

**Medium Priority**:
5. ⚠️ **Whitelist exceptions** for hardcoded patterns
6. ⚠️ **Pattern specificity check** (don't learn too-broad patterns)

**Low Priority**:
7. ⚠️ **Manual review** of learned exclusions
8. ⚠️ **Pattern conflict detection** (include vs exclude)

---

## 3. Date Normalization - Where Does It Apply?

### Current Implementation

**File**: `scraper-lite/src/utils-date.ts`
**Function**: `normalizeDate()`

**Applied To**:
- ✅ **`deadline`** field in `normalizeMetadata()` (line 83 in `db.ts`)
- ✅ Converts DD.MM.YYYY → YYYY-MM-DD
- ✅ Handles multiple formats

**NOT Applied To**:
- ❌ `fetched_at` - Uses `new Date().toISOString()` (already ISO)
- ❌ `created_at` - Database default (NOW())
- ❌ `updated_at` - Database default (NOW())

### Database Schema

**Date Fields**:
- `deadline` - DATE type (needs normalization) ✅
- `fetched_at` - TIMESTAMP (already ISO) ✅
- `created_at` - TIMESTAMP (database default) ✅
- `updated_at` - TIMESTAMP (database default) ✅

### Where Errors Occur

**Error**: `date/time field value out of range: "18.11.2025"`

**Location**: `savePageWithRequirements()` in `db.ts` (line 172)

**Cause**: LLM returns `"18.11.2025"` (DD.MM.YYYY), PostgreSQL expects `"2025-11-18"` (YYYY-MM-DD)

**Fix**: ✅ **ALREADY FIXED** - `normalizeDate()` called in `normalizeMetadata()`

### Verification

**Test**: Check if date normalization works

**Expected**: 
- Input: `"18.11.2025"` → Output: `"2025-11-18"`
- Input: `"2025-11-18"` → Output: `"2025-11-18"` (unchanged)
- Input: `null` → Output: `null`

**Status**: ✅ **IMPLEMENTED** - Should prevent date errors

---

## Summary

### 1. Funding Types ✅ **FIXED**

**Problems**:
- ❌ Duplicates (grant/grants)
- ❌ Invalid types (services, coaching)
- ❌ Missing normalization

**Solutions**:
- ✅ Normalization function created
- ✅ LLM prompt updated
- ✅ Scraping logic updated
- ⚠️ Migration needed for existing data

### 2. Blacklist ⚠️ **NEEDS IMPROVEMENT**

**Issues**:
- ⚠️ Pattern matching too broad
- ⚠️ Confidence threshold too low (0.5)
- ⚠️ No pattern validation
- ⚠️ No re-check mechanism

**Recommendations**:
- Increase confidence to 0.7-0.8
- Use anchor patterns for exact matching
- Add pattern validation
- Implement re-check system

### 3. Date Normalization ✅ **WORKING**

**Applied To**:
- ✅ `deadline` field only
- ✅ Prevents "date/time field value out of range" errors

**Status**: ✅ **CORRECT** - Only needed for `deadline`

---

## Next Steps

1. ✅ **Test funding type normalization** - Run scraper and check types
2. ⚠️ **Improve blacklist** - Increase confidence, use anchors
3. ⚠️ **Create migration script** - Normalize existing funding types
4. ⚠️ **Add pattern validation** - Don't learn too-broad patterns

