# Clarification Questions & Visual Design

## 🔍 Clarifying Questions (Max 5)

### 1. **Requirements Checker Stats Calculation**
   - Should `runRequirementsCheck()` be enhanced to calculate the detailed stats (complete/needs work/missing counts) or do we need to build a separate calculation function?
   - What defines a requirement as "complete" vs "needs work" vs "missing"? Is this based on `progressSummary` percentages (e.g., 100% = complete, 50-99% = needs work, <50% = missing)?

### 2. **Desktop Component Fate**
   - After integration, should the `Desktop.tsx` component be completely removed, or kept as a thin wrapper that renders `CurrentSelection` with expanded configurator?
   - Should the "🖥️ Dein Schreibtisch" header remain visible when collapsed, or should it be replaced with just "AKTUELLE AUSWAHL"?

### 3. **Expansion Trigger & State**
   - Should the expansion be triggered by a button click, or should it auto-expand when user first configures templates?
   - Should the expanded state persist across page reloads (stored in localStorage/sessionStorage)?

### 4. **Feature Explanations Display**
   - Should explanations appear as:
     - **A)** Inline tooltips (ℹ️ icons) next to each feature label?
     - **B)** Expandable "Learn More" sections within the configurator?
     - **C)** A separate help panel/modal accessible via a "?" button?
   - Should explanations be shown by default for first-time users, or always hidden until requested?

### 5. **Requirements Checker Stats Interaction**
   - Should clicking on the stats expand to show a detailed breakdown, or should it navigate to a separate requirements checker view?
   - Should the stats update automatically when plan content changes, or only on manual "Refresh Check" button click?

---

## 📐 Current State Visual

### **Actual Layout Structure (from Editor.tsx)**

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ OUTER CONTAINER (bg-neutral-200)                                                    │
│ ┌───────────────────────────────────────────────────────────────────────────────┐ │
│ │ MAIN CONTAINER (rounded-[32px], gradient background)                         │ │
│ │                                                                                │ │
│ │ ┌─────────────────────────────────────────────────────────────────────────┐ │ │
│ │ │ 🖥️ DEIN SCHREIBTISCH (TemplateOverviewPanel)                            │ │ │
│ │ │ [Desktop Configurator - Product/Program Selection]                      │ │ │
│ │ │ [Sections & Documents Management - when expanded]                       │ │ │
│ │ └─────────────────────────────────────────────────────────────────────────┘ │ │
│ │                                                                                │ │
│ │ ┌─────────────────────────────────────────────────────────────────────────┐ │ │
│ │ │ WORKSPACE CONTAINER (2x2 Grid: grid-cols-[320px_1fr] grid-rows-[auto_1fr])│ │ │
│ │ │                                                                           │ │ │
│ │ │ ┌──────────────┐  ┌──────────────────────────────────────────────────┐  │ │ │
│ │ │ │ ROW 1, COL 1 │  │ ROW 1, COL 2                                     │  │ │ │
│ │ │ │              │  │                                                   │  │ │ │
│ │ │ │ CURRENT      │  │ DOCUMENTS BAR                                    │  │ │ │
│ │ │ │ SELECTION    │  │ (Horizontal bar with document cards)             │  │ │ │
│ │ │ │              │  │                                                   │  │ │ │
│ │ │ │ [320px wide] │  │ [Takes remaining width]                          │  │ │ │
│ │ │ │              │  │                                                   │  │ │ │
│ │ │ │ 🎯 Product   │  │                                                   │  │ │ │
│ │ │ │ PROGRAMM:    │  │                                                   │  │ │ │
│ │ │ │ ABSCHNITTE:  │  │                                                   │  │ │ │
│ │ │ │ DOKUMENTE:   │  │                                                   │  │ │ │
│ │ │ │              │  │                                                   │  │ │ │
│ │ │ │ [Gradient]   │  │                                                   │  │ │ │
│ │ │ │ Card         │  │                                                   │  │ │ │
│ │ │ └──────────────┘  └──────────────────────────────────────────────────┘  │ │ │
│ │ │                                                                           │ │ │
│ │ │ ┌──────────────┐  ┌──────────────────────────────────────────────────┐  │ │ │
│ │ │ │ ROW 2, COL 1 │  │ ROW 2, COL 2                                     │  │ │ │
│ │ │ │              │  │                                                   │  │ │ │
│ │ │ │ SIDEBAR      │  │ PREVIEW WORKSPACE                                │  │ │ │
│ │ │ │              │  │                                                   │  │ │ │
│ │ │ │ [320px wide] │  │ [Takes remaining width]                          │  │ │ │
│ │ │ │              │  │                                                   │  │ │ │
│ │ │ │ [Sections    │  │ [Business Plan Preview]                          │  │ │ │
│ │ │ │  List]       │  │                                                   │  │ │ │
│ │ │ │              │  │                                                   │  │ │ │
│ │ │ │              │  │                                                   │  │ │ │
│ │ │ └──────────────┘  └──────────────────────────────────────────────────┘  │ │ │
│ │ └─────────────────────────────────────────────────────────────────────────┘ │ │
│ └───────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### **Key Points:**
- **Desktop (TemplateOverviewPanel)** is ABOVE the workspace grid (outside the 2x2 grid)
- **CurrentSelection** is in **TOP LEFT** (Row 1, Col 1) - 320px wide
- **DocumentsBar** is in **TOP RIGHT** (Row 1, Col 2) - takes remaining width
- **Sidebar** is in **BOTTOM LEFT** (Row 2, Col 1) - 320px wide, directly BELOW CurrentSelection
- **PreviewWorkspace** is in **BOTTOM RIGHT** (Row 2, Col 2) - takes remaining width

