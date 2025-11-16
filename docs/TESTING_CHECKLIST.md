# ProgramFinder Q&A Testing Checklist

This checklist is based on the testing handover document and helps verify all functionality systematically.

## 🚀 Quick Start Testing

### 1. Start the Application
```bash
npm run dev
# Navigate to /reco page
```

### 2. Test Each Question Type

## ✅ Question-by-Question Testing

### Q1: Company Type (Single-select)
- [ ] All options visible: Pre-founder, Startup, SME, Research Institution, Other
- [ ] "Other" option shows text input when selected
- [ ] Text input saves correctly
- [ ] Can navigate to next question after selection
- [ ] Translation works (EN/DE)

### Q2: Location (Single-select with region input)
- [ ] All options visible: Austria, Germany, EU, International
- [ ] **CRITICAL**: Text input appears for ALL options (not just Austria/Germany)
- [ ] Text input appears when any option is selected
- [ ] No auto-advance when text field appears (user can type)
- [ ] Region text saves correctly (e.g., "Vienna", "Bavaria", "France", "USA")
- [ ] Translation works (EN/DE)

### Q3: Funding Amount (Range slider)
- [ ] Slider works smoothly (€10,000 - €3,000,000)
- [ ] Editable number field below slider works
- [ ] Test min value: €10,000
- [ ] Test max value: €3,000,000
- [ ] Test mid-range: €250,000
- [ ] Currency formatting shows "€" correctly
- [ ] Value persists when navigating between questions

### Q4: Industry Focus (Multi-select)
- [ ] All options visible: Digital/ICT, Sustainability, Health, Manufacturing, Export, Other
- [ ] **CRITICAL**: Can deselect options (click to unselect)
- [ ] Subcategories appear when main category selected
- [ ] Can select multiple subcategories
- [ ] "Other" text field appears when selected
- [ ] "Other" text field saves correctly
- [ ] Can select multiple industries
- [ ] Translation works (EN/DE)

### Q5: Impact (Multi-select with details)
- [ ] All options visible: Economic, Social, Environmental, Other
- [ ] Detail text fields appear for Economic, Social, Environmental when selected
- [ ] Detail fields save correctly
- [ ] Can select multiple impact types
- [ ] "Other" text input works
- [ ] Translation works (EN/DE)

### Q6: Company Stage (Single-select)
- [ ] All options visible: Idea/Concept, Pre-Company, Early Stage, Growth Stage, Other
- [ ] "Other" text field appears and saves
- [ ] Translation works (EN/DE)

### Q7: Use of Funds (Multi-select with multiple "Other")
- [ ] All options visible: R&D, Personnel, Equipment, Marketing, Working Capital, Other
- [ ] **CRITICAL**: "Other" allows multiple entries
- [ ] Can add multiple "Other" entries (add button works)
- [ ] Can remove "Other" entries (× button works)
- [ ] All entries save correctly
- [ ] Translation works (EN/DE)

### Q8: Project Duration (Range slider)
- [ ] Slider works (1-36 months)
- [ ] Editable number field works
- [ ] Unit shows "months"
- [ ] Value persists

### Q9: Deadline Urgency (Range slider with skip logic)
- [ ] **CRITICAL**: Skip logic works - question is skipped if Q8 > 36 months
- [ ] If Q8 = 18 months, Q9 should appear
- [ ] If Q8 = 40 months, Q9 should be skipped
- [ ] Slider works (1-12 months)
- [ ] Editable number field works
- [ ] Unit shows "months"

### Q10: Co-financing (Single-select with percentage)
- [ ] All options visible: Yes, No, Uncertain
- [ ] **CRITICAL**: Percentage input appears when "Yes" selected
- [ ] Percentage saves correctly
- [ ] Translation works (EN/DE)

### Q11: Revenue Status (Single-select with skip logic)
- [ ] **CRITICAL**: Skip logic works - skipped if Q6 is "idea" or "pre_company"
- [ ] If Q6 = "Early Stage", Q11 should appear
- [ ] If Q6 = "Idea/Concept", Q11 should be skipped
- [ ] All options visible when shown: Pre-revenue, Early revenue, Growing revenue, Not applicable
- [ ] Translation works (EN/DE)

