# Section-by-Section: Tables, Charts & Visual Components Plan

## Based on Runtastic Analysis & Current Template Categories

---

## Section Categories & Their Needs

### 1. Financial Sections (`category: 'financial'`)

**Sections:** Budget, Financial Planning, Financials & Projections, Financial Plan & Investment

**Tables Needed:**
- ✅ `revenue` - Multi-year revenue projections
- ✅ `costs` - Cost breakdown by category
- ✅ `cashflow` - Cash flow projections
- ✅ `useOfFunds` - How funding will be used

**Charts Needed:**
- ✅ Revenue → **Bar chart** (shows revenue streams over time)
- ✅ Costs → **Bar chart** (shows cost breakdown)
- ✅ Cash Flow → **Line chart** (shows cash flow trends)
- ✅ Use of Funds → **Pie/Bar chart** (shows fund allocation)
- ⏳ Break-even → **Line chart** (calculated from revenue/costs)
- ⏳ Multiple scenarios → **Comparison charts** (base/worst/best)

**Analysis Needed:**
- Break-even calculation
- Growth rate (YoY)
- Profitability margins
- Scenario comparison

**UI Organization:**
```
Financial Section:
  ├─ Text Editor (narrative)
  ├─ Revenue Table
  │  └─ Revenue Chart (auto-generated)
  ├─ Costs Table
  │  └─ Costs Chart (auto-generated)
  ├─ Cash Flow Table
  │  └─ Cash Flow Chart (auto-generated)
  ├─ Use of Funds Table
  │  └─ Use of Funds Chart (auto-generated)
  └─ Analysis Cards (break-even, growth rates)
```

---

### 2. Market Sections (`category: 'market'`)

**Sections:** Market Opportunity, Market Analysis, Competitive Landscape

**Tables Needed:**
- ✅ `competitors` - Competitor comparison matrix

**Charts Needed:**
- ✅ Competitor comparison → **Bar chart** (feature comparison)
- ⏳ Market size → **Bar/Pie chart** (if market data available)
- ⏳ Market growth → **Line chart** (if trend data available)

**Analysis Needed:**
- Competitive positioning
- Market share analysis
- TAM/SAM/SOM breakdown (if in fields)

**UI Organization:**
```
Market Section:
  ├─ Text Editor (narrative)
  ├─ Competitor Table
  │  └─ Competitor Chart (auto-generated)
  └─ Market Data (if available in fields)
     └─ Market Charts
```

---

### 3. Team Sections (`category: 'team'`)

**Sections:** Entrepreneur Team, Management Team, Team

**Tables Needed:**
- ✅ `team` - Team skills matrix

**Charts Needed:**
- ❌ None (tables only - visual presentation)

**Analysis Needed:**
- Skills gap analysis
- Team complementarity

**UI Organization:**
```
Team Section:
  ├─ Text Editor (narrative)
  └─ Team Skills Matrix Table
     (visual table, no chart)
```

---

### 4. Risk Sections (`category: 'risk'`)

**Sections:** Risiken, Risk Analysis

**Tables Needed:**
- ✅ `risks` - Risk matrix (risk × impact)

**Charts Needed:**
- ❌ None (tables only - risk matrix visualization)

**Analysis Needed:**
- Risk scoring
- Risk prioritization
- Mitigation effectiveness

**UI Organization:**
```
Risk Section:
  ├─ Text Editor (narrative)
  └─ Risk Matrix Table
     (visual table with color coding)
```

---

### 5. Project Sections (`category: 'project'`)

**Sections:** Realisierungsfahrplan, Implementation Timeline, Project Plan

**Tables Needed:**
- ✅ `timeline` - Project timeline/milestones

**Charts Needed:**
- ⏳ Timeline → **Gantt chart** (visual timeline)
- ⏳ Milestones → **Timeline visualization**

**Analysis Needed:**
- Critical path analysis
- Milestone tracking

**UI Organization:**
```
Project Section:
  ├─ Text Editor (narrative)
  ├─ Timeline Table
  └─ Gantt Chart (auto-generated)
```

