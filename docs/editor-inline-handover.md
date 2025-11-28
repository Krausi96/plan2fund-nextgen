# Editor Inline Section Editor - Handover Document

## Current Status

### ✅ What's Working
- **Document-Centric Layout**: Preview is the main focus in the center
- **Sidebar Navigation**: Vertical tree navigation for sections (collapsible)
- **Right Panel**: AI and Data tabs available (slide-in from right)
- **Auto-Open Editor**: When a section is selected from sidebar, `editingSectionId` is automatically set
- **Preview Container**: Set up with `id="preview-container"` for positioning reference

### ❌ Current Issue: Inline Editor Positioning

**Problem:**
- Attempted to create an `InlineSectionEditor` component that would appear attached to sections within the preview
- The editor was sticking to the bottom-left corner instead of positioning relative to the selected section
- Component was deleted due to positioning issues

**What Was Attempted:**
- Created `InlineSectionEditor.tsx` component using `createPortal` with fixed positioning
- Tried to calculate position relative to section elements using `getBoundingClientRect()`
- Used scroll/resize listeners to update position dynamically
- Position calculation was incorrect - editor appeared at bottom-left instead of next to section

**Files Deleted:**
- `features/editor/components/layout/Workspace/Editor/InlineSectionEditor.tsx`
- `docs/inline-editor-design.md`

**Current State:**
- `Editor.tsx` has the infrastructure ready:
  - `editingSectionId` state that auto-opens when section is selected
  - Preview container with proper ID
  - Auto-open logic in `useEffect` hook (lines 339-350)
- **No editor UI is currently showing** - the editor needs to be implemented

---

## Original Requirements (From First Handover)

### 1. Document-Centric Layout ✅ (Completed)
- Preview is the main attractor in the center
- Sidebar on left for navigation
- Right panel for AI/Data tools
- No duplicate previews

### 2. Inline Editing Within Preview ❌ (Needs Implementation)

**User Request:**
> "it should be visible within the page of preview, not cover full container, attached to section"

**Requirements:**
1. **Editor should appear inline within the preview document**
   - Not as a full-screen overlay
   - Not covering the entire container
   - Attached to the specific section being edited

2. **Visual Connection**
   - Editor should be visually connected to the section
   - Should appear next to or below the section in the preview
   - Should scroll with the preview (or update position on scroll)

3. **No Click Required**
   - Editor should appear automatically when section is selected from sidebar
   - User shouldn't need to click the section in preview to open editor

4. **Metadata Sections**
   - Plan Metadata and Ancillary Content should follow the same pattern
   - Use `MetadataAndAncillaryPanel` component within the inline editor

---

## Implementation Requirements

### What Needs to Be Built

#### 1. Inline Section Editor Component

**Location:** `features/editor/components/layout/Workspace/Editor/InlineSectionEditor.tsx`

**Key Requirements:**
- Find section element in DOM using `data-section-id` attribute
- Calculate position relative to section element (not viewport)
- Position editor panel next to or below the section
- Update position on scroll/resize
- Handle both normal sections and metadata/ancillary sections

**Positioning Strategy:**
```typescript
// Pseudo-code approach:
1. Find section element: document.querySelector(`[data-section-id="${sectionId}"]`)
2. Get section's bounding rect relative to preview container
3. Calculate editor position:
   - Try right side first: section.right + gap
   - If overflow, position below: section.bottom + gap
4. Use absolute positioning relative to preview container (not fixed to viewport)
5. Update on scroll/resize events
```

**Visual Design:**
- Compact panel: ~450px wide, max 600px height
- Blue border to indicate attachment to section
- Backdrop blur for visual separation
- Scroll independently if content is long

#### 2. Integration with Editor.tsx

**Current Code (lines 502-522):**
```tsx
{/* Preview - Main Content (Center) */}
<div className="flex-1 min-w-0 overflow-hidden relative" id="preview-container">
  {/* Preview - Always visible */}
  <div className="h-full overflow-y-auto">
    <PreviewWorkspace 
      plan={plan} 
      focusSectionId={activeSectionId} 
      onSectionClick={...} 
    />
  </div>
</div>
```

