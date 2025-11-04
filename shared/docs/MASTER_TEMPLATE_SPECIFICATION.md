# Master Template Specification & Building Process

## 📋 **TEMPLATE FORMAT REQUIRED**

### **File Format: TypeScript/JSON**

The master template must be structured as a `Record<string, SectionTemplate[]>` where:
- **Key**: Funding type (e.g., `'grants'`, `'bankLoans'`, `'equity'`, `'visa'`)
- **Value**: Array of `SectionTemplate` objects

### **SectionTemplate Interface**

```typescript
interface SectionTemplate {
  // Core identification
  id: string;                    // Unique identifier (e.g., 'executive_summary')
  title: string;                 // Display name (e.g., 'Executive Summary')
  description: string;           // Section description/purpose
  
  // Requirements
  required: boolean;              // Whether section is mandatory
  wordCountMin: number;          // Minimum word count (e.g., 200)
  wordCountMax: number;          // Maximum word count (e.g., 1000)
  order: number;                 // Display order (1, 2, 3, 4...) - CRITICAL for sorting
  
  // Categorization & Mapping
  category: string;              // Maps to requirement categories:
                                  // 'general', 'project', 'technical', 'financial', 
                                  // 'impact', 'consortium', 'market', 'team', etc.
  
  // AI Generation Prompts
  prompts: string[];             // Array of prompt questions to guide content generation
                                  // Example: [
                                  //   'Summarize your project in 2-3 sentences',
                                  //   'What problem does your project solve?',
                                  //   'What makes your approach innovative?'
                                  // ]
  
  // Validation Rules
  validationRules: {
    requiredFields: string[];     // Fields that must be present
                                  // Example: ['project_overview', 'innovation_aspect', 'expected_impact']
    formatRequirements: string[]; // Format/style requirements
                                  // Example: ['clear_problem_statement', 'solution_description']
  };
  
  // Optional: Source tracking
  source?: {
    verified: boolean;
    verifiedDate?: string;
    officialProgram?: string;
    sourceUrl?: string;
    version?: string;
  };
}
```

### **Complete Structure Example**

```typescript
export const MASTER_SECTIONS: Record<string, SectionTemplate[]> = {
  grants: [
    {
      id: 'executive_summary',
      title: 'Executive Summary',
      description: 'Brief overview of your project and funding request',
      required: true,
      wordCountMin: 200,
      wordCountMax: 500,
      order: 1,  // ← CRITICAL: Must be sequential (1, 2, 3, 4...)
      category: 'general',
      prompts: [
        'Summarize your project in 2-3 sentences',
        'What problem does your project solve?',
        'What makes your approach innovative?',
        'What impact do you expect to achieve?'
      ],
      validationRules: {
        requiredFields: ['project_overview', 'innovation_aspect', 'expected_impact'],
        formatRequirements: ['clear_problem_statement', 'solution_description']
      },
      source: {
        verified: true,
        verifiedDate: '2025-01-03',
        officialProgram: 'AWS Innovation Grant',
        sourceUrl: 'https://aws.at/...',
        version: '1.0'
      }
    },
    // ... more sections
  ],
  bankLoans: [ /* ... */ ],
  equity: [ /* ... */ ],
  visa: [ /* ... */ ]
};
```

---

## 🎯 **STEP 1: RECOMMENDED FUNDING TYPES & INSTITUTIONS**

### **Funding Types (Priority Order)**

Based on current system architecture and Austrian market:

1. **`grants`** - Government & EU grants (highest priority)
2. **`bankLoans`** - Traditional bank financing
3. **`equity`** - VC/Angel investment
4. **`visa`** - Business visa applications

### **Recommended Institutions (20+ Reference Structures)**

#### **A. GRANTS (8-10 templates)**

**Austrian Government:**
1. **AWS (Austria Wirtschaftsservice)** - Innovation grants, startup funding
   - Focus: Innovation, R&D, technology
   - Template priority: HIGH
   
2. **FFG (Forschungsförderungsgesellschaft)** - Research grants
   - Focus: Research, TRL levels, consortium projects
   - Template priority: HIGH
   
3. **WKO (Wirtschaftskammer Österreich)** - Business support grants
   - Focus: SME support, digitalization, export
   - Template priority: HIGH

**EU Programs:**
4. **EU Horizon Europe** - Research & innovation
   - Focus: International collaboration, impact, innovation
   - Template priority: HIGH
   
5. **EU EIC (European Innovation Council)** - Deep tech grants
   - Focus: Innovation, scalability, market impact
   - Template priority: MEDIUM

**Regional:**
6. **Vienna Business Agency** - Vienna-specific grants
7. **SFG (Styria Business Promotion)** - Styria regional grants
8. **TecNet / Lower Austria** - Regional innovation support

#### **B. BANK LOANS (4-5 templates)**

1. **Erste Bank** - Corporate loans, startup financing
2. **Raiffeisen Bank** - SME loans, business financing
3. **BAWAG** - Business loans, working capital
4. **Bank Austria** - Corporate banking, investment loans
5. **Hypo** - Regional banking, business loans

