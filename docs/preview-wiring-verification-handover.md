# Preview Workspace – Data Wiring Verification Handover

## Overview
The preview panel (`PreviewWorkspace.tsx`) has been updated to display live business plan content. This document outlines what needs to be verified to ensure all data sources (sections, questions, metadata, attachments) are correctly wired and update in real-time.

## What Was Changed

### Files Modified
- `features/editor/components/layout/workspace/preview/PreviewWorkspace.tsx` – Main preview component
- `features/export/renderer/renderer.tsx` – Shared renderer that formats the document
- `features/editor/components/layout/right-panel/RightPanel.tsx` – Panel width increased (400px → 500px)
- `features/editor/components/Editor.tsx` – Layout wrapper width updated

### Key Features Added
1. **Live preview** that mirrors `/preview` route inline
2. **Section numbering** (Executive Summary unnumbered, others start at 1)
3. **Subchapter numbering** (e.g., "1.1", "2.2") in Table of Contents
4. **Collapsible TOC** with accordion-style section expansion
5. **Page metrics** footer showing estimated pagination
6. **Zoom controls** (90% / 100% / 110%)
7. **Full-width mode** within the Right Panel

## Verification Checklist

### ✅ 1. Sections Display Correctly

**What to check:**
- All sections from `plan.sections` appear in the preview
- Section titles display correctly (with or without numbering)
- Section descriptions (if present) render above section content
- Sections without content show placeholder: `[Section not completed yet]`

**How to test:**
1. Open editor with a plan that has multiple sections
2. Navigate to Preview tab in Right Panel
3. Verify all sections appear in the Table of Contents
4. Scroll through preview and verify section headings match editor

**Code location:**
- `PreviewWorkspace.tsx` lines 99-216: `convertSectionToPlanSection()` function
- `PreviewWorkspace.tsx` lines 223-231: Section numbering logic

**Expected behavior:**
- Executive Summary: No number prefix (just "Executive Summary")
- First numbered section: "1. Project Description" (or similar)
- Subsequent sections: "2. Innovation & Technology", "3. Impact Assessment", etc.

---

### ✅ 2. Questions/Subchapters Update in Real-Time

**What to check:**
- Questions within sections appear as subchapters (e.g., "1.1", "1.2")
- Question answers render as paragraph content
- When you edit a question answer in the editor, the preview updates immediately
- Subchapters appear in TOC when section is expanded

**How to test:**
1. Select a section with questions in the editor
2. Edit a question's answer
3. Switch to Preview tab
4. Verify the answer appears in the preview
5. Make another edit and confirm it updates without refresh

**Code location:**
- `PreviewWorkspace.tsx` lines 109-143: Question processing loop
- `PreviewWorkspace.tsx` lines 218-270: Subchapter metadata generation
- `renderer.tsx` lines 79-161: TOC rendering with subchapters

**Expected behavior:**
- Questions with answers show as: "1.1 Question prompt text"
- Answers render as formatted paragraphs
- Changes reflect immediately (no page refresh needed)

---

### ✅ 3. Metadata (Title Page) Integration

**What to check:**
- Title page displays at the top of preview
- Plan title, subtitle, author, date render correctly
- Team highlight (if present) appears
- Metadata changes in editor update the preview

**How to test:**
1. Go to Metadata workspace
2. Edit title page fields (title, subtitle, contact info)
3. Switch to Preview tab
4. Verify title page shows updated values
5. Make another change and confirm real-time update

**Code location:**
- `PreviewWorkspace.tsx` lines 223-250: Title page data extraction
- `PreviewWorkspace.tsx` lines 240-252: `planDocument.settings.titlePage` construction
- `renderer.tsx` lines 56-77: Title page rendering

**Expected behavior:**
- Title page appears above Table of Contents
- All fields from `plan.titlePage` are displayed
- Updates reflect immediately when metadata changes

---

### ✅ 4. Attachments (Datasets, KPIs, Media) Render

**What to check:**
- Datasets attached to questions appear in preview
- KPIs (standalone and question-linked) display correctly
- Media assets (images, charts) render with captions
- Attachment lists show in section content

**How to test:**
1. Create a dataset/KPI/media asset in Data panel
2. Attach it to a question
3. View preview and verify attachment appears
4. Create a standalone KPI (not linked to question)
5. Verify it appears in "Key Performance Indicators" section

**Code location:**
- `PreviewWorkspace.tsx` lines 38-90: Attachment resolution functions
- `PreviewWorkspace.tsx` lines 149-177: Attachment rendering in HTML
- `PreviewWorkspace.tsx` lines 179-195: Table conversion from datasets

**Expected behavior:**
- Question attachments: Listed under question answer
- Standalone KPIs: Appear in dedicated "Key Performance Indicators" block
- Media: Rendered as figures with captions (if supported by renderer)
- Tables: Converted from datasets and displayed

---

### ✅ 5. Real-Time Updates

**What to check:**
- Changes in editor immediately reflect in preview
- No page refresh required
- Preview stays in sync with editor state