### Q12: Team Size (Range slider with quick-select)
- [ ] Slider works (1-50 people)
- [ ] Quick-select buttons work: 1-2, 3-5, 6-10, 10+
- [ ] Quick-select buttons set slider value correctly
- [ ] Unit shows "people"
- [ ] Value persists

---

## 🔍 Skip Logic Testing

### Test Skip Logic for Q9 (Deadline Urgency)
1. Set Q8 (Project Duration) to 18 months
   - [ ] Q9 should appear
2. Set Q8 to 40 months (or any value > 36)
   - [ ] Q9 should be skipped (not visible)
3. Change Q8 back to 20 months
   - [ ] Q9 should reappear

### Test Skip Logic for Q11 (Revenue Status)
1. Set Q6 (Company Stage) to "Idea/Concept"
   - [ ] Q11 should be skipped
2. Set Q6 to "Pre-Company"
   - [ ] Q11 should be skipped
3. Set Q6 to "Early Stage"
   - [ ] Q11 should appear
4. Set Q6 to "Growth Stage"
   - [ ] Q11 should appear

---

## 🧭 Navigation Testing

- [ ] Question navigation dots work (click to jump to any question)
- [ ] Left/right arrow buttons work
- [ ] Progress indicator shows correct question number (e.g., "3 / 12")
- [ ] Can navigate back and forth between questions
- [ ] Answers persist when navigating
- [ ] Current question is highlighted in dots

---

## ⏭️ Skip Functionality

- [ ] "Skip this question" button is visible on all optional questions
- [ ] Skip button works (clears answer)
- [ ] Auto-advances to next question after skipping
- [ ] Skipped questions don't count toward answered count
- [ ] Can skip multiple questions in a row

---

## 📊 Results Generation

- [ ] "Generate Funding Programs" button appears after 6+ questions answered
- [ ] Button shows progress: "X / Y questions answered"
- [ ] Button is disabled while loading
- [ ] Loading state shows spinner
- [ ] Results appear in **modal popup** (not inline)
- [ ] Results modal can be closed (X button or click outside)
- [ ] Results show program name, score, description
- [ ] Results are relevant to user answers
- [ ] Top 5 programs shown
- [ ] Results persist when navigating back to questions

---

## 🌍 Geographic Bias Testing

### Test Case 1: Austria vs. Germany
1. Complete all questions with Location = "Austria", Region = "Vienna"
   - [ ] Results appear
   - [ ] Note: Number of results, geographic distribution
2. Complete all questions identically EXCEPT Location = "Germany", Region = "Berlin"
   - [ ] Results appear
   - [ ] Compare: Similar number of results?
   - [ ] Compare: Similar quality of results?
   - [ ] **Flag if**: Austria gets significantly more results than Germany

### Test Case 2: EU vs. International
1. Location = "EU", Region = "France"
   - [ ] Results appear
   - [ ] Results include EU programs
2. Location = "International", Region = "Switzerland"
   - [ ] Results appear
   - [ ] **Flag if**: No results or significantly fewer than EU
   - [ ] **Flag if**: Only Austrian/German programs shown

### Test Case 3: Regional Specificity
1. Test with "Vienna"
   - [ ] Results include Vienna-specific programs
2. Test with "Bavaria"
   - [ ] Results include Bavaria-specific programs
3. Test with "Paris"
   - [ ] Results include France/EU programs
4. Test with "London"
   - [ ] Results include international programs
   - [ ] **Flag if**: Only Austrian/German regions get results

---

## 🏭 Industry Bias Testing

### Test Case 4: Digital vs. Other Industries
1. Industry = "Digital/ICT" only
   - [ ] Results appear
   - [ ] Note: Number of results
2. Industry = "Sustainability/Green Tech" only
   - [ ] Results appear
   - [ ] Compare: Similar number to Digital?
