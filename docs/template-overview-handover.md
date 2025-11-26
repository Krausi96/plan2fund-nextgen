# Template Overview Panel - Handover Document

## Overview
The Template Overview Panel (now called "Dein Schreibtisch" / "Your Desktop") has been integrated with PlanConfigurator functionality and moved to the header position. It now serves as the unified configuration interface for the editor.

## Current Status

### ✅ Completed
- Integrated PlanConfigurator functionality into TemplateOverviewPanel
- Moved panel to header position (replaces PlanConfigurator)
- Three-column layout implemented (Product Info | Sections | Documents)
- Interactive product selector dropdown
- Interactive program connection (Open Finder, Paste Link, Disconnect)
- Filter buttons for Sections and Documents (All | Master | Program | Custom)
- Custom sections/documents can be added and deleted
- Dark theme matching PlanConfigurator styling
- Column separators added
- Translation keys added (`editor.desktop.title`)

### ⚠️ Known Issues

#### 1. Layout Not Overlapping Content
**Status:** ❌ Not Working

**Problem:**
- Panel is set to `sticky top-0 z-50` but content below is not being overlapped
- Panel should float above the editor workspace content

**Expected Behavior:**
- Panel should be positioned absolutely or use a different sticky strategy
- Content below should scroll underneath the panel
- Panel should have a shadow/elevation to indicate it's floating

**Current Code Location:**
- `features/editor/components/layout/shell/TemplateOverviewPanel.tsx` (line ~400)
- Container div has: `className="sticky top-0 z-50 bg-slate-900/98 backdrop-blur-xl border-b border-blue-600/50 shadow-lg"`

**Investigation Needed:**
- Check if parent container has `overflow` properties that prevent overlapping
- Verify z-index stacking context
- Consider using `fixed` positioning instead of `sticky`
- Check if workspace content needs `margin-top` or `padding-top` to account for panel height

**Files to Check:**
- `features/editor/components/Editor.tsx` - Check container structure
- `features/editor/components/layout/shell/TemplateOverviewPanel.tsx` - Positioning classes

---

#### 2. Remove Funding Type from Column One
**Status:** ❌ Not Done

**Current State:**
- Column 1 shows: Product Type, Program, Funding Type
- Funding Type card is the third card in the Product Information column

**Required Change:**
- Remove the "Funding Type" card completely
- Keep only: Product Type and Program cards

**Location:**
- `features/editor/components/layout/shell/TemplateOverviewPanel.tsx`
- Look for "Funding Type Card" comment around line ~550

**Code to Remove:**
```tsx
{/* Funding Type Card */}
<div className="bg-white/5 border border-white/10 rounded-lg p-4">
  <h3 className="text-xs font-semibold text-white/70 uppercase tracking-wide mb-2">Funding Type</h3>
  <div className="flex items-center gap-2">
    <span className="text-lg">💰</span>
    <p className="text-sm font-semibold text-white">{FUNDING_TYPE_LABELS[fundingType] || fundingType}</p>
  </div>
</div>
```

---

#### 3. Make "Pläne" and "Program auswählen" More Transparent
**Status:** ❌ Needs Improvement

**Current State:**
- Product Type selector shows dropdown with product options
- Program connection shows buttons or connected program

**Required Improvements:**
- **Product Type ("Pläne"):**
  - Make it clearer what each product type does
  - Consider adding tooltips or help text
  - Maybe show a brief description when hovering
  - Consider making the current selection more obvious

- **Program Selection ("Program auswählen"):**
  - Make it clearer how to connect a program
  - Improve the "Open ProgramFinder" button visibility/description
  - Make the "Paste program link" option more discoverable
  - Consider adding a visual indicator when no program is connected
  - Maybe show benefits of connecting a program

**Location:**
- `features/editor/components/layout/shell/TemplateOverviewPanel.tsx`
- Product Type Card: ~line 453
- Program Card: ~line 485

**Suggestions:**
- Add help icons with tooltips
- Improve button labels and descriptions
- Add visual feedback for empty states
- Consider adding a "Why connect a program?" section

---

#### 4. Ensure Sections and Documents Are Addable
**Status:** ⚠️ Partially Working

**Current State:**
- "+ Add Custom Section" button exists
- "+ Add Custom Document" button exists
- Buttons show inline form when clicked
- Custom items are added to state and passed to `onUpdate`

**Verification Needed:**
- Test that clicking "Add Custom Section" actually adds a section
- Test that clicking "Add Custom Document" actually adds a document
- Verify custom items appear in the editor workspace
- Check if custom items persist after page reload
- Verify custom items are saved in plan metadata

**Location:**
- `features/editor/components/layout/shell/TemplateOverviewPanel.tsx`
- `addCustomSection()` function: ~line 201
- `addCustomDocument()` function: ~line 224
- Add buttons: ~line 484 and ~line 587

**Potential Issues:**
- Custom items might not be integrated into plan hydration
- Custom items might not appear in Sidebar
- Custom items might not be editable after creation

---

#### 5. Check If We Can Go Deeper - Edit Sections
**Status:** ❌ Not Implemented

