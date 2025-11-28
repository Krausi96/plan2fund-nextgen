# Template Overview Panel - Handover Document

## Current Status

The Template Overview Panel has been redesigned with a three-column layout and a combined configuration card with a switcher. The panel displays sections and documents in a compact 3-column grid format with icon-based chips. Recent improvements include:

- ✅ Combined "Plan auswählen" and "Programm verbinden" into a single card with tab switcher
- ✅ Blue active tab styling (matching data tab design)
- ✅ Compact chip/tag layout for sections and documents (3 items per row)
- ✅ Icon-based visual design (📋 for sections, 📄 for documents)
- ✅ Hover tooltips for additional information
- ✅ Smaller checkboxes (w-3.5 h-3.5)
- ✅ Centered header info with separation line
- ✅ Consistent column headers (text-base, matching styling)

## Known Issues & Required Work

### 1. Plan Auswählen Selector Issues

**Problem:**
- The product selector dropdown list gets cut off when opened
- Not enough information displayed when selecting a product
- Need to investigate pricing information and propose a solution

**Location:** 
- `TemplateOverviewPanel.tsx` - Plan selection view in the combined configuration card
- Product dropdown menu (`showProductMenu` state)

**Investigation Needed:**
- Check dropdown positioning and z-index issues
- Review dropdown container overflow settings
- Investigate what product information should be displayed (pricing, features, etc.)
- Check if dropdown needs to be repositioned or use a portal

**Proposed Actions:**
1. Investigate dropdown clipping - check parent container `overflow` properties
2. Consider using a portal for the dropdown menu to avoid clipping
3. Research what product information should be shown (pricing, features, use cases)
4. Propose UI/UX improvements for product selection with more context

---

### 2. Programm Verbinden Section

**Problem 2.1:**
- Description text below buttons should be removed
- Need to check if buttons can be arranged side-by-side instead of stacked

**Location:**
- `TemplateOverviewPanel.tsx` - Program connection view in the combined configuration card
- Currently uses `flex-col` layout for buttons

**Investigation Needed:**
- Check if there's description text below the program connection buttons
- Test if buttons can fit side-by-side in the available width
- Consider button text length and responsive behavior

**Proposed Actions:**
1. Remove any description text below program connection buttons
2. Test `flex-row` layout for buttons (currently `flex-col`)
3. Ensure buttons remain readable and accessible when side-by-side
4. Consider responsive behavior for smaller screens

**Problem 2.2:**
- "Template hochladen" button functionality needs investigation
- What could theoretically be uploaded here?

**Investigation Needed:**
- Review the guidance document for template upload requirements
- Check if users should be able to upload:
  - Custom section templates?
  - Custom document templates?
  - Pre-filled plan templates?
  - Program-specific templates?
- Determine the data format and validation requirements

**Proposed Actions:**
1. Review `Guidance for Simplifying the Templa.txt` for template upload requirements
2. Investigate use cases for template uploads
3. Propose data structure and validation for uploaded templates
4. Design upload flow and error handling

---

### 3. Deine Konfiguration Description & Selected Values

**Problem:**
- Need a more comprehensive description explaining how "Deine Konfiguration" works
- Should display selected values below the selections (e.g., "Custom Business Plan" should be visible)

**Location:**
- `TemplateOverviewPanel.tsx` - Column 1 description and configuration card

**Current State:**
- Description exists but may not be comprehensive enough
- Selected product is shown in the dropdown but not as a summary below

**Investigation Needed:**
- Review current description text
- Determine what information users need to understand the configuration
- Check if selected values should be displayed as a summary card or text

**Proposed Actions:**
1. Rewrite description to be more comprehensive and user-friendly
2. Add a summary section showing selected values:
   - Selected product type (e.g., "Custom Business Plan")
   - Connected program (if any)
   - Funding type
3. Consider adding a visual summary card or list
4. Test with users to ensure clarity

---

### 4. Column 2 & 3 Layout and Functionality

**Problem:**
- Column 2 layout is good but text below items is cut off
- Need to investigate if selected items can be edited further
- Column 3 may have similar issues

**Location:**
- `TemplateOverviewPanel.tsx` - Sections column (Column 2) and Documents column (Column 3)
- Chip/tag layout with hover tooltips

**Current State:**
- Items displayed as compact chips (3 per row)
- Text wraps but may be getting cut off
- Hover tooltips show full description
- No editing capability for selected items

**Investigation Needed:**
- Check if text is being truncated or cut by container overflow
- Review `break-words` and text wrapping behavior
- Investigate what "editing items" means:
  - Edit section/document metadata?
  - Reorder items?
  - Customize questions/prompts?
  - Edit word counts or requirements?

**Proposed Actions:**
1. Fix text cutting issues:
   - Review container height and overflow settings
   - Check if `line-clamp` or `truncate` is being applied
   - Ensure text wraps properly within chip boundaries
   - Consider increasing chip height or using multi-line layout
2. Investigate editing capabilities:
   - Review guidance document for customization requirements
   - Check if users should be able to edit:
     - Section/document titles
     - Descriptions
     - Word counts
     - Questions/prompts
   - Design edit UI (inline editing, modal, or separate panel)