#### **C. EQUITY/VC (4-5 templates)**

1. **Sequoia Capital** - Global VC structure (gold standard)
2. **YCombinator** - Startup accelerator format
3. **Austrian Business Angel Network (ABAN)** - Austrian angel format
4. **Speedinvest** - Austrian VC format
5. **AWS Equity** - Austrian startup equity program

#### **D. VISA (2-3 templates)**

1. **Red-White-Red Card (RWR)** - Austrian startup visa
2. **EU Blue Card** - European tech worker visa
3. **Business Visa** - General business establishment visa

#### **E. SPECIALIZED (2-3 templates)**

1. **AMS (Arbeitsmarktservice)** - Employment/training grants
2. **EU ESF (European Social Fund)** - Social impact grants
3. **Energy/Environment Grants** - Climate/energy transition

---

## 🔨 **REVISED BUILDING PROCESS**

### **Step 1 — Collect Canonical Templates (20+ Reference Structures)**

**Objective:** Gather official templates from priority institutions

**Process:**
1. **For each institution** (starting with HIGH priority):
   - Download official application templates
   - Extract PDF/Word document structures
   - Note section names, order, required fields
   - Capture word count requirements
   - Document validation criteria

2. **Normalize section names:**
   - Map institution-specific names to canonical IDs
   - Example: "Executive Summary" → `executive_summary`
   - Example: "Projektbeschreibung" → `project_description`
   - Example: "Finanzplan" → `financial_plan`

3. **Priority Collection Order:**
   ```
   AWS → FFG → WKO → EU Horizon → Erste Bank → Raiffeisen 
   → BAWAG → Sequoia → YCombinator → ABAN → RWR Visa
   ```

**Output:** 20+ raw template documents with extracted structures

---

### **Step 2 — Extract Common Denominators (Semantic Clustering)**

**Objective:** Group similar sections under unified headings

**Process:**
1. **Create section clusters:**
   - Group all "Executive Summary" variants → `executive_summary`
   - Group all "Project Description" variants → `project_description`
   - Group all "Financial Plan" variants → `financial_plan`
   - Continue for all common sections

2. **Identify unique sections:**
   - Grant-specific: `consortium_partners`, `trl_level`, `impact_assessment`
   - Loan-specific: `financial_stability`, `repayment_plan`, `collateral`
   - Equity-specific: `revenue_model`, `traction`, `exit_strategy`
   - Visa-specific: `job_creation`, `business_concept`, `compliance`

3. **Map to categories:**
   - `general`: Executive summary, introduction
   - `project`: Project description, methodology
   - `technical`: Innovation, TRL, technology
   - `financial`: Budget, projections, costs
   - `impact`: Social, environmental, economic impact
   - `consortium`: Partners, collaboration
   - `market`: Market analysis, competition
   - `team`: Team, qualifications
   - `risk`: Risk assessment, mitigation

**Output:** 15-20 top-level sections with sub-variants mapped

---

### **Step 3 — Tag Differences (Relevance Scores)**

**Objective:** Tag each section with relevance per funding type

**Process:**
1. **Create relevance matrix:**
   ```
   Section ID          | grants | bankLoans | equity | visa
   --------------------|--------|-----------|--------|-------
   executive_summary   |  100%  |    100%   |  100%  | 100%
   consortium_partners |   90%  |     10%   |   20%  |   0%
   trl_level           |   95%  |      5%   |   30%  |   0%
   financial_stability |   40%  |    100%   |   60%  |  50%
   revenue_model       |   30%  |     20%   |  100%  |  30%
   ```

2. **Define word count ranges per type:**
   - Grants: Typically 200-1000 words per section
   - Bank Loans: 300-800 words (more concise)
   - Equity: 150-500 words (pitch-style)
   - Visa: 200-600 words (formal)

3. **Define required vs optional:**
   - Mark sections as `required: true` if present in 80%+ of templates
   - Mark as `required: false` if less common

**Output:** Tagged sections with funding type relevance scores

---

### **Step 4 — Define Hierarchy (15-20 Top-Level Sections)**

**Objective:** Create logical section order with 3-8 submodules each

**Recommended Hierarchy:**

