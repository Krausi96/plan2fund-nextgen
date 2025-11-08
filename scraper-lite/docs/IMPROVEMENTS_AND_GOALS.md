# Scraper Improvements & Goals

Based on test analysis, here are the key improvements needed and goals to achieve.

---

## 🎯 Current Approach Assessment

### ✅ What's Working Well:
1. **LLM-First Architecture**: Using LLM for extraction (more reliable than patterns)
2. **Database Integration**: Proper storage in `pages` and `requirements` tables
3. **Categorized Requirements**: Structure supports recommendation system
4. **Pattern Learning**: Framework exists for learning patterns
5. **Smart Discovery**: Checks database to avoid duplicates

### ⚠️ What Needs Improvement:
1. **LLM Extraction Rate**: Only 6.4% (7/110) - needs to be 80%+
2. **Category Coverage**: Only 17 categories - need 20+
3. **Program Coverage**: Only 4 programs - need 50+
4. **URL Categorization**: Funding types and program focus not always extracted
5. **Pattern Learning**: Not actively used yet

---

## 🔍 URL Discovery Improvements

### Goal 1: Blacklisting/Skipping Effectiveness
**Current Issue**: Need to verify no duplicates are scraped

**Improvements**:
1. ✅ **Already implemented**: Database check before scraping
2. ✅ **Already implemented**: `seen_urls` table tracks discovered URLs
3. **Enhancement**: Add URL normalization (remove trailing slashes, query params for comparison)
4. **Enhancement**: Add URL hash check for faster duplicate detection

**Test**: Run `test:analyze-discovery` and check for duplicate URLs

### Goal 2: Finding New Viable URLs
**Current Issue**: Discovery might find same URLs repeatedly

**Improvements**:
1. ✅ **Already implemented**: Batch check against database
2. ✅ **Already implemented**: Smart filtering (funding keywords, exclude non-program pages)
3. **Enhancement**: Re-check overview pages every 7 days (already implemented)
4. **Enhancement**: Use learned URL patterns to find similar URLs
5. **Enhancement**: Track discovery sources to find new institutions

**Test**: Check `discovered` count in batch results - should be 80%+ new URLs

### Goal 3: Categorizing Funding Types
**Current Issue**: Funding types not always extracted correctly

**Improvements**:
1. **Enhancement**: Improve LLM prompt to explicitly extract funding types
2. **Enhancement**: Use URL patterns to infer funding type (`/grant/`, `/loan/`, `/equity/`)
3. **Enhancement**: Use institution config to set default funding types
4. **Enhancement**: Extract from page content (keywords: "grant", "loan", "equity")

**Test**: Check `with_funding_types` - should be 90%+

### Goal 4: Categorizing Program Focus
**Current Issue**: Program focus not always extracted

**Improvements**:
1. **Enhancement**: Improve LLM prompt to extract program focus areas
2. **Enhancement**: Extract from page content (keywords: "technology", "startups", "research")
3. **Enhancement**: Use tags/metadata from page
4. **Enhancement**: Infer from URL structure

**Test**: Check `with_program_focus` - should be 80%+

---

## 🔗 URL Type Parsing Improvements

### Goal 1: Overview Page Detection
**Current Status**: ✅ Implemented (`isOverviewPage` function)

**Improvements**:
1. ✅ **Already implemented**: Detects overview pages by URL patterns and HTML structure
2. ✅ **Already implemented**: Marks overview pages in database
3. ✅ **Already implemented**: Re-checks overview pages every 7 days
4. **Enhancement**: Improve detection accuracy (currently good, but can be better)

**Test**: Check `metadata_json->>'is_overview_page'` - should be accurate

### Goal 2: Program Detail Page Detection
**Current Status**: ✅ Implemented (`isProgramDetailPage` function)

**Improvements**:
1. ✅ **Already implemented**: Detects detail pages
2. **Enhancement**: Ensure all detail pages have requirements extracted
3. **Enhancement**: Skip non-program pages more aggressively

