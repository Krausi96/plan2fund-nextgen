# Wiring Verification Report

## Current Status

### ✅ SMART WIZARD → RESULTS (WORKS)

**Flow:**
```
1. pages/reco.tsx
   → Renders <SmartWizard /> (no callbacks)
   
2. SmartWizard.tsx (internal ResultsDisplay)
   → Questions → Answers
   → processResults()
   → scoreProgramsEnhanced(answers, "strict", remainingPrograms)
   → Sets state.showResults = true
   → Renders <ResultsDisplay /> component INSIDE SmartWizard
   
3. Results Displayed
   → Inside SmartWizard component itself
   → Line 325: if (state.showResults && state.results.length > 0)
   → Returns <ResultsDisplay /> component
```

**Status:** ✅ Fully wired internally

### ❌ ADVANCED SEARCH → RESULTS (PARTIALLY BROKEN)

**Flow:**
```
1. pages/advanced-search.tsx
   → User types search query
   → handleSearch()
   → Uses RecommendationContext.handleAdvancedSearch()
   
2. RecommendationContext.tsx
   → Calls advancedSearchDoctor.processFreeTextInput()
   → Calls scoreProgramsEnhanced(answers, "explorer")
   → Sets state.recommendations
   → Does NOT route to /results page
   
3. Advanced Search shows preview
   → Shows 3 program preview cards
   → Has "View All Results" button
   → Button stores to localStorage
   → Manually navigates to /results
   
4. pages/results.tsx
   → Reads from RecommendationContext state
   → Tries to get state.recommendations
```

**Problems:**

1. ❌ **Results scored on /reco page** (advanced search is on /advanced-search page)
   - advanced-search uses `handleAdvancedSearch()` from context
   - This scores programs but doesn't show results
   - Results shown are only previews

2. ❌ **No connection to /reco page**
   - advanced-search routes to `/results` manually
   - But `/results` expects data from context that may not exist
   - `/results` page expects state.recommendations but advanced search scores differently

3. ⚠️ **Different scoring modes**
   - Wizard: `scoreProgramsEnhanced(answers, "strict", remainingPrograms)`
   - Advanced: `scoreProgramsEnhanced(answers, "explorer")` - NO pre-filtered programs
   - Results page expects first format

## What's Missing

### 1. SmartWizard → Results Connection

**Current:** Results shown INSIDE SmartWizard component  
**Missing:** No navigation to /results page  
**Issue:** User stays on /reco page after wizard

**Fix Needed:**
```typescript
// In SmartWizard.tsx, when results are ready:
onComplete?.(results);
// Should navigate to /results or trigger RecommendationContext
```

### 2. Advanced Search → Results Connection

**Current:** Shows preview, button navigates to /results  
**Issues:** 
- Results page may not have data in context
- Different scoring modes may cause display issues
- Advanced search scores WITHOUT pre-filtering

**Fix Needed:**
```typescript
// In RecommendationContext.handleAdvancedSearch()
// After scoring:
setState({ recommendations: results, isLoading: false });
router.push('/results'); // Auto-navigate to results
```

### 3. Results Page Compatibility

**Current:** Expects state.recommendations from context  
**Issues:**
- SmartWizard stores results in local state
- Advanced search stores in context
- Results page reads from context
- Wizard results NOT in context = broken

**Fix Needed:** Make both paths use context OR both use local storage

## Recommended Fixes

### Option A: Unify via Context (Recommended)

```typescript
// SmartWizard.tsx
const processResults = async (answers, questionEngine) => {
  const results = await scoreProgramsEnhanced(...);
  
  // Store in context
  const { setRecommendations } = useRecommendation();
  setRecommendations(results);
  
  // Navigate to results
  router.push('/results');
};

// Advanced Search already stores in context ✅
// Results page already reads from context ✅
```

### Option B: Unify via LocalStorage

```typescript
// SmartWizard.tsx
const processResults = async (answers, questionEngine) => {
  const results = await scoreProgramsEnhanced(...);
  
  // Store in localStorage
  localStorage.setItem('recoResults', JSON.stringify(results));
  
  // Navigate to results  
  router.push('/results');
};
```

## Current Wiring Status

```
SMART WIZARD (pages/reco.tsx)
  ↓
SmartWizard component
  ↓
  Answers → QuestionEngine filters → remainingPrograms
  ↓
  scoreProgramsEnhanced(answers, "strict", remainingPrograms) ✅
  ↓
  Results stored in SmartWizard state
  ↓
  Results shown INSIDE SmartWizard ✅ (but no navigation to /results) ❌
  
---
  
ADVANCED SEARCH (pages/advanced-search.tsx)
  ↓
User input → handleAdvancedSearch()
  ↓
  advancedSearchDoctor processes
  ↓
  scoreProgramsEnhanced(answers, "explorer") ❌ (no preFilteredPrograms)
  ↓
  Results stored in RecommendationContext ✅
  ↓
  Preview shown on advanced-search page
  ↓
  User clicks "View All Results"
  ↓
  localStorage.setItem + navigate to /results
  ↓
  Results page reads from context (expects state.recommendations) ⚠️ (may be empty)
```

## Action Items

### High Priority
1. ✅ Verify SmartWizard navigation to results
2. ✅ Fix Advanced Search to show results properly
3. ✅ Ensure Results page can handle both sources

### Medium Priority
4. Unify scoring modes (strict vs explorer)
5. Ensure pre-filtered programs work in Advanced Search

### Low Priority
6. Improve UX flow (make it clear where results came from)

## Testing Checklist

- [ ] Start SmartWizard → Complete quiz → Verify results shown
- [ ] Start Advanced Search → Submit query → Verify preview shown
- [ ] Click "View All Results" → Verify navigation to /results
- [ ] Verify results page displays correctly
- [ ] Check browser console for errors
- [ ] Test with both paths separately

