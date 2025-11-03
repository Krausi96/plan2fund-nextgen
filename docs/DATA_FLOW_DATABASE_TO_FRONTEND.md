# 📊 Complete Data Flow: Database → Frontend Components

**Purpose:** Document the complete data pipeline from scraper database to frontend UI components for frontend wiring work.

---

## 🗄️ Data Source: Database (Your Side - Already Done)

### Database Schema (NEON PostgreSQL)

**Tables:**
1. **`pages`** - Scraped program pages (1,024+ pages)
   - `id`, `url`, `title`, `description`
   - `funding_amount_min`, `funding_amount_max`, `currency`
   - `deadline`, `open_deadline`
   - `contact_email`, `contact_phone`
   - `region`, `funding_types[]`, `program_focus[]`
   - `metadata_json` (JSONB - contains: geography, industries, tech_focus, topics, etc.)
   - `fetched_at`

2. **`requirements`** - Extracted requirements (21,220+ requirements)
   - `page_id` (FK → pages.id)
   - `category` (18 categories: eligibility, financial, documents, etc.)
   - `type`, `value` (TEXT, may be JSON)
   - `required`, `source`, `description`, `format`
   - `requirements` (JSONB - nested requirements)
   - `meaningfulness_score` (0-100)

**Database Connection:**
- File: `scraper-lite/src/db/neon-client.ts`
- Uses `DATABASE_URL` from `.env.local`

---

## 🔌 API Layer (Your Side - Already Done)

### API Endpoint 1: `/api/programs`

**File:** `pages/api/programs.ts`

**Flow:**
```
Frontend Component
  ↓ fetch('/api/programs?enhanced=true')
  ↓
pages/api/programs.ts
  ↓ Query: getAllPages() or searchPages()
  ↓ Query: SELECT * FROM requirements WHERE page_id = ?
  ↓ Transform: Build categorized_requirements from requirements
  ↓ Transform: Build eligibility_criteria for backward compatibility
  ↓
JSON Response: { programs: [...], count: N, source: 'database' }
```

**Query Parameters:**
- `?type=loan` - Filter by funding type
- `?enhanced=true` - Include completeness scores and freshness

**Response Format:**
```typescript
{
  success: true,
  programs: [
    {
      id: "page_123",
      name: "Program Title",
      type: "grant",
      description: "...",
      funding_amount_min: 10000,
      funding_amount_max: 100000,
      currency: "EUR",
      deadline: "31.12.2025",
      open_deadline: false,
      contact_email: "contact@example.com",
      contact_phone: "+43 123 456",
      source_url: "https://...",
      region: "Austria",
      funding_types: ["grant"],
      program_focus: ["innovation", "sustainability"],
      
      // CRITICAL: Requirements data (18 categories)
      categorized_requirements: {
        eligibility: [{ type: "company_type", value: "SME", required: true, ... }],
        financial: [{ type: "revenue_range", value: { min: 0, max: 50000 }, ... }],
        documents: [{ type: "document", value: "Business Plan", format: "PDF", ... }],
        geographic: [{ type: "location", value: "Austria", ... }],
        // ... 14 more categories
      },
      
      // Backward compatibility
      eligibility_criteria: {
        location: "Austria",
        max_company_age: 10,
        // ... derived from categorized_requirements
      },
      
      // Enhanced fields (if ?enhanced=true)
      completenessScore: 85,
      fresh: true,
      
      // Application metadata (from metadata_json)
      application_method: "online_form",
      requires_account: false,
      form_fields: [...]
    }
  ],
  count: 1024,
  source: "database",
  timestamp: "2025-01-03T..."
}
```

---

### API Endpoint 2: `/api/programmes/[id]/requirements`

**File:** `pages/api/programmes/[id]/requirements.ts`

**Flow:**
```
Frontend Component
  ↓ fetch(`/api/programmes/${programId}/requirements`)
  ↓
pages/api/programmes/[id]/requirements.ts
  ↓ Extract page_id from programId (format: "page_123" → 123)
  ↓ Query: SELECT * FROM pages WHERE id = ?
  ↓ Query: SELECT * FROM requirements WHERE page_id = ?
  ↓ Transform: Build categorized_requirements
  ↓ Generate: Decision tree questions (via QuestionEngine)
  ↓ Generate: Editor sections (via categoryConverter)
  ↓ Generate: Library format
  ↓ Get: Unified documents (master + program-specific)
  ↓
JSON Response: { decision_tree: [...], editor: [...], library: [...] }
```

