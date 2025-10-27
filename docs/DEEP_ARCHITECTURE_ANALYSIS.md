# Deep Architecture Analysis

## The Full System (7 Components)

### 1. SmartWizard Component
**File:** `src/components/wizard/SmartWizard.tsx`
**Purpose:** UI component that displays questions to user
**What it does:**
- Fetches programs from API on mount
- Creates IntakeEngine and QuestionEngine instances
- Displays questions from QuestionEngine
- Collects user answers
- Calls `scoreProgramsEnhanced` when done
- Shows results

**State:** 39+ fields managing UI state, validation, navigation, etc.

### 2. QuestionEngine
**File:** `src/lib/questionEngine.ts`
**Purpose:** Generates questions from program eligibility criteria
**What it does:**
- Takes ALL programs in constructor
- Analyzes `eligibility_criteria` from programs
- Creates questions based on common criteria
- Returns questions in a list
- Has conditional logic framework (skipConditions) but barely used

**Key Methods:**
- `analyzeEligibilityCriteria()` - analyzes all programs upfront
- `getNextQuestionEnhanced()` - returns next question (linear)
- `applyMajorFilters()` - filters programs but doesn't return count

**The Problem:** 
- Questions created ONCE at init from ALL programs
- Not dynamically updated as user answers
- No connection to remaining program pool

### 3. IntakeEngine
**File:** `src/lib/intakeEngine.ts`
**Purpose:** Processes user answers into structured profiles
**What it does:**
- Parses answers into FundingProfile
- Normalizes sector, stage, team size, location
- Detects target group (startup, SME, etc.)
- Maps answers to standard formats

**Status:** Created but barely used in SmartWizard
- Created in SmartWizard init
- Used to parse answers at the end
- Not involved in question generation

### 4. Enhanced Reco Engine
**File:** `src/lib/enhancedRecoEngine.ts`
**Purpose:** Scores programs against user answers
**What it does:**
- Gets ALL programs from dataSource
- Applies major filters (location, funding_type, etc.)
- Scores each program
- Returns sorted list

**Called:** Only at the END of the wizard (processResults)

### 5. DoctorDiagnostic
**File:** `src/lib/doctorDiagnostic.ts`
**Purpose:** Makes medical-style diagnosis from symptoms
**What it does:**
- Converts answers to "symptoms"
- Makes diagnosis with confidence
- Suggests next questions
- But... doesn't affect question flow during wizard!

**Status:** Used but doesn't control questions
- Called during `scoreProgramsEnhanced`
- Has `nextQuestions` but QuestionEngine doesn't use them
- Just provides diagnosis for explanation

### 6. DataSource
**File:** `src/lib/dataSource.ts`
**Purpose:** Provides programs to other components
**What it does:**
- Fetches programs from API or pipeline
- Returns Program[] with eligibility_criteria
- Has enhanced methods (getGPTEnhancedPrograms)

### 7. API Layer
**File:** `pages/api/programs.ts`
**Purpose:** Serves program data
**What it does:**
- Reads from JSON files or database
- Transforms eligibility_criteria to categorized_requirements
- Returns programs in API format

## The Real Flow

```
START
  ↓
SmartWizard mounts
  ↓
Fetch /api/programs?enhanced=true
  ↓
Get 100 programs with eligibility_criteria
  ↓
QuestionEngine created with ALL 100 programs
  ↓
QuestionEngine.analyzeEligibilityCriteria()
  └─> Generates 8-10 questions based on ALL programs
  ↓
Show Q1 to user
  ↓
User answers
  ↓
Show Q2 to user (based on scoring now)
  ↓
User answers
  ↓
...continues linearly...
  ↓
User finishes (8+ answers)
  ↓
SmartWizard.processResults()
  ↓
scoreProgramsEnhanced(answers, "strict")
  └─> Gets ALL 100 programs again
  └─> Filters to 10 programs
  └─> Scores them
  ↓
Show results
```

## The Core Problem: NO FEEDBACK LOOP

