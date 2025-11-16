# Analysis: Do We Still Need These Files in reco?

## 1. `features/reco/types/reco.ts` ❌ **NOT USED**

**Contains:**
- `ProgramProfile` type definition

**Usage:**
- ❌ Not imported anywhere
- ❌ `ProgramProfile` not used in any code
- ✅ Only exists in the file itself

**Verdict:** **Can be deleted** - Not used anywhere

---

## 2. `features/reco/contexts/RecommendationContext.tsx` ✅ **USED**

**Contains:**
- `RecommendationProvider` - React context provider
- `useRecommendation` hook
- State management for recommendations

**Usage:**
- ✅ `pages/_app.tsx` - Wraps app with `RecommendationProvider`
- ✅ `features/reco/components/ProgramFinder.tsx` - Uses `useRecommendation()` hook
  - Line 14: `import { useRecommendation } from '@/features/reco/contexts/RecommendationContext';`
  - Line 263: `const { setRecommendations } = useRecommendation();`

**Verdict:** **KEEP** - Actively used for state management

---

## 3. `features/reco/engine/normalization.ts` ✅ **USED**

**Contains:**
- Normalization functions for user answers
- Normalization functions for LLM-extracted requirements
- Matching functions (matchLocations, matchCompanyTypes, etc.)

**Usage:**
- ✅ `pages/api/programs/recommend.ts` - Extensively used (34 matches):
  - `normalizeLocationAnswer`, `normalizeCompanyTypeAnswer`, etc.
  - `normalizeLocationExtraction`, `normalizeCompanyTypeExtraction`, etc.
  - `matchLocations`, `matchCompanyTypes`, `matchCompanyStages`, etc.
  - Used in `matchesAnswers()` function (lines 145-307)
  
- ✅ `features/reco/engine/enhancedRecoEngine.ts` - Used (9 matches):
  - Imports all normalization functions (lines 131-148)
  - Used for scoring programs

**Verdict:** **KEEP** - Critical for matching user answers with program requirements

---

## Summary

| File | Status | Action |
|------|--------|--------|
| `reco.ts` | ❌ Not used | **DELETE** |
| `RecommendationContext.tsx` | ✅ Used | **KEEP** |
| `normalization.ts` | ✅ Used | **KEEP** |

## Recommendation

**Delete `reco.ts`** - It's not used anywhere and `ProgramProfile` type is not referenced.

**Keep the other two** - They're actively used:
- `RecommendationContext.tsx` - State management
- `normalization.ts` - Critical for matching logic

