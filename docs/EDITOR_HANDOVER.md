# Editor Handover Document

**Date:** Current  
**Purpose:** Review current editor implementation, identify simplification opportunities, and ensure all features work correctly

---

## 🎯 Overview

The Plan2Fund Editor is a section-by-section business plan editor with AI assistance, requirements checking, and support for tables/charts. This document covers the current state and areas that need review.

---

## 1. 📍 Entry Points into the Editor

### How Users Enter the Editor

**Entry Point 1: Direct URL with Parameters**
```
/editor?programId=ffg_basisprogramm&product=submission&route=grants
```
- User navigates directly with program selected
- Editor loads immediately with sections

**Entry Point 2: Program Selector (No Parameters)**
```
/editor
```
- Shows `ProgramSelector` component in header
- User selects:
  - **Product:** Strategy / Review / Submission
  - **Route:** Grant / Loan / Equity / Visa
  - **Program:** Dropdown of available programs
- After selection → navigates to `/editor?programId=X&product=Y&route=Z`

**Entry Point 3: From Recommendation Page**
- User clicks "Open in Editor" on a recommended program
- Navigates with `programId` pre-filled

### Where Data Comes From

**1. Section Templates**
- **Location:** `features/editor/templates/sections.ts`
- **Source:** Master templates based on Horizon Europe, FFG, WKO, Sequoia
- **Structure:** Organized by `fundingType` × `productType`
- **Function:** `getSections(fundingType, product, programId, baseUrl)`
- **Returns:** Array of `SectionTemplate` objects with:
  - `id`, `title`, `description`
  - `prompts` (array of questions for Smart Hints)
  - `category` (financial, market, risk, project, team, general)
  - `order` (section sequence)
  - `validationRules` (word counts, format requirements)

**2. Program-Specific Requirements**
- **API:** `/api/programmes/{programId}/requirements`
- **Returns:** `categorized_requirements` object
- **Used by:** RequirementsModal for validation
- **Structure:**
  ```typescript
  {
    categorized_requirements: {
      financial: [...],
      market_size: [...],
      compliance: [...],
      team: [...],
      // etc.
    },
    program_name: string
  }
  ```

**3. Program List (for Selector)**
- **API:** `/api/programs?enhanced=true&type={fundingType}`
- **Returns:** List of available programs for selected route
- **Used by:** `ProgramSelector` dropdown

**4. Template Knowledge**
- **Location:** `features/editor/templates/templateKnowledge.ts`
- **Function:** `getTemplateKnowledge(sectionId)`
- **Returns:** Best practices, frameworks, required elements per section
- **Used by:** AI generation and Requirements validation

---

## 2. 🎨 Editor Layout UI

### Current Implementation Status

**✅ Implemented (According to UI_LAYOUT_SPEC.md):**

1. **Sticky Header** (`features/editor/components/Editor.tsx` lines ~210-250)
   - Gradient background (blue-600 → purple-600)
   - Title: "Business Plan Editor"
   - Action buttons: Requirements, AI Assistant, Preview
   - Program Selector in card below

2. **Section Navigation** (lines ~250-300)
   - Sticky navigation bar
   - Section badges with status icons (✓ ⚠ ○)
   - Previous/Next buttons
   - Overall progress bar

3. **Main Editor Area** (lines ~400-600)
   - Section header card (title + description)
   - Text editor (`SimpleTextEditor` component)
   - Action buttons: Generate with AI, Smart Hints, Skip
   - Smart Hints panel (collapsible)
   - Tables & Charts section (conditional)

**⚠️ Needs Visual Review:**

- **Max-width:** Should be `1200px` (check if implemented)
- **Spacing:** Check padding and margins match spec
- **Colors:** Verify gradient, button colors, status badges
- **Responsiveness:** Test on mobile/tablet
- **Loading states:** Check loading indicators
- **Error states:** Check error handling UI

**📋 Reference:** `docs/UI_LAYOUT_SPEC.md` (full visual spec)

---

## 3. 🔗 Section Connections & Prompts

### How Sections Are Connected

