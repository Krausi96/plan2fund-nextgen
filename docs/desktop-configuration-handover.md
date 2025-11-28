# Desktop Configuration & Workspace Simplification - Handover Document

## Current Status

### ✅ Completed Features
- Desktop panel with three-column layout (Deine Konfiguration, Deine Dokumente, Deine Abschnitte)
- Document selection filters sections in sidebar
- Sidebar navigation updates when documents are selected
- "Aktuelle Auswahl" summary bar with one-line layout
- Button to confirm selection and close desktop
- Translation support for German/English

---

## Critical Issues & Improvements Needed

### 1. Deine Konfiguration - Missing Comprehensive Descriptions

**Current State:**
- Basic description exists but doesn't explain the workflow clearly
- Users don't understand what happens when they select a plan type
- No explanation of what connecting a program does
- Missing guidance on template vs program selection

**Required Improvements:**

#### 1.1 Enhanced Description Text
Add a comprehensive description that explains:

```
When you select a Plan Type (Strategy, Review, Submission):
- The editor loads master templates with standard sections and documents
- Each product type has its own set of core sections (e.g., Executive Summary, Financial Plan)
- Core documents are automatically included (e.g., Budget, Work Plan)

When you connect a Program:
- Program-specific requirements are merged with master templates
- Additional sections may be added (marked with program badges)
- Program-specific documents appear in the documents list
- Requirements become stricter (e.g., word counts, mandatory fields)
- The editor highlights program-specific requirements with badges

Template vs Program:
- Templates = Base structure for your product type
- Program = Specific funding program (AWS, FFG, EU calls) that adds requirements
- You can use templates alone OR templates + program for program-specific applications
```

**Location:** `features/editor/components/layout/Desktop/DesktopConfigurator.tsx`
- Update the description text in the configurator
- Add tooltips or expandable info sections
- Consider adding a "Learn more" link to documentation

#### 1.2 Visual Indicators
- Show what's selected: Display selected plan type and program name prominently
- Show program impact: When a program is connected, display a summary of what it adds:
  - "This program adds 3 additional sections"
  - "2 program-specific documents required"
  - "Word count requirements: 500-2000 words per section"

**Implementation:**
```tsx
// Add after program connection
{programSummary && (
  <div className="mt-3 p-3 bg-blue-500/20 border border-blue-400/30 rounded-lg">
    <p className="text-xs font-semibold text-blue-200 mb-1">
      Program Impact: {programSummary.name}
    </p>
    <ul className="text-xs text-white/80 space-y-1">
      <li>• Adds {programSectionsCount} additional sections</li>
      <li>• Requires {programDocumentsCount} program-specific documents</li>
      <li>• Stricter validation rules apply</li>
    </ul>
  </div>
)}
```

---

### 2. Document/Section Cards - Clarify What Can Be Edited

**Current State:**
- Edit button exists but unclear what can be modified
- Users don't understand the difference between editing a template vs creating custom
- No explanation of what fields are editable

**Required Improvements:**

#### 2.1 Edit Form Clarification
When clicking "Edit" on a document or section card, clearly show:

**For Sections:**
- ✅ Editable: Title, Description, Prompts/Questions, Word counts (min/max)
- ❌ Not editable: ID, Origin (master/program), Category (can be overridden with custom)
- ⚠️ Warning: Editing master/program sections creates a custom copy

**For Documents:**
- ✅ Editable: Name, Description, Format, Max size, Instructions
- ❌ Not editable: ID, Origin, Category (can be overridden)
- ⚠️ Warning: Editing master/program documents creates a custom copy

**Implementation:**
```tsx
// In DesktopTemplateColumns.tsx edit forms
<div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-400/30 rounded-lg">
  <p className="text-xs font-semibold text-yellow-200 mb-1">
    {item.origin === 'master' || item.origin === 'program' 
      ? '⚠️ Editing creates a custom copy'
      : '✏️ Editing custom template'}
  </p>
  <p className="text-xs text-white/70">
    {item.origin === 'master' || item.origin === 'program'
      ? 'This will create a custom version. The original template remains unchanged.'
      : 'You can modify this custom template freely.'}
  </p>
</div>
```

#### 2.2 Field Labels & Helpers
- Add helper text to each field explaining its purpose
- Show examples (e.g., "Format: PDF, DOCX, XLSX")
- Indicate required vs optional fields clearly

---

### 3. Workspace Simplification - Based on Guidance Documents

**Key Insights from Guidance:**
1. **Template System Simplification** - Master templates + program merge strategy
2. **Progressive Disclosure** - Program-only sections collapsed by default
3. **Two-Step Wizard** - Select → Review & Customize → Confirm
4. **Split-Pane Preview** - Real-time preview alongside editing
5. **Requirement Badges** - Visual indicators for validation status

#### 3.1 Current Workspace Issues

**Problem Areas:**
- No clear overview before entering workspace
- Users don't see what sections/documents will be included
- No way to preview section guidance before editing
- Requirements checker hidden in preview tab
- No visual indicators for requirement status

#### 3.2 Recommended Simplifications

