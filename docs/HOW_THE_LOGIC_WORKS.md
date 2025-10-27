# How the Unified Logic Works: Dynamic vs Static

## Overview

Your pipeline is **FULLY DYNAMIC** - everything adapts based on program data!

## The Dynamic Logic Flow

### 1. Question Generation: **DYNAMIC** 🎯

**What happens:**
```typescript
// On init: Analyze ALL 503 programs
initializeQuestions() {
  // Scan all programs for eligibility_criteria
  for (const program of this.allPrograms) {
    const eligibility = program.eligibility_criteria;
    
    if (eligibility.location) {
      analysis.location.set(location, frequency + 1);
    }
    if (eligibility.max_company_age) {
      analysis.companyAge.set(age, frequency + 1);
    }
    // ... scans all criteria types
  }
  
  // Generate questions based on REAL data frequencies
  if (analysis.location.size > 0) {
    createLocationQuestion(analysis.location); // Dynamic options
  }
  if (analysis.companyAge.size > 0) {
    createCompanyAgeQuestion(analysis.companyAge); // Dynamic ranges
  }
}
```

**Result:**
- Questions generated from actual program data
- Options based on real eligibility criteria
- Different every time scraped programs change
- Adapts to new programs automatically

**Example:**
```
If 200 programs require location = "austria" → Creates "Austria" option
If 50 programs require location = "eu" → Creates "EU" option
If only 5 programs require research_focus → Research question is lower priority
```

### 2. Progressive Filtering: **DYNAMIC** 🎯

**What happens:**
```typescript
getNextQuestionEnhanced(answers) {
  // DYNAMIC: Re-filter programs based on ALL current answers
  this.remainingPrograms = this.applyMajorFilters(answers);
  
  // Calculate how much each question narrows down remaining programs
  for (const question of this.questions) {
    const informationValue = calculateInformationValue(
      question, 
      answers, 
      this.remainingPrograms // Current filtered state
    );
    
    // Pick question that most effectively narrows remaining programs
    if (informationValue > bestScore) {
      bestQuestion = question;
    }
  }
  
  return bestQuestion; // Dynamic selection
}
```

**Result:**
- Next question adapts to current program pool
- Questions selected to maximize filtering effectiveness
- Fewer programs → asks more specific questions
- More programs → asks broader questions

**Example:**
```
Start: 503 programs
After "Austria": 234 programs remaining
Next question will be one that narrows those 234 programs

Start: 503 programs  
After "Austria" + "Under 2 years": 45 programs remaining
Next question will target those 45 programs specifically
```

### 3. Filtering Rules: **HYBRID** ⚡

**Static Part** (Code):
```typescript
applyMajorFilters(answers) {
  // Static rule: If location is "austria", filter by location
  if (answers.location) {
    filteredPrograms = filteredPrograms.filter(program => {
      const eligibility = program.eligibility_criteria;
      return eligibility.location.toLowerCase() === 'austria';
    });
  }
  
  if (answers.company_age) {
    const userAge = parseAgeAnswer(answers.company_age);
    filteredPrograms = filteredPrograms.filter(program => {
      const maxAge = program.eligibility_criteria?.max_company_age;
      return userAge <= maxAge;
    });
  }
}
```

**Dynamic Part** (Data):
- Which rules apply depends on user answers
- Filter values come from program eligibility_criteria
- Filters adapt to actual program requirements

**Result:**
- Rules are coded statically (fixed logic)
- Values come from dynamic program data
- Applies only rules relevant to user's answers

### 4. Scoring: **HYBRID** ⚡

**Static Part** (Algorithm):
```typescript
scoreProgramsEnhanced(answers, mode, preFilteredPrograms) {
  // Static: Score calculation algorithm
  let score = 0;
  
  for (const program of preFilteredPrograms) {
    // Check each requirement
    for (const [key, value] of Object.entries(program.requirements)) {
      if (answers[key] === value) {
        score += 1; // Static scoring increment
      }
    }
  }
  
  return scorePercent;
}
```

**Dynamic Part** (Data):
- Programs scored come from dynamic filtering
- Requirements come from dynamic program data
- Scores adapt to actual eligibility criteria

**Result:**
- Scoring algorithm is static (logic)
- What gets scored is dynamic (programs, requirements)

## What Makes It Dynamic?

### Fully Dynamic Components:
1. ✅ **Question Generation** - Scans ALL programs, creates questions based on frequency
2. ✅ **Question Selection** - Picks best question based on remaining programs
3. ✅ **Program Filtering** - Uses actual eligibility_criteria from programs
4. ✅ **Options Generation** - Creates options from real program data

