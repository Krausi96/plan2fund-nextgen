# Recommendation System Simplification Proposal

## Quick Reference: `organisation_stage` Answer Values

| Value | Label (EN) | Maps To |
|-------|-----------|---------|
| `exploring_idea` | Exploring an idea (no company yet, planning phase) | `company_type: 'founder_idea'`, `company_stage: 'pre_company'` |
| `early_stage_startup` | Early-stage startup (building first product/prototype, < 6 months old) | `company_type: 'startup'`, `company_stage: 'inc_lt_6m'` |
| `growing_startup` | Growing startup (incorporated, first customers, < 3 years old) | `company_type: 'startup'`, `company_stage: 'inc_6_36m'` |
| `established_sme` | Established SME (3+ years operating, expanding/innovating) | `company_type: 'sme'`, `company_stage: 'inc_gt_36m'` |
| `research_institution` | Research institution or university | `company_type: 'research'`, `company_stage: 'research_org'` |
| `public_body` | Public body or municipality | `company_type: 'public'`, `company_stage: 'public_org'` |
| `other` | Other organisation type | `company_type: 'other'`, `company_stage: null` (inferred from text) |

## Current Issues

### 1. **Scoring is Biased**
- **Problem**: Scoring weights don't match the updated Q&A table
- **Current weights** (total = 100):
  - location: 35 pts ✅ (correct)
  - companyType: 20 pts ❌ (should be derived from `organisation_stage`)
  - funding: 20 pts ✅ (correct)
  - industry: 10 pts ✅ (correct)
  - teamSize: 5 pts ❌ (Q12 was removed from Q&A table!)
  - revenueStatus: 3 pts ⚠️ (should determine eligibility, not just scoring)
  - impactFocus: 4 pts ✅ (correct)
  - deadlineUrgency: 3 pts ✅ (correct)
  - use_of_funds: +2 bonus ✅ (correct)

- **Missing**: No proper filtering by funding type eligibility based on `revenue_status` and `co_financing`

### 2. **Not Getting All Funding Types**
- **Problem**: LLM prompt is complex but doesn't properly enforce funding type diversity
- **Root cause**: Scoring doesn't filter programs by funding type eligibility before scoring
- **Impact**: Users with `co_financing: 'co_no'` still see loans/equity programs

### 3. **Q&A Not Updated**
- **Problem**: Wizard questions don't match `WIZARD_UPDATED_QA_TABLE.md`
- **Current questions**:
  - `company_type` + `project_scope` (separate)
  - Missing `organisation_stage` (merged Q2)
  - Missing `revenue_status` as core question (Q3)
  - `co_financing` exists but not properly used for filtering

### 4. **Too Much Code in LLM Files**
- `pages/api/programs/recommend.ts`: **1037 lines** - Very complex prompt building
- `features/reco/engine/llmExtract.ts`: **1090 lines** - Complex extraction logic
- **Issue**: Hard to maintain, test, and debug

---

## Proposed Solution

### Phase 1: Fix Scoring & Eligibility (Critical)

#### 1.1 Update Scoring Weights
```typescript
const SCORE_WEIGHTS = {
  location: 35,        // Highest weight (unchanged)
  organisationStage: 20, // NEW: Derived from organisation_stage
  funding: 20,         // Critical (unchanged)
  industry: 10,       // Bonus (unchanged)
  impactFocus: 4,     // Advanced (unchanged)
  deadlineUrgency: 3,  // Advanced (unchanged)
  useOfFunds: 2,      // Bonus (unchanged)
  // REMOVED: teamSize (Q12 was removed)
  // REMOVED: revenueStatus (used for filtering, not scoring)
};
```

#### 1.2 Add Funding Type Eligibility Filter
**Before scoring**, filter programs by:
- `revenue_status` → determines eligible funding types
- `co_financing` → determines if loans/equity/guarantees are allowed

