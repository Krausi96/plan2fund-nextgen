# 🎯 How to Implement LLM Extraction

## Quick Answer: Where to Integrate

Based on your codebase structure, here are the **3 main integration points**:

### 1. **Scraper-Lite** (Primary Integration) ✅ Recommended

**File:** `scraper-lite/src/scraper.ts`

**Location:** Around line 1307-1308 where `extractAllRequirements` is called

**Change:**
```typescript
// OLD (line ~1307):
const { extractAllRequirements } = require('./extract');
partialRequirements = await extractAllRequirements(text, fetchResult.html, job.url);

// NEW:
import { extractHybrid } from './llm-extract';
const result = await extractHybrid(fetchResult.html, job.url, meta.title, meta.description);
partialRequirements = result.categorized_requirements;
```

### 2. **API Endpoint** (For Web App Integration)

**File:** Create `pages/api/scraper/extract.ts`

**Use Case:** When the web app needs to extract data from a URL

**Code:** See `INTEGRATION_EXAMPLES.md` - Option 3

### 3. **Library Feature** (For Program Library)

**File:** `features/library/extractor/llm-extractor.ts` (create new)

**Use Case:** When users browse the program library and need extraction

**Code:** See `INTEGRATION_EXAMPLES.md` - Option 4

---

## Step-by-Step Implementation

### Step 1: Set Up API Key (2 minutes)

Add to `.env.local`:
```bash
OPENAI_API_KEY=sk-your-api-key-here
EXTRACTION_MODE=hybrid
```

### Step 2: Choose Integration Point

**For scraper-lite (recommended):**
- Modify `scraper-lite/src/scraper.ts`
- See `INTEGRATION_EXAMPLES.md` - Option 1

**For web app API:**
- Create `pages/api/scraper/extract.ts`
- See `INTEGRATION_EXAMPLES.md` - Option 3

**For library feature:**
- Create `features/library/extractor/llm-extractor.ts`
- See `INTEGRATION_EXAMPLES.md` - Option 4

### Step 3: Test

Run a test batch:
```bash
cd scraper-lite
node scripts/manual/clean-and-run-35-batch.js
```

Check the output - you should see:
- ✅ More categories extracted (35 instead of 2-7)
- ✅ Higher coverage (100% instead of 35.7%)
- ⚠️ Slightly slower (~5-10s per page instead of 2-3s)

### Step 4: Monitor

Track:
- **Coverage:** Should be ~100% for all categories
- **Cost:** ~$0.005/page in hybrid mode
- **Quality:** Check meaningfulness scores

---

## Files Created

1. ✅ `scraper-lite/src/llm-extract.ts` - LLM extraction service
2. ✅ `scraper-lite/src/scraper-llm.ts` - Scraper integration wrapper
3. ✅ `scraper-lite/LLM_IMPLEMENTATION_GUIDE.md` - Full guide
4. ✅ `scraper-lite/INTEGRATION_EXAMPLES.md` - Code examples

## Architecture Overview

```
Your Codebase:
├── pages/api/ai/openai.ts          ✅ Already exists (OpenAI integration)
├── features/editor/engine/aiHelper.ts  ✅ Already exists (AI helper)
└── scraper-lite/
    ├── src/
    │   ├── extract.ts               📝 Pattern-based (current)
    │   ├── scraper.ts               📝 Scraper orchestration
    │   ├── llm-extract.ts           🆕 LLM extraction service
    │   └── scraper-llm.ts           🆕 Integration wrapper
    └── scripts/manual/
        └── clean-and-run-35-batch.js  📝 Test script
```

## Integration with Existing Components

### ✅ OpenAI Integration (Already Exists)

Your existing `pages/api/ai/openai.ts` is used by:
- `features/editor/engine/aiHelper.ts` - For editor AI features

**New LLM extraction** uses the same OpenAI client but for a different purpose:
- **Editor AI:** Generates content for business plans
- **LLM Extraction:** Extracts structured data from funding program pages

### ✅ Reco System

The `features/reco/` system can use extracted data:
- LLM extraction → Database → Reco system → Recommendations

### ✅ Editor System

The `features/editor/` system uses extracted requirements:
- LLM extraction → Requirements → Editor sections → User fills out

### ✅ Library System

The `features/library/` can display extracted programs:
- LLM extraction → Database → Library display → User browses

---

## Cost & Performance

### Current State (Pattern-Based)
- **Coverage:** 35.7% average
- **Missing:** 42.9% of categories
- **Cost:** $0/page
- **Speed:** ~2-3s/page

### With LLM (Hybrid Mode - Recommended)
- **Coverage:** ~100% (all categories)
- **Missing:** 0% of categories
- **Cost:** ~$0.005/page (hybrid) or ~$0.01/page (full LLM)
- **Speed:** ~5-10s/page (full LLM) or ~3-5s/page (hybrid)

### Cost Example
- **1,000 pages/month:** $5-10/month (hybrid) or $10-50/month (full LLM)
- **10,000 pages/month:** $50-100/month (hybrid) or $100-500/month (full LLM)

---

## Quick Start Checklist

- [ ] Set `OPENAI_API_KEY` in `.env.local`
- [ ] Set `EXTRACTION_MODE=hybrid` in `.env.local`
- [ ] Choose integration point (scraper.ts recommended)
- [ ] Add import: `import { extractHybrid } from './llm-extract';`
- [ ] Replace extraction call (see `INTEGRATION_EXAMPLES.md`)
- [ ] Test with 5-10 pages
- [ ] Monitor costs and quality
- [ ] Adjust mode if needed

---

## Questions?

**Q: Which integration point should I use?**
A: Start with `scraper-lite/src/scraper.ts` - it's the main entry point for scraping.

**Q: What's the difference between 'llm', 'hybrid', and 'pattern' modes?**
A: 
- `llm`: Full LLM extraction (100% coverage, slower, more expensive)
- `hybrid`: Pattern-based for high-coverage categories, LLM for missing (best balance)
- `pattern`: Pattern-based only (current system, fast, free, but missing 42.9% of categories)

**Q: Will this break existing functionality?**
A: No - it includes automatic fallback to pattern-based extraction if LLM fails.

**Q: How do I test without API costs?**
A: Don't set `OPENAI_API_KEY` - it will automatically use pattern-based extraction.

**Q: Can I use this in the editor/library features?**
A: Yes - see `INTEGRATION_EXAMPLES.md` for API and library integration.

---

## Next Steps

1. **Read:** `LLM_IMPLEMENTATION_GUIDE.md` for full details
2. **Review:** `INTEGRATION_EXAMPLES.md` for code examples
3. **Implement:** Choose integration point and make changes
4. **Test:** Run a small batch (5-10 pages)
5. **Monitor:** Check coverage, quality, and costs
6. **Optimize:** Adjust mode and thresholds as needed

---

**Ready to implement?** Start with Step 1 (set API key) and Step 2 (choose integration point)!

