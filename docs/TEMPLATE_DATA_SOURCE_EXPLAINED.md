# 📚 Template Data Source - Complete Explanation

**Date:** 2025-01-XX  
**Purpose:** Explain where template structure, content, and format come from

---

## 🎯 Quick Answer

**All templates are HARDCODED** - manually written in TypeScript files. They're not generated from databases or external sources.

---

## 📂 Template Data Sources

### 1. **Standard Sections** (The Base Template Content)

**Location:** `shared/lib/standardSectionTemplates.ts`

**What it is:**
- **Hardcoded array** of section definitions for each funding type
- Manually written with all content, prompts, and requirements
- 4 sets: `grants`, `bankLoans`, `equity`, `visa`

**What's inside each section:**
```typescript
{
  id: 'executive_summary',                    // ← Hardcoded ID
  title: 'Executive Summary',                  // ← Manual title
  description: 'Brief overview...',           // ← Manual description
  required: true,                              // ← Manual flag
  wordCountMin: 200,                           // ← Manual requirement
  wordCountMax: 500,                           // ← Manual requirement
  order: 1,                                    // ← Manual ordering
  category: 'general',                         // ← Manual category mapping
  prompts: [                                   // ← Manual prompts array
    'Summarize your project in 2-3 sentences',
    'What problem does your project solve?',
    'What makes your approach innovative?',
    'What impact do you expect to achieve?'
  ],
  validationRules: {                           // ← Manual validation rules
    requiredFields: ['project_overview', 'innovation_aspect', 'expected_impact'],
    formatRequirements: ['clear_problem_statement', 'solution_description']
  }
}
```

**Source:** All manually written by developers based on:
- Real funding program requirements
- Industry standards
- Best practices

**Function to get them:**
```typescript
getStandardSections('grants')  // Returns STANDARD_SECTIONS.grants array
```

---

### 2. **Product Section Templates** (Template Structure)

**Location:** `features/editor/templates/productSectionTemplates.ts`

**What it is:**
- Template structure for different product types (strategy, review, submission)
- Combined with funding types (grants, bankLoans, equity, visa)
- **ISSUE:** `sections` arrays are **EMPTY** (should be populated from `getStandardSections()`)

**Structure:**
```typescript
PRODUCT_SECTION_TEMPLATES = {
  submission: {
    grants: {
      productType: 'submission',
      fundingType: 'grants',
      sections: [],  // ❌ EMPTY - Should be: getStandardSections('grants')
      additionalDocuments: [...],  // ✅ Populated (hardcoded)
      workflow: [...]              // ✅ Populated (hardcoded)
    },
    // ... bankLoans, equity, visa
  },
  strategy: { ... },
  review: { ... }
}
```

**What's hardcoded:**
- ✅ `additionalDocuments` arrays (full content)
- ✅ `workflow` arrays (steps)
- ❌ `sections` arrays (empty - needs population)

---

### 3. **Additional Documents** (Document Templates)

**Location:** `features/editor/templates/additionalDocuments.ts`

**What it is:**
- **Hardcoded markdown templates** for additional documents
- Organized by funding type and product type
- Full content including templates, instructions, examples, common mistakes

**Example structure:**
```typescript
{
  id: 'work_plan_gantt',
  name: 'Work Plan & Gantt Chart',
  description: 'Timeline and milestones...',
  required: true,
  format: 'xlsx',
  maxSize: '10MB',
  template: `# Work Plan & Gantt Chart Template    // ← Hardcoded markdown
## Project Overview
- Project Title: [Project Name]
...`,  // Full markdown template
  instructions: [                               // ← Hardcoded array
    'Define clear work packages...',
    'Set realistic timelines...'
  ],
  examples: [                                   // ← Hardcoded array
    'Horizon Europe work plan example',
    'EIC Accelerator Gantt chart'
  ],
  commonMistakes: [                             // ← Hardcoded array
    'Unrealistic timelines...',
    'Vague work package descriptions...'
  ]
}
```

**Source:** All manually written markdown templates

---

### 4. **Category Converters** (How Database Requirements Enhance Templates)

**Location:** `features/editor/engine/categoryConverters.ts`

**What it does:**
- Takes hardcoded standard sections
- Enhances them with program-specific requirements from database
- Creates final editor sections

