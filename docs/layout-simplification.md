# Layout Simplification - Single Preview Solution

## Problem Identified

The interface was showing **TWO duplicate previews**:
1. Main DocumentCanvas (center) - showing preview
2. Right Panel Preview tab - showing another preview

This was:
- ❌ Redundant and confusing
- ❌ Wasting screen space
- ❌ Compressed and hard to use
- ❌ Not aligned with "document as main attractor" principle

---

## Solution Implemented

### ✅ Single Preview in DocumentCanvas

**The main DocumentCanvas IS the preview** - it's the "real document as main attractor"

- **Location:** Center panel (main area)
- **Purpose:** The primary document view
- **Features:**
  - Full document preview using ExportRenderer
  - Same formatting as final export
  - Live updates as you edit
  - Click sections to edit
  - Watermark toggle
  - View mode (Page/Fluid)

### ✅ Right Panel = Tools Only (AI + Data)

**Right panel is now ONLY for tools**, not preview:

- **Tabs:**
  - 💬 **AI** - Assistant for writing help
  - 📊 **Data** - Datasets, KPIs, Media management
  - ❌ **Preview** - REMOVED (no longer needed)

- **Features:**
  - Requirements validation (at bottom of AI tab)
  - Context-aware suggestions
  - Data management
  - No duplicate preview

---

## New Layout Structure

```
┌─────────────────────────────────────────────────┐
│  Sidebar (240px) │  DocumentCanvas  │  RightPanel │
│                  │                  │  (400px)    │
│  Section Tree    │  PREVIEW         │  [AI] [Data]│
│  Navigation      │  (ExportRenderer)│             │
│                  │                  │  AI Tools   │
│  ✅ Section 1    │  Business Plan   │  Data Tools │
│  ⚠️ Section 2    │  Document        │  Req. Check │
│  ❌ Section 3    │  (Single Source) │             │
└─────────────────────────────────────────────────┘
```

---

## Benefits

### ✅ Single Source of Truth
- One preview = no confusion
- DocumentCanvas is the main document
- Right panel is for tools only

### ✅ More Screen Space
- Preview gets full center area
- No compressed duplicate views
- Better readability

### ✅ Clearer Mental Model
- **Document = Main** (center)
- **Tools = Side** (right panel)
- **Navigation = Side** (left sidebar)

### ✅ Better UX
- Less cognitive load
- Clearer purpose for each panel
- Easier to focus on document

---

## What Changed

### Removed:
- ❌ Preview tab from RightPanel
- ❌ Duplicate PreviewWorkspace in right panel
- ❌ Redundant preview controls

### Kept:
- ✅ DocumentCanvas as main preview
- ✅ AI and Data tabs in right panel
- ✅ Requirements validation (moved to AI tab)

### Improved:
- ✅ Right panel default view = AI (not preview)
- ✅ Requirements validation integrated into AI tab
- ✅ Cleaner, more focused interface

---

## Initial Idea (Recap)

The original document-centric layout concept was:

> **"The real document as main attractor"**

This means:
- **Document preview is the CENTER** - not a side panel
- **Tools are ACCESSORY** - slide in when needed
- **Navigation is SUPPORTING** - sidebar for structure

We've now achieved this:
- ✅ Document is the main focus (center)
- ✅ Tools are secondary (right panel)
- ✅ Navigation is supporting (left sidebar)
- ✅ No duplicate previews

---

## Next Steps (Optional)

1. **Click-to-Edit in Preview**
   - Make sections in DocumentCanvas clickable
   - Click section → Opens EditorOverlay

2. **Section Highlighting**
   - Highlight active section in preview
   - Visual feedback for navigation

3. **Live Updates**
   - Real-time preview updates as you type
   - Debounced for performance

---

*Document created: 2024*
*Layout simplification - single preview solution*