**Response Format:**
```typescript
{
  program_id: "page_123",
  program_name: "Program Title",
  program_type: "grant",
  data_source: "database",
  
  // Decision Tree (for SmartWizard)
  decision_tree: [
    {
      id: "q1",
      question_text: "What is your company type?",
      answer_options: ["SME", "Startup", "Large Company"],
      category: "eligibility",
      // ...
    }
  ],
  
  // Editor Sections (for Editor/AI Chat)
  editor: [
    {
      section_name: "Project Description",
      prompt: "Describe your project...",
      hints: [...],
      word_count_min: 200,
      word_count_max: 1000,
      // ...
    }
  ],
  
  // Library Format (for Program Details)
  library: [
    {
      id: "library_1",
      eligibility_text: "Program description...",
      documents: ["Business Plan", "Financial Statement"],
      funding_amount: "10,000 - 100,000 EUR",
      deadlines: ["31.12.2025"],
      application_procedures: [...],
      compliance_requirements: [...],
      contact_info: {
        email: "contact@example.com",
        phone: "+43 123 456"
      }
    }
  ],
  
  // Additional Documents (from unified system)
  additionalDocuments: [
    {
      id: "business_plan",
      title: "Business Plan",
      description: "...",
      format: "PDF",
      source: "program" | "master"
    }
  ]
}
```

---

### API Endpoint 3: `/api/programs-ai`

**File:** `pages/api/programs-ai.ts`

**Flow:**
```
Frontend Component
  ↓ fetch(`/api/programs-ai?action=questions&programId=page_123`)
  ↓
pages/api/programs-ai.ts
  ↓ Query: pages + requirements tables
  ↓ Transform: categorized_requirements
  ↓ Generate: AI content (questions, sections, criteria, guidance)
  ↓
JSON Response: { questions: [...] | sections: [...] | ... }
```

**Actions:**
- `?action=questions&programId=page_123` - Decision tree questions
- `?action=sections&programId=page_123` - Editor sections
- `?action=criteria&programId=page_123` - Readiness criteria
- `?action=guidance&programId=page_123` - AI guidance

---

## 🎨 Frontend Components (Colleague's Side - To Wire)

### Component 1: SmartWizard / QuestionEngine

**Purpose:** Interactive questionnaire to filter programs

**Data Needs:**
- All programs with `categorized_requirements`
- For question generation and program filtering

**API Call:**
```typescript
const response = await fetch('/api/programs?enhanced=true');
const { programs } = await response.json();

// Use programs
const questionEngine = new QuestionEngine(programs);
const questions = questionEngine.getCoreQuestions();
```

**Files:**
- `features/reco/components/wizard/SmartWizard.tsx`
- `features/reco/engine/questionEngine.ts`

**Status:** ✅ Already wired (uses `/api/programs`)

---

### Component 2: AdvancedSearch / Enhanced Reco Engine

**Purpose:** Search and filter programs by criteria

**Data Needs:**
- All programs with metadata and requirements
- For scoring and matching

**API Call:**
```typescript
const response = await fetch('/api/programs?enhanced=true');
const { programs } = await response.json();

// Score programs
const scored = scoreProgramsEnhanced(userAnswers, programs);
```

**Files:**
- `features/reco/components/AdvancedSearchDoctor.tsx`
- `features/reco/engine/enhancedRecoEngine.ts`

**Status:** ✅ Already wired (uses `/api/programs`)

---

### Component 3: ProgramSelector

**Purpose:** Display and select from program list

**Data Needs:**
- All programs with basic metadata

**API Call:**
```typescript
const response = await fetch('/api/programs?enhanced=true');
const { programs } = await response.json();
```

**Files:**
- Various program list components

**Status:** ✅ Already wired (uses `/api/programs`)

---

### Component 4: Library / Program Details

**Purpose:** Display detailed program information

**Data Needs:**
- Single program with all requirements
- Library format (eligibility, documents, deadlines, etc.)

**API Call:**
```typescript
const response = await fetch(`/api/programmes/${programId}/requirements`);
const { library, additionalDocuments } = await response.json();
```

**Files:**
- `pages/library.tsx`
- `pages/preview.tsx`
- `pages/export.tsx`

**Status:** ✅ Already wired (uses `/api/programmes/[id]/requirements`)

---

### Component 5: Editor / AI Chat

**Purpose:** Document editor with AI assistance

**Data Needs:**
- Program requirements in editor format
- Sections, prompts, templates

**API Call:**
```typescript
// Via EditorDataProvider
const response = await fetch(`/api/programmes/${programId}/requirements`);
const { editor, additionalDocuments } = await response.json();
```

**Files:**
- `features/editor/engine/EditorDataProvider.ts`
- `features/editor/components/EnhancedAIChat.tsx`

**Status:** ✅ Already wired (uses `/api/programmes/[id]/requirements`)

---

### Component 6: RequirementsChecker / Editor Validation

**Purpose:** Validate user input against program requirements

**Data Needs:**
- Program requirements (18 categories)
- For compliance checking

**API Call:**
```typescript
const response = await fetch('/api/programs?enhanced=true');
const { programs } = await response.json();
const program = programs.find(p => p.id === programId);

// Check requirements
checkRequirements(userData, program.categorized_requirements);
```

