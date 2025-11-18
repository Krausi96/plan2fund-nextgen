# Editor Layout v3 - Final Specification
## Complete User Guide with Financial Capabilities

## Overview

The editor uses a **horizontal two-column layout**:
- **Left Column (~60% width):** Primary editor workspace with section header, sections navigation bar, and all prompt blocks. Scrolls vertically as content grows.
- **Right Column (~360px width, sticky):** Contextual panel with three tabs (Assistant, Data, Preview) providing AI help, data management, and preview/requirements. Scrolls independently from the main editor.

All prompts within a section are shown in a single scrollable workspace in the left column, with quick navigation via section chips.

---

## Header & Navigation

```
┌────────────────────────────────────────────────────────────────────────────┐
│ HEADER (gradient, sticky)                                                 │
│ Business Plan Editor                              Program Selector         │
│                                                      🎯 Product | 📋 Program│
└────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────┐
│ SECTION NAVIGATION BAR                                                     │
│ [←] [01 Executive ✓] [02 Market ⚠] [03 Financial ○] … [→]                 │
└────────────────────────────────────────────────────────────────────────────┘
```

**Components:**
- **Header:** Title + Program Selector (Product + Program dropdowns only; Route removed)
- **No Breadcrumbs:** Breadcrumbs removed from editor page
- **Section Navigation:** Horizontal scrollable tabs showing all sections with status indicators (✓ complete, ⚠ partial, ○ empty)
  - **Last item:** "Front & back matter" - Opens AncillaryWorkspace for title page, TOC, citations, etc.

---

## Main Workspace Layout