### **Visual Layout:**
```
┌──────────────────────────────────────────────────────────────┐
│ 🖥️ DEIN SCHREIBTISCH (Desktop) - Full Width                  │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────────────────────────────┐ │
│  │ CURRENT      │  │ DOCUMENTS BAR                        │ │
│  │ SELECTION    │  │                                      │ │
│  │ (320px)      │  │                                      │ │
│  │              │  │                                      │ │
│  │ 🎯 Product   │  │ [Document Cards...]                 │ │
│  │ PROGRAMM:    │  │                                      │ │
│  │ ABSCHNITTE:  │  │                                      │ │
│  │ DOKUMENTE:   │  │                                      │ │
│  └──────────────┘  └──────────────────────────────────────┘ │
│  ┌──────────────┐  ┌──────────────────────────────────────┐ │
│  │ SIDEBAR      │  │ PREVIEW WORKSPACE                    │ │
│  │ (320px)      │  │                                      │ │
│  │              │  │ [Business Plan Preview]              │ │
│  │ [Sections]   │  │                                      │ │
│  │              │  │                                      │ │
│  │              │  │                                      │ │
│  └──────────────┘  └──────────────────────────────────────┘ │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

**Current Styling:**
- **Desktop**: `bg-gradient-to-b from-slate-900 via-blue-900 to-slate-800`, `border-dashed border-white/60`
- **CurrentSelection**: `bg-gradient-to-br from-blue-975 via-blue-800 to-blue-975`, `border-white/30`, `text-white`, `shadow-[0_10px_25px_rgba(6,10,24,0.6)]`
- **Layout**: Desktop at top, CurrentSelection in left column (320px), Sidebar below it

---

## 🎨 Proposed State Visual (Adjusted to Theme)

### **Layout Structure (Same as Current)**

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ [NO DESKTOP COMPONENT AT TOP - REMOVED]                                           │
│                                                                                     │
│ ┌───────────────────────────────────────────────────────────────────────────────┐ │
│ │ WORKSPACE CONTAINER (2x2 Grid: grid-cols-[320px_1fr] grid-rows-[auto_1fr])  │ │
│ │                                                                               │ │
│ │ ┌──────────────┐  ┌──────────────────────────────────────────────────┐      │ │
│ │ │ ROW 1, COL 1 │  │ ROW 1, COL 2                                     │      │ │
│ │ │              │  │                                                   │      │ │
│ │ │ CURRENT      │  │ DOCUMENTS BAR                                    │      │ │
│ │ │ SELECTION    │  │ (Horizontal bar with document cards)             │      │ │
│ │ │              │  │                                                   │      │ │
│ │ │ [320px wide] │  │ [Takes remaining width]                          │      │ │
│ │ │              │  │                                                   │      │ │
│ │ │ [EXPANDABLE] │  │                                                   │      │ │
│ │ │              │  │                                                   │      │ │
│ │ └──────────────┘  └──────────────────────────────────────────────────┘      │ │
│ │                                                                               │ │
│ │ ┌──────────────┐  ┌──────────────────────────────────────────────────┐      │ │
│ │ │ ROW 2, COL 1 │  │ ROW 2, COL 2                                     │      │ │
│ │ │              │  │                                                   │      │ │
│ │ │ SIDEBAR      │  │ PREVIEW WORKSPACE                                │      │ │
│ │ │              │  │                                                   │      │ │
│ │ │ [320px wide] │  │ [Takes remaining width]                          │      │ │
│ │ │              │  │                                                   │      │ │
│ │ │ [Sections    │  │ [Business Plan Preview]                          │      │ │
│ │ │  List]       │  │                                                   │      │ │
│ │ └──────────────┘  └──────────────────────────────────────────────────┘      │ │
│ └───────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### **Collapsed View (Default) - CurrentSelection in Top Left (Compact)**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ┌──────────────┐  ┌──────────────────────────────────────────────────┐     │
│ │ CURRENT      │  │ DOCUMENTS BAR                                    │     │
│ │ SELECTION    │  │                                                  │     │
│ │ (320px)      │  │                                                  │     │
│ │              │  │                                                  │     │
│ │ AKTUELLE     │  │                                                  │     │
│ │ AUSWAHL      │  │                                                  │     │
│ │ [▶ Configure]│  │                                                  │     │
│ │              │  │                                                  │     │
│ │ ┌──────────┐ │  │                                                  │     │
│ │ │🎯 Product│ │  │                                                  │     │
│ │ │PROGRAMM: │ │  │                                                  │     │
│ │ │ABSCHNITTE│ │  │                                                  │     │
│ │ │DOKUMENTE │ │  │                                                  │     │
│ │ │          │ │  │                                                  │     │
│ │ │──────────│ │  │                                                  │     │
│ │ │          │ │  │                                                  │     │
│ │ │📊 Program│ │  │                                                  │     │
│ │ │Readiness │ │  │                                                  │     │
│ │ │75% ████░░│ │  │                                                  │     │
│ │ │✅ 8 ⚠️ 2 │ │  │                                                  │     │
│ │ │[🔄 Refresh]│ │  │                                                  │     │
│ │ └──────────┘ │  │                                                  │     │
│ └──────────────┘  └──────────────────────────────────────────────────┘     │
│ ┌──────────────┐  ┌──────────────────────────────────────────────────┐     │
│ │ SIDEBAR      │  │ PREVIEW WORKSPACE                                │     │
│ │ (320px)      │  │                                                  │     │
│ │              │  │                                                  │     │
│ │ [Sections]  │  │                                                  │     │
│ │              │  │                                                  │     │
│ └──────────────┘  └──────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────────────┘
```

