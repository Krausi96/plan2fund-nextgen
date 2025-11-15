# Complete Flow Examples - All Section Types

## Overview

This document shows **exactly** how the flow works for each section type, how tables/charts connect to text, and how users can customize everything.

---

## Section Types That Need Tables/Charts

Based on `section.category`:

1. **Financial Sections** (`category: 'financial'`) - **ALWAYS needs tables**
2. **Risk Sections** (`category: 'risk'`) - **ALWAYS needs tables** (risk matrix)
3. **Project Sections** (`category: 'project'`) - **ALWAYS needs tables** (milestones)
4. **Market Sections** (`category: 'market'`) - **MAY need tables** (competitor analysis, optional)
5. **Team Sections** (`category: 'team'`) - **MAY need tables** (hiring timeline, optional)
6. **Text-Only Sections** (`category: 'general'`) - **NO tables** (Executive Summary)

---

## Example 1: Financial Section (Preliminary Financial Overview)

### Section Info
- **Category:** `financial`
- **Needs Tables:** YES (always)
- **Typical Tables:** Revenue, Costs, Cash Flow

### Complete Flow

#### Step 1: User Opens Section
```
User clicks "06 Preliminary Financial Overview" tab
  ↓
Section loads:
  - Title: "Preliminary Financial Overview"
  - Description: "Provide high-level financial assumptions..."
  - Text Editor: Empty
  - Tables & Charts Section: Appears (because category = 'financial')
```

#### Step 2: User Writes Text
```
User writes in text editor:
"Our revenue projections show strong growth over the next 3 years. 
We expect to reach €500,000 in Year 1, growing to €1.2 million by Year 3. 
Our main cost drivers include personnel (€150K Year 1), marketing (€50K Year 1), 
and technology infrastructure (€30K Year 1)."
  ↓
Text saved to: section.content
```

#### Step 3: Tables Section Appears
```
📊 Tables & Charts section is visible (because category = 'financial')
  ↓
User sees:
  [📊 Add Table] [📈 Add Chart] [📷 Add Image]
```

#### Step 4: User Creates Revenue Table
```
User clicks "📊 Add Table"
  ↓
Table creation dialog opens:
  Name: [Revenue Projections        ]
  Type: [Table ▼]
  Time Period: [Years ▼]
  Number of Periods: [3]
  [Create] [Cancel]
  ↓
User clicks "Create"
  ↓
Empty table structure created:
  ┌─────────────┬─────────┬─────────┬─────────┐
  │ Item        │ Year 1  │ Year 2  │ Year 3  │
  ├─────────────┼─────────┼─────────┼─────────┤
  │ [Product A] │ [    ]  │ [    ]  │ [    ]  │
  │ [Product B] │ [    ]  │ [    ]  │ [    ]  │
  └─────────────┴─────────┴─────────┴─────────┘
  ↓
Table saved to: section.tables.revenue
```

#### Step 5: AI Fills Table from Text
```
User clicks "✨ Fill with AI from Text" button on table
  ↓
AI reads section.content:
  "We expect to reach €500,000 in Year 1, growing to €1.2 million by Year 3"
  ↓
AI extracts data and fills table:
  ┌─────────────┬─────────┬─────────┬─────────┐
  │ Item        │ Year 1  │ Year 2  │ Year 3  │
  ├─────────────┼─────────┼─────────┼─────────┤
  │ Product A   │ 300,000 │ 600,000 │ 900,000 │
  │ Product B   │ 200,000 │ 400,000 │ 300,000 │
  └─────────────┴─────────┴─────────┴─────────┘
  ↓
Table saved: section.tables.revenue = { data... }
```

#### Step 6: Chart Auto-Generates
```
Table has data
  ↓
Chart automatically generates from table:
  [Bar chart showing Year 1, Year 2, Year 3 revenue]
  ↓
Chart saved to: section.figures[0] = {
    type: 'chart',
    source: 'revenue',
    chartType: 'bar',
    data: [from table]
  }
```