### Structure (Two-Column Horizontal Layout)

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ PRIMARY EDITOR COLUMN (left, ~60% width)              │  RIGHT PANEL (right, ~360px width, sticky)      │
│                                                        │                                                  │
│ ┌──────────────────────────────────────────────────┐  │  ┌──────────────────────────────────────────┐  │
│ │ SECTION HEADER                                   │  │  │ [Assistant] [Data] [Preview]             │  │
│ │ • Category tag  • Title  • Description           │  │  └──────────────────────────────────────────┘  │
│ ├──────────────────────────────────────────────────┤  │                                                  │
│ │ PROMPT NAVIGATION BAR                            │  │  [Active tab content scrolls here]            │
│ │ [Q01] [Q02] [Q03] … (active highlighted)        │  │  • Assistant: AI help, suggestions           │
│ │ (click chip to switch prompts in same block)     │  │  • Data: Tables, KPIs, media management      │
│ ├──────────────────────────────────────────────────┤  │  • Preview: Section preview + requirements   │
│ │ SINGLE PROMPT BLOCK (shows active prompt only)   │  │                                                  │
│ │ ┌────────────────────────────────────────────┐  │  │                                                  │
│ │ │ Prompt Title (with "Required" badge)        │  │  │                                                  │
│ │ │                                              │  │  │                                                  │
│ │ │ ┌────── Rich Text Editor ────────────────┐  │  │  │                                                  │
│ │ │ │ (SimpleTextEditor - auto-saves)         │  │  │  │                                                  │
│ │ │ │ [User types answer here...]             │  │  │  │                                                  │
│ │ │ └─────────────────────────────────────────┘  │  │  │                                                  │
│ │ │                                              │  │  │                                                  │
│ │ │ Actions: [✨ Generate] [Mark as Unknown]      │  │  │                                                  │
│ │ └────────────────────────────────────────────┘  │  │                                                  │
│ │ (Block updates when user clicks different chip)  │  │                                                  │
│ │                                                  │  │                                                  │
│ └──────────────────────────────────────────────────┘  │                                                  │
│                                                        │                                                  │
└────────────────────────────────────────────────────────┴──────────────────────────────────────────────────┘
```

**Layout Description:**
- **Left Column (Primary Editor):** Contains the section header, prompt navigation bar, and a single prompt block that updates when user switches prompts. Takes up approximately 60% of the available width. The prompt block shows one prompt at a time.
- **Right Column (Contextual Panel):** Fixed width of ~360px, sticky positioned. Contains three tabs (Assistant, Data, Preview) that provide contextual help and tools. Scrolls independently from the main editor. Updates automatically when user switches prompts.
- **Responsive Behavior:** On smaller screens, the right panel can collapse or move below the editor column.

---

## Right Panel: Data Tab - Complete Capabilities

### Overview

The **Data Tab** is where users manage all financial data, KPIs, tables, charts, and media for the current section. It provides a unified interface for creating, editing, and organizing financial information.

### Tab Structure

```
┌────────────────────────────────────┐
│ RIGHT PANEL (~360px width, sticky) │
│ ┌────────────────────────────────┐ │
│ │ [Assistant] [Data] [Preview]   │ │ ← Tab bar (sticky)
│ └────────────────────────────────┘ │
│                                     │
│ [Data tab content scrolls here]    │
│                                     │
└─────────────────────────────────────┘
```

### Data Tab Content

#### 1. **Info Banner (Contextual Guidance)**

For financial, risk, or project sections, a banner appears at the top:

```
┌─────────────────────────────────────────┐
│ ℹ️ This section typically includes:     │
│    Financial tables, revenue projections │
└─────────────────────────────────────────┘
```

#### 2. **Action Buttons (Always Visible)**

Three primary action buttons at the top:

```
┌─────────────────────────────────────────┐
│ [📊 Add Table] [📈 Add KPI] [📷 Add Media]│
└─────────────────────────────────────────┘
```

- **📊 Add Table** - Creates new dataset/table for financial data
- **📈 Add KPI** - Creates new KPI metric (manual or formula-based)
- **📷 Add Media** - Uploads image or adds media URL

#### 3. **Sub-Navigation (Horizontal Pills)**

Filter items by type:

```
┌─────────────────────────────────────────┐
│ [Datasets] [KPIs] [Media]               │
└─────────────────────────────────────────┘
```

- **Datasets** - Shows all tables/charts
- **KPIs** - Shows all KPI metrics
- **Media** - Shows all images/media

#### 4. **List View (Scrollable)**

Each item shown as an expandable card with:
- Icon (📊 📈 📷) indicating type
- Name and creation date
- Section/Question context
- "Attached to: Q01" badge (if attached)
- Actions: `[Attach]` `[Edit]` `[View]` `[Delete]`
- Navigation: `[← Prev]` `[Next →]`

---

## Financial Section: Complete User Capabilities

### What Users Can Do in Financial Sections

#### 1. **Answer Text Prompts** (Standard)

Users answer questions like:
- "What are your expected revenue streams?"
- "What are your major cost drivers?"
- "How much funding is needed?"

**Location:** Left column, prompt blocks

#### 2. **Create Financial Tables** (Data Tab)

**Workflow:**
1. User opens **Right Panel → Data tab**
2. User clicks `[📊 Add Table]`
3. Modal opens with table creation form:
   ```
   ┌─────────────────────────────────────────┐
   │ Create Table                             │
   ├─────────────────────────────────────────┤
   │ Name: [Revenue Projections]              │
   │ Description: [Monthly revenue...]       │
   │                                         │
   │ Columns: [Month:number, Revenue:number (EUR)]│
   │                                         │
   │ Time Period:                             │
   │ ○ Simple (custom columns)                │
   │ ● 4-year Financial (Monthly Y1, Annual Y2-4)│
   │                                         │
   │ [Create Table] [Cancel]                 │
   └─────────────────────────────────────────┘
   ```
4. System generates table structure:
   - If "4-year Financial": Creates 15 columns (Jan-Dec 2025, 2026, 2027, 2028)
   - If "Simple": User defines custom columns
5. Table appears in Datasets list

**Table Editing:**
- Click `[Edit]` on table card
- Edit modal opens with:
  - Table name and description
  - Column structure (read-only for now)
  - Data rows (coming soon - full cell editing)
  - Formula support (coming soon)

#### 3. **Add Formulas to Tables** (Coming Soon)

**Planned Workflow:**
1. User clicks cell in table editor
2. Formula input appears
3. User types `=` → Auto-complete shows functions
4. User can:
   - Type formula: `=SUM(Product A:Jan:Dec)`
   - Click cells to reference them
   - Use function buttons: `[SUM]` `[AVERAGE]` `[IF]`
5. System calculates value in real-time
6. Formula saved, value auto-updates when source data changes

**Supported Formulas (Planned):**
- Basic: `=SUM(range)`, `=AVERAGE(range)`, `=MAX(range)`, `=MIN(range)`
- Arithmetic: `=A + B`, `=A - B`, `=A * B`, `=A / B`
- Conditional: `=IF(condition, true, false)`
- Financial: `=TOTAL_REVENUE()`, `=NET_PROFIT()`, `=CASH_FLOW()`

#### 4. **Create KPIs** (Data Tab)

**Option A: Manual KPI**

1. User clicks `[📈 Add KPI]`
2. Form opens:
```
┌─────────────────────────────────────────┐
   │ Add KPI                                  │
   ├─────────────────────────────────────────┤
   │ Name: [Revenue Growth %]                 │
   │                                         │
   │ Calculation Type:                       │
   │ ● Manual Entry                          │
   │ ○ Formula (auto-calculated)             │
   │                                         │
   │ Value: [15]                             │
   │ Unit: [%]                               │
   │ Target: [20] (optional)                 │
   │ Description: [Annual revenue growth...] │
   │                                         │
   │ [Create KPI] [Cancel]                   │
