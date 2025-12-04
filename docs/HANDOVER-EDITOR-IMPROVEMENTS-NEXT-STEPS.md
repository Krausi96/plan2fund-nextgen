# Handover: Editor Improvements & Next Steps

**Date:** 2024  
**Status:** Critical fixes completed, improvements needed  
**Priority:** High

---

## ✅ Completed Fixes

### 1. Hydration Issues - FIXED
**Problem:** Hydration mismatches when toggling sections/documents or opening/closing CurrentSelection configurator.

**Root Cause:** 
- `useState` was initialized with props that differed between server and client
- State was being set during render instead of after mount

**Solution Implemented:**
- Initialize state with `undefined`/`null` (same on server and client)
- Sync state with props only after mount using `useEffect` with `isMountedRef`
- Added suppression mechanism to prevent navigation during toggles

**Files Modified:**
- `features/editor/components/layout/Workspace/Navigation/CurrentSelection.tsx`
  - Lines 123-154: Added `isMountedRef` and sync logic
- `features/editor/components/Editor.tsx`
  - Lines 1170-1255: Added `suppressNavigationRef` and `lastUserSelectedSectionRef` to prevent unwanted navigation

### 2. Auto-Jump to Step 3 - FIXED
**Problem:** Configurator automatically jumped to Step 3 when product was selected.

**Solution:** Removed automatic `setActiveStep(3)` calls. Users now manually navigate between steps.

**Files Modified:**
- `features/editor/components/layout/Workspace/Navigation/CurrentSelection.tsx`
  - Lines 310-318: Removed auto-advance in `handleSelectProduct`
  - Lines 332-344: Removed auto-advance in `handleManualConnect`

### 3. Jump to Editor When Toggling - FIXED
**Problem:** InlineSectionEditor jumped when toggling sections/documents or closing CurrentSelection.

**Root Cause:** 
- `useEffect` was triggering hydration when `disabledSections` changed
- Hydration recreated the plan and reset `activeSectionId`, causing jumps

**Solution Implemented:**
- Prevent `handleTemplateUpdate` from running when configurator is open or navigation is suppressed
- Added `suppressNavigationRef` to prevent navigation during toggles
- Only update `editingSectionId` when change is from explicit user interaction

**Files Modified:**
- `features/editor/components/Editor.tsx`
  - Lines 560-630: Added checks to prevent hydration during toggles
  - Lines 643-662: Added suppression in `toggleSection`
  - Lines 1203-1255: Enhanced navigation suppression logic

### 4. DocumentsBar Form Cutoff - FIXED
**Problem:** Form text was cut off when adding documents.

**Solution:** Made form overlay with absolute positioning and increased container height when form is shown.

**Files Modified:**
- `features/editor/components/Editor.tsx`
  - Lines 1587-1595: Dynamic container height based on `showAddDocument`
- `features/editor/components/layout/Workspace/Content/DocumentsBar.tsx`
  - Lines 110-112: Changed to absolute positioned overlay

---

## 🔍 Next Steps & Open Questions

### 1. Product Document Finder

**Current State:**
- Product selection is a simple dropdown in CurrentSelection Step 1
- Three products: Submission, Review, Strategy
- No finder/helper to guide users

**Questions to Address:**
1. **Should we create a Product Finder similar to Program Finder?**
   - Program Finder exists at `/reco` route
   - Could ask questions to recommend best product
   - Would add complexity but improve onboarding

2. **How to add custom products?**
   - Currently only 3 hardcoded products
   - Need to define: Where to store custom products? How to configure them?
   - Should custom products have their own templates?

3. **How to simplify product selection search?**
   - Current dropdown might be sufficient for 3 products
   - If adding more products, search/filter would help
   - Consider: Tags, categories, use-case matching

**Recommendation:**
- **Short term:** Keep dropdown but add detailed tooltips/explanations for each product
- **Long term:** If product count grows, consider a finder similar to Program Finder

**Files to Review:**
- `features/editor/components/layout/Workspace/Navigation/CurrentSelection.tsx` (Step 1)
- `features/reco/components/ProgramFinder.tsx` (reference implementation)

