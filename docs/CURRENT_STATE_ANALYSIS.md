# Current State Analysis: Tables, Charts & Section Rendering

## TypeScript Status ✅
- **No compilation errors** - All components compile successfully

---

## Issues Identified

### 1. **FinancialChart Naming is Misleading** ❌

**Problem:**
- Component is named `FinancialChart` but it's actually **generic**
- Works with ANY `Table` data (financial, market, competitor, etc.)
- Name suggests it's only for financial data

**Current Usage:**
```typescript
// Used for financial data
<FinancialChart table={revenue} chartType="bar" />

// Also used for market data
<FinancialChart table={competitors} chartType="bar" />
```

**Solution:**
- Rename to `DataChart` or `TableChart` (generic name)
- Or keep `FinancialChart` but make it clear it's generic

---

### 2. **Table Initialization is Category-Based Only** ⚠️

**Current Implementation:**
```typescript
// tableInitializer.ts - Only checks category
if (category === 'financial') {
  return { revenue, costs, cashflow, useOfFunds };
}
```

**Problem:**
- Doesn't check `template.validationRules.formatRequirements`
- A section might need tables even if category doesn't match
- Not flexible for program-specific requirements

**Example:**
- A `general` category section might have `formatRequirements: ['financial_tables']`
- Current code won't initialize tables for it

**Solution:**
- Check BOTH `category` AND `formatRequirements`
- Make initialization more flexible

---

### 3. **Chart Type is Hardcoded** ⚠️

**Current Implementation:**
```typescript
// SectionContentRenderer.tsx - Hardcoded chart types
if (category === 'financial') {
  <FinancialChart chartType="bar" />  // Always bar
  <FinancialChart chartType="line" /> // Always line
}
```

**Problem:**
- Chart types are hardcoded per category
- Can't be customized per template/program
- No way to specify chart type in template

**Solution:**
- Add `chartType` to template or `formatRequirements`
- Or infer from table structure
- Make it configurable

---

### 4. **Section Adjustability** ✅ (Partially Working)

**How It Works:**
1. **Product Type** (strategy/review/submission):
   - Different master sections per product
   - `getSections(fundingType, productType, programId)`
   - ✅ **Working**

2. **Program-Specific Overrides**:
   - Program templates merge with master
   - Only for `submission` product
   - ✅ **Working**

3. **Category-Based Rendering**:
   - `SectionContentRenderer` checks `template.category`
   - Renders appropriate UI
   - ✅ **Working**

4. **Format Requirements**:
   - `template.validationRules.formatRequirements` can specify needs
   - ⚠️ **Partially used** (only in `sectionNeedsTables`, not in initialization)

---

## What's Missing According to MD

### Phase 3: Chart Generation ⏳
- ✅ Bar charts - **DONE**
- ✅ Line charts - **DONE**
- ⏳ Pie charts - **MISSING**
- ⏳ Donut charts - **MISSING** (mentioned in `FigureRef` type)

### Phase 4: Multi-Section Support ⏳
- ✅ Market section charts - **DONE** (uses FinancialChart)
- ⏳ Project section Gantt charts - **MISSING**
- ⏳ Analysis calculations (break-even, growth rates) - **MISSING**

### Phase 5: Export Integration ⏳
- ⏳ Convert charts to images for PDF - **MISSING** (user said wait)

---

## Recommendations

### 1. Rename FinancialChart → DataChart
**Why:** More accurate, reflects generic nature
**Impact:** Low (just rename + update imports)

### 2. Enhance Table Initialization
**Why:** More flexible, respects `formatRequirements`
**How:**
```typescript
// Check formatRequirements first, then category
if (template.validationRules?.formatRequirements?.includes('financial_tables')) {
  return { revenue, costs, cashflow };
}
// Fallback to category
if (category === 'financial') {
  return { revenue, costs, cashflow };
}
```

### 3. Make Chart Types Configurable
**Why:** Different programs might want different chart types
**How:**
- Option A: Add to `formatRequirements` (e.g., `'bar_chart'`, `'line_chart'`)
- Option B: Add `chartType` field to template
- Option C: Infer from table structure (numeric = bar/line, categorical = pie)

### 4. Add Pie/Donut Chart Support
**Why:** Required for "Use of Funds" and other categorical data
**How:** Extend `DataChart` to support `chartType: 'pie' | 'donut'`

---

## Current Architecture

```
Editor.tsx
  ├─ Loads sections via getSections(fundingType, product, programId)
  ├─ Initializes tables via initializeTablesForSection(template)
  │  └─ Checks: category (hardcoded) + formatRequirements (partial)
  └─ Renders via SectionContentRenderer
      ├─ Checks: template.category
      ├─ Renders: Tables + Charts based on category
      └─ Uses: FinancialChart (generic, but named financial)
```

**Flexibility:**
- ✅ Adjusts for different products (strategy/review/submission)
- ✅ Adjusts for different programs (via overrides)
- ⚠️ Partially adjusts for formatRequirements
- ❌ Chart types not configurable
- ❌ Table initialization not fully flexible

---

## Next Steps (Priority Order)

1. **Rename FinancialChart → DataChart** (Quick win, better naming)
2. **Enhance table initialization** (Check formatRequirements first)
3. **Add pie/donut chart support** (Complete Phase 3)
4. **Make chart types configurable** (More flexibility)
5. **Add Gantt chart for project sections** (Phase 4)
6. **Add analysis calculations** (Phase 4)

**Export integration can wait** (as user requested)

