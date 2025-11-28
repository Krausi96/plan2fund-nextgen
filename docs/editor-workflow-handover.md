# Editor Workflow & Architecture Handover

## Overview
This document explains the current editor architecture, template system, and workflow to help a colleague understand how everything connects and what still needs to be implemented.

---

## 1. Template System & Current Workflow

### 1.1 How Templates Affect the Current Workflow

**Template Sources:**
- **Base Templates**: Product-specific templates (e.g., `submission`, `pitch`, `grant`) defined in `features/editor/templates/sections.ts`
- **Program Templates**: Funding program-specific templates (e.g., AWS Pre-Seed, i2b Austria) that can be extracted from uploaded files or connected via program finder
- **Custom Templates**: User-created sections/documents added in the Desktop configurator

**Template Merging Process:**
1. **Desktop Configurator** (`DesktopConfigurator.tsx`):
   - User selects a product type (e.g., "Business Plan")
   - User optionally connects a funding program (via program finder or manual input)
   - If a program is connected, templates are extracted from program documents
   - Base + Program templates are merged (currently basic merge, no deduplication yet)

2. **Hydration** (`useEditorStore.ts` → `hydrate` function):
   - Loads base templates via `getSections(product, fundingType, programId)`
   - Filters out disabled sections (from `context.disabledSectionIds`)
   - Adds custom sections (from `context.customSections`)
   - Converts templates → plan sections with questions
   - Creates the `BusinessPlan` object with all sections

3. **Template → Plan Conversion:**
   - Each `SectionTemplate` becomes a `Section` in the plan
   - Each question in the template becomes a `Question` in the section
   - Questions start with empty answers and `status: 'draft'`

**Current Limitations:**
- ❌ No intelligent deduplication of overlapping questions between base and program templates
- ❌ No progressive disclosure (all questions shown at once)
- ❌ No visibility flags (`essential | advanced | programOnly`)
- ❌ No severity levels for requirements validation
- ✅ Basic template merging works
- ✅ Custom sections can be added
- ✅ Sections can be disabled/enabled

---

### 1.2 What Gets Edited in Desktop (Two Columns)

**Location**: `DesktopTemplateColumns.tsx` - Renders two columns when Desktop is expanded

**Column 1: Documents (Left)**
- Lists all `DocumentTemplate[]` (e.g., "Pitch Deck", "Technical Annex", "Financial Spreadsheet")
- Each document can be:
  - **Toggled on/off** (enabled/disabled for the plan)
  - **Expanded** to see description and requirements
  - **Edited** (click edit → opens `DesktopEditForm` to modify title/description)
  - **Removed** (if custom)
- Shows origin badge (base template vs program template vs custom)
- "Add Document" button to create custom documents

**Column 2: Sections (Right)**
- Lists all `SectionTemplate[]` (e.g., "Executive Summary", "Product Description", "Market Analysis")
- Each section can be:
  - **Toggled on/off** (enabled/disabled)
  - **Expanded** to see description and all questions within
  - **Edited** (click edit → opens `DesktopEditForm` to modify title/description/questions)
  - **Removed** (if custom)
- Shows origin badge
- "Add Section" button to create custom sections

**Editing Flow:**
1. User clicks edit on a section/document → `DesktopEditForm` opens
2. User modifies title, description, or questions
3. User clicks save → `onSaveSection`/`onSaveDocument` called
4. Changes stored in `useEditorStore` state
5. On "Start editing" → `handleTemplateUpdate` called → `hydrate` runs with updated templates

**Key Files:**
- `DesktopTemplateColumns.tsx` - Two-column layout
- `DesktopEditForm.tsx` - Form for editing section/document metadata
- `Desktop.tsx` - Main container, handles state and callbacks

---

### 1.3 How Desktop Connects to Workspace

**Connection Flow:**

```
Desktop (TemplateOverviewPanel)
  ↓ User clicks "Start editing" / expands desktop
  ↓ handleTemplateUpdate() called
  ↓ hydrate(product, context) called
  ↓ Templates → Plan Sections conversion
  ↓ Workspace renders with plan
```

**State Management:**
- `useEditorStore` holds:
  - `plan: BusinessPlan | null` - The actual plan being edited
  - `templates: SectionTemplate[]` - Source templates
  - `activeSectionId: string | null` - Currently selected section
  - `activeQuestionId: string | null` - Currently selected question

**Workspace Components:**
1. **Sidebar** (`Sidebar.tsx`):
   - Lists all sections from `plan.sections`
   - Shows completion status
   - Clicking a section → `setActiveSection(sectionId)` → triggers inline editor

2. **Preview Workspace** (`PreviewWorkspace.tsx`):
   - Renders the full document preview
   - Shows all sections with answers formatted as a business plan
   - Clicking a section in preview → also triggers editor

