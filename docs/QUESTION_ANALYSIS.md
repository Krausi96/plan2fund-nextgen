# How Many Questions Should SmartWizard Ask?

## What Scraper Extracts (from webScraperService.ts lines 638-709):

1. **Location** (Austria/EU/International) ✓
2. **Team size** (min_team_size) ✓  
3. **Company age** (max_company_age) ✓
4. **Revenue** (revenue_min, revenue_max) ✓
5. **Research focus** (true/false) ✓
6. **International collaboration** (true/false) ✓
7. **Funding type** (grant/loan/equity) - extracted but not mapped to question
8. **Project type** (innovation/environment/health) - extracted but not mapped

**Total extractable criteria: 8**

## What Questions Engine Generates:

**Core Questions (6-8):**
1. Location ✓
2. Company age ✓
3. Revenue ✓
4. Team size ✓
5. Research focus ✓
6. International collaboration ✓
7. Industry focus ✓ (derived from industry_focus analysis)
8. Potentially: Project type

**Fallback Questions (3-5):**
- Business stage
- Funding need
- Innovation level
- Team experience
- Market focus

**Total: 6-13 questions possible**

## Dynamic Stopping Logic:

```typescript
// Line 639-641 in questionEngine.ts
if (this.remainingPrograms.length <= 10 && Object.keys(answers).length >= 5) {
  return null; // Stop early
}
```

**Stops when:**
- ≤10 programs remain **AND**
- At least 5 questions answered

## Answer: Expected Range

**Minimum: 5 questions** (if programs are very similar)
**Maximum: 10-15 questions** (if programs vary widely)
**Typical: 7-9 questions**

The system dynamically adapts based on program diversity.

