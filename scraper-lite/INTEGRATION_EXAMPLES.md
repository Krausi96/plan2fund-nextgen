# 🔌 Integration Examples

## Quick Start: How to Use LLM Extraction

### Option 1: Simple Integration (Recommended)

Replace the extraction call in `scraper.ts`:

```typescript
// Find this in scraper.ts (around line 400-500):
const categorized = await extractAllRequirements(text, url);
const meta = extractMeta($, html, url);

// Replace with:
import { extractHybrid } from './llm-extract';
const result = await extractHybrid(html, url, title, description);
const categorized = result.categorized_requirements;
const meta = result.metadata;
```

### Option 2: Environment-Based Mode

Add to the top of `scraper.ts`:

```typescript
import { extractHybrid, extractWithLLM } from './llm-extract';
import { extractAllRequirements, extractMeta } from './extract';

// Get extraction mode from environment
const EXTRACTION_MODE = process.env.EXTRACTION_MODE || 'hybrid';

// In your scrape function:
let categorized, meta;

if (EXTRACTION_MODE === 'llm') {
  const result = await extractWithLLM({ html, url, title, description });
  categorized = result.categorized_requirements;
  meta = result.metadata;
} else if (EXTRACTION_MODE === 'hybrid') {
  const result = await extractHybrid(html, url, title, description);
  categorized = result.categorized_requirements;
  meta = result.metadata;
} else {
  // Pattern-based (default)
  categorized = await extractAllRequirements(text, url);
  meta = extractMeta($, html, url);
}
```

### Option 3: API Endpoint

Create `pages/api/scraper/extract.ts`:

```typescript
import { NextApiRequest, NextApiResponse } from 'next';
import { extractWithLLM, extractHybrid } from '../../../scraper-lite/src/llm-extract';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { html, url, title, description, mode = 'hybrid' } = req.body;

  try {
    let result;
    if (mode === 'llm') {
      result = await extractWithLLM({ html, url, title, description });
    } else {
      result = await extractHybrid(html, url, title, description);
    }
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Extraction error:', error);
    res.status(500).json({ 
      error: 'Extraction failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
```

### Option 4: Library Feature Integration

In `features/library/extractor/`:

```typescript
// llm-extractor.ts
import { extractWithLLM } from '@/scraper-lite/src/llm-extract';

export async function extractProgramWithLLM(
  html: string,
  url: string
) {
  return await extractWithLLM({ html, url });
}
```

## Complete Integration Example

Here's a complete example showing how to modify `scraper.ts`:

```typescript
// scraper-lite/src/scraper.ts

// Add imports at top
import { extractHybrid } from './llm-extract';
import { extractAllRequirements, extractMeta } from './extract';

// In your scrape function (find where extraction happens):
async function scrapePage(url: string, html: string): Promise<LitePage> {
  const $ = cheerio.load(html);
  const text = $('body').text();
  
  // Get extraction mode from environment
  const mode = process.env.EXTRACTION_MODE || 'hybrid';
  
  let categorized: Record<string, RequirementItem[]>;
  let meta: PageMetadata;
  
  if (mode === 'llm' || mode === 'hybrid') {
    // Use LLM extraction
    const title = $('title').text() || $('h1').first().text();
    const description = $('meta[name="description"]').attr('content') || 
                       $('meta[property="og:description"]').attr('content') || '';
    
    if (mode === 'llm') {
      const result = await extractWithLLM({ html, url, title, description });
      categorized = result.categorized_requirements;
      meta = result.metadata;
    } else {
      // Hybrid mode
      const result = await extractHybrid(html, url, title, description);
      categorized = result.categorized_requirements;
      meta = result.metadata;
    }
  } else {
    // Pattern-based (fallback)
    categorized = await extractAllRequirements(text, url);
    meta = extractMeta($, html, url);
  }
  
  // Rest of your scraping logic...
  // (quality assessment, saving, etc.)
}
```

## Testing Your Integration

### Test Script

Create `scripts/manual/test-llm-integration.js`:

```javascript
require('ts-node').register({ transpileOnly: true });
require('dotenv').config({ path: require('path').join(__dirname, '../../.env.local') });

const { extractHybrid } = require('../../scraper-lite/src/llm-extract');
const fs = require('fs');

async function test() {
  // Load test HTML
  const html = fs.readFileSync('test-page.html', 'utf8');
  
  // Test extraction
  const result = await extractHybrid(
    html,
    'https://example.com/program',
    'Test Program',
    'Test description'
  );
  
  console.log('✅ Extracted categories:', Object.keys(result.categorized_requirements).length);
  console.log('📊 Categories:', Object.keys(result.categorized_requirements));
  console.log('💰 Metadata:', result.metadata);
}

test().catch(console.error);
```

## Environment Setup

Add to `.env.local`:

```bash
# Required for LLM extraction
OPENAI_API_KEY=sk-your-api-key-here

# Optional: Choose extraction mode
EXTRACTION_MODE=hybrid  # Options: 'llm', 'hybrid', 'pattern'
```

## Cost Monitoring

Add cost tracking to your extraction:

```typescript
let extractionCost = 0;

if (mode === 'llm' || mode === 'hybrid') {
  // Estimate cost (GPT-4o-mini: ~$0.001-0.01 per page)
  const estimatedCost = mode === 'llm' ? 0.01 : 0.005;
  extractionCost = estimatedCost;
  
  console.log(`💰 Estimated cost: $${estimatedCost.toFixed(4)}`);
}
```

## Error Handling

The LLM extraction includes automatic fallback:

```typescript
try {
  const result = await extractHybrid(html, url, title, description);
  return result;
} catch (error) {
  console.error('LLM extraction failed:', error);
  console.warn('⚠️  Falling back to pattern-based extraction');
  
  // Automatic fallback
  const categorized = await extractAllRequirements(text, url);
  const meta = extractMeta($, html, url);
  return { categorized_requirements: categorized, metadata: meta };
}
```

## Next Steps

1. ✅ **Set API key** in `.env.local`
2. ✅ **Choose integration option** (Option 1 is simplest)
3. ✅ **Test** with a few pages
4. ✅ **Monitor** costs and quality
5. ✅ **Adjust** mode if needed

---

**Ready?** Start with Option 1 - it's the simplest integration!