---

### 6. Technical Sections (`category: 'technical'`)

**Sections:** Innovation, Technical Development, Technology

**Tables Needed:**
- ❌ None (text only)

**Charts Needed:**
- ❌ None (text only)

**Analysis Needed:**
- None

**UI Organization:**
```
Technical Section:
  └─ Text Editor (narrative only)
```

---

### 7. Impact Sections (`category: 'impact'`)

**Sections:** Impact, Expected Impact

**Tables Needed:**
- ❌ None (text only, or structured fields)

**Charts Needed:**
- ⏳ Impact metrics → **Bar chart** (if metrics available)

**Analysis Needed:**
- Impact measurement

**UI Organization:**
```
Impact Section:
  ├─ Text Editor (narrative)
  └─ Impact Metrics (if in fields)
     └─ Impact Charts
```

---

### 8. General Sections (`category: 'general'`)

**Sections:** Executive Summary, Product Idea, Business Model, etc.

**Tables Needed:**
- ❌ None (text only)

**Charts Needed:**
- ❌ None (text only)

**Analysis Needed:**
- None

**UI Organization:**
```
General Section:
  └─ Text Editor (narrative only)
```

---

## Smart Interface Organization

### Component Hierarchy

```
Editor.tsx
  └─ SectionContentRenderer (smart component)
      ├─ Checks section.category
      ├─ Checks section.tables
      ├─ Renders appropriate UI:
      │  ├─ Financial → FinancialTable + FinancialChart
      │  ├─ Market → DataTable + FinancialChart
      │  ├─ Team → DataTable (text)
      │  ├─ Risk → DataTable (text)
      │  └─ Project → DataTable + GanttChart (future)
      └─ Auto-generates charts from tables
```

### Table Initialization Flow

```
1. Editor loads sections from templates
2. For each section:
   - Check template.category
   - If needs tables → initializeTablesForSection(template)
   - Create default table structures
   - Store in section.tables
3. User sees tables in UI
4. User edits table data
5. Charts auto-generate from table data
```

---

## Implementation Strategy

### Phase 1: Table Initialization ✅
- ✅ Create `tableInitializer.ts` utility
- ✅ Initialize tables based on category
- ✅ Update Editor to initialize tables on load

### Phase 2: Smart Rendering ✅
- ✅ Create `SectionContentRenderer` component
- ✅ Render tables/charts based on category
- ✅ Integrate into Editor

### Phase 3: Chart Generation ✅
- ✅ FinancialChart component (DONE)
- ✅ Auto-generate from table data
- ⏳ Support all chart types (bar, line, pie)

### Phase 4: Multi-Section Support
- ⏳ Market section charts
- ⏳ Project section Gantt charts
- ⏳ Analysis calculations

### Phase 5: Export Integration
- ⏳ Convert charts to images for PDF
- ⏳ Include in export

---

## Key Decisions

### 1. Table Initialization
**Decision:** Initialize tables automatically based on `template.category`
**Why:** Users can't create tables manually, so we must initialize them
**When:** On section load in Editor

### 2. Chart Generation
**Decision:** Auto-generate charts from table data
**Why:** Charts should always reflect current table data
**How:** Check if table exists → Generate chart → Display below table

### 3. Section-Specific UI
**Decision:** Use `SectionContentRenderer` to render appropriate UI
**Why:** Different sections need different tables/charts
**How:** Switch on `template.category`

### 4. Table Data Types
**Decision:** Support both `number` and `string` in Table.values
**Why:** Financial tables = numbers, Risk/Team tables = text
**Implementation:** `values: (number | string)[]`

---

## Next Steps

1. ✅ Fix TypeScript errors (DONE)
2. ✅ Create table initializer (DONE)
3. ✅ Create smart renderer (DONE)
4. ⏳ Update Editor to initialize tables on load
5. ⏳ Integrate SectionContentRenderer into Editor
6. ⏳ Test with real sections

**Ready to integrate!** 🎯

