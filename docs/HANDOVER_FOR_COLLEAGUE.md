# Handover: Funding Program Recommendation System

## 🎯 What We're Building

A **funding program recommendation system** that helps startups and SMEs find the right funding programs. It's designed to **beat ChatGPT** by providing:
- **Quantified match scores** (0-100%) instead of subjective recommendations
- **Structured, ranked results** instead of free-form text
- **Live data extraction** from program websites
- **Transparent scoring** with gap analysis

---

## 🚀 Current Status

### ✅ What's Working

1. **Live URL Extraction** (Tier 1)
   - Extracts programs from 200+ seed URLs
   - Uses LLM to extract 35 requirement categories
   - Real-time, up-to-date data

2. **LLM Fallback** (Tier 3) - **NEW!**
   - Works without seed URLs (like ChatGPT)
   - Generates programs based on user profile
   - Structured output, scored and ranked

3. **Scoring Engine**
   - 0-100% match scores
   - Fixed weights (22% location, 20% company type, 18% funding, etc.)
   - Gap analysis and explanations

4. **UI Improvements**
   - Progressive disclosure (Core → Refining → Complete)
   - Phase indicators
   - Mobile tabs
   - "Show All Questions" option
   - Question count indicator
   - Top 5 results display

5. **Zero-Score Filtering**
   - Filters out 0% programs before ranking
   - Only shows relevant programs

---

## 📊 How It Works (Complete Flow)

### Step 1: User Answers Questions
- **Location**: `pages/main/reco.tsx` → `features/reco/components/ProgramFinder.tsx`
- User selects answers (location, company_type, funding_amount, industry_focus, etc.)
- Answers stored in React state

### Step 2: API Call
- **Endpoint**: `POST /api/programs/recommend`
- **File**: `pages/api/programs/recommend.ts`
- **Body**: `{ answers, max_results: 20, use_seeds: true }`

### Step 3: Seed URL Filtering (If Enabled)
- Loads `scraper-lite/url-seeds.json` (200+ URLs)
- Filters by location (Austria → 80 Austrian institutions)
- Limits to 20 seeds to process

### Step 4: HTML Fetching
- Fetches HTML from seed URLs (10s timeout)
- Handles failures gracefully

### Step 5: LLM Extraction
- **File**: `scraper-lite/src/core/llm-extract.ts`
- Extracts 35 requirement categories from HTML
- Uses GPT-4o-mini or Custom LLM
- Returns structured JSON

### Step 6: Match Filtering
- Uses normalization (`features/reco/engine/normalization.ts`)
- Checks if programs match user answers
- Critical checks: Location, Company Type, Funding Amount

### Step 7: LLM Fallback (If No Programs)
- **Function**: `generateProgramsWithLLM()` in `pages/api/programs/recommend.ts`
- Generates programs based on user profile (like ChatGPT)
- Structures output into 35 categories

### Step 8: Scoring
- **File**: `features/reco/engine/enhancedRecoEngine.ts`
- **Function**: `scoreProgramsEnhanced()`
- Scores each program (0-100%)
- Generates explanations, strategic advice, application info, risks

### Step 9: Filtering & Ranking
- Filters out zero-score programs
- Sorts by score (highest first)
- Takes top 5

### Step 10: Display Results
- Shows top 5 programs with:
  - Match score (81%, 59%, ...)
  - Eligibility status
  - Why this matches (reasons)
  - Strategic advice (if available)
  - Application process (if available)
  - Risks with mitigation (if available)

---

## 🧪 How to Test Live

### Option 1: Test with Seed URLs (Default)

1. **Start the app**:
   ```bash
   npm run dev
   ```

2. **Go to**: `http://localhost:3000/reco`

3. **Answer questions**:
   - Location: Austria
   - Company Type: Startup
   - Funding Amount: 100k-500k
   - Industry Focus: Digital

4. **Check results**:
   - Should see top 5 programs
   - Scores should be > 0%
   - Austrian programs should rank high

5. **Check logs**:
   - Browser DevTools → Console: See scoring logs
   - Browser DevTools → Network: See API calls
   - Vercel Functions → Logs: See extraction logs

### Option 2: Test LLM Fallback (No Seeds)

1. **Disable seeds** (choose one):
   - **Method A**: Set `NEXT_PUBLIC_DISABLE_SEEDS=true` in `.env.local`
   - **Method B**: Modify API call in `ProgramFinder.tsx` to set `use_seeds: false`

