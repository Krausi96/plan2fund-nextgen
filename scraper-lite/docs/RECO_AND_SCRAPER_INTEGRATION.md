# Recommendation System (Reco) & Web Scraper Integration

## 🎯 Goal of the Recommendation System

The **recommendation system (reco)** matches users with funding programs based on their profile and needs.

### What it does:
1. **User answers questions** about their company, project, funding needs
2. **System scores programs** against user answers
3. **Returns ranked recommendations** with match scores, eligibility, and gaps

### Key Features:
- ✅ **Smart matching**: Scores programs based on categorized requirements
- ✅ **Eligibility checking**: Determines if user qualifies
- ✅ **Gap analysis**: Shows what's missing to qualify
- ✅ **Success probability**: Estimates chance of getting funding
- ✅ **Founder-friendly explanations**: Translates technical requirements to plain language

---

## 🔄 How Recommendation System Works

### Step 1: User Answers Questions
User provides answers like:
```json
{
  "location": "austria",
  "company_type": "startup",
  "funding_amount": "100kto500k",
  "use_of_funds": "rd",
  "team_size": "3to5",
  "impact": "economic",
  "deadline_urgency": "urgent",
  "project_duration": "2to5"
}
```

### Step 2: System Fetches Programs
- Calls `/api/programs?enhanced=true`
- Loads programs from **database** (`pages` table)
- Transforms database records to program format

### Step 3: Scoring & Matching
- **Scores each program** against user answers
- Uses `categorized_requirements` from scraper data
- Calculates match percentage (0-100%)
- Identifies matched criteria and gaps

### Step 4: Returns Recommendations
```json
{
  "id": "aws-equity-venture-capital",
  "name": "Venture Capital Funding",
  "score": 85,
  "eligibility": "Eligible",
  "confidence": "High",
  "matchedCriteria": [...],
  "gaps": [...],
  "amount": { "min": 50000, "max": 500000, "currency": "EUR" },
  "successRate": 0.75
}
```

---

## 📊 What Data the Recommendation System Needs

### Critical Data from Scraper:

#### 1. **Categorized Requirements** (Most Important!)
```json
{
  "categorized_requirements": {
    "eligibility": [
      { "type": "location", "value": "Austria", "confidence": 0.9 },
      { "type": "company_stage", "value": "startup", "confidence": 0.85 }
    ],
    "financial": [
      { "type": "funding_amount_min", "value": 50000, "confidence": 0.9 },
      { "type": "funding_amount_max", "value": 500000, "confidence": 0.9 }
    ],
    "geographic": [
      { "type": "location", "value": "Austria", "confidence": 0.95 }
    ],
    "team": [
      { "type": "team_size", "value": "1-10", "confidence": 0.8 }
    ],
    "timeline": [
      { "type": "deadline", "value": "2024-12-31", "confidence": 0.9 }
    ]
  }
}
```

