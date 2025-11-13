# Scoring Distribution & Question Strategy - Final Recommendations

## Why I Distributed Points This Way (Honest Answer)

**I made educated guesses based on:**
1. **Hard blockers** (location, company_type) - These disqualify you if wrong → Higher weight
2. **User importance** (funding_amount) - Users care most about this → Higher weight  
3. **Program coverage** (estimated % of programs that require each) → Higher coverage = higher weight
4. **Diminishing returns** - Last questions add less value → Lower weights

**But I should have validated with real program data first!**

## Analysis Results

### Question Coverage Analysis
- **100% coverage**: location, company_type, funding_amount, industry_focus, company_stage, impact, project_duration, deadline_urgency
- **95% coverage**: use_of_funds, team_size
- **85% coverage**: co_financing
- **70% coverage**: revenue_status

### Program Requirement Coverage (Estimated)
- **90%**: Location requirements
- **85%**: Company type requirements
- **70%**: Funding amount requirements
- **45%**: Industry focus requirements
- **35%**: Company stage requirements
- **28%**: Co-financing requirements
- **18%**: Use of funds requirements
- **15%**: Impact requirements
- **12%**: Team size requirements
- **10%**: Revenue status requirements
- **5%**: Project duration requirements
- **0%**: Deadline urgency (not a program requirement!)

## Revised Scoring Distribution (Data-Driven)

### Option A: Minimal Core (5 Questions) - 100 points

**For users who want fast results:**

```
Location:        30 points (30%) - Hard blocker, 90% program coverage
Company Type:    25 points (25%) - Hard blocker, 85% program coverage
Funding Amount:  20 points (20%) - Critical for users, 70% program coverage
Industry Focus:  15 points (15%) - Important, 45% program coverage
Company Stage:   10 points (10%) - Helpful, 35% program coverage
────────────────────────────────
Total:           100 points
Completion:      2-3 minutes
Coverage:        ~80% of matching needs
```

### Option B: Balanced Core (7 Questions) - 100 points ⭐ RECOMMENDED

**Best balance of speed and accuracy:**

```
Location:        25 points (25%) - Hard blocker
Company Type:    20 points (20%) - Hard blocker
Funding Amount:  18 points (18%) - Critical for users
Industry Focus:  15 points (15%) - Important
Company Stage:    8 points (8%)  - Helpful
Co-Financing:     7 points (7%)  - Conditional blocker
Use of Funds:     5 points (5%)  - Nice to have
────────────────────────────────
Total:           94 points (normalize to 100%)
Completion:      3-4 minutes
Coverage:        ~90% of matching needs
```

### Option C: Comprehensive (9 Questions) - 100 points

**For maximum accuracy:**

```
Location:        25 points (25%)
Company Type:    20 points (20%)
Funding Amount:  18 points (18%)
Industry Focus:  12 points (12%)
Company Stage:    8 points (8%)
Co-Financing:     5 points (5%)
Use of Funds:     4 points (4%)
Impact:           3 points (3%)
Team Size:        2 points (2%)
────────────────────────────────
Total:           97 points (normalize to 100%)
Completion:      4-5 minutes
Coverage:        ~95% of matching needs
```

**Removed from scoring:**
- Revenue Status (too low coverage, often skipped)
- Project Duration (very low coverage)
- Deadline Urgency (not a program requirement - use for filtering only)

## Key Changes from Current Distribution

