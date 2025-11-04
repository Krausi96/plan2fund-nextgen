# 📋 Categories, Issues & Intelligence Analysis

**Date:** 2025-11-02  
**Status:** Complete Analysis

---

## 📊 The 19 Requirement Categories

### Basic Categories (9):
1. **eligibility** - Who can apply
2. **documents** - Required documents
3. **financial** - Funding amounts, co-financing
4. **technical** - Technical requirements, TRL levels
5. **legal** - Legal requirements, compliance
6. **timeline** - Deadlines, duration, milestones
7. **geographic** - Location requirements
8. **team** - Team size, qualifications
9. **project** - Project focus, innovation areas

### Additional Categories (10):
10. **compliance** - Regulatory compliance, standards
11. **impact** - Expected impact, outcomes, KPIs
12. **capex_opex** - Capital vs. operational expenses
13. **use_of_funds** - How funding can be used
14. **revenue_model** - Revenue requirements
15. **market_size** - Market requirements
16. **co_financing** - Co-financing percentages
17. **trl_level** - Technology readiness level
18. **consortium** - Consortium requirements
19. **diversity** - Diversity, inclusion requirements

**Total: 19 categories** (note: sometimes called 18, but diversity was added)

---

## ⚠️ Critical Issues Identified

### 1. DB Save Failed

**Problem:** DATABASE_URL environment variable not set  
**Impact:** All data saved to JSON fallback only  
**Root Cause:** Environment configuration missing

**Solution:**
```bash
# Add to .env.local
DATABASE_URL=postgresql://user:password@host.neon.tech/database?sslmode=require
```

**Fix Status:** ⚠️ Needs configuration

---

### 2. Funding Amount Issues

#### Problem 1: Weird Amounts (222€, 202€, etc.)

**Found:** 28 potentially incorrect amounts
- 202€, 203€ (likely year numbers like "Horizon 2020")
- 100€, 200€, 300€ (likely page numbers or IDs)
- 500€, 508€ (likely page numbers)

**Root Causes:**
1. Year numbers mistaken as amounts (2020-2030 range)
2. Page numbers/IDs extracted as amounts
3. Other numeric data parsed incorrectly

**Examples:**
- "Horizon Europe" → 202€ (year "2020" or page number)
- "IP-Appointment" → 100€ (likely ID or page number)
- "Accessibility statement" → 200€ (page number)

**Solution:**
```typescript
// Filter out suspicious amounts
function validateFundingAmount(amount: number, context: string): boolean {
  // Filter years (2020-2030)
  if (amount >= 2020 && amount <= 2030) return false;
  
  // Filter very small round numbers (< 1,000)
  if (amount < 1000 && amount % 100 === 0) return false;
  
  // Filter common page number patterns
  if ([100, 200, 300, 400, 500, 600, 700, 800, 900].includes(amount)) return false;
  
  return true;
}
```

#### Problem 2: Missing Amounts

**Found:** 80.4% of pages have NO funding amount
- FFG: 182 pages without amounts (70% of FFG pages)
- OEKB: 62 pages (86%)
- Raiffeisen: 57 pages (89%)

**Why:**
1. Some programs don't specify amounts upfront
2. Amounts require calculation/consultation
3. Amounts only shown after login/application
4. Programs are information pages, not funding programs

**Solution:**
```typescript
// Learn which sites don't have amounts
const sitesWithoutAmounts = [
  'ffg.at', // Many EU programs don't specify upfront
  'oead.at', // Information pages
  // Track and learn
];

// Mark pages as "amount_requires_calculation" or "amount_on_application"
```

---

### 3. Quality Issues - Low Percentages

**Categories with Low Quality (<70% meaningful):**
- Some categories have lower quality due to:
  1. Generic text extraction
  2. Too short items
  3. Placeholder text
  4. Wrong context extraction

**Diagnosis Needed:**
Run `analyze-requirement-quality.js` to identify:
- Which categories are problematic
- What makes them low quality (generic, short, placeholder)
- Which extraction sources produce low quality
- Specific examples of low quality items

**Solution Approach:**
1. Identify low-quality items
2. Analyze patterns in low-quality items
3. Improve extraction patterns
4. Add validation filters

---

### 4. Form-Based Applications (Account Creation Required)

**Problem:** Some funding programs require:
1. Account creation/login
2. Filling specific form fields
3. Multi-step application process
4. Fields only visible after login

**Current State:** ❌ Not detected or handled

**What We Need:**
1. **Detection:** Identify pages that require login
2. **Flagging:** Mark programs as "requires_account" or "application_form"
3. **Extraction:** Try to extract form field requirements from page structure
4. **Metadata:** Store form field requirements if visible

**Detection Patterns:**
```typescript
// Detect login/account requirements
const loginIndicators = [
  /(?:login|anmelden|registrieren|register|account|benutzerkonto)/i,
  /(?:bewerbung|application)[\s]+(?:über|via|through)[\s]+(?:portal|system|plattform)/i,
  /(?:online|digital)[\s]+(?:bewerbung|application)[\s]+(?:erforderlich|required)/i
];

// Detect form fields in HTML
const formFields = $('input[type="text"], input[type="email"], select, textarea')
  .map((_, el) => {
    const name = $(el).attr('name') || '';
    const label = $(el).prev('label').text() || '';
    const required = $(el).attr('required') !== undefined;
    return { name, label, required };
  });
```

**Implementation Needed:**
- Add `application_method` field (online_form, email, portal, etc.)
- Add `requires_account` boolean
- Extract form field requirements
- Store in `metadata_json` or new `application_fields` table

---

### 5. General Intelligence - Requirement Meaningfulness

**Current Quality:** 76% meaningful (good, but can improve)

**What Makes Requirements Meaningful:**
1. ✅ Specific information (not generic)
2. ✅ Contextual details
3. ✅ Actionable requirements
4. ✅ Complete information

**What Makes Requirements NOT Meaningful:**
1. ❌ Generic phrases ("required", "specified", "n/a")
2. ❌ Too short (< 10 characters)
3. ❌ Placeholder text
4. ❌ Wrong context (extracted from wrong section)

**Metrics:**
- **Meaningful:** 76% (17,698 / 23,417 items)
- **Generic:** 2% (431 items)
- **Context Extraction:** 59% (13,704 items)
- **Heading Extraction:** 13% (2,932 items)

**Improvement Opportunities:**
1. Better context extraction (currently 59%)
2. Filter generic phrases
3. Validate length and content
4. Improve source tracking

---

## 🔧 Immediate Fixes Needed

### Priority 1: Funding Amount Validation (Critical)
- Filter out years (2020-2030)
- Filter out small round numbers (< 1,000)
- Filter out common page numbers
- Add context validation

### Priority 2: Database Connection (Critical)
- Set DATABASE_URL in .env.local
- Migrate JSON data to database

### Priority 3: Form-Based Application Detection (High)
- Detect login requirements
- Extract form fields
- Store application method

### Priority 4: Quality Improvement (Medium)
- Analyze low-quality categories
- Improve extraction patterns
- Add validation filters

---

## 📋 Action Items

### Immediate
1. ✅ Created funding amount analysis script
2. ✅ Created requirement quality analysis script
3. ⚠️ Fix funding amount validation
4. ⚠️ Configure DATABASE_URL

### Short-Term
1. Implement form-based application detection
2. Improve requirement quality
3. Learn which sites don't have amounts
4. Add context validation

### Long-Term
1. Machine learning for requirement quality
2. Better form field extraction
3. Multi-step application process detection
4. Requirement relationship extraction

---

**Status:** ✅ Analysis Complete - Ready for Implementation

