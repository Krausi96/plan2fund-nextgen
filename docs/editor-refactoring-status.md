# Editor Refactoring Status & Implementation Plan

**Last Updated:** Current Date  
**Status:** Planning Phase - No Implementation Yet

## Original Requirements (From First Message)

### 1. Unified Sidebar Integration
**Requirement:** Merge "Meine Dokumente" column (from TemplateOverviewPanel) with "Deine Abschnitte" sidebar into a single unified sidebar:
- Horizontal scrollable bar for documents at the top
- Vertical tree for sections below
- Both document and section columns should be integrated into the sidebar
- Remove sections column from TemplateOverviewPanel

**Status:** ❌ **NOT STARTED**

**Current State:**
- Documents column exists in `DesktopTemplateColumns.tsx` (TemplateOverviewPanel)
- Sections column exists in `DesktopTemplateColumns.tsx` (TemplateOverviewPanel)
- Sidebar (`Sidebar.tsx`) only shows sections tree
- No document selection in sidebar

**What Needs to Be Done:**
- [ ] Move document cards from `DesktopTemplateColumns` to `Sidebar.tsx`
- [ ] Add horizontal scrollable document section at top of Sidebar
- [ ] Keep vertical sections tree below documents
- [ ] Remove documents and sections columns from `DesktopTemplateColumns.tsx`
- [ ] Update `TemplateOverviewPanel` to only show "Deine Konfiguration" (Config column)
- [ ] Update `Editor.tsx` to load documents and pass to Sidebar
- [ ] Implement document selection logic
- [ ] Add template management (enable/disable, edit, remove) to sections in Sidebar

---

### 2. Integrated Inline Editor (AI & Data Tabs)
**Requirement:** Merge Data tab & AI Assistant functionalities into `InlineSectionEditor.tsx`:
- Remove right panel entirely
- Add tabs (Editor, AI, Data) within InlineSectionEditor
- AI and Data features appear inline with preview
- Remove `RightPanel.tsx` component

**Status:** ❌ **NOT STARTED**

**Current State:**
- `RightPanel.tsx` still exists and is actively used
- `InlineSectionEditor.tsx` has buttons for "AI Help" and "Data" that trigger callbacks
- Callbacks open the RightPanel (`onAIHelp`, `onDataHelp`)
- RightPanel slides in from right when opened
- AI Assistant and DataPanel are separate components in RightPanel

**What Needs to Be Done:**
- [ ] Add tab system to `InlineSectionEditor.tsx` (Editor, AI, Data tabs)
- [ ] Integrate AI Assistant UI from `RightPanel.tsx` into InlineSectionEditor 'ai' tab
- [ ] Integrate `DataPanel.tsx` component into InlineSectionEditor 'data' tab
- [ ] Update `InlineSectionEditor` props to include:
  - `onAttachDataset`, `onAttachKpi`, `onAttachMedia`
  - `onAskAI` for AI suggestions
- [ ] Remove `RightPanel` import and usage from `Editor.tsx`
- [ ] Remove `isRightPanelOpen` state and `rightPanelView` state from Editor
- [ ] Update `onAIHelp` and `onDataHelp` callbacks to switch tabs instead of opening panel
- [ ] Adjust editor maxHeight when AI/Data tabs are active
- [ ] Delete or deprecate `RightPanel.tsx` component

---

### 3. Editable Data at Document & Section Levels
**Requirement:** Clarify what data should be editable:
- When clicking on a document - what should be editable?
- At section level - how to make it conversational and work with inlined editor merge?
- How does this affect the editor?

**Status:** ❓ **NEEDS CLARIFICATION**

**Current State:**
- Document templates exist but no document-level editing UI
- Section-level editing happens through InlineSectionEditor
- Questions within sections are editable
- No clear document-level data editing interface

**What Needs to Be Done:**
- [ ] Define document-level editable properties (metadata, settings, etc.)
- [ ] Design document-level editing UI (modal, inline, or separate panel?)
- [ ] Determine how document selection affects section visibility/filtering
- [ ] Clarify "conversational" editing approach for sections
- [ ] Integrate document-level editing with unified sidebar
- [ ] Update editor state management for document-level data

---

### 4. Template Integration
**Requirement:** Integrate content from template file:
- `template_public_support_general_austria_de_i2b.txt`
- How AI Assistant and Data tab can merge with inline section editor
- How this simplifies user's life compared to static template

**Status:** ❌ **NOT STARTED**

**Current State:**
- Template file exists but not integrated
- Template structure not mapped to editor sections
- No progressive disclosure based on template
- No contextual AI assistance based on template requirements

