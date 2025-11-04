# Additional Documents: Data Sources & Generation Quality

## 📊 **WHERE DATA COMES FROM**

### **1. Template Sources**

**Master Templates** (`shared/lib/templates/documents.ts`):
- Pre-defined templates for each funding type (grants, bankLoans, equity, visa)
- Each template contains structured markdown with placeholders
- Examples: `work_plan_gantt`, `budget_breakdown`, `ethics_risk_assessment`, `business_plan_bank`

**Program-Specific Templates** (`shared/lib/templates/program-overrides.ts`):
- Loaded from database via `/api/programmes/${id}/requirements`
- Merged with master templates (program-specific takes priority)
- Contains program-specific requirements and formats

### **2. Data Extraction Sources**

**From Plan Sections:**
- Section content (HTML/rich text) → extracted as plain text
- Section titles → used for content mapping
- Financial tables (`revenue`, `costs`, `cashflow`, `useOfFunds`) → converted to markdown tables
- Figures/charts → referenced but not yet fully extracted

**From User Answers** (localStorage `pf_userAnswers`):
- `business_name`, `company_name`
- `funding_amount`, `amount`
- `team_size`, `team`
- `location`, `country`
- `company_age`, `age`
- `timeline`, `duration`
- `use_of_funds`, `useOfFunds`
- `business_description`, `description`
- `target_market`, `market`

**From Plan Settings:**
- `plan.settings.titlePage.title` → Project/Business Name
- `plan.settings.titlePage.subtitle` → Subtitle
- `plan.settings.titlePage.author` → Author
- `plan.settings.titlePage.date` → Date

**From Program Info** (API):
- `program.name` → Program Name
- `program.type` → Program Type
- `program.amount` → Program Amount

---

## 🔄 **DATA FLOW**

```
┌─────────────────────────────────────────────────────────────┐
│                    DATA FLOW                                 │
└─────────────────────────────────────────────────────────────┘

1. TEMPLATE LOADING
   └─> getDocument(fundingType, productType, docId, programId)
       ├─> Load master template from documents.ts
       └─> Load program-specific template from DB (if available)
       └─> Merge (program-specific overrides master)

2. DATA EXTRACTION
   └─> extractPlanData(plan, userAnswers)
       ├─> Extract from plan.sections (content, tables, figures)
       ├─> Extract from userAnswers (business info, funding, team)
       ├─> Extract from plan.settings (title, author, date)
       └─> Extract financials from tables (revenue, costs, cashflow)

3. TEMPLATE FILLING
   └─> fillTemplate(template, plan, userAnswers, program)
       ├─> Map template placeholders → extracted data
       │   ├─> [Project Name] → businessInfo.PROJECT_TITLE
       │   ├─> [Amount] → businessInfo.FUNDING_AMOUNT
       │   ├─> [Description] → businessInfo.BUSINESS_DESCRIPTION
       │   └─> [REVENUE_TABLE] → formatTable(revenue)
       └─> Replace all placeholders with actual values

4. MARKDOWN → HTML CONVERSION
   └─> Convert filled template to HTML
       ├─> Headers (#, ##, ###) → <h1>, <h2>, <h3>
       ├─> Tables (| ... |) → <table>
       ├─> Lists (-, 1.) → <li>
       └─> Bold/Italic (**text*, *text*) → <strong>, <em>

5. PDF GENERATION
   └─> generateSimplePdf(title, html, filename)
       └─> html2pdf.js converts HTML to PDF
```

---

## ✅ **WILL DOCUMENTS BE USEFUL & INTELLIGENT?**

### **YES - Now They Will Be!**

**Before (Basic):**
- ❌ Only replaced `[Section Title]` with first 200 chars of content
- ❌ No financial data extraction
- ❌ No intelligent mapping
- ❌ Placeholders like `[Project Name]` stayed unfilled

**After (Enhanced):**
- ✅ **Intelligent Placeholder Mapping**: `[Project Name]` → actual project title
- ✅ **Financial Data Extraction**: Tables converted to markdown, inserted into templates
- ✅ **Multi-Source Data**: Combines plan sections, user answers, program info
- ✅ **Formatted Output**: Proper markdown → HTML → PDF conversion
- ✅ **Structured Content**: Financial tables, work packages, budgets properly formatted

### **Example: Work Plan & Gantt Chart**

**Template Has:**
```markdown
## Project Overview
- Project Title: [Project Name]
- Duration: [Start Date] - [End Date]
- Total Budget: €[Amount]

## Work Packages
| WP | Title | Description | Start | End | Duration | Lead | Partners |
```

**After Filling:**
```markdown
## Project Overview
- Project Title: My Innovation Project
- Duration: 2025-01-15 - 2027-12-31
- Total Budget: €500,000

## Work Packages
| WP | Title | Description | Start | End | Duration | Lead | Partners |
|----|-------|-------------|-------|-----|----------|------|----------|
| WP1 | Development | Core product development | 2025-01-15 | 2025-12-31 | 12 months | John Doe | Tech Partners |
```

**Data Sources:**
- `[Project Name]` → `plan.settings.titlePage.title` or `userAnswers.business_name`
- `[Amount]` → `userAnswers.funding_amount` or `financials.REVENUE_TOTAL`
- `[Description]` → `businessInfo.BUSINESS_DESCRIPTION` or section content
- `[Lead]` → `businessInfo.TEAM_INFO` or `businessInfo.TEAM_SIZE`

