# Wizard - Expected Outcome

## What to Look For

When you run the wizard at `/reco`, you should see these improvements:

### 1. Program Count Display
**Location:** Below the progress bar

**What you'll see:**
- After answering Q1: "📊 45 programs remaining"
- After answering Q2: "📊 20 programs remaining"  
- After answering Q3: "📊 12 programs matched so far" (when ≤15)

**Behavior:**
- Count decreases after each answer
- Shows how wizard is narrowing down options
- Switches to "matched so far" when narrow enough

### 2. Better Question Order
**What you'll see:**
- Questions may appear in a slightly different order
- Smart question selection picks most effective next question
- Not just "first unanswered question"

**How to verify:**
- Console logs show question scoring
- Look for: "Question X score: 85.32"
- Highest scoring question is asked next

### 3. Early Stopping
**What you'll see:**
- Wizard stops asking when ≤15 programs match
- Usually after 5-7 questions (not always 8-10)
- More efficient experience

**How to verify:**
- Watch program count drop
- When it hits ≤15, wizard completes sooner
- Console shows: "Only X programs remain, stopping questions"

### 4. Progressive Filtering Feedback
**What you'll see:**
- Each answer narrows the program pool
- Visible feedback as you progress
- Builds confidence in the wizard

## Testing Steps

1. **Navigate to** `/reco` or the smart wizard
2. **Answer Q1** (Location)
   - Check console: "📊 Programs remaining: X / 100"
   - Should see program count below progress bar
3. **Answer Q2** (Company age/stage)
   - Count should decrease
   - Console logs question scoring
4. **Continue answering**
   - Watch count decrease each time
   - Wizard should stop around 5-7 questions if count hits ≤15
5. **View results**
   - Should show top programs matching your profile
   - Results already worked, but now you saw the filtering

## What NOT to See (Signs of Problems)

- ❌ Program count stays at 100 throughout
- ❌ Wizard asks all questions regardless of narrowing
- ❌ Questions in completely random order (should be logical)
- ❌ TypeScript errors in console
- ❌ Performance issues or crashes

## Success Indicators

✅ Program count displays and updates  
✅ Count decreases with each answer  
✅ Wizard stops early when narrowed enough  
✅ Console shows question scoring  
✅ Better user experience - user sees progress  
✅ No errors or crashes  

## Technical Changes Made

### Files Modified:
- `src/lib/questionEngine.ts` - Added scoring and early stopping
- `src/components/wizard/SmartWizard.tsx` - Added program count display

### Lines Changed:
- ~50 lines total (most is in scoring algorithm)
- Only 9 lines for the UI feedback
- Minimal, low-risk changes

### Testing:
- TypeScript compilation: ✅ Passed
- No breaking changes
- Backward compatible
- Existing functionality preserved