**Test**: Check pages with requirements - should be 90%+ of detail pages

### Goal 3: URL Pattern Learning
**Current Status**: ⚠️ Framework exists but not actively used

**Improvements**:
1. ✅ **Already implemented**: `learnUrlPatternFromPage` function
2. **Enhancement**: Use learned patterns in discovery
3. **Enhancement**: Improve pattern confidence calculation
4. **Enhancement**: Track pattern success rate

**Test**: Check `url_patterns` table - should have patterns after scraping

---

## 📋 Requirements Extraction Improvements

### Goal 1: Completeness (Requirements per Page)
**Current Issue**: Avg requirements might be low

**Improvements**:
1. **Enhancement**: Improve LLM prompt to extract ALL requirements
2. **Enhancement**: Extract from multiple sections (eligibility, application, documents)
3. **Enhancement**: Use structured extraction (tables, lists, headings)
4. **Enhancement**: Extract nested requirements

**Test**: Check avg requirements per page - should be 10+

### Goal 2: Meaningfulness (Confidence Scores)
**Current Status**: ✅ Confidence scores exist

**Improvements**:
1. ✅ **Already implemented**: LLM provides confidence scores
2. **Enhancement**: Improve confidence calculation (currently good)
3. **Enhancement**: Filter out low-confidence requirements (<0.3)
4. **Enhancement**: Boost confidence for high-quality extractions

**Test**: Check confidence distribution - should be 70%+ high confidence

### Goal 3: Category Coverage
**Current Issue**: Only 17 categories, need 20+

**Improvements**:
1. **Enhancement**: Update LLM prompt to extract all 35+ categories
2. **Enhancement**: Add category-specific extraction logic
3. **Priority categories**:
   - `eligibility` (REQUIRED)
   - `financial` (REQUIRED)
   - `geographic` (REQUIRED)
   - `team` (IMPORTANT)
   - `timeline` (IMPORTANT)
   - `documents` (IMPORTANT)
   - `application` (IMPORTANT)
   - `use_of_funds` (IMPORTANT)
   - `technology_area` (IMPORTANT)
   - `innovation_focus` (IMPORTANT)
   - `company_stage` (IMPORTANT)
   - `company_type` (IMPORTANT)
   - `sector_focus` (IMPORTANT)
   - `repayment_terms` (IMPORTANT)
   - `collateral` (IMPORTANT)
   - `co_financing` (IMPORTANT)
   - `market_size` (IMPORTANT)
   - `trl_level` (IMPORTANT)
   - `consortium` (IMPORTANT)
   - `impact` (IMPORTANT)

**Test**: Check unique categories - should be 20+

### Goal 4: LLM vs Pattern Extraction
**Current Issue**: Only 6.4% LLM extraction (need 80%+)

**Improvements**:
1. ✅ **Already implemented**: LLM-First approach (`LLM_ONLY = true`)
2. **Enhancement**: Remove pattern fallback (currently LLM-only)
3. **Enhancement**: Improve LLM error handling (retry logic exists)
4. **Enhancement**: Use cache to avoid re-extraction
5. **Enhancement**: Batch LLM calls for efficiency

**Test**: Check LLM extraction rate - should be 80%+

---

## 🧠 Pattern Learning Improvements

### Goal 1: Extraction Pattern Learning
**Current Status**: ⚠️ Framework exists but not actively used

**Improvements**:
1. ✅ **Already implemented**: `extraction_patterns` table exists
2. **Enhancement**: Actively learn patterns from successful extractions
3. **Enhancement**: Use patterns to improve future extractions
4. **Enhancement**: Track pattern success rate

**Test**: Check `extraction_patterns` table - should have patterns after scraping

### Goal 2: URL Pattern Learning
**Current Status**: ✅ Implemented (`learnUrlPatternFromPage`)

