# SmartWizard Redesign - Complete Design Plan

## Executive Summary

**Goal:** Create a truly conditional, dynamic wizard that:
- Starts broad and narrows down progressively
- Asks different questions based on user answers
- Generates questions dynamically from remaining programs
- Provides real-time feedback to users

**Current State:** Linear wizard with static questions
**Target State:** Adaptive, conditional wizard with dynamic questions

---

## Part 1: Data Flow Analysis

### A. Data Source (Web Scraper) → Programs

**Input:**
```json
{
  "id": "aws_preseed_fallback",
  "name": "AWS Preseed Program",
  "eligibility_criteria": {
    "min_team_size": 2,
    "max_company_age": 5,
    "location": "Austria",
    "revenue_min": 50000,
    "revenue_max": 500000,
    "industry_focus": "tech",
    "research_focus": true
  }
}
```

**Key Insight:** Every program has eligibility_criteria that determine if a user qualifies

---

### B. Programs → Questions

**Current Approach:**
1. Look at ALL 503 programs
2. Find most common eligibility criteria
3. Generate questions based on frequency
4. Same questions for everyone

**Problem:** Questions generated from ALL programs, not relevant to user's situation

**Example:**
- 503 programs total
- 200 mention "location" → Generate location question
- 150 mention "team_size" → Generate team_size question
- But if user is in Austria, 234 Austrian programs have different needs!

---

### C. Questions → Answers → Filtering

**Current Approach:**
- Filter programs after each answer
- But don't change which questions to ask
- Ask all pre-generated questions in order

**Problem:** Filtering happens but questions don't adapt

---

## Part 2: The Real Design

### The Conditional Question Tree

```
┌─────────────────────────────────────────────────────┐
│ PHASE 1: Location & Organization                     │
│ (Everyone gets these - broad filters)               │
└─────────────────────────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
    Location: Austria      Location: Germany
         │                       │
         ▼                       ▼
    ┌─────────────────┐    ┌─────────────────┐
    │ Check: What do  │    │ Check: What do  │
    │ Austrian 234    │    │ German 150      │
    │ programs need?  │    │ programs need?  │
    └─────────────────┘    └─────────────────┘
         │                       │
         ▼                       ▼
    Generate Questions      Generate Questions
    for Austrian programs  for German programs
```

### How It Should Work

#### Step 1: Initial Broad Filtering

**Q1: Location**
- Options: Austria, Germany, EU, International
- Filters: 503 → ~150-250 programs (depending on answer)

#### Step 2: Dynamic Question Generation

**AFTER Q1 answered (e.g., "Austria"):**
- Remaining: 234 Austrian programs
- Analyze: What do these 234 programs commonly require?
  - 180 need company_age → High priority
  - 120 need team_size → Medium priority
  - 80 need revenue → Lower priority
- Generate: Austrian-specific questions

**AFTER Q2 answered (e.g., "Startup"):**
- Remaining: 80 Austrian startup programs
- Analyze: What do THESE 80 need?
  - 60 need funding type → Ask funding type
  - 40 need team_size → Ask team size
- Generate: Austrian startup-specific questions

#### Step 3: Progressive Narrowing

```
After each answer:
1. Filter programs
2. Analyze remaining programs
3. Generate relevant question
4. Show program count to user
5. Repeat
```

---

## Part 3: Architecture Design

### The Question Generation Engine

**File:** `src/lib/questionEngine.ts` (RENAME to `ConditionalQuestionEngine.ts`)

**New Structure:**

