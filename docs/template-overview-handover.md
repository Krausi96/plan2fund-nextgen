# Template Overview Panel - Handover & Remaining Work

## Current Status

The Template Overview Panel has been implemented with a three-column layout (`Deine Konfiguration`, `Ausgewählte Abschnitte`, `Zusätzliche Dokumente`) and integrated into the editor workflow. The panel allows users to:

- Select product type and connect programs
- View all sections and documents that will be included
- Enable/disable optional sections and documents
- Add custom sections and documents
- See badges indicating origin (Master/Program/Custom), severity, and visibility

## Recent Fixes (Completed)

### UI Improvements
- ✅ Reduced filter button size in columns 2 and 3
- ✅ Removed filter buttons from columns 2 and 3 (per requirements)
- ✅ Added separation lines below headers in columns 2 and 3 (matching column 1)
- ✅ Added description in column 1 explaining how selectors work
- ✅ Fixed German/English translation mismatches:
  - "Funding Type" → "Förderart"
  - "Required" → "Erforderlich"
  - All tooltips and titles translated to German
- ✅ Fixed editor loading issues (empty sections guard, better error handling, race condition fixes)

### Layout & Positioning
- ✅ Template Overview Panel moved inside same container as Sidebar/Workspace
- ✅ Panel uses `sticky` positioning with `top-[72px]` to overlay content below
- ✅ Added `maxHeight: calc(100vh - 72px)` to prevent panel from exceeding viewport

## Known Issues & Remaining Work

### High Priority

#### 1. Floating/Overlay Behavior
**Issue**: The Template Overview Panel is still not properly floating over sections below. The page seems too large, and the panel doesn't overlay content as intended (similar to product selector dropdown).

**Current Implementation**:
- Panel uses `sticky top-[72px] z-[100]` positioning
- Located inside the same container as Sidebar/Workspace
- Has backdrop blur and shadow for visual separation

**Potential Solutions**:
1. **Option A**: Change to `fixed` positioning with dynamic height calculation
   - Use `fixed top-[72px] left-0 right-0 z-[100]`
   - Calculate panel height dynamically based on expanded/collapsed state
   - Add spacer div with matching height to push content down
   - Ensure panel doesn't exceed viewport height

2. **Option B**: Use absolute positioning within a relative container
   - Make the container `relative` with `overflow-visible`
   - Position panel as `absolute top-0` within container
   - Let content scroll underneath naturally

3. **Option C**: Implement virtual scrolling or reduce panel content
   - Reduce the fixed height from `h-[500px]` to something smaller
   - Make columns 2 and 3 more compact
   - Use virtual scrolling for long lists

**Recommendation**: Try Option A first, as it's most similar to how product selector works.

### Medium Priority

#### 2. Missing Features from Guidance Document

Based on `Guidance for Simplifying the Template System`, the following features are still missing:

##### 2.1 Progressive Disclosure
- **Status**: Not implemented
- **Requirement**: Tag program-only additions as `visibility: 'programOnly'` and collapse them by default
- **UI**: Add expand/collapse functionality for program-only sections
- **Location**: Column 2 (Sections) - add collapse/expand controls for program-only sections

##### 2.2 Warning Banner for Hard Rules
- **Status**: Not implemented
- **Requirement**: Display a warning banner if a program enforces hard rules (e.g., maximum word count)
- **UI**: Add banner above or below the panel header when `severity: 'hard'` requirements exist
- **Content**: Show message like "This program has strict requirements. Click here for details."

##### 2.3 Template Persistence and Reuse
- **Status**: Not implemented
- **Requirement**: Allow users to save custom templates as favorites that persist across plans
- **Storage**: Store in `userSettings` or similar
- **UI**: Add "Save as favorite" button for custom sections/documents
- **Reuse**: Show saved favorites in PlanConfigurator or Template Overview

##### 2.4 Alignment without Merging
- **Status**: Not implemented
- **Requirement**: When a program only lists keywords/topics, map them to existing master sections and highlight with badges
- **UI**: Show requirement badges with hints like "Include a risk mitigation table for AWS Pre-Seed"
- **Implementation**: Extend badge system to show keyword mappings

