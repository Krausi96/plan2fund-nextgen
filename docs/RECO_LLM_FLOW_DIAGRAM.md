# Recommendation System - LLM Extraction Flow Diagram

## Complete Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         USER INTERACTION LAYER                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    ProgramFinder.tsx (UI Component)                     │
│  • Guided Mode: Static questions (location, company_type, etc.)         │
│  • Manual Mode: Filters + search query                                 │
│  • Shows results inline (no separate results page)                      │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    User answers collected
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│              POST /api/programs/recommend                                │
│  Input: { answers, max_results, extract_all }                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    Seed URL Filtering                                   │
│  • Loads scraper-lite/url-seeds.json                                    │
│  • Filters by location (Austria, Germany, EU)                           │
│  • Filters by funding type if specified                                 │
│  • Returns: relevantSeeds[] (max 20 URLs)                               │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    On-Demand HTML Fetching                              │
│  For each seed URL:                                                     │
│  • fetchHtml(seed_url) → Gets HTML content                              │
│  • Timeout: 10 seconds                                                  │
│  • User-Agent: Mozilla/5.0...                                           │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│              LLM Extraction (extractWithLLM)                            │
│  Location: scraper-lite/src/core/llm-extract.ts                        │
│                                                                         │
│  Input: { html, url, title }                                           │
│                                                                         │
│  Process:                                                               │
│  1. Clean HTML (cheerio) - remove scripts, styles                      │
│  2. Extract text content (max 50k chars)                                │
│  3. Build system prompt with 35 requirement categories                 │
│  4. Call LLM (OpenAI GPT-4o-mini or Custom LLM)                        │
│  5. Parse JSON response                                                 │
│                                                                         │
│  Output: {                                                              │
│    metadata: {                                                          │
│      funding_amount_min, funding_amount_max,                           │
│      deadline, open_deadline,                                          │
│      contact_email, contact_phone, etc.                                │
│    },                                                                   │
│    categorized_requirements: {                                          │
│      geographic: [...],                                                 │
│      eligibility: [...],                                               │
│      financial: [...],                                                 │
│      team: [...],                                                      │
│      project: [...],                                                   │
│      impact: [...],                                                   │
│      ... (18 categories total)                                         │
│    }                                                                   │
│  }                                                                     │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    Matching Filter                                      │
│  Function: matchesAnswers(extracted, answers)                          │
│                                                                         │
│  Uses normalization system:                                            │
│  • normalizeLocationAnswer() → normalizeLocationExtraction()            │
│  • normalizeCompanyTypeAnswer() → normalizeCompanyTypeExtraction()     │
│  • normalizeFundingAmountAnswer() → normalizeFundingAmountExtraction() │
│  • matchLocations(), matchCompanyTypes(), matchFundingAmounts(), etc. │
│                                                                         │
│  Critical checks (must pass):                                          │
│  • Location match (if specified)                                        │
│  • Company type match (if specified)                                   │
│  • Funding amount match (if specified)                                 │
│                                                                         │
│  Returns: true if matches, false otherwise                             │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│              Program Object Creation                                    │
│  {                                                                      │
│    id: `seed_${institution_id}`,                                       │
│    name: institution_name,                                             │
│    url: seed_url,                                                      │
│    funding_types: [...],                                               │
│    metadata: extracted.metadata,                                        │
│    categorized_requirements: extracted.categorized_requirements,     │
│    extracted_at: ISO timestamp                                         │
│  }                                                                     │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│              Return to ProgramFinder                                    │
│  Response: {                                                            │
│    success: true,                                                      │
│    programs: [...],                                                    │
│    count: N,                                                           │
│    extraction_results: [...],                                          │
│    question_mapping: QUESTION_TO_EXTRACTION_MAP                        │
│  }                                                                     │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│              Program Format Conversion                                  │
│  ProgramFinder converts extracted programs to Program format:          │
│  • Maps funding_types[0] → type, program_type                          │
│  • Maps metadata → description, funding_amount_min/max, etc.           │
│  • Preserves categorized_requirements                                  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│              Scoring Engine (scoreProgramsEnhanced)                     │
│  Location: features/reco/engine/enhancedRecoEngine.ts                  │
│                                                                         │
│  Input: answers, mode, preFilteredPrograms[]                           │
│                                                                         │
│  Process:                                                               │
│  1. enrichAnswers() - Normalize and enrich user answers                │
│  2. deriveSignals() - Calculate derived signals (funding mode, etc.)   │
│  3. For each program:                                                  │
│     a. Score categorized_requirements using fixed weights              │
│        (from questionWeights.ts)                                       │
│     b. Use normalization system for matching                           │
│     c. Calculate match score (0-100%)                                  │
│     d. Generate explanations with weight references                     │
│     e. Generate gaps and risks                                         │
│                                                                         │
│  Fixed Weights (from questionWeights.ts):                              │
│  • Location: 22%                                                        │
│  • Company Type: 20%                                                   │
│  • Funding Amount: 18%                                                 │
│  • Industry Focus: 15%                                                  │
│  • Impact: 8%                                                          │
│  • Company Stage: 6%                                                   │
│  • ... (12 questions total)                                            │
│                                                                         │
│  Output: EnhancedProgramResult[] (sorted by score)                     │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│              Display Results in ProgramFinder                           │
│  • Shows scored programs inline                                        │
│  • Displays: name, score, amount, reasons, risks, matched criteria     │
│  • "View Details" button → Routes to /editor                           │
│  • Stores in RecommendationContext + localStorage                      │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│              User Selects Program                                       │
│  • Click program → router.push('/editor?programId=...')                 │
│  • Passes program data via URL params                                  │
│  • Editor loads program and pre-fills with user answers                 │
└─────────────────────────────────────────────────────────────────────────┘
```

## Key Components

### 1. **LLM Extraction** (`scraper-lite/src/core/llm-extract.ts`)
- **Model:** OpenAI GPT-4o-mini (or Custom LLM if configured)
- **Input:** HTML content from seed URL
- **Output:** Structured JSON with 35 requirement categories
- **Categories:** geographic, eligibility, financial, team, project, impact, etc.

### 2. **Normalization System** (`features/reco/engine/normalization.ts`)
- **Purpose:** Consistent matching between user answers and extracted requirements
- **Functions:**
  - `normalizeLocationAnswer()` / `normalizeLocationExtraction()`
  - `normalizeCompanyTypeAnswer()` / `normalizeCompanyTypeExtraction()`
  - `normalizeFundingAmountAnswer()` / `normalizeFundingAmountExtraction()`
  - `matchLocations()`, `matchCompanyTypes()`, `matchFundingAmounts()`, etc.

### 3. **Scoring Engine** (`features/reco/engine/enhancedRecoEngine.ts`)
- **Weights:** Fixed weights from `questionWeights.ts` (data-driven)
- **Scoring:** Percentage-based (0-100%) normalized to answered questions
- **Explanations:** References actual weights (e.g., "Location match (22% of match score)")

### 4. **UI Component** (`features/reco/components/ProgramFinder.tsx`)
- **Modes:** Guided (questions) or Manual (filters)
- **Results:** Displayed inline (no separate results page)
- **Actions:** View Details → Routes to editor

## Data Flow Summary

1. **User Input** → ProgramFinder collects answers
2. **API Call** → `/api/programs/recommend` with answers
3. **Seed Filtering** → Filter `url-seeds.json` by location/funding type
4. **HTML Fetch** → Fetch HTML from filtered seed URLs (on-demand)
5. **LLM Extraction** → `extractWithLLM()` extracts structured data
6. **Matching** → Normalize and match extracted data with user answers
7. **Scoring** → `scoreProgramsEnhanced()` with fixed weights
8. **Display** → Show results inline in ProgramFinder
9. **Selection** → User clicks program → Routes to editor

## Important Notes

- **No Database:** Programs are extracted on-demand, not saved to DB
- **On-Demand:** Each recommendation request triggers fresh LLM extraction
- **Fixed Weights:** Scoring uses data-driven fixed weights (not dynamic)
- **Single Page:** Results shown inline in ProgramFinder (no separate results page)
- **Normalization:** Centralized normalization ensures consistent matching

