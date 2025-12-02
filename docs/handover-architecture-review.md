# Architecture Review: Simplified Editor Architecture

## **Document Purpose**
This document summarizes the architecture review and proposed implementation plan for simplifying the editor architecture, based on the review document provided.

---

## **Current Architecture Issues**

### **Problems Identified:**
1. **Complex Layout**: 3-column template overview + sidebar + preview + right panel
2. **Fragmented Editing**: AI and Data in separate right panel
3. **Context Switching**: Users must switch between panels
4. **Code Duplication**: Similar functionality across multiple components
5. **Large File Sizes**: Desktop.tsx (930 lines), DataPanel.tsx (1005 lines)

---

## **Proposed Architecture**

### **New Layout Structure:**
```
┌─────────────────────────────────────────────────────┐
│ TemplateOverviewPanel (Config only)                 │
│ [Plan Selection] [Program Connection]                │
└─────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────┐
│ MEINE DOKUMENTE (Horizontal Scrollable Bar)        │
│ [➕] [Doc1] [Doc2] [Doc3] ... →                     │
└─────────────────────────────────────────────────────┘
┌──────────┬──────────────────────────────────────────┐
│ UNIFIED  │ PREVIEW (Full Width)                     │
│ SIDEBAR  │                                          │
│          │ [Document Preview]                       │
│ DEINE    │                                          │
│ ABSCHNITTE│ [InlineEditor with AI+Data integrated] │
│          │                                          │
│ [+ Add]  │                                          │
│ [✓] 01   │                                          │
│ [✏️]     │                                          │
│ [●]      │                                          │
│ ...      │                                          │
└──────────┴──────────────────────────────────────────┘
```

### **Key Changes:**
1. **Documents Bar**: Horizontal scrollable row above preview
2. **Unified Sidebar**: Merge template management into existing Sidebar
3. **Removed Right Panel**: AI Assistant and Data merged into InlineSectionEditor
4. **Full Width Preview**: No right panel, preview takes full width

---

## **Component Structure**

### **Before (Current):**
```
- Desktop.tsx (930 lines)
- DesktopTemplateColumns.tsx (698 lines)
- Sidebar.tsx (205 lines)
- RightPanel.tsx (365 lines)
- DataPanel.tsx (1005 lines)
- InlineSectionEditor.tsx (695 lines)
Total: ~3,893 lines across 6 files
```

### **After (Proposed):**
```
- Desktop.tsx (reduced, config only)
- DocumentsBar.tsx (~200 lines) ✅ NEW
- Sidebar.tsx (enhanced, ~350 lines) ✅ ENHANCED
- InlineSectionEditor.tsx (enhanced, ~800 lines) ✅ ENHANCED
Total: ~1,350 lines across 4 files
```

**Reduction: ~65% less code, better organization**

---

## **Enhanced InlineSectionEditor Structure**

```
┌─────────────────────────────────────────────────────┐
│ InlineSectionEditor (320px width, expandable)      │
├─────────────────────────────────────────────────────┤
│ Header: [Section Title] [✕]                        │
├─────────────────────────────────────────────────────┤
│ Question Navigation: [1] [2] [3] ...                │
├─────────────────────────────────────────────────────┤
│ Question Card:                                      │
│   - Prompt + Helper Text                           │
│   - Textarea (Answer)                               │
│   - Actions: [Complete] [Skip]                      │
├─────────────────────────────────────────────────────┤
│ Tabs: [💬 AI] [📊 Data] [📋 Context]               │
├─────────────────────────────────────────────────────┤
│ AI Tab:                                             │
│   - Quick Actions: [Draft] [Improve] [Suggest Data]│
│   - Chat Interface (conversational)                 │
│   - Suggestions History                             │
│   - Insert/Copy buttons                             │
├─────────────────────────────────────────────────────┤
│ Data Tab:                                           │
│   - Quick Add: [Table] [KPI] [Media]               │
│   - Library (filtered by section)                   │
│   - Attach to Question                              │
├─────────────────────────────────────────────────────┤
│ Context Tab:                                        │
│   - Requirements Validation                         │
│   - Related Sections                                │
│   - Program Requirements                            │
└─────────────────────────────────────────────────────┘
```

---

## **User Journey Scenarios**

### **Scenario 1: Starting with Template**
1. User uploads/selects template
2. Documents bar shows: [Core Product] [Work Plan] [Budget] [Team CV] ...
3. Sidebar shows: All sections from template
4. User clicks "Work Plan" document → Sidebar filters sections
5. User clicks section "Implementation Planning" → InlineEditor opens
6. User types answer → Clicks "💬 AI" tab → Conversational interface
7. AI provides context-aware suggestions
8. User clicks "📊 Data" tab → Creates/attaches data
9. User continues editing with AI and data support