**Flow:**
```
1. Get hardcoded standard sections:
   standardSections = getStandardSections('grants')
   
2. Get program requirements from database:
   categorizedRequirements = { eligibility: [...], documents: [...], ... }
   
3. Enhance each standard section:
   - Add program-specific prompts
   - Add validation rules from requirements
   - Add requirement values to guidance
   
4. Return enhanced sections
```

**Example:**
```typescript
// Base template section (hardcoded)
{
  title: 'Project Description',
  prompts: ['Describe your project...']  // ← Generic
}

// Enhanced with database requirements
{
  title: 'Project Description',
  prompts: [
    'Describe your project...',
    'Consider: TRL 6-7 required',      // ← From database
    'Consider: Must include IP plan'    // ← From database
  ]
}
```

---

## 🔄 How It All Works Together

### When User Selects a Program:

```
1. User selects program → programId = "page_123"
   ↓
2. API call: /api/programmes/page_123/requirements
   ↓
3. Database returns: categorized_requirements
   {
     eligibility: [{ value: 'SME', required: true }],
     documents: [{ value: 'Financial Statement', format: 'PDF' }],
     trl_level: [{ value: 'TRL 6-7', required: true }],
     ...
   }
   ↓
4. CategoryConverter.convertToEditorSections()
   ↓
5. Get hardcoded standard sections: getStandardSections('grants')
   ↓
6. Enhance each section with database requirements
   - Add program-specific prompts
   - Add requirement values to guidance
   - Merge validation rules
   ↓
7. Return enhanced sections to editor
```

### When User Doesn't Select a Program:

```
1. User selects document type only (e.g., "Business Plan")
   ↓
2. No programId → no database requirements
   ↓
3. EditorEngine.loadSectionsFromTemplates('submission', 'grant')
   ↓
4. Get template: PRODUCT_SECTION_TEMPLATES.submission.grants
   ↓
5. PROBLEM: sections array is empty ❌
   ↓
6. Falls back to getDefaultSections() → only 2 sections
   ↓
7. Should instead use: getStandardSections('grants') → 11+ sections
```

---

## 📝 Summary: Where Everything Comes From

| Element | Source | Location | Status |
|---------|--------|----------|--------|
| **Section Structure** | Hardcoded TypeScript | `standardSectionTemplates.ts` | ✅ Complete |
| **Section Content** | Hardcoded arrays | `standardSectionTemplates.ts` | ✅ Complete |
| **Prompts** | Hardcoded arrays | `standardSectionTemplates.ts` | ✅ Complete |
| **Word Counts** | Hardcoded numbers | `standardSectionTemplates.ts` | ✅ Complete |
| **Validation Rules** | Hardcoded objects | `standardSectionTemplates.ts` | ✅ Complete |
| **Additional Documents** | Hardcoded markdown | `additionalDocuments.ts` | ✅ Complete |
| **Document Templates** | Hardcoded markdown strings | `additionalDocuments.ts` | ✅ Complete |
| **Instructions** | Hardcoded arrays | `additionalDocuments.ts` | ✅ Complete |
| **Examples** | Hardcoded arrays | `additionalDocuments.ts` | ✅ Complete |
| **Product Templates** | Hardcoded structure | `productSectionTemplates.ts` | ⚠️ Sections empty |
| **Program Enhancement** | Database requirements | `categoryConverters.ts` | ✅ Working |
| **Template Selection** | Hardcoded logic | `EditorEngine.ts` | ✅ Working |

---

## ⚠️ Current Issues

### Issue 1: Product Templates Have Empty Sections
**Problem:** `PRODUCT_SECTION_TEMPLATES` structure exists but `sections: []` is empty

**Fix Needed:**
```typescript
// Current (WRONG):
sections: []  // Empty!

// Should be:
sections: getStandardSections('grants')  // Populated!
```

### Issue 2: No Dynamic Template Generation
**Current:** All templates are manually written
**Future:** Could generate from:
- Real program analysis
- AI-generated content
- User feedback and improvements

### Issue 3: Templates Not Updated from Real Programs
**Current:** Templates are static, don't learn from scraped programs
**Future:** Could:
- Analyze common requirements across programs
- Auto-generate section variations
- Update prompts based on successful applications