**What to Add:**
```tsx
{/* Inline Editor - Attached to section within preview */}
{editingSectionId && (
  <InlineSectionEditor
    sectionId={editingSectionId}
    section={editingSection}
    activeQuestionId={activeQuestionId}
    plan={plan}
    onClose={() => setEditingSectionId(null)}
    // ... other props
  />
)}
```

#### 3. Section Element Identification

**In ExportRenderer (`features/export/renderer/renderer.tsx`):**
- Sections already have `data-section-id` attribute (line 397)
- Sections are rendered as divs with class `export-preview-section`
- Each section is a full A4 page (210mm x 297mm)

**Challenge:**
- Sections are rendered in a scrollable container
- Need to calculate position relative to scrollable container, not viewport
- Position must update when user scrolls the preview

---

## Technical Approach Recommendations

### Option 1: Absolute Positioning Relative to Preview Container (Recommended)

**Pros:**
- Editor stays within preview bounds
- Scrolls naturally with preview
- Easier to calculate position relative to container

**Implementation:**
```tsx
// Position editor relative to preview container
const container = document.getElementById('preview-container');
const sectionElement = document.querySelector(`[data-section-id="${sectionId}"]`);

// Get positions relative to container
const containerRect = container.getBoundingClientRect();
const sectionRect = sectionElement.getBoundingClientRect();

// Calculate relative position
const relativeTop = sectionRect.top - containerRect.top + container.scrollTop;
const relativeLeft = sectionRect.left - containerRect.left + container.scrollLeft;

// Position editor
<div 
  style={{
    position: 'absolute',
    top: `${relativeTop + offset}px`,
    left: `${relativeLeft + sectionWidth + gap}px`,
    // ...
  }}
>
```

### Option 2: Portal with Fixed Positioning + Scroll Tracking

**Pros:**
- Editor can escape container bounds if needed
- More flexible positioning

**Cons:**
- More complex scroll tracking
- Need to account for container scroll position

### Option 3: Render Editor Directly in Section Element

**Pros:**
- Simplest positioning (no calculations needed)
- Naturally scrolls with section

**Cons:**
- Modifies preview structure
- May interfere with preview rendering

---

## Files to Modify/Create

### New Files:
1. `features/editor/components/layout/Workspace/Editor/InlineSectionEditor.tsx`
   - Main component for inline editor
   - Handles positioning, rendering, and interactions

### Files to Modify:
1. `features/editor/components/Editor.tsx`
   - Import and use `InlineSectionEditor` component
   - Add editor rendering after preview (lines 522+)

2. `features/export/renderer/renderer.tsx` (if needed)
   - Ensure `data-section-id` attributes are correct
   - May need to add refs or IDs for easier element finding

---

## Testing Checklist

### Positioning:
- [ ] Editor appears next to section when selected from sidebar
- [ ] Editor position updates correctly when scrolling preview
- [ ] Editor doesn't overflow preview container
- [ ] Editor repositions if window is resized
- [ ] Editor appears below section if not enough space on right

### Functionality:
- [ ] Editor shows correct section/question content
- [ ] Question navigation works (if multiple questions)
- [ ] Text editor updates plan state correctly
- [ ] Action buttons work (Complete, Skip, AI Help, Data)
- [ ] Close button closes editor
- [ ] Selecting another section moves editor to new section

### Metadata Sections:
- [ ] Plan Metadata section opens editor correctly
- [ ] Ancillary Content section opens editor correctly
- [ ] `MetadataAndAncillaryPanel` renders correctly in inline editor

### Edge Cases:
- [ ] Editor handles sections that are off-screen
- [ ] Editor handles very long sections
- [ ] Editor handles sections at bottom of preview
- [ ] Editor handles rapid section switching

---

## Known Issues from Previous Attempt

### What Went Wrong:
1. **Position Calculation**: Used viewport coordinates instead of container-relative
2. **Scroll Tracking**: Didn't properly account for container scroll position
3. **Timing**: Position calculation happened before DOM was ready
4. **Portal Target**: Used wrong target element for portal

### Lessons Learned:
- Need to calculate position relative to preview container, not viewport
- Must account for container's scroll position
- Use `setTimeout` or `requestAnimationFrame` to ensure DOM is ready
- Consider using `IntersectionObserver` for better scroll tracking
- Test with different screen sizes and scroll positions