---

### 2. Section Editing in CurrentSelection & Sidebar

**Current State:**
- Sections can be toggled on/off in both CurrentSelection Step 3 and Sidebar
- Sections can be edited via `SectionDocumentEditForm` in both places
- Editing opens a form that allows changing title and description

**Questions to Address:**

1. **Should sections have questions/keywords?**
   - Currently sections only have: `id`, `title`, `description`, `questions[]`
   - Questions are nested inside sections
   - **Missing:** Keywords/tags to describe what the section is about
   - **Use case:** Search, filtering, AI context, recommendations

2. **How should section editing work?**
   - Current: Edit form allows title/description changes
   - **Missing:** 
     - Edit questions within section
     - Add/remove questions
     - Edit question content
     - Keywords/tags for sections

3. **Should there be reordering of sections?**
   - Currently sections appear in template order
   - **Missing:** Drag-and-drop or up/down buttons to reorder
   - **Considerations:**
     - Where should reordering happen? (CurrentSelection Step 3, Sidebar, or both?)
     - Should reordering persist? (Save to plan metadata?)
     - How does it interact with special sections (Title Page, TOC, References, Appendices)?

**Recommendation:**
- **Keywords/Tags:** Add `keywords: string[]` to section template
- **Reordering:** Add drag-and-drop in CurrentSelection Step 3 (primary) and Sidebar (secondary)
- **Question editing:** Extend `SectionDocumentEditForm` to allow editing questions

**Files to Review:**
- `features/editor/components/shared/SectionDocumentEditForm.tsx`
- `features/editor/components/layout/Workspace/Navigation/CurrentSelection.tsx` (Step 3, lines 1205-1500)
- `features/editor/components/layout/Workspace/Navigation/Sidebar.tsx` (lines 194-205)

---

### 3. Program Template Integration

**Current Behavior:**
- When a program is connected in Step 2, templates are loaded based on `programId`
- Templates are filtered to show program-specific sections/documents
- Program-specific templates are merged with product templates

**Questions to Address:**

1. **How does adding a program template affect section order?**
   - Currently: Program sections are added after product sections
   - **Question:** Should program sections be inserted in a specific order?
   - **Question:** Should users be able to reorder after program is added?

2. **How does it connect to InlineSectionEditor?**
   - When a section is selected, `editingSectionId` is set
   - InlineSectionEditor receives `sectionId` prop and loads the section
   - **Current flow:**
     ```
     Sidebar/CurrentSelection → onSelectSection → setActiveSection → 
     useEffect → setEditingSectionId → InlineSectionEditor receives sectionId
     ```
   - **Question:** Should program-specific sections have different editing behavior?
   - **Question:** Should there be visual indicators for program-specific sections in the editor?

3. **What happens when program is disconnected?**
   - Currently: Program sections remain but are marked as disabled
   - **Question:** Should program sections be removed or kept as custom sections?
   - **Question:** How to handle custom sections added from program templates?

**Files to Review:**
- `features/editor/components/Editor.tsx` (lines 197-217: hydration logic)
- `features/editor/hooks/useEditorStore.ts` (lines 246-359: hydrate function)
- `features/editor/components/layout/Workspace/Content/InlineSectionEditor.tsx` (lines 137-162: props)

---

### 4. InlineSectionEditor Connection

**Current Architecture:**
- `InlineSectionEditor` receives `sectionId` prop from `Editor.tsx`
- `sectionId` comes from `editingSectionId` state
- `editingSectionId` is set by the auto-activate effect in `Editor.tsx`

**Connection Points:**
1. **Sidebar click** → `handleSectionSelect('user')` → `setActiveSection` → `useEffect` → `setEditingSectionId`
2. **CurrentSelection Step 3 toggle** → `toggleSection` → `setDisabledSections` → (suppressed, no navigation)
3. **Preview click** → `handleSectionSelect('preview')` → `setActiveSection` → `useEffect` → `setEditingSectionId`

**Questions:**
1. **Should InlineSectionEditor show different UI for program-specific sections?**
   - Currently: Same UI for all sections
   - Could add badges, different styling, or program-specific help text