**How to test:**
1. Keep Preview tab open
2. Edit section title in editor
3. Verify preview updates title immediately
4. Edit question answer
5. Verify preview shows new answer
6. Add/remove attachment
7. Verify preview reflects changes

**Code location:**
- `PreviewWorkspace.tsx` lines 206-259: `useMemo` hook that rebuilds `planDocument` when `plan` changes
- The `plan` prop comes from editor store and should be reactive

**Expected behavior:**
- All edits trigger preview update within 1-2 seconds
- No manual refresh needed
- Preview always matches current editor state

---

### ✅ 6. Edge Cases & Error Handling

**What to check:**
- Empty plan shows placeholder message
- Sections with no questions handle gracefully
- Missing metadata fields don't break preview
- Invalid attachment references don't crash

**How to test:**
1. Create new plan (no sections) → Should show "Start drafting your sections..."
2. Section with no questions → Should show placeholder
3. Remove title page data → Should show defaults
4. Delete attachment that's referenced → Should handle gracefully

**Code location:**
- `PreviewWorkspace.tsx` lines 261-267: Empty plan handling
- `PreviewWorkspace.tsx` lines 145-147: No content placeholder
- `PreviewWorkspace.tsx` lines 38-90: Attachment resolution with null checks

**Expected behavior:**
- Graceful degradation for missing data
- No console errors or crashes
- Helpful placeholder messages

---

## Data Flow Diagram

```
Editor Store (plan state)
    ↓
RightPanel → PreviewWorkspace (plan prop)
    ↓
PreviewWorkspace.convertSectionToPlanSection()
    ↓
PlanDocument object (sections, settings, metadata)
    ↓
ExportRenderer component
    ↓
Rendered HTML preview
```

## Key Functions to Review

### `convertSectionToPlanSection(section, sectionNumber)`
- **Location:** `PreviewWorkspace.tsx` lines 99-216
- **Purpose:** Converts `Section` → `PlanSection` with HTML content
- **Checks:**
  - Section numbering logic (skip Executive Summary)
  - Question → subchapter conversion
  - Attachment resolution
  - Table conversion from datasets

### `planDocument` useMemo
- **Location:** `PreviewWorkspace.tsx` lines 206-259
- **Purpose:** Builds `PlanDocument` from `BusinessPlan`
- **Checks:**
  - All sections mapped correctly
  - Title page metadata extracted
  - Settings (tone, language, formatting) passed through

### `ExportRenderer` component
- **Location:** `features/export/renderer/renderer.tsx`
- **Purpose:** Renders `PlanDocument` as HTML
- **Checks:**
  - TOC rendering with accordion
  - Section content rendering
  - Title page display
  - Typography and styling

## Testing Scenarios

### Scenario 1: Complete Plan
1. Load plan with 5+ sections, all with questions answered
2. Verify all sections appear in TOC
3. Expand each section in TOC
4. Verify all subchapters listed
5. Scroll through preview and verify content matches

### Scenario 2: Incomplete Plan
1. Load plan with some sections empty
2. Verify empty sections show placeholder
3. Add content to empty section
4. Verify preview updates and placeholder disappears

### Scenario 3: Metadata Changes
1. Edit title page in Metadata workspace
2. Switch to Preview
3. Verify title page reflects changes
4. Make another metadata change
5. Verify real-time update

### Scenario 4: Attachment Flow
1. Create dataset in Data panel
2. Attach to question
3. Verify dataset appears in preview
4. Create standalone KPI
5. Verify KPI appears in dedicated section

## Known Issues / Areas of Concern

1. **Page numbering:** Currently estimated based on scroll position. Real pagination requires export engine integration.
2. **Media rendering:** Images/charts may need additional work in `renderer.tsx` to display properly.
3. **Appendix/Formalien:** Not yet integrated into preview (see `docs/preview-metadata-integration-plan.md`).
4. **Performance:** Large plans (20+ sections) may need optimization for real-time updates.

## Next Steps

1. ✅ Verify all checklist items above
2. Test with real user data (various plan sizes)
3. Check browser console for errors/warnings
4. Verify responsive behavior (mobile/tablet)
5. Test with different funding program types (grant/loan/equity/visa)

## Questions to Answer

- [ ] Do all sections update in real-time when edited?
- [ ] Are question answers immediately reflected in preview?
- [ ] Does metadata (title page) update correctly?
- [ ] Do attachments (datasets/KPIs/media) render properly?
- [ ] Are there any console errors or warnings?
- [ ] Does the preview handle edge cases gracefully?
- [ ] Is performance acceptable for large plans?

## Contact

If you find issues or have questions about the wiring:
- Check `PreviewWorkspace.tsx` for data transformation logic
- Check `renderer.tsx` for rendering logic
- Review `useEditorStore.ts` to understand plan state management

---

**Last Updated:** 2025-01-XX  
**Author:** AI Assistant  
**Status:** Ready for Verification


