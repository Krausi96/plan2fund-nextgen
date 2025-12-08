# Recommendation Flow: Simplification Analysis

## Overview: The Flow

1. **User answers 9 questions** → These are USER inputs (what they need/want)
2. **LLM extracts program information** → These are PROGRAM details (what programs offer)
3. **Scoring matches** → Compares user needs with program offerings
4. **Editor needs requirements** → Additional program requirements (documents, sections to write)

**Key Point:** The 9 questions are USER answers. The LLM extracts PROGRAM information (separate from user answers). The `categorized_requirements` are ADDITIONAL program requirements that help the editor create templates.

---

## 1. What is Asked in ProgramFinder?

**Core Questions (7):**
1. `organisation_stage` → Maps to `company_type` + `company_stage`
2. `revenue_status` → User's revenue situation
3. `location` → Where project takes place
4. `funding_amount` → How much funding needed
5. `industry_focus` → Project focus area
6. `co_financing` → Can they contribute budget?
7. `use_of_funds` → How will funding be used? (optional)

**Advanced Questions (2, optional):**
8. `deadline_urgency` → When need funding decision?
9. `impact_focus` → Which impact areas?

---

## 2. What Do We Score?

**Used in scoring (6 fields, 100% total):**
- `location` → 25% weight
- `company_type` (derived from `organisation_stage`) → 20% weight
- `company_stage` (derived from `organisation_stage`) → 15% weight
- `funding_amount` → 20% weight
- `industry_focus` → 10% weight (matches against `program_focus`)
- `co_financing` → 10% weight

**NOT used in scoring (4 fields):**
- `revenue_status` → Asked but not used
- `use_of_funds` → Asked but not used
- `deadline_urgency` → Asked but not used
- `impact_focus` → Asked but not used

---

## 3. What is Overall Extracted?

**From LLM Recommendations:**

**Fields matching user questions (8 mappings):**
- `location`, `region` (from user `location`)
- `funding_amount_min`, `funding_amount_max`, `currency` (from user `funding_amount`)
- `program_focus` (array) (from user `industry_focus`)
- `co_financing_required`, `co_financing_percentage` (from user `co_financing`)
- `company_type`, `company_stage` (from user `organisation_stage`)
- `use_of_funds` (array) - extracted from program description (user asked but not used in scoring)
- `impact_focus` (array) - extracted from program description (user asked but not used in scoring)
- `deadline`, `open_deadline` - extracted from program description (user asked but not used in scoring)

**Basic program info (4 fields):**
- `id` - Program identifier
- `name` - Program name
- `website` - Program URL
- `description` - Program description (2-3 sentences)

