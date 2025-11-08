# Funding Types & Blacklist - Critical Analysis

## 1. Funding Types - Problems & Solutions

### Current Problems

**Duplicates** (from database):
- `grant` (152) vs `grants` (21) → Should be `grant`
- `loan` (41) vs `loans` (14) → Should be `loan`
- `subsidy` (8) vs `subsidies` (1) → Should be `subsidy`
- `guarantee` (8) vs `guarantees` (2) → Should be `guarantee`

**Invalid Types**:
- `services` (14) - ❌ Not a funding type (should be removed)
- `service` (1) - ❌ Not a funding type (should be removed)
- `coaching` (3) - ❌ Not a funding type (should be removed)
- `mentoring` (1) - ❌ Not a funding type (should be removed)
- `consultations` (2) - ❌ Not a funding type (should be removed)
- `networking opportunities` (1) - ❌ Not a funding type (should be removed)
- `real estate` (1) - ❌ Not a funding type (should be removed)
- `funding` (1) - ❌ Too generic (should be removed)
- `unknown` (22) - ❌ Should be inferred or empty

**Missing**:
- `leasing` - ✅ Should be in list (already in config, but LLM not extracting it)

### Root Causes

1. **LLM Prompt Contradiction**:
   - Says: "must be one of: grant, loan, equity..."
   - Shows example: `["grants", "loans", "equity", "services"]`
   - LLM follows example, not instruction!

2. **No Normalization**:
   - LLM returns whatever it wants
   - Stored directly in database
   - No post-processing

3. **Inference Uses "unknown"**:
   - Should infer from context
   - Should return empty array if truly unclear

### Solutions Implemented

✅ **1. Created `utils-funding-types.ts`**:
- `normalizeFundingTypes()` - Normalizes array
- Maps plurals → singular (grants → grant)
- Removes invalid types (services, coaching, etc.)
- Maps variations (venture capital → venture_capital)
- Returns empty array if all invalid

✅ **2. Updated LLM Prompt**:
- Explicitly lists canonical types
- Shows singular examples
- Says "DO NOT use: services, coaching, unknown"
- Says return empty array if unclear

✅ **3. Updated Scraping Logic**:
- Normalizes LLM-extracted types
- Infers from context if empty
- Never uses "unknown"

✅ **4. Created Migration Script**:
- `normalize-funding-types.ts` - Normalizes existing data
- Merges duplicates
- Removes invalid types
- Infers types for "unknown"

### Canonical Funding Types

**Valid Types** (from `institutionConfig.ts`):
- `grant`
- `loan`
- `equity`
- `bank_loan`
- `leasing` ⚠️ **Missing from LLM prompt!**
- `crowdfunding`
- `subsidy`
- `guarantee`
- `incentive`
- `investment`
- `venture_capital`
- `angel_investment`
- `government_support`
- `tax_incentive`

**Invalid Types** (should be removed):
- `services`, `service` - Not funding types
- `coaching`, `mentoring` - Not funding types
- `consultations` - Not funding types
- `networking opportunities` - Not funding types
- `real estate` - Not funding types
- `funding` - Too generic
- `unknown` - Should be inferred

---

## 2. Blacklist - Critical Analysis

### Is It Foolproof? ⚠️ **NO - Several Critical Issues**

### Issues Found

#### Issue 1: Pattern Matching Too Broad ⚠️ **CRITICAL**

**Problem**: Patterns might match valid URLs

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

**Fix Applied**: ✅ Use anchor patterns (`^` and `$`) for exact matching

#### Issue 2: Confidence Threshold Too Low ⚠️ **CRITICAL**

**Problem**: `confidence > 0.5` means "50% sure" - too low!

**Current**: `confidence > 0.5`
**Issue**: Could exclude valid URLs with low confidence

**Fix Applied**: ✅ Increased to `confidence > 0.7`

#### Issue 3: No Pattern Validation ⚠️ **MEDIUM**

**Problem**: Learned patterns aren't validated

**Example**:
- URL `/program/123` fails → learns exclusion `/program/:id`
- But `/program/456` might be valid!
- Pattern is too broad

**Fix Applied**: ✅ Don't learn exclusions for root-level paths (< 2 segments)

#### Issue 4: Hardcoded Fallbacks Too Aggressive ⚠️ **MEDIUM**

**Problem**: Hardcoded patterns might exclude valid URLs

