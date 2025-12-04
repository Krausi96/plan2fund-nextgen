# Z-Index Hierarchy Documentation

This document defines the z-index hierarchy for all modals, overlays, and popups in the editor to prevent conflicts.

## Current Z-Index Hierarchy (After Fix)

```
[Highest]
  - InfoTooltips: z-[10002] ✅ (highest - tooltips should appear above everything)
  - Product Menu Dropdown: z-[10002] ✅ (above overlay)
  - Manual Input Popup: z-[10002] ✅ (above overlay)
  - Configurator Overlay: z-[10001] ✅ (above editor, below tooltips)
  - Configurator Backdrop: z-[10000] ✅ (above editor, below overlay)
  - InlineSectionEditor: z-index: 9999 (stays as is)
  - Dialog (Radix UI): z-50 (standard dialogs)
  - Popover tooltips (sections/documents): z-[9999] (hover tooltips in CurrentSelection)
[Lowest]
```

## Component Details

### 1. InfoTooltips (`DesktopConfigurator.tsx`)
- **Z-index:** `z-[10002]`
- **Purpose:** Information tooltips (ℹ️ icons) that explain features
- **Location:** Portaled to `document.body`
- **Note:** Must be highest to appear above overlay content

### 2. Product Menu Dropdown (`DesktopConfigurator.tsx`)
- **Z-index:** `z-[10002]`
- **Purpose:** Dropdown menu for product selection
- **Location:** Portaled to `document.body`
- **Note:** Must appear above overlay when opened

### 3. Manual Input Popup (`DesktopConfigurator.tsx`)
- **Z-index:** `z-[10002]`
- **Purpose:** Input popup for manual program connection
- **Location:** Portaled to `document.body`
- **Note:** Must appear above overlay when opened

### 4. Configurator Overlay (`CurrentSelection.tsx`)
- **Z-index:** `z-[10001]`
- **Purpose:** Main overlay that covers the workspace when ⚙️ is clicked
- **Location:** Portaled to `document.body`
- **Note:** Must be above InlineSectionEditor (9999) but below tooltips

### 5. Configurator Backdrop (`CurrentSelection.tsx`)
- **Z-index:** `z-[10000]`
- **Purpose:** Dark backdrop behind the configurator overlay
- **Location:** Portaled to `document.body`
- **Note:** Must be above InlineSectionEditor (9999) but below overlay

### 6. InlineSectionEditor (`InlineSectionEditor.tsx`)
- **Z-index:** `9999` (inline style)
- **Purpose:** Floating editor panel for editing sections
- **Location:** Fixed position, portaled to `document.body`
- **Note:** Base level for editor components

### 7. Dialog Components (`shared/components/ui/dialog.tsx`)
- **Z-index:** `z-50` (Radix UI default)
- **Purpose:** Standard modal dialogs (e.g., template preview)
- **Location:** Portaled via Radix UI
- **Note:** Lower than editor components, used for standard modals

### 8. Popover Tooltips (`CurrentSelection.tsx`)
- **Z-index:** `z-[9999]`
- **Purpose:** Hover tooltips for sections/documents lists
- **Location:** Absolute positioned within CurrentSelection
- **Note:** Same level as InlineSectionEditor, but only visible on hover

## Critical Rules

1. **Configurator overlay MUST be above InlineSectionEditor**
   - InlineSectionEditor: `z-index: 9999`
   - Configurator Overlay: `z-[10001]` ✅
   - Configurator Backdrop: `z-[10000]` ✅

2. **Tooltips and popups MUST be above overlay**
   - All interactive popups: `z-[10002]` ✅
   - Overlay: `z-[10001]` ✅

3. **Backdrop MUST be above editor but below overlay**
   - Backdrop: `z-[10000]` ✅
   - Overlay: `z-[10001]` ✅

## Testing Checklist

When adding new modals/overlays:

- [ ] Check z-index against this hierarchy
- [ ] Test with InlineSectionEditor open
- [ ] Test with Configurator Overlay open
- [ ] Test with Dialog open
- [ ] Test with tooltips visible
- [ ] Verify no visual conflicts

## History

### 2024 - Initial Fix
- **Issue:** Configurator overlay (z-[100]) was below InlineSectionEditor (z-index: 9999)
- **Fix:** Updated overlay to z-[10001], backdrop to z-[10000]
- **Result:** Overlay now correctly appears above editor