#### Step 7: User Creates More Tables
```
User clicks "📊 Add Table" again
  ↓
Creates "Cost Breakdown" table
  ↓
User clicks "✨ Fill with AI from Text"
  ↓
AI reads text: "personnel (€150K Year 1), marketing (€50K Year 1), technology (€30K Year 1)"
  ↓
AI fills cost table:
  ┌─────────────┬─────────┬─────────┬─────────┐
  │ Item        │ Year 1  │ Year 2  │ Year 3  │
  ├─────────────┼─────────┼─────────┼─────────┤
  │ Personnel   │ 150,000 │ 200,000 │ 250,000 │
  │ Marketing    │ 50,000  │ 80,000  │ 100,000 │
  │ Technology   │ 30,000  │ 40,000  │ 50,000  │
  └─────────────┴─────────┴─────────┴─────────┘
  ↓
Chart auto-generates for costs table too
```

#### Step 8: Navigate Between Tables
```
User now has 2 tables: Revenue, Costs
  ↓
Tables & Charts section shows:
  Navigation: [← Previous]  [Table 1 of 2]  [Next →]
  All Tables: [Revenue] [Costs]  ← Click to jump
  ↓
User clicks "Costs" tab
  ↓
Costs table becomes visible
  Revenue table hidden (but still saved)
```

#### Step 9: Customize Tables
```
User can:
  - Edit table values manually (click cell, type new value)
  - Add rows: Click "Add Row" button
  - Delete rows: Click row, then "Delete"
  - Change table structure: Click "Edit Settings"
  - Delete table: Click "Delete" button
  - Regenerate from text: Click "✨ Fill with AI from Text" again
```

#### Step 10: Customize Charts
```
User can:
  - Change chart type: Click "Chart Type ▼" → Select Bar/Line/Pie
  - Edit chart settings: Click "Edit Settings" → Change colors, labels
  - Hide chart: Click "Hide Chart" (table still visible)
  - Show chart again: Click "Show Chart"
```

### Final State
```
section = {
  content: "Our revenue projections show strong growth...",
  tables: {
    revenue: { name: 'Revenue Projections', data: [...] },
    costs: { name: 'Cost Breakdown', data: [...] }
  },
  figures: [
    { type: 'chart', source: 'revenue', chartType: 'bar', ... },
    { type: 'chart', source: 'costs', chartType: 'bar', ... }
  ]
}
```

---

## Example 2: Risk Section (Risk Assessment)

### Section Info
- **Category:** `risk`
- **Needs Tables:** YES (always - risk matrix)
- **Typical Tables:** Risk Matrix

### Complete Flow

#### Step 1: User Opens Section
```
User clicks "08 Risk Assessment" tab
  ↓
Section loads:
  - Title: "Risk Assessment"
  - Description: "Identify market entry barriers..."
  - Text Editor: Empty
  - Tables & Charts Section: Appears (because category = 'risk')
```

#### Step 2: User Writes Text
```
User writes:
"Key risks include market competition (high impact, medium probability), 
technology changes (medium impact, high probability), and regulatory 
compliance (low impact, low probability). We have mitigation strategies 
for each risk..."
  ↓
Text saved to: section.content
```

#### Step 3: User Creates Risk Matrix
```
User clicks "📊 Add Table"
  ↓
Table creation dialog:
  Name: [Risk Assessment Matrix        ]
  Type: [Matrix ▼]  ← Special type for risk sections
  [Create]
  ↓
Risk matrix structure created:
  ┌─────────────┬──────────┬──────────────┬──────────────┐
  │ Risk        │ Impact   │ Probability  │ Mitigation   │
  ├─────────────┼──────────┼──────────────┼──────────────┤
  │ [Competition] │ [High]   │ [Medium]     │ [Strategy]   │
  │ [Technology]  │ [Medium] │ [High]       │ [R&D]        │
  │ [Regulatory]  │ [Low]     │ [Low]        │ [Legal]      │
  └─────────────┴──────────┴──────────────┴──────────────┘
```

