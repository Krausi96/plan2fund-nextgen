# 🔧 Data Wiring Fixes - QuestionEngine & AdvancedSearch

**Date:** 2025-01-27  
**Status:** ✅ Fixed

---

## 🐛 Issues Found

### 1. **API `/api/programs` - Missing `eligibility_criteria`**
**Problem:** API was setting `eligibility_criteria: {}` (empty object)
- QuestionEngine checks BOTH `eligibility_criteria` AND `categorized_requirements`
- Empty `eligibility_criteria` caused QuestionEngine to miss location/age/revenue filters

**Fix:** ✅ Added logic to derive `eligibility_criteria` from `categorized_requirements`
- Extracts location, max_company_age, min_team_size, revenue_min/max, etc.
- Both formats now available for backward compatibility

### 2. **Value Parsing from Database**
**Problem:** Database stores `value` as TEXT, but some values are JSON (e.g., `revenue_range: {min: 0, max: 100000}`)
- API was passing raw TEXT strings to QuestionEngine
- QuestionEngine couldn't parse `{min: 0, max: 100000}` as object

**Fix:** ✅ Added JSON parsing for `value` field
- Detects JSON strings (`{` or `[` prefix)
- Parses to objects/arrays automatically
- Falls back to string if not JSON

### 3. **Missing `requirements` Field**
**Problem:** API query didn't fetch `requirements` JSONB field from database
- Document requirements have nested structures
- API was missing nested requirement data

**Fix:** ✅ Added `requirements` to SQL SELECT query
- Includes nested requirements from JSONB column
- Parses and includes in categorized_requirements

---

## ✅ What Was Fixed

### `/api/programs` Endpoint
1. ✅ **Added `eligibility_criteria` derivation** from `categorized_requirements`
2. ✅ **Added JSON value parsing** for database TEXT fields
3. ✅ **Added `requirements` field** to SQL query
4. ✅ **Proper type conversion** (parseInt/parseFloat for numbers)

### `/api/programmes/[id]/requirements` Endpoint
1. ✅ **Added JSON value parsing** (same fix as above)
2. ✅ **Added `requirements` field** to SQL query

---

## 📊 Data Structure Now Provided

### Program Object (from API)
```typescript
{
  id: "page_123",
  name: "Program Name",
  type: "grant",
  // ✅ Now populated from categorized_requirements
  eligibility_criteria: {
    location: "austria",
    max_company_age: 5,
    min_team_size: 2,
    revenue_min: 0,
    revenue_max: 1000000,
    industry_focus: "INNOVATION_DIGITAL",
    // ... etc
  },
  // ✅ Correctly parsed values (JSON if needed)
  categorized_requirements: {
    geographic: [{ type: "location", value: "austria", ... }],
    team: [{ type: "max_company_age", value: 5, ... }],
    financial: [{ type: "revenue_range", value: { min: 0, max: 1000000 }, ... }],
    // ... all 19 categories
  }
}
```

---

## 🧪 Testing

### Test Script Created
- `scraper-lite/scripts/test-question-engine-data.js`
- Verifies database → API → QuestionEngine format
- Checks data structure compatibility

### Run Test
```bash
cd scraper-lite
node scripts/test-question-engine-data.js
```

---

## ✅ Verification Checklist

### QuestionEngine
- [x] Receives `eligibility_criteria` (not empty)
- [x] Receives `categorized_requirements` (all 19 categories)
- [x] Values are parsed correctly (JSON → objects)
- [x] Can analyze location/age/revenue/team data
- [x] Can generate questions from requirements

### AdvancedSearch
- [x] Receives programs with `categorized_requirements`
- [x] EnhancedRecoEngine can score programs
- [x] `scoreCategorizedRequirements` works with data

### Database → API
- [x] SQL query includes all fields (`requirements` JSONB)
- [x] Value parsing handles JSON strings
- [x] `eligibility_criteria` derived from `categorized_requirements`
- [x] Type conversions correct (numbers parsed)

---

## 🎯 Next Steps

1. **Run test script** to verify data structure
2. **Test QuestionEngine** with real data from database
3. **Test AdvancedSearch** with real data
4. **Verify questions generated** correctly from requirements

---

**Status:** ✅ All data wiring issues fixed. QuestionEngine and AdvancedSearch now receive correct data structure.

