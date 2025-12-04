# Handover: CurrentSelection Configurator Improvements

## Overview
This document outlines the remaining improvements needed for the CurrentSelection configurator overlay. The basic functionality is implemented, but several UX and layout improvements are required.

## Current State
- ✅ Basic configurator overlay implemented
- ✅ Step-based navigation (1, 2, 3)
- ✅ Product selection (Step 1)
- ✅ Program connection (Step 2)
- ✅ Sections & Documents management (Step 3)
- ✅ Confirm/Cancel buttons
- ✅ Dynamic button in header (🚀 Konfigurieren / ⚙️ Bearbeiten)

---

## 3-Phase Implementation Plan

### Phase 1: Critical UX Foundation (Priority: High)
**Goal:** Fix layout and navigation issues that impact usability
**Estimated Time:** 2-3 hours
**Deliverables:**
- Sticky header with "Aktuelle Auswahl" summary
- Sticky footer with Cancel/Confirm buttons
- Improved overlay layout and scrolling behavior

**Tasks:**
1. **Move "Aktuelle Auswahl" to Header When Expanded** (Task 1)
   - Show compact summary in overlay header when `isExpanded === true`
   - Format: `DEINE KONFIGURATION | AKTUELLE AUSWAHL: Product | Program | 9/9 | 1/1`
   - Make header sticky (`sticky top-0 z-[10002]`)
   - Remove "Aktuelle Auswahl" from base panel when expanded

2. **Make Cancel/Confirm Buttons Sticky** (Task 2c)
   - Position buttons in sticky footer (`sticky bottom-0 z-[10002]`)
   - Always visible when scrolling
   - Add proper padding to prevent content overlap
   - Ensure buttons work correctly on all screen sizes

**Acceptance Criteria:**
- [ ] Header shows "Aktuelle Auswahl" summary when overlay is expanded
- [ ] Header remains visible when scrolling overlay content
- [ ] Cancel/Confirm buttons are always visible at bottom
- [ ] No content is hidden behind sticky elements
- [ ] Layout works on mobile and desktop viewports

---

### Phase 2: Enhanced User Guidance (Priority: Medium)
**Goal:** Improve clarity of workflow and reduce user confusion
**Estimated Time:** 2-3 hours
**Deliverables:**
- Sections/Documents preview in Step 1 (optional enhancement)
- Clear messaging about optional vs required steps
- Visual indicators for completion states

**Important:** Step 1 (Product) is **REQUIRED**, Step 2 (Program) is **OPTIONAL**

**Tasks:**
1. **Show Sections & Documents Preview in Step 1** (Task 2a) - Optional Enhancement
   - After product selection, show preview of available sections/documents
   - Display as informational cards (not disabled, just preview)
   - Show count: "9 sections available" / "1 document available"
   - Add info tooltip: "These sections and documents are based on your product selection. Connecting a program (Step 2) will add program-specific sections."
   - **Note:** This is informational only - editing is available after Step 1

2. **Clarify Step Requirements** (Task 2b)
   - **Step 1 (Product):** Required - Show "✓ Product selected" when complete
   - **Step 2 (Program):** Optional - Show "Optional" badge and "Recommended but not required" message
   - **Step 3:** Available immediately after Step 1 (no need to wait for Step 2)
   - Add helpful message in Step 2: "Program connection is optional. You can proceed to Step 3 to edit sections/documents now, or connect a program to add program-specific content."
   - In Step 3, show different messages:
     - If no program: "Editing sections/documents. Connect a program in Step 2 to add program-specific content."
     - If program connected: "Editing sections/documents with program-specific content."

**Acceptance Criteria:**
- [ ] Step 1 shows sections/documents preview after product selection (informational)
- [ ] Step 2 clearly marked as optional
- [ ] Step 3 is accessible immediately after Step 1
- [ ] Clear messaging explains that program connection is optional
- [ ] Users can skip Step 2 and go directly to Step 3
- [ ] Editing works with or without program connection

---

### Phase 3: Documentation & Polish (Priority: Low)
**Goal:** Add helpful documentation and finalize design decisions
**Estimated Time:** 2-3 hours
**Deliverables:**
- Comprehensive documentation in Step 3
- Product selection enhancement (or Product Finder decision)
- Final UX polish

