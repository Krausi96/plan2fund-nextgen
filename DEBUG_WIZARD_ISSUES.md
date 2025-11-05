# SmartWizard QuestionEngine Debug Analysis

## Issues Identified

### Problem 1: Questions May Not Be Generated Properly
**Location:** `features/reco/engine/questionEngine.ts` - `generateQuestions()` method

**Issue:** 
- Questions are generated based on `categorized_requirements` from programs
- If programs don't have proper `categorized_requirements`, questions won't be generated
- Core questions require matching requirement types (line 158: `req.frequency >= 2`)
- MAX_QUESTIONS is set to 10 (line 112), which might limit questions

**Evidence:**
```typescript
// Line 111: MIN_FREQUENCY threshold might be too high
const MIN_FREQUENCY = Math.max(3, Math.floor(this.allPrograms.length * 0.03)); // 3% threshold

// Line 158: Core questions need at least 2 programs with matching requirement
if (questionId === importantId && req.frequency >= 2) {
```

**Fix Needed:**
1. Check if programs have `categorized_requirements`
2. Lower threshold or ensure core questions are always generated
3. Add fallback questions if generation fails

---

### Problem 2: Filtering Too Aggressive
**Location:** `features/reco/engine/questionEngine.ts` - `filterPrograms()` method

**Issue:**
- Each answer filters programs aggressively
- If all programs are filtered out, questions stop (line 781-784)
- Multiple filters applied sequentially can eliminate all programs quickly

**Evidence:**
```typescript
// Line 781-784: Stops if filtered down to 5 or fewer AND all core questions answered
if (this.remainingPrograms.length <= 5 && allCoreQuestionsAnswered) {
  console.log(`✅ Filtered to ${this.remainingPrograms.length} programs, stopping questions`);
  return null;
}
```

**Fix Needed:**
1. Make filtering less strict (OR logic instead of AND)
2. Don't stop questions if programs are filtered out too early
3. Add minimum program threshold before stopping

---

### Problem 3: Questions May Have No Options
**Location:** `features/reco/engine/questionEngine.ts` - `createQuestionFromRequirement()` method

**Issue:**
- Questions are created from requirements
- If requirement values don't map to options, question has no options
- Questions without options can't be answered (line 137-138)

**Evidence:**
```typescript
// Line 133-138: Question skipped if no options
if (question && question.options && question.options.length > 0) {
  this.questions.push(question);
} else {
  console.warn(`⚠️ Skipped question ${questionId}: no options or question creation failed`);
}
```

**Fix Needed:**
1. Ensure all core questions have default options if requirements don't match
2. Add fallback options for questions

---

### Problem 4: Same Questions Repeated
**Location:** `features/reco/engine/questionEngine.ts` - `getNextQuestion()` method

**Issue:**
- Question history not properly tracked
- Same question might be asked multiple times
- Logic at line 791-796 only checks if question is answered, not if it was asked

**Evidence:**
- No check for question history in `getNextQuestion()`
- Only checks `!answers[q.id]` which doesn't prevent repeated asking

**Fix Needed:**
1. Track question history in SmartWizard
2. Check question history before returning question

---

## How to Debug

### Option 1: Use Debug Page
1. Navigate to `/debug-wizard` (if created)
2. Click "Simulate Question Flow"
3. Check logs for:
   - How many questions generated
   - Which questions are asked
   - When programs are filtered out
   - Why questions stop

### Option 2: Browser Console
1. Open SmartWizard page
2. Open browser console
3. Check console logs for:
   - `✅ Generated question:` - shows questions created
   - `📊 Filtering summary:` - shows program filtering
   - `🔍 Question decision:` - shows why questions stop

### Option 3: Check Program Data
```javascript
// In browser console on SmartWizard page
const response = await fetch('/api/programs?enhanced=true');
const data = await response.json();
const programs = data.programs;

// Check if programs have categorized_requirements
console.log('Programs with categorized_requirements:', 
  programs.filter(p => p.categorized_requirements).length);

// Check a sample program
console.log('Sample program:', programs[0]);
console.log('Has requirements:', !!programs[0].categorized_requirements);
```

---

## Recommended Fixes

### Fix 1: Ensure Core Questions Always Generated
```typescript
// In generateQuestions(), add fallback questions
const coreQuestionIds = ['location', 'company_type', 'funding_amount', 'use_of_funds', 
  'impact', 'team_size', 'deadline_urgency', 'project_duration'];

for (const coreId of coreQuestionIds) {
  if (questionIdMap.has(coreId)) continue;
  
  // Create fallback question if not generated from requirements
  const fallbackQuestion = this.createFallbackQuestion(coreId);
  if (fallbackQuestion) {
    this.questions.push(fallbackQuestion);
  }
}
```

### Fix 2: Make Filtering Less Aggressive
```typescript
// In filterPrograms(), use OR logic for some filters
// Or add minimum threshold before stopping
if (this.remainingPrograms.length <= 0) {
  console.warn('⚠️ All programs filtered out, resetting to all programs');
  this.remainingPrograms = [...this.allPrograms];
}
```

### Fix 3: Track Question History
```typescript
// In SmartWizard, track asked questions
const [questionHistory, setQuestionHistory] = useState<string[]>([]);

// Before asking question, check history
if (questionHistory.includes(nextQuestion.id)) {
  console.warn('⚠️ Question already asked:', nextQuestion.id);
  // Skip or handle differently
}
```

---

## Quick Test

Run this in browser console on SmartWizard page to see what's happening:

```javascript
// Check QuestionEngine state
const response = await fetch('/api/programs?enhanced=true');
const data = await response.json();
const { QuestionEngine } = await import('/features/reco/engine/questionEngine.ts');
const engine = new QuestionEngine(data.programs);

console.log('Total questions:', engine.getAllQuestions().length);
console.log('Core questions:', engine.getCoreQuestions().length);
console.log('Questions:', engine.getAllQuestions().map(q => ({
  id: q.id,
  options: q.options?.length || 0,
  required: q.required
})));
```
