# Editor UI Layout - Visual Diagram

**Date:** 2025-01-XX  
**Status:** Current Implementation  
**Based on:** `features/editor/components/Editor.tsx`

---

## Redesigned Interface Layout - Unified ChatGPT/Canva Style

**Design Philosophy:**
- **One unified box** - Everything in a single, beautiful editor container
- **Sidebar prompts** - Prompts visible on the right side (like ChatGPT)
- **Clean navigation** - Clear section navigation within the box
- **Modern design** - Canva/ChatGPT-inspired clean aesthetic
- **Simplified** - No automatic detection, user controls everything

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ ╔═══════════════════════════════════════════════════════════════════════════════╗ │
│ ║ HEADER (Sticky - Stays at top when scrolling)                                 ║ │
│ ║ ┌───────────────────────────────────────────────────────────────────────────┐ ║ │
│ ║ │ Business Plan Editor                    [Saving...] [📋] [💬] [👁️]        │ ║ │
│ ║ └───────────────────────────────────────────────────────────────────────────┘ ║ │
│ ║                                                                                 ║ │
│ ║ ┌─ Program Selector Card (White/95% opacity) ───────────────────────────────┐ ║ │
│ ║ │ Product: [Strategy ▼]    Program: [No program selected] [Find Program]    │ ║ │
│ ║ │                                                      [Clear program]       │ ║ │
│ ║ └───────────────────────────────────────────────────────────────────────────┘ ║ │
│ ╚═══════════════════════════════════════════════════════════════════════════════╝ │
│                                                                                     │
│ ┌───────────────────────────────────────────────────────────────────────────────┐ │
│ │ SECTION NAVIGATION (Sticky - Below header)                                   │ │
│ │ ┌─────────────────────────────────────────────────────────────────────────┐ │ │
│ │ │ [←] [01 ✓ Executive] [02 ⚠ Market] [03 ○ Project] ... [→]              │ │ │
│ │ │                                                                         │ │ │
│ │ │ Overall Progress: ████████░░░░░░░░░░ 45% (3 of 9)                     │ │ │
│ │ └─────────────────────────────────────────────────────────────────────────┘ │ │
│ └───────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                     │
│ ┌───────────────────────────────────────────────────────────────────────────────┐ │
│ │ MAIN EDITOR AREA (Scrollable - Max width 1400px, centered, bg-gray-50)      │ │
│ │                                                                               │ │
│ │                    ╔═══════════════════════════════════════════════════════╗  │ │
│ │                    ║  UNIFIED EDITOR BOX (ChatGPT/Canva Style)             ║  │ │
│ │                    ║  White background, subtle shadow, rounded corners     ║  │ │
│ │                    ║  ┌─────────────────────────────────────────────────┐   ║  │ │
│ │                    ║  │                                                 │   ║  │ │
│ │                    ║  │  ┌───────────────────────────────────────────┐  │   ║  │ │
│ │                    ║  │  │ LEFT PANEL: Editor (70% width)            │  │   ║  │ │
│ │                    ║  │  │                                           │  │   ║  │ │
│ │                    ║  │  │  ┌─ Section Navigation (Top) ──────────┐  │   ║  │ │
│ │                    ║  │  │  │ [← Prev]  Market Opportunity         │  │   ║  │ │
│ │                    ║  │  │  │          [Next →]                   │  │   ║  │ │
│ │                    ║  │  │  └──────────────────────────────────────┘  │   ║  │ │
│ │                    ║  │  │                                           │  │   ║  │ │
│ │                    ║  │  │  ┌─ Section Description (Collapsible) ──┐  │   ║  │ │
│ │                    ║  │  │  │ Market Opportunity            [▼]    │  │   ║  │ │
│ │                    ║  │  │  │ Describe the market size, trends...  │  │   ║  │ │
│ │                    ║  │  │  └──────────────────────────────────────┘  │   ║  │ │
│ │                    ║  │  │                                           │  │   ║  │ │
│ │                    ║  │  │  ┌─ Main Editor (Canva Style) ──────────┐  │   ║  │ │
│ │                    ║  │  │  │                                       │  │   ║  │ │
│ │                    ║  │  │  │  ┌─────────────────────────────────┐  │  │   ║  │ │
│ │                    ║  │  │  │  │                               │  │  │   ║  │ │
│ │                    ║  │  │  │  │  Clean, spacious text area    │  │  │   ║  │ │
│ │                    ║  │  │  │  │  with subtle shadow/border    │  │  │   ║  │ │
│ │                    ║  │  │  │  │                               │  │  │   ║  │ │
│ │                    ║  │  │  │  │  Start writing your market   │  │  │   ║  │ │
│ │                    ║  │  │  │  │  opportunity...              │  │  │   ║  │ │
│ │                    ║  │  │  │  │                               │  │  │   ║  │ │
│ │                    ║  │  │  │  │                               │  │  │   ║  │ │
│ │                    ║  │  │  │  │                               │  │  │   ║  │ │
│ │                    ║  │  │  │  └─────────────────────────────────┘  │  │   ║  │ │
│ │                    ║  │  │  │                                       │  │   ║  │ │
│ │                    ║  │  │  └───────────────────────────────────────┘  │   ║  │ │
│ │                    ║  │  │                                           │  │   ║  │ │
│ │                    ║  │  │  ┌─ Action Bar (Bottom) ─────────────────┐  │   ║  │ │
│ │                    ║  │  │  │ [✨ Generate] [💾 Save] [⏭️ Next]    │  │   ║  │ │
│ │                    ║  │  │  └───────────────────────────────────────┘  │   ║  │ │
│ │                    ║  │  │                                           │  │   ║  │ │
│ │                    ║  │  └───────────────────────────────────────────┘  │   ║  │ │
│ │                    ║  │                                                 │   ║  │ │
│ │                    ║  │  ┌───────────────────────────────────────────┐  │   ║  │ │
│ │                    ║  │  │ RIGHT PANEL: Prompts & Tools (30% width)   │  │   ║  │ │
│ │                    ║  │  │                                           │  │   ║  │ │
│ │                    ║  │  │  ┌─ Writing Prompts (Always Visible) ───┐  │   ║  │ │
│ │                    ║  │  │  │ 💡 Writing Prompts                    │  │   ║  │ │
│ │                    ║  │  │  │                                       │  │   ║  │ │
│ │                    ║  │  │  │ • Who is the target market?           │  │   ║  │ │
│ │                    ║  │  │  │ • How large is the market?           │  │   ║  │ │
│ │                    ║  │  │  │ • What trends support opportunity?    │  │   ║  │ │
│ │                    ║  │  │  │ • What unmet needs exist?            │  │   ║  │ │
│ │                    ║  │  │  │                                       │  │   ║  │ │
│ │                    ║  │  │  │ [Use as Guide] [Insert All]          │  │   ║  │ │
│ │                    ║  │  │  └───────────────────────────────────────┘  │   ║  │ │
│ │                    ║  │  │                                           │  │   ║  │ │
│ │                    ║  │  │  ┌─ Quick Actions ────────────────────────┐  │   ║  │ │
│ │                    ║  │  │  │ [✨ Generate with AI]                │  │   ║  │ │
│ │                    ║  │  │  │ [📊 Add Table]                       │  │   ║  │ │
│ │                    ║  │  │  │ [📈 Add Chart]                       │  │   ║  │ │
│ │                    ║  │  │  │ [📷 Add Image]                       │  │   ║  │ │
│ │                    ║  │  │  └───────────────────────────────────────┘  │   ║  │ │
│ │                    ║  │  │                                           │  │   ║  │ │
│ │                    ║  │  │  ┌─ Tables/Charts (When Created) ──────┐  │   ║  │ │
│ │                    ║  │  │  │ [Tables appear here when created]   │  │   ║  │ │
│ │                    ║  │  │  └───────────────────────────────────────┘  │   ║  │ │
│ │                    ║  │  │                                           │  │   ║  │ │
│ │                    ║  │  └───────────────────────────────────────────┘  │   ║  │ │
│ │                    ║  │                                                 │   ║  │ │
│ │                    ║  └─────────────────────────────────────────────────┘   ║  │ │
│ │                    ╚═══════════════════════════════════════════════════╝  │ │
│ └───────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Key Design Decisions

