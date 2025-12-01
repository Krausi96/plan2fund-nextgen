# Editor Architecture & UX Improvements Handover

## Overview
This document outlines the planned architectural changes to improve the editor's UX by integrating the desktop template configuration with the workspace, moving the right panel functionality, and creating a live preview experience with AI/Data integration.

---

## 1. Moving Right Panel to Sidebar

### Current State
- **Right Panel** (`RightPanel.tsx`) is a separate panel on the right side of the workspace
- Contains AI Assistant and Data tabs
- Takes up ~320px width when open
- Slides in/out from the right

### Proposed Change
**Move AI/Data functionality into the Sidebar** (`Sidebar.tsx`)

#### Implementation Approach:

1. **Extend Sidebar Component**:
   - Add expandable sections at the bottom of the sidebar
   - When a section is selected, show:
     - Section navigation tree (existing)
     - **AI Assistant panel** (collapsible, below sections)
     - **Data panel** (collapsible, below AI)
   - Use accordion-style expansion for AI/Data panels

2. **Layout Changes**:
   ```
   Current: [Sidebar] [Preview] [RightPanel]
   New:     [Sidebar (with AI/Data)] [Preview] [Gap/Empty]
   ```

3. **Gap in Right Corner**:
   - The right side will be empty (just preview)
   - This creates space for:
     - Future full-preview mode expansion
     - Watermark overlay area
     - Export controls
   - Consider adding a small floating action button for quick access to AI/Data if sidebar is collapsed

#### Code Changes Needed:

**File: `features/editor/components/layout/Workspace/Main Editor/Sidebar.tsx`**
- Add state for AI/Data panel expansion
- Import `AIPanel` and `DataPanel` components
- Add accordion sections below the section tree
- Pass necessary props (section, question, plan, callbacks)

**File: `features/editor/components/Editor.tsx`**
- Remove `RightPanel` import and usage
- Remove `isRightPanelOpen` state
- Update `Sidebar` component to receive AI/Data props
- Remove right panel container div

**Benefits:**
- More screen space for preview
- Contextual AI/Data always visible when section selected
- Cleaner layout without sliding panels

---

## 2. Merging Workspace with Template Columns

### Current State
- **Desktop** (`Desktop.tsx`) shows template overview with two columns (Documents + Sections)
- **Workspace** (`Editor.tsx`) shows the editing interface
- These are separate views - user clicks "Start editing" to switch

### Proposed Change
**Merge template columns into workspace as a collapsible/expandable panel**

#### Implementation Approach:

1. **Keep Product Selector Visible**:
   - Product selector stays at top (from `DesktopConfigurator`)
   - Always visible, compact design

2. **Template Columns as Expandable Panel**:
   - Add a toggle button: "Configure Templates" or "Template Overview"
   - When expanded, shows the two-column layout (Documents + Sections) **within the workspace**
   - Overlays or slides in from top/left
   - Can be collapsed while editing

3. **Unified Flow**:
   ```
   [Product Selector - Always Visible]
   [Template Columns - Expandable/Collapsible]
   [Workspace - Sidebar + Preview]
   ```

#### Code Changes Needed:

**File: `features/editor/components/Editor.tsx`**
- Keep `TemplateOverviewPanel` but make it collapsible
- Add state: `isTemplatePanelExpanded`
- Move template columns into workspace container
- Add toggle button in header

**File: `features/editor/components/layout/Desktop/Desktop.tsx`**
- Extract template columns logic into a reusable component
- Make it work both standalone (current) and embedded (new)

**Alternative Approach (Simpler)**:
- Keep Desktop separate but add a "Back to Templates" button in workspace
- Or: Show template columns as a slide-out drawer from left side

**Benefits:**
- No context switching between desktop and workspace
- Users can adjust templates while seeing preview
- More integrated experience

---

## 3. What Users Can Edit in Documents and Sections

### Current Editing Capabilities

