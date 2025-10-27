# Complete Data Flow - Web Scraper to SmartWizard

## The Complete Pipeline

### Layer 0: Data Collection (Web Scraper)

**File:** `src/lib/webScraperService.ts`

**What it does:**
- Scrapes funding programs from 15+ institutions (AWS, FFG, VBA, etc.)
- Extracts key information: name, description, funding amounts, deadlines
- Extracts **eligibility_criteria** from program pages

**What eligibility_criteria looks like:**
```typescript
{
  min_team_size: 2,        // Minimum team members
  max_company_age: 5,       // Maximum age in years
  location: "Austria",      // Geographic eligibility
  revenue_min: 50000,      // Minimum revenue
  revenue_max: 500000,     // Maximum revenue
  industry_focus: "tech",   // Industry sector
  research_focus: true,     // Requires research component
  international_collaboration: true  // Requires consortium
}
```

**Output:**
- Saves to `data/scraped-programs-2025-10-23.json`
- 503 programs with eligibility_criteria

---

### Layer 1: Data Pipeline

**File:** `src/lib/enhancedDataPipeline.ts`

**What it does:**
- Normalizes scraped data
- Cleans and standardizes eligibility_criteria
- Can add AI enhancements (but this is disabled currently)

**Preserves:**
- `eligibility_criteria` - Used for filtering
- `categorized_requirements` - Used for scoring

**Currently:** Actually reads directly from JSON, bypasses pipeline

---

### Layer 2: API Layer

**File:** `pages/api/programs.ts`

**What it does:**
- Reads programs from JSON file or database
- Serves them as API endpoint
- Transforms eligibility_criteria → categorized_requirements

**Output:**
```typescript
GET /api/programs?enhanced=true
→ Returns 503 programs with:
  - eligibility_criteria (for filtering)
  - categorized_requirements (for scoring)
  - target_personas, tags, etc.
```

---

### Layer 3: QuestionEngine Initialization

**File:** `src/lib/questionEngine.ts`

**What it does:**
- Receives ALL 503 programs
- Calls `analyzeEligibilityCriteria()` on ALL programs
- Extracts common eligibility requirements
- Generates questions based on frequency

**Example:**
```typescript
// Finds: 200 programs need location, 150 need team_size, etc.
// Creates questions:
[
  { id: 'location', options: ['austria', 'germany', 'eu'] },
  { id: 'team_size', options: ['1-2', '3-5', '6+'] },
  { id: 'company_age', options: ['under_2', '2-5', '5+'] },
  // ... etc
]
```

**Output:**
- Array of 8-10 questions (created once at init)

---

### Layer 4: SmartWizard - Question Display

**File:** `src/components/wizard/SmartWizard.tsx`

**Flow:**
1. Fetches 503 programs from API
2. Creates QuestionEngine with programs
3. Gets first question
4. Shows to user
5. Waits for answer

---

### Layer 5: User Answers

**File:** `src/components/wizard/SmartWizard.tsx` - `handleAnswer()`

**Flow:**
```typescript
User answers Q1: location = "Austria"
↓
SmartWizard calls: questionEngine.applyMajorFilters(answers)
↓
Filters programs: 503 → 234 programs
↓
Gets next question from QuestionEngine
↓
Shows Q2 to user
```

**Current behavior:** Questions are pre-generated, just selected in order

---

### Layer 6: Scoring at End

**File:** `src/lib/enhancedRecoEngine.ts` - `scoreProgramsEnhanced()`

**What it does (ONLY AT THE END):**
1. Gets ALL programs from dataSource
2. Applies major filters (location, type, etc.)
3. Scores each program against user answers
4. Returns top programs

**This happens AFTER all questions are answered**

---

## The Problem: No Feedback Loop

### Current Flow (Linear):
```
START: 503 programs
  ↓
Q1 (location) → Answer → 234 programs (but wizard doesn't regenerate questions)
  ↓
Q2 (company_age) → Answer → 180 programs (same questions shown)
  ↓
Q3 (revenue) → Answer → 150 programs (same questions shown)
  ↓
...
Q6 → Answers complete
  ↓
Score all programs (503 → 50)
```

