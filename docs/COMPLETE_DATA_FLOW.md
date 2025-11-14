# Complete Data Flow - End to End

## 🎯 Overview

This document explains the **complete data flow** from user answering questions to displaying results, and **where to check it in Vercel**.

---

## 📊 Complete Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. USER ANSWERS QUESTIONS (Frontend)                           │
│    File: features/reco/components/ProgramFinder.tsx            │
│    Page: /reco (pages/main/reco.tsx)                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ User answers collected in state
                              │ answers = { location: "austria", company_type: "startup", ... }
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. TRIGGER API CALL (Frontend)                                  │
│    File: features/reco/components/ProgramFinder.tsx            │
│    Function: updateGuidedResults() (line 324)                   │
│    When: answers change (useEffect hook)                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ POST /api/programs/recommend
                              │ Body: { answers, max_results: 20, extract_all: false }
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. API ENDPOINT (Backend - Vercel Serverless)                  │
│    File: pages/api/programs/recommend.ts                        │
│    Function: handler() (line 317)                               │
│    Location: Vercel → Functions → /api/programs/recommend      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Step 3.1: Load seed URLs
                              │ File: scraper-lite/url-seeds.json
                              │ (200+ funding institution URLs)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3.1 FILTER SEED URLs                                            │
│    Function: filterSeedsByAnswers() (line 104)                  │
│    Example: User in Austria → Filter to 80 Austrian institutions│
│    Result: relevantSeeds (reduced from 200+ to ~80)             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Step 3.2: Limit seeds to process
                              │ seedsToProcess = relevantSeeds.slice(0, 20)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3.2 FETCH HTML FROM SEED URLs (On-Demand)                      │
│    Function: fetchHtml() (line 301)                             │
│    For each seed URL:                                           │
│    - Fetch HTML with 10s timeout                                │
│    - User-Agent: Mozilla/5.0...                                │
│    Location: Vercel → External HTTP requests                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Step 3.3: Extract with LLM
                              │ For each fetched HTML
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3.3 LLM EXTRACTION                                              │
│    File: scraper-lite/src/core/llm-extract.ts                  │
│    Function: extractWithLLM()                                  │
│    Model: GPT-4o-mini or Custom LLM (Gemini via OpenRouter)    │
│    Output: 35 requirement categories in structured JSON         │
│    Location: Vercel → External LLM API calls                   │
│                                                                 │
│    Extracted Data Structure:                                    │
│    {                                                            │
│      metadata: {                                                │
│        funding_amount_min: 50000,                               │
│        funding_amount_max: 500000,                              │
│        deadline: "2024-03-15",                                  │
│        ...                                                      │
│      },                                                         │
│      categorized_requirements: {                               │
│        geographic: [{ type: "location", value: "Austria" }],   │
│        eligibility: [{ type: "company_type", value: "startup" }],│
│        project: [{ type: "industry_focus", value: "digital" }],│
│        ...                                                      │
│      }                                                          │
│    }                                                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Step 3.4: Match extracted programs
                              │ Function: matchesAnswers() (line 143)
                              │ Filters programs that match user answers
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3.4 MATCH FILTERING                                             │
│    Function: matchesAnswers() (line 143)                       │
│    Uses: normalization.ts (matchLocations, matchCompanyTypes)  │
│    Checks:                                                      │
│    - Location match (critical - must match)                    │
│    - Company type match (critical - must match)                 │
│    - Funding amount match (critical - must match)               │
│    - Industry match (optional)                                  │
│    Result: programs[] (only matching programs)                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Step 3.5: Return to frontend
                              │ Response: { programs, count, extraction_results, ... }
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. RECEIVE PROGRAMS (Frontend)                                  │
│    File: features/reco/components/ProgramFinder.tsx            │
│    Function: updateGuidedResults() (line 343)                  │
│    Data: data.programs (extracted programs)                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Step 4.1: Convert to Program format
                              │ Map extracted programs to Program interface
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4.1 CONVERT TO PROGRAM FORMAT                                   │
│    File: features/reco/components/ProgramFinder.tsx            │
│    Lines: 347-367                                               │
│    Converts: extracted program → Program format                 │
│    Adds: categorized_requirements, metadata, etc.              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Step 4.2: Score programs
                              │ Function: scoreProgramsEnhanced()
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. SCORE PROGRAMS (Backend - Client-Side)                      │
│    File: features/reco/engine/enhancedRecoEngine.ts            │
│    Function: scoreProgramsEnhanced() (line 1133)                │
│    Location: Runs in browser (client-side)                     │
│                                                                 │
│    Process:                                                     │
│    1. Enrich user answers (derive signals)                     │
│    2. Score categorized requirements (line 799-1094)            │
│       - Match user answers against program requirements         │
│       - Use fixed weights (22% location, 20% company type, ...)│
│       - Calculate score: 0-100%                                 │
│    3. Normalize to 0-100% based on answered questions           │
│    4. Generate explanations (line 1496-1501)                   │
│       - generateFounderFriendlyReasons()                        │
│       - generateFounderFriendlyRisks()                         │
│    5. Second pass: Enhance explanations (line 1594-1620)       │
│       - Add strategic advice (if multiple programs)             │
│       - Add application process info                            │
│       - Add risk mitigation                                    │
│    6. Sort by score (highest first)                             │
│                                                                 │
│    Output: EnhancedProgramResult[] (scored and ranked)         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Step 5.1: Take top 5
                              │ top5 = scored.sort().slice(0, 5)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. DISPLAY RESULTS (Frontend)                                   │