**What Needs to Be Done:**
- [ ] Parse template file structure
- [ ] Map template sections to editor sections
- [ ] Pre-populate questions from template
- [ ] Implement progressive disclosure for sections
- [ ] Add contextual AI assistance based on template requirements
- [ ] Create template loading/import functionality
- [ ] Integrate template requirements with requirements validation

---

## Implementation Priority (As Requested)

### Phase 1: Fix Lint Errors ✅
**Status:** ✅ **COMPLETE** (was done, then restored)

### Phase 2: Integrate AI/Data into Inline Editor ❌
**Status:** ❌ **NOT STARTED** (code was restored)

### Phase 3: Remove Right Panel ❌
**Status:** ❌ **NOT STARTED** (code was restored)

### Phase 4: Unified Sidebar ❌
**Status:** ❌ **NOT STARTED**

### Phase 5: Template Integration ❌
**Status:** ❌ **NOT STARTED**

---

## Current Architecture

### Components Structure

```
Editor.tsx
├── TemplateOverviewPanel (Desktop.tsx)
│   ├── DesktopConfigurator (Config column)
│   └── DesktopTemplateColumns
│       ├── Documents Column
│       └── Sections Column
├── Workspace
│   ├── Sidebar.tsx (Sections tree only)
│   ├── PreviewWorkspace (Document preview)
│   ├── InlineSectionEditor (Question editor)
│   └── RightPanel (AI Assistant + Data Panel)
```

### Target Architecture

```
Editor.tsx
├── TemplateOverviewPanel (Desktop.tsx)
│   └── DesktopConfigurator (Config column only)
└── Workspace
    ├── Unified Sidebar
    │   ├── Documents (horizontal scroll)
    │   └── Sections (vertical tree with template management)
    ├── PreviewWorkspace (Document preview)
    └── InlineSectionEditor
        ├── Editor Tab
        ├── AI Tab (integrated AI Assistant)
        └── Data Tab (integrated DataPanel)
```

---

## Key Files to Modify

### High Priority
1. **`features/editor/components/layout/Workspace/Main Editor/Sidebar.tsx`**
   - Add documents section (horizontal scrollable)
   - Add template management to sections
   - Update props to accept documents and template management callbacks

2. **`features/editor/components/layout/Workspace/Editor/InlineSectionEditor.tsx`**
   - Add tab system (Editor, AI, Data)
   - Integrate AI Assistant UI
   - Integrate DataPanel component
   - Update props and state management

3. **`features/editor/components/Editor.tsx`**
   - Remove RightPanel import and usage
   - Load documents and pass to Sidebar
   - Update InlineSectionEditor props
   - Remove rightPanelView and isRightPanelOpen state

4. **`features/editor/components/layout/Desktop/DesktopTemplateColumns.tsx`**
   - Remove documents column
   - Remove sections column
   - Keep only template management logic if needed elsewhere

5. **`features/editor/components/layout/Desktop/Desktop.tsx`**
   - Update TemplateOverviewPanel to only show DesktopConfigurator
   - Remove DesktopTemplateColumns usage

### Medium Priority
6. **`features/editor/components/layout/Workspace/Right-Panel/RightPanel.tsx`**
   - Mark as deprecated
   - Eventually delete after migration complete

7. **`features/editor/components/layout/Workspace/Right-Panel/DataPanel.tsx`**
   - Ensure it can be used standalone (not just within RightPanel)
   - May need prop adjustments

---

## Technical Considerations

### State Management
- Documents need to be loaded and stored (currently in TemplateOverviewPanel)
- Document selection state needs to be managed
- Template management (enable/disable, edit, remove) needs to be accessible from Sidebar
- RightPanel state (`rightPanelView`, `isRightPanelOpen`) needs to be removed

### UI/UX
- Horizontal scrollable document cards in Sidebar
- Tab navigation within InlineSectionEditor
- Smooth transitions when switching between Editor/AI/Data tabs
- Template management UI in Sidebar (enable/disable, edit, remove buttons)

### Data Flow
- Documents: Load from `getDocuments()` → Pass to Sidebar → Handle selection
- Sections: Already in plan → Display in Sidebar → Add template management
- AI/Data: Move from RightPanel → Integrate into InlineSectionEditor tabs

---

## Next Steps

1. **Start with Phase 2 & 3** (as originally requested):
   - Integrate AI/Data tabs into InlineSectionEditor
   - Remove RightPanel

2. **Then Phase 4**:
   - Implement unified sidebar with documents and sections
   - Remove columns from TemplateOverviewPanel

3. **Finally Phase 5**:
   - Template integration
   - Progressive disclosure
   - Contextual AI assistance

---

## Notes

- All previous implementation attempts were restored to latest commit
- Documentation files (`layout-alignment-analysis.md`, `ui-functionality-adaptations.md`) contain detailed analysis and can be referenced
- Current codebase is in clean state, ready for implementation
- No breaking changes have been made yet