### **Expanded View (After Clicking "Configure") - CurrentSelection Expands to the Right**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ┌──────────────────────────────────────────────────────────────────────┐  │
│ │ CURRENT SELECTION (EXPANDED)                                        │  │
│ │ ┌──────────────┐  ┌──────────────────────────────────────────────┐ │  │
│ │ │ Base Panel   │  │ Expanded Configurator Panel                  │ │  │
│ │ │ (320px)      │  │ (Expands to right, overflow: scroll)         │ │  │
│ │ │              │  │                                               │ │  │
│ │ │ AKTUELLE     │  │                                               │ │  │
│ │ │ AUSWAHL      │  │ [Desktop Configurator Content]               │ │  │
│ │ │ [▼ Collapse] │  │                                               │ │  │
│ │ │              │  │ Product Selection [ℹ️]                       │ │  │
│ │ │ ┌──────────┐ │  │ [Dropdown]                                   │ │  │
│ │ │ │🎯 Product│ │  │                                               │ │  │
│ │ │ │PROGRAMM: │ │  │ Connect Program [ℹ️]                          │ │  │
│ │ │ │ABSCHNITTE│ │  │ [Program Finder] [Paste Link]                │ │  │
│ │ │ │DOKUMENTE │ │  │                                               │ │  │
│ │ │ └──────────┘ │  │ [Sections Management]                       │ │  │
│ │ │              │  │ [Documents Management]                       │ │  │
│ │ │ ──────────── │  │                                               │ │  │
│ │ │              │  │ 📊 Program Readiness                          │ │  │
│ │ │ 📊 Program   │  │ Overall: 75% ████████░░                      │ │  │
│ │ │ Readiness    │  │ ✅ Complete: 8                                │ │  │
│ │ │ 75% ████░░    │  │ ⚠️ Needs Work: 2                              │ │  │
│ │ │ ✅ 8 ⚠️ 2     │  │ ❌ Missing: 0                                 │ │  │
│ │ │ [🔄 Refresh]  │  │ [View Details →] [🔄 Refresh]                │ │  │
│ │ └──────────────┘  └──────────────────────────────────────────────┘ │  │
│ └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│ ┌──────────────┐  ┌──────────────────────────────────────────────────┐  │
│ │ DOCUMENTS BAR│  │ (Documents Bar shifts right when expanded)       │  │
│ │ (Shifts)     │  │                                                  │  │
│ └──────────────┘  └──────────────────────────────────────────────────┘  │
│ ┌──────────────┐  ┌──────────────────────────────────────────────────┐  │
│ │ SIDEBAR      │  │ PREVIEW WORKSPACE                                │  │
│ │ (320px)      │  │                                                  │  │
│ │              │  │                                                  │  │
│ │ [Sections]  │  │                                                  │  │
│ │              │  │                                                  │  │
│ └──────────────┘  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Alternative: Overlay/Slide-out Panel (Recommended for Overflow)**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ┌──────────────┐  ┌──────────────────────────────────────────────────┐  │
│ │ CURRENT      │  │ DOCUMENTS BAR                                    │  │
│ │ SELECTION    │  │                                                  │  │
│ │ (320px)      │  │                                                  │  │
│ │              │  │                                                  │  │
│ │ AKTUELLE     │  │                                                  │  │
│ │ AUSWAHL      │  │                                                  │  │
│ │ [▶ Configure]│  │                                                  │  │
│ │              │  │                                                  │  │
│ │ [Summary +   │  │                                                  │  │
│ │  Stats]      │  │                                                  │  │
│ │              │  │                                                  │  │
│ └──────────────┘  └──────────────────────────────────────────────────┘  │
│ ┌──────────────┐  ┌──────────────────────────────────────────────────┐  │
│ │ SIDEBAR      │  │ PREVIEW WORKSPACE                                │  │
│ │ (320px)      │  │                                                  │  │
│ │              │  │                                                  │  │
│ │ [Sections]  │  │                                                  │  │
│ │              │  │                                                  │  │
│ └──────────────┘  └──────────────────────────────────────────────────┘  │
│                                                                             │
│ [When Expanded - Overlay/Slide-out Panel to the Right]                    │
│ ┌──────────────────────────────────────────────────────────────────────┐  │
│ │ CONFIGURATOR PANEL (Absolute/Fixed Position, z-index: high)         │  │
│ │ ┌────────────────────────────────────────────────────────────────┐ │  │
│ │ │ [▼ Collapse]                                                    │ │  │
│ │ │                                                                 │ │  │
│ │ │ [Desktop Configurator Content - Scrollable]                    │ │  │
│ │ │ Product Selection [ℹ️]                                         │ │  │
│ │ │ Connect Program [ℹ️]                                           │ │  │
│ │ │ [Sections Management]                                         │ │  │
│ │ │ [Documents Management]                                         │ │  │
│ │ │ 📊 Program Readiness                                            │ │  │
│ │ │                                                                 │ │  │
│ │ │ [overflow-y: auto, max-height: calc(100vh - 200px)]            │ │  │
│ │ └────────────────────────────────────────────────────────────────┘ │  │
│ └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Note:** 
- CurrentSelection expands **horizontally to the right** (not vertically)
- The expanded panel can be:
  - **Option A**: Absolute/fixed overlay that slides out to the right (recommended for overflow)
  - **Option B**: Expands inline, pushing DocumentsBar to the right (requires grid adjustment)