#### Documents (`DocumentTemplate`):
**In Desktop Configurator:**
- ✅ **Toggle on/off** (enable/disable for plan)
- ✅ **Edit title/name** (via `DesktopEditForm`)
- ✅ **Edit description** (via `DesktopEditForm`)
- ✅ **View requirements** (format, size, word count)
- ✅ **Add custom documents** (user-created)
- ✅ **Remove custom documents** (only custom ones)
- ❌ Cannot edit requirements (format, size) - these come from templates

**What Gets Saved:**
- Custom document templates stored in `plan.customDocuments`
- Disabled documents stored in `context.disabledDocumentIds`
- Edited documents create a custom copy (original disabled)

#### Sections (`SectionTemplate`):
**In Desktop Configurator:**
- ✅ **Toggle on/off** (enable/disable section)
- ✅ **Edit section title** (via `DesktopEditForm`)
- ✅ **Edit section description** (via `DesktopEditForm`)
- ✅ **Edit questions** (prompts, helper text, placeholders)
- ✅ **Add custom sections** (user-created)
- ✅ **Remove custom sections** (only custom ones)
- ❌ Cannot edit question requirements (word counts, severity) - these come from templates

**What Gets Saved:**
- Custom section templates stored in `plan.customSections`
- Disabled sections stored in `context.disabledSectionIds`
- Edited sections create a custom copy (original disabled)

### What Should Be Editable (Based on Architecture Docs)

**Recommended Editable Fields:**

**Documents:**
- ✅ Name/Title
- ✅ Description
- ✅ Requirements (format, max size) - **NEW: Allow editing**
- ❌ Origin (master/program/custom) - Read-only badge

**Sections:**
- ✅ Title
- ✅ Description
- ✅ Questions (prompt, helper text, placeholder)
- ✅ Question requirements (min/max words) - **NEW: Allow editing**
- ✅ Visibility flags (essential/advanced/programOnly) - **NEW: Allow editing**
- ❌ Origin (master/program/custom) - Read-only badge

**Implementation Notes:**
- When user edits a master/program template, create a custom copy
- Custom templates can be fully edited
- Store edits in `plan.customSections` and `plan.customDocuments`

---

## 4. Wiring Preview with Sections, AI Assistant, and Data

### Current State
- Preview shows rendered document
- AI Assistant is in separate right panel
- Data panel is in separate right panel
- No live connection between them

### Proposed Integration (Based on Architecture Docs)

#### 4.1 Preview-Section Connection

**Current:** Preview is static, sections are separate

**Proposed:**
- **Click section in preview** → Opens inline editor for that section (✅ Already implemented)
- **Scroll through preview** → Auto-updates active section (✅ Already implemented)
- **Section highlighting** → Active section/question highlighted in preview (✅ Already implemented)

**Enhancements Needed:**
- Add section/question IDs to preview HTML elements (✅ Already done via `data-section-id`, `data-question-id`)
- Ensure scroll detection works reliably
- Add visual indicators (badges, progress bars) in preview

#### 4.2 Preview-AI Assistant Connection

**Current:** AI suggestions are generic, not contextual to preview

**Proposed:**
- **Context Ribbon** in AI panel showing:
  - Current section title
  - Current question prompt
  - Prior answers from plan (for context)
- **Live Preview Updates**: When AI inserts text, preview updates in real-time
- **Preview-Aware Suggestions**: AI knows what's already in the document

**Implementation:**

**File: `features/editor/components/layout/Workspace/Right-Panel/AIPanel.tsx`**
- Add context ribbon component at top
- Include `section.title`, `question.prompt`, and `plan.sections` (prior answers)
- Pass full context to `sectionAiClient.ts`

**File: `features/editor/engine/sectionAiClient.ts`**
- Include section/question context in API payload
- Include prior answers from other sections
- Include program requirements if available

**File: `features/editor/components/Editor.tsx`**
- When AI suggestion is inserted, call `updateAnswer()` which triggers preview update
- Ensure preview re-renders on answer changes (✅ Already works)

#### 4.3 Preview-Data Connection

**Current:** Data (datasets, KPIs, media) are separate from preview

**Proposed:**
- **Inline Preview in Editor**: When user adds a dataset/KPI/media, show miniature preview in editor
- **Live Preview Updates**: Attachments appear in preview immediately
- **Click to Edit**: Clicking attachment in preview opens data panel

