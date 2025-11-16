# @templates Architecture - How Everything Connects

## 📁 File Structure

```
features/editor/templates/  ← This is @templates (via tsconfig.json alias)
├── index.ts               ← Main API entry point (all logic)
├── data.ts                ← Data barrel export (re-exports from data files)
├── sections.ts            ← MASTER_SECTIONS data (67KB - section templates)
├── documents.ts           ← MASTER_DOCUMENTS data (29KB - document templates)
├── templateKnowledge.ts   ← TEMPLATE_KNOWLEDGE data (26KB - AI guidance)
└── README.md              ← Documentation
```

## 🔗 How It All Connects

### 1. **Import Path: `@templates` → `features/editor/templates/index.ts`**

```typescript
// In your code, you import like this:
import { getSections, getDocuments, SectionTemplate } from '@templates';

// TypeScript resolves @templates to features/editor/templates/index.ts
// (configured in tsconfig.json: "@templates": ["./features/editor/templates"])
```

### 2. **Data Flow: Data Files → data.ts → index.ts → Your Code**

```
┌─────────────────┐
│  sections.ts    │  Contains MASTER_SECTIONS (all section templates)
│  (67KB data)    │
└────────┬────────┘
         │ exports MASTER_SECTIONS
         ▼
┌─────────────────┐
│  documents.ts   │  Contains MASTER_DOCUMENTS (all document templates)
│  (29KB data)    │
└────────┬────────┘
         │ exports MASTER_DOCUMENTS
         ▼
┌──────────────────────┐
│ templateKnowledge.ts  │  Contains TEMPLATE_KNOWLEDGE (AI guidance)
│   (26KB data)        │
└────────┬─────────────┘
         │ exports TEMPLATE_KNOWLEDGE
         ▼
┌─────────────────┐
│    data.ts      │  Re-exports everything from above
│  (barrel file)  │  Makes it easy to import all data at once
└────────┬────────┘
         │ imports & re-exports
         ▼
┌─────────────────┐
│   index.ts      │  Main API file
│  (all logic)    │  - Imports data from data.ts
│                 │  - Provides API functions (getSections, getDocuments)
│                 │  - Contains types (SectionTemplate, DocumentTemplate)
│                 │  - Contains overrides logic (mergeDocuments)
│                 │  - Contains LLM generator (suggestSectionForCategory)
└────────┬────────┘
         │ exports everything
         ▼
┌─────────────────┐
│  Your Code      │  import { ... } from '@templates'
│  (Editor, etc.) │
└─────────────────┘
```

### 3. **What Each File Does**

#### **`index.ts` - The Main API** (571 lines)
**Purpose:** Single entry point for all template functionality

**Contains:**
- ✅ **Types:** `SectionTemplate`, `DocumentTemplate`, `SectionQuestion`
- ✅ **API Functions:**
  - `getSections()` - Get section templates for funding type
  - `getDocuments()` - Get document templates (with program overrides)
  - `getSection()` - Get specific section by ID
  - `getDocument()` - Get specific document by ID
- ✅ **Overrides Logic:**
  - `mergeDocuments()` - Merge program-specific docs with master
  - `loadProgramDocuments()` - Load docs from database via API
- ✅ **LLM Generator:**
  - `generateTemplatesFromRequirements()` - Generate templates using LLM
  - `suggestSectionForCategory()` - Suggest which section fits a category

**Imports from:** `data.ts`

---

#### **`data.ts` - Data Barrel Export** (33 lines)
**Purpose:** Re-exports all data from data files for easy access

**Re-exports:**
- From `sections.ts`: `MASTER_SECTIONS`, `getStandardSections()`, etc.
- From `documents.ts`: `MASTER_DOCUMENTS`, `getAdditionalDocuments()`, etc.
- From `templateKnowledge.ts`: `TEMPLATE_KNOWLEDGE`, `getTemplateKnowledge()`, etc.