**Tasks:**
1. **Add Documentation in Step 3** (Task 3)
   - Add expandable "How It Works" section at top of Step 3
   - Explain section/document generation process
   - Describe enable/disable behavior
   - Explain custom sections/documents
   - Add visual examples or diagrams

2. **Product Selection Enhancement** (Task 4)
   - **Decision Required:** Product Finder vs Enhanced Dropdown
   - **Recommended:** Enhanced Dropdown (Option C)
     - Add detailed descriptions in dropdown
     - Add "Help me choose" button with comparison guide
     - Show use cases for each product type
   - **Alternative:** Full Product Finder (if user research indicates need)

**Acceptance Criteria:**
- [ ] Step 3 includes clear "How It Works" documentation
- [ ] Documentation is accessible but not intrusive
- [ ] Product selection includes helpful guidance
- [ ] All tooltips and help text are translated
- [ ] Documentation matches actual behavior

---

## Detailed Task Specifications

### Task 1: Move "Aktuelle Auswahl" to Header When Expanded

**Current Issue:** When configurator is expanded, "Aktuelle Auswahl" is shown in the base panel (left side). It should be moved to the overlay header.

**Requirements:**
- When `isExpanded === true`, show "Aktuelle Auswahl" in the overlay header
- Display horizontally next to "Deine Konfiguration" title
- Use separator: `|` between them
- Format: `DEINE KONFIGURATION | AKTUELLE AUSWAHL: Product | Program | 9/9 | 1/1`
- Show compact summary: Product, Program, Sections count, Documents count
- Make it sticky (always visible at top of overlay)

**Implementation Notes:**
- Location: `features/editor/components/layout/Workspace/Navigation/CurrentSelection.tsx`
- Look for the overlay header section (around line 585-597)
- Remove "Aktuelle Auswahl" from the base panel when expanded
- Add it to the overlay header with horizontal layout
- Use `sticky top-0 bg-slate-900/95 backdrop-blur-sm border-b border-white/10` for header

**Example Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ DEINE KONFIGURATION | AKTUELLE AUSWAHL: Product | Program | 9/9 | 1/1  [✕] │
├─────────────────────────────────────────────────────────────┤
│ [Configurator Content...]                                    │
│                                                              │
│ [Scrollable content area]                                   │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                    [Cancel] [Confirm]        │
└─────────────────────────────────────────────────────────────┘
```

**Technical Details:**
```tsx
// Header structure
<div className="sticky top-0 z-[10002] bg-slate-900/95 backdrop-blur-sm border-b border-white/10 px-4 py-3">
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <span className="text-xs font-semibold uppercase text-white">
        DEINE KONFIGURATION
      </span>
      <span className="text-white/40">|</span>
      <span className="text-xs font-semibold uppercase text-white/90">
        AKTUELLE AUSWAHL:
      </span>
      <span className="text-xs text-white/80">
        {productLabel} | {programLabel || 'Kein Programm'} | {enabledSectionsCount}/{totalSectionsCount} | {enabledDocumentsCount}/{totalDocumentsCount}
      </span>
    </div>
    <button onClick={() => setIsExpanded(false)}>✕</button>
  </div>
</div>
```

---

### Task 2a: Show Sections & Documents Preview in Step 1

**Current Issue:** Sections & Documents are only shown in Step 3, making it unclear what will be available.

**Requirements:**
- After product selection in Step 1, immediately show:
  - List of sections that will be available (based on selected product)
  - List of documents that will be available
- Show as preview/read-only (not editable yet)
- Add info tooltip: "These sections and documents will be available after you complete Step 2 (Program Selection)"

**Implementation Notes:**
- Location: Step 1 section (around line 740-825)
- Add preview section after product selection UI
- Use `getSections(pendingProduct)` and `getDocuments(pendingProduct)` to get available items
- Display as disabled cards with lock icon
- Show count: "9 sections available" / "1 document available"

**Example UI:**
```tsx
{pendingProduct && (
  <div className="mt-4 space-y-3">
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold text-white/90">
        PREVIEW: Available Sections & Documents
      </span>
      <InfoTooltip
        title="Preview"
        content="These sections and documents will be available after you complete Step 2 (Program Selection)"
      />
    </div>
    <div className="grid grid-cols-2 gap-2">
      <div className="bg-white/5 border border-white/10 rounded p-2 opacity-60">
        <div className="flex items-center gap-2">
          <LockIcon className="w-4 h-4 text-white/50" />
          <span className="text-xs text-white/70">
            {getSections(pendingProduct).length} sections available
          </span>
        </div>
      </div>
      <div className="bg-white/5 border border-white/10 rounded p-2 opacity-60">
        <div className="flex items-center gap-2">
          <LockIcon className="w-4 h-4 text-white/50" />
          <span className="text-xs text-white/70">
            {getDocuments(pendingProduct).length} documents available
          </span>
        </div>
      </div>
    </div>
  </div>
)}
```

---

### Task 2b: Clarify Editing Requirements

**Current Issue:** Unclear when user can start editing sections/documents.

**Requirements:**
- Add clear messaging: "You can start editing after completing Steps 1 and 2"
- Show disabled state for sections/documents in Step 1
- Enable editing only after Step 2 (program connection) is complete
- Update Step 3 to show: "Sections & Documents are now editable. You can enable/disable and customize them."

**Implementation Notes:**
- Add conditional rendering based on `pendingProduct` and `pendingProgram`
- Show info banner at top of Step 3 if editing is not yet enabled
- Disable toggle buttons until both steps complete
- Add visual indicators (lock icons, disabled styling)

**Example Flow:**
```
Step 1: Product Selection
  - Select product
  - [Preview] Sections: 9 available (locked)
  - [Preview] Documents: 1 available (locked)
  - ℹ️ "Complete Step 2 to enable editing"