---

## Design Reference

### Visual Layout:
```
┌─────────────────────────────────────────────────────────┐
│ Preview Container (scrollable)                          │
│                                                         │
│  ┌─────────────────────────────────────┐               │
│  │ Section 1: Executive Summary        │               │
│  │ [Content...]                         │               │
│  └─────────────────────────────────────┘               │
│                                                         │
│  ┌─────────────────────────────────────┐               │
│  │ Section 2: Problem Statement        │               │
│  │ [Content...]                         │               │
│  │                                      │               │
│  │  ┌──────────────────────────────┐   │               │
│  │  │ 📝 Editor Panel (attached)   │   │               │
│  │  │                              │   │               │
│  │  │ Question: [prompt]           │   │               │
│  │  │ [Text Editor]                │   │               │
│  │  │ [Actions]                    │   │               │
│  │  └──────────────────────────────┘   │               │
│  └─────────────────────────────────────┘               │
└─────────────────────────────────────────────────────────┘
```

### Editor Panel Design:
- **Width**: 450px (fixed)
- **Max Height**: 600px (scrollable if needed)
- **Position**: Right side of section (or below if no space)
- **Background**: `bg-slate-900/95` with backdrop blur
- **Border**: `border-2 border-blue-400/50` (blue to indicate attachment)
- **Shadow**: Strong shadow to lift above preview
- **Padding**: `p-5` or `p-6`

---

## Related Files & Context

### Current Editor State:
- **File**: `features/editor/components/Editor.tsx`
- **Lines 339-350**: Auto-open editor logic (working)
- **Lines 502-522**: Preview container (ready for editor)
- **State**: `editingSectionId` is set automatically when section selected

### Preview Rendering:
- **File**: `features/export/renderer/renderer.tsx`
- **Line 397**: `data-section-id` attribute on sections
- **Sections**: Rendered as full A4 pages in scrollable container

### Existing Components:
- **EditorOverlay**: `features/editor/components/layout/Workspace/Editor/EditorOverlay.tsx`
  - Can be used as reference for editor UI structure
  - Currently not being used (was for modal approach)
- **MetadataAndAncillaryPanel**: `features/editor/components/layout/Workspace/Title Page & Attachement Data/MetadataAndAncillaryPanel.tsx`
  - Should be used within inline editor for metadata/ancillary sections

---

## Questions to Resolve

1. **Positioning Strategy**: Which approach (Option 1, 2, or 3) should be used?
2. **Editor Size**: Should width/height be responsive or fixed?
3. **Scroll Behavior**: Should editor scroll with preview or stay fixed relative to section?
4. **Mobile/Tablet**: How should editor behave on smaller screens?
5. **Multiple Sections**: What happens if user rapidly switches sections?

---

## Next Steps

1. **Implement InlineSectionEditor component**
   - Start with Option 1 (absolute positioning relative to container)
   - Test positioning calculation thoroughly
   - Add scroll/resize listeners

2. **Integrate with Editor.tsx**
   - Import component
   - Add rendering logic after preview
   - Test auto-open behavior

3. **Test & Refine**
   - Test all edge cases
   - Refine positioning algorithm if needed
   - Optimize performance (debounce scroll listeners)

4. **Handle Metadata Sections**
   - Ensure metadata/ancillary sections work the same way
   - Test `MetadataAndAncillaryPanel` in inline editor

---

## Additional Context

### Original User Requirements (Summary):
1. ✅ Document as main attractor (completed)
2. ✅ Sidebar for navigation (completed)
3. ✅ Right panel for AI/Data (completed)
4. ❌ Inline editor attached to sections (needs implementation)
5. ✅ Auto-open when section selected (logic ready, UI missing)
6. ✅ Metadata sections same pattern (needs implementation)

### Previous Handover:
- See `docs/desktop-configuration-handover.md` for original requirements
- Desktop configuration is mostly complete
- Workspace simplification is in progress
- This inline editor is the missing piece

---

## Contact & Support

If you have questions or need clarification:
- Check the original handover: `docs/desktop-configuration-handover.md`
- Review the deleted component attempt (if git history available)
- Test the current state: `features/editor/components/Editor.tsx` lines 339-350 for auto-open logic

Good luck! 🚀

