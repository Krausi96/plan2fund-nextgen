# Section 2: Project Description - Complete Workflow Walkthrough

**Purpose**: Detailed explanation of how the second section works from template → data → UI → user interaction. This is the recommended starting point - Executive Summary should be completed last.

**Section**: Project Description (Second section for `submission` and `review` products, recommended starting point)

**Workflow Note**: Users should start with Section 2 (Project Description) and complete Executive Summary last, as it summarizes all other sections.

**Last Updated**: 2025-01-20

---

## Table of Contents

1. [Template Definition](#1-template-definition)
2. [Editor Initialization](#2-editor-initialization)
3. [Section Building Process](#3-section-building-process)
4. [Question Creation](#4-question-creation)
5. [UI Rendering](#5-ui-rendering)
6. [User Interactions](#6-user-interactions)
7. [Component Integration](#7-component-integration)
8. [Data Flow](#8-data-flow)
9. [Plan Customization](#9-plan-customization)

---

## 1. Template Definition

### Location
`features/editor/templates/sections.ts` → `FULL_SECTIONS` array (line 228-249)

### Template Structure
```typescript
{
  id: 'project_description',
  title: 'Project Description',
  description: 'Detail the objectives, scope and methodology of the project. Explain what you plan to do and why it is necessary.',
  required: true,
  wordCountMin: 400,
  wordCountMax: 900,
  order: 2,
  category: 'project',
  prompts: [
    'Describe the main objectives and deliverables of your project.',
    'Explain the current state of the art and how your project goes beyond it.',
    'Outline the methodology and approach you will use to achieve the objectives.',
    'What are the expected outcomes and how will they be measured?'
  ],
  validationRules: {
    requiredFields: ['objectives', 'state_of_the_art', 'methodology', 'expected_outcomes'],
    formatRequirements: ['structured_subsections', 'evidence_of_need']
  }
}
```

### Key Properties
- **`id`**: `'project_description'` - Unique identifier
- **`order: 2`**: Second section (recommended starting point)
- **`category: 'project'`**: Determines info banner in Data tab ("milestone timelines and project deliverables")
- **`prompts`**: Array of 4 prompt strings → Will become 4 questions
- **`validationRules`**: Used for requirements checking
- **`wordCountMin: 400`**: More detailed than Executive Summary (200 words)

---

## 2. Editor Initialization

### Flow
```
User opens /editor page
  ↓
Editor component mounts
  ↓
useEffect triggers hydrate('submission', context)
  ↓
getSections('programe', 'submission') called
  ↓
Returns MASTER_SECTIONS.submission (FULL_SECTIONS array)
  ↓
buildSectionFromTemplate() called for each template
  ↓
Section objects created with questions
  ↓
activeSectionId = sections[0].id ('executive_summary')
  ↓
activeQuestionId = sections[0].questions[0].id ('executive_summary_q1')
```

### Code Location
`Editor.tsx:188-226` → `hydrate()` function

### What Happens
1. **Product Type Determines Sections**
   - `submission` → `FULL_SECTIONS` (9 sections)
   - `strategy` → `STRATEGY_SECTIONS` (6 sections)
   - `review` → `FULL_SECTIONS` (9 sections)

2. **First Section Auto-Selected** (Note: User should manually navigate to Section 2 to start)
   ```typescript
   activeSectionId: sections[0]?.id ?? null,  // 'executive_summary' (auto-selected, but user should switch to Section 2)
   activeQuestionId: sections[0]?.questions[0]?.id ?? null,  // 'executive_summary_q1'
   ```
   
   **Recommended Workflow**: User should click Section 2 (Project Description) in sidebar to start, as Executive Summary should be completed last.

3. **Right Panel Defaults**
   - `rightPanelView: 'ai'` (Assistant tab shown first)

---

## 3. Section Building Process

### Function: `buildSectionFromTemplate()`
**Location**: `Editor.tsx:587-608`

### Process
```typescript
function buildSectionFromTemplate(
  template: SectionTemplate,  // Executive Summary template
  savedSections: StoredPlanSection[]  // From localStorage (if exists)
): Section {
  // 1. Find saved data (if user previously worked on this)
  const saved = savedSections.find((section) => section.id === template.id);
  
  // 2. Convert legacy tables to datasets (if any)
  const datasets = convertLegacyTablesToDatasets(saved?.tables, template.id);
  
  // 3. Build questions from template prompts
  const questions = buildQuestionsFromTemplate(template, saved?.content ?? '');
  
  // 4. Create Section object
  return {
    id: template.id,  // 'executive_summary'
    title: template.title,  // 'Executive Summary'
    description: template.description,
    questions,  // Array of 4 Question objects
    datasets,  // Empty array initially (or from saved data)
    kpis: [],  // Empty array initially
    media: (saved?.figures as MediaAsset[]) || [],  // From saved data
    collapsed: false,
    category: template.category,  // 'general'
    progress: questions.every((q) => q.answer?.trim().length > 0) ? 100 : 0
  };
}
```

### Result
A `Section` object with:
- **4 questions** (from 4 prompts)
- **Empty datasets array** (user can add later)
- **Empty KPIs array** (user can add later)
- **Empty media array** (or from saved data)
- **Progress: 0%** (no answers yet)

---

## 4. Question Creation

### Function: `buildQuestionsFromTemplate()`
**Location**: `Editor.tsx:668-705`

### Process for Executive Summary

**Input**: Template with 4 prompts
```typescript
prompts: [
  'Describe the main objectives and deliverables of your project.',
  'Explain the current state of the art and how your project goes beyond it.',
  'Outline the methodology and approach you will use to achieve the objectives.',
  'What are the expected outcomes and how will they be measured?'
]
```

**Logic**:
```typescript
// Since template.questions is empty, use template.prompts
const seeds = template.prompts.map((prompt) => ({
  prompt,  // The prompt text
  helperText: template.description,  // Full section description
  placeholder: 'Provide details',
  required: true
}));
```

**Output**: 4 Question objects
```typescript
[
  {
    id: 'project_description_q1',
    prompt: 'Describe the main objectives and deliverables of your project.',
    helperText: 'Detail the objectives, scope and methodology of the project...',
    placeholder: 'Provide details',
    required: true,
    answer: savedAnswer || '',  // First question gets saved content (if exists)
    suggestions: [],
    warnings: [],
    requiredAssets: []  // Derived from validationRules
  },
  {
    id: 'project_description_q2',
    prompt: 'Explain the current state of the art and how your project goes beyond it.',
    helperText: 'Detail the objectives, scope and methodology...',
    placeholder: 'Provide details',
    required: true,
    answer: '',  // Empty (only first question gets saved content)
    suggestions: [],
    warnings: [],
    requiredAssets: []
  },
  {
    id: 'project_description_q3',
    prompt: 'Outline the methodology and approach you will use to achieve the objectives.',
    // ... same structure
  },
  {
    id: 'project_description_q4',
    prompt: 'What are the expected outcomes and how will they be measured?',
    // ... same structure
  }
]
```

### Key Points
- **First question** (`q1`) gets any saved content from localStorage
- **Other questions** start empty
- **All questions** share the same `helperText` (section description)
- **Question IDs** follow pattern: `{sectionId}_q{number}` (e.g., `project_description_q1`)
- **Category: 'project'** means Data tab shows: "This section typically includes milestone timelines and project deliverables."

---

## 5. UI Rendering

### Main Editor Layout

**Location**: `Editor.tsx:980-1047`

### Structure
```
┌─────────────────────────────────────────────────────────────┐
│ HEADER: Business Plan Editor + Program Selector              │
├─────────────────────────────────────────────────────────────┤
│ SECTION NAVIGATION: [01 Executive ✓] [02 Market ○] ...     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  LEFT COLUMN (60%)              │  RIGHT PANEL (360px)      │
│  ┌──────────────────────────┐  │  ┌────────────────────┐  │
│  │ SECTION HEADER            │  │  │ [Assistant] [Data] │  │
│  │ Executive Summary          │  │  │ [Preview]          │  │
│  │                            │  │  └────────────────────┘  │
│  │ PROMPT NAVIGATION          │  │                          │
│  │ [Q01] [Q02] [Q03] [Q04]    │  │  [Active tab content]    │
│  │                            │  │                          │
│  │ ACTIVE QUESTION CARD       │  │                          │
│  │ ┌────────────────────────┐ │  │                          │
│  │ │ Q01: Summarise your... │ │  │                          │
│  │ │ [Required]              │ │  │                          │
│  │ │                        │ │  │                          │
│  │ │ ┌────────────────────┐ │ │  │                          │
│  │ │ │ SimpleTextEditor    │ │ │  │                          │
│  │ │ │ [User types here]   │ │ │  │                          │
│  │ │ └────────────────────┘ │ │  │                          │
│  │ │                        │ │  │                          │
│  │ │ [✨ Generate] [⏭ Skip] │ │  │                          │
│  │ └────────────────────────┘ │  │                          │
│  └──────────────────────────┘  │                          │
└─────────────────────────────────────────────────────────────┘
```

### Section Header Component
**Shows**:
- Section title: "Project Description"
- Section description: "Detail the objectives, scope and methodology of the project..."
- Category tag: "project" (shown as uppercase label)

### Prompt Navigation Bar
**Shows**: 4 chips
- `[Q01]` - Active (highlighted)
- `[Q02]` - Inactive
- `[Q03]` - Inactive
- `[Q04]` - Inactive

**Behavior**: Click chip → Switches active question → Question card updates

### Question Card Component
**Location**: `Editor.tsx:1415-1481` → `QuestionCard`

**Shows**:
- Question number: "Q01"
- Question prompt: "Describe the main objectives and deliverables of your project."
- Required badge (if `required: true`)
- Helper text (section description)
- Text editor (`SimpleTextEditor` component)
- Action buttons: "✨ Generate" (AI), "⏭ Skip" (optional)

**State**:
- `isActive: true` (only one question active at a time)
- `answer: ''` (empty initially, or saved content for Q01)
- `suggestions: []` (AI suggestions appear here)
- **Word count guidance**: 400-900 words for this section (shown in validation)

---

## 6. User Interactions

### 6.1 Answering Questions

**Flow**:
```
User types in text editor
  ↓
SimpleTextEditor onChange event
  ↓
onAnswerChange(questionId, content) called
  ↓
updateAnswer(questionId, content) in store
  ↓
Question.answer updated
  ↓
Section.progress recalculated
  ↓
persistPlan() saves to localStorage
  ↓
UI updates (progress bar, preview)
```

**Code**: `Editor.tsx:252-279`

**What Happens**:
1. **Answer Stored**: `question.answer = content`
2. **Progress Calculated**: 
   ```typescript
   answeredCount = questions.filter(q => q.answer.trim().length > 0).length
   progress = Math.round((answeredCount / questions.length) * 100)
   // Example: 1/4 answered = 25% progress
   ```
3. **Auto-Save**: `persistPlan()` writes to localStorage
4. **UI Updates**:
   - Progress bar in sidebar updates
   - Preview tab shows answer preview
   - Section chip shows status (✓ complete, ⚠ partial, ○ empty)

### 6.2 Switching Questions

**Flow**:
```
User clicks Q02 chip
  ↓
onSelectQuestion('executive_summary_q2') called
  ↓
setActiveQuestion('executive_summary_q2') in store
  ↓
QuestionCard re-renders with Q02 data
  ↓
Right panel updates (shows Q02 context)
```

**What Changes**:
- **Question Card**: Shows Q02 prompt and answer
- **Right Panel**: Updates to show Q02 context
  - Assistant tab: Shows Q02 prompt
  - Data tab: Shows Q02 as active question (for attachments)
  - Preview tab: Highlights Q02

### 6.3 Using AI Assistant

**Flow**:
```
User clicks "✨ Generate" button
  ↓
onAskAI() called
  ↓
triggerAISuggestions(sectionId, questionId) called
  ↓
createAIHelper() with section context
  ↓
aiHelper.generateSectionContent() called
  ↓
OpenAI API request with:
  - Section title & prompts
  - Template knowledge
  - Previous answers (for context)
  - Program requirements (if connected)
  ↓
Response parsed:
  - content: Suggestion text
  - suggestedKPIs: Array of KPIs (optional)
  ↓
Question.suggestions[] updated
Question.aiContext updated
KPIs auto-created (if suggested)
  ↓
Right panel shows suggestion with Copy/Insert buttons
```

**Code**: `Editor.tsx:477-561`

**AI Context Includes**:
- **Section**: "Project Description"
- **All 4 prompts** (for full context)
- **Previous answers** (Q01 if answered, for continuity)
- **Template knowledge**: Best practices for project descriptions, methodology, objectives
- **Program requirements**: If program connected
- **Category-specific guidance**: Project management best practices, milestone planning

**Result**:
- Suggestion appears in Assistant tab
- User can **Copy** (manual paste) or **Insert** (auto-fill)
- KPIs auto-created if AI suggests them

### 6.4 Creating Data Items

**Flow for Dataset**:
```
User switches to Data tab → Datasets sub-tab
  ↓
User fills form:
  - Name: "Project Overview Table"
  - Description: "Key project metrics"
  - Columns: "Metric:string, Value:number"
  - Tags: "overview, metrics"
  ↓
User clicks "Create dataset"
  ↓
onDatasetCreate(dataset) called
  ↓
addDataset(sectionId, dataset) in store
  ↓
Dataset added to section.datasets[]
  ↓
Data tab updates:
  - Tab badge: "📊 Datasets (1)"
  - Item appears in list
  - Search bar appears (if >3 items)
```

**Flow for KPI**:
```
User switches to Data tab → KPIs sub-tab
  ↓
User fills form:
  - Name: "Expected Impact Score"
  - Value: 85
  - Unit: "%"
  - Target: 90
  - Description: "Target impact on market"
  ↓
User clicks "Track KPI"
  ↓
onKpiCreate(kpi) called
  ↓
addKpi(sectionId, kpi) in store
  ↓
KPI added to section.kpis[]
  ↓
Data tab updates: "📈 KPIs (1)"
```

**Flow for Media**:
```
User switches to Data tab → Media sub-tab
  ↓
User fills form:
  - Title: "Project Impact Diagram"
  - Type: "image"
  - URI: "https://example.com/diagram.png"
  - Caption: "Visual representation of impact"
  ↓
User clicks "Add media"
  ↓
onMediaCreate(asset) called
  ↓
addMedia(sectionId, asset) in store
  ↓
Media added to section.media[]
  ↓
Data tab updates: "📷 Media (1)"
```

### 6.5 Attaching Items to Questions

**Flow**:
```
User is on Q02 ("Explain the current state of the art...")
  ↓
User goes to Data tab → Datasets
  ↓
User expands "State of the Art Comparison" dataset
  ↓
User clicks "Attach" button
  ↓
onAttachDataset(dataset) called
  ↓
attachDatasetToQuestion(sectionId, questionId, dataset) called
  ↓
Dataset added to question.attachments[]
Dataset.questionId = 'project_description_q2'
  ↓
UI updates:
  - Dataset card shows: "• Question: Explain the current state of the art..."
  - Question card shows attachment indicator (📊)
  - Preview tab shows: "📊 State of the Art Comparison (attached)"
```

**Code**: `Editor.tsx:564-585`

**Multiple Attachments**:
- One question can have **multiple attachments** (dataset + KPI + media)
- One item can be attached to **multiple questions** (same dataset in Q01 and Q03)

---

## 7. Component Integration

### 7.1 Right Panel Tabs

#### Assistant Tab
**Location**: `Editor.tsx:1548-1620`

**Shows**:
- Current question prompt
- Answer preview (first 200 chars)
- "Ask the assistant" button
- Latest AI suggestion (if available)
- Copy/Insert buttons
- Conversation history (if multiple suggestions)

**Updates When**:
- User switches questions
- User asks AI
- User inserts suggestion

#### Data Tab
**Location**: `Editor.tsx:1656-1702` → `DataPanel` component

**Shows**:
- **Info Banner**: Contextual guidance based on section category
  - For `project` category: "This section typically includes milestone timelines and project deliverables. You can create unlimited datasets, KPIs, and media items. Attach them to specific questions or keep them as section-level data."
- **3 Sub-tabs**: Datasets, KPIs, Media (with badges showing counts)
- **Search Bar**: Appears when >3 items in any tab
- **Create Forms**: Always visible at top of active sub-tab
- **Item Library**: Expandable cards showing all items

**Data Flow**:
```
Data Tab receives:
  - section.datasets[]
  - section.kpis[]
  - section.media[]
  - activeQuestionId (for attachments)
  - section.category (for info banner)
  ↓
Renders appropriate sub-tab
  ↓
User creates/edits/attaches items
  ↓
Callbacks update store:
  - onDatasetCreate → addDataset()
  - onKpiCreate → addKpi()
  - onAttachDataset → attachDatasetToQuestion()
```

#### Preview Tab
**Location**: `Editor.tsx:1704-1722` → `SectionContentRenderer`

**Shows**:
- Section title
- All questions with answer previews (100 chars)
- Attachments with icons (📊 📈 📷)
- Standalone section data (KPIs, datasets, media not attached)
- Export buttons

**Updates When**:
- User answers questions
- User attaches items
- User creates data items

---

## 8. Data Flow

### 8.1 State Management

**Store Structure** (`Editor.tsx:47-89`):
```typescript
{
  plan: BusinessPlan {
    sections: [
      {
        id: 'executive_summary',
        title: 'Executive Summary',
        // ... (should be completed last)
      },
      {
        id: 'project_description',
        title: 'Project Description',
        questions: [
          {
            id: 'project_description_q1',
            prompt: 'Describe the main objectives and deliverables...',
            answer: '...',  // User's answer
            attachments: []  // Linked datasets/KPIs/media
          },
          // ... 3 more questions
        ],
        datasets: [],  // User-created tables (e.g., milestone timelines)
        kpis: [],      // User-created metrics (e.g., project KPIs)
        media: []      // User-created images/assets (e.g., project diagrams)
      },
      // ... other sections
    ]
  },
  activeSectionId: 'project_description',  // User navigated to Section 2
  activeQuestionId: 'project_description_q1',
  rightPanelView: 'ai'
}
```

### 8.2 Persistence

**Auto-Save**: `persistPlan()` called after every mutation
- Saves to `localStorage`
- Converts `BusinessPlan` → legacy format for compatibility
- Stores: answers, datasets, KPIs, media, attachments

**Load on Init**: `loadPlanSections()` reads from `localStorage`
- Restores previous answers
- Restores datasets (converted to new format)
- Restores media

### 8.3 Export Flow

**When User Clicks "Export draft"**:
```
createExportDocument(section, plan) called
  ↓
convertSectionToPlanSection(section) converts:
  - Questions + answers → content string
  - Datasets → tables format
  - KPIs → included in content
  - Media → figures array
  ↓
PlanDocument created
  ↓
exportManager.exportPlan() called
  ↓
PDF/DOCX generated with:
  - All questions (Q01-Q04)
  - All answers
  - All tables (from datasets)
  - All KPIs (in content)
  - All figures (from media)
  ↓
File downloads automatically
```

---

## 9. Plan Customization

### 9.1 Accessing Customization

**Location**: Section Navigation Bar → "Front & back matter" (last item)

**Flow**:
```
User clicks "Front & back matter" in section navigation
  ↓
setActiveSection(ANCILLARY_SECTION_ID) called
  ↓
isAncillaryView = true
  ↓
AncillaryWorkspace component renders
  ↓
AncillaryEditorPanel shows customization options
```

**Code**: `Editor.tsx:986-999` → `AncillaryWorkspace`

### 9.2 Title Page Customization

**Location**: `AncillaryEditorPanel` → Title Page section

**Fields Available**:
- **Plan title**: Main document title
- **Company name**: Your company name
- **Value proposition**: Optional tagline
- **Date**: Document date
- **Contact email**: Contact information
- **Phone**: Phone number
- **Website**: Company website
- **Address**: Full address (textarea)
- **Logo URL**: Company logo image URL
- **Confidentiality statement**: Optional confidentiality text (textarea)

**Code**: `RequirementsModal.tsx:255-326`

**Data Flow**:
```
User edits title page field
  ↓
handleTitlePageUpdate(path, value) called
  ↓
updateTitlePage(updatedTitlePage) in store
  ↓
plan.titlePage updated
  ↓
persistPlan() saves to localStorage
  ↓
Export uses plan.titlePage for title page
```

**Export Integration**:
- Title page appears in exported PDF/DOCX if `includeTitlePage: true`
- Shows: Title, subtitle, author, date, logo (if provided)
- Code: `export.ts:184-187` → Renders title page HTML

### 9.3 Page Numbers

**Location**: Export settings (hardcoded in export, not user-configurable yet)

**Current Behavior**:
- **Always included** in exports: `includePageNumbers: true`
- Rendered via CSS `@media print` rules
- Page numbers appear in footer of exported documents

**Code**: `SectionContentRenderer.tsx:147` → `includePageNumbers: true`

**Note**: Currently hardcoded to `true`. Future enhancement could add toggle in UI.

### 9.4 Citations & References

**Location**: `AncillaryEditorPanel` → References section

**Features**:

#### Adding References
```
User fills form:
  - Citation: "Smith, J. (2024). Market Analysis..."
  - URL: "https://example.com/source"
  ↓
User clicks "Add reference"
  ↓
onReferenceAdd(reference) called
  ↓
Reference added to plan.references[]
  ↓
Appears in references list
```

**Reference Structure**:
```typescript
{
  id: 'ref_1234567890',
  citation: 'Full citation text',
  url: 'https://example.com',
  accessedDate: '2025-01-20'
}
```

#### Footnotes
- **Location**: Footnotes & inline citations section
- **Create**: User adds footnote content, optionally links to reference
- **Link to Reference**: Dropdown to select from existing references
- **Display**: Footnotes appear in exported document

**Code**: `RequirementsModal.tsx:207-230` → Footnote management

**Citation Styles**:
- Stored in `plan.ancillary.citationStyle`: `'apa' | 'mla' | 'chicago' | 'custom'`
- Currently: Style is stored but not actively applied in export (future enhancement)

### 9.5 Table Formatting

**Location**: Export engine (automatic formatting)

**Table Styling** (in exported PDF/DOCX):
- **Borders**: 1px solid gray borders
- **Header styling**: Gray background (`#f3f4f6`), bold text
- **Cell padding**: 8px 12px
- **Width**: 100% of page width
- **Responsive**: Horizontal scroll if table too wide

**Code**: `export.ts:149-167` → Table CSS styles

**Table Structure**:
- Tables are automatically formatted from datasets
- Each dataset becomes a table with:
  - Headers from column names
  - Rows from data rows
  - Proper formatting applied

**Customization Options** (Future):
- Table borders (on/off)
- Header colors
- Cell alignment
- Font size
- Currently: Uses default styling (not user-configurable)

### 9.6 Table of Contents

**Location**: `AncillaryEditorPanel` → Table of Contents section

**Features**:
- **Add entries**: User can add custom TOC entries
- **Edit titles**: Modify entry titles
- **Hide entries**: Toggle visibility (hidden entries don't appear in export)
- **Remove entries**: Delete unwanted entries

**Code**: `RequirementsModal.tsx:155-172` → TOC management

**Data Structure**:
```typescript
{
  id: 'toc_1234567890',
  title: 'Section Title',
  page: 1,  // Auto-calculated in export
  hidden: false
}
```

### 9.7 List of Illustrations & Tables

**Location**: `AncillaryEditorPanel` → List of Illustrations / List of Tables

**Features**:
- **Add items**: Create entries for figures/tables
- **Set type**: Image, Chart, or Table
- **Set label**: Figure/Table label (e.g., "Figure 1", "Table 2")
- **Page numbers**: Auto-calculated in export

**Code**: `RequirementsModal.tsx:174-205` → Figure list management

**Auto-Generation** (Future):
- Could auto-generate from `section.media[]` and `section.datasets[]`
- Currently: Manual entry required

### 9.8 Appendices

**Location**: `AncillaryEditorPanel` → Appendices section

**Features**:
- **Add appendix**: Title, description, file URL
- **Edit/Delete**: Manage appendix items
- **File attachments**: Link to external files or documents

**Code**: `RequirementsModal.tsx:232-241` → Appendix management

**Data Structure**:
```typescript
{
  id: 'appendix_1234567890',
  title: 'Appendix A: Financial Statements',
  description: 'Detailed financial breakdown',
  fileUrl: 'https://example.com/file.pdf',
  uploadedAt: '2025-01-20'
}
```

### 9.9 Export Settings

**Location**: Export options (hardcoded in `createExportDocument`)

**Current Settings**:
```typescript
settings: {
  includeTitlePage: true,      // Always include title page
  includePageNumbers: true,    // Always include page numbers
  citations: 'simple',          // Simple citation format
  captions: true,               // Include figure/table captions
  graphs: {},                   // Graph settings (empty)
  titlePage: {
    title: exportTitle,
    subtitle: fullPlan.titlePage.planTitle,
    author: fullPlan.titlePage.contactInfo?.name,
    date: new Date().toISOString().split('T')[0]
  }
}
```

**Code**: `SectionContentRenderer.tsx:145-157`

**Future Enhancements** (Not yet implemented):
- User toggle for `includeTitlePage`
- User toggle for `includePageNumbers`
- Citation style selector (APA/MLA/Chicago)
- Table formatting options
- Font/font size selection
- Margin customization

### 9.10 Customization Workflow Example

**Scenario**: User wants to customize their business plan before export

1. **Edit Title Page**:
   - Click "Front & back matter" in section navigation
   - Edit title page fields (plan title, company name, etc.)
   - Add logo URL
   - Add confidentiality statement
   - Changes auto-save

2. **Add References**:
   - Scroll to References section
   - Add citation: "Smith, J. (2024). Market Analysis..."
   - Add URL: "https://example.com"
   - Reference saved to `plan.references[]`

3. **Create Footnotes**:
   - Scroll to Footnotes section
   - Add footnote content
   - Link to reference (optional)
   - Footnote saved to `plan.ancillary.footnotes[]`

4. **Manage Table of Contents**:
   - Scroll to TOC section
   - Add/edit entries
   - Hide unwanted entries
   - TOC saved to `plan.ancillary.tableOfContents[]`

5. **Export**:
   - Go to any section → Preview tab
   - Click "Export draft"
   - PDF/DOCX includes:
     - Custom title page
     - Page numbers
     - References (if added)
     - Footnotes (if added)
     - Table of contents (if entries exist)
     - All formatted tables
     - All figures/media

### 9.11 Data Persistence

**All Customizations Auto-Save**:
- Title page changes → `persistPlan()` called
- References added → Saved to `plan.references[]`
- Footnotes added → Saved to `plan.ancillary.footnotes[]`
- TOC changes → Saved to `plan.ancillary.tableOfContents[]`
- All persisted to localStorage

**Code**: `Editor.tsx:379-386` → `updateTitlePage`, `updateAncillary`

---

## 10. Cross-Section Enhancements & Open Questions

> These improvements apply to **all** sections, not just Project Description. We reference Section 2 examples because this document focuses on it, but the behaviors should become global defaults across the editor.

### 10.1 Minimal Information, Skips, and AI Tuning
- **Question lifecycle**: Every prompt now tracks `status` (`blank`, `draft`, `complete`, `unknown`). A response must include at least one bullet or two meaningful sentences before it counts as `complete`; shorter drafts remain `draft`.
- **Mark as Unknown**: The secondary button in each question card toggles an explicit “Marked as unknown” state and optional note. Unknown prompts are excluded from section progress and clearly labeled until the user supplies real input.
- **AI interaction**: Guidance mode engages whenever a question is `blank` or `unknown`, asking for missing facts and suggesting outlines. Once a prompt reaches `draft`/`complete`, the assistant switches to critique/enrichment and highlights remaining requirement gaps.

### 10.2 Smarter Requirements Checker (Independent of AI)
- **Today**: `runRequirementsCheck` only verifies that `question.answer.trim().length > 0`, no matter which section it inspects.
- **Future checks** (applies to every section template):
  1. **Completion vs. intentional skip**: Ensure every required prompt is either filled or explicitly marked unknown.
  2. **Word counts**: Validate each section stays within its `wordCountMin/Max`, allowing a configurable tolerance band (e.g., ±10%) before warning.
  3. **Structural cues**: Search for required keywords or subheadings tied to that section’s `validationRules.requiredFields`.
  4. **Attachments**: If a rule implies evidence (datasets/KPIs/media), confirm at least one relevant attachment exists before declaring the prompt complete.
  5. **Gating**: Raise blocking warnings when critical rules fail and require users to acknowledge them before exporting (override allowed). AI assistance remains available regardless of status.

### 10.3 AI Assistant as Business Expert
- **Objective**: Combine prompt assistance with expert-level business planning feedback for every section (market, financials, impact, etc.).
- **Blank prompts**: Ask targeted clarifying questions (budget, beneficiaries, technical readiness, depending on section) or provide outline templates plus suggestions for supporting data.
- **Partial prompts**: Audit the user’s draft, identify missing elements (KPIs, datasets, risks) and recommend concrete improvements referencing the active section’s metadata and attachments.
- **Structured outputs**: Offer bullet frameworks, risk matrices, KPI suggestions (auto-create when appropriate) and keep conversation history for all sections so users can compare iterations.

### 10.4 Data / Media Workflow & Automation
- **Manual workflow (today)**: Users create datasets, KPIs, and media through the Data tab, attach them per question, and see them in Preview/Export—this already works identically in every section.
- **Shared metadata**: All assets should write to a consistent metadata shape (`id`, `type`, `title`, `tags`, `source`, `updatedAt`, `relatedQuestions[]`) so AI and requirements checks treat every section uniformly.
- **Template-driven recommendations**: Continue leveraging each section’s category metadata to display hints like “Recommended: milestone timeline table” or “Add revenue breakdown chart.” Layer on section-specific quick-add templates (budget table, risk matrix, KPI tracker, beneficiary segmentation, etc.) derived from program requirements.
- **Automation ideas**: Allow AI-assisted asset drafts (e.g., generate a milestone table skeleton from a text summary) while keeping full manual editability. Attachments remain optional but strongly encouraged wherever validation rules demand evidence.

### 10.5 End-to-End Workflow Reference
Sections 1‑9 describe the canonical flow for Project Description, but the same sequence should become the pattern for every section: capture minimal inputs (or mark unknown), leverage the expert-mode assistant, create/attach supporting data, run the smarter requirements check, and only export once all rules pass.

---

## Summary: What User Can Do in Section 2 (Project Description)

**Recommended Starting Point**: Users should begin with Section 2 (Project Description) and complete Executive Summary last, as it summarizes all other sections.

### ✅ Answer Questions
- Type answers in text editor
- Auto-saves to localStorage
- Progress tracked (0% → 100%)

### ✅ Use AI Assistant
- Click "✨ Generate" for AI suggestions
- AI considers all 4 prompts + previous answers
- Can copy or insert suggestions
- AI can auto-create KPIs

### ✅ Create Data Items
- **Unlimited datasets** (tables/charts)
- **Unlimited KPIs** (metrics)
- **Unlimited media** (images/documents)
- All section-scoped (only visible in this section)

### ✅ Attach Items to Questions
- Attach datasets to specific questions
- Attach KPIs to questions
- Attach media to questions
- Multiple attachments per question

### ✅ Navigate Questions
- Click Q01-Q04 chips to switch
- Right panel updates with question context
- Can work on questions in any order

### ✅ Preview & Export
- Preview shows all questions + answers + attachments
- Export creates PDF/DOCX with all content
- Includes tables, KPIs, and media

### ✅ Search & Filter
- Search datasets/KPIs/media by name/description/tags
- Filter by type (Datasets/KPIs/Media tabs)
- Navigate with Prev/Next buttons

### ✅ Customize Plan
- **Title Page**: Edit plan title, company name, contact info, logo, confidentiality statement
- **References**: Add citations with URLs
- **Footnotes**: Create footnotes, link to references
- **Table of Contents**: Add/edit/hide TOC entries
- **List of Figures/Tables**: Manage figure and table lists
- **Appendices**: Add appendix items with descriptions
- **Export Settings**: Title page, page numbers, citations included in exports

---

## Verification Checklist

✅ **Template → Section**: Template correctly converted to Section object  
✅ **Prompts → Questions**: 4 prompts become 4 questions with proper IDs  
✅ **First Question Active**: Q01 auto-selected on load  
✅ **Right Panel Defaults**: Assistant tab shown first  
✅ **Data Tab Works**: Can create datasets/KPIs/media  
✅ **Attachments Work**: Can attach items to questions  
✅ **Preview Shows All**: Questions, answers, attachments, standalone data  
✅ **Export Includes All**: Tables, KPIs, media in exported document  
✅ **Progress Tracking**: Updates as questions answered  
✅ **Auto-Save**: Changes persist to localStorage  
✅ **Title Page Customization**: All fields editable, auto-saves  
✅ **References & Footnotes**: Can add citations and footnotes  
✅ **Table of Contents**: Can manage TOC entries  
✅ **Export Settings**: Title page, page numbers, citations included  

---

**Next Steps**: If approved, we'll verify this workflow for all sections (2-9) to ensure consistency.


## Section 3: Innovation & Technology – Complete Workflow Walkthrough

> This section follows the exact mechanics described for Project Description, with template metadata swapped for technology-specific prompts. Treat the guidance below as the canonical flow for all R&D sections; no external business-plan text is assumed.

### 3.1 Template Definition
- **Location**: `features/editor/templates/sections.ts` → entry with `id: 'innovation_technology'`.
- **Key metadata**:
  - `prompts`: Novelty, prior-art/protection, TRL progression, technical risks.
  - `validationRules.requiredFields`: `['novelty','state_of_the_art_comparison','protection_strategy','technical_risks']`.
  - `validationRules.formatRequirements`: `['evidence_based_claims','risk_mitigation_plan']`.
  - `wordCountMin/Max`: `300-800` words.
  - `category: 'technical'` (drives Data-tab banner text).

### 3.2 Scenario Handling (Blank → Draft → Complete)
| Scenario | Expected user action | System behavior |
| --- | --- | --- |
| **Blank** | Provide at least one bullet per prompt **or** mark as unknown via ⏭ toggle. | Question status stays `blank`; AI assistant remains in guidance mode asking for TRL, novelty, IP evidence; requirements summary shows “Unstarted”. |
| **Partial** | Draft answers covering some prompts; optionally attach datasets/media first. | Section progress reflects answered count (25 % increments). AI critique mode highlights missing evidence/risks. Preview displays partial copy plus attachment badges. |
| **Complete** | All prompts answered within word-count tolerance and required attachments linked. | Section progress = 100 %. Requirements checker (once upgraded) validates keywords, attachments, and TRL references, raising warnings only when criteria fail. Export allowed after acknowledgment if warnings remain. |

### 3.3 Data & Attachments
- Recommended quick-add templates (to be implemented once the unified Data tab supports presets):
  - **TRL progression table** (component, current TRL, target TRL, validation evidence, owner).
  - **Prior-art tracker** (claim, source, differentiator, attachment link).
  - **Risk matrix** (risk, probability, impact, mitigation, owner, due date).
- All created items inherit the shared metadata schema described in Section 10.4, ensuring AI + requirements can treat them uniformly.
- Attachments are optional today but should become mandatory when `validationRules` reference evidence; requirements will flag missing datasets/KPIs/media before allowing “complete” status.

### 3.4 AI Assistant
- **Guidance mode** (blank/unknown): asks for core facts (innovation summary, starting/ending TRL, patent strategy, risk owners) and proposes outline bullets.
- **Expert mode** (partial/complete): audits the answer by comparing prompts vs attachments and suggests KPIs (e.g., “Prototype uptime > 99%”); inserting a suggestion can auto-create KPI entries when the API returns structured data.
- Conversation history is stored per section; future UI work should expose it consistently across sections.

### 3.5 Requirements & Export
- Once the smarter checker is implemented, each question must satisfy:
  - Status = answered or marked unknown.
  - Word count within ±10 % tolerance (270‑880 words total).
  - Presence of required keywords per `validationRules.requiredFields`.
  - At least one attachment tagged `evidence` or `risk_matrix` when format requirements demand it.
- Export remains available but prompts the user to acknowledge unresolved warnings before generating the document.

---

## Section 4: Impact Assessment – Complete Workflow Walkthrough

> Same engine as Section 2, with impact-specific metadata. Use this to validate how the editor should behave for any outcomes/KPI-heavy section—no external case study required.

### 4.1 Template Definition
- **Location**: `features/editor/templates/sections.ts` → `id: 'impact_assessment'`.
- **Key metadata**:
  - `prompts`: Beneficiaries, economic impact, social/environmental outcomes, indicators.
  - `validationRules.requiredFields`: `['target_beneficiaries','economic_impact','social_environmental_impact','impact_metrics']`.
  - `validationRules.formatRequirements`: `['quantifiable_metrics','alignment_with_policy']`.
  - `wordCountMin/Max`: `300-800`.
  - `category: 'impact'` (Data-tab banner should mention beneficiaries + KPIs once copy is added).

### 4.2 Scenario Handling (Blank → Draft → Complete)
| Scenario | Expected user action | System behavior |
| --- | --- | --- |
| **Blank** | Enter minimal beneficiary + metric bullets or mark as unknown. | Question status `blank`; AI guidance asks for segments, baseline counts, policy ties. Requirements summary stays “Unstarted”. |
| **Partial** | Provide some narrative and start attaching KPI/dataset evidence. | Progress shows partial completion; AI critiques missing metrics or policy references; Preview surfaces KPI badges. |
| **Complete** | All prompts answered within tolerance, KPIs/datasets attached per requirement. | Requirements checker verifies numeric content, attachment presence, and alignment keywords; warnings only if criteria unmet. Export allowed with override if warnings persist. |

### 4.3 Data & Attachments
- Suggested quick-add templates:
  - **Beneficiary segmentation table** (segment, geography, size, data source).
  - **Impact KPI tracker** (metric, baseline, target, unit, evidence link).
  - **Policy alignment checklist** (policy/program, alignment statement, attachment).
- Shared metadata schema mirrors Section 3, ensuring automation/requirements behave the same regardless of section type.
- Attachments should become mandatory for prompts tied to `quantifiable_metrics` or `alignment_with_policy`; requirements will fail until at least one relevant dataset/media/KPI is linked.

### 4.4 AI Assistant
- **Guidance mode**: prompts for beneficiary groups, economic indicators, social/enviro claims, target KPIs.
- **Expert mode**: cross-references attachments, suggests new KPIs (“% of municipalities adopting program”), and can auto-create them if the API response includes structured KPI data.
- AI should annotate which requirements remain unmet (e.g., “No policy alignment evidence attached”) once the context pack includes requirement metadata.

### 4.5 Requirements & Export
- Checker enforces the same global rules:
  - Status answered/unknown.
  - Word-count tolerance (270‑880).
  - Required keywords present (beneficiaries, economic impact, etc.).
  - Attachment gating for KPI-heavy prompts.
  - Blocking warnings require acknowledgment before export, but AI remains available for remediation.

---