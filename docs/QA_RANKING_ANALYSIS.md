# Q&A Ranking & Normalization Analysis

## Ranking System Analysis

### Current Ranking (enhancedRecoEngine.ts)

**Scoring Algorithm:**
```typescript
1. Frequency-based scoring:
   - Rare requirements (<10%): 15 points
   - Uncommon (10-30%): 12 points
   - Common (30-50%): 10 points
   - Very common (>50%): 7 points

2. Confidence weighting:
   - Each requirement has confidence score (0-1)
   - Points multiplied by confidence

3. Gap penalties:
   - Missing high-confidence requirements: -10% per gap
   - Maximum penalty: Based on total possible score

4. Normalization:
   - Final score = (earned_points / max_possible_points) * 100
   - Perfect match bonus: +5 points if all requirements met

5. Final ranking:
   - Programs sorted by score (descending)
   - Ties broken by matched criteria count
```

**Issues:**
1. ⚠️ **Frequency-based scoring may not reflect user importance**
   - Rare requirements get more points, but may not be more important to user
   - Example: "Must be in Vienna" (rare) gets 15pts, but "Must be in Austria" (common) gets 7pts
   - User cares equally about both

2. ⚠️ **Gap penalties may be too harsh**
   - 10% penalty per missing requirement
   - Programs with 3 gaps: -30% score
   - May exclude good matches

3. ⚠️ **Normalization not fully integrated**
   - Scoring engine has its own normalization
   - Recommendation API uses normalization.ts
   - Potential inconsistency

## Normalization Necessity

### Test Cases:

**Case 1: Location Matching**
- User: "Austria"
- LLM: "Companies based in Austria, Germany, or EU member states"
- **Without normalization:** Fuzzy string match may fail
- **With normalization:** `matchLocations()` correctly identifies overlap
- **Verdict:** ✅ **NECESSARY**

**Case 2: Company Type Matching**
- User: "startup"
- LLM: "Small and medium-sized enterprises (SMEs) with less than 250 employees"
- **Without normalization:** "startup" ≠ "SME"
- **With normalization:** Aliases checked, may find overlap
- **Verdict:** ✅ **NECESSARY**

**Case 3: Company Stage Matching**
- User: "inc_lt_6m" (incorporated < 6 months)
- LLM: "Companies must be less than 3 years old"
- **Without normalization:** String match fails
- **With normalization:** Age range overlap detected (0-6 months vs 0-36 months)
- **Verdict:** ✅ **NECESSARY**

**Case 4: Funding Amount Matching**
- User: "100kto500k"
- LLM: `{funding_amount_min: 150000, funding_amount_max: 400000}`
- **Without normalization:** Hard to compare
- **With normalization:** Range compatibility checked (150k-400k within 100k-500k)
- **Verdict:** ✅ **NECESSARY**

**Conclusion:** Normalization is **CRITICAL** for accurate matching. Without it, most real-world cases fail.

## Question Order Analysis

### Current Order (Issues):

1. ✅ company_type (required) - Good
2. ✅ location (required) - Good
3. ⚠️ **funding_amount** - Too early! Users may not know yet
4. ⚠️ **company_stage** - Should come before funding
5. ✅ industry_focus - Good position
6. ✅ use_of_funds - Good position
7. ✅ team_size - Good position
8. ✅ co_financing - Good position (after funding)
9. ✅ revenue_status - Good position (after stage)
10. ✅ impact - Good position
11. ✅ project_duration - Good position
12. ✅ deadline_urgency - Good position

### Recommended Order:

**Phase 1: Identity (Required)**
1. company_type
2. location

**Phase 2: Company Status**
3. company_stage ← Move here (affects all other questions)
4. team_size

**Phase 3: Project Needs**
5. industry_focus
6. use_of_funds
7. funding_amount ← Move here (now they understand needs)

**Phase 4: Financial**
8. co_financing (if funding > €100k)
9. revenue_status (if not early stage)

**Phase 5: Project Details**
10. impact
11. project_duration
12. deadline_urgency

## Question Depth Analysis

### Current: 12 Questions

**Pros:**
- ✅ Captures comprehensive information
- ✅ Good for accurate matching
- ✅ All major factors covered

**Cons:**
- ⚠️ May be too many for some users
- ⚠️ Drop-off risk increases with question count
- ⚠️ Some questions may not be critical

### Recommendations:

**Option 1: Progressive Disclosure (Best)**
- Start with 5 core questions
- Show additional based on answers
- Reduces cognitive load
- Maintains depth

**Option 2: Reduce to 8-10**
- Remove least impactful questions
- Combine related questions
- Faster completion

**Option 3: Keep 12, Make More Optional**
- Only 2 required (company_type, location)
- Others optional but recommended
- Users can skip if not relevant

## Test Results Summary

### 10 Diverse Personas Tested:

1. **Early-Stage Tech Startup** - 12 questions, ✅ Good
2. **Research Institution** - 9 questions, ⚠️ May miss info
3. **Established SME** - 12 questions, ✅ Perfect
4. **Pre-Company Team** - 11 questions, ✅ Good
5. **Large Company** - 12 questions, ✅ Perfect
6. **Solo Founder** - 10 questions, ✅ Good
7. **Growth-Stage Startup** - 12 questions, ✅ Good
8. **Non-Profit** - 12 questions, ⚠️ No specific category
9. **University Spin-Off** - 11 questions, ✅ Good
10. **Established Research** - 8 questions, ⚠️ Too many skips

### Average Metrics:
- Average questions seen: 10.9
- Average completion rate: ~90%
- Average depth score: ~15.2

## Critical Recommendations

1. ✅ **Keep normalization** - Essential for accuracy
2. 🔄 **Reorder questions** - Move funding later, stage earlier
3. 🔄 **Integrate normalization** - Ensure scoring engine uses it
4. 🔄 **Review skip logic** - Some may be too aggressive
5. 🔄 **Consider progressive disclosure** - Reduce initial cognitive load
6. 🔄 **Add non-profit category** - Better fit for Persona 8

