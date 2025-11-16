# Proposal: Q6 6-Month Steps & Legal Type Integration

## Q6: Company Stage Slider with 6-Month Steps

### Range & Steps:
- **Range:** -12 to 36 months
- **Step:** 6 months (snaps to: -12, -6, 0, 6, 12, 18, 24, 30, 36)
- **Max:** 36 months (can extend if needed)

### Classification Ranges:
- **-12 to 0 months:** Pre Incorporation
- **0 to 6 months:** Early Stage (0-6 months)
- **6 to 12 months:** Seed Stage (6-12 months) ⭐ *New name*
- **12 to 24 months:** Growth Stage (12-24 months)
- **24 to 36 months:** Established (24-36 months)
- **36+ months:** Mature (classification only, not in slider range)

### Stage Name for 6-12 months:
**Recommendation: "Seed Stage"**
- ✅ Commonly used in funding programs
- ✅ Distinguishes from "Early Stage" (0-6 months)
- ✅ Recognized term in startup/funding ecosystem
- ✅ Aligns with normalization.ts which uses "seed" for early stages

**Alternative options:**
- "Launch Stage" - Also common, implies company is launching
- "Formation Stage" - More formal, less common
- "Initial Stage" - Generic, less specific

### UI Alignment:

**Visual Layout (matches other sliders):**
```
[-12 months]            [36 months]
[========●=============]  (slider with 6-month steps)
   18 months
   Growth Stage (12-24 months)
```

**Display Components:**
1. **Min/Max labels** (above slider, left/right):
   - Style: `text-sm text-gray-600`
   - Content: "-12 months" and "36 months"

2. **Slider** (main input):
   - Style: `w-full h-2 bg-gray-200 rounded-lg`
   - Gradient fill: Blue for selected portion
   - Step: 6 months (snaps to: -12, -6, 0, 6, 12, 18, 24, 30, 36)

3. **Current value** (below slider, centered):
   - Style: `text-center font-medium text-gray-700`
   - Content: "18 months" (or current value)

4. **Stage label** (below value, centered):
   - Style: `text-sm text-blue-600 font-medium`
   - Content: "Growth Stage (12-24 months)" (or current classification)

**Code Structure:**
```typescript
{
  id: 'company_stage',
  label: 'What stage is your company at?',
  type: 'range',
  min: -12,
  max: 36,
  step: 6,
  unit: 'months',
  editableValue: false, // No direct input, only slider
  // Custom classification function
  classifyStage: (months: number) => {
    if (months < 0) return 'Pre Incorporation';
    if (months < 6) return 'Early Stage (0-6 months)';
    if (months < 12) return 'Seed Stage (6-12 months)';
    if (months < 24) return 'Growth Stage (12-24 months)';
    if (months < 36) return 'Established (24-36 months)';
    return 'Mature (36+ months)';
  }
}
```

**Data Storage:**
```typescript
answers.company_stage_months = 18 // The slider value
answers.company_stage = 'growth_stage' // Auto-classified
```

---

## Legal Type: Conditional in Q1 (Without Solo Founder in Main Options)

### Strategy:
- **Keep Q1 main options as-is** (no solo founder)
- **Add legal type as conditional sub-question**
- **Include "Einzelunternehmer" in legal type dropdown**

### Q1 Main Options (Unchanged):
```typescript
{
  id: 'company_type',
  options: [
    { value: 'prefounder', label: 'Pre-founder (Idea Stage)' },
    { value: 'startup', label: 'Startup' },
    { value: 'sme', label: 'SME (Small/Medium Enterprise)' },
    { value: 'research', label: 'Research Institution' },
    { value: 'other', label: 'Other' },
  ]
}
```

### Legal Type Sub-Question (Conditional):

**When to show:**
- ✅ **Startup** → Show legal type
- ✅ **SME** → Show legal type
- ✅ **Research** → Show legal type
- ✅ **Other** → Show legal type
- ❌ **Pre-founder** → Don't show (not yet incorporated)

**Legal Type Options by Company Type:**

**For Startup/SME:**
```typescript
[
  { value: 'gmbh', label: 'GmbH' },
  { value: 'ag', label: 'AG' },
  { value: 'og', label: 'OG' },
  { value: 'kg', label: 'KG' },
  { value: 'einzelunternehmer', label: 'Einzelunternehmer (Solo Founder)' }, // ⭐ Included here!
  { value: 'other', label: 'Other' },
]
```

**For Research:**
```typescript
[
  { value: 'verein', label: 'Verein' },
  { value: 'genossenschaft', label: 'Genossenschaft' },
  { value: 'stiftung', label: 'Stiftung' },
  { value: 'gmbh', label: 'GmbH' },
  { value: 'other', label: 'Other' },
]
```

**For Other:**
```typescript
[
  { value: 'gmbh', label: 'GmbH' },
  { value: 'ag', label: 'AG' },
  { value: 'og', label: 'OG' },
  { value: 'kg', label: 'KG' },
  { value: 'verein', label: 'Verein' },
  { value: 'genossenschaft', label: 'Genossenschaft' },
  { value: 'stiftung', label: 'Stiftung' },
  { value: 'einzelunternehmer', label: 'Einzelunternehmer (Solo Founder)' }, // ⭐ Included here!
  { value: 'other', label: 'Other' },
]
```

### UI Pattern (Same as Co-financing):

```
[Selected: Startup]
  ↓
[Legal Structure:]
  [Dropdown/Select]
    - GmbH
    - AG
    - OG
    - KG
    - Einzelunternehmer (Solo Founder) ⭐
    - Other
```

**Implementation:**
```typescript
{
  id: 'company_type',
  type: 'single-select',
  options: [...],
  hasLegalType: true, // Enable conditional legal type
  legalTypeOptions: (companyType: string) => {
    if (['startup', 'sme'].includes(companyType)) {
      return ['gmbh', 'ag', 'og', 'kg', 'einzelunternehmer', 'other'];
    }
    if (companyType === 'research') {
      return ['verein', 'genossenschaft', 'stiftung', 'gmbh', 'other'];
    }
    if (companyType === 'other') {
      return ['gmbh', 'ag', 'og', 'kg', 'verein', 'genossenschaft', 'stiftung', 'einzelunternehmer', 'other'];
    }
    return []; // Pre-founder: no legal type
  }
}
```

**Data Storage:**
```typescript
answers.company_type = 'startup'
answers.legal_type = 'einzelunternehmer' // Stored separately, not in company_type
```

**Benefits:**
- ✅ Solo founder available via legal type (not in main Q1)
- ✅ No new question needed
- ✅ Logical grouping (type + legal structure)
- ✅ Only shows when relevant

---

## Summary

### Q6 Slider:
- ✅ 6-month steps (-12, -6, 0, 6, 12, 18, 24, 30, 36)
- ✅ "Seed Stage" for 6-12 months
- ✅ UI aligned with other sliders (min/max labels, slider, value, stage label)
- ✅ Auto-classification based on months

### Legal Type:
- ✅ Conditional sub-question in Q1
- ✅ Solo founder (Einzelunternehmer) in legal type dropdown
- ✅ Not in main Q1 options
- ✅ Only shows when company type is startup/sme/research/other

