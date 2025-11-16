# ProgramFinder API Flow Analysis: recommend.ts vs llmExtract.ts

## 🎯 Key Question: Do We Parse Twice?

**Answer: YES, we currently parse twice, but it's intentional (though potentially optimizable).**

---

## 📊 Current Flow Architecture

### API Connection
**`/api/programs/recommend` (recommend.ts)** is the **ONLY API endpoint** connected to the frontend.

**`llmExtract.ts`** is **NOT** a direct API endpoint - it's a **utility function** used BY `recommend.ts`.

---

## 🔄 Complete Flow Breakdown

### Step 1: Frontend Calls API
```
ProgramFinder.tsx → POST /api/programs/recommend
```

**Request:**
```typescript
{
  answers: UserAnswers,  // User's Q&A answers
  max_results: 20,
  extract_all: false,
  use_seeds: false
}
```

---

### Step 2: API Handler (recommend.ts)
**Location:** `pages/api/programs/recommend.ts` (line 882)

**What It Does:**
1. Receives user answers
2. Calls `generateProgramsWithLLM()` to generate basic program suggestions
3. For each generated program, calls `extractWithLLM()` to extract detailed requirements
4. Returns complete programs with requirements

---

### Step 3: First LLM Call - Generate Programs
**Function:** `generateProgramsWithLLM()` (recommend.ts, line 313)

**Purpose:** Generate basic program suggestions (like ChatGPT)

**Input:**
- User answers (location, company_type, funding_amount, etc.)

**LLM Prompt:**
```
You are an expert on European funding programs.
Based on this user profile, suggest 20 relevant funding programs:
[User profile summary]

For each program, provide:
- name, institution, funding_amount_min/max, location, 
  company_type, industry_focus, deadline, website, description
```

**Output:** Array of basic program objects:
```typescript
[
  {
    name: "FFG General Programme",
    institution: "Austrian Research Promotion Agency",
    funding_amount_min: 50000,
    funding_amount_max: 500000,
    location: "Austria",
    company_type: "startup",
    industry_focus: ["digital", "technology"],
    deadline: null,
    open_deadline: true,
    website: "https://www.ffg.at",
    description: "Supports research and innovation..."
  },
  // ... more programs
]
```

**This is LLM Call #1** ✅

---

### Step 4: Second LLM Call - Extract Requirements
**Function:** `extractWithLLM()` (llmExtract.ts, line 167)

**Purpose:** Extract detailed requirements (15 categories) from each program

**Called For:** Each program generated in Step 3

**Input:**
```typescript
{
  text: "Program Name: FFG General Programme\nInstitution: ...\nDescription: ...",
  url: "https://www.ffg.at",
  title: "FFG General Programme",
  description: "Supports research and innovation..."
}
```

**LLM Prompt:** (from llmExtract.ts)
```
Extract ALL requirements from this funding program:
[Program text]

Extract 15 categories:
1. Geographic eligibility
2. Eligibility (company type, stage, age)
3. Financial (funding amounts, co-financing, revenue)
4. Team (size, experience, roles)
5. Project (industry focus, sector, TRL level)
6. Timeline (deadlines, duration, milestones)
7. Documents (required documents)
8. Technical (technical requirements)
9. Legal (legal/compliance requirements)
10. Impact (environmental, social, economic)
11. Application (application process)
12. Funding Details (use of funds, restrictions)
13. Restrictions (eligibility restrictions)
14. Terms (terms and conditions)
15. Compliance (compliance requirements)
```

**Output:** Detailed requirements structure:
```typescript
{
  categorized_requirements: {
    geographic: [{ type: "location", value: "Austria", confidence: 0.9 }],
    eligibility: [{ type: "company_type", value: "startup", confidence: 0.85 }],
    financial: [{ type: "co_financing", value: "20% required", confidence: 0.8 }],
    // ... 12 more categories
  },
  metadata: {
    funding_amount_min: 50000,
    funding_amount_max: 500000,
    currency: "EUR",
    deadline: null,
    open_deadline: true,
    // ... more metadata
  }
}
```

**This is LLM Call #2 (per program)** ✅

**So for 5 programs = 6 LLM calls total (1 generation + 5 extractions)**

---

### Step 5: Combine Results
**Location:** recommend.ts (line 775-853)

**What Happens:**
```typescript
const programsWithRequirements = await Promise.all(
  programs.map(async (p, index) => {
    // Call extractWithLLM for each program
    const extractedRequirements = await extractWithLLM({...});
    
    // Combine basic program + extracted requirements
    return {
      id: `llm_${p.name}`,
      name: p.name,
      url: p.website,
      metadata: extractedRequirements?.metadata || basicMetadata,
      categorized_requirements: extractedRequirements?.categorized_requirements || basicRequirements,
      source: 'llm_generated'
    };
  })
);
```