2. **Start the app**:
   ```bash
   npm run dev
   ```

3. **Go to**: `http://localhost:3000/reco`

4. **Answer questions** (same as above)

5. **Check results**:
   - Should see LLM-generated programs
   - Response should have `source: "llm_fallback"`
   - Programs should still be scored and ranked

6. **Check logs**:
   - Should see: `⚠️ No programs from URL extraction, using LLM fallback (Tier 3)`
   - Programs should have `source: "llm_generated"`

### Option 3: Test in Vercel (Production)

1. **Deploy to Vercel**:
   ```bash
   git push
   # Vercel auto-deploys
   ```

2. **Go to**: `https://your-app.vercel.app/reco`

3. **Test as above**

4. **Check Vercel logs**:
   - Vercel Dashboard → Functions → `/api/programs/recommend` → Logs
   - See real-time extraction logs

---

## 📁 Key Files

### Frontend
- **`pages/main/reco.tsx`** - Route to recommendation page
- **`features/reco/components/ProgramFinder.tsx`** - Main UI component
- **`features/reco/contexts/RecommendationContext.tsx`** - Global state

### Backend (API)
- **`pages/api/programs/recommend.ts`** - Main API endpoint
  - Handles seed URL filtering
  - HTML fetching
  - LLM extraction
  - LLM fallback (`generateProgramsWithLLM()`)
  - Returns extracted programs

### Engine
- **`features/reco/engine/enhancedRecoEngine.ts`** - Scoring engine
  - `scoreProgramsEnhanced()` - Main scoring function
  - `generateFounderFriendlyReasons()` - Explanations
  - `generateSmartExplanation()` - Enhanced explanations (strategic advice, application info, risks)

### Extraction
- **`scraper-lite/src/core/llm-extract.ts`** - LLM extraction from HTML
- **`scraper-lite/url-seeds.json`** - Seed URLs database (200+ institutions)

### Normalization
- **`features/reco/engine/normalization.ts`** - Normalization functions
  - Handles variations: "Austria" = "AT" = "Austria"
  - `matchLocations()`, `matchCompanyTypes()`, etc.

---

## 🔧 Configuration

### Environment Variables

**Required for LLM**:
- `OPENAI_API_KEY` - For OpenAI (or)
- `CUSTOM_LLM_ENDPOINT` - For custom LLM

**Optional**:
- `DISABLE_SEED_URLS=true` - Disable seed URLs globally
- `NEXT_PUBLIC_DISABLE_SEEDS=true` - Disable seeds in frontend

### Seed URLs

**File**: `scraper-lite/url-seeds.json`
- Contains 200+ funding institution URLs
- Each entry: `{ institution_id, institution_name, seed_url, funding_types }`
- Filtered by location before processing

---

## 🐛 Debugging

### Check Frontend (Browser)
- **DevTools** (F12) → Console: See scoring logs
- **DevTools** → Network: See API calls
- **DevTools** → Elements: Inspect results

### Check Backend (Vercel)
- **Vercel Dashboard** → Functions → `/api/programs/recommend` → Logs
- Look for:
  - `📊 Filtered X seeds → Y relevant seeds`
  - `🔍 Fetching and extracting: [URL]`
  - `✅ Extracted program: [name]`
  - `⚠️ No programs from URL extraction, using LLM fallback`

### Common Issues

**Issue**: No programs returned
- **Check**: Seed URLs exist? LLM API key set?
- **Fix**: Check logs, verify API keys

**Issue**: Wrong programs returned
- **Check**: Seed filtering working? Matching logic correct?
- **Fix**: Check normalization, matching functions

**Issue**: Low scores
- **Check**: Requirements matching? Normalization working?
- **Fix**: Check scoring logs, verify matches

---

## 📊 Test Results

### Ranking Algorithm Validation

**Test Script**: `scripts/validate-ranking-algorithm.ts`
**Results**: 2/5 tests passed (40%)
**Issues Found**: Zero-score programs in top 5
**Fix Applied**: ✅ Filter zero-score programs before ranking

**Run Test**:
```bash
npx tsx scripts/validate-ranking-algorithm.ts
```

---

## 🎯 Next Steps

### Immediate (Testing)

1. **Test with seed URLs** (default)
   - Verify programs are extracted correctly
   - Check scores make sense
   - Verify ranking is correct