**Current State:**
- Sections are displayed with title, description, badges
- Custom sections can be added and deleted
- No way to edit section properties (title, description, prompts, word counts)

**Investigation Needed:**
- Can we add an "Edit" button/icon to custom sections?
- Should editing open a modal/dialog?
- What properties should be editable?
  - Title
  - Description
  - Prompts/questions
  - Word count requirements
  - Visibility settings
- Should master/program sections also be editable (or only custom)?

**Location:**
- `features/editor/components/layout/shell/TemplateOverviewPanel.tsx`
- Section rendering: ~line 427

**Considerations:**
- Editing master sections might require creating a "custom override"
- Editing program sections might not make sense (they come from API)
- Focus on custom sections first
- Consider inline editing vs. modal dialog

---

## Technical Details

### File Structure
```
features/editor/components/layout/shell/
├── TemplateOverviewPanel.tsx  (Main component - integrated with PlanConfigurator)
├── PlanConfigurator.tsx        (Still exists but not used - can be removed)
└── Workspace.tsx               (Exports PlanConfigurator types)
```

### Key Props
```typescript
export interface TemplateOverviewPanelProps {
  productType: ProductType;
  programSummary: ProgramSummary | null;
  fundingType: string;
  planMetadata?: {
    disabledSectionIds?: string[];
    disabledDocumentIds?: string[];
    customSections?: any[];
    customDocuments?: any[];
  };
  onUpdate: (options: {...}) => void;
  // PlanConfigurator props
  onChangeProduct: (product: ProductType) => void;
  onConnectProgram: (value: string | null) => void;
  onOpenProgramFinder: () => void;
  programLoading: boolean;
  programError: string | null;
  productOptions: Array<{...}>;
  connectCopy: ConnectCopy;
}
```

### State Management
- Custom sections/documents stored in component state
- Passed to parent via `onUpdate` callback
- Should be stored in `plan.metadata.customSections` and `plan.metadata.customDocuments`
- Restored from `planMetadata` prop on mount

### Translation Keys
- `editor.desktop.title` - Panel title ("Your Desktop" / "Dein Schreibtisch")
- `editor.header.productType` - Product type label
- `editor.connect.*` - Program connection labels (already exist)

---

## Testing Checklist

### Layout & Positioning
- [ ] Panel overlaps content below (currently not working)
- [ ] Panel stays at top when scrolling
- [ ] Content scrolls underneath panel
- [ ] Panel has proper shadow/elevation

### Functionality
- [ ] Product type selector works
- [ ] Program connection works (Open Finder, Paste Link)
- [ ] Program disconnect works
- [ ] Sections can be toggled on/off
- [ ] Documents can be toggled on/off
- [ ] Custom sections can be added
- [ ] Custom documents can be added
- [ ] Custom items can be deleted
- [ ] Filters work (All | Master | Program | Custom)
- [ ] State persists after page reload

### UI/UX
- [ ] Translation works (German/English)
- [ ] Dark theme consistent
- [ ] Column separators visible
- [ ] Product type selection is clear
- [ ] Program connection is discoverable
- [ ] Add buttons are visible and work

---

## Next Steps for Colleague

### Priority 1: Fix Overlapping Issue
1. Investigate why `sticky top-0 z-50` isn't working
2. Check parent container CSS
3. Consider alternative positioning (fixed, absolute)
4. Test with different content below

### Priority 2: Remove Funding Type
1. Remove Funding Type card from Column 1
2. Test layout still looks good with 2 cards
3. Update any references if needed

### Priority 3: Improve Transparency
1. Add tooltips/help text to Product Type selector
2. Improve Program connection UI/UX
3. Add visual indicators for empty states
4. Consider adding "Why connect?" messaging

### Priority 4: Verify Add Functionality
1. Test adding custom sections/documents
2. Verify they appear in editor workspace
3. Check persistence
4. Fix any issues found

### Priority 5: Section Editing (If Time Permits)
1. Research if editing is needed
2. Design editing UI (modal vs inline)
3. Implement editing functionality
4. Test thoroughly

---

## Questions to Consider

1. Should the panel be collapsible by default or always expanded?
2. Should custom sections be editable immediately after creation?
3. Should we allow editing of master/program sections (or only custom)?
4. What's the best way to make program connection more discoverable?
5. Should there be a "Save Configuration" button or auto-save?

---

## Code References

### Main Component
- `features/editor/components/layout/shell/TemplateOverviewPanel.tsx`

### Integration Point
- `features/editor/components/Editor.tsx` (line ~372)

### Translation Files
- `shared/i18n/translations/en.json` (add `editor.desktop.title`)
- `shared/i18n/translations/de.json` (add `editor.desktop.title`)

### Related Components
- `features/editor/components/layout/shell/PlanConfigurator.tsx` (can be removed if not used elsewhere)
- `features/editor/hooks/useEditorStore.ts` (hydration logic)

---

**Last Updated:** [Current Date]
**Status:** Core functionality complete, layout and UX improvements needed
**Next Priority:** Fix overlapping issue, remove Funding Type, improve transparency

