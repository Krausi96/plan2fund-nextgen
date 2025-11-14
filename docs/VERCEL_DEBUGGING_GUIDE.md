# Vercel Debugging Guide - Complete Data Flow

## 🎯 Quick Reference: Where to Check What in Vercel

### Frontend (Browser)
- **Page**: `https://your-app.vercel.app/reco`
- **DevTools**: F12 → Console, Network, Elements tabs
- **What to Check**: User interactions, API calls, results display

### Backend (Vercel Serverless Functions)
- **Dashboard**: Vercel → Your Project → Functions → `/api/programs/recommend`
- **Logs**: Vercel → Functions → Logs tab
- **What to Check**: API requests, seed filtering, HTML fetching, LLM extraction

---

## 📊 Complete Data Flow (Step-by-Step)

### Step 1: User Answers Questions
**Location**: Browser (Frontend)
**File**: `features/reco/components/ProgramFinder.tsx`
**Page**: `/reco`

**What Happens**:
1. User selects answers (location, company_type, funding_amount, ...)
2. Answers stored in React state: `answers = { location: "austria", ... }`
3. `useEffect` hook triggers when answers change (line 451)

**Check in Vercel**: 
- Browser DevTools → Console → See state updates
- Browser DevTools → React DevTools → See `answers` state

---

### Step 2: API Call Triggered
**Location**: Browser → Vercel Serverless Function
**File**: `features/reco/components/ProgramFinder.tsx` (line 331)

**What Happens**:
```typescript
POST /api/programs/recommend
Body: {
  answers: { location: "austria", company_type: "startup", ... },
  max_results: 20,
  extract_all: false
}
```

**Check in Vercel**: 
- Browser DevTools → Network tab → See `POST /api/programs/recommend`
- Request payload: See `answers` object
- Response: See `programs[]` array

---

### Step 3: API Endpoint Receives Request
**Location**: Vercel Serverless Function
**File**: `pages/api/programs/recommend.ts` (line 317)
**Function**: `handler()`

**Check in Vercel**: 
- Vercel Dashboard → Functions → `/api/programs/recommend` → Logs
- Look for: `📊 Filtered X seeds → Y relevant seeds`

---

### Step 4: Load & Filter Seed URLs
**Location**: Vercel Serverless Function
**File**: `pages/api/programs/recommend.ts` (line 327-338)

**What Happens**:
1. Load `scraper-lite/url-seeds.json` (200+ URLs)
2. Filter by location: `filterSeedsByAnswers()` (line 338)
   - User in Austria → Filter to ~80 Austrian institutions
3. Limit to 20 seeds: `seedsToProcess.slice(0, 20)`

**Check in Vercel**: 
- Vercel Functions → Logs → See: `📊 Filtered 200 seeds → 80 relevant seeds`
- Check if filtering works correctly

---

### Step 5: Fetch HTML from Seed URLs
**Location**: Vercel Serverless Function → External HTTP
**File**: `pages/api/programs/recommend.ts` (line 353)

**What Happens**:
- For each seed URL: `fetchHtml(seed_url)`
- Timeout: 10 seconds
- User-Agent: Mozilla/5.0...

**Check in Vercel**: 
- Vercel Functions → Logs → See: `🔍 Fetching and extracting: [URL]`
- Or: `⚠️ Failed to fetch [URL]` (if fetch fails)

**Common Issues**:
- ❌ Timeout (10s too short)
- ❌ Blocked by website (User-Agent not accepted)
- ❌ Network error

---

### Step 6: LLM Extraction
**Location**: Vercel Serverless Function → External LLM API
**File**: `scraper-lite/src/core/llm-extract.ts`
**Function**: `extractWithLLM()`

**What Happens**:
1. Clean HTML (remove scripts, styles)
2. Extract text content (max 50k chars)
3. Call LLM (OpenAI GPT-4o-mini or Custom LLM)
4. Parse JSON response (35 categories)

**Check in Vercel**: 
- Vercel Functions → Logs → See extraction results
- External API dashboard (OpenAI/OpenRouter) → Usage logs
- Check if extraction succeeds or fails

**Common Issues**:
- ❌ LLM API key missing (OPENAI_API_KEY or CUSTOM_LLM_ENDPOINT)
- ❌ LLM timeout
- ❌ Invalid JSON response

---

### Step 7: Match Filtering
**Location**: Vercel Serverless Function
**File**: `pages/api/programs/recommend.ts` (line 367)
**Function**: `matchesAnswers()`

**What Happens**:
- Check if extracted program matches user answers
- Uses normalization: `matchLocations()`, `matchCompanyTypes()`, etc.
- Critical checks: Location, Company Type, Funding Amount (must match)
- Only matching programs added to results

**Check in Vercel**: 
- Vercel Functions → Logs → See: `✅ Extracted program: [name]`
- Response: `programs[]` array (only matching programs)

---

### Step 8: Return Programs to Frontend
**Location**: Vercel Serverless Function → Browser
**File**: `pages/api/programs/recommend.ts` (line 402)

