# Scraper Improvements - Analysis & Recommendations

## 🔍 Analysis Results

### 1. Funding Types Issue

**Problem**: 6 funding types are defined in `institutionConfig.ts` but never appear in the database:
- `wage-subsidy`
- `leasing`
- `crowdfunding`
- `visa_application`
- `equity_crowdfunding`
- `convertible_loan`

**Root Cause**: The `CANONICAL_FUNDING_TYPES` in `funding-types.ts` doesn't include all types from `institutionConfig.ts`. The normalization function filters out types not in the canonical list.

**Current State**:
- Config has: 13 unique types
- Database has: 7 unique types (grant, equity, loan, subsidy, guarantee, venture_capital, bank_loan)
- Missing: 6 types

**Recommendation**: 
1. Add missing types to `CANONICAL_FUNDING_TYPES` in `funding-types.ts`
2. Re-normalize existing pages to catch any missed types
3. Ensure all institution config types are in the canonical list

---

### 2. Requirements Analysis - Too Shallow

**Problems Found**:

#### A. Duplicate Values with Slight Variations
- "Austria" (59 times, meaning: 1.0) vs "Companies must be based in Austria" (13 times, meaning: 52.0)
- "SME" (30 times, meaning: 0.0) vs "Small and medium-sized enterprises (SMEs) with less than 250 employees" (109 times, meaning: 70.0)
- Multiple variations of the same requirement with different wording

#### B. Generic/Low-Quality Values
- "SME" (meaning: 0.0) - too generic
- "all" (meaning: 0.0) - not actionable
- "Early stage" (meaning: 1.0) - too vague
- "Startup" (meaning: 1.0) - too generic
- "Business plan" (meaning: 1.0) - too generic
- "none specified" (meaning: 1.0) - should be filtered out

#### C. Category Case Sensitivity
- `eligibility` (642 reqs, meaning: 56.6) vs `Eligibility` (247 reqs, meaning: 5.5)
- `geographic` (181 reqs, meaning: 58.6) vs `Geographic` (73 reqs, meaning: 1.1)
- `financial` (237 reqs, meaning: 71.9) vs `Financial` (89 reqs, meaning: 5.3)
- This suggests inconsistent extraction or normalization

#### D. Categories with Zero Meaningfulness
- `innovation_focus`: 16 reqs, 0.0 avg meaning
- `company_stage`: 6 reqs, 0.0 avg meaning
- `repayment_terms`: 6 reqs, 0.0 avg meaning
- `technology_area`: 5 reqs, 0.0 avg meaning
- These should either be improved or filtered out

#### E. Missing Deep Value Analysis
- No analysis of what specific values are extracted (e.g., exact geographic regions, specific eligibility criteria)
- No deduplication of similar values
- No quality scoring based on specificity

**Recommendations**:
1. **Normalize category names** (lowercase all categories)
2. **Deduplicate similar values** (fuzzy matching for requirements)
3. **Filter generic values** ("SME", "all", "none specified", etc.)
4. **Improve meaningfulness scoring** for generic terms
5. **Add value-specific analysis** (what exact regions, what exact eligibility criteria, etc.)
6. **Create requirement value normalization** (similar to funding type normalization)

---

### 3. Career/Job Pages Not Properly Excluded

**Problem**: Found 4 pages with career/job keywords:
1. "Jobs in der SFG - Stellenangebote" - Excluded (pattern learned)
2. "Fachkräfte mit Top!Job" - NOT excluded, has funding type "grant" (false positive?)
3. "Your new job at the Vienna Business Agency" - NOT excluded, 12 requirements
4. "Karriere | FFG" - NOT excluded, 38 requirements

**Root Cause**: 
- Only 1 pattern learned: `/die-sfg/jobs-in-der-sfg-stellenangebote/` (confidence: 0.60)
- Hardcoded exclusions in `blacklist.ts` don't include career/job patterns
- LLM classification might not be catching these

**Recommendations**:
1. **Add hardcoded exclusions** for career/job pages:
   - `/karriere/`, `/career/`, `/careers/`, `/jobs/`, `/stellen/`, `/job/`
   - Keywords: "karriere", "career", "job", "stellen", "recruitment"
2. **Improve LLM classification** to better detect non-program pages
3. **Review the 3 pages** that weren't excluded - are they actually funding programs or false positives?
4. **Add pattern learning** for career pages with higher confidence threshold

---

### 4. Pattern Learning - Low Confidence Patterns

**Problem**: Many excluded URL patterns have confidence of only 0.60, suggesting false positives:
- `/foerderungen/foerderungsueberblick/foerderung-finden/` (used 7 times)
- `/gruenden-und-starten/icontact/` (used 2 times)
- `/service/foerdernews/newsletter/` (used 2 times)
- Many others with confidence 0.60

**Root Cause**: The learning system is too conservative (low confidence threshold) or not validating patterns properly.

**Recommendations**:
1. **Increase confidence threshold** for exclusions (e.g., 0.70 instead of 0.60)
2. **Add validation** - re-check low-confidence patterns periodically
3. **Review high-usage patterns** - if a pattern is used 7+ times, it should have higher confidence
4. **Add manual review** for patterns with usage_count > 5 but confidence < 0.70

---

## 🎯 Action Items

### Priority 1 (Critical)
1. ✅ **Fix funding types** - Add missing types to canonical list
2. ✅ **Normalize category names** - Fix case sensitivity issues
3. ✅ **Add career/job exclusions** - Update blacklist patterns

### Priority 2 (Important)
4. ✅ **Improve requirement value analysis** - Add deduplication and filtering
5. ✅ **Filter generic values** - Remove "SME", "all", "none specified", etc.
6. ✅ **Improve meaningfulness scoring** - Better scoring for generic terms

### Priority 3 (Enhancement)
7. ✅ **Add requirement value normalization** - Similar to funding type normalization
8. ✅ **Review low-confidence patterns** - Validate and improve pattern learning
9. ✅ **Add deep value analysis** - Show exact extracted values per category

---

## 📊 Current Statistics

- **Pages**: 376
- **Requirements**: 3,822
- **Funding Types in DB**: 7 (should be 13)
- **Career/Job Pages**: 4 (only 1 excluded)
- **Low Confidence Patterns**: 20+ (confidence 0.60)
- **Category Duplicates**: 8+ (case sensitivity)
- **Generic Values**: 100+ (meaningfulness < 10)

