# Handover: Section Synchronization Issues

## **Status: Critical Bug - Needs Investigation** 🔴

### **Overview**
There are critical synchronization issues between the Sidebar, InlineSectionEditor, and Preview components. When a user clicks a section in the sidebar, the following problems occur:

1. **Preview doesn't scroll** - Preview remains showing the title page regardless of which section is clicked
2. **InlineSectionEditor doesn't position correctly** - Editor opens but doesn't position itself next to the selected section
3. **Section card doesn't update** - Sidebar highlights the section but preview/editor don't reflect the change

---

## **Current Behavior**

### **Expected Behavior:**
When user clicks a section in sidebar:
1. ✅ Sidebar highlights the selected section (WORKS)
2. ✅ InlineSectionEditor opens for that section (WORKS)
3. ❌ Preview should scroll to show that section (BROKEN)
4. ❌ InlineSectionEditor should position next to the section in preview (BROKEN)

### **Actual Behavior:**
- Sidebar click updates `activeSectionId` correctly
- Editor opens with correct section data
- Preview stays at title page (doesn't scroll)
- Editor positions incorrectly or not at all

---

## **Root Cause Analysis**

### **Issue 1: Preview Not Scrolling**

**Location:** `features/editor/components/Editor.tsx` lines 370-480

**Problem:**
- Scroll-to-section logic exists but isn't working
- Multiple retry strategies implemented but element finding fails
- Console logs show: `[Scroll] Section element not found: <section-id>`

**Possible Causes:**
1. **DOM Structure Mismatch:**
   - Sections are rendered inside `ExportRenderer` component
   - Sections might be in a different container than expected
   - `data-section-id` attributes might not be on the right elements
   - Sections might be rendered with different IDs (e.g., `section.key` vs `section.id`)

2. **Timing Issues:**
   - Elements might not be in DOM when scroll logic runs
   - React rendering might happen after scroll attempt
   - Preview might be using virtual rendering (only visible sections in DOM)

3. **Container Hierarchy:**
   - Scroll container is `#preview-scroll-container`
   - But sections might be nested deeper (inside `.export-preview` or `.export-preview-page`)
   - Transform/scale CSS might affect `getBoundingClientRect()` calculations

**Investigation Steps:**
```javascript
// Add to browser console to debug:
const scrollContainer = document.getElementById('preview-scroll-container');
const allSections = document.querySelectorAll('[data-section-id]');
console.log('Scroll container:', scrollContainer);
console.log('All sections found:', allSections.length);
allSections.forEach(el => {
  console.log('Section:', el.getAttribute('data-section-id'), el);
});

// Check if sections are in scroll container:
const sectionsInContainer = scrollContainer?.querySelectorAll('[data-section-id]');
console.log('Sections in container:', sectionsInContainer?.length);
```

### **Issue 2: InlineSectionEditor Positioning**

**Location:** `features/editor/components/layout/Workspace/Content/InlineSectionEditor.tsx` lines 120-230

**Problem:**
- `calculatePosition()` function can't find target elements
- Editor positions at default location or doesn't appear
- Retry logic exists but still fails

**Possible Causes:**
1. **Element Finding:**
   - Same DOM structure issues as scroll problem
   - Query selectors might be wrong
   - Elements might not exist when calculation runs

2. **Position Calculation:**
   - `getBoundingClientRect()` might return incorrect values due to CSS transforms
   - Scroll container positioning might be wrong
   - Editor might be positioned relative to wrong parent

**Investigation Steps:**
```javascript
// Check what elements exist:
const sectionId = 'your-section-id';
const questionId = 'your-question-id';

// Check section element:
const sectionEl = document.querySelector(`[data-section-id="${sectionId}"]`);
console.log('Section element:', sectionEl);

// Check question elements:
const questionHeading = document.querySelector(`h4.section-subchapter[data-question-id="${questionId}"]`);
const questionContent = document.querySelector(`div[data-question-id="${questionId}"][data-question-content="true"]`);
console.log('Question heading:', questionHeading);
console.log('Question content:', questionContent);
```

### **Issue 3: Preview Always Shows Title Page**

**Location:** `features/editor/components/layout/workspace/preview/PreviewWorkspace.tsx`

**Problem:**
- Preview doesn't respond to `activeSectionId` changes
- Always shows title page regardless of selection
- `focusSectionId` prop might not be used correctly

**Possible Causes:**
1. **Preview Rendering:**
   - `ExportRenderer` might not be receiving/using `focusSectionId`
   - Preview might render all sections but scroll position isn't updated
   - Preview might need explicit scroll-to-section logic

2. **State Propagation:**
   - `activeSectionId` might not be passed correctly to PreviewWorkspace
   - `focusSectionId` prop might be ignored by ExportRenderer

**Investigation Steps:**
```javascript
// Check if focusSectionId is being passed:
// In Editor.tsx line 771, verify:
<PreviewWorkspace 
  plan={plan} 
  focusSectionId={activeSectionId}  // <-- Is this updating?
  onSectionClick={...}
/>

// Check ExportRenderer props:
// Does ExportRenderer accept/use focusSectionId?
```

---

## **Files to Investigate**

### **Primary Files:**
1. **`features/editor/components/Editor.tsx`**
   - Lines 370-480: Scroll-to-section logic
   - Lines 485-550: IntersectionObserver scroll detection
   - Lines 768-784: PreviewWorkspace rendering

2. **`features/editor/components/layout/Workspace/Content/InlineSectionEditor.tsx`**
   - Lines 120-230: `calculatePosition()` function
   - Lines 267-316: Position update useEffect

3. **`features/editor/components/layout/workspace/preview/PreviewWorkspace.tsx`**
   - How `focusSectionId` prop is used
   - Whether preview scrolls on prop change

4. **`features/export/renderer/renderer.tsx`**
   - How sections are rendered with `data-section-id`
   - DOM structure of rendered sections
   - Whether `focusSectionId` prop exists/is used

### **Key Questions to Answer:**
1. Where exactly are sections rendered in the DOM?
2. What is the actual structure of `#preview-scroll-container`?
3. Are `data-section-id` attributes correctly set on section elements?
4. Does `ExportRenderer` support scrolling to a specific section?
5. Is the preview using virtual rendering (only visible sections)?

---

## **Debugging Checklist**

- [ ] Open browser DevTools console
- [ ] Click a section in sidebar
- [ ] Check console for `[Scroll]` logs
- [ ] Verify `activeSectionId` updates in React DevTools
- [ ] Check if section elements exist in DOM
- [ ] Verify scroll container exists and is correct
- [ ] Check if `focusSectionId` prop reaches PreviewWorkspace
- [ ] Inspect DOM structure of preview sections
- [ ] Verify `data-section-id` attributes are correct
- [ ] Check if CSS transforms affect positioning
- [ ] Test with different sections (first, middle, last)

---

## **Potential Solutions**

### **Solution 1: Fix Element Finding**
- Verify exact DOM structure of rendered sections
- Update query selectors to match actual structure
- Add fallback queries for different rendering modes

### **Solution 2: Fix Scroll Container**
- Ensure scroll container is correct
- Check if nested scroll containers exist
- Verify scroll calculations account for transforms

### **Solution 3: Add Preview Scroll Support**
- If `ExportRenderer` doesn't support scrolling, add it
- Use `scrollIntoView()` on section elements
- Or manually calculate and set scroll position

### **Solution 4: Fix Timing Issues**
- Use `requestAnimationFrame` for scroll operations
- Wait for React render cycle to complete
- Use `MutationObserver` to detect when sections are added

---

## **Remaining Tasks from Original Handover**

### **From `docs/handover-inline-editor-ai-data-integration.md`:**

#### **✅ Completed:**
- [x] Tab system (AI, Data, Context) added
- [x] AI tab with conversational interface
- [x] Data tab with library and quick add buttons
- [x] Context tab with requirements and metadata
- [x] Dark theme styling
- [x] Attach callbacks added to props

#### **❌ Still TODO:**

1. **Positioning Enhancement (Section 5):**
   - [ ] Add "between sections" positioning logic
   - [ ] Improve scroll-to-visible behavior for editor
   - [ ] Ensure editor stays visible when scrolling

2. **Context Tab Enhancements:**
   - [ ] Add "Related Sections" functionality (find related sections based on template structure)
   - [ ] Add "Program Requirements" display (if available in plan metadata)
   - [ ] Improve requirements validation display

3. **Metadata Panel Investigation:**
   - [ ] Investigate how users can create their own title page easily
   - [ ] Control attachments & formalities data (table of contents etc)
   - [ ] Ensure metadata panel works correctly with inline editor

4. **Testing:**
   - [ ] Test all functionality with different section/question combinations
   - [ ] Test positioning in various scenarios
   - [ ] Test scroll behavior
   - [ ] Verify no console errors
   - [ ] Verify no lint errors

---

## **Recommended Approach**

1. **Start with DOM Investigation:**
   - Use browser DevTools to inspect actual DOM structure
   - Verify where sections are rendered
   - Check if `data-section-id` attributes exist and are correct

2. **Fix Scroll-to-Section:**
   - Once DOM structure is understood, fix element finding
   - Test scroll functionality in isolation
   - Add proper error handling

3. **Fix Editor Positioning:**
   - Use same element finding logic as scroll
   - Verify position calculations work with actual DOM
   - Test with different sections

4. **Fix Preview Rendering:**
   - Check if `focusSectionId` prop is used
   - Add scroll-to-section if not implemented
   - Test preview updates on section change

5. **Complete Remaining Tasks:**
   - Implement positioning enhancements
   - Add related sections functionality
   - Improve context tab
   - Test everything thoroughly

---

## **Code References**

- Scroll logic: `features/editor/components/Editor.tsx:370-480`
- Editor positioning: `features/editor/components/layout/Workspace/Content/InlineSectionEditor.tsx:120-230`
- Preview component: `features/editor/components/layout/workspace/preview/PreviewWorkspace.tsx`
- Section rendering: `features/export/renderer/renderer.tsx:395-416`
- Sidebar selection: `features/editor/components/layout/Workspace/Navigation/Sidebar.tsx:354-415`

---

## **Console Debugging Commands**

```javascript
// Check scroll container
const container = document.getElementById('preview-scroll-container');
console.log('Container:', container, 'ScrollTop:', container?.scrollTop);

// Find all sections
const sections = document.querySelectorAll('[data-section-id]');
console.log('Sections found:', sections.length);
sections.forEach(s => console.log(s.getAttribute('data-section-id'), s));

// Check specific section
const sectionId = 'your-section-id-here';
const section = document.querySelector(`[data-section-id="${sectionId}"]`);
console.log('Section:', section, section?.getBoundingClientRect());

// Try scrolling manually
if (section) {
  section.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
```

---

**Priority: HIGH** - This blocks core functionality. Users cannot navigate between sections effectively.

**Estimated Time: 4-6 hours** for investigation and fix.

**Good luck! 🚀**

