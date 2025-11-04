# 🧪 Component Testing Proposal - Database Integration

**Date:** 2025-11-02  
**Status:** Ready for Implementation

---

## 📊 Component Analysis

### 1. SmartWizard & QuestionEngine

**Goal:** Generate intelligent questions based on program requirements to filter matching programs.

**Data Flow:**
```
SmartWizard.tsx
  ↓ fetch('/api/programs?enhanced=true')
  ↓
pages/api/programs.ts
  ↓ Query database: pages + requirements tables
  ↓ Transform to: { programs: [...], categorized_requirements: {...} }
  ↓
QuestionEngine constructor(programs)
  ↓ Analyze categorized_requirements (18 categories)
  ↓ Generate questions dynamically
```

**Data Requirements:**
- ✅ Needs: `categorized_requirements` (18 categories)
- ✅ Format: `{ category: [{ type, value, required, source, ... }] }`
- ✅ Current: API provides this from database

**Test Cases:**
1. ✅ Verify API returns programs with `categorized_requirements`
2. ✅ Verify QuestionEngine receives programs with requirements
3. ✅ Verify questions are generated from categorized data
4. ✅ Verify filtering works (answers filter programs correctly)

**Test Script:** `tests/components/test-smartwizard-db.js`

---

### 2. RequirementsChecker (Editor)

**Goal:** Check business plan compliance against program requirements.

**Data Flow:**
```
RequirementsChecker.tsx
  ↓ createReadinessValidator(programType, planContent)
  ↓
shared/lib/readiness.ts
  ↓ Need to load program requirements
  ↓ (Currently unclear - may need programId)
  ↓
  ↓ Perform readiness check
```

**Data Requirements:**
- ⚠️ Needs: Program requirements (structure unclear)
- ⚠️ Format: Depends on readiness validator
- ⚠️ Current: Needs investigation

**Test Cases:**
1. ⚠️ Verify how RequirementsChecker loads program data
2. ⚠️ Verify readiness validator receives correct requirements
3. ✅ Verify compliance checks work correctly

**Test Script:** `tests/components/test-requirements-checker-db.js`

---

### 3. AdvancedSearch

**Goal:** Doctor-like diagnostic search to find matching programs.

**Data Flow:**
```
AdvancedSearchDoctor.processFreeTextInput()
  ↓ scoreProgramsEnhanced(answers)
  ↓
enhancedRecoEngine.ts
  ↓ fetch('/api/programs?enhanced=true')
  ↓
pages/api/programs.ts
  ↓ Query database
  ↓
  ↓ Score programs using categorized_requirements
```

**Data Requirements:**
- ✅ Needs: `categorized_requirements` for scoring
- ✅ Format: Same as SmartWizard
- ✅ Current: API provides this

**Test Cases:**
1. ✅ Verify API returns programs
2. ✅ Verify scoring uses categorized_requirements
3. ✅ Verify search results match input criteria

**Test Script:** `tests/components/test-advanced-search-db.js`

---

### 4. Library Component

**Goal:** Display program details and requirements in library format.

**Data Flow:**
```
ProgramDetails.tsx
  ↓ fetch(`/api/programmes/${programId}/requirements`)
  ↓
pages/api/programmes/[id]/requirements.ts
  ↓ Query database
  ⚠️ PROBLEM: Queries `programs` table (doesn't exist!)
  ↓ Should query: `pages` + `requirements` tables
  ↓ Transform using categoryConverters
  ↓
  ↓ Return library format
```

**Data Requirements:**
- ✅ Needs: Program data + requirements
- ✅ Format: Library-specific structure
- ⚠️ **ISSUE:** API queries wrong table

**Test Cases:**
1. ⚠️ **CRITICAL:** Fix API to query `pages` table instead of `programs`
2. ✅ Verify library format transformation
3. ✅ Verify requirements display correctly

**Test Script:** `tests/components/test-library-db.js`

---

### 5. EnhancedAIChat (Editor)

**Goal:** AI assistant that uses program requirements for guidance.

**Data Flow:**
```
EnhancedAIChat
  ↓ EditorDataProvider.loadRequirements(productId)
  ↓
pages/api/programmes/[id]/requirements.ts
  ↓ (Same issue as Library - wrong table)
```

**Data Requirements:**
- ✅ Needs: Program requirements
- ⚠️ **ISSUE:** Same as Library

**Test Cases:**
1. ⚠️ **CRITICAL:** Fix API (same as Library)
2. ✅ Verify AI chat receives requirements
3. ✅ Verify guidance is program-specific

