# Reco Page Handover Document

## Overview
This document provides a handover for the Recommendation (Reco) page improvements. We've been working on simplifying the UI, fixing Q&A logic, and improving the user experience.

## Current State

### What We've Done
1. **Simplified UI**
   - Removed progress bar
   - Removed "Guided Questions" title and subtitle
   - Added "Generate Funding Programs" button (appears after 6+ questions answered)
   - Made layout more compact (max-w-3xl, reduced padding/spacing)
   - Smaller fonts and buttons throughout

2. **Q&A Logic Improvements**
   - Fixed answer counting (now excludes empty/null/empty arrays)
   - Minimum 6 questions required before showing results
   - All questions visible by default (no progressive disclosure)
   - Horizontal question navigation with dots and arrows
   - Auto-advance to next question after answering single-select

3. **Translations**
   - Added EN/DE translations for all UI elements
   - "Generate Funding Programs" button translated

4. **Results Display**
   - Results only shown after clicking "Generate" button
   - LLM extraction is working (generates programs via `generateProgramsWithLLM`)
   - Results are scored and filtered to top 5 matches

## Known Issues & Concerns

### 1. **Page is Too Large** ⚠️
- **Issue**: User needs to zoom out to 67% to see everything
- **Location**: `features/reco/components/ProgramFinder.tsx`
- **Current**: Card is `max-w-3xl`, but still too large
- **Action Needed**: Further reduce card width, padding, or question display size

### 2. **Breadcrumb Doesn't Update** 🐛
- **Issue**: When navigating between questions (using arrows/dots), breadcrumb doesn't reflect current question
- **Location**: `shared/components/layout/Breadcrumbs.tsx` or `AppShell.tsx`
- **Current**: Breadcrumbs are hidden on `/reco` page, but if they should show, they need to update
- **Action Needed**: 
  - Check if breadcrumbs should be visible on reco page
  - If yes, update breadcrumb logic to reflect current question number
  - May need to pass question index to breadcrumb component

### 3. **UI Not Satisfactory** ⚠️
- **Issue**: User is not satisfied with current UI improvements
- **Areas to Review**:
  - Overall layout and spacing
  - Question display size
  - Button placement and styling
  - Navigation arrows visibility
  - Color scheme and visual hierarchy

### 4. **Q&A Being Edited Step by Step** 📝
- **Status**: User is actively editing questions and answers
- **Location**: `features/reco/components/ProgramFinder.tsx` - `CORE_QUESTIONS` array
- **Action Needed**: Continue refining questions based on user feedback

## Technical Details

### Key Files
- **Main Component**: `features/reco/components/ProgramFinder.tsx`
- **API Endpoint**: `pages/api/programs/recommend.ts`
- **Translations**: 
  - `shared/i18n/translations/en.json`
  - `shared/i18n/translations/de.json`
- **Layout**: `shared/components/layout/AppShell.tsx`

### Current Configuration
- **Minimum Questions**: 6 (defined as `MIN_QUESTIONS_FOR_RESULTS`)
- **Total Questions**: ~12 (varies based on skip logic)
- **LLM Generation**: Enabled via `generateProgramsWithLLM()` function
- **Results Limit**: Top 5 programs shown

### Answer Counting Logic
```typescript
const answeredCount = Object.keys(answers).filter(key => {
  const value = answers[key];
  return value !== undefined && value !== null && value !== '' && 
         !(Array.isArray(value) && value.length === 0);
}).length;
```

### Question Navigation
- Horizontal carousel with numbered dots
- Left/right arrow buttons
- Click dots to jump to any question
- Auto-advance after answering single-select questions

## What Needs to Be Done

### Priority 1: Fix Breadcrumb Navigation
1. Investigate breadcrumb behavior on `/reco` page
2. Determine if breadcrumbs should be visible
3. If visible, update to show current question (e.g., "Question 3 of 12")
4. Test navigation between questions updates breadcrumb

### Priority 2: Further Reduce Page Size
1. Reduce card width further (maybe `max-w-2xl` or `max-w-xl`)
2. Reduce padding and spacing more aggressively
3. Consider making question display even more compact
4. Test at 100% zoom - should fit without scrolling

### Priority 3: UI Improvements
1. Review overall visual design
2. Get user feedback on specific pain points
3. Iterate on layout, colors, spacing
4. Ensure navigation arrows are visible but not intrusive

### Priority 4: Continue Q&A Refinement
1. Work with user to refine questions
2. Update `CORE_QUESTIONS` array as needed
3. Update translations for any new/changed questions
4. Test question flow and skip logic

## Testing Checklist

- [ ] Page fits on screen at 100% zoom
- [ ] Breadcrumb updates when navigating questions
- [ ] "Generate" button appears after 6 questions
- [ ] Results display correctly after clicking generate
- [ ] Navigation arrows are visible and functional
- [ ] Question dots show correct state (answered/current/unanswered)
- [ ] Translations work correctly (EN/DE)
- [ ] Auto-advance works for single-select questions
- [ ] Answer counting excludes empty values correctly

## Questions to Clarify

1. Should breadcrumbs be visible on the reco page?
2. What specific UI elements are most problematic?
3. What's the target page size/zoom level?
4. Are there specific design guidelines to follow?

## Recent Commits

- `35f88ad` - Simplify reco UI: remove progress bar, remove Guided Questions title, add Generate button
- `3904380` - Fix reco: move progress/button to top, change min to 6 questions, fix answer counting
- `e9fc52a` - Improve reco UX: partial answers allowed, better navigation, translations

## Contact

If you have questions about the current implementation, check:
- `features/reco/components/ProgramFinder.tsx` for main component logic
- `pages/api/programs/recommend.ts` for LLM generation logic
- Git history for recent changes

---

**Status**: In Progress - UI needs refinement, breadcrumb bug needs fixing
**Last Updated**: Current session
**Next Steps**: Fix breadcrumb, reduce page size, improve UI based on feedback