3. Consider adding:
   - Edit button/icon on hover
   - Drag-and-drop reordering
   - Quick edit modal or inline editing

---

### 5. Add Sections/Documents Buttons

**Problem:**
- "Add section" and "Add document" buttons don't really work
- Functionality needs investigation and fixing

**Location:**
- `TemplateOverviewPanel.tsx` - Bottom of Column 2 and Column 3
- `showAddSection` and `showAddDocument` state handlers

**Current State:**
- Buttons exist and show a form when clicked
- `addCustomSection()` and `addCustomDocument()` functions exist
- May not be properly integrated with plan state or validation

**Investigation Needed:**
- Test the add functionality end-to-end
- Check if custom sections/documents are:
  - Properly saved to plan state
  - Displayed correctly after creation
  - Included in exports
  - Validated properly
- Review error handling and user feedback

**Proposed Actions:**
1. Test add section/document flow completely
2. Fix any state management issues
3. Ensure custom items are persisted correctly
4. Add proper validation and error messages
5. Improve UI/UX of the add form
6. Test that custom items appear in the list immediately after creation

---

### 6. Guidance Document Implementation

**Problem:**
- Review remaining features from `Guidance for Simplifying the Templa.txt` that could be implemented
- Investigate what's missing from the current implementation

**Key Features from Guidance Document:**

1. **Progressive Disclosure** (Not implemented)
   - Tag program-only additions as `visibility: 'programOnly'`
   - Collapse program-only sections by default
   - Add expand/collapse functionality

2. **Warning Banner for Hard Rules** (Not implemented)
   - Display warning banner if program enforces hard rules
   - Show message like "This program has strict requirements"
   - Link to requirement details

3. **Template Persistence and Reuse** (Not implemented)
   - Allow users to save custom templates as favorites
   - Store in `userSettings` or similar
   - Show saved favorites in PlanConfigurator or Template Overview

4. **Alignment without Merging** (Not implemented)
   - When program only lists keywords/topics, map them to existing master sections
   - Highlight with badges
   - Show requirement hints

5. **Document Management Panel** (Not implemented)
   - Dedicated panel for uploading/managing documents
   - Show upload controls, status indicators (uploaded/missing)
   - Validation messages

6. **Requirements Validation UI** (Not implemented)
   - Visual warnings for hard requirements
   - Validation on export
   - Show validation status in Template Overview
   - Blocking modal before export

7. **Section Question Customization** (Not implemented)
   - Allow users to edit question text or add helper hints
   - Edit button on questions in workspace
   - Save customizations to `plan.metadata`

**Investigation Needed:**
- Review which features are most valuable to implement next
- Check current template system architecture compatibility
- Assess effort vs. value for each feature
- Prioritize based on user needs

**Proposed Actions:**
1. Review each feature from the guidance document
2. Assess current implementation status
3. Prioritize features based on:
   - User value
   - Implementation complexity
   - Dependencies
4. Create implementation plan for high-priority features
5. Start with features that have clear user value and are feasible

---

## Technical Context

### Key Files
- `features/editor/components/layout/shell/TemplateOverviewPanel.tsx` - Main panel component
- `features/editor/components/Editor.tsx` - Editor component that renders panel
- `features/editor/hooks/useEditorStore.ts` - Store with hydration logic
- `features/editor/templates/index.ts` - Template loading functions
- `features/editor/templates/api.ts` - Merge utilities

### Current Architecture
- Template loading: Master templates + program requirements merged via `mergeSections` and `mergeDocuments`
- State management: Disabled sections/documents stored in `plan.metadata.disabledSectionIds` and `disabledDocumentIds`
- Custom templates: Stored in `plan.metadata.customSections` and `customDocuments`
- Panel manages local state and syncs to plan via `onUpdate` callback

### State Variables
- `configView`: Controls switcher between 'plan' and 'program' views
- `showProductMenu`: Controls product dropdown visibility
- `showManualInput`: Controls program link input visibility
- `disabledSections` / `disabledDocuments`: Sets tracking enabled/disabled items
- `customSections` / `customDocuments`: Arrays of user-created templates

---

## Next Steps Priority

1. **High Priority:**
   - Fix dropdown clipping issue (#1)
   - Fix add section/document functionality (#5)
   - Fix text cutting in columns 2 & 3 (#4)

2. **Medium Priority:**
   - Improve configuration description and selected values display (#3)
   - Remove description and test side-by-side buttons (#2.1)
   - Investigate template upload functionality (#2.2)

3. **Low Priority:**
   - Review and implement features from guidance document (#6)

---

## Questions for Discussion

1. What product information should be shown in the selector? (pricing, features, use cases?)
2. What should users be able to upload via "Template hochladen"? (section templates, document templates, pre-filled plans?)
3. What level of editing should be available for selected sections/documents? (metadata only, or full customization?)
4. Which features from the guidance document are highest priority?
5. Should the panel be collapsible by default, or always expanded?

---

## References

- Original Guidance: `c:\Users\kevin\Downloads\Guidance for Simplifying the Templa.txt`
- Template System Handover: `docs/template-system-handover.md`
- Template Overview Handover: `docs/template-overview-handover.md`