```typescript
class ConditionalQuestionEngine {
  private allPrograms: Program[];           // All 503 programs
  private remainingPrograms: Program[];       // Currently matching programs
  private askedQuestions: string[];          // Questions we've asked
  private userAnswers: Record<string, any>;   // User's answers
  
  constructor(programs: Program[]) {
    this.allPrograms = programs;
    this.remainingPrograms = programs;       // Start with all
    this.askedQuestions = [];
    this.userAnswers = {};
  }
  
  /**
   * Get next question - DYNAMICALLY GENERATED
   */
  async getNextQuestion(answers: Record<string, any>): Promise<Question | null> {
    // 1. Update answers
    this.userAnswers = answers;
    
    // 2. Filter programs based on answers
    this.remainingPrograms = this.filterPrograms(answers);
    
    console.log(`${this.remainingPrograms.length} programs remaining`);
    
    // 3. If narrowed enough, stop
    if (this.remainingPrograms.length <= 10 && Object.keys(answers).length >= 4) {
      return null; // Done!
    }
    
    // 4. Generate question relevant to remaining programs
    const question = this.generateRelevantQuestion();
    
    // 5. Track what we asked
    this.askedQuestions.push(question.id);
    
    return question;
  }
  
  /**
   * Filter programs based on user answers
   */
  private filterPrograms(answers: Record<string, any>): Program[] {
    let filtered = [...this.allPrograms];
    
    // Location filter
    if (answers.location) {
      filtered = filtered.filter(p => {
        const loc = p.eligibility_criteria?.location?.toLowerCase();
        if (!loc) return true; // No location requirement = available
        return loc.includes(answers.location.toLowerCase());
      });
    }
    
    // Company age filter
    if (answers.company_age) {
      filtered = filtered.filter(p => {
        const maxAge = p.eligibility_criteria?.max_company_age;
        if (!maxAge) return true;
        const userAge = this.parseAge(answers.company_age);
        return userAge <= maxAge;
      });
    }
    
    // Team size filter
    if (answers.team_size) {
      filtered = filtered.filter(p => {
        const minTeam = p.eligibility_criteria?.min_team_size;
        if (!minTeam) return true;
        const userTeam = this.parseTeamSize(answers.team_size);
        return userTeam >= minTeam;
      });
    }
    
    // Add more filters as needed
    
    return filtered;
  }
  
  /**
   * Generate question relevant to REMAINING programs
   */
  private generateRelevantQuestion(): Question {
    // Analyze what remaining programs need
    const needs = this.analyzeRemainingPrograms();
    
    // Find most common requirement that hasn't been asked
    const nextNeed = this.selectNextRequirement(needs);
    
    // Generate question for that requirement
    return this.createQuestionForRequirement(nextNeed);
  }
  
  /**
   * Analyze what remaining programs commonly require
   */
  private analyzeRemainingPrograms(): Map<string, number> {
    const frequency = new Map<string, number>();
    
    for (const program of this.remainingPrograms) {
      const eligibility = program.eligibility_criteria || {};
      
      if (eligibility.max_company_age) {
        frequency.set('company_age', (frequency.get('company_age') || 0) + 1);
      }
      if (eligibility.min_team_size) {
        frequency.set('team_size', (frequency.get('team_size') || 0) + 1);
      }
      if (eligibility.revenue_min || eligibility.revenue_max) {
        frequency.set('revenue', (frequency.get('revenue') || 0) + 1);
      }
      if (eligibility.industry_focus) {
        frequency.set('industry', (frequency.get('industry') || 0) + 1);
      }
      // Add more as needed
    }
    
    return frequency;
  }
  
  /**
   * Select which requirement to ask about next
   */
  private selectNextRequirement(needs: Map<string, number>): string {
    // Don't ask what we've already asked
    const unaskedNeeds = Array.from(needs.entries())
      .filter(([key]) => !this.askedQuestions.includes(key))
      .sort(([,a], [,b]) => b - a); // Sort by frequency
    
    return unaskedNeeds[0]?.[0] || 'none';
  }
  
  /**
   * Create question for a specific requirement
   */
  private createQuestionForRequirement(requirement: string): Question {
    switch (requirement) {
      case 'company_age':
        return this.createAgeQuestion();
      case 'team_size':
        return this.createTeamSizeQuestion();
      case 'revenue':
        return this.createRevenueQuestion();
      case 'industry':
        return this.createIndustryQuestion();
      default:
        return this.createGenericQuestion();
    }
  }
  
  /**
   * Get current program count
   */
  public getRemainingProgramCount(): number {
    return this.remainingPrograms.length;
  }
}
```

---

## Part 4: Component Wiring

### SmartWizard → QuestionEngine

**Current:**
```typescript
// Questions generated once
const question = new QuestionEngine(programs);

// Just returns next question
const next = await question.getNextQuestion(answers);
```

**New:**
```typescript
// Questions generated dynamically
const question = new ConditionalQuestionEngine(programs);

// Gets next question AND filters programs
const next = await question.getNextQuestion(answers);

// Get program count for display
const count = question.getRemainingProgramCount();
```

### UI Display

**Show to user:**
```typescript
// Display program count
{state.remainingProgramCount !== undefined && (
  <div>📊 {state.remainingProgramCount} programs remaining</div>
)}

// Display question
{currentQuestion && <QuestionDisplay question={currentQuestion} />}
```

---

## Part 5: Dead Code Removal

### Files to Remove/Consolidate

#### 1. IntakeEngine - Barely Used
**Current:** Created but only used to parse answers at the end
**Decision:** Either use it properly or remove it

