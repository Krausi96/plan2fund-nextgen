# Investigation: Q6, Q7, and Company Type Placement

## 📊 Current State Analysis

### Q6: Company Stage (Current Implementation)

**Location:** `features/reco/components/ProgramFinder.tsx` (lines 191-206)

**Current Options:**
```typescript
{
  id: 'company_stage',
  type: 'single-select',
  options: [
    { value: 'idea', label: 'Idea/Concept (Not yet founded)' },
    { value: 'pre_company', label: 'Pre-Company (Team formed, not incorporated)' },
    { value: 'early_stage', label: 'Early Stage (Incorporated < 2 years)' },
    { value: 'growth_stage', label: 'Growth Stage (Incorporated 2-5 years)' },
    { value: 'established', label: 'Established (Incorporated 5-10 years)' },
    { value: 'mature', label: 'Mature (Established, 10+ years)' },
    { value: 'other', label: 'Other' },
  ]
}
```

**How it's sent to API:**
- Single value: `answers.company_stage = 'growth_stage'`
- If "other" selected: `answers.company_stage = 'other'` + `answers.company_stage_other = 'text'`
- API receives: `Company Stage: growth_stage` or `Company Stage: Other (text)`

**Current Issues:**
- Too many options (7 options)
- Fixed ranges don't allow precise specification
- No way to specify exact years for companies 2+ years old

---

### Q7: Use of Funds (Current Implementation)

**Location:** `features/reco/components/ProgramFinder.tsx` (lines 207-223)

**Current Options:**
```typescript
{
  id: 'use_of_funds',
  type: 'multi-select',
  options: [
    { value: 'rd', label: 'Research & Development' },
    { value: 'personnel', label: 'Personnel/Hiring' },
    { value: 'equipment', label: 'Equipment/Infrastructure' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'working_capital', label: 'Working Capital' },
    { value: 'other', label: 'Other' },
  ],
  hasOtherTextInput: true,
  allowMultipleOther: true, // Allows multiple "other" entries
}
```

**How it's sent to API:**
```typescript
// Example 1: Standard selections
answers.use_of_funds = ['rd', 'marketing', 'personnel']
// API receives: "Use of Funds: rd, marketing, personnel"

// Example 2: With "other"
answers.use_of_funds = ['rd', 'marketing', 'other']
answers.use_of_funds_other = ['Sales', 'IT Infrastructure']
// API receives: "Use of Funds: rd, marketing, Other: Sales, IT Infrastructure"
```

**Current Capabilities:**
✅ Users CAN specify details in "other" field
✅ Multiple "other" entries supported
✅ Tip shown: "Be specific! You can also specify amounts or percentages"

**Current Limitations:**
❌ Predefined options (rd, personnel, equipment, marketing, working_capital) cannot have details/amounts
❌ If user selects "Marketing", they can't specify "Marketing: 30%" or "Marketing: €50,000"
❌ Only the "other" field allows free-form text with amounts/percentages

**Examples of what users CAN currently do:**
- Select: `['rd', 'marketing']` → API: "Use of Funds: rd, marketing"
- Select: `['rd', 'other']` + other text: `['Marketing: 30%', 'Sales: €20,000']` → API: "Use of Funds: rd, Other: Marketing: 30%, Sales: €20,000"

**Examples of what users CANNOT currently do:**
- Select "Marketing" and specify "Marketing: 30%" (would need to deselect "Marketing" and use "other")
- Select "R&D" and specify "R&D: €50,000" (would need to use "other")

---

### Company Type (Current Implementation)

**Location:** `features/reco/components/ProgramFinder.tsx` (lines 66-80)

**Current Position:** Q1 (Priority 1 - first question)

**Current Options:**
```typescript
{
  id: 'company_type',
  type: 'single-select',
  options: [
    { value: 'prefounder', label: 'Pre-founder (Idea Stage)' },
    { value: 'startup', label: 'Startup' },
    { value: 'sme', label: 'SME (Small/Medium Enterprise)' },
    { value: 'research', label: 'Research Institution' },
    { value: 'other', label: 'Other' },
  ]
}
```

**How it's sent to API:**
- Single value: `answers.company_type = 'startup'`
- If "other" selected: `answers.company_type = 'other'` + `answers.company_type_other = 'text'`
- API receives: `Company Type: startup` or `Company Type: Other (text)`

**Current Usage:**
- Used for matching eligibility requirements
- Critical check in scoring algorithm
- Extracted to `eligibility.company_type` in program requirements

---

## 🎯 Proposed Solutions

### Q6: Sophisticated Company Stage with Slider

**Proposed Structure:**
1. **Option 1:** "Not yet incorporated" (covers: idea, pre-company)
2. **Option 2:** "Early Stage" (covers: < 2 years)
3. **Option 3:** "Established Company" (2+ years) → **Shows slider to specify exact years**