### 1. **Unified Box Approach**
- **Why:** Everything in one cohesive container creates a focused, distraction-free writing experience
- **Visual:** Single white box with subtle shadow, rounded corners (like Canva/ChatGPT)
- **Benefit:** Users see all tools and prompts in context, no need to hunt for features

### 2. **Sidebar Prompts (Always Visible)**
- **Why:** Prompts should guide writing, not be hidden behind buttons
- **Location:** Right side (30% width), always visible when section has prompts
- **Content:** Bullet list of writing prompts from section template
- **Actions:** "Use as Guide" (shows prompts in editor) and "Insert All" (adds prompts as text)

### 3. **Simplified Navigation**
- **Why:** No automatic detection - user controls everything
- **Within Box:** Section navigation (Prev/Next) at top of editor box
- **Outside Box:** Section tabs remain in sticky header for quick jumping
- **Benefit:** Clear, predictable navigation

### 4. **Editor Box (Canva/ChatGPT Style)**
- **Visual:** Clean, spacious text area with subtle border/shadow
- **Feel:** Like writing in a modern document editor (Canva) or chat interface (ChatGPT)
- **Size:** Generous padding, comfortable line height, readable font
- **Focus:** Border highlights when focused (blue accent)

### 5. **Integrated Actions**
- **Left Side:** Main editor with action bar at bottom (Generate, Save, Next)
- **Right Side:** Prompts + Quick Actions (Generate, Add Table, Add Chart, Add Image)
- **Benefit:** All actions visible, no hidden menus