**Improvements**:
1. ✅ **Already implemented**: Learns URL patterns
2. **Enhancement**: Use patterns in discovery
3. **Enhancement**: Improve pattern matching
4. **Enhancement**: Track pattern usage and success

**Test**: Check `url_patterns` table - should have patterns

### Goal 3: Pattern Success Rate
**Current Status**: ⚠️ Not tracked yet

**Improvements**:
1. **Enhancement**: Track pattern usage
2. **Enhancement**: Calculate success rate
3. **Enhancement**: Remove low-success patterns
4. **Enhancement**: Boost high-success patterns

**Test**: Check `success_rate` - should be 60%+

---

## 🔗 Reco Integration Improvements

### Goal 1: Data Structure for Reco
**Current Status**: ✅ Structure is correct

**Improvements**:
1. ✅ **Already implemented**: `categorized_requirements` structure
2. ✅ **Already implemented**: Database integration
3. ✅ **Already implemented**: API endpoint (`/api/programs`)
4. **Enhancement**: Ensure all programs have required fields

**Test**: Check `test:reco-integration` - should pass

### Goal 2: LLM Requirements for Reco
**Current Issue**: Only 6.4% LLM extraction

**Improvements**:
1. **Same as Requirements Goal 4**: Increase LLM extraction to 80%+
2. **Enhancement**: Prioritize LLM extraction for reco-critical categories
3. **Enhancement**: Ensure all priority categories have LLM requirements

**Test**: Check LLM requirements - should be 80%+

### Goal 3: Category Coverage for Reco
**Current Issue**: Need all priority categories

**Improvements**:
1. **Same as Requirements Goal 3**: Extract all priority categories
2. **Enhancement**: Ensure `eligibility`, `financial`, `geographic` are always extracted
3. **Enhancement**: Extract `team`, `timeline`, `documents`, `application`

**Test**: Check category coverage - should have all priority categories

---

## 📊 Priority Improvements

### High Priority (Do First):
1. **Increase LLM Extraction Rate** (6.4% → 80%+)
   - Remove pattern fallback
   - Improve LLM error handling
   - Use cache effectively

2. **Extract All Priority Categories** (17 → 20+)
   - Update LLM prompt
   - Add category-specific logic

3. **Extract Funding Types** (current: unknown)
   - Improve LLM prompt
   - Use URL patterns
   - Use institution config

### Medium Priority (Do Next):
4. **Increase Program Coverage** (4 → 50+)
   - Run more batches
   - Improve discovery

5. **Extract Program Focus** (current: unknown)
   - Improve LLM prompt
   - Extract from content

6. **Pattern Learning** (framework exists, not used)
   - Activate pattern learning
   - Use patterns in discovery

### Low Priority (Do Later):
7. **Enhanced Fields** (target_personas, tags, etc.)
   - Extract with LLM
   - Use for better matching

8. **Advanced Features** (embeddings, semantic search)
   - Add vector embeddings
   - Enable semantic search

---

## ✅ Success Criteria

### Overall Success:
- ✅ **Discovery**: 80%+ new URLs, 90%+ categorized
- ✅ **Requirements**: 10+ avg/page, 70%+ high confidence, 80%+ LLM
- ✅ **Patterns**: Patterns learned, 60%+ success rate
- ✅ **Reco**: 100% programs ready, 80%+ LLM requirements

### Current vs Target:
| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Pages | 4 | 50+ | ⚠️ |
| Requirements/page | ~27.5 | 10+ | ✅ |
| LLM extraction | 6.4% | 80%+ | ❌ |
| Categories | 17 | 20+ | ⚠️ |
| High confidence | ~86% | 70%+ | ✅ |
| Funding types | 75% | 90%+ | ⚠️ |

---

## 🚀 Next Steps

1. **Run test cycles** to establish baseline
2. **Identify gaps** from test results
3. **Prioritize improvements** (High → Medium → Low)
4. **Implement improvements** one by one
5. **Re-test** after each improvement
6. **Document results** and iterate