**Slider Logic:**
- If Option 3 selected → Show slider (2-50 years, step: 1)
- Based on slider value, classify:
  - 2-5 years → "Growth Stage (2-5 years)"
  - 5-10 years → "Established (5-10 years)"
  - 10+ years → "Mature (10+ years)"

**Data Structure:**
```typescript
answers.company_stage = 'established_company' // The option selected
answers.company_stage_years = 7 // The slider value
// API would receive: "Company Stage: Established (5-10 years)" or "Company Stage: Growth Stage (2-5 years)"
```

**Benefits:**
- ✅ Reduces from 7 options to 3 main options
- ✅ Allows precise year specification
- ✅ Automatically classifies into appropriate category
- ✅ More user-friendly (less overwhelming)

**Implementation Considerations:**
- Need to handle conversion: `established_company` + `years` → `growth_stage`/`established`/`mature`
- Backward compatibility with existing data
- API needs to handle both old format and new format

---

### Q7: Enhanced Use of Funds with Details

**Option A: Add Details to Each Selection**
- When user selects "Marketing", show optional input: "Specify amount/percentage (optional)"
- Allow: "Marketing: 30%" or "Marketing: €50,000"
- Store as: `answers.use_of_funds_details = { marketing: '30%', rd: '€50,000' }`

**Option B: Keep Current + Enhance "Other"**
- Current system works but users might not realize they can specify in "other"
- Add inline hints: "💡 You can specify amounts in the 'Other' field"
- Make "other" field more prominent

**Option C: Hybrid Approach**
- Keep predefined options simple
- Add "Specify Details" toggle that shows inputs for each selected option
- Store details separately: `answers.use_of_funds_details`

**Recommendation:** Option A - Add optional detail inputs for each selection

**Data Structure:**
```typescript
answers.use_of_funds = ['rd', 'marketing', 'personnel']
answers.use_of_funds_details = {
  marketing: '30%',
  rd: '€50,000',
  // personnel has no details
}
// API receives: "Use of Funds: rd, marketing (30%), personnel, R&D (€50,000)"
```

---

### Company Type: Placement Options

**Option 1: Keep Separate (Current)**
- ✅ Clear separation of concerns
- ✅ Company type is asked first (important for filtering)
- ✅ Simple, straightforward
- ❌ More questions to answer

**Option 2: Combine with Q6 (Company Stage)**
- ✅ Reduces total questions
- ✅ Logical grouping (type + stage)
- ❌ More complex UI (two selections in one question)
- ❌ Might be overwhelming
- ❌ Company type is critical for early filtering

**Option 3: Combine with Q1 (Location)**
- ✅ Early in flow
- ❌ Less logical grouping
- ❌ Location is geographic, type is organizational

**Recommendation:** Keep separate (Option 1)
- Company type is critical for program matching
- Should be asked early (currently Q1)
- Combining would make Q6 too complex
- Better UX to keep questions focused

**Alternative:** If combining, suggest:
- Q1: "Company Type & Stage" (two-part question)
  - Part 1: Type (startup, SME, research, etc.)
  - Part 2: Stage (with new sophisticated slider approach)
- This would reduce from 2 questions to 1, but increases complexity

---

## 📝 Summary & Recommendations

### Q6: Implement Sophisticated Slider Approach
**Priority:** High
**Complexity:** Medium
**Recommendation:** 
- 3 main options: "Not yet incorporated", "Early Stage (< 2 years)", "Established (2+ years)"
- For "Established", show slider (2-50 years)
- Auto-classify: 2-5 → Growth, 5-10 → Established, 10+ → Mature
- Store both: `company_stage` (option) + `company_stage_years` (slider value)

### Q7: Add Details to Predefined Options
**Priority:** Medium
**Complexity:** Medium
**Recommendation:**
- Add optional detail inputs for each selected option
- Allow amounts/percentages: "Marketing: 30%" or "R&D: €50,000"
- Store in: `use_of_funds_details` object
- Update API to format: "rd (€50,000), marketing (30%)"

### Company Type: Keep Separate
**Priority:** Low (no change needed)
**Complexity:** N/A
**Recommendation:**
- Keep as Q1 (first question)
- Don't combine with Q6 (would be too complex)
- Company type is critical for early filtering

---

## 🔧 Implementation Notes

### Q6 Implementation:
1. Change question type to support conditional slider
2. Add `company_stage_years` field
3. Update API to convert years → category
4. Update scoring engine to handle new format

### Q7 Implementation:
1. Add detail inputs that appear when option is selected
2. Store details in `use_of_funds_details` object
3. Update API formatting to include details
4. Update LLM prompt to include detail information

### Backward Compatibility:
- Support both old format (single `company_stage` value) and new format (`company_stage` + `company_stage_years`)
- Support both old format (array only) and new format (array + details object)

