# How to Debug SmartWizard Question Issues

## Quick Browser Console Test

Open your browser console on the SmartWizard page (`/reco`) and run:

```javascript
// Step 1: Check what questions are being generated
// Look at the console logs - you should see:
// - "✅ Generated question: location (...)"
// - "✅ Generated question: company_type (...)"
// etc.

// Step 2: Check the QuestionEngine state
// In SmartWizard component, check:
console.log('Check browser console for QuestionEngine logs');
```

## What to Look For

### Issue 1: Not Enough Questions Generated
**Symptoms:**
- Only 3 questions appear
- Console shows: "Only X questions generated"

**Check:**
1. Look for console log: `📊 Total Questions Generated: X`
2. If X < 8, that's the problem
3. Check if programs have `categorized_requirements`:
   ```javascript
   // In console
   const response = await fetch('/api/programs?enhanced=true');
   const data = await response.json();
   console.log('Programs with requirements:', 
     data.programs.filter(p => p.categorized_requirements).length);
   ```

### Issue 2: Questions Stop Early
**Symptoms:**
- Questions stop at question 4
- No more questions available

**Check:**
1. Look for console log: `📊 Filtering summary: X → Y programs`
2. If Y becomes 0, that's the problem
3. Look for: `✅ Filtered to X programs, stopping questions`

### Issue 3: Same Questions Repeated
**Symptoms:**
- Same 3 questions keep appearing
- Question history shows duplicates

**Check:**
1. Look at question IDs in console
2. Check if question history is being tracked

### Issue 4: Questions Have No Options
**Symptoms:**
- Question appears but no answer options shown
- Console shows: "⚠️ Skipped question X: no options"

**Check:**
1. Look for console warnings about skipped questions
2. Check if question has options: `question.options?.length`

## Debug Script

I've created a debug page at `/debug-wizard` (when running dev server).

**To use:**
1. Start dev server: `npm run dev`
2. Navigate to: `http://localhost:3000/debug-wizard`
3. Click "Simulate Question Flow"
4. Check the logs to see:
   - How many questions generated
   - Which questions are asked
   - When programs are filtered out
   - Why questions stop

## Expected Behavior

1. **Question Generation:**
   - Should generate at least 8 core questions
   - Should generate from `categorized_requirements` in programs
   - Should have fallback if requirements don't match

2. **Question Flow:**
   - Should ask all 8 core questions first
   - Should continue asking if programs remain
   - Should stop when all core questions answered AND programs filtered down

3. **Filtering:**
   - Should filter programs based on answers
   - Should not filter all programs out too early
   - Should continue even if some programs filtered

## Common Issues & Fixes

### Issue: Only 3 Questions Generated
**Cause:** Programs don't have `categorized_requirements` or requirements don't match question mappings

**Fix:**
1. Check database - do programs have `categorized_requirements`?
2. Lower threshold in `generateQuestions()` (line 111)
3. Add fallback questions for core question IDs

### Issue: Questions Stop at Question 4
**Cause:** All programs filtered out OR filtering too aggressive

**Fix:**
1. Make filtering less strict
2. Don't stop if programs filtered out too early
3. Require minimum 8 questions before stopping

### Issue: Same Questions Repeated
**Cause:** Question history not tracked properly

**Fix:**
1. Track question history in SmartWizard state
2. Check history before asking question
3. Skip if already asked

## Next Steps

1. Run the debug page at `/debug-wizard`
2. Check browser console logs on SmartWizard page
3. Review the `DEBUG_WIZARD_ISSUES.md` file for detailed analysis
4. Check if programs in database have `categorized_requirements`
