# Next Steps: Recommended Actions

## ✅ CURRENT STATUS (Just Analyzed)

**Scraped Programs**: 80
**Unscraped URLs Ready**: 394 detail pages (100% scrapable)

**Data Quality Issues Found**:
- ❌ **Funding Amounts**: 0% extracted (CRITICAL - needs fix)
- ❌ **Deadlines**: 18.8% extracted (needs improvement)
- ⚠️ **Financial category**: 17.5% (needs improvement)
- ✅ **Eligibility**: 87.5% (good)
- ✅ **Geographic**: 85% (good)

---

## Immediate Priority (Next 1-2 Hours)

### 1. 🔧 **FIX Funding Amount Extraction** (CRITICAL)
**Why**: 0% of programs have funding amounts - this is a key requirement

**Action**: 
- Review `extractFundingAmounts()` in `webScraperService.ts`
- Test on sample URLs to see why amounts aren't being found
- Improve selectors/patterns for amount detection

**Impact**: High - funding amounts are critical data

---

### 2. Complete Scraper Run & Verify Results
**Why**: Need to see if scraper is actually extracting good data from the 394 detail pages

**Action**:
```bash
node scripts/run-scraper-direct.js cycle incremental
```

**Check**:
- How many programs were scraped successfully?
- Quality of extracted data (18 categories filled?)
- Any errors or issues?

**Expected**: Should scrape 15 URLs per institution = ~480 URLs total (some will be skipped if already scraped <24h)

---

### 2. Analyze Scraped Data Quality
**Why**: Verify the extracted data is usable and complete

**Action**: Review `data/scraped-programs-latest.json`
- Check if 18 requirement categories are being extracted
- Verify funding amounts, deadlines, contacts are captured
- See if any institutions have lower success rates

**Tool to create**: `scripts/analyze-scraped-data.js` - quick quality check

---

### 3. Run More Discovery Cycles (If Needed)
**Why**: Current 394 scrapable pages. Target is 2500.

**Action**:
```bash
# Run discovery with deeper exploration
node scripts/run-discovery-only.js deep
```

**Expected**: Should find many more programs (deep mode explores more aggressively)

---

## Short-term (This Week)

### 4. Fix Broken Institutions
**Why**: Some institutions had errors (ERR_NAME_NOT_RESOLVED for BMDW)

**Action**:
- Check `institutionConfig.ts` for outdated URLs
- Update seed URLs that don't resolve
- Add error handling for DNS failures

---

### 5. Improve Data Extraction
**Why**: Ensure all 18 categories are being extracted properly

**Action**:
- Review extraction logic in `webScraperService.ts`
- Test extraction on sample URLs
- Add fallback selectors if data missing

---

### 6. Scale to 2500 Programs
**Why**: Target goal

**Strategy**:
1. Run multiple discovery cycles (deep mode) to find all programs
2. Run scraper in full mode (50 URLs/institution) instead of cycle mode
3. Monitor progress: Track discovery vs scraping completion

**Estimated time**: 
- Discovery: 2-3 hours to find all 2500 URLs
- Scraping: 5-6 cycles × 10 min = 50-60 minutes

---

## Medium-term (Next 2 Weeks)

### 7. Move to Database (When >1000 Programs)
**Why**: JSON files get unwieldy at scale

**Action**:
- Set up SQLite or PostgreSQL
- Migrate discovery-state.json → database
- Migrate scraped-programs-latest.json → database tables
- Update scripts to use database

**Benefit**: Faster queries, better indexing, easier updates

---

### 8. Add Monitoring & Alerting
**Why**: Track system health at scale

**Action**:
- Track success rates per institution
- Alert on high error rates
- Track discovery vs scraping gaps
- Dashboard showing progress

---

### 9. Optimize Performance
**Why**: Faster cycles = more programs per hour

**Action**:
- Parallel scraping (currently sequential)
- Cache page content hashes (skip unchanged pages)
- Rate limiting to avoid bans
- Better error retry logic

---

## Recommended Order

1. **Now**: Complete scraper run, verify data quality
2. **Today**: Fix broken institutions, improve extraction if needed
3. **This Week**: Run deep discovery to find ~2500 URLs
4. **This Week**: Scale scraping (full mode, multiple cycles)
5. **Next Week**: Move to database if reaching >1000 programs
6. **Ongoing**: Monitor, optimize, iterate

---

## Quick Wins (Can Do Now)

- ✅ Discovery is working (100% scrapable)
- ⏳ Complete scraper run
- 🔧 Fix BMDW URLs (ERR_NAME_NOT_RESOLVED)
- 📊 Create quality check script

---

## Decision Points

**Should you move to database now?**
- ❌ No - JSON works fine for <1000 programs
- ✅ Yes - When you pass 1000 programs or need better queries

**Should you parallelize scraping?**
- ❌ Not urgent - Current speed is acceptable
- ✅ Consider when scraping 2500+ (could 3-4x faster)

**Should you run deep discovery now?**
- ✅ Yes - If you want to find all ~2500 URLs quickly
- ⏳ Or incrementally - Keep running incremental discovery weekly