```typescript
function isFundingTypeEligible(
  program: Program,
  answers: UserAnswers
): boolean {
  const fundingTypes = program.funding_types || [];
  const revenueStatus = answers.revenue_status;
  const coFinancing = answers.co_financing;

  // If user cannot provide co-financing, only grants/subsidies allowed
  if (coFinancing === 'co_no') {
    const allowedTypes = ['grant', 'subsidy', 'coaching', 'mentoring', 'networking'];
    return fundingTypes.some(type => allowedTypes.includes(type));
  }

  // Pre-revenue users: grants, subsidies, some equity (angel, crowdfunding)
  if (revenueStatus === 'pre_revenue') {
    const allowedTypes = [
      'grant', 'subsidy', 'angel_investment', 'crowdfunding',
      'micro_credit', 'visa_application'
    ];
    return fundingTypes.some(type => allowedTypes.includes(type));
  }

  // Early revenue: all types except large VC (need established revenue)
  if (revenueStatus === 'early_revenue') {
    const restrictedTypes = ['venture_capital']; // Usually requires €500k+ revenue
    return !fundingTypes.some(type => restrictedTypes.includes(type));
  }

  // Established revenue: all types allowed
  return true;
}
```

#### 1.3 Update Scoring to Use `organisation_stage`
```typescript
// Map organisation_stage to company_type + company_stage
// This allows backward compatibility with existing matching logic
function deriveCompanyInfo(organisationStage: string): {
  company_type: string;
  company_stage: string | null;
} {
  const mapping: Record<string, { type: string; stage: string | null }> = {
    'exploring_idea': { 
      type: 'founder_idea', 
      stage: 'pre_company' 
    },
    'early_stage_startup': { 
      type: 'startup', 
      stage: 'inc_lt_6m'  // < 6 months old
    },
    'growing_startup': { 
      type: 'startup', 
      stage: 'inc_6_36m'  // < 3 years old
    },
    'established_sme': { 
      type: 'sme', 
      stage: 'inc_gt_36m'  // 3+ years operating
    },
    'research_institution': { 
      type: 'research', 
      stage: 'research_org' 
    },
    'public_body': { 
      type: 'public', 
      stage: 'public_org' 
    },
    'other': { 
      type: 'other', 
      stage: null  // Will be inferred from other text if available
    },
  };
  
  return mapping[organisationStage] || { type: 'other', stage: null };
}
```

### Phase 2: Simplify LLM Prompt (Reduce Complexity)

#### 2.1 Extract Prompt Templates
Move prompt building to separate file:
- `features/reco/prompts/recommendPrompt.ts` (200-300 lines)
- `features/reco/prompts/extractPrompt.ts` (300-400 lines)

#### 2.2 Simplify Prompt Logic
- Remove retry-specific instructions (handle in retry logic, not prompt)
- Remove special case handling (research, large amounts) - use generic rules
- Focus on core matching criteria only

#### 2.3 Reduce Token Usage
- Remove verbose examples
- Use concise instructions
- Target: Reduce prompt from ~2000 tokens to ~800 tokens

### Phase 3: Update Wizard Questions

#### 3.1 `organisation_stage` Answer Values

Based on the Q&A table, the new `organisation_stage` question replaces both `company_type` and `project_scope`. Here are the answer values:

```typescript
{
  id: 'organisation_stage',
  label: 'What best describes your organisation and current project stage?',
  type: 'single-select',
  options: [
    { 
      value: 'exploring_idea', 
      label: 'Exploring an idea (no company yet, planning phase)',
      // Maps to: company_type: 'founder_idea', company_stage: 'pre_company'
    },
    { 
      value: 'early_stage_startup', 
      label: 'Early-stage startup (building first product/prototype, < 6 months old)',
      // Maps to: company_type: 'startup', company_stage: 'inc_lt_6m'
    },
    { 
      value: 'growing_startup', 
      label: 'Growing startup (incorporated, first customers, < 3 years old)',
      // Maps to: company_type: 'startup', company_stage: 'inc_6_36m'
    },
    { 
      value: 'established_sme', 
      label: 'Established SME (3+ years operating, expanding/innovating)',
      // Maps to: company_type: 'sme', company_stage: 'inc_gt_36m'
    },
    { 
      value: 'research_institution', 
      label: 'Research institution or university',
      // Maps to: company_type: 'research', company_stage: 'research_org'
    },
    { 
      value: 'public_body', 
      label: 'Public body or municipality',
      // Maps to: company_type: 'public', company_stage: 'public_org'
    },
    { 
      value: 'other', 
      label: 'Other organisation type',
      hasOtherTextInput: true,
      // Maps to: company_type: 'other', company_stage: null (inferred from text)
    },
  ],
  required: true,
  priority: 2,
  isAdvanced: false,
}
```

