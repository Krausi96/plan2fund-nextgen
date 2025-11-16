# ProgramFinder → Editor Data Flow Handover & Testing Guide

## 🎯 Overview

This document explains the complete data flow from ProgramFinder (Q&A → LLM extraction → Results) to Editor, what data is extracted, how it's transmitted, and how to test the system.

---

## 📊 Complete Data Flow

### Step 1: User Answers Questions in ProgramFinder
**Location:** `features/reco/components/ProgramFinder.tsx`

- User fills out Q&A form (12 core questions)
- Answers stored in component state: `answers: Record<string, any>`
- Minimum 3 questions required to generate results
- User clicks "Generate" button → triggers `updateGuidedResults()`

**Key Questions:**
- `location` - Geographic eligibility
- `company_type` - Startup, SME, Large, etc.
- `company_stage` - Age/maturity stage
- `funding_amount` - Funding need (EUR)
- `industry_focus` - Industry sectors
- `co_financing` - Co-financing capability
- `team_size` - Number of employees
- `project_duration` - Project timeline
- `deadline_urgency` - Urgency level
- `use_of_funds` - How funds will be used
- `impact` - Expected impact
- `location_region` - Specific region (optional)

---

### Step 2: API Call - Generate Programs
**Location:** `pages/api/programs/recommend.ts`

**Request:**
```typescript
POST /api/programs/recommend
{
  answers: {
    location: "Austria",
    company_type: "startup",
    funding_amount: 50000,
    // ... other answers
  },
  max_results: 5,
  extract_all: false, // Filter by answers
  use_seeds: false    // Use seed URLs (optional)
}
```

**Process:**
1. **LLM Generation** (Primary method - like ChatGPT):
   - Calls `generateProgramsWithLLM()` with user answers
   - LLM generates program suggestions based on user profile
   - Returns JSON with program names, descriptions, funding amounts, etc.

2. **Deep Requirement Extraction** (For each generated program):
   - For each LLM-generated program, calls `extractWithLLM()` with program description
   - Extracts **15 comprehensive requirement categories**:
     - `geographic` - Location requirements
     - `eligibility` - Company type, stage, age requirements
     - `financial` - Funding amounts, co-financing, revenue
     - `team` - Team size, experience, roles
     - `project` - Industry focus, sector, TRL level
     - `timeline` - Deadlines, duration, milestones
     - `documents` - Required documents
     - `technical` - Technical requirements
     - `legal` - Legal/compliance requirements
     - `impact` - Environmental, social, economic impact
     - `application` - Application process
     - `funding_details` - Use of funds, restrictions
     - `restrictions` - Eligibility restrictions
     - `terms` - Terms and conditions
     - `compliance` - Compliance requirements

3. **Optional: Seed URL Extraction** (If enabled):
   - Fetches HTML from seed URLs
   - Extracts requirements using same `extractWithLLM()` logic
   - Filters by user answers using normalization matching

**Response:**
```typescript
{
  success: true,
  programs: [
    {
      id: "llm_program_name",
      name: "Program Name",
      url: "https://...",
      institution_id: "llm_institution",
      funding_types: ["grant"],
      metadata: {
        description: "Program description...",
        funding_amount_min: 10000,
        funding_amount_max: 500000,
        currency: "EUR",
        deadline: "2024-12-31",
        open_deadline: false,
        region: "Austria",
        // ... other metadata
      },
      categorized_requirements: {
        geographic: [
          { type: "location", value: "Austria", confidence: 0.9 }
        ],
        eligibility: [
          { type: "company_type", value: "startup", confidence: 0.85 }
        ],
        financial: [
          { type: "co_financing", value: "20% required", confidence: 0.8 }
        ],
        // ... 12 more categories
      },
      source: "llm_generated",
      extracted_at: "2024-01-01T00:00:00.000Z"
    }
  ],
  count: 5,
  extraction_results: [
    {
      source: "llm_generated",
      message: "Generated 5 programs using LLM"
    }
  ]
}
```

---

### Step 3: Scoring & Display
**Location:** `features/reco/components/ProgramFinder.tsx` (lines 436-464)

**Process:**
1. Programs converted to `Program` format
2. Scored using `scoreProgramsEnhanced()` from `enhancedRecoEngine.ts`
3. Filtered: Only programs with `score > 0`
4. Sorted: Highest score first
5. Top 5 displayed to user

**Display Format:**
- Program name
- Description (from metadata)
- Funding amount range
- Score (0-100)
- Match reasons
- "Select" button

**Storage:**
```typescript
// Stored in localStorage
localStorage.setItem('recoResults', JSON.stringify(scored));
localStorage.setItem('userAnswers', JSON.stringify(answers));
```

---

### Step 4: User Selects Program
**Location:** `features/reco/components/ProgramFinder.tsx` (lines 504-532)

**What Happens:**
```typescript
handleProgramSelect(program: EnhancedProgramResult) {
  const programData = {
    id: program.id,
    name: program.name,
    categorized_requirements: program.categorized_requirements || {},
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
  router.push('/editor?product=submission');
}
```

