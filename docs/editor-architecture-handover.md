# Editor Architecture Handover - Layout & Integration Changes

## Overview
This document outlines the planned architectural changes to merge the Desktop template configuration with the Workspace, create a unified editing experience, and wire the preview with AI Assistant and Data panels for a truly live editing experience.

---

## 1. Moving Sections Column to Sidebar

### Current State
- **DesktopTemplateColumns.tsx** has two columns:
  - Column 1: Documents (left)
  - Column 2: Sections (right) - **This needs to move to Sidebar**
- **Sidebar.tsx** currently only shows plan sections (the actual content sections being edited)

### Proposed Solution

**Option A: Merge Sections into Sidebar (Recommended)**
1. **Enhance Sidebar.tsx** to show two modes:
   - **Template Mode** (when Desktop is expanded): Shows template sections from `DesktopTemplateColumns` with toggle/edit capabilities
   - **Workspace Mode** (when editing): Shows plan sections (current behavior)

2. **Implementation approach:**
   ```typescript
   // Sidebar.tsx - Add new props
   type SidebarProps = {
     mode: 'template' | 'workspace';
     // Template mode props
     templateSections?: SectionTemplate[];
     disabledSections?: Set<string>;
     onToggleSection?: (id: string) => void;
     onEditSection?: (section: SectionTemplate) => void;
     // Workspace mode props (existing)
     plan?: BusinessPlan;
     activeSectionId?: string | null;
     onSelectSection?: (sectionId: string) => void;
   };
   ```

3. **What happens to the gap?**
   - The right column in DesktopTemplateColumns will be removed
   - Documents column stays in Desktop
   - Sections move to Sidebar (left side)
   - The gap can be filled with:
     - **Option 1**: Expand Documents column to use more space
     - **Option 2**: Add a summary/overview panel showing selected sections count, requirements status
     - **Option 3**: Keep it minimal - just documents column

**Option B: Keep Sections in Desktop, Add to Sidebar Too**
- Show template sections in Sidebar when Desktop is expanded
- Keep sections column in Desktop for detailed editing
- Sidebar becomes a quick navigation/overview

**Recommendation**: Option A - cleaner separation, less duplication

---

## 2. Merging Workspace with TemplateColumns

### Current State
- **Desktop (TemplateOverviewPanel)**: Shows product selector, program connection, and template columns (Documents + Sections)
- **Workspace**: Shows Sidebar + Preview + Right Panel (AI/Data)
- These are separate - user clicks "Start editing" to switch from Desktop to Workspace

### Proposed Solution: Unified Layout

**Keep Product Selector, Merge Editing Capabilities**

1. **Top Bar (Always Visible)**:
   ```
   [Product Selector] [Program Connection] [Template Overview Toggle]
   ```
   - Product selector remains at top
   - Program connection stays
   - Add toggle to show/hide template overview

2. **Main Area - Two Modes**:

   **Mode 1: Template Configuration (Desktop Expanded)**
   ```
   [Sidebar: Template Sections] | [Documents Column] | [Preview: Empty/Placeholder]
   ```
   - Left: Sections from templates (moved from DesktopTemplateColumns)
   - Middle: Documents column (from DesktopTemplateColumns)
   - Right: Preview area (can show placeholder or current plan if exists)

   **Mode 2: Editing Workspace (Desktop Collapsed)**
   ```
   [Sidebar: Plan Sections] | [Preview + Inline Editor] | [Right Panel: AI/Data]
   ```
   - Left: Plan sections (current Sidebar behavior)
   - Center: Preview with inline editor
   - Right: AI Assistant / Data panel

3. **Implementation Strategy**:
   ```typescript
   // Editor.tsx
   const [desktopExpanded, setDesktopExpanded] = useState(true); // Start with template view
   const [showTemplateOverview, setShowTemplateOverview] = useState(true);
   
   // When user clicks "Start editing" or collapses desktop:
   // - setDesktopExpanded(false)
   // - Switch Sidebar from template mode to workspace mode
   // - Show preview + inline editor
   ```

4. **Smooth Transition**:
   - Use CSS transitions for layout changes
   - Preserve state when switching modes
   - Template changes apply immediately to preview

---

## 3. What Users Can Edit in Documents and Sections

