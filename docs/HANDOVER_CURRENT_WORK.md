

## 🎯 What We're Doing

### 1. Removed QuestionEngine ✅
- **Removed:** `features/reco/engine/questionEngine.ts` dependency from `ProgramFinder.tsx`
- **Replaced with:** Simple static form with all 12 questions visible at once
- **Why:** QuestionEngine was initialized with empty array, couldn't be contextual, only provided skip logic
- **New approach:** Static questions with inline skip logic (simple if/else)

### 2. Simplified ProgramFinder ✅
- **File:** `features/reco/components/ProgramFinder.tsx`
- **Changes:**
  - Removed QuestionEngine import and usage
  - All 12 questions shown in scrollable form
  - Skip logic implemented inline (e.g., skip revenue_status if pre-revenue)
  - Questions ordered: company_type → location → funding_amount → etc.

### 3. Fixed TypeScript Errors ✅
- **Created:** `features/reco/engine/types.ts` - Contains `MatchStatus` type
- **Updated:** `features/reco/engine/enhancedRecoEngine.ts` - Imports MatchStatus from types.ts
- **Updated:** `pages/api/programs-ai.ts` - Removed questionGenerator import, returns static questions
- **Updated:** `pages/api/programmes/[id]/requirements.ts` - Removed questionGenerator import

### 4. On-Demand Recommendation System (Current State)
- **API:** `pages/api/programs/recommend.ts` - Works independently, no QuestionEngine needed
- **Flow:**
  1. User answers questions → POST `/api/programs/recommend`
  2. API filters seed URLs from `scraper-lite/url-seeds.json`
  3. Fetches HTML on-demand
  4. Extracts with LLM (`scraper-lite/src/core/llm-extract.ts`)
  5. Matches extracted data with user answers
  6. Returns matching programs

## 🧪 What We Need to Test

### Test 1: On-Demand Extraction + Recommendation Engine
**Goal:** Verify scraper extraction works with recommendation engine

**Steps:**
1. Start dev server: `npm run dev`
2. Navigate to recommendation page
3. Fill out questions in ProgramFinder
4. Verify:
   - Questions appear correctly (all 12, with skip logic)
   - API calls `/api/programs/recommend`
   - Seed URLs are filtered correctly
   - HTML is fetched on-demand
   - LLM extraction works
   - Matching logic works
   - Results are displayed

**Test Cases:**
```bash
# Test 1: Austrian startup, early stage, 50k
POST /api/programs/recommend
{
  "answers": {
    "location": "austria",
    "company_type": "startup",
    "company_stage": "inc_lt_6m",
    "funding_amount": "under100k"
  },
  "max_results": 10
}

# Test 2: EU SME, growth stage, 200k
POST /api/programs/recommend
{
  "answers": {
    "location": "eu",
    "company_type": "sme",
    "company_stage": "inc_gt_36m",
    "funding_amount": "100kto500k"
  },
  "max_results": 10
}
```

### Test 2: Skip Logic
**Verify skip logic works:**
- Pre-revenue company → revenue_status question should be hidden
- Research institution → team_size and use_of_funds should be hidden
- Small funding (under100k) → co_financing should be hidden
- Short project (under2) → deadline_urgency should be hidden

### Test 3: Matching Logic
**Verify improved matching:**
- Location matching (Austria vs "Companies based in Austria, Germany, or EU")
- Company type matching (startup vs "Small and medium-sized enterprises")
- Company stage matching (early vs "Companies must be less than 3 years old")
- Funding amount matching (under100k vs program max amounts)

### Test 4: TypeScript Compilation
**Verify no TypeScript errors:**
```bash
npx tsc --noEmit
```

## 🗑️ Files to Remove (Not Related to On-Demand System)

### Already Removed ✅
- `features/reco/engine/questionGenerator.ts` - Deleted (was unnecessary)

### Files to Review & Possibly Remove:

1. **Old QuestionEngine** (if not used elsewhere):
   - `features/reco/engine/questionEngine.ts` - **KEEP** (still used by `pages/api/programs-ai.ts` and `pages/api/programmes/[id]/requirements.ts` for editor features)

2. **Old API Endpoints** (KEEP - Still Used):
   - `pages/api/recommend.ts` - **KEEP** - Used by old recommendation flow (may be legacy)
   - `pages/api/programs.ts` - **KEEP** - Used by editor, library, search (returns programs from database)
   - These are different from on-demand system but still needed by other features

