# Handover: Editor Refactoring - Phases 3-5

## **Status: Phases 1 & 2 Complete ✅**

### **Completed Work**

#### **Phase 1: Layout Restructuring ✅**
- ✅ Created `DocumentsBar.tsx` component (horizontal scrollable documents bar)
- ✅ Moved documents UI from `DesktopTemplateColumns.tsx` to `DocumentsBar.tsx`
- ✅ Updated `Editor.tsx` to render DocumentsBar above preview area
- ✅ DocumentsBar header aligned with Sidebar header height
- ✅ Restored original document card design (icon cards, 140px width)
- ✅ Added document management: add, edit, toggle, remove

#### **Phase 2: Sidebar Enhancement ✅**
- ✅ Merged template management (from Column 3) into `Sidebar.tsx`
- ✅ Added section cards with checkboxes, edit buttons, origin badges
- ✅ Sections display as 1-column grid (as requested)
- ✅ Section count shows ALL sections (not just filtered)
- ✅ Added section management: add, edit, toggle, remove
- ✅ Integrated `DesktopEditForm` for editing sections/documents

#### **Additional Fixes ✅**
- ✅ Fixed DesktopConfigurator sizing (full width, larger text)
- ✅ Fixed DocumentsBar add button width issue
- ✅ Fixed section counting to always show total count

---

## **Current Architecture**

### **File Structure**
```
features/editor/components/layout/
├── Desktop/
│   ├── Desktop.tsx (config only, ~1017 lines)
│   ├── DesktopConfigurator.tsx (full width, enhanced)
│   └── DesktopEditForm.tsx (shared edit form)
├── Workspace/
│   ├── DocumentsBar/
│   │   └── DocumentsBar.tsx (~334 lines) ✅ NEW
│   ├── Main Editor/
│   │   └── Sidebar.tsx (~686 lines) ✅ ENHANCED
│   └── Editor/
│       └── InlineSectionEditor.tsx (needs enhancement)
└── Right-Panel/ (to be removed in Phase 4)
    ├── RightPanel.tsx
    ├── DataPanel.tsx
    └── AIPanel.tsx (if exists)
```

### **State Management Flow**
```
Desktop.tsx (Template State Source)
  ↓ onTemplateStateExposed callback
Editor.tsx (State Distributor)
  ↓ props
DocumentsBar.tsx + Sidebar.tsx (Consumers)
```

**Key State:**
- `templateState` in `Editor.tsx` receives template management data from `Desktop.tsx`
- DocumentsBar and Sidebar receive filtered documents/sections, handlers, and metadata
- All template management logic remains in `Desktop.tsx` (single source of truth)

---

## **Layout Adjustments Required** 🔴 TODO

### **New Layout Requirements:**

#### **1. DocumentsBar Alignment & Product Selector Repositioning**
- **"Deine Dokumente" should start at the same width as the preview area** (after right panel removal)
  - Currently DocumentsBar is full width; needs to align with preview start position
  - DocumentsBar left edge = Preview left edge (both start after sidebar)
- **Product Selector Repositioning:**
  - Extract product selector from `DesktopConfigurator.tsx`
  - Position it **next to "Deine Dokumente"** (horizontal layout, same row)
  - Place it **above "Deine Abschnitte"** sidebar
  - This creates a more compact, organized layout

#### **2. Sidebar Width Increase**
- **"Deine Abschnitte" sidebar should be wider** (currently 280px)
- Suggested: **320-360px** to accommodate template management better
- This gives more space for section cards and controls

#### **3. Document Cards Features** ✅ Already Implemented
- Documents already have:
  - **Blue checkbox** for enable/disable (top right)
  - **Pencil icon (✏️)** for editing (top right)
  - **Origin badge** (shows document source)
  - **Remove button (×)** for custom documents (on hover)
- These features are working; no changes needed

