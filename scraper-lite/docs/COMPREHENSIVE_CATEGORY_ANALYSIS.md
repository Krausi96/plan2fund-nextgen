# Comprehensive Category Analysis - What We Extract vs What We Should Extract

## ✅ YES - Eligibility, Project, Impact ARE Properly Split!

### Eligibility (247 requirements) ✅
**Types:**
- `company_type` (85) - "Austrian companies", "Startups", "SME"
- `company_stage` (42) - "Early stage", "Growth stage", "Mature"
- `industry_restriction` (68) - "Agriculture, Forestry, Tourism", "All business sectors"
- `eligibility_criteria` (52) - "Not self-employed, not eligible for AMS..." ✅ **HIGH QUALITY (16.6/100)**

**Status**: ✅ **Properly split!**

### Project (150 requirements) ✅
**Types:**
- `innovation_focus` (69) - "Climate change, Digitalization, Mobility"
- `technology_area` (36) - "Autonomous driving", "Aviation", "Digitization"
- `sector_focus` (24) - "Creative industries & media", "Energy sector"
- `research_domain` (21) - "Basic and applied research", "Climate change, environmental protection"

**Status**: ✅ **Properly split!**

### Impact (116 requirements) ✅
**Types:**
- `social_impact` (37) - "Creating jobs and stimulating economic growth"
- `environmental_impact` (29) - "Climate-friendly innovation", "Contribution to circular economy"
- `economic_impact` (26) - "Contribution to Austrian economy"
- `innovation_impact` (24) - "Development of new products and services"

**Status**: ✅ **Properly split!**

---

## 🔍 What is "Other" Category? (344 requirements - LARGEST!)

### "Other" Contains:
1. **`use_of_funds`** (58) - "Acquiring and developing R&D infrastructure", "Bring the idea to market maturity"
2. **`application_process`** (36) - "Application form", "Companies must submit a business plan..."
3. **`capex_opex`** (24) - "Both capital and operational expenditures are eligible"
4. **`evaluation_criteria`** (24) - "Innovation and research focus, company size and experience"
5. **`co_financing`** (21) - "50% reserved for female PhD candidates", "Co-financing is not required"
6. **`restrictions`** (20) - "Companies must comply with Austrian laws"
7. **`intellectual_property`** (19) - "Intellectual Property protection"
8. **`consortium`** (18) - "Consortium is not required"
9. **`equity_terms`** (18) - "No equity terms"
10. **`repayment_terms`** (18) - "No repayment terms"
11. **`trl_level`** (18) - "No specific TRL level mentioned"
12. **`diversity`** (18) - "No specific diversity mentioned"
13. **`success_metrics`** (18) - "No specific success metrics mentioned"
14. **`market_size`** (17) - "Austrian economy"
15. **`revenue_model`** (17) - "Industry-related research"

### Problem with "Other":
- **Too large** (344 requirements) - should be split
- **Many "No specific..." values** - extracting negative information
- **Mixed types** - application, funding details, restrictions all together

### Recommendation:
Split "Other" into:
- **`application`** - application_process, evaluation_criteria
- **`funding_details`** - use_of_funds, capex_opex, co_financing, revenue_model, market_size
- **`restrictions`** - restrictions, intellectual_property, consortium, diversity
- **`terms`** - equity_terms, repayment_terms, trl_level, success_metrics
- **`other`** - Only truly miscellaneous items

---

## ⚠️ Issues Found

### 1. Geographic - Extracting Single Words ❌
**What we extract:**
- "Austria" (1.2/100)
- "EU" (0.9/100)
- "Vienna" (1.1/100)

**What we SHOULD extract:**
- "Companies based in Austria, Germany, or EU member states"
- "Must have headquarters in Vienna or be planning to relocate to Vienna"
- "Open to companies from all EU countries"

**Fix**: Improve LLM prompt to extract full geographic descriptions, not just country names

### 2. Low Meaningfulness - Extracting "No specific..." ❌
**Problem**: Many requirements extract negative information:
- "No specific requirements mentioned" (2.2/100)
- "No specific co-financing mentioned" (6.1/100)
- "No specific restrictions" (5.6/100)

**Fix**: Filter out requirements that start with "No specific..." or are just "None mentioned"

### 3. Single Words in Requirements ❌
**Problem**: Extracting single words instead of full descriptions:
- `company_type`: "SME" (2.0/100) - should be "Small and medium-sized enterprises (SMEs)"
- `currency`: "EUR" (0.0/100) - should be in metadata, not requirements
- `funding_amount_status`: "Fixed" (1.0/100) - should be in metadata

**Fix**: 
- Filter out single-word requirements (< 10 chars)
- Move metadata fields (currency, funding_amount_status) to metadata, not requirements