#### Step 4: AI Fills Risk Matrix from Text
```
User clicks "✨ Fill with AI from Text"
  ↓
AI reads text:
  "market competition (high impact, medium probability)"
  "technology changes (medium impact, high probability)"
  "regulatory compliance (low impact, low probability)"
  ↓
AI fills matrix:
  ┌─────────────┬──────────┬──────────────┬──────────────┐
  │ Risk        │ Impact   │ Probability  │ Mitigation   │
  ├─────────────┼──────────┼──────────────┼──────────────┤
  │ Competition │ High     │ Medium       │ Strategy     │
  │ Technology  │ Medium   │ High         │ R&D          │
  │ Regulatory  │ Low      │ Low          │ Legal        │
  └─────────────┴──────────┴──────────────┴──────────────┘
```

#### Step 5: Risk Matrix Chart Auto-Generates
```
Matrix has data
  ↓
Risk matrix visualization generates:
  [2x2 grid: High/Medium Impact vs High/Medium Probability]
  [Risks plotted on grid]
  ↓
Chart saved: section.figures[0] = {
    type: 'chart',
    source: 'riskMatrix',
    chartType: 'matrix',
    data: [from matrix]
  }
```

### Customization Options
```
User can:
  - Add more risks: Click "Add Row"
  - Edit risk details: Click cell, edit
  - Change impact/probability: Dropdown in cell
  - Add mitigation strategies: Type in mitigation column
  - Regenerate from text: Click "✨ Fill with AI from Text"
  - Change matrix visualization: Click "Chart Type ▼" → Matrix/Heatmap
```

---

## Example 3: Project Section (Project Description)

### Section Info
- **Category:** `project`
- **Needs Tables:** YES (always - milestones)
- **Typical Tables:** Project Milestones, Timeline

### Complete Flow

#### Step 1: User Writes Text
```
User writes:
"Our project involves developing a new mobile application. 
Key milestones include prototype completion (Month 3), 
beta testing (Month 6), and launch (Month 12). 
We will hire 2 developers in Month 1, 3 more in Month 3..."
```

#### Step 2: User Creates Milestone Table
```
User clicks "📊 Add Table"
  ↓
Creates "Project Milestones" table:
  Time Period: [Months ▼]
  Number of Periods: [12]
  ↓
Table structure:
  ┌─────────────┬──────┬──────┬──────┬──────┐
  │ Milestone   │ M1   │ M3   │ M6   │ M12  │
  ├─────────────┼──────┼──────┼──────┼──────┤
  │ [Prototype] │ [  ] │ [✓]  │ [  ] │ [  ] │
  │ [Beta Test] │ [  ] │ [  ] │ [✓]  │ [  ] │
  │ [Launch]    │ [  ] │ [  ] │ [  ] │ [✓]  │
  └─────────────┴──────┴──────┴──────┴──────┘
```

#### Step 3: AI Fills Milestones from Text
```
User clicks "✨ Fill with AI from Text"
  ↓
AI reads: "prototype completion (Month 3), beta testing (Month 6), launch (Month 12)"
  ↓
AI fills table:
  ┌─────────────┬──────┬──────┬──────┬──────┐
  │ Milestone   │ M1   │ M3   │ M6   │ M12  │
  ├─────────────┼──────┼──────┼──────┼──────┤
  │ Prototype   │      │ ✓    │      │      │
  │ Beta Test   │      │      │ ✓    │      │
  │ Launch      │      │      │      │ ✓    │
  └─────────────┴──────┴──────┴──────┴──────┘
```

#### Step 4: Gantt Chart Auto-Generates
```
Milestone table has data
  ↓
Gantt chart generates:
  [Timeline visualization showing milestones across 12 months]
  ↓
Chart saved: section.figures[0] = {
    type: 'chart',
    source: 'milestones',
    chartType: 'gantt',
    data: [from table]
  }
```