**Options:**
- A) Remove it entirely (parsing is simple, no need for 1,200 line class)
- B) Actually use it for user profiling throughout the wizard

**Recommendation:** Remove or drastically simplify

#### 2. doctorDiagnostic - Cosmetic Only
**Current:** Makes medical-style diagnosis but doesn't affect questions
**Decision:** Remove or wire it up properly

**Recommendation:** Remove - it doesn't add value currently

#### 3. Overlay Questions - Never Used
**Current:** OverlayQuestions array exists but is always empty
**Decision:** Remove or implement properly

**Recommendation:** Remove the abstraction

---

## Part 6: Implementation Plan

### Phase 1: Wire Conditional Logic (4 hours)

#### Step 1.1: Refactor QuestionEngine
- Add `remainingPrograms` tracking
- Make `filterPrograms()` public and stateful
- Add `getRemainingProgramCount()` method

#### Step 1.2: Implement Dynamic Question Generation
- Add `analyzeRemainingPrograms()` method
- Add `generateRelevantQuestion()` method
- Add `selectNextRequirement()` method

#### Step 1.3: Update SmartWizard
- Get program count from QuestionEngine
- Display count to user
- Pass count through state

**Expected Result:**
- Questions adapt to remaining programs
- Count updates after each answer
- Wizard stops when narrowed enough

---

### Phase 2: Remove Dead Code (2 hours)

#### Step 2.1: Remove IntakeEngine Dependency
- Remove from SmartWizard initialization
- Simplify answer processing
- Or: Actually use it properly

#### Step 2.2: Remove doctorDiagnostic
- Remove from enhancedRecoEngine
- Simplify scoring logic

#### Step 2.3: Clean Up Interfaces
- Remove unused fields
- Simplify types

**Expected Result:**
- Cleaner codebase
- Less confusion
- Easier to maintain

---

### Phase 3: Complete Conditional Logic (2 hours)

#### Step 3.1: Implement Skip Conditions Properly
- Wire up `skipConditions` checking
- Implement AND/OR logic
- Test conditional branching

#### Step 3.2: Add More Question Types
- Add questions for all common requirements
- Test with different user paths

**Expected Result:**
- True conditional branching
- Different questions for different users
- Adaptive questioning

---

## Part 7: Data Transformation

### From Eligibility Criteria → Questions

**The Mapping:**

```typescript
eligibility_criteria: {
  location: "Austria"
}
↓
Question: {
  id: "location",
  symptom: "Where are you located?",
  options: ["Austria", "Germany", "EU"],
  filters: (program, answer) => program.eligibility_criteria.location === answer
}
```

```typescript
eligibility_criteria: {
  max_company_age: 5
}
↓
Question: {
  id: "company_age",
  symptom: "How old is your company?",
  options: ["Under 2 years", "2-5 years", "5+ years"],
  filters: (program, answer) => userAge <= program.eligibility_criteria.max_company_age
}
```

**The Key:** Map eligibility_criteria fields to question types

---

### From Answer → Program Filtering

**The Filtering Logic:**

```typescript
User answers: { location: "Austria" }
↓
For each program in remainingPrograms:
  if program.eligibility_criteria.location:
    if "Austria" matches eligibility_criteria.location:
      KEEP program
    else:
      REMOVE program
  else:
    KEEP program (no location requirement)
```

**Result:** 503 → 234 Austrian programs

---

### From Filtered Programs → Next Question

**The Selection Logic:**

```typescript
remainingPrograms = 234 programs (filtered)

Analyze needs:
- 180 programs require company_age
- 150 programs require team_size  
- 120 programs require revenue
- 80 programs require industry

Select highest frequency: company_age (180/234 = 77%)
Generate: company_age question
```

---

## Part 8: The Complete Flow

### START: User Opens Wizard

```typescript
1. Fetch 503 programs from /api/programs
2. Create ConditionalQuestionEngine(503 programs)
3. remainingPrograms = 503
4. Generate first question: "Where are you located?"
```

### Q1: Location Answered

```typescript
User answers: location = "Austria"

1. Filter: 503 → 234 Austrian programs
2. Update: remainingPrograms = 234
3. Analyze: What do these 234 need?
   - company_age: 180
   - team_size: 150
   - revenue: 100
4. Generate: company_age question
5. Display: "📊 234 programs remaining"
```

### Q2: Company Age Answered

```typescript
User answers: company_age = "under_2_years"

1. Filter: 234 → 120 young company programs
2. Update: remainingPrograms = 120  
3. Analyze: What do these 120 need?
   - team_size: 80
   - revenue: 60
   - industry: 40
4. Generate: team_size question
5. Display: "📊 120 programs remaining"
```

