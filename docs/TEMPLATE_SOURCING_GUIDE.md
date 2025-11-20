# Template Sourcing Guide - Where to Get Templates

## Quick Answer: Where Should I Get Templates From?

### 1. **Primary Source: European Commission Business Plan Guidance**
**URL**: https://ec.europa.eu/programmes/erasmus-plus/project-result-content/5af53e70-0806-4f6b-98c8-084e7f2b7d72/Business_Plan.pdf

**What to Extract:**
- Standard business plan sections structure
- Section descriptions and requirements
- Best practices for each section

**Sections to Implement:**
1. Executive Summary
2. Business Model
3. Management & Organisation
4. Marketing Plan
5. Financials
6. Appendix

---

### 2. **EIC Accelerator Guidelines (For EU Grants)**
**URL**: https://eic.ec.europa.eu/tips-applicants-eic-accelerator_en

**What to Extract:**
- Evaluation criteria: **Excellence, Impact, Implementation**
- How to structure sections to meet these criteria
- Tips for each evaluation dimension

**Mapping to Your Templates:**
- **Excellence** → Innovation & Technology section
- **Impact** → Impact Assessment, Market Analysis sections
- **Implementation** → Team & Qualifications, Timeline & Milestones, Risk Assessment sections

---

### 3. **Austrian WKO Business Plan Guide**
**URL**: https://www.wko.at/gruendung/inhalte-businessplan

**What to Extract:**
- Austrian-specific business plan requirements
- Section structures used in Austria
- Local best practices

---

### 4. **Competitor Analysis: LivePlan**
**URL**: https://www.liveplan.com/blog/funding/slides-you-need

**What to Study:**
- Their business plan template structure
- Financial forecasting templates
- AI assistant features
- Pricing model (freemium approach)

---

### 5. **Pitch Deck Structure: Visible.vc**
**URL**: https://visible.vc/blog/required-slides-in-a-pitch-deck/

**10-Slide Structure to Implement:**
1. Title Slide
2. Problem
3. Solution
4. Market Opportunity
5. Product
6. Business Model
7. Traction
8. Competition
9. Team
10. Financials/Ask

---

## What Needs to Change in Editor & Templates

### Current State Issues:
1. ❌ Templates are hardcoded in `templates.ts` - no program-specific customization
2. ❌ Requirements checker only checks word counts, not substantive criteria
3. ❌ No evaluation against program criteria (Excellence, Impact, Implementation)
4. ❌ No content heuristics (quantitative data, customer identification, value proposition)

### Required Changes:

#### 1. **Template Configuration System (No Database)**
Instead of database, use JSON files:

**Create**: `data/program-configs/ffg_basis.json`
```json
{
  "programId": "ffg_basis",
  "requiredSections": ["executive_summary", "project_description", "innovation_technology"],
  "wordCountOverrides": {
    "executive_summary": { "min": 300, "max": 500 }
  },
  "evaluationCriteria": {
    "excellence": {
      "sections": ["innovation_technology"],
      "requiredElements": ["novelty", "state_of_the_art"]
    }
  }
}
```

**Update**: `features/editor/templates.ts`
- Add function to load JSON configs
- Merge master template with program config at runtime
- Apply word count overrides
- Mark sections as required/optional based on config

#### 2. **Enhanced Requirements Checker**
**Create**: `features/editor/utils/requirementsChecker.ts`

**New Checks:**
- ✅ Word counts (already exists)
- ✅ Content heuristics:
  - Quantitative market data (numbers, percentages)
  - Customer identification
  - Value proposition clarity
  - Revenue model explanation
- ✅ Evaluation criteria:
  - Excellence (novelty, innovation)
  - Impact (market size, user pain points, societal impact)
  - Implementation (team competence, work plan, risk mitigation)

**Update**: `features/editor/components/RequirementsModal.tsx`
- Use new requirements checker
- Show actionable summaries with links to sections
- Group issues by severity (critical, important, nice-to-have)

#### 3. **Template Structure Updates**
Based on EU guidelines, ensure these sections exist:

**Master Template Sections:**
- Executive Summary
- Business Model & Value Proposition
- Management & Organisation (Team & Qualifications)
- Marketing Plan (Market Analysis, Go-to-Market)
- Financials (Financial Plan, Preliminary Financial Overview)
- Appendix

**Additional Documents:**
- Pitch Deck (10 slides)
- Financial Models (Sales Forecast, P&L, Cash Flow, Balance Sheet)
- Application Forms

---

## Implementation Priority

### Phase 1: Template Configuration (Week 1)
1. Create `data/program-configs/` directory
2. Create first config file: `ffg_basis.json`
3. Update `templates.ts` to load and merge configs
4. Test with existing programs

### Phase 2: Requirements Checker (Week 2)
1. Create `requirementsChecker.ts`
2. Implement content heuristics
3. Implement evaluation criteria checks
4. Update RequirementsModal

### Phase 3: Template Sourcing (Week 3)
1. Download EU business plan PDF
2. Extract section structures
3. Update master templates
4. Add source citations

### Phase 4: Additional Documents (Week 4)
1. Create pitch deck template
2. Create financial model templates
3. Implement auto-population
4. Add export (PPTX, XLSX)

---

## Key Files to Modify

1. **`features/editor/templates.ts`**
   - Add `loadProgramConfig()` function
   - Add `applyProgramConfig()` function
   - Update `getSections()` to merge configs

2. **`features/editor/utils/requirementsChecker.ts`** (NEW)
   - Content heuristics
   - Evaluation criteria checks
   - Requirements report generation

3. **`features/editor/components/RequirementsModal.tsx`**
   - Use new requirements checker
   - Display actionable summaries

4. **`data/program-configs/*.json`** (NEW)
   - Program-specific configurations
   - Evaluation criteria mappings

---

## Summary

**Where to get templates:**
1. EU Business Plan PDF (primary source)
2. EIC Accelerator guidelines (evaluation criteria)
3. Austrian WKO guide (local requirements)
4. Competitor analysis (LivePlan, Visible.vc)

**What needs to change:**
1. Add JSON-based program configs (no database needed)
2. Enhance requirements checker with content heuristics
3. Map evaluation criteria (Excellence, Impact, Implementation) to sections
4. Update templates to align with official sources

**No database needed** - use JSON files in `data/program-configs/` directory.

