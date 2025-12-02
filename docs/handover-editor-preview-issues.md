# Handover: Editor Preview & Sidebar Issues

## 🚨 **CRITICAL ISSUES TO FIX**

### **1. Preview Still Too Zoomed In**
**Location:** `features/editor/components/layout/Workspace/Preview/PreviewWorkspace.tsx`

**Problem:**
- Preview page appears zoomed in, showing only a portion of the A4 page
- Full page is not visible at 100% zoom
- Scale calculation may not be working correctly

**Current Implementation:**
- Scale calculation in `useEffect` at line ~298-329
- Uses `A4_WIDTH_PX = 793.7` (assumes 96 DPI)
- Problem: On high-DPI displays, `210mm` CSS converts to much larger pixel values
- The ResizeObserver measures container width but may not account for actual rendered page width

**Attempted Fixes:**
- Added `measureActualPageWidth()` function to measure actual rendered width
- Added scale calculation that accounts for browser DPI conversion
- Added debug logging (check browser console)
- CSS variable `--preview-viewport-zoom` is set but may not be applied correctly

**Investigation Needed:**
1. Check browser console for debug logs showing calculated scale values
2. Verify CSS variable `--preview-viewport-zoom` is actually being read by `.export-preview-page` class
3. Check if page element exists when `measureActualPageWidth()` is called
4. Verify the transform scale is being applied correctly in `styles/globals.css` line 521

**Potential Solutions:**
- Ensure page element exists before measuring (add retry logic with longer delays)
- Apply scale directly via inline styles instead of CSS variables
- Force a default scale (e.g., 0.7) if measurement fails
- Check if there are multiple transforms being applied

**Files to Check:**
- `features/editor/components/layout/Workspace/Preview/PreviewWorkspace.tsx` (lines 298-329, 470-477)
- `styles/globals.css` (line 521: `transform: scale(var(--preview-viewport-zoom, 1))`)
- Browser DevTools: Check computed styles on `.export-preview-page` element

---

### **2. Sidebar Not Scrollable**
**Location:** `features/editor/components/Editor.tsx` and `features/editor/components/layout/Workspace/Navigation/Sidebar.tsx`

**Problem:**
- Sidebar sections cannot be scrolled
- User cannot access sections below the visible area
- Content appears cut off

**Current Implementation:**
- Sidebar container in `Editor.tsx` line 621: `overflow-hidden` was removed
- Sidebar component line 88: `overflow-hidden` was removed, changed to `min-h-0`
- Sections tree container line 197: Has `overflow-y-auto min-h-0`

**Investigation Needed:**
1. Check if parent containers have `overflow-hidden` or `max-height` constraints
2. Verify flex layout allows scrolling (need `min-h-0` on flex children)
3. Check if grid row height is constraining the sidebar
4. Verify the sections tree container has proper height constraints

**Potential Solutions:**
- Ensure all parent containers allow overflow
- Add `overflow-y-auto` to sidebar container in Editor.tsx
- Verify grid row 2 has proper height allocation
- Check if `min-h-[700px]` is causing issues

**Files to Check:**
- `features/editor/components/Editor.tsx` (line 621: sidebar container)
- `features/editor/components/layout/Workspace/Navigation/Sidebar.tsx` (line 88: main container, line 197: sections tree)
- Grid layout in `Editor.tsx` line 565: `grid-rows-[auto_1fr]`

---

### **3. Change "Dokument hinzufügen" to "Hinzufügen"**
**Location:** `features/editor/components/layout/Workspace/Content/DocumentsBar.tsx`

**Change Needed:**
- Line ~106: Change button text from "Dokument hinzufügen" to "Hinzufügen"
- This is the "Add Document" button in the DocumentsBar

**Current Code:**
```tsx
<span>{t('editor.desktop.documents.addButton' as any) || 'Dokument hinzufügen'}</span>
```

**Target:**
```tsx
<span>{t('editor.desktop.documents.addButton' as any) || 'Hinzufügen'}</span>
```