### **Scenario 2: Section-by-Section Completion**
1. User clicks section → InlineEditor opens
2. Question appears → User types answer
3. User clicks "💬 AI" → AI suggests improvements based on template
4. User clicks "📊 Data" → Creates dataset
5. User attaches data → Data appears in answer context
6. AI references attached data in conversation
7. User marks question complete → Moves to next question

### **Scenario 3: Data-Driven Sections**
1. User clicks section → InlineEditor opens
2. User clicks "📊 Data" first (before writing)
3. Creates datasets: "Gründungskosten", "Investitionskosten"
4. Fills in data
5. User clicks "💬 AI" → AI suggests additional data points
6. User creates KPIs from datasets
7. User writes answer → References data naturally
8. AI helps structure answer using the data

---

## **Functionality Improvements**

### **1. Unified Editing Experience**
- All editing in one place (InlineEditor)
- No context switching between panels
- AI and Data always available

### **2. Conversational AI**
- Chat interface instead of one-shot suggestions
- Context-aware responses
- Can ask follow-up questions
- Remembers conversation history per question

### **3. Smart Data Integration**
- AI suggests data structures based on question
- Data creation flows naturally from writing
- Attached data appears in answer context
- KPIs auto-suggested from datasets

### **4. Template Compliance**
- AI ensures answers meet template requirements
- Real-time validation
- Suggestions based on template structure
- Cross-section consistency checks

### **5. Progressive Disclosure**
- Start with simple answer
- AI helps expand when needed
- Data added incrementally
- Requirements checked on-demand

---

## **Implementation Phases**

### **Phase 1: Layout Restructuring** ✅ COMPLETE
- Created `DocumentsBar.tsx` component
- Moved documents from DesktopTemplateColumns to DocumentsBar
- Updated Editor.tsx layout
- Aligned DocumentsBar header with Sidebar header

### **Phase 2: Sidebar Enhancement** ✅ COMPLETE
- Added template management to Sidebar
- Merged section editing into Sidebar
- Added enable/disable, edit, origin badges

### **Phase 3: InlineEditor Enhancement** 🔴 TODO
- Add tabs: AI, Data, Context
- Integrate conversational AI interface
- Embed compact DataPanel
- Add Context tab (requirements, related content)

### **Phase 4: Remove RightPanel** 🔴 TODO
- Remove RightPanel component
- Update all references
- Adjust preview layout

### **Phase 5: Template Integration** 🔴 TODO
- Enhance AI to understand template structure
- Add template-specific suggestions
- Add cross-section awareness
- Add requirements validation

---

## **Key Benefits**

### **Code Quality:**
- 65% reduction in code
- Better organization
- Single source of truth for editing
- Easier maintenance

### **User Experience:**
- Unified editing interface
- No context switching
- Conversational AI guidance
- Integrated data management
- Template compliance built-in

### **Performance:**
- Fewer components to render
- Better state management
- Reduced re-renders
- Faster interactions

---

## **Technical Considerations**

### **State Management:**
- Template state flows from Desktop → Editor → Components
- InlineEditor manages its own tab state
- AI conversation history per question
- Data library filtered by section

### **Positioning:**
- InlineEditor positions between selected sections
- Stays visible during scroll
- Responsive to viewport changes

### **AI Integration:**
- Context-aware prompts
- Template structure in context
- Cross-section awareness
- Requirements validation

### **Data Management:**
- Section-scoped data library
- Quick add functionality
- Attach to question
- Visual data representation

---

## **Next Steps**

1. **Review Current Implementation**
   - Check Phase 1 & 2 completion
   - Review InlineSectionEditor current state
   - Identify gaps

2. **Implement Phase 3**
   - Add tab system
   - Integrate AI interface
   - Embed DataPanel
   - Add Context tab

3. **Implement Phase 4**
   - Remove RightPanel
   - Update layout
   - Test thoroughly

4. **Implement Phase 5**
   - Enhance AI with template context
   - Add cross-section awareness
   - Implement validation

---

## **Reference Documents**

1. **Architecture Proposal**: `c:\Users\kevin\Downloads\Reviewing the architecture document.txt`
   - Detailed UI mockups
   - User scenarios
   - Functionality improvements

2. **Phase 3-5 Handover**: `docs/handover-phase3-5.md`
   - Implementation details
   - File structure
   - Testing checklist

3. **InlineEditor Integration**: `docs/handover-inline-editor-ai-data-integration.md`
   - Detailed implementation plan
   - Code examples
   - Step-by-step guide

---

**This architecture review provides the foundation for implementing the simplified editor architecture. Follow the implementation phases and reference the detailed handover documents for specific implementation steps.**