Step 2: Program Selection
  - Connect program
  - Sections/Documents update based on program
  - ✅ "Ready to edit! Proceed to Step 3"

Step 3: Sections & Documents (Now Editable)
  - ✅ Enable/disable sections
  - ✅ Enable/disable documents
  - ✅ Customize
```

---

### Task 2c: Make Cancel/Confirm Buttons Sticky

**Current Issue:** Buttons scroll with content, making them hard to access.

**Requirements:**
- Position buttons at bottom of overlay (sticky/fixed)
- Always visible when scrolling
- Use `position: sticky` or `position: fixed` with proper z-index
- Ensure buttons don't overlap content

**Implementation Notes:**
- Location: Confirm/Cancel buttons section (around line 1200-1250)
- Move buttons to sticky footer
- Add padding-bottom to scrollable content area to prevent overlap
- Use `sticky bottom-0 bg-slate-900/95 backdrop-blur-sm border-t border-white/10`

**Technical Details:**
```tsx
// Footer structure
<div className="sticky bottom-0 z-[10002] bg-slate-900/95 backdrop-blur-sm border-t border-white/10 px-4 py-3">
  <div className="flex items-center justify-end gap-3">
    <Button variant="outline" onClick={handleCancel}>
      Cancel
    </Button>
    <Button 
      onClick={handleConfirm}
      disabled={!hasChanges}
    >
      Confirm Selection
    </Button>
  </div>
</div>

// Content area needs padding-bottom
<div className="pb-24"> {/* Space for sticky footer */}
  {/* Scrollable content */}
</div>
```

---

### Task 3: Add More Documentation in Step 3

**Current Issue:** Step 3 lacks detailed explanation of how sections/documents work.

**Requirements:**
- Add comprehensive "How It Works" section in Step 3
- Explain:
  - How sections/documents are generated (product type + program)
  - What happens when you enable/disable items
  - How custom sections/documents work
  - When changes take effect
  - Relationship between sections, documents, and plan structure
- Use expandable sections or tooltips for detailed info
- Add visual examples or diagrams if helpful

**Implementation Notes:**
- Location: Step 3 section (around line 958-1050)
- Add documentation section at top of Step 3
- Use InfoTooltip component for inline help
- Consider expandable "Learn More" sections
- Use Accordion component if available

**Content to Include:**
- "Sections are automatically generated based on your product type and connected program"
- "Disabling a section removes it from your plan structure"
- "Custom sections can be added for specific requirements"
- "Changes take effect immediately when you click 'Confirm Selection'"
- "Documents are linked to sections and appear in the Documents Bar"

**Example Structure:**
```tsx
<div className="mb-4">
  <Accordion>
    <AccordionItem>
      <AccordionTrigger>
        <span className="text-xs font-semibold">How Sections & Documents Work</span>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-3 text-xs text-white/80">
          <p>
            Sections are automatically generated based on your product type 
            ({pendingProduct}) and connected program ({programLabel || 'none'}).
          </p>
          <p>
            <strong>Enabling/Disabling:</strong> Toggle sections and documents 
            on/off to customize your plan structure. Disabled items won't appear 
            in your plan.
          </p>
          <p>
            <strong>Custom Items:</strong> You can add custom sections and 
            documents for specific requirements not covered by templates.
          </p>
          <p>
            <strong>Changes:</strong> Changes take effect when you click 
            "Confirm Selection". You can always come back to adjust later.
          </p>
        </div>
      </AccordionContent>
    </AccordionItem>
  </Accordion>
