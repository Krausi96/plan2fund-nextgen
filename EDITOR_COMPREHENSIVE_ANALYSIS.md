# Editor Comprehensive Analysis

**Date:** 2025-01-03  
**Purpose:** Complete investigation of editor system - chapters, templates, content structure, documents, and functionality

---

## 📋 **CHAPTER/SECTION DEFINITION SYSTEM**

### **1. Master Templates (Source of Truth)**

**Location:** `shared/lib/templates/sections.ts`

**Structure:**
- `MASTER_SECTIONS` object contains sections by funding type (`grants`, `bankLoans`, `equity`, `visa`)
- Each section has:
  - `id`: Unique identifier (e.g., `executive_summary`, `project_description`)
  - `title`: Display name (e.g., "Executive Summary")
  - `description`: Section description
  - `required`: Boolean (required vs optional)
  - `wordCountMin/Max`: Word count constraints
  - `order`: Display order
  - `category`: Category for requirement mapping (`general`, `project`, `technical`, `financial`, etc.)
  - `prompts`: Array of prompt questions to guide content
  - `validationRules`: Rules for validating content

**Example:**
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
  prompts: [
    'Summarize your project in 2-3 sentences',
    'What problem does your project solve?',
    'What makes your approach innovative?',
    'What impact do you expect to achieve?'
  ],
  validationRules: {
    requiredFields: ['project_overview', 'innovation_aspect', 'expected_impact'],
    formatRequirements: ['clear_problem_statement', 'solution_description']
  }
}
```

### **2. Template Hierarchy**

**Priority Order:**
1. **Program-specific sections** (from database via `/api/programmes/${id}/requirements`)
2. **Master templates** (`MASTER_SECTIONS[fundingType]`)
3. **Default fallback** (if no master templates)

**Flow:**
```
1. User selects program → programId
2. API call: /api/programmes/${programId}/requirements
3. API returns:
   - categorized_requirements (18 categories from DB)
   - editor sections (converted via categoryConverter)
4. categoryConverter.convertToEditorSections():
   - Gets standard sections from MASTER_SECTIONS
   - Enhances with program-specific requirements
   - Returns EditorSection[]
5. EditorEngine.loadSections():
   - Merges program sections with master templates
   - Returns UnifiedEditorSection[]