---

## 🔍 How to Find/Edit Templates

### To Edit Section Content:
1. Open: `shared/lib/standardSectionTemplates.ts`
2. Find section (e.g., `executive_summary`)
3. Edit: `title`, `description`, `prompts`, `wordCountMin/Max`, etc.
4. Save and restart dev server

### To Edit Additional Documents:
1. Open: `features/editor/templates/additionalDocuments.ts`
2. Find document by funding type + product type
3. Edit: `template` (markdown), `instructions`, `examples`, etc.
4. Save and restart dev server

### To Fix Product Templates:
1. Open: `features/editor/templates/productSectionTemplates.ts`
2. Import: `import { getStandardSections } from '@/shared/lib/standardSectionTemplates';`
3. Replace empty arrays:
   ```typescript
   sections: getStandardSections('grants')
   ```

---

## 📄 Additional Documents - Detailed Source

### Where Additional Documents Come From:

**THREE different sources are merged:**

1. **Hardcoded Templates** (`ADDITIONAL_DOCUMENTS`)
   - **Location:** `features/editor/templates/additionalDocuments.ts`
   - **Source:** Originally GPT-generated, now hardcoded
   - **Content:** Full markdown templates with structure, instructions, examples
   - **Status:** ✅ Complete (8 document templates)
   - **Comment in code:** `// Based on GPT agent comprehensive instructions`

2. **Static Document Bundles** (`documentBundles`)
   - **Location:** `shared/data/documentBundles.ts`
   - **Source:** Hardcoded based on BASIS PACK
   - **Content:** Document ID mappings by product+funding type
   - **References:** `documentDescriptions.ts` for metadata
   - **Status:** ✅ Complete (all combinations)

3. **Program-Specific Documents** (Database)
   - **Location:** Database `requirements` table, category='documents'
   - **Source:** Extracted by scraper from program HTML pages
   - **Content:** Documents specific to each program
   - **Status:** ✅ Working (extracted from real programs)

### How They're Merged:

```
buildAdditionalDocuments() in pages/api/programmes/[id]/requirements.ts
  ↓
1. Get static bundle: getDocumentBundle(product, fundingType)
   → Returns document IDs from documentBundles.ts
   → Looks up details in documentDescriptions.ts
  ↓
2. Get program documents: categorizedRequirements.documents
   → From database requirements table
  ↓
3. Merge and dedupe by ID
  ↓
4. Return combined list
```

### Template Content Structure:

Each document in `ADDITIONAL_DOCUMENTS` has:
- **Full markdown template** with placeholders `[Project Name]`
- **Instructions** array (step-by-step creation guidance)
- **Examples** array (reference names like "Horizon Europe work plan example")
- **Common mistakes** array (pitfalls to avoid)
- **Format, maxSize, required** flags

**Example:**
```typescript
{
  id: 'work_plan_gantt',
  name: 'Work Plan & Gantt Chart',
  template: `# Work Plan & Gantt Chart Template
## Project Overview
- Project Title: [Project Name]
## Work Packages
| WP | Title | Description | ...`
  instructions: [
    'Define clear work packages...',
    'Set realistic timelines...'
  ],
  examples: ['Horizon Europe work plan example'],
  commonMistakes: ['Unrealistic timelines...']
}
```

**Note:** These templates are **NOT currently used** in the API response. The API uses `documentBundles` + database documents instead.

---

## ✅ Key Takeaways

1. **All templates are hardcoded** - manually written, not generated
2. **Standard sections** are the base content (11+ sections per funding type)
3. **Additional documents** have THREE sources:
   - Hardcoded templates (full markdown) - may not be used
   - Static bundles (document IDs) - actively used
   - Database documents (program-specific) - actively used
4. **Product templates** have structure but sections need population
5. **Database enhances** templates with program-specific requirements
6. **No automatic learning** - templates don't update from real programs
7. **Two parallel systems** for additional documents need integration

**To improve templates:**
- Edit hardcoded files directly
- Add new sections to `standardSectionTemplates.ts`
- Add new documents to `additionalDocuments.ts`
- Fix product template population
- Integrate `ADDITIONAL_DOCUMENTS` with API/editor