**Implementation:**

**File: `features/editor/components/layout/Workspace/Editor/InlineSectionEditor.tsx`**
- When dataset/KPI/media is attached, show inline preview
- Use `Table` component for datasets
- Use `Image` component for media
- Show KPI as formatted text

**File: `features/editor/components/layout/Workspace/Right-Panel/PreviewWorkspace.tsx`**
- Already renders attachments (✅ Implemented)
- Ensure attachments are clickable → opens data panel

**File: `features/editor/components/layout/Workspace/Right-Panel/DataPanel.tsx`**
- Add "Preview" mode showing how data will appear in document
- Show table preview for datasets
- Show image preview for media

#### 4.4 Making It "Really Live"

**Real-time Updates:**
1. ✅ Answer changes → Preview updates (already works)
2. ✅ Section selection → Preview scrolls to section (already works)
3. **NEW**: AI insertion → Preview updates immediately
4. **NEW**: Data attachment → Preview shows attachment immediately
5. **NEW**: Template changes → Preview reflects new structure

**Debouncing:**
- Preview updates should be debounced (every 2-3 seconds) to avoid performance issues
- Use `useDebounce` hook for answer changes

**Visual Feedback:**
- Show "Saving..." indicator when autosaving
- Show "Updating preview..." when preview is refreshing
- Highlight newly inserted content briefly

---

## 5. Template Flow & Testing

### 5.1 Full Flow: Select Product → Edit → Preview

**Step 1: Product Selection**
```
User lands on /editor
→ Sees TemplateOverviewPanel (Desktop)
→ Selects product type (Strategy/Review/Submission)
→ System loads base templates from features/editor/templates/sections.ts
```

**Step 2: Program Connection (Optional)**
```
User clicks "Connect Program"
→ Enters program URL or uses ProgramFinder
→ System fetches /api/programs/[id]/requirements
→ Merges program templates with base templates
→ Shows merged sections/documents in template columns
```

**Step 3: Template Customization**
```
User sees two columns: Documents + Sections
→ Can toggle sections/documents on/off
→ Can edit titles, descriptions, questions
→ Can add custom sections/documents
→ Clicks "Start editing"
```

**Step 4: Hydration**
```
System calls hydrate(product, context)
→ Merges base + program + custom templates
→ Converts templates → plan sections
→ Creates BusinessPlan object
→ Opens workspace
```

**Step 5: Editing**
```
User sees workspace: Sidebar + Preview
→ Clicks section in sidebar → Opens inline editor
→ Types answer → Preview updates in real-time
→ Uses AI/Data panels (now in sidebar) → Inserts content
→ Preview reflects all changes
```

**Step 6: Export**
```
User clicks export
→ System runs requirements checker
→ Shows validation results
→ Exports PDF with all sections/attachments
```

### 5.2 Testing Template: i2b Austria

**Template File:** `template_public_support_general_austria_de_i2b.txt`

**Structure:**
- Executive Summary (unnumbered)
- Section 2: Product/Service (with 6 subchapters)
- Section 3: Company & Management (with 6 subchapters)
- Section 4: Industry, Market & Competition (with 6 subchapters)
- Section 5: Marketing & Sales (with 4 subchapters)
- Section 6: Success & Financial Planning (with 5 subchapters)
- Appendix

**How It Should Work:**

1. **Upload Template**:
   - User uploads i2b template file
   - System extracts sections/questions via `features/editor/templates/api.ts`
   - Creates `SectionTemplate[]` with German prompts

2. **Template Merging**:
   - If user selected "Submission" product, base templates merge with i2b templates
   - Deduplication: If base has "Executive Summary" and i2b has "Executive Summary", merge them
   - Program-only sections tagged with `visibility: 'programOnly'`

3. **Editing**:
   - User can edit German prompts (translate to English if needed)
   - User can add/remove subchapters
   - User can reorder sections

4. **Preview**:
   - Preview shows sections in order
   - Subchapters numbered (2.1, 2.2, etc.)
   - Executive Summary unnumbered
   - Answers appear in preview as user types