##### 2.5 Program-Generated Document Templates
- **Status**: Partially implemented
- **Requirement**: Generate minimal templates on the fly for program-specific documents
- **Current**: `loadProgramDocuments` generates templates, but UI could be clearer
- **Enhancement**: Add "Program-specific document" label more prominently

##### 2.6 Document Management Panel
- **Status**: Not implemented
- **Requirement**: Dedicated panel for uploading/managing documents
- **UI**: Show upload controls, status indicators (uploaded/missing), validation messages
- **Location**: Could be in workspace or as a separate tab

##### 2.7 Requirements Validation UI
- **Status**: Not implemented
- **Requirement**: Visual warnings for hard requirements, validation on export
- **UI**: Show validation status in Template Overview, blocking modal before export
- **Implementation**: Extend `runRequirementsCheck` to show results in UI

##### 2.8 Section Question Customization
- **Status**: Not implemented
- **Requirement**: Allow users to edit question text or add helper hints
- **UI**: Edit button on questions in workspace, save customizations to `plan.metadata`
- **Storage**: Store custom question text/hints separately from master templates

### Low Priority

#### 3. UI/UX Enhancements

##### 3.1 Status Summary Card
- **Status**: Missing
- **Description**: Card showing overall plan completion status
- **Location**: Column 1, below Funding Type
- **Content**: "X% complete", "Y sections done", "Z documents uploaded"

##### 3.2 Progress Indicator
- **Status**: Missing
- **Description**: Visual progress bar for plan completion
- **Location**: Header area or Column 1

##### 3.3 Requirements Status
- **Status**: Missing
- **Description**: Summary of requirement compliance
- **Location**: Column 1 or as a banner
- **Content**: "All requirements met" or "X requirements need attention"

##### 3.4 Two-Step Wizard Flow
- **Status**: Partially implemented
- **Description**: The guidance suggests a "Select → Review and customize → Confirm" flow
- **Current**: Template Overview is always visible, no explicit "Start editing" button
- **Enhancement**: Consider adding a confirmation step or making the panel collapsible by default

## Implementation Notes

### Current Architecture

1. **Template Loading**: 
   - Master templates loaded from `features/editor/templates/sections.ts` and `documents.ts`
   - Program requirements merged via `mergeSections` and `mergeDocuments` in `api.ts`
   - Custom templates stored in `plan.metadata.customSections` and `plan.metadata.customDocuments`

2. **State Management**:
   - Disabled sections/documents stored in `plan.metadata.disabledSectionIds` and `disabledDocumentIds`
   - Custom templates stored in `plan.metadata.customSections` and `customDocuments`
   - Template Overview Panel manages local state and syncs to plan via `onUpdate` callback

3. **Hydration Flow**:
   - `Editor.tsx` calls `applyHydration` when product/program changes
   - `useEditorStore.hydrate()` loads templates, filters disabled items, adds custom templates
   - Plan is created with all enabled sections and documents

### Key Files

- `features/editor/components/layout/shell/TemplateOverviewPanel.tsx` - Main panel component
- `features/editor/components/Editor.tsx` - Editor component that renders panel
- `features/editor/hooks/useEditorStore.ts` - Store with hydration logic
- `features/editor/templates/index.ts` - Template loading functions
- `features/editor/templates/api.ts` - Merge utilities

## Next Steps

1. **Immediate**: Fix floating/overlay behavior (High Priority #1)
2. **Short-term**: Implement progressive disclosure and warning banner (Medium Priority #2.1, #2.2)
3. **Medium-term**: Add template persistence and document management panel (Medium Priority #2.3, #2.6)
4. **Long-term**: Complete remaining features from guidance document

## Questions for Discussion

1. Should the Template Overview Panel be collapsible by default, or always expanded?
2. How should we handle very long lists of sections/documents? Virtual scrolling?
3. Should custom templates be editable after creation, or only deletable?
4. How should we handle program requirements that don't map cleanly to master sections?
5. Should the panel be fixed height or dynamic based on content?

## References

- Original Guidance: `c:\Users\kevin\Downloads\Guidance for Simplifying the Templa.txt`
- Template System Handover: `docs/template-system-handover.md`
- Template Overview Redesign: `docs/template-overview-redesign-v2.md` (if exists)



