# Investigation: Q6 Slider UI & Legal Type Integration

## ✅ Q7: Percentage Hint Removed
- Removed the blue tip about percentages/amounts
- Kept simple examples only

---

## 1. Q6: Company Stage Slider UI Investigation

### Current Slider UI Pattern (from other questions)

**Example: Funding Amount (Q3)**
```
[€0]                    [€2,000,000]
[========●=============]  (slider)
     €500,000
```

**Example: Team Size (Q12)**
```
[1 people]              [50 people]
[========●=============]  (slider)
     5 people
```

**Pattern:**
- Min/Max labels on left/right above slider
- Slider with gradient fill
- Current value displayed below slider (centered)
- For EUR: Also shows formatted value below

### Proposed Q6 Slider UI

**Range:** -12 to 36 months (as specified)
- **-12 to 0 months:** Pre Incorporation
- **0 to 6 months:** Early Stage (0-6 months)
- **6 to 12 months:** Early Stage (6-12 months)
- **12 to 24 months:** Growth Stage (12-24 months)
- **24 to 36 months:** Established (24-36 months)
- **36+ months:** Mature (not needed, but can classify)

**UI Layout:**
```
[-12 months]            [36 months]
[========●=============]  (slider)
   18 months
   Growth Stage (12-24 months)
```

**Display Logic:**
```typescript
function getStageLabel(months: number): string {
  if (months < 0) return 'Pre Incorporation';
  if (months < 6) return 'Early Stage (0-6 months)';
  if (months < 12) return 'Early Stage (6-12 months)';
  if (months < 24) return 'Growth Stage (12-24 months)';
  if (months < 36) return 'Established (24-36 months)';
  return 'Mature (36+ months)';
}
```

**Visual Alignment:**
- Min/Max labels: Same style as other sliders (text-sm text-gray-600)
- Slider: Same style (w-full h-2, gradient fill)
- Current value: Centered, text-center, font-medium
- Stage label: Below value, text-sm text-blue-600 (to match other classifications)

**Implementation:**
- Question type: `range`
- Unit: `months`
- Min: -12
- Max: 36 (or higher if needed)
- Step: 1 month
- Custom display function to show both months and stage

---

## 2. Q1: Solo Founders / Einzelunternehmer Investigation

### Current Q1 Options:
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

### Missing: Solo Founder / Einzelunternehmer
✅ **CONFIRMED:** Solo founders/einzelunternehmer is NOT in Q1 options!

**Why it matters:**
- Many funding programs have specific requirements for solo founders
- Einzelunternehmer is a common legal structure in Austria/Germany
- Different from "Pre-founder" (which is idea stage, not yet founded)
- Different from "Startup" (which implies a company structure)

**Options to add:**
1. Add as separate option: `{ value: 'solo_founder', label: 'Solo Founder / Einzelunternehmer' }`
2. Add to "other" field (current workaround)
3. Combine with legal type (see below)

---

## 3. Legal Type Integration Investigation

### Current State:
- Legal type only mentioned in hints: "Verein, Genossenschaft, Stiftung, GmbH, AG, etc."
- Only accessible via "other" field in company_type
- Not a dedicated question

### Legal Type Options (Austrian/German):
- **GmbH** (Gesellschaft mit beschränkter Haftung) - Limited Liability Company
- **AG** (Aktiengesellschaft) - Public Limited Company
- **OG** (Offene Gesellschaft) - General Partnership
- **KG** (Kommanditgesellschaft) - Limited Partnership
- **Verein** - Association
- **Genossenschaft** - Cooperative
- **Stiftung** - Foundation
- **Einzelunternehmen** - Sole Proprietorship (Solo Founder)
- **Other** (LLC, Inc., etc. for international)

### Integration Options:

#### Option A: Conditional in Q1 (Recommended)
**When to show:**
- Show legal type sub-question when user selects:
  - `startup` → Show legal type (GmbH, AG, OG, KG, Einzelunternehmer, Other)
  - `sme` → Show legal type (GmbH, AG, OG, KG, Einzelunternehmer, Other)
  - `research` → Show legal type (Verein, Genossenschaft, Stiftung, GmbH, Other)
  - `prefounder` → Don't show (not yet incorporated)
  - `other` → Show legal type (all options)

**UI Pattern (similar to co-financing percentage):**
```
[Selected: Startup]
  ↓
[Legal Structure: (dropdown/select)]
  - GmbH
  - AG
  - OG
  - KG
  - Einzelunternehmer (Solo Founder)
  - Other
```

**Benefits:**
- ✅ Logical grouping (type + legal structure)
- ✅ Reduces total questions
- ✅ Only shows when relevant
- ✅ Solves solo founder issue (Einzelunternehmer option)

**Data Structure:**
```typescript
answers.company_type = 'startup'
answers.legal_type = 'gmbh' // or 'einzelunternehmer', etc.
```

#### Option B: Separate Question
- New question after Q1
- Always shown
- More questions to answer
- Clear separation

#### Option C: Combine with Q6 (Company Stage)
- Not recommended - Q6 is about age/stage, not legal structure
- Would make Q6 too complex

### Recommendation: Option A - Conditional in Q1

**Implementation:**
1. Add `hasLegalType` property to company_type question
2. Show legal type select when certain options selected
3. Options vary based on company_type:
   - Startup/SME: GmbH, AG, OG, KG, Einzelunternehmer, Other
   - Research: Verein, Genossenschaft, Stiftung, GmbH, Other
   - Other: All options

**Code Structure:**
```typescript
{
  id: 'company_type',
  type: 'single-select',
  options: [...],
  hasLegalType: true, // Enable legal type sub-question
  legalTypeOptions: (companyType: string) => {
    if (['startup', 'sme'].includes(companyType)) {
      return ['gmbh', 'ag', 'og', 'kg', 'einzelunternehmer', 'other'];
    }
    if (companyType === 'research') {
      return ['verein', 'genossenschaft', 'stiftung', 'gmbh', 'other'];
    }
    return ['gmbh', 'ag', 'og', 'kg', 'verein', 'genossenschaft', 'stiftung', 'einzelunternehmer', 'other'];
  }
}
```

---

## Summary & Recommendations

### Q6 Slider:
- ✅ Range: -12 to 36 months
- ✅ Display: Months value + Stage label (both centered below slider)
- ✅ Classification: Auto-classify based on months
- ✅ UI: Aligned with other sliders (min/max labels, gradient slider, value display)

### Q1 Legal Type:
- ✅ Add solo founder: Include "Einzelunternehmer" option
- ✅ Conditional display: Show legal type when startup/sme/research/other selected
- ✅ Options vary: Based on company type
- ✅ Solves two issues: Legal type + Solo founder

### Implementation Priority:
1. **Q6 Slider** - High (improves UX)
2. **Q1 Legal Type** - High (important for matching + missing solo founder)

