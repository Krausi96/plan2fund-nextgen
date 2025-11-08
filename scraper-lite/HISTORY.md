# Scraper Development History

## Key Milestones

### 1. Initial Implementation
- Basic scraping functionality
- LLM-based extraction
- Database storage

### 2. Learning System Integration
- Classification feedback tracking
- URL pattern learning
- Quality pattern learning
- Requirement pattern learning

### 3. File Organization (2024)
- Organized files into logical folders (`core/`, `learning/`, `utils/`, `rescraping/`)
- Consolidated database operations into `db/db.ts`
- Moved configuration to `config/`

### 4. Learning Files Merge (2024)
**Decision**: Merged 4 learning files into one unified module
- `classification-feedback.ts` → Merged into `auto-learning.ts`
- `learn-quality-patterns.ts` → Merged into `auto-learning.ts`
- `learn-requirement-patterns.ts` → Merged into `auto-learning.ts`
- `auto-learning.ts` → Enhanced with all functions

**Result**: 
- Before: 4 separate files
- After: 1 unified file (`auto-learning.ts`)
- All 19 functions preserved

### 5. Automatic Integration (2024)
**Decision**: Integrate all automation into main flow
- Re-scraping integrated into scraping phase
- Blacklist re-check integrated into scraping phase
- All learning happens automatically

**Result**: Fully autonomous system - just run the main command

## Key Improvements

### Funding Types Normalization
**Problem**: 6 funding types in config but not in database
- `wage-subsidy`, `leasing`, `crowdfunding`, `visa_application`, `equity_crowdfunding`, `convertible_loan`

**Solution**: Added all missing types to `CANONICAL_FUNDING_TYPES` in `funding-types.ts`
- Added to canonical list
- Added mapping variations
- Now all 13 types from institutionConfig are supported

### Category Name Normalization
**Problem**: Duplicate categories due to case sensitivity
- `eligibility` (642) vs `Eligibility` (247)
- `geographic` (181) vs `Geographic` (73)
- And 8 more duplicates

**Solution**: Normalized all categories to lowercase
- Updated 1,030 requirements
- Merged duplicate categories
- Now all categories are lowercase

### Requirement Pattern Learning
**Problem**: Generic values and duplicates in requirements
- Values like "SME", "all", "none specified" not filtered
- Duplicate requirements with different wording

**Solution**: Automatic requirement pattern learning
- Learns generic values to filter
- Learns duplicate patterns to deduplicate
- Runs every 100 pages automatically
- Applied automatically during extraction

### Career/Job Page Exclusion
**Problem**: Career/job pages being scraped (not funding programs)
- Pages like `/karriere/`, `/career/`, `/jobs/` included

**Solution**: Added hardcoded exclusion patterns
- Added regex patterns for career/job pages
- Integrated into blacklist system
- Prevents scraping of non-funding pages

## Architecture Evolution

### Before Organization
- Files scattered in root directory
- Database operations in multiple files
- Learning logic split across 4 files

### After Organization
- Logical folder structure (`core/`, `learning/`, `utils/`, `rescraping/`)
- Unified database layer (`db/db.ts`)
- Unified learning module (`auto-learning.ts`)
- Clear separation of concerns

## Performance Improvements

### Caching
- LLM response caching added
- Reduces API calls
- Improves speed

### Parallel Processing
- Increased from 5 to 8 concurrent scrapes
- Configurable via `SCRAPER_CONCURRENCY`

### Batch Classification
- Classifies multiple URLs at once
- Reduces LLM API calls

## Current Status

- **Pages**: 377+ scraped
- **Requirements**: 3,843+ extracted
- **Classification Accuracy**: 69.1% (340 classifications)
- **URL Patterns**: 217 learned
- **Requirement Patterns**: 17 categories learned
- **Quality Rules**: 0 (need 50+ pages per type)

## Lessons Learned

1. **Unified modules are better** - Merging learning files improved maintainability
2. **Automatic is better** - Integrating everything into main flow reduces manual work
3. **Database-backed learning** - Persistent patterns survive restarts
4. **LLM-first approach** - More accurate than rule-based, learns from mistakes
5. **Feedback loops work** - Classification accuracy improves over time

## Future Considerations

- More sophisticated requirement deduplication
- Multi-language support
- Advanced filter exploration
- Login handling for protected pages
- Manual page flagging for re-scraping

