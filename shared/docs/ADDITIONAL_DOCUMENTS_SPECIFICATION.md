# Additional Documents Specification & Recommendations

## 📋 **CURRENT SYSTEM ARCHITECTURE**

### **How Documents Are Linked**

**Three-Tier System:**

1. **Program-Specific Documents** (Highest Priority)
   - Stored in database: `categorized_requirements.documents`
   - Extracted from program pages during scraping
   - Format: `{ value: string | string[], description?: string, format?: string, required?: boolean }`
   - Source: `'program'` - specific to this program

2. **Master Templates** (Medium Priority)
   - Location: `shared/lib/templates/documents.ts`
   - Structure: `MASTER_DOCUMENTS[fundingType][productType]`
   - Source: `'master'` - applies to all programs of this type

3. **Legacy Bundles** (Fallback)
   - Location: `shared/data/documentBundles.ts`
   - Product-specific bundles
   - Source: `'bundle'` - fallback system

**Merge Logic:**
```
Program-specific → Master Templates → Legacy Bundles
(Program overrides master, master overrides bundle)
```

---

## 📄 **COMPLETE DOCUMENT INVENTORY**

### **A. GRANTS - Additional Documents (8-12 documents)**

#### **1. Work Plan & Gantt Chart** ✅ (Exists)
- **ID:** `work_plan_gantt`
- **Format:** XLSX
- **Required:** Yes (for R&D grants)
- **When:** Horizon Europe, EIC, FFG Basisprogramm
- **Program-Specific:** Yes (some programs require it, others don't)
- **Template:** ✅ Full markdown template exists

#### **2. Budget Breakdown & Financial Model** ✅ (Exists)
- **ID:** `budget_breakdown`
- **Format:** XLSX
- **Required:** Yes (for all grants)
- **When:** All grant programs
- **Program-Specific:** No (universal)
- **Template:** ✅ Full markdown template exists

#### **3. Ethics & Risk Assessment** ✅ (Exists)
- **ID:** `ethics_risk_assessment`
- **Format:** PDF
- **Required:** Yes (for EU programs, AI projects)
- **When:** Horizon Europe, EIC, AI-focused grants
- **Program-Specific:** Yes (only required for certain programs)
- **Template:** ✅ Full markdown template exists

#### **4. Team CVs & Qualifications** ❌ (Missing)
- **ID:** `team_cvs`
- **Format:** PDF (combined)
- **Required:** Yes (for consortium projects)
- **When:** Horizon Europe, FFG consortium programs
- **Program-Specific:** Yes (consortium vs single-entity)
- **Template:** ❌ Not in system

#### **5. Consortium Agreement** ❌ (Missing)
- **ID:** `consortium_agreement`
- **Format:** PDF
- **Required:** Yes (for consortium projects)
- **When:** Horizon Europe, EIC, multi-partner grants
- **Program-Specific:** Yes (only for consortium)
- **Template:** ❌ Not in system

#### **6. Intellectual Property Plan** ❌ (Missing)
- **ID:** `ip_plan`
- **Format:** PDF
- **Required:** Sometimes (for tech/R&D projects)
- **When:** FFG, EIC, IP-sensitive grants
- **Program-Specific:** Yes (varies by program)
- **Template:** ❌ Not in system

#### **7. Data Management Plan (DMP)** ❌ (Missing)
- **ID:** `data_management_plan`
- **Format:** PDF
- **Required:** Sometimes (for research projects)
- **When:** Horizon Europe, research grants
- **Program-Specific:** Yes (research projects only)
- **Template:** ❌ Not in system

#### **8. Dissemination & Exploitation Plan** ❌ (Missing)
- **ID:** `dissemination_plan`
- **Format:** PDF
- **Required:** Sometimes (for EU programs)
- **When:** Horizon Europe, EIC
- **Program-Specific:** Yes (EU programs mainly)
- **Template:** ❌ Not in system

#### **9. Technical Annex** ❌ (Missing)
- **ID:** `technical_annex`
- **Format:** PDF
- **Required:** Sometimes (for technical grants)
- **When:** FFG, AWS technical programs
- **Program-Specific:** Yes (technical programs only)
- **Template:** ❌ Not in system

#### **10. Financial Statements** ❌ (Missing)
- **ID:** `financial_statements`
- **Format:** PDF
- **Required:** Sometimes (for established companies)
- **When:** AWS, established company grants
- **Program-Specific:** Yes (varies by company stage)
- **Template:** ❌ Not in system

#### **11. Company Registration Documents** ❌ (Missing)
- **ID:** `company_registration`
- **Format:** PDF
- **Required:** Yes (for all programs)
- **When:** All grant programs
- **Program-Specific:** No (universal)
- **Template:** ❌ Not in system

#### **12. Project Timeline (Separate from Gantt)** ❌ (Missing)
- **ID:** `project_timeline`
- **Format:** PDF/XLSX
- **Required:** Sometimes (simpler programs)
- **When:** Smaller grants, AWS programs
- **Program-Specific:** Yes (alternative to Gantt)
- **Template:** ❌ Not in system

---

### **B. BANK LOANS - Additional Documents (5-8 documents)**

#### **1. Business Plan (Bank Format)** ✅ (Exists)
- **ID:** `business_plan_bank`
- **Format:** DOCX
- **Required:** Yes (for all loans)
- **When:** All bank loans
- **Program-Specific:** No (universal format)
- **Template:** ✅ Full markdown template exists

#### **2. Collateral Documentation** ✅ (Exists)
- **ID:** `collateral_documentation`
- **Format:** PDF
- **Required:** Yes (for secured loans)
- **When:** Erste, Raiffeisen, BAWAG secured loans
- **Program-Specific:** Yes (some loans are unsecured)
- **Template:** ✅ Full markdown template exists

#### **3. Financial Statements (3-5 years)** ❌ (Missing)
- **ID:** `financial_statements_historical`
- **Format:** PDF
- **Required:** Yes (for established companies)
- **When:** All bank loans
- **Program-Specific:** No (universal)
- **Template:** ❌ Not in system

#### **4. Tax Returns** ❌ (Missing)
- **ID:** `tax_returns`
- **Format:** PDF
- **Required:** Yes (for established companies)
- **When:** All bank loans
- **Program-Specific:** No (universal)
- **Template:** ❌ Not in system

#### **5. Cash Flow Projections** ❌ (Missing)
- **ID:** `cashflow_projections`
- **Format:** XLSX
- **Required:** Yes (for all loans)
- **When:** All bank loans
- **Program-Specific:** No (universal)
- **Template:** ❌ Not in system

#### **6. Management Accounts** ❌ (Missing)
- **ID:** `management_accounts`
- **Format:** PDF/XLSX
- **Required:** Sometimes (for established companies)
- **When:** Larger loans, established companies
- **Program-Specific:** Yes (varies by loan size)
- **Template:** ❌ Not in system

#### **7. Personal Guarantees** ❌ (Missing)
- **ID:** `personal_guarantees`
- **Format:** PDF
- **Required:** Sometimes (for startups/SMEs)
- **When:** Startup loans, smaller loans
- **Program-Specific:** Yes (varies by lender)
- **Template:** ❌ Not in system

#### **8. Insurance Policies** ❌ (Missing)
- **ID:** `insurance_policies`
- **Format:** PDF
- **Required:** Sometimes (for secured loans)
- **When:** Loans with collateral
- **Program-Specific:** Yes (secured loans only)
- **Template:** ❌ Not in system

---

### **C. EQUITY/VC - Additional Documents (6-10 documents)**

#### **1. Pitch Deck** ✅ (Exists)
- **ID:** `pitch_deck`
- **Format:** PPTX
- **Required:** Yes (for all equity rounds)
- **When:** All VC/angel rounds
- **Program-Specific:** No (universal format)
- **Template:** ✅ Full markdown template exists

#### **2. Cap Table** ✅ (Exists)
- **ID:** `cap_table`
- **Format:** XLSX
- **Required:** Yes (for all equity rounds)
- **When:** All VC/angel rounds
- **Program-Specific:** No (universal)
- **Template:** ✅ Full markdown template exists

#### **3. Financial Model** ❌ (Missing)
- **ID:** `financial_model`
- **Format:** XLSX
- **Required:** Yes (for all equity rounds)
- **When:** All VC/angel rounds
- **Program-Specific:** No (universal)
- **Template:** ❌ Not in system

#### **4. Term Sheet** ❌ (Missing)
- **ID:** `term_sheet`
- **Format:** PDF
- **Required:** Sometimes (for later rounds)
- **When:** Series A+, when investor provides
- **Program-Specific:** Yes (investor-provided usually)
- **Template:** ❌ Not in system

#### **5. Due Diligence Package** ❌ (Missing)
- **ID:** `due_diligence_package`
- **Format:** PDF (multiple files)
- **Required:** Sometimes (for later rounds)
- **When:** Series A+, when requested
- **Program-Specific:** Yes (investor-requested)
- **Template:** ❌ Not in system

#### **6. Customer References** ❌ (Missing)
- **ID:** `customer_references`
- **Format:** PDF
- **Required:** Sometimes (for B2B companies)
- **When:** B2B startups, traction-focused rounds
- **Program-Specific:** Yes (varies by business model)
- **Template:** ❌ Not in system

#### **7. Product Demo Video/Link** ❌ (Missing)
- **ID:** `product_demo`
- **Format:** Video/URL
- **Required:** Sometimes (for product companies)
- **When:** Product startups, demo-focused rounds
- **Program-Specific:** Yes (product companies)
- **Template:** ❌ Not in system

#### **8. Market Research Report** ❌ (Missing)
- **ID:** `market_research`
- **Format:** PDF
- **Required:** Sometimes (for market-focused rounds)
- **When:** Market expansion rounds, Series A+
- **Program-Specific:** Yes (varies by round stage)
- **Template:** ❌ Not in system

#### **9. Legal Structure Documents** ❌ (Missing)
- **ID:** `legal_structure`
- **Format:** PDF
- **Required:** Yes (for all equity rounds)
- **When:** All equity rounds
- **Program-Specific:** No (universal)
- **Template:** ❌ Not in system

#### **10. Previous Investment Rounds** ❌ (Missing)
- **ID:** `previous_rounds`
- **Format:** PDF
- **Required:** Sometimes (for later rounds)
- **When:** Series A+, growth rounds
- **Program-Specific:** Yes (later rounds only)
- **Template:** ❌ Not in system

---

### **D. VISA - Additional Documents (4-6 documents)**

#### **1. Job Creation Plan** ✅ (Exists)
- **ID:** `job_creation_plan`
- **Format:** PDF
- **Required:** Yes (for RWR Card)
- **When:** RWR Card, business visa
- **Program-Specific:** Yes (RWR Card specific)
- **Template:** ✅ Full markdown template exists

#### **2. Proof of Funds** ✅ (Exists)
- **ID:** `proof_of_funds`
- **Format:** PDF
- **Required:** Yes (for all visas)
- **When:** All business visas
- **Program-Specific:** No (universal)
- **Template:** ✅ Full markdown template exists

#### **3. Business Registration in Austria** ❌ (Missing)
- **ID:** `business_registration_at`
- **Format:** PDF
- **Required:** Yes (for RWR Card)
- **When:** RWR Card, business establishment
- **Program-Specific:** Yes (Austria-specific)
- **Template:** ❌ Not in system

#### **4. Business Location Documentation** ❌ (Missing)
- **ID:** `business_location`
- **Format:** PDF
- **Required:** Yes (for RWR Card)
- **When:** RWR Card
- **Program-Specific:** Yes (RWR Card specific)
- **Template:** ❌ Not in system

#### **5. Qualifications & Experience** ❌ (Missing)
- **ID:** `qualifications`
- **Format:** PDF
- **Required:** Yes (for RWR Card)
- **When:** RWR Card
- **Program-Specific:** Yes (RWR Card specific)
- **Template:** ❌ Not in system

#### **6. Criminal Record Certificate** ❌ (Missing)
- **ID:** `criminal_record`
- **Format:** PDF
- **Required:** Yes (for all visas)
- **When:** All business visas
- **Program-Specific:** No (universal)
- **Template:** ❌ Not in system

---

## 🎯 **RECOMMENDED DOCUMENT STRUCTURE**

### **Master Template Structure**

```typescript
interface DocumentTemplate {
  id: string;                    // Unique identifier
  name: string;                  // Display name
  description: string;            // What the document is for
  required: boolean;              // Always required or sometimes
  format: 'pdf' | 'docx' | 'xlsx' | 'pptx' | 'text';
  maxSize: string;               // File size limit
  template: string;              // Markdown template with placeholders
  instructions: string[];        // How to fill it out
  examples: string[];           // Example references
  commonMistakes: string[];     // What to avoid
  category: string;             // 'submission', 'financial', 'legal', etc.
  fundingTypes: string[];       // Which funding types use this
  
  // Linkage properties
  programSpecific: boolean;      // NEW: Is this program-specific?
  programIds?: string[];         // NEW: Specific program IDs (if applicable)
  conditionalOn?: {              // NEW: Conditional requirements
    field: string;               // e.g., 'consortium', 'company_age'
    value: any;                  // e.g., true, 'established'
    operator?: 'equals' | 'includes' | 'greater_than'
  };
  
  // Source tracking
  source?: {
    verified: boolean;
    verifiedDate?: string;
    officialProgram?: string;
    sourceUrl?: string;
    version?: string;
  };
}
```

---

## 🔗 **HOW TO HANDLE PROGRAM LINKAGE**

### **Strategy 1: Conditional Documents (Recommended)**

**Approach:** Documents are master templates with conditional logic

**Example:**
```typescript
{
  id: 'consortium_agreement',
  name: 'Consortium Agreement',
  required: false,  // Not always required
  programSpecific: false,  // Not tied to one program
  conditionalOn: {
    field: 'consortium',
    value: true,
    operator: 'equals'
  },
  fundingTypes: ['grants']
}
```

**Logic:**
- If program has `consortium: true` → Show document
- If program has `consortium: false` → Hide document
- Works for all grant programs automatically

### **Strategy 2: Program-Specific Documents (Database)**

**Approach:** Documents stored in database per program

**Example in Database:**
```sql
-- requirements table
category: 'documents'
value: 'consortium_agreement'
description: 'Required for consortium projects'
required: true
```

**Logic:**
- Program-specific documents override master templates
- Loaded from `categorized_requirements.documents`
- Merged with master templates

### **Strategy 3: Hybrid Approach (Current System)**

**Current Implementation:**
1. **Master Templates** (`MASTER_DOCUMENTS`) - Universal documents
2. **Program-Specific** (`categorized_requirements.documents`) - Overrides
3. **Legacy Bundles** - Fallback

**Merge Order:**
```
Program-specific (database) → Master Templates → Legacy Bundles
```

**Recommendation:** ✅ **Keep this approach** - it's flexible and works well

---

## 📊 **COMPLETE DOCUMENT MATRIX**

### **Universal Documents (All Programs)**

| Document ID | Grants | Bank Loans | Equity | Visa | Required |
|-------------|--------|------------|--------|------|----------|
| `company_registration` | ✅ | ✅ | ✅ | ✅ | Always |
| `financial_statements` | ⚠️ | ✅ | ⚠️ | ❌ | Sometimes |
| `business_plan` | ✅ | ✅ | ⚠️ | ❌ | Sometimes |

### **Grant-Specific Documents**

| Document ID | When Required | Program-Specific |
|-------------|---------------|------------------|
| `work_plan_gantt` | R&D grants, Horizon Europe | ✅ Yes (some programs) |
| `budget_breakdown` | All grants | ❌ No (universal) |
| `ethics_risk_assessment` | EU programs, AI projects | ✅ Yes (EU/AI only) |
| `team_cvs` | Consortium projects | ✅ Yes (consortium only) |
| `consortium_agreement` | Multi-partner grants | ✅ Yes (consortium only) |
| `ip_plan` | Tech/R&D projects | ✅ Yes (tech projects) |
| `data_management_plan` | Research projects | ✅ Yes (research only) |
| `dissemination_plan` | EU programs | ✅ Yes (EU only) |

### **Loan-Specific Documents**

| Document ID | When Required | Program-Specific |
|-------------|---------------|------------------|
| `business_plan_bank` | All loans | ❌ No (universal) |
| `collateral_documentation` | Secured loans | ✅ Yes (secured only) |
| `tax_returns` | Established companies | ⚠️ Sometimes |
| `cashflow_projections` | All loans | ❌ No (universal) |
| `personal_guarantees` | Startups/SMEs | ✅ Yes (startups) |

### **Equity-Specific Documents**

| Document ID | When Required | Program-Specific |
|-------------|---------------|------------------|
| `pitch_deck` | All equity rounds | ❌ No (universal) |
| `cap_table` | All equity rounds | ❌ No (universal) |
| `financial_model` | All equity rounds | ❌ No (universal) |
| `term_sheet` | Later rounds | ✅ Yes (investor-provided) |
| `due_diligence_package` | Series A+ | ✅ Yes (investor-requested) |

### **Visa-Specific Documents**

| Document ID | When Required | Program-Specific |
|-------------|---------------|------------------|
| `job_creation_plan` | RWR Card | ✅ Yes (RWR specific) |
| `proof_of_funds` | All visas | ❌ No (universal) |
| `business_registration_at` | RWR Card | ✅ Yes (Austria-specific) |
| `criminal_record` | All visas | ❌ No (universal) |

---

## 🏗️ **RECOMMENDED IMPLEMENTATION**

### **Step 1: Complete Master Templates**

**Priority Documents to Add:**
1. **High Priority (Universal):**
   - `company_registration` (All types)
   - `financial_statements` (Loans, some grants)
   - `cashflow_projections` (Loans)
   - `financial_model` (Equity)

2. **Medium Priority (Common):**
   - `team_cvs` (Grants - consortium)
   - `consortium_agreement` (Grants - consortium)
   - `legal_structure` (Equity)

3. **Low Priority (Specialized):**
   - `ip_plan` (Grants - tech)
   - `data_management_plan` (Grants - research)
   - `dissemination_plan` (Grants - EU)

### **Step 2: Add Conditional Logic**

**Enhancement to DocumentTemplate:**
```typescript
interface DocumentTemplate {
  // ... existing fields ...
  
  // Conditional display
  conditionalOn?: {
    field: string;              // Field from program/user data
    value: any;                 // Required value
    operator?: 'equals' | 'includes' | 'greater_than' | 'less_than';
  };
  
  // Program linkage
  programIds?: string[];        // Specific program IDs (optional)
  programPatterns?: string[];  // Program name patterns (optional)
}
```

### **Step 3: Database Integration**

**Store program-specific documents in database:**
- Table: `requirements` (already exists)
- Category: `'documents'`
- Extract during scraping
- Merge with master templates

### **Step 4: Document Generation**

**Create document generator service:**
- Fill templates with user/program data
- Export to PDF/DOCX/XLSX
- Validate required fields
- Generate charts/graphs from data

---

## ✅ **CURRENT STATUS**

**Documents in System:**
- ✅ 3 Grant documents (work_plan_gantt, budget_breakdown, ethics_risk_assessment)
- ✅ 2 Loan documents (business_plan_bank, collateral_documentation)
- ✅ 2 Equity documents (pitch_deck, cap_table)
- ✅ 2 Visa documents (job_creation_plan, proof_of_funds)

**Total: 9 documents** (Need 25-30 more)

**Missing Documents:**
- ❌ 9 Grant documents
- ❌ 6 Loan documents
- ❌ 8 Equity documents
- ❌ 4 Visa documents

**Total Missing: 27 documents**

---

## 📝 **RECOMMENDATIONS**

### **1. Complete Master Templates (Priority)**
- Add all universal documents first
- Add common conditional documents
- Leave specialized documents for later

### **2. Conditional Logic System**
- Implement `conditionalOn` field
- Support program-specific rules
- Support user data conditions (e.g., company_age, consortium)

### **3. Database Integration**
- Continue scraping program-specific documents
- Store in `categorized_requirements.documents`
- Merge with master templates automatically

### **4. Document Generation (Future)**
- Build document generator service
- Fill templates with user data
- Export to required formats
- Validate completeness

---

## 🎯 **SUMMARY**

**Current System:**
- ✅ Good foundation with 9 documents
- ✅ Flexible merge system (program → master → bundle)
- ✅ Templates exist but generation not implemented

**What's Needed:**
- ❌ Add 27 more document templates
- ❌ Implement conditional logic
- ❌ Build document generator
- ❌ Enhance database integration

**Recommendation:**
- **Keep current hybrid approach** (program → master → bundle)
- **Add conditional logic** for program-specific variations
- **Complete master templates** for universal documents
- **Build document generator** to actually create documents