### Customization Options
```
User can:
  - Add milestones: Click "Add Row"
  - Change dates: Click cell, edit month
  - Mark complete: Click checkbox (✓)
  - Add dependencies: Click "Edit Settings" → Add dependencies
  - Change timeline: Edit "Number of Periods"
  - Regenerate from text: Click "✨ Fill with AI from Text"
  - Change chart: Gantt/Timeline/Bar chart
```

---

## Example 4: Market Section (Market Opportunity) - Optional Tables

### Section Info
- **Category:** `market`
- **Needs Tables:** MAYBE (optional - competitor analysis)
- **Typical Tables:** Competitor Comparison (optional)

### Complete Flow

#### Step 1: User Writes Text
```
User writes:
"Our target market consists of small and medium-sized businesses 
in the technology sector. The market size is approximately €50 million 
with a growth rate of 15% annually. Key competitors include Company A 
(30% market share), Company B (25% market share), and Company C (20% market share)..."
```

#### Step 2: User Decides to Add Competitor Table (Optional)
```
User sees: [📊 Add Table] button
  ↓
User clicks "📊 Add Table" (optional - not required)
  ↓
Creates "Competitor Analysis" table:
  Type: [Comparison Table ▼]  ← No time period
  ↓
Table structure:
  ┌─────────────┬──────────┬──────────┬──────────┐
  │ Competitor  │ Market %  │ Strength │ Weakness │
  ├─────────────┼──────────┼──────────┼──────────┤
  │ [Company A] │ [30%]    │ [Brand]  │ [Price]  │
  │ [Company B] │ [25%]    │ [Tech]   │ [Support]│
  │ [Company C] │ [20%]    │ [Service]│ [Speed]  │
  └─────────────┴──────────┴──────────┴──────────┘
```

#### Step 3: AI Fills Competitor Table from Text
```
User clicks "✨ Fill with AI from Text"
  ↓
AI reads: "Company A (30% market share), Company B (25% market share), Company C (20% market share)"
  ↓
AI fills table with data from text
```

#### Step 4: Chart Auto-Generates (Optional)
```
Table has data
  ↓
Pie chart generates showing market share:
  [Pie chart: Company A 30%, Company B 25%, Company C 20%]
```

**Note:** This table is **optional**. User can skip it if they don't want it.

---

## Example 5: Team Section (Team & Qualifications) - Optional Tables

### Section Info
- **Category:** `team`
- **Needs Tables:** MAYBE (optional - hiring timeline)
- **Typical Tables:** Team Hiring Timeline (optional)

### Complete Flow

#### Step 1: User Writes Text
```
User writes:
"Our team consists of experienced professionals. We plan to hire 
2 developers in Month 1, 3 more in Month 3, 5 total by Month 6, 
and 8 by Month 12. Marketing team: 1 in Month 1, 2 in Month 3, 
3 in Month 6, 4 by Month 12..."
```

#### Step 2: User Creates Hiring Timeline (Optional)
```
User clicks "📊 Add Table" (optional)
  ↓
Creates "Team Hiring Timeline" table:
  Time Period: [Months ▼]
  Number of Periods: [12]
  ↓
Table structure:
  ┌─────────────┬──────┬──────┬──────┬──────┐
  │ Role        │ M1   │ M3   │ M6   │ M12  │
  ├─────────────┼──────┼──────┼──────┼──────┤
  │ [Developer]  │ [2]  │ [3]  │ [5]  │ [8]  │
  │ [Marketing] │ [1]  │ [2]  │ [3]  │ [4]  │
  │ [Sales]     │ [0]  │ [1]  │ [2]  │ [3]  │
  └─────────────┴──────┴──────┴──────┴──────┘
```

#### Step 3: AI Fills from Text
```
User clicks "✨ Fill with AI from Text"
  ↓
AI reads: "2 developers in Month 1, 3 more in Month 3, 5 total by Month 6, 8 by Month 12"
  ↓
AI fills table
```