**Why critical?**
- Used for **scoring** (matches user answers to requirements)
- Used for **filtering** (removes ineligible programs)
- Used for **gap analysis** (shows what's missing)

#### 2. **Basic Program Metadata**
```json
{
  "id": "aws-equity-venture-capital",
  "name": "Venture Capital Funding",
  "type": "equity",
  "program_type": "equity",
  "description": "Funding for tech startups...",
  "funding_amount_min": 50000,
  "funding_amount_max": 500000,
  "currency": "EUR",
  "deadline": "2024-12-31",
  "contact_email": "info@aws.at"
}
```

#### 3. **Enhanced Fields** (Optional but valuable)
```json
{
  "target_personas": ["startup", "sme"],
  "tags": ["innovation", "non-dilutive"],
  "decision_tree_questions": [...],
  "editor_sections": [...],
  "readiness_criteria": [...],
  "ai_guidance": "..."
}
```

---

## 🔗 How Scraper Fulfills Recommendation System Needs

### Current Flow:

```
1. SCRAPER (unified-scraper.ts)
   ↓
   Scrapes funding program pages
   ↓
   LLM extracts categorized_requirements
   ↓
   Saves to database (pages + requirements tables)
   ↓
   
2. API (/api/programs)
   ↓
   Loads from database (pages table)
   ↓
   Transforms to program format
   ↓
   Includes categorized_requirements
   ↓
   
3. RECOMMENDATION ENGINE (enhancedRecoEngine.ts)
   ↓
   Fetches programs from /api/programs
   ↓
   Scores using categorized_requirements
   ↓
   Returns ranked recommendations
```

### What Scraper Must Provide:

#### ✅ **1. Categorized Requirements** (REQUIRED)
- **Category**: `eligibility`, `financial`, `geographic`, `team`, `timeline`, etc.
- **Type**: `location`, `funding_amount_min`, `company_stage`, etc.
- **Value**: Actual requirement value
- **Confidence**: 0.0-1.0 (how confident LLM is)

**Example from scraper:**
```typescript
// LLM extracts this from HTML
categorized_requirements: {
  eligibility: [
    { type: "location", value: "Austria", confidence: 0.9 },
    { type: "company_stage", value: "startup", confidence: 0.85 }
  ],
  financial: [
    { type: "funding_amount_min", value: 50000, confidence: 0.9 },
    { type: "funding_amount_max", value: 500000, confidence: 0.9 }
  ]
}
```

#### ✅ **2. Funding Amounts** (REQUIRED)
- `funding_amount_min`: Minimum funding
- `funding_amount_max`: Maximum funding
- `currency`: EUR, USD, etc.

**Used for:**
- Filtering programs by funding amount
- Showing amount ranges in recommendations
- Calculating "amount fit" score

#### ✅ **3. Deadlines** (IMPORTANT)
- `deadline`: Specific date or null
- `open_deadline`: Boolean (rolling deadline)

**Used for:**
- Filtering by urgency
- Showing timeline in recommendations
- Calculating "timeline fit" score

#### ✅ **4. Contact Info** (HELPFUL)
- `contact_email`: Program contact
- `contact_phone`: Phone number

**Used for:**
- Showing how to apply
- Contact information in recommendations

#### ✅ **5. Funding Types** (REQUIRED)
- `funding_types`: Array like `["grant", "loan", "equity"]`

**Used for:**
- Filtering by funding type preference
- Major filter in recommendation engine

#### ✅ **6. Program Focus** (HELPFUL)
- `program_focus`: Array like `["technology", "startups"]`

**Used for:**
- Sector matching
- Theme matching
- Better recommendations

---

## 🎯 How Scraper Scoring Works in Reco

### Scoring Process:

1. **User answers**: `{ location: "austria", funding_amount: "100kto500k" }`

2. **System loads program** with categorized_requirements:
   ```json
   {
     "geographic": [{ "type": "location", "value": "Austria" }],
     "financial": [{ "type": "funding_amount_min", "value": 50000 }]
   }
   ```

3. **System matches**:
   - User: `location: "austria"` → Matches `geographic.location: "Austria"` ✅
   - User: `funding_amount: "100kto500k"` → Matches `financial.funding_amount_min: 50000` ✅

4. **System scores**:
   - Each match adds points (weighted by frequency)
   - Rare requirements worth more (15 points)
   - Common requirements worth less (7 points)
   - Normalized to 0-100%

5. **System returns**:
   - Score: 85%
   - Matched criteria: 2
   - Gaps: 0
   - Eligibility: "Eligible"

---

## ⚠️ Current Gaps & What Scraper Needs to Improve

### ✅ What's Working:
- ✅ Scraper extracts categorized_requirements (LLM-based)
- ✅ Scraper saves to database (pages + requirements tables)
- ✅ API loads from database
- ✅ Recommendation engine uses categorized_requirements for scoring

### ⚠️ What Needs Improvement:

#### 1. **Requirement Coverage**
- **Current**: Only 7 LLM-extracted requirements (out of 110 total)
- **Need**: More LLM extraction, less pattern-based
- **Why**: Pattern-based is unreliable, LLM is accurate

#### 2. **Requirement Categories**
- **Current**: 17 categories extracted
- **Need**: All 35+ categories from schema
- **Why**: More categories = better matching

#### 3. **Confidence Scores**
- **Current**: Some requirements have confidence, some don't
- **Need**: All requirements should have confidence scores
- **Why**: Better scoring (high confidence = more weight)

#### 4. **Enhanced Fields**
- **Current**: Not extracted by scraper
- **Need**: Extract `target_personas`, `tags`, `decision_tree_questions`
- **Why**: Better program matching and user experience

#### 5. **Data Freshness**
- **Current**: 4 programs scraped (Nov 7, 2025)
- **Need**: More programs, regular updates
- **Why**: More programs = better recommendations

---

## 🚀 How to Improve Scraper for Reco

### Priority 1: Increase LLM Extraction
```typescript
// Current: Only 7 LLM requirements
// Target: 100% LLM extraction (no pattern fallback)

// In unified-scraper.ts:
// - Ensure LLM_ONLY = true
// - Remove pattern extraction fallback
// - Improve LLM prompts for all 35+ categories
```

### Priority 2: Extract All Categories
```typescript
// Current: 17 categories
// Target: All 35+ categories

// Categories to extract:
- eligibility
- financial
- geographic
- team
- timeline
- documents
- application
- use_of_funds
- technology_area
- innovation_focus
- company_stage
- company_type
- sector_focus
- repayment_terms
- collateral
- co_financing
- market_size
- trl_level
- consortium
- impact
- ... and more
```

### Priority 3: Extract Enhanced Fields
```typescript
// Add to LLM extraction prompt:
{
  "target_personas": ["startup", "sme", "research"],
  "tags": ["innovation", "non-dilutive", "green"],
  "decision_tree_questions": [...],
  "editor_sections": [...],
  "readiness_criteria": [...]
}
```

### Priority 4: Regular Scraping
```bash
# Run scraper regularly to keep data fresh
npm run scraper:unified -- full --max=50

# Or set up cron job:
# Daily: Discover new programs
# Weekly: Re-scrape existing programs
```

---

## 📊 Data Flow Summary

```
┌─────────────────────────────────────────────────────────┐
│  WEB SCRAPER (unified-scraper.ts)                       │
│  - Discovers funding program URLs                        │
│  - Scrapes HTML from program pages                      │
│  - LLM extracts categorized_requirements                │
│  - Saves to database (pages + requirements tables)      │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────────┐
│  DATABASE (Neon PostgreSQL)                             │
│  - pages table: Program metadata                        │
│  - requirements table: Categorized requirements         │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────────┐
│  API (/api/programs)                                    │
│  - Loads programs from database                        │
│  - Transforms to program format                        │
│  - Includes categorized_requirements                  │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────────┐
│  RECOMMENDATION ENGINE (enhancedRecoEngine.ts)          │
│  - Fetches programs from /api/programs                 │
│  - Scores using categorized_requirements               │
│  - Matches user answers to requirements                │
│  - Returns ranked recommendations                     │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ Success Criteria

### For Recommendation System to Work Well:

1. **✅ Scraper extracts categorized_requirements** (DONE)
2. **✅ Scraper saves to database** (DONE)
3. **✅ API loads from database** (DONE)
4. **✅ Recommendation engine uses categorized_requirements** (DONE)
5. **⚠️ More LLM extraction** (IN PROGRESS - only 7/110)
6. **⚠️ More programs scraped** (IN PROGRESS - only 4 programs)
7. **⚠️ All categories extracted** (TODO - only 17/35+)
8. **⚠️ Enhanced fields extracted** (TODO - not extracted)

---

## 🎯 Bottom Line

**The scraper is the foundation of the recommendation system.**

**What scraper provides:**
- ✅ Program data (name, description, amounts, deadlines)
- ✅ Categorized requirements (for scoring and matching)
- ✅ Contact information
- ✅ Funding types and focus areas

**What recommendation system does:**
- ✅ Matches user answers to program requirements
- ✅ Scores programs (0-100%)
- ✅ Shows eligibility and gaps
- ✅ Ranks recommendations

**Current status:**
- ✅ **Architecture is correct** - scraper → database → API → reco
- ⚠️ **Data quality needs improvement** - more LLM extraction, more programs
- ⚠️ **Coverage needs expansion** - all categories, enhanced fields

**Next steps:**
1. Run scraper more frequently (103 URLs queued!)
2. Improve LLM extraction (currently only 7/110 requirements)
3. Extract all categories (currently only 17/35+)
4. Extract enhanced fields (target_personas, tags, etc.)