**Response**:
```json
{
  "success": true,
  "programs": [
    {
      "id": "seed_ffg",
      "name": "FFG General Programme",
      "metadata": { ... },
      "categorized_requirements": { ... }
    }
  ],
  "count": 5,
  "extraction_results": [ ... ]
}
```

**Check in Vercel**: 
- Browser DevTools → Network → Response tab
- Vercel Functions → Logs → Response status

---

### Step 9: Convert to Program Format
**Location**: Browser (Frontend)
**File**: `features/reco/components/ProgramFinder.tsx` (line 347-367)

**What Happens**:
- Convert extracted programs to `Program` format
- Map: `funding_types[0]` → `type`, `program_type`
- Map: `metadata` → `description`, `funding_amount_min/max`
- Preserve: `categorized_requirements`

**Check in Vercel**: 
- Browser DevTools → Console → See program conversion logs

---

### Step 10: Score Programs
**Location**: Browser (Client-Side)
**File**: `features/reco/engine/enhancedRecoEngine.ts` (line 370)
**Function**: `scoreProgramsEnhanced()`

**What Happens**:
1. Enrich user answers
2. Score categorized requirements (0-100%)
3. Normalize to 0-100% based on answered questions
4. Generate explanations
5. Second pass: Enhance explanations (strategic advice, application process, risks)
6. Sort by score (highest first)
7. **Filter out zero-score programs** ✅ (just fixed)
8. Take top 5

**Check in Vercel**: 
- Browser DevTools → Console → See:
  ```
  🔍 EnhancedRecoEngine: Processing X programs
  🔍 EnhancedRecoEngine: Program [id] - Final Score: X%
  ```

---

### Step 11: Display Results
**Location**: Browser (Frontend)
**File**: `features/reco/components/ProgramFinder.tsx` (line 899)

**What Happens**:
- Display top 5 programs with:
  - Match score (81%, 59%, ...)
  - Eligibility status
  - Why this matches (reasons)
  - Strategic advice (if available)
  - Application process (if available)
  - Risks with mitigation (if available)

**Check in Vercel**: 
- Browser → `/reco` page → See results displayed
- Browser DevTools → Elements → Inspect result cards

---

## 🔍 Where to Check in Vercel Dashboard

### 1. Function Logs

**Path**: Vercel Dashboard → Your Project → Functions → `/api/programs/recommend` → Logs

**What You'll See**:
```
📊 Filtered 200 seeds → 80 relevant seeds
🔍 Fetching and extracting: https://www.ffg.at/...
✅ Extracted program: FFG General Programme
❌ Error processing [URL]: [error]
```

**Key Logs**:
- `📊 Filtered X seeds → Y` - Seed filtering
- `🔍 Fetching and extracting` - HTML fetching
- `✅ Extracted program` - LLM extraction success
- `❌ Error processing` - Extraction failure

### 2. Function Metrics

**Path**: Vercel Dashboard → Your Project → Functions → `/api/programs/recommend` → Metrics

**What You'll See**:
- Invocations (how many times called)
- Duration (how long it takes)
- Errors (if any)
- Memory usage

**Check**:
- Duration should be < 30 seconds (timeout)
- Errors should be 0 (or low)
- Memory usage should be reasonable

### 3. Environment Variables

**Path**: Vercel Dashboard → Your Project → Settings → Environment Variables

**Required**:
- `OPENAI_API_KEY` - For LLM extraction (or)
- `CUSTOM_LLM_ENDPOINT` - For custom LLM

**Check**: Make sure these are set!

---

## 🐛 Common Issues & How to Debug

### Issue 1: No Programs Returned

**Symptoms**: 
- API returns `programs: []`
- User sees "No programs found"

**Debug Steps**:
1. Check Vercel Functions → Logs → See if seeds are filtered
2. Check if HTML fetching succeeds (`🔍 Fetching and extracting`)
3. Check if LLM extraction succeeds (`✅ Extracted program`)
4. Check if matching works (`matchesAnswers()`)

**Common Causes**:
- ❌ Seed URLs filtered out (wrong location)
- ❌ HTML fetch fails (timeout, blocked)
- ❌ LLM extraction fails (API key missing, timeout)
- ❌ Programs don't match user answers (filtered out)

### Issue 2: Wrong Programs Returned

**Symptoms**:
- Programs don't match user profile
- German programs for Austrian user

**Debug Steps**:
1. Check seed filtering: `📊 Filtered X seeds → Y`
2. Check matching logic: `matchesAnswers()` function
3. Check normalization: `matchLocations()`, `matchCompanyTypes()`

**Common Causes**:
- ❌ Seed filtering too broad (not filtering by location correctly)
- ❌ Matching logic too lenient (accepting wrong programs)
- ❌ Normalization not working (Austria ≠ Austria)

### Issue 3: Low Scores

**Symptoms**:
- All programs score < 50%
- Users see low match scores

**Debug Steps**:
1. Check scoring logs: `🔍 EnhancedRecoEngine: Program [id] - Final Score: X%`
2. Check matched criteria: `Matched: X, Gaps: Y`
3. Check normalization: Are requirements matching correctly?