#### Step 4: Line Chart Auto-Generates
```
Table has data
  ↓
Line chart generates showing team growth over time
```

**Note:** This table is **optional**. User can skip it.

---

## Example 6: Text-Only Section (Executive Summary)

### Section Info
- **Category:** `general`
- **Needs Tables:** NO
- **Typical Tables:** None

### Complete Flow

#### Step 1: User Opens Section
```
User clicks "01 Executive Summary" tab
  ↓
Section loads:
  - Title: "Executive Summary"
  - Description: "Provide a concise overview..."
  - Text Editor: Empty
  - Tables & Charts Section: DOES NOT APPEAR (category = 'general')
```

#### Step 2: User Writes Text
```
User writes:
"Our company is a technology startup focused on innovative solutions 
for small businesses. We seek €100,000 in funding to expand our 
market presence and develop new products..."
  ↓
Text saved to: section.content
```

#### Step 3: No Tables Section
```
No "📊 Tables & Charts" section appears
  ↓
User only sees text editor
  ↓
Done - section complete
```

**Note:** No tables/charts for text-only sections.

---

## How Everything Connects

### The Connection Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ TEXT EDITOR (Source)                                              │
│ "Our revenue projections show €500K Year 1, €1.2M Year 3..."    │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ USER CLICKS "✨ Fill with AI from Text"                         │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ AI READS TEXT                                                    │
│ - Extracts: "€500K Year 1, €1.2M Year 3"                       │
│ - Understands: Revenue, 3 years, growth                          │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ AI FILLS TABLE                                                    │
│ Year 1: €500,000                                                 │
│ Year 2: €800,000 (interpolated)                                 │
│ Year 3: €1,200,000                                               │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ CHART AUTO-GENERATES                                              │
│ [Bar chart from table data]                                      │
└─────────────────────────────────────────────────────────────────┘
```

### Key Points

1. **Text is the source** - User writes text first
2. **AI extracts data** - When user clicks "Fill with AI from Text"
3. **Table gets filled** - AI populates table from text
4. **Chart auto-generates** - Chart created from table data
5. **User can edit either** - Text and table are independent after creation
6. **Can regenerate** - User can click "Fill with AI" again to update

---

## Customization Options

### Table Customization

#### 1. Edit Table Structure
```
User clicks "Edit Settings" on table
  ↓
Dialog opens:
  - Change table name
  - Change time period (Years/Months/Quarters)
  - Change number of periods
  - Add/remove columns
  - Change column names
  ↓
User saves changes
  ↓
Table structure updates
```

#### 2. Edit Table Data
```
User clicks on any cell
  ↓
Cell becomes editable
  ↓
User types new value
  ↓
Value saved immediately
  ↓
Chart updates automatically (if connected)
```

#### 3. Add/Remove Rows
```
User clicks "Add Row" button
  ↓
New row added to table
  ↓
User can fill it manually or with AI
  ↓
User clicks row, then "Delete"
  ↓
Row removed
```

#### 4. Regenerate from Text
```
User edits text editor:
  "Revenue: €600K Year 1, €1.5M Year 3"  ← Changed values
  ↓
User clicks "✨ Fill with AI from Text" on table
  ↓
AI reads new text
  ↓
AI updates table with new values
  ↓
Chart updates automatically
```

### Chart Customization

#### 1. Change Chart Type
```
User clicks "Chart Type ▼" on chart
  ↓
Dropdown shows:
  - Bar Chart
  - Line Chart
  - Pie Chart
  - Area Chart
  - (For risk: Matrix, Heatmap)
  - (For project: Gantt, Timeline)
  ↓
User selects new type
  ↓
Chart regenerates with new type
```

#### 2. Edit Chart Settings
```
User clicks "Edit Settings" on chart
  ↓
Dialog opens:
  - Change colors
  - Change labels (X-axis, Y-axis)
  - Change title
  - Show/hide legend
  - Change data range
  ↓
User saves
  ↓