**Funding type:**
- `funding_types` (array) - Types of funding offered (grant, loan, equity, etc.)
  - **Why extracted:** 
    1. **UI Display** - Shows colored badge on program card (green for grants, blue for loans, purple for equity, etc.) - helps users quickly identify funding type
    2. **Eligibility filtering** - Critical for matching: If user answers `co_financing: "co_no"` (can't provide co-financing), the scoring function filters out loans/equity and only shows grants/subsidies/support types
    3. **Program metadata** - Stored when user selects a program (needed for editor context)

**Requirements:**
- `categorized_requirements: {}` - Currently empty
- Should contain 4 categories for editor:
  - `documents` - Array of document requirements (value, description, format, required, requirements)
  - `project` - Array of project section requirements (value, description, required, requirements, type)
  - `financial` - Array of financial requirements (value, description, required, requirements, type)
  - `technical` - Array of technical requirements (value, description, required, requirements, type)

---

## 4. What is Parsed to Editor?

**Editor expects from `categorized_requirements`:**
- `documents` → Creates **document templates** (files to upload: PDFs, Word docs, Excel, etc.)
- `project` → Creates **business plan sections** (sections to write in the plan)
- `financial` → Creates **business plan sections** (sections to write in the plan)
- `technical` → Creates **business plan sections** (sections to write in the plan)

**Key distinction:**
- `documents` = **Separate files to upload** (e.g., "Technical Specification PDF", "Financial Plan Excel", "CV", "Business Plan PDF")
- `project`, `financial`, `technical` = **Sections within the business plan document** (e.g., "Project Description" section, "Financial Plan" section, "Technical Approach" section)

**Important:** If a program requires a separate document (e.g., "Technical Specification" as a PDF file), it should go in `documents`, NOT in `technical`. The `technical` category is for sections within the main business plan document.

**Structure of each category:**

**`documents`** - Array of objects (separate files to upload):
```json
{
  "value": "Business plan" | ["Business plan", "Financial statements", "Technical Specification"],
  "description": "Detailed business plan required",
  "format": "pdf" | "docx" | "xlsx",
  "required": true,
  "requirements": ["Must include 3-year projections", "Include market analysis"]
}
```
**Types:** `required_documents`, `document_type`, `format`
**What it creates:** Separate files to upload (e.g., "Business Plan PDF", "Financial Statements Excel", "Technical Specification PDF")
**Note:** If program requires a separate document (not a section in the business plan), put it here

**`project`** - Array of objects (becomes business plan sections):
```json
{
  "value": "Project description" | "Market analysis",
  "description": "Describe your project in detail",
  "required": true,
  "requirements": "Explain the innovation and market opportunity" | ["Requirement 1", "Requirement 2"],
  "type": "project_details" | "market_size" | "revenue_model" | "capex_opex"
}
```
**Types:** `project_details`, `market_size`, `revenue_model`, `capex_opex`
**What it creates:** Writing sections **within the business plan document** (e.g., "Project Description" section, "Market Analysis" section)
**Note:** If program requires a separate "Project Description" document/file, put it in `documents` instead

**`financial`** - Array of objects (becomes business plan sections):
```json
{
  "value": "Financial projections" | "Budget breakdown",
  "description": "3-year financial projections required",
  "required": true,
  "requirements": "Include P&L, cash flow, balance sheet",
  "type": "repayment_terms" | "interest_rate" | "equity_terms" | "funding_rate" | "grant_ratio" | "guarantee_fee" | "guarantee_ratio"
}
```
**Types:** `repayment_terms`, `interest_rate`, `equity_terms`, `funding_rate`, `grant_ratio`, `guarantee_fee`, `guarantee_ratio`
**What it creates:** Writing sections **within the business plan document** (e.g., "Financial Plan" section, "Budget Breakdown" section)
**Note:** If program requires a separate "Financial Plan" spreadsheet/file, put it in `documents` instead

**`technical`** - Array of objects (becomes business plan sections):
```json
{
  "value": "Technical specifications" | "TRL level",
  "description": "Technical details of your project",
  "required": false,
  "requirements": "Describe technology readiness",
  "type": "technical_requirement" | "trl_level"
}
```
**Types:** `technical_requirement`, `trl_level`
**What it creates:** Writing sections **within the business plan document** (e.g., "Technical Approach" section, "Innovation" section)
**Note:** If program requires a separate "Technical Specification" document/file, put it in `documents` instead

**Current state:**
- `categorized_requirements: {}` (empty) - Editor fails gracefully when empty (returns empty arrays)
- Need to extract these 4 categories in LLM recommendations to enable editor

**Relationship to Core Documents:**

**How it works:**
1. **Core documents** (`MASTER_DOCUMENTS`) = Default documents for each funding type/product type
   - For `submission` product type: Typically empty `[]` (business plan has no additional documents by default)
   - For `strategy` product type: Has default documents (Executive Summary, Market Opportunity, etc.)
   - These are the base/default documents

2. **Program documents** = Extracted from `categorized_requirements.documents` (program-specific requirements)
   - These are program-specific documents that the program requires
   - Examples: "Business Plan PDF", "Financial Statements Excel", "Technical Specification PDF"

3. **Merging process** (`mergeDocuments()` function):
   - Core documents are loaded first
   - Program documents are loaded from `categorized_requirements.documents`
   - If program document has same ID as core document → program document overrides core
   - If program document is new (different ID) → it's added to the list
   - Result: User sees merged list = core documents + program-specific documents

**Example:**
- Core documents: `[]` (empty for submission)
- Program documents: `[{name: "Business Plan PDF", ...}, {name: "CV", ...}]`
- Result: User sees 2 documents (Business Plan PDF, CV)

**Same logic applies to sections:**
- Core sections (`MASTER_SECTIONS`) = Default business plan sections
- Program sections = Extracted from `categorized_requirements.project/financial/technical`
- Merged together with program sections overriding or adding to core sections

---

## Simplification Opportunities

### Unused Questions (Keep Them)
**Questions asked but not scored:**
- `revenue_status` → Asked but not used in scoring (used in prompt for funding type filtering)
- `use_of_funds` → Asked but not used in scoring (extracted from programs for display)
- `deadline_urgency` → Asked but not used in scoring (extracted from programs for display)
- `impact_focus` → Asked but not used in scoring (extracted from programs for display)

**Why keep them:**
- User answers help LLM understand context (especially `revenue_status` for funding type filtering)
- Programs still extract these fields from descriptions for display
- No scoring impact, but useful for matching and display

### Extract Requirements for Editor
**Current:** `categorized_requirements: {}` (empty)

**Need to extract:**
- `documents` - Required documents
- `project` - Project description requirements
- `financial` - Financial information requirements
- `technical` - Technical requirements

**Impact:** Enables editor to work with LLM recommendations

---

## Current State Example

**Step 1: User Answers 9 Questions:**
```json
{
  "organisation_stage": "early_stage_startup",
  "revenue_status": "pre_revenue",
  "location": "austria",
  "funding_amount": 50000,
  "industry_focus": ["digital"],
  "co_financing": "co_no",
  "use_of_funds": ["product_development"],
  "deadline_urgency": "3_6_months",
  "impact_focus": ["environmental"]
}
```

**Step 2: LLM Extracts Program Information (CURRENT STATE):**
```json
{
  "id": "ffg-basisprogramm",
  "name": "FFG Basisprogramm",
  "website": "https://www.ffg.at/basisprogramm",
  "description": "Funding program for startups in Austria...",
  "funding_types": ["grant"],
  "funding_amount_min": 10000,
  "funding_amount_max": 100000,
  "currency": "EUR",
  "location": "Austria",
  "region": "Austria",
  "company_type": "startup",
  "company_stage": "inc_lt_6m",
  "program_focus": ["digital", "innovation"],
  "co_financing_required": false,
  "co_financing_percentage": null,
  "deadline": "2024-12-31",
  "open_deadline": false,
  "use_of_funds": ["product_development", "hiring"],
  "impact_focus": ["environmental"],
  "categorized_requirements": {}  // ← EMPTY! This is the problem
}
```

**Step 3: What SHOULD Be in `categorized_requirements` (BUT ISN'T):**
```json
{
  "categorized_requirements": {
    "documents": [
      {
        "value": "Business plan",
        "description": "Detailed business plan required",
        "format": "pdf",
        "required": true,
        "requirements": ["Must include 3-year financial projections", "Include market analysis"]
      },
      {
        "value": "Financial statements",
        "description": "Current financial statements",
        "format": "pdf",
        "required": true,
        "requirements": []
      }
    ],
    "project": [
      {
        "value": "Project description",
        "description": "Describe your project in detail",
        "required": true,
        "requirements": "Explain the innovation, market opportunity, and technical approach",
        "type": "project_details"
      },
      {
        "value": "Market analysis",
        "description": "Market size and competition analysis",
        "required": true,
        "requirements": "Include target market size, competitors, and market positioning",
        "type": "market_size"
      }
    ],
    "financial": [
      {
        "value": "Financial projections",
        "description": "3-year financial projections",
        "required": true,
        "requirements": "Include P&L, cash flow, and balance sheet",
        "type": "repayment_terms"
      }
    ],
    "technical": [
      {
        "value": "Technical specifications",
        "description": "Technical details and TRL level",
        "required": false,
        "requirements": "Describe technology readiness level (TRL) and technical approach",
        "type": "trl_level"
      }
    ]
  }
}
```

**The Problem:**
- Currently: `categorized_requirements: {}` (empty)
- Editor needs: 
  - `documents` → To show which files to upload
  - `project`, `financial`, `technical` → To show which sections to write in the business plan
- Without these, editor can't create program-specific templates/sections

---

## Summary

**Flow:**
1. Ask 9 questions (7 core + 2 advanced) - All questions kept, 4 not used in scoring
2. Score 6 fields (location, company_type, company_stage, funding_amount, industry_focus, co_financing)
3. Extract from programs: 8 field mappings + 4 basic info + 1 funding type + requirements
4. Parse 4 requirement categories to editor (currently empty, needs extraction)

**What is Extracted:**

**From user questions → program fields (8 mappings):**
- `organisation_stage` → `company_type`, `company_stage`
- `location` → `location`, `region`
- `funding_amount` → `funding_amount_min`, `funding_amount_max`, `currency`
- `industry_focus` → `program_focus` (array)
- `co_financing` → `co_financing_required`, `co_financing_percentage`
- `use_of_funds` (user answer) → `use_of_funds` (extracted from program)
- `deadline_urgency` (user answer) → `deadline`, `open_deadline` (extracted from program)
- `impact_focus` (user answer) → `impact_focus` (extracted from program)

**Basic program info (4 fields):**
- `id`, `name`, `website`, `description`

**Funding type (1 field):**
- `funding_types` (array)

**Requirements (currently empty):**
- `categorized_requirements: {}` - Need to extract: `documents`, `project`, `financial`, `technical`

**Simplification:**
- Keep all 9 questions (4 help with matching/display even if not scored)
- Extract 4 requirement categories → Editor works with LLM recommendations

---

## Action Items

### 1. Extract Requirements in LLM Recommendations (Priority: High)

**Problem:** `categorized_requirements: {}` is empty, so editor can't create program-specific templates.

**Solution:** Update LLM prompt to extract 4 categories:
- `documents` - **Separate files to upload** (e.g., "Business Plan PDF", "Financial Statements Excel", "Technical Specification PDF", "CV")
- `project` - **Business plan sections** to write (e.g., "Project Description" section, "Market Analysis" section)
- `financial` - **Business plan sections** to write (e.g., "Financial Plan" section, "Budget Breakdown" section)
- `technical` - **Business plan sections** to write (e.g., "Technical Approach" section, "Innovation" section)

**Decision rule for LLM:**
- If program requires a **separate file/document** → Put in `documents` (e.g., "Technical Specification PDF", "Financial Plan Excel")
- If program requires content **within the business plan** → Put in `project`/`financial`/`technical` (e.g., "Project Description" section, "Financial Plan" section)

**What to do:**
1. Update `features/reco/prompts/programRecommendation.ts`:
   - Add extraction instructions for the 4 categories in the JSON structure
   - Add examples of what to extract for each category
   - Update the prompt to guide LLM on extracting requirements from program descriptions

2. Update extraction schema documentation:
   - Document the 4 categories structure in `features/reco/EXTRACTION_SCHEMA.md`

3. Test:
   - Verify LLM extracts requirements correctly
   - Verify editor can use extracted requirements
   - Handle edge cases (empty/malformed requirements)

**Expected outcome:** Editor works with LLM recommendations, users get program-specific templates.

### 2. Keep Current Question Flow (No Changes)

**Decision:** Keep all 9 questions as-is:
- All questions provide value (even if 4 aren't scored)
- `revenue_status` helps with funding type filtering
- `use_of_funds`, `deadline_urgency`, `impact_focus` are extracted from programs for display
- No UX simplification needed

**Action:** None required - current flow is good.

### 3. Optional: Improve Requirements Extraction Quality

**Future enhancement:** 
- Add validation for extracted requirements
- Add fallback/default requirements if LLM doesn't extract well
- Consider post-processing to improve extraction quality

**Action:** Defer - can be done after basic extraction works.