#### **Proposed Layout Structure:**
```
┌─────────────────────────────────────────────────────────────┐
│ DEINE KONFIGURATION (Full Width)                            │
│ [Plan Selection] [Program Connection]                        │
└─────────────────────────────────────────────────────────────┘
┌──────────────────────┬──────────────────────────────────────┐
│ DEINE DOKUMENTE       │ [Product Selector]                  │
│ (starts at sidebar)  │ [Dropdown/Selector]                  │
│ [Horizontal Scroll]   │                                      │
│ [➕] [Doc1] [Doc2]... │                                      │
└──────────────────────┴──────────────────────────────────────┘
┌──────────────────────┬──────────────────────────────────────┐
│ DEINE ABSCHNITTE     │ PREVIEW (Full Width)                 │
│ (Wider: 320-360px)   │                                       │
│ [Section Cards]      │ [Document Preview]                   │
│                      │ [InlineEditor when active]           │
└──────────────────────┴──────────────────────────────────────┘
```

**Key Alignment:**
- DocumentsBar left edge = Sidebar right edge = Preview left edge
- Product Selector aligns with DocumentsBar (same row, right side)
- Sidebar is wider (320-360px) for better section card display

#### **Files to Modify:**
- `features/editor/components/Editor.tsx` (layout structure)
- `features/editor/components/layout/Workspace/DocumentsBar/DocumentsBar.tsx` (width adjustment, start position)
- `features/editor/components/layout/Workspace/Main Editor/Sidebar.tsx` (width increase: 280px → 320-360px)
- `features/editor/components/layout/Desktop/DesktopConfigurator.tsx` (extract product selector component)

#### **Implementation Steps:**
1. **Extract Product Selector:**
   - Create new component `ProductSelector.tsx` (or similar)
   - Extract product selection UI from `DesktopConfigurator.tsx`
   - Keep it as a reusable component

2. **Update Editor.tsx Layout:**
   - Create new layout structure:
     - Row 1: DocumentsBar (starts at sidebar width) + ProductSelector (side by side)
     - Row 2: Sidebar (wider: 320-360px) + Preview (full width, starts after sidebar)
   - Ensure alignment: DocumentsBar left edge = Preview left edge

3. **Adjust DocumentsBar:**
   - Change from `w-full` to start at sidebar width
   - Use `ml-[320px]` or `ml-[360px]` (depending on sidebar width)
   - Or use flexbox/grid to align properly

4. **Increase Sidebar Width:**
   - Change from `w-[280px]` to `w-[320px]` or `w-[360px]`
   - Update collapsed width if needed
   - Test that section cards display well with new width

5. **Position Product Selector:**
   - Place in same row as DocumentsBar
   - Position above Sidebar (vertically aligned)
   - Ensure responsive behavior

#### **Visual Reference:**
See the architecture document (`c:\Users\kevin\Downloads\Reviewing the architecture document.txt`) for detailed UI mockups showing:
- DocumentsBar with checkboxes and pencil icons (already implemented ✅)
- Product selector positioning
- Sidebar width and section cards

---

## **Remaining Work: Phases 3-5**

### **Phase 3: Merge AI Assistant & Data Tab into InlineEditor** 🔴 TODO

#### **Current State:**
- `InlineSectionEditor.tsx` exists but has separate AI/Data buttons
- `RightPanel.tsx` contains AI and Data functionality
- `DataPanel.tsx` is a large component (~1005 lines)

#### **Required Changes:**

1. **Add Tab System to InlineSectionEditor**
   ```tsx
   // Add tab state
   const [activeTab, setActiveTab] = useState<'ai' | 'data' | 'context'>('ai');
   
   // Replace AI/Data buttons with tabs
   <div className="flex gap-1 border-b border-white/20">
     <button onClick={() => setActiveTab('ai')}>💬 AI</button>
     <button onClick={() => setActiveTab('data')}>📊 Data</button>
     <button onClick={() => setActiveTab('context')}>📋 Context</button>
   </div>
   ```

2. **Integrate Conversational AI Interface**
   - Move AI functionality from `RightPanel` to InlineEditor
   - Replace one-shot suggestions with chat interface
   - Add conversation history per question
   - Implement context-aware responses
   - Add quick actions: "Draft", "Improve", "Suggest Data"