**1. Section Order**
- Sections have an `order` field in templates
- Sorted by order when loaded (Editor.tsx line ~81-85)
- Recommended flow: Executive → Market → Business Model → Financial → Risk

**2. Cross-Section Awareness (AI Generation)**
- **Location:** `features/editor/engine/aiHelper.ts`
- **Function:** `createAIHelper()` → `generateSectionContent()`
- **Context Used:**
  - Previous sections' content (read from `sections` array)
  - Conversation history per section (stored in localStorage)
  - Program requirements
  - Template knowledge
- **Implementation:** AI prompt includes snippets from previous sections

**3. Prompts (Smart Hints)**
- **Source:** `sectionTemplate.prompts` (array of strings)
- **Display:** Shown in `SmartHintsPanel` component (Editor.tsx line ~759)
- **Usage:**
  - **Optional guidance** - User can ignore them
  - **AI Context** - ALL prompts used when generating (even if user skipped)
  - **Not a separate mode** - Always shows regular text editor

**4. Data Flow Between Sections**
- **Text Content:** Stored per section in `section.content`
- **Tables:** Stored in `section.tables` object
- **Auto-save:** Debounced (400ms) to localStorage
- **No automatic sync** - Each section independent unless AI regenerates

**⚠️ Questions to Review:**
- Are prompts actually being used in AI generation? (Check `aiHelper.ts`)
- Is cross-section context working? (Check if previous sections are included in AI prompt)
- Should sections be more connected? (e.g., auto-update references)

---

## 4. 🤖 AI Assistant & Requirements Check

### AI Assistant

**Current Implementation:**
- **Button:** In header (Editor.tsx line ~343)
- **Modal:** Placeholder modal (lines ~660-670)
- **Status:** ⚠️ **NOT FULLY IMPLEMENTED**
- **What's Missing:**
  - Chat interface
  - Context-aware responses
  - Section-specific help

**AI Generation (Per Section):**
- **Button:** "✨ Generate with AI" (line ~455)
- **Function:** `handleAIGenerate()` (line ~217)
- **Implementation:**
  - Uses `createAIHelper()` from `features/editor/engine/aiHelper.ts`
  - Gathers context: prompts, previous sections, program requirements
  - Calls OpenAI API via `/api/ai/openai`
  - Generates complete section content
  - Updates editor with generated content

**⚠️ Needs Review:**
- Is AI generation working correctly?
- Are all prompts being used as context?
- Is conversation history being saved/loaded?
- Should there be a chat interface instead of just generation?

### Requirements Check

**Current Implementation:**
- **Button:** "📋 Requirements" in header (line ~337)
- **Component:** `RequirementsModal` (`features/editor/components/RequirementsModal.tsx`)
- **Features:**
  1. **Section List View:**
     - Shows all sections with status (✓ ⚠ ○)
     - Progress percentage per section
     - Missing items list
  2. **Semantic Validation:**
     - Uses AI to validate content quality (not just keyword matching)
     - Checks word count, required elements, frameworks
     - Provides detailed feedback
  3. **Program Requirements:**
     - Shows program-specific requirements from `categorized_requirements`
     - Maps section categories to requirement categories
  4. **Actions:**
     - Navigate to section
     - Generate missing content

**Data Sources:**
- **Section Templates:** For validation rules
- **Template Knowledge:** For best practices
- **Program Data:** `programData.categorized_requirements`
- **Section Content:** Current text content

**⚠️ Needs Review:**
- Is semantic validation working? (Check API calls)
- Are program requirements being displayed correctly?
- Is the "Generate Missing Content" button working?
- Should validation be real-time or on-demand?

---

## 5. 📊 Tables & Charts

### Current Implementation

**Location:** `features/editor/components/SectionContentRenderer.tsx`

**When Tables/Charts Appear:**
- **Always:** Financial, Risk, Project sections
- **Optional:** Market, Team sections (if user adds them)
- **Never:** General sections (Executive Summary)

**Table Initialization:**
- **Function:** `initializeTablesForSection()` in `features/editor/utils/tableInitializer.ts`
- **Triggered:** When section loads if `sectionNeedsTables(template)` returns true
- **Creates:** Empty table structures based on section category