### Current Editing Capabilities

**In Desktop (TemplateOverviewPanel):**

**Documents (DocumentTemplate):**
- ✅ **Name** - Can edit via DesktopEditForm
- ✅ **Description** - Can edit via DesktopEditForm
- ✅ **Toggle on/off** - Enable/disable for plan
- ✅ **Add custom documents** - Create new document templates
- ✅ **Remove custom documents** - Delete user-created documents
- ❌ **Requirements** - Not editable (from program/master templates)
- ❌ **Format/Size constraints** - Not editable (from program/master templates)

**Sections (SectionTemplate):**
- ✅ **Title** - Can edit via DesktopEditForm
- ✅ **Description** - Can edit via DesktopEditForm
- ✅ **Questions** - Can edit prompts, helper text, placeholders via DesktopEditForm
- ✅ **Toggle on/off** - Enable/disable for plan
- ✅ **Add custom sections** - Create new section templates
- ✅ **Remove custom sections** - Delete user-created sections
- ❌ **Required flag** - Not editable (from program/master templates)
- ❌ **Origin** - Not editable (master/program/custom is determined by system)

**Editing Flow:**
1. User clicks ✏️ edit button on section/document card
2. `DesktopEditForm` opens with current values
3. User modifies fields
4. On save:
   - If `origin === 'custom'`: Updates existing custom item
   - If `origin === 'master' | 'program'`: Creates a new custom copy, disables original
5. Changes stored in `useEditorStore` state (`customSections`, `customDocuments`)
6. On "Start editing" → `hydrate()` uses updated templates

### What Should Be Editable (Future Considerations)

Based on the architecture docs, consider adding:
- **Visibility flags**: `essential | advanced | programOnly` - Allow users to mark sections as optional/advanced
- **Severity levels**: For requirements validation (soft/hard)
- **Question reordering**: Drag-and-drop within sections
- **Section reordering**: Drag-and-drop in template overview
- **Word count limits**: Allow users to set min/max words per question
- **Question cloning**: Duplicate questions within sections

---

## 4. Wiring Preview with Sections, AI Assistant, and Data

### Current State
- **Preview**: Shows rendered document, updates on answer changes
- **AI Assistant**: Separate panel, can insert suggestions
- **Data Panel**: Separate panel, can attach datasets/KPIs/media
- **Sections**: Sidebar navigation, clicking opens inline editor

### Proposed: Live Integration

#### 4.1 Preview ↔ Sections Integration

**Current**: Preview shows full document, sections are separate navigation

**Proposed**: 
- **Click section in preview** → Opens inline editor for that section (✅ Already implemented)
- **Scroll through preview** → Active section updates automatically (✅ Already implemented)
- **Section highlighting**: Active section/question highlighted in preview
- **Section badges in preview**: Show completion status, requirement badges inline

**Implementation**:
```typescript
// PreviewWorkspace.tsx - Already has onSectionClick
// InlineSectionEditor.tsx - Already positioned relative to sections
// Editor.tsx - Already has scroll detection for section updates
```

#### 4.2 Preview ↔ AI Assistant Integration

**Current**: AI suggestions are inserted into editor, preview updates after

**Proposed: Live Co-Writing**
1. **Context Ribbon in AI Panel**:
   - Show current section title
   - Show current question prompt
   - Show previous answers from plan (last 2-3 sections)
   - This context feeds into AI suggestions

2. **Inline AI Suggestions in Preview**:
   - When AI generates suggestion, show it as a "ghost" overlay in preview
   - User can accept/reject directly in preview
   - Accepting inserts into editor, preview updates immediately

3. **AI Autocomplete**:
   - As user types, show AI suggestions inline (like GitHub Copilot)
   - Suggestions appear as gray text that can be accepted with Tab

**Implementation**:
```typescript
// AIPanel.tsx - Add context ribbon
const contextRibbon = {
  currentSection: activeSection?.title,
  currentQuestion: activeQuestion?.prompt,
  priorAnswers: plan.sections
    .slice(0, plan.sections.indexOf(activeSection))
    .map(s => ({ section: s.title, answers: s.questions.map(q => q.answer) }))
};

// sectionAiClient.ts - Include context in API calls
const payload = {
  ...existingPayload,
  context: {
    currentSection: contextRibbon.currentSection,
    currentQuestion: contextRibbon.currentQuestion,
    priorAnswers: contextRibbon.priorAnswers
  }
};
```