**Common Causes**:
- ❌ Requirements not matching (normalization issue)
- ❌ Weights too strict
- ❌ User answers incomplete

### Issue 4: Zero-Score Programs in Results

**Symptoms**:
- Programs with 0% score appear in top 5
- Irrelevant programs shown

**Debug Steps**:
1. Check if filtering works: `validPrograms.filter(p => p.score > 0)`
2. Check scoring: Why are programs scoring 0%?

**Fix**: ✅ Already fixed in `ProgramFinder.tsx` (line 372)

---

## 📋 Debugging Checklist

### Frontend (Browser)
- [ ] Open `/reco` page
- [ ] Open DevTools (F12)
- [ ] Answer questions
- [ ] Check Console for errors
- [ ] Check Network tab for API calls
- [ ] Check Elements tab for results display

### Backend (Vercel)
- [ ] Go to Vercel Dashboard
- [ ] Select your project
- [ ] Go to Functions → `/api/programs/recommend`
- [ ] Check Logs tab for:
  - Seed filtering
  - HTML fetching
  - LLM extraction
  - Program matching
- [ ] Check Metrics tab for:
  - Invocations
  - Duration
  - Errors
- [ ] Check Settings → Environment Variables for API keys

### LLM Extraction
- [ ] Check OpenAI dashboard (if using OpenAI)
- [ ] Check OpenRouter dashboard (if using Custom LLM)
- [ ] Verify API keys are set
- [ ] Check usage/rate limits

---

## 🎯 Quick Debugging Commands

### Test API Endpoint Directly

```bash
curl -X POST https://your-app.vercel.app/api/programs/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "answers": {
      "location": "austria",
      "company_type": "startup",
      "funding_amount": "100kto500k"
    },
    "max_results": 5
  }'
```

### Check Vercel Logs (CLI)

```bash
vercel logs your-app.vercel.app --follow
```

### Test Locally

```bash
npm run dev
# Then go to http://localhost:3000/reco
```

---

## 📊 Data Flow Summary

```
User Answers (Browser)
  ↓
POST /api/programs/recommend (Vercel Function)
  ↓
Filter Seed URLs (url-seeds.json)
  ↓
Fetch HTML (External HTTP)
  ↓
LLM Extraction (External LLM API)
  ↓
Match Filtering (Normalization)
  ↓
Return Programs (JSON Response)
  ↓
Convert to Program Format (Browser)
  ↓
Score Programs (Browser - Client-Side)
  ↓
Filter Zero-Score (Browser)
  ↓
Display Top 5 (Browser)
```

---

## 🔗 Key Files Reference

| Component | File | Location in Vercel |
|-----------|------|-------------------|
| **Frontend UI** | `features/reco/components/ProgramFinder.tsx` | Browser |
| **API Endpoint** | `pages/api/programs/recommend.ts` | Vercel Functions |
| **LLM Extraction** | `scraper-lite/src/core/llm-extract.ts` | Vercel Functions → External API |
| **Scoring Engine** | `features/reco/engine/enhancedRecoEngine.ts` | Browser (Client-Side) |
| **Normalization** | `features/reco/engine/normalization.ts` | Both (API + Browser) |
| **Seed URLs** | `scraper-lite/url-seeds.json` | Vercel Functions (File System) |

---

## ✅ Test Results Summary

**Validation Test**: `scripts/validate-ranking-algorithm.ts`
**Results**: 2/5 tests passed (40%)
**Issues Found**: Zero-score programs in top 5
**Fix Applied**: ✅ Filter zero-score programs before ranking

**Next Steps**:
1. Re-run tests to verify fix
2. Test with real extracted programs
3. Consider minimum score threshold (30% or 50%)

---

## 🚀 How to Test in Vercel

### 1. Deploy to Vercel
```bash
git push
# Vercel auto-deploys
```

### 2. Check Deployment
- Go to Vercel Dashboard
- See latest deployment
- Check if build succeeded

### 3. Test Live
- Go to `https://your-app.vercel.app/reco`
- Answer questions
- Check results

### 4. Check Logs
- Vercel Dashboard → Functions → Logs
- See real-time logs from API calls

---

## 📝 Summary

**Complete Flow**:
1. User answers → Frontend
2. API call → Vercel Function
3. Filter seeds → Load url-seeds.json
4. Fetch HTML → External HTTP
5. LLM extraction → External LLM API
6. Match filtering → Normalization
7. Return programs → Frontend
8. Score programs → Browser (client-side)
9. Filter zero-score → Browser
10. Display top 5 → Browser

**Where to Check**:
- **Frontend**: Browser DevTools (Console, Network, Elements)
- **Backend**: Vercel Dashboard → Functions → Logs
- **LLM**: External API dashboard (OpenAI/OpenRouter)

**Key Files**:
- Frontend: `ProgramFinder.tsx`
- API: `pages/api/programs/recommend.ts`
- Scoring: `enhancedRecoEngine.ts`
- Extraction: `llm-extract.ts`

