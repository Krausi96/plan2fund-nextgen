# TemplateOverviewPanel - Handover Document

## Current Status

The `TemplateOverviewPanel` component has been significantly refactored and improved. The component displays a three-column layout for configuring business plan templates, including product selection, program connection, and section/document management.

## Recent Changes Completed

### UI Improvements
1. **Removed "Abschnitte/Dokumente aktiv" rows** from "Aktuelle Konfiguration" summary
2. **Removed badges below section/document names** (Erf., P, M, C badges)
3. **Pencil icon and checkbox positioning**:
   - Currently positioned at `top-2.5 right-2.5` in the top-right corner
   - Pencil icon on the left, checkbox on the right
   - Both are inside the card border
4. **Removed "Edit"/"Bearbeiten" text** below the pencil icon
5. **Fixed overflow issues** - Added `overflow-visible` to multiple containers to prevent clipping
6. **Expanded card editing** - Clicking pencil icon shows full-width edit form, hiding the grid

### Technical Changes
- Added `overflow-visible` to Card wrapper, column containers, and grid containers
- Increased padding on columns (`pr-8`) and grids (`pr-4`) to accommodate checkboxes
- Fixed translation key from `editor.edit` to `editor.ui.edit`
- Removed unused hover tooltips and title attributes

## Next Tasks

### Priority 1: Improve Pencil/Checkbox Positioning

**Task**: Move the pencil icon and checkbox to the **top-right corner** (above the icon) to make it clearer that items can be selected and edited.

**Current State**:
- Pencil and checkbox are at `top-2.5 right-2.5`
- They appear in the top-right but could be more prominent

**Desired State**:
- Position them at the absolute top-right corner (e.g., `top-1 right-1` or `top-0.5 right-0.5`)
- Ensure they're clearly visible and don't overlap with the icon
- Consider making them slightly larger or more prominent
- Ensure they work well on hover states

**Implementation Notes**:
- Current code location: Lines ~974-997 (sections) and ~1205-1228 (documents)
- The container uses `absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5`
- Consider adding hover effects or visual indicators to make the edit/select functionality more discoverable

### Priority 2: UX Improvements

1. **Visual Hierarchy**:
   - Make the pencil and checkbox more prominent
   - Consider adding a subtle background or border to the container
   - Add hover states that highlight the edit/select area

2. **Accessibility**:
   - Ensure keyboard navigation works for both pencil and checkbox
   - Add proper ARIA labels
   - Consider tooltips on hover explaining functionality

3. **Responsive Design**:
   - Test on smaller screens
   - Ensure checkboxes and pencils remain accessible on mobile

## Technical Context

### File Structure
- **Main Component**: `features/editor/components/layout/shell/TemplateOverviewPanel.tsx`
- **Types**: `features/editor/templates/types.ts`
- **API**: `features/editor/templates/api.ts`

### Key State Variables
- `expandedSectionId` / `expandedDocumentId`: Controls which item is being edited
- `editingSection` / `editingDocument`: Holds the editable data
- `disabledSections` / `disabledDocuments`: Tracks which items are disabled
- `showConfigTooltip`: Controls info tooltip in "Deine Konfiguration"

### Key Functions
- `handleEditSection(section, e)`: Opens edit form for a section
- `handleEditDocument(doc, e)`: Opens edit form for a document
- `toggleSection(id)`: Enables/disables a section
- `toggleDocument(id)`: Enables/disables a document
- `handleSaveSection()`: Saves edited section (creates custom if needed)
- `handleSaveDocument()`: Saves edited document (creates custom if needed)

### Component Structure
```
TemplateOverviewPanel
├── Header (Product selection, program connection)
├── Three-Column Layout (when expanded)
│   ├── Column 1: "Deine Konfiguration"
│   │   ├── Switcher (Plan auswählen / Programm verbinden)
│   │   ├── Plan selection / Program connection
│   │   └── "Aktuelle Konfiguration" summary
│   ├── Column 2: "Ausgewählte Abschnitte"
│   │   ├── Grid of section cards
│   │   │   └── Each card: Icon, Title, Pencil, Checkbox
│   │   └── Add section form
│   └── Column 3: "Zusätzliche Dokumente"
│       ├── Grid of document cards
│       │   └── Each card: Icon, Title, Pencil, Checkbox
│       └── Add document form
└── Template preview dialog
```

### Styling Notes
- Cards use `rounded-lg` with various border colors based on state
- Required items have amber borders (`border-amber-500/30`)
- Disabled items have reduced opacity (`opacity-60`)
- Custom items show a delete button (×) on hover
- Grid uses `grid-cols-3` with `gap-2`

## Known Issues

1. **Overflow Settings**: Multiple containers have `overflow-visible` which might cause layout issues in some edge cases. Monitor for any unexpected clipping.

2. **Z-index Management**: The pencil/checkbox container uses `z-10`. Ensure this doesn't conflict with other overlays.

3. **Translation**: The component uses `t('editor.ui.edit')` for translations. Ensure this key exists in all language files.

## Code Locations

### Pencil and Checkbox (Sections)
- **Location**: Lines ~974-997
- **Current positioning**: `absolute top-2.5 right-2.5`

### Pencil and Checkbox (Documents)
- **Location**: Lines ~1205-1228
- **Current positioning**: `absolute top-2.5 right-2.5`

### Card Structure
- Section cards: Lines ~963-1018
- Document cards: Lines ~1194-1249

## Testing Checklist

- [ ] Pencil icon opens edit form correctly
- [ ] Checkbox toggles section/document enabled state
- [ ] Edit form saves changes properly
- [ ] Custom items can be deleted
- [ ] No clipping issues on different screen sizes
- [ ] Keyboard navigation works
- [ ] Translations display correctly (DE/EN)
- [ ] Hover states work as expected

## Questions for Next Developer

1. Should the pencil and checkbox be always visible or only on hover?
2. Do we want tooltips explaining what each button does?
3. Should there be visual feedback when hovering over the edit/select area?
4. Are there any accessibility requirements we need to meet?

## Related Files

- `docs/template-overview-handover.md` - Previous handover document
- `features/editor/components/layout/shell/Sidebar.tsx` - Related component
- `shared/i18n/translations/en.json` - English translations
- `shared/i18n/translations/de.json` - German translations

## Notes

- The component uses React hooks extensively (`useState`, `useEffect`, `useRef`)
- Portal is used for dropdown menus (`createPortal` from `react-dom`)
- The component handles both master templates and custom user-created templates
- When editing master/program templates, a new custom template is created and the original is disabled

---

**Last Updated**: Current session
**Next Developer**: Please update this document as you make changes

