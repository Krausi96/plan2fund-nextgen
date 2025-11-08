# Scraper Architecture

## Overview

The scraper is a fully autonomous system that discovers, scrapes, and learns from funding program pages. It uses LLM-based classification and extraction, with automatic learning and feedback integration.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    unified-scraper.ts                       │
│              (Main Orchestrator)                           │
└──────────────┬──────────────────────────────────────────────┘
               │
       ┌───────┴────────┐
       │                │
   ┌───▼───┐      ┌─────▼─────┐
   │Discover│      │  Scrape   │
   └───┬───┘      └─────┬─────┘
       │                │
       │                ├──► Extract Requirements
       │                ├──► Record Feedback
       │                ├──► Learn URL Patterns
       │                └──► Auto-Learning (every 100 pages)
       │
       └──► Classify URLs (with improved prompts)
```

## Core Components

### 1. Discovery System (`unified-scraper.ts`)

**Purpose**: Find new funding program URLs

**Flow**:
1. Get seed URLs from `institutionConfig.ts`
2. Check existing pages in database
3. Re-check overview pages (7+ days old)
4. Fetch HTML from seed URLs
5. Extract links from pages
6. Classify links with LLM (using improved prompts)
7. Queue high-quality program pages

**Key Features**:
- Smart discovery (finds URLs with different funding types)
- Overview page detection and re-checking
- LLM-based classification with feedback integration
- Automatic blacklist filtering

### 2. Scraping System (`unified-scraper.ts`)

**Purpose**: Extract requirements and metadata from pages

**Flow**:
1. Get queued URLs
2. Fetch HTML from URLs
3. Extract requirements with LLM
4. Apply learned requirement patterns (filter generic, deduplicate)
5. Normalize funding types, dates, metadata
6. Save to database
7. Record classification feedback
8. Learn URL patterns

**Key Features**:
- Parallel processing (8 concurrent by default)
- LLM-based extraction with caching
- Automatic requirement filtering and deduplication
- Classification feedback recording

### 3. Learning System (`src/learning/auto-learning.ts`)

**Unified learning module** - All learning functionality in one file (merged from 4 files).

#### Classification Feedback
- `recordClassificationFeedback()` - Records feedback after scraping
- `getClassificationAccuracy()` - Gets accuracy statistics
- `getCommonMistakes()` - Gets common mistakes for prompt improvement

#### Quality Pattern Learning
- `analyzeFundingType()` - Analyzes examples per funding type
- `learnAllPatterns()` - Learns patterns for all funding types
- `getStoredQualityRules()` - Gets stored quality rules

#### Requirement Pattern Learning
- `learnRequirementPatterns()` - Learns requirement patterns
- `getStoredRequirementPatterns()` - Gets stored patterns
- `autoLearnRequirementPatterns()` - Auto-learns requirement patterns

#### Auto-Learning Orchestration
- `shouldLearnQualityPatterns()` - Check if it's time to learn (every 100 pages)
- `autoLearnQualityPatterns()` - Trigger auto-learning
- `getImprovedClassificationPrompt()` - Generate improved prompts
- `getLearningStatus()` - Report learning status

**Automatic Integration**:
- Runs every 100 new pages
- Learns from classification feedback
- Improves prompts automatically
- Filters generic requirements automatically
- Deduplicates requirements automatically

### 4. Re-Scraping System (`src/rescraping/unified-rescraping.ts`)

**Purpose**: Re-scrape overview pages and low-confidence blacklisted URLs

**Tasks**:
- Overview pages (older than 7 days)
- Low-confidence blacklisted URLs (might be false positives)
- Manually flagged pages (future feature)

**Automatic Integration**:
- Runs after scraping phase
- Processes up to 3 tasks per cycle
- Integrated into `unified-scraper.ts`

### 5. Blacklist System (`src/utils/blacklist.ts`)

**Purpose**: Exclude unwanted URLs

**Components**:
- Hardcoded patterns (career pages, contact pages, etc.)
- Database-backed patterns (learned from scraping)
- Re-check system for low-confidence exclusions

**Automatic Integration**:
- Runs every 7 days
- Re-checks low-confidence exclusions
- Prevents false positives

## Data Flow

```
Seed URLs (institutionConfig.ts)
    ↓
