# Preview Renderer - Handover Document

**Date:** $(date)  
**Author:** Development Team  
**Status:** In Progress - Needs Review & Improvements

## Overview

This document outlines the current state of the preview renderer (`features/export/renderer/renderer.tsx`) and identifies areas that need attention from the design/UX team.

## Recent Changes

The preview renderer has been updated to:
- ✅ Use proper section numbering (1, 2, etc., excluding Executive Summary)
- ✅ Display subchapters in Table of Contents (1.1, 1.2, etc.)
- ✅ Show attachments in TOC and render them at the end
- ✅ Use actual completion status from section data
- ✅ Render HTML content properly
- ✅ Include references and appendices sections
- ✅ Fix export/import issues (changed from React.FC to function declaration)

## Issues Requiring Attention

### 1. Title Page Preview - **CRITICAL**

**Problem:** The title page data is displayed without proper context or formatting. All metadata fields are just listed without visual hierarchy or design.

**Current Implementation:**
- Logo, title, subtitle, company name, legal form, team highlight, author, contact info, date, and confidentiality statement are all rendered
- However, they lack proper styling, spacing, and visual organization

**What Needs to Be Done:**
- Design a proper title page layout with:
  - Clear visual hierarchy
  - Proper spacing and alignment
  - Professional formatting
  - Contextual grouping of information
  - Better typography choices
- Consider:
  - Logo placement and sizing
  - Title prominence
  - Contact information layout
  - Date and confidentiality statement positioning

**Location:** `features/export/renderer/renderer.tsx` lines 47-90

---

### 2. Subchapter Formatting - **HIGH PRIORITY**

**Problem:** Subchapters (e.g., "2.1.") look awful in the preview. The formatting needs improvement.

**Current Implementation:**
- Subchapters are rendered in the HTML content with format: `{sectionNumber}.{subchapterIndex} {question.prompt}`
- Example: "2.1 Describe what is novel about your solution..."
- The numbering and text lack proper styling

**What Needs to Be Done:**
- Improve subchapter typography:
  - Better font sizing relative to main content
  - Proper spacing between number and text
  - Visual distinction from regular paragraphs
  - Consider using a different font weight or color
- CSS classes are available: `section-subchapter` (line 117 in PreviewWorkspace.tsx)
- Add proper styling to make subchapters visually appealing

**Location:** 
- Rendering: `features/export/renderer/renderer.tsx` (content is HTML from PreviewWorkspace)
- Generation: `features/editor/components/layout/workspace/preview/PreviewWorkspace.tsx` line 117

---

### 3. Attachments Verification - **MEDIUM PRIORITY**

**Problem:** Need to verify that attachments are being added and displayed correctly.

**Current Implementation:**
- Attachments are collected from:
  - Tables in sections (`section.tables`)
  - Figures in sections (`section.figures`)
- They appear in:
  - Table of Contents (if any attachments exist)
  - Dedicated "Attachments" section at the end of the document

**What Needs to Be Checked:**
- ✅ Are attachments being collected correctly from all sections?
- ✅ Do they appear in the TOC?
- ✅ Is the attachments section at the end displaying correctly?
- ✅ Are table attachments showing with proper labels?
- ✅ Are figure attachments (images) displaying correctly?
- ✅ Is the section reference (e.g., "2. Innovation & Technology") correct?

**Location:** 
- TOC: `features/export/renderer/renderer.tsx` lines 125-140
- Attachments section: `features/export/renderer/renderer.tsx` lines 230-270

---

### 4. Page Numbers & Formatting - **FUTURE ENHANCEMENT**

**Problem:** Page numbers and advanced formatting are not yet implemented.

**Current State:**
- No page numbers are displayed
- Basic formatting only (no print-specific styles)
- No page breaks
- No headers/footers

**What Needs to Be Done (Future):**
- Implement page numbering:
  - Consider page breaks at section boundaries
  - Add page numbers to headers/footers
  - Handle page numbering for title page (usually unnumbered)
- Add print-specific formatting:
  - Page margins
  - Print stylesheet
  - Page break controls
  - Header/footer design

**Note:** This is marked as future work, but should be considered for the final export functionality.

---

## Technical Details

### File Structure

```
features/export/renderer/renderer.tsx
├── ExportRenderer component (main renderer)
├── formatTableLabel function
└── renderTable function
```

### Key Data Structures

**PlanSection:**
```typescript
{
  key: string,
  title: string,
  content: string (HTML),
  fields?: {
    sectionNumber: number | null,
    displayTitle: string,
    subchapters: Array<{id, title, numberLabel}>,
    hasRealContent: boolean
  },
  tables?: Record<string, Table>,
  figures?: Array<FigureRef>,
  status?: 'aligned' | 'needs_fix' | 'missing'
}
```

**PlanDocument:**
- Contains `sections: PlanSection[]`
- Contains `references?: Reference[]`
- Contains `appendices?: AppendixItem[]`
- Contains `settings.titlePage` with all metadata

### CSS Classes Available

- `export-preview` - Main container
- `preview-title-page` - Title page container
- `section-subchapter` - Subchapter headings (in HTML content)
- `section-block` - Section container
- `section-heading` - Section heading container

---

## Testing Checklist

### Title Page
- [ ] Logo displays correctly
- [ ] All metadata fields are visible
- [ ] Information is properly grouped
- [ ] Visual hierarchy is clear
- [ ] Spacing and alignment look professional

### Subchapters
- [ ] Subchapters display with proper numbering (1.1, 1.2, etc.)
- [ ] Typography is readable and appealing
- [ ] Spacing between number and text is appropriate
- [ ] Subchapters are visually distinct from regular content

### Attachments
- [ ] Attachments appear in TOC
- [ ] Attachments section displays at the end
- [ ] All tables are listed correctly
- [ ] All figures/images are listed correctly
- [ ] Section references are accurate

### General
- [ ] Section numbering is correct (1, 2, etc., excluding Executive Summary)
- [ ] Completion status reflects actual section status
- [ ] HTML content renders properly
- [ ] References section displays (if present)
- [ ] Appendices section displays (if present)

---

## Next Steps

1. **Immediate:** Review and improve title page design
2. **Immediate:** Fix subchapter formatting/styling
3. **Short-term:** Verify attachments functionality
4. **Future:** Implement page numbers and print formatting

---

## Questions or Issues?

If you encounter any problems or have questions about the implementation, please check:
- The renderer component: `features/export/renderer/renderer.tsx`
- The preview workspace: `features/editor/components/layout/workspace/preview/PreviewWorkspace.tsx`
- The section conversion logic: `convertSectionToPlanSection` function in PreviewWorkspace.tsx

---

**Last Updated:** 2024-12-19

