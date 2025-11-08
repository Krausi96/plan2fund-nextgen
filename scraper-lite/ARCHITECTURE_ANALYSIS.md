# Architecture Analysis - Learning/Core/Rescraping/Utils

## Current Structure

### 📁 `src/learning/` (4 files)
1. **`auto-learning.ts`** - Orchestrates learning
   - `shouldLearnQualityPatterns()` - Checks if it's time to learn (every 100 pages)
   - `autoLearnQualityPatterns()` - Triggers quality + requirement pattern learning
   - `getLearningStatus()` - Reports learning status
   - `getImprovedClassificationPrompt()` - Generates improved prompts

2. **`classification-feedback.ts`** - Tracks classification accuracy
   - `recordClassificationFeedback()` - Records feedback after scraping
   - `getClassificationAccuracy()` - Gets accuracy stats
   - `getCommonMistakes()` - Gets common mistakes

3. **`learn-quality-patterns.ts`** - Learns quality patterns for funding types
   - `analyzeFundingType()` - Analyzes examples per funding type
   - `learnAllPatterns()` - Learns patterns for all funding types
   - Stores in `quality_rules` table

4. **`learn-requirement-patterns.ts`** - Learns requirement patterns
   - `learnRequirementPatterns()` - Learns generic values, duplicates
   - `autoLearnRequirementPatterns()` - Auto-learns (called by auto-learning.ts)
   - Stores in `requirement_patterns` table

### 📁 `src/core/` (3 files)
1. **`llm-discovery.ts`** - URL classification
   - `classifyUrl()` - Classifies single URL
   - `batchClassifyUrls()` - Batch classification
   - Uses LLM to determine if URL is a program page

2. **`llm-extract.ts`** - Requirement extraction
   - `extractWithLLM()` - Extracts requirements from HTML
   - Main extraction logic

3. **`llmCache.ts`** - Caching
   - `getCachedExtraction()` - Gets cached extraction
   - `storeCachedExtraction()` - Stores extraction
   - `computeUrlHash()` - Computes URL hash

### 📁 `src/rescraping/` (1 file)
1. **`unified-rescraping.ts`** - Re-scraping logic
   - `getReScrapeTasks()` - Gets tasks (overview pages, blacklisted URLs)
   - `getReScrapeStats()` - Gets stats
   - `markReScrapeCompleted()` - Marks task as done
   - **NOT INTEGRATED** into main cycle

### 📁 `src/utils/` (6 files)
1. **`blacklist.ts`** - URL exclusion
   - `isUrlExcluded()` - Checks if URL is excluded
   - Hardcoded + database patterns

2. **`blacklist-recheck.ts`** - Re-check blacklisted URLs
   - `runRecheckCycle()` - Re-checks low-confidence exclusions
   - **NOT INTEGRATED** into main cycle

3. **`date.ts`** - Date normalization
4. **`funding-types.ts`** - Funding type normalization
5. **`login.ts`** - Login detection
6. **`overview-filters.ts`** - Overview page filter extraction

## Current Integration Status

### ✅ Integrated
- **Learning**: Called after scraping (line 667-676 in unified-scraper.ts)
- **Core**: Used during discovery and scraping
- **Utils**: Used throughout (blacklist, funding types, etc.)

### ❌ NOT Integrated
- **Re-scraping**: `getReScrapeTasks()` exists but never called automatically
- **Blacklist re-check**: `runRecheckCycle()` exists but never called automatically

## Analysis: What to Merge vs Keep Separate

### 🔄 **MERGE CANDIDATES**

#### 1. **Merge `blacklist-recheck.ts` into `rescraping/unified-rescraping.ts`**
**Reason**: Both handle re-checking URLs
- `blacklist-recheck.ts` re-checks blacklisted URLs
- `unified-rescraping.ts` already handles blacklisted URLs in `getReScrapeTasks()`
- **Action**: Move `runRecheckCycle()` into `unified-rescraping.ts` as a task type

#### 2. **Merge `classification-feedback.ts` into `auto-learning.ts`**
**Reason**: Both are learning-related
- `classification-feedback.ts` is only used by `auto-learning.ts`
- Small file (87 lines), tightly coupled
- **Action**: Move functions into `auto-learning.ts`