**A. Template Overview Enhancement (Already Partially Implemented)**
✅ Current: Desktop shows sections and documents
❌ Missing: 
- Toggle for optional sections before entering workspace
- Preview of section guidance text
- Warning banner for hard requirements
- Summary of what program adds

**B. Workspace Layout Simplification**

**Current Structure:**
```
[Desktop Panel]
  ↓
[Sidebar] [Workspace] [Right Panel (AI/Data/Preview)]
```

**Proposed Structure (Based on Guidance):**
```
[Desktop Panel - Collapsed after confirmation]
  ↓
[Sidebar] [Split View: Editor | Preview] [AI/Data Drawer]
```

**Key Changes:**
1. **Move Preview Inline** - Instead of a tab, show preview as a second pane
2. **Requirements Badges** - Show on each question card (green/yellow/red)
3. **Autosave Indicators** - Show timestamp/spinner on question cards
4. **Progressive Disclosure** - Collapse program-only sections by default
5. **Context Ribbon** - Show current section/question context in AI panel

**C. Section Customization**

**Current:** Limited editing in Desktop
**Proposed:** Allow in-workspace customization
- Rename sections/questions
- Reorder via drag-and-drop
- Add custom questions
- Clone sections

---

## Implementation Plan

### Phase 1: Enhance Desktop Configuration (Priority: High)

**Tasks:**
1. ✅ Update description text in DesktopConfigurator
   - Explain plan type selection
   - Explain program connection
   - Show program impact summary
   
2. ✅ Add program impact display
   - Count of additional sections
   - Count of additional documents
   - Validation rule changes
   
3. ✅ Improve edit form clarity
   - Add warnings for master/program edits
   - Show editable vs non-editable fields
   - Add helper text to form fields

**Files to Modify:**
- `features/editor/components/layout/Desktop/DesktopConfigurator.tsx`
- `features/editor/components/layout/Desktop/DesktopTemplateColumns.tsx`

### Phase 2: Workspace Simplification (Priority: Medium)

**Tasks:**
1. **Template Overview Enhancement**
   - Add toggle for optional sections in Desktop
   - Add preview of section guidance
   - Add warning banner for hard requirements
   - Show summary of program additions

2. **Progressive Disclosure**
   - Tag program-only sections with `visibility: 'programOnly'`
   - Collapse program-only sections by default
   - Allow expansion when needed

3. **Requirement Badges**
   - Add severity badges to questions (green/yellow/red)
   - Show requirement status in sidebar
   - Add requirement summary bar

**Files to Modify:**
- `features/editor/components/layout/Desktop/Desktop.tsx`
- `features/editor/components/layout/Workspace/Main Editor/SectionWorkspace.tsx`
- `features/editor/components/layout/Workspace/Main Editor/Sidebar.tsx`

### Phase 3: Split-Pane Preview (Priority: Low - Future Enhancement)

**Tasks:**
1. Move preview from right panel to inline split-pane
2. Implement responsive split-pane component
3. Update preview to work inline vs full-width
4. Keep AI/Data as sliding drawers

**Files to Modify:**
- `features/editor/components/layout/Workspace/Main Editor/Workspace.tsx`
- `features/editor/components/layout/Workspace/Right-Panel/RightPanel.tsx`
- `features/editor/components/layout/Workspace/Right-Panel/PreviewWorkspace.tsx`

---

## Testing Requirements

### Desktop Configuration
- [ ] Test plan type selection shows correct templates
- [ ] Test program connection merges requirements correctly
- [ ] Test program impact display shows accurate counts
- [ ] Test edit forms show correct warnings
- [ ] Test custom section/document creation

### Workspace
- [ ] Test optional section toggles persist
- [ ] Test program-only sections collapse by default
- [ ] Test requirement badges update correctly
- [ ] Test sidebar navigation with filtered sections
- [ ] Test document selection filters sections

---

## Questions for Discussion

1. **Template Merging:**
   - Should we implement `mergeSections` utility as described in guidance?
   - How should we handle deduplication of questions?
   - Should program requirements override or supplement master templates?

2. **Progressive Disclosure:**
   - Should program-only sections be hidden or just collapsed?
   - How should users discover program-specific requirements?

3. **Custom Templates:**
   - Should users be able to save custom layouts as templates?
   - Where should custom templates be stored (userSettings vs plan state)?

4. **Workspace Layout:**
   - Should we implement split-pane preview now or later?
   - Should AI/Data be drawers or remain as tabs?

---

## Next Steps

1. **Immediate (This Sprint):**
   - Enhance DesktopConfigurator descriptions
   - Add program impact display
   - Improve edit form clarity

2. **Short-term (Next Sprint):**
   - Implement progressive disclosure for program-only sections
   - Add requirement badges to questions
   - Add toggle for optional sections in Desktop

3. **Long-term (Future):**
   - Implement split-pane preview
   - Add section customization in workspace
   - Build template library interface

---

## References

- Guidance Document: `Guidance for Simplifying the Templa.txt`
- Architecture Proposal: `1 Architecture & UX proposal.txt`
- Current Handover: `docs/desktop-workspace-handover.md`