└─────────────────────────────────────────┘
```
3. User enters values manually
4. KPI saved with static value

**Option B: Formula-Based KPI** (Coming Soon)

1. User clicks `[📈 Add KPI]`
2. User selects "Formula (auto-calculated)"
3. Formula input appears:
   ```
   ┌─────────────────────────────────────────┐
   │ Add KPI                                  │
   ├─────────────────────────────────────────┤
   │ Name: [Revenue Growth %]                 │
   │                                         │
   │ Calculation Type:                       │
   │ ○ Manual Entry                          │
   │ ● Formula (auto-calculated)             │
   │                                         │
   │ Link to Dataset: [Revenue Projections ▼]│
   │                                         │
   │ Formula: [=((Revenue:Year2 - Revenue:Year1) / Revenue:Year1) * 100]│
   │                                         │
   │ Preview: 15%                             │
   │                                         │
   │ Target: [20] %                          │
   │ Description: [Annual revenue growth...] │
   │                                         │
   │ [Create KPI] [Cancel]                   │
   └─────────────────────────────────────────┘
   ```
4. System auto-calculates value
5. KPI updates when source data changes

**KPI Templates** (Coming Soon):
- Pre-built KPIs: "Revenue Growth %", "Profit Margin", "Break-even Point"
- One-click creation with formulas already set up

#### 5. **Edit KPIs** (Data Tab)

**Current Capabilities:**
- Click `[Edit]` on KPI card
- Edit modal opens with:
  - Name
  - Value (manual entry)
  - Unit
  - Target
  - Description

**Planned Capabilities:**
- Switch between manual and formula-based
- Edit formula
- See real-time preview
- Link to different datasets

#### 6. **Navigate Between Items** (Data Tab)

**Navigation Features:**
- **Prev/Next buttons** - Move between items in same section
- **Counter** - Shows "3 of 10" items
- **Quick jump** - Click section/question link to navigate
- **Search/Filter** - Find items quickly

**Example:**
```
┌─────────────────────────────────────────┐
│ 📊 Revenue Projections                  │
│ Section: Financial Overview             │
│ Question: Q01 Revenue Streams           │
│                                         │
│ [← Prev] [Next →]        3 of 10       │
│                                         │
│ [Attach] [Edit] [View] [Delete]        │
└─────────────────────────────────────────┘
```

#### 7. **Attach Items to Prompts** (Data Tab)

**Workflow:**
1. User is working on Q01 in main editor
2. User opens **Data tab**
3. User finds table/KPI/media item
4. User clicks `[Attach]` button
5. Item is attached to Q01
6. Item appears in final business plan after Q01's text

**Visual Feedback:**
- Attached items show "Attached to: Q01" badge
- Attached items highlighted (blue border)
- Can detach and re-attach to different prompts

#### 8. **View Item Details** (Data Tab)

**Workflow:**
1. User clicks `[View]` on item card
2. View modal opens showing:
   - Full item details
   - Preview/visualization
   - Where it's attached
   - Creation/update dates

---

## Financial Variables System (Coming Soon)

### What Are Financial Variables?

Financial variables are **named values** that represent standard financial concepts:
- **Revenue:** Product Sales, Service Revenue, Other Income
- **Expenses:** Personnel, Marketing, Operations, etc.
- **Profitability:** Gross Profit, Net Profit
- **Cash Flow:** Operating, Investing, Financing

### Planned Features

#### 1. **Predefined Variables**

System provides standard financial variables organized by category:

```
Revenue
├── Product Sales: 100,000 €
├── Service Revenue: 50,000 €
└── Other Income: 10,000 €
    Total Revenue: 160,000 € (auto-sum)