#### 3.2 Migration Mapping (Old → New)

To migrate existing user answers, map old `company_type` + `project_scope` combinations to new `organisation_stage`:

```typescript
function migrateToOrganisationStage(
  companyType: string,
  projectScope?: string
): string {
  // Direct mappings from company_type
  if (companyType === 'founder_idea') {
    return 'exploring_idea';
  }
  if (companyType === 'startup_building') {
    return 'early_stage_startup';
  }
  if (companyType === 'startup_traction') {
    return 'growing_startup';
  }
  if (companyType === 'sme_established') {
    return 'established_sme';
  }
  
  // Check for research/public in "other" text
  if (companyType === 'other') {
    const otherText = (companyType_other || '').toLowerCase();
    if (otherText.includes('research') || otherText.includes('university') || 
        otherText.includes('institution') || otherText.includes('lab')) {
      return 'research_institution';
    }
    if (otherText.includes('public') || otherText.includes('municipality') || 
        otherText.includes('government') || otherText.includes('gemeinde')) {
      return 'public_body';
    }
    return 'other';
  }
  
  // Default fallback
  return 'other';
}
```

#### 3.3 Derive `company_type` and `company_stage` from `organisation_stage`

For backward compatibility with existing matching logic, use the same function as in 1.3 above. This ensures the scoring engine can still work with `company_type` and `company_stage` internally while the UI uses the simpler `organisation_stage` question.

#### 3.4 Question Grouping

Group questions logically in the UI for better UX:

**Group 1: Getting Started** (Gate)
- Q1: `funding_intent` - "Are you looking for funding?"

**Group 2: About Your Organisation** (Core - Required)
- Q2: `organisation_stage` - "What describes your organisation?"
- Q3: `revenue_status` - "What's your revenue situation?"
- Q4: `location` - "Where will the project take place?"

**Group 3: Funding Needs** (Core - Required)
- Q5: `funding_amount` - "How much funding?"
- Q6: `industry_focus` - "Which industry focus?"
- Q7: `co_financing` - "Can you contribute co-financing?"

**Group 4: Additional Details** (Optional - Improves Matching)
- Q8: `use_of_funds` - "How will you use funds?"

**Group 5: Advanced Preferences** (Optional - Fine-tuning)
- Q9: `deadline_urgency` - "When do you need a decision?"
- Q10: `impact_focus` - "Which impact areas?"

#### 3.5 Update Question Order
1. `funding_intent` (gate - Group 1)
2. `organisation_stage` (NEW - merged, Group 2)
3. `revenue_status` (moved to core, Group 2)
4. `location` (Group 2)
5. `funding_amount` (Group 3)
6. `industry_focus` (Group 3)
7. `co_financing` (moved to core, Group 3)
8. `use_of_funds` (Group 4)
9. `deadline_urgency` (advanced, Group 5)
10. `impact_focus` (advanced, Group 5)

#### 3.6 Visual Question Grouping in UI

