# 🔄 Data Flow & Connections - How Templates Get Data

**Date:** 2025-01-XX  
**Purpose:** Trace how templates and additional documents are connected and where data comes from

---

## 🎯 The Big Picture

### Two Separate Systems:

1. **Sections (Templates)** → Main business plan content
2. **Additional Documents** → Supplementary files

---

## 📝 SECTIONS DATA FLOW

### How Sections Get Data:

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: User selects program or template                     │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: Editor calls EditorEngine.loadSections(productId)  │
│   Location: features/editor/engine/EditorEngine.ts          │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 3A: If programId exists                                │
│   → EditorDataProvider.getProduct(programId)                 │
│   → API: /api/programmes/[id]/requirements                  │
│   → Returns: categorized_requirements from database          │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 3B: CategoryConverter.convertToEditorSections()       │
│   Location: features/editor/engine/categoryConverters.ts    │
│                                                              │
│   1. Get STANDARD_SECTIONS for program type                 │
│      → shared/lib/standardSectionTemplates.ts               │
│      → Returns: Hardcoded StandardSection[]                  │
│                                                              │
│   2. For each standard section:                              │
│      → enhanceStandardSectionWithRequirements()              │
│      → Maps section.category to requirement categories       │
│      → Merges standard prompts + program requirements        │
│                                                              │
│   Example:                                                   │
│   - Standard: prompts: ['Summarize your project...']         │
│   - Program:  eligibility: [{value: 'SME', required: true}]│
│   - Result: prompts: ['Summarize...', 'Consider: SME']      │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 4: Return EditorSection[] to Phase4Integration         │
│   Structure:                                                 │
│   {                                                          │
│     id: 'executive_summary',                                 │
│     section_name: 'Executive Summary',                      │
│     prompt: 'Summarize... Consider: SME',                    │
│     guidance: 'Brief overview...',                          │
│     hints: ['Include...', 'Mention...'],                    │
│     word_count_min: 200,                                     │
│     word_count_max: 500                                      │
│   }                                                          │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 5: User writes content in RichTextEditor                │
│   - Content saved to localStorage (planStore)                 │
│   - User can use AI assistant to generate/improve             │
│   - AI calls /api/ai/openai with prompts + context           │
└─────────────────────────────────────────────────────────────┘
```

### Where Data Comes From:

1. **Standard Sections (Base Templates):**
   - **Source:** `shared/lib/standardSectionTemplates.ts`
   - **Type:** Hardcoded TypeScript objects
   - **Content:**
     - Section IDs, titles, descriptions
     - Prompts arrays (AI guidance questions)
     - Word count requirements
     - Validation rules
     - Category mappings

2. **Program-Specific Requirements (Enhancement):**
   - **Source:** Database `pages` + `requirements` tables
   - **Flow:** API `/api/programmes/[id]/requirements`
   - **Content:**
     - `categorized_requirements` (18 categories)
     - Eligibility, documents, financial, technical, etc.
   - **Merged with:** Standard sections via `categoryConverters`

3. **User Content (What They Write):**
   - **Source:** User types in editor
   - **Storage:** localStorage (`planStore`)
   - **AI Enhancement:** Optional via `/api/ai/openai`

### How Content is Generated/Structured:

**Initial State:**
- Sections load with **empty content**
- Prompts/guidance come from `STANDARD_SECTIONS`
- User starts writing from scratch

**AI Assistance (Optional):**
- User can ask AI to generate content
- API `/api/ai/openai` uses:
  - Section prompts as context
  - Program requirements
  - User's existing content
- Returns generated text

**Structure:**
- Sections have fixed IDs (e.g., `executive_summary`)
- Content is plain text (stored in editor state)
- Formatting applied on export (PDF/DOCX)

---

## 📄 ADDITIONAL DOCUMENTS DATA FLOW

### How Additional Documents Get Data:

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: User goes to preview/export page                     │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: loadAdditionalDocuments() called                    │
│   Location: pages/preview.tsx or pages/export.tsx           │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 3A: Get static document bundle                         │
│   → getDocumentBundle(product, route)                         │
│   → shared/data/documentBundles.ts                           │
│   → Returns: ['workPlanGantt', 'budgetSheet', ...]          │
│                                                              │
│   → For each doc ID: getDocumentById(docId)                  │
│   → shared/data/documentDescriptions.ts                      │
│   → Returns: {title, short, formatHints}                    │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 3B: Get program-specific documents (if programId)      │
│   → API: /api/programmes/[id]/requirements                  │
│   → buildAdditionalDocuments() in API                        │
│   → Merges: static bundle + database documents               │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 4: Display list in UI                                  │
│   - Shows: title, description, format                        │
│   - Checkboxes to select for export                          │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 5: Export (CURRENT - STUB PDFs)                        │
│   → pages/export.tsx: generateSimplePdf()                    │
│   → Creates PDF with:                                        │
│     - <h1>${doc.title}</h1>                                  │
│     - <p>${doc.description}</p>                             │
│     - "Generated from your plan selection."                  │
│                                                              │
│   ❌ NOT USING ADDITIONAL_DOCUMENTS templates!              │
└─────────────────────────────────────────────────────────────┘
```