Expenses
├── Personnel: 80,000 €
├── Marketing: 20,000 €
├── Operations: 15,000 €
└── Total Expenses: 115,000 € (auto-sum)

Profitability
├── Gross Profit: 45,000 € (=Revenue - Expenses)
└── Net Profit: 30,000 € (=Gross Profit - Operations)
```

#### 2. **Variable Management UI**

**Location:** New tab in Data panel or separate panel

**UI:**
```
┌─────────────────────────────────────────┐
│ Financial Variables                     │
├─────────────────────────────────────────┤
│ [Revenue] [Expenses] [Cash Flow] [All] │ ← Tabs
├─────────────────────────────────────────┤
│ Revenue                                 │
│ ├─ Total Revenue: 160,000 €            │
│ │  Formula: =Product Sales + Service   │
│ ├─ Product Sales: 100,000 € [Edit]     │
│ ├─ Service Revenue: 50,000 € [Edit]    │
│ └─ Other Income: 10,000 € [Edit]      │
│                                         │
│ [Add Variable] [Import from Table]     │
└─────────────────────────────────────────┘
```

#### 3. **Variable-to-Dataset Linking**

- Variables can be linked to specific cells in tables
- When variable changes, table cell updates
- When table cell changes, variable updates
- Bidirectional sync

#### 4. **Variable Relationships**

Variables can reference each other:
- `Total Revenue = Product Sales + Service Revenue`
- `Net Profit = Total Revenue - Total Expenses`
- Auto-recalculation when dependencies change

---

## What's Missing vs. Plan4You

### Current State

**✅ What We Have:**
- Basic table creation
- Manual KPI creation/editing
- Item attachment to prompts
- Navigation between items
- Section/question tracking

**❌ What We're Missing:**
- Formula support in tables
- Formula-based KPIs
- Auto-calculation
- Financial variables system
- Variable relationships
- KPI templates
- Auto-recalculation

### Gap Analysis

| Feature | Plan4You | Our System | Complexity | Priority |
|---------|----------|------------|------------|----------|
| **Formula in tables** | ✅ | ❌ | Medium | **HIGH** |
| **Formula KPIs** | ✅ | ❌ | Medium | **HIGH** |
| **Auto-calculation** | ✅ | ❌ | Medium | **HIGH** |
| **Financial variables** | ✅ | ❌ | High | MEDIUM |
| **Variable relationships** | ✅ | ❌ | High | MEDIUM |
| **KPI templates** | ✅ | ❌ | Low | MEDIUM |
| **Auto-recalculate** | ✅ | ❌ | Medium | **HIGH** |

---

## Building Without Too Much Complexity

### Strategy: Incremental Enhancement

**Phase 1: Foundation (Current)**
- ✅ Basic table/KPI creation
- ✅ Manual data entry
- ✅ Item management

**Phase 2: Formulas (Next - 1-2 days)**
- Add formula support to tables
- Add formula support to KPIs
- Basic auto-calculation

**Phase 3: Variables (Future - 3-4 days)**
- Financial variables system
- Variable-to-dataset linking
- Variable relationships

**Phase 4: Polish (Future - 1-2 days)**
- KPI templates
- Visual formula builder
- Auto-complete

### Key Design Principles

1. **Backward Compatible**
   - Existing manual KPIs continue to work
   - Formulas are optional
   - Users can mix manual and formula-based

2. **Progressive Enhancement**
   - Start with simple formula input
   - Add visual builder later
   - Don't break existing workflows

3. **Unified Interface**
   - All financial data in Data tab
   - Same UI patterns for tables/KPIs/media
   - Consistent navigation

4. **Smart Defaults**
   - Suggest common formulas
   - Auto-detect cell references
   - Pre-fill templates when possible

---

## Complete User Workflow: Financial Section

### Scenario: User Creates Financial Plan

#### Step 1: Answer Prompts
1. User opens "Financial Overview" section
2. User answers text prompts about revenue, costs, funding
3. Content auto-saves

#### Step 2: Create Revenue Table
1. User opens **Right Panel → Data tab**
2. User clicks `[📊 Add Table]`
3. User creates "Revenue Projections" table
4. System suggests 4-year structure (optional)
5. User enters data manually (for now)

#### Step 3: Add Formulas (Coming Soon)
1. User clicks `[Edit]` on table
2. User clicks "Total" cell
3. User types `=SUM(Product A:Jan:Dec)`
4. System calculates: 15,000
5. Formula auto-updates when source data changes

#### Step 4: Create KPIs
1. User clicks `[📈 Add KPI]`
2. **Option A (Current):** Manual entry
   - User enters "Revenue Growth %" = 15%
3. **Option B (Coming Soon):** Formula-based
   - User selects formula: `=((Revenue:Y2 - Revenue:Y1) / Revenue:Y1) * 100`
   - System calculates: 15%
   - Auto-updates when revenue changes

#### Step 5: Attach to Prompt
1. User is working on Q01: "What are your revenue streams?"
2. User clicks `[Attach]` on "Revenue Projections" table
3. Table attached to Q01
4. Table will appear in final plan after Q01's text

#### Step 6: Navigate and Edit
1. User clicks `[Next →]` to see next table
2. User clicks `[Edit]` to modify KPI
3. User clicks section link to jump to related question

---

## Data Tab: Complete Structure

### Organization

```
Data Tab
├── Info Banner (contextual guidance)
├── Action Buttons
│   ├── [📊 Add Table]
│   ├── [📈 Add KPI]
│   └── [📷 Add Media]
├── Sub-Navigation
│   ├── [Datasets] - Tables and charts
│   ├── [KPIs] - Key performance indicators
│   └── [Media] - Images and files
└── List View (scrollable)
    ├── Item Cards (expandable)
    │   ├── Header (name, icon, date)
    │   ├── Context (section, question)
    │   ├── Navigation (Prev/Next, counter)
    │   ├── Details (when expanded)
    │   └── Actions (Attach, Edit, View, Delete)
    └── Search/Filter (for many items)