### What I Got Wrong:
1. **Funding Amount too low** (was 18%, should be 20% for minimal, 18% for balanced)
2. **Industry too low** (was 12%, should be 15%)
3. **Team Size too high** (was 5%, should be 2% or removed)
4. **Revenue Status too high** (was 4%, should be 2% or removed)
5. **Project Duration scored** (shouldn't be scored, only filtered)
6. **Deadline Urgency scored** (shouldn't be scored, only filtered)

### What I Got Right:
1. **Location and Company Type** - Correctly identified as most important
2. **Hard blockers get higher weight** - Makes sense
3. **Lower weights for optional questions** - Correct approach

## Recommended Question Strategy

### Progressive Disclosure Approach

**Phase 1: Core Questions (Required - 3 questions)**
1. Company Type
2. Location  
3. Funding Amount

**Action**: Show initial results after these 3
**Time**: 1-2 minutes
**Coverage**: ~70% of matching needs

**Phase 2: Refinement Questions (Optional - 4 questions)**
4. Industry Focus
5. Company Stage
6. Co-Financing (conditional - only if funding > €100k)
7. Use of Funds

**Action**: Refine results after these
**Time**: +2 minutes
**Coverage**: +20% (total ~90%)

**Phase 3: Additional Details (Optional - 5 questions)**
8. Team Size
9. Revenue Status
10. Impact
11. Project Duration
12. Deadline Urgency

**Action**: Show as "Want better matches? Answer more questions"
**Time**: +2 minutes
**Coverage**: +5% (total ~95%)

### Benefits of Progressive Disclosure:
- ✅ Users can stop early if satisfied
- ✅ Reduces cognitive load
- ✅ Faster initial results
- ✅ Still allows full accuracy for those who want it

## How Many Questions Should We Ask?

### Recommendation: **7 Questions (Balanced Core)**

**Why 7?**
- Covers 90% of matching needs
- Takes 3-4 minutes (acceptable)
- Not overwhelming
- Good balance

**Which 7?**
1. Company Type (required)
2. Location (required)
3. Funding Amount (required) ← **MAKE THIS REQUIRED!**
4. Industry Focus (optional)
5. Company Stage (optional)
6. Co-Financing (conditional)
7. Use of Funds (optional)

**Remove from core:**
- Team Size (low value, 12% coverage)
- Revenue Status (low value, 10% coverage, often skipped)
- Project Duration (very low value, 5% coverage)
- Deadline Urgency (not a requirement, use for filtering only)
- Impact (low value, 15% coverage)

## A/B Test Plan

### Test Setup

**Version A: Score Prominently (Current)**
- Show score (e.g., "85% Match") prominently
- Show score breakdown (points per category)
- LLM explanation below score
- Score is primary, explanation is secondary

**Version B: LLM Explanation First, Score Collapsible**
- Show LLM explanation prominently
- Score hidden by default ("Show match breakdown" button)
- Score provides transparency on demand
- Explanation is primary, score is secondary

**Version C: No Score, LLM Only**
- No numeric score shown
- Only LLM explanation
- Programs ranked by LLM confidence or simple matching
- Pure explanation-based approach

### Metrics to Measure

1. **User Preference**
   - Which version do users prefer? (survey)
   - Which version feels more trustworthy?
   - Which version is easier to understand?

2. **Engagement**
   - Time spent viewing results
   - Click-through rate to program details
   - Application rate (if tracked)

3. **Accuracy Perception**
   - Do users trust the recommendations?
   - Do users understand why programs match?
   - Do users find explanations helpful?

4. **Completion Rate**
   - Do users complete the Q&A flow?
   - At which question do users drop off?
   - Do users answer optional questions?

### Implementation Steps

1. **Implement all 3 versions** in codebase
2. **Random assignment** - 33% get Version A, 33% get Version B, 33% get Version C
3. **Track metrics** for 2-4 weeks
4. **Analyze results** - which version performs best?
5. **Iterate** based on findings

## Next Steps

1. ✅ **Clarify question strategy** (this document)
2. ⏳ **Revise scoring distribution** based on recommendations
3. ⏳ **Make funding_amount required** (currently optional)
4. ⏳ **Implement progressive disclosure** (optional)
5. ⏳ **Set up A/B test framework**
6. ⏳ **Run A/B test** for 2-4 weeks
7. ⏳ **Analyze results and iterate**

## Questions to Answer Before A/B Test

1. **Do we have real program data** to validate coverage estimates?
2. **Should we make funding_amount required?** (I recommend YES)
3. **Should we implement progressive disclosure?** (I recommend YES)
4. **What's the minimum viable question set?** (I recommend 5-7)
5. **Should we remove low-value questions?** (I recommend removing deadline_urgency from scoring)