---

### Step 6: Return to Frontend
**Response:**
```typescript
{
  success: true,
  programs: [
    {
      id: "llm_ffg_general_programme",
      name: "FFG General Programme",
      url: "https://www.ffg.at",
      metadata: { ... },
      categorized_requirements: {
        geographic: [...],
        eligibility: [...],
        // ... 15 categories
      },
      source: "llm_generated"
    },
    // ... more programs
  ],
  count: 5,
  extraction_results: [...]
}
```

---

### Step 7: Frontend Processing
**Location:** ProgramFinder.tsx (line 345-491)

**What Happens:**
1. Receives programs from API
2. Converts to Program format
3. Scores programs using `scoreProgramsEnhanced()`
4. Filters (score > 0)
5. Sorts by score
6. Displays top 5

---

### Step 8: User Selects Program → Editor
**Location:** ProgramFinder.tsx (line 504-532)

**What Gets Stored:**
```typescript
const programData = {
  id: program.id,
  name: program.name,
  categorized_requirements: program.categorized_requirements || {},  // ⭐ KEY DATA
  type: program.type || 'grant',
  url: program.url,
  selectedAt: new Date().toISOString(),
  metadata: {
    funding_amount_min: program.amount?.min,
    funding_amount_max: program.amount?.max,
    currency: 'EUR',
  }
};

localStorage.setItem('selectedProgram', JSON.stringify(programData));
```

**Data Transmitted to Editor:**
- ✅ `categorized_requirements` - **15 categories** (geographic, eligibility, financial, etc.)
- ✅ `metadata` - Funding amounts, deadlines, descriptions
- ✅ `id`, `name`, `type`, `url` - Basic program info

---

## 🔍 Why Two Parses?

### Current Design Rationale:
1. **Separation of Concerns:**
   - `generateProgramsWithLLM()` = Generate program suggestions (like ChatGPT)
   - `extractWithLLM()` = Extract detailed requirements (structured data)

2. **Reusability:**
   - `extractWithLLM()` can be used for:
     - LLM-generated programs (current use)
     - Seed URL extraction (optional)
     - Any program description text

3. **Quality:**
   - First call: Generate diverse program suggestions
   - Second call: Extract comprehensive requirements for each

### But It's Inefficient:
- **6 LLM calls** for 5 programs (1 generation + 5 extractions)
- **Sequential extraction** (could be parallel)
- **Double cost** (2x API calls per program)

---

## 💡 Optimization Opportunities

### Option 1: Single LLM Call (Recommended)
**Combine generation + extraction in one prompt:**

```typescript
// New function: generateProgramsWithRequirements()
const prompt = `
Generate 5 funding programs AND extract detailed requirements for each:

User Profile: [answers]

For each program, provide:
1. Basic info: name, institution, funding amounts, etc.
2. Detailed requirements (15 categories):
   - geographic, eligibility, financial, team, project, 
     timeline, documents, technical, legal, impact, 
     application, funding_details, restrictions, terms, compliance

Return JSON with programs array, each containing both basic info AND categorized_requirements.
`;
```

**Benefits:**
- ✅ 1 LLM call instead of 6
- ✅ Faster response time
- ✅ Lower cost
- ✅ Atomic operation (all data in one response)