```
1. Executive Summary (order: 1)
   - Project overview
   - Problem statement
   - Innovation aspect
   - Expected impact

2. Project Description (order: 2)
   - Detailed description
   - Technical approach
   - Methodology
   - Expected outcomes

3. Innovation & Technology (order: 3) [Grants/Equity]
   - TRL level
   - Innovation description
   - Research background
   - Technical risks

4. Impact Assessment (order: 4) [Grants]
   - Environmental impact
   - Job creation
   - Market impact
   - Success metrics

5. Consortium Partners (order: 5) [Grants]
   - Partner list
   - Role descriptions
   - Agreement status
   - Collaboration plan

6. Financial Plan (order: 6)
   - Budget breakdown
   - Funding request
   - Co-financing plan
   - Revenue projections

7. Market Analysis (order: 7) [Equity/Loans]
   - Market size
   - Competition
   - Target customers
   - Market entry

8. Team & Qualifications (order: 8)
   - Team members
   - Qualifications
   - Experience
   - Roles

9. Risk Assessment (order: 9)
   - Technical risks
   - Financial risks
   - Market risks
   - Mitigation strategies

10. Timeline & Milestones (order: 10)
    - Project timeline
    - Key milestones
    - Deliverables
    - Gantt chart

11. Financial Stability (order: 11) [Bank Loans]
    - Financial ratios
    - Cash flow analysis
    - Debt analysis
    - Credit history

12. Repayment Plan (order: 12) [Bank Loans]
    - Repayment schedule
    - Revenue projections
    - Contingency plan

13. Revenue Model (order: 13) [Equity]
    - Revenue streams
    - Pricing strategy
    - Unit economics
    - Scaling strategy

14. Traction & Metrics (order: 14) [Equity]
    - Current traction
    - Key metrics
    - Growth trajectory
    - Market validation

15. Exit Strategy (order: 15) [Equity]
    - Exit options
    - Valuation expectations
    - Timeline

16. Business Concept (order: 16) [Visa]
    - Business idea
    - Market opportunity
    - Business model

17. Job Creation Plan (order: 17) [Visa]
    - Jobs to create
    - Timeline
    - Qualifications needed

18. Compliance & Legal (order: 18) [Visa]
    - Legal structure
    - Compliance requirements
    - Regulatory approval
```

**Output:** Hierarchical structure with order numbers (1-18)

---

### **Step 5 — Create Modular Markdown/JSON Templates**

**Objective:** Each submodule gets structured prompt block

**Template Structure:**

```typescript
{
  id: 'executive_summary',
  title: 'Executive Summary',
  description: 'Brief overview of your project and funding request',
  required: true,
  wordCountMin: 200,
  wordCountMax: 500,
  order: 1,
  category: 'general',
  
  // Context for AI generation
  prompts: [
    'Summarize your project in 2-3 sentences',
    'What problem does your project solve?',
    'What makes your approach innovative?',
    'What impact do you expect to achieve?'
  ],
  
  // Validation checklist
  validationRules: {
    requiredFields: [
      'project_overview',      // Must mention project
      'innovation_aspect',     // Must mention innovation
      'expected_impact'         // Must mention impact
    ],
    formatRequirements: [
      'clear_problem_statement',  // Problem must be clear
      'solution_description'      // Solution must be described
    ]
  },
  
  // Optional: AI generation hints
  aiGuidance: [
    'Start with a compelling hook',
    'Include quantifiable metrics',
    'End with a clear call to action'
  ],
  
  // Optional: Example snippets
  examples: [
    'Our innovative AI platform addresses the critical need for...',
    'By leveraging cutting-edge technology, we solve...',
    'This project will create 50+ jobs and reduce CO2 by...'
  ]
}
```

**Output:** Complete JSON/TypeScript file with all sections

---

### **Step 6 — Test on 3-5 Real Programs**

**Objective:** Validate templates with real programs

**Process:**
1. **Select test programs:**
   - 1 Grant: AWS Innovation Grant
   - 1 Loan: Erste Bank Startup Loan
   - 1 Equity: Speedinvest Seed Round
   - 1 Visa: RWR Card
   - 1 EU: Horizon Europe

2. **Generate sections:**
   - Use template to generate sections for each program
   - Cross-check against official requirements
   - Validate section order matches expectations
   - Verify word counts are appropriate

3. **Automated validation:**
   - Check all required fields are present
   - Verify format requirements are met
   - Validate word counts are within ranges
   - Ensure sections are in correct order

4. **Manual review:**
   - Expert review of generated content
   - Compare with official templates
   - Identify missing sections
   - Adjust prompts/validation rules

**Output:** Validated master template ready for production

---

## 📝 **DELIVERABLE FORMAT**

**File:** `shared/lib/templates/sections.ts`

**Structure:**
```typescript
import { SectionTemplate } from './types';

export const MASTER_SECTIONS: Record<string, SectionTemplate[]> = {
  grants: [ /* 15-20 sections */ ],
  bankLoans: [ /* 10-15 sections */ ],
  equity: [ /* 12-18 sections */ ],
  visa: [ /* 8-12 sections */ ]
};
```

**Validation:**
- All sections have unique `id`
- All sections have `order` (1, 2, 3...)
- All sections have `category` mapped to requirement categories
- All sections have `prompts` array (3-5 prompts minimum)
- All sections have `validationRules` with `requiredFields` and `formatRequirements`
- Word counts are realistic (200-1000 for grants, 150-500 for equity, etc.)

---

## ✅ **CHECKLIST**

- [ ] Collect 20+ templates from priority institutions
- [ ] Normalize section names to canonical IDs
- [ ] Cluster sections into 15-20 top-level categories
- [ ] Tag sections with funding type relevance scores
- [ ] Define hierarchy with order numbers (1-18)
- [ ] Create structured JSON/TypeScript templates
- [ ] Test on 3-5 real programs
- [ ] Validate automated generation
- [ ] Export to `shared/lib/templates/sections.ts`