**Test Script:** `tests/components/test-enhanced-ai-chat-db.js`

---

### 6. Pricing Component

**Goal:** Display pricing and requirements for funding packs.

**Data Flow:**
```
RequirementsDisplay.tsx
  ↓ Uses static data: getFundingPack(targetGroup, fundingType, product)
  ↓
shared/data/basisPack.ts
  ↓ Static configuration (not database)
```

**Data Requirements:**
- ✅ Uses static data (not database-dependent)
- ✅ No testing needed for database integration

---

## 🐛 Issues Found

### Critical Issues

1. **`/api/programmes/[id]/requirements.ts` queries wrong table**
   - **Current:** Queries `programs` table (doesn't exist in database)
   - **Should:** Query `pages` + `requirements` tables
   - **Impact:** Library and EnhancedAIChat will fail
   - **Fix:** Update API to use scraper-lite database schema

2. **RequirementsChecker data source unclear**
   - **Current:** Uses `createReadinessValidator` but source unclear
   - **Needs:** Investigation to determine how it loads program data
   - **Fix:** Trace through readiness.ts to find data source

---

## ✅ Testing Strategy

### Phase 1: API Layer Testing

**Goal:** Verify APIs correctly query database and transform data.

**Tests:**
1. Test `/api/programs?enhanced=true`
   - ✅ Query database (pages + requirements)
   - ✅ Transform to program format
   - ✅ Include categorized_requirements
   - ✅ Test with empty database (fallback)

2. Test `/api/programmes/[id]/requirements`
   - ⚠️ **FIX FIRST:** Update to query pages table
   - ✅ Query database for specific program
   - ✅ Transform to editor/library format
   - ✅ Test with non-existent program (error handling)

**Script:** `tests/api/test-database-apis.js`

---

### Phase 2: Component Integration Testing

**Goal:** Verify components work with database data.

**Tests:**
1. **SmartWizard/QuestionEngine**
   - Mock API response with database data
   - Verify question generation
   - Verify filtering works

2. **RequirementsChecker**
   - ⚠️ First: Determine data source
   - Mock or fix data loading
   - Verify compliance checks

3. **AdvancedSearch**
   - Mock API response
   - Verify search functionality
   - Verify scoring uses categorized_requirements

4. **Library**
   - ⚠️ First: Fix API
   - Verify program details display
   - Verify requirements shown correctly

5. **EnhancedAIChat**
   - ⚠️ First: Fix API
   - Verify AI receives requirements
   - Verify guidance is contextual

**Script:** `tests/components/test-all-components-db.js`

---

### Phase 3: End-to-End Testing

**Goal:** Verify complete flow from database to UI.

**Flow:**
```
Database (pages + requirements)
  ↓
API (/api/programs or /api/programmes/[id]/requirements)
  ↓
Component (SmartWizard, Library, etc.)
  ↓
UI Rendering
```

**Tests:**
1. Run scraper → save to database
2. Access component → fetch from API
3. Verify UI shows correct data
4. Verify user interactions work

**Script:** `tests/e2e/test-full-flow-db.js`

---

## 📝 Test Scripts to Create

1. `tests/api/test-database-apis.js` - API layer tests
2. `tests/components/test-smartwizard-db.js` - SmartWizard tests
3. `tests/components/test-requirements-checker-db.js` - RequirementsChecker tests
4. `tests/components/test-advanced-search-db.js` - AdvancedSearch tests
5. `tests/components/test-library-db.js` - Library tests
6. `tests/components/test-enhanced-ai-chat-db.js` - EnhancedAIChat tests
7. `tests/e2e/test-full-flow-db.js` - End-to-end tests

---

## 🎯 Execution Order

1. **Fix Critical Issues First** (Priority 1)
   - Fix `/api/programmes/[id]/requirements.ts` to query pages table
   - Investigate RequirementsChecker data source

2. **Test API Layer** (Priority 2)
   - Verify database queries work
   - Verify data transformation is correct

3. **Test Components** (Priority 3)
   - Test each component individually
   - Verify data flows correctly

4. **End-to-End Testing** (Priority 4)
   - Test complete user flows
   - Verify UI works correctly

---

## ✅ Success Criteria

- [ ] All APIs query database correctly
- [ ] All components receive data in expected format
- [ ] No errors in console
- [ ] Components render correctly
- [ ] User interactions work as expected
- [ ] Data is fresh (from database, not stale JSON)

---

**Status:** Ready to implement - Start with fixing critical issues first!

