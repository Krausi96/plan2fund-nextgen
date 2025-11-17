# Editor - Missing Features & What's Not Wired

## ✅ FIXED Issues

### 1. **Tables Can Now Be Added** ✅
**Status:** FIXED
- `InlineTableCreator` component is properly wired
- Button toggles `showInlineTableCreator` state correctly
- `onCreate` callback saves tables to section and localStorage
- Tables appear in `SectionContentRenderer` with charts
- Saved tables are loaded from localStorage on page refresh

**What Works Now:**
- Click "Add Table" → Table creator appears
- Select table type → Configure columns/rows → Create
- Table appears in section with auto-generated chart
- Tables persist across page refreshes

**Files Fixed:**
- `features/editor/components/Editor.tsx` - Added `loadPlanSections()` to merge saved data
- Tables now initialize if section needs them AND doesn't have saved tables

---

### 2. **Data for Analysis** ⚠️ PARTIALLY WORKING
**Status:** PARTIALLY FIXED
- `FinancialAnalysisInline` component exists and is wired
- It calculates: Break-even, Growth Rate, Gross Margin, Net Margin
- Tables are now auto-initialized for financial sections
- Saved table data is loaded from localStorage

**What Works:**
- Financial sections auto-initialize revenue/costs/cashflow tables
- User can fill in table data
- Analysis cards appear when tables have data
- Tables persist across page refreshes

**What Still Needs Work:**
- Analysis only shows if tables have non-zero data
- No guidance on what data to enter
- No validation that data makes sense

---

### 3. **Cannot Create Custom KPIs** ❌ STILL MISSING
**Problem:**
- KPIs are hardcoded in `FinancialAnalysisInline`
- Only shows: Break-even, Growth Rate, Gross Margin, Net Margin
- No way to create custom KPIs
- No KPI management UI

**What Should Work:**
- User should be able to define custom KPIs
- KPIs should be calculated from table data
- KPIs should be displayed prominently
- KPIs should be exportable

**What's Actually Happening:**
- Only 4 predefined KPIs exist
- No UI to add/edit KPIs
- KPIs are calculated but not customizable

**Files to Check:**
- `features/editor/components/SectionContentRenderer.tsx` - `FinancialAnalysisInline` (line 617)
- `features/editor/types/plan.ts` - Check if KPI structure exists

---

### 4. **Sections Are Not Related** ❌ STILL MISSING
**Problem:**
- We added cross-section reference detection (text mentions)
- BUT: No actual data relationships
- No data flow between sections

**What Should Work:**
- Financial Plan data → auto-populate Use of Funds
- Team section → appear in Consortium Partners
- Market data → used in Market Opportunity
- Executive Summary → pull key metrics from other sections

**What's Actually Happening:**
- Sections are completely isolated
- Each section saves independently
- No way to reference data from other sections
- Cross-section references only detect text mentions, not data

**Files to Check:**
- `features/editor/components/Editor.tsx` - `getCrossSectionReferences()` (line 333)
- `shared/user/storage/planStore.ts` - How sections are saved
- Need to add: Data relationship mapping

---

## ✅ FIXED

### 5. **Table Initialization** ✅
**Status:** FIXED
- `initializeTablesForSection()` exists and is called
- Tables are initialized based on section category
- Tables are loaded from localStorage if saved
- Tables appear in UI via `SectionContentRenderer`
- Tables can be edited and saved

**What Works:**
- Tables initialize on section load if needed
- Tables appear in UI when they exist
- Tables can be edited inline
- Tables persist across page refreshes

---

### 6. **Charts Auto-Generate** ✅
**Status:** WORKING
- Charts auto-generate from table data
- `DataChartInline` component exists and is wired
- Charts appear when tables exist
- Chart types can be changed (bar, line, pie, donut)
- Charts update when table data changes

**What Works:**
- Charts generate automatically from table data
- Chart types can be changed via UI buttons
- Charts update when table data changes
- Charts are saved with section data

---

## ✅ What Was Fixed