#### 4.3 Preview ↔ Data Panel Integration

**Current**: Data panel creates datasets/KPIs/media, user attaches to questions

**Proposed: Live Data Visualization**
1. **Inline Previews in Editor**:
   - When dataset/KPI/media attached, show miniature preview in editor
   - Table preview: Show first 3 rows
   - Image preview: Thumbnail
   - KPI preview: Value with target indicator

2. **Live Updates in Preview**:
   - When data changes, preview updates immediately
   - Tables render with actual data
   - Charts/graphs update in real-time

3. **Drag-and-Drop from Data Panel to Preview**:
   - Drag dataset/KPI/media from Data panel
   - Drop on question in preview
   - Automatically attaches and updates

**Implementation**:
```typescript
// DataPanel.tsx - Add drag handlers
const handleDragStart = (e: DragEvent, item: Dataset | KPI | MediaAsset) => {
  e.dataTransfer.setData('application/json', JSON.stringify(item));
};

// PreviewWorkspace.tsx - Add drop zone on questions
const handleDrop = (e: DragEvent, questionId: string) => {
  const item = JSON.parse(e.dataTransfer.getData('application/json'));
  attachToQuestion(questionId, item);
};
```

#### 4.4 Full Flow: Product Selection → Editing → Preview

**Step 1: Product Selection**
```
User lands on /editor
→ Shows TemplateOverviewPanel (Desktop)
→ User selects product type (Strategy/Review/Submission)
→ System loads base templates from features/editor/templates/sections.ts
```

**Step 2: Program Connection (Optional)**
```
User connects program (AWS, FFG, etc.)
→ System calls /api/programs/[id]/requirements
→ Merges program templates with base templates
→ Shows merged sections/documents in DesktopTemplateColumns
```

**Step 3: Template Customization**
```
User can:
- Toggle sections/documents on/off
- Edit section/document metadata (title, description, questions)
- Add custom sections/documents
- Reorder (future: drag-and-drop)

Changes stored in useEditorStore:
- customSections: SectionTemplate[]
- customDocuments: DocumentTemplate[]
- disabledSections: Set<string>
- disabledDocuments: Set<string>
```

**Step 4: Start Editing**
```
User clicks "Start editing"
→ handleTemplateUpdate() called
→ hydrate(product, context) called with:
  - disabledSectionIds
  - disabledDocumentIds
  - customSections
  - customDocuments
→ Templates converted to Plan Sections
→ BusinessPlan object created
→ Workspace mode activated
→ Preview shows empty/placeholder content
```

**Step 5: Editing with Live Preview**
```
User selects section in Sidebar
→ Inline editor appears in preview (positioned relative to section)
→ User types answer
→ updateAnswer() called
→ Preview updates in real-time (debounced)
→ AI Assistant shows context ribbon
→ Data Panel shows available datasets/KPIs/media
```

**Step 6: AI/Data Integration**
```
User clicks "AI Help"
→ AI panel opens with context ribbon
→ User asks question or requests suggestion
→ AI generates based on:
  - Current section/question
  - Prior answers in plan
  - Program requirements
→ Suggestion appears in editor
→ User accepts → Inserts into answer
→ Preview updates immediately

User attaches dataset/KPI/media
→ Item appears in preview as table/chart/image
→ Updates in real-time when data changes
```

**Step 7: Requirements Validation**
```
Background validation runs:
→ Checks word counts
→ Checks required fields
→ Checks attachments
→ Shows badges on questions (green/yellow/red)
→ Summary bar shows overall status
```

---

## 5. Testing the Template Flow

### Test Case: i2b Austria Template

**Template File**: `template_public_support_general_austria_de_i2b.txt`

**Structure**:
- Executive Summary
- Product/Service (6 sub-sections)
- Company & Management (6 sub-sections)
- Industry, Market & Competition (6 sub-sections)
- Marketing & Sales (4 sub-sections)
- Financial Planning (6 sub-sections)
- Appendix

**How to Test**:

