# Recommendation Engine (reco)

## Overview

The recommendation engine provides program matching and scoring functionality for funding programs.

## Architecture

### Source of Truth

**Primary**: NEON PostgreSQL Database
- Tables: `pages` (program metadata) and `requirements` (categorized requirements)
- Accessed via `shared/lib/database.ts`
- Functions: `getAllPages()`, `searchPages()`, `savePageWithRequirements()`

**Fallback**: JSON Files
- `scraper-lite/data/legacy/scraped-programs-latest.json` (if exists)
- `data/migrated-programs.json` (if exists)
- Used only when database is unavailable

### Data Flow

```
Scraper Tool (separate) 
  → Extracts HTML/text using llmExtract.ts
  → Saves to database via savePageWithRequirements()
  → Web app reads from database via getAllPages()/searchPages()
  → Falls back to JSON if database unavailable
```

## Files

### Core Engine
- **`engine/recoEngine.ts`** - Unified recommendation engine
  - Normalization functions (location, company type, funding amount)
  - Matching logic (location, company type, funding amount)
  - Scoring engine (`scoreProgramsEnhanced()`)
  - Exports for backward compatibility

### Extraction (for scraper tools)
- **`engine/llmExtract.ts`** - LLM-based extraction from HTML/text
  - `extractWithLLM()` - Main extraction function
  - `extractHybrid()` - Alias for extractWithLLM (LLM-only, no pattern fallback)
  - Used by scraper tools to extract program data
  - Returns `LLMExtractionResponse` with categorized_requirements and metadata

### Prompts
- **`prompts/recommendPrompt.ts`** - LLM prompt builder for recommendations
  - `buildRecommendPrompt()` - Builds prompt for program recommendations

### Components
- **`components/ProgramFinder.tsx`** - UI component for program finding

## Usage

### Scoring Programs

```typescript
import { scoreProgramsEnhanced } from '@/features/reco/engine/recoEngine';

const scored = await scoreProgramsEnhanced(userAnswers, programs);
// Returns EnhancedProgramResult[] sorted by score
```

### Extracting from HTML (for scraper)

```typescript
import { extractWithLLM } from '@/features/reco/engine/llmExtract';

const result = await extractWithLLM({
  html: '<html>...</html>',
  url: 'https://example.com/program',
  title: 'Program Title',
  description: 'Program description'
});

// result.categorized_requirements - requirements by category
// result.metadata - funding amounts, deadlines, contact info, etc.
```

## Notes

- The scraper tool is a **separate service/tool** (not in this repo)
- The scraper uses `llmExtract.ts` to extract data from web pages
- The web app only reads already-extracted data from the database
- JSON fallback files are legacy and only used if database is unavailable

