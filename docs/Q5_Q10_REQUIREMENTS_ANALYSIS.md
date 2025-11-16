# Q5 (Impact) and Q10 (Co-financing) Requirements Analysis

## Q5: Impact Requirements

### Current Implementation
- Multi-select with: Economic, Social, Environmental, Other
- Has detail inputs for each impact type (when selected)
- Users can specify details like "Create 50 jobs" for economic, etc.

### What Programs Require
Based on normalization and matching logic:
- Programs may require **specific impact types** (economic, social, environmental)
- Some programs focus on **multiple impacts** (e.g., "sustainable economic growth")
- Impact is often used as a **filtering/prioritization** criterion, not a hard blocker

### Best Way to Ask
**Current approach is good:**
1. ✅ Multi-select allows multiple impacts
2. ✅ Detail inputs allow specification (e.g., "Create 50 jobs", "Reduce CO2 by 30%")
3. ✅ "Other" option covers edge cases

**Recommendation:**
- Keep current implementation
- The detail inputs are valuable - they help LLM understand specific impact goals
- Example: "Economic (Create 50 jobs, increase regional GDP)" is more useful than just "Economic"

### What Users Need to Specify
- **Economic**: Job creation numbers, GDP impact, regional development
- **Social**: Community benefits, accessibility improvements, social services
- **Environmental**: CO2 reduction, sustainability metrics, climate impact
- **Other**: Any other impact type not covered

## Q10: Co-financing Requirements

### Current Implementation
- Single-select: Yes / No / Uncertain
- **NEW**: Percentage input when "Yes" is selected

### What Programs Require
Based on normalization code (`normalizeCoFinancingAnswer`, `normalizeCoFinancingExtraction`):
- Programs often require **specific percentages** (e.g., "Minimum 30%", "Up to 50%")
- Common ranges: **20-50%** co-financing
- Some programs require **full co-financing** (100%)
- Some programs have **no co-financing requirement**

### Best Way to Ask
**Improved approach:**
1. ✅ Yes/No/Uncertain covers basic question
2. ✅ **NEW**: Percentage input when "Yes" - allows precise matching
3. ✅ Helper text: "Many programs require 20-50% co-financing"

**Why This Works:**
- Programs match based on percentage compatibility
- If user says "Yes (30%)" and program requires "20%", it matches ✅
- If user says "Yes (30%)" and program requires "50%", it doesn't match ❌
- This enables precise program filtering

### What Users Need to Specify
- **If Yes**: Percentage they can provide (e.g., 20%, 30%, 50%)
- **If No**: No additional input needed
- **If Uncertain**: No additional input needed (system will show programs with flexible requirements)

### Matching Logic
From `matchCoFinancing` function:
- If program doesn't require co-financing → matches all users ✅
- If user can't provide but program requires → no match ❌
- If both require → checks percentage compatibility:
  - User percentage must be >= program requirement ✅

## Recommendations

### Q5 (Impact)
✅ **Keep current implementation** - it's well-designed:
- Multi-select covers main impact types
- Detail inputs provide valuable context for LLM
- "Other" option handles edge cases

### Q10 (Co-financing)
✅ **Current implementation is good** with percentage input:
- Yes/No/Uncertain covers all cases
- Percentage input enables precise matching
- Helper text guides users

**Optional Enhancement:**
- Could add a slider for percentage (0-100%) instead of text input
- But text input is simpler and allows flexibility (e.g., "20-30%")