1. **Load Template**:
   ```typescript
   // In Desktop.tsx or template extraction API
   const templateText = await loadTemplateFile('template_public_support_general_austria_de_i2b.txt');
   const extractedSections = extractSectionsFromTemplate(templateText);
   // Returns SectionTemplate[] with German prompts
   ```

2. **Merge with Base Template**:
   ```typescript
   const baseSections = getSections('submission', 'grants');
   const programSections = extractedSections;
   const merged = mergeSections(baseSections, programSections);
   // Deduplicates, preserves program-specific wording
   ```

3. **Display in Desktop**:
   - Sections appear in Sidebar (template mode)
   - User can toggle, edit, reorder
   - Shows origin badges (program vs master)

4. **Hydrate to Plan**:
   - Each SectionTemplate → Section in plan
   - Each question → Question in plan
   - German prompts preserved
   - Preview renders in German

5. **Edit and Preview**:
   - User answers questions in German
   - Preview shows formatted German business plan
   - AI Assistant can work in German (if configured)
   - Data attachments work the same

---

## 6. Implementation Checklist

### Phase 1: Move Sections to Sidebar
- [ ] Add `mode` prop to Sidebar component
- [ ] Implement template mode in Sidebar
- [ ] Remove sections column from DesktopTemplateColumns
- [ ] Update Desktop.tsx to pass template sections to Sidebar
- [ ] Handle the gap (expand documents or add summary panel)
- [ ] Test template editing in Sidebar

### Phase 2: Merge Workspace with Desktop
- [ ] Keep product selector at top
- [ ] Add template overview toggle
- [ ] Implement two-mode layout (template config vs editing)
- [ ] Smooth transitions between modes
- [ ] Preserve state when switching
- [ ] Test full flow: select → configure → edit

### Phase 3: Enhance Editing Capabilities
- [ ] Document what's editable (current state)
- [ ] Add visibility flags to sections
- [ ] Add severity levels to questions
- [ ] Implement drag-and-drop reordering
- [ ] Add question cloning
- [ ] Test all editing scenarios

### Phase 4: Live Preview Integration
- [ ] Enhance AI context ribbon
- [ ] Add inline AI suggestions in preview
- [ ] Implement AI autocomplete
- [ ] Add data previews in editor
- [ ] Implement drag-and-drop from Data panel
- [ ] Test live updates

### Phase 5: Template Testing
- [ ] Test i2b Austria template extraction
- [ ] Test template merging
- [ ] Test German language support
- [ ] Test full editing flow with template
- [ ] Verify preview renders correctly

---

## 7. Key Files Reference

### Components to Modify
- `features/editor/components/layout/Workspace/Main Editor/Sidebar.tsx` - Add template mode
- `features/editor/components/layout/Desktop/DesktopTemplateColumns.tsx` - Remove sections column
- `features/editor/components/Editor.tsx` - Merge Desktop and Workspace
- `features/editor/components/layout/Workspace/Right-Panel/AIPanel.tsx` - Add context ribbon
- `features/editor/components/layout/Workspace/Right-Panel/DataPanel.tsx` - Add drag handlers
- `features/editor/components/layout/Workspace/Right-Panel/PreviewWorkspace.tsx` - Add drop zones

### State Management
- `features/editor/hooks/useEditorStore.ts` - Template state, editing state
- `features/editor/hooks/useEditorActions.ts` - Actions for template/editing

### Templates
- `features/editor/templates/sections.ts` - Base section templates
- `features/editor/templates/documents.ts` - Base document templates
- `features/editor/templates/api.ts` - Template merging functions

---

## 8. Questions for Next Developer

1. **Sections in Sidebar**: Should template sections and plan sections be in the same Sidebar (with mode switching) or separate components?

2. **Gap Handling**: What should fill the gap when sections column is removed? Expand documents, add summary panel, or keep minimal?

3. **Template Mode**: Should template configuration be always visible (collapsible) or completely separate from workspace?

4. **AI Context**: How much prior context should AI remember? All sections or just last 2-3?

5. **Data Previews**: Should data previews be inline in editor, in preview, or both?

6. **Template Language**: How should we handle multi-language templates (German, English)? Should AI work in template language?

---

**Last Updated**: Current session  
**Status**: Planning phase - ready for implementation

