# Reco Architecture Analysis

## Current State

### ✅ QuestionEngine - STILL NEEDED
- **Used by:** ProgramFinder (guided mode)
- **Purpose:** Generates dynamic questions based on program requirements
- **Status:** Active and necessary

### ⚠️ Advanced Search - PARTIALLY WIRED
- **Current:** Manual mode uses `scoreProgramsEnhanced` directly (rule-based only)
- **Should:** Use `/api/programmes/search` for semantic + rule-based search
- **Issue:** TODO comment in code, semantic search not integrated

### ❌ UI Flow - NOT WIRED TO RESULTS
- **Current:** ProgramFinder routes directly to `/editor` when clicking program
- **Should:** Option to view all results on `/results` page
- **Issue:** Results page exists but ProgramFinder doesn't route there
- **Results page:** Reads from localStorage/context, but ProgramFinder doesn't store there

### ✅ EnhancedRecoEngine - STILL NEEDED & UP TO DATE
- **Used by:** ProgramFinder (both modes), search API
- **Function:** `scoreProgramsEnhanced()` - rule-based scoring
- **Status:** Active, current, working

### ✅ Scoring Flow
1. **Guided mode:** QuestionEngine → answers → scoreProgramsEnhanced → results
2. **Manual mode:** Filters/search → scoreProgramsEnhanced → results (should use API)
3. **Search API:** Combines rule-based (70%) + semantic (30%) scores

## Issues to Fix

1. **Manual mode should use semantic search API**
   - Currently: Direct `scoreProgramsEnhanced` call
   - Should: Call `/api/programmes/search` with query + filters

2. **ProgramFinder should route to results page**
   - Currently: Direct to `/editor`
   - Should: Option to view all results on `/results` first

3. **Store results in context/localStorage**
   - Currently: Only stores in local state
   - Should: Store in RecommendationContext + localStorage for results page