```

### Item Card Structure

```
┌─────────────────────────────────────────┐
│ 📊 Revenue Projections                  │ ← Header
│ Created: Jan 15, 2025                   │
│ Section: Financial Overview             │ ← Context
│ Question: Q01 Revenue Streams           │
│                                         │
│ [← Prev] [Next →]        3 of 10       │ ← Navigation
│                                         │
│ [Attach] [Edit] [View] [Delete]        │ ← Actions
└─────────────────────────────────────────┘
```

---

## Technical Implementation Notes

### Formula Engine Integration

**Library:** `formulajs` (recommended)
- Excel-compatible functions
- Lightweight (~50KB)
- TypeScript support

**Formula Syntax:**
- Named ranges: `=SUM(Product A:Jan:Dec)`
- Cell references: `=Product A:Jan + Product B:Jan`
- Functions: `=SUM()`, `=AVERAGE()`, `=IF()`, etc.

**Storage:**
- Formulas stored in `Dataset.formulas?: Record<string, string>`
- Calculated values in `Dataset.calculatedValues?: Record<string, number>`
- KPIs: `KPI.formula?: string`, `KPI.isCalculated?: boolean`

### Auto-Recalculate System

**Dependency Tracking:**
- Track which cells depend on which
- When source cell changes, recalculate dependent cells
- Circular dependency detection

**Performance:**
- Batch recalculations
- Debounce rapid changes
- Cache calculated values

---

## Success Criteria

### MVP (Current)
✅ User can create tables manually
✅ User can create KPIs manually
✅ User can attach items to prompts
✅ User can navigate between items
✅ User can see section/question context

### Phase 2 (Formulas)
✅ User can add formulas to table cells
✅ User can create formula-based KPIs
✅ Formulas calculate correctly
✅ Values update when source data changes

### Phase 3 (Variables)
✅ User can use predefined financial variables
✅ Variables can reference each other
✅ Variables sync with table cells
✅ Auto-recalculation works

### Full Implementation
✅ All Plan4You features matched
✅ Performance acceptable (<100ms recalculation)
✅ Error handling clear
✅ User experience smooth

---

## Migration Path

### For Existing Users
- Existing manual KPIs continue to work
- Can optionally add formulas
- No breaking changes
- Progressive enhancement

### For New Features
- Formulas are opt-in
- Can mix manual and formula-based
- Templates available but not required
- Flexible data entry

---

*Last updated: 2025-01-20*
*Includes: Financial Formula Engine Plan + KPI and Financial Variables Analysis*