3. **Embed Compact DataPanel**
   - Extract core DataPanel functionality
   - Create compact version for InlineEditor
   - Keep: Quick Add (Table, KPI, Media), Library, Attach to Question
   - Remove: Full-width layout, excessive spacing

4. **Add Context Tab**
   - Requirements validation (template compliance)
   - Related sections (cross-references)
   - Program requirements (if program connected)
   - Section metadata (word count, completion status)

#### **Files to Modify:**
- `features/editor/components/layout/Workspace/Editor/InlineSectionEditor.tsx`
- `features/editor/components/layout/Right-Panel/DataPanel.tsx` (extract functionality)
- `features/editor/components/layout/Right-Panel/RightPanel.tsx` (reference for AI implementation)

#### **Key Considerations:**
- Maintain existing AI/Data functionality while improving UX
- Keep InlineEditor width at ~320px (expandable if needed)
- Ensure tabs don't overwhelm the editor
- Preserve question navigation and answer textarea prominence

---

### **Phase 4: Remove RightPanel** 🔴 TODO

#### **Current State:**
- `RightPanel.tsx` is still rendered in `Editor.tsx`
- AI and Data functionality needs to be fully migrated to InlineEditor first

#### **Required Changes:**

1. **Update Editor.tsx Layout**
   ```tsx
   // Remove RightPanel import and usage
   // Change preview width from calc(100% - sidebar - rightpanel) to calc(100% - sidebar)
   // IMPORTANT: After removing right panel, ensure DocumentsBar aligns with preview:
   // - DocumentsBar should start at sidebar width (not full width)
   // - Preview should start at sidebar width
   // - Both should have same left edge alignment
   ```

2. **Layout Alignment After RightPanel Removal:**
   - DocumentsBar: Change from full width to start at sidebar width
   - Preview: Already starts at sidebar width, but verify after right panel removal
   - Ensure DocumentsBar left edge = Preview left edge

2. **Remove RightPanel Component**
   - Delete `features/editor/components/layout/Right-Panel/RightPanel.tsx`
   - Delete `features/editor/components/layout/Right-Panel/DataPanel.tsx` (after extraction)
   - Delete `features/editor/components/layout/Right-Panel/AIPanel.tsx` (if exists)

3. **Update All References**
   - Search codebase for `RightPanel` imports
   - Update any components that reference RightPanel
   - Remove RightPanel from state management if needed

4. **Adjust Preview Layout**
   - Preview should take full width (minus sidebar)
   - InlineEditor should position correctly without right panel
   - Ensure responsive behavior is maintained

#### **Files to Modify:**
- `features/editor/components/Editor.tsx` (main layout)
- `features/editor/components/layout/Workspace/PreviewWorkspace.tsx` (if exists)
- Any other components importing RightPanel

---

### **Phase 5: Template Integration Enhancements** 🔴 TODO

#### **Current State:**
- Basic template loading works
- AI doesn't have template-specific knowledge
- No cross-section awareness
- No requirements validation

#### **Required Changes:**

1. **Enhance AI with Template Context**
   - Pass template structure to AI context
   - Include section requirements in AI prompts
   - Add template-specific suggestions
   - Example: "Based on template_public_support_general_austria_de_i2b.txt, you need to include..."

2. **Add Cross-Section Awareness**
   - AI remembers previous sections in conversation
   - Suggest consistency checks ("In section 2.1 you mentioned X, should section 3.2 reference this?")
   - Cross-reference related sections

3. **Implement Requirements Validation**
   - Check if answers meet template requirements
   - Validate word counts (min/max)
   - Check required fields
   - Show validation in Context tab

4. **Template-Specific User Scenarios**
   - See architecture document for detailed scenarios
   - Implement conversational flow for template guidance
   - Progressive disclosure (start simple, AI helps expand)

