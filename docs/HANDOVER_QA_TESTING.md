# 🎯 Q&A Flow Testing & Optimization - Handover

## 📋 Context & What We've Built

### Current State
We've implemented an **on-demand recommendation system** that:
1. Shows 12 questions in a static form (no QuestionEngine dependency)
2. Uses LLM extraction to fetch and extract program data in real-time
3. Matches user answers with extracted requirements using a **normalization system**
4. Ranks programs using frequency-based scoring

### Key Components
- **ProgramFinder.tsx** - UI component with 12 static questions
- **normalization.ts** - Normalizes Q&A answers and LLM extractions to common format
- **pages/api/programs/recommend.ts** - On-demand extraction and matching API
- **enhancedRecoEngine.ts** - Scoring and ranking engine

---

## 🧪 What Needs Testing

### 1. Q&A Flow Testing
**Goal:** Verify the question flow is logical, contextual, and helps users find the right programs.

**Test Script:** `scripts/test-qa-flow.ts`
```bash
npx tsx scripts/test-qa-flow.ts
```

**What to Test:**
- ✅ Question order makes sense
- ✅ Skip logic works correctly
- ✅ All 10 personas see appropriate questions
- ✅ Questions are contextual (not weird or out of place)
- ✅ Flow helps users find matching programs

### 2. Normalization Testing
**Goal:** Verify normalization system correctly matches user answers with LLM-extracted requirements.

**What to Test:**
- ✅ Location matching: "Austria" matches "Companies in Austria, Germany, or EU"
- ✅ Company type matching: "startup" matches "Small and medium-sized enterprises"
- ✅ Company stage matching: "inc_lt_6m" matches "less than 3 years old"
- ✅ Funding amount matching: "100kto500k" matches ranges like 150k-400k
- ✅ Industry matching: "digital" matches "ICT" or "technology"

### 3. Ranking Testing
**Goal:** Verify programs are ranked correctly by relevance.

**What to Test:**
- ✅ Programs with more matches rank higher
- ✅ Frequency-based scoring works (rare requirements worth more)
- ✅ Gap penalties are appropriate (not too harsh)
- ✅ Perfect matches get bonus points
- ✅ Results are sorted correctly

### 4. UI Testing
**Goal:** Verify the UI is clear, intuitive, and guides users well.

**What to Test:**
- ✅ All questions visible in scrollable form
- ✅ Skip logic hides questions appropriately
- ✅ Questions appear in logical order
- ✅ Required vs optional questions are clear
- ✅ Results update as user answers
- ✅ Loading states work correctly

---

## 📊 Test Scripts Available

### 1. Q&A Flow Test Suite
**File:** `scripts/test-qa-flow.ts`

**Run:**
```bash
npx tsx scripts/test-qa-flow.ts
```

**What it does:**
- Tests 10 diverse personas through Q&A flow
- Simulates question visibility and skip logic
- Tests normalization for each persona
- Analyzes question order and depth
- Provides recommendations

**Expected Output:**
- Question visibility for each persona
- Skip logic verification
- Normalization results
- Order analysis
- Recommendations

### 2. Recommendation API Test
**File:** `scraper-lite/scripts/test-recommend.ts`

**Run:**
```bash
npx tsx scraper-lite/scripts/test-recommend.ts
```

**What it does:**
- Tests the on-demand recommendation API
- Verifies extraction works
- Checks matching logic
- Tests with different answer combinations

---

## 🎯 Critical Questions to Answer

### 1. Q&A Order
**Current Order:**
1. company_type (required)
2. location (required)
3. funding_amount
4. company_stage
5. industry_focus
6. use_of_funds
7. team_size
8. co_financing
9. revenue_status
10. impact
11. project_duration
12. deadline_urgency

**Issues Found:**
- ⚠️ **Funding amount (Q3) comes too early** - Users may not know exact amount yet
- ⚠️ **Company stage (Q4) should come before funding** - Stage affects funding options

**Recommended Order:**
1. company_type (required)
2. location (required)
3. **company_stage** ← Move here
4. team_size
5. industry_focus
6. use_of_funds
7. **funding_amount** ← Move here (now they understand needs)
8. co_financing
9. revenue_status
10. impact
11. project_duration
12. deadline_urgency

**Action Required:**
- [ ] Test current order with real users
- [ ] Compare with recommended order
- [ ] Decide on final order
- [ ] Update ProgramFinder.tsx if needed

### 2. Number of Questions
**Current:** 12 questions

**Analysis:**
- Average questions seen per persona: 10.9
- Some personas see only 8 questions (research orgs)
- May be too many for some users

**Options:**
1. **Progressive Disclosure** (Recommended)
   - Start with 5 core questions
   - Show additional based on answers
   - Reduces cognitive load

2. **Reduce to 8-10 Questions**
   - Remove least impactful questions
   - Combine related questions
   - Faster completion