**Table Types:**
- **Financial:** Revenue, Costs, Cash Flow
- **Risk:** Risk Matrix
- **Project:** Milestone Timeline
- **Market:** Competitor Analysis (optional)
- **Team:** Hiring Timeline (optional)

**Chart Generation:**
- **Auto-generates:** When table has data
- **Chart Types:** Bar, Line, Pie, Donut
- **Component:** Uses `recharts` library
- **Selection:** User can change chart type via buttons

**Current Features:**
- ✅ Table rendering (editable cells)
- ✅ Chart rendering (auto-generated from table)
- ✅ Chart type selection
- ✅ Table navigation (if multiple tables)
- ✅ "Fill with AI from Text" button (placeholder)

**⚠️ Missing Features (Per UI_LAYOUT_SPEC.md):**
- ❌ **Table Creation Dialog:** "Add Table" button shows alert
- ❌ **Chart Creation:** "Add Chart" button shows alert
- ❌ **Image Upload:** "Add Image" button shows alert
- ❌ **AI Fill from Text:** Button exists but functionality incomplete
- ❌ **Table Navigation:** Previous/Next, "Table 1 of 3" display
- ❌ **Table Tabs:** Quick jump to specific table

**Code Locations:**
- **Table Rendering:** `SectionContentRenderer.tsx` lines ~200-400
- **Chart Rendering:** Lines ~400-600
- **Add Buttons:** Editor.tsx lines ~520-540

---

## 6. 🔍 Simplification Opportunities

### Areas to Review for Simplification

**1. Component Structure**
- **Current:** Many inline components in `SectionContentRenderer.tsx`
- **Question:** Should these be extracted to separate files?
- **Files:**
  - `DataChartInline` (line ~600+)
  - `FinancialAnalysisInline` (line ~700+)
  - `ImageUploadInline` (line ~800+)
  - `StructuredFieldsInline` (line ~900+)

**2. State Management**
- **Current:** Multiple `useState` hooks in Editor.tsx
- **Question:** Should we use a reducer or context?
- **State Variables:**
  - `plan`, `sections`, `sectionTemplates`
  - `activeSection`, `isLoading`, `isSaving`
  - `showAIModal`, `showRequirementsModal`, `showSmartHints`
  - `programData`

**3. Data Loading**
- **Current:** Multiple `useEffect` hooks
- **Question:** Can we consolidate data loading?
- **Loads:**
  - Sections from templates
  - Program data from API
  - Saved plan from localStorage
  - Conversation history

**4. AI Integration**
- **Current:** AI helper created per generation
- **Question:** Should we cache or reuse AI helper?
- **Files:**
  - `features/editor/engine/aiHelper.ts` (463 lines)
  - Multiple prompt building functions

**5. Table/Chart Logic**
- **Current:** Complex conditional rendering
- **Question:** Can we simplify the table/chart display logic?
- **Files:**
  - `features/editor/utils/tableInitializer.ts`
  - `SectionContentRenderer.tsx` (1111 lines)

**6. Template System**
- **Current:** Multiple template sources
- **Question:** Can we unify template loading?
- **Sources:**
  - Master templates (`features/editor/templates/sections.ts`)
  - Template knowledge (`features/editor/templates/templateKnowledge.ts`)
  - Program requirements (API)

---

## 7. ✅ Checklist for Review

### Entry Points
- [ ] Test `/editor` (no params) → shows ProgramSelector
- [ ] Test `/editor?programId=X` → loads sections
- [ ] Test program selection → navigation works
- [ ] Check data sources (templates, API, localStorage)

### UI Layout
- [ ] Verify header matches spec (gradient, buttons, selector)
- [ ] Verify section navigation (badges, progress bar)
- [ ] Verify main editor area (header card, editor, buttons)
- [ ] Check max-width is 1200px
- [ ] Test responsive design
- [ ] Check loading/error states

### Section Connections
- [ ] Verify sections are sorted by order
- [ ] Test AI generation uses previous sections' content
- [ ] Check prompts are shown in Smart Hints
- [ ] Verify prompts are used in AI generation
- [ ] Test conversation history is saved/loaded