#### 3. **Merge `learn-quality-patterns.ts` and `learn-requirement-patterns.ts` into `auto-learning.ts`**
**Reason**: All learning logic should be in one place
- `auto-learning.ts` already orchestrates both
- Would simplify imports and structure
- **Action**: Move learning functions into `auto-learning.ts` as internal functions

### ✅ **KEEP SEPARATE**

#### 1. **Keep `core/` separate**
**Reason**: Core LLM operations are used independently
- `llm-discovery.ts` - Used in discovery phase
- `llm-extract.ts` - Used in scraping phase
- `llmCache.ts` - Used by both
- **Keep**: These are foundational, not orchestration

#### 2. **Keep `utils/` separate**
**Reason**: Pure utility functions, no orchestration
- `blacklist.ts` - Used everywhere
- `date.ts`, `funding-types.ts` - Pure functions
- `login.ts`, `overview-filters.ts` - Feature-specific utilities
- **Keep**: Utilities should remain independent

#### 3. **Keep `rescraping/` separate (but integrate it)**
**Reason**: Re-scraping is a distinct phase
- Has its own logic and priorities
- Should be called automatically but kept as separate module
- **Action**: Integrate into main cycle, but keep file separate

## Proposed Structure

### After Merging:

```
src/
├── core/                    # ✅ KEEP (LLM operations)
│   ├── llm-discovery.ts
│   ├── llm-extract.ts
│   └── llmCache.ts
│
├── learning/                # 🔄 MERGE into one file
│   └── auto-learning.ts     # Contains ALL learning logic
│       - shouldLearnQualityPatterns()
│       - autoLearnQualityPatterns()
│       - learnQualityPatterns()      # Moved from learn-quality-patterns.ts
│       - learnRequirementPatterns()  # Moved from learn-requirement-patterns.ts
│       - recordClassificationFeedback()  # Moved from classification-feedback.ts
│       - getClassificationAccuracy()
│       - getCommonMistakes()
│       - getLearningStatus()
│
├── rescraping/              # ✅ KEEP (but integrate)
│   └── unified-rescraping.ts
│       - getReScrapeTasks()
│       - runRecheckCycle()  # Moved from blacklist-recheck.ts
│       - markReScrapeCompleted()
│
└── utils/                   # ✅ KEEP (pure utilities)
    ├── blacklist.ts
    ├── date.ts
    ├── funding-types.ts
    ├── login.ts
    └── overview-filters.ts
```

## Integration Improvements

### 1. **Auto-Integrate Re-Scraping**
**Current**: Re-scraping tasks exist but never called
**Proposed**: Add to main cycle after scraping:

```typescript
// After scraping phase
const reScrapeTasks = await getReScrapeTasks(7, 30, 10);
if (reScrapeTasks.length > 0) {
  console.log(`🔄 Found ${reScrapeTasks.length} re-scrape tasks...`);
  // Process re-scrape tasks
}
```

### 2. **Auto-Integrate Blacklist Re-Check**
**Current**: `runRecheckCycle()` exists but never called
**Proposed**: Add to re-scraping or as separate phase:

```typescript
// After learning phase
if (shouldRecheckBlacklist()) {
  await runRecheckCycle();
}
```

### 3. **Unified Learning Module**
**Current**: 4 separate learning files
**Proposed**: One `auto-learning.ts` with all learning logic

## Benefits of Merging

1. **Simpler imports**: One import instead of 4
2. **Easier to understand**: All learning logic in one place
3. **Better cohesion**: Related functions together
4. **Less file navigation**: Fewer files to jump between

## Benefits of Keeping Separate

1. **Core/Utils**: Pure functions, no side effects, easy to test
2. **Rescraping**: Distinct phase, clear separation of concerns
3. **Modularity**: Can be used independently

## Recommendation

### ✅ **MERGE**:
- `classification-feedback.ts` → `auto-learning.ts`
- `learn-quality-patterns.ts` → `auto-learning.ts`
- `learn-requirement-patterns.ts` → `auto-learning.ts`
- `blacklist-recheck.ts` → `rescraping/unified-rescraping.ts`

### ✅ **KEEP SEPARATE**:
- `core/` - Foundational LLM operations
- `utils/` - Pure utility functions
- `rescraping/` - But integrate into main cycle

### ✅ **INTEGRATE**:
- Call `getReScrapeTasks()` automatically after scraping
- Call `runRecheckCycle()` automatically (weekly or after N pages)