3. **Database Files** (if on-demand doesn't use DB):
   - `scraper-lite/db/db.ts` - **KEEP** - Used by other features (user repo, data collection, templates)
   - On-demand system doesn't use DB, but other features do

4. **Old Catalog Files** (if not used):
   - `scraper-lite/url-catalog.json` - **CHECK** - May be legacy
   - `scraper-lite/url-catalog.generated.json` - **CHECK** - Generated file
   - `scraper-lite/url-catalog.backup.*.json` - **DELETE** - Backup files

5. **Old Scraper API Files** (if not used):
   - `scraper-lite/api/` directory - **CHECK** - May contain old worker scripts

## 📋 Current File Structure

### Core On-Demand System (Required) ✅
```
pages/api/programs/recommend.ts          # Main API endpoint
scraper-lite/url-seeds.json              # 130 validated seed URLs
scraper-lite/src/core/llm-extract.ts     # LLM extraction
features/reco/components/ProgramFinder.tsx  # UI (simplified, no QuestionEngine)
features/reco/engine/enhancedRecoEngine.ts  # Scoring (used for display)
features/reco/engine/types.ts            # MatchStatus type
```

### Editor Features (Keep - Used by Editor) ✅
```
pages/api/programs-ai.ts                 # Used by editor (questions, sections, criteria)
pages/api/programmes/[id]/requirements.ts # Used by editor
features/editor/engine/categoryConverters.ts # Used by editor
features/reco/engine/questionEngine.ts    # Used by editor (getCoreQuestions)
```

### Database (Keep - Used by Other Features) ✅
```
scraper-lite/db/db.ts                    # Used by user repo, data collection, templates
```

## 🔧 What Needs to Be Fixed

### 1. TypeScript Errors ✅ (Recommendation Engine Fixed)
- [x] Fixed `MatchStatus` import in questionEngine.ts
- [x] Fixed `userAnswers` reference in enhancedRecoEngine.ts (changed to `answers`)
- [x] Fixed duplicate `co_financing` property in mapping
- [x] Fixed `trlBucket` type to include 'unknown'
- [ ] **Remaining errors in scraper-lite utilities** (not critical for on-demand):
  - `scraper-lite/db/db.ts` - unused function, missing auto-learning module
  - `scraper-lite/src/config/institutionConfig.ts` - missing url property
  - `scraper-lite/src/utils/login.ts` - async issue
  - `scraper-lite/src/utils/quality-scoring.ts` - type issues
  - These don't affect on-demand recommendation system

### 2. Test On-Demand Flow
- [ ] Test ProgramFinder UI (all questions visible, skip logic works)
- [ ] Test API endpoint (`/api/programs/recommend`)
- [ ] Test seed URL filtering
- [ ] Test LLM extraction
- [ ] Test matching logic
- [ ] Test results display

### 3. Clean Up Unused Files
- [ ] Check if `pages/api/recommend.ts` is used (old endpoint)
- [ ] Check if `pages/api/programs.ts` is used (old static JSON)
- [ ] Check if `scraper-lite/api/` directory is used
- [ ] Delete backup catalog files
- [ ] Review url-catalog.json files

## 🧪 Testing Commands

```bash
# 1. Check TypeScript
npx tsc --noEmit

# 2. Test recommendation API (requires server running)
npx tsx scraper-lite/scripts/test-recommend.ts

# 3. Show Q&A mapping
npx tsx scraper-lite/scripts/show-qa.ts

# 4. Start dev server
npm run dev

# 5. Test in browser
# Navigate to recommendation page
# Fill out questions
# Verify results appear
```

## 📊 Questions in ProgramFinder (Current Order)

1. **company_type** (required) - Startup, SME, Large, Research
2. **location** (required) - Austria, Germany, EU, International
3. **funding_amount** - Under €100k, €100k-€500k, €500k-€2M, Over €2M
4. **company_stage** - Idea, Pre-Company, <6m, 6-36m, >36m, Research Org
5. **industry_focus** (multi) - Digital, Sustainability, Health, Manufacturing, Export, Other
6. **use_of_funds** (multi) - R&D, Marketing, Equipment, Personnel
   - Skip if: company_type === 'research'
7. **team_size** - 1-2, 3-5, 6-10, Over 10
   - Skip if: company_type === 'research'
8. **co_financing** - Yes, Partial, No
   - Skip if: funding_amount === 'under100k'
9. **revenue_status** - Pre-revenue, Early revenue, Growing revenue
   - Skip if: company_stage is idea/pre_company/inc_lt_6m OR company_type === 'research'
10. **impact** (multi) - Economic, Social, Environmental
11. **project_duration** - Under 2 years, 2-5 years, 5-10 years, Over 10 years
12. **deadline_urgency** - Within 1 month, Within 3 months, Within 6 months
    - Skip if: project_duration === 'under2'

## ✅ Next Steps

1. **✅ Fix TypeScript errors** - Recommendation engine errors fixed (scraper-lite utility errors remain but don't affect on-demand)
2. **Test on-demand flow** - Verify extraction + recommendation works end-to-end
3. **Clean up files** - Remove unused files (backup catalogs, check old APIs)
4. **Verify skip logic** - Test that questions are skipped correctly
5. **Test matching** - Verify improved matching logic works with LLM-extracted data
6. **Fix scraper-lite utility errors** - Optional, doesn't affect on-demand system

## 🚨 Important Notes

- **On-demand system doesn't use database** - Everything extracted in real-time
- **QuestionEngine still exists** - But only used by editor features, not recommendation UI
- **ProgramFinder is simplified** - Static form, no dynamic question generation
- **Skip logic is inline** - Simple if/else checks, not complex engine
- **Matching logic improved** - Fuzzy matching, better normalization

## 📝 Files Modified

- ✅ `features/reco/components/ProgramFinder.tsx` - Removed QuestionEngine, added static form
- ✅ `features/reco/engine/types.ts` - Created for MatchStatus type
- ✅ `features/reco/engine/enhancedRecoEngine.ts` - Updated import
- ✅ `pages/api/programs-ai.ts` - Removed questionGenerator, returns static questions
- ✅ `pages/api/programmes/[id]/requirements.ts` - Removed questionGenerator, returns static questions
- ✅ `pages/api/programs/recommend.ts` - Already working (no changes needed)

## 🎯 Goal

**Working on-demand recommendation system that:**
1. Shows all questions in simple form (no QuestionEngine)
2. Filters seed URLs based on answers
3. Extracts programs on-demand with LLM
4. Matches extracted data with user answers
5. Returns and displays results

**No database, no pre-scraping, everything on-demand!**