---

## How Prompts Work in This Design

### Prompt Display Logic
1. **Always Show:** If section has prompts (`sectionTemplate.prompts`), they appear in right sidebar
2. **No Prompts:** If section has no prompts, right sidebar shows only Quick Actions
3. **User Control:** User decides when to use prompts (no automatic insertion)

### Prompt Actions
1. **"Use as Guide" Button:**
   - Shows prompts in a collapsible guide panel within editor
   - Does NOT insert text, just displays as reference
   - User can manually write based on prompts

2. **"Insert All" Button:**
   - Inserts all prompts as bullet points into editor
   - User can then expand each point into full text
   - Useful for creating an outline

3. **Individual Prompt Click:**
   - (Future) Clicking a prompt could insert it as a heading or expand it

### Prompt Source
- Prompts come from `sectionTemplate.prompts` array
- Each prompt is a string question/guidance
- Displayed as clean bullet list in sidebar

---

## Detailed Component Breakdown

### 1. Header (Sticky - Top of Page)

**Visual Design:**
- Gradient background: `from-blue-600 to-purple-600`
- White text on gradient
- Shadow: `shadow-lg`
- Sticky positioning: `sticky top-0 z-50`

**Components:**
```
┌─────────────────────────────────────────────────────────────┐
│ Business Plan Editor    [Saving...] [📋] [💬] [👁️]        │
│                                                             │
│ ┌─ Program Selector Card ────────────────────────────────┐ │
│ │ Product: [Strategy ▼]                                    │ │
│ │ Program: [No program selected] [Find Program]          │ │
│ │           [Clear program]                               │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Buttons:**
- `📋 Requirements` - Opens RequirementsModal
- `💬 AI Assistant` - Opens AI Assistant modal (placeholder)
- `👁️ Preview` - Navigates to `/preview`
- `Saving...` - Shows when auto-saving

**Program Selector:**
- Product dropdown: Strategy / Review / Submission
- Program input: Read-only, shows selected program name
- "Find Program" button: Opens ProgramFinderModal
- "Clear program" link: Removes selected program

---

### 2. Section Navigation (Sticky - Below Header)

**Visual Design:**
- White background: `bg-white`
- Border bottom: `border-b border-gray-200`
- Shadow: `shadow-sm`
- Sticky positioning: `sticky top-[140px] z-40`

**Components:**
```
┌─────────────────────────────────────────────────────────────┐
│ [←] [01 ✓ Executive] [02 ⚠ Market] [03 ○ Project] ... [→] │
│                                                             │
│ Overall Progress: ████████░░░░░░░░░░ 45% (3 of 9)         │
└─────────────────────────────────────────────────────────────┘
```

**Section Tabs:**
- Status icons: `✓` (complete), `⚠` (in-progress), `○` (missing)
- Format: `[Number] [Title]`
- Active section: Blue background (`bg-blue-600 text-white`)
- Inactive sections: Gray background (`bg-gray-100 text-gray-700`)
- Navigation arrows: `←` (previous), `→` (next)

**Progress Bar:**
- Shows overall completion percentage
- Gradient fill: `from-blue-600 to-purple-600`
- Text: "X% Complete (Y of Z sections)"

---

### 3. Unified Editor Box (Main Content Area)

**Layout:**
- Max width: `max-w-[1400px]` (wider for side-by-side layout)
- Centered: `mx-auto`
- Padding: `px-4 py-8`
- Background: `bg-gray-50`

**Container:**
- Single white box: `bg-white rounded-xl shadow-lg border border-gray-200`
- Padding: `p-8`
- Two-column layout: `grid grid-cols-[70%_30%] gap-6`

---

#### 3.1 Left Panel: Editor Content (70% width)

**Section Navigation (Top of Left Panel):**
```
┌─────────────────────────────────────────────────────────────┐
│ [← Prev]  Market Opportunity  [Next →]                      │
└─────────────────────────────────────────────────────────────┘
```
- Previous/Next buttons for section navigation
- Current section title in center
- Styled as subtle buttons: `text-gray-600 hover:text-gray-900`

**Section Description (Collapsible):**
```
┌─────────────────────────────────────────────────────────────┐
│ Market Opportunity                            [▼ Collapse]  │
│ Describe the market size, trends, and customer segments.   │
└─────────────────────────────────────────────────────────────┘
```
- Collapsible card showing section title and description
- Default: Expanded (user can collapse to save space)
- Visual: `bg-gray-50 border border-gray-200 rounded-lg p-4`

**Main Editor Box (Canva/ChatGPT Style):**
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  [Clean, spacious text area with subtle shadow/border]    │
│                                                             │
│  Start writing your market opportunity...                  │
│                                                             │
│                                                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```
- **Visual:** `bg-white border-2 border-gray-200 rounded-lg shadow-sm`
- **Focus State:** `focus:border-blue-400 focus:shadow-md`
- **Padding:** `p-6`
- **Min Height:** `min-h-[400px]`
- **Textarea:** Full width, no border, auto-resize
- **Font:** System font stack, `text-base leading-relaxed`

