# Critical Wiring Issues Found 🚨

## Problems Discovered

### 1. SmartWizard Results NOT Connected to Context ❌

**Location:** `src/components/wizard/SmartWizard.tsx` line 285

**Issue:**
```typescript
onComplete?.(results); // ← This calls callback but NO ONE is listening!
```

**Problem:**
- `pages/reco.tsx` renders `<SmartWizard />` with NO callbacks
- Results stored in SmartWizard's internal state
- Never stored in RecommendationContext
- Results page reads from context, but won't find SmartWizard results

**Result:** Wizard completes but results page shows empty! ❌

---

### 2. Advanced Search Uses Different Mode ❌

**Location:** `src/contexts/RecommendationContext.tsx` line 282

**Issue:**
```typescript
const recommendations = await scoreProgramsEnhanced(answers, "explorer");
// NO preFilteredPrograms parameter!
```

**Problem:**
- Wizard uses: `scoreProgramsEnhanced(answers, "strict", remainingPrograms)` ✅
- Advanced uses: `scoreProgramsEnhanced(answers, "explorer")` ❌ (no pre-filtering)
- Two different scoring modes
- Results may be inconsistent

**Result:** Advanced search scores ALL programs, not pre-filtered! ❌

---

### 3. Results Page Expects Context Data ⚠️

**Location:** `pages/results.tsx` line 25

**Issue:**
```typescript
const results = state.recommendations; // From context
```

**Problem:**
- SmartWizard results NOT in context
- Advanced search results ARE in context
- Results page will only show advanced search results
- Wizard results never displayed on /results page

**Result:** Results page shows wrong/empty data! ❌

---

## Required Fixes

### Fix 1: Connect SmartWizard to Context

```typescript
// src/components/wizard/SmartWizard.tsx

import { useRecommendation } from '@/contexts/RecommendationContext';
import { useRouter } from 'next/router';

const SmartWizard: React.FC<SmartWizardProps> = ({ onComplete, onProfileGenerated }) => {
  const router = useRouter();
  const { setRecommendations } = useRecommendation();
  
  const processResults = async (answers: Record<string, any>) => {
    if (!questionEngine) return;

    setState(prev => ({ ...prev, isProcessing: true }));

    try {
      const remainingPrograms = questionEngine.getRemainingPrograms();
      const results = await scoreProgramsEnhanced(answers, "strict", remainingPrograms);
      
      // ✅ STORE IN CONTEXT
      setRecommendations(results);
      
      setState(prev => ({
        ...prev,
        profile,
        results,
        showResults: true,
        isProcessing: false,
        progress: 100
      }));

      onProfileGenerated?.(profile);
      onComplete?.(results);
      
      // ✅ NAVIGATE TO RESULTS PAGE
      router.push('/results');
    } catch (error) {
      console.error('Error processing results:', error);
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  };
```

### Fix 2: Make Advanced Search Compatible

```typescript
// src/lib/enhancedRecoEngine.ts

// Already fixed! ✅ Advanced search will now use:
scoreProgramsEnhanced(answers, "explorer") 
// Which works because preFilteredPrograms is optional

// But Advanced Search doesn't have pre-filtered programs...
// Need to fetch and filter BEFORE scoring:

// src/contexts/RecommendationContext.tsx

const handleAdvancedSearch = async (searchInput: string) => {
  try {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    const { advancedSearchDoctor } = await import('@/lib/advancedSearchDoctor');
    const result = await advancedSearchDoctor.processFreeTextInput(searchInput);
    const answers = convertChipsToAnswers(result.chips);
    
    setState(prev => ({ ...prev, answers }));
    
    // ✅ Get programs
    const programs = await dataSource.getGPTEnhancedPrograms();
    
    // ✅ Filter programs (since we don't have QuestionEngine)
    const filteredPrograms = applyMajorFiltersToPrograms(programs, answers);
    
    // ✅ Score pre-filtered programs
    const recommendations = await scoreProgramsEnhanced(answers, "explorer", filteredPrograms);
    
    setState(prev => ({
      ...prev,
      recommendations,
      isLoading: false
    }));
    
    return recommendations;
  } catch (error) {
    console.error('Error in advanced search:', error);
    setState(prev => ({ ...prev, isLoading: false, error: 'Advanced search failed' }));
  }
};
```

### Fix 3: Handle Results Display Properly

```typescript
// pages/results.tsx

export default function ResultsPage() {
  const { state } = useRecommendation();
  const router = useRouter();
  
  // ✅ Check both context AND localStorage for results
  const contextResults = state.recommendations;
  const storageResults = typeof window !== 'undefined' 
    ? JSON.parse(localStorage.getItem('recoResults') || '[]')
    : [];
  
  const results = contextResults.length > 0 ? contextResults : storageResults;
  
  if (!results || results.length === 0) {
    return (
      <div className="p-6 text-center">
        <p>No results found. Please try the wizard or advanced search.</p>
        <Link href="/reco">
          <Button>Start Smart Wizard</Button>
        </Link>
      </div>
    );
  }
  
  // ... rest of results display
}
```

## Summary of Required Changes

### Files to Modify:

1. **src/components/wizard/SmartWizard.tsx**
   - Add `useRecommendation()` hook
   - Add `useRouter()` hook
   - Call `setRecommendations(results)` before `onComplete`
   - Navigate to `/results` after results ready

2. **src/contexts/RecommendationContext.tsx**
   - In `handleAdvancedSearch()`:
   - Fetch programs
   - Filter programs using `applyMajorFiltersToPrograms()`
   - Pass filtered programs to `scoreProgramsEnhanced()`

3. **pages/results.tsx** (optional but recommended)
   - Check both context AND localStorage for results
   - Show fallback if no results found

## Testing Plan

After fixes:

1. ✅ Test SmartWizard:
   - Complete wizard
   - Verify results appear on /results page
   - Check browser console for errors

2. ✅ Test Advanced Search:
   - Enter search query
   - Verify preview shows
   - Click "View All Results"
   - Verify results appear on /results page

3. ✅ Test Results Page:
   - Verify results from both sources display
   - Check no console errors
   - Verify navigation works

## Current Status

- ❌ SmartWizard → Results: NOT wired (results not in context)
- ⚠️ Advanced Search → Results: Partially wired (wrong scoring mode)
- ❌ Results Page: Will show empty for wizard users

**These fixes MUST be applied before deployment!** 🚨