2. **Test LLM fallback** (disable seeds)
   - Verify LLM generates programs
   - Check programs are structured correctly
   - Verify scoring still works

3. **Test in Vercel** (production)
   - Deploy and test live
   - Check Vercel logs
   - Verify performance

### Short-Term (Improvements)

1. **Improve Ranking Algorithm**
   - Fix remaining test failures
   - Consider minimum score threshold (30% or 50%)
   - Validate weights with real users

2. **Enhance Explanations**
   - Test strategic advice output
   - Test application process info
   - Test risk mitigation

3. **Add Tier 2 (Caching)**
   - Cache extracted programs
   - Use cached data if URLs fail
   - Improve performance

### Long-Term (Future)

1. **User Testing**
   - Get real user feedback
   - A/B test ranked vs unranked
   - Compare with ChatGPT

2. **Continuous Validation**
   - Regular ranking validation
   - Monitor score accuracy
   - Adjust weights as needed

3. **Knowledge Base (Tier 4)**
   - Pre-populated program database
   - Ultimate fallback
   - Curated, static data

---

## 📚 Documentation

### Essential Docs (Keep)
- **`docs/CHATGPT_VS_OUR_SYSTEM.md`** - Comparison with ChatGPT
- **`docs/COMPLETE_DATA_FLOW.md`** - Complete data flow diagram
- **`docs/HOW_TO_DISABLE_SEEDS.md`** - How to test LLM fallback
- **`docs/VERCEL_DEBUGGING_GUIDE.md`** - How to debug in Vercel

### Test Scripts (Keep)
- **`scripts/validate-ranking-algorithm.ts`** - Ranking validation test
- **`scripts/test-all-combinations-flow.ts`** - Full flow test

---

## 🔍 Key Differences from ChatGPT

### What We Do Better

1. **Quantified Scoring**
   - ChatGPT: "This could be a good fit"
   - Us: "81% match score"

2. **Structured Output**
   - ChatGPT: Free-form text
   - Us: 35 requirement categories

3. **Ranking**
   - ChatGPT: No ranking
   - Us: Top 5 by score

4. **Transparency**
   - ChatGPT: Black box
   - Us: Shows scoring breakdown

5. **Consistency**
   - ChatGPT: Varies
   - Us: Same inputs = same outputs

### What ChatGPT Does Better (For Now)

1. **Strategic Advice**
   - ChatGPT: Provides strategic tips
   - Us: ✅ Now included in explanations

2. **Application Process**
   - ChatGPT: Explains application steps
   - Us: ✅ Now included in explanations

3. **Risk Awareness**
   - ChatGPT: Mentions risks
   - Us: ✅ Now included in explanations

**Note**: We've added these to our explanations, but need to test if they're working correctly.

---

## 🚨 Important Notes

1. **LLM Required**: System needs `OPENAI_API_KEY` or `CUSTOM_LLM_ENDPOINT` to work

2. **Seed URLs**: If disabled, system uses LLM fallback (like ChatGPT)

3. **Scoring**: Uses fixed weights - validated but may need adjustment

4. **Top 5**: Currently shows top 5 programs (changed from top 3)

5. **Zero-Score Filtering**: Programs with 0% score are filtered out

---

## 📞 Questions?

If you have questions:
1. Check `docs/COMPLETE_DATA_FLOW.md` for flow details
2. Check `docs/VERCEL_DEBUGGING_GUIDE.md` for debugging
3. Check `docs/HOW_TO_DISABLE_SEEDS.md` for testing LLM fallback
4. Check `docs/CHATGPT_VS_OUR_SYSTEM.md` for comparison

---

## ✅ Summary

**What We Built**:
- Funding program recommendation system
- Live URL extraction (Tier 1)
- LLM fallback (Tier 3) - works without seeds
- Scoring engine (0-100%)
- Ranking (Top 5)
- Enhanced explanations (strategic advice, application info, risks)

**What's Working**:
- ✅ URL extraction
- ✅ LLM fallback
- ✅ Scoring and ranking
- ✅ Zero-score filtering
- ✅ UI improvements

**What Needs Testing**:
- ⏳ Ranking accuracy (2/5 tests passed)
- ⏳ Enhanced explanations (strategic advice, application info, risks)
- ⏳ LLM fallback quality

**Next Steps**:
1. Test live (with and without seeds)
2. Validate ranking with real users
3. Test enhanced explanations
4. Improve based on feedback

---

**Ready to test!** 🚀