3. **Inline Section Editor** (`InlineSectionEditor.tsx`):
   - Appears inline within the preview (positioned relative to section/question)
   - Shows current question with textarea
   - Question navigation (if section has multiple questions)
   - Actions: Complete, Skip, AI Help, Data Help

4. **Right Panel** (`RightPanel.tsx`):
   - AI Assistant tab
   - Data Panel tab (datasets, KPIs, media)
   - Requirements checker (when implemented)

**Key Connection Points:**
- `Editor.tsx` is the main orchestrator
- Desktop changes → `hydrate` → updates `plan` → Workspace re-renders
- Workspace edits → `updateAnswer` → updates `plan` → Preview updates in real-time

---

## 2. AI Assistant, Requirement Checker & User Completion Flow

### 2.1 Current State vs. Planned Features

**What We Have Now:**

✅ **AI Assistant Panel** (`RightPanel.tsx` → `AIPanel.tsx`):
- Basic AI suggestions via `sectionAiClient.ts`
- Context-aware (knows current section/question)
- Can insert suggestions into editor
- **Missing**: 
  - Memory of prior answers
  - Real-time co-writing (autocomplete)
  - Context ribbon showing what AI knows
  - Integration with draft content

✅ **Data Panel** (`DataPanel.tsx`):
- Create datasets, KPIs, media assets
- Attach to questions
- Drag-and-drop support
- **Missing**:
  - Inline preview of tables/images in editor
  - Miniature previews

❌ **Requirements Checker**:
- **NOT IMPLEMENTED YET**
- Should validate plan against program requirements
- Should show badges on questions (green/yellow/red)
- Should provide helpful feedback (not judgmental)
- Should distinguish soft vs hard requirements

❌ **Progressive Disclosure**:
- **NOT IMPLEMENTED YET**
- All questions shown at once
- No "essential vs advanced" distinction
- No one-question-at-a-time mode

❌ **Conversational Prompts**:
- **NOT IMPLEMENTED YET**
- Questions use raw template text
- No "Why we ask" tooltips
- No storytelling aids

---

### 2.2 How the Flow Should Work (Based on UX Plans)

**Ideal User Journey:**

1. **Template Selection & Configuration** (Desktop):
   - User selects product type
   - User connects funding program
   - System merges templates intelligently
   - User sees overview of sections/documents
   - User can toggle optional sections, reorder, preview guidance
   - User clicks "Start editing"

2. **Guided Writing** (Workspace):
   - **Guided Mode** (default):
     - Left: One question card at a time
     - Right: Preview of just that section
     - Question shows: prompt, "Why we ask" tooltip, status badges
     - User answers → autosave → preview updates
     - Click "Next" → next question
   
   - **Outline Mode** (optional):
     - Left: Collapsible section tree
     - Middle: Multi-question form (wizard-style)
     - Right: Full document preview
     - User can jump between sections

3. **AI Co-Writing**:
   - AI Assistant panel shows context ribbon (current section, question, prior answers)
   - User can ask: "Help me write this section"
   - AI generates suggestion based on:
     - Current question context
     - Prior answers in plan
     - Program requirements
   - User can insert suggestion with one click
   - AI remembers what user has written

4. **Requirements Validation**:
   - After each section: background check runs
   - Badges appear on questions:
     - 🟢 Green: All requirements met
     - 🟡 Yellow: Recommendations (soft validation)
     - 🔴 Red: Missing required info (hard validation)
   - Clicking badge → shows what's missing and how to fix
   - Final review: Summary of all unmet requirements

5. **Completion**:
   - Progress bar shows completion percentage
   - Requirements checker ensures all hard requirements met
   - User can export PDF (with watermark if draft)

---

### 2.3 What We Have Instead of Full Template System

**Current Help Mechanisms:**

1. **Inline Editor**:
   - Shows question prompt
   - Shows helper text (if available in template)
   - Shows validation badges (basic - just shows if answer exists)
   - Actions: Complete, Skip, AI Help, Data Help

2. **AI Help Button**:
   - Opens AI panel
   - Generates suggestions
   - Can insert into editor

3. **Data Help Button**:
   - Opens Data panel
   - User can create datasets/KPIs/media
   - Can attach to current question

4. **Preview**:
   - Real-time preview of what plan looks like
   - Helps user see progress
   - Clicking section in preview opens editor

**What's Missing (From UX Plans):**

1. **Requirements Checker**:
   - No validation against program requirements
   - No badges showing compliance status
   - No helpful feedback on what's missing

2. **Progressive Disclosure**:
   - All questions visible at once (overwhelming)
   - No "essential vs advanced" distinction
   - No one-question-at-a-time mode

3. **Conversational Prompts**:
   - Questions use formal template language
   - No "Why we ask" explanations
   - No storytelling guidance