```
┌─────────────────────────────────────────────────────────┐
│ Group 1: Getting Started                                 │
│ ─────────────────────────────────────────────────────── │
│ Q1: Are you looking for a funding option?              │
│     [Yes, find programs] [Not yet, just planning]       │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Group 2: About Your Organisation (Required)            │
│ ─────────────────────────────────────────────────────── │
│ Q2: What describes your organisation?                  │
│     [Exploring idea] [Early startup] [Growing startup]  │
│     [Established SME] [Research] [Public] [Other]       │
│                                                          │
│ Q3: What's your revenue situation?                     │
│     [Pre-revenue] [Early revenue] [Established] [N/A]  │
│                                                          │
│ Q4: Where will the project take place?                  │
│     [Austria] [Germany] [EU] [International]           │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Group 3: Funding Needs (Required)                      │
│ ─────────────────────────────────────────────────────── │
│ Q5: How much funding? (€0 - €1M)                      │
│     [━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━]   │
│                                                          │
│ Q6: Which industry focus? (Multi-select)                │
│     ☑ Digital & Software  ☐ Climate & Sustainability  │
│     ☐ Health & Life Sciences  ☐ Manufacturing         │
│                                                          │
│ Q7: Can you contribute co-financing?                     │
│     [Yes, 20%+] [No, need full funding] [Flexible]     │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Group 4: Additional Details (Optional)                  │
│ ─────────────────────────────────────────────────────── │
│ Q8: How will you use funds? (Multi-select)             │
│     ☑ Product development  ☐ Hiring & team              │
│     ☐ Equipment  ☐ Marketing  ☐ Expansion               │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Group 5: Advanced Preferences (Optional)               │
│ ─────────────────────────────────────────────────────── │
│ Q9: When do you need a decision?                        │
│     [1 month] [1-3 months] [3-6 months] [6+ months]    │
│                                                          │
│ Q10: Which impact areas? (Multi-select)                 │
│      ☑ Environmental  ☐ Social  ☐ Regional              │
│      ☐ Research & Innovation  ☐ Education              │
└─────────────────────────────────────────────────────────┘
```

#### 3.7 Summary: Old vs New Question Mapping

| Old Questions | New Question | Answer Values | Notes |
|--------------|--------------|----------------|-------|
| `company_type` + `project_scope` | `organisation_stage` | `exploring_idea`, `early_stage_startup`, `growing_startup`, `established_sme`, `research_institution`, `public_body`, `other` | Merged into single question |
| ❌ (not core) | `revenue_status` | `pre_revenue`, `early_revenue`, `established_revenue`, `not_applicable` | **NEW** - Moved to core (Q3) |
| `co_financing` (was advanced) | `co_financing` | `co_yes` (with %), `co_no`, `co_flexible` | Moved to core (Q7) |
| `team_size` | ❌ **REMOVED** | - | Not used in matching |
| `project_duration` | ❌ **REMOVED** | - | Not used in matching |
| `use_of_funds` | `use_of_funds` | Multi-select (unchanged) | Still optional |
| `deadline_urgency` | `deadline_urgency` | `1_month`, `1_3_months`, `3_6_months`, `6_plus_months` | Still advanced |
| `impact_focus` | `impact_focus` | Multi-select (unchanged) | Still advanced |

---

## Implementation Plan

### Step 1: Fix Eligibility Filtering (1-2 hours)
1. Add `isFundingTypeEligible()` function
2. Filter programs before scoring
3. Test with `co_financing: 'co_no'` → should only see grants

### Step 2: Update Scoring Weights (30 min)
1. Remove `teamSize` from scoring
2. Remove `revenueStatus` from scoring (use for filtering only)
3. Add `organisationStage` scoring (derive from `organisation_stage`)

### Step 3: Simplify LLM Prompt (2-3 hours)
1. Extract prompt templates to separate files
2. Remove verbose instructions
3. Test that results are still good

### Step 4: Update Wizard Questions (2-3 hours)
1. Add `organisation_stage` question
2. Remove `company_type` and `project_scope`
3. Move `revenue_status` to core
4. Update answer mapping logic

---

## Expected Outcomes

### Before
- ❌ Scoring biased (teamSize included, revenueStatus scored)
- ❌ Users see wrong funding types (loans when co_financing: 'co_no')
- ❌ Questions don't match documentation
- ❌ LLM files too complex (2000+ lines)

### After
- ✅ Scoring matches Q&A table weights
- ✅ Funding type eligibility properly filtered
- ✅ Questions match documentation
- ✅ LLM files simplified (800-1000 lines total)

---

## Risk Assessment

### Low Risk
- Fixing scoring weights (just numbers)
- Adding eligibility filter (additive change)

### Medium Risk
- Simplifying LLM prompt (need to test quality)
- Updating wizard questions (need to migrate existing answers)

### Mitigation
- Test eligibility filter with various answer combinations
- A/B test simplified prompt vs current
- Add migration logic for existing user answers

---

## Next Steps

1. **Review this proposal** - Get approval for approach
2. **Start with Step 1** - Fix eligibility filtering (highest impact, lowest risk)
3. **Test thoroughly** - Ensure funding types are correct
4. **Iterate** - Move to next steps based on results