```
┌─────────────────────────────────────────┐
│  QuestionEngine (has questions)         │
│  - Generated from ALL programs          │
│  - Questions never update               │
│  - Doesn't know about filtered pool    │
└─────────────────────────────────────────┘
              ↓
      Returns next question
              ↓
┌─────────────────────────────────────────┐
│  SmartWizard (shows questions)         │
│  - Just displays question              │
│  - Collects answer                      │
│  - Moves to next                        │
└─────────────────────────────────────────┘
              ↓
      All answers
              ↓
┌─────────────────────────────────────────┐
│  enhancedRecoEngine (scores)            │
│  - Gets ALL programs                    │
│  - Filters them NOW                     │
│  - Scores                               │
└─────────────────────────────────────────┘
```

**There is NO connection between:**
- Questions asked
- Programs remaining
- Next question to ask

The wizard is **purely linear** because there's no feedback loop.

## Why It's "Deeply Wired"

### Issue 1: Multiple Engines (Doing Similar Things)
- **QuestionEngine:** Generates questions from programs
- **IntakeEngine:** Processes answers (barely used)
- **enhancedRecoEngine:** Scores programs (only at end)
- **doctorDiagnostic:** Makes diagnosis (decorative)

**They don't talk during the wizard!**

### Issue 2: Questions Generated Once
```typescript
// In QuestionEngine constructor
this.programs = programs;  // ALL programs
this.initializeQuestions();  // Generate ONCE

// Later, getNextQuestion just returns next unanswered
// Doesn't care that programs were filtered
```

### Issue 3: No Progressive Filtering
```typescript
// EnhancedRecoEngine.applyMajorFilters()
// But only called at the END
// Not during question flow

// In getNextQuestionEnhanced(), I added:
const remainingPrograms = this.applyMajorFilters(answers);
console.log(`${remainingPrograms.length} programs remain`);

// But this count is NEVER used to adjust questions!
```

### Issue 4: Hardcoded Question Order
Questions are created based on "importance" score, not what's actually relevant:
```typescript
// Generate questions from eligibility analysis
const questionCandidates = [];
questionCandidates.push({ question: locationQuestion, importance: 100 });
questionCandidates.push({ question: companyAgeQuestion, importance: 90 });
// ... sorted by importance
```

This means EVERYONE gets the same questions in the same order (mostly).

## The Real Complexity

### What SHOULD Happen (True Conditional)
```
After each answer:
1. Filter programs: 100 → 80
2. Check what criteria those 80 programs have
3. Generate relevant questions from THOSE programs
4. Ask best question
5. Repeat
```

### What ACTUALLY Happens (Linear)
```
At start:
1. Get ALL programs
2. Generate ALL questions based on ALL programs
3. Ask in order with minor scoring tweaks
4. At end, filter and score
```

## Why My Changes Help (But Aren't Enough)

### What I Added:
1. **Smart question selection** - Picks best available question
2. **Stops early** - When ≤15 programs remain
3. **Progressive filtering** - Calculates remaining count
4. **Scoring algorithm** - Ranks questions by effectiveness

### What's Still Missing:
1. **Dynamic question generation** - Still generate all at start
2. **Filter-based questioning** - Don't adapt to what's left
3. **User feedback** - Don't show program counts
4. **Conditional branching** - Still mostly linear

## The Deeper Issue

The system was designed with a **waterfall model**:
```
Questions → Answers → Results
```

Instead of a **iterative model**:
```
Answers → Filter Programs → Generate Next Question → Repeat
```

To truly fix this requires:
1. Moving program filtering INTO the question loop
2. Regenerating questions based on remaining programs
3. Or: Pre-compute all possible question trees (harder)

## My Recommendation

**Option A: Fast Fix (What I started)**
- Keep linear flow
- Add smart question scoring
- Show program counts to user
- Stop early when narrowed enough
- Status: 50% done

**Option B: True Conditional (Big refactor)**
- Rework QuestionEngine to be stateful
- Filter programs inside the question loop
- Regenerate questions based on what's left
- Much more complex but truly adaptive
- Status: Not started

**Option C: Pre-computed Trees (Difficult)**
- Build conditional question trees upfront
- Hardcode all branches
- Complex but simple runtime behavior
- Status: Not started