#### **Files to Modify:**
- AI service/API integration (wherever AI calls are made)
- `InlineSectionEditor.tsx` (Context tab implementation)
- Template parsing/loading logic (if needed)

#### **Key Considerations:**
- Template structure should be accessible to AI
- Validation should be non-blocking (warnings, not errors)
- Cross-section awareness should be optional (performance)

---

## **Known Issues & Considerations**

### **Current Issues:**
1. ✅ **FIXED**: DocumentsBar add button was too wide (removed `w-full`)
2. ✅ **FIXED**: DesktopConfigurator not using full width (removed column constraints)
3. ✅ **FIXED**: Section count showing filtered instead of total (now uses `allSections`)

### **Potential Issues:**
1. **State Synchronization**: Ensure template state updates properly when documents/sections change
2. **Performance**: Large number of sections/documents might cause rendering issues
3. **Responsive Design**: Current layout assumes desktop; mobile might need adjustments
4. **Accessibility**: Tab navigation, keyboard shortcuts, screen readers

### **Design Decisions:**
- **1-column grid for sections**: User requested single column instead of 3-column
- **Full width configurator**: User wanted larger, more readable configuration panel
- **Icon cards**: Maintained original card design with icons
- **Horizontal documents bar**: Better use of space, easier scrolling

---

## **Testing Checklist**

### **Phase 3 Testing:**
- [ ] Tabs appear in InlineEditor
- [ ] AI tab shows conversational interface
- [ ] Data tab shows compact data panel
- [ ] Context tab shows requirements/related content
- [ ] Quick actions work (Draft, Improve, Suggest Data)
- [ ] Data can be attached to questions
- [ ] Conversation history persists per question

### **Phase 4 Testing:**
- [ ] RightPanel is completely removed
- [ ] Preview takes full width
- [ ] InlineEditor positions correctly
- [ ] No broken imports or references
- [ ] Layout is responsive

### **Phase 5 Testing:**
- [ ] AI references template structure
- [ ] Cross-section awareness works
- [ ] Requirements validation shows in Context tab
- [ ] Template-specific suggestions appear
- [ ] User scenarios from architecture doc work

---

## **Reference Documents**

1. **Architecture Proposal**: `c:\Users\kevin\Downloads\Reviewing the architecture document.txt`
   - Contains detailed UI mockups
   - User scenarios for template integration
   - Functionality improvements

2. **Phase 2 Documentation**: `docs/phase2-layout-visualization.md`
   - Layout changes visualization
   - Component structure

3. **Current Components**:
   - `features/editor/components/layout/Workspace/DocumentsBar/DocumentsBar.tsx`
   - `features/editor/components/layout/Workspace/Main Editor/Sidebar.tsx`
   - `features/editor/components/layout/Desktop/Desktop.tsx`
   - `features/editor/components/Editor.tsx`

---

## **Next Steps for Colleague**

1. **Start with Phase 3** (highest priority)
   - Review `InlineSectionEditor.tsx` current implementation
   - Review `RightPanel.tsx` and `DataPanel.tsx` to understand existing functionality
   - Plan tab structure and component extraction
   - Implement tabs first, then migrate AI, then Data, then Context

2. **After Phase 3 Complete → Phase 4**
   - Remove RightPanel only after confirming all functionality is migrated
   - Test thoroughly before deletion

3. **After Phase 4 Complete → Phase 5**
   - Work with AI/backend team to understand template context passing
   - Implement gradually (template context → cross-section → validation)

4. **Questions?**
   - Check architecture document for detailed scenarios
   - Review existing code for patterns
   - Test with actual templates (e.g., `template_public_support_general_austria_de_i2b.txt`)

---

## **Code Quality Notes**

- **TypeScript**: All components are typed; maintain type safety
- **i18n**: Use `useI18n()` hook for translations
- **Styling**: Tailwind CSS, maintain consistent spacing/colors
- **State Management**: Template state flows from Desktop → Editor → Components
- **Error Handling**: Add try-catch for API calls, user-friendly error messages

---

**Good luck with the implementation! 🚀**