### AI Assistant
- [ ] Check AI generation button works
- [ ] Verify generated content appears in editor
- [ ] Test AI Assistant modal (currently placeholder)
- [ ] Check if chat interface is needed

### Requirements Check
- [ ] Open Requirements modal
- [ ] Verify sections are listed with status
- [ ] Check semantic validation works
- [ ] Verify program requirements are shown
- [ ] Test "Generate Missing Content" button
- [ ] Test navigation to section from modal

### Tables & Charts
- [ ] Navigate to Financial section
- [ ] Verify Tables & Charts section appears
- [ ] Check "Add Table" button (currently alert)
- [ ] Check "Add Chart" button (currently alert)
- [ ] Check "Add Image" button (currently alert)
- [ ] Test existing table rendering
- [ ] Test chart generation from table
- [ ] Test chart type selection
- [ ] Check "Fill with AI from Text" button

### Simplification
- [ ] Review component structure (can we extract components?)
- [ ] Review state management (can we use reducer/context?)
- [ ] Review data loading (can we consolidate?)
- [ ] Review AI integration (can we cache/reuse?)
- [ ] Review table/chart logic (can we simplify?)
- [ ] Review template system (can we unify?)

---

## 8. 📁 Key Files

### Core Components
- `pages/editor.tsx` - Page wrapper with auth
- `features/editor/components/Editor.tsx` - Main editor component (798 lines)
- `features/editor/components/ProgramSelector.tsx` - Program selection
- `features/editor/components/SimpleTextEditor.tsx` - Text editor
- `features/editor/components/RequirementsModal.tsx` - Requirements checker
- `features/editor/components/SectionContentRenderer.tsx` - Tables/charts (1111 lines)

### Templates & Data
- `features/editor/templates/sections.ts` - Master section templates
- `features/editor/templates/templateKnowledge.ts` - Best practices per section
- `features/editor/templates/index.ts` - Template loading functions
- `features/editor/templates/types.ts` - TypeScript types

### AI & Logic
- `features/editor/engine/aiHelper.ts` - AI generation logic (463 lines)
- `features/editor/utils/tableInitializer.ts` - Table initialization
- `features/editor/hooks/useSectionProgress.ts` - Progress calculation

### Storage
- `shared/user/storage/planStore.ts` - localStorage functions
  - `savePlanSections()`, `loadPlanSections()`
  - `savePlanConversations()`, `loadPlanConversations()`

### API Endpoints
- `/api/programmes/{programId}/requirements` - Program requirements
- `/api/programs?enhanced=true&type={type}` - Program list
- `/api/ai/openai` - AI generation

---

## 9. 🐛 Known Issues

1. **AI Assistant Modal:** Placeholder only, needs full implementation
2. **Table Creation:** "Add Table" shows alert, needs dialog
3. **Chart Creation:** "Add Chart" shows alert, needs dialog
4. **Image Upload:** "Add Image" shows alert, needs implementation
5. **AI Fill from Text:** Button exists but functionality incomplete
6. **Table Navigation:** Previous/Next, tabs not fully implemented

---

## 10. 🎯 Next Steps

1. **Visual Review:** Check UI matches `UI_LAYOUT_SPEC.md`
2. **Functionality Test:** Test all entry points and features
3. **Simplification Analysis:** Review code structure for simplification opportunities
4. **Missing Features:** Prioritize and implement missing table/chart features
5. **AI Assistant:** Decide on chat interface vs. generation-only
6. **Documentation:** Update this doc with findings

---

## 📞 Questions?

If you have questions about:
- **Entry points:** Check `pages/editor.tsx` and `ProgramSelector.tsx`
- **UI Layout:** Check `Editor.tsx` and `docs/UI_LAYOUT_SPEC.md`
- **Sections:** Check `features/editor/templates/` and `Editor.tsx`
- **AI:** Check `features/editor/engine/aiHelper.ts`
- **Requirements:** Check `RequirementsModal.tsx`
- **Tables/Charts:** Check `SectionContentRenderer.tsx` and `tableInitializer.ts`

---

**Good luck with the review! 🚀**