2. **How should section metadata (keywords, tags) be displayed in InlineSectionEditor?**
   - Currently: Only shows section title and questions
   - Could add: Keywords display, tags, section description

3. **Should InlineSectionEditor allow editing section metadata?**
   - Currently: Only edits questions
   - Could add: Edit section title, description, keywords inline

**Files to Review:**
- `features/editor/components/layout/Workspace/Content/InlineSectionEditor.tsx`
- `features/editor/components/Editor.tsx` (lines 1723-1750: PreviewWorkspace connection)

---

## 🏗️ Technical Architecture

### State Flow
```
Editor.tsx (templateState)
  ├── CurrentSelection (Step 3)
  │   └── allSections, disabledSections, onToggleSection
  ├── Sidebar
  │   └── allSections, disabledSections, onToggleSection, onEditSection
  └── DocumentsBar
      └── allDocuments, disabledDocuments, onToggleDocument

Editor.tsx (activeSectionId, editingSectionId)
  └── InlineSectionEditor
      └── sectionId prop → loads section from plan
```

### Key Mechanisms
1. **Suppression System:** `suppressNavigationRef` prevents unwanted navigation during toggles
2. **Source Tracking:** `sectionChangeSourceRef` tracks if change is from user, scroll, or preview
3. **Hydration Control:** `hydrationInProgress` and `isConfiguratorOpen` prevent hydration during configuration

---

## 📝 Implementation Notes

### Adding Keywords to Sections
```typescript
// In SectionTemplate type
interface SectionTemplate {
  id: string;
  title: string;
  description: string;
  keywords?: string[]; // NEW
  questions: Question[];
  // ...
}
```

### Adding Reordering
```typescript
// In plan metadata
metadata: {
  sectionOrder?: string[]; // Custom order of section IDs
  // ...
}

// In CurrentSelection Step 3
// Add drag-and-drop using @dnd-kit or react-beautiful-dnd
```

### Product Finder Implementation
```typescript
// Similar to ProgramFinder
// Route: /reco/product or /product-finder
// Questions:
// - What is your goal? (funding application, review, strategy)
// - What stage is your project? (idea, development, ready)
// - What type of document do you need? (submission, review, strategy)
```

---

## 🐛 Known Issues

1. **Hydration Warning:** Still appears in console when toggling (non-critical, doesn't break functionality)
2. **Template Update Delay:** When configurator closes, template update happens after 500ms delay (intentional to prevent jumps)
3. **Section Reordering:** Not yet implemented (feature request)

---

## 📚 Related Documentation

- `docs/HANDOVER-CURRENT-SELECTION-FIXES.md` - Original fixes document
- `docs/HANDOVER-CURRENT-SELECTION-IMPROVEMENTS.md` - Improvement ideas
- `docs/PREVIEW-PANEL-LAYOUT-DESIGN.md` - Preview panel design
- `docs/PANEL-DESIGN-UNIFICATION.md` - Panel unification design

---

## 🚀 Quick Start for Next Developer

1. **Understand the suppression system:**
   - `suppressNavigationRef` prevents navigation during toggles
   - `sectionChangeSourceRef` tracks change source
   - `lastUserSelectedSectionRef` tracks user selections

2. **Test the fixes:**
   - Toggle sections in Sidebar → should NOT jump
   - Toggle in CurrentSelection Step 3 → should NOT jump
   - Close CurrentSelection → should NOT jump

3. **For new features:**
   - Always check `suppressNavigationRef` before triggering navigation
   - Use `handleSectionSelect` for user-initiated section changes
   - Prevent hydration during configuration changes

---

## ❓ Questions for Discussion

1. **Product Finder:** Should we build it now or wait for more products?
2. **Section Keywords:** What format? Array of strings? Structured tags?
3. **Reordering:** Drag-and-drop library preference? (@dnd-kit, react-beautiful-dnd, or custom?)
4. **Program Templates:** Should program sections be removable or always kept?
5. **Section Editing:** Should editing be inline or always in a form?

---

**Last Updated:** 2024  
**Contact:** Check git history for original implementer