### Where Data Comes From:

1. **Static Document Bundles:**
   - **Source:** `shared/data/documentBundles.ts`
   - **Type:** Hardcoded mappings
   - **Content:** Document IDs by product+funding type
   - **Example:**
     ```typescript
     submission + grants → ['workPlanGantt', 'budgetSheet', ...]
     ```

2. **Document Metadata:**
   - **Source:** `shared/data/documentDescriptions.ts`
   - **Type:** Hardcoded objects
   - **Content:**
     - Title, short description
     - Format hints (PDF/Excel)
     - Category, funding types

3. **Program-Specific Documents:**
   - **Source:** Database `requirements` table, category='documents'
   - **Content:** Document names extracted by scraper
   - **Merged with:** Static bundles in API

4. **Templates (UNUSED):**
   - **Source:** `features/editor/templates/additionalDocuments.ts`
   - **Type:** Hardcoded markdown templates
   - **Content:**
     - Full markdown structure
     - Instructions arrays
     - Examples arrays
     - Common mistakes
   - **Status:** ❌ Never accessed, never used

### How Content is Generated/Structured:

**Currently:**
- Documents are **just listed** (title + description)
- Export creates **stub PDFs** (no real content)
- Templates exist but **not connected**

**If Templates Were Used:**
- `ADDITIONAL_DOCUMENTS` has full markdown templates
- Would need to populate with user data from sections
- Would generate real documents (Work Plan, Budget, etc.)

---

## 🔗 The Missing Connections

### What's Connected:
✅ **Sections:**
- Standard sections → Database requirements → Editor sections
- User content → localStorage → Export PDF

✅ **Additional Documents (Listing):**
- Document bundles → Document descriptions → Preview/Export UI

### What's NOT Connected:
❌ **Additional Documents (Templates):**
- `ADDITIONAL_DOCUMENTS` templates exist but never loaded
- Export creates stubs instead of using templates
- No way to populate templates with user data

---

## 📊 Data Structure Reference

### StandardSection (Input):
```typescript
{
  id: 'executive_summary',
  title: 'Executive Summary',
  description: 'Brief overview...',
  prompts: ['Summarize...', 'What problem...'],
  wordCountMin: 200,
  wordCountMax: 500,
  category: 'general'
}
```

### EditorSection (Output):
```typescript
{
  id: 'executive_summary',
  section_name: 'Executive Summary',
  prompt: 'Summarize... Consider: SME',
  guidance: 'Brief overview...',
  hints: ['Summarize...', 'What problem...'],
  word_count_min: 200,
  word_count_max: 500
}
```

### AdditionalDocument (Template - Unused):
```typescript
{
  id: 'work_plan_gantt',
  name: 'Work Plan & Gantt Chart',
  template: `# Work Plan Template\n## Project Overview...`,
  instructions: ['Define work packages...'],
  examples: ['Horizon Europe example'],
  commonMistakes: ['Not defining milestones...']
}
```

### AdditionalDocument (List - Used):
```typescript
{
  id: 'workPlanGantt',
  title: 'Work Plan & Gantt Chart',
  description: 'Timeline and deliverables',
  format: 'PDF/Excel'
}
```

---

## 🎯 Key Insights

1. **Sections are fully connected:**
   - Hardcoded base + database enhancement
   - User writes content
   - Export uses content

2. **Additional Documents are half-connected:**
   - Listing works (bundles + descriptions)
   - Templates exist but unused
   - Export creates stubs

3. **Content generation:**
   - **Sections:** User writes (AI can assist)
   - **Documents:** Currently just stubs (should use templates)

4. **Structure/format:**
   - **Sections:** Fixed IDs, plain text content
   - **Documents:** Fixed IDs, should have template content (but doesn't)

---

## ❓ Questions Answered

**Q: How are they connected?**
- Sections: `STANDARD_SECTIONS` → `categoryConverters` → API → Editor
- Documents: `documentBundles` → `documentDescriptions` → Preview/Export (but no templates)

**Q: Where do they get data from?**
- Sections: Hardcoded templates + Database requirements
- Documents: Hardcoded bundles + Database documents (but templates unused)

**Q: How do we know what's in there?**
- Check `standardSectionTemplates.ts` for sections
- Check `documentBundles.ts` + `documentDescriptions.ts` for document lists
- Check `additionalDocuments.ts` for unused templates

**Q: How is content generated/structured/formatted?**
- Sections: User writes, AI can help, stored as plain text
- Documents: Currently stub PDFs (should use templates but doesn't)