</div>
```

---

### Task 4: Product Finder - Design Discussion

**Question:** Should we create a Product Finder similar to Program Finder?

**Current State:**
- Program Finder exists (routes to `/reco`)
- Product selection is currently a simple dropdown
- Three products: Submission, Review, Strategy

**Considerations:**

#### Option A: Keep Simple Dropdown
- **Pros:** Fast, clear, no extra step
- **Cons:** Users might not understand differences

#### Option B: Add Product Finder
- **Pros:** 
  - Helps users understand product differences
  - Can ask questions to recommend best product
  - Better onboarding experience
- **Cons:** 
  - Extra step in workflow
  - More complexity
  - Need to design question flow

#### Option C: Enhanced Product Selection with Explanations (RECOMMENDED)
- **Pros:**
  - Keep dropdown but add detailed explanations
  - Show use cases for each product
  - Add "Which product is right for me?" helper
  - Less disruptive than full finder
- **Cons:**
  - Still requires some design work

**Recommendation:** Option C - Enhanced Product Selection
- Keep the dropdown
- Add detailed explanations in the dropdown menu
- Add "Help me choose" button that shows a comparison/guide
- Less disruptive than a full finder, but still helpful

**If Product Finder is Needed:**
- Similar flow to Program Finder
- Questions could include:
  - "What is your primary goal?"
    - Apply for funding
    - Revise existing plan
    - Strategic planning
  - "What stage is your business?"
    - Early stage / Idea
    - Growth stage
    - Established
  - "What type of funding are you seeking?"
    - Grants
    - Loans
    - Equity
- Result: Recommended product with explanation

**Implementation for Option C:**
```tsx
// Enhanced dropdown with descriptions
<div className="space-y-1">
  {productOptions?.map((option) => (
    <button
      key={option.value}
      onClick={() => handleSelectProduct(option.value)}
      className="w-full text-left p-3 rounded hover:bg-white/5"
    >
      <div className="flex items-center gap-2 mb-1">
        {option.icon && <span>{option.icon}</span>}
        <span className="font-semibold">{option.label}</span>
      </div>
      <p className="text-xs text-white/70">{option.description}</p>
    </button>
  ))}
</div>

// "Help me choose" button
<button
  onClick={() => setShowProductGuide(true)}
  className="text-xs text-blue-400 hover:text-blue-300"
>
  Which product is right for me?