**Key Data Transmitted:**
- `id` - Program identifier
- `name` - Program name
- `categorized_requirements` - **15 categories of extracted requirements** (CRITICAL for editor)
- `type` - Program type (grant, loan, etc.)
- `url` - Program website
- `metadata` - Funding amounts, deadlines, etc.

---

### Step 5: Editor Reads Program Data
**Location:** `features/editor/components/Editor.tsx` (lines 114-147, 282-307)

**What Happens:**
1. Editor loads on `/editor?product=submission`
2. Reads from localStorage:
   ```typescript
   const storedProgram = JSON.parse(localStorage.getItem('selectedProgram') || 'null');
   ```
3. Validates timestamp (expires after 1 hour)
4. Displays program name in header
5. Passes `categorized_requirements` to AI helper

**Editor Usage:**
**Location:** `features/editor/engine/aiHelper.ts` (lines 74-101)

```typescript
// Editor converts categorized_requirements to structured format
structuredRequirements = {
  editor: programData.categorized_requirements.editor || [],
  library: programData.categorized_requirements.library || [],
  decision_tree: programData.categorized_requirements.decision_tree || []
};

// Uses structured requirements to enhance AI prompts
const prompt = buildSectionPromptWithStructured(section, context, program, structuredRequirements);
const sectionGuidance = getSectionGuidanceFromStructured(section, structuredRequirements);
const complianceTips = getComplianceTipsFromStructured(section, structuredRequirements);
```

**What Editor Expects:**
- `categorized_requirements.editor[]` - Section-specific requirements
  - `section_name` - Maps to section template
  - `prompt` - Enhanced prompt for that section
  - `hints` - Additional guidance
  - `word_count_min/max` - Word count limits
  - `ai_guidance` - AI-specific instructions
  - `template` - Template structure

- `categorized_requirements.library[]` - Compliance requirements
- `categorized_requirements.decision_tree[]` - Decision tree questions

**Current Issue:**
- `extractWithLLM()` extracts 15 categories (geographic, eligibility, financial, etc.)
- Editor expects `editor`, `library`, `decision_tree` categories
- **Mismatch:** Need to map extracted categories to editor format

---

## 🔍 What Data is Extracted?

### By `extractWithLLM()` (15 Categories)
**Location:** `features/reco/engine/llmExtract.ts`

1. **geographic** - Location, regions, countries
2. **eligibility** - Company type, stage, age, size
3. **financial** - Funding amounts, co-financing, revenue
4. **team** - Team size, experience, roles
5. **project** - Industry focus, sector, TRL level
6. **timeline** - Deadlines, duration, milestones
7. **documents** - Required documents
8. **technical** - Technical requirements
9. **legal** - Legal/compliance requirements
10. **impact** - Environmental, social, economic impact
11. **application** - Application process
12. **funding_details** - Use of funds, restrictions
13. **restrictions** - Eligibility restrictions
14. **terms** - Terms and conditions
15. **compliance** - Compliance requirements

**Format:**
```typescript
categorized_requirements: {
  geographic: [
    { type: "location", value: "Austria", confidence: 0.9, description: "..." }
  ],
  eligibility: [
    { type: "company_type", value: "startup", confidence: 0.85 }
  ],
  // ... 13 more categories
}
```

### Metadata Extracted
```typescript
metadata: {
  description: "Full program description...",
  funding_amount_min: 10000,
  funding_amount_max: 500000,
  currency: "EUR",
  deadline: "2024-12-31",
  open_deadline: false,
  contact_email: "contact@example.com",
  contact_phone: "+43...",
  region: "Austria",
  funding_types: ["grant"],
  program_focus: ["digital", "sustainability"]
}
```

---

## 🆚 Comparison: Our System vs ChatGPT

### Our System (ProgramFinder)
✅ **Advantages:**
- **Structured extraction** - 15 categories of requirements
- **Scoring system** - Matches programs to user answers
- **Deep requirements** - Extracts detailed eligibility, financial, technical requirements
- **Editor integration** - Requirements enhance AI prompts in editor
- **Normalization** - Consistent matching across variations
- **Seed URL support** - Can extract from real program websites

❌ **Limitations:**
- Requires LLM API key (OpenAI or custom)
- Slower than ChatGPT (extraction step adds latency)
- More complex (multiple steps: generation → extraction → scoring)

### ChatGPT
✅ **Advantages:**
- Fast, conversational
- No API setup needed (if using web interface)
- Flexible, can ask follow-up questions

❌ **Limitations:**
- No structured data extraction
- No scoring/matching system
- No editor integration
- Manual copy-paste required

**Verdict:** Our system is **better for structured data extraction and editor integration**, but ChatGPT is faster for quick questions.

---

## 📋 Testing Checklist

### 1. Test ProgramFinder → API Flow
- [ ] Fill out Q&A form (minimum 3 questions)
- [ ] Click "Generate" button
- [ ] Verify API call to `/api/programs/recommend`
- [ ] Check console for LLM generation logs
- [ ] Verify programs are returned (should be 5)
- [ ] Check that `categorized_requirements` is populated (15 categories)
- [ ] Verify programs are scored and displayed