### Priority 1: Make Tables Work ✅ DONE
1. **Table creation flow:**
   - ✅ `showInlineTableCreator` toggles properly
   - ✅ `onCreate` callback saves tables correctly
   - ✅ Tables appear in `SectionContentRenderer`

2. **Table initialization:**
   - ✅ Tables initialize when section loads (if needed)
   - ✅ Tables are visible in UI
   - ✅ Tables can be edited inline

3. **Table saving:**
   - ✅ Tables are saved to localStorage
   - ✅ Tables are loaded on page refresh (via `loadPlanSections()`)
   - ✅ Table changes trigger auto-save

### Priority 2: Enable Data Analysis ⚠️ PARTIALLY DONE
1. **Make analysis visible:**
   - ✅ `FinancialAnalysisInline` is called
   - ✅ Analysis appears when tables have data
   - ⚠️ Still need: Guidance on what data to enter

2. **Add KPI management:** ❌ STILL TODO
   - ⏳ Create UI to add/edit custom KPIs
   - ⏳ Store KPIs in section data
   - ⏳ Display KPIs prominently

### Priority 3: Connect Sections ❌ STILL TODO
1. **Add data relationships:**
   - ⏳ Create mapping of section data dependencies
   - ⏳ Auto-populate related sections
   - ⏳ Add UI to show relationships

2. **Enable data flow:**
   - ⏳ Financial → Use of Funds
   - ⏳ Team → Consortium Partners
   - ⏳ Market → Market Opportunity

---

## 📋 Implementation Checklist

### Tables ✅ DONE
- [x] Verify `InlineTableCreator` is displayed when button clicked
- [x] Verify table creation saves to section
- [x] Verify tables appear in `SectionContentRenderer`
- [x] Verify tables can be edited
- [x] Verify tables save to localStorage
- [x] Verify tables load on page refresh
- [x] Added `loadPlanSections()` to merge saved data with templates
- [x] Added `onFieldChange` callback for TAM/SAM/SOM fields

### Analysis ⚠️ PARTIALLY DONE
- [x] Verify `FinancialAnalysisInline` is called
- [x] Verify analysis appears when tables have data
- [ ] Add guidance on entering data
- [ ] Add custom KPI creation UI
- [ ] Store KPIs in section data

### Section Relationships ❌ STILL TODO
- [ ] Add data relationship mapping
- [ ] Auto-populate related sections
- [ ] Add UI to show relationships
- [ ] Enable data flow between sections

---

## 🔍 Debugging Steps

1. **Check if tables are initialized:**
   ```javascript
   // In Editor.tsx, check if section.tables exists after loadSections()
   console.log('Section tables:', sections.map(s => ({ key: s.key, tables: s.tables })));
   ```

2. **Check if table creator shows:**
   ```javascript
   // Check if showInlineTableCreator state toggles
   console.log('Table creator visible:', showInlineTableCreator);
   ```

3. **Check if tables are saved:**
   ```javascript
   // Check localStorage after creating table
   const saved = localStorage.getItem('pf_plan_sections_...');
   console.log('Saved sections:', JSON.parse(saved));
   ```

4. **Check if analysis appears:**
   ```javascript
   // Check if FinancialAnalysisInline is rendered
   // Look for analysis cards in DOM
   ```

---

## 📝 Summary

### ✅ What's Fixed:
1. **Tables** - Can now be created, edited, saved, and loaded
2. **Fields (TAM/SAM/SOM)** - Now wired with `onFieldChange` callback
3. **Data Persistence** - Sections load from localStorage and merge with templates
4. **Charts** - Auto-generate from tables and can be customized

### ❌ What's Still Missing:
1. **Custom KPIs** - No UI to create custom KPIs
2. **Section Data Relationships** - No data flow between sections
3. **Data Guidance** - No help text on what data to enter

### 🔧 Key Changes Made:
- Added `loadPlanSections()` import and usage
- Added `onFieldChange` callback to `SectionContentRenderer`
- Merge saved sections with templates on load
- Initialize tables/fields only if not already saved

