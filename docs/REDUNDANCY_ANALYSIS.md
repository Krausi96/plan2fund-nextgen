# Redundancy Analysis - File by File

## Findings Summary

### Files to Keep
✅ **SmartWizard.tsx** - Main UI component (needed)
✅ **questionEngine.ts** - Question generation (core functionality)
✅ **enhancedRecoEngine.ts** - Scoring engine (core functionality)

### Files to Simplify/Remove

#### 1. IntakeEngine (1256 lines) - OVER-ENGINEERED
**Current Usage:**
- Created in SmartWizard init (line 101)
- Used ONCE to parse answers at line 332
- Called: `await intakeEngine.parseAnswers(answers, sessionId)`

**What it does:**
- Parses answers to UserProfile
- Has extensive AI integration (NOT USED)
- Has target group detection (NOT USED)
- Has validation rules (DUPLICATE of QuestionEngine validation)
- Has 1000+ lines of unused code

**Recommendation:**
- **Simplify to 50 lines** - just parse answers
- Remove all AI/overlay/validation logic
- Just map answers to simple object

#### 2. doctorDiagnostic (460 lines) - COSMETIC ONLY
**Current Usage:**
- Imported in enhancedRecoEngine.ts (line 5)
- Imported in advancedSearchDoctor.ts (line 2)
- **NOT ACTUALLY USED** in enhancedRecoEngine.ts

**What it does:**
- Makes medical-style diagnosis
- Adds diagnosis fields to results
- Doesn't affect question generation or scoring

**Recommendation:**
- **Remove from enhancedRecoEngine** 
- Keep in advancedSearchDoctor if needed
- Or remove entirely if not critical

## Dead Code to Remove

### In SmartWizard.tsx (2387 lines)
**CSS Styling (lines 601-1065 and 1306-2386)**
- 1800+ lines of CSS-in-JS
- Could be moved to separate file
- Or use Tailwind classes instead

**State Fields:**
```typescript
// NEVER USED:
- programPreview
- previewQuality
- programSpecificQuestions
- validationErrors
- validationWarnings
- validationRecommendations
- aiGuidance
- estimatedTime
- difficulty
```

These fields are set but never displayed!

### In questionEngine.ts
**Overlay Questions:**
- Line 76: `private overlayQuestions: SymptomQuestion[] = [];`
- Line 663: `await question.initializeOverlayQuestions();`
- **ALWAYS EMPTY** - never populated
- Can be removed entirely

**Unused Methods:**
- `initializeOverlayQuestions()` - always returns empty array
- `generateContextualQuestions()` - never called
- `validateAnswers()` - duplicated by IntakeEngine

## Code Reduction Plan

### Target: Reduce from 4800 lines to ~2000 lines

| File | Current | Target | Action |
|------|---------|--------|--------|
| IntakeEngine | 1256 | 50 | Simplify to just parsing |
| doctorDiagnostic | 460 | 0 | Remove from wizard flow |
| SmartWizard | 2387 | 1500 | Remove unused state/UI |
| questionEngine | 1120 | 800 | Remove overlay questions |
| enhancedRecoEngine | 1500 | 1500 | Keep as-is |

**Total: 4800 → 2000 lines (58% reduction)**

## Immediate Actions

1. ✅ **Remove IntakeEngine complexity** - Replace with simple function
2. ✅ **Remove doctorDiagnostic** from enhancedRecoEngine
3. ✅ **Remove overlay questions** from questionEngine
4. ✅ **Clean up SmartWizard state** - Remove unused fields
5. ✅ **Move CSS to separate file** or use Tailwind

## Next Steps

Proceed with simplification? This will:
- Make code easier to understand
- Reduce maintenance burden
- Improve performance (less code to load)
- Make future changes easier