**Files:**
- `features/editor/engine/EditorValidation.ts`
- `features/editor/engine/RequirementsChecker.ts`

**Status:** ✅ Already wired (uses `/api/programs`)

---

### Component 7: Doctor Diagnostic

**Purpose:** Analyze program fit and provide recommendations

**Data Needs:**
- Program requirements for analysis

**API Call:**
```typescript
const response = await fetch(`/api/programmes/${program.id}/requirements`);
const { decision_tree, editor, library } = await response.json();
```

**Files:**
- `features/editor/engine/doctorDiagnostic.ts`

**Status:** ✅ Already wired (uses `/api/programmes/[id]/requirements`)

---

## 📋 Complete Data Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│  DATABASE (Your Side - Done)                            │
│  ├─ pages (1,024+ programs)                            │
│  └─ requirements (21,220+ requirements)                │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  API LAYER (Your Side - Done)                           │
│  ├─ /api/programs                                       │
│  │  └─ Returns: programs[] with categorized_requirements│
│  ├─ /api/programmes/[id]/requirements                  │
│  │  └─ Returns: decision_tree, editor, library         │
│  └─ /api/programs-ai                                    │
│     └─ Returns: AI-generated content                    │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  FRONTEND COMPONENTS (Colleague's Side - To Wire)       │
│  ├─ SmartWizard         → /api/programs                 │
│  ├─ AdvancedSearch     → /api/programs                 │
│  ├─ ProgramSelector    → /api/programs                 │
│  ├─ Library            → /api/programmes/[id]/requirements│
│  ├─ Editor             → /api/programmes/[id]/requirements│
│  ├─ RequirementsChecker → /api/programs                 │
│  └─ Doctor             → /api/programmes/[id]/requirements│
└─────────────────────────────────────────────────────────┘
```

---

## 🔍 Key Data Structures

### categorized_requirements (18 Categories)

```typescript
type CategorizedRequirements = {
  eligibility: RequirementItem[];
  financial: RequirementItem[];
  documents: RequirementItem[];
  technical: RequirementItem[];
  legal: RequirementItem[];
  timeline: RequirementItem[];
  geographic: RequirementItem[];
  team: RequirementItem[];
  project: RequirementItem[];
  compliance: RequirementItem[];
  impact: RequirementItem[];
  capex_opex: RequirementItem[];
  use_of_funds: RequirementItem[];
  revenue_model: RequirementItem[];
  market_size: RequirementItem[];
  co_financing: RequirementItem[];
  trl_level: RequirementItem[];
  consortium: RequirementItem[];
};

type RequirementItem = {
  type: string;
  value: string | number | object; // May be JSON string or object
  required: boolean;
  source: string;
  description?: string;
  format?: string; // For documents
  requirements?: string[]; // Nested requirements
  meaningfulness_score?: number; // 0-100
};
```

---

## ✅ Current Wiring Status

| Component | API Endpoint | Status | Notes |
|-----------|-------------|--------|-------|
| SmartWizard | `/api/programs?enhanced=true` | ✅ Working | |
| AdvancedSearch | `/api/programs?enhanced=true` | ✅ Working | |
| ProgramSelector | `/api/programs?enhanced=true` | ✅ Working | |
| Library | `/api/programmes/[id]/requirements` | ✅ Working | |
| Editor | `/api/programmes/[id]/requirements` | ✅ Working | |
| RequirementsChecker | `/api/programs?enhanced=true` | ✅ Working | |
| Doctor | `/api/programmes/[id]/requirements` | ✅ Working | |

**All components are already wired and using database!**

---

## 🧪 Testing Endpoints

### Test 1: Get All Programs
```bash
curl http://localhost:3000/api/programs?enhanced=true
```

### Test 2: Get Program Requirements
```bash
curl http://localhost:3000/api/programmes/page_1/requirements
```

### Test 3: Get AI Content
```bash
curl http://localhost:3000/api/programs-ai?action=questions&programId=page_1
```

---

## 📝 Notes for Frontend Work

1. **Program ID Format:** Always use `page_123` format (not just `123`)
2. **Data Freshness:** Check `program.fresh` and `program.scrapedAt`
3. **Completeness:** Use `program.completenessScore` (0-100)
4. **Requirements:** Always check `categorized_requirements` (18 categories)
5. **Metadata:** Check `program.metadata_json` for geography, industries, tech_focus, topics
6. **Application Info:** Use `program.application_method`, `program.requires_account`, `program.form_fields`

---

## 🚀 Next Steps for Colleague

1. ✅ **Verify API endpoints work** - Test all 3 endpoints
2. ✅ **Check data format** - Confirm programs have `categorized_requirements`
3. ✅ **Update components if needed** - Ensure components handle database format
4. ✅ **Test end-to-end** - Select program → View details → Use editor → Validate

**All wiring is complete - ready for frontend integration!**