### **Example: Budget Breakdown**

**Template Has:**
```markdown
## Total Project Budget
- Total Project Costs: €[Amount]
- EU Contribution: €[Amount] ([Percentage]%)

## Cost Categories
| Category | EU Funding | Co-financing | Total | Justification |
|----------|------------|--------------|-------|---------------|
| Personnel | €[Amount] | €[Amount] | €[Amount] | [Justification] |
```

**After Filling:**
```markdown
## Total Project Budget
- Total Project Costs: €500,000
- EU Contribution: €500,000 (100%)

## Cost Categories
| Category | EU Funding | Co-financing | Total | Justification |
|----------|------------|--------------|-------|---------------|
| Personnel | €200,000 | €0 | €200,000 | Team salaries for development |
```

**Data Sources:**
- `[Amount]` → `userAnswers.funding_amount`
- `[Justification]` → `businessInfo.USE_OF_FUNDS` or section content
- Financial table data → extracted from `plan.sections[].tables.costs`

---

## 📋 **SUPPORTED PLACEHOLDERS**

### **Template Placeholders (with spaces) - NOW SUPPORTED:**
- `[Project Name]` / `[Project Title]` / `[Company Name]`
- `[Amount]` / `[Total Budget]` / `[Total Project Costs]` / `[Funding Amount]`
- `[Date]` / `[Start Date]` / `[End Date]`
- `[Description]` / `[Title]`
- `[Lead]` / `[Partners]` / `[Team]`
- `[Percentage]` / `[Justification]` / `[Months]`
- `[Deliverable]` / `[Number]` / `[Destinations]`
- `[Specific services]` / `[List of major equipment]`

### **Extracted Data Placeholders (with underscores) - ALSO SUPPORTED:**
- `[PROJECT_TITLE]` / `[BUSINESS_NAME]`
- `[FUNDING_AMOUNT]` / `[REVENUE_TOTAL]` / `[COSTS_TOTAL]`
- `[REVENUE_TABLE]` / `[COSTS_TABLE]` / `[USE_OF_FUNDS_TABLE]`
- `[REVENUE_YEAR_1]` / `[REVENUE_YEAR_2]` / `[REVENUE_YEAR_3]`
- `[WORD_COUNT]` / `[COMPLETION]`
- `[GENERATED_DATE]` / `[LANGUAGE]` / `[TONE]`

### **Program Placeholders:**
- `[PROGRAM_NAME]` / `[PROGRAM_TYPE]` / `[PROGRAM_AMOUNT]`

### **Legacy Placeholders:**
- `[Section Title]` → Replaced with section content (first 500 chars, HTML stripped)

---

## 🎯 **QUALITY ASSESSMENT**

### **What Works Well:**
✅ **Basic placeholders** (Project Name, Amount, Date) → **Fully populated**
✅ **Financial tables** → **Extracted and formatted as markdown**
✅ **Section content** → **Extracted and inserted where relevant**
✅ **Program info** → **Populated when available**
✅ **Markdown formatting** → **Properly converted to HTML**

### **What's Still Basic:**
⚠️ **Work packages** → Still template placeholders (needs user input or AI generation)
⚠️ **Milestones** → Still template placeholders (needs structured data)
⚠️ **Gantt charts** → Visual timeline not generated (text description only)
⚠️ **Complex financial calculations** → Percentages, ratios not auto-calculated
⚠️ **Risk assessments** → Still template placeholders (needs content extraction)

### **What's Missing:**
❌ **Visual charts/graphs** → Tables work, but charts not rendered
❌ **Conditional logic** → Can't show/hide sections based on data
❌ **Smart defaults** → Some placeholders still show `[Not specified]`
❌ **Data validation** → No checks if data is complete/accurate

---

## 💡 **RECOMMENDATIONS**

### **For Maximum Quality:**

1. **Enhance User Input:**
   - Add forms for work packages, milestones, risk assessments
   - Store structured data (not just text) for complex fields

2. **AI Content Generation:**
   - Use `AIHelper` to generate work package descriptions
   - Generate risk assessments based on project type
   - Create milestone descriptions from timeline

3. **Data Validation:**
   - Check if required fields are filled
   - Warn user about missing data
   - Provide smart defaults where possible

4. **Enhanced Extraction:**
   - Extract structured data from section content (dates, amounts, etc.)
   - Parse natural language for timelines, budgets
   - Identify key metrics from text

---

## 📊 **SUMMARY**

### **Current State:**
- ✅ **Data extraction works** - pulls from plan, user answers, program
- ✅ **Placeholder mapping works** - maps template placeholders to data
- ✅ **Financial tables work** - extracted and formatted
- ✅ **Output is formatted** - markdown → HTML → PDF

### **Output Quality:**
- **Good**: Basic documents (budget breakdowns, business plans) will be **mostly filled** with real data
- **Fair**: Complex documents (work plans, Gantt charts) will have **structure** but **some placeholders** remain
- **Needs work**: Visual elements (charts, timelines) are **text-only** for now

### **Bottom Line:**
**YES - Documents will now be useful and intelligently filled!** 

The system:
1. Extracts data from multiple sources (plan, answers, program)
2. Maps template placeholders to actual data
3. Formats financial tables properly
4. Generates formatted PDFs

**But**: Some complex placeholders (work packages, milestones) still need user input or AI generation to be fully populated.