```

### **3. How Templates Serve**

**Location:** `features/editor/engine/categoryConverters.ts`

**Function:** `convertToEditorSections()`
- Takes `categorizedRequirements` (18 categories from DB) + `programType`
- Gets standard sections from `getStandardSections(programType)` → `MASTER_SECTIONS[programType]`
- For each standard section:
  - Maps section category to requirement category
  - Extracts relevant requirements
  - Enhances prompts with requirement values
  - Creates validation rules
  - Returns `EditorSection[]` with enhanced prompts

**Enhancement Process:**
```typescript
standardSection → enhanceStandardSectionWithRequirements() → EditorSection
```

---

## 📝 **QUESTIONS & ANSWERS STORAGE**

### **1. Where Answers Are Stored**

**Location:** `shared/lib/planStore.ts`

**Functions:**
- `saveUserAnswers(answers: Record<string, any>)` - Saves to localStorage key `pf_userAnswers`
- `loadUserAnswers(): Record<string, any>` - Loads from localStorage

**Format:**
```typescript
{
  location: 'austria',
  company_age: '0_2_years',
  team_size: '1_2_people',
  current_revenue: 'under_100k',
  industry_focus: 'tech',
  research_focus: 'yes',
  trl_level: '3',
  // ... other wizard answers
}
```

### **2. How Answers Are Used**

**In Editor (`Phase4Integration.tsx`):**
1. Loads answers: `loadUserAnswers()` from localStorage
2. Maps to prefill format: `mapWizardAnswersToPrefillFormat(userAnswers)`
3. Merges with prefill answers: `{ ...userAnswers, ...prefillAnswers }`
4. Generates content: `mapAnswersToSections(mergedAnswers, program)`
5. Prefills sections with generated content

**Mapping:**
- Wizard format → Prefill format via `mapWizardAnswersToPrefillFormat()`
- Prefill format → Section content via `mapAnswersToSections()`

---

## 📄 **ADDITIONAL DOCUMENTS SYSTEM**

### **1. Document Templates**

**Location:** `shared/lib/templates/documents.ts`

**Structure:**
- `MASTER_DOCUMENTS` object contains documents by funding type and product
- Each document has:
  - `id`: Unique identifier
  - `name`: Display name
  - `description`: Document description
  - `required`: Boolean
  - `format`: File format (`pdf`, `xlsx`, `docx`, etc.)
  - `template`: Markdown template with placeholders
  - `instructions`: Array of instructions
  - `examples`: Array of examples
  - `commonMistakes`: Array of common mistakes

**Example Documents:**
- Work Plan & Gantt Chart
- Financial Projections Spreadsheet
- Team CVs & Qualifications
- Consortium Agreement
- Risk Management Plan
- Job Creation Plan
- etc.

### **2. How Documents Are Created**

**Flow:**
1. API endpoint: `/api/programmes/${id}/requirements`
2. Returns `additionalDocuments` array
3. Documents come from:
   - **Unified system:** `getDocuments(programType, 'submission', programId, baseUrl)`
   - **Legacy:** `buildAdditionalDocuments(programData, categorizedRequirements)`
4. Merged and deduplicated by ID
5. Returned to editor for display

**Document Sources:**
- **Program-specific:** Loaded from database if available
- **Master templates:** From `MASTER_DOCUMENTS[fundingType][productType]`
- **Legacy:** Built from categorized requirements

**Document Creation (Not Yet Implemented):**
- Documents are **defined** but not **generated** yet
- Templates exist but no generation logic
- User must manually create documents using templates as guides

---

## 🏗️ **CONTENT STRUCTURE**

### **1. PlanDocument Structure**

**Type:** `shared/types/plan.ts`

```typescript
type PlanDocument = {
  id: string;
  ownerId: string;
  product: 'strategy' | 'review' | 'submission';
  route: 'grant' | 'loan' | 'equity' | 'visa';
  programId?: string;
  language: 'de' | 'en';
  tone: 'neutral' | 'formal' | 'concise';
  targetLength: 'short' | 'standard' | 'extended';
  settings: {
    includeTitlePage: boolean;
    includePageNumbers: boolean;
    citations: 'none' | 'simple';
    captions: boolean;
    graphs: { revenueCosts?: boolean; cashflow?: boolean; useOfFunds?: boolean };
    titlePage?: { title?: string; subtitle?: string; author?: string; date?: string };
  };
  sections: PlanSection[];
  unitEconomics?: { price?: number; unitCost?: number; ... };
  milestones?: Array<{ label: string; date?: string; metric?: string }>;
  readiness?: { score: number; dimensions: Array<...> };
  attachments?: Array<{ type: string; url?: string }>;
  onePager?: { html?: string; pdfUrl?: string };
  addonPack?: boolean;
  versions?: Array<{ id: string; createdAt: string; note?: string }>;
};
```

### **2. PlanSection Structure**

```typescript
type PlanSection = {
  key: string;                    // Unique identifier (section.id)
  title: string;                  // Display title
  content: string;                // Rich text content (HTML/MD)
  fields?: Record<string, any>;   // Structured inputs (TAM/SAM/SOM)
  tables?: {
    revenue?: Table;
    costs?: Table;
    cashflow?: Table;
    useOfFunds?: Table;
  };
  figures?: FigureRef[];          // Chart references
  sources?: Array<{ title: string; url: string }>;
  status?: 'aligned' | 'needs_fix' | 'missing';
  wordCount?: number;
  required?: boolean;
  order?: number;
};
```

---

## 🤖 **AI INTEGRATION**

### **1. OpenAI API**

**Location:** `pages/api/ai/openai.ts`

**Endpoints:**
- `POST /api/ai/openai`
- Actions: `generate`, `improve`, `compliance`, `suggest`

**Current Status:**
- ✅ API endpoint exists
- ✅ Handles test mode (mock responses)
- ✅ Real OpenAI integration ready (needs API key)
- ❌ **NOT CONNECTED** to `EnhancedAIChat` component

### **2. AIHelper**

**Location:** `features/editor/engine/aiHelper.ts`

**Current Status:**
- ✅ `generateSectionContent()` method exists
- ❌ **MOCK IMPLEMENTATION** - `callAI()` returns mock response
- ❌ **NOT CONNECTED** to OpenAI API

**Mock Implementation:**
```typescript
private async callAI(prompt: string): Promise<{ content: string; ... }> {
  return {
    content: `This is a sample response for the prompt: ${prompt.substring(0, 100)}...`,
    suggestions: ['Add more specific examples', 'Include financial projections'],
    citations: ['Program guidelines', 'Best practices']
  };
}
```

### **3. EnhancedAIChat Component**

**Location:** `features/editor/components/EnhancedAIChat.tsx`

**Current Status:**
- ✅ Component exists
- ✅ Uses `AIHelper` class
- ❌ **AIHelper uses mock** - not real OpenAI
- ✅ Rendered in `Phase4Integration` (line 1215)

**Integration:**
- Component calls `aiHelper.generateSectionContent()`
- But `AIHelper.callAI()` is mock, so no real AI responses

---

## ✅ **FUNCTIONALITY STATUS**

### **Working:**
1. ✅ **Entry Points** - `EntryPointsManager` works
2. ✅ **Section Loading** - Sections load from templates/API
3. ✅ **Content Prefill** - Wizard answers → prefill → content
4. ✅ **AI Content Generation** - Uses AIHelper (but mock)
5. ✅ **Rich Text Editor** - User can write content
6. ✅ **Document Customization** - Settings panel works
7. ✅ **Preview** - Preview button navigates to `/preview`
8. ✅ **Requirements Checker** - Shows progress (line 1024)
9. ✅ **EnhancedAIChat** - Rendered (line 1215) but uses mock AI

### **Not Working / Issues:**
1. ❌ **Real OpenAI Integration** - `AIHelper.callAI()` is mock
2. ❌ **Additional Document Generation** - Templates exist but no generation
3. ❌ **AIHelper → OpenAI API** - Not connected
4. ⚠️ **Requirements Checker** - May not be fully functional
5. ⚠️ **EnhancedAIChat** - Uses mock AI, not real OpenAI

---

## 🔧 **WHAT NEEDS TO BE FIXED**

### **Priority 1: Connect OpenAI API to AIHelper**

**Current:** `AIHelper.callAI()` returns mock response  
**Needed:** Call `/api/ai/openai` endpoint

**Fix:**
```typescript
// In aiHelper.ts
private async callAI(prompt: string): Promise<{ content: string; ... }> {
  try {
    const response = await fetch('/api/ai/openai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: prompt,
        context: {
          sectionId: this.config.sectionScope,
          sectionTitle: this.config.sectionScope,
          currentContent: '',
          programType: 'grant',
          sectionGuidance: [],
          hints: []
        },
        action: 'generate'
      })
    });
    
    if (!response.ok) throw new Error('API call failed');
    return await response.json();
  } catch (error) {
    console.error('OpenAI API error:', error);
    // Fallback to mock
    return { content: '...', suggestions: [], citations: [] };
  }
}
```

### **Priority 2: Ensure No UI Interference**

**Current:** Components are rendered but may not be fully functional  
**Needed:** Verify all components work without breaking UI

**Check:**
- ✅ `EnhancedAIChat` - Rendered as floating button (line 1215)
- ✅ `RequirementsChecker` - Rendered in section (line 1024)
- ✅ `EntryPointsManager` - Rendered when no plan (line 576, 1250)
- ✅ `DocumentCustomizationPanel` - Hidden by default, toggleable

**Status:** UI components are properly integrated, no interference expected

### **Priority 3: Additional Document Generation**

**Current:** Templates exist but no generation logic  
**Needed:** Document generation from templates

**Approach:**
- Create document generator service
- Use templates from `MASTER_DOCUMENTS`
- Fill placeholders with user/program data
- Export to PDF/XLSX/DOCX

---

## 📊 **SUMMARY**

### **Chapter Definition:**
- ✅ **Source:** `MASTER_SECTIONS` in `shared/lib/templates/sections.ts`
- ✅ **Enhancement:** Via `categoryConverters` with program requirements
- ✅ **Loading:** Via `EditorEngine.loadSections()` → `EditorDataProvider.getProduct()`

### **Templates:**
- ✅ **Master templates:** `MASTER_SECTIONS` and `MASTER_DOCUMENTS`
- ✅ **Program-specific:** Merged from database requirements
- ✅ **Hierarchy:** Program-specific → Master → Default

### **Questions/Answers:**
- ✅ **Storage:** localStorage via `planStore.ts`
- ✅ **Format:** Wizard format (`location`, `company_age`, etc.)
- ✅ **Usage:** Mapped to prefill format, then to section content

### **Additional Documents:**
- ✅ **Templates:** Defined in `MASTER_DOCUMENTS`
- ✅ **API:** Returned from `/api/programmes/${id}/requirements`
- ❌ **Generation:** Not implemented yet

### **Content Structure:**
- ✅ **PlanDocument:** Well-defined type
- ✅ **PlanSection:** Supports rich content, tables, figures, sources
- ✅ **Status tracking:** `aligned`, `needs_fix`, `missing`

### **AI Integration:**
- ✅ **OpenAI API:** Endpoint exists and works
- ✅ **AIHelper:** Class exists
- ❌ **Connection:** AIHelper → OpenAI API not connected (uses mock)
- ✅ **EnhancedAIChat:** Component exists and rendered

### **Functionality:**
- ✅ **Editor works:** User can write, customize, preview
- ✅ **Prefill works:** Wizard answers → content
- ⚠️ **AI works but mock:** Needs real OpenAI connection
- ❌ **Document generation:** Not implemented

---

## 🎯 **NEXT STEPS**

1. **Connect OpenAI API to AIHelper** (replace mock with real API call)
2. **Verify Requirements Checker** functionality
3. **Test EnhancedAIChat** with real OpenAI
4. **Implement Additional Document Generation** (future)
5. **Test all entry paths** (wizard → editor, direct editor, etc.)

---

**Status:** Editor structure is solid, main gap is OpenAI API connection