---

## 📋 **REMAINING TASKS FROM ORIGINAL HANDOVER**

### **From `docs/handover-editor-continuation.md`:**

#### **Quick Fixes (Still Needed):**

1. **"Deine Dokumente" - Remove Spacing & Improve Legend**
   - ✅ Remove spacing below header (DONE)
   - ✅ Remove border below header (DONE)
   - ✅ Increase legend size (DONE - changed to `text-xs`)
   - ⚠️ **Status:** Changes were rejected by user, may need to re-apply

2. **"Deine Abschnitte" - Remove Spacing & Improve Legend**
   - ✅ Remove spacing after separation line (DONE)
   - ✅ Increase legend size (DONE - changed to `text-xs`)
   - ⚠️ **Status:** Changes were rejected by user, may need to re-apply

#### **Preview Sizing Issue:**
- ⚠️ **Still broken** - See Issue #1 above
- Preview area getting cut off
- Sections appear very small
- Layout constraints causing content to shrink

---

## 🔧 **IMMEDIATE ACTION ITEMS**

### **Priority 1: Fix Preview Zoom**
1. Add console logging to verify scale calculation
2. Check if CSS variable is being applied (inspect element in DevTools)
3. Consider applying scale directly via inline style on ExportRenderer
4. Add fallback: if measurement fails, use default scale (0.7)

### **Priority 2: Fix Sidebar Scrolling**
1. Verify all parent containers allow overflow
2. Ensure flex children have `min-h-0` for proper scrolling
3. Check grid row height constraints
4. Test scrolling in browser DevTools

### **Priority 3: Text Change**
1. Update DocumentsBar button text to "Hinzufügen"

### **Priority 4: Re-apply Quick Fixes (if needed)**
1. Check if spacing/legend changes need to be re-applied
2. Verify user requirements for these changes

---

## 📝 **TECHNICAL NOTES**

### **Preview Scaling Architecture:**
- CSS: `styles/globals.css` line 521 uses `transform: scale(var(--preview-viewport-zoom, 1))`
- React: `PreviewWorkspace.tsx` sets `--preview-viewport-zoom` CSS variable via `zoomStyle`
- Calculation: `useEffect` with ResizeObserver measures container and page width
- Issue: Measurement may happen before page renders, or CSS variable not applied

### **Sidebar Scrolling Architecture:**
- Grid Layout: `Editor.tsx` uses `grid-rows-[auto_1fr]` - row 2 should take remaining space
- Sidebar Container: Flex column with `flex-1` and `min-h-0`
- Sections Tree: Has `overflow-y-auto` but may be constrained by parent

### **Key Files:**
- `features/editor/components/Editor.tsx` - Main layout grid
- `features/editor/components/layout/Workspace/Preview/PreviewWorkspace.tsx` - Preview scaling logic
- `features/editor/components/layout/Workspace/Navigation/Sidebar.tsx` - Sidebar component
- `features/editor/components/layout/Workspace/Content/DocumentsBar.tsx` - Documents bar
- `styles/globals.css` - CSS transform for preview scaling

---

## 🐛 **DEBUGGING STEPS**

### **For Preview Zoom:**
1. Open browser DevTools Console
2. Look for `[PreviewWorkspace]` debug logs
3. Inspect `.export-preview-page` element
4. Check computed `transform` style
5. Verify `--preview-viewport-zoom` CSS variable value
6. Check if page element exists when measuring

### **For Sidebar Scrolling:**
1. Inspect sidebar container in DevTools
2. Check computed `overflow` styles on all parent containers
3. Verify flex/grid height calculations
4. Check if content height exceeds container height
5. Test with `overflow-y: auto !important` temporarily

---

## ✅ **COMPLETED (Reference)**
- File structure reorganization
- Import paths updated
- Grid layout structure in place
- Preview container setup
- Sidebar container setup

---

**Last Updated:** Current session
**Status:** Critical issues remain - preview zoom and sidebar scrolling not working