**Trade-offs:**
- ⚠️ Larger prompt (more tokens)
- ⚠️ More complex response parsing
- ⚠️ Less modular (can't reuse extractWithLLM separately)

---

### Option 2: Parallel Extraction
**Keep two calls but make extraction parallel:**

```typescript
// Current: Sequential (slow)
for (const program of programs) {
  const extracted = await extractWithLLM(program);  // Wait for each
}

// Optimized: Parallel (fast)
const extractedPrograms = await Promise.all(
  programs.map(p => extractWithLLM(p))  // All at once
);
```

**Benefits:**
- ✅ Faster (5 extractions in parallel)
- ✅ Still modular
- ✅ Can reuse extractWithLLM

**Trade-offs:**
- ⚠️ Still 6 LLM calls total
- ⚠️ Higher concurrent load on LLM API

---

### Option 3: Cache Extraction Results
**Cache extracted requirements by program name/description:**

```typescript
const cache = new Map<string, ExtractedRequirements>();

async function getCachedExtraction(programText: string) {
  const hash = hashProgramText(programText);
  if (cache.has(hash)) {
    return cache.get(hash);
  }
  const extracted = await extractWithLLM({ text: programText });
  cache.set(hash, extracted);
  return extracted;
}
```

**Benefits:**
- ✅ Avoid re-extracting same programs
- ✅ Faster for repeated requests

**Trade-offs:**
- ⚠️ Memory usage
- ⚠️ Cache invalidation complexity

---

## 📋 Data Transmission to Editor

### What Gets Transmitted:

```typescript
// Stored in localStorage as 'selectedProgram'
{
  id: "llm_ffg_general_programme",
  name: "FFG General Programme",
  categorized_requirements: {
    // ⭐ 15 CATEGORIES - This is what editor needs
    geographic: [
      { type: "location", value: "Austria", confidence: 0.9 }
    ],
    eligibility: [
      { type: "company_type", value: "startup", confidence: 0.85 },
      { type: "company_stage", value: "early_stage", confidence: 0.8 }
    ],
    financial: [
      { type: "co_financing", value: "20% required", confidence: 0.8 },
      { type: "funding_rate", value: "up to 80%", confidence: 0.75 }
    ],
    team: [
      { type: "team_size", value: "minimum 2 people", confidence: 0.7 }
    ],
    project: [
      { type: "industry_focus", value: "digital, technology", confidence: 0.85 }
    ],
    timeline: [
      { type: "deadline", value: "2024-12-31", confidence: 0.9 },
      { type: "duration", value: "12-24 months", confidence: 0.8 }
    ],
    documents: [
      { type: "required_documents", value: "Business plan, CV, project description", confidence: 0.9 }
    ],
    technical: [
      { type: "technical_requirement", value: "TRL level 4-6", confidence: 0.75 }
    ],
    legal: [
      { type: "legal_requirement", value: "Must be registered in Austria", confidence: 0.9 }
    ],
    impact: [
      { type: "economic_impact", value: "Job creation, regional growth", confidence: 0.8 }
    ],
    application: [
      { type: "application_process", value: "Online application via FFG portal", confidence: 0.9 }
    ],
    funding_details: [
      { type: "use_of_funds", value: "Personnel, equipment, R&D", confidence: 0.85 }
    ],
    restrictions: [
      { type: "restrictions", value: "No funding for pure marketing projects", confidence: 0.8 }
    ],
    terms: [
      { type: "terms", value: "Reporting required every 6 months", confidence: 0.75 }
    ],
    compliance: [
      { type: "compliance_requirement", value: "EU state aid rules apply", confidence: 0.9 }
    ]
  },
  type: "grant",
  url: "https://www.ffg.at",
  selectedAt: "2024-01-15T10:30:00.000Z",
  metadata: {
    funding_amount_min: 50000,
    funding_amount_max: 500000,
    currency: "EUR"
  }
}
```

### What Editor Uses:

**Location:** `features/editor/engine/aiHelper.ts` (line 74-101)

**Current Implementation:**
```typescript
// Editor expects this format:
structuredRequirements = {
  editor: programData.categorized_requirements.editor || [],      // ⚠️ MISSING
  library: programData.categorized_requirements.library || [],    // ⚠️ MISSING
  decision_tree: programData.categorized_requirements.decision_tree || []  // ⚠️ MISSING
};
```

**Problem:** Editor expects `editor[]`, `library[]`, `decision_tree[]`, but we extract `geographic[]`, `eligibility[]`, etc.

**Solution Needed:** Mapping function to convert 15 categories → editor format

---

## 🎯 Summary

### Current Architecture:
```
Frontend → /api/programs/recommend (recommend.ts)
                ↓
         generateProgramsWithLLM() [LLM Call #1]
                ↓
         Array of basic programs
                ↓
         For each program:
           extractWithLLM() [LLM Call #2-N]
                ↓
         Combined programs with requirements
                ↓
         Return to frontend
                ↓
         Score, filter, display
                ↓
         User selects → localStorage → Editor
```

### Key Points:
1. ✅ **recommend.ts** is the API endpoint (connected to frontend)
2. ✅ **llmExtract.ts** is a utility function (used by recommend.ts)
3. ⚠️ **Yes, we parse twice** (1 generation + N extractions)
4. ⚠️ **Inefficient** but intentional (could be optimized)
5. ✅ **Data transmitted:** `categorized_requirements` (15 categories) + metadata
6. ⚠️ **Editor format mismatch:** Needs mapping function

### Recommendations:
1. **Short term:** Implement parallel extraction (Option 2)
2. **Medium term:** Create mapping function (15 categories → editor format)
3. **Long term:** Consider single LLM call (Option 1) for better performance

---

## 📝 Next Steps

1. **Document the mapping function** - How to convert 15 categories to editor format
2. **Implement parallel extraction** - Speed up current flow
3. **Test single LLM call approach** - Evaluate if it's better
4. **Update editor** - Use extracted requirements effectively

---

**Last Updated:** 2024-01-XX
**Status:** Current flow documented, optimizations identified

