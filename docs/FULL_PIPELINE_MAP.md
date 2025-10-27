# Full Pipeline Map

## Data Flow (From Scraper to Results)

### Step 1: Data Collection
**File:** `src/lib/webScraperService.ts`
- Scrapes funding programs from websites
- Extracts eligibility_criteria
- Saves to JSON: `data/scraped-programs-2025-10-23.json`

### Step 2: Data Processing
**File:** `src/lib/enhancedDataPipeline.ts`
- Processes scraped data
- Adds AI enhancements (target_personas, tags, etc.)
- Creates categorized_requirements from eligibility_criteria

### Step 3: Data Source
**File:** `src/lib/dataSource.ts`
- Provides programs to the application
- Methods: `getPrograms()`, `getGPTEnhancedPrograms()`
- Falls back to API or JSON

### Step 4: API Layer
**File:** `pages/api/programs.ts`
- Endpoint that serves programs
- Reads from JSON files or database
- Returns programs with eligibility_criteria

### Step 5: QuestionEngine Initialization
**File:** `src/lib/questionEngine.ts`
- Receives programs from API (`/api/programs?enhanced=true`)
- Calls `analyzeEligibilityCriteria()` on ALL programs
- Generates questions based on what's in eligibility_criteria
- Questions are created ONCE at initialization
- Questions are stored in `this.questions` array

### Step 6: Wizard Initialization
**File:** `src/components/wizard/SmartWizard.tsx`
- Calls `questionEngine.getFirstQuestion()`
- Displays first question to user

### Step 7: User Answers
**File:** `src/components/wizard/SmartWizard.tsx` - `handleAnswer()`
- User submits answer
- Answer stored in `state.answers`
- Calls `questionEngine.getNextQuestionEnhanced(answers)`
- Gets next question and displays it

### Step 8: Question Selection
**File:** `src/lib/questionEngine.ts` - `getNextQuestionEnhanced()`
- **OLD:** Returned first unanswered question
- **NEW:** Scores all unanswered questions, returns highest scoring one
- Uses `applyMajorFilters()` to narrow program pool
- Uses `shouldShowQuestion()` to check conditional logic
- Uses `calculateInformationValue()` to score questions

### Step 9: When No More Questions
**File:** `src/components/wizard/SmartWizard.tsx`
- Calls `processResults(answers)`
- Calls `scoreProgramsEnhanced(answers)`

### Step 10: Program Scoring
**File:** `src/lib/enhancedRecoEngine.ts` - `scoreProgramsEnhanced()`
- Gets ALL programs from dataSource
- Applies major filters (location, funding_type, organization_type)
- Scores each program against user answers
- Returns sorted list of top programs

## Key Issues Identified

### Issue 1: Questions Generated Once
- Questions are created at initialization
- They don't change based on user answers
- All questions are available from the start

### Issue 2: No Progressive Filtering
- Programs are filtered at the end (scoreProgramsEnhanced)
- Not filtered during questions
- User doesn't see how their answers affect results

### Issue 3: No Feedback Loop
- QuestionEngine doesn't know which programs match
- Can't adjust questions based on what's left
- Questions are static, not dynamic

### Issue 4: Conditional Logic Exists But Limited
- skipConditions field exists but:
  - Only 2 questions use it (location, company_age)
  - Doesn't create true branching
  - Mostly just filters question order

## What SHOULD Happen

### Ideal Flow:
1. Initialize with ALL programs (100 programs)
2. Ask Q1 (location) → Filter to 45 programs
3. Ask Q2 (company_age) based on what's relevant to those 45 programs
4. Filter to 20 programs
5. Ask Q3 (revenue) based on what's relevant to those 20 programs
6. Continue until ~10-15 programs remain

### Current Flow:
1. Initialize with ALL programs (100 programs)
2. Ask Q1 (location) - no filtering shown
3. Ask Q2 (company_age) - no filtering shown
4. Ask Q3 (revenue) - no filtering shown
5. ...
6. At the end, filter to 100 → 10 programs

## Root Cause

The wizard generates questions from ALL programs upfront, not based on what's RELEVANT to the user's current answers.

Questions should be generated DYNAMICALLY based on:
1. What programs are still in the pool
2. What eligibility criteria those programs have
3. What questions would best narrow down that pool

## Next Steps to Fix

1. Add program counting to QuestionEngine
2. Show user how many programs match after each answer
3. Generate/select questions based on remaining programs
4. Stop asking when enough programs are identified (10-15)
5. Add progressive filtering display to UI

