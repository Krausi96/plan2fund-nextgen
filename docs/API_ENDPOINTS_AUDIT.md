# API Endpoints Audit - Current State

## What Actually Exists

### ✅ `/api/programs/recommend` (NEW - LLM-based)
**Location:** `pages/api/programs/recommend.ts`

**What it does:**
- Takes user answers (location, company_type, funding_amount, etc.)
- Filters seed URLs from `scraper-lite/url-seeds.json` based on answers
- Fetches HTML from seed URLs on-demand
- Extracts program data using LLM (`extractWithLLM` from scraper-lite)
- Returns extracted programs with `categorized_requirements`

**Used by:**
- `features/reco/components/ProgramFinder.tsx` (lines 238, 307) - Main recommendation flow
- `scraper-lite/scripts/test-recommend.ts` - Testing

**Status:** ✅ ACTIVE - This is the NEW flow

---

### ✅ `/api/programs` (Legacy - Static JSON)
**Location:** `pages/api/programs.ts`

**What it does:**
- Loads programs from static JSON file: `data/programmes.json` (or fallback `data/migrated-programs.json`)
- Transforms `eligibility_criteria` → `categorized_requirements` (if needed)
- Returns all programs or filtered by type
- Adds `completenessScore` and `fresh` flags if `?enhanced=true`

**Used by:**
- `pages/main/library.tsx` (line 25) - Library page (you want to redesign this anyway)
- `features/editor/engine/dataSource.ts` (lines 78, 102, 377) - Editor data source
- `features/editor/components/ProgramSelector.tsx` (line 211) - Program selector in editor

**Status:** ⚠️ LEGACY - Uses static JSON, not scraper-lite database

---

### ❌ `/api/programs-ai` (DOES NOT EXIST)
**Status:** ❌ REMOVED - File doesn't exist

**Note:** `dataSource.ts` has warnings saying "programs-ai endpoint was removed" (lines 342, 349, 356, 363)

---

### ❌ `/api/programmes/search` (DOES NOT EXIST)
**Status:** ❌ DOES NOT EXIST - I was wrong in my initial assessment

**Note:** There IS a file at `pages/api/programmes/[id]/requirements.ts` but no search endpoint

---

## Current Data Flow

### Recommendation Flow (NEW)
```
User fills ProgramFinder → /api/programs/recommend → LLM extraction → scoreProgramsEnhanced → Results
```

### Library/Editor Flow (LEGACY)
```
Library/Editor → /api/programs → Static JSON (data/programmes.json) → Display
```

## Issues & Recommendations

### 1. **Duplicate Data Sources**
- **NEW flow:** Uses scraper-lite database (LLM extraction from URLs)
- **LEGACY flow:** Uses static JSON file (`data/programmes.json`)

**Problem:** Two sources of truth - programs might be different between them

### 2. **Library Page Uses Legacy Endpoint**
- `library.tsx` uses `/api/programs` (static JSON)
- Should probably use `/api/programs/recommend` or a unified endpoint

### 3. **Editor Uses Legacy Endpoint**
- `dataSource.ts` uses `/api/programs` (static JSON)
- Editor might need different data structure than recommendations

## Recommendations

### Option A: Unify Everything to LLM Flow
1. Make `/api/programs` also use scraper-lite database
2. Update library.tsx to use new flow
3. Update editor to use new flow
4. **Pros:** Single source of truth, always fresh data
5. **Cons:** Requires LLM calls, might be slower

### Option B: Keep Separate (Current State)
1. Keep `/api/programs/recommend` for recommendations (LLM-based)
2. Keep `/api/programs` for library/editor (static JSON)
3. **Pros:** Fast, no LLM costs for library
4. **Cons:** Two sources of truth, data might diverge

### Option C: Hybrid Approach
1. `/api/programs/recommend` - LLM extraction (recommendations)
2. `/api/programs` - Load from scraper-lite database (not static JSON)
3. Both use same database, but different endpoints for different use cases
4. **Pros:** Single source of truth, optimized for each use case
5. **Cons:** Need to update `/api/programs` to use database

## My Recommendation

Since you want to redesign library anyway:

1. **Short term:** Document that `/api/programs` is legacy static JSON
2. **When redesigning library:** 
   - Option: Use `/api/programs/recommend` with `extract_all=true` to get all programs
   - Option: Create new `/api/programs/library` endpoint that loads from scraper-lite database
3. **For editor:** Keep using `/api/programs` but update it to load from scraper-lite database instead of static JSON

This way you have:
- `/api/programs/recommend` - LLM extraction (recommendations)
- `/api/programs` - Database query (library/editor) - updated to use scraper-lite DB
- Single source of truth (scraper-lite database)