### What SHOULD Happen (Conditional):
```
START: 503 programs
  ↓
Q1 (location) → Answer "Austria" → 234 programs
  ↓
Check what those 234 programs need → Generate relevant Q2
  ↓
Q2 (specific to Austrian programs) → Answer → 120 programs
  ↓
Check what those 120 programs need → Generate relevant Q3
  ↓
... (questions adapt to what's left)
```

---

## How SmartWizard SHOULD Work

### Phase 1: Broad Filtering (Reduce Pool Significantly)

**Questions:** Location, Organization Type
**Purpose:** Filter out 70-80% of programs

**Logic:**
- If Location = Austria: → Ask Austria-specific questions
- If Location = Germany: → Ask Germany-specific questions
- If Organization = Startup: → Ask startup-specific questions

### Phase 2: Conditional Questions (Based on What's Left)

**Questions:** Generated dynamically based on remaining programs

**Example:**
- After Austria filter: 234 programs remain
- Check: What do these 234 programs commonly require?
  - 150 programs need team_size → Ask team_size next
  - 80 programs need company_age → Ask company_age next
- Ask whichever narrows the pool most

### Phase 3: Final Refinement

**Questions:** Very specific to remaining programs
- Only 50 programs left? Ask program-specific questions

---

## Data Transformation Needed

### From: eligibility_criteria (Raw)
```typescript
{
  location: "Austria",
  min_team_size: 2,
  max_company_age: 5
}
```

### To: Questions (SmartWizard)
```typescript
{
  id: "location",
  symptom: "Where are you located?",
  options: ["Austria", "Germany", "EU"],
  // This should filter programs
}
```

### To: Filtering Logic
```typescript
// After user answers "Austria"
filtered = programs.filter(p => 
  p.eligibility_criteria?.location?.toLowerCase().includes("austria")
)
```

### To: Next Question Selection
```typescript
// After filtering to 234 programs, find what they need:
const needs = remainingPrograms.map(p => p.eligibility_criteria)
const commonNeed = findMostCommon(needs) // e.g., team_size
// Ask that question next
```

---

## What Needs to Be Wired

### 1. QuestionEngine → Progressive Filtering

**Current:**
```typescript
class QuestionEngine {
  private programs: Program[];  // ALL programs
  getNextQuestion(answers) {
    // Just returns next unanswered question
  }
}
```

**Should be:**
```typescript
class QuestionEngine {
  private programs: Program[];
  private remainingPrograms: Program[];  // Track what's left
  
  getNextQuestion(answers) {
    // Filter programs based on answers
    this.remainingPrograms = this.filterPrograms(answers);
    
    // Generate question relevant to what's left
    const question = this.generateRelevantQuestion(this.remainingPrograms);
    
    return question;
  }
}
```

### 2. SmartWizard → Show Feedback

**Current:**
- Shows question
- No feedback on filtering

**Should be:**
- Shows question
- Shows: "234 programs remaining"
- Updates after each answer

### 3. Conditional Logic → Actually Work

**Current:**
- `skipConditions` exist but don't work
- Questions don't change based on answers

**Should be:**
- After "Austria" → Ask Austrian-specific questions
- After "Startup" → Ask startup-specific questions
- Skip irrelevant questions

---

## The Wiring Plan

### Step 1: Make QuestionEngine Stateful
- Track remaining programs
- Regenerate questions after each answer
- Or: Pre-compute conditional tree

### Step 2: Connect Filtering to Question Selection
- When programs filter → Check what's relevant
- Ask question that narrows most

### Step 3: Implement True Conditional Logic
- Location answer → Different next questions for different locations
- Organization answer → Different questions for different orgs

### Step 4: Remove Dead Code
- IntakeEngine (barely used)
- doctorDiagnostic (only cosmetic)
- Or: Actually use them properly

---

## Next Steps

**Tell me which approach you want:**

1. **Wire the existing pieces** (Fast, 5 hours)
   - Make QuestionEngine stateful
   - Connect filtering to question generation
   - Use existing infrastructure

2. **Simplify + Wire** (Medium, 8 hours)
   - Remove unused IntakeEngine/doctorDiagnostic
   - Clean up interfaces
   - Then wire what's left

3. **Full Conditional Implementation** (Slow, 15 hours)
   - Build proper conditional tree
   - Dynamic question generation
   - Complete rewrite of question logic

**My recommendation:** Start with #1, see if it works, then simplify if needed.

What do you want to do?

