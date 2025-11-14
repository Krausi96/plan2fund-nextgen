# A/B Testing Plan: Explanation Display Methods

## Overview

Test different explanation display methods to determine which format helps users:
1. Understand why programs match their needs
2. Make informed decisions about which programs to pursue
3. Trust the recommendation system

## Test Variants

### Variant A: Score-First (Control)
**Display Order:**
1. Match Score (large, prominent)
2. Score Breakdown (visual bars showing contribution of each factor)
3. LLM-generated explanation (2-3 bullet points)

**Example:**
```
Match Score: 87%

Score Breakdown:
📍 Location: 22% ✓
🏢 Company Type: 20% ✓
💰 Funding Amount: 18% ✓
🏭 Industry: 15% ✓
💡 Impact: 8% ✓

Why this matches:
• Your location (Austria) matches this program's geographic requirements (22% of match score)
• Your company type (startup) qualifies for this program (20% of match score)
• Your funding need (€100k-€500k) aligns with this program's range (18% of match score)
```

### Variant B: LLM-First
**Display Order:**
1. LLM-generated explanation (prominent, narrative style)
2. Match Score (smaller, secondary)
3. Score Breakdown (collapsible, "Show details")

**Example:**
```
Why this program fits your needs:

This Austrian Startup Grant is an excellent match for your early-stage tech startup based in Vienna. Your location (Austria) is a mandatory requirement for this program, and your company type (startup) aligns perfectly with their target audience. The funding range you need (€100k-€500k) fits within their offering, and your digital industry focus matches their priority sectors.

Match Score: 87% | Show breakdown →
```

### Variant C: LLM-Only (Minimal)
**Display Order:**
1. LLM-generated explanation only
2. Match Score (very small, subtle)
3. No score breakdown (hidden unless user clicks "Show technical details")

**Example:**
```
This Austrian Startup Grant is an excellent match for your early-stage tech startup based in Vienna. Your location (Austria) is a mandatory requirement for this program, and your company type (startup) aligns perfectly with their target audience. The funding range you need (€100k-€500k) fits within their offering, and your digital industry focus matches their priority sectors.

87% match
```

## Implementation

### Feature Flag
```typescript
// shared/lib/featureFlags.ts
export const EXPLANATION_VARIANT = process.env.EXPLANATION_VARIANT || 'A'; // A, B, or C
```

### Component Structure
```typescript
// features/reco/components/ProgramExplanation.tsx
interface ProgramExplanationProps {
  program: EnhancedProgramResult;
  variant: 'A' | 'B' | 'C';
}

export function ProgramExplanation({ program, variant }: ProgramExplanationProps) {
  switch (variant) {
    case 'A': return <ScoreFirstExplanation program={program} />;
    case 'B': return <LLMFirstExplanation program={program} />;
    case 'C': return <LLMOnlyExplanation program={program} />;
  }
}
```

### User Assignment
- **Method**: Random assignment on first visit (stored in localStorage)
- **Distribution**: 33% each variant
- **Persistence**: Same variant for user across session

## Metrics to Track

### Primary Metrics
1. **Click-through rate**: % of users who click "View Details" or "Apply"
2. **Time on results page**: How long users spend reviewing programs
3. **Program selection rate**: % of users who select a program to view details

### Secondary Metrics
1. **User satisfaction**: Post-interaction survey (optional)
2. **Bounce rate**: % who leave without selecting a program
3. **Return rate**: % who come back to view more programs

### Qualitative Metrics
1. **User feedback**: Optional feedback button on results page
2. **Support tickets**: Track if users ask "why did I get this recommendation?"

## Success Criteria

### Variant A (Score-First) wins if:
- Higher click-through rate
- Users understand scoring better (survey)
- Lower bounce rate

### Variant B (LLM-First) wins if:
- Higher program selection rate
- Longer time on page (engaged reading)
- Higher user satisfaction

### Variant C (LLM-Only) wins if:
- Higher click-through rate
- Faster decision-making (lower time on page but higher selection)
- Better for mobile users

## Testing Duration

- **Minimum**: 2 weeks (to get ~500-1000 users per variant)
- **Target**: 4 weeks (to account for weekly patterns)
- **Sample size**: ~1500-3000 total users (500-1000 per variant)

## Analysis

### Statistical Significance
- Use chi-square test for click-through rates
- Use t-test for time on page
- Confidence level: 95%

### Reporting
Weekly dashboard showing:
- Conversion rates by variant
- Time on page by variant
- User feedback summary

## Rollout Plan

1. **Week 1-2**: Deploy all variants with feature flag
2. **Week 3-4**: Monitor metrics, collect data
3. **Week 5**: Analyze results, determine winner
4. **Week 6**: Roll out winning variant to 100% of users

## Edge Cases

1. **LLM failure**: Fallback to Variant A (score-first) with rule-based explanations
2. **No matched criteria**: Show generic message with score only
3. **Low score (<50%)**: Emphasize gaps more prominently in all variants

## Future Enhancements

1. **Personalization**: Learn which variant works best for different user types
2. **Dynamic weighting**: Show different explanations based on score level
3. **Interactive breakdown**: Let users expand/collapse score components

