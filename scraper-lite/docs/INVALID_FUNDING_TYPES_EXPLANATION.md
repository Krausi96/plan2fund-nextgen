# Invalid Funding Types - Explanation & Handling

## Why These Types Are Invalid

### 1. `services` / `service` (14 pages)

**Why Invalid**: 
- "Services" is not a funding mechanism - it's a **service offering**
- Examples: Consulting services, advisory services, networking services
- These are **support services**, not financial funding

**What They Actually Are**:
- Often part of a larger program that includes funding
- Should be in `program_focus` or `metadata`, not `funding_types`
- Example: "Business coaching services" → Not funding, but a service

**How We Deal With Them**:
1. ✅ **Remove from `funding_types`** - Not a funding type
2. ⚠️ **Check if page has actual funding** - If yes, infer correct type (grant/loan/etc.)
3. ⚠️ **If no funding found** - Mark as non-funding page (might need different handling)

**Example**:
- Page: "Business coaching services"
- Current: `funding_types: ["services"]` ❌
- After: `funding_types: []` (empty - no funding, just services)
- Action: Page might need to be excluded or marked differently

---

### 2. `coaching` / `mentoring` (3 + 1 = 4 pages)

**Why Invalid**:
- Coaching and mentoring are **support services**, not funding
- They don't provide money - they provide guidance/advice
- Should be in `program_focus` (e.g., "startup coaching program")

**What They Actually Are**:
- Support services that might be part of a funding program
- Example: "Startup coaching program" might include grants, but coaching itself isn't funding

**How We Deal With Them**:
1. ✅ **Remove from `funding_types`**
2. ⚠️ **Check if page mentions actual funding** - If yes, extract that
3. ⚠️ **If only coaching/mentoring** - Mark as non-funding page

**Example**:
- Page: "Startup mentoring program"
- Current: `funding_types: ["coaching"]` ❌
- After: `funding_types: []` (empty - no funding)
- Action: Check if program includes grants/loans, if not, exclude from funding database

---

### 3. `consultations` / `consultation` (2 pages)

**Why Invalid**:
- Consultations are **advisory services**, not funding
- They provide advice, not money
- Should be in `program_focus` or metadata

**How We Deal With Them**:
1. ✅ **Remove from `funding_types`**
2. ⚠️ **Check if consultations are part of funding program** - If yes, extract funding type
3. ⚠️ **If only consultations** - Mark as non-funding page

---

### 4. `networking opportunities` (1 page)

**Why Invalid**:
- Networking is a **service/activity**, not funding
- Provides connections, not money
- Should be in `program_focus`

**How We Deal With Them**:
1. ✅ **Remove from `funding_types`**
2. ⚠️ **Check if networking is part of funding program** - If yes, extract funding type
3. ⚠️ **If only networking** - Mark as non-funding page

---

### 5. `real estate` (1 page)

**Why Invalid**:
- Real estate is a **sector/industry**, not a funding type
- Should be in `program_focus` (e.g., "real estate development")
- Funding for real estate would be `grant`, `loan`, `equity`, etc.

**How We Deal With Them**:
1. ✅ **Remove from `funding_types`**
2. ⚠️ **Check if page mentions actual funding** - If yes, extract type (grant/loan/etc.)
3. ⚠️ **Move to `program_focus`** - Real estate is a focus area, not funding type

**Example**:
- Page: "Real estate development funding"
- Current: `funding_types: ["real estate"]` ❌
- After: `funding_types: ["grant"]` (if grant) or `["loan"]` (if loan)
- Also: `program_focus: ["real_estate"]`

---

### 6. `unknown` (22 pages)

**Why Invalid**:
- "Unknown" is not a funding type - it's a **lack of information**
- Should be inferred from context or left empty
- Empty array is better than "unknown"

**What They Actually Are**:
- Pages where LLM couldn't identify funding type
- Might be: non-funding pages, unclear pages, or pages with actual funding that wasn't detected

**How We Deal With Them**:
1. ✅ **Remove "unknown" from `funding_types`**
2. ⚠️ **Try to infer from context**:
   - URL patterns (`/grant/`, `/loan/`, etc.)
   - Institution type (research agency = grant, bank = loan)
   - Page content keywords
3. ⚠️ **If still unclear** - Leave empty `[]` (better than "unknown")

**Example**:
- Page: "Innovation program" (unclear)
- Current: `funding_types: ["unknown"]` ❌
- After: `funding_types: ["grant"]` (if inferred from institution) or `[]` (if truly unclear)

---

## Summary: How We Deal With Invalid Types

### Step 1: Remove Invalid Types ✅
- Remove: `services`, `coaching`, `mentoring`, `consultations`, `networking`, `real estate`, `unknown`
- Done in `normalizeFundingTypes()`

### Step 2: Try to Infer Correct Type ⚠️
- Check URL patterns
- Check institution type
- Check page content
- Done in `inferFundingType()`

### Step 3: Handle Non-Funding Pages ⚠️
- If no funding type found after inference → `funding_types: []`
- These pages might need:
  - Exclusion from funding database
  - Different categorization (services, support, etc.)
  - Manual review

### Step 4: Move to Correct Fields ⚠️
- `real estate` → `program_focus: ["real_estate"]`
- `coaching` → `program_focus: ["coaching"]` or metadata
- `services` → `program_focus: ["services"]` or metadata

---

## Recommendations

### Immediate Actions:
1. ✅ **Run migration** - Normalize existing data
2. ⚠️ **Review pages with empty `funding_types`** - Are they actually funding pages?
3. ⚠️ **Exclude non-funding pages** - If page has no funding, exclude from database

### Future Improvements:
1. ⚠️ **Better LLM prompt** - Explicitly exclude invalid types
2. ⚠️ **Inference improvement** - Better context-based inference
3. ⚠️ **Non-funding page handling** - Separate category or exclusion

---

## Example Transformations

### Example 1: Services Page
```
Before: funding_types: ["services"]
After:  funding_types: []
Action: Check if page has funding, if not, exclude
```

### Example 2: Coaching Program with Grant
```
Before: funding_types: ["coaching"]
After:  funding_types: ["grant"] (if grant found)
        program_focus: ["coaching"]
```

### Example 3: Real Estate Development Loan
```
Before: funding_types: ["real estate"]
After:  funding_types: ["loan"]
        program_focus: ["real_estate"]
```

### Example 4: Unknown Page
```
Before: funding_types: ["unknown"]
After:  funding_types: ["grant"] (if inferred) or []
```