│    File: features/reco/components/ProgramFinder.tsx            │
│    Function: setResults(top5) (line 373)                       │
│    Display: Inline in ProgramFinder component                  │
│                                                                 │
│    Shows:                                                       │
│    - Top 5 programs with match scores (81%, 59%, 37%, ...)     │
│    - Eligibility status (Eligible/Not Eligible)                 │
│    - Why this matches (reasons)                                │
│    - Strategic advice (if available)                            │
│    - Application process (if available)                         │
│    - Risks with mitigation (if available)                      │
│    - Gaps (what's missing)                                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔍 Where to Check in Vercel

### 1. Frontend (Client-Side)

**Location**: Vercel → Your Project → Deployments → [Latest] → Functions

**What to Check**:
- **Page**: `/reco` (pages/main/reco.tsx)
- **Component**: `ProgramFinder.tsx` (features/reco/components/ProgramFinder.tsx)
- **Browser Console**: Check for errors, API calls, scoring logs

**How to Check**:
1. Go to your Vercel deployment URL
2. Navigate to `/reco`
3. Open browser DevTools (F12)
4. Check Console tab for logs
5. Check Network tab for API calls

**Key Logs to Look For**:
```
🔍 Fetching and extracting: [URL]
📊 Filtered X seeds → Y relevant seeds
🔍 EnhancedRecoEngine: Program [id] - Final Score: X%, Matched: Y, Gaps: Z
```

### 2. API Endpoint (Serverless Function)

**Location**: Vercel → Your Project → Functions → `/api/programs/recommend`

**What to Check**:
- **File**: `pages/api/programs/recommend.ts`
- **Function**: `handler()` (line 317)
- **Logs**: Vercel → Functions → Logs

**How to Check**:
1. Go to Vercel Dashboard
2. Select your project
3. Go to **Functions** tab
4. Find `/api/programs/recommend`
5. Click to view logs

**Key Logs to Look For**:
```
📊 Filtered 200 seeds → 80 relevant seeds
🔍 Fetching and extracting: https://...
✅ Extracted program: [name]
❌ Error processing [URL]: [error]
```

**Response Structure**:
```json
{
  "success": true,
  "programs": [
    {
      "id": "seed_ffg",
      "name": "FFG General Programme",
      "url": "https://...",
      "metadata": { ... },
      "categorized_requirements": { ... }
    }
  ],
  "count": 5,
  "extraction_results": [ ... ],
  "seeds_checked": 20
}
```

### 3. LLM Extraction

**Location**: Vercel → Functions → External API calls

**What to Check**:
- **File**: `scraper-lite/src/core/llm-extract.ts`
- **Function**: `extractWithLLM()`
- **API**: OpenAI or Custom LLM endpoint

**How to Check**:
1. Check Vercel Function logs for LLM API calls
2. Check external API usage (OpenAI dashboard, OpenRouter dashboard)
3. Look for extraction errors in logs

**Key Logs to Look For**:
```
🔍 Extracting with LLM: [URL]
✅ Extracted 35 categories
⚠️ LLM extraction failed: [error]
```

### 4. Scoring Engine

**Location**: Runs in browser (client-side), but logs appear in browser console

**What to Check**:
- **File**: `features/reco/engine/enhancedRecoEngine.ts`
- **Function**: `scoreProgramsEnhanced()` (line 1133)
- **Browser Console**: Check for scoring logs

**How to Check**:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Answer questions on `/reco` page
4. Look for scoring logs

**Key Logs to Look For**:
```
🔍 EnhancedRecoEngine: Processing X programs
🔍 EnhancedRecoEngine: User answers: location=austria, company_type=startup, ...
🔍 EnhancedRecoEngine: Program [id] - Final Score: X%, Matched: Y, Gaps: Z
✨ Perfect match bonus applied: +5 points
```

---

## 📁 Key Files & Their Roles

### Frontend Files

1. **`pages/main/reco.tsx`**
   - Route: `/reco`
   - Renders: `ProgramFinder` component
   - Analytics: Tracks page views

2. **`features/reco/components/ProgramFinder.tsx`**
   - Main UI component
   - Handles: Questions, API calls, results display
   - Key functions:
     - `updateGuidedResults()` (line 324) - Calls API
     - `handleAnswer()` (line 459) - Updates answers
     - Results display (line 899+) - Shows top 5 programs

3. **`features/reco/contexts/RecommendationContext.tsx`**
   - Global state management
   - Stores: answers, recommendations

### Backend Files (API)

4. **`pages/api/programs/recommend.ts`**
   - API endpoint: `POST /api/programs/recommend`
   - Handles: Seed URL filtering, HTML fetching, LLM extraction
   - Returns: Extracted programs

5. **`scraper-lite/src/core/llm-extract.ts`**
   - LLM extraction function
   - Extracts: 35 requirement categories from HTML
   - Uses: GPT-4o-mini or Custom LLM

6. **`scraper-lite/url-seeds.json`**
   - Database of 200+ funding institution URLs
   - Each entry: `{ institution_id, institution_name, seed_url, funding_types }`

### Engine Files

7. **`features/reco/engine/enhancedRecoEngine.ts`**
   - Scoring engine
   - Functions:
     - `scoreProgramsEnhanced()` (line 1133) - Main scoring
     - `scoreCategorizedRequirements()` (line 799) - Score calculation
     - `generateFounderFriendlyReasons()` (line 1609) - Explanations
     - `generateSmartExplanation()` (line 1634) - Enhanced explanations

8. **`features/reco/engine/normalization.ts`**
   - Normalization functions
   - Handles: Variations ("Austria" = "AT" = "Austria")
   - Functions: `matchLocations()`, `matchCompanyTypes()`, etc.

---

## 🔄 Complete Flow Step-by-Step

### Step 1: User Answers Questions

**Location**: Browser (Frontend)
**File**: `features/reco/components/ProgramFinder.tsx`

**What Happens**:
1. User selects answers (location, company_type, funding_amount, ...)
2. Answers stored in `answers` state (line 252)
3. `useEffect` hook triggers when answers change (line 451)
4. Calls `updateGuidedResults()` (line 324)

**Check in Vercel**: Browser DevTools → Console → See state updates

---

### Step 2: API Call

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
- Browser DevTools → Network tab → See API call
- Vercel Dashboard → Functions → `/api/programs/recommend` → Logs

---

### Step 3: Filter Seed URLs

**Location**: Vercel Serverless Function
**File**: `pages/api/programs/recommend.ts` (line 338)

**What Happens**:
1. Load `scraper-lite/url-seeds.json` (200+ URLs)
2. Filter by location (Austria → 80 Austrian institutions)
3. Limit to 20 seeds to process

**Check in Vercel**: 
- Vercel Functions → Logs → See: `📊 Filtered 200 seeds → 80 relevant seeds`

---

### Step 4: Fetch HTML

**Location**: Vercel Serverless Function → External HTTP
**File**: `pages/api/programs/recommend.ts` (line 353)

**What Happens**:
1. For each seed URL, fetch HTML
2. Timeout: 10 seconds
3. User-Agent: Mozilla/5.0...

**Check in Vercel**: 
- Vercel Functions → Logs → See: `🔍 Fetching and extracting: [URL]`
- Or: `⚠️ Failed to fetch [URL]`

---

### Step 5: LLM Extraction

**Location**: Vercel Serverless Function → External LLM API
**File**: `scraper-lite/src/core/llm-extract.ts`

**What Happens**:
1. Send HTML to LLM (GPT-4o-mini or Custom LLM)
2. Extract 35 requirement categories
3. Return structured JSON

**Check in Vercel**: 
- Vercel Functions → Logs → See extraction results
- External API dashboard (OpenAI/OpenRouter) → Usage logs

---

### Step 6: Match Filtering

**Location**: Vercel Serverless Function
**File**: `pages/api/programs/recommend.ts` (line 367)

**What Happens**:
1. Check if extracted program matches user answers
2. Uses normalization (matchLocations, matchCompanyTypes, ...)
3. Only matching programs added to results

**Check in Vercel**: 
- Vercel Functions → Logs → See: `✅ Extracted program: [name]`
- Response: `programs[]` array

---

### Step 7: Return to Frontend

**Location**: Vercel Serverless Function → Browser
**File**: `pages/api/programs/recommend.ts` (line 402)

**Response**:
```json
{
  "success": true,
  "programs": [ ... ],
  "count": 5,
  "extraction_results": [ ... ]
}
```

**Check in Vercel**: 
- Browser DevTools → Network tab → Response
- Vercel Functions → Logs → Response status

---

### Step 8: Score Programs

**Location**: Browser (Client-Side)
**File**: `features/reco/engine/enhancedRecoEngine.ts` (line 370)

**What Happens**:
1. Convert extracted programs to Program format
2. Call `scoreProgramsEnhanced(answers, 'strict', programsForScoring)`
3. Score each program (0-100%)
4. Generate explanations
5. Sort by score (highest first)
6. Take top 5

**Check in Vercel**: 
- Browser DevTools → Console → See scoring logs:
  ```
  🔍 EnhancedRecoEngine: Processing X programs
  🔍 EnhancedRecoEngine: Program [id] - Final Score: X%
  ```

---

### Step 9: Display Results

**Location**: Browser (Frontend)
**File**: `features/reco/components/ProgramFinder.tsx` (line 899)

**What Happens**:
1. Set results: `setResults(top5)` (line 373)
2. Display top 5 programs with:
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

## 🐛 Debugging in Vercel

### 1. Check Function Logs

**Location**: Vercel Dashboard → Your Project → Functions → `/api/programs/recommend` → Logs

**What to Look For**:
- ✅ `📊 Filtered X seeds → Y relevant seeds` - Filtering works
- ✅ `🔍 Fetching and extracting: [URL]` - HTML fetching works
- ✅ `✅ Extracted program: [name]` - LLM extraction works
- ❌ `⚠️ Failed to fetch [URL]` - HTML fetch failed
- ❌ `❌ Error processing [URL]: [error]` - Extraction failed

### 2. Check Browser Console

**Location**: Browser DevTools (F12) → Console tab

**What to Look For**:
- ✅ `🔍 EnhancedRecoEngine: Processing X programs` - Scoring started
- ✅ `🔍 EnhancedRecoEngine: Program [id] - Final Score: X%` - Scoring works
- ❌ `❌ Enhanced recommendation engine failed: [error]` - Scoring failed
- ❌ `Failed to fetch recommendations` - API call failed

### 3. Check Network Tab

**Location**: Browser DevTools (F12) → Network tab

**What to Look For**:
- ✅ `POST /api/programs/recommend` - Status 200 - API call successful
- ✅ Response contains `programs[]` array - Programs returned
- ❌ Status 404 - API endpoint not found
- ❌ Status 500 - Server error
- ❌ Status 405 - Method not allowed

### 4. Check Vercel Environment Variables

**Location**: Vercel Dashboard → Your Project → Settings → Environment Variables

**Required Variables**:
- `OPENAI_API_KEY` - For LLM extraction (or)
- `CUSTOM_LLM_ENDPOINT` - For custom LLM

**Check**: Make sure these are set in Vercel!

---

## 📊 Data Structures

### User Answers (Input)
```typescript
{
  location: "austria",
  company_type: "startup",
  funding_amount: "100kto500k",
  industry_focus: ["digital"],
  company_stage: "inc_lt_6m",
  ...
}
```

### Extracted Program (From API)
```typescript
{
  id: "seed_ffg",
  name: "FFG General Programme",
  url: "https://...",
  metadata: {
    funding_amount_min: 50000,
    funding_amount_max: 500000,
    deadline: "2024-03-15",
    ...
  },
  categorized_requirements: {
    geographic: [{ type: "location", value: "Austria", confidence: 0.95 }],
    eligibility: [{ type: "company_type", value: "startup", confidence: 0.9 }],
    project: [{ type: "industry_focus", value: "digital", confidence: 0.8 }],
    ...
  }
}
```

### Scored Program (Output)
```typescript
{
  id: "seed_ffg",
  name: "FFG General Programme",
  score: 81, // 0-100%
  eligibility: "Eligible",
  confidence: "High",
  reasons: ["Your Austrian startup location matches...", ...],
  strategicAdvice: "This program can be combined with...",
  applicationInfo: "Deadline March 15, 2024. Steps: 1) Submit online...",
  riskMitigation: "Co-financing required (30%) - Consider seeking bridge financing",
  matchedCriteria: [ ... ],
  gaps: [ ... ],
  ...
}
```

---

## 🎯 Quick Reference: Where to Check What

| What to Check | Where | How |
|---------------|-------|-----|
| **User answers** | Browser DevTools → Console | Log `answers` state |
| **API call** | Browser DevTools → Network | See POST `/api/programs/recommend` |
| **Seed filtering** | Vercel → Functions → Logs | See `📊 Filtered X seeds → Y` |
| **HTML fetching** | Vercel → Functions → Logs | See `🔍 Fetching and extracting` |
| **LLM extraction** | Vercel → Functions → Logs | See extraction results |
| **Program matching** | Vercel → Functions → Logs | See `✅ Extracted program` |
| **Scoring** | Browser DevTools → Console | See `🔍 EnhancedRecoEngine` logs |
| **Results display** | Browser → `/reco` page | See top 5 programs displayed |

---

## 🚀 Testing the Flow

### Test in Browser

1. Go to `/reco` page
2. Open DevTools (F12)
3. Answer questions
4. Watch:
   - Console: Scoring logs
   - Network: API calls
   - Elements: Results displayed

### Test API Directly

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

### Check Vercel Logs

1. Go to Vercel Dashboard
2. Select your project
3. Go to **Functions** → `/api/programs/recommend`
4. View **Logs** tab
5. See real-time logs from API calls

---

## 📝 Summary

**Complete Flow**:
1. User answers → Frontend (ProgramFinder.tsx)
2. API call → Backend (pages/api/programs/recommend.ts)
3. Filter seeds → Load url-seeds.json, filter by location
4. Fetch HTML → External HTTP requests
5. LLM extraction → External LLM API
6. Match filtering → Normalization & matching
7. Return programs → Frontend receives extracted programs
8. Score programs → Client-side scoring (enhancedRecoEngine.ts)
9. Display results → Top 5 programs shown

**Where to Check in Vercel**:
- **Frontend**: Browser DevTools (Console, Network, Elements)
- **API**: Vercel Dashboard → Functions → `/api/programs/recommend` → Logs
- **LLM**: External API dashboard (OpenAI/OpenRouter)

**Key Files**:
- Frontend: `features/reco/components/ProgramFinder.tsx`
- API: `pages/api/programs/recommend.ts`
- Scoring: `features/reco/engine/enhancedRecoEngine.ts`
- Extraction: `scraper-lite/src/core/llm-extract.ts`