Chart updates
```

#### 3. Hide/Show Chart
```
User clicks "Hide Chart"
  ↓
Chart disappears (but data still saved)
  ↓
User clicks "Show Chart"
  ↓
Chart reappears
```

### Multiple Tables Navigation

#### If Section Has 3 Tables
```
Tables & Charts Section:
  Navigation: [← Previous]  [Table 1 of 3]  [Next →]
  
  All Tables: [Revenue] [Costs] [Cash Flow]
              ↑ Click to jump to any table
  
  Current: Revenue Table (visible)
  Hidden: Costs Table, Cash Flow Table (saved but not visible)
```

#### Navigation Options
1. **Previous/Next buttons** - Move sequentially
2. **Table tabs** - Click [Revenue] or [Costs] to jump
3. **Keyboard shortcuts** - Arrow keys (← →)

---

## Complete Flow Summary

### For Financial Sections (Always Needs Tables)

```
1. User opens section
2. User writes text in editor
3. Tables & Charts section appears (automatic)
4. User creates table (Revenue, Costs, etc.)
5. User clicks "✨ Fill with AI from Text"
6. AI extracts data from text and fills table
7. Chart auto-generates from table
8. User can create more tables (Costs, Cash Flow)
9. User navigates between tables using tabs
10. User can customize: edit values, change chart type, etc.
```

### For Risk Sections (Always Needs Risk Matrix)

```
1. User opens section
2. User writes text about risks
3. Tables & Charts section appears (automatic)
4. User creates Risk Matrix table
5. User clicks "✨ Fill with AI from Text"
6. AI extracts risks from text and fills matrix
7. Risk matrix visualization auto-generates
8. User can customize: add risks, change impact/probability, etc.
```

### For Project Sections (Always Needs Milestones)

```
1. User opens section
2. User writes text about project and milestones
3. Tables & Charts section appears (automatic)
4. User creates Milestone table
5. User clicks "✨ Fill with AI from Text"
6. AI extracts milestones from text and fills table
7. Gantt chart auto-generates
8. User can customize: add milestones, change dates, etc.
```

### For Market Sections (Optional Tables)

```
1. User opens section
2. User writes text about market
3. Tables & Charts section appears (optional)
4. User can choose to add Competitor table (or skip)
5. If added: AI fills from text, chart generates
6. User can customize or delete if not needed
```

### For Team Sections (Optional Tables)

```
1. User opens section
2. User writes text about team
3. Tables & Charts section appears (optional)
4. User can choose to add Hiring Timeline (or skip)
5. If added: AI fills from text, chart generates
6. User can customize or delete if not needed
```

### For Text-Only Sections (No Tables)

```
1. User opens section
2. User writes text
3. No Tables & Charts section appears
4. Done
```

---

## How It's All Connected

### Data Flow

```
section.content (Text)
    ↓
User clicks "✨ Fill with AI from Text"
    ↓
AI reads section.content
    ↓
AI extracts structured data
    ↓
section.tables[tableKey] (Table data)
    ↓
Chart auto-generates
    ↓
section.figures[] (Chart data)
```

### When User Switches Sections

```
User on Section 2 (Market Opportunity)
  - section.content = "Our target market..."
  - section.tables = { competitors: {...} }
  - section.figures = [{ chart from competitors }]
  ↓
User clicks Section 3 tab (Project Description)
  ↓
Section 2 auto-saves:
  - All data saved to storage
  ↓
Section 3 loads:
  - section.content = "" (or existing content)
  - section.tables = {} (or existing tables)
  - section.figures = [] (or existing charts)
  ↓
User edits Section 3
  ↓
All sections saved independently
```

### Export Flow

```
Final Plan Export:
  Section 1 (Executive Summary):
    - Text only
  Section 2 (Market Opportunity):
    - Text + Competitor table + Chart
  Section 3 (Project Description):
    - Text + Milestone table + Gantt chart
  Section 6 (Financial Overview):
    - Text + Revenue table + Revenue chart
    - Text + Costs table + Costs chart
  ...
