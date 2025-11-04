# Required Changes Based on ChatGPT Analysis

**Date:** 2025-01-03  
**Analysis Source:** ChatGPT Product Review & Analysis

---

## ✅ **GOOD NEWS: Template Solution is Correct**

### **What ChatGPT Recommended:**
- Dynamic templates aligned with program requirements
- Program-specific customization
- Master templates with source verification

### **What We Have:**
✅ **ALREADY IMPLEMENTED**
- `MASTER_SECTIONS` with source-verified templates (FFG, AWS, Horizon Europe, WKO, Sequoia)
- `MASTER_DOCUMENTS` with product-specific structure
- `loadProgramSections()` - Loads program-specific from database
- `mergeSections()` - Merges program-specific with master
- Program-specific overrides via `/api/programmes/${id}/requirements`

**Conclusion:** ✅ **Our template solution matches ChatGPT's recommendations perfectly.**

---

## ✅ **GOOD NEWS: Program Templates Match**

### **What ChatGPT Recommended:**
- Templates should match FFG, AWS, EIC, Visa requirements
- Source verification and alignment with official programs

### **What We Have:**
✅ **ALREADY IMPLEMENTED**
- Source verification on all sections (`source.verified`, `officialProgram`, `sourceUrl`)
- FFG Basisprogramm references
- Horizon Europe/EIC references
- WKO references
- Sequoia Capital references for equity
- Program-specific sections from database

**Conclusion:** ✅ **Our templates match program requirements as recommended.**

---

## ❌ **CHANGES NEEDED**

### **1. Add "Funding Fit & Eligibility" Section to Strategy** 🔴 **HIGH PRIORITY**

**ChatGPT Recommendation:** Strategy product should include a section analyzing which funding programs match.

**Action Required:**
- Add new section to Strategy sections for all funding types (grants, bankLoans, equity, visa)
- Section ID: `funding_fit_eligibility`
- Order: 6 (after Preliminary Financial Overview)
- Word count: 150-250 words
- Prompts: "Which Austrian grant programs match your project?", "Does your idea involve R&D?", etc.

**File to Modify:**
- `shared/lib/templates/sections.ts` - Add section to strategy sections

---

### **2. Restructure MASTER_SECTIONS for Product Types** 🔴 **HIGH PRIORITY**

**ChatGPT Recommendation:** Different sections per product (strategy/review/submission)

**Current State:**
- `MASTER_SECTIONS` only has funding types: `Record<string, SectionTemplate[]>`
- Need: `Record<string, Record<string, SectionTemplate[]>>` (fundingType → productType → sections)

**Action Required:**
- Restructure to: `grants.strategy`, `grants.review`, `grants.submission`
- Strategy: 6 focused sections (including Funding Fit)
- Review: All sections (8-11 depending on funding type)
- Submission: All sections + program-specific

**File to Modify:**
- `shared/lib/templates/sections.ts` - Restructure MASTER_SECTIONS
- `shared/lib/templates/index.ts` - Update `getSections()` to accept productType

**Note:** This is already planned in `PRODUCT_SPECIFIC_SECTIONS_IMPLEMENTATION_SPEC.md`

---

### **3. Update Product Names** 🟡 **MEDIUM PRIORITY**

**ChatGPT Recommendation:**
- Strategy → "Strategic Plan & Funding Fit"
- Review → "Business Plan Review & Enhancement"
- Submission → "Full Application / Submission Package"

**Current State:**
- Type: `Product = 'strategy'|'review'|'submission'`

**Action Required:**
- Option A: Keep internal types as-is, only update UI labels
- Option B: Update types and add display names mapping

**Files to Modify:**
- `shared/types/plan.ts` - Consider adding `displayName` mapping
- UI components - Update labels

**Recommendation:** Option A (keep internal types, update UI labels)

---

### **4. Add Missing Additional Documents** 🟡 **MEDIUM PRIORITY**

**ChatGPT Recommended (Missing):**

**Strategy:**
- ❌ Lean Business Canvas (PDF template)
- ❌ Funding Fit Report (DOCX template)