4. **AI Memory**:
   - AI doesn't remember prior answers
   - No context ribbon
   - Suggestions are generic, not personalized

5. **Template Merging Intelligence**:
   - Basic merge (no deduplication)
   - Overlapping questions shown twice
   - No visibility flags

---

## 3. Implementation Status & Next Steps

### 3.1 What's Working

✅ Template loading and basic merging  
✅ Desktop configurator (two-column editing)  
✅ Workspace with sidebar and preview  
✅ Inline section editor (positioned relative to sections)  
✅ AI assistant panel (basic)  
✅ Data panel (datasets, KPIs, media)  
✅ Real-time preview updates  
✅ Drag-and-drop for files  

### 3.2 What Needs Implementation

**Priority 1: Requirements Checker**
- [ ] Implement `validateQuestionRequirements` with severity levels
- [ ] Add requirement badges to questions
- [ ] Create `RequirementSummaryBar` component
- [ ] Integrate with program template requirements
- [ ] Soft vs hard validation distinction

**Priority 2: Template Merging Intelligence**
- [ ] Implement `mergeSections` with deduplication
- [ ] Add visibility flags (`essential | advanced | programOnly`)
- [ ] Add severity metadata to questions
- [ ] Progressive disclosure based on visibility

**Priority 3: Conversational UX**
- [ ] Rewrite prompts in conversational tone
- [ ] Add "Why we ask" tooltips
- [ ] Implement storytelling aids
- [ ] One-question-at-a-time mode

**Priority 4: AI Co-Writing**
- [ ] Add context ribbon to AI panel
- [ ] Implement memory of prior answers
- [ ] Real-time autocomplete suggestions
- [ ] Better context awareness

**Priority 5: Guided/Outline Modes**
- [ ] Implement layout mode switcher
- [ ] Guided mode (one question at a time)
- [ ] Outline mode (multi-question form)
- [ ] Full preview mode with watermark

---

## 4. Key Files Reference

### Templates
- `features/editor/templates/sections.ts` - Base section templates
- `features/editor/templates/documents.ts` - Document templates
- `features/editor/templates/api.ts` - Template extraction from files

### Desktop
- `features/editor/components/layout/Desktop/Desktop.tsx` - Main desktop container
- `features/editor/components/layout/Desktop/DesktopConfigurator.tsx` - Left column (config)
- `features/editor/components/layout/Desktop/DesktopTemplateColumns.tsx` - Two columns (sections/documents)
- `features/editor/components/layout/Desktop/DesktopEditForm.tsx` - Edit form for sections/documents

### Workspace
- `features/editor/components/Editor.tsx` - Main editor orchestrator
- `features/editor/components/layout/Workspace/Main Editor/Sidebar.tsx` - Section navigation
- `features/editor/components/layout/Workspace/Right-Panel/PreviewWorkspace.tsx` - Document preview
- `features/editor/components/layout/Workspace/Editor/InlineSectionEditor.tsx` - Inline editor
- `features/editor/components/layout/Workspace/Right-Panel/RightPanel.tsx` - AI/Data panel container
- `features/editor/components/layout/Workspace/Right-Panel/AIPanel.tsx` - AI assistant
- `features/editor/components/layout/Workspace/Right-Panel/DataPanel.tsx` - Data panel

### State Management
- `features/editor/hooks/useEditorStore.ts` - Main store (Zustand)
  - `hydrate()` - Loads templates and creates plan
  - `updateAnswer()` - Updates question answer
  - `validateQuestionRequirements()` - Validates questions (basic)

### Types
- `features/editor/types/plan.ts` - BusinessPlan, Section, Question types
- `@templates` - SectionTemplate, DocumentTemplate types

---

## 5. Questions for Next Developer

1. **Template Merging**: How should we handle overlapping questions? Merge into one, or keep separate with different wording?

2. **Requirements Checker**: Should validation run in real-time or only on section completion? How to balance helpful vs. intrusive?

3. **AI Memory**: How much context should AI remember? All prior answers, or just current section?

4. **Progressive Disclosure**: Should "advanced" questions be hidden by default, or just visually de-emphasized?

5. **Guided Mode**: Should it be the default, or should users choose? How to handle users who want to jump around?

---

## 6. Related Documentation

- `docs/editor-inline-handover.md` - Inline editor implementation details
- UX Plans (attached):
  - `UX Improvement Plan for the AI-Assisted Business Plan Editor.txt`
  - `Extended UX Plan for the AI-Assisted Business Plan Editor.txt`
  - `1 Architecture & UX proposal.txt`
- Template reference: `template_public_support_general_austria_de_i2b.txt`

---

**Last Updated**: Current session  
**Status**: In progress - inline editor working, requirements checker and template merging intelligence still needed