**Why it exists:** 
- Keeps data files separate (they're huge - 122KB total)
- Makes it easy to import all data at once
- `index.ts` imports from here instead of 3 separate files

---

#### **`sections.ts` - Section Templates Data** (1,699 lines, 67KB)
**Purpose:** Contains all section template definitions

**Contains:**
- `MASTER_SECTIONS` - Object with sections for grants, bankLoans, equity, visa
- Each funding type has: `strategy`, `review`, `submission` variants
- Helper functions: `getStandardSections()`, `getSectionById()`, etc.

**Example structure:**
```typescript
MASTER_SECTIONS = {
  grants: {
    submission: [/* 20+ section templates */],
    strategy: [/* 6 focused sections */],
    review: [/* same as submission */]
  },
  bankLoans: { ... },
  equity: { ... },
  visa: { ... }
}
```

**Each section template includes:**
- `id`, `title`, `description`
- `wordCountMin`, `wordCountMax`
- `prompts` (array of writing prompts)
- `validationRules`
- `category` (maps to requirement categories)

---

#### **`documents.ts` - Document Templates Data** (888 lines, 29KB)
**Purpose:** Contains all document template definitions

**Contains:**
- `MASTER_DOCUMENTS` - Object with documents for each funding type
- Each document includes full markdown template, instructions, examples
- Helper functions: `getAdditionalDocuments()`, `getRequiredDocuments()`, etc.

**Example documents:**
- Work Plan & Gantt Chart
- Financial Projections
- Team CVs
- Market Research Report
- etc.

---

#### **`templateKnowledge.ts` - AI Guidance Data** (534 lines, 26KB)
**Purpose:** Provides deep guidance for each section (used by AI Business Expert)

**Contains:**
- `TEMPLATE_KNOWLEDGE` - Object with guidance for each section ID
- For each section: `guidance`, `requiredElements`, `frameworks`, `bestPractices`, `commonMistakes`, `expertQuestions`
- Helper functions: `getTemplateKnowledge()`, `getAllFrameworks()`, etc.

**Used by:**
- AI Helper in editor (`features/editor/engine/aiHelper.ts`)
- Requirements Modal (`features/editor/components/RequirementsModal.tsx`)

---

## 🔄 Usage Examples

### Example 1: Get Sections for Editor
```typescript
// In Editor.tsx
import { getSections, SectionTemplate } from '@templates';

// Get sections for grants submission
const sections = await getSections('grants', 'submission');
// Returns: Array of SectionTemplate objects
// Source: MASTER_SECTIONS.grants.submission (from sections.ts)
```

### Example 2: Get Documents with Program Override
```typescript
// In export.tsx
import { getDocuments } from '@templates';

// Get documents for a specific program
const docs = await getDocuments('grants', 'submission', 'program_123');
// Flow:
// 1. Gets MASTER_DOCUMENTS from documents.ts
// 2. Loads program-specific docs from API (via loadProgramDocuments)
// 3. Merges them (via mergeDocuments in index.ts)
// 4. Returns merged list
```

### Example 3: Get Template Knowledge for AI
```typescript
// In aiHelper.ts
import { getTemplateKnowledge } from '@templates';

const knowledge = getTemplateKnowledge('executive_summary');
// Returns: TemplateKnowledge object with guidance, frameworks, etc.
// Source: TEMPLATE_KNOWLEDGE from templateKnowledge.ts
```

### Example 4: Use Standard Sections Helper
```typescript
// In categoryConverters.ts
import { getStandardSections, StandardSection } from '@templates';

const sections = getStandardSections('grants');
// Returns: Array of SectionTemplate (same as getSections('grants', 'submission'))
// Source: MASTER_SECTIONS.grants.submission
```

---

## 🎯 Key Design Decisions

### Why Separate Data Files?
- **Size:** Data files are huge (122KB total). Keeping them separate:
  - Makes code easier to navigate
  - Allows tree-shaking (only import what you need)
  - Keeps `index.ts` focused on logic, not data

### Why `data.ts` Barrel Export?
- **Convenience:** `index.ts` can import all data from one place
- **Flexibility:** You can still import directly from data files if needed
- **Organization:** Clear separation between data and logic

### Why Everything Exports from `index.ts`?
- **Single Source of Truth:** All imports go through `@templates` → `index.ts`
- **Consistency:** Same API surface regardless of where data lives
- **Maintainability:** Change internal structure without breaking imports

---

## 📊 Import Graph

```
Your Code
  │
  │ import from '@templates'
  ▼
index.ts (API + Logic)
  │
  │ imports data
  ▼
data.ts (Barrel Export)
  │
  ├─→ sections.ts (MASTER_SECTIONS)
  ├─→ documents.ts (MASTER_DOCUMENTS)
  └─→ templateKnowledge.ts (TEMPLATE_KNOWLEDGE)
```

---

## ✅ Summary

1. **`@templates`** = `features/editor/templates/index.ts` (via tsconfig alias)
2. **`index.ts`** = Main API, imports data from `data.ts`
3. **`data.ts`** = Barrel export, re-exports from 3 data files
4. **Data files** = Actual template data (sections, documents, knowledge)
5. **Your code** = Imports everything from `@templates`

**Everything flows:** Data Files → data.ts → index.ts → Your Code

