# Foolproof Blacklist & Deadline Filtering

## 1. Invalid Funding Types - Why & How We Deal With Them

### Why Invalid?

**`services` / `service`**:
- ❌ Not a funding mechanism - it's a **service offering**
- Examples: Consulting, advisory, networking services
- These provide **support**, not **money**

**`coaching` / `mentoring`**:
- ❌ Support services, not funding
- Provide guidance/advice, not money
- Should be in `program_focus`, not `funding_types`

**`consultations`**:
- ❌ Advisory services, not funding
- Provide advice, not money

**`networking opportunities`**:
- ❌ Activity/service, not funding
- Provides connections, not money

**`real estate`**:
- ❌ Industry/sector, not funding type
- Should be in `program_focus`
- Funding for real estate would be `grant`, `loan`, `equity`, etc.

**`unknown`**:
- ❌ Not a type - it's a **lack of information**
- Should be inferred from context or left empty
- Empty array `[]` is better than `["unknown"]`

### How We Deal With Them

**Step 1: Remove Invalid Types** ✅
- `normalizeFundingTypes()` removes all invalid types
- Returns empty array if all invalid

**Step 2: Try to Infer Correct Type** ⚠️
- Check URL patterns (`/grant/`, `/loan/`, etc.)
- Check institution type (research agency = grant, bank = loan)
- Check page content keywords
- `inferFundingType()` handles this

**Step 3: Handle Non-Funding Pages** ⚠️
- If no funding type found → `funding_types: []`
- These pages might need:
  - Exclusion from funding database
  - Different categorization
  - Manual review

**Step 4: Move to Correct Fields** ⚠️
- `real estate` → `program_focus: ["real_estate"]`
- `coaching` → `program_focus: ["coaching"]`
- `services` → `program_focus: ["services"]`

---

## 2. Making Blacklist Foolproof - Re-Check Mechanism

### Current Issues

1. ⚠️ **No Re-Check**: Once blacklisted, URL stays blacklisted forever
2. ⚠️ **False Positives**: Low-confidence exclusions might exclude valid URLs
3. ⚠️ **No Validation**: Learned patterns aren't validated over time

### Solution: Re-Check Mechanism ✅ **IMPLEMENTED**

**New System**: `utils-blacklist-recheck.ts`

**Features**:
1. ✅ **Re-Check Low-Confidence Exclusions**:
   - Checks exclusions with confidence < 0.8
   - Fetches page and tries to extract requirements
   - If page has requirements → remove exclusion

2. ✅ **Automatic Removal**:
   - Can automatically remove false positives
   - Updates confidence if re-check confirms exclusion

3. ✅ **Periodic Re-Check**:
   - Can be run manually or scheduled
   - Checks oldest/lowest-confidence exclusions first

**How It Works**:

```typescript
// Re-check a single URL
const result = await recheckExcludedUrl(url);
// Returns: { shouldExclude: boolean, reason: string, confidence: number }

// Re-check low-confidence exclusions
const toRemove = await recheckLowConfidenceExclusions(host, maxRechecks);
// Returns: Array of exclusions that should be removed

// Full cycle with auto-remove
await runRecheckCycle(host, maxRechecks, autoRemove);
```

**Re-Check Criteria**:
- ✅ **Still Exclude If**:
  - HTTP 404
  - Requires login
  - No requirements extracted (< 5 requirements)

- ✅ **Remove Exclusion If**:
  - Page has 5+ requirements (valid program page)
  - Page is overview page (valid for discovery)
  - Page has some requirements (might be valid)

**Usage**:

```bash
# Re-check low-confidence exclusions (dry run)
npm run blacklist:recheck

# Re-check for specific host
npm run blacklist:recheck -- --host="sfg.at"

# Re-check and auto-remove false positives
npm run blacklist:recheck -- --auto-remove

# Re-check more URLs
npm run blacklist:recheck -- --max=20 --auto-remove
```

### Making It More Foolproof

**Additional Improvements**:

1. ✅ **Increased Confidence Threshold**: 0.5 → 0.7
2. ✅ **Anchor Patterns**: Exact matching with `^` and `$`
3. ✅ **Pattern Validation**: Don't learn exclusions for root-level paths
4. ✅ **Re-Check System**: Periodic re-check of low-confidence exclusions

**Remaining Recommendations**:

1. ⚠️ **Scheduled Re-Check**: Run re-check automatically (e.g., weekly)
2. ⚠️ **Whitelist Exceptions**: Allow specific URLs to bypass blacklist
3. ⚠️ **Pattern Conflict Detection**: Check for include vs exclude conflicts
4. ⚠️ **Manual Review Queue**: Flag suspicious exclusions for manual review

---

## 3. Deadline Filtering - Exclude Past Dates

### Current Behavior

**Before**: All dates saved, including past dates
**Problem**: Past deadlines are not useful (programs are closed)

### Solution: Filter Past Dates ✅ **IMPLEMENTED**

**Updated**: `normalizeDate()` function

**New Behavior**:
- ✅ **Filter Past Dates**: If `filterPast = true` (default for deadlines)
- ✅ **Keep Future Dates**: Only dates > today are kept
- ✅ **Keep Empty**: If deadline is empty/null, keep it (might be open deadline)
- ✅ **Keep Today**: Actually, we exclude today too (deadline has passed)

**Logic**:
```typescript
// If deadline is today or in the past, return null (expired)
if (deadlineDate <= today) {
  return null; // Exclude expired deadlines
}
```

**Applied To**:
- ✅ **`deadline` field**: Filtered (past dates excluded)
- ✅ **`fetched_at`**: Not filtered (timestamp, not deadline)
- ✅ **`created_at`**: Not filtered (database default)
- ✅ **`updated_at`**: Not filtered (database default)

**Example**:
```
Input: "18.11.2024" (past date)
Output: null (excluded - deadline has passed)

Input: "18.11.2025" (future date)
Output: "2025-11-18" (kept - deadline in future)

Input: null (no deadline)
Output: null (kept - might be open deadline)
```

**Database Behavior**:
- If `deadline` is `null` → Saved as `null` (open deadline)
- If `deadline` is past → Saved as `null` (expired, excluded)
- If `deadline` is future → Saved as date (valid deadline)

**Benefits**:
1. ✅ **Cleaner Data**: No expired deadlines in database
2. ✅ **Better Queries**: Can filter `WHERE deadline IS NULL OR deadline > NOW()`
3. ✅ **Accurate Results**: Only active programs shown

---

## Summary

### 1. Invalid Funding Types ✅ **HANDLED**

**Why Invalid**: Not funding mechanisms (services, coaching, etc.)
**How We Deal**: Remove, infer correct type, handle non-funding pages
**Status**: ✅ Normalization implemented, migration script ready

### 2. Foolproof Blacklist ✅ **IMPROVED**

**Issues**: No re-check, false positives, no validation
**Solution**: Re-check mechanism for low-confidence exclusions
**Status**: ✅ Re-check system implemented, can be run manually or scheduled

### 3. Deadline Filtering ✅ **IMPLEMENTED**

**Problem**: Past deadlines saved (not useful)
**Solution**: Filter dates <= today
**Status**: ✅ `normalizeDate()` filters past dates, only future deadlines saved

---

## Next Steps

1. ✅ **Run migration**: `npm run normalize:funding-types`
2. ✅ **Test re-check**: `npm run blacklist:recheck -- --max=5`
3. ✅ **Test deadline filtering**: Run scraper and check expired deadlines are excluded
4. ⚠️ **Schedule re-check**: Set up automatic weekly re-check
5. ⚠️ **Review non-funding pages**: Check pages with empty `funding_types`

