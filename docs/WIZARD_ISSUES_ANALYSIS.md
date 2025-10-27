# Wizard Issues Analysis

## Problem Statement
The `/reco/smartwizard` questions should be a wizard that:
1. Starts with broad knowledge and narrows down to find the best funding programs
2. Uses conditional logic - the tree changes according to user input
3. Answers exclude certain options (adaptive questioning)
4. Questions are logically linked
5. Programs are scored based on input

## Current Architecture Issues

### 1. **No Conditional Tree Logic**
- Questions are generated statically from program eligibility criteria
- Questions are asked in a fixed order based on importance
- The `nextQuestions` field exists but is never actually used
- No branching based on user answers

### 2. **Linear Question Flow**
```
Current Flow:
Q1 (location) → Q2 (company age) → Q3 (revenue) → Q4 (team size) → ... → Done
```

**Should be:**
```
Conditional Flow:
Q1 (location) → 
  ├─ If Austria → Q2 (Austria-specific)
  ├─ If Germany → Q2 (Germany-specific)
  └─ If EU → Q2 (EU-specific)
```

### 3. **Overly Complex Engine Structure**
Multiple engines that don't communicate well:
- `QuestionEngine`: Generates questions from eligibility criteria
- `IntakeEngine`: Processes answers into profiles
- `enhancedRecoEngine`: Scores programs
- `doctorDiagnostic`: Makes diagnoses (but scoring happens at the end)

### 4. **Questions Not Tied to Program Filtering**
- Questions are generated but don't affect which programs to consider
- Filtering happens at the scoring stage, not during question generation
- No feedback loop: "Based on your answers, here are the programs left"

### 5. **No Adaptive Questioning**
- All users get the same questions
- No exclusion of irrelevant questions based on previous answers
- No narrowing down of the program pool based on answers

## What SHOULD Happen

### Conditional Wizard Flow

```typescript
// Phase 1: Broad Questions (Everyone gets these)
1. Location - filters by geographic eligibility
2. Organization Type - startup, SME, research, university

// Phase 2: Conditional Questions (Based on Phase 1)
If Location = Austria && Organization = Startup:
  3. Company Age (Austria has many early-stage programs)
  4. Revenue (Austria cares about company stage)
  5. Team Size (relevant for Austrian grants)

If Location = EU && Organization = Research:
  3. Research Focus (EU has Horizon-specific questions)
  4. International Collaboration
  5. TRL Level

// Phase 3: Program-Specific Questions
- Generate questions from remaining programs
- These are the MOST specific questions
- Should narrow down to top 10-15 programs
```

## Solution Architecture

### 1. Question Tree Structure
```typescript
interface QuestionNode {
  id: string;
  question: SymptomQuestion;
  conditions?: QuestionCondition[]; // When to show this question
  nextNodes?: QuestionNode[]; // Possible next questions
  programFilters?: FilterRule[]; // How this filters programs
}

interface QuestionCondition {
  questionId: string;
  operator: 'equals' | 'contains' | 'in';
  value: any;
}
```

### 2. Dynamic Question Selection
```typescript
function selectNextQuestion(answers: Record<string, any>, availablePrograms: Program[]): QuestionNode | null {
  // 1. Filter available questions based on conditions
  const eligibleQuestions = this.questions.filter(q => 
    this.shouldShowQuestion(q, answers)
  );
  
  // 2. Score questions by their ability to narrow down programs
  const scoredQuestions = eligibleQuestions.map(q => ({
    question: q,
    score: this.calculateNarrowingScore(q, availablePrograms, answers)
  }));
  
  // 3. Select the best question (not just the first one)
  return scoredQuestions.sort((a, b) => b.score - a.score)[0]?.question;
}
```

### 3. Progressive Program Filtering
```typescript
// After each answer, show:
1. How many programs remain
2. Top 3 program matches
3. Next question to narrow further

function filterProgramsAfterAnswer(answer: any, questionId: string): Program[] {
  const remainingPrograms = this.filterPrograms(questionId, answer);
  
  console.log(`${remainingPrograms.length} programs match your profile so far`);
  
  return remainingPrograms;
}
```

### 4. Smart Question Ordering
```typescript
// Questions should be ordered by their "information value"
// Information value = how much does this question narrow down the program pool?

function calculateInformationValue(
  question: QuestionNode,
  answers: Record<string, any>,
  programs: Program[]
): number {
  // 1. Count how many programs this question would eliminate
  const wouldEliminate = countProgramsThatWouldBeEliminated(question, programs);
  
  // 2. Prioritize questions that:
  //    - Are asked early (broad → specific)
  //    - Filter out many programs
  //    - Are relevant to remaining programs
  
  return wouldEliminate * 0.5 + question.phase * 0.3 + relevancy * 0.2;
}
```

## Implementation Plan

### Phase 1: Fix Question Generation
1. Create conditional question tree based on location, organization type
2. Add `conditions` to questions so they only show when relevant
3. Implement `selectNextQuestion()` with filtering logic

### Phase 2: Add Program Filtering
1. Filter programs after each answer
2. Show remaining program count
3. Highlight top matches after each answer

### Phase 3: Improve Scoring
1. Recalculate program scores as more answers come in
2. Show real-time program matches
3. Stop asking questions when enough programs are identified

### Phase 4: Better UX
1. Show progress: "You've narrowed down from 100 to 15 programs"
2. Preview top programs as you answer
3. Mark questions as "optional - already have enough programs"

## Key Files to Modify

1. `src/lib/questionEngine.ts`
   - Add conditional logic to questions
   - Implement tree-based question selection
   - Add program filtering during questioning

2. `src/components/wizard/SmartWizard.tsx`
   - Integrate real-time program filtering
   - Show program count after each answer
   - Display program previews

3. `src/lib/enhancedRecoEngine.ts`
   - Add incremental scoring (re-score after each answer)
   - Show program counts at each step

## Expected User Experience

```
User starts wizard

Q1: Where are you located?
   → Austria, Germany, EU, International
   [User selects: Austria]
   ✅ Filtering: 100 programs → 45 programs

Q2: What type of organization are you?
   → Startup, SME, Research, University
   [User selects: Startup]
   ✅ Filtering: 45 programs → 20 programs
   🔍 Top 3 matches: AWS For Startups, Startling, Innovate Austria

Q3: What stage is your company?
   → [Questions specific to Austrian startup programs]
   ...
```

This creates a CONDITIONAL experience where:
- Users in Austria get Austria-specific questions
- Users in Germany get Germany-specific questions
- Program pool narrows down progressively
- Users see real-time feedback on matches
- Questions are relevant to their situation

