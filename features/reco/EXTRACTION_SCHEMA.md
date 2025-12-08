# Extraction Schema - Unified

## User Questions (What We Ask)

### Core Questions:
1. **organisation_stage** → Maps to `company_type` + `company_stage`
2. **revenue_status** → User's revenue situation
3. **location** → Where project takes place
4. **funding_amount** → How much funding needed
5. **industry_focus** → Project focus area
6. **co_financing** → Can they contribute budget?
7. **use_of_funds** → How will funding be used? (optional)

### Advanced Questions (optional):
8. **deadline_urgency** → When need funding decision?
9. **impact_focus** → Which impact areas?

---

## What We Extract (LLM Recommendation)

### Fields That Match User Questions (Covered):

1. **Location** → `location`, `region`
   - User asks: Where project takes place
   - We extract: Where program is available

2. **Funding Amount** → `funding_amount_min`, `funding_amount_max`, `currency`
   - User asks: How much they need
   - We extract: How much program offers

3. **Industry Focus** → `program_focus` (array)
   - User asks: Their project focus
   - We extract: Program's thematic focus

4. **Co-Financing** → `co_financing_required` (boolean), `co_financing_percentage` (number | null)
   - User asks: Can they provide co-financing
   - We extract: Does program require co-financing

5. **Use of Funds** → `use_of_funds` (array | null)
   - User asks: How they'll use funding
   - We extract: What program allows funds to be used for

6. **Impact Focus** → `impact_focus` (array | null)
   - User asks: Their impact areas
   - We extract: Program's impact focus

7. **Company Type/Stage** → `company_type`, `company_stage`
   - User asks: Their organisation stage
   - We extract: What company types/stages program accepts

8. **Deadline** → `deadline` (ISO date YYYY-MM-DD | null), `open_deadline` (boolean)
   - User asks: When they need decision
   - We extract: When program deadline is

### Additional Fields Extracted (Not Asked in Questions):

1. **Basic Program Info:**
   - `id` - Program identifier
   - `name` - Program name
   - `website` - Program URL
   - `description` - Program description (2-3 sentences)

2. **Funding Types:**
   - `funding_types` - Array of funding types (grant, loan, equity, etc.)

3. **Program Metadata:**
   - `organization` - Organization running the program
   - `typical_timeline` - Typical processing timeline
   - `competitiveness` - How competitive the program is (high/medium/low)

4. **Requirements (Now Extracted):**
   - `categorized_requirements` - Container for program-specific requirements
   - Structure: `{ "documents": [...], "project": [...], "financial": [...], "technical": [...] }`
   - Each category is an array of requirement objects

---

## Requirements Categories (What Goes Inside categorized_requirements)

**For LLM Recommendations, we extract 4 categories:**

1. **Documents** - Separate files to upload
   - Structure: `{ "value": "Document name", "description": "...", "format": "pdf"|"docx"|"xlsx", "required": true|false, "requirements": [...] }`
   - Examples: "Business Plan PDF", "Financial Statements Excel", "Technical Specification PDF", "CV"
   - **Decision rule:** If program requires a separate file/document → Put here

2. **Project** - Business plan sections (project-related)
   - Structure: `{ "value": "Section title", "description": "...", "required": true|false, "requirements": "..."|[...], "type": "project_details"|"market_size"|"revenue_model"|"capex_opex" }`
   - Examples: "Project Description" section, "Market Analysis" section, "Business Model" section
   - **Decision rule:** If program requires content within the business plan about the project → Put here

3. **Financial** - Business plan sections (financial-related)
   - Structure: `{ "value": "Section title", "description": "...", "required": true|false, "requirements": "..."|[...], "type": "repayment_terms"|"interest_rate"|"equity_terms"|"funding_rate"|"grant_ratio"|"guarantee_fee"|"guarantee_ratio" }`
   - Examples: "Financial Plan" section, "Budget Breakdown" section, "Financial Projections" section
   - **Decision rule:** If program requires content within the business plan about finances → Put here

4. **Technical** - Business plan sections (technical-related)
   - Structure: `{ "value": "Section title", "description": "...", "required": true|false, "requirements": "..."|[...], "type": "technical_requirement"|"trl_level" }`
   - Examples: "Technical Approach" section, "Innovation" section, "Technology Readiness" section
   - **Decision rule:** If program requires content within the business plan about technical aspects → Put here

**Note:** Database extraction (web scraping) uses 12 categories, but LLM recommendations use these 4 categories for the editor.

---

## Summary

### User Questions → Extracted Fields (Covered):
- ✅ organisation_stage → company_type, company_stage
- ✅ location → location, region
- ✅ funding_amount → funding_amount_min, funding_amount_max, currency
- ✅ industry_focus → program_focus
- ✅ co_financing → co_financing_required, co_financing_percentage
- ✅ use_of_funds → use_of_funds
- ✅ impact_focus → impact_focus
- ✅ deadline_urgency → deadline, open_deadline

### Additional Fields Extracted (Not Asked):
- Basic: id, name, website, description
- Funding: funding_types
- Metadata: organization, typical_timeline, competitiveness
- Requirements: `categorized_requirements` (container field, currently empty `{}` for LLM recommendations)

### What Goes Inside categorized_requirements (12 Categories):
The 12 requirement categories are what SHOULD populate `categorized_requirements`:
- Documents, Technical, Legal, Team, Compliance, Application, Restrictions, Terms
- Financial terms (repayment, interest, equity) - NOT co-financing
- Timeline details (duration, application window) - NOT deadline
- Eligibility criteria (industry restrictions) - NOT company type/stage

**Note:** LLM recommendations now extract 4 categories (`documents`, `project`, `financial`, `technical`) for the editor. Database extraction (web scraping) uses 12 categories but is not used in the web app.

---

## Current State

**LLM Recommendation Extracts:**
- All fields that match user questions ✅
- Basic program info ✅
- Program metadata ✅
- Requirements: `categorized_requirements` with 4 categories (`documents`, `project`, `financial`, `technical`) ✅

**Database Extraction Extracts:**
- All fields that match user questions ✅
- Basic program info ✅
- Program metadata ✅
- Requirements: `categorized_requirements` populated with 12 categories (for web scraping, not used in web app)

**Relationship:**
- `categorized_requirements` = the container/field (object structure)
- LLM recommendations: 4 categories (`documents`, `project`, `financial`, `technical`) for editor
- Database extraction: 12 categories (for web scraping, not used in web app)