3. Industry = "Health/Life Sciences" only
   - [ ] Results appear
   - [ ] Compare: Similar number to others?
   - [ ] **Flag if**: One industry dominates results

### Test Case 5: "Other" Industry
1. Select "Other" and enter "Agriculture"
   - [ ] Results appear (not penalized)
2. Select "Other" and enter "Tourism"
   - [ ] Results appear
3. Select "Other" and enter "Education"
   - [ ] Results appear
   - [ ] **Flag if**: "Other" industries get no results

---

## 🏢 Company Type Bias Testing

### Test Case 6: Startup vs. SME vs. Pre-founder
1. Company Type = "Pre-founder"
   - [ ] Results appear
   - [ ] Note: Number of results
2. Company Type = "Startup"
   - [ ] Results appear
   - [ ] Compare: Similar number to Pre-founder?
3. Company Type = "SME"
   - [ ] Results appear
   - [ ] Compare: Similar number to others?
   - [ ] **Flag if**: Pre-founders get no results

### Test Case 7: "Other" Company Type
1. Select "Other" and enter "Non-profit"
   - [ ] Results appear
2. Select "Other" and enter "Cooperative"
   - [ ] Results appear
3. Select "Other" and enter "University Spin-off"
   - [ ] Results appear
   - [ ] **Flag if**: "Other" company types get no results

---

## 💰 Funding Amount Bias Testing

### Test Case 8: Small vs. Large Funding
1. Funding = €50,000
   - [ ] Results appear
   - [ ] Note: Number of results
2. Funding = €1,000,000
   - [ ] Results appear
   - [ ] Compare: Similar number?
3. Funding = €2,500,000
   - [ ] Results appear
   - [ ] **Flag if**: Small amounts get no results

---

## 📈 Company Stage Bias Testing

### Test Case 9: Early vs. Late Stage
1. Stage = "Idea/Concept"
   - [ ] Results appear
   - [ ] Note: Number of results
2. Stage = "Growth Stage"
   - [ ] Results appear
   - [ ] Compare: Similar number?
   - [ ] **Flag if**: Early stage gets no results

---

## 🔄 Data Persistence Testing

- [ ] Answers save when navigating between questions
- [ ] "Other" text inputs save
- [ ] Impact detail fields save
- [ ] Multiple "Other" entries (Q7) all save
- [ ] Co-financing percentage saves
- [ ] Region/country text inputs save
- [ ] Subcategory selections save
- [ ] Refresh page - answers should persist (if localStorage used)

---

## 🌐 Translation Testing

### English (EN)
- [ ] All question labels in English
- [ ] All option labels in English
- [ ] "Questions" / "Fragen" appears correctly
- [ ] "X / Y questions answered" in English
- [ ] All "Please specify" fields in English
- [ ] All placeholders in English
- [ ] No German text mixed in

### German (DE)
- [ ] Switch to German
- [ ] All question labels in German
- [ ] All option labels in German
- [ ] "Fragen" appears correctly
- [ ] "X / Y Fragen beantwortet" in German
- [ ] All "Please specify" fields in German
- [ ] All placeholders in German
- [ ] No English text mixed in

---

## 🎯 Test Scenarios

### Scenario 1: Complete Austrian Startup
```
Q1: Startup
Q2: Austria, Region: "Vienna"
Q3: €250,000
Q4: Digital/ICT (subcategory: AI/Machine Learning)
Q5: Economic (detail: "Create 20 jobs")
Q6: Early Stage
Q7: Research & Development, Personnel/Hiring
Q8: 18 months
Q9: 3 months
Q10: Yes, 30%
Q11: Pre-revenue (should be skipped if Q6 is early stage)
Q12: 5 people
```
**Expected**: Should get relevant Austrian startup programs
- [ ] Results appear
- [ ] Results are relevant
- [ ] Results include Austrian programs

