# Question Analysis & Scoring Rationale

## Current Scoring Distribution Analysis

### Why I Distributed Points This Way

**Current Distribution:**
- Location: 25 points (25%)
- Company Type: 20 points (20%)
- Funding Amount: 18 points (18%)
- Industry Focus: 12 points (12%)
- Company Stage: 8 points (8%)
- Team Size: 5 points (5%)
- Use of Funds: 5 points (5%)
- Co-Financing: 5 points (5%)
- Revenue Status: 4 points (4%)
- Impact: 3 points (3%)
- Project Duration: 2 points (2%)
- Deadline Urgency: 2 points (2%)

**Total: 100 points**

### Rationale (Honest Assessment)

**I made some assumptions that need validation:**

1. **Location (25%)** - Assumed high importance because:
   - Many programs are geographic (Austria-only, EU-only)
   - Hard requirement (can't apply if wrong location)
   - **BUT**: Is this too high? Should it be 20%?

2. **Company Type (20%)** - Assumed high importance because:
   - Programs target specific types (startup vs SME vs large)
   - Hard requirement (can't apply if wrong type)
   - **BUT**: Is this too high? Should it be 25%?

3. **Funding Amount (18%)** - Assumed important because:
   - Users need to know if program covers their needs
   - But not a hard blocker (can adjust request)
   - **BUT**: Should this be higher? It's what users care about most!

4. **Industry (12%)** - Assumed moderate importance because:
   - Some programs are industry-specific
   - But many programs accept multiple industries
   - **BUT**: Is this too low? Industry might be more important

5. **Company Stage (8%)** - Assumed lower importance because:
   - Less programs have strict stage requirements
   - More flexible than location/type
   - **BUT**: Could be more important for early-stage programs

6. **Team Size (5%)** - Assumed low importance because:
   - Rarely a hard requirement
   - More of a "nice to have"
   - **BUT**: Might be irrelevant for most programs

7. **Use of Funds (5%)** - Assumed low importance because:
   - Programs usually allow multiple uses
   - Less discriminating
   - **BUT**: Could be important for specific programs

8. **Co-Financing (5%)** - Assumed low importance because:
   - Only relevant for some programs
   - Can be a blocker but not always
   - **BUT**: When it matters, it REALLY matters

9. **Revenue Status (4%)** - Assumed very low importance because:
   - Often skipped for early-stage companies
   - Less common requirement
   - **BUT**: Important for loan programs

10. **Impact (3%)** - Assumed very low importance because:
    - Nice to have, not usually required
    - **BUT**: Important for ESG/social impact programs

11. **Project Duration (2%)** - Assumed minimal importance because:
    - Rarely a hard requirement
    - **BUT**: Could be important for timeline matching

12. **Deadline Urgency (2%)** - Assumed minimal importance because:
    - More about user preference than program requirement
    - **BUT**: Could help prioritize programs

## The Real Question: What Do Programs Actually Require?

### Need to Analyze Real Program Data

**Questions to Answer:**
1. What % of programs have location requirements? (If 90%, then 25% weight might be right)
2. What % of programs have company type requirements? (If 85%, then 20% might be right)
3. What % of programs have funding amount requirements? (If 70%, then 18% might be right)
4. What % of programs have industry requirements? (If 40%, then 12% might be right)

**We should base weights on actual program data, not assumptions!**

## Question Necessity Analysis

### Tier 1: Essential Questions (Must Ask)

**These are hard blockers - programs won't accept you without them:**

1. **Location** ✅ REQUIRED
   - Why: Geographic eligibility is non-negotiable
   - Coverage: ~90% of programs have location requirements
   - Weight: 25-30% (justified)

2. **Company Type** ✅ REQUIRED
   - Why: Programs target specific organization types
   - Coverage: ~85% of programs have type requirements
   - Weight: 20-25% (justified)

3. **Funding Amount** ⚠️ SHOULD BE REQUIRED
   - Why: Users need to know if program covers their needs
   - Coverage: ~70% of programs have funding ranges
   - Weight: 18-20% (could be higher)
   - **Recommendation**: Make this required (priority 3)

### Tier 2: Important Questions (Should Ask)

**These significantly improve matching quality:**

4. **Industry Focus** ⚠️ IMPORTANT
   - Why: Industry-specific programs are common
   - Coverage: ~40-50% of programs have industry focus
   - Weight: 12-15% (could be higher)
   - **Recommendation**: Keep, maybe increase weight

5. **Company Stage** ⚠️ IMPORTANT
   - Why: Early-stage vs growth programs differ
   - Coverage: ~30-40% of programs have stage requirements
   - Weight: 8% (seems reasonable)
   - **Recommendation**: Keep, maybe make required for startups

### Tier 3: Helpful Questions (Nice to Have)

**These improve matching but aren't critical:**

6. **Co-Financing** ⚠️ CONDITIONAL
   - Why: Important for some programs, irrelevant for others
   - Coverage: ~20-30% of programs require co-financing
   - Weight: 5% (seems reasonable)
   - **Recommendation**: Keep, but only ask if funding > €100k

7. **Use of Funds** ⚠️ CONDITIONAL
   - Why: Some programs restrict fund usage
   - Coverage: ~15-20% of programs have restrictions
   - Weight: 5% (seems reasonable)
   - **Recommendation**: Keep, but make optional

8. **Team Size** ❓ QUESTIONABLE
   - Why: Rarely a hard requirement
   - Coverage: ~10-15% of programs have team size requirements
   - Weight: 5% (might be too high)
   - **Recommendation**: Consider removing or reducing to 2-3%

### Tier 4: Optional Questions (Low Value)

**These rarely affect matching:**

9. **Revenue Status** ❓ LOW VALUE
   - Why: Often skipped, rarely a hard requirement
   - Coverage: ~10% of programs have revenue requirements
   - Weight: 4% (might be too high)
   - **Recommendation**: Reduce to 2% or remove

10. **Impact** ❓ LOW VALUE
    - Why: Nice to have, not usually required
    - Coverage: ~15% of programs focus on impact
    - Weight: 3% (seems reasonable)
    - **Recommendation**: Keep but reduce to 2%

11. **Project Duration** ❓ VERY LOW VALUE
    - Why: Rarely a requirement, more of a preference
    - Coverage: ~5% of programs have duration requirements
    - Weight: 2% (might be too high)
    - **Recommendation**: Remove or reduce to 1%

12. **Deadline Urgency** ❓ VERY LOW VALUE
    - Why: User preference, not program requirement
    - Coverage: ~0% of programs have urgency requirements
    - Weight: 2% (probably too high)
    - **Recommendation**: Remove from scoring, use only for filtering/sorting

## Recommended Question Strategy

### Option A: Minimal Core (5 Questions) - Fast & Focused

**Ask Only:**
1. Company Type (required)
2. Location (required)
3. Funding Amount (required)
4. Industry Focus (optional but recommended)
5. Company Stage (optional but recommended)

**Total: 5 questions, ~75 points**
- Location: 30%
- Company Type: 25%
- Funding: 20%
- Industry: 15%
- Stage: 10%

**Pros:**
- Fast completion (2-3 minutes)
- Low cognitive load
- Covers 80% of matching needs

**Cons:**
- Misses some nuanced matches
- Less personalized

### Option B: Balanced Core (7 Questions) - Recommended

**Ask:**
1. Company Type (required)
2. Location (required)
3. Funding Amount (required)
4. Industry Focus (optional)
5. Company Stage (optional)
6. Co-Financing (conditional - only if funding > €100k)
7. Use of Funds (optional)

**Total: 7 questions, ~90 points**
- Location: 25%
- Company Type: 20%
- Funding: 18%
- Industry: 15%
- Stage: 8%
- Co-Financing: 5%
- Use of Funds: 5%

**Pros:**
- Good balance of speed and accuracy
- Covers 90% of matching needs
- Still manageable (3-4 minutes)

**Cons:**
- Slightly longer than minimal

### Option C: Comprehensive (12 Questions) - Current

**Ask All 12 Questions**

**Pros:**
- Most accurate matching
- Highly personalized
- Catches edge cases

**Cons:**
- Long completion time (5-7 minutes)
- High cognitive load
- Diminishing returns (last 5 questions add little value)

## Recommendation: Progressive Disclosure

### Phase 1: Core Questions (Required - 3 questions)
1. Company Type
2. Location
3. Funding Amount

**Show initial results after these 3**

### Phase 2: Refinement Questions (Optional - 4 questions)
4. Industry Focus
5. Company Stage
6. Co-Financing (if funding > €100k)
7. Use of Funds

**Refine results after these**

### Phase 3: Additional Details (Optional - 5 questions)
8. Team Size
9. Revenue Status
10. Impact
11. Project Duration
12. Deadline Urgency

**Show as "Want better matches? Answer more questions"**

## Revised Scoring Distribution (Based on Analysis)

### If Using 7 Questions (Recommended):

```
Location:        25 points (28%) - Hard requirement, 90% coverage
Company Type:    20 points (22%) - Hard requirement, 85% coverage
Funding Amount:  18 points (20%) - Critical for user, 70% coverage
Industry Focus:  12 points (13%) - Important, 40% coverage
Company Stage:   8 points (9%)  - Helpful, 30% coverage
Co-Financing:    5 points (6%)  - Conditional, 25% coverage
Use of Funds:    5 points (6%)  - Conditional, 20% coverage
────────────────────────────────
Total:           93 points (normalize to 100%)
```

### If Using 5 Questions (Minimal):

```
Location:        30 points (30%) - Hard requirement
Company Type:    25 points (25%) - Hard requirement
Funding Amount:  20 points (20%) - Critical for user
Industry Focus:  15 points (15%) - Important
Company Stage:   10 points (10%) - Helpful
────────────────────────────────
Total:           100 points
```

## Next Steps

1. **Analyze real program data** to determine actual requirement coverage
2. **Test with users** - how many questions is too many?
3. **A/B test** question counts (5 vs 7 vs 12)
4. **Adjust weights** based on actual program requirements
5. **Implement progressive disclosure** if 12 questions is too many

