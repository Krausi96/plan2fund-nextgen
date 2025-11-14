# A/B Testing Metrics & Outcomes

## What We Measure

### Primary Metrics (Conversion Funnel)

1. **Click-Through Rate (CTR)**
   - **Definition:** % of users who click "View Details" or "Apply" on a program
   - **Measurement:** Track button clicks on program cards
   - **Formula:** `(clicks / impressions) * 100`
   - **Expected Range:** 20-40% (industry standard for recommendation systems)
   - **Why it matters:** Shows if explanations motivate users to learn more

2. **Program Selection Rate**
   - **Definition:** % of users who select a program to view in editor
   - **Measurement:** Track navigation to `/editor?programId=...`
   - **Formula:** `(selections / total users) * 100`
   - **Expected Range:** 15-30%
   - **Why it matters:** Ultimate conversion - did they find a program worth pursuing?

3. **Time to Decision**
   - **Definition:** Average time from seeing results to clicking a program
   - **Measurement:** Track time between results display and program click
   - **Expected Range:** 5-30 seconds
   - **Why it matters:** Faster = better UX, but too fast = didn't read (bad)

### Secondary Metrics (Engagement)

4. **Time on Results Page**
   - **Definition:** Average time users spend viewing results
   - **Measurement:** Track page view duration
   - **Expected Range:** 30-120 seconds
   - **Why it matters:** Longer = more engaged, reading explanations

5. **Programs Viewed per Session**
   - **Definition:** Average number of programs user clicks on
   - **Measurement:** Count unique program clicks per session
   - **Expected Range:** 1-3 programs
   - **Why it matters:** More views = exploring options (good), but too many = confused (bad)

6. **Bounce Rate**
   - **Definition:** % of users who leave without clicking any program
   - **Measurement:** Track users who view results but don't click
   - **Formula:** `(bounces / total users) * 100`
   - **Expected Range:** 30-50% (acceptable for recommendation systems)
   - **Why it matters:** Lower = better explanations helped them find matches

### Qualitative Metrics

7. **User Satisfaction**
   - **Definition:** Self-reported satisfaction with explanations (1-5 scale)
   - **Measurement:** Optional survey after program selection
   - **Expected Range:** 3.5-4.5 average
   - **Why it matters:** Do users understand why programs match?

8. **Support Tickets**
   - **Definition:** Number of users asking "why did I get this recommendation?"
   - **Measurement:** Track support requests related to recommendations
   - **Expected Range:** <5% of users
   - **Why it matters:** Lower = explanations are clear

## Expected Outcomes by Variant

### Variant A: Score-First (Control)
**Hypothesis:** Technical users prefer transparency, data-driven decisions

**Expected Results:**
- ✅ Higher CTR (users trust scores)
- ✅ Faster time to decision (quick scan)
- ⚠️ Lower satisfaction (too technical for some)
- ⚠️ Higher bounce rate (confusing for non-technical users)

**Wins if:**
- CTR > 35%
- Time to decision < 10s
- Selection rate > 25%

### Variant B: LLM-First
**Hypothesis:** Narrative explanations are more engaging and trustworthy

**Expected Results:**
- ✅ Higher satisfaction (more informative)
- ✅ Longer time on page (engaged reading)
- ✅ Higher selection rate (better understanding)
- ⚠️ Slower time to decision (reading takes time)

**Wins if:**
- Selection rate > 30%
- Satisfaction > 4.0
- Time on page > 60s

### Variant C: LLM-Only (Minimal)
**Hypothesis:** Less is more - simple explanations reduce cognitive load

**Expected Results:**
- ✅ Fastest time to decision (minimal info)
- ✅ Good for mobile users (less scrolling)
- ⚠️ Lower satisfaction (not enough info)
- ⚠️ Higher bounce rate (unclear why programs match)

**Wins if:**
- Time to decision < 8s
- CTR > 30%
- Mobile conversion > desktop

## Success Criteria

### Overall Winner Determination

**Weighted Scoring:**
- Click-Through Rate: **30%** (most important - shows engagement)
- Program Selection Rate: **30%** (ultimate conversion)
- Time to Decision: **20%** (UX quality)
- User Satisfaction: **20%** (qualitative feedback)

**Formula:**
```
Overall Score = (CTR * 0.3) + (Selection Rate * 0.3) + (Time Score * 0.2) + (Satisfaction * 0.2)
```

Where:
- CTR: 0-1 (percentage / 100)
- Selection Rate: 0-1 (percentage / 100)
- Time Score: 1 - (avgTime / 30000) [normalized, inverted - faster is better]
- Satisfaction: 0-1 (score / 5)

### Statistical Significance

- **Minimum Sample Size:** 500 users per variant (1,500 total)
- **Confidence Level:** 95%
- **Test Duration:** 2-4 weeks (to account for weekly patterns)
- **Analysis Method:**
  - Chi-square test for CTR and selection rates
  - T-test for time metrics
  - ANOVA for satisfaction scores

## What Success Looks Like

### Best Case Scenario
- **Winner:** Variant B (LLM-First)
- **Results:**
  - Selection rate: 35% (vs 25% baseline)
  - Satisfaction: 4.2/5
  - CTR: 40%
  - Time to decision: 12s (acceptable for reading)

### Acceptable Scenario
- **Winner:** Variant A (Score-First)
- **Results:**
  - Selection rate: 28% (vs 25% baseline)
  - Satisfaction: 3.8/5
  - CTR: 38%
  - Time to decision: 8s (fast)

### Worst Case Scenario
- **No clear winner** (all variants within 5% of each other)
- **Action:** Keep Variant A (control), or test new variants

## Implementation Tracking

### Analytics Events to Track

```typescript
// When results are displayed
analytics.track('reco_results_displayed', {
  variant: 'A' | 'B' | 'C',
  programCount: number,
  topScore: number,
});

// When user clicks "View Details"
analytics.track('reco_program_clicked', {
  variant: 'A' | 'B' | 'C',
  programId: string,
  programScore: number,
  timeToClick: number, // milliseconds
  position: number, // 1st, 2nd, 3rd program
});

// When user navigates to editor
analytics.track('reco_program_selected', {
  variant: 'A' | 'B' | 'C',
  programId: string,
  programScore: number,
  timeToSelection: number,
});

// When user leaves without clicking
analytics.track('reco_bounced', {
  variant: 'A' | 'B' | 'C',
  timeOnPage: number,
  programsShown: number,
});
```

### Dashboard Metrics

**Weekly Dashboard Should Show:**
- CTR by variant (line chart)
- Selection rate by variant (bar chart)
- Time to decision by variant (box plot)
- Satisfaction scores by variant (bar chart)
- Overall winner (highlighted)

## Next Steps After Testing

1. **If clear winner:** Roll out to 100% of users
2. **If close results:** Extend test by 1-2 weeks
3. **If no winner:** Consider hybrid approach or new variants
4. **If all variants fail:** Revisit explanation strategy