### 4. Financial Category Issues ❌
**What we extract:**
- `funding_amount_status`: "Fixed", "Variable", "cost-free" (1.0/100) - **Should be metadata**
- `currency`: "EUR" (0.0/100) - **Should be metadata**
- `funding_amount_min/max`: Numbers (20-21/100) - **Should be metadata**

**What we SHOULD extract:**
- `repayment_terms`: "Must repay within 5 years at 2% interest" ✅
- `guarantee_fee`: "from 2.0% p.a. onward" ✅ (22/100)
- `guarantee_ratio`: "up to 80%" ✅ (21/100)
- `co_financing`: "Minimum 30% own contribution" ✅

**Fix**: Move `funding_amount_min`, `funding_amount_max`, `currency`, `funding_amount_status` to metadata only

### 5. Documents Category - Low Quality ❌
**What we extract:**
- `document_type`: "Application form" (2.1/100)
- `required_document`: "Business plan" (2.3/100)

**What we SHOULD extract:**
- `required_documents`: "Business plan (max 10 pages), CV, Project description, Proof of company registration" ✅ (7.4/100)

**Fix**: Prefer `required_documents` (plural) over `document_type` or `required_document` (singular)

---

## 📊 Category Quality Analysis

### High Quality Categories (Good Extraction) ✅
1. **eligibility.eligibility_criteria** - 16.6/100 ✅
   - "Not self-employed, not eligible for AMS start-up programme..."
2. **timeline.deadline** - 16.3/100 ✅
   - Specific dates and deadlines
3. **compliance.compliance_requirement** - 11.7/100 ✅
   - "Compliance with EU and national regulations"
4. **legal.legal_requirement** - 8.2/100 ✅
   - "Business must have been founded in Vienna..."
5. **other.application_process** - 7.1/100 ✅
   - "Companies must submit a business plan, CV, and project description"

### Low Quality Categories (Need Improvement) ❌
1. **geographic.geographic_eligibility** - 1.2/100 ❌
   - Extracting "Austria" instead of full descriptions
2. **financial.funding_amount_status** - 1.0/100 ❌
   - Should be metadata, not requirement
3. **financial.currency** - 0.0/100 ❌
   - Should be metadata, not requirement
4. **eligibility.company_type** - 2.0/100 ❌
   - Extracting "SME" instead of full descriptions
5. **documents.document_type** - 2.1/100 ❌
   - Extracting "Application form" instead of full lists

---

## 🎯 Recommendations

### 1. Split "Other" Category ✅
- Create `application` category (application_process, evaluation_criteria)
- Create `funding_details` category (use_of_funds, capex_opex, co_financing)
- Create `restrictions` category (restrictions, intellectual_property)
- Keep `other` only for truly miscellaneous items

### 2. Improve Geographic Extraction ✅
- Extract full descriptions: "Companies based in Austria, Germany, or EU member states"
- Not just: "Austria"
- Update LLM prompt to emphasize full geographic descriptions

### 3. Filter Out Negative Information ✅
- Filter requirements starting with "No specific..."
- Filter "None mentioned", "Not specified"
- These are not actionable requirements

### 4. Move Metadata Fields to Metadata ✅
- `funding_amount_min`, `funding_amount_max` → metadata only
- `currency` → metadata only
- `funding_amount_status` → metadata only
- Keep in requirements: `repayment_terms`, `guarantee_fee`, `co_financing`

### 5. Improve Documents Extraction ✅
- Prefer `required_documents` (plural, full list) over `document_type` (singular)
- Extract full lists: "Business plan (max 10 pages), CV, Project description"

### 6. Filter Single Words ✅
- Filter requirements < 10 characters
- Filter single words like "SME", "EUR", "Fixed"
- These should be in metadata or expanded to full descriptions

---

## ✅ Summary

### What's Working:
- ✅ Eligibility, Project, Impact ARE properly split
- ✅ High-quality requirements are being extracted (eligibility_criteria, deadlines)
- ✅ Categories are mostly correct

### What Needs Improvement:
- ❌ "Other" category too large (344 requirements) - needs splitting
- ❌ Geographic extracting single words instead of full descriptions
- ❌ Many "No specific..." requirements (negative information)
- ❌ Metadata fields (currency, funding_amount_status) in requirements
- ❌ Single-word requirements (SME, EUR, Fixed)

### Next Steps:
1. Split "Other" into `application`, `funding_details`, `restrictions`
2. Improve geographic extraction (full descriptions)
3. Filter negative information ("No specific...")
4. Move metadata fields to metadata only
5. Filter single-word requirements

**Ready to implement these improvements?** 🚀

