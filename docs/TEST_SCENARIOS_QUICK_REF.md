# Test Scenarios Quick Reference

Quick copy-paste scenarios for testing the ProgramFinder Q&A system.

---

## Scenario 1: Complete Austrian Startup

**Purpose**: Test standard Austrian startup flow

**Answers:**
- Q1: `startup`
- Q2: `austria`, Region: `Vienna`
- Q3: `250000` (€250,000)
- Q4: `digital` (subcategory: `ai`)
- Q5: `economic` (detail: `Create 20 jobs`)
- Q6: `early_stage`
- Q7: `rd`, `personnel`
- Q8: `18` (months)
- Q9: `3` (months)
- Q10: `co_yes`, Percentage: `30%`
- Q11: `pre_revenue` (should be skipped if Q6 is early_stage - verify!)
- Q12: `5` (people)

**Expected Results:**
- ✅ Results appear
- ✅ Results include Austrian programs
- ✅ Results relevant to startup stage
- ✅ Q11 should appear (early_stage allows revenue question)

---

## Scenario 2: International SME

**Purpose**: Test geographic bias - should get international programs

**Answers:**
- Q1: `sme`
- Q2: `international`, Region: `Switzerland`
- Q3: `1500000` (€1,500,000)
- Q4: `sustainability` (subcategory: `renewable_energy`)
- Q5: `environmental` (detail: `Reduce CO2 by 40%`)
- Q6: `growth_stage`
- Q7: `equipment`, Other: `Training programs`
- Q8: `24` (months)
- Q9: `6` (months)
- Q10: `co_yes`, Percentage: `50%`
- Q11: `growing_revenue`
- Q12: `15` (people)

**Expected Results:**
- ✅ Results appear
- ✅ Results include international programs (not just Austria/Germany)
- ✅ Results relevant to SME and growth stage
- ⚠️ **FLAG IF**: Only Austrian/German programs shown

---

## Scenario 3: Pre-founder with "Other" Options

**Purpose**: Test "Other" fields and skip logic

**Answers:**
- Q1: `other`, Other text: `University Spin-off`
- Q2: `eu`, Region: `France`
- Q3: `75000` (€75,000)
- Q4: `other`, Other text: `Biotechnology`
- Q5: `social` (detail: `Improve healthcare access`), `other` (Other text: `Educational impact`)
- Q6: `idea`
- Q7: `rd`, Other: `Patent filing`, Other: `Prototype development` (multiple)
- Q8: `12` (months)
- Q9: `2` (months)
- Q10: `co_no`
- Q11: **SHOULD BE SKIPPED** (Q6 is `idea`)
- Q12: `2` (people)

**Expected Results:**
- ✅ Q11 is skipped (correct - idea stage)
- ✅ All "Other" text fields save correctly
- ✅ Multiple "Other" entries in Q7 save
- ✅ Results appear despite many "Other" selections
- ✅ Results relevant to pre-founder/idea stage

---

## Scenario 4: Minimal Answers (Skip Everything)

**Purpose**: Test skip functionality and minimum requirements

**Answers:**
- Q1: `startup`
- Q2: **SKIP**
- Q3: **SKIP**
- Q4: **SKIP**
- Q5: **SKIP**
- Q6: `early_stage`
- Q7: **SKIP**
- Q8: `18` (months)
- Q9: `3` (months)
- Q10: **SKIP**
- Q11: `pre_revenue`
- Q12: `5` (people)

**Expected Results:**
- ✅ Can skip all optional questions
- ✅ Generate button appears after 6+ answered
- ✅ Results appear (may be limited/less specific)
- ✅ No errors

---

## Scenario 5: Geographic Bias Test - Austria

**Purpose**: Test Austria-specific results

**Answers:**
- Q1: `startup`
- Q2: `austria`, Region: `Vienna`
- Q3: `500000` (€500,000)
- Q4: `digital`
- Q5: `economic`
- Q6: `early_stage`
- Q7: `rd`
- Q8: `24` (months)
- Q9: `6` (months)
- Q10: `co_yes`, Percentage: `30%`
- Q11: `pre_revenue`
- Q12: `8` (people)

**Note**: Count results, note geographic distribution

---

## Scenario 6: Geographic Bias Test - Germany

**Purpose**: Compare with Scenario 5 (same answers, different location)

**Answers:**
- Q1: `startup`
- Q2: `germany`, Region: `Berlin`
- Q3: `500000` (€500,000)
- Q4: `digital`
- Q5: `economic`
- Q6: `early_stage`
- Q7: `rd`
- Q8: `24` (months)
- Q9: `6` (months)
- Q10: `co_yes`, Percentage: `30%`
- Q11: `pre_revenue`
- Q12: `8` (people)

**Compare with Scenario 5:**
- ⚠️ **FLAG IF**: Significantly fewer results than Austria
- ⚠️ **FLAG IF**: Results are less relevant

---

## Scenario 7: Industry Bias Test - Digital

**Purpose**: Test Digital/ICT industry

**Answers:**
- Q1: `startup`
- Q2: `eu`, Region: `France`
- Q3: `500000`
- Q4: `digital` (only)
- Q5: `economic`
- Q6: `early_stage`
- Q7: `rd`
- Q8: `18` (months)
- Q9: `3` (months)
- Q10: `co_yes`, Percentage: `30%`
- Q11: `pre_revenue`
- Q12: `5` (people)

