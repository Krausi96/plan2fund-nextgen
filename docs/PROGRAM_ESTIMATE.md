# Program Count Estimation & Sustainability Analysis

## Current State (as of 2025-10-29)

- **Scraped Programs**: 59
- **Institutions Configured**: ~33 institutions
- **Regions Covered**: Austria, Germany, France, Spain, Italy, Netherlands, EU, International
- **Funding Types**: 14 types (grant, loan, equity, bank_loan, leasing, crowdfunding, subsidy, guarantee, incentive, investment, venture_capital, angel_investment, government_support, tax_incentive)

## Potential Program Estimates

### By Institution Type

#### Austrian Government Institutions (7 institutions)
- **Current**: ~19 programs (AWS: 13, FFG: 3, VBA: 1, WKO: 1, AMS: 2, others: 0)
- **Estimated Total**: 150-300 programs
  - **FFG**: 207 URLs discovered (mostly query filters) → Est. 50-100 actual programs
  - **WKO**: 158 URLs discovered → Est. 30-60 programs
  - **AWS**: 15 URLs → Est. 20-30 programs (already well-scraped)
  - **Others**: Est. 50-110 programs

#### Austrian Commercial Banks (3 institutions)
- **Current**: 24 programs (Bank Austria: 1, Erste: 4, Raiffeisen: 19)
- **Estimated Total**: 50-100 programs
  - Banks have many loan/financing products
  - Some discovered but not scraped yet

#### German Institutions (5 institutions)
- **Current**: ~5 programs (BMWK, KfW, Deutsche Bank, Commerzbank)
- **Estimated Total**: 200-400 programs
  - Germany has extensive funding ecosystem
  - BMWK alone likely has 50-100 programs
  - KfW has large program portfolio

#### French Institutions (1 institution)
- **Current**: ~3 programs (Bpifrance)
- **Estimated Total**: 50-150 programs
  - Bpifrance is major funding agency
  - Missing many regional programs

#### Spanish Institutions (2 institutions)
- **Current**: ~2 programs (CDTI, ENISA)
- **Estimated Total**: 50-100 programs

#### Italian Institutions (2 institutions)
- **Current**: ~2 programs (Invitalia, CDP)
- **Estimated Total**: 50-100 programs

#### Dutch Institutions (2 institutions)
- **Current**: ~2 programs (RVO, Invest-NL)
- **Estimated Total**: 30-80 programs

#### EU Institutions (4 institutions)
- **Current**: ~2 programs (Horizon Europe, ERDF, ESF, EIB, EIF)
- **Estimated Total**: 100-300 programs
  - Horizon Europe alone: 50-100 programs
  - ERDF/ESF: Regional programs across EU

#### International/Crowdfunding (2 institutions)
- **Current**: 0 programs
- **Estimated Total**: Limited (platforms, not individual programs)

### Total Potential Estimate

**Conservative Estimate**: 650-1,200 programs
**Realistic Estimate**: 850-1,500 programs
**Optimistic Estimate**: 1,200-2,000 programs

**Current Coverage**: 59 / ~1,000 = **~6% scraped**

## Discovery State Analysis

### High-Potential Institutions (Many Unscraped URLs)

1. **FFG (Austrian Research Promotion Agency)**
   - Known URLs: 207 (206 unscraped)
   - Many are query parameter filter pages
   - **Potential**: 50-100 programs

2. **WKO (Austrian Economic Chamber)**
   - Known URLs: 158 (156 unscraped)
   - **Potential**: 30-60 programs

3. **AMS (Arbeitsmarktservice)**
   - Known URLs: 76 (76 unscraped)
   - **Potential**: 20-40 programs

4. **Bank Austria**
   - Known URLs: 7 (7 unscraped)
   - **Potential**: 5-10 programs

### Under-Explored Institutions

Many institutions showing 0-3 programs but should have more:
- German institutions (BMWK, KfW): Expected 50-200 programs, currently ~5
- EU institutions: Expected 100-300 programs, currently ~2
- French/Bpifrance: Expected 50-150 programs, currently ~3
- Spanish/Italian: Expected 50-100 each, currently ~2 each

## Sustainability Analysis

### ✅ **Strengths**

1. **Auto-Discovery Works**: 
   - FFG: 1 → 207 URLs discovered
   - WKO: 1 → 158 URLs discovered
   - Proves the approach scales

2. **Incremental Mode Effective**:
   - Doesn't re-scrape known URLs
   - Only processes unscraped URLs
   - Fast cycles for new discoveries

3. **Query Parameter Support**:
   - Now enabled for filter pages
   - Should unlock many FFG programs

### ⚠️ **Concerns**

1. **Processing Speed**:
   - 59 programs currently
   - If 1,000 programs → ~17x current volume
   - Current cycle: ~7 minutes for ~10 institutions
   - Full run (33 institutions): Est. 20-30 minutes
   - **With 1,000 programs**: Could take 6-10 hours per full run

2. **Discovery Limits**:
   - Currently capped at 200 URLs per institution
   - FFG already near limit (207 URLs found)
   - May need to increase limit or process in batches

3. **Validation Overhead**:
   - Each URL validated before scraping (networkidle2 + 500ms wait)
   - 206 FFG URLs × 12.5 seconds = 43 minutes just for validation
   - Need optimization

4. **Data Quality**:
   - Some categories still low (co_financing: 0%, trl_level: 3%)
   - Need better extraction patterns

### 🔧 **Recommended Optimizations**

1. **Parallel Processing**: 
   - Process multiple institutions simultaneously
   - Could reduce full run from 30min → 5-10min

2. **Batch Validation**:
   - Validate URLs in batches of 10-20
   - Faster discovery phase

3. **Smarter Prioritization**:
   - Focus on high-potential institutions first
   - Skip institutions with low success rates

4. **Increase Discovery Limits**:
   - FFG already needs more than 200 URLs
   - Consider 500-1000 limit for large institutions

## Sustainability Verdict

### ✅ **YES, Approach is Sustainable** - With Optimizations

**Current Capacity**: 
- Can handle 200-300 programs easily
- 10-minute cycles work well

**At Scale (1000+ programs)**:
- Need parallel processing
- Need batch optimization
- Need smarter prioritization
- Estimated processing time: 1-3 hours for full refresh
- Incremental updates: 10-20 minutes

**Recommended Strategy**:
1. ✅ Keep incremental mode for regular updates
2. ✅ Process high-potential institutions first (FFG, WKO, AMS)
3. ✅ Implement parallel processing for speed
4. ✅ Increase discovery limits for large institutions
5. ✅ Run full deep scans monthly, incremental weekly

## Next Steps to Reach 500+ Programs

1. **Immediate** (This Week):
   - Enable query parameter URLs ✅ (DONE)
   - Process FFG's 206 unscraped URLs
   - Process WKO's 156 unscraped URLs
   - **Expected**: +50-100 programs → ~150 total

2. **Short-term** (This Month):
   - Add more seed URLs for under-explored institutions
   - Optimize link extraction for German/French institutions
   - Process AMS's 76 unscraped URLs
   - **Expected**: +100-200 programs → ~300 total

3. **Medium-term** (Next 2-3 Months):
   - Implement parallel processing
   - Expand to more institutions/regions
   - Enhance extraction for all categories
   - **Expected**: +200-400 programs → ~500-700 total

4. **Long-term** (6+ Months):
   - Cover all major European funding sources
   - Expand to more regions
   - Continuous incremental updates
   - **Expected**: 1000+ programs

