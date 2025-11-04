# 🔍 Database Data Verification & Component Integration

**Date:** 2025-11-02  
**Status:** In Progress

---

## ✅ Database Connection Status

**Connection:** ✅ Working
- **Pages:** 1,024
- **Requirements:** 21,220
- **Average Requirements per Page:** ~21

---

## 🔄 Current Data Flow Issues

### Problem: API Not Using Database

The `/api/programs` endpoint is currently using **JSON fallback** instead of the database:

```typescript
// Current: Uses JSON file
const dataPath = path.join(process.cwd(), 'scraper-lite', 'data', 'legacy', 'scraped-programs-latest.json');
```

**Should be:**
```typescript
// Should use: Database
import { getAllPages, searchPages } from '@/scraper/db/page-repository';
const pages = await getAllPages();
```

---

## 📊 Component Data Requirements

### 1. SmartWizard & QuestionEngine

**What they need:**
- All programs with `categorized_requirements`
- For question generation and filtering

**Current source:** `/api/programs?enhanced=true` (JSON)
**Should use:** Database `pages` + `requirements` tables

**Data transformation needed:**
```typescript
// Transform database rows to program format
const programs = pages.map(page => ({
  id: page.id,
  name: page.title,
  type: page.funding_types[0] || 'grant',
  categorized_requirements: transformRequirementsToCategorized(page.id, requirements),
  // ... other fields
}));
```

### 2. RequirementsChecker (Editor)

**What it needs:**
- Program `categorized_requirements` (18 categories)
- For compliance checking

**Current source:** `/api/programmes/[id]/requirements` (may use database)
**Status:** ✅ Likely working (needs verification)

### 3. AdvancedSearch

**What it needs:**
- All programs with metadata
- For filtering and search

**Current source:** `/api/programs?enhanced=true` (JSON)
**Should use:** Database with search capabilities

### 4. Library Component

**What it needs:**
- Program metadata for browsing
- Title, description, funding amounts

**Current source:** `/api/programs` (JSON)
**Should use:** Database `pages` table

### 5. EnhancedAIChat

**What it needs:**
- Program requirements for AI context
- Categorized requirements for guidance

**Current source:** Unknown (needs investigation)
**Should use:** Database `requirements` table

### 6. Pricing

**What it needs:**
- Program requirements for document specs
- Currently uses static data from `basisPack.ts`

**Status:** May not need database data (uses static pricing)

---

## 🔧 Required Fixes

### Fix 1: Update `/api/programs` to Use Database

```typescript
// pages/api/programs.ts
import { getAllPages, searchPages } from '@/scraper/db/page-repository';
import { queryWithRetry } from '@/scraper/db/neon-client';

async function getProgramsFromDatabase() {
  // Get all pages
  const pages = await getAllPages(1000);
  
  // Get requirements for all pages
  const pageIds = pages.map(p => p.id);
  const requirements = await queryWithRetry(
    `SELECT * FROM requirements WHERE page_id = ANY($1)`,
    [pageIds]
  );
  
  // Transform to program format
  return pages.map(page => {
    const pageReqs = requirements.filter(r => r.page_id === page.id);
    const categorized = groupRequirementsByCategory(pageReqs);
    
    return {
      id: page.id,
      name: page.title,
      description: page.description,
      url: page.url,
      funding_amount_min: page.funding_amount_min,
      funding_amount_max: page.funding_amount_max,
      currency: page.currency,
      deadline: page.deadline,
      categorized_requirements: categorized,
      // ... other fields
    };
  });
}
```

### Fix 2: Verify Requirements Structure

Check that requirements are properly categorized:

```sql
SELECT 
  category,
  COUNT(*) as count,
  COUNT(DISTINCT page_id) as pages
FROM requirements
GROUP BY category
ORDER BY count DESC;
```

Expected categories:
1. eligibility
2. financial
3. documents
4. technical
5. legal
6. timeline
7. geographic
8. team
9. project
10. compliance
11. impact
12. capex_opex
13. use_of_funds
14. revenue_model
15. market_size
16. co_financing
17. trl_level
18. consortium

### Fix 3: Transform Requirements to Categorized Format

```typescript
function groupRequirementsByCategory(requirements: DbRequirement[]): Record<string, any[]> {
  const categorized: Record<string, any[]> = {
    eligibility: [], documents: [], financial: [], technical: [], legal: [],
    timeline: [], geographic: [], team: [], project: [], compliance: [],
    impact: [], capex_opex: [], use_of_funds: [], revenue_model: [],
    market_size: [], co_financing: [], trl_level: [], consortium: []
  };
  
  for (const req of requirements) {
    const category = req.category as keyof typeof categorized;
    if (categorized[category]) {
      categorized[category].push({
        type: req.type,
        value: req.value,
        required: req.required,
        source: req.source,
        description: req.description,
        format: req.format
      });
    }
  }
  
  return categorized;
}
```

---

## 🧪 Verification Scripts

### Script 1: Check Database Data Quality

```bash
node scripts/verify-database-quality.js
```

**Checks:**
- [ ] All 18 requirement categories present
- [ ] Pages have requirements linked
- [ ] Metadata fields populated
- [ ] No orphaned requirements

### Script 2: Test API Endpoints

```bash
# Test programs API
curl http://localhost:3000/api/programs?enhanced=true

# Test program requirements API
curl http://localhost:3000/api/programmes/1/requirements
```

**Expected:**
- Returns database data (not JSON)
- Includes `categorized_requirements`
- Has all required fields

### Script 3: Test Component Data Flow

**Test SmartWizard:**
1. Load `/reco` page
2. Check console for "Fetching program data from API"
3. Verify programs loaded with requirements

**Test RequirementsChecker:**
1. Load `/editor` with program selected
2. Verify requirements checker shows compliance status
3. Check requirements are displayed correctly

---

## 📈 Data Quality Metrics

### Current Metrics (from test connection)

| Metric | Value |
|--------|-------|
| Total Pages | 1,024 |
| Total Requirements | 21,220 |
| Avg Requirements/Page | ~21 |
| Pages with Requirements | ? (needs query) |
| Pages with All 18 Categories | ? (needs query) |

### Target Metrics

| Metric | Target |
|--------|--------|
| Pages with Requirements | > 95% |
| Pages with Eligibility | > 80% |
| Pages with Financial | > 70% |
| Pages with Documents | > 60% |
| Pages with All Critical Categories | > 50% |

**Critical Categories:**
- eligibility
- financial
- documents
- project
- timeline

---

## 🚀 Implementation Plan

### Phase 1: Database API Integration ✅

- [x] Verify database connection
- [x] Check data exists (1,024 pages, 21,220 requirements)
- [ ] Update `/api/programs` to use database
- [ ] Add requirement grouping function
- [ ] Test API response format

### Phase 2: Component Verification

- [ ] Test SmartWizard with database data
- [ ] Test RequirementsChecker with database data
- [ ] Test AdvancedSearch with database data
- [ ] Test Library component with database data
- [ ] Test EnhancedAIChat with database data

### Phase 3: Data Quality Improvement

- [ ] Analyze requirement distribution
- [ ] Identify missing categories
- [ ] Improve extraction quality
- [ ] Add missing requirements via re-scraping

### Phase 4: Performance Optimization

- [ ] Add caching for API responses
- [ ] Optimize database queries
- [ ] Add indexes if needed
- [ ] Monitor query performance

---

## 📝 Next Steps

1. **Update `/api/programs` to use database** (highest priority)
2. **Create requirement grouping function**
3. **Test each component with database data**
4. **Verify data quality and completeness**
5. **Document any missing data or issues**

---

**Status:** Ready to implement database integration