**Note**: Count results

---

## Scenario 8: Industry Bias Test - Sustainability

**Purpose**: Compare with Scenario 7 (same answers, different industry)

**Answers:**
- Q1: `startup`
- Q2: `eu`, Region: `France`
- Q3: `500000`
- Q4: `sustainability` (only)
- Q5: `environmental`
- Q6: `early_stage`
- Q7: `rd`
- Q8: `18` (months)
- Q9: `3` (months)
- Q10: `co_yes`, Percentage: `30%`
- Q11: `pre_revenue`
- Q12: `5` (people)

**Compare with Scenario 7:**
- ⚠️ **FLAG IF**: Significantly fewer results than Digital
- ⚠️ **FLAG IF**: Results are less relevant

---

## Scenario 9: Company Type Bias Test - Pre-founder

**Purpose**: Test pre-founder gets results

**Answers:**
- Q1: `prefounder`
- Q2: `eu`, Region: `France`
- Q3: `100000` (€100,000)
- Q4: `digital`
- Q5: `economic`
- Q6: `idea`
- Q7: `rd`
- Q8: `12` (months)
- Q9: `2` (months)
- Q10: `co_no`
- Q11: **SKIPPED** (idea stage)
- Q12: `2` (people)

**Expected Results:**
- ✅ Results appear (pre-founders should not be excluded)
- ⚠️ **FLAG IF**: No results for pre-founders

---

## Scenario 10: Funding Amount Bias Test - Small

**Purpose**: Test small funding amounts get results

**Answers:**
- Q1: `startup`
- Q2: `eu`, Region: `France`
- Q3: `50000` (€50,000) - **SMALL**
- Q4: `digital`
- Q5: `economic`
- Q6: `early_stage`
- Q7: `rd`
- Q8: `12` (months)
- Q9: `2` (months)
- Q10: `co_no`
- Q11: `pre_revenue`
- Q12: `3` (people)

**Expected Results:**
- ✅ Results appear
- ⚠️ **FLAG IF**: No results for small amounts

---

## Scenario 11: Funding Amount Bias Test - Large

**Purpose**: Compare with Scenario 10

**Answers:**
- Q1: `startup`
- Q2: `eu`, Region: `France`
- Q3: `2500000` (€2,500,000) - **LARGE**
- Q4: `digital`
- Q5: `economic`
- Q6: `early_stage`
- Q7: `rd`
- Q8: `24` (months)
- Q9: `6` (months)
- Q10: `co_yes`, Percentage: `50%`
- Q11: `pre_revenue`
- Q12: `10` (people)

**Compare with Scenario 10:**
- ⚠️ **FLAG IF**: Significantly more results than small amounts

---

## Scenario 12: Skip Logic Test - Q9

**Purpose**: Test Q9 skip logic (skip if Q8 > 36 months)

**Test A: Q8 = 18 months (Q9 should appear)**
- Q8: `18`
- Q9: **SHOULD APPEAR**

**Test B: Q8 = 40 months (Q9 should be skipped)**
- Q8: `40`
- Q9: **SHOULD BE SKIPPED**

**Test C: Q8 = 36 months (Q9 should appear)**
- Q8: `36`
- Q9: **SHOULD APPEAR**

**Test D: Q8 = 37 months (Q9 should be skipped)**
- Q8: `37`
- Q9: **SHOULD BE SKIPPED**

---

## Scenario 13: Skip Logic Test - Q11

**Purpose**: Test Q11 skip logic (skip if Q6 is idea or pre_company)

**Test A: Q6 = idea (Q11 should be skipped)**
- Q6: `idea`
- Q11: **SHOULD BE SKIPPED**

**Test B: Q6 = pre_company (Q11 should be skipped)**
- Q6: `pre_company`
- Q11: **SHOULD BE SKIPPED**

**Test C: Q6 = early_stage (Q11 should appear)**
- Q6: `early_stage`
- Q11: **SHOULD APPEAR**

**Test D: Q6 = growth_stage (Q11 should appear)**
- Q6: `growth_stage`
- Q11: **SHOULD APPEAR**

---

## Quick Testing Checklist

For each scenario, verify:
- [ ] All answers save correctly
- [ ] Results appear
- [ ] Results are relevant
- [ ] No errors in console
- [ ] Skip logic works (if applicable)
- [ ] "Other" fields save (if used)
- [ ] Translations work (test EN and DE)

---

## Bias Testing Comparison Matrix

| Test | Location | Industry | Company Type | Funding | Expected Similar Results? |
|------|----------|----------|--------------|---------|---------------------------|
| 5 vs 6 | Austria vs Germany | Same | Same | Same | ✅ Yes |
| 7 vs 8 | Same | Digital vs Sustainability | Same | Same | ✅ Yes |
| 9 | Same | Same | Pre-founder | Same | ✅ Should get results |
| 10 vs 11 | Same | Same | Same | Small vs Large | ✅ Yes (may vary slightly) |

**Flag any significant differences!**

---

**Happy Testing! 🧪**