</button>
```

---

## Implementation Priority

1. **Phase 1 (High Priority):**
   - Task 1: Move "Aktuelle Auswahl" to header (UX improvement)
   - Task 2c: Make Cancel/Confirm buttons sticky (critical for usability)

2. **Phase 2 (Medium Priority):**
   - Task 2a: Show sections/documents in Step 1 (better UX)
   - Task 2b: Clarify editing requirements (reduces confusion)

3. **Phase 3 (Low Priority):**
   - Task 3: Add documentation (nice to have)
   - Task 4: Product Finder discussion (design decision needed)

---

## Technical Notes

### Files to Modify
- `features/editor/components/layout/Workspace/Navigation/CurrentSelection.tsx`
  - Overlay header section (around line 585-597)
  - Step 1 content (around line 740-825)
  - Step 3 content (around line 958-1050)
  - Confirm/Cancel buttons positioning (around line 1200-1250)

### Key State Variables
- `isExpanded` - Controls overlay visibility
- `activeStep` - Current step (1, 2, or 3)
- `pendingProduct` - Selected product (pending confirmation)
- `pendingProgram` - Connected program (pending confirmation)
- `hasMadeSelections` - Whether user has configured anything

### Styling Considerations
- Overlay uses `z-[10001]` for positioning
- Header should use `sticky top-0 z-[10002]` positioning
- Footer should use `sticky bottom-0 z-[10002]` positioning
- Ensure proper backdrop and scrolling behavior
- Add padding to content area to prevent overlap with sticky elements

### Dependencies
- `@templates` - For `getSections()` and `getDocuments()` functions
- `@/shared/components/ui` - For Button, Dialog, InfoTooltip components
- Consider adding Accordion component if not available

---

## Testing Checklist

### Phase 1 Testing
- [ ] "Aktuelle Auswahl" appears in overlay header when expanded
- [ ] Header remains visible when scrolling overlay content
- [ ] Cancel/Confirm buttons are always visible (sticky)
- [ ] No content is hidden behind sticky header/footer
- [ ] Layout works on mobile and desktop viewports
- [ ] Sticky elements have proper z-index layering

### Phase 2 Testing
- [ ] Sections/documents preview shows in Step 1 after product selection
- [ ] Preview items are visually disabled (grayed out, lock icon)
- [ ] Clear messaging explains when editing becomes available
- [ ] Step 3 clearly indicates items are now editable
- [ ] Toggle buttons are disabled until Steps 1 & 2 complete
- [ ] Editing is enabled after both steps complete

### Phase 3 Testing
- [ ] Documentation in Step 3 is clear and helpful
- [ ] Documentation is accessible but not intrusive
- [ ] Product selection includes helpful guidance (if implemented)
- [ ] All tooltips and help text are translated
- [ ] Documentation matches actual behavior

### General Testing
- [ ] No layout issues or overflow problems
- [ ] Translations work correctly (DE/EN)
- [ ] Responsive on different screen sizes
- [ ] Keyboard navigation works correctly
- [ ] Accessibility (ARIA labels, focus management)

---

## Questions for Discussion

1. **Product Finder:** Do we need it, or is enhanced dropdown sufficient?
2. **Editing Lock:** Should we prevent editing until both steps complete, or just show warning?
3. **Documentation Format:** Tooltips, expandable sections, or separate help panel?
4. **Sticky Positioning:** Should buttons be sticky within scrollable area, or fixed to viewport?
5. **Mobile Experience:** How should the overlay behave on mobile devices?
6. **Accessibility:** Do we need keyboard shortcuts for navigation between steps?

---

## Suggested Improvements to This Document

### What I Would Change:

1. **Add Visual Mockups/Diagrams**
   - Include wireframes or screenshots showing before/after states
   - Visual examples of the sticky header/footer layout
   - Flow diagrams for the 3-step process

2. **Add Code Examples**
   - More complete code snippets for each task
   - Show integration points with existing code
   - Include error handling and edge cases

3. **Add Performance Considerations**
   - Note about re-renders when scrolling
   - Consider virtualization if sections/documents list is long
   - Optimize sticky positioning calculations

4. **Add Accessibility Requirements**
   - ARIA labels for sticky elements
   - Focus management when opening/closing overlay
   - Keyboard navigation between steps
   - Screen reader announcements

5. **Add Animation/Transition Specs**
   - Smooth transitions when showing/hiding preview
   - Animation for sticky elements appearing
   - Loading states for async operations

6. **Add Error Handling**
   - What happens if product selection fails?
   - How to handle invalid program connections?
   - Error states for disabled editing

7. **Add Internationalization Details**
   - List all new strings that need translation
   - Note any strings that are too long in German
   - Consider RTL languages if applicable

8. **Add Rollback Plan**
   - How to revert if issues arise
   - Feature flags for gradual rollout
   - A/B testing considerations

9. **Add Success Metrics**
   - How to measure if improvements are successful
   - User engagement metrics
   - Completion rate tracking

10. **Add Related Issues/Dependencies**
    - Link to related GitHub issues
    - Note any blocking dependencies
    - Reference related design documents

---

## Related Files

- `features/editor/components/layout/Workspace/Navigation/CurrentSelection.tsx` - Main component
- `features/editor/components/Editor.tsx` - Parent component, passes props
- `shared/i18n/translations/en.json` - English translations
- `shared/i18n/translations/de.json` - German translations
- `docs/CLARIFICATION-QUESTIONS-AND-VISUALS.md` - Design reference
- `docs/PHASE-3-5-DESIGN.md` - Related design documentation
- `docs/SIMPLIFIED-EDITOR-REDESIGN.md` - Editor redesign context

---

**Last Updated:** [Current Date]
**Status:** Ready for implementation
**Estimated Time:** 
- Phase 1: 2-3 hours
- Phase 2: 2-3 hours
- Phase 3: 2-3 hours
- **Total: 6-9 hours**