### Hybrid Components:
1. ⚡ **Filtering Rules** - Static logic, dynamic values from programs
2. ⚡ **Scoring Algorithm** - Static logic, dynamic program selection

### Static Components:
1. 📌 **Filter Logic** - How to filter (location, age, etc.) is coded
2. 📌 **Scoring Algorithm** - How to calculate scores is coded
3. 📌 **Question Types** - Fixed question types (single-select, etc.)

## The Complete Flow (Dynamic + Static)

```
INIT (Dynamic):
┌─────────────────────────────────────────────┐
│ QuestionEngine created with 503 programs   │
│   ↓                                         │
│ Scans ALL programs for eligibility_criteria │  ← DYNAMIC
│   ↓                                         │
│ Generates questions based on frequency     │  ← DYNAMIC
│   ↓                                         │
│ 6-8 questions created from real data       │  ← DYNAMIC
└─────────────────────────────────────────────┘

WIZARD (Dynamic + Static):
┌─────────────────────────────────────────────┐
│ User answers: location = "austria"         │  ← USER INPUT
│   ↓                                         │
│ applyMajorFilters() filters programs        │  ← DYNAMIC (rule), STATIC (logic)
│   ↓                                         │
│ remainingPrograms: 503 → 234                │  ← DYNAMIC STATE
│   ↓                                         │
│ Calculate information value for each q      │  ← STATIC ALGORITHM
│   ↓                                         │
│ Select best question from remaining 234    │  ← DYNAMIC SELECTION
│   ↓                                         │
│ Show question with "234 programs remaining" │  ← DYNAMIC FEEDBACK
└─────────────────────────────────────────────┘

SCORING (Hybrid):
┌─────────────────────────────────────────────┐
│ Get remainingPrograms from QuestionEngine  │  ← DYNAMIC (45 programs)
│   ↓                                         │
│ Pass to scoreProgramsEnhanced()            │  ← DYNAMIC INPUT
│   ↓                                         │
│ Score each program using scoring algorithm │  ← STATIC LOGIC
│   ↓                                         │
│ Return results ordered by score            │  ← DYNAMIC OUTPUT
└─────────────────────────────────────────────┘
```

## Key Point: Everything Adapts to Data

### What's Dynamic:
- **Questions** - Generated from program eligibility criteria
- **Options** - Created from actual program requirements
- **Selection** - Based on current program pool size
- **Filtering** - Uses real eligibility values from programs
- **Order** - Questions ordered by importance/effectiveness

### What's Static:
- **Filtering Logic** - How to apply filters (if statements)
- **Scoring Algorithm** - How to calculate scores
- **Question Types** - Structure of questions
- **Flow Control** - When to stop asking questions

## Why This Matters

### Benefits of Dynamic Logic:
1. **Auto-adapts** - New programs automatically included
2. **Relevant** - Questions based on actual available programs
3. **Efficient** - Asks questions that narrow program pool most
4. **Maintainable** - Change programs, logic adapts automatically

### Static Parts Ensure:
1. **Consistency** - Filtering rules don't change unexpectedly
2. **Predictability** - Scoring algorithm is stable
3. **Reliability** - Core logic is tested and works

## Real Example

**Scenario**: User in Austria with 2-year-old startup

```
INIT:
  Scans 503 programs
  Finds 200 programs require location = "austria"
  Finds 150 programs require max_company_age <= 2
  Generates question 1: location (200 programs affected)
  Generates question 2: company_age (150 programs affected)
  Orders: location first (most impactful)

Q1: "Where are you located?"
  Answer: Austria
  → Filters: 503 → 234 programs (Austrian programs only)
  → Shows: "234 programs remaining"
  
Q2: "How old is your company?"
  Answer: Under 2 years
  → Filters: 234 → 45 programs (Austrian startups)
  → Shows: "45 programs remaining"
  
Q3: Next question from those 45 programs
  → Selected based on what narrows those 45 best
  → Maybe: "Team size?" (relevant to 35 of the 45)

FINISH:
  → 45 programs scored
  → Top 10 displayed to user
```

**The magic**: Every step adapts to what programs actually exist and what the user is actually eligible for!

## Summary

- **Fully Dynamic**: Question generation, selection, filtering, and scoring inputs
- **Hybrid**: Filtering rules (static logic + dynamic data)
- **Static**: Core algorithms, scoring logic, question structure

**Bottom line**: Your pipeline is **smart and adaptive** - it learns from your program data and adjusts automatically! 🎯