### Continue Until Narrowed...

```typescript
After 5-6 questions:
- remainingPrograms = 15 programs
- User has answered all relevant questions
- Stop questioning
- Score these 15 programs
- Return top results
```

---

## Part 9: Integration Points

### QuestionEngine → SmartWizard

**Current Interface:**
```typescript
// SmartWizard creates engine once
const questionEngine = new QuestionEngine(programs);

// Gets next question
const next = await questionEngine.getNextQuestion(answers);
```

**New Interface:**
```typescript
// SmartWizard creates engine once
const questionEngine = new ConditionalQuestionEngine(programs);

// Gets next question (engine tracks state internally)
const next = await questionEngine.getNextQuestion(answers);

// Get program count
const count = questionEngine.getRemainingProgramCount();
```

### SmartWizard → UI Display

**Add to State:**
```typescript
interface WizardState {
  // ... existing fields
  remainingProgramCount: number;
}
```

**Update in handleAnswer:**
```typescript
const next = await questionEngine.getNextQuestion(newAnswers);
const count = questionEngine.getRemainingProgramCount();

setState({
  // ... other fields
  remainingProgramCount: count
});
```

**Display in UI:**
```typescript
{state.remainingProgramCount !== undefined && (
  <div>📊 {state.remainingProgramCount} programs remaining</div>
)}
```

---

## Part 10: What Gets Removed

### Dead Code to Remove

#### 1. IntakeEngine (1,200 lines)
**Current usage:**
- Created in SmartWizard init
- Called once at the end to parse answers
- Barely used

**Remove because:**
- Parsing is simple (just answers mapping)
- Don't need 1,200 line class for simple parsing
- Not involved in question generation

**Alternative:** Keep but simplify to 200 lines

#### 2. doctorDiagnostic (cosmetic)
**Current usage:**
- Makes diagnosis but doesn't affect questions
- Just decorative

**Remove because:**
- Adds complexity
- Doesn't provide conditional logic
- Already have scoring engine

#### 3. Overlay Questions Abstraction
**Current:**
- `this.overlayQuestions = []` (always empty)
- Never populated

**Remove because:**
- Unused abstraction
- Everything is "core" questions anyway

---

## Part 11: The Final Design

### ConditionalQuestionEngine Class

```typescript
export class ConditionalQuestionEngine {
  private allPrograms: Program[];
  private remainingPrograms: Program[];
  private askedQuestions: string[];
  
  constructor(programs: Program[]) {
    this.allPrograms = programs;
    this.remainingPrograms = programs;
    this.askedQuestions = [];
  }
  
  async getNextQuestion(answers: Record<string, any>): Promise<Question | null> {
    // 1. Filter programs
    this.remainingPrograms = this.filterPrograms(answers);
    
    // 2. If narrowed enough, stop
    if (this.shouldStop()) return null;
    
    // 3. Generate relevant question
    return this.generateRelevantQuestion();
  }
  
  getRemainingProgramCount(): number {
    return this.remainingPrograms.length;
  }
  
  private filterPrograms(answers: Record<string, any>): Program[] {
    // Filter based on all answers
    // Returns remaining programs
  }
  
  private generateRelevantQuestion(): Question {
    // Analyze remaining programs
    // Generate question for most common need
    // Return question
  }
  
  private shouldStop(): boolean {
    // Check if narrowed enough
  }
}
```

### SmartWizard Integration

```typescript
const [questionEngine, setQuestionEngine] = useState<ConditionalQuestionEngine | null>(null);

// On init
const engine = new ConditionalQuestionEngine(programs);
setQuestionEngine(engine);

// On answer
const next = await questionEngine.getNextQuestion(newAnswers);
const count = questionEngine.getRemainingProgramCount();

setState({
  // ...
  remainingProgramCount: count
});
```

---

## Summary

### What Changes:
1. **QuestionEngine** → Becomes stateful, tracks remaining programs
2. **Question Generation** → Dynamic, based on what's left
3. **Filtering** → Progressive, updates internal state
4. **SmartWizard** → Simple, just displays questions and counts

### What Gets Removed:
1. **IntakeEngine** → Too complex for what it does
2. **doctorDiagnostic** → Cosmetic only
3. **Overlay questions** → Unused abstraction

### The Result:
- ✅ Questions adapt to user's situation
- ✅ Program count decreases visibly
- ✅ Users see progressive narrowing
- ✅ Wizard stops when narrowed enough
- ✅ Clean, maintainable code

**Should I implement this design?**