### Scenario 2: International SME
```
Q1: SME
Q2: International, Region: "Switzerland"
Q3: €1,500,000
Q4: Sustainability/Green Tech (subcategory: Renewable Energy)
Q5: Environmental (detail: "Reduce CO2 by 40%")
Q6: Growth Stage
Q7: Equipment/Infrastructure, Other: "Training programs"
Q8: 24 months
Q9: 6 months
Q10: Yes, 50%
Q11: Growing revenue (€1M+)
Q12: 15 people
```
**Expected**: Should get international programs, not just Austrian/German
- [ ] Results appear
- [ ] Results include international programs
- [ ] Not limited to Austria/Germany

### Scenario 3: Pre-founder with "Other" Options
```
Q1: Other: "University Spin-off"
Q2: EU, Region: "France"
Q3: €75,000
Q4: Other: "Biotechnology"
Q5: Social (detail: "Improve healthcare access"), Other: "Educational impact"
Q6: Idea/Concept
Q7: Research & Development, Other: "Patent filing", Other: "Prototype development"
Q8: 12 months
Q9: 2 months
Q10: No
Q11: (should be skipped)
Q12: 2 people
```
**Expected**: Should still get results despite many "Other" selections
- [ ] Results appear
- [ ] Q11 is skipped (correct)
- [ ] All "Other" fields saved
- [ ] Results are relevant

### Scenario 4: Minimal Answers (Test Skip Functionality)
```
Q1: Startup
Q2: (skip)
Q3: (skip)
Q4: (skip)
... (skip all others)
```
**Expected**: Should still generate results (even if limited)
- [ ] Can skip all questions
- [ ] Generate button appears after 6+ answered
- [ ] Results appear (may be limited)

---

## 🐛 Known Issues to Verify Fixed

- [ ] ✅ Q2: Auto-advance when region input appears (should be fixed - no auto-advance)
- [ ] ✅ Q4: Cannot deselect options (should be fixed - can deselect)
- [ ] ✅ Q4: "Other" text field doesn't expand (should be fixed)
- [ ] ✅ Q7: "Other" specify field doesn't work (should be fixed - multiple entries work)
- [ ] ✅ All "specify" fields should save correctly
- [ ] ✅ Translation mismatches should be resolved
- [ ] ✅ Results should appear in popup modal (not below questions)

---

## 📝 Testing Report Template

For each test run, document:

```
## Test Run: [Date/Time]

### Scenario: [Name]
**Answers:**
- Q1: [answer]
- Q2: [answer]
- ...

**Results:**
- Count: [number]
- Top 3 Programs: [list]
- Relevance: [1-5]
- Geographic Distribution: [analysis]
- Industry Distribution: [analysis]

**Issues:**
- [List any issues found]

**Bias Assessment:**
- [Any bias detected?]
```

---

## 🎯 Success Criteria

The system passes if:
- [ ] ✅ All questions work correctly (inputs save, sliders work, etc.)
- [ ] ✅ No obvious geographic bias (Austria/Germany don't dominate)
- [ ] ✅ No obvious industry bias (all industries get results)
- [ ] ✅ No obvious company type bias (all types get results)
- [ ] ✅ Skip logic works correctly
- [ ] ✅ All "Other" fields work and save
- [ ] ✅ Results are relevant to user answers
- [ ] ✅ Translations are consistent
- [ ] ✅ Results appear in popup modal
- [ ] ✅ User can complete the flow without errors

---

## 🔧 Debugging Tips

### Check Browser Console
- Open DevTools (F12)
- Check for JavaScript errors
- Check for React warnings

### Check Network Tab
- Open DevTools → Network
- Look for `/api/programs/recommend` request
- Check request payload (should include all answers)
- Check response (should include programs)
- Check for 4xx/5xx errors

### Check Application State
- Check localStorage for saved answers
- Check React DevTools for component state
- Verify answers object structure

---

## 📞 Reporting Issues

When reporting issues, include:
1. **Screenshot** of the issue
2. **Steps to reproduce** (exact sequence)
3. **Expected behavior** vs. **Actual behavior**
4. **Browser console errors** (if any)
5. **Network request/response** (if API issue)
6. **Test scenario** used

---

**Happy Testing! 🧪**