### 2. Test Data Extraction
- [ ] Check browser console for extraction logs:
  ```
  ✅ Extracted detailed requirements for [program name]
  ```
- [ ] Verify `categorized_requirements` has data:
  ```javascript
  console.log(programs[0].categorized_requirements);
  // Should show: geographic, eligibility, financial, etc.
  ```
- [ ] Check `metadata` is populated:
  ```javascript
  console.log(programs[0].metadata);
  // Should show: description, funding_amount_min/max, deadline, etc.
  ```

### 3. Test Program Selection → Editor
- [ ] Click "Select" on a program
- [ ] Verify `localStorage.getItem('selectedProgram')` is set
- [ ] Check data structure:
  ```javascript
  const program = JSON.parse(localStorage.getItem('selectedProgram'));
  console.log(program.categorized_requirements);
  ```
- [ ] Navigate to `/editor?product=submission`
- [ ] Verify program name appears in editor header
- [ ] Check editor console for program data loading

### 4. Test Editor Integration
- [ ] Open a section in editor
- [ ] Click "Generate" for AI content
- [ ] Check if `categorized_requirements` is used:
  ```javascript
  // In aiHelper.ts, should see:
  structuredRequirements = {
    editor: programData.categorized_requirements.editor || [],
    // ...
  };
  ```
- [ ] Verify AI prompts are enhanced with program requirements

### 5. Test Error Cases
- [ ] Test with no LLM API key (should show error)
- [ ] Test with invalid answers (should handle gracefully)
- [ ] Test with expired program selection (should clear after 1 hour)
- [ ] Test with no programs returned (should show message)

---

## 🔧 Current Issues & Solutions

### Issue 1: Category Mismatch
**Problem:** `extractWithLLM()` extracts 15 categories (geographic, eligibility, etc.), but editor expects `editor`, `library`, `decision_tree`.

**Current Workaround:**
- Editor checks for `categorized_requirements.editor[]` first
- Falls back to API call if not found
- **Editor may not use extracted requirements effectively**

**Solution Needed:**
- Map extracted categories to editor format, OR
- Update editor to use extracted categories directly

### Issue 2: Data Transmission
**Current:** localStorage-based (works, but not ideal for multi-tab)
**Better:** Could use URL params or API endpoint

### Issue 3: Editor Requirements Format
**Current:** Editor expects specific structure:
```typescript
{
  editor: [{ section_name, prompt, hints, word_count_min/max }],
  library: [{ compliance_requirements }],
  decision_tree: []
}
```

**Extracted Format:**
```typescript
{
  geographic: [{ type, value, confidence }],
  eligibility: [{ type, value, confidence }],
  // ... 13 more categories
}
```

**Solution:** Need mapping function or update editor to use extracted format.

---

## 📁 Key Files

### ProgramFinder
- `features/reco/components/ProgramFinder.tsx` - Main Q&A component
- `pages/api/programs/recommend.ts` - API endpoint for program generation
- `features/reco/engine/llmExtract.ts` - LLM extraction logic (15 categories)
- `features/reco/engine/enhancedRecoEngine.ts` - Scoring engine
- `features/reco/engine/normalization.ts` - Answer normalization & matching

### Editor
- `features/editor/components/Editor.tsx` - Main editor component
- `features/editor/engine/aiHelper.ts` - AI helper (uses program requirements)
- `shared/user/storage/planStore.ts` - localStorage utilities

### Data Flow
1. ProgramFinder → `/api/programs/recommend` → `extractWithLLM()` → Results
2. User selects program → `localStorage.setItem('selectedProgram')`
3. Editor loads → `localStorage.getItem('selectedProgram')` → AI helper

---

## ✅ Success Criteria

**ProgramFinder Works If:**
- ✅ Generates 5 programs when user answers 3+ questions
- ✅ Programs have `categorized_requirements` with 15 categories
- ✅ Programs are scored and sorted by relevance
- ✅ User can select a program

**Editor Integration Works If:**
- ✅ Selected program appears in editor header
- ✅ `categorized_requirements` is passed to AI helper
- ✅ AI prompts are enhanced with program requirements
- ✅ Generated content reflects program requirements

**Data Extraction Works If:**
- ✅ `extractWithLLM()` extracts 15 categories from program descriptions
- ✅ Each category has `type`, `value`, `confidence`
- ✅ Metadata includes funding amounts, deadlines, descriptions
- ✅ Requirements are meaningful (not just single words)

---

## 🚀 Next Steps

1. **Test the flow end-to-end** - Follow testing checklist above
2. **Verify extraction quality** - Check if extracted requirements are meaningful
3. **Fix category mapping** - Map extracted categories to editor format
4. **Improve error handling** - Better messages for LLM failures
5. **Add logging** - Track extraction success rate
6. **Optimize performance** - Reduce latency in extraction step

---

## 📞 Questions?

- **LLM not working?** Check `OPENAI_API_KEY` or `CUSTOM_LLM_ENDPOINT` env vars
- **No programs returned?** Check browser console for API errors
- **Editor not using requirements?** Check `categorized_requirements.editor[]` structure
- **Programs not matching?** Check normalization functions in `normalization.ts`