**Review:**
- ❌ Gap Analysis Report (PDF template)
- ❌ Compliance Checklist (DOCX template)
- ❌ Reviewer Comments (DOCX template)

**Submission:**
- ❌ Pitch Deck (PPTX template)
- ❌ Video Pitch Script (DOCX template)
- ❌ Proof of Capital/Equity (PDF template)
- ❌ Letters of Support (PDF template)
- ❌ CVs/Resumes (PDF template)

**Action Required:**
- Add templates to `MASTER_DOCUMENTS` in `shared/lib/templates/documents.ts`

---

### **5. Implement Quality Validation & Export Blocking** 🔴 **HIGH PRIORITY**

**ChatGPT Recommendation:**

**Quality Thresholds:**
- Strategy: 70% (informational, suggest improvements)
- Review: 80% (compliance required, block if < 80%)
- Submission: 100% (mandatory compliance, block if < 100%)

**Block Export If:**
- Strategy: Missing core sections or no funding program match
- Review: Quality < 80%, missing sections, compliance gaps
- Submission: Any compliance unmet, quality < 100%, missing documents

**Current State:**
- ✅ RequirementsChecker provides compliance scoring
- ❌ No quality validation function
- ❌ No export blocking based on quality/compliance

**Action Required:**
- Create `shared/lib/qualityValidation.ts` with quality validation function
- Add export blocking logic in `pages/export.tsx` or `features/export/engine/export.ts`
- Integrate with RequirementsChecker scores

---

### **6. Adjust Word Counts for Strategy** 🟢 **LOW PRIORITY**

**ChatGPT Recommendation:**
- Strategy sections: 150-350 words (reduced from current)
- Executive Summary: 200-300 words (we have 200-500)

**Current State:**
- Strategy sections use same word counts as Review/Submission
- Need to differentiate

**Action Required:**
- Adjust word counts for Strategy product sections
- Keep Review/Submission as-is (ChatGPT's ranges are similar)

---

### **7. New Products (Decision Needed)** 🟢 **OPTIONAL**

**ChatGPT Recommended:**
1. One-Pager / Executive Summary
2. Draft Plan / Quick Plan
3. Pitch Deck (standalone product)
4. Financial Model Only
5. Compliance Check / Eligibility Assessment (standalone)

**Current State:**
- ❌ Not implemented
- RequirementsChecker exists but not as standalone product

**Action Required:**
- **Decision needed:** Should we implement these now or later?
- If yes, add to `Product` type and create templates

**Recommendation:** Defer to Phase 2 (after product-specific sections are working)

---

## 📊 **SUMMARY**

### **✅ What's Already Correct:**
1. ✅ Template solution (master + program merge)
2. ✅ Program template matching (source-verified)
3. ✅ RequirementsChecker compliance checking

### **❌ What Needs Change:**

**Priority 1 (Must Have):**
1. ❌ Add "Funding Fit & Eligibility" section to Strategy
2. ❌ Restructure MASTER_SECTIONS for product types
3. ❌ Implement quality validation & export blocking

**Priority 2 (Should Have):**
4. ❌ Update product names (UI labels)
5. ❌ Add missing additional documents

**Priority 3 (Nice to Have):**
6. ❌ Adjust word counts for Strategy
7. ❌ Consider new products (decision needed)

---

## 🎯 **NEXT STEPS**

1. **Implement product-specific sections structure** (already planned)
2. **Add "Funding Fit & Eligibility" section** to Strategy
3. **Create quality validation function** and export blocking
4. **Add missing additional documents** templates
5. **Update UI labels** for product names

---

## ✅ **CONCLUSION**

**Template Solution:** ✅ **ALREADY CORRECT** - Our master + program merge system matches ChatGPT's recommendations.

**Program Templates:** ✅ **ALREADY CORRECT** - Source-verified templates match program requirements.

**Main Gaps:**
- Product-specific sections structure (already planned)
- Funding Fit section (needs adding)
- Quality validation & export blocking (needs implementing)
- Missing additional documents (needs adding)

**The core template architecture is sound - we just need to add product-specific structure and missing sections/documents.**