Discovery (unified-scraper.ts)
    ↓
LLM Classification (llm-discovery.ts)
    ├─ Uses improved prompts (from learning system)
    └─ Records feedback
    ↓
Queue URLs (scraping_jobs table)
    ↓
Scraping (unified-scraper.ts)
    ├─ LLM Extraction (llm-extract.ts)
    ├─ Apply learned patterns (auto-learning.ts)
    └─ Save to database (db.ts)
    ↓
Learning (auto-learning.ts)
    ├─ Record feedback
    ├─ Learn URL patterns
    ├─ Learn quality patterns (every 100 pages)
    └─ Learn requirement patterns (every 100 pages)
    ↓
Feedback Integration
    ├─ Generate improved prompts
    └─ Use in next discovery cycle
```

## Database Schema

### Core Tables
- `pages` - Scraped pages
- `requirements` - Extracted requirements
- `scraping_jobs` - Scraping queue

### Learning Tables
- `url_patterns` - Learned URL patterns
- `classification_feedback` - Classification feedback
- `quality_rules` - Learned quality rules
- `requirement_patterns` - Learned requirement patterns

## File Organization

### `src/core/` - Core LLM Functionality
- `llm-discovery.ts` - URL classification
- `llm-extract.ts` - Requirement extraction
- `llmCache.ts` - LLM response caching

### `src/learning/` - Learning System
- `auto-learning.ts` - Unified learning module (all learning functionality)

### `src/rescraping/` - Re-Scraping
- `unified-rescraping.ts` - Re-scraping system

### `src/utils/` - Utilities
- `blacklist.ts` - URL blacklisting
- `blacklist-recheck.ts` - Blacklist re-check
- `funding-types.ts` - Funding type normalization
- `date.ts` - Date normalization
- `login.ts` - Login detection
- `overview-filters.ts` - Overview page detection

### `src/config/` - Configuration
- `config.ts` - Runtime configuration
- `institutionConfig.ts` - Institution definitions

### `db/` - Database Layer
- `db.ts` - All database operations

## Key Design Decisions

### 1. Unified Learning Module
**Decision**: Merged 4 learning files into one (`auto-learning.ts`)
**Reason**: Better cohesion, easier maintenance, all learning logic in one place
**Result**: 19 functions + 4 interfaces in one file

### 2. Automatic Integration
**Decision**: All learning, feedback, and re-scraping happens automatically
**Reason**: Fully autonomous system, no manual intervention needed
**Result**: Just run the main command and everything happens automatically

### 3. LLM-First Approach
**Decision**: Use LLM for classification and extraction
**Reason**: More accurate than rule-based, learns from mistakes
**Result**: 69% classification accuracy, improving over time

### 4. Database-Backed Learning
**Decision**: Store all learned patterns in database
**Reason**: Persistent learning, survives restarts
**Result**: Patterns applied automatically, improves over time

## Performance

- **Parallel Processing**: 8 concurrent scrapes (configurable)
- **Caching**: LLM responses cached to reduce API calls
- **Batch Classification**: Classifies multiple URLs at once
- **Smart Discovery**: Skips already-seen URLs

## Extensibility

### Adding New Institutions
1. Add entry to `institutionConfig.ts`
2. Run discovery: `npm run scraper:unified -- discover --max=10`

### Adding New Funding Types
1. Add to `CANONICAL_FUNDING_TYPES` in `funding-types.ts`
2. Add mappings in `FUNDING_TYPE_MAP`
3. Re-normalize: `npm run normalize:funding-types`

### Custom Learning Rules
1. Modify `auto-learning.ts`
2. Add new learning functions
3. Integrate into auto-learning cycle

## Future Enhancements

- Manual page flagging for re-scraping
- More sophisticated requirement deduplication
- Multi-language support
- Advanced filter exploration on overview pages
- Login handling for protected pages