**Action Bar (Bottom of Left Panel):**
```
┌─────────────────────────────────────────────────────────────┐
│ [✨ Generate with AI]  [💾 Save]  [⏭️ Next Section]        │
└─────────────────────────────────────────────────────────────┘
```
- Primary actions for the editor
- Generate: `bg-blue-600 text-white`
- Save: `bg-gray-100 text-gray-700`
- Next: `bg-gray-100 text-gray-700`

---

#### 3.2 Right Panel: Prompts & Tools (30% width)

**Writing Prompts Card (Always Visible if prompts exist):**
```
┌─────────────────────────────────────────────────────────────┐
│ 💡 Writing Prompts                                           │
│                                                              │
│ • Who is the target market?                                 │
│ • How large is the market?                                  │
│ • What trends support your opportunity?                     │
│ • What unmet needs exist?                                   │
│                                                              │
│ [Use as Guide] [Insert All]                                │
└─────────────────────────────────────────────────────────────┘
```
- **Visual:** `bg-blue-50 border border-blue-200 rounded-lg p-4`
- **Title:** `text-sm font-semibold text-gray-900`
- **Prompts:** Bullet list, `text-sm text-gray-700`
- **Actions:** Two buttons at bottom
  - "Use as Guide": Shows prompts in guide panel (doesn't insert)
  - "Insert All": Inserts prompts as bullet points in editor

**Quick Actions Card:**
```
┌─────────────────────────────────────────────────────────────┐
│ Quick Actions                                               │
│                                                              │
│ [✨ Generate with AI]                                       │
│ [📊 Add Table]                                             │
│ [📈 Add Chart]                                             │
│ [📷 Add Image]                                             │
└─────────────────────────────────────────────────────────────┘
```
- **Visual:** `bg-white border border-gray-200 rounded-lg p-4`
- **Layout:** Vertical stack of buttons
- **Buttons:** Full width, `w-full mb-2`

**Tables & Charts Card (When Created):**
```
┌─────────────────────────────────────────────────────────────┐
│ 📊 Tables & Charts                                          │
│                                                              │
│ [Tables appear here when created]                           │
└─────────────────────────────────────────────────────────────┘
```
- Only shown when section has tables/charts
- Renders `SectionContentRenderer` component
- Scrollable if content is long

---

#### 3.3 Tables & Charts Section (Conditional - OLD DESIGN - TO BE REMOVED)

**Visibility:**
- Always shown for: `financial`, `risk`, `project` categories
- Shown if tables exist for: `market`, `team` categories
- Hidden for: `general`, `technical`, `impact` categories

**Visual Design:**
- White card: `bg-white border border-gray-200 rounded-lg shadow-sm`
- Padding: `p-6`
- Margin bottom: `mb-6`

```
┌─────────────────────────────────────────────────────────────┐
│ 📊 Tables & Charts                              (Optional)  │
│                                                             │
│ ┌─ Helpful Message ──────────────────────────────────────┐ │
│ │ 💡 This section typically includes financial tables.  │ │
│ │    Create tables to visualize your revenue, costs...   │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ [📊 Add Table] [📈 Add Chart] [📷 Add Image]              │
│                                                             │
│ ┌─ Existing Tables (if any) ────────────────────────────┐ │
│ │ [Table content rendered here]                         │ │
│ │ [Charts would appear here if implemented]             │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ (No tables created yet - optional)                          │
└─────────────────────────────────────────────────────────────┘
```

**Add Buttons:**
1. **📊 Add Table**
   - Blue: `bg-blue-600 text-white`
   - **Current:** Shows alert "Table creation dialog coming soon"
   - **Planned:** Opens TableCreationDialog

2. **📈 Add Chart**
   - Gray: `bg-gray-100 text-gray-700`
   - **Current:** Shows alert "Chart creation coming soon"
   - **Planned:** Creates chart from table data

3. **📷 Add Image**
   - Gray: `bg-gray-100 text-gray-700`
   - **Current:** Shows alert "Image upload coming soon"
   - **Planned:** Opens image upload dialog

**Existing Tables:**
- Rendered by `SectionContentRenderer` component
- Shows tables if `section.tables` exists
- Inline editing works (can edit cell values)
- **Missing:** "Fill with AI from Text" button
- **Missing:** Chart auto-generation

**Helpful Messages (by category):**
- **Financial:** "This section typically includes financial tables. Create tables to visualize your revenue, costs, and cash flow projections."
- **Risk:** "This section typically includes a risk matrix. Create a matrix to visualize risk impact and probability."
- **Project:** "This section typically includes milestone timelines. Create a timeline to visualize your project schedule."
- **Market:** "You can optionally add competitor analysis tables. Tables help visualize market data."
- **Team:** "You can optionally add hiring timeline tables. Tables help visualize team growth."

---

## Modals & Dialogs

### Requirements Modal

**Trigger:** `📋 Requirements` button in header

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ Requirements Checker                                    [✕]  │
│                                                             │
│ ┌─ Overall Progress ──────────────────────────────────────┐ │
│ │ Overall Plan Progress                   45%            │ │
│ │ ████████░░░░░░░░░░                                       │ │
│ │ 3 of 9 sections completed                               │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ All Sections:                                                │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 01 Executive Summary                    [✓ Complete]    │ │
│ │ Progress: ████████████████████ 100%                     │ │
│ │                                                         │ │
│ │ 02 Market Opportunity                  [⚠ In Progress]│ │
│ │ Progress: ████████░░░░░░░░░░ 45%                        │ │
│ │ Missing: Content too short (152/300 words)            │ │
│ │          [Go to Section] [Generate]                    │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ [Close]                                                     │
└─────────────────────────────────────────────────────────────┘
```

**Features:**
- Semantic validation using AI
- Section-by-section status
- Navigate to sections with issues
- Generate missing content

---

### Program Finder Modal

**Trigger:** `Find Program` button in header

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ Find Funding Program                                    [✕] │
│                                                             │
│ Describe your project:                                       │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │                                                         │ │
│ │ Example: We're an AI startup in Vienna...              │ │
│ │                                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ [🚀 Generate Programs]                                      │
│                                                             │
│ Found 3 programs:                                           │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ FFG Basisprogramm                                       │ │
│ │ Description: Supports R&D projects...                  │ │
│ │ EUR 50,000 - 200,000                                    │ │
│ │                                    [Select]             │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ [Or go to full recommendation flow →]                       │
└─────────────────────────────────────────────────────────────┘
```

**Features:**
- Text area for project description
- Generates programs on-demand via LLM
- Shows generated programs with details
- Select program → stores in localStorage

---

## Current vs Planned Features

### ✅ Implemented

- Sticky header with gradient
- Section navigation with status icons
- Progress bar
- Text editor (plain text)
- Action buttons
- Smart Hints panel (collapsible)
- Tables & Charts section (conditional)
- Table rendering (SectionContentRenderer)
- Inline table editing
- Requirements Modal
- Program Finder Modal

### ❌ Not Implemented (Shown in Layout)

1. **Table Creation Dialog**
   - Current: Alert placeholder
   - Planned: Dialog to select table type

2. **"Fill with AI from Text" Button**
   - Current: Missing
   - Planned: Button on each table to extract data from text

3. **Chart Auto-Generation**
   - Current: Charts not auto-generated
   - Planned: Charts appear automatically when table has data

4. **Chart Type Selection UI**
   - Current: ChartTypeButtons component exists but not fully connected
   - Planned: Buttons to switch between bar/line/pie charts

5. **KPI Calculations**
   - Current: FinancialAnalysisInline exists but KPIs not in tables
   - Planned: "Include KPIs" toggle on financial tables

6. **Rich Text Editor**
   - Current: Plain textarea
   - Planned: Formatting toolbar (B, I, U, lists, links)

7. **Image Upload**
   - Current: Alert placeholder
   - Planned: Full image upload and insertion

---

## Responsive Design

**Current Implementation:**
- Max width: 1200px (centered)
- Padding: `px-4` (mobile-friendly)
- Section navigation: Horizontal scroll on mobile
- Tables: Responsive (may need improvement)

**Breakpoints:**
- Mobile: Full width with padding
- Tablet: Max width 1200px
- Desktop: Max width 1200px, centered

---

## Color Scheme

**Header:**
- Gradient: `from-blue-600 to-purple-600`
- Text: White
- Buttons: `bg-white/20 hover:bg-white/30`

**Navigation:**
- Background: White
- Active tab: `bg-blue-600 text-white`
- Inactive tab: `bg-gray-100 text-gray-700`
- Progress bar: `from-blue-600 to-purple-600`

**Editor:**
- Background: `bg-gray-50`
- Cards: White with border
- Primary buttons: `bg-blue-600 text-white`
- Secondary buttons: `bg-gray-100 text-gray-700`
- Smart Hints: `bg-blue-50 border-blue-200`

---

## Status Indicators

**Section Status Icons:**
- `✓` - Complete (100% progress)
- `⚠` - In Progress (50-99% progress)
- `○` - Missing (0-49% progress)

**Progress Colors:**
- Complete: Green (`bg-green-500`)
- In Progress: Yellow (`bg-yellow-500`)
- Needs Enhancement: Orange (`bg-orange-500`)
- Missing: Red (`bg-red-500`)

---

## Notes

1. **Sticky Positioning:**
   - Header: `sticky top-0 z-50`
   - Navigation: `sticky top-[140px] z-40`
   - Both stay visible when scrolling

2. **Auto-Save:**
   - Debounced 400ms
   - Shows "Saving..." indicator in header
   - Saves to localStorage via `savePlanSections()`

3. **Section Loading:**
   - Sections loaded from templates based on `product` type
   - Sorted by `order` field
   - Tables initialized if section needs them

4. **Program Integration:**
   - Program data loaded from localStorage
   - Expires after 1 hour
   - Enhances AI prompts (not template structure)

---

**End of Layout Documentation**