3. **Keep 12, Make More Optional**
   - Only 2 required (company_type, location)
   - Others optional but recommended
   - Users can skip if not relevant

**Action Required:**
- [ ] Test with real users - how many questions is too many?
- [ ] Identify which questions are least impactful
- [ ] Decide on approach (progressive disclosure vs reduce vs optional)
- [ ] Implement chosen approach

### 3. Core Questions
**Current Required Questions:**
- company_type (required)
- location (required)

**All Others:** Optional

**Question:** Should we have more core questions?

**Potential Core Questions:**
- company_type ✅ (required)
- location ✅ (required)
- company_stage (should this be required?)
- funding_amount (should this be required?)

**Action Required:**
- [ ] Determine minimum viable questions for matching
- [ ] Decide which questions should be required
- [ ] Test with different core question sets
- [ ] Update required flags in ProgramFinder.tsx

### 4. How Q&A is Linked
**Current Linking:**
- Questions use `skipIf` functions to hide based on previous answers
- Example: `revenue_status` skipped if `company_stage === 'idea'`
- Example: `co_financing` skipped if `funding_amount === 'under100k'`

**Skip Logic:**
```typescript
skipIf: (answers: Record<string, any>) => {
  return answers.company_stage === 'idea' || 
         answers.company_stage === 'pre_company' || 
         answers.company_stage === 'inc_lt_6m' ||
         answers.company_type === 'research';
}
```

**Issues Found:**
- ⚠️ Research orgs skip `use_of_funds` - may miss important info
- ⚠️ Some skip logic may be too aggressive

**Action Required:**
- [ ] Review all skip logic
- [ ] Test each skip condition
- [ ] Verify skips make sense contextually
- [ ] Update skip logic if needed

### 5. Data Format
**User Answers Format:**
```typescript
{
  company_type: 'startup',
  location: 'austria',
  funding_amount: '100kto500k',
  company_stage: 'inc_lt_6m',
  industry_focus: 'digital',
  use_of_funds: 'rd',
  team_size: '3to5',
  co_financing: 'co_no',
  revenue_status: 'pre_revenue',
  impact: 'economic',
  project_duration: '2to5',
  deadline_urgency: 'soon'
}
```

**LLM Extraction Format:**
```typescript
{
  metadata: {
    funding_amount_min: 100000,
    funding_amount_max: 500000,
    currency: 'EUR',
    deadline: '2025-06-30',
    open_deadline: false,
    funding_types: ['grant'],
    region: 'Austria'
  },
  categorized_requirements: {
    geographic: [
      { type: 'location', value: 'Companies based in Austria, Germany, or EU', required: true }
    ],
    eligibility: [
      { type: 'company_type', value: 'Small and medium-sized enterprises (SMEs)', required: true }
    ],
    team: [
      { type: 'company_age', value: 'Companies must be less than 3 years old', required: true }
    ]
  }
}
```

**Normalized Format:**
```typescript
{
  location: {
    countries: ['austria', 'germany', 'eu'],
    scope: 'eu'
  },
  company_type: {
    primary: 'sme',
    aliases: ['sme', 'small and medium enterprise'],
    size: 'medium'
  },
  company_stage: {
    stage: 'inc_lt_6m',
    ageRange: { min: 0, max: 36 },
    maturity: 'early'
  }
}
```

**Action Required:**
- [ ] Verify data format consistency
- [ ] Test normalization with various LLM extractions
- [ ] Ensure all edge cases handled
- [ ] Document data format specifications

### 6. Normalization
**Current System:** `features/reco/engine/normalization.ts`

**What it does:**
- Normalizes user answers to structured format
- Normalizes LLM-extracted requirements to same format
- Provides matching functions for comparison

**Is it needed?** ✅ **YES - CRITICAL**

**Why:**
- Location: "Austria" vs "Companies in Austria, Germany, or EU" - needs structured matching
- Company type: "startup" vs "Small and medium-sized enterprises" - needs alias matching
- Company stage: "inc_lt_6m" vs "less than 3 years old" - needs age range overlap
- Funding amount: "100kto500k" vs `{min: 150k, max: 400k}` - needs range compatibility

**Current Usage:**
- ✅ Used in `pages/api/programs/recommend.ts` for matching
- ⚠️ **NOT fully integrated in `enhancedRecoEngine.ts`** - scoring engine has its own normalization

**Action Required:**
- [ ] Verify normalization works for all test cases
- [ ] Integrate normalization into scoring engine
- [ ] Test matching accuracy with/without normalization
- [ ] Document normalization rules

### 7. UI Appearance
**Current UI:**
- All 12 questions shown in scrollable form
- Questions appear/disappear based on skip logic
- Results update as user answers (debounced)
- Loading states during API calls

**Questions to Answer:**
- [ ] Is the scrollable form clear?
- [ ] Are skip logic changes smooth?
- [ ] Is the question order intuitive?
- [ ] Are required vs optional questions clear?
- [ ] Is the loading state appropriate?
- [ ] Are results displayed clearly?