```

---

## Customization Summary

### What Users Can Customize

1. **Table Structure**
   - Name, time period, number of periods
   - Columns, rows
   - Table type (Table, Matrix, Comparison)

2. **Table Data**
   - Edit any cell value
   - Add/remove rows
   - Regenerate from text

3. **Charts**
   - Chart type (Bar, Line, Pie, Gantt, Matrix, etc.)
   - Colors, labels, titles
   - Show/hide chart

4. **Navigation**
   - Previous/Next between tables
   - Jump to specific table via tabs
   - Keyboard shortcuts

5. **Connection**
   - Fill table from text (AI)
   - Edit text and table independently
   - Regenerate table from updated text

---

## Visual Flow Diagram

### Universal Flow (All Sections)

```
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: USER OPENS SECTION                                      │
│ Click section tab → Section loads                               │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: USER WRITES TEXT                                         │
│ Text Editor: "Our revenue projections show..."                  │
│ Content saved to: section.content                               │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: TABLES/CHARTS APPEAR?                                    │
│                                                                  │
│ Check: Does section.category need tables?                       │
│                                                                  │
│ Financial → YES (always)                                         │
│ Risk → YES (always - risk matrix)                               │
│ Project → YES (always - milestones)                            │
│ Market → MAYBE (optional - competitor table)                    │
│ Team → MAYBE (optional - hiring timeline)                       │
│ General → NO (text only)                                        │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ IF YES: STEP 4: USER CREATES TABLE                               │
│ Click "📊 Add Table" → Create table structure                   │
│ Table saved to: section.tables[tableKey]                        │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 5: AI FILLS TABLE FROM TEXT                                  │
│ User clicks "✨ Fill with AI from Text"                          │
│ AI reads section.content → Extracts data → Fills table          │
│ Table updated: section.tables[tableKey] = { data... }           │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 6: CHART AUTO-GENERATES                                      │
│ Table has data → Chart generates automatically                   │
│ Chart saved to: section.figures[] = { chart data }              │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 7: USER CAN CUSTOMIZE                                       │
│ - Edit table values                                              │
│ - Add more tables                                                │
│ - Navigate between tables                                        │
│ - Change chart type                                              │
│ - Regenerate from text                                           │
└─────────────────────────────────────────────────────────────────┘
```

### Section-Specific Flows

```
FINANCIAL SECTION:
  Text → Revenue Table → Revenue Chart
  Text → Costs Table → Costs Chart
  Text → Cash Flow Table → Cash Flow Chart
  (Multiple tables, navigate between them)

RISK SECTION:
  Text → Risk Matrix → Risk Matrix Visualization
  (One matrix, shows impact vs probability)

PROJECT SECTION:
  Text → Milestone Table → Gantt Chart
  (One timeline table, shows project schedule)

MARKET SECTION:
  Text → (Optional) Competitor Table → Pie Chart
  (Optional - user can skip)

TEAM SECTION:
  Text → (Optional) Hiring Timeline → Line Chart
  (Optional - user can skip)

GENERAL SECTION:
  Text → (No tables)
  (Text only)
```

---

## Quick Reference: Section Types

| Section Type | Category | Tables Needed? | Typical Tables | Chart Type |
|-------------|----------|---------------|----------------|------------|
| Executive Summary | `general` | NO | None | None |
| Market Opportunity | `market` | MAYBE | Competitor Analysis (optional) | Pie Chart |
| Project Description | `project` | YES | Milestones, Timeline | Gantt Chart |
| Financial Overview | `financial` | YES | Revenue, Costs, Cash Flow | Bar/Line Chart |
| Risk Assessment | `risk` | YES | Risk Matrix | Matrix/Heatmap |
| Team & Qualifications | `team` | MAYBE | Hiring Timeline (optional) | Line Chart |

---

**Status:** Complete Flow Documentation - Ready for Implementation

