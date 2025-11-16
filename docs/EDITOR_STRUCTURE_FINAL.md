# Editor Structure - Final Clean Architecture

**Date:** 2025-01-XX  
**Status:** Clean & Ready for Development

---

## 📁 Final Folder Structure

```
features/editor/
│
├── 📂 components/              # UI Components (4 files)
│   ├── Editor.tsx              # Main editor component (entry point)
│   ├── RequirementsModal.tsx  # Requirements checker modal
│   ├── SectionContentRenderer.tsx # Tables/charts renderer
│   └── SimpleTextEditor.tsx    # Plain text editor
│
├── 📂 engine/                  # Business Logic (2 files)
│   ├── aiHelper.ts            # AI generation & prompt building
│   └── categoryConverters.ts  # Category conversion (used by reco)
│
├── 📂 hooks/                   # React Hooks (1 file)
│   └── useSectionProgress.ts  # Section completion calculation
│
├── 📂 templates/               # Template System (7 files)
│   ├── index.ts               # Main export (registry API)
│   ├── sections.ts            # Master section templates
│   ├── documents.ts           # Document templates
│   ├── templateKnowledge.ts   # Template knowledge base
│   ├── data.ts                # Data aggregator
│   ├── types.ts               # Template type definitions
│   └── README.md              # Template system docs
│
├── 📂 types/                   # TypeScript Types (1 file)
│   └── plan.ts                # Plan document & section types
│
├── 📂 utils/                   # Utilities (1 file)
│   └── tableInitializer.ts    # Table initialization logic
│
└── 📄 README.md                # Editor documentation
```

**Total:** 16 files (14 active code + 2 documentation)

---

## 🔗 Import Dependencies

### Editor.tsx (Main Component)
```typescript
// Core Types
import { PlanDocument, PlanSection, ConversationMessage } from '@/features/editor/types/plan';

// Templates
import { SectionTemplate, getSections } from '@templates';

// AI Engine
import { createAIHelper } from '@/features/editor/engine/aiHelper';

// Hooks
import { calculateSectionProgress } from '@/features/editor/hooks/useSectionProgress';

// Components
import SimpleTextEditor from './SimpleTextEditor';
import RequirementsModal from './RequirementsModal';
import SectionContentRenderer from './SectionContentRenderer';

// Utils
import { initializeTablesForSection, sectionNeedsTables } from '@/features/editor/utils/tableInitializer';

// Storage (shared)
import { savePlanSections, loadUserAnswers, ... } from '@/shared/user/storage/planStore';
```

### Template System (`@templates`)
```typescript
// Exports from templates/index.ts:
- SectionTemplate (type)
- getSections() (function)
- getTemplateKnowledge() (function)
- MASTER_SECTIONS (data)
- MASTER_DOCUMENTS (data)
```

---

## 📊 File Usage Matrix

| File | Used By | Purpose |
|------|---------|---------|
| `Editor.tsx` | `pages/editor.tsx` | Main editor UI |
| `RequirementsModal.tsx` | `Editor.tsx` | Requirements validation |
| `SectionContentRenderer.tsx` | `Editor.tsx` | Render tables/charts |
| `SimpleTextEditor.tsx` | `Editor.tsx` | Text input component |
| `aiHelper.ts` | `Editor.tsx` | AI content generation |
| `categoryConverters.ts` | `features/reco/engine/` | Category conversion |
| `useSectionProgress.ts` | `Editor.tsx` | Progress calculation |
| `templates/*` | `Editor.tsx` (via `@templates`) | Template system |
| `plan.ts` | `Editor.tsx` | Type definitions |
| `tableInitializer.ts` | `Editor.tsx` | Table initialization |

---

## 🎯 Component Responsibilities

### Editor.tsx
- **Main orchestrator** - Manages all editor state
- **Section navigation** - Handles section switching
- **AI generation** - Triggers AI content generation
- **Program integration** - Loads program data from localStorage
- **Auto-save** - Saves sections to localStorage

### RequirementsModal.tsx
- **Validation** - Semantic validation using AI
- **Progress tracking** - Shows section completion
- **Navigation** - Navigate to sections with issues
- **Generation** - Trigger AI generation for missing content

### SectionContentRenderer.tsx
- **Table rendering** - Renders financial/risk/project tables
- **Chart rendering** - Renders charts from table data
- **Image handling** - Image upload and display
- **Structured fields** - TAM/SAM/SOM input fields

### SimpleTextEditor.tsx
- **Text input** - Plain textarea for section content
- **Auto-save** - Triggers save on change

### aiHelper.ts
- **Prompt building** - Builds contextual prompts
- **AI generation** - Calls OpenAI API
- **Context management** - Manages conversation history
- **Template integration** - Integrates template knowledge

---

## 🚀 Next Steps: AI Improvements

Based on `EDITOR_IMPLEMENTATION_PLAN.md`, priority features:

### Priority 1: Core Table Features
1. **"Fill with AI from Text"** - Extract data from text to tables
2. **Table Creation Dialog** - Create tables with type selection
3. **Chart Auto-Generation** - Auto-generate charts from tables

### Priority 2: Quality of Life
4. **KPI Calculations** - Financial KPIs in tables
5. **Table Structure Editing** - Add/remove rows/columns
6. **Smart Hints Actions** - "Use as Guide" & "Insert All"

### Priority 3: Polish
7. **Rich Text Editor** - Formatting toolbar
8. **Real-time Validation** - Live requirements checking
9. **Image Upload** - Full integration

---

## 📝 Notes

### What Was Removed
- `ProductSelectionModal.tsx` - Replaced by dropdown in header
- `ProgramSelector.tsx` - Replaced by ProgramFinderModal
- `sectionPrompts.ts` - Prompts now in templates
- `types/editor.ts` - Unused unified types

### What Was Kept
- All active components
- Template system (complete)
- AI engine
- All utilities and hooks
- Documentation files

### Architecture Decisions
- **Templates:** Centralized in `templates/` folder, exported via `index.ts`
- **Types:** Separated by domain (`plan.ts` for plan types)
- **Components:** Flat structure (no subfolders needed yet)
- **Engine:** Business logic separated from UI

---

## ✅ Cleanup Verification

- ✅ No broken imports
- ✅ All files actively used
- ✅ Structure is clean and organized
- ✅ Ready for feature development

---

**Status:** ✅ Clean & Ready  
**Next:** Proceed with AI improvements from implementation plan