**Example**:
- Pattern: `/news/` excludes all news pages
- But `/news/funding-announcement/` might be valid!

**Status**: ⚠️ **ACCEPTABLE** - Hardcoded patterns are for common non-program pages

#### Issue 5: No Re-Check Mechanism ⚠️ **LOW**

**Problem**: Once blacklisted, URL is never re-checked

**Status**: ⚠️ **PLANNED** - Not yet implemented

#### Issue 6: Host-Specific ✅ **GOOD**

**Status**: ✅ Already handled (patterns are host-specific)

### Improvements Made

✅ **1. Increased Confidence Threshold**:
- Changed from `0.5` to `0.7`
- Only high-confidence exclusions are used

✅ **2. Anchor Patterns**:
- Use `^` and `$` for exact matching
- Prevents broad pattern matching

✅ **3. Pattern Validation**:
- Don't learn exclusions for root-level paths
- Prevents too-broad patterns

### Remaining Issues

⚠️ **1. No Re-Check System**:
- Low-confidence exclusions never re-checked
- **Recommendation**: Implement periodic re-check (every 30 days)

⚠️ **2. Hardcoded Patterns**:
- Might exclude valid URLs
- **Recommendation**: Add whitelist exceptions

⚠️ **3. Pattern Conflict Detection**:
- Include vs exclude patterns might conflict
- **Recommendation**: Check for conflicts before learning

### Is It Foolproof? ⚠️ **NO, But Improved**

**Before**:
- ❌ Confidence 0.5 (too low)
- ❌ No anchor patterns (too broad)
- ❌ No validation (too-broad patterns)

**After**:
- ✅ Confidence 0.7 (better)
- ✅ Anchor patterns (more specific)
- ✅ Pattern validation (prevents too-broad)

**Remaining Risks**:
- ⚠️ Still might exclude valid URLs if pattern is too specific
- ⚠️ No re-check mechanism
- ⚠️ Hardcoded patterns might be too aggressive

**Recommendation**: Monitor and adjust confidence threshold based on false positives

---

## 3. Date Normalization - Where Does It Apply?

### Current Implementation

**File**: `scraper-lite/src/utils-date.ts`
**Function**: `normalizeDate()`

**Applied To**:
- ✅ **`deadline`** field only (in `normalizeMetadata()`)

**NOT Applied To**:
- ✅ `fetched_at` - Uses `new Date().toISOString()` (already ISO) - **CORRECT**
- ✅ `created_at` - Database default (NOW()) - **CORRECT**
- ✅ `updated_at` - Database default (NOW()) - **CORRECT**

### Database Schema

**Date Fields**:
- `deadline` - DATE type → **Needs normalization** ✅
- `fetched_at` - TIMESTAMP → **Already ISO** ✅
- `created_at` - TIMESTAMP → **Database default** ✅
- `updated_at` - TIMESTAMP → **Database default** ✅

### Error Prevention

**Error**: `date/time field value out of range: "18.11.2025"`

**Location**: `savePageWithRequirements()` in `db.ts`

**Cause**: LLM returns `"18.11.2025"` (DD.MM.YYYY), PostgreSQL expects `"2025-11-18"` (YYYY-MM-DD)

**Fix**: ✅ **IMPLEMENTED** - `normalizeDate()` called in `normalizeMetadata()`

**Status**: ✅ **CORRECT** - Only `deadline` needs normalization

---

## Summary

### 1. Funding Types ✅ **FIXED**

**Problems**: Duplicates, invalid types, no normalization
**Solutions**: Normalization function, updated prompt, migration script
**Status**: ✅ **READY** - Test and migrate existing data

### 2. Blacklist ⚠️ **IMPROVED, BUT NOT FOOLPROOF**

**Issues**: Pattern matching, confidence threshold, validation
**Fixes**: Increased confidence, anchor patterns, validation
**Remaining**: Re-check system, whitelist exceptions
**Status**: ⚠️ **BETTER, BUT MONITOR**

### 3. Date Normalization ✅ **CORRECT**

**Applied To**: `deadline` field only
**Status**: ✅ **CORRECT** - Only field that needs it

---

## Next Steps

1. ✅ **Test funding type normalization** - Run scraper
2. ✅ **Run migration** - Normalize existing funding types
3. ⚠️ **Monitor blacklist** - Check for false positives
4. ⚠️ **Implement re-check** - Periodic re-check of exclusions

