# 🚀 LLM Implementation Guide

## Overview

This guide shows how to implement LLM-based extraction in your scraper-lite system, integrating with your existing codebase architecture.

## Architecture Integration

### Current Structure

```
plan2fund-nextgen/
├── pages/api/ai/
│   └── openai.ts          # ✅ Existing OpenAI integration
├── features/
│   ├── editor/engine/
│   │   └── aiHelper.ts    # ✅ Existing AI helper
│   └── library/
│       └── extractor/     # Library extraction
├── scraper-lite/
│   ├── src/
│   │   ├── extract.ts     # Pattern-based extraction
│   │   ├── scraper.ts     # Scraper orchestration
│   │   ├── llm-extract.ts # 🆕 LLM extraction service
│   │   └── scraper-llm.ts # 🆕 LLM scraper integration
│   └── scripts/
│       └── manual/
└── shared/lib/            # Shared utilities
```

## Implementation Steps

### Step 1: Install Dependencies (Already Done ✅)

OpenAI is already in `package.json`:
```json
{
  "dependencies": {
    "openai": "^6.4.0"
  }
}
```

### Step 2: Set Environment Variable

Add to `.env.local` (or your deployment environment):

```bash
OPENAI_API_KEY=sk-your-api-key-here
EXTRACTION_MODE=hybrid  # Options: 'llm', 'hybrid', 'pattern'
```

### Step 3: Use LLM Extraction in Scraper

#### Option A: Replace Pattern-Based Extraction

Modify `scraper-lite/src/scraper.ts`:

```typescript
import { scrapeWithLLM, getExtractionMode } from './scraper-llm';

// In your scrape function:
const mode = getExtractionMode();
const page = await scrapeWithLLM({
  mode,
  url: pageUrl,
  html: htmlContent,
  title: extractedTitle,
  description: extractedDescription
});
```

#### Option B: Hybrid Approach (Recommended)

Use hybrid mode which:
- Uses pattern-based extraction for high-coverage categories (`financial`, `innovation_focus`)
- Uses LLM for missing categories (42.9% currently missing)

```typescript
import { extractHybrid } from './llm-extract';

const result = await extractHybrid(html, url, title, description);
// result contains all 35 categories
```

### Step 4: Integration Points

#### A. Direct Integration in `scraper.ts`

Replace the extraction call:

```typescript
// OLD:
const categorized = await extractAllRequirements(text, url);
const meta = extractMeta($, html, url);

// NEW:
import { extractHybrid } from './llm-extract';
const result = await extractHybrid(html, url, title, description);
const categorized = result.categorized_requirements;
const meta = result.metadata;
```

#### B. API Endpoint Integration

Create a new API endpoint `pages/api/scraper/extract-llm.ts`:

```typescript
import { NextApiRequest, NextApiResponse } from 'next';
import { extractWithLLM } from '../../scraper-lite/src/llm-extract';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { html, url, title, description } = req.body;

  try {
    const result = await extractWithLLM({ html, url, title, description });
    res.status(200).json(result);
  } catch (error) {
    console.error('LLM extraction error:', error);
    res.status(500).json({ error: 'Extraction failed' });
  }
}
```

#### C. Library Integration

If you want to use LLM extraction in the library feature:

```typescript
// features/library/extractor/llm-extractor.ts
import { extractWithLLM } from '@/scraper-lite/src/llm-extract';

export async function extractProgramData(html: string, url: string) {
  return await extractWithLLM({ html, url });
}
```

## Configuration Options

### Extraction Modes

1. **`llm`** - Full LLM extraction
   - ✅ Extracts all 35 categories
   - ✅ High quality, semantic understanding
   - ❌ Slower (~5-10s per page)
   - ❌ Cost: ~$0.01/page

2. **`hybrid`** - Best of both worlds (Recommended)
   - ✅ Fast for high-coverage categories (pattern-based)
   - ✅ Complete coverage (LLM fills gaps)
   - ✅ Cost-effective (~$0.005/page average)
   - ✅ Best quality

3. **`pattern`** - Pattern-based only
   - ✅ Fast (~2-3s per page)
   - ✅ No API costs
   - ❌ Missing 42.9% of categories
   - ❌ Only 35.7% average coverage

### Environment Variables

```bash
# Required
OPENAI_API_KEY=sk-...

# Optional
EXTRACTION_MODE=hybrid  # Default: 'hybrid'
OPENAI_MODEL=gpt-4o-mini  # Default: 'gpt-4o-mini'
OPENAI_MAX_TOKENS=4000    # Default: 4000
OPENAI_TEMPERATURE=0.3     # Default: 0.3
```