- Expanded content must have `overflow-y: auto` and proper max-height constraints
- Panel should be scrollable when content exceeds viewport height

### **Styling Details (Matching Current Theme)**

**Container (Collapsed):**
- `h-full flex flex-col border-r border-white/10 pr-4`
- Width: `320px` (fixed)
- Position: `relative` (for expanded panel positioning)

**Container (Expanded - Overlay Panel):**
- Position: `absolute` or `fixed`
- Left: `320px` (starts after CurrentSelection base)
- Top: `0` (aligns with CurrentSelection)
- Width: `400px` or `500px` (configurable, e.g., `w-[400px]`)
- Height: `100%` or `calc(100vh - offset)`
- Z-index: `z-50` or higher (above other content)
- `overflow-y: auto` (scrollable when content exceeds height)
- `overflow-x: hidden`
- `max-height: calc(100vh - 200px)` (prevents viewport overflow)
- `bg-gradient-to-br from-blue-975 via-blue-800 to-blue-975`
- `border-l border-white/30`
- `shadow-[0_10px_25px_rgba(6,10,24,0.6)]`
- `backdrop-blur`

**Header:**
- `text-lg font-bold uppercase tracking-wide text-white`
- `border-b border-white/50`
- `flex items-center justify-between` (for collapse button)