**Action Required:**
- [ ] Test UI with real users
- [ ] Get feedback on clarity and usability
- [ ] Improve UI based on feedback
- [ ] Consider progressive disclosure if needed

---

## 🚀 Testing Checklist

### Phase 1: Run Existing Tests
- [ ] Run `npx tsx scripts/test-qa-flow.ts`
- [ ] Review output for each persona
- [ ] Verify skip logic works correctly
- [ ] Check normalization results
- [ ] Review recommendations

- [ ] Run `npx tsx scraper-lite/scripts/test-recommend.ts`
- [ ] Verify API works correctly
- [ ] Check extraction quality
- [ ] Verify matching logic
- [ ] Test with different answer combinations

### Phase 2: Manual Testing
- [ ] Test Q&A flow in browser (dev server)
- [ ] Try all 10 personas manually
- [ ] Verify skip logic in UI
- [ ] Check question order feels natural
- [ ] Test with incomplete answers
- [ ] Verify results are relevant

### Phase 3: Analysis
- [ ] Analyze question order - does it make sense?
- [ ] Count questions - is 12 too many?
- [ ] Review skip logic - are skips appropriate?
- [ ] Check normalization - is it working?
- [ ] Verify ranking - are results sorted correctly?
- [ ] Test UI - is it clear and intuitive?

### Phase 4: Optimization
- [ ] Reorder questions if needed
- [ ] Reduce question count if needed
- [ ] Adjust skip logic if needed
- [ ] Improve normalization if needed
- [ ] Fix ranking issues if found
- [ ] Improve UI based on feedback

---

## 📝 Key Files to Review

### Core Files
1. **`features/reco/components/ProgramFinder.tsx`**
   - Q&A UI component
   - Question definitions
   - Skip logic
   - Answer handling

2. **`features/reco/engine/normalization.ts`**
   - Normalization functions
   - Matching functions
   - Data schemas

3. **`pages/api/programs/recommend.ts`**
   - On-demand extraction API
   - Matching logic
   - Uses normalization

4. **`features/reco/engine/enhancedRecoEngine.ts`**
   - Scoring engine
   - Ranking logic
   - May need normalization integration

### Test Files
1. **`scripts/test-qa-flow.ts`**
   - Q&A flow test suite
   - 10 personas
   - Analysis functions

2. **`scraper-lite/scripts/test-recommend.ts`**
   - API test script
   - Extraction testing

### Documentation
1. **`docs/QA_FLOW_DEEP_ANALYSIS.md`**
   - Deep analysis of Q&A flow
   - Persona breakdowns
   - Issues and recommendations

2. **`docs/QA_RANKING_ANALYSIS.md`**
   - Ranking system analysis
   - Normalization necessity
   - Question order analysis

---

## 🎯 Success Criteria

### Q&A Flow
- ✅ Questions appear in logical order
- ✅ Skip logic works correctly
- ✅ All personas see appropriate questions
- ✅ Flow helps users find matching programs
- ✅ Questions are contextual (not weird)

### Normalization
- ✅ User answers normalize correctly
- ✅ LLM extractions normalize correctly
- ✅ Matching works for all test cases
- ✅ Edge cases handled

### Ranking
- ✅ Programs ranked by relevance
- ✅ More matches = higher rank
- ✅ Perfect matches get bonus
- ✅ Results make sense

### UI
- ✅ Clear and intuitive
- ✅ Questions easy to understand
- ✅ Skip logic changes are smooth
- ✅ Results displayed clearly

---

## 🔧 Quick Start

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Run Q&A flow tests:**
   ```bash
   npx tsx scripts/test-qa-flow.ts
   ```

3. **Run API tests:**
   ```bash
   npx tsx scraper-lite/scripts/test-recommend.ts
   ```

4. **Test in browser:**
   - Navigate to recommendation page
   - Try different personas
   - Verify skip logic
   - Check results

5. **Review documentation:**
   - Read `docs/QA_FLOW_DEEP_ANALYSIS.md`
   - Read `docs/QA_RANKING_ANALYSIS.md`
   - Review code comments

---

## 📞 Questions to Answer

1. **Q&A Order:** Is the current order optimal? Should we reorder?
2. **Question Count:** Is 12 questions too many? Should we reduce?
3. **Core Questions:** Which questions should be required?
4. **Skip Logic:** Are all skips appropriate? Any missing?
5. **Normalization:** Is it working correctly? Any edge cases?
6. **Ranking:** Are results sorted correctly? Any issues?
7. **UI:** Is it clear and intuitive? Any improvements needed?

---

## 🎉 Goal

**Make the Q&A flow perfect:**
- Logical question order
- Appropriate number of questions
- Clear core questions
- Proper linking between questions
- Consistent data format
- Working normalization
- Beautiful, intuitive UI

**Test everything, analyze results, and optimize!**

Good luck! 🚀