## Cost Analysis

### Per Page Costs

- **GPT-4o-mini**: ~$0.001-0.01/page (depending on content size)
- **GPT-4o**: ~$0.01-0.05/page

### Monthly Costs (1,000 pages)

- **Full LLM**: $10-50/month
- **Hybrid**: $5-25/month (average)
- **Pattern**: $0/month

### Cost Optimization

1. **Use Hybrid Mode**: Only use LLM for missing categories
2. **Cache Results**: Don't re-extract unchanged pages
3. **Batch Processing**: Process multiple pages in parallel
4. **Use GPT-4o-mini**: Cost-effective for most use cases

## Testing

### Test LLM Extraction

```typescript
// scripts/manual/test-llm-extraction.js
const { extractWithLLM } = require('../src/llm-extract');
const fs = require('fs');

const html = fs.readFileSync('test-page.html', 'utf8');
const result = await extractWithLLM({
  html,
  url: 'https://example.com/program',
  title: 'Test Program',
  description: 'Test description'
});

console.log('Extracted categories:', Object.keys(result.categorized_requirements));
console.log('Metadata:', result.metadata);
```

### Compare with Pattern-Based

```typescript
// scripts/manual/compare-extraction.js
const { extractWithLLM } = require('../src/llm-extract');
const { extractAllRequirements } = require('../src/extract');

// Test both
const llmResult = await extractWithLLM({ html, url });
const patternResult = await extractAllRequirements(text, url);

// Compare coverage
const llmCategories = Object.keys(llmResult.categorized_requirements);
const patternCategories = Object.keys(patternResult);

console.log('LLM categories:', llmCategories.length);
console.log('Pattern categories:', patternCategories.length);
console.log('Missing in pattern:', llmCategories.filter(c => !patternCategories.includes(c)));
```

## Migration Strategy

### Phase 1: Test LLM Extraction (Week 1)
1. Set up API key
2. Test on 10-20 pages
3. Compare results with pattern-based
4. Measure cost and quality

### Phase 2: Hybrid Mode (Week 2)
1. Implement hybrid extraction
2. Run on 100 pages
3. Monitor costs
4. Adjust thresholds

### Phase 3: Full Migration (Week 3-4)
1. Switch to LLM for all new pages
2. Keep pattern-based as fallback
3. Monitor and optimize

## Error Handling

The LLM extraction includes automatic fallback:

```typescript
try {
  return await extractWithLLM({ html, url });
} catch (error) {
  // Automatic fallback to pattern-based
  console.warn('LLM failed, using pattern-based extraction');
  return await extractAllRequirements(text, url);
}
```

## Performance Considerations

### Speed
- **Pattern-based**: ~2-3s per page
- **LLM**: ~5-10s per page (API latency)
- **Hybrid**: ~3-5s per page (average)

### Rate Limits
- OpenAI: 500 requests/minute (default)
- Implement retry logic with exponential backoff
- Batch processing with delays

### Caching
- Cache LLM results for unchanged pages
- Use page hash or last-modified date
- Store in database with `extraction_method` field

## Monitoring

### Metrics to Track
1. **Coverage**: % of categories extracted
2. **Quality**: Meaningfulness scores
3. **Cost**: API costs per page
4. **Speed**: Extraction time
5. **Error Rate**: Failed extractions

### Logging

```typescript
console.log(`📊 LLM Extraction: ${Object.keys(result.categorized_requirements).length} categories`);
console.log(`💰 Cost: ~$${estimatedCost.toFixed(4)}`);
console.log(`⏱️  Time: ${elapsedTime}ms`);
```

## Next Steps

1. ✅ **Review the code**: `scraper-lite/src/llm-extract.ts`
2. ✅ **Set up API key**: Add to `.env.local`
3. ✅ **Test extraction**: Run test script
4. ✅ **Integrate**: Choose integration point (scraper.ts, API, or library)
5. ✅ **Monitor**: Track costs and quality
6. ✅ **Optimize**: Adjust mode and thresholds

## Questions?

- **Cost concerns?** Use hybrid mode
- **Speed concerns?** Use pattern-based for high-coverage categories
- **Quality concerns?** Use full LLM mode
- **Both?** Use hybrid mode (recommended)

---

**Ready to implement?** Start with Step 2 (set API key) and Step 3 (integrate into scraper).