**Selection Summary Card (Collapsed & Expanded):**
- `rounded-lg border border-white/30`
- `bg-gradient-to-br from-blue-975 via-blue-800 to-blue-975`
- `text-white`
- `shadow-[0_10px_25px_rgba(6,10,24,0.6)]`
- `backdrop-blur`
- `px-4 py-4`

**Requirements Stats Section:**
- `border-t border-white/30` (separator)
- `mt-3 pt-3`
- Progress bar: `bg-blue-600/50` filled, `bg-white/10` empty
- Status badges: 
  - Complete: `text-green-400` with `✅`
  - Needs Work: `text-yellow-400` with `⚠️`
  - Missing: `text-red-400` with `❌`

**Configurator Content (Expanded Panel):**
- `overflow-y: auto` (scrollable - CRITICAL for overflow)
- `overflow-x: hidden`
- `max-h-[calc(100vh-300px)]` (ensures it doesn't exceed viewport)
- `border-t border-white/30 mt-3 pt-3`
- Same gradient background as parent
- Feature sections with `border-b border-white/10` separators
- `px-4 py-4` (padding for scrollable content)

**Expansion Animation:**
- Use CSS transitions: `transition-all duration-300 ease-in-out`
- Transform: `translate-x-0` (collapsed) → `translate-x-[400px]` (expanded)
- Or use width transition: `w-0` → `w-[400px]`
- Consider backdrop overlay when expanded: `bg-black/20` behind panel

**Buttons:**
- Configure/Collapse: `bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 text-sm font-semibold`
- Refresh Check: `bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 text-xs`
- Help icons: `text-white/60 hover:text-white/90 cursor-help`

**Tooltips/Explanations:**
- `bg-slate-950 border border-white/40`
- `text-white text-xs`
- `shadow-2xl backdrop-blur-md`
- `rounded-lg px-3 py-2.5`
- `z-[9999]` (above expanded panel)

---

## 🎯 Key Design Decisions

1. **Desktop removed from top** - All functionality moved into CurrentSelection
2. **Progressive disclosure** - Collapsed shows summary + stats, expanded shows full configurator
3. **Requirements stats always visible** - Even when collapsed, shows readiness at a glance
4. **Theme consistency** - Uses existing blue gradient, white/opacity borders, same shadows
5. **Space efficient** - Same 320px width, expands vertically within workspace grid
6. **Help integrated** - Explanations via tooltips or expandable sections within configurator

---

## 📋 Implementation Notes

### **Expansion Behavior:**
- CurrentSelection expands **horizontally to the right** (not vertically)
- Expanded panel should be an **overlay/slide-out** panel (absolute or fixed positioning)
- Panel slides out from the right edge of CurrentSelection base (320px)
- Panel width: `400px` or `500px` (configurable)
- Panel must handle **overflow** with `overflow-y: auto` and proper max-height

### **Overflow Handling:**
- Expanded panel content must be scrollable when it exceeds viewport height
- Use `max-height: calc(100vh - 200px)` to prevent viewport overflow
- Ensure scrollbar styling matches theme (dark, subtle)
- Test with long content (many sections/documents) to verify scrolling works

### **Component Structure:**
- CurrentSelection becomes expandable container with two states:
  - **Collapsed**: Shows summary + stats (320px wide)
  - **Expanded**: Base panel (320px) + overlay panel (400-500px) to the right
- DesktopConfigurator integrated as expanded content
- Requirements stats calculated from `progressSummary` or enhanced `runRequirementsCheck()`
- Explanations added as tooltips or expandable help sections
- All styling matches existing dark blue gradient theme

### **Positioning Strategy:**
```typescript
// Option A: Absolute positioning (relative to CurrentSelection container)
.expanded-panel {
  position: absolute;
  left: 320px; // Starts after base panel
  top: 0;
  width: 400px;
  height: 100%;
  z-index: 50;
  overflow-y: auto;
}

// Option B: Fixed positioning (relative to viewport)
.expanded-panel {
  position: fixed;
  left: 320px; // Or calculate from CurrentSelection position
  top: [calculate from CurrentSelection top];
  width: 400px;
  height: calc(100vh - [offset]);
  z-index: 50;
  overflow-y: auto;
}
```

### **Animation:**
- Smooth slide-in/out animation (300ms ease-in-out)
- Consider backdrop overlay when expanded for better focus
- Ensure animation doesn't cause layout shifts