5. **Export**:
   - Final document matches i2b structure
   - All sections included
   - Attachments in appendix

### 5.3 What Can Be Edited in Product/Sections

**Product Level:**
- ❌ Product type (Strategy/Review/Submission) - Selected at start, cannot change
- ✅ Program connection - Can change/disconnect
- ✅ Custom templates - Can add/remove

**Section Level (In Desktop):**
- ✅ Title
- ✅ Description
- ✅ Questions (prompt, helper text, placeholder)
- ✅ Enable/disable section
- ✅ Add/remove custom sections
- ❌ Question requirements (word counts) - **Should be editable** (see recommendations above)

**Section Level (In Workspace):**
- ✅ Answers (content)
- ✅ Question status (complete/draft/unknown)
- ✅ Attachments (datasets, KPIs, media)
- ❌ Cannot edit section structure (must go back to Desktop)

**Document Level:**
- ✅ Name
- ✅ Description
- ✅ Enable/disable
- ✅ Upload file
- ❌ Requirements (format, size) - **Should be editable** (see recommendations above)

### 5.4 How Edits Affect Preview Document

**Template Changes (Desktop):**
- Adding/removing sections → Preview structure changes
- Editing section titles → Preview shows new titles
- Editing questions → Preview shows new prompts (but answers remain)
- Disabling sections → Sections hidden in preview

**Content Changes (Workspace):**
- Answering questions → Content appears in preview
- Attaching data → Tables/images appear in preview
- Marking complete → Progress indicators update
- AI insertions → Content appears immediately

**Real-time Sync:**
- Preview updates on every answer change (debounced)
- Preview scrolls to active section
- Preview highlights active question
- Preview shows completion status

---

## 6. Implementation Priority

### Phase 1: Move Right Panel to Sidebar
1. Extend `Sidebar.tsx` with AI/Data panels
2. Remove `RightPanel` from `Editor.tsx`
3. Update props and state management
4. Test collapse/expand behavior

### Phase 2: Merge Workspace with Template Columns
1. Make `TemplateOverviewPanel` collapsible
2. Integrate into workspace layout
3. Keep product selector always visible
4. Test template editing while preview is visible

### Phase 3: Wire Preview with AI/Data
1. Add context ribbon to AI panel
2. Implement live preview updates for AI insertions
3. Add inline previews for data attachments
4. Test real-time synchronization

### Phase 4: Enhanced Editing Capabilities
1. Allow editing requirements (word counts, format, size)
2. Allow editing visibility flags
3. Improve template merging with deduplication
4. Test with i2b template

---

## 7. Key Files Reference

### Components to Modify:
- `features/editor/components/layout/Workspace/Main Editor/Sidebar.tsx` - Add AI/Data panels
- `features/editor/components/Editor.tsx` - Remove right panel, integrate template columns
- `features/editor/components/layout/Desktop/Desktop.tsx` - Make template columns embeddable
- `features/editor/components/layout/Workspace/Right-Panel/AIPanel.tsx` - Add context ribbon
- `features/editor/components/layout/Workspace/Right-Panel/DataPanel.tsx` - Add preview mode
- `features/editor/components/layout/Workspace/Editor/InlineSectionEditor.tsx` - Add inline data previews

### State Management:
- `features/editor/hooks/useEditorStore.ts` - May need new state for template panel expansion

### Templates:
- `features/editor/templates/sections.ts` - Base section templates
- `features/editor/templates/documents.ts` - Base document templates
- `features/editor/templates/api.ts` - Template extraction and merging

---

## 8. Questions for Implementation

1. **Right Panel to Sidebar**: Should AI/Data panels be always visible when section is selected, or should they be collapsible accordions?

2. **Template Columns**: Should they overlay the workspace or push content down? Overlay might be cleaner.

3. **Editing Requirements**: Should users be able to edit word counts/format requirements, or are these locked to templates?

4. **Live Updates**: What's the debounce time for preview updates? 2 seconds? 3 seconds?

5. **Context Ribbon**: How much prior context should AI see? All sections or just current section?

---

**Last Updated**: Current session  
**Status**: Planning phase - Ready for implementation

