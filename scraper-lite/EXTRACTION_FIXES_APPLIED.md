# Extraction Pattern Fixes Applied

## ✅ Fixes Implemented

### 1. Co-Financing Extraction Enhanced (was 1.5% coverage)
**Added patterns**:
- More keyword variations: `selbstbehalt`, `eigenleistung`, `eigenquote`, `matching funds`, `counterpart funding`
- Additional percentage extraction patterns:
  - "minimum X% eigen"
  - "financing ratio: X% eigen"
  - "funding covers X% of"
  - Context-aware percentage detection near co-financing keywords

**Expected improvement**: Should increase from 15 pages (1.5%) to 50-100+ pages (5-10%)

### 2. Timeline Extraction Enhanced (was 50.7% coverage)
**Added patterns**:
- More deadline keywords: `letzter termin`, `last date`, `bewerbungsschluss`
- More duration keywords: `projektlaufzeit`, `förderdauer`, `funding period`, `programmlaufzeit`
- Date range variations: `gültig ab`, `valid from`
- Month name patterns: "from January to March" style dates
- Enhanced duration patterns:
  - "between X and Y years"
  - "maximum X years"
  - "minimum X years"

**Expected improvement**: Should increase from 519 pages (50.7%) to 650-750 pages (63-73%)

### 3. TRL Level Extraction Enhanced (was 0.9% coverage)
**Added patterns**:
- More keyword variations: `tech readiness`, `tech readiness level`, `reifegradstufe`, `technology reifegrad`
- Additional extraction patterns:
  - "minimum TRL X"
  - "TRL X or Y"
  - "TRL X-Y"
  - "technology must have at least TRL X"

**Expected improvement**: Should increase from 9 pages (0.9%) to 30-50 pages (3-5%)

### 4. Market Size Extraction Enhanced (was 2.0% coverage)
**Added patterns**:
- More keyword variations: `marktvolumen`, `market volume`, `marktnachfrage`, `market demand`
- Additional patterns:
  - "target market" / "zielmarkt"
  - "addressable market" / "adressierbarer markt"
  - "TAM" (Total Addressable Market)
  - "market size" variations

**Expected improvement**: Should increase from 20 pages (2.0%) to 50-80 pages (5-8%)

### 5. Documents Extraction Enhanced (was 61.4% coverage)
**Expanded document keywords**:
- Added: `unternehmenskonzept`, `marktanalyse`, `konkurrenzanalyse`, `finanzierungsplan`
- Added: `cashflow`, `bilanzen`, `guv`, `p&l`, `rechnungslegung`
- Added: `steuerbescheid`, `handelsregisterauszug`, `gesellschaftsvertrag`
- Added: `patent`, `marke`, `zertifikat`, `akkreditierung`

**Expected improvement**: Should increase from 629 pages (61.4%) to 700-800 pages (68-78%)

### 6. Discovery Exploration Enhanced
**Improvements**:
- More lenient exploration: URLs with funding/program keywords are explored even if not detail pages
- This helps find detail pages that are deeper in the site structure
- Exploration depth extended to 4 levels for keyword matches

**Expected improvement**: Should discover 2-3x more URLs from seed pages

---

## 📊 URL Discovery Status

### Current State
- **Seen URLs**: 266 (all seed URLs from config)
- **Jobs Queued**: 0
- **Jobs Done**: 0

### Analysis
The 266 URLs in "seen" are all seed URLs from institution config. This means:
1. ✅ Seed URLs are loaded correctly
2. ❓ Discovery hasn't run yet OR
3. ❓ Discovery ran but found 0 new URLs (all were rejected by `isProgramDetailPage()`)

### Why No New URLs?
Possible reasons:
1. **Seed URLs are already program detail pages** - Discovery should still find links FROM those pages
2. **isProgramDetailPage() too strict** - Rejecting valid program URLs
3. **Links on seed pages don't match patterns** - Need to check if seed pages have discoverable links
4. **maxPages limit** - If set too low, discovery stops before exploring

### To Find New URLs
Run discovery with:
```bash
# Reset state to see fresh discovery (optional)
# node scraper-lite/scripts/manual/reset-state.js clean-jobs

# Run discovery with higher limits
LITE_MAX_DISCOVERY_PAGES=100 node scraper-lite/manual discover
```

---

## 🎯 Expected Impact

### Before Fixes
- co_financing: 16 items, 15 pages (1.5%)
- timeline: 3,027 items, 519 pages (50.7%)
- trl_level: 9 items, 9 pages (0.9%)
- market_size: 21 items, 20 pages (2.0%)
- documents: 1,529 items, 629 pages (61.4%)

### After Fixes (Expected)
- co_financing: 50-100+ items, 50-100+ pages (5-10%) ⬆️ +200-500%
- timeline: 3,500-4,000+ items, 650-750 pages (63-73%) ⬆️ +25-45%
- trl_level: 30-50 items, 30-50 pages (3-5%) ⬆️ +200-400%
- market_size: 50-80 items, 50-80 pages (5-8%) ⬆️ +150-300%
- documents: 1,700-1,900 items, 700-800 pages (68-78%) ⬆️ +11-27%

---

## ✅ Validation Steps

1. **TypeScript Compilation**: ✅ PASSED
2. **Pattern Syntax**: ✅ VERIFIED (no regex errors)
3. **Integration**: ✅ COMPLETE (patterns integrated into extraction flow)

---

## 🔄 Next Steps

1. **Run Fresh Discovery**: Test discovery with reset state or new seeds
2. **Rescrape Pages**: Rescrape existing pages to apply new extraction patterns
3. **Verify Improvements**: Run quality analysis to measure improvement
4. **Database Migration**: Add meaningfulness_score column to existing requirements

